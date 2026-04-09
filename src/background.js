importScripts("lib/logger.js", "lib/normalize.js", "lib/match.js");

(function () {
  "use strict";

  const CACHE_TTL_MS = 10 * 60 * 1000;
  const REQUEST_TIMEOUT_MS = 8000;
  const MAX_CONCURRENCY = 4;
  const MAX_ROWS = 120;
  const MAX_LOG_ENTRIES = 500;
  const MAX_AUTO_RETRIES = 3;
  const LOG_STORAGE_KEY = "dirobLogs";
  const LOG_HELPER_BASE_URL = "http://127.0.0.1:45173";
  const LOG_FLUSH_BATCH_SIZE = 20;
  const inFlightQueries = new Map();
  const inFlightSourceResolvers = new Map();
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
  let logFlushTimer = null;
  let stateFlushTimer = null;
  let stateSnapshotSerial = 0;
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
      "dirobPanelActive"
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
  });

  chrome.tabs.onActivated.addListener((activeInfo) => {
    if (panelActive && activeInfo?.tabId != null) {
      softRescanTab(activeInfo.tabId).catch(() => {});
    }
    notifyPanels();
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (typeof changeInfo.url === "string") {
      const state = ensureTabState(tabId);
      if (state.pageUrl && state.pageUrl !== changeInfo.url) {
        resetPageState(state);
        state.pageKey = "";
        state.pageUrl = changeInfo.url;
        state.pageMode = "unsupported";
        state.isSupported = false;
      }
      if (panelActive) {
        softRescanTab(tabId).catch(() => {});
      }
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
    tabStates.delete(tabId);
    notifyPanels();
  });

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

    if (message.type === "DIROB_PAGE_CONTEXT") {
      const tabId = sender.tab?.id;
      if (tabId != null) {
        const state = ensureTabState(tabId);
        const nextSite = message.payload?.site || "unsupported";
        const nextPageUrl = message.payload?.pageUrl || sender.tab?.url || "";
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
          pageUrl: state.pageUrl
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
        const syncPageKey =
          message.payload?.pageKey ||
          `${message.payload?.site || state.site}|${message.payload?.mode || state.pageMode || "unsupported"}|${
            message.payload?.pageUrl || state.pageUrl || ""
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
        syncRowsIntoState(state, message.payload?.rows || []);
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
          rows: state.rows.size
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
        const focusPageKey =
          message.payload?.pageKey ||
          `${message.payload?.site || state.site}|${message.payload?.mode || state.pageMode || "unsupported"}|${
            message.payload?.pageUrl || state.pageUrl || ""
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

  function queueMatchRequest(tabId, item, options, stateOverride) {
    const targetSite = getTargetSite(item.sourceSite);
    if (!targetSite) {
      return;
    }
    const state = stateOverride || ensureTabState(tabId);
    const row = state.rows.get(item.sourceId);
    const isManual = Boolean(options?.bustCache);
    const query = buildCleanMatchQuery(item);
    const queryKey = `${item.sourceSite}:${targetSite}:${globalThis.DirobNormalize.normalizeText(query)}`;

    if (row) {
      if (isManual) {
        row.retryCountMatch = 0;
      } else {
        if (row.isLoading) {
          return;
        }
        if (row.match && row.match.status && row.match.status !== "loading") {
          return;
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
        row.match = {
          sourceSite: item.sourceSite,
          targetSite,
          query: item.title,
          status: "loading",
          confidence: 0,
          matchedTitle: null,
          targetPriceText: null,
          targetPriceValue: null,
          targetUrl:
            targetSite === "torob"
              ? globalThis.DirobNormalize.buildTorobSearchUrl(item.title)
              : globalThis.DirobNormalize.buildDigikalaSearchUrl(item.title),
          moreInfoUrl: null,
          sellerCount: null,
          reason: "loading",
          googleUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title),
          searchUrl:
            targetSite === "torob"
              ? globalThis.DirobNormalize.buildTorobSearchUrl(item.title)
              : globalThis.DirobNormalize.buildDigikalaSearchUrl(item.title)
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
      result =
        job.targetSite === "torob"
          ? await fetchTorobMatch(job.item, job.query)
          : await fetchDigikalaMatch(job.item, job.query);
      state.matchCache.set(job.queryKey, {
        result,
        expiresAt: Date.now() + CACHE_TTL_MS
      });
    } catch (error) {
      addLog("error", "background", "match_failed", {
        sourceId: job.item.sourceId,
        targetSite: job.targetSite,
        query: job.query,
        error
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
      targetUrl:
        targetSite === "torob"
          ? globalThis.DirobNormalize.buildTorobSearchUrl(query)
          : globalThis.DirobNormalize.buildDigikalaSearchUrl(query),
      moreInfoUrl: null,
      sellerCount: null,
      reason: error?.message || "request_failed",
      googleUrl: globalThis.DirobNormalize.buildGoogleSearchUrl(item.title),
      searchUrl:
        targetSite === "torob"
          ? globalThis.DirobNormalize.buildTorobSearchUrl(query)
          : globalThis.DirobNormalize.buildDigikalaSearchUrl(query)
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
          error
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

  function getTargetSite(sourceSite) {
    if (sourceSite === "digikala") {
      return "torob";
    }
    if (sourceSite === "torob") {
      return "digikala";
    }
    return null;
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

  async function fetchJsonWithRetry(url) {
    try {
      return await fetchJson(url);
    } catch (error) {
      if (error?.message === "timeout" || error?.message === "network_error") {
        return fetchJson(url);
      }
      throw error;
    }
  }

  async function fetchJson(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal
      });

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
      logCount: logEntries.length,
      logHelper: { ...logHelperStatus },
      page: serializePageState(state, activeTab)
    };
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
      .slice(0, MAX_ROWS)
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
    const queryKey = `${row.item.sourceSite}:${getTargetSite(row.item.sourceSite)}:${globalThis.DirobNormalize.normalizeText(buildCleanMatchQuery(row.item))}`;
    state.matchCache.delete(queryKey);
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
        themeMode
      },
      activeTabId: activeTab?.id || null,
      activePage: activeState ? serializePageState(activeState, activeTab) : null,
      tabs
    };
  }
})();
