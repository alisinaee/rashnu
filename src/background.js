importScripts("lib/logger.js", "lib/normalize.js", "lib/match.js");

(function () {
  "use strict";

  const CACHE_TTL_MS = 10 * 60 * 1000;
  const MATCH_ERROR_RETRY_INTERVAL_MS = 30 * 1000;
  const REQUEST_TIMEOUT_MS = 8000;
  const MAX_CONCURRENCY = 4;
  const MAX_LOG_ENTRIES = 500;
  const MAX_AUTO_RETRIES = 3;
  const LOG_STORAGE_KEY = "dirobLogs";
  const LOG_HELPER_BASE_URL = "http://127.0.0.1:45173";
  const LOG_FLUSH_BATCH_SIZE = 20;
  const NAVIGATION_RESCAN_DEBOUNCE_MS = 220;
  const TECHNOLIFE_BUILD_ID_TTL_MS = 30 * 60 * 1000;
  const QUERY_TRANSLATION_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
  const QUERY_TRANSLATION_FAILURE_CACHE_TTL_MS = 5 * 60 * 1000;
  const MARKETPLACE_PROXY_BASE_URL = "https://r.jina.ai/http://";
  const MARKETPLACE_QUERY_REPLACEMENTS = [
    [/(?:گوشی\s*موبایل|موبایل)/gu, "mobile phone"],
    [/گوشی/gu, "phone"],
    [/آیفون/gu, "iphone"],
    [/اپل/gu, "apple"],
    [/سامسونگ/gu, "samsung"],
    [/شیائومی/gu, "xiaomi"],
    [/(?:هواوی|هوآوی)/gu, "huawei"],
    [/اسپیکر/gu, "speaker"],
    [/بلوتوثی/gu, "bluetooth"],
    [/قابل\s*حمل/gu, "portable"],
    [/پرو\s*مکس/gu, "pro max"],
    [/پرو/gu, "pro"],
    [/مکس/gu, "max"],
    [/نات\s*اکتیو/gu, "not active"],
    [/اکتیو/gu, "active"],
    [/استوک/gu, "used"],
    [/دو\s*سیم(?:\s*کارت)?/gu, "dual sim"],
    [/تک\s*سیم(?:\s*کارت)?/gu, "single sim"],
    [/حافظه/gu, ""],
    [/گیگابایت/gu, "gb"],
    [/مدل/gu, "model"],
    [/نسخه/gu, "version"],
    [/مشکی/gu, "black"],
    [/سفید/gu, "white"],
    [/آبی/gu, "blue"],
    [/طلایی/gu, "gold"],
    [/نقره(?:‌| )?ای/gu, "silver"],
    [/خاکستری/gu, "gray"]
  ];
  const PROVIDER_SITES = ["torob", "digikala", "technolife", "emalls", "amazon", "ebay"];
  const AMAZON_API_CREDENTIALS_KEY = "dirobAmazonApiCredentials";
  const EBAY_API_CREDENTIALS_KEY = "dirobEbayApiCredentials";
  const inFlightQueries = new Map();
  const inFlightSourceResolvers = new Map();
  const queryTranslationCache = new Map();
  const inFlightQueryTranslations = new Map();
  const queue = [];
  const tabStates = new Map();
  const logEntries = [];
  const pendingLogEntries = [];
  let activeCount = 0;
  let panelConnectionCount = 0;
  let panelActive = false;
  let debugEnabled = false;
  let selectionModeEnabled = false;
  let syncPageViewEnabled = false;
  let guideNumbersEnabled = false;
  let autoLogsEnabled = true;
  let panelLanguage = "fa";
  let panelFontScale = 0;
  let panelLayoutMode = "list";
  let minimalViewEnabled = false;
  let settingsOpen = false;
  let themeMode = "system";
  let amazonApiCredentials = normalizeApiCredentialConfig();
  let ebayApiCredentials = normalizeApiCredentialConfig();
  let providerSearchEnabled = getDefaultProviderFlags();
  let providerPriceVisible = getDefaultProviderFlags();
  let logFlushTimer = null;
  let stateFlushTimer = null;
  const navigationRescanDebounceTimers = new Map();
  let stateSnapshotSerial = 0;
  let technolifeBuildIdCache = {
    value: null,
    expiresAt: 0
  };
  let logHelperStatus = {
    connected: false,
    lastCheckedAt: null,
    lastError: null,
    artifactDir: "research/artifacts/dirob",
    logPath: "research/artifacts/dirob/dirob-live-log.ndjson",
    statePath: "research/artifacts/dirob/dirob-state.json"
  };

  initialize().catch(() => {});

  async function initialize() {
    await loadSettings();
    await setPanelActiveState(false, { force: true, triggerRescan: false });
    await loadLogs();
    await ensureLogHelperHealth();
    if (chrome.sidePanel?.setPanelBehavior) {
      await chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: true
      }).catch(() => {});
    }
    addLog("info", "background", "initialized");
  }

  async function loadSettings() {
    const stored = await chrome.storage.local.get([
      "dirobDebugEnabled",
      "dirobSelectionModeEnabled",
      "dirobSyncPageViewEnabled",
      "dirobGuideNumbersEnabled",
      "dirobAutoLogsEnabled",
      "dirobLanguage",
      "dirobFontScale",
      "dirobLayoutMode",
      "dirobMinimalViewEnabled",
      "dirobSettingsOpen",
      "dirobThemeMode",
      "dirobPanelActive",
      "dirobProviderSearchEnabled",
      "dirobProviderPriceVisible",
      AMAZON_API_CREDENTIALS_KEY,
      EBAY_API_CREDENTIALS_KEY
    ]);
    debugEnabled = Boolean(stored.dirobDebugEnabled);
    selectionModeEnabled = Boolean(stored.dirobSelectionModeEnabled);
    syncPageViewEnabled = Boolean(stored.dirobSyncPageViewEnabled);
    guideNumbersEnabled = Boolean(stored.dirobGuideNumbersEnabled);
    autoLogsEnabled = stored.dirobAutoLogsEnabled !== false;
    panelLanguage = stored.dirobLanguage || "fa";
    panelFontScale = clampFontScale(Number.isFinite(stored.dirobFontScale) ? stored.dirobFontScale : 0);
    panelLayoutMode = stored.dirobLayoutMode === "grid" ? "grid" : "list";
    minimalViewEnabled = Boolean(stored.dirobMinimalViewEnabled);
    settingsOpen = Boolean(stored.dirobSettingsOpen);
    themeMode = ["system", "dark", "light"].includes(stored.dirobThemeMode) ? stored.dirobThemeMode : "system";
    panelActive = Boolean(stored.dirobPanelActive);
    amazonApiCredentials = normalizeApiCredentialConfig(stored[AMAZON_API_CREDENTIALS_KEY]);
    ebayApiCredentials = normalizeApiCredentialConfig(stored[EBAY_API_CREDENTIALS_KEY]);
    providerSearchEnabled = normalizeProviderFlags(stored.dirobProviderSearchEnabled);
    providerPriceVisible = normalizeProviderFlags(stored.dirobProviderPriceVisible);
  }

  async function loadLogs() {
    const stored = await chrome.storage.local.get([LOG_STORAGE_KEY]);
    const entries = Array.isArray(stored[LOG_STORAGE_KEY]) ? stored[LOG_STORAGE_KEY] : [];
    logEntries.splice(0, logEntries.length, ...entries.slice(-MAX_LOG_ENTRIES));
  }

  chrome.runtime.onInstalled.addListener(() => {
    initialize().catch(() => {});
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }
    if (Object.prototype.hasOwnProperty.call(changes, "dirobDebugEnabled")) {
      debugEnabled = Boolean(changes.dirobDebugEnabled.newValue);
    }
    if (Object.prototype.hasOwnProperty.call(changes, "dirobSelectionModeEnabled")) {
      selectionModeEnabled = Boolean(changes.dirobSelectionModeEnabled.newValue);
      addLog("info", "background", "selection_mode_changed", {
        enabled: selectionModeEnabled
      });
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "dirobSyncPageViewEnabled")) {
      syncPageViewEnabled = Boolean(changes.dirobSyncPageViewEnabled.newValue);
      addLog("info", "background", "sync_page_view_changed", {
        enabled: syncPageViewEnabled
      });
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "dirobGuideNumbersEnabled")) {
      guideNumbersEnabled = Boolean(changes.dirobGuideNumbersEnabled.newValue);
      addLog("info", "background", "guide_numbers_changed", {
        enabled: guideNumbersEnabled
      });
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "dirobAutoLogsEnabled")) {
      autoLogsEnabled = changes.dirobAutoLogsEnabled.newValue !== false;
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "dirobLanguage")) {
      panelLanguage = changes.dirobLanguage.newValue || "fa";
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "dirobFontScale")) {
      const next = Number(changes.dirobFontScale.newValue);
      panelFontScale = clampFontScale(Number.isFinite(next) ? next : 0);
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "dirobLayoutMode")) {
      panelLayoutMode = changes.dirobLayoutMode.newValue === "grid" ? "grid" : "list";
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "dirobMinimalViewEnabled")) {
      minimalViewEnabled = Boolean(changes.dirobMinimalViewEnabled.newValue);
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "dirobSettingsOpen")) {
      settingsOpen = Boolean(changes.dirobSettingsOpen.newValue);
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "dirobThemeMode")) {
      themeMode = ["system", "dark", "light"].includes(changes.dirobThemeMode.newValue)
        ? changes.dirobThemeMode.newValue
        : "system";
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "dirobPanelActive")) {
      panelActive = Boolean(changes.dirobPanelActive.newValue);
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, AMAZON_API_CREDENTIALS_KEY)) {
      amazonApiCredentials = normalizeApiCredentialConfig(changes[AMAZON_API_CREDENTIALS_KEY].newValue);
    }
    if (Object.prototype.hasOwnProperty.call(changes, EBAY_API_CREDENTIALS_KEY)) {
      ebayApiCredentials = normalizeApiCredentialConfig(changes[EBAY_API_CREDENTIALS_KEY].newValue);
    }
    if (Object.prototype.hasOwnProperty.call(changes, "dirobProviderSearchEnabled")) {
      providerSearchEnabled = normalizeProviderFlags(changes.dirobProviderSearchEnabled.newValue);
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "dirobProviderPriceVisible")) {
      providerPriceVisible = normalizeProviderFlags(changes.dirobProviderPriceVisible.newValue);
      notifyPanels();
    }
  });

  chrome.tabs.onActivated.addListener((activeInfo) => {
    if (panelActive && activeInfo?.tabId != null) {
      softRescanTab(activeInfo.tabId).catch(() => {});
    }
    notifyPanels();
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (typeof changeInfo.url === "string") {
      handleTopLevelNavigationEvent(tabId, changeInfo.url, "tabs.onUpdated");
      notifyPanels();
      return;
    }
    if (changeInfo.status === "loading") {
      const state = ensureTabState(tabId);
      const nextUrl = tab?.url || state.pageUrl || "";
      handleTopLevelNavigationEvent(tabId, nextUrl, "tabs.onUpdated.loading", {
        status: "loading"
      });
      notifyPanels();
      return;
    }
    if (changeInfo.status === "complete") {
      if (panelActive) {
        softRescanTab(tabId).catch(() => {});
      }
      notifyPanels();
    }
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    const timer = navigationRescanDebounceTimers.get(tabId);
    if (timer) {
      clearTimeout(timer);
      navigationRescanDebounceTimers.delete(tabId);
    }
    tabStates.delete(tabId);
    notifyPanels();
  });

  if (chrome.webNavigation?.onCommitted) {
    chrome.webNavigation.onCommitted.addListener((details) => {
      if (details.frameId !== 0 || typeof details.url !== "string") {
        return;
      }
      handleTopLevelNavigationEvent(details.tabId, details.url, "webNavigation.onCommitted", {
        transitionType: details.transitionType || null,
        transitionQualifiers: details.transitionQualifiers || []
      });
      notifyPanels();
    });
  }

  if (chrome.webNavigation?.onHistoryStateUpdated) {
    chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
      if (details.frameId !== 0 || typeof details.url !== "string") {
        return;
      }
      handleTopLevelNavigationEvent(details.tabId, details.url, "webNavigation.onHistoryStateUpdated", {
        transitionType: details.transitionType || null,
        transitionQualifiers: details.transitionQualifiers || []
      });
      notifyPanels();
    });
  }

  chrome.runtime.onConnect.addListener((port) => {
    if (port?.name !== "dirob-panel") {
      return;
    }
    panelConnectionCount += 1;
    setPanelActiveState(true).catch(() => {});
    port.onDisconnect.addListener(() => {
      panelConnectionCount = Math.max(0, panelConnectionCount - 1);
      if (panelConnectionCount === 0) {
        setPanelActiveState(false).catch(() => {});
      }
    });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message?.type) {
      return false;
    }

    if (message.type === "DIROB_PANEL_GET_STATE") {
      getPanelState().then(sendResponse);
      return true;
    }

    if (message.type === "DIROB_LOG_EVENT") {
      if (!debugEnabled || !autoLogsEnabled) {
        sendResponse({ ok: true, skipped: true });
        return false;
      }
      const tabId = sender.tab?.id || null;
      addLog(
        message.payload?.level || "info",
        message.payload?.scope || "runtime",
        message.payload?.message || "event",
        {
          ...message.payload?.details,
          href: message.payload?.href || sender.tab?.url || null,
          tabId
        }
      );
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === "DIROB_GET_LOGS") {
      sendResponse({
        logs: [...logEntries]
      });
      return false;
    }

    if (message.type === "DIROB_CLEAR_LOGS") {
      clearLogs().then(sendResponse);
      return true;
    }

    if (message.type === "DIROB_EXPORT_LOGS") {
      exportLogs().then(sendResponse);
      return true;
    }

    if (message.type === "DIROB_SET_DEBUG") {
      const enabled = Boolean(message.payload?.enabled);
      debugEnabled = enabled;
      chrome.storage.local.set({ dirobDebugEnabled: enabled });
       addLog("info", "background", "debug_changed", {
        enabled
      });
      notifyPanels();
      sendResponse({ enabled });
      return false;
    }

    if (message.type === "DIROB_SET_SELECTION_MODE") {
      const enabled = Boolean(message.payload?.enabled);
      selectionModeEnabled = enabled;
      chrome.storage.local.set({ dirobSelectionModeEnabled: enabled });
      addLog("info", "background", "selection_mode_changed", {
        enabled
      });
      notifyPanels();
      sendResponse({ enabled });
      return false;
    }

    if (message.type === "DIROB_SET_AUTO_LOGS") {
      const enabled = Boolean(message.payload?.enabled);
      autoLogsEnabled = enabled;
      chrome.storage.local.set({
        dirobAutoLogsEnabled: enabled
      });
      if (enabled) {
        addLog("info", "background", "auto_logs_changed", {
          enabled
        });
      }
      notifyPanels();
      sendResponse({ enabled });
      return false;
    }

    if (message.type === "DIROB_SET_SYNC_PAGE_VIEW") {
      const enabled = Boolean(message.payload?.enabled);
      syncPageViewEnabled = enabled;
      chrome.storage.local.set({
        dirobSyncPageViewEnabled: enabled
      });
      addLog("info", "background", "sync_page_view_changed", {
        enabled
      });
      notifyPanels();
      sendResponse({ enabled });
      return false;
    }

    if (message.type === "DIROB_SET_GUIDE_NUMBERS") {
      const enabled = Boolean(message.payload?.enabled);
      guideNumbersEnabled = enabled;
      chrome.storage.local.set({
        dirobGuideNumbersEnabled: enabled
      });
      addLog("info", "background", "guide_numbers_changed", {
        enabled
      });
      notifyPanels();
      sendResponse({ enabled });
      return false;
    }

    if (message.type === "DIROB_SET_LANGUAGE") {
      panelLanguage = message.payload?.language === "en" ? "en" : "fa";
      chrome.storage.local.set({
        dirobLanguage: panelLanguage
      });
      notifyPanels();
      sendResponse({ language: panelLanguage });
      return false;
    }

    if (message.type === "DIROB_ADJUST_FONT_SCALE") {
      const delta = Number(message.payload?.delta || 0);
      panelFontScale = clampFontScale(panelFontScale + delta);
      chrome.storage.local.set({
        dirobFontScale: panelFontScale
      });
      notifyPanels();
      sendResponse({ fontScale: panelFontScale });
      return false;
    }

    if (message.type === "DIROB_SET_LAYOUT_MODE") {
      panelLayoutMode = message.payload?.layoutMode === "grid" ? "grid" : "list";
      chrome.storage.local.set({
        dirobLayoutMode: panelLayoutMode
      });
      notifyPanels();
      sendResponse({ layoutMode: panelLayoutMode });
      return false;
    }

    if (message.type === "DIROB_SET_MINIMAL_VIEW") {
      minimalViewEnabled = Boolean(message.payload?.enabled);
      chrome.storage.local.set({
        dirobMinimalViewEnabled: minimalViewEnabled
      });
      notifyPanels();
      sendResponse({ enabled: minimalViewEnabled });
      return false;
    }

    if (message.type === "DIROB_SET_SETTINGS_OPEN") {
      settingsOpen = Boolean(message.payload?.enabled);
      chrome.storage.local.set({
        dirobSettingsOpen: settingsOpen
      });
      notifyPanels();
      sendResponse({ enabled: settingsOpen });
      return false;
    }

    if (message.type === "DIROB_SET_THEME_MODE") {
      themeMode = ["system", "dark", "light"].includes(message.payload?.themeMode)
        ? message.payload.themeMode
        : "system";
      chrome.storage.local.set({
        dirobThemeMode: themeMode
      });
      notifyPanels();
      sendResponse({ themeMode });
      return false;
    }

    if (message.type === "DIROB_SET_PROVIDER_SEARCH") {
      const provider = normalizeProviderSite(message.payload?.provider);
      if (!provider) {
        sendResponse({ ok: false, reason: "invalid_provider" });
        return false;
      }
      providerSearchEnabled = {
        ...providerSearchEnabled,
        [provider]: Boolean(message.payload?.enabled)
      };
      chrome.storage.local.set({
        dirobProviderSearchEnabled: providerSearchEnabled
      });
      refreshMatchesForEnabledProviders().catch(() => {});
      notifyPanels();
      sendResponse({ ok: true, providerSearchEnabled });
      return false;
    }

    if (message.type === "DIROB_SET_PROVIDER_PRICE") {
      const provider = normalizeProviderSite(message.payload?.provider);
      if (!provider) {
        sendResponse({ ok: false, reason: "invalid_provider" });
        return false;
      }
      providerPriceVisible = {
        ...providerPriceVisible,
        [provider]: Boolean(message.payload?.enabled)
      };
      chrome.storage.local.set({
        dirobProviderPriceVisible: providerPriceVisible
      });
      notifyPanels();
      sendResponse({ ok: true, providerPriceVisible });
      return false;
    }

    if (message.type === "DIROB_PAGE_CONTEXT") {
      const tabId = sender.tab?.id;
      if (tabId != null) {
        const state = ensureTabState(tabId);
        syncStateToTabUrl(
          tabId,
          message.payload?.pageUrl || sender.tab?.url || "",
          "page_context_message"
        );
        const nextSite = message.payload?.site || "unsupported";
        const nextPageUrl = canonicalizeTrackedUrl(message.payload?.pageUrl || sender.tab?.url || "");
        const currentPageUrl = canonicalizeTrackedUrl(state.pageUrl || "");
        if (currentPageUrl && nextPageUrl && currentPageUrl !== nextPageUrl) {
          addLog("info", "background", "page_context_url_switch", {
            tabId,
            previousPageUrl: currentPageUrl,
            nextPageUrl
          });
          resetPageState(state);
          state.pageKey = "";
        }
        const nextPageKey =
          message.payload?.pageKey || `${nextSite}|${message.payload?.mode || "unsupported"}|${nextPageUrl}`;
        if (state.pageKey && state.pageKey !== nextPageKey) {
          resetPageState(state);
          addLog("info", "background", "page_sync_changed", {
            tabId,
            previousPageKey: state.pageKey,
            nextPageKey
          });
        }
        state.pageKey = nextPageKey;
        state.site = nextSite;
        state.pageUrl = nextPageUrl;
        state.pageTitle = message.payload?.pageTitle || sender.tab?.title || "";
        state.isSupported = Boolean(message.payload?.isSupported);
        state.pageMode = message.payload?.mode || "unsupported";
        if (!state.isSupported) {
          resetPageState(state);
        }
        addLog("debug", "background", "page_context", {
          tabId,
          site: state.site,
          isSupported: state.isSupported,
          pageUrl: state.pageUrl,
          pageKey: state.pageKey,
          incomingPageKey: message.payload?.pageKey || null
        });
        notifyPanels();
      }
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === "DIROB_SYNC_ITEMS") {
      const tabId = sender.tab?.id;
      if (tabId != null) {
        const state = ensureTabState(tabId);
        syncStateToTabUrl(
          tabId,
          message.payload?.pageUrl || sender.tab?.url || "",
          "sync_items_message"
        );
        const syncPageUrl = canonicalizeTrackedUrl(
          message.payload?.pageUrl || sender.tab?.url || state.pageUrl || ""
        );
        const statePageUrl = canonicalizeTrackedUrl(state.pageUrl || "");
        if (statePageUrl && syncPageUrl && syncPageUrl !== statePageUrl) {
          addLog("debug", "background", "stale_sync_url_ignored", {
            tabId,
            syncPageUrl,
            statePageUrl
          });
          sendResponse({ ok: true, ignored: true });
          return false;
        }
        const syncPageKey =
          message.payload?.pageKey ||
          `${message.payload?.site || state.site}|${message.payload?.mode || state.pageMode || "unsupported"}|${
            syncPageUrl || statePageUrl || ""
          }`;
        if (state.pageKey && syncPageKey !== state.pageKey) {
          addLog("debug", "background", "stale_sync_ignored", {
            tabId,
            syncPageKey,
            statePageKey: state.pageKey
          });
          sendResponse({ ok: true, ignored: true });
          return false;
        }
        state.site = message.payload?.site || state.site;
        state.pageUrl = message.payload?.pageUrl || state.pageUrl;
        state.pageMode = message.payload?.mode || state.pageMode || "listing";
        const incomingGuideDiagnostics = computeGuideDiagnostics(message.payload?.rows || [], "item");
        if (incomingGuideDiagnostics.count && (!incomingGuideDiagnostics.startsAtOne || !incomingGuideDiagnostics.isContiguous)) {
          addLog("warn", "background", "incoming_guide_sequence_anomaly", {
            tabId,
            pageKey: message.payload?.pageKey || null,
            diagnostics: incomingGuideDiagnostics
          });
        }
        syncRowsIntoState(state, message.payload?.rows || []);
        const stateGuideDiagnostics = computeGuideDiagnostics(
          Array.from(state.rows.values()).map((row) => row.item),
          null
        );
        const previousActiveGuideNumber = state.activeGuideNumber;
        state.activeGuideNumber = normalizeGuideNumber(message.payload?.activeGuideNumber);
        state.activeSourceId = message.payload?.activeSourceId || findSourceIdByGuideNumber(state, state.activeGuideNumber);
        if (previousActiveGuideNumber !== state.activeGuideNumber) {
          addLog("debug", "background", "page_sync_changed", {
            tabId,
            activeGuideNumber: state.activeGuideNumber
          });
        }
        if (
          state.pageMode === "detail" &&
          !selectionModeEnabled &&
          message.payload?.rows?.[0]?.item?.sourceId
        ) {
          state.selectedSourceId = message.payload.rows[0].item.sourceId;
        }
        if (!selectionModeEnabled) {
          queueVisibleRows(tabId, state);
        }
        addLog("debug", "background", "sync_items", {
          tabId,
          site: state.site,
          rows: state.rows.size,
          pageKey: state.pageKey,
          incomingGuideDiagnostics,
          stateGuideDiagnostics
        });
        notifyPanels();
      }
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === "DIROB_ITEM_FOCUS") {
      const tabId = sender.tab?.id;
      if (tabId != null && message.payload?.item) {
        const state = ensureTabState(tabId);
        syncStateToTabUrl(
          tabId,
          message.payload?.pageUrl || sender.tab?.url || "",
          "item_focus_message"
        );
        const focusPageUrl = canonicalizeTrackedUrl(
          message.payload?.pageUrl || sender.tab?.url || state.pageUrl || ""
        );
        const statePageUrl = canonicalizeTrackedUrl(state.pageUrl || "");
        if (statePageUrl && focusPageUrl && focusPageUrl !== statePageUrl) {
          addLog("debug", "background", "stale_focus_url_ignored", {
            tabId,
            focusPageUrl,
            statePageUrl,
            sourceId: message.payload.item.sourceId
          });
          sendResponse({ ok: true, ignored: true });
          return false;
        }
        const focusPageKey =
          message.payload?.pageKey ||
          `${message.payload?.site || state.site}|${message.payload?.mode || state.pageMode || "unsupported"}|${
            focusPageUrl || statePageUrl || ""
          }`;
        if (state.pageKey && focusPageKey !== state.pageKey) {
          addLog("debug", "background", "stale_focus_ignored", {
            tabId,
            focusPageKey,
            statePageKey: state.pageKey,
            sourceId: message.payload.item.sourceId
          });
          sendResponse({ ok: true, ignored: true });
          return false;
        }
        upsertRow(state, message.payload.item, true, Date.now());
        state.selectedSourceId = message.payload.item.sourceId;
        state.activeGuideNumber = normalizeGuideNumber(message.payload.item.guideNumber);
        state.activeSourceId = message.payload.item.sourceId;
        resolveSourceData(tabId, message.payload.item.sourceId, state, {
          force: false
        }).catch(() => {});
        if (selectionModeEnabled) {
          queueMatchRequest(tabId, message.payload.item, {
            bustCache: false
          });
        }
        addLog("debug", "background", "item_focus", {
          tabId,
          sourceId: message.payload.item.sourceId
        });
        notifyPanels();
      }
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === "DIROB_RELOAD_ALL") {
      reloadAllForActiveTab().then(sendResponse);
      return true;
    }

    if (message.type === "DIROB_RELOAD_ITEM") {
      reloadSingleForActiveTab(message.payload?.sourceId).then(sendResponse);
      return true;
    }

    if (message.type === "DIROB_LOCATE_ITEM") {
      locateItemOnActiveTab(message.payload?.sourceId).then(sendResponse);
      return true;
    }

    if (message.type === "DIROB_GUIDE_BADGE_HOVER") {
      const tabId = sender.tab?.id;
      if (tabId != null) {
        const state = ensureTabState(tabId);
        state.hoverSourceId = message.payload?.sourceId || null;
        notifyPanels();
      }
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === "DIROB_GUIDE_BADGE_CLICK") {
      const tabId = sender.tab?.id;
      if (tabId != null) {
        const state = ensureTabState(tabId);
        state.panelFocusSourceId = message.payload?.sourceId || null;
        state.panelFocusNonce += 1;
        notifyPanels();
      }
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === "DIROB_RESCAN_ACTIVE_TAB") {
      rescanActiveTab().then(sendResponse);
      return true;
    }

    return false;
  });

  function ensureTabState(tabId) {
    if (!tabStates.has(tabId)) {
      tabStates.set(tabId, {
        site: "unsupported",
        pageKey: "",
        pageUrl: "",
        pageTitle: "",
        isSupported: false,
        pageMode: "unsupported",
        selectedSourceId: null,
        activeGuideNumber: null,
        activeSourceId: null,
        panelFocusSourceId: null,
        panelFocusNonce: 0,
        hoverSourceId: null,
        rows: new Map(),
        sourceCache: new Map(),
        matchCache: new Map()
      });
    }
    return tabStates.get(tabId);
  }

  function inferSiteFromUrl(url) {
    try {
      const hostname = new URL(String(url || "")).hostname.toLowerCase();
      if (hostname.includes("digikala.com")) {
        return "digikala";
      }
      if (hostname.includes("torob.com")) {
        return "torob";
      }
      if (hostname.includes("technolife.com")) {
        return "technolife";
      }
      if (hostname.includes("emalls.ir")) {
        return "emalls";
      }
      if (hostname.includes("amazon.")) {
        return "amazon";
      }
      if (hostname.includes("ebay.")) {
        return "ebay";
      }
    } catch (_error) {}
    return "unsupported";
  }

  function canonicalizeTrackedUrl(url) {
    if (typeof url !== "string" || !url) {
      return "";
    }
    return globalThis.DirobNormalize.canonicalizeUrl(url, url) || url;
  }

  function handleTopLevelNavigationEvent(tabId, nextUrl, source, extraDetails = null) {
    if (tabId == null || typeof nextUrl !== "string" || !nextUrl) {
      return;
    }

    const canonicalUrl = canonicalizeTrackedUrl(nextUrl);
    const state = ensureTabState(tabId);
    const previousPageUrl = state.pageUrl || "";
    const previousPageKey = state.pageKey || "";
    const hasNavigationChange = previousPageUrl !== canonicalUrl;
    const shouldReset = hasNavigationChange || Boolean(previousPageKey);

    if (!shouldReset) {
      if (panelActive) {
        scheduleNavigationRescan(tabId);
      }
      return;
    }

    resetPageState(state);
    state.pageKey = "";
    state.pageUrl = canonicalUrl;
    state.pageMode = "unsupported";
    state.isSupported = false;
    state.site = inferSiteFromUrl(canonicalUrl);

    addLog("info", "background", "navigation_detected", {
      tabId,
      source,
      previousPageUrl,
      nextPageUrl: canonicalUrl,
      previousPageKey: previousPageKey || null,
      ...(extraDetails || {})
    });

    if (panelActive) {
      scheduleNavigationRescan(tabId);
    }
  }

  function scheduleNavigationRescan(tabId) {
    if (tabId == null) {
      return;
    }
    const existingTimer = navigationRescanDebounceTimers.get(tabId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    const timerId = setTimeout(() => {
      navigationRescanDebounceTimers.delete(tabId);
      if (!panelActive) {
        return;
      }
      forceRescanTab(tabId).catch(() => {});
    }, NAVIGATION_RESCAN_DEBOUNCE_MS);
    navigationRescanDebounceTimers.set(tabId, timerId);
  }

  function resetPageState(state) {
    state.rows.clear();
    state.selectedSourceId = null;
    state.activeGuideNumber = null;
    state.activeSourceId = null;
    state.panelFocusSourceId = null;
    state.panelFocusNonce += 1;
    state.hoverSourceId = null;
    state.sourceCache.clear();
    state.matchCache.clear();
  }

  function syncRowsIntoState(state, incomingRows) {
    const touched = new Set();

    for (const row of incomingRows) {
      if (!row?.item?.sourceId) {
        continue;
      }
      touched.add(row.item.sourceId);
      upsertRow(state, row.item, Boolean(row.isVisible), row.lastSeenAt || row.item.seenAt);
    }

    const removedSourceIds = [];
    for (const sourceId of state.rows.keys()) {
      if (!touched.has(sourceId)) {
        removedSourceIds.push(sourceId);
      }
    }

    for (const sourceId of removedSourceIds) {
      state.rows.delete(sourceId);
      state.sourceCache.delete(sourceId);
      state.matchCache.delete(sourceId);
      if (state.selectedSourceId === sourceId) {
        state.selectedSourceId = null;
      }
      if (state.activeSourceId === sourceId) {
        state.activeSourceId = null;
      }
      if (state.hoverSourceId === sourceId) {
        state.hoverSourceId = null;
      }
    }
  }

  function upsertRow(state, item, isVisible, lastSeenAt) {
    const normalizedItem = {
      ...item,
      guideNumber: normalizeGuideNumber(item.guideNumber ?? (Number.isFinite(item.position) ? item.position + 1 : null)),
      position: Number.isFinite(item.position)
        ? item.position
        : Number.isFinite(item.guideNumber)
          ? Math.max(0, item.guideNumber - 1)
          : null
    };
    const existing = state.rows.get(item.sourceId);
    if (!existing) {
      state.rows.set(item.sourceId, {
        item: enrichSourceItem(normalizedItem),
        match: null,
        retryCountSource: 0,
        retryCountMatch: 0,
        lastProviderRecoveryAttemptAt: 0,
        isLoading: false,
        isVisible,
        lastSeenAt: lastSeenAt || Date.now()
      });
      return;
    }

    existing.item = mergeSourceItems(existing.item, enrichSourceItem(normalizedItem));
    existing.isVisible = isVisible;
    existing.lastSeenAt = lastSeenAt || existing.lastSeenAt || Date.now();
  }

  function queueVisibleRows(tabId, state) {
    for (const row of state.rows.values()) {
      if (row.isVisible) {
        resolveSourceData(tabId, row.item.sourceId, state, { force: false }).catch(() => {});
        queueMatchRequest(tabId, row.item, {
          bustCache: false
        }, state);
      }
    }
  }

  async function refreshMatchesForEnabledProviders() {
    for (const [tabId, state] of tabStates.entries()) {
      for (const row of state.rows.values()) {
        if (!row.isVisible) {
          continue;
        }
        row.isLoading = false;
        row.retryCountMatch = 0;
        row.lastProviderRecoveryAttemptAt = 0;
        row.match = null;
        queueMatchRequest(tabId, row.item, {
          bustCache: true
        }, state);
      }
    }
    notifyPanels();
  }

  function queueMatchRequest(tabId, item, options, stateOverride) {
    const targetSites = getEnabledTargetSitesForSource(item.sourceSite);
    if (!targetSites.length) {
      const state = stateOverride || ensureTabState(tabId);
      const row = state.rows.get(item.sourceId);
      if (row) {
        row.isLoading = false;
        row.match = buildProvidersDisabledResult(item);
      }
      notifyPanels();
      return;
    }
    const targetSite = targetSites[0];
    const fallbackSites = targetSites.slice(1);
    const state = stateOverride || ensureTabState(tabId);
    const row = state.rows.get(item.sourceId);
    const isManual = Boolean(options?.bustCache);
    const query = buildCleanMatchQuery(item);
    const queryKey = `${item.sourceSite}:${targetSites.join(",")}:${globalThis.DirobNormalize.normalizeText(query)}`;

    if (row) {
      if (isManual) {
        row.retryCountMatch = 0;
        row.lastProviderRecoveryAttemptAt = 0;
      } else {
        if (row.isLoading) {
          return;
        }
        if (row.match && row.match.status && row.match.status !== "loading") {
          const hasRecoverableErrors = hasRecoverableProviderErrors(row.match, targetSites);
          if (!hasRecoverableErrors) {
            return;
          }
          const now = Date.now();
          if (now - (row.lastProviderRecoveryAttemptAt || 0) < MATCH_ERROR_RETRY_INTERVAL_MS) {
            return;
          }
          row.lastProviderRecoveryAttemptAt = now;
          addLog("debug", "background", "provider_error_retry_scheduled", {
            tabId,
            sourceId: item.sourceId,
            targetSites
          });
        }
        if (row.retryCountMatch >= MAX_AUTO_RETRIES) {
          if (!row.match || row.match.status !== "error" || row.match.reason !== "max_retries_reached") {
            row.match = buildErrorResult(item, item.title, targetSite, new Error("max_retries_reached"));
            row.isLoading = false;
            addLog("warn", "background", "retry_exhausted", {
              tabId,
              sourceId: item.sourceId,
              kind: "match"
            });
            notifyPanels();
          }
          return;
        }
      }
      row.isLoading = true;
      if (!row.match || isManual) {
        const loadingResults = {};
        for (const site of targetSites) {
          loadingResults[site] = {
            sourceSite: item.sourceSite,
            targetSite: site,
            query: item.title,
            status: "loading",
            confidence: 0,
            matchedTitle: null,
            targetPriceText: null,
            targetPriceValue: null,
            targetUrl: buildSearchUrlForSite(site, item.title),
            moreInfoUrl: null,
            sellerCount: null,
            reason: "loading",
            googleUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title),
            searchUrl: buildSearchUrlForSite(site, item.title)
          };
        }
        row.match = {
          sourceSite: item.sourceSite,
          targetSite,
          query: item.title,
          status: "loading",
          confidence: 0,
          matchedTitle: null,
          targetPriceText: null,
          targetPriceValue: null,
          targetUrl: buildSearchUrlForSite(targetSite, item.title),
          moreInfoUrl: null,
          sellerCount: null,
          reason: "loading",
          googleUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title),
          searchUrl: buildSearchUrlForSite(targetSite, item.title),
          allResults: loadingResults
        };
        notifyPanels();
      }
    }

    if (options?.bustCache) {
      state.matchCache.delete(queryKey);
    }

    const cacheEntry = state.matchCache.get(queryKey);
    if (cacheEntry && cacheEntry.expiresAt > Date.now()) {
      addLog("debug", "background", "cache_hit_match", {
        tabId,
        sourceId: item.sourceId,
        queryKey
      });
      applyMatchResult(tabId, item.sourceId, cacheEntry.result);
      return;
    }

    const existing = inFlightQueries.get(queryKey);
    if (existing) {
      existing.listeners.push({ tabId, sourceId: item.sourceId, item });
      return;
    }

    queue.push({
      tabId,
      item,
      query,
      queryKey,
      targetSite,
      fallbackSites,
      isManual,
      pageKey: state.pageKey
    });
    addLog("debug", "background", "queue_match", {
      tabId,
      sourceId: item.sourceId,
      targetSite,
      queueLength: queue.length
    });
    drainQueue();
  }

  function drainQueue() {
    while (activeCount < MAX_CONCURRENCY && queue.length) {
      const job = queue.shift();
      activeCount += 1;
      runQuery(job)
        .catch(() => {})
        .finally(() => {
          activeCount -= 1;
          drainQueue();
        });
    }
  }

  async function runQuery(job) {
    const listeners = [{ tabId: job.tabId, sourceId: job.item.sourceId, item: job.item }];
    inFlightQueries.set(job.queryKey, { listeners });
    let result;
    const state = ensureTabState(job.tabId);

    try {
      const targetSites = [job.targetSite, ...(job.fallbackSites || [])]
        .map((site) => normalizeProviderSite(site))
        .filter(Boolean);
      const resultsBySite = {};
      result = null;

      for (const site of targetSites) {
        let siteResult;
        try {
          siteResult = await fetchMatchByTargetSite(site, job.item, job.query);
        } catch (error) {
          addLog("error", "background", "match_failed", {
            sourceId: job.item.sourceId,
            targetSite: site,
            query: job.query,
            error: serializeError(error)
          });
          siteResult = buildErrorResult(job.item, job.query, site, error);
        }
        resultsBySite[site] = siteResult;
        result = pickBetterResult(result, siteResult);
      }

      if (!result) {
        result = buildProvidersDisabledResult(job.item);
      }
      result = {
        ...result,
        allResults: resultsBySite
      };

      const cacheTtlMs = hasRecoverableProviderErrors(result, targetSites)
        ? MATCH_ERROR_RETRY_INTERVAL_MS
        : CACHE_TTL_MS;
      state.matchCache.set(job.queryKey, {
        result,
        expiresAt: Date.now() + cacheTtlMs
      });
    } catch (error) {
      addLog("error", "background", "match_failed", {
        sourceId: job.item.sourceId,
        targetSite: job.targetSite,
        query: job.query,
        error: serializeError(error)
      });
      result = buildErrorResult(job.item, job.query, job.targetSite, error);
    }

    const entry = inFlightQueries.get(job.queryKey);
    const allListeners = entry ? entry.listeners : listeners;
    inFlightQueries.delete(job.queryKey);

    for (const listener of allListeners) {
      const listenerState = ensureTabState(listener.tabId);
      if (job.pageKey && listenerState.pageKey && job.pageKey !== listenerState.pageKey) {
        continue;
      }
      applyMatchResult(listener.tabId, listener.sourceId, result);
    }
  }

  function buildErrorResult(item, query, targetSite, error) {
    return {
      sourceSite: item.sourceSite,
      targetSite,
      query,
      status: "error",
      confidence: 0,
      matchedTitle: null,
      targetPriceText: null,
      targetPriceValue: null,
      targetOriginalPriceText: null,
      targetOriginalPriceValue: null,
      targetDiscountPercent: null,
      targetUrl: buildSearchUrlForSite(targetSite, query),
      moreInfoUrl: null,
      sellerCount: null,
      reason: error?.message || "request_failed",
      googleUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title),
      searchUrl: buildSearchUrlForSite(targetSite, query)
    };
  }

  function buildProvidersDisabledResult(item) {
    return {
      sourceSite: item.sourceSite,
      targetSite: null,
      query: buildCleanMatchQuery(item),
      status: "not_found",
      confidence: 0,
      matchedTitle: null,
      targetPriceText: null,
      targetPriceValue: null,
      targetOriginalPriceText: null,
      targetOriginalPriceValue: null,
      targetDiscountPercent: null,
      targetUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title),
      moreInfoUrl: null,
      sellerCount: null,
      reason: "provider_search_disabled",
      googleUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title),
      searchUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title)
    };
  }

  function applyMatchResult(tabId, sourceId, result) {
    const state = ensureTabState(tabId);
    const row = state.rows.get(sourceId);
    if (!row) {
      return;
    }
    row.isLoading = false;
    if (result.status === "error") {
      row.retryCountMatch = Math.min(MAX_AUTO_RETRIES, (row.retryCountMatch || 0) + 1);
    } else {
      row.retryCountMatch = 0;
      const targetSites = getEnabledTargetSitesForSource(row.item?.sourceSite);
      if (!hasRecoverableProviderErrors(result, targetSites)) {
        row.lastProviderRecoveryAttemptAt = 0;
      }
    }
    row.match = {
      ...result
    };
    addLog("debug", "background", "match_applied", {
      tabId,
      sourceId,
      status: result.status,
      targetSite: result.targetSite
    });
    notifyPanels();
  }

  async function resolveSourceData(tabId, sourceId, stateOverride, options) {
    const state = stateOverride || ensureTabState(tabId);
    const row = state.rows.get(sourceId);
    if (!row) {
      return;
    }

    const isForce = Boolean(options?.force);
    const cacheKey = sourceId;

    if (isForce) {
      state.sourceCache.delete(cacheKey);
      row.retryCountSource = 0;
    }

    const cached = state.sourceCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      row.item = mergeSourceItems(row.item, cached.item);
      addLog("debug", "background", "cache_hit_source", {
        tabId,
        sourceId
      });
      return;
    }

    if (!shouldResolveSourcePrice(row.item, state.pageMode)) {
      row.item = enrichSourceItem(row.item);
      state.sourceCache.set(cacheKey, {
        item: row.item,
        expiresAt: Date.now() + CACHE_TTL_MS
      });
      return;
    }

    if (!isForce && row.retryCountSource >= MAX_AUTO_RETRIES) {
      addLog("warn", "background", "retry_exhausted", {
        tabId,
        sourceId,
        kind: "source"
      });
      return;
    }

    const inFlightKey = `${tabId}:${cacheKey}`;
    if (inFlightSourceResolvers.has(inFlightKey)) {
      return inFlightSourceResolvers.get(inFlightKey);
    }

    const promise = performSourceResolution(row.item, state.pageMode)
      .then((resolved) => {
        if (!resolved) {
          return;
        }
        const nextRow = state.rows.get(sourceId);
        if (!nextRow) {
          return;
        }
        nextRow.item = mergeSourceItems(nextRow.item, enrichSourceItem(resolved));
        nextRow.retryCountSource = 0;
        state.sourceCache.set(cacheKey, {
          item: nextRow.item,
          expiresAt: Date.now() + CACHE_TTL_MS
        });
        addLog("debug", "background", "source_price_resolved", {
          tabId,
          sourceId,
          resolver: nextRow.item.sourcePriceResolver || "unknown"
        });
        notifyPanels();
      })
      .catch((error) => {
        const nextRow = state.rows.get(sourceId);
        if (!nextRow) {
          return;
        }
        nextRow.retryCountSource = Math.min(MAX_AUTO_RETRIES, (nextRow.retryCountSource || 0) + 1);
        addLog("warn", "background", "source_price_resolve_failed", {
          tabId,
          sourceId,
          error: serializeError(error)
        });
      })
      .finally(() => {
        inFlightSourceResolvers.delete(inFlightKey);
      });

    inFlightSourceResolvers.set(inFlightKey, promise);
    return promise;
  }

  async function performSourceResolution(item, pageMode) {
    const baseItem = enrichSourceItem(item);
    if (item.sourceSite !== "digikala") {
      return baseItem;
    }

    const productId =
      String(item.sourceId || "").startsWith("digikala:")
        ? String(item.sourceId || "").slice("digikala:".length)
        : globalThis.DirobNormalize.extractProductIdFromUrl(item.productUrl || "");
    if (!productId || !/^\d+$/.test(productId)) {
      return baseItem;
    }

    if (pageMode !== "detail" && hasMeaningfulValue(baseItem.sourcePriceValue || baseItem.sourcePriceText)) {
      return baseItem;
    }

    const payload = await fetchJsonWithRetry(`https://api.digikala.com/v1/product/${productId}/`);
    const product = payload?.data?.product || payload?.data || null;
    if (!product) {
      return baseItem;
    }

    const candidate = normalizeDigikalaSourceProduct(product, item);
    return mergeSourceItems(baseItem, candidate);
  }

  async function fetchTorobMatch(item, query) {
    const startedAt = Date.now();
    const searchPayload = await fetchJsonWithRetry(buildTorobApiSearchUrl(query));
    const ranked = globalThis.DirobMatch.rankCandidates(item, searchPayload.results || []);
    const classification = globalThis.DirobMatch.classifyTopCandidate(ranked);
    const top = ranked[0] || null;
    let detailed = null;

    if (classification.status === "matched" && top?.moreInfoUrl) {
      try {
        detailed = await fetchJsonWithRetry(top.moreInfoUrl);
      } catch (_error) {
        detailed = null;
      }
    }

    return {
      sourceSite: item.sourceSite,
      targetSite: "torob",
      query,
      status: classification.status,
      confidence: top?.confidence ?? 0,
      matchedTitle: top?.title || null,
      targetPriceText: detailed?.price_text || top?.priceText || null,
      targetPriceValue:
        detailed?.price ||
        top?.priceValue ||
        globalThis.DirobNormalize.parsePriceValue(detailed?.price_text || ""),
      targetOriginalPriceText: null,
      targetOriginalPriceValue: null,
      targetDiscountPercent: null,
      targetUrl:
        top?.targetUrl ||
        (detailed?.web_client_absolute_url
          ? new URL(detailed.web_client_absolute_url, "https://torob.com").toString()
          : globalThis.DirobNormalize.buildTorobSearchUrl(query)),
      moreInfoUrl: top?.moreInfoUrl || null,
      sellerCount:
        top?.sellerCount ||
        parseSellerCount(detailed?.shop_text || detailed?.products_info?.title || ""),
      reason: classification.reason,
      searchUrl: globalThis.DirobNormalize.buildTorobSearchUrl(query),
      googleUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title),
      debug: debugEnabled
        ? {
            requestDurationMs: Date.now() - startedAt,
            topCandidates: ranked.slice(0, 5).map(serializeCandidateDebug),
            sourceItem: item
          }
        : null
    };
  }

  async function fetchDigikalaMatch(item, query) {
    const startedAt = Date.now();
    try {
      const searchPayload = await fetchJsonWithRetry(buildDigikalaApiSearchUrl(query));
      const products = searchPayload?.data?.products || [];
      const ranked = globalThis.DirobMatch.rankCandidates(
        item,
        products.slice(0, 8).map(normalizeDigikalaCandidate)
      );
      const classification = globalThis.DirobMatch.classifyTopCandidate(ranked);
      const top = ranked[0] || null;

      return {
        sourceSite: item.sourceSite,
        targetSite: "digikala",
        query,
        status: classification.status,
        confidence: top?.confidence ?? 0,
        matchedTitle: top?.title || null,
        targetPriceText: top?.priceText || null,
        targetPriceValue: top?.priceValue || null,
        targetOriginalPriceText: top?.originalPriceText || null,
        targetOriginalPriceValue: top?.originalPriceValue || null,
        targetDiscountPercent: top?.discountPercent || null,
        targetUrl: top?.targetUrl || globalThis.DirobNormalize.buildDigikalaSearchUrl(query),
        moreInfoUrl: null,
        sellerCount: null,
        reason: classification.reason,
        searchUrl: globalThis.DirobNormalize.buildDigikalaSearchUrl(query),
        googleUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title),
        debug: debugEnabled
          ? {
              requestDurationMs: Date.now() - startedAt,
              topCandidates: ranked.slice(0, 5).map(serializeCandidateDebug),
              sourceItem: item
            }
          : null
      };
    } catch (error) {
      if (!isRecoverableProviderFetchError(error)) {
        throw error;
      }
      addLog("warn", "background", "provider_search_fallback", {
        sourceId: item.sourceId,
        targetSite: "digikala",
        query,
        reason: error?.message || "request_failed"
      });
      return buildProviderSearchFallbackResult(item, query, "digikala", "network_unreachable");
    }
  }

  async function fetchEmallsMatch(item, query) {
    const startedAt = Date.now();
    try {
      const apiRawText = await fetchTextWithRetry(buildEmallsApiSearchUrl(), {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "x-requested-with": "XMLHttpRequest"
        },
        body: buildEmallsApiSearchBody(query)
      });
      const apiPayload = safeParseJson(apiRawText);
      const apiCandidates = extractEmallsApiResults(apiPayload).map(normalizeEmallsCandidate);

      let htmlCandidates = [];
      if (!apiCandidates.length || !apiCandidates.some((candidate) => hasMeaningfulValue(candidate?.priceText || candidate?.price))) {
        try {
          const html = await fetchTextWithRetry(globalThis.DirobNormalize.buildEmallsSearchUrl(query));
          htmlCandidates = extractEmallsSearchCandidatesFromHtml(html);
        } catch (htmlError) {
          if (!isRecoverableProviderFetchError(htmlError)) {
            throw htmlError;
          }
          addLog("warn", "background", "provider_search_partial_fallback", {
            sourceId: item.sourceId,
            targetSite: "emalls",
            query,
            stage: "search_html",
            reason: htmlError?.message || "request_failed"
          });
        }
      }

      const mergedCandidates = mergeCandidatesByTargetUrl(apiCandidates, htmlCandidates);
      if (!mergedCandidates.length) {
        return buildProviderSearchFallbackResult(item, query, "emalls", "no_results");
      }

      const ranked = globalThis.DirobMatch.rankCandidates(item, mergedCandidates.slice(0, 18));
      const classification = globalThis.DirobMatch.classifyTopCandidate(ranked);
      const top = ranked[0] || null;
      const topWithPrice = ranked.find((candidate) => hasMeaningfulValue(candidate?.priceText || candidate?.price)) || top;
      const targetPriceValue =
        topWithPrice?.price ??
        globalThis.DirobNormalize.parsePriceValue(topWithPrice?.priceText || "");

      return {
        sourceSite: item.sourceSite,
        targetSite: "emalls",
        query,
        status: classification.status,
        confidence: top?.confidence ?? 0,
        matchedTitle: top?.title || null,
        targetPriceText: topWithPrice?.priceText || null,
        targetPriceValue: Number.isFinite(targetPriceValue) ? targetPriceValue : null,
        targetOriginalPriceText: null,
        targetOriginalPriceValue: null,
        targetDiscountPercent: null,
        targetUrl: top?.targetUrl || topWithPrice?.targetUrl || globalThis.DirobNormalize.buildEmallsSearchUrl(query),
        moreInfoUrl: null,
        sellerCount: null,
        reason: classification.reason,
        searchUrl: globalThis.DirobNormalize.buildEmallsSearchUrl(query),
        googleUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title),
        debug: debugEnabled
          ? {
              requestDurationMs: Date.now() - startedAt,
              topCandidates: ranked.slice(0, 5).map(serializeCandidateDebug),
              providerDebug: {
                apiCandidates: apiCandidates.length,
                htmlCandidates: htmlCandidates.length
              },
              sourceItem: item
            }
          : null
      };
    } catch (error) {
      if (!isRecoverableProviderFetchError(error)) {
        throw error;
      }
      addLog("warn", "background", "provider_search_fallback", {
        sourceId: item.sourceId,
        targetSite: "emalls",
        query,
        reason: error?.message || "request_failed"
      });
      return buildProviderSearchFallbackResult(item, query, "emalls", "network_unreachable");
    }
  }

  async function fetchAmazonMatch(item, query) {
    const startedAt = Date.now();
    const marketplaceQuery = await translateQueryForGlobalMarketplace(query, "amazon");
    const searchUrl = globalThis.DirobNormalize.buildAmazonSearchUrl(marketplaceQuery);
    let directCandidates = [];
    let proxyCandidates = [];
    let blockedByAntibot = false;
    let usedProxy = false;
    try {
      const html = await fetchTextWithRetry(searchUrl, {
        headers: {
          "accept-language": "en-US,en;q=0.9"
        }
      });
      blockedByAntibot = isAmazonBlockedResponse(html);
      if (!blockedByAntibot) {
        directCandidates = extractAmazonSearchCandidates(html).slice(0, 16);
      }
      if (!directCandidates.length) {
        usedProxy = true;
        try {
          const proxyText = await fetchMarketplaceProxyText(searchUrl, "amazon");
          proxyCandidates = extractAmazonSearchCandidatesFromMarkdown(proxyText).slice(0, 16);
        } catch (proxyError) {
          if (!isRecoverableProviderFetchError(proxyError)) {
            throw proxyError;
          }
          addLog("warn", "background", "marketplace_proxy_failed", {
            sourceId: item.sourceId,
            targetSite: "amazon",
            query: marketplaceQuery,
            reason: proxyError?.message || "request_failed"
          });
          proxyCandidates = [];
        }
      }
      const mergedCandidates = directCandidates.length ? directCandidates : proxyCandidates;
      if (!mergedCandidates.length) {
        return buildProviderSearchFallbackResult(
          item,
          marketplaceQuery,
          "amazon",
          blockedByAntibot ? "blocked_by_antibot" : "no_results"
        );
      }
      const ranked = globalThis.DirobMatch.rankCandidates(
        item,
        mergedCandidates.slice(0, 12)
      );
      const classification = globalThis.DirobMatch.classifyTopCandidate(ranked);
      const top = ranked[0] || null;
      const topWithPrice = ranked.find((candidate) => hasMeaningfulValue(candidate?.priceText || candidate?.price)) || top;
      const targetPriceValue =
        topWithPrice?.price ??
        globalThis.DirobNormalize.parsePriceValue(topWithPrice?.priceText || "");

      addLog("debug", "background", "marketplace_candidates_resolved", {
        sourceId: item.sourceId,
        targetSite: "amazon",
        query: marketplaceQuery,
        directCandidates: directCandidates.length,
        proxyCandidates: proxyCandidates.length,
        blockedByAntibot,
        usedProxy
      });

      return {
        sourceSite: item.sourceSite,
        targetSite: "amazon",
        query: marketplaceQuery,
        status: classification.status,
        confidence: top?.confidence ?? 0,
        matchedTitle: top?.title || null,
        targetPriceText: topWithPrice?.priceText || null,
        targetPriceValue: Number.isFinite(targetPriceValue) ? targetPriceValue : null,
        targetOriginalPriceText: null,
        targetOriginalPriceValue: null,
        targetDiscountPercent: null,
        targetUrl: top?.targetUrl || searchUrl,
        moreInfoUrl: null,
        sellerCount: null,
        reason: classification.reason,
        searchUrl,
        googleUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title),
        debug: debugEnabled
          ? {
            requestDurationMs: Date.now() - startedAt,
            topCandidates: ranked.slice(0, 5).map(serializeCandidateDebug),
            providerDebug: {
              directCandidates: directCandidates.length,
              proxyCandidates: proxyCandidates.length,
              blockedByAntibot,
              usedProxy
            },
            sourceItem: item
          }
        : null
      };
    } catch (error) {
      if (!isRecoverableProviderFetchError(error)) {
        throw error;
      }
      addLog("warn", "background", "provider_search_fallback", {
        sourceId: item.sourceId,
        targetSite: "amazon",
        query: marketplaceQuery,
        reason: error?.message || "request_failed"
      });
      return buildProviderSearchFallbackResult(item, marketplaceQuery, "amazon", "network_unreachable");
    }
  }

  async function fetchEbayMatch(item, query) {
    const startedAt = Date.now();
    const marketplaceQuery = await translateQueryForGlobalMarketplace(query, "ebay");
    const searchUrl = globalThis.DirobNormalize.buildEbaySearchUrl(marketplaceQuery);
    let directCandidates = [];
    let proxyCandidates = [];
    let blockedByAntibot = false;
    let usedProxy = false;
    try {
      const html = await fetchTextWithRetry(searchUrl, {
        headers: {
          "accept-language": "en-US,en;q=0.9"
        }
      });
      blockedByAntibot = isEbayBlockedResponse(html);
      if (!blockedByAntibot) {
        directCandidates = extractEbaySearchCandidates(html).slice(0, 20);
      }
      if (!directCandidates.length) {
        usedProxy = true;
        try {
          const proxyText = await fetchMarketplaceProxyText(searchUrl, "ebay");
          proxyCandidates = extractEbaySearchCandidatesFromMarkdown(proxyText).slice(0, 20);
        } catch (proxyError) {
          if (!isRecoverableProviderFetchError(proxyError)) {
            throw proxyError;
          }
          addLog("warn", "background", "marketplace_proxy_failed", {
            sourceId: item.sourceId,
            targetSite: "ebay",
            query: marketplaceQuery,
            reason: proxyError?.message || "request_failed"
          });
          proxyCandidates = [];
        }
      }

      const mergedCandidates = directCandidates.length ? directCandidates : proxyCandidates;
      if (!mergedCandidates.length) {
        return buildProviderSearchFallbackResult(
          item,
          marketplaceQuery,
          "ebay",
          blockedByAntibot ? "blocked_by_antibot" : "no_results"
        );
      }

      const ranked = globalThis.DirobMatch.rankCandidates(item, mergedCandidates.slice(0, 12));
      const classification = globalThis.DirobMatch.classifyTopCandidate(ranked);
      const top = ranked[0] || null;
      const topWithPrice = ranked.find((candidate) => hasMeaningfulValue(candidate?.priceText || candidate?.price)) || top;
      const targetPriceValue =
        topWithPrice?.price ??
        globalThis.DirobNormalize.parsePriceValue(topWithPrice?.priceText || "");

      addLog("debug", "background", "marketplace_candidates_resolved", {
        sourceId: item.sourceId,
        targetSite: "ebay",
        query: marketplaceQuery,
        directCandidates: directCandidates.length,
        proxyCandidates: proxyCandidates.length,
        blockedByAntibot,
        usedProxy
      });

      return {
        sourceSite: item.sourceSite,
        targetSite: "ebay",
        query: marketplaceQuery,
        status: classification.status,
        confidence: top?.confidence ?? 0,
        matchedTitle: top?.title || null,
        targetPriceText: topWithPrice?.priceText || null,
        targetPriceValue: Number.isFinite(targetPriceValue) ? targetPriceValue : null,
        targetOriginalPriceText: null,
        targetOriginalPriceValue: null,
        targetDiscountPercent: null,
        targetUrl: top?.targetUrl || searchUrl,
        moreInfoUrl: null,
        sellerCount: null,
        reason: classification.reason,
        searchUrl,
        googleUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title),
        debug: debugEnabled
          ? {
            requestDurationMs: Date.now() - startedAt,
            topCandidates: ranked.slice(0, 5).map(serializeCandidateDebug),
            providerDebug: {
              directCandidates: directCandidates.length,
              proxyCandidates: proxyCandidates.length,
              blockedByAntibot,
              usedProxy
            },
            sourceItem: item
          }
        : null
      };
    } catch (error) {
      if (!isRecoverableProviderFetchError(error)) {
        throw error;
      }
      addLog("warn", "background", "provider_search_fallback", {
        sourceId: item.sourceId,
        targetSite: "ebay",
        query: marketplaceQuery,
        reason: error?.message || "request_failed"
      });
      return buildProviderSearchFallbackResult(item, marketplaceQuery, "ebay", "network_unreachable");
    }
  }

  async function fetchMatchByTargetSite(targetSite, item, query) {
    if (targetSite === "torob") {
      return fetchTorobMatch(item, query);
    }
    if (targetSite === "digikala") {
      return fetchDigikalaMatch(item, query);
    }
    if (targetSite === "technolife") {
      return fetchTechnolifeMatch(item, query);
    }
    if (targetSite === "emalls") {
      return fetchEmallsMatch(item, query);
    }
    if (targetSite === "amazon") {
      return fetchAmazonMatch(item, query);
    }
    if (targetSite === "ebay") {
      return fetchEbayMatch(item, query);
    }
    throw new Error(`unsupported_target_site:${targetSite}`);
  }

  function pickBetterResult(primaryResult, candidateResult) {
    if (!candidateResult) {
      return primaryResult;
    }
    if (!primaryResult) {
      return candidateResult;
    }

    const scoreByStatus = {
      matched: 3,
      low_confidence: 2,
      not_found: 1,
      error: 0
    };
    const primaryStatusScore = scoreByStatus[primaryResult.status] ?? -1;
    const candidateStatusScore = scoreByStatus[candidateResult.status] ?? -1;

    if (candidateStatusScore > primaryStatusScore) {
      return candidateResult;
    }
    if (candidateStatusScore < primaryStatusScore) {
      return primaryResult;
    }

    const primaryConfidence = Number(primaryResult.confidence || 0);
    const candidateConfidence = Number(candidateResult.confidence || 0);
    if (candidateConfidence > primaryConfidence + 0.03) {
      return candidateResult;
    }

    return primaryResult;
  }

  async function fetchTechnolifeMatch(item, query) {
    const startedAt = Date.now();
    let buildId = await getTechnolifeBuildId();
    let searchPayload;
    try {
      searchPayload = await fetchJsonWithRetry(buildTechnolifeApiSearchUrl(buildId, query));
    } catch (error) {
      const message = String(error?.message || "");
      const shouldRefreshBuildId = message === "http_404" || message === "technolife_build_id_missing";
      if (!shouldRefreshBuildId) {
        throw error;
      }
      addLog("warn", "background", "technolife_build_id_refresh_retry", {
        sourceId: item.sourceId,
        query,
        previousBuildId: buildId,
        error: serializeError(error)
      });
      buildId = await getTechnolifeBuildId({ force: true });
      searchPayload = await fetchJsonWithRetry(buildTechnolifeApiSearchUrl(buildId, query));
    }
    const results = extractTechnolifeSearchResults(searchPayload);
    const ranked = globalThis.DirobMatch.rankCandidates(
      item,
      results.slice(0, 12).map(normalizeTechnolifeCandidate)
    );
    const classification = globalThis.DirobMatch.classifyTopCandidate(ranked);
    const top = ranked[0] || null;

    return {
      sourceSite: item.sourceSite,
      targetSite: "technolife",
      query,
      status: classification.status,
      confidence: top?.confidence ?? 0,
      matchedTitle: top?.title || null,
      targetPriceText: top?.priceText || null,
      targetPriceValue: top?.priceValue || null,
      targetOriginalPriceText: null,
      targetOriginalPriceValue: null,
      targetDiscountPercent: null,
      targetUrl: top?.targetUrl || globalThis.DirobNormalize.buildTechnolifeSearchUrl(query),
      moreInfoUrl: null,
      sellerCount: null,
      reason: classification.reason,
      searchUrl: globalThis.DirobNormalize.buildTechnolifeSearchUrl(query),
      googleUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title),
      debug: debugEnabled
        ? {
            requestDurationMs: Date.now() - startedAt,
            topCandidates: ranked.slice(0, 5).map(serializeCandidateDebug),
            sourceItem: item
          }
        : null
    };
  }

  function extractTechnolifeSearchResults(payload) {
    const queries = payload?.pageProps?.dehydratedState?.queries;
    if (!Array.isArray(queries)) {
      return [];
    }

    for (const queryEntry of queries) {
      const queryKey = queryEntry?.queryKey || queryEntry?.state?.queryKey;
      const queryName = queryKey?.[1]?.query?.__name;
      if (queryName !== "search_page_results") {
        continue;
      }
      const data = queryEntry?.state?.data || {};
      if (Array.isArray(data?.pages?.[0]?.results)) {
        return data.pages[0].results;
      }
      if (Array.isArray(data?.results)) {
        return data.results;
      }
    }

    return [];
  }

  function normalizeTechnolifeCandidate(product) {
    const title = globalThis.DirobNormalize.cleanProductTitle(product?.name || "");
    const code = String(product?.code || "");
    const productIdMatch = code.match(/^TLP-(\d+)$/i);
    const productId = productIdMatch ? productIdMatch[1] : null;
    const rawPrice = product?.discounted_price || product?.normal_price || null;
    const priceValue = globalThis.DirobNormalize.normalizePriceUnit(rawPrice, "toman");
    const targetUrl = productId
      ? `https://www.technolife.com/product-${productId}`
      : globalThis.DirobNormalize.buildTechnolifeSearchUrl(title || code);

    return {
      title,
      price: priceValue,
      priceText: priceValue ? formatPrice(priceValue) : "نامشخص",
      targetSite: "technolife",
      targetUrl,
      site: "technolife",
      code
    };
  }

  function normalizeEmallsCandidate(item) {
    const rawTitle = String(item?.title || "").replace(/<[^>]*>/g, " ");
    const title = globalThis.DirobNormalize
      .cleanProductTitle(rawTitle)
      .replace(/\s+در\s+دسته\s+.*$/u, "")
      .trim();
    const rawPrice = item?.price || item?.priceText || item?.pprice || null;
    const normalizedPriceText = sanitizeHtmlText(rawPrice || "");
    const priceValue = globalThis.DirobNormalize.parsePriceValue(normalizedPriceText || "");
    const targetUrl =
      globalThis.DirobNormalize.canonicalizeUrl(item?.link || "", "https://emalls.ir") ||
      globalThis.DirobNormalize.buildEmallsSearchUrl(title || rawTitle);

    return {
      title,
      price: priceValue,
      priceText: normalizedPriceText || (priceValue ? formatPrice(priceValue) : null),
      targetSite: "emalls",
      targetUrl,
      site: "emalls"
    };
  }

  function safeParseJson(rawText) {
    const normalized = String(rawText || "").trim();
    if (!normalized) {
      return null;
    }
    try {
      return JSON.parse(normalized);
    } catch (_error) {
      return null;
    }
  }

  function extractEmallsApiResults(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (!payload || typeof payload !== "object") {
      return [];
    }
    if (Array.isArray(payload?.lstsearchresualt)) {
      return payload.lstsearchresualt;
    }
    if (Array.isArray(payload?.data?.lstsearchresualt)) {
      return payload.data.lstsearchresualt;
    }
    if (Array.isArray(payload?.results)) {
      return payload.results;
    }
    return [];
  }

  function extractEmallsSearchCandidatesFromHtml(html) {
    const text = String(html || "");
    if (!text) {
      return [];
    }

    const candidates = [];
    const seenKeys = new Set();
    const linkRegex = /<a[^>]*class=["'][^"']*prd-name[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let linkMatch;

    while ((linkMatch = linkRegex.exec(text)) && candidates.length < 40) {
      const rawUrl = decodeHtmlEntities(linkMatch[1] || "");
      const targetUrl = globalThis.DirobNormalize.canonicalizeUrl(rawUrl, "https://emalls.ir");
      if (!targetUrl) {
        continue;
      }
      const title = globalThis.DirobNormalize.cleanProductTitle(sanitizeHtmlText(linkMatch[2] || ""));
      if (!title) {
        continue;
      }

      const dedupeKey = `${targetUrl}|${title.toLowerCase()}`;
      if (seenKeys.has(dedupeKey)) {
        continue;
      }
      seenKeys.add(dedupeKey);

      const context = text.slice(Math.max(0, linkMatch.index), Math.min(text.length, linkMatch.index + 2500));
      const priceMatch =
        context.match(/<div[^>]*class=["'][^"']*prd-price[^"']*["'][^>]*>\s*(?:<span[^>]*>)?\s*([^<]+?)(?:<\/span>|<\/div>)/i) ||
        context.match(/class=["'][^"']*item-price[^"']*["'][^>]*>\s*([^<]{2,80})/i);
      const rawPriceText = sanitizeHtmlText(priceMatch?.[1] || "");
      const priceValue = globalThis.DirobNormalize.parsePriceValue(rawPriceText || "");
      const priceText = rawPriceText || (priceValue ? formatPrice(priceValue) : null);

      candidates.push({
        title,
        price: priceValue,
        priceText,
        targetSite: "emalls",
        targetUrl,
        site: "emalls"
      });
    }

    return candidates;
  }

  function mergeCandidatesByTargetUrl(primaryCandidates, secondaryCandidates) {
    const merged = [];
    const seen = new Set();
    const append = (candidate) => {
      if (!candidate || !candidate.targetUrl || !candidate.title) {
        return;
      }
      const key = `${candidate.targetUrl}|${candidate.title.toLowerCase()}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      merged.push(candidate);
    };
    (primaryCandidates || []).forEach(append);
    (secondaryCandidates || []).forEach(append);
    return merged;
  }

  function isAmazonBlockedResponse(html) {
    const normalized = String(html || "");
    return (
      /Sorry!\s*Something\s*went\s*wrong!/i.test(normalized) ||
      /automated access to Amazon data/i.test(normalized) ||
      /api-services-support@amazon\.com/i.test(normalized)
    );
  }

  function isEbayBlockedResponse(html) {
    const normalized = String(html || "");
    return (
      /Pardon Our Interruption/i.test(normalized) ||
      /Checking your browser before you access eBay/i.test(normalized) ||
      /challenge-(?:v|t|g|q)[A-Za-z0-9_-]+\.js/i.test(normalized)
    );
  }

  function extractAmazonSearchCandidates(html) {
    const text = String(html || "");
    const candidates = [];
    const titleRegex = /<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/gi;
    let match;
    while ((match = titleRegex.exec(text)) && candidates.length < 16) {
      const href = match[1] || "";
      if (!href) {
        continue;
      }
      const targetUrl =
        globalThis.DirobNormalize.canonicalizeUrl(href, "https://www.amazon.com") ||
        `https://www.amazon.com${href.startsWith("/") ? href : `/${href}`}`;
      const title = sanitizeHtmlText(match[2]);
      if (!title) {
        continue;
      }
      const contextChunk = text.slice(match.index, Math.min(text.length, match.index + 4500));
      const priceMatch = contextChunk.match(/<span[^>]*class="a-offscreen"[^>]*>\s*([^<]+?)\s*<\/span>/i);
      const rawPrice = priceMatch ? sanitizeHtmlText(priceMatch[1]) : "";
      candidates.push({
        title,
        priceText: rawPrice || null,
        price: globalThis.DirobNormalize.parsePriceValue(rawPrice || ""),
        targetSite: "amazon",
        targetUrl,
        site: "amazon"
      });
    }
    return candidates;
  }

  function extractEbaySearchCandidates(html) {
    const text = String(html || "");
    const candidates = [];
    const itemRegex = /<li[^>]*class="[^"]*s-item[^"]*"[\s\S]*?<\/li>/gi;
    let match;
    while ((match = itemRegex.exec(text)) && candidates.length < 20) {
      const block = match[0] || "";
      const linkMatch = block.match(/class="[^"]*s-item__link[^"]*"[^>]*href="([^"]+)"/i);
      const titleMatch = block.match(/class="[^"]*s-item__title[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const priceMatch = block.match(/class="[^"]*s-item__price[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      if (!linkMatch?.[1] || !titleMatch?.[1]) {
        continue;
      }
      const title = sanitizeHtmlText(titleMatch[1]);
      if (!title || /shop on ebay/i.test(title)) {
        continue;
      }
      const targetUrl =
        globalThis.DirobNormalize.canonicalizeUrl(linkMatch[1], "https://www.ebay.com") || linkMatch[1];
      const rawPrice = priceMatch ? sanitizeHtmlText(priceMatch[1]) : "";
      candidates.push({
        title,
        priceText: rawPrice || null,
        price: globalThis.DirobNormalize.parsePriceValue(rawPrice || ""),
        targetSite: "ebay",
        targetUrl,
        site: "ebay"
      });
    }
    return candidates;
  }

  async function fetchMarketplaceProxyText(searchUrl, targetSite) {
    const proxyUrl = buildMarketplaceProxyUrl(searchUrl);
    if (!proxyUrl) {
      throw new Error("proxy_url_invalid");
    }
    const text = await fetchTextWithRetry(proxyUrl, {
      headers: {
        "accept-language": "en-US,en;q=0.9"
      }
    });
    addLog("debug", "background", "marketplace_proxy_used", {
      targetSite,
      searchUrl,
      proxyUrl
    });
    return text;
  }

  function buildMarketplaceProxyUrl(searchUrl) {
    const normalized = String(searchUrl || "").trim();
    if (!normalized) {
      return "";
    }
    return `${MARKETPLACE_PROXY_BASE_URL}${normalized.replace(/^https?:\/\//i, "")}`;
  }

  function extractAmazonSearchCandidatesFromMarkdown(markdown) {
    const text = String(markdown || "");
    const candidatesByKey = new Map();

    const titleRegex = /(?:^|\n)\[\s*##\s*([^\]\n]+)\]\((https?:\/\/(?:www\.)?amazon\.com\/[^\s)]+)\)/gim;
    let titleMatch;
    while ((titleMatch = titleRegex.exec(text)) && candidatesByKey.size < 32) {
      const rawTitle = sanitizeMarkdownText(titleMatch[1]);
      const rawUrl = titleMatch[2] || "";
      const targetUrl = globalThis.DirobNormalize.canonicalizeUrl(rawUrl, "https://www.amazon.com");
      const resultKey = extractAmazonResultKey(targetUrl);
      if (!rawTitle || !targetUrl || !resultKey) {
        continue;
      }
      candidatesByKey.set(resultKey, {
        title: rawTitle,
        priceText: null,
        price: null,
        targetSite: "amazon",
        targetUrl,
        site: "amazon"
      });
    }

    const priceRegex = /Price,\s*product page\[\s*(\$[0-9][0-9,]*(?:\.[0-9]{1,2})?)[^\]]*\]\((https?:\/\/(?:www\.)?amazon\.com\/[^\s)]+)\)/gi;
    let priceMatch;
    while ((priceMatch = priceRegex.exec(text))) {
      const priceText = extractUsdPriceText(priceMatch[1]);
      const targetUrl = globalThis.DirobNormalize.canonicalizeUrl(priceMatch[2] || "", "https://www.amazon.com");
      const resultKey = extractAmazonResultKey(targetUrl);
      if (!priceText || !resultKey) {
        continue;
      }
      const candidate = candidatesByKey.get(resultKey);
      if (candidate) {
        candidate.priceText = priceText;
        candidate.price = globalThis.DirobNormalize.parsePriceValue(priceText || "");
      }
    }

    return Array.from(candidatesByKey.values()).slice(0, 20);
  }

  function extractEbaySearchCandidatesFromMarkdown(markdown) {
    const text = String(markdown || "");
    const candidatesByKey = new Map();

    const itemRegex =
      /\[(?:New Listing\s+)?([^\]]+?)\s+Opens in a new window or tab\]\((https?:\/\/www\.ebay\.com\/itm\/[^\s)]+)\)([\s\S]{0,320}?)(\$[0-9][0-9,]*(?:\.[0-9]{1,2})?(?:\s*to\s*\$[0-9][0-9,]*(?:\.[0-9]{1,2})?)?)/gi;
    let match;
    while ((match = itemRegex.exec(text)) && candidatesByKey.size < 32) {
      const rawTitle = sanitizeMarkdownText(match[1]);
      const targetUrl = globalThis.DirobNormalize.canonicalizeUrl(match[2] || "", "https://www.ebay.com");
      const resultKey = extractEbayResultKey(targetUrl);
      const priceText = extractUsdPriceText(match[4]);
      if (!rawTitle || !targetUrl || !resultKey || !priceText) {
        continue;
      }
      if (/shop on ebay/i.test(rawTitle)) {
        continue;
      }
      candidatesByKey.set(resultKey, {
        title: rawTitle.replace(/^New Listing\s+/i, "").trim(),
        priceText,
        price: globalThis.DirobNormalize.parsePriceValue(priceText || ""),
        targetSite: "ebay",
        targetUrl,
        site: "ebay"
      });
    }

    return Array.from(candidatesByKey.values()).slice(0, 20);
  }

  function extractAmazonResultKey(url) {
    const normalized = String(url || "");
    const match = normalized.match(/\/(?:dp|gp\/aw\/d|gp\/product)\/([A-Z0-9]{10})/i);
    if (!match?.[1]) {
      return null;
    }
    return `asin:${match[1].toUpperCase()}`;
  }

  function extractEbayResultKey(url) {
    const normalized = String(url || "");
    const match = normalized.match(/\/itm\/(\d+)/i);
    if (!match?.[1]) {
      return null;
    }
    return `itm:${match[1]}`;
  }

  function extractUsdPriceText(value) {
    const normalized = String(value || "");
    const rangeMatch = normalized.match(
      /(\$[0-9][0-9,]*(?:\.[0-9]{1,2})?)(?:\s*to\s*(\$[0-9][0-9,]*(?:\.[0-9]{1,2})?))?/i
    );
    if (!rangeMatch?.[1]) {
      return null;
    }
    if (rangeMatch[2]) {
      return `${rangeMatch[1]} to ${rangeMatch[2]}`;
    }
    return rangeMatch[1];
  }

  function sanitizeMarkdownText(value) {
    return decodeHtmlEntities(String(value || ""))
      .replace(/[*_`~]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function sanitizeHtmlText(value) {
    const stripped = String(value || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ");
    return decodeHtmlEntities(stripped)
      .replace(/\s+/g, " ")
      .trim();
  }

  function decodeHtmlEntities(value) {
    return String(value || "")
      .replace(/&#(\d+);/g, (_match, code) => {
        const parsed = Number.parseInt(code, 10);
        return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
      })
      .replace(/&#x([0-9a-f]+);/gi, (_match, code) => {
        const parsed = Number.parseInt(code, 16);
        return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
      })
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">");
  }

  function normalizeDigikalaCandidate(product) {
    const priceInfo = product?.default_variant?.price || product?.price || {};
    const rawPrice = priceInfo?.selling_price || null;
    const rawOriginalPrice =
      priceInfo?.rrp_price ||
      priceInfo?.original_price ||
      priceInfo?.discounted_rrp_price ||
      null;
    const price = normalizeDigikalaApiPrice(rawPrice);
    const originalPrice = normalizeDigikalaApiPrice(rawOriginalPrice);
    const discountPercent =
      normalizeDiscountPercent(
        priceInfo?.discount_percent ||
          (Number.isFinite(price) && Number.isFinite(originalPrice) && originalPrice > price
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : null)
      );
    const title = product?.title_fa || product?.title_en || "";
    return {
      title,
      price,
      priceText: price ? formatPrice(price) : "نامشخص",
      originalPrice,
      originalPriceText: originalPrice ? formatPrice(originalPrice) : null,
      discountPercent,
      targetSite: "digikala",
      targetUrl: product?.id
        ? `https://www.digikala.com/product/dkp-${product.id}/`
        : globalThis.DirobNormalize.buildDigikalaSearchUrl(title),
      productUrl: product?.id
        ? `https://www.digikala.com/product/dkp-${product.id}/`
        : null,
      site: "digikala"
    };
  }

  function normalizeDigikalaSourceProduct(product, originalItem) {
    const candidate = normalizeDigikalaCandidate(product);
    const title = globalThis.DirobNormalize.cleanProductTitle(candidate.title || originalItem.title || "");
    return {
      ...originalItem,
      title: title || originalItem.title || "",
      displayPriceText: candidate.priceText || originalItem.displayPriceText || "",
      displayPriceValue: candidate.priceValue ?? originalItem.displayPriceValue ?? null,
      displayOriginalPriceText: candidate.originalPriceText || originalItem.displayOriginalPriceText || "",
      displayOriginalPriceValue: candidate.originalPriceValue ?? originalItem.displayOriginalPriceValue ?? null,
      displayDiscountPercent: candidate.discountPercent || originalItem.displayDiscountPercent || "",
      sourcePriceText: candidate.priceText || originalItem.sourcePriceText || "",
      sourcePriceValue: candidate.priceValue ?? originalItem.sourcePriceValue ?? null,
      sourceOriginalPriceText: candidate.originalPriceText || originalItem.sourceOriginalPriceText || "",
      sourceOriginalPriceValue: candidate.originalPriceValue ?? originalItem.sourceOriginalPriceValue ?? null,
      sourceDiscountPercent: candidate.discountPercent || originalItem.sourceDiscountPercent || "",
      sourcePriceStatus: candidate.priceValue ? "resolved" : "missing",
      sourcePriceResolver: candidate.priceValue ? "digikala_api_product" : "dom_fallback"
    };
  }

  function buildCleanMatchQuery(item) {
    const cleanedTitle = globalThis.DirobNormalize.cleanProductTitle(item?.title || "");
    const cleaned = globalThis.DirobNormalize.buildSearchQuery(cleanedTitle) || cleanedTitle || item?.title || "";
    return cleaned || item?.title || "";
  }

  function enrichSourceItem(item) {
    const next = {
      ...item
    };
    next.title = globalThis.DirobNormalize.cleanProductTitle(next.title || "");

    if (!hasMeaningfulValue(next.displayPriceText) && hasMeaningfulValue(next.sourcePriceText)) {
      next.displayPriceText = next.sourcePriceText;
    }
    if (!hasMeaningfulValue(next.displayPriceValue) && hasMeaningfulValue(next.sourcePriceValue)) {
      next.displayPriceValue = next.sourcePriceValue;
    }
    if (!hasMeaningfulValue(next.displayOriginalPriceText) && hasMeaningfulValue(next.sourceOriginalPriceText)) {
      next.displayOriginalPriceText = next.sourceOriginalPriceText;
    }
    if (!hasMeaningfulValue(next.displayOriginalPriceValue) && hasMeaningfulValue(next.sourceOriginalPriceValue)) {
      next.displayOriginalPriceValue = next.sourceOriginalPriceValue;
    }
    if (!hasMeaningfulValue(next.displayDiscountPercent) && hasMeaningfulValue(next.sourceDiscountPercent)) {
      next.displayDiscountPercent = next.sourceDiscountPercent;
    }

    next.sourcePriceStatus = hasMeaningfulValue(next.sourcePriceValue || next.sourcePriceText) ? "resolved" : "missing";
    next.sourcePriceResolver = next.sourcePriceResolver || (next.sourcePriceStatus === "resolved" ? "dom_or_structured" : "missing");
    return next;
  }

  function mergeSourceItems(previousItem, nextItem) {
    const merged = {
      ...previousItem,
      ...nextItem
    };
    const fieldsToPreserve = [
      "title",
      "imageUrl",
      "displayPriceText",
      "displayPriceValue",
      "displayOriginalPriceText",
      "displayOriginalPriceValue",
      "displayDiscountPercent",
      "sourcePriceText",
      "sourcePriceValue",
      "sourceOriginalPriceText",
      "sourceOriginalPriceValue",
      "sourceDiscountPercent"
    ];
    let preserved = false;

    for (const field of fieldsToPreserve) {
      if (hasMeaningfulValue(previousItem?.[field]) && !hasMeaningfulValue(nextItem?.[field])) {
        merged[field] = previousItem[field];
        preserved = true;
      }
    }

    if (preserved) {
      merged.sourcePriceResolver = previousItem?.sourcePriceResolver || merged.sourcePriceResolver;
      merged.sourcePriceStatus = previousItem?.sourcePriceStatus || merged.sourcePriceStatus;
      addLog("debug", "background", "source_price_preserved", {
        sourceId: merged.sourceId,
        sourcePriceResolver: merged.sourcePriceResolver || null
      });
    }

    return enrichSourceItem(merged);
  }

  function shouldResolveSourcePrice(item, pageMode) {
    if (item?.sourceSite !== "digikala") {
      return false;
    }
    if (pageMode === "detail") {
      return true;
    }
    return !hasMeaningfulValue(item?.sourcePriceValue || item?.sourcePriceText);
  }

  function hasMeaningfulValue(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) && value > 0;
    }
    if (typeof value === "string") {
      const normalized = String(value || "").trim();
      return normalized !== "" && normalized !== "نامشخص" && normalized.toLowerCase() !== "unknown";
    }
    return Boolean(value);
  }

  function serializeCandidateDebug(candidate) {
    return {
      title: candidate.title,
      confidence: candidate.confidence,
      reasons: candidate.reasons,
      priceText: candidate.priceText,
      targetUrl: candidate.targetUrl
    };
  }

  function formatPrice(value) {
    return globalThis.DirobNormalize.formatToman(value);
  }

  function normalizeDigikalaApiPrice(value) {
    return globalThis.DirobNormalize.normalizePriceUnit(value, "IRR");
  }

  function normalizeDiscountPercent(value) {
    const parsed = globalThis.DirobNormalize.parseDiscountPercent(value);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return globalThis.DirobNormalize.formatDiscountPercent(parsed);
  }

  function normalizeGuideNumber(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return Math.round(parsed);
  }

  function computeGuideDiagnostics(rows, itemKey = null) {
    const guideNumbers = [];
    const seenGuideNumbers = new Set();
    const seenSourceIds = new Set();
    let duplicateGuideCount = 0;
    let duplicateSourceCount = 0;

    for (const row of rows || []) {
      const item = itemKey ? row?.[itemKey] : row;
      const sourceId = String(item?.sourceId || "");
      if (sourceId) {
        if (seenSourceIds.has(sourceId)) {
          duplicateSourceCount += 1;
        } else {
          seenSourceIds.add(sourceId);
        }
      }

      const guideNumber = normalizeGuideNumber(item?.guideNumber);
      if (!Number.isFinite(guideNumber)) {
        continue;
      }
      guideNumbers.push(guideNumber);
      if (seenGuideNumbers.has(guideNumber)) {
        duplicateGuideCount += 1;
      } else {
        seenGuideNumbers.add(guideNumber);
      }
    }

    if (!guideNumbers.length) {
      return {
        count: 0,
        min: null,
        max: null,
        startsAtOne: false,
        isContiguous: false,
        duplicateGuideCount,
        duplicateSourceCount
      };
    }

    const sorted = [...guideNumbers].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    let isContiguous = true;
    for (let index = 1; index < sorted.length; index += 1) {
      if (sorted[index] === sorted[index - 1]) {
        continue;
      }
      if (sorted[index] !== sorted[index - 1] + 1) {
        isContiguous = false;
        break;
      }
    }

    return {
      count: sorted.length,
      min,
      max,
      startsAtOne: min === 1,
      isContiguous,
      duplicateGuideCount,
      duplicateSourceCount
    };
  }

  function clampFontScale(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return Math.max(-5, Math.min(5, Math.round(parsed)));
  }

  function findSourceIdByGuideNumber(state, guideNumber) {
    if (!state || !Number.isFinite(guideNumber)) {
      return null;
    }
    for (const row of state.rows.values()) {
      if (row.item?.guideNumber === guideNumber) {
        return row.item.sourceId;
      }
    }
    return null;
  }

  function parseSellerCount(value) {
    const parsed = globalThis.DirobNormalize.parsePriceValue(value);
    return parsed == null ? null : parsed;
  }

  function getTargetSites(sourceSite) {
    if (!PROVIDER_SITES.includes(sourceSite)) {
      return [];
    }
    return PROVIDER_SITES.filter((site) => site !== sourceSite);
  }

  function getEnabledTargetSitesForSource(sourceSite) {
    return getTargetSites(sourceSite).filter((site) => providerSearchEnabled[site] !== false);
  }

  function normalizeProviderSite(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return PROVIDER_SITES.includes(normalized) ? normalized : null;
  }

  function getDefaultProviderFlags() {
    return {
      torob: true,
      digikala: true,
      technolife: true,
      emalls: true,
      amazon: true,
      ebay: true
    };
  }

  function normalizeProviderFlags(value) {
    const defaults = getDefaultProviderFlags();
    const input = value && typeof value === "object" ? value : {};
    const output = {};
    for (const site of PROVIDER_SITES) {
      output[site] =
        Object.prototype.hasOwnProperty.call(input, site) ? Boolean(input[site]) : defaults[site];
    }
    return output;
  }

  function buildSearchUrlForSite(site, query) {
    if (site === "digikala") {
      return globalThis.DirobNormalize.buildDigikalaSearchUrl(query);
    }
    if (site === "technolife") {
      return globalThis.DirobNormalize.buildTechnolifeSearchUrl(query);
    }
    if (site === "emalls") {
      return globalThis.DirobNormalize.buildEmallsSearchUrl(query);
    }
    if (site === "amazon") {
      return globalThis.DirobNormalize.buildAmazonSearchUrl(query);
    }
    if (site === "ebay") {
      return globalThis.DirobNormalize.buildEbaySearchUrl(query);
    }
    return globalThis.DirobNormalize.buildTorobSearchUrl(query);
  }

  function buildTorobApiSearchUrl(query) {
    const url = new URL("https://api.torob.com/v4/base-product/search/");
    url.searchParams.set("page", "0");
    url.searchParams.set("sort", "popularity");
    url.searchParams.set("size", "8");
    url.searchParams.set("query", query);
    url.searchParams.set("q", query);
    url.searchParams.set("source", "next_desktop");
    return url.toString();
  }

  function buildDigikalaApiSearchUrl(query) {
    const url = new URL("https://api.digikala.com/v1/search/");
    url.searchParams.set("q", query);
    url.searchParams.set("page", "1");
    return url.toString();
  }

  function buildTechnolifeApiSearchUrl(buildId, query) {
    if (!buildId) {
      throw new Error("technolife_build_id_missing");
    }
    const url = new URL(`https://www.technolife.com/_next/data/${buildId}/product/list/search.json`);
    url.searchParams.set("keywords", query);
    return url.toString();
  }

  function buildEmallsApiSearchUrl() {
    return "https://emalls.ir/_Search.ashx";
  }

  function buildEmallsApiSearchBody(query) {
    const params = new URLSearchParams();
    params.set("find", query);
    params.set("cat", "0");
    params.set("entekhab", "Master");
    return params.toString();
  }

  async function translateQueryForGlobalMarketplace(query, targetSite) {
    const sourceQuery = String(query || "").trim();
    if (!sourceQuery) {
      return sourceQuery;
    }
    if (targetSite !== "amazon" && targetSite !== "ebay") {
      return sourceQuery;
    }
    if (!containsPersianOrArabicText(sourceQuery)) {
      return sourceQuery;
    }
    return translateQueryToEnglish(sourceQuery, targetSite);
  }

  async function translateQueryToEnglish(sourceQuery, targetSite) {
    const cacheKey = sourceQuery;
    const cached = queryTranslationCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.query;
    }

    const inFlight = inFlightQueryTranslations.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const heuristicQuery = buildMarketplaceFallbackEnglishQuery(sourceQuery);
    if (heuristicQuery !== sourceQuery && !containsPersianOrArabicText(heuristicQuery)) {
      queryTranslationCache.set(cacheKey, {
        query: heuristicQuery,
        expiresAt: Date.now() + QUERY_TRANSLATION_CACHE_TTL_MS
      });
      addLog("debug", "background", "marketplace_query_translated", {
        targetSite,
        sourceQuery,
        translatedQuery: heuristicQuery,
        strategy: "heuristic_local"
      });
      return heuristicQuery;
    }

    const promise = (async () => {
      try {
        const translated = await requestGoogleTranslationToEnglish(sourceQuery);
        const nextQuery = normalizeTranslatedQuery(translated, heuristicQuery || sourceQuery);
        queryTranslationCache.set(cacheKey, {
          query: nextQuery,
          expiresAt: Date.now() + QUERY_TRANSLATION_CACHE_TTL_MS
        });
        if (nextQuery !== sourceQuery) {
          addLog("debug", "background", "marketplace_query_translated", {
            targetSite,
            sourceQuery,
            translatedQuery: nextQuery,
            strategy: "google"
          });
        }
        return nextQuery;
      } catch (error) {
        const fallbackQuery = heuristicQuery || sourceQuery;
        if (fallbackQuery !== sourceQuery) {
          addLog("debug", "background", "marketplace_query_translated", {
            targetSite,
            sourceQuery,
            translatedQuery: fallbackQuery,
            strategy: "heuristic_fallback"
          });
        } else {
          addLog("warn", "background", "marketplace_query_translate_failed", {
            targetSite,
            sourceQuery,
            reason: error?.message || "request_failed"
          });
        }
        queryTranslationCache.set(cacheKey, {
          query: fallbackQuery,
          expiresAt:
            fallbackQuery === sourceQuery
              ? Date.now() + QUERY_TRANSLATION_FAILURE_CACHE_TTL_MS
              : Date.now() + QUERY_TRANSLATION_CACHE_TTL_MS
        });
        return fallbackQuery;
      } finally {
        inFlightQueryTranslations.delete(cacheKey);
      }
    })();

    inFlightQueryTranslations.set(cacheKey, promise);
    return promise;
  }

  async function requestGoogleTranslationToEnglish(sourceQuery) {
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "auto");
    url.searchParams.set("tl", "en");
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", sourceQuery);
    const payload = await fetchJsonWithRetry(url.toString());
    const translated = extractGoogleTranslatedText(payload);
    if (!translated) {
      throw new Error("translation_empty");
    }
    return translated;
  }

  function extractGoogleTranslatedText(payload) {
    if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
      return "";
    }
    return payload[0]
      .map((segment) => (Array.isArray(segment) ? String(segment[0] || "") : ""))
      .join("")
      .trim();
  }

  function normalizeTranslatedQuery(translatedQuery, fallbackQuery) {
    const normalized = String(translatedQuery || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!normalized) {
      return fallbackQuery;
    }
    return normalized;
  }

  function buildMarketplaceFallbackEnglishQuery(sourceQuery) {
    let normalized = globalThis.DirobNormalize.normalizeDigits(sourceQuery || "");
    normalized = String(normalized)
      .toLowerCase()
      .replace(/[\u200c\u200f]/gu, " ")
      .replace(/[|/\\()[\]{}،,:;؛"'`~!@#$%^&*_+=<>?-]/gu, " ");
    for (const [pattern, replacement] of MARKETPLACE_QUERY_REPLACEMENTS) {
      normalized = normalized.replace(pattern, ` ${replacement} `);
    }
    normalized = normalized
      .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!normalized) {
      return String(sourceQuery || "").trim();
    }
    return normalized;
  }

  function containsPersianOrArabicText(text) {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/u.test(String(text || ""));
  }

  function buildProviderSearchFallbackResult(item, query, targetSite, reason) {
    const searchUrl = buildSearchUrlForSite(targetSite, query);
    return {
      sourceSite: item.sourceSite,
      targetSite,
      query,
      status: "not_found",
      confidence: 0,
      matchedTitle: null,
      targetPriceText: null,
      targetPriceValue: null,
      targetOriginalPriceText: null,
      targetOriginalPriceValue: null,
      targetDiscountPercent: null,
      targetUrl: searchUrl,
      moreInfoUrl: null,
      sellerCount: null,
      reason,
      googleUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title),
      searchUrl
    };
  }

  function buildCredentialFallbackResult(item, query, targetSite, reason) {
    return buildProviderSearchFallbackResult(item, query, targetSite, reason);
  }

  function normalizeApiCredentialConfig(input) {
    return {
      clientId: typeof input?.clientId === "string" ? input.clientId.trim() : "",
      clientSecret: typeof input?.clientSecret === "string" ? input.clientSecret.trim() : "",
      version: typeof input?.version === "string" ? input.version.trim() : ""
    };
  }

  function hasApiCredentials(config) {
    return Boolean(config?.clientId && config?.clientSecret);
  }

  function hasAmazonApiCredentials(config) {
    return Boolean(config?.clientId && config?.clientSecret && config?.version);
  }

  async function getTechnolifeBuildId(options = {}) {
    const force = Boolean(options?.force);
    const now = Date.now();
    if (!force && technolifeBuildIdCache.value && technolifeBuildIdCache.expiresAt > now) {
      return technolifeBuildIdCache.value;
    }

    const html = await fetchTextWithRetry("https://www.technolife.com/");
    const match = html.match(/"buildId":"([^"]+)"/);
    if (!match?.[1]) {
      throw new Error("technolife_build_id_not_found");
    }
    technolifeBuildIdCache = {
      value: match[1],
      expiresAt: now + TECHNOLIFE_BUILD_ID_TTL_MS
    };
    return technolifeBuildIdCache.value;
  }

  async function fetchJsonWithRetry(url, options) {
    try {
      return await fetchJson(url, options);
    } catch (error) {
      if (error?.message === "timeout" || error?.message === "network_error" || shouldRetryHttpError(error)) {
        return fetchJson(url, options);
      }
      throw error;
    }
  }

  async function fetchTextWithRetry(url, options) {
    try {
      return await fetchText(url, options);
    } catch (error) {
      if (error?.message === "timeout" || error?.message === "network_error" || shouldRetryHttpError(error)) {
        return fetchText(url, options);
      }
      throw error;
    }
  }

  function shouldRetryHttpError(error) {
    const message = String(error?.message || "");
    return /^http_(429|5\d\d)$/.test(message);
  }

  function isRecoverableProviderFetchError(error) {
    const message = String(error?.message || "");
    return message === "network_error" || message === "timeout" || shouldRetryHttpError(error);
  }

  function hasRecoverableProviderErrors(matchResult, targetSites) {
    const normalizedSites = Array.isArray(targetSites)
      ? targetSites.map((site) => normalizeProviderSite(site)).filter(Boolean)
      : [];
    if (!normalizedSites.length) {
      return false;
    }
    const allResults =
      matchResult?.allResults && typeof matchResult.allResults === "object" ? matchResult.allResults : {};

    for (const site of normalizedSites) {
      const siteResult =
        allResults[site] || (matchResult?.targetSite === site ? matchResult : null);
      if (!siteResult || siteResult.status === "error") {
        return true;
      }
    }
    return false;
  }

  function serializeError(error) {
    if (!error) {
      return null;
    }
    if (typeof error === "string") {
      return { message: error };
    }
    return {
      name: error.name || null,
      message: error.message || String(error),
      code: error.code || null
    };
  }

  async function fetchText(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const requestOptions =
      options && typeof options === "object"
        ? {
            ...options,
            signal: controller.signal
          }
        : {
            signal: controller.signal
          };

    try {
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        throw new Error(`http_${response.status}`);
      }

      return await response.text();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("timeout");
      }
      if (error instanceof TypeError) {
        throw new Error("network_error");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function fetchJson(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const requestOptions =
      options && typeof options === "object"
        ? {
            ...options,
            signal: controller.signal
          }
        : {
            signal: controller.signal
          };

    try {
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        throw new Error(`http_${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("timeout");
      }
      if (error instanceof TypeError) {
        throw new Error("network_error");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function getPanelState() {
    const activeTab = await getActiveTab();
    const tabId = activeTab?.id;
    const state = tabId == null ? null : ensureTabState(tabId);
    if (tabId != null && state) {
      const urlSyncChanged = syncStateToTabUrl(tabId, activeTab?.url || "", "get_panel_state");
      if (urlSyncChanged && panelActive) {
        scheduleNavigationRescan(tabId);
      }
    }
    return {
      activeTabId: tabId || null,
      panelActive,
      debugEnabled,
      selectionModeEnabled,
      syncPageViewEnabled,
      guideNumbersEnabled,
      autoLogsEnabled,
      language: panelLanguage,
      fontScale: panelFontScale,
      layoutMode: panelLayoutMode,
      minimalViewEnabled,
      settingsOpen,
      themeMode,
      providerSearchEnabled: { ...providerSearchEnabled },
      providerPriceVisible: { ...providerPriceVisible },
      logCount: logEntries.length,
      logHelper: { ...logHelperStatus },
      page: serializePageState(state, activeTab)
    };
  }

  function syncStateToTabUrl(tabId, tabUrl, source) {
    if (tabId == null || !tabUrl) {
      return false;
    }
    const state = ensureTabState(tabId);
    const canonicalTabUrl = canonicalizeTrackedUrl(tabUrl);
    const canonicalStateUrl = canonicalizeTrackedUrl(state.pageUrl || "");

    if (!canonicalStateUrl) {
      state.pageUrl = canonicalTabUrl;
      state.site = inferSiteFromUrl(canonicalTabUrl);
      return false;
    }

    if (canonicalStateUrl === canonicalTabUrl) {
      return false;
    }

    const previousPageUrl = state.pageUrl || "";
    const previousPageKey = state.pageKey || "";
    resetPageState(state);
    state.pageKey = "";
    state.pageUrl = canonicalTabUrl;
    state.pageMode = "unsupported";
    state.isSupported = false;
    state.site = inferSiteFromUrl(canonicalTabUrl);
    addLog("info", "background", "navigation_fallback_sync", {
      tabId,
      source,
      previousPageUrl,
      nextPageUrl: canonicalTabUrl,
      previousPageKey: previousPageKey || null
    });
    return true;
  }

  function serializePageState(state, activeTab) {
    if (!state) {
      return {
        site: "unsupported",
        pageUrl: activeTab?.url || "",
        pageTitle: activeTab?.title || "",
        isSupported: false,
        items: []
      };
    }

    const items = Array.from(state.rows.values())
      .sort((left, right) => {
        const leftSection = left.item?.detailRole === "main" ? 0 : 1;
        const rightSection = right.item?.detailRole === "main" ? 0 : 1;
        if (leftSection !== rightSection) {
          return leftSection - rightSection;
        }
        const leftGuide = normalizeGuideNumber(left.item?.guideNumber) ?? Number.MAX_SAFE_INTEGER;
        const rightGuide = normalizeGuideNumber(right.item?.guideNumber) ?? Number.MAX_SAFE_INTEGER;
        if (leftGuide !== rightGuide) {
          return leftGuide - rightGuide;
        }
        return String(left.item?.sourceId || "").localeCompare(String(right.item?.sourceId || ""));
      })
      .map((row) => ({
        item: row.item,
        isVisible: row.isVisible,
        lastSeenAt: row.lastSeenAt,
        match: row.match,
        retryCountSource: row.retryCountSource || 0,
        retryCountMatch: row.retryCountMatch || 0,
        isLoading: Boolean(row.isLoading)
      }));

    const filteredItems =
      selectionModeEnabled && state.selectedSourceId
        ? items.filter((entry) => entry.item.sourceId === state.selectedSourceId)
        : items;

    return {
      site: state.site,
      pageUrl: state.pageUrl || activeTab?.url || "",
      pageTitle: state.pageTitle || activeTab?.title || "",
      isSupported: state.isSupported,
      mode: state.pageMode,
      selectedSourceId: state.selectedSourceId,
      activeGuideNumber: state.activeGuideNumber,
      activeSourceId: state.activeSourceId,
      panelFocusSourceId: state.panelFocusSourceId,
      panelFocusNonce: state.panelFocusNonce,
      hoverSourceId: state.hoverSourceId,
      items: filteredItems
    };
  }

  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    return tab || null;
  }

  async function reloadAllForActiveTab() {
    const activeTab = await getActiveTab();
    if (!activeTab?.id) {
      return { reloaded: 0 };
    }
    addLog("info", "background", "refresh_triggered", {
      tabId: activeTab.id,
      mode: "page"
    });
    const state = ensureTabState(activeTab.id);
    state.matchCache.clear();
    state.sourceCache.clear();
    let reloaded = 0;
    for (const row of state.rows.values()) {
      row.match = null;
      row.isLoading = false;
      row.retryCountMatch = 0;
      row.retryCountSource = 0;
      await resolveSourceData(activeTab.id, row.item.sourceId, state, {
        force: true
      });
      queueMatchRequest(activeTab.id, row.item, {
        bustCache: true
      }, state);
      reloaded += 1;
    }
    addLog("info", "background", "reload_all", {
      tabId: activeTab.id,
      reloaded
    });
    await softRescanTab(activeTab.id);
    addLog("info", "background", "refresh_completed", {
      tabId: activeTab.id,
      mode: "page",
      reloaded
    });
    notifyPanels();
    return { reloaded };
  }

  async function reloadSingleForActiveTab(sourceId) {
    const activeTab = await getActiveTab();
    if (!activeTab?.id || !sourceId) {
      return { reloaded: false };
    }
    addLog("info", "background", "refresh_triggered", {
      tabId: activeTab.id,
      mode: "item",
      sourceId
    });
    const state = ensureTabState(activeTab.id);
    const row = state.rows.get(sourceId);
    if (!row) {
      return { reloaded: false };
    }
    row.match = null;
    row.isLoading = false;
    row.retryCountMatch = 0;
    row.retryCountSource = 0;
    state.sourceCache.delete(sourceId);
    const normalizedQuery = globalThis.DirobNormalize.normalizeText(buildCleanMatchQuery(row.item));
    const queryPrefix = `${row.item.sourceSite}:`;
    for (const key of state.matchCache.keys()) {
      if (!String(key).startsWith(queryPrefix) || !String(key).endsWith(`:${normalizedQuery}`)) {
        continue;
      }
      state.matchCache.delete(key);
    }
    await resolveSourceData(activeTab.id, sourceId, state, {
      force: true
    });
    queueMatchRequest(activeTab.id, row.item, {
      bustCache: true
    }, state);
    addLog("info", "background", "reload_item", {
      tabId: activeTab.id,
      sourceId
    });
    await softRescanTab(activeTab.id);
    addLog("info", "background", "refresh_completed", {
      tabId: activeTab.id,
      mode: "item",
      sourceId
    });
    notifyPanels();
    return { reloaded: true };
  }

  async function rescanActiveTab() {
    const activeTab = await getActiveTab();
    if (!activeTab?.id) {
      return { rescanned: false };
    }
    await softRescanTab(activeTab.id);
    notifyPanels();
    return { rescanned: true };
  }

  async function softRescanTab(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "DIROB_SOFT_RESCAN"
      });
      addLog("info", "background", "soft_rescan", {
        tabId
      });
    } catch (error) {
      addLog("warn", "background", "soft_rescan_failed", {
        tabId,
        error
      });
    }
  }

  async function forceRescanTab(tabId) {
    const state = ensureTabState(tabId);
    resetPageState(state);
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "DIROB_FORCE_RESCAN"
      });
      addLog("info", "background", "force_rescan", {
        tabId
      });
    } catch (error) {
      addLog("warn", "background", "force_rescan_failed", {
        tabId,
        error
      });
    }
  }

  async function locateItemOnActiveTab(sourceId) {
    const activeTab = await getActiveTab();
    if (!activeTab?.id || !sourceId) {
      return { located: false };
    }

    try {
      await chrome.tabs.sendMessage(activeTab.id, {
        type: "DIROB_SCROLL_TO_ITEM",
        payload: { sourceId }
      });
      addLog("info", "background", "locate_item", {
        tabId: activeTab.id,
        sourceId
      });
      return { located: true };
    } catch (error) {
      addLog("warn", "background", "locate_item_failed", {
        tabId: activeTab.id,
        sourceId,
        error
      });
      return { located: false };
    }
  }

  async function clearLogs() {
    logEntries.splice(0, logEntries.length);
    pendingLogEntries.splice(0, pendingLogEntries.length);
    await chrome.storage.local.set({
      [LOG_STORAGE_KEY]: []
    });
    notifyPanels();
    return { cleared: true };
  }

  async function exportLogs() {
    const payload = {
      exportedAt: new Date().toISOString(),
      logs: logEntries
    };
    const dataUrl =
      "data:application/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(payload, null, 2));
    const filename = `dirob-logs-${Date.now()}.json`;
    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: true
    });
    addLog("info", "background", "logs_exported", {
      downloadId,
      filename
    });
    return {
      exported: true,
      downloadId,
      filename
    };
  }

  function addLog(level, scope, message, details) {
    if (!debugEnabled || !autoLogsEnabled) {
      return;
    }
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      scope,
      message,
      details: details || null
    };
    logEntries.push(entry);
    pendingLogEntries.push(entry);
    if (logEntries.length > MAX_LOG_ENTRIES) {
      logEntries.splice(0, logEntries.length - MAX_LOG_ENTRIES);
    }
    chrome.storage.local.set({
      [LOG_STORAGE_KEY]: logEntries
    }).catch(() => {});
    scheduleLogFlush();
  }

  async function setPanelActiveState(enabled, options = {}) {
    const next = Boolean(enabled);
    if (!options.force && panelActive === next) {
      return;
    }
    panelActive = next;
    await chrome.storage.local.set({
      dirobPanelActive: panelActive
    });
    addLog("info", "background", "panel_active_changed", {
      panelActive
    });
    if (panelActive && options.triggerRescan !== false) {
      const activeTab = await getActiveTab();
      if (activeTab?.id != null) {
        await forceRescanTab(activeTab.id);
      }
    }
    notifyPanels();
  }

  function notifyPanels() {
    chrome.runtime.sendMessage({
      type: "DIROB_PANEL_STATE_UPDATED"
    }).catch(() => {});
    scheduleStateFlush();
  }

  function scheduleLogFlush() {
    if (logFlushTimer) {
      return;
    }
    logFlushTimer = setTimeout(() => {
      logFlushTimer = null;
      flushLogsToHelper().catch(() => {});
    }, 350);
  }

  function scheduleStateFlush() {
    if (stateFlushTimer) {
      return;
    }
    stateFlushTimer = setTimeout(() => {
      stateFlushTimer = null;
      flushStateToHelper().catch(() => {});
    }, 500);
  }

  async function ensureLogHelperHealth() {
    try {
      const response = await fetch(`${LOG_HELPER_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`http_${response.status}`);
      }
      const payload = await response.json();
      logHelperStatus = {
        connected: true,
        lastCheckedAt: new Date().toISOString(),
        lastError: null,
        artifactDir: payload.artifact_dir || "research/artifacts/dirob",
        logPath: payload.log_path || "research/artifacts/dirob/dirob-live-log.ndjson",
        statePath: payload.state_path || "research/artifacts/dirob/dirob-state.json"
      };
      return true;
    } catch (error) {
      logHelperStatus = {
        ...logHelperStatus,
        connected: false,
        lastCheckedAt: new Date().toISOString(),
        lastError: error?.message || "helper_unreachable"
      };
      return false;
    }
  }

  async function flushLogsToHelper() {
    if (!pendingLogEntries.length) {
      return;
    }
    const batch = pendingLogEntries.splice(0, LOG_FLUSH_BATCH_SIZE);
    const healthy = await ensureLogHelperHealth();
    if (!healthy) {
      pendingLogEntries.unshift(...batch);
      return;
    }

    try {
      const response = await fetch(`${LOG_HELPER_BASE_URL}/append-log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          entries: batch
        })
      });
      if (!response.ok) {
        throw new Error(`http_${response.status}`);
      }
    } catch (error) {
      logHelperStatus = {
        ...logHelperStatus,
        connected: false,
        lastCheckedAt: new Date().toISOString(),
        lastError: error?.message || "log_flush_failed"
      };
      pendingLogEntries.unshift(...batch);
    }
  }

  async function flushStateToHelper() {
    const healthy = await ensureLogHelperHealth();
    if (!healthy) {
      return;
    }

    try {
      const payload = await buildHelperStatePayload();
      const response = await fetch(`${LOG_HELPER_BASE_URL}/write-state`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`http_${response.status}`);
      }
    } catch (error) {
      logHelperStatus = {
        ...logHelperStatus,
        connected: false,
        lastCheckedAt: new Date().toISOString(),
        lastError: error?.message || "state_flush_failed"
      };
    }
  }

  async function buildHelperStatePayload() {
    const activeTab = await getActiveTab();
    const activeState = activeTab?.id != null ? ensureTabState(activeTab.id) : null;
    const tabs = Array.from(tabStates.entries()).map(([tabId, state]) => ({
      tabId,
      site: state.site,
      pageUrl: state.pageUrl,
      pageKey: state.pageKey,
      pageMode: state.pageMode,
      selectedSourceId: state.selectedSourceId,
      activeGuideNumber: state.activeGuideNumber,
      activeSourceId: state.activeSourceId,
      panelFocusSourceId: state.panelFocusSourceId,
      hoverSourceId: state.hoverSourceId,
      items: Array.from(state.rows.values())
        .sort((left, right) => {
          const leftGuide = normalizeGuideNumber(left.item?.guideNumber) ?? Number.MAX_SAFE_INTEGER;
          const rightGuide = normalizeGuideNumber(right.item?.guideNumber) ?? Number.MAX_SAFE_INTEGER;
          if (leftGuide !== rightGuide) {
            return leftGuide - rightGuide;
          }
          return String(left.item?.sourceId || "").localeCompare(String(right.item?.sourceId || ""));
        })
        .map((row) => ({
          sourceId: row.item?.sourceId || "",
          guideNumber: row.item?.guideNumber ?? null,
          title: row.item?.title || "",
          sourceSite: row.item?.sourceSite || "",
          displayPriceText: row.item?.displayPriceText || "",
          displayOriginalPriceText: row.item?.displayOriginalPriceText || "",
          displayDiscountPercent: row.item?.displayDiscountPercent || "",
          isVisible: row.isVisible,
          isLoading: row.isLoading,
          retryCountSource: row.retryCountSource || 0,
          retryCountMatch: row.retryCountMatch || 0,
          sourcePriceResolver: row.item?.sourcePriceResolver || null,
          sourcePriceStatus: row.item?.sourcePriceStatus || null,
          matchStatus: row.match?.status || null,
          matchPriceText: row.match?.targetPriceText || null
        }))
    }));
    stateSnapshotSerial += 1;
    return {
      writtenAt: new Date().toISOString(),
      serial: stateSnapshotSerial,
      helper: logHelperStatus,
      settings: {
        debugEnabled,
        selectionModeEnabled,
        syncPageViewEnabled,
        guideNumbersEnabled,
        autoLogsEnabled,
        language: panelLanguage,
        fontScale: panelFontScale,
        layoutMode: panelLayoutMode,
        minimalViewEnabled,
        settingsOpen,
        themeMode,
        providerSearchEnabled: { ...providerSearchEnabled },
        providerPriceVisible: { ...providerPriceVisible }
      },
      activeTabId: activeTab?.id || null,
      activePage: activeState ? serializePageState(activeState, activeTab) : null,
      tabs
    };
  }
})();
