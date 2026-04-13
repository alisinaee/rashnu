importScripts("lib/logger.js", "lib/normalize.js", "lib/match.js");

(function () {
  "use strict";

  const CACHE_TTL_MS = 10 * 60 * 1000;
  const MATCH_ERROR_RETRY_INTERVAL_MS = 30 * 1000;
  const REQUEST_TIMEOUT_MS = 8000;
  const MAX_CONCURRENCY = 4;
  const MAX_LOG_ENTRIES = 500;
  const MAX_AUTO_RETRIES = 3;
  const LOG_STORAGE_KEY = "rashnuLogs";
  const LOG_HELPER_BASE_URL = "http://127.0.0.1:45173";
  const LOG_FLUSH_BATCH_SIZE = 20;
  const LOG_STORAGE_FLUSH_DEBOUNCE_MS = 350;
  const LOG_HELPER_REQUEST_TIMEOUT_MS = 1500;
  const LOG_HELPER_HEALTH_CACHE_MS = 5000;
  const LOG_HELPER_OFFLINE_RETRY_MS = 15000;
  const NAVIGATION_RESCAN_DEBOUNCE_MS = 220;
  const TECHNOLIFE_BUILD_ID_TTL_MS = 30 * 60 * 1000;
  const QUERY_TRANSLATION_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
  const QUERY_TRANSLATION_FAILURE_CACHE_TTL_MS = 5 * 60 * 1000;
  const MARKETPLACE_PROXY_BASE_URL = "https://r.jina.ai/http://";
  const ACTION_ICON_PATHS = {
    inactive: {
      16: "assets/extension-icons/icon-inactive-16.png",
      32: "assets/extension-icons/icon-inactive-32.png",
      48: "assets/extension-icons/icon-inactive-48.png"
    },
    active: {
      16: "assets/extension-icons/icon-active-16.png",
      32: "assets/extension-icons/icon-active-32.png",
      48: "assets/extension-icons/icon-active-48.png"
    }
  };
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
  const GLOBAL_SEARCH_USED_KEYWORDS = [
    "استوک",
    "used",
    "refurbished",
    "renewed",
    "open box",
    "اوپن باکس",
    "کارکرده",
    "دست دوم",
    "second hand",
    "secondhand",
    "preowned",
    "pre owned"
  ];
  const GLOBAL_SEARCH_INCLUDE_SUGGESTION_LIMIT = 10;
  const GLOBAL_SEARCH_EXCLUDE_SUGGESTION_LIMIT = 6;
  const GLOBAL_SEARCH_SUGGESTION_SAMPLE_LIMIT = 18;
  const AMAZON_API_CREDENTIALS_KEY = "rashnuAmazonApiCredentials";
  const EBAY_API_CREDENTIALS_KEY = "rashnuEbayApiCredentials";
  const inFlightQueries = new Map();
  const queuedQueries = new Map();
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
  let logPersistTimer = null;
  let logPersistPending = false;
  let stateFlushTimer = null;
  let logFlushInFlight = false;
  let stateFlushInFlight = false;
  let stateFlushQueued = false;
  let logHelperHealthPromise = null;
  let lastLogHelperHealthCheckMs = 0;
  let nextLogHelperRetryAt = 0;
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
    artifactDir: "research/artifacts/rashnu",
    logPath: "research/artifacts/rashnu/rashnu-live-log.ndjson",
    statePath: "research/artifacts/rashnu/rashnu-state.json"
  };

  initialize().catch(() => {});

  async function initialize() {
    await loadSettings();
    await syncActionIcon();
    await setPanelActiveState(false, { force: true, triggerRescan: false });
    await loadLogs();
    await ensureLogHelperHealth();
    if (chrome.sidePanel?.setPanelBehavior) {
      await chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: true
      }).catch(() => {});
    }
    addLog("info", "background", "initialized");
    await persistLogsToStorage(true);
  }

  async function loadSettings() {
    const stored = await chrome.storage.local.get([
      "rashnuDebugEnabled",
      "rashnuSelectionModeEnabled",
      "rashnuSyncPageViewEnabled",
      "rashnuGuideNumbersEnabled",
      "rashnuAutoLogsEnabled",
      "rashnuLanguage",
      "rashnuFontScale",
      "rashnuLayoutMode",
      "rashnuMinimalViewEnabled",
      "rashnuSettingsOpen",
      "rashnuThemeMode",
      "rashnuPanelActive",
      "rashnuProviderSearchEnabled",
      "rashnuProviderPriceVisible",
      AMAZON_API_CREDENTIALS_KEY,
      EBAY_API_CREDENTIALS_KEY
    ]);
    debugEnabled = Boolean(stored.rashnuDebugEnabled);
    selectionModeEnabled = Boolean(stored.rashnuSelectionModeEnabled);
    syncPageViewEnabled = Boolean(stored.rashnuSyncPageViewEnabled);
    guideNumbersEnabled = Boolean(stored.rashnuGuideNumbersEnabled);
    autoLogsEnabled = stored.rashnuAutoLogsEnabled !== false;
    panelLanguage = stored.rashnuLanguage || "fa";
    panelFontScale = clampFontScale(Number.isFinite(stored.rashnuFontScale) ? stored.rashnuFontScale : 0);
    panelLayoutMode = stored.rashnuLayoutMode === "grid" ? "grid" : "list";
    minimalViewEnabled = Boolean(stored.rashnuMinimalViewEnabled);
    settingsOpen = Boolean(stored.rashnuSettingsOpen);
    themeMode = ["system", "dark", "light"].includes(stored.rashnuThemeMode) ? stored.rashnuThemeMode : "system";
    panelActive = Boolean(stored.rashnuPanelActive);
    amazonApiCredentials = normalizeApiCredentialConfig(stored[AMAZON_API_CREDENTIALS_KEY]);
    ebayApiCredentials = normalizeApiCredentialConfig(stored[EBAY_API_CREDENTIALS_KEY]);
    providerSearchEnabled = normalizeProviderFlags(stored.rashnuProviderSearchEnabled);
    providerPriceVisible = normalizeProviderFlags(stored.rashnuProviderPriceVisible);
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
    if (Object.prototype.hasOwnProperty.call(changes, "rashnuDebugEnabled")) {
      debugEnabled = Boolean(changes.rashnuDebugEnabled.newValue);
    }
    if (Object.prototype.hasOwnProperty.call(changes, "rashnuSelectionModeEnabled")) {
      selectionModeEnabled = Boolean(changes.rashnuSelectionModeEnabled.newValue);
      addLog("info", "background", "selection_mode_changed", {
        enabled: selectionModeEnabled
      });
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "rashnuSyncPageViewEnabled")) {
      syncPageViewEnabled = Boolean(changes.rashnuSyncPageViewEnabled.newValue);
      addLog("info", "background", "sync_page_view_changed", {
        enabled: syncPageViewEnabled
      });
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "rashnuGuideNumbersEnabled")) {
      guideNumbersEnabled = Boolean(changes.rashnuGuideNumbersEnabled.newValue);
      addLog("info", "background", "guide_numbers_changed", {
        enabled: guideNumbersEnabled
      });
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "rashnuAutoLogsEnabled")) {
      autoLogsEnabled = changes.rashnuAutoLogsEnabled.newValue !== false;
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "rashnuLanguage")) {
      panelLanguage = changes.rashnuLanguage.newValue || "fa";
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "rashnuFontScale")) {
      const next = Number(changes.rashnuFontScale.newValue);
      panelFontScale = clampFontScale(Number.isFinite(next) ? next : 0);
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "rashnuLayoutMode")) {
      panelLayoutMode = changes.rashnuLayoutMode.newValue === "grid" ? "grid" : "list";
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "rashnuMinimalViewEnabled")) {
      minimalViewEnabled = Boolean(changes.rashnuMinimalViewEnabled.newValue);
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "rashnuSettingsOpen")) {
      settingsOpen = Boolean(changes.rashnuSettingsOpen.newValue);
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "rashnuThemeMode")) {
      themeMode = ["system", "dark", "light"].includes(changes.rashnuThemeMode.newValue)
        ? changes.rashnuThemeMode.newValue
        : "system";
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "rashnuPanelActive")) {
      panelActive = Boolean(changes.rashnuPanelActive.newValue);
      syncActionIcon().catch(() => {});
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, AMAZON_API_CREDENTIALS_KEY)) {
      amazonApiCredentials = normalizeApiCredentialConfig(changes[AMAZON_API_CREDENTIALS_KEY].newValue);
    }
    if (Object.prototype.hasOwnProperty.call(changes, EBAY_API_CREDENTIALS_KEY)) {
      ebayApiCredentials = normalizeApiCredentialConfig(changes[EBAY_API_CREDENTIALS_KEY].newValue);
    }
    if (Object.prototype.hasOwnProperty.call(changes, "rashnuProviderSearchEnabled")) {
      providerSearchEnabled = normalizeProviderFlags(changes.rashnuProviderSearchEnabled.newValue);
      notifyPanels();
    }
    if (Object.prototype.hasOwnProperty.call(changes, "rashnuProviderPriceVisible")) {
      providerPriceVisible = normalizeProviderFlags(changes.rashnuProviderPriceVisible.newValue);
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
    if (port?.name !== "rashnu-panel") {
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

    if (message.type === "RASHNU_PANEL_GET_STATE") {
      getPanelState().then(sendResponse);
      return true;
    }

    if (message.type === "RASHNU_OPEN_GLOBAL_SEARCH_TAB") {
      openGlobalSearchTab(message.payload || {}).then(sendResponse);
      return true;
    }

    if (message.type === "RASHNU_GLOBAL_SEARCH_TAB_OPENED") {
      const tabId = sender.tab?.id;
      const windowId = sender.tab?.windowId;
      if (tabId != null) {
        closeSidePanelForWindow(windowId ?? null, tabId)
          .then(() => disableSidePanelForTab(tabId))
          .then(() => sendResponse({ ok: true }))
          .catch(() => sendResponse({ ok: false }));
        return true;
      }
      sendResponse({ ok: false });
      return false;
    }

    if (message.type === "RASHNU_GLOBAL_SEARCH") {
      performGlobalSearch(message.payload).then(sendResponse);
      return true;
    }

    if (message.type === "RASHNU_LOG_EVENT") {
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

    if (message.type === "RASHNU_GET_LOGS") {
      sendResponse({
        logs: [...logEntries]
      });
      return false;
    }

    if (message.type === "RASHNU_CLEAR_LOGS") {
      clearLogs().then(sendResponse);
      return true;
    }

    if (message.type === "RASHNU_EXPORT_LOGS") {
      exportLogs().then(sendResponse);
      return true;
    }

    if (message.type === "RASHNU_SET_DEBUG") {
      const enabled = Boolean(message.payload?.enabled);
      debugEnabled = enabled;
      chrome.storage.local.set({ rashnuDebugEnabled: enabled });
       addLog("info", "background", "debug_changed", {
        enabled
      });
      notifyPanels();
      sendResponse({ enabled });
      return false;
    }

    if (message.type === "RASHNU_SET_SELECTION_MODE") {
      const enabled = Boolean(message.payload?.enabled);
      selectionModeEnabled = enabled;
      chrome.storage.local.set({ rashnuSelectionModeEnabled: enabled });
      addLog("info", "background", "selection_mode_changed", {
        enabled
      });
      notifyPanels();
      sendResponse({ enabled });
      return false;
    }

    if (message.type === "RASHNU_SET_AUTO_LOGS") {
      const enabled = Boolean(message.payload?.enabled);
      autoLogsEnabled = enabled;
      chrome.storage.local.set({
        rashnuAutoLogsEnabled: enabled
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

    if (message.type === "RASHNU_SET_SYNC_PAGE_VIEW") {
      const enabled = Boolean(message.payload?.enabled);
      syncPageViewEnabled = enabled;
      chrome.storage.local.set({
        rashnuSyncPageViewEnabled: enabled
      });
      addLog("info", "background", "sync_page_view_changed", {
        enabled
      });
      notifyPanels();
      sendResponse({ enabled });
      return false;
    }

    if (message.type === "RASHNU_SET_GUIDE_NUMBERS") {
      const enabled = Boolean(message.payload?.enabled);
      guideNumbersEnabled = enabled;
      chrome.storage.local.set({
        rashnuGuideNumbersEnabled: enabled
      });
      addLog("info", "background", "guide_numbers_changed", {
        enabled
      });
      notifyPanels();
      sendResponse({ enabled });
      return false;
    }

    if (message.type === "RASHNU_SET_LANGUAGE") {
      panelLanguage = message.payload?.language === "en" ? "en" : "fa";
      chrome.storage.local.set({
        rashnuLanguage: panelLanguage
      });
      notifyPanels();
      sendResponse({ language: panelLanguage });
      return false;
    }

    if (message.type === "RASHNU_ADJUST_FONT_SCALE") {
      const delta = Number(message.payload?.delta || 0);
      panelFontScale = clampFontScale(panelFontScale + delta);
      chrome.storage.local.set({
        rashnuFontScale: panelFontScale
      });
      notifyPanels();
      sendResponse({ fontScale: panelFontScale });
      return false;
    }

    if (message.type === "RASHNU_SET_LAYOUT_MODE") {
      panelLayoutMode = message.payload?.layoutMode === "grid" ? "grid" : "list";
      chrome.storage.local.set({
        rashnuLayoutMode: panelLayoutMode
      });
      notifyPanels();
      sendResponse({ layoutMode: panelLayoutMode });
      return false;
    }

    if (message.type === "RASHNU_SET_MINIMAL_VIEW") {
      minimalViewEnabled = Boolean(message.payload?.enabled);
      chrome.storage.local.set({
        rashnuMinimalViewEnabled: minimalViewEnabled
      });
      notifyPanels();
      sendResponse({ enabled: minimalViewEnabled });
      return false;
    }

    if (message.type === "RASHNU_SET_SETTINGS_OPEN") {
      settingsOpen = Boolean(message.payload?.enabled);
      chrome.storage.local.set({
        rashnuSettingsOpen: settingsOpen
      });
      notifyPanels();
      sendResponse({ enabled: settingsOpen });
      return false;
    }

    if (message.type === "RASHNU_SET_THEME_MODE") {
      themeMode = ["system", "dark", "light"].includes(message.payload?.themeMode)
        ? message.payload.themeMode
        : "system";
      chrome.storage.local.set({
        rashnuThemeMode: themeMode
      });
      notifyPanels();
      sendResponse({ themeMode });
      return false;
    }

    if (message.type === "RASHNU_SET_PROVIDER_SEARCH") {
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
        rashnuProviderSearchEnabled: providerSearchEnabled
      });
      refreshMatchesForEnabledProviders().catch(() => {});
      notifyPanels();
      sendResponse({ ok: true, providerSearchEnabled });
      return false;
    }

    if (message.type === "RASHNU_SET_PROVIDER_PRICE") {
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
        rashnuProviderPriceVisible: providerPriceVisible
      });
      notifyPanels();
      sendResponse({ ok: true, providerPriceVisible });
      return false;
    }

    if (message.type === "RASHNU_PAGE_CONTEXT") {
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

    if (message.type === "RASHNU_SYNC_ITEMS") {
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

    if (message.type === "RASHNU_ITEM_FOCUS") {
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

    if (message.type === "RASHNU_RELOAD_ALL") {
      reloadAllForActiveTab().then(sendResponse);
      return true;
    }

    if (message.type === "RASHNU_RELOAD_ITEM") {
      reloadSingleForActiveTab(message.payload?.sourceId).then(sendResponse);
      return true;
    }

    if (message.type === "RASHNU_LOCATE_ITEM") {
      locateItemOnActiveTab(message.payload?.sourceId).then(sendResponse);
      return true;
    }

    if (message.type === "RASHNU_GUIDE_BADGE_HOVER") {
      const tabId = sender.tab?.id;
      if (tabId != null) {
        const state = ensureTabState(tabId);
        state.hoverSourceId = message.payload?.sourceId || null;
        notifyPanels();
      }
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === "RASHNU_GUIDE_BADGE_CLICK") {
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

    if (message.type === "RASHNU_RESCAN_ACTIVE_TAB") {
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
    return globalThis.RashnuNormalize.canonicalizeUrl(url, url) || url;
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
    const queryKey = `${item.sourceSite}:${targetSites.join(",")}:${globalThis.RashnuNormalize.normalizeText(query)}`;

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
            googleUrl: globalThis.RashnuNormalize.buildGoogleSearchUrl(item.title),
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
          googleUrl: globalThis.RashnuNormalize.buildGoogleSearchUrl(item.title),
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

    const queued = queuedQueries.get(queryKey);
    if (queued) {
      queued.listeners.push({ tabId, sourceId: item.sourceId, item });
      return;
    }

    const job = {
      tabId,
      item,
      query,
      queryKey,
      targetSite,
      fallbackSites,
      isManual,
      pageKey: state.pageKey,
      listeners: [{ tabId, sourceId: item.sourceId, item }]
    };
    queue.push(job);
    queuedQueries.set(queryKey, job);
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
      if (job?.queryKey) {
        queuedQueries.delete(job.queryKey);
      }
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
    const listeners =
      Array.isArray(job?.listeners) && job.listeners.length
        ? [...job.listeners]
        : [{ tabId: job.tabId, sourceId: job.item.sourceId, item: job.item }];
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
      googleUrl: globalThis.RashnuNormalize.buildGoogleSearchUrl(item.title),
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
      targetUrl: globalThis.RashnuNormalize.buildGoogleSearchUrl(item.title),
      moreInfoUrl: null,
      sellerCount: null,
      reason: "provider_search_disabled",
      googleUrl: globalThis.RashnuNormalize.buildGoogleSearchUrl(item.title),
      searchUrl: globalThis.RashnuNormalize.buildGoogleSearchUrl(item.title)
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
        : globalThis.RashnuNormalize.extractProductIdFromUrl(item.productUrl || "");
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

  function buildGlobalSearchQuery(value) {
    const rawQuery = String(value || "").trim();
    if (!rawQuery) {
      return "";
    }
    const normalized =
      globalThis.RashnuNormalize.buildSearchQuery(rawQuery) ||
      globalThis.RashnuNormalize.cleanProductTitle(rawQuery) ||
      rawQuery;
    return globalThis.RashnuNormalize.normalizeWhitespace(normalized);
  }

  function buildGlobalSearchProbeItem(query) {
    return {
      sourceId: `global:${globalThis.RashnuNormalize.normalizeText(query)}`,
      sourceSite: "global",
      title: query,
      brand: globalThis.RashnuNormalize.inferBrand(query)
    };
  }

  function normalizeGlobalSearchProviders(value) {
    const input = Array.isArray(value) ? value : PROVIDER_SITES;
    const seen = new Set();
    const output = [];
    for (const site of input) {
      const normalized = normalizeProviderSite(site);
      if (!normalized || seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
      output.push(normalized);
    }
    return output;
  }

  function normalizeGlobalSearchTerms(value) {
    const input = Array.isArray(value) ? value : [];
    const output = [];
    const seen = new Set();
    for (const entry of input) {
      const cleaned = globalThis.RashnuNormalize.normalizeWhitespace(
        globalThis.RashnuNormalize.cleanProductTitle(entry) || entry
      );
      const comparable = globalThis.RashnuNormalize.normalizeText(cleaned);
      if (!cleaned || !comparable || seen.has(comparable)) {
        continue;
      }
      seen.add(comparable);
      output.push(cleaned);
    }
    return output;
  }

  function normalizeGlobalSearchConditionFilter(value) {
    return value === "new_only" || value === "used_only" ? value : "any";
  }

  function buildGlobalSearchControls(payload, query) {
    const includeTerms = normalizeGlobalSearchTerms(payload?.includeTerms);
    const excludeTerms = normalizeGlobalSearchTerms(payload?.excludeTerms);
    return {
      baseQuery: query,
      includeTerms,
      excludeTerms,
      includeComparableTerms: includeTerms.map((term) => globalThis.RashnuNormalize.normalizeText(term)),
      excludeComparableTerms: excludeTerms.map((term) => globalThis.RashnuNormalize.normalizeText(term)),
      conditionFilter: normalizeGlobalSearchConditionFilter(payload?.conditionFilter),
      dedupeEnabled: Boolean(payload?.dedupeEnabled)
    };
  }

  function serializeGlobalSearchQueryPlan(controls) {
    return {
      baseQuery: controls.baseQuery,
      includeTerms: [...controls.includeTerms],
      excludeTerms: [...controls.excludeTerms],
      conditionFilter: controls.conditionFilter
    };
  }

  function normalizeGlobalSearchComparableTitle(value) {
    const cleaned = globalThis.RashnuNormalize.cleanProductTitle(value) || value;
    return globalThis.RashnuNormalize.normalizeText(cleaned);
  }

  function hasUsedConditionTerm(title) {
    const comparableTitle = normalizeGlobalSearchComparableTitle(title);
    if (!comparableTitle) {
      return false;
    }
    return GLOBAL_SEARCH_USED_KEYWORDS.some((keyword) =>
      comparableTitle.includes(globalThis.RashnuNormalize.normalizeText(keyword))
    );
  }

  function candidateMatchesGlobalSearchControls(candidate, controls) {
    const comparableTitle = normalizeGlobalSearchComparableTitle(candidate?.title || "");
    if (!comparableTitle) {
      return false;
    }
    if (controls.includeComparableTerms.some((term) => !comparableTitle.includes(term))) {
      return false;
    }
    if (controls.excludeComparableTerms.some((term) => comparableTitle.includes(term))) {
      return false;
    }
    const hasUsedTerm = hasUsedConditionTerm(comparableTitle);
    if (controls.conditionFilter === "used_only" && !hasUsedTerm) {
      return false;
    }
    if (controls.conditionFilter === "new_only" && hasUsedTerm) {
      return false;
    }
    return true;
  }

  function dedupeGlobalSearchCandidates(provider, candidates) {
    const groups = [];
    for (const candidate of candidates) {
      const matchingGroup = groups.find((group) => areGlobalSearchCandidatesNearDuplicate(provider, group.representative, candidate));
      if (!matchingGroup) {
        groups.push({
          representative: {
            ...candidate,
            duplicateCount: 1,
            duplicateTitles: candidate?.title ? [candidate.title] : []
          }
        });
        continue;
      }
      matchingGroup.representative.duplicateCount += 1;
      if (candidate?.title && !matchingGroup.representative.duplicateTitles.includes(candidate.title)) {
        matchingGroup.representative.duplicateTitles.push(candidate.title);
      }
      if (Number(candidate?.confidence || 0) > Number(matchingGroup.representative?.confidence || 0)) {
        matchingGroup.representative = {
          ...candidate,
          duplicateCount: matchingGroup.representative.duplicateCount,
          duplicateTitles: matchingGroup.representative.duplicateTitles
        };
      }
    }
    return groups.map((group) => group.representative);
  }

  function areGlobalSearchCandidatesNearDuplicate(provider, leftCandidate, rightCandidate) {
    const leftUrl = globalThis.RashnuNormalize.canonicalizeUrl(leftCandidate?.targetUrl || "");
    const rightUrl = globalThis.RashnuNormalize.canonicalizeUrl(rightCandidate?.targetUrl || "");
    if (leftUrl && rightUrl && leftUrl === rightUrl) {
      return true;
    }

    const leftTitle = globalThis.RashnuNormalize.cleanProductTitle(leftCandidate?.title || "");
    const rightTitle = globalThis.RashnuNormalize.cleanProductTitle(rightCandidate?.title || "");
    const leftComparable = globalThis.RashnuNormalize.normalizeText(leftTitle);
    const rightComparable = globalThis.RashnuNormalize.normalizeText(rightTitle);
    if (!leftComparable || !rightComparable) {
      return false;
    }
    if (leftComparable === rightComparable) {
      return true;
    }
    if (leftComparable.includes(rightComparable) || rightComparable.includes(leftComparable)) {
      return true;
    }

    const leftSplit = globalThis.RashnuNormalize.splitTokens(leftTitle);
    const rightSplit = globalThis.RashnuNormalize.splitTokens(rightTitle);
    const leftText = new Set(globalThis.RashnuNormalize.filterMeaningfulTokens(leftSplit.textTokens));
    const rightText = new Set(globalThis.RashnuNormalize.filterMeaningfulTokens(rightSplit.textTokens));
    const leftNumeric = new Set(leftSplit.numericTokens);
    const rightNumeric = new Set(rightSplit.numericTokens);
    const overlap = ratio(leftText, rightText);
    const numericOverlap = ratio(leftNumeric, rightNumeric);
    const leftBrand = globalThis.RashnuNormalize.inferBrand(leftTitle);
    const rightBrand = globalThis.RashnuNormalize.inferBrand(rightTitle);
    const brandMatches = !leftBrand || !rightBrand || leftBrand === rightBrand;

    if (brandMatches && overlap >= 0.82) {
      return true;
    }
    if (brandMatches && overlap >= 0.68 && numericOverlap > 0) {
      return true;
    }
    if (provider === "torob" && brandMatches && overlap >= 0.62 && numericOverlap >= 0.5) {
      return true;
    }
    return false;
  }

  function buildGlobalSearchSuggestions(providers, controls) {
    const includeSuggestions = new Map();
    const excludeSuggestions = new Map();
    const excludeKeywordSuggestions = new Map();
    const blockedComparableTerms = new Set([
      ...controls.includeComparableTerms,
      ...controls.excludeComparableTerms
    ]);
    const queryTokens = new Set([
      ...globalThis.RashnuNormalize.filterMeaningfulTokens(globalThis.RashnuNormalize.splitTokens(controls.baseQuery).textTokens),
      ...controls.includeTerms.flatMap((term) => globalThis.RashnuNormalize.filterMeaningfulTokens(globalThis.RashnuNormalize.splitTokens(term).textTokens)),
      ...controls.excludeTerms.flatMap((term) => globalThis.RashnuNormalize.filterMeaningfulTokens(globalThis.RashnuNormalize.splitTokens(term).textTokens))
    ]);
    const blockedTokens = new Set([
      ...queryTokens,
      "torob",
      "digikala",
      "technolife",
      "emalls",
      "amazon",
      "ebay"
    ]);
    const rows = [];
    let foregroundCount = 0;
    let tailCount = 0;

    for (const provider of Object.values(providers || {})) {
      const sourceRows = Array.isArray(provider?.suggestionRows) && provider.suggestionRows.length
        ? provider.suggestionRows
        : Array.isArray(provider?.results)
          ? provider.results
          : [];
      const foregroundSize = sourceRows.length <= 3 ? sourceRows.length : Math.min(Math.max(3, Math.ceil(sourceRows.length * 0.4)), 6);
      for (let index = 0; index < sourceRows.length; index += 1) {
        const row = sourceRows[index];
        const band = index < foregroundSize ? "foreground" : "tail";
        rows.push({
          ...row,
          band
        });
        if (band === "foreground") {
          foregroundCount += 1;
        } else {
          tailCount += 1;
        }
      }
    }

    for (const row of rows) {
      const cleanedTitle = globalThis.RashnuNormalize.cleanProductTitle(row?.title || "");
      const comparableTitle = globalThis.RashnuNormalize.normalizeText(cleanedTitle);
      if (!comparableTitle) {
        continue;
      }
      const band = row.band === "tail" ? "tail" : "foreground";
      const weight =
        1 +
        Math.max(0, Math.min(0.7, Number(row?.confidence || 0))) +
        Math.max(0, Math.min(2, Number(row?.duplicateCount || 1) - 1)) * 0.2 +
        (band === "foreground" ? 0.35 : 0);

      for (const keyword of GLOBAL_SEARCH_USED_KEYWORDS) {
        const normalizedKeyword = globalThis.RashnuNormalize.normalizeText(keyword);
        if (
          !normalizedKeyword ||
          blockedComparableTerms.has(normalizedKeyword) ||
          queryTokens.has(normalizedKeyword) ||
          comparableTitle.includes(normalizedKeyword) === false
        ) {
          continue;
        }
        const existing = excludeKeywordSuggestions.get(normalizedKeyword);
        excludeKeywordSuggestions.set(normalizedKeyword, {
          type: "exclude",
          label: formatGlobalSearchSuggestionLabel(keyword),
          reason: "used_term",
          docCount: (existing?.docCount || 0) + 1,
          weight: (existing?.weight || 0) + weight,
          foregroundDocs: (existing?.foregroundDocs || 0) + (band === "foreground" ? 1 : 0),
          tailDocs: (existing?.tailDocs || 0) + (band === "tail" ? 1 : 0)
        });
      }

      const split = globalThis.RashnuNormalize.splitTokens(cleanedTitle);
      const tokens = new Set(globalThis.RashnuNormalize.filterMeaningfulTokens(split.textTokens));
      for (const token of tokens) {
        if (
          !token ||
          token.length < 2 ||
          blockedTokens.has(token) ||
          blockedComparableTerms.has(globalThis.RashnuNormalize.normalizeText(token))
        ) {
          continue;
        }
        const reason = classifyGlobalSearchSuggestionReason(token);
        const existingInclude = includeSuggestions.get(token);
        includeSuggestions.set(token, {
          type: "include",
          label: formatGlobalSearchSuggestionLabel(token),
          reason,
          docCount: (existingInclude?.docCount || 0) + 1,
          weight: (existingInclude?.weight || 0) + weight,
          foregroundDocs: (existingInclude?.foregroundDocs || 0) + (band === "foreground" ? 1 : 0),
          tailDocs: (existingInclude?.tailDocs || 0) + (band === "tail" ? 1 : 0)
        });
        const existingExclude = excludeSuggestions.get(token);
        excludeSuggestions.set(token, {
          type: "exclude",
          label: formatGlobalSearchSuggestionLabel(token),
          reason: reason === "repeated_brand" || reason === "repeated_spec" ? reason : "repeated_token",
          docCount: (existingExclude?.docCount || 0) + 1,
          weight: (existingExclude?.weight || 0) + weight,
          foregroundDocs: (existingExclude?.foregroundDocs || 0) + (band === "foreground" ? 1 : 0),
          tailDocs: (existingExclude?.tailDocs || 0) + (band === "tail" ? 1 : 0)
        });
      }
    }

    const totalRows = Math.max(rows.length, 1);
    const safeForegroundCount = Math.max(foregroundCount, 1);
    const safeTailCount = Math.max(tailCount, 1);
    const includeList = [...includeSuggestions.values()]
      .map((entry) => {
        const foregroundRate = entry.foregroundDocs / safeForegroundCount;
        const overallRate = entry.docCount / totalRows;
        const concentrationGain = foregroundRate - overallRate;
        const dominance = foregroundRate / Math.max(overallRate, 0.08);
        let score =
          concentrationGain * Math.max(1, Math.log2(dominance + 1)) +
          entry.weight * 0.08 +
          (entry.reason === "repeated_spec" ? 0.26 : entry.reason === "repeated_brand" ? 0.2 : 0);
        if (entry.tailDocs === 0) {
          score += 0.12;
        }
        return {
          ...entry,
          score
        };
      })
      .filter((entry) => {
        if (entry.reason === "repeated_spec" || entry.reason === "repeated_brand") {
          return entry.foregroundDocs >= 1;
        }
        return entry.docCount >= 2 && entry.foregroundDocs >= 1;
      })
      .sort((left, right) => right.score - left.score || right.foregroundDocs - left.foregroundDocs || String(left.label).localeCompare(String(right.label)))
      .slice(0, GLOBAL_SEARCH_INCLUDE_SUGGESTION_LIMIT);

    const excludeList = [
      ...[...excludeKeywordSuggestions.values()].map((entry) => ({
        ...entry,
        score: entry.weight + entry.docCount * 0.45 + entry.tailDocs * 0.3
      })),
      ...[...excludeSuggestions.values()].map((entry) => {
        const tailRate = entry.tailDocs / safeTailCount;
        const foregroundRate = entry.foregroundDocs / safeForegroundCount;
        const separation = tailRate - foregroundRate;
        let score =
          separation * Math.max(1, Math.log2((tailRate + 0.08) / Math.max(foregroundRate + 0.04, 0.04) + 1)) +
          entry.weight * 0.07 +
          (entry.reason === "repeated_brand" ? 0.12 : 0);
        if (entry.foregroundDocs === 0) {
          score += 0.12;
        }
        return {
          ...entry,
          score
        };
      })
        .filter((entry) => {
          if (entry.tailDocs === 0) {
            return false;
          }
          if (entry.reason === "repeated_brand" || entry.reason === "repeated_spec") {
            return entry.tailDocs >= 1 && entry.foregroundDocs === 0;
          }
          return entry.docCount >= 2 && entry.tailDocs > entry.foregroundDocs;
        })
    ]
      .sort(
        (left, right) =>
          right.score - left.score ||
          Number(right.tailDocs || 0) - Number(left.tailDocs || 0) ||
          String(left.label).localeCompare(String(right.label))
      );

    const seenSuggestionKeys = new Set();
    const output = [];
    for (const entry of excludeList) {
      const comparableLabel = globalThis.RashnuNormalize.normalizeText(entry.label);
      if (!comparableLabel || seenSuggestionKeys.has(`exclude:${comparableLabel}`)) {
        continue;
      }
      seenSuggestionKeys.add(`exclude:${comparableLabel}`);
      output.push({
        type: "exclude",
        label: entry.label,
        reason: entry.reason
      });
      if (output.filter((item) => item.type === "exclude").length >= GLOBAL_SEARCH_EXCLUDE_SUGGESTION_LIMIT) {
        break;
      }
    }

    for (const entry of includeList) {
      const comparableLabel = globalThis.RashnuNormalize.normalizeText(entry.label);
      if (!comparableLabel || seenSuggestionKeys.has(`include:${comparableLabel}`)) {
        continue;
      }
      seenSuggestionKeys.add(`include:${comparableLabel}`);
      output.push({
        type: "include",
        label: entry.label,
        reason: entry.reason
      });
      if (output.filter((item) => item.type === "include").length >= GLOBAL_SEARCH_INCLUDE_SUGGESTION_LIMIT) {
        break;
      }
    }

    const includeCount = output.filter((item) => item.type === "include").length;
    if (includeCount === 0) {
      const fallbackInclude = [...includeSuggestions.values()]
        .sort(
          (left, right) =>
            Number(right.foregroundDocs || 0) - Number(left.foregroundDocs || 0) ||
            Number(right.docCount || 0) - Number(left.docCount || 0) ||
            Number(right.weight || 0) - Number(left.weight || 0) ||
            String(left.label).localeCompare(String(right.label))
        )
        .slice(0, Math.min(4, GLOBAL_SEARCH_INCLUDE_SUGGESTION_LIMIT));
      for (const entry of fallbackInclude) {
        const comparableLabel = globalThis.RashnuNormalize.normalizeText(entry.label);
        if (!comparableLabel || seenSuggestionKeys.has(`include:${comparableLabel}`)) {
          continue;
        }
        seenSuggestionKeys.add(`include:${comparableLabel}`);
        output.push({
          type: "include",
          label: entry.label,
          reason: entry.reason
        });
      }
    }

    const excludeCount = output.filter((item) => item.type === "exclude").length;
    if (excludeCount === 0) {
      const fallbackExclude = [
        ...[...excludeKeywordSuggestions.values()],
        ...[...excludeSuggestions.values()]
      ]
        .sort(
          (left, right) =>
            Number(right.tailDocs || 0) - Number(left.tailDocs || 0) ||
            Number(right.docCount || 0) - Number(left.docCount || 0) ||
            Number(right.weight || 0) - Number(left.weight || 0) ||
            String(left.label).localeCompare(String(right.label))
        )
        .slice(0, Math.min(3, GLOBAL_SEARCH_EXCLUDE_SUGGESTION_LIMIT));
      for (const entry of fallbackExclude) {
        const comparableLabel = globalThis.RashnuNormalize.normalizeText(entry.label);
        if (!comparableLabel || seenSuggestionKeys.has(`exclude:${comparableLabel}`)) {
          continue;
        }
        seenSuggestionKeys.add(`exclude:${comparableLabel}`);
        output.push({
          type: "exclude",
          label: entry.label,
          reason: entry.reason
        });
      }
    }

    return output;
  }

  function classifyGlobalSearchSuggestionReason(token) {
    if (/^(?:m\d+|\d+(?:gb|tb)|[a-z]{1,5}\d+[a-z0-9]*|\d+[a-z]{1,4})$/i.test(token)) {
      return "repeated_spec";
    }
    if (globalThis.RashnuNormalize.inferBrand(token)) {
      return "repeated_brand";
    }
    return "repeated_token";
  }

  function formatGlobalSearchSuggestionLabel(value) {
    const raw = String(value || "").trim();
    if (/^\d+(gb|tb)$/i.test(raw)) {
      return raw.replace(/(gb|tb)$/i, (unit) => unit.toUpperCase());
    }
    if (/^(?:m\d+|[a-z]{1,5}\d+[a-z0-9]*|\d+[a-z]{1,4})$/i.test(raw)) {
      return raw.toUpperCase();
    }
    if (raw === "apple") {
      return "Apple";
    }
    return raw;
  }

  function ratio(leftSet, rightSet) {
    const left = leftSet instanceof Set ? leftSet : new Set(leftSet || []);
    const right = rightSet instanceof Set ? rightSet : new Set(rightSet || []);
    const union = new Set([...left, ...right]).size;
    if (!union) {
      return 0;
    }
    let intersection = 0;
    for (const token of left) {
      if (right.has(token)) {
        intersection += 1;
      }
    }
    return intersection / union;
  }

  function classifyGlobalSearchCandidates(ranked) {
    if (!ranked.length) {
      return {
        status: "not_found",
        reason: "no_results"
      };
    }
    const top = ranked[0];
    if (Number(top?.confidence || 0) >= 0.72) {
      return {
        status: "matched",
        reason: top?.reasons?.[0] || "score_match"
      };
    }
    return {
      status: "low_confidence",
      reason: top?.reasons?.[0] || "results_available"
    };
  }

  function normalizeGlobalSearchImageUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return null;
    }
    if (raw.startsWith("//")) {
      return `https:${raw}`;
    }
    return raw;
  }

  function buildGlobalSearchRow(provider, candidate, rank, searchUrl) {
    const priceValue =
      Number.isFinite(candidate?.priceValue) ? candidate.priceValue : Number.isFinite(candidate?.price) ? candidate.price : null;
    const originalPriceValue =
      Number.isFinite(candidate?.originalPriceValue)
        ? candidate.originalPriceValue
        : Number.isFinite(candidate?.originalPrice)
          ? candidate.originalPrice
          : null;
    return {
      provider,
      rank,
      title: candidate?.title || "",
      imageUrl: normalizeGlobalSearchImageUrl(
        candidate?.imageUrl ||
        candidate?.image_url ||
        candidate?.thumbnailUrl ||
        candidate?.thumbnail_url ||
        candidate?.thumbnail ||
        candidate?.image ||
        candidate?.img ||
        candidate?.photo
      ),
      priceText: candidate?.priceText || null,
      priceValue,
      originalPriceText: candidate?.originalPriceText || null,
      originalPriceValue,
      discountPercent: candidate?.discountPercent || null,
      confidence: Number.isFinite(candidate?.confidence) ? candidate.confidence : 0,
      duplicateCount: Number(candidate?.duplicateCount || 0) > 1 ? Number(candidate.duplicateCount) : 1,
      targetUrl: candidate?.targetUrl || searchUrl,
      searchUrl
    };
  }

  function buildGlobalSearchProviderResponse(provider, query, ranked, options = {}) {
    const searchUrl = options.searchUrl || buildSearchUrlForSite(provider, query);
    const controls = options.controls || buildGlobalSearchControls({}, query);
    const filtered = ranked.filter((candidate) => candidateMatchesGlobalSearchControls(candidate, controls));
    const deduped = controls.dedupeEnabled ? dedupeGlobalSearchCandidates(provider, filtered) : filtered;
    const classification = classifyGlobalSearchCandidates(deduped);
    const maxResults = clampGlobalSearchResultLimit(options.maxResults);
    const suggestionRows = deduped
      .slice(0, Math.max(maxResults * 4, GLOBAL_SEARCH_SUGGESTION_SAMPLE_LIMIT))
      .map((candidate, index) => buildGlobalSearchRow(provider, candidate, index + 1, searchUrl));
    return {
      provider,
      status: options.status || classification.status,
      reason: options.reason || classification.reason,
      searchUrl,
      results: deduped.slice(0, maxResults).map((candidate, index) => buildGlobalSearchRow(provider, candidate, index + 1, searchUrl)),
      suggestionRows
    };
  }

  function buildGlobalSearchErrorResponse(provider, query, reason, searchUrl) {
    return {
      provider,
      status: "error",
      reason: reason || "request_failed",
      searchUrl: searchUrl || buildSearchUrlForSite(provider, query),
      results: []
    };
  }

  function clampGlobalSearchResultLimit(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return 3;
    }
    return Math.max(1, Math.min(10, parsed));
  }

  async function performGlobalSearch(payload) {
    const query = buildGlobalSearchQuery(payload?.query);
    const requestedProviders = normalizeGlobalSearchProviders(payload?.providers);
    const maxResults = clampGlobalSearchResultLimit(payload?.maxResults);
    const controls = buildGlobalSearchControls(payload, query);
    if (!query) {
      return {
        ok: false,
        reason: "empty_query",
        query: "",
        requestedProviders,
        maxResults,
        queryPlan: serializeGlobalSearchQueryPlan(controls),
        suggestions: [],
        providers: {}
      };
    }
    if (!requestedProviders.length) {
      return {
        ok: false,
        reason: "no_providers_enabled",
        query,
        requestedProviders: [],
        maxResults,
        queryPlan: serializeGlobalSearchQueryPlan(controls),
        suggestions: [],
        providers: {}
      };
    }

    addLog("info", "background", "global_search_started", {
      query,
      providers: requestedProviders,
      includeTerms: controls.includeTerms,
      excludeTerms: controls.excludeTerms,
      conditionFilter: controls.conditionFilter,
      dedupeEnabled: controls.dedupeEnabled
    });

    const providerEntries = await Promise.all(
      requestedProviders.map(async (provider) => {
        try {
          return [provider, await fetchGlobalSearchByProvider(provider, query, maxResults, controls)];
        } catch (error) {
          addLog("error", "background", "global_search_provider_failed", {
            query,
            provider,
            error: serializeError(error)
          });
          return [provider, buildGlobalSearchErrorResponse(provider, query, error?.message || "request_failed")];
        }
      })
    );

    const providers = Object.fromEntries(providerEntries);
    const suggestions = buildGlobalSearchSuggestions(providers, controls);
    addLog("info", "background", "global_search_completed", {
      query,
      providers: requestedProviders,
      statuses: providerEntries.map(([provider, result]) => ({
        provider,
        status: result?.status || "unknown"
      })),
      suggestionCount: suggestions.length
    });

    return {
      ok: true,
      query,
      requestedProviders,
      maxResults,
      queryPlan: serializeGlobalSearchQueryPlan(controls),
      suggestions,
      providers
    };
  }

  async function fetchGlobalSearchByProvider(provider, query, maxResults, controls) {
    if (provider === "torob") {
      return fetchTorobGlobalSearch(query, maxResults, controls);
    }
    if (provider === "digikala") {
      return fetchDigikalaGlobalSearch(query, maxResults, controls);
    }
    if (provider === "technolife") {
      return fetchTechnolifeGlobalSearch(query, maxResults, controls);
    }
    if (provider === "emalls") {
      return fetchEmallsGlobalSearch(query, maxResults, controls);
    }
    if (provider === "amazon") {
      return fetchAmazonGlobalSearch(query, maxResults, controls);
    }
    if (provider === "ebay") {
      return fetchEbayGlobalSearch(query, maxResults, controls);
    }
    throw new Error(`unsupported_provider:${provider}`);
  }

  async function fetchTorobGlobalSearch(query, maxResults, controls) {
    const probeItem = buildGlobalSearchProbeItem(query);
    const searchPayload = await fetchJsonWithRetry(buildTorobApiSearchUrl(query));
    const ranked = globalThis.RashnuMatch.rankCandidates(probeItem, searchPayload?.results || []);
    return buildGlobalSearchProviderResponse("torob", query, ranked, {
      searchUrl: globalThis.RashnuNormalize.buildTorobSearchUrl(query),
      maxResults,
      controls
    });
  }

  async function fetchDigikalaGlobalSearch(query, maxResults, controls) {
    const probeItem = buildGlobalSearchProbeItem(query);
    try {
      const searchPayload = await fetchJsonWithRetry(buildDigikalaApiSearchUrl(query));
      const ranked = globalThis.RashnuMatch.rankCandidates(
        probeItem,
        (searchPayload?.data?.products || []).slice(0, 12).map(normalizeDigikalaCandidate)
      );
      return buildGlobalSearchProviderResponse("digikala", query, ranked, {
        searchUrl: globalThis.RashnuNormalize.buildDigikalaSearchUrl(query),
        maxResults,
        controls
      });
    } catch (error) {
      if (!isRecoverableProviderFetchError(error)) {
        throw error;
      }
      return buildGlobalSearchErrorResponse("digikala", query, "network_unreachable");
    }
  }

  async function fetchTechnolifeGlobalSearch(query, maxResults, controls) {
    const probeItem = buildGlobalSearchProbeItem(query);
    try {
      let buildId = await getTechnolifeBuildId();
      let searchPayload;
      try {
        searchPayload = await fetchJsonWithRetry(buildTechnolifeApiSearchUrl(buildId, query));
      } catch (error) {
        const shouldRefreshBuildId =
          String(error?.message || "") === "http_404" || String(error?.message || "") === "technolife_build_id_missing";
        if (!shouldRefreshBuildId) {
          throw error;
        }
        buildId = await getTechnolifeBuildId({ force: true });
        searchPayload = await fetchJsonWithRetry(buildTechnolifeApiSearchUrl(buildId, query));
      }
      const ranked = globalThis.RashnuMatch.rankCandidates(
        probeItem,
        extractTechnolifeSearchResults(searchPayload).slice(0, 15).map(normalizeTechnolifeCandidate)
      );
      return buildGlobalSearchProviderResponse("technolife", query, ranked, {
        searchUrl: globalThis.RashnuNormalize.buildTechnolifeSearchUrl(query),
        maxResults,
        controls
      });
    } catch (error) {
      if (!isRecoverableProviderFetchError(error)) {
        throw error;
      }
      return buildGlobalSearchErrorResponse("technolife", query, "network_unreachable");
    }
  }

  async function fetchEmallsGlobalSearch(query, maxResults, controls) {
    const probeItem = buildGlobalSearchProbeItem(query);
    try {
      const apiRawText = await fetchTextWithRetry(buildEmallsApiSearchUrl(), {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "x-requested-with": "XMLHttpRequest"
        },
        body: buildEmallsApiSearchBody(query)
      });
      const apiCandidates = extractEmallsApiResults(safeParseJson(apiRawText)).map(normalizeEmallsCandidate);
      let htmlCandidates = [];
      if (!apiCandidates.length || !apiCandidates.some((candidate) => hasMeaningfulValue(candidate?.priceText || candidate?.price))) {
        try {
          const html = await fetchTextWithRetry(globalThis.RashnuNormalize.buildEmallsSearchUrl(query));
          htmlCandidates = extractEmallsSearchCandidatesFromHtml(html);
        } catch (htmlError) {
          if (!isRecoverableProviderFetchError(htmlError)) {
            throw htmlError;
          }
        }
      }
      const mergedCandidates = mergeCandidatesByTargetUrl(apiCandidates, htmlCandidates);
      const ranked = globalThis.RashnuMatch.rankCandidates(probeItem, mergedCandidates.slice(0, 18));
      return buildGlobalSearchProviderResponse("emalls", query, ranked, {
        searchUrl: globalThis.RashnuNormalize.buildEmallsSearchUrl(query),
        maxResults,
        controls
      });
    } catch (error) {
      if (!isRecoverableProviderFetchError(error)) {
        throw error;
      }
      return buildGlobalSearchErrorResponse("emalls", query, "network_unreachable");
    }
  }

  async function fetchAmazonGlobalSearch(query, maxResults, controls) {
    const probeItem = buildGlobalSearchProbeItem(query);
    const marketplaceQuery = await translateQueryForGlobalMarketplace(query, "amazon");
    const searchUrl = globalThis.RashnuNormalize.buildAmazonSearchUrl(marketplaceQuery);
    let directCandidates = [];
    let proxyCandidates = [];
    let blockedByAntibot = false;
    try {
      const html = await fetchTextWithRetry(searchUrl, {
        headers: {
          "accept-language": "en-US,en;q=0.9"
        }
      });
      blockedByAntibot = isAmazonBlockedResponse(html);
      if (!blockedByAntibot) {
        directCandidates = extractAmazonSearchCandidates(html).slice(0, 18);
      }
      if (!directCandidates.length) {
        try {
          const proxyText = await fetchMarketplaceProxyText(searchUrl, "amazon");
          proxyCandidates = extractAmazonSearchCandidatesFromMarkdown(proxyText).slice(0, 18);
        } catch (proxyError) {
          if (!isRecoverableProviderFetchError(proxyError)) {
            throw proxyError;
          }
        }
      }
      const ranked = globalThis.RashnuMatch.rankCandidates(
        probeItem,
        (directCandidates.length ? directCandidates : proxyCandidates).slice(0, 12)
      );
      if (!ranked.length && blockedByAntibot) {
        return buildGlobalSearchProviderResponse("amazon", query, ranked, {
          searchUrl,
          status: "not_found",
          reason: "blocked_by_antibot",
          maxResults,
          controls
        });
      }
      return buildGlobalSearchProviderResponse("amazon", query, ranked, {
        searchUrl,
        reason: ranked.length ? null : "no_results",
        maxResults,
        controls
      });
    } catch (error) {
      if (!isRecoverableProviderFetchError(error)) {
        throw error;
      }
      return buildGlobalSearchErrorResponse("amazon", query, "network_unreachable", searchUrl);
    }
  }

  async function fetchEbayGlobalSearch(query, maxResults, controls) {
    const probeItem = buildGlobalSearchProbeItem(query);
    const marketplaceQuery = await translateQueryForGlobalMarketplace(query, "ebay");
    const searchUrl = globalThis.RashnuNormalize.buildEbaySearchUrl(marketplaceQuery);
    let directCandidates = [];
    let proxyCandidates = [];
    let blockedByAntibot = false;
    try {
      const html = await fetchTextWithRetry(searchUrl, {
        headers: {
          "accept-language": "en-US,en;q=0.9"
        }
      });
      blockedByAntibot = isEbayBlockedResponse(html);
      if (!blockedByAntibot) {
        directCandidates = extractEbaySearchCandidates(html).slice(0, 18);
      }
      if (!directCandidates.length) {
        try {
          const proxyText = await fetchMarketplaceProxyText(searchUrl, "ebay");
          proxyCandidates = extractEbaySearchCandidatesFromMarkdown(proxyText).slice(0, 18);
        } catch (proxyError) {
          if (!isRecoverableProviderFetchError(proxyError)) {
            throw proxyError;
          }
        }
      }
      const ranked = globalThis.RashnuMatch.rankCandidates(
        probeItem,
        (directCandidates.length ? directCandidates : proxyCandidates).slice(0, 12)
      );
      if (!ranked.length && blockedByAntibot) {
        return buildGlobalSearchProviderResponse("ebay", query, ranked, {
          searchUrl,
          status: "not_found",
          reason: "blocked_by_antibot",
          maxResults,
          controls
        });
      }
      return buildGlobalSearchProviderResponse("ebay", query, ranked, {
        searchUrl,
        reason: ranked.length ? null : "no_results",
        maxResults,
        controls
      });
    } catch (error) {
      if (!isRecoverableProviderFetchError(error)) {
        throw error;
      }
      return buildGlobalSearchErrorResponse("ebay", query, "network_unreachable", searchUrl);
    }
  }

  async function fetchTorobMatch(item, query) {
    const startedAt = Date.now();
    const searchPayload = await fetchJsonWithRetry(buildTorobApiSearchUrl(query));
    const ranked = globalThis.RashnuMatch.rankCandidates(item, searchPayload.results || []);
    const classification = globalThis.RashnuMatch.classifyTopCandidate(ranked);
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
        globalThis.RashnuNormalize.parsePriceValue(detailed?.price_text || ""),
      targetOriginalPriceText: null,
      targetOriginalPriceValue: null,
      targetDiscountPercent: null,
      targetUrl:
        top?.targetUrl ||
        (detailed?.web_client_absolute_url
          ? new URL(detailed.web_client_absolute_url, "https://torob.com").toString()
          : globalThis.RashnuNormalize.buildTorobSearchUrl(query)),
      moreInfoUrl: top?.moreInfoUrl || null,
      sellerCount:
        top?.sellerCount ||
        parseSellerCount(detailed?.shop_text || detailed?.products_info?.title || ""),
      reason: classification.reason,
      searchUrl: globalThis.RashnuNormalize.buildTorobSearchUrl(query),
      googleUrl: globalThis.RashnuNormalize.buildGoogleSearchUrl(item.title),
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
      const ranked = globalThis.RashnuMatch.rankCandidates(
        item,
        products.slice(0, 8).map(normalizeDigikalaCandidate)
      );
      const classification = globalThis.RashnuMatch.classifyTopCandidate(ranked);
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
        targetUrl: top?.targetUrl || globalThis.RashnuNormalize.buildDigikalaSearchUrl(query),
        moreInfoUrl: null,
        sellerCount: null,
        reason: classification.reason,
        searchUrl: globalThis.RashnuNormalize.buildDigikalaSearchUrl(query),
        googleUrl: globalThis.RashnuNormalize.buildGoogleSearchUrl(item.title),
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
          const html = await fetchTextWithRetry(globalThis.RashnuNormalize.buildEmallsSearchUrl(query));
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

      const ranked = globalThis.RashnuMatch.rankCandidates(item, mergedCandidates.slice(0, 18));
      const classification = globalThis.RashnuMatch.classifyTopCandidate(ranked);
      const top = ranked[0] || null;
      const topWithPrice = ranked.find((candidate) => hasMeaningfulValue(candidate?.priceText || candidate?.price)) || top;
      const targetPriceValue =
        topWithPrice?.price ??
        globalThis.RashnuNormalize.parsePriceValue(topWithPrice?.priceText || "");

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
        targetUrl: top?.targetUrl || topWithPrice?.targetUrl || globalThis.RashnuNormalize.buildEmallsSearchUrl(query),
        moreInfoUrl: null,
        sellerCount: null,
        reason: classification.reason,
        searchUrl: globalThis.RashnuNormalize.buildEmallsSearchUrl(query),
        googleUrl: globalThis.RashnuNormalize.buildGoogleSearchUrl(item.title),
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
    const searchUrl = globalThis.RashnuNormalize.buildAmazonSearchUrl(marketplaceQuery);
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
      const ranked = globalThis.RashnuMatch.rankCandidates(
        item,
        mergedCandidates.slice(0, 12)
      );
      const classification = globalThis.RashnuMatch.classifyTopCandidate(ranked);
      const top = ranked[0] || null;
      const topWithPrice = ranked.find((candidate) => hasMeaningfulValue(candidate?.priceText || candidate?.price)) || top;
      const targetPriceValue =
        topWithPrice?.price ??
        globalThis.RashnuNormalize.parsePriceValue(topWithPrice?.priceText || "");

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
        googleUrl: globalThis.RashnuNormalize.buildGoogleSearchUrl(item.title),
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
    const searchUrl = globalThis.RashnuNormalize.buildEbaySearchUrl(marketplaceQuery);
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

      const ranked = globalThis.RashnuMatch.rankCandidates(item, mergedCandidates.slice(0, 12));
      const classification = globalThis.RashnuMatch.classifyTopCandidate(ranked);
      const top = ranked[0] || null;
      const topWithPrice = ranked.find((candidate) => hasMeaningfulValue(candidate?.priceText || candidate?.price)) || top;
      const targetPriceValue =
        topWithPrice?.price ??
        globalThis.RashnuNormalize.parsePriceValue(topWithPrice?.priceText || "");

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
        googleUrl: globalThis.RashnuNormalize.buildGoogleSearchUrl(item.title),
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
    const ranked = globalThis.RashnuMatch.rankCandidates(
      item,
      results.slice(0, 12).map(normalizeTechnolifeCandidate)
    );
    const classification = globalThis.RashnuMatch.classifyTopCandidate(ranked);
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
      targetUrl: top?.targetUrl || globalThis.RashnuNormalize.buildTechnolifeSearchUrl(query),
      moreInfoUrl: null,
      sellerCount: null,
      reason: classification.reason,
      searchUrl: globalThis.RashnuNormalize.buildTechnolifeSearchUrl(query),
      googleUrl: globalThis.RashnuNormalize.buildGoogleSearchUrl(item.title),
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
    const title = globalThis.RashnuNormalize.cleanProductTitle(product?.name || "");
    const code = String(product?.code || "");
    const productIdMatch = code.match(/^TLP-(\d+)$/i);
    const productId = productIdMatch ? productIdMatch[1] : null;
    const rawPrice = product?.discounted_price || product?.normal_price || null;
    const priceValue = globalThis.RashnuNormalize.normalizePriceUnit(rawPrice, "toman");
    const targetUrl = productId
      ? `https://www.technolife.com/product-${productId}`
      : globalThis.RashnuNormalize.buildTechnolifeSearchUrl(title || code);

    return {
      title,
      price: priceValue,
      priceValue,
      priceText: priceValue ? formatPrice(priceValue) : "نامشخص",
      targetSite: "technolife",
      targetUrl,
      site: "technolife",
      code
    };
  }

  function normalizeEmallsCandidate(item) {
    const rawTitle = String(item?.title || "").replace(/<[^>]*>/g, " ");
    const title = globalThis.RashnuNormalize
      .cleanProductTitle(rawTitle)
      .replace(/\s+در\s+دسته\s+.*$/u, "")
      .trim();
    const rawPrice = item?.price || item?.priceText || item?.pprice || null;
    const normalizedPriceText = sanitizeHtmlText(rawPrice || "");
    const priceValue = globalThis.RashnuNormalize.parsePriceValue(normalizedPriceText || "");
    const targetUrl =
      globalThis.RashnuNormalize.canonicalizeUrl(item?.link || "", "https://emalls.ir") ||
      globalThis.RashnuNormalize.buildEmallsSearchUrl(title || rawTitle);

    return {
      title,
      price: priceValue,
      priceValue,
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
      const targetUrl = globalThis.RashnuNormalize.canonicalizeUrl(rawUrl, "https://emalls.ir");
      if (!targetUrl) {
        continue;
      }
      const title = globalThis.RashnuNormalize.cleanProductTitle(sanitizeHtmlText(linkMatch[2] || ""));
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
      const priceValue = globalThis.RashnuNormalize.parsePriceValue(rawPriceText || "");
      const priceText = rawPriceText || (priceValue ? formatPrice(priceValue) : null);

      candidates.push({
        title,
        price: priceValue,
        priceValue,
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
        globalThis.RashnuNormalize.canonicalizeUrl(href, "https://www.amazon.com") ||
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
        price: globalThis.RashnuNormalize.parsePriceValue(rawPrice || ""),
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
        globalThis.RashnuNormalize.canonicalizeUrl(linkMatch[1], "https://www.ebay.com") || linkMatch[1];
      const rawPrice = priceMatch ? sanitizeHtmlText(priceMatch[1]) : "";
      candidates.push({
        title,
        priceText: rawPrice || null,
        price: globalThis.RashnuNormalize.parsePriceValue(rawPrice || ""),
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
      const targetUrl = globalThis.RashnuNormalize.canonicalizeUrl(rawUrl, "https://www.amazon.com");
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
      const targetUrl = globalThis.RashnuNormalize.canonicalizeUrl(priceMatch[2] || "", "https://www.amazon.com");
      const resultKey = extractAmazonResultKey(targetUrl);
      if (!priceText || !resultKey) {
        continue;
      }
      const candidate = candidatesByKey.get(resultKey);
      if (candidate) {
        candidate.priceText = priceText;
        candidate.price = globalThis.RashnuNormalize.parsePriceValue(priceText || "");
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
      const targetUrl = globalThis.RashnuNormalize.canonicalizeUrl(match[2] || "", "https://www.ebay.com");
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
        price: globalThis.RashnuNormalize.parsePriceValue(priceText || ""),
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
      priceValue: price,
      priceText: price ? formatPrice(price) : "نامشخص",
      originalPrice,
      originalPriceValue: originalPrice,
      originalPriceText: originalPrice ? formatPrice(originalPrice) : null,
      discountPercent,
      targetSite: "digikala",
      targetUrl: product?.id
        ? `https://www.digikala.com/product/dkp-${product.id}/`
        : globalThis.RashnuNormalize.buildDigikalaSearchUrl(title),
      productUrl: product?.id
        ? `https://www.digikala.com/product/dkp-${product.id}/`
        : null,
      site: "digikala"
    };
  }

  function normalizeDigikalaSourceProduct(product, originalItem) {
    const candidate = normalizeDigikalaCandidate(product);
    const title = globalThis.RashnuNormalize.cleanProductTitle(candidate.title || originalItem.title || "");
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
    const cleanedTitle = globalThis.RashnuNormalize.cleanProductTitle(item?.title || "");
    const cleaned = globalThis.RashnuNormalize.buildSearchQuery(cleanedTitle) || cleanedTitle || item?.title || "";
    return cleaned || item?.title || "";
  }

  function enrichSourceItem(item) {
    const next = {
      ...item
    };
    next.title = globalThis.RashnuNormalize.cleanProductTitle(next.title || "");

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
    return globalThis.RashnuNormalize.formatToman(value);
  }

  function normalizeDigikalaApiPrice(value) {
    return globalThis.RashnuNormalize.normalizePriceUnit(value, "IRR");
  }

  function normalizeDiscountPercent(value) {
    const parsed = globalThis.RashnuNormalize.parseDiscountPercent(value);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return globalThis.RashnuNormalize.formatDiscountPercent(parsed);
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
    const parsed = globalThis.RashnuNormalize.parsePriceValue(value);
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
      return globalThis.RashnuNormalize.buildDigikalaSearchUrl(query);
    }
    if (site === "technolife") {
      return globalThis.RashnuNormalize.buildTechnolifeSearchUrl(query);
    }
    if (site === "emalls") {
      return globalThis.RashnuNormalize.buildEmallsSearchUrl(query);
    }
    if (site === "amazon") {
      return globalThis.RashnuNormalize.buildAmazonSearchUrl(query);
    }
    if (site === "ebay") {
      return globalThis.RashnuNormalize.buildEbaySearchUrl(query);
    }
    return globalThis.RashnuNormalize.buildTorobSearchUrl(query);
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
    let normalized = globalThis.RashnuNormalize.normalizeDigits(sourceQuery || "");
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
      googleUrl: globalThis.RashnuNormalize.buildGoogleSearchUrl(item.title),
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

  async function fetchResponse(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
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
      return response;
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

  async function fetchText(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
    const response = await fetchResponse(url, options, timeoutMs);
    return await response.text();
  }

  async function fetchJson(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
    const response = await fetchResponse(url, options, timeoutMs);
    return await response.json();
  }

  function describeFetchError(error, fallbackMessage) {
    if (typeof error?.message === "string" && error.message) {
      return error.message;
    }
    return fallbackMessage;
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
    await persistLogsToStorage(true);
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
    await persistLogsToStorage(true);
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
    const normalizedQuery = globalThis.RashnuNormalize.normalizeText(buildCleanMatchQuery(row.item));
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
        type: "RASHNU_SOFT_RESCAN"
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
    await persistLogsToStorage(true);
    resetPageState(state);
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "RASHNU_FORCE_RESCAN"
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
        type: "RASHNU_SCROLL_TO_ITEM",
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
    await persistLogsToStorage(true);
    notifyPanels();
    return { cleared: true };
  }

  async function exportLogs() {
    await persistLogsToStorage(true);
    const payload = {
      exportedAt: new Date().toISOString(),
      logs: logEntries
    };
    const dataUrl =
      "data:application/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(payload, null, 2));
    const filename = `rashnu-logs-${Date.now()}.json`;
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
    scheduleLogPersistence();
    scheduleLogFlush();
  }

  async function setPanelActiveState(enabled, options = {}) {
    const next = Boolean(enabled);
    if (!options.force && panelActive === next) {
      return;
    }
    panelActive = next;
    await chrome.storage.local.set({
      rashnuPanelActive: panelActive
    });
    await syncActionIcon();
    addLog("info", "background", "panel_active_changed", {
      panelActive
    });
    await persistLogsToStorage(true);
    if (panelActive && options.triggerRescan !== false) {
      const activeTab = await getActiveTab();
      if (activeTab?.id != null) {
        await forceRescanTab(activeTab.id);
      }
    }
    notifyPanels();
  }

  async function disableSidePanelForTab(tabId) {
    if (tabId == null || !chrome.sidePanel?.setOptions) {
      return;
    }
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false
    }).catch(() => {});
  }

  async function closeSidePanelForWindow(windowId, tabId) {
    if (windowId != null && chrome.sidePanel?.close) {
      const closed = await chrome.sidePanel.close({ windowId }).then(() => true).catch(() => false);
      if (closed) {
        return;
      }
    }
    if (tabId != null) {
      await disableSidePanelForTab(tabId);
    }
  }

  function buildGlobalSearchPageUrl(query) {
    const url = new URL(chrome.runtime.getURL("src/search/search.html"));
    const normalizedQuery = String(query || "").trim();
    if (normalizedQuery) {
      url.searchParams.set("q", normalizedQuery);
      url.searchParams.set("autorun", "1");
    }
    return url.toString();
  }

  async function openGlobalSearchTab(payload = {}) {
    const activeTab = await getActiveTab();
    await closeSidePanelForWindow(activeTab?.windowId ?? null, activeTab?.id ?? null);
    const tab = await chrome.tabs.create({
      url: buildGlobalSearchPageUrl(payload?.query)
    });
    if (tab?.id != null) {
      await disableSidePanelForTab(tab.id);
    }
    return {
      ok: true,
      tabId: tab?.id || null
    };
  }

  async function syncActionIcon() {
    if (!chrome.action?.setIcon) {
      return;
    }
    const path = panelActive ? ACTION_ICON_PATHS.active : ACTION_ICON_PATHS.inactive;
    await chrome.action.setIcon({ path }).catch(() => {});
  }

  function notifyPanels() {
    chrome.runtime.sendMessage({
      type: "RASHNU_PANEL_STATE_UPDATED"
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

  function scheduleLogPersistence() {
    logPersistPending = true;
    if (logPersistTimer) {
      return;
    }
    logPersistTimer = setTimeout(() => {
      logPersistTimer = null;
      persistLogsToStorage().catch(() => {});
    }, LOG_STORAGE_FLUSH_DEBOUNCE_MS);
  }

  async function persistLogsToStorage(force = false) {
    if (logPersistTimer) {
      clearTimeout(logPersistTimer);
      logPersistTimer = null;
    }
    if (!force && !logPersistPending) {
      return;
    }
    logPersistPending = false;
    await chrome.storage.local.set({
      [LOG_STORAGE_KEY]: logEntries.slice(-MAX_LOG_ENTRIES)
    }).catch(() => {});
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

  async function ensureLogHelperHealth(options = {}) {
    const force = Boolean(options.force);
    const now = Date.now();

    if (!force) {
      if (logHelperHealthPromise) {
        return logHelperHealthPromise;
      }
      if (logHelperStatus.connected && now - lastLogHelperHealthCheckMs < LOG_HELPER_HEALTH_CACHE_MS) {
        return true;
      }
      if (!logHelperStatus.connected && now < nextLogHelperRetryAt) {
        return false;
      }
    }

    if (logHelperHealthPromise) {
      return logHelperHealthPromise;
    }

    logHelperHealthPromise = (async () => {
      try {
        const payload = await fetchJson(`${LOG_HELPER_BASE_URL}/health`, null, LOG_HELPER_REQUEST_TIMEOUT_MS);
        lastLogHelperHealthCheckMs = Date.now();
        nextLogHelperRetryAt = 0;
        logHelperStatus = {
          connected: true,
          lastCheckedAt: new Date(lastLogHelperHealthCheckMs).toISOString(),
          lastError: null,
          artifactDir: payload.artifact_dir || "research/artifacts/rashnu",
          logPath: payload.log_path || "research/artifacts/rashnu/rashnu-live-log.ndjson",
          statePath: payload.state_path || "research/artifacts/rashnu/rashnu-state.json"
        };
        return true;
      } catch (error) {
        lastLogHelperHealthCheckMs = Date.now();
        nextLogHelperRetryAt = lastLogHelperHealthCheckMs + LOG_HELPER_OFFLINE_RETRY_MS;
        logHelperStatus = {
          ...logHelperStatus,
          connected: false,
          lastCheckedAt: new Date(lastLogHelperHealthCheckMs).toISOString(),
          lastError: describeFetchError(error, "helper_unreachable")
        };
        return false;
      } finally {
        logHelperHealthPromise = null;
      }
    })();

    return logHelperHealthPromise;
  }

  async function flushLogsToHelper() {
    if (!pendingLogEntries.length) {
      return;
    }
    if (logFlushInFlight) {
      return;
    }
    logFlushInFlight = true;
    const batch = pendingLogEntries.splice(0, LOG_FLUSH_BATCH_SIZE);

    try {
      const healthy = await ensureLogHelperHealth();
      if (!healthy) {
        pendingLogEntries.unshift(...batch);
        return;
      }
      await fetchResponse(`${LOG_HELPER_BASE_URL}/append-log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          entries: batch
        })
      }, LOG_HELPER_REQUEST_TIMEOUT_MS);
    } catch (error) {
      nextLogHelperRetryAt = Date.now() + LOG_HELPER_OFFLINE_RETRY_MS;
      logHelperStatus = {
        ...logHelperStatus,
        connected: false,
        lastCheckedAt: new Date().toISOString(),
        lastError: describeFetchError(error, "log_flush_failed")
      };
      pendingLogEntries.unshift(...batch);
    } finally {
      logFlushInFlight = false;
      if (pendingLogEntries.length) {
        scheduleLogFlush();
      }
    }
  }

  async function flushStateToHelper() {
    if (stateFlushInFlight) {
      stateFlushQueued = true;
      return;
    }
    stateFlushInFlight = true;
    stateFlushQueued = false;

    try {
      const healthy = await ensureLogHelperHealth();
      if (!healthy) {
        return;
      }
      const payload = await buildHelperStatePayload();
      await fetchResponse(`${LOG_HELPER_BASE_URL}/write-state`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }, LOG_HELPER_REQUEST_TIMEOUT_MS);
    } catch (error) {
      nextLogHelperRetryAt = Date.now() + LOG_HELPER_OFFLINE_RETRY_MS;
      logHelperStatus = {
        ...logHelperStatus,
        connected: false,
        lastCheckedAt: new Date().toISOString(),
        lastError: describeFetchError(error, "state_flush_failed")
      };
    } finally {
      stateFlushInFlight = false;
      if (stateFlushQueued) {
        stateFlushQueued = false;
        scheduleStateFlush();
      }
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
