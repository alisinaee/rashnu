(function () {
  "use strict";

  const logger = globalThis.DirobLogger;
  const summaryText = document.querySelector("[data-summary-text]");
  const pageModeText = document.querySelector("[data-page-mode]");
  const itemsList = document.querySelector("[data-items-list]");
  const settingsPanel = document.querySelector(".settings-panel");
  const settingsBody = document.querySelector("[data-settings-body]");
  const settingsTitle = document.querySelector("[data-settings-title]");
  const settingsHelp = document.querySelector("[data-settings-help]");
  const layoutLabel = document.querySelector("[data-layout-label]");
  const fontLabel = document.querySelector("[data-font-label]");
  const logMetaText = document.querySelector("[data-log-meta]");
  const logPathText = document.querySelector("[data-log-path]");
  const helperStatusText = document.querySelector("[data-log-helper-status]");
  const fontMetaText = document.querySelector("[data-font-meta]");
  const reloadAllButton = document.querySelector('[data-action="reload-all"]');
  const toggleSettingsButton = document.querySelector('[data-action="toggle-settings"]');
  const helpButton = document.querySelector('[data-action="open-help"]');
  const themeButton = document.querySelector('[data-action="cycle-theme"]');
  const closeSettingsButton = document.querySelector('[data-action="close-settings"]');
  const selectionButton = document.querySelector('[data-action="toggle-selection"]');
  const syncPageViewButton = document.querySelector('[data-action="toggle-sync-page-view"]');
  const minimalViewButton = document.querySelector('[data-action="toggle-minimal-view"]');
  const debugButton = document.querySelector('[data-action="toggle-debug"]');
  const languageButton = document.querySelector('[data-action="toggle-language"]');
  const autoLogsButton = document.querySelector('[data-action="toggle-auto-logs"]');
  const guideNumbersButton = document.querySelector('[data-action="toggle-guide-numbers"]');
  const layoutListButton = document.querySelector('[data-action="set-layout-list"]');
  const layoutGridButton = document.querySelector('[data-action="set-layout-grid"]');
  const fontDownButton = document.querySelector('[data-action="font-down"]');
  const fontUpButton = document.querySelector('[data-action="font-up"]');
  const clearLogsButton = document.querySelector('[data-action="clear-logs"]');
  const switchLabels = {
    selection: document.querySelector('[data-switch-label="selection"]'),
    syncPageView: document.querySelector('[data-switch-label="sync-page-view"]'),
    minimalView: document.querySelector('[data-switch-label="minimal-view"]'),
    debug: document.querySelector('[data-switch-label="debug"]'),
    autoLogs: document.querySelector('[data-switch-label="auto-logs"]'),
    guideNumbers: document.querySelector('[data-switch-label="guide-numbers"]')
  };

  const TRANSLATIONS = {
    fa: {
      pageWaiting: "منتظر یک صفحه پشتیبانی‌شده...",
      unsupportedPage: "این تب در حال حاضر صفحه‌ی فهرست یا جزئیات محصول در دیجیکالا یا ترب نیست.",
      modeTitle: "{source} → {target}",
      settingsDefault: "حالت عادی: محصولات قابل مشاهده روی صفحه بررسی می‌شوند.",
      settingsSelection:
        "حالت انتخاب عنصر روشن است: فقط محصولی که روی آن می‌روید یا فوکوس می‌کنید نمایش داده می‌شود.",
      logsMeta: "تعداد لاگ‌ها: {count}",
      clearLogs: "پاک کردن",
      reloadAll: "بارگذاری دوباره همه",
      sizeMeta: "اندازه: {value}",
      settingsTitle: "تنظیمات",
      settingsClose: "بستن",
      settingsOpen: "تنظیمات",
      help: "راهنما",
      theme: "تم",
      theme_system: "خودکار",
      theme_dark: "تیره",
      theme_light: "روشن",
      debug: "دیباگ",
      elementSelect: "انتخاب عنصر",
      syncPageView: "همگام با دید صفحه",
      minimalView: "نمای مینیمال",
      guideNumbers: "شماره راهنما",
      autoLogs: "ثبت خودکار لاگ",
      layout: "چیدمان",
      layoutList: "لیست",
      layoutGrid: "گرید",
      fontSize: "اندازه",
      unsupportedEmpty:
        "برای استفاده از Dirob یک صفحه‌ی فهرست یا جزئیات محصول در دیجیکالا یا ترب باز کنید.",
      selectionEmpty: "ماوس را روی یک کارت محصول ببرید یا روی آن فوکوس کنید.",
      noItems: "هنوز نتیجه‌ای برای نمایش وجود ندارد.",
      summarySelection:
        "حالت انتخاب عنصر فعال است. ماوس را روی یک محصول ببرید تا فقط همان بررسی شود.",
      summaryItems: "{visible} محصول فعال | {count} مورد در پنل",
      summaryNoItems: "هنوز محصولی از این صفحه به Dirob نرسیده است.",
      sectionMain: "محصول اصلی",
      sectionSuggested: "محصولات پیشنهادی",
      retries: "تلاش: {value}",
      sourcePrice: "{site}",
      targetPrice: "{site}",
      originalPrice: "قبل از تخفیف",
      discount: "تخفیف",
      confidence: "اعتماد: {value}",
      sellers: "فروشنده: {value}",
      openTarget: "باز کردن {site}",
      searchTarget: "جست‌وجوی {site}",
      google: "جست‌وجوی گوگل",
      reloadItem: "↻",
      status_loading: "در حال جست‌وجو",
      status_matched: "تطابق خوب",
      status_low_confidence: "نیاز به بررسی",
      status_not_found: "پیدا نشد",
      status_error: "خطا",
      unknown: "نامشخص",
      noExact: "بدون تطابق قطعی",
      detailHint: "این صفحه جزئیات محصول است و همان محصول اصلی بررسی می‌شود.",
      listingHint: "این صفحه فهرست محصولات است و موارد قابل مشاهده بررسی می‌شوند.",
      langButton: "FA / EN",
      autoLogsOn: "لاگ خودکار روشن",
      autoLogsOff: "لاگ خودکار خاموش",
      logHelperConnected: "ثبت لاگ محلی وصل است",
      logHelperDisconnected: "ثبت لاگ محلی قطع است",
      logPathReady: "لاگ‌ها در {path} ذخیره می‌شوند.",
      logPathDisconnected: "برای ذخیره لاگ‌ها `./run-dirob-helper` را در ریشه پروژه اجرا کنید.",
      locateItem: "رفتن به محصول"
    },
    en: {
      pageWaiting: "Waiting for a supported page...",
      unsupportedPage: "This tab is not a Digikala or Torob product listing/detail page.",
      modeTitle: "{source} → {target}",
      settingsDefault: "Normal mode: visible products on the page are tracked.",
      settingsSelection:
        "Element select mode is on: only the product under hover/focus is shown.",
      logsMeta: "Logs: {count}",
      clearLogs: "Clear",
      reloadAll: "Reload All",
      sizeMeta: "Size: {value}",
      settingsTitle: "Settings",
      settingsClose: "Close",
      settingsOpen: "Settings",
      help: "Help",
      theme: "Theme",
      theme_system: "System",
      theme_dark: "Dark",
      theme_light: "Light",
      debug: "Debug",
      elementSelect: "Element Select",
      syncPageView: "Sync Page View",
      minimalView: "Minimal View",
      guideNumbers: "Guide Numbers",
      autoLogs: "Auto Logs",
      layout: "Layout",
      layoutList: "List",
      layoutGrid: "Grid",
      fontSize: "Size",
      unsupportedEmpty: "Open a Digikala or Torob listing/detail page to use Dirob.",
      selectionEmpty: "Hover or focus a product card to inspect just that item.",
      noItems: "No results are ready yet.",
      summarySelection:
        "Element select mode is active. Hover a product to inspect only that one.",
      summaryItems: "{visible} active | {count} in panel",
      summaryNoItems: "No product data has reached Dirob yet.",
      sectionMain: "Main Product",
      sectionSuggested: "Suggested Products",
      retries: "Retries: {value}",
      sourcePrice: "{site}",
      targetPrice: "{site}",
      originalPrice: "Before Discount",
      discount: "Discount",
      confidence: "Confidence: {value}",
      sellers: "Sellers: {value}",
      openTarget: "Open {site}",
      searchTarget: "Search {site}",
      google: "Google",
      reloadItem: "↻",
      status_loading: "Loading",
      status_matched: "Matched",
      status_low_confidence: "Review",
      status_not_found: "Not found",
      status_error: "Error",
      unknown: "Unknown",
      noExact: "No exact match",
      detailHint: "This is a product detail page. Dirob is checking the main product.",
      listingHint: "This is a listing page. Dirob is checking visible products.",
      langButton: "EN / FA",
      autoLogsOn: "Auto logs on",
      autoLogsOff: "Auto logs off",
      logHelperConnected: "Local logger connected",
      logHelperDisconnected: "Local logger disconnected",
      logPathReady: "Logs are written to {path}.",
      logPathDisconnected: "Run `./run-dirob-helper` in the project root to save logs.",
      locateItem: "Locate item"
    }
  };

  let currentState = null;
  let lastStructureFingerprint = "";
  let currentPageFocusSourceId = null;
  let lastPanelFocusNonce = 0;
  let panelScrollHoldUntil = 0;
  let isProgrammaticScroll = false;

  boot().catch((error) => {
    logger.error("panel", "boot_failed", {
      error
    });
    summaryText.textContent = `Dirob error: ${error.message}`;
  });

  async function boot() {
    bindEvents();
    await refreshState();

    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === "DIROB_PANEL_STATE_UPDATED") {
        refreshState().catch(() => {});
      }
      return false;
    });

    chrome.tabs.onActivated.addListener(() => {
      refreshState().catch(() => {});
    });

    chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
      if (changeInfo.status === "complete") {
        refreshState().catch(() => {});
      }
    });
  }

  function bindEvents() {
    reloadAllButton.addEventListener("click", async () => {
      lastStructureFingerprint = "";
      await chrome.runtime.sendMessage({
        type: "DIROB_RELOAD_ALL"
      });
      logger.info("panel", "reload_all_clicked");
      await refreshState();
      window.setTimeout(() => {
        refreshState().catch(() => {});
      }, 450);
      window.setTimeout(() => {
        refreshState().catch(() => {});
      }, 1200);
    });

    toggleSettingsButton.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({
        type: "DIROB_SET_SETTINGS_OPEN",
        payload: { enabled: !Boolean(currentState?.settingsOpen) }
      });
      await refreshState();
    });

    helpButton.addEventListener("click", async () => {
      await chrome.tabs.create({
        url: chrome.runtime.getURL("src/help/help.html")
      });
    });

    themeButton.addEventListener("click", async () => {
      const order = ["system", "dark", "light"];
      const current = order.includes(currentState?.themeMode) ? currentState.themeMode : "system";
      const next = order[(order.indexOf(current) + 1) % order.length];
      await chrome.runtime.sendMessage({
        type: "DIROB_SET_THEME_MODE",
        payload: { themeMode: next }
      });
      await refreshState();
    });

    closeSettingsButton.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({
        type: "DIROB_SET_SETTINGS_OPEN",
        payload: { enabled: false }
      });
      await refreshState();
    });

    selectionButton.addEventListener("click", async () => {
      const enabled = !Boolean(currentState?.selectionModeEnabled);
      await chrome.runtime.sendMessage({
        type: "DIROB_SET_SELECTION_MODE",
        payload: { enabled }
      });
      await refreshState();
    });

    syncPageViewButton.addEventListener("click", async () => {
      const enabled = !Boolean(currentState?.syncPageViewEnabled);
      await chrome.runtime.sendMessage({
        type: "DIROB_SET_SYNC_PAGE_VIEW",
        payload: { enabled }
      });
      await refreshState();
    });

    minimalViewButton.addEventListener("click", async () => {
      const enabled = !Boolean(currentState?.minimalViewEnabled);
      await chrome.runtime.sendMessage({
        type: "DIROB_SET_MINIMAL_VIEW",
        payload: { enabled }
      });
      await refreshState();
    });

    debugButton.addEventListener("click", async () => {
      const enabled = !Boolean(currentState?.debugEnabled);
      await chrome.runtime.sendMessage({
        type: "DIROB_SET_DEBUG",
        payload: { enabled }
      });
      await refreshState();
    });

    autoLogsButton.addEventListener("click", async () => {
      const enabled = !Boolean(currentState?.autoLogsEnabled);
      await chrome.runtime.sendMessage({
        type: "DIROB_SET_AUTO_LOGS",
        payload: { enabled }
      });
      await refreshState();
    });

    guideNumbersButton.addEventListener("click", async () => {
      const enabled = !Boolean(currentState?.guideNumbersEnabled);
      await chrome.runtime.sendMessage({
        type: "DIROB_SET_GUIDE_NUMBERS",
        payload: { enabled }
      });
      await refreshState();
    });

    layoutListButton.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({
        type: "DIROB_SET_LAYOUT_MODE",
        payload: { layoutMode: "list" }
      });
      await refreshState();
    });

    layoutGridButton.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({
        type: "DIROB_SET_LAYOUT_MODE",
        payload: { layoutMode: "grid" }
      });
      await refreshState();
    });

    languageButton.addEventListener("click", async () => {
      const language = currentState?.language === "en" ? "fa" : "en";
      await chrome.runtime.sendMessage({
        type: "DIROB_SET_LANGUAGE",
        payload: { language }
      });
      lastStructureFingerprint = "";
      await refreshState();
    });

    fontDownButton.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({
        type: "DIROB_ADJUST_FONT_SCALE",
        payload: { delta: -1 }
      });
      lastStructureFingerprint = "";
      await refreshState();
    });

    fontUpButton.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({
        type: "DIROB_ADJUST_FONT_SCALE",
        payload: { delta: 1 }
      });
      lastStructureFingerprint = "";
      await refreshState();
    });

    clearLogsButton.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({
        type: "DIROB_CLEAR_LOGS"
      });
      await refreshState();
    });

    itemsList.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-item-action]");
      if (!button) {
        return;
      }

      if (button.getAttribute("data-item-action") === "reload-item") {
        const sourceId = button.getAttribute("data-source-id");
        await chrome.runtime.sendMessage({
          type: "DIROB_RELOAD_ITEM",
          payload: { sourceId }
        });
        await refreshState();
        return;
      }

      if (button.getAttribute("data-item-action") === "locate-item") {
        const sourceId = button.getAttribute("data-source-id");
        await chrome.runtime.sendMessage({
          type: "DIROB_LOCATE_ITEM",
          payload: { sourceId }
        });
        return;
      }
    });

    itemsList.addEventListener("wheel", markPanelUserScrolling, {
      passive: true
    });
    itemsList.addEventListener("touchstart", markPanelUserScrolling, {
      passive: true
    });
    itemsList.addEventListener("pointerdown", markPanelUserScrolling, {
      passive: true
    });
    itemsList.addEventListener("scroll", () => {
      if (!isProgrammaticScroll) {
        markPanelUserScrolling();
      }
    });
  }

  async function refreshState() {
    const scrollTop = itemsList.scrollTop;
    currentState = await chrome.runtime.sendMessage({
      type: "DIROB_PANEL_GET_STATE"
    });
    const rerenderedList = render(currentState);
    if (rerenderedList === "rebuild") {
      itemsList.scrollTop = scrollTop;
      bindImageStates();
    } else if (rerenderedList === "patch") {
      bindImageStates();
    }
    syncPanelToPageView(currentState);
    renderLogHelperStatus(currentState);
  }

  function render(state) {
    const page = state?.page || {};
    const language = state?.language === "en" ? "en" : "fa";
    const translation = TRANSLATIONS[language];
    const siteLabel = siteLabelFor(page.site, language);
    const targetLabel =
      page.site === "torob"
        ? siteLabelFor("digikala", language)
        : siteLabelFor("torob", language);

    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = getEffectiveTheme(state?.themeMode);
    const scaleValue = 1 + ((state?.fontScale || 0) * 0.1);
    document.body.style.setProperty("--ui-scale", String(Math.max(0.55, Math.min(1.8, scaleValue))));

    settingsTitle.textContent = translation.settingsTitle;
    toggleSettingsButton.title = translation.settingsOpen;
    helpButton.title = translation.help;
    closeSettingsButton.title = translation.settingsClose;
    languageButton.textContent = translation.langButton;
    themeButton.textContent = `${translation.theme}: ${translation[`theme_${state?.themeMode || "system"}`] || translation.theme_system}`;
    switchLabels.selection.textContent = translation.elementSelect;
    switchLabels.syncPageView.textContent = translation.syncPageView;
    switchLabels.minimalView.textContent = translation.minimalView;
    switchLabels.debug.textContent = translation.debug;
    switchLabels.autoLogs.textContent = translation.autoLogs;
    switchLabels.guideNumbers.textContent = translation.guideNumbers;
    layoutLabel.textContent = translation.layout;
    fontLabel.textContent = translation.fontSize;
    layoutListButton.textContent = translation.layoutList;
    layoutGridButton.textContent = translation.layoutGrid;
    reloadAllButton.title = translation.reloadAll;
    toggleSettingsButton.classList.toggle("is-active", Boolean(state?.settingsOpen));
    clearLogsButton.textContent = translation.clearLogs;

    selectionButton.classList.toggle("is-active", Boolean(state?.selectionModeEnabled));
    selectionButton.setAttribute("aria-pressed", String(Boolean(state?.selectionModeEnabled)));
    syncPageViewButton.classList.toggle("is-active", Boolean(state?.syncPageViewEnabled));
    syncPageViewButton.setAttribute("aria-pressed", String(Boolean(state?.syncPageViewEnabled)));
    minimalViewButton.classList.toggle("is-active", Boolean(state?.minimalViewEnabled));
    minimalViewButton.setAttribute("aria-pressed", String(Boolean(state?.minimalViewEnabled)));
    debugButton.classList.toggle("is-active", Boolean(state?.debugEnabled));
    debugButton.setAttribute("aria-pressed", String(Boolean(state?.debugEnabled)));
    autoLogsButton.classList.toggle("is-active", Boolean(state?.autoLogsEnabled));
    autoLogsButton.setAttribute("aria-pressed", String(Boolean(state?.autoLogsEnabled)));
    guideNumbersButton.classList.toggle("is-active", Boolean(state?.guideNumbersEnabled));
    guideNumbersButton.setAttribute("aria-pressed", String(Boolean(state?.guideNumbersEnabled)));
    layoutListButton.classList.toggle("is-active", state?.layoutMode !== "grid");
    layoutGridButton.classList.toggle("is-active", state?.layoutMode === "grid");
    settingsPanel.classList.toggle("is-open", Boolean(state?.settingsOpen));
    settingsPanel.setAttribute("aria-hidden", String(!state?.settingsOpen));
    itemsList.classList.toggle("is-grid", state?.layoutMode === "grid");
    itemsList.classList.toggle("is-list", state?.layoutMode !== "grid");
    itemsList.classList.toggle("is-minimal", Boolean(state?.minimalViewEnabled));

    pageModeText.textContent = page?.isSupported
      ? t(language, "modeTitle", { source: siteLabel, target: targetLabel })
      : translation.pageWaiting;

    settingsHelp.textContent = state?.selectionModeEnabled
      ? translation.settingsSelection
      : page?.mode === "detail"
        ? translation.detailHint
        : translation.listingHint;

    logMetaText.textContent = `${t(language, "logsMeta", { count: state?.logCount || 0 })} · ${
      state?.autoLogsEnabled ? translation.autoLogsOn : translation.autoLogsOff
    }`;
    fontMetaText.textContent = t(language, "sizeMeta", {
      value: state?.fontScale || 0
    });

    summaryText.textContent = buildSummaryText(page, state, language);

    const structureFingerprint = JSON.stringify({
      mode: page?.mode || "unsupported",
      pageUrl: page?.pageUrl || "",
      language,
      selectionModeEnabled: Boolean(state?.selectionModeEnabled),
      syncPageViewEnabled: Boolean(state?.syncPageViewEnabled),
      guideNumbersEnabled: Boolean(state?.guideNumbersEnabled),
      minimalViewEnabled: Boolean(state?.minimalViewEnabled),
      layoutMode: state?.layoutMode || "list",
      items: (page?.items || []).map((entry) => ({
        sourceId: entry?.item?.sourceId || "",
        role: entry?.item?.detailRole || "listing",
        guideNumber: entry?.item?.guideNumber ?? entry?.item?.position ?? -1
      }))
    });

    if (structureFingerprint !== lastStructureFingerprint) {
      itemsList.innerHTML = buildItemsMarkup(page, state, language);
      lastStructureFingerprint = structureFingerprint;
      return "rebuild";
    }

    patchRenderedItems(page, state, language);
    return "patch";
  }

  function renderLogHelperStatus(state) {
    const language = state?.language === "en" ? "en" : "fa";
    if (!logPathText || !helperStatusText) {
      return;
    }
    const helper = state?.logHelper || {};
    helperStatusText.textContent = helper.connected
      ? TRANSLATIONS[language].logHelperConnected
      : TRANSLATIONS[language].logHelperDisconnected;
    helperStatusText.classList.toggle("is-online", Boolean(helper.connected));
    helperStatusText.classList.toggle("is-offline", !helper.connected);
    logPathText.textContent = helper.connected
      ? t(language, "logPathReady", { path: helper.logPath || "research/artifacts/dirob/dirob-live-log.ndjson" })
      : TRANSLATIONS[language].logPathDisconnected;
  }

  function buildSummaryText(page, state, language) {
    const translation = TRANSLATIONS[language];
    if (!page?.isSupported) {
      return translation.unsupportedPage;
    }

    if (state?.selectionModeEnabled && !page?.selectedSourceId && page?.mode !== "detail") {
      return translation.summarySelection;
    }

    if (!page?.items?.length) {
      return translation.summaryNoItems;
    }

    const visibleCount = page.items.filter((entry) => entry.isVisible).length;
    return t(language, "summaryItems", {
      visible: visibleCount,
      count: page.items.length
    });
  }

  function buildItemsMarkup(page, state, language) {
    const translation = TRANSLATIONS[language];
    if (!page?.isSupported) {
      return `<div class="empty-state">${escapeHtml(translation.unsupportedEmpty)}</div>`;
    }

    if (state?.selectionModeEnabled && !page?.selectedSourceId && page?.mode !== "detail") {
      return `<div class="empty-state">${escapeHtml(translation.selectionEmpty)}</div>`;
    }

    if (!page?.items?.length) {
      return `<div class="empty-state">${escapeHtml(translation.noItems)}</div>`;
    }

    if (page?.mode === "detail") {
      const mainEntries = page.items.filter((entry) => entry.item?.detailRole === "main");
      const suggestedEntries = page.items.filter((entry) => entry.item?.detailRole !== "main");
      const sections = [];

      if (mainEntries.length) {
        sections.push(
          `<section class="detail-group"><h3 class="detail-group-title">${escapeHtml(translation.sectionMain)}</h3>${mainEntries
            .map((entry) => buildCardMarkup(entry, state, language))
            .join("")}</section>`
        );
      }

      if (suggestedEntries.length) {
        sections.push(
          `<section class="detail-group"><h3 class="detail-group-title">${escapeHtml(translation.sectionSuggested)}</h3>${suggestedEntries
            .map((entry) => buildCardMarkup(entry, state, language))
            .join("")}</section>`
        );
      }

      return sections.join("");
    }

    return page.items.map((entry) => buildCardMarkup(entry, state, language)).join("");
  }

  function buildCardMarkup(entry, state, language) {
    const fingerprint = getItemFingerprint(entry, state, language);
    return buildCardMarkupWithFingerprint(entry, state, language, fingerprint);
  }

  function buildCardMarkupWithFingerprint(entry, state, language, fingerprint) {
    const translation = TRANSLATIONS[language];
    const item = entry.item;
    const match = entry.match;
    const sourceLabel = siteLabelFor(item.sourceSite, language);
    const targetSite = match?.targetSite || (item.sourceSite === "torob" ? "digikala" : "torob");
    const targetLabel = siteLabelFor(targetSite, language);
    const status = entry?.isLoading ? "loading" : match?.status || "loading";
    const confidence =
      typeof match?.confidence === "number"
        ? `${Math.round(match.confidence * 100)}%`
        : translation.unknown;
    const targetPrice =
      match?.targetPriceText || (status === "loading" ? translation.status_loading : translation.unknown);
    const targetTitle = match?.matchedTitle || translation.noExact;
    const guideNumber = Number.isFinite(item.guideNumber)
      ? item.guideNumber
      : Number.isFinite(item.position)
        ? item.position + 1
        : null;
    const googleUrl = match?.googleUrl || globalThis.DirobNormalize.buildGoogleSearchUrl(item.title);
    const targetSearchUrl =
      match?.searchUrl ||
      (targetSite === "torob"
        ? globalThis.DirobNormalize.buildTorobSearchUrl(item.title)
        : globalThis.DirobNormalize.buildDigikalaSearchUrl(item.title));
    const targetUrl = match?.targetUrl || targetSearchUrl;
    const minimalViewEnabled = Boolean(state?.minimalViewEnabled);
    const imageMarkup = item.imageUrl
      ? `<img src="${escapeHtml(item.imageUrl)}" alt="" data-thumb loading="lazy" referrerpolicy="no-referrer">`
      : "";
    const sourceExtraMarkup = buildPriceExtraMarkup(
      item.displayDiscountPercent,
      item.displayOriginalPriceText,
      language
    );
    const targetExtraMarkup = buildPriceExtraMarkup(
      match?.targetDiscountPercent,
      match?.targetOriginalPriceText,
      language
    );
    const debugMarkup =
      state?.debugEnabled && match?.debug
        ? `<div class="debug-box">${escapeHtml(JSON.stringify(match.debug, null, 2))}</div>`
        : "";

    const actionMarkup = minimalViewEnabled
      ? `
        <div class="item-actions item-actions--minimal">
          <a class="action-button action-button--icon" data-role="open-target" href="${escapeHtml(targetUrl)}" target="_blank" rel="noreferrer" title="${escapeHtml(t(language, "openTarget", { site: targetLabel }))}" aria-label="${escapeHtml(t(language, "openTarget", { site: targetLabel }))}">↗</a>
          <a class="action-button action-button--icon" data-role="search-target" href="${escapeHtml(targetSearchUrl)}" target="_blank" rel="noreferrer" title="${escapeHtml(t(language, "searchTarget", { site: targetLabel }))}" aria-label="${escapeHtml(t(language, "searchTarget", { site: targetLabel }))}">⌕</a>
          <a class="action-button action-button--icon" data-role="google-link" href="${escapeHtml(googleUrl)}" target="_blank" rel="noreferrer" title="${escapeHtml(t(language, "google"))}" aria-label="${escapeHtml(t(language, "google"))}">G</a>
          <button class="action-button action-button--icon" type="button" data-item-action="locate-item" data-role="locate-button-inline" data-source-id="${escapeHtml(item.sourceId)}" title="${escapeHtml(translation.locateItem)}" aria-label="${escapeHtml(translation.locateItem)}">⌖</button>
          <button class="action-button action-button--icon" type="button" data-item-action="reload-item" data-role="reload-button-inline" data-source-id="${escapeHtml(item.sourceId)}" title="${escapeHtml(translation.reloadAll)}" aria-label="${escapeHtml(translation.reloadAll)}">↻</button>
        </div>`
      : `
        <div class="item-actions">
          <a class="action-button" data-role="open-target" href="${escapeHtml(targetUrl)}" target="_blank" rel="noreferrer">${escapeHtml(t(language, "openTarget", { site: targetLabel }))}</a>
          <a class="action-button" data-role="search-target" href="${escapeHtml(targetSearchUrl)}" target="_blank" rel="noreferrer">${escapeHtml(t(language, "searchTarget", { site: targetLabel }))}</a>
          <a class="action-button" data-role="google-link" href="${escapeHtml(googleUrl)}" target="_blank" rel="noreferrer">${escapeHtml(t(language, "google"))}</a>
        </div>`;

    return `
      <article class="item-card ${entry.isVisible ? "is-visible" : ""}" data-source-id="${escapeHtml(item.sourceId)}" data-item-fingerprint="${escapeHtml(fingerprint)}" data-guide-number="${guideNumber != null ? escapeHtml(String(guideNumber)) : ""}">
        <div class="item-tools">
          <button class="icon-button item-tool" data-item-action="reload-item" data-role="reload-button" data-source-id="${escapeHtml(item.sourceId)}" title="${escapeHtml(translation.reloadAll)}">${escapeHtml(t(language, "reloadItem"))}</button>
          <button class="icon-button item-tool" data-item-action="locate-item" data-role="locate-button" data-source-id="${escapeHtml(item.sourceId)}" title="${escapeHtml(translation.locateItem)}">⌖</button>
        </div>
        <div class="item-top">
          <div class="thumb ${item.imageUrl ? "" : "is-broken"}">
            ${imageMarkup}
          </div>
          <div class="item-body">
            <div class="meta-row">
              ${guideNumber != null ? `<span class="guide-chip" data-role="guide-number">#${escapeHtml(String(guideNumber))}</span>` : `<span class="guide-chip is-empty" data-role="guide-number"></span>`}
              <span class="status-chip ${escapeHtml(status)}" data-role="status-chip">${escapeHtml(t(language, `status_${status}`))}</span>
            </div>
            <h2 class="item-title" data-role="item-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h2>
            <p class="item-subtitle" data-role="item-subtitle">${escapeHtml(targetTitle)}</p>
            <p class="item-meta" data-role="item-meta">${escapeHtml(t(language, "confidence", { value: confidence }))}${
      match?.sellerCount ? ` · ${escapeHtml(t(language, "sellers", { value: match.sellerCount }))}` : ""
    }${entry?.retryCountMatch ? ` · ${escapeHtml(t(language, "retries", { value: `${entry.retryCountMatch}/3` }))}` : ""}</p>
          </div>
        </div>

        <div class="price-grid">
          <div class="price-box">
            <span class="price-label">${escapeHtml(t(language, "sourcePrice", { site: sourceLabel }))}</span>
            <span class="price-value" data-role="source-price">${escapeHtml(item.displayPriceText || translation.unknown)}</span>
            <div data-role="source-extra">${sourceExtraMarkup}</div>
          </div>
          <div class="price-box">
            <span class="price-label">${escapeHtml(t(language, "targetPrice", { site: targetLabel }))}</span>
            <span class="price-value" data-role="target-price">${escapeHtml(targetPrice)}</span>
            <div data-role="target-extra">${targetExtraMarkup}</div>
          </div>
        </div>

        ${actionMarkup}
        <div data-role="debug-slot">${debugMarkup}</div>
      </article>
    `;
  }

  function patchRenderedItems(page, state, language) {
    const entries = page?.items || [];
    for (const entry of entries) {
      const sourceId = entry?.item?.sourceId;
      if (!sourceId) {
        continue;
      }
      const node = itemsList.querySelector(`[data-source-id="${cssEscape(sourceId)}"]`);
      if (!node) {
        continue;
      }
      const fingerprint = getItemFingerprint(entry, state, language);
      if (node.getAttribute("data-item-fingerprint") === fingerprint) {
        continue;
      }
      const template = document.createElement("template");
      template.innerHTML = buildCardMarkupWithFingerprint(entry, state, language, fingerprint).trim();
      const freshNode = template.content.firstElementChild;
      if (!freshNode) {
        continue;
      }
      node.className = freshNode.className;
      node.setAttribute("data-item-fingerprint", fingerprint);
      node.setAttribute("data-guide-number", freshNode.getAttribute("data-guide-number") || "");
      node.innerHTML = freshNode.innerHTML;
    }
  }

  function syncPanelToPageView(state) {
    const page = state?.page;
    const nextSourceId = findPageViewSourceId(page, state);
    const previousSourceId = currentPageFocusSourceId;
    const sourceChanged = previousSourceId !== nextSourceId;

    if (previousSourceId && previousSourceId !== nextSourceId) {
      const previous = itemsList.querySelector(
        `[data-source-id="${cssEscape(previousSourceId)}"]`
      );
      previous?.classList.remove("is-page-focus");
    }

    currentPageFocusSourceId = nextSourceId;

    if (!nextSourceId) {
      currentPageFocusSourceId = null;
    } else {
      const node = itemsList.querySelector(`[data-source-id="${cssEscape(nextSourceId)}"]`);
      if (node) {
        node.classList.add("is-page-focus");
      }
    }

    applyHoverSource(page?.hoverSourceId || null);
    applyPanelFocus(state);

    if (!state?.syncPageViewEnabled || state?.selectionModeEnabled) {
      return;
    }

    if (!sourceChanged) {
      return;
    }

    if (Date.now() < panelScrollHoldUntil) {
      return;
    }

    const node = itemsList.querySelector(`[data-source-id="${cssEscape(nextSourceId)}"]`);
    if (!node) {
      return;
    }

    if (isNodeMostlyVisible(node, itemsList)) {
      return;
    }

    programmaticScrollTo(node);
  }

  function findPageViewSourceId(page, state) {
    if (!page?.items?.length) {
      return null;
    }

    if (state?.selectionModeEnabled && page.selectedSourceId) {
      return page.selectedSourceId;
    }

    if (page.activeSourceId) {
      return page.activeSourceId;
    }
    if (Number.isFinite(page.activeGuideNumber)) {
      return (
        page.items.find((entry) => entry?.item?.guideNumber === page.activeGuideNumber)?.item?.sourceId ||
        null
      );
    }
    return page.items.find((entry) => entry?.isVisible)?.item?.sourceId || null;
  }

  function applyHoverSource(sourceId) {
    itemsList.querySelectorAll(".is-page-hover").forEach((node) => {
      node.classList.remove("is-page-hover");
    });
    if (!sourceId) {
      return;
    }
    itemsList
      .querySelector(`[data-source-id="${cssEscape(sourceId)}"]`)
      ?.classList.add("is-page-hover");
  }

  function applyPanelFocus(state) {
    const page = state?.page;
    const focusNonce = Number(page?.panelFocusNonce || 0);
    if (!focusNonce || focusNonce === lastPanelFocusNonce) {
      return;
    }
    lastPanelFocusNonce = focusNonce;
    const sourceId = page?.panelFocusSourceId;
    if (!sourceId) {
      return;
    }
    const node = itemsList.querySelector(`[data-source-id="${cssEscape(sourceId)}"]`);
    if (!node) {
      return;
    }
    programmaticScrollTo(node);
    node.classList.add("is-page-focus");
  }

  function isNodeMostlyVisible(node, container) {
    const nodeRect = node.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const visibleTop = Math.max(nodeRect.top, containerRect.top);
    const visibleBottom = Math.min(nodeRect.bottom, containerRect.bottom);
    const visibleHeight = visibleBottom - visibleTop;
    return visibleHeight >= Math.min(nodeRect.height * 0.65, nodeRect.height - 12);
  }

  function markPanelUserScrolling() {
    panelScrollHoldUntil = Date.now() + 1800;
    itemsList.classList.add("user-scrolling");
    window.clearTimeout(markPanelUserScrolling._timerId);
    markPanelUserScrolling._timerId = window.setTimeout(() => {
      itemsList.classList.remove("user-scrolling");
    }, 1900);
  }

  function programmaticScrollTo(node) {
    isProgrammaticScroll = true;
    node.scrollIntoView({
      block: "nearest",
      behavior: "smooth"
    });
    window.clearTimeout(programmaticScrollTo._timerId);
    programmaticScrollTo._timerId = window.setTimeout(() => {
      isProgrammaticScroll = false;
    }, 320);
  }

  function getItemFingerprint(entry, state, language) {
    return JSON.stringify({
      language,
      sourceId: entry?.item?.sourceId || "",
      title: entry?.item?.title || "",
      price: entry?.item?.displayPriceText || "",
      originalPrice: entry?.item?.displayOriginalPriceText || "",
      discountPercent: entry?.item?.displayDiscountPercent || "",
      guideNumber: entry?.item?.guideNumber ?? entry?.item?.position ?? -1,
      guideNumbersEnabled: Boolean(state?.guideNumbersEnabled),
      isVisible: Boolean(entry?.isVisible),
      isLoading: Boolean(entry?.isLoading),
      retryCount: entry?.retryCount || 0,
      retryCountSource: entry?.retryCountSource || 0,
      retryCountMatch: entry?.retryCountMatch || 0,
      status: entry?.isLoading ? "loading" : entry?.match?.status || "idle",
      confidence: entry?.match?.confidence ?? null,
      matchedTitle: entry?.match?.matchedTitle || "",
      targetPrice: entry?.match?.targetPriceText || "",
      targetOriginalPrice: entry?.match?.targetOriginalPriceText || "",
      targetDiscountPercent: entry?.match?.targetDiscountPercent || "",
      sellerCount: entry?.match?.sellerCount || 0,
      targetUrl: entry?.match?.targetUrl || "",
      searchUrl: entry?.match?.searchUrl || "",
      googleUrl: entry?.match?.googleUrl || "",
      debug: state?.debugEnabled ? JSON.stringify(entry?.match?.debug || null) : ""
    });
  }

  function buildPriceExtraMarkup(discountPercent, originalPriceText, language) {
    const parts = [];
    if (discountPercent) {
      parts.push(
        `<span class="price-extra-chip">${escapeHtml(t(language, "discount"))}: ${escapeHtml(
          discountPercent
        )}</span>`
      );
    }
    if (originalPriceText) {
      parts.push(
        `<span class="price-extra-text">${escapeHtml(t(language, "originalPrice"))}: ${escapeHtml(
          originalPriceText
        )}</span>`
      );
    }
    if (!parts.length) {
      return "";
    }
    return `<div class="price-extra">${parts.join("")}</div>`;
  }

  function bindImageStates() {
    itemsList.querySelectorAll("[data-thumb]").forEach((image) => {
      const container = image.parentElement;
      if (!container) {
        return;
      }

      if (image.complete) {
        if (image.naturalWidth > 0) {
          container.classList.add("is-loaded");
        } else {
          container.classList.add("is-broken");
        }
        return;
      }

      image.addEventListener(
        "load",
        () => {
          container.classList.add("is-loaded");
        },
        { once: true }
      );
      image.addEventListener(
        "error",
        () => {
          container.classList.add("is-broken");
        },
        { once: true }
      );
    });
  }

  function siteLabelFor(site, language) {
    const isEnglish = language === "en";
    if (site === "digikala") {
      return isEnglish ? "Digikala" : "دیجیکالا";
    }
    if (site === "torob") {
      return isEnglish ? "Torob" : "ترب";
    }
    return isEnglish ? "Unknown" : "نامشخص";
  }

  function getEffectiveTheme(themeMode) {
    if (themeMode === "dark" || themeMode === "light") {
      return themeMode;
    }
    return window.matchMedia?.("(prefers-color-scheme: light)")?.matches ? "light" : "dark";
  }

  function t(language, key, values) {
    const template = TRANSLATIONS[language]?.[key] || TRANSLATIONS.fa[key] || key;
    return String(template).replace(/\{(\w+)\}/g, (_match, name) => String(values?.[name] ?? ""));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function cssEscape(value) {
    if (globalThis.CSS?.escape) {
      return globalThis.CSS.escape(value);
    }
    return String(value || "").replace(/"/g, '\\"');
  }

})();
