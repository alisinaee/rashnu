(function () {
  "use strict";

  const extractor = globalThis.DirobListingExtractor;
  const logger = globalThis.DirobLogger;
  const mutationObserver = new MutationObserver(handleDomMutation);
  const DIROB_MUTATION_IGNORE_SELECTOR =
    '[data-dirob-guide-badge], [data-dirob-highlight], [data-dirob-transient-highlight], #dirob-selection-style, #dirob-guide-style, [data-dirob-role]';
  let observedElements = new WeakSet();
  let sourceIdToRecord = new Map();
  let rowState = new Map();
  let intersectionObserver = null;
  let debugEnabled = false;
  let selectionModeEnabled = false;
  let guideNumbersEnabled = false;
  let panelActive = false;
  let highlightedElement = null;
  let bootAttempts = 0;
  let syncTimer = null;
  let pageContext = null;
  let currentPageKey = "";
  let refreshRevision = 0;
  let focusedSourceId = null;
  let runtimeListenerBound = false;
  let storageListenerBound = false;
  let transientHighlightElement = null;
  let transientHighlightTimer = null;
  let lastPageContextSignature = "";
  let lastSyncSignature = "";
  let navigationListenersBound = false;
  let lastKnownHref = location.href;
  let locationPollTimer = null;
  let navigationRescanTimer = null;
  let navigationRescanAttempts = 0;
  let navigationRescanNonce = 0;

  boot().catch(() => {});

  async function boot() {
    logger.info("content", "boot");
    await startWhenReady();
  }

  async function startWhenReady() {
    bootAttempts += 1;
    ensureNavigationListeners();
    pageContext = extractor.getPageContext();
    await syncSettings();
    await notifyPageState();

    if (!pageContext.isSupported) {
      if (bootAttempts < 12) {
        window.setTimeout(() => {
          startWhenReady().catch(() => {});
        }, 800);
      }
      logger.debug("content", "unsupported_page", {
        site: pageContext.site,
        pageUrl: pageContext.pageUrl
      });
      return;
    }

    logger.info("content", "supported_page", {
      site: pageContext.site,
      pageUrl: pageContext.pageUrl
    });

    ensureRuntimeListener();

    ensureStorageListener();

    intersectionObserver = new IntersectionObserver(handleIntersection, {
      root: null,
      threshold: 0.2
    });

    refreshCards();
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async function syncSettings() {
    const stored = await chrome.storage.local.get([
      "dirobDebugEnabled",
      "dirobSelectionModeEnabled",
      "dirobGuideNumbersEnabled",
      "dirobPanelActive"
    ]);
    debugEnabled = Boolean(stored.dirobDebugEnabled);
    selectionModeEnabled = Boolean(stored.dirobSelectionModeEnabled);
    guideNumbersEnabled = Boolean(stored.dirobGuideNumbersEnabled);
    panelActive = Boolean(stored.dirobPanelActive);
    ensureHighlightStyle();
    ensureGuideStyle();
    if (!selectionModeEnabled || !panelActive) {
      clearHighlightedElement();
    }
    if (panelActive) {
      renderGuideBadges();
    } else {
      clearGuideBadges();
      focusedSourceId = null;
    }
  }

  async function notifyPageState() {
    pageContext = extractor.getPageContext();
    resetLocalStateIfNeeded(pageContext);
    const signature = JSON.stringify({
      pageKey: currentPageKey,
      pageUrl: pageContext.pageUrl,
      site: pageContext.site,
      mode: pageContext.mode,
      isSupported: pageContext.isSupported
    });
    if (signature === lastPageContextSignature) {
      return;
    }
    lastPageContextSignature = signature;
    logger.debug("content", "page_context", pageContext);
    await safeSendMessage({
      type: "DIROB_PAGE_CONTEXT",
      payload: pageContext
    });
  }

  async function refreshCards() {
    const revision = ++refreshRevision;
    pageContext = extractor.getPageContext();
    resetLocalStateIfNeeded(pageContext);
    if (!panelActive) {
      clearGuideBadges();
      clearHighlightedElement();
      return;
    }
    if (!pageContext.isSupported) {
      return;
    }

    const records = await Promise.resolve(extractor.scanPageItems());
    if (revision !== refreshRevision) {
      return;
    }
    logger.debug("content", "refresh_cards", {
      mode: pageContext.mode,
      site: pageContext.site,
      count: records.length
    });

    for (const record of records) {
      const existing = sourceIdToRecord.get(record.item.sourceId);
      if (!existing) {
        sourceIdToRecord.set(record.item.sourceId, record);
        rowState.set(record.item.sourceId, {
          item: record.item,
          isVisible: computeRecordVisibility(record),
          lastSeenAt: record.item.seenAt
        });
      } else {
        existing.element = record.element;
        existing.item = mergeItemSnapshot(existing.item, record.item);
        const row = rowState.get(record.item.sourceId);
        if (row) {
          row.item = existing.item;
          row.isVisible = computeRecordVisibility(existing, row.isVisible);
        }
      }

      if (record.element && !observedElements.has(record.element)) {
        observedElements.add(record.element);
        intersectionObserver.observe(record.element);
        bindSelectionListeners(record.element, record.item.sourceId);
      }
    }

    renderGuideBadges();

    if (pageContext.mode === "detail" && records[0]?.item?.sourceId) {
      const row = rowState.get(records[0].item.sourceId);
      if (row) {
        row.lastSeenAt = Date.now();
        if (selectionModeEnabled) {
          if (focusedSourceId && focusedSourceId !== records[0].item.sourceId) {
            scheduleSync();
            return;
          }
          focusedSourceId = records[0].item.sourceId;
          setHighlightedElement(records[0].element);
          safeSendMessage({
            type: "DIROB_ITEM_FOCUS",
            payload: {
              pageKey: currentPageKey,
              pageUrl: pageContext?.pageUrl || location.href,
              mode: pageContext?.mode || "unsupported",
              site: pageContext?.site || "unsupported",
              item: {
                ...row.item,
                seenAt: Date.now()
              }
            }
          });
        }
      }
    }

    scheduleSync();
  }

  function handleIntersection(entries) {
    for (const entry of entries) {
      const record = findRecordByElement(entry.target);
      if (!record) {
        continue;
      }
      const row = rowState.get(record.item.sourceId);
      if (!row) {
        continue;
      }

      row.isVisible = entry.isIntersecting;
      row.lastSeenAt = Date.now();
    }

    scheduleSync();
  }

  function findRecordByElement(element) {
    for (const record of sourceIdToRecord.values()) {
      if (record.element === element) {
        return record;
      }
    }
    return null;
  }

  function bindSelectionListeners(element, sourceId) {
    const handleEnter = () => {
      if (!selectionModeEnabled || !panelActive) {
        return;
      }
      const row = rowState.get(sourceId);
      if (!row) {
        return;
      }
      focusedSourceId = sourceId;
      setHighlightedElement(element);
      safeSendMessage({
        type: "DIROB_ITEM_FOCUS",
        payload: {
          pageKey: currentPageKey,
          pageUrl: pageContext?.pageUrl || location.href,
          mode: pageContext?.mode || "unsupported",
          site: pageContext?.site || "unsupported",
          item: {
            ...row.item,
            seenAt: Date.now()
          }
        }
      });
      logger.debug("content", "item_focus", {
        sourceId,
        title: row.item.title
      });
    };

    element.addEventListener("mouseenter", handleEnter, true);
    element.addEventListener("focusin", handleEnter, true);
    element.addEventListener(
      "mouseleave",
      () => {
        if (highlightedElement === element) {
          clearHighlightedElement();
        }
      },
      true
    );
    element.addEventListener(
      "focusout",
      () => {
        if (highlightedElement === element) {
          clearHighlightedElement();
        }
      },
      true
    );
  }

  function scheduleSync() {
    if (!panelActive) {
      return;
    }
    if (syncTimer) {
      return;
    }

    syncTimer = window.setTimeout(async () => {
      syncTimer = null;
      const rows = Array.from(rowState.values()).map((row) => ({
        item: {
          ...row.item
        },
        isVisible: row.isVisible,
        lastSeenAt: row.lastSeenAt || row.item.seenAt
      }));
      const activeRecord = computeActiveVisibleRecord();
      const syncSignature = JSON.stringify({
        pageKey: currentPageKey,
        activeGuideNumber: activeRecord?.item?.guideNumber || null,
        activeSourceId: activeRecord?.item?.sourceId || null,
        selectionModeEnabled,
        focusedSourceId,
        rows: rows.map((row) => ({
          sourceId: row.item.sourceId,
          guideNumber: row.item.guideNumber || null,
          title: row.item.title || "",
          price: row.item.displayPriceText || "",
          originalPrice: row.item.displayOriginalPriceText || "",
          discountPercent: row.item.displayDiscountPercent || "",
          imageUrl: row.item.imageUrl || "",
          isVisible: Boolean(row.isVisible)
        }))
      });

      if (syncSignature === lastSyncSignature) {
        return;
      }
      lastSyncSignature = syncSignature;

      await safeSendMessage({
        type: "DIROB_SYNC_ITEMS",
        payload: {
          pageKey: currentPageKey,
          pageUrl: pageContext?.pageUrl || location.href,
          site: pageContext?.site || "unsupported",
          mode: pageContext?.mode || "unsupported",
          activeGuideNumber: activeRecord?.item?.guideNumber || null,
          activeSourceId: activeRecord?.item?.sourceId || null,
          rows
        }
      });
      logger.debug("content", "sync_sent", {
        site: pageContext?.site || "unsupported",
        rows: rows.length
      });
    }, 250);
  }

  function handleDomMutation(mutations) {
    if (!panelActive) {
      return;
    }
    if (!shouldRefreshForMutations(mutations)) {
      logger.debug("content", "mutation_ignored", {
        count: Array.isArray(mutations) ? mutations.length : 0
      });
      return;
    }
    window.clearTimeout(handleDomMutation._timerId);
    handleDomMutation._timerId = window.setTimeout(async () => {
      await notifyPageState();
      refreshCards();
    }, 300);
  }

  async function handleForcedRescan() {
    resetLocalState();
    pageContext = extractor.getPageContext();
    await syncSettings();
    await notifyPageState();
    if (panelActive) {
      refreshCards();
    }
  }

  async function handleSoftRescan() {
    pageContext = extractor.getPageContext();
    await syncSettings();
    await notifyPageState();
    if (panelActive) {
      refreshCards();
    }
  }

  function handleScrollToItem(sourceId) {
    const record = sourceId ? sourceIdToRecord.get(sourceId) : null;
    if (!record?.element) {
      return false;
    }
    record.element.scrollIntoView({
      block: "center",
      behavior: "smooth"
    });
    pulseHighlightElement(record.element);
    return true;
  }

  function ensureRuntimeListener() {
    if (runtimeListenerBound) {
      return;
    }
    runtimeListenerBound = true;
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === "DIROB_FORCE_RESCAN") {
        handleForcedRescan().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
        return true;
      }
      if (message?.type === "DIROB_SOFT_RESCAN") {
        handleSoftRescan().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
        return true;
      }
      if (message?.type === "DIROB_SCROLL_TO_ITEM") {
        sendResponse({
          ok: handleScrollToItem(message.payload?.sourceId)
        });
        return false;
      }
      return false;
    });
  }

  function ensureNavigationListeners() {
    if (navigationListenersBound) {
      return;
    }
    navigationListenersBound = true;

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const handleLocationChange = () => {
      if (lastKnownHref === location.href) {
        return;
      }
      lastKnownHref = location.href;
      resetLocalState();
      notifyPageState().catch(() => {});
      if (panelActive) {
        scheduleNavigationRescan();
      }
    };

    history.pushState = function patchedPushState(...args) {
      const result = originalPushState.apply(this, args);
      handleLocationChange();
      return result;
    };

    history.replaceState = function patchedReplaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      handleLocationChange();
      return result;
    };

    window.addEventListener("popstate", handleLocationChange, true);
    window.addEventListener("hashchange", handleLocationChange, true);
    window.addEventListener(
      "pageshow",
      () => {
        if (lastKnownHref !== location.href) {
          handleLocationChange();
          return;
        }
        if (panelActive) {
          scheduleNavigationRescan();
        }
      },
      true
    );

    locationPollTimer = window.setInterval(handleLocationChange, 800);
  }

  function scheduleNavigationRescan() {
    navigationRescanNonce += 1;
    const nonce = navigationRescanNonce;
    navigationRescanAttempts = 0;
    if (navigationRescanTimer) {
      window.clearTimeout(navigationRescanTimer);
      navigationRescanTimer = null;
    }

    const runAttempt = async () => {
      if (nonce !== navigationRescanNonce) {
        return;
      }
      navigationRescanAttempts += 1;
      await notifyPageState();
      if (!panelActive) {
        navigationRescanTimer = null;
        return;
      }
      await refreshCards();
      const hasRows = rowState.size > 0;
      const shouldContinue = navigationRescanAttempts < 8 && (!pageContext?.isSupported || !hasRows);
      if (!shouldContinue) {
        navigationRescanTimer = null;
        return;
      }
      navigationRescanTimer = window.setTimeout(() => {
        runAttempt().catch(() => {});
      }, 280);
    };

    navigationRescanTimer = window.setTimeout(() => {
      runAttempt().catch(() => {});
    }, 220);
  }

  function ensureStorageListener() {
    if (storageListenerBound) {
      return;
    }
    storageListenerBound = true;
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }
      if (Object.prototype.hasOwnProperty.call(changes, "dirobDebugEnabled")) {
        debugEnabled = Boolean(changes.dirobDebugEnabled.newValue);
      }
      if (Object.prototype.hasOwnProperty.call(changes, "dirobSelectionModeEnabled")) {
        selectionModeEnabled = Boolean(changes.dirobSelectionModeEnabled.newValue);
        if (!selectionModeEnabled) {
          clearHighlightedElement();
          focusedSourceId = null;
        } else {
          ensureHighlightStyle();
        }
        scheduleSync();
      }
      if (Object.prototype.hasOwnProperty.call(changes, "dirobGuideNumbersEnabled")) {
        guideNumbersEnabled = Boolean(changes.dirobGuideNumbersEnabled.newValue);
        ensureGuideStyle();
        if (panelActive) {
          renderGuideBadges();
        } else {
          clearGuideBadges();
        }
      }
      if (Object.prototype.hasOwnProperty.call(changes, "dirobPanelActive")) {
        panelActive = Boolean(changes.dirobPanelActive.newValue);
        if (!panelActive) {
          clearGuideBadges();
          clearHighlightedElement();
          focusedSourceId = null;
          resetLocalState();
          notifyPageState().catch(() => {});
          return;
        }
        notifyPageState().catch(() => {});
        scheduleNavigationRescan();
      }
    });
  }

  function buildPageKey(context) {
    return `${context.site}|${context.mode}|${context.pageUrl}`;
  }

  function resetLocalStateIfNeeded(context) {
    const nextPageKey = buildPageKey(context);
    if (nextPageKey === currentPageKey) {
      return;
    }
    currentPageKey = nextPageKey;
    resetLocalState();
  }

  function resetLocalState() {
    if (syncTimer) {
      window.clearTimeout(syncTimer);
      syncTimer = null;
    }
    clearHighlightedElement();
    clearGuideBadges();
    sourceIdToRecord = new Map();
    rowState = new Map();
    observedElements = new WeakSet();
    focusedSourceId = null;
    lastPageContextSignature = "";
    lastSyncSignature = "";
    refreshRevision += 1;
    if (intersectionObserver) {
      intersectionObserver.disconnect();
      intersectionObserver = new IntersectionObserver(handleIntersection, {
        root: null,
        threshold: 0.2
      });
    }
  }

  function ensureHighlightStyle() {
    if (document.getElementById("dirob-selection-style")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "dirob-selection-style";
    style.textContent = `
      [data-dirob-highlight="true"] {
        outline: 2px solid #ff8c42 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(255, 140, 66, 0.18) !important;
      }
      [data-dirob-transient-highlight="true"] {
        outline: 2px solid #6fb7ff !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 5px rgba(111, 183, 255, 0.2) !important;
        animation: dirob-pulse-highlight 1200ms ease;
      }
      @keyframes dirob-pulse-highlight {
        0% { box-shadow: 0 0 0 0 rgba(111, 183, 255, 0.32); }
        70% { box-shadow: 0 0 0 8px rgba(111, 183, 255, 0); }
        100% { box-shadow: 0 0 0 0 rgba(111, 183, 255, 0); }
      }
    `;
    document.documentElement.appendChild(style);
  }

  function setHighlightedElement(element) {
    if (!selectionModeEnabled || !(element instanceof HTMLElement)) {
      return;
    }
    ensureHighlightStyle();
    if (highlightedElement && highlightedElement !== element) {
      highlightedElement.removeAttribute("data-dirob-highlight");
    }
    highlightedElement = element;
    highlightedElement.setAttribute("data-dirob-highlight", "true");
  }

  function clearHighlightedElement() {
    if (!highlightedElement) {
      return;
    }
    highlightedElement.removeAttribute("data-dirob-highlight");
    highlightedElement = null;
  }

  function pulseHighlightElement(element, duration = 1400) {
    if (!(element instanceof HTMLElement)) {
      return;
    }
    if (transientHighlightElement && transientHighlightElement !== element) {
      transientHighlightElement.removeAttribute("data-dirob-transient-highlight");
    }
    transientHighlightElement = element;
    transientHighlightElement.setAttribute("data-dirob-transient-highlight", "true");
    window.clearTimeout(transientHighlightTimer);
    transientHighlightTimer = window.setTimeout(() => {
      transientHighlightElement?.removeAttribute("data-dirob-transient-highlight");
      transientHighlightElement = null;
    }, duration);
  }

  function ensureGuideStyle() {
    if (document.getElementById("dirob-guide-style")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "dirob-guide-style";
    style.textContent = `
      .dirob-guide-badge {
        position: absolute;
        inset-inline-start: 8px;
        inset-block-start: 8px;
        z-index: 2147483647;
        display: inline-flex;
        min-width: 26px;
        height: 26px;
        align-items: center;
        justify-content: center;
        padding: 0 8px;
        border-radius: 999px;
        background: rgba(17, 19, 23, 0.92);
        border: 1px solid rgba(255, 140, 66, 0.5);
        color: #ffb36b;
        font: 700 12px/1 "SF Pro Display", "Segoe UI", Tahoma, sans-serif;
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
        pointer-events: auto;
        cursor: pointer;
        transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
      }
      .dirob-guide-badge:hover {
        transform: translateY(-1px);
        border-color: rgba(111, 183, 255, 0.72);
        background: rgba(17, 19, 23, 0.98);
      }
    `;
    document.documentElement.appendChild(style);
  }

  function renderGuideBadges() {
    clearGuideBadges();
    if (!guideNumbersEnabled || !panelActive) {
      return;
    }

    for (const record of sourceIdToRecord.values()) {
      if (!(record.element instanceof HTMLElement)) {
        continue;
      }
      ensureElementPositioning(record.element);
      const badge = document.createElement("span");
      badge.className = "dirob-guide-badge";
      badge.setAttribute("data-dirob-guide-badge", "true");
      badge.setAttribute("data-source-id", record.item.sourceId);
      badge.textContent = String(record.item.guideNumber || (record.item.position || 0) + 1);
      badge.addEventListener("mouseenter", () => {
        pulseHighlightElement(record.element, 700);
        safeSendMessage({
          type: "DIROB_GUIDE_BADGE_HOVER",
          payload: {
            sourceId: record.item.sourceId
          }
        });
      });
      badge.addEventListener("mouseleave", () => {
        safeSendMessage({
          type: "DIROB_GUIDE_BADGE_HOVER",
          payload: {
            sourceId: null
          }
        });
      });
      badge.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        pulseHighlightElement(record.element);
        safeSendMessage({
          type: "DIROB_GUIDE_BADGE_CLICK",
          payload: {
            sourceId: record.item.sourceId
          }
        });
      });
      record.element.appendChild(badge);
    }
  }

  function clearGuideBadges() {
    document.querySelectorAll("[data-dirob-guide-badge='true']").forEach((node) => {
      node.remove();
    });
    document.querySelectorAll("[data-dirob-guide-owner='true']").forEach((element) => {
      if (!(element instanceof HTMLElement)) {
        return;
      }
      const previous = element.getAttribute("data-dirob-prev-position");
      if (previous != null) {
        element.style.position = previous;
      } else {
        element.style.removeProperty("position");
      }
      element.removeAttribute("data-dirob-prev-position");
      element.removeAttribute("data-dirob-guide-owner");
    });
  }

  function ensureElementPositioning(element) {
    if (!(element instanceof HTMLElement)) {
      return;
    }
    if (element.getAttribute("data-dirob-guide-owner") === "true") {
      return;
    }
    const computed = window.getComputedStyle(element).position;
    if (computed === "static") {
      element.setAttribute("data-dirob-prev-position", element.style.position || "");
      element.style.position = "relative";
      element.setAttribute("data-dirob-guide-owner", "true");
    }
  }

  async function safeSendMessage(message) {
    if (!globalThis.chrome?.runtime?.id) {
      return null;
    }
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (_error) {
      return null;
    }
  }

  function computeRecordVisibility(record, fallbackValue) {
    if (!record?.element) {
      if (typeof fallbackValue === "boolean") {
        return fallbackValue;
      }
      return pageContext?.mode === "detail" && record?.item?.detailRole === "main";
    }
    return computeElementVisibility(record.element);
  }

  function computeElementVisibility(element) {
    if (!(element instanceof Element)) {
      return false;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (viewportWidth <= 0 || viewportHeight <= 0) {
      return false;
    }
    const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
    const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
    return visibleWidth > 24 && visibleHeight > 24;
  }

  function computeActiveVisibleRecord() {
    const candidates = Array.from(rowState.values())
      .map((row) => {
        if (!row.isVisible) {
          return null;
        }
        const record = sourceIdToRecord.get(row.item.sourceId);
        if (!record?.element) {
          return null;
        }
        const rect = record.element.getBoundingClientRect();
        return {
          record,
          top: Math.max(rect.top, 0),
          guideNumber: Number.isFinite(row.item.guideNumber) ? row.item.guideNumber : Number.MAX_SAFE_INTEGER
        };
      })
      .filter(Boolean);

    if (!candidates.length) {
      if (pageContext?.mode === "detail") {
        return Array.from(sourceIdToRecord.values()).find((record) => record.item?.detailRole === "main") || null;
      }
      return null;
    }

    candidates.sort((left, right) => {
      if (left.top !== right.top) {
        return left.top - right.top;
      }
      return left.guideNumber - right.guideNumber;
    });

    return candidates[0].record || null;
  }

  function mergeItemSnapshot(previousItem, nextItem) {
    const merged = {
      ...previousItem,
      ...nextItem
    };
    const preserveFields = [
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

    for (const field of preserveFields) {
      if (hasMeaningfulValue(previousItem?.[field]) && !hasMeaningfulValue(nextItem?.[field])) {
        merged[field] = previousItem[field];
      }
    }

    return merged;
  }

  function hasMeaningfulValue(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) && value > 0;
    }
    if (typeof value === "string") {
      const normalized = value.trim();
      return normalized !== "" && normalized !== "نامشخص" && normalized.toLowerCase() !== "unknown";
    }
    return Boolean(value);
  }

  function shouldRefreshForMutations(mutations) {
    if (!Array.isArray(mutations) || !mutations.length) {
      return false;
    }

    for (const mutation of mutations) {
      if (isDirobNode(mutation.target)) {
        continue;
      }
      if (hasMeaningfulMutationNodes(mutation.addedNodes) || hasMeaningfulMutationNodes(mutation.removedNodes)) {
        return true;
      }
    }

    return false;
  }

  function hasMeaningfulMutationNodes(nodeList) {
    for (const node of Array.from(nodeList || [])) {
      if (isDirobNode(node)) {
        continue;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        continue;
      }
      if (!(node instanceof Element)) {
        continue;
      }
      if (node.matches?.("script, style, noscript")) {
        continue;
      }
      if (node.querySelector?.(DIROB_MUTATION_IGNORE_SELECTOR)) {
        const hasExternalNodes = Array.from(node.children || []).some((child) => !isDirobNode(child));
        if (!hasExternalNodes) {
          continue;
        }
      }
      if (isMeaningfulProductMutation(node)) {
        return true;
      }
    }
    return false;
  }

  function isDirobNode(node) {
    if (!node) {
      return false;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      return isDirobNode(node.parentElement);
    }
    if (!(node instanceof Element)) {
      return false;
    }
    return Boolean(node.matches?.(DIROB_MUTATION_IGNORE_SELECTOR) || node.closest?.(DIROB_MUTATION_IGNORE_SELECTOR));
  }

  function isMeaningfulProductMutation(node) {
    const selectors = [
      'a[href*="/product/"]',
      'a[href*="/p/"]',
      'a[href^="/product/"]',
      'a[href^="/p/"]',
      "article",
      "li",
      "[data-testid*='price']",
      "h1",
      "img"
    ];
    return selectors.some((selector) => node.matches?.(selector) || node.querySelector?.(selector));
  }
})();
