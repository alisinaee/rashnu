(function () {
  "use strict";

  const logger = globalThis.RashnuLogger;
  const summaryText = document.querySelector("[data-summary-text]");
  const brandLink = document.querySelector(".brand-block");
  const itemsList = document.querySelector("[data-items-list]");
  const settingsPanel = document.querySelector(".settings-panel");
  const settingsBody = document.querySelector("[data-settings-body]");
  const settingsTitle = document.querySelector("[data-settings-title]");
  const settingsHelp = document.querySelector("[data-settings-help]");
  const logRow = document.querySelector(".log-row");
  const layoutLabel = document.querySelector("[data-layout-label]");
  const fontLabel = document.querySelector("[data-font-label]");
  const logMetaText = document.querySelector("[data-log-meta]");
  const logPathText = document.querySelector("[data-log-path]");
  const helperStatusText = document.querySelector("[data-log-helper-status]");
  const fontMetaText = document.querySelector("[data-font-meta]");
  const reloadAllButton = document.querySelector('[data-action="reload-all"]');
  const toggleSettingsButton = document.querySelector('[data-action="toggle-settings"]');
  const openSearchButton = document.querySelector('[data-action="open-search"]');
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
  const exportLogsButton = document.querySelector('[data-action="export-logs"]');
  const clearLogsButton = document.querySelector('[data-action="clear-logs"]');
  const switchLabels = {
    selection: document.querySelector('[data-switch-label="selection"]'),
    syncPageView: document.querySelector('[data-switch-label="sync-page-view"]'),
    minimalView: document.querySelector('[data-switch-label="minimal-view"]'),
    debug: document.querySelector('[data-switch-label="debug"]'),
    autoLogs: document.querySelector('[data-switch-label="auto-logs"]'),
    guideNumbers: document.querySelector('[data-switch-label="guide-numbers"]')
  };
  const providerSectionLabels = {
    search: document.querySelector('[data-provider-section-label="search"]'),
    price: document.querySelector('[data-provider-section-label="price"]')
  };
  const providerChipRows = {
    search: document.querySelector('[data-provider-active-chips="search"]'),
    price: document.querySelector('[data-provider-active-chips="price"]')
  };
  const providerSettingsBlock = document.querySelector("[data-provider-settings-block]");
  const providerSettingsToggleButton = document.querySelector('[data-action="toggle-provider-settings-editor"]');
  const providerSettingsTitle = document.querySelector("[data-provider-settings-title]");
  const providerWarningText = document.querySelector("[data-provider-warning]");
  const divarLocationLabel = document.querySelector("[data-divar-location-label]");
  const divarLocationHint = document.querySelector("[data-divar-location-hint]");
  const divarLocationSelect = document.querySelector("[data-divar-location-select]");
  const providerLabels = Array.from(document.querySelectorAll("[data-provider-label]"));
  const providerSearchButtons = Array.from(document.querySelectorAll('[data-action="toggle-provider-search"]'));
  const providerPriceButtons = Array.from(document.querySelectorAll('[data-action="toggle-provider-price"]'));
  const SEARCH_PROVIDER_SITES = globalThis.RashnuNormalize.getSearchButtonProviderSites();
  const PRICE_PROVIDER_SITES = globalThis.RashnuNormalize.getPriceVisibilityProviderSites();

  const TRANSLATIONS = {
    fa: {
      pageWaiting: "منتظر یک صفحه پشتیبانی‌شده...",
      unsupportedPage:
        "این تب در حال حاضر صفحه‌ی فهرست یا جزئیات محصول در باسلام، دیجیکالا، ترب، تکنولایف، ایمالز، آمازون یا eBay نیست.",
      modeTitle: "{source} → {target}",
      settingsDefault: "حالت عادی: محصولات قابل مشاهده روی صفحه بررسی می‌شوند.",
      settingsSelection:
        "حالت انتخاب عنصر روشن است: فقط محصولی که روی آن می‌روید یا فوکوس می‌کنید نمایش داده می‌شود.",
      logsMeta: "تعداد لاگ‌ها: {count}",
      exportLogs: "خروجی لاگ",
      exportLogsHint: "خروجی گرفتن از لاگ‌های دیباگ این جلسه برای ارسال گزارش.",
      clearLogs: "پاک کردن",
      clearLogsHint: "پاک کردن لاگ‌های ثبت‌شده در همین جلسه از پنل.",
      reloadExtension: "نوسازی Rashnu",
      reloadExtensionHint: "Rashnu را در تب فعلی از نو بساز و پنل را باز نگه دار.",
      reloadAll: "بارگذاری دوباره همه",
      reloadAllHint: "بارگذاری دوباره همه آیتم‌های پنل از صفحه فعلی.",
      sizeMeta: "اندازه: {value}",
      settingsTitle: "تنظیمات",
      settingsClose: "بستن",
      settingsOpen: "تنظیمات",
      settingsOpenHint: "باز کردن تنظیمات Rashnu.",
      settingsCloseHint: "بستن پنل تنظیمات Rashnu.",
      help: "راهنما",
      searchTab: "جست‌وجوی سراسری",
      searchTabHint: "باز کردن تب جست‌وجوی سراسری Rashnu.",
      helpHint: "باز کردن صفحه راهنمای Rashnu.",
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
      providerSearchSection: "دکمه‌های جست‌وجو",
      providerPriceSection: "نمایش قیمت",
      providerSettingsTitle: "Active Providers",
      providerSettingsExpandHint: "باز کردن تنظیمات منابع مقایسه.",
      providerSettingsCollapseHint: "بستن تنظیمات منابع مقایسه.",
      providerNoActive: "هیچ‌کدام",
      divarLocationLabel: "شهر دیوار",
      divarLocationHint: "فقط برای جست‌وجوهای دیوار استفاده می‌شود.",
      divarLocationLoading: "در حال بارگذاری...",
      providerWarning:
        "هشدار: آمازون و eBay ممکن است ترافیک افزونه را به‌عنوان رفتار بات تشخیص دهند، بنابراین نتایج این دو منبع همیشه کاملاً قابل اتکا نیست.",
      layout: "چیدمان",
      layoutList: "لیست",
      layoutGrid: "گرید",
      fontSize: "اندازه",
      unsupportedEmpty:
        "برای استفاده از Rashnu یک صفحه‌ی فهرست یا جزئیات محصول در باسلام، دیجیکالا، ترب، تکنولایف، ایمالز، آمازون یا eBay باز کنید.",
      selectionEmpty: "ماوس را روی یک کارت محصول ببرید یا روی آن فوکوس کنید.",
      noItems: "هنوز نتیجه‌ای برای نمایش وجود ندارد.",
      summarySelection:
        "حالت انتخاب عنصر فعال است. ماوس را روی یک محصول ببرید تا فقط همان بررسی شود.",
      summaryItems: "{visible} محصول فعال | {count} مورد در پنل",
      summaryNoItems: "هنوز محصولی از این صفحه به Rashnu نرسیده است.",
      sectionMain: "محصول اصلی",
      sectionSuggested: "محصولات پیشنهادی",
      retries: "تلاش: {value}",
      sourcePrice: "{site}",
      targetPrice: "{site}",
      originalPrice: "قبل از تخفیف",
      discount: "تخفیف",
      confidence: "اعتماد: {value}",
      confidenceChip: "اعتماد {value}",
      retriesChip: "تلاش {value}",
      sellers: "فروشنده: {value}",
      openTarget: "باز کردن {site}",
      searchTarget: "جست‌وجوی {site}",
      rashnuSearch: "جست‌وجوی Rashnu",
      google: "جست‌وجوی گوگل",
      reloadItem: "⟳",
      status_loading: "در حال جست‌وجو",
      status_matched: "تطابق خوب",
      status_low_confidence: "نیاز به بررسی",
      status_not_found: "پیدا نشد",
      status_error: "خطا",
      hiddenPrice: "نمایش داده نمی‌شود",
      unknown: "نامشخص",
      noExact: "بدون تطابق قطعی",
      detailHint: "این صفحه جزئیات محصول است و همان محصول اصلی بررسی می‌شود.",
      listingHint: "این صفحه فهرست محصولات است و موارد قابل مشاهده بررسی می‌شوند.",
      langButton: "FA / EN",
      switchLanguage: "تغییر زبان",
      switchLanguageHint: "تغییر زبان پنل بین فارسی و انگلیسی.",
      cycleTheme: "تغییر تم",
      cycleThemeHint: "تغییر تم بین خودکار، تیره و روشن.",
      autoLogsOn: "لاگ خودکار روشن",
      autoLogsOff: "لاگ خودکار خاموش",
      logHelperConnected: "ثبت لاگ محلی وصل است",
      logHelperDisconnected: "ثبت لاگ محلی قطع است",
      logPathReady: "لاگ‌ها در {path} ذخیره می‌شوند.",
      logPathDisconnected:
        "برای راه‌اندازی خودکار (یک‌بار): `./run-rashnu-helper --install-autostart` · اجرای دستی: `./run-rashnu-helper`",
      locateItem: "رفتن به محصول",
      locateItemHint: "رفتن به همین محصول در صفحه اصلی و هایلایت کردن آن.",
      decreaseSize: "کوچک‌تر کردن اندازه",
      decreaseSizeHint: "کوچک‌تر کردن اندازه آیتم‌ها و متن‌های داخل لیست محصولات.",
      increaseSize: "بزرگ‌تر کردن اندازه",
      increaseSizeHint: "بزرگ‌تر کردن اندازه آیتم‌ها و متن‌های داخل لیست محصولات.",
      openRepository: "باز کردن گیت‌هاب Rashnu",
      elementSelectHint:
        "وقتی روشن باشد فقط محصولی که روی آن hover یا focus می‌کنید در پنل بررسی و نمایش داده می‌شود.",
      syncPageViewHint:
        "وقتی روشن باشد پنل با اسکرول صفحه همگام می‌شود و روی آیتم قابل مشاهده تمرکز می‌کند.",
      minimalViewHint:
        "کارت‌ها فشرده می‌شوند و دکمه‌های هر آیتم به حالت آیکونی نمایش داده می‌شود تا فضای کمتری بگیرد.",
      guideNumbersHint:
        "شماره راهنما کنار محصولات روی صفحه و داخل پنل نمایش داده می‌شود تا تطبیق آیتم‌ها ساده باشد.",
      autoLogsHint: "وقایع توسعه Rashnu به لاگ محلی ارسال می‌شود (فقط وقتی دیباگ روشن است).",
      autoLogsHintDebugOff: "برای فعال شدن ثبت خودکار لاگ، اول دیباگ را روشن کنید.",
      debugHint: "اطلاعات تشخیصی بیشتری برای هر آیتم نمایش داده می‌شود.",
      layoutListHint: "نمایش نتایج به‌صورت لیست تک‌ستونی.",
      layoutGridHint: "نمایش نتایج به‌صورت گرید چندستونی.",
      guideNumberHint: "شماره راهنما #{number}؛ همین شماره کنار همان محصول در صفحه هم نمایش داده می‌شود.",
      statusHint_loading: "در حال جست‌وجوی نتیجه در سایت مقابل است.",
      statusHint_matched: "نتیجه‌ای با تطابق خوب پیدا شده است.",
      statusHint_low_confidence: "نتیجه پیدا شده اما دقت آن پایین است و باید بررسی شود.",
      statusHint_not_found: "برای این آیتم تطابق قابل‌اتکا پیدا نشد.",
      statusHint_error: "در دریافت یا پردازش نتیجه خطا رخ داده است.",
      statusHint_default: "وضعیت نتیجه این آیتم.",
      openTargetHint: "باز کردن صفحه محصول در {site}.",
      searchTargetHint: "جست‌وجوی این عنوان در {site}.",
      rashnuSearchHint: "باز کردن جست‌وجوی سراسری Rashnu برای همین عنوان.",
      googleHint: "جست‌وجوی این عنوان در گوگل."
    },
    en: {
      pageWaiting: "Waiting for a supported page...",
      unsupportedPage:
        "This tab is not a Basalam, Digikala, Torob, Technolife, Emalls, Amazon, or eBay product listing/detail page.",
      modeTitle: "{source} → {target}",
      settingsDefault: "Normal mode: visible products on the page are tracked.",
      settingsSelection:
        "Element select mode is on: only the product under hover/focus is shown.",
      logsMeta: "Logs: {count}",
      exportLogs: "Export",
      exportLogsHint: "Export this session's debug logs so they can be shared for issue reports.",
      clearLogs: "Clear",
      clearLogsHint: "Clear logs captured in this panel session.",
      reloadExtension: "Reload Rashnu",
      reloadExtensionHint: "Rebuild Rashnu on the current tab without closing the side panel.",
      reloadAll: "Reload All",
      reloadAllHint: "Reload all panel items from the current page.",
      sizeMeta: "Size: {value}",
      settingsTitle: "Settings",
      settingsClose: "Close",
      settingsOpen: "Settings",
      settingsOpenHint: "Open Rashnu settings.",
      settingsCloseHint: "Close Rashnu settings.",
      help: "Help",
      searchTab: "Global Search",
      searchTabHint: "Open the Rashnu global search tab.",
      helpHint: "Open the Rashnu guide page.",
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
      providerSearchSection: "Search Buttons",
      providerPriceSection: "Show Prices",
      providerSettingsTitle: "Active Providers",
      providerSettingsExpandHint: "Expand comparison provider settings.",
      providerSettingsCollapseHint: "Collapse comparison provider settings.",
      providerNoActive: "None",
      divarLocationLabel: "Divar City",
      divarLocationHint: "Used only for Divar searches.",
      divarLocationLoading: "Loading...",
      providerWarning:
        "Warning: Amazon and eBay may detect extension traffic as bot activity, so results on these providers are not always fully reliable.",
      layout: "Layout",
      layoutList: "List",
      layoutGrid: "Grid",
      fontSize: "Size",
      unsupportedEmpty:
        "Open a Basalam, Digikala, Torob, Technolife, Emalls, Amazon, or eBay listing/detail page to use Rashnu.",
      selectionEmpty: "Hover or focus a product card to inspect just that item.",
      noItems: "No results are ready yet.",
      summarySelection:
        "Element select mode is active. Hover a product to inspect only that one.",
      summaryItems: "{visible} active | {count} in panel",
      summaryNoItems: "No product data has reached Rashnu yet.",
      sectionMain: "Main Product",
      sectionSuggested: "Suggested Products",
      retries: "Retries: {value}",
      sourcePrice: "{site}",
      targetPrice: "{site}",
      originalPrice: "Before Discount",
      discount: "Discount",
      confidence: "Confidence: {value}",
      confidenceChip: "Confidence {value}",
      retriesChip: "Retries {value}",
      sellers: "Sellers: {value}",
      openTarget: "Open {site}",
      searchTarget: "Search {site}",
      rashnuSearch: "Rashnu Search",
      google: "Google",
      reloadItem: "⟳",
      status_loading: "Loading",
      status_matched: "Matched",
      status_low_confidence: "Review",
      status_not_found: "Not found",
      status_error: "Error",
      hiddenPrice: "Hidden",
      unknown: "Unknown",
      noExact: "No exact match",
      detailHint: "This is a product detail page. Rashnu is checking the main product.",
      listingHint: "This is a listing page. Rashnu is checking visible products.",
      langButton: "EN / FA",
      switchLanguage: "Switch language",
      switchLanguageHint: "Switch panel language between English and Persian.",
      cycleTheme: "Cycle theme",
      cycleThemeHint: "Cycle theme mode between System, Dark, and Light.",
      autoLogsOn: "Auto logs on",
      autoLogsOff: "Auto logs off",
      logHelperConnected: "Local logger connected",
      logHelperDisconnected: "Local logger disconnected",
      logPathReady: "Logs are written to {path}.",
      logPathDisconnected:
        "One-time auto-start: `./run-rashnu-helper --install-autostart` · manual run: `./run-rashnu-helper`",
      locateItem: "Locate item",
      locateItemHint: "Scroll to this product on the real page and highlight it.",
      decreaseSize: "Decrease size",
      decreaseSizeHint: "Decrease list item/card sizing, including item text.",
      increaseSize: "Increase size",
      increaseSizeHint: "Increase list item/card sizing, including item text.",
      openRepository: "Open Rashnu GitHub repository",
      elementSelectHint:
        "When enabled, only the currently hovered/focused product is inspected and shown in the panel.",
      syncPageViewHint:
        "When enabled, panel focus follows the product currently visible on the real page.",
      minimalViewHint:
        "Compacts cards and switches per-item actions to icon buttons to save vertical space.",
      guideNumbersHint:
        "Shows matching guide numbers on the page and in the panel so items are easier to correlate.",
      autoLogsHint: "Send Rashnu development events to local logs (only while Debug is enabled).",
      autoLogsHintDebugOff: "Enable Debug first to use auto logging.",
      debugHint: "Show extra diagnostic details for each item.",
      layoutListHint: "Show results in a single-column list layout.",
      layoutGridHint: "Show results in a multi-column grid layout.",
      guideNumberHint: "Guide number #{number}; the same number is shown on the matching product on page.",
      statusHint_loading: "Rashnu is still searching the opposite site.",
      statusHint_matched: "A strong match was found.",
      statusHint_low_confidence: "A match was found but confidence is low.",
      statusHint_not_found: "No reliable match was found for this item.",
      statusHint_error: "An error occurred while fetching or processing this item.",
      statusHint_default: "Current matching state for this item.",
      openTargetHint: "Open the product page on {site}.",
      searchTargetHint: "Search this title on {site}.",
      rashnuSearchHint: "Open Rashnu global search for this exact title.",
      googleHint: "Search this title on Google."
    }
  };

  let currentState = null;
  let lastStructureFingerprint = "";
  let currentPageFocusSourceId = null;
  let lastPanelFocusNonce = 0;
  let panelScrollHoldUntil = 0;
  let isProgrammaticScroll = false;
  let pendingSoftRefreshTimer = 0;
  let panelPort = null;
  let panelPortReconnectTimer = 0;
  let panelShuttingDown = false;
  let providerSettingsExpanded = true;
  let providerSettingsExpandedOverride = null;
  const guideJumpTimers = new WeakMap();
  const panelScrollPositions = new Map();

  boot().catch((error) => {
    logger.error("panel", "boot_failed", {
      error
    });
    summaryText.textContent = `Rashnu error: ${error.message}`;
  });

  async function boot() {
    bindPanelPort();
    bindEvents();
    await refreshState();

    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === "RASHNU_PANEL_STATE_UPDATED") {
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

  function bindPanelPort() {
    if (panelShuttingDown || panelPort) {
      return;
    }
    try {
      panelPort = chrome.runtime.connect({
        name: "rashnu-panel"
      });
      panelPort.onDisconnect.addListener(() => {
        panelPort = null;
        schedulePanelPortReconnect();
      });
    } catch (_error) {
      panelPort = null;
      schedulePanelPortReconnect();
    }

    window.addEventListener(
      "unload",
      () => {
        panelShuttingDown = true;
        if (panelPortReconnectTimer) {
          window.clearTimeout(panelPortReconnectTimer);
          panelPortReconnectTimer = 0;
        }
        try {
          panelPort?.disconnect();
        } catch (_error) {}
      },
      { once: true }
    );
  }

  function schedulePanelPortReconnect() {
    if (panelShuttingDown || panelPort || panelPortReconnectTimer) {
      return;
    }
    panelPortReconnectTimer = window.setTimeout(() => {
      panelPortReconnectTimer = 0;
      bindPanelPort();
    }, 450);
  }

  function bindEvents() {
    reloadAllButton.addEventListener("click", async () => {
      logger.info("panel", "reload_rashnu_clicked");
      const response = await sendRuntimeMessage(
        {
          type: "RASHNU_RELOAD_EXTENSION"
        },
        {
          attempts: 2,
          retryDelayMs: 180,
          suppressErrors: true,
          fallbackValue: null
        }
      );
      if (!response?.reloaded) {
        await sendRuntimeMessage(
          {
            type: "RASHNU_RELOAD_EXTENSION",
            payload: {
              runtimeReload: true
            }
          },
          {
            attempts: 1,
            suppressErrors: true
          }
        );
      }
      forceRebuild();
      await refreshState();
      scheduleSoftRefresh(550);
    });

    toggleSettingsButton.addEventListener("click", async () => {
      await sendRuntimeMessage({
        type: "RASHNU_SET_SETTINGS_OPEN",
        payload: { enabled: !Boolean(currentState?.settingsOpen) }
      });
      await refreshState();
    });

    helpButton.addEventListener("click", async () => {
      await chrome.tabs.create({
        url: chrome.runtime.getURL("src/help/help.html")
      });
    });

    openSearchButton.addEventListener("click", async () => {
      await sendRuntimeMessage({
        type: "RASHNU_OPEN_GLOBAL_SEARCH_TAB",
        payload: {}
      });
    });

    themeButton.addEventListener("click", async () => {
      const order = ["system", "dark", "light"];
      const current = order.includes(currentState?.themeMode) ? currentState.themeMode : "system";
      const next = order[(order.indexOf(current) + 1) % order.length];
      await sendRuntimeMessage({
        type: "RASHNU_SET_THEME_MODE",
        payload: { themeMode: next }
      });
      await refreshState();
    });

    closeSettingsButton.addEventListener("click", async () => {
      await sendRuntimeMessage({
        type: "RASHNU_SET_SETTINGS_OPEN",
        payload: { enabled: false }
      });
      await refreshState();
    });

    selectionButton.addEventListener("click", async () => {
      const enabled = !Boolean(currentState?.selectionModeEnabled);
      await sendRuntimeMessage({
        type: "RASHNU_SET_SELECTION_MODE",
        payload: { enabled }
      });
      await refreshState();
    });

    syncPageViewButton.addEventListener("click", async () => {
      const enabled = !Boolean(currentState?.syncPageViewEnabled);
      await sendRuntimeMessage({
        type: "RASHNU_SET_SYNC_PAGE_VIEW",
        payload: { enabled }
      });
      await refreshState();
    });

    minimalViewButton.addEventListener("click", async () => {
      const enabled = !Boolean(currentState?.minimalViewEnabled);
      await sendRuntimeMessage({
        type: "RASHNU_SET_MINIMAL_VIEW",
        payload: { enabled }
      });
      forceRebuild();
      await refreshState();
    });

    debugButton.addEventListener("click", async () => {
      const enabled = !Boolean(currentState?.debugEnabled);
      await sendRuntimeMessage({
        type: "RASHNU_SET_DEBUG",
        payload: { enabled }
      });
      await refreshState();
    });

    autoLogsButton.addEventListener("click", async () => {
      if (!currentState?.debugEnabled) {
        return;
      }
      const enabled = !Boolean(currentState?.autoLogsEnabled);
      await sendRuntimeMessage({
        type: "RASHNU_SET_AUTO_LOGS",
        payload: { enabled }
      });
      await refreshState();
    });

    guideNumbersButton.addEventListener("click", async () => {
      const enabled = !Boolean(currentState?.guideNumbersEnabled);
      await sendRuntimeMessage({
        type: "RASHNU_SET_GUIDE_NUMBERS",
        payload: { enabled }
      });
      await refreshState();
    });

    providerSettingsToggleButton?.addEventListener("click", () => {
      const autoExpanded = !Boolean(currentState?.minimalViewEnabled);
      const nextExpanded = !providerSettingsExpanded;
      providerSettingsExpanded = nextExpanded;
      providerSettingsExpandedOverride = nextExpanded === autoExpanded ? null : nextExpanded;
      const language = currentState?.language === "en" ? "en" : "fa";
      updateProviderSettingsState(currentState, TRANSLATIONS[language], language);
    });

    for (const button of providerSearchButtons) {
      button.addEventListener("click", async () => {
        const provider = String(button.getAttribute("data-provider") || "");
        const enabled = !isProviderSearchEnabled(currentState, provider);
        await sendRuntimeMessage({
          type: "RASHNU_SET_PROVIDER_SEARCH",
          payload: { provider, enabled }
        });
        await refreshState();
      });
    }

    for (const button of providerPriceButtons) {
      button.addEventListener("click", async () => {
        const provider = String(button.getAttribute("data-provider") || "");
        const enabled = !isProviderPriceVisible(currentState, provider);
        await sendRuntimeMessage({
          type: "RASHNU_SET_PROVIDER_PRICE",
          payload: { provider, enabled }
        });
        await refreshState();
      });
    }

    divarLocationSelect?.addEventListener("change", async () => {
      const nextLocation = getSelectedDivarLocation(currentState, divarLocationSelect.value);
      if (!nextLocation) {
        return;
      }
      await sendRuntimeMessage({
        type: "RASHNU_SET_DIVAR_LOCATION",
        payload: { location: nextLocation }
      });
      await refreshState();
    });

    layoutListButton.addEventListener("click", async () => {
      await sendRuntimeMessage({
        type: "RASHNU_SET_LAYOUT_MODE",
        payload: { layoutMode: "list" }
      });
      forceRebuild();
      await refreshState();
    });

    layoutGridButton.addEventListener("click", async () => {
      await sendRuntimeMessage({
        type: "RASHNU_SET_LAYOUT_MODE",
        payload: { layoutMode: "grid" }
      });
      forceRebuild();
      await refreshState();
    });

    languageButton.addEventListener("click", async () => {
      const language = currentState?.language === "en" ? "fa" : "en";
      await sendRuntimeMessage({
        type: "RASHNU_SET_LANGUAGE",
        payload: { language }
      });
      forceRebuild();
      await refreshState();
    });

    fontDownButton.addEventListener("click", async () => {
      await sendRuntimeMessage({
        type: "RASHNU_ADJUST_FONT_SCALE",
        payload: { delta: -1 }
      });
      forceRebuild();
      await refreshState();
    });

    fontUpButton.addEventListener("click", async () => {
      await sendRuntimeMessage({
        type: "RASHNU_ADJUST_FONT_SCALE",
        payload: { delta: 1 }
      });
      forceRebuild();
      await refreshState();
    });

    clearLogsButton.addEventListener("click", async () => {
      await sendRuntimeMessage({
        type: "RASHNU_CLEAR_LOGS"
      });
      await refreshState();
    });

    if (exportLogsButton) {
      exportLogsButton.addEventListener("click", async () => {
        await sendRuntimeMessage({
          type: "RASHNU_EXPORT_LOGS"
        });
        await refreshState();
      });
    }

    itemsList.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-item-action]");
      if (!button) {
        return;
      }

      if (button.getAttribute("data-item-action") === "reload-item") {
        const sourceId = button.getAttribute("data-source-id");
        await sendRuntimeMessage({
          type: "RASHNU_RELOAD_ITEM",
          payload: { sourceId }
        });
        await refreshState();
        return;
      }

      if (button.getAttribute("data-item-action") === "locate-item") {
        const sourceId = button.getAttribute("data-source-id");
        await sendRuntimeMessage({
          type: "RASHNU_LOCATE_ITEM",
          payload: { sourceId }
        });
        return;
      }

      if (button.getAttribute("data-item-action") === "rashnu-search") {
        const query = String(button.getAttribute("data-search-query") || "").trim();
        if (!query) {
          return;
        }
        await sendRuntimeMessage({
          type: "RASHNU_OPEN_GLOBAL_SEARCH_TAB",
          payload: { query }
        });
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
        rememberPanelScrollPosition(currentState);
      }
    });
  }

  async function refreshState() {
    rememberPanelScrollPosition(currentState);
    try {
      currentState = await sendRuntimeMessage(
        {
          type: "RASHNU_PANEL_GET_STATE"
        },
        {
          attempts: 3,
          retryDelayMs: 180,
          suppressErrors: false
        }
      );
    } catch (error) {
      logger.warn("panel", "state_refresh_failed", {
        error
      });
      const language = currentState?.language === "en" ? "en" : "fa";
      summaryText.textContent =
        language === "en" ? "Rashnu is reconnecting to the extension..." : "رشنو در حال اتصال دوباره به افزونه است...";
      scheduleSoftRefresh(700);
      return;
    }
    const savedScrollTop = getSavedPanelScrollPosition(currentState);
    const rerenderedList = render(currentState);
    hydrateDynamicIcons();
    if (rerenderedList === "rebuild") {
      restorePanelScrollPosition(savedScrollTop);
      bindImageStates();
    } else if (rerenderedList === "patch") {
      restorePanelScrollPosition(savedScrollTop);
      bindImageStates();
    }
    if (Number.isFinite(savedScrollTop)) {
      panelScrollHoldUntil = Date.now() + 1200;
    }
    syncPanelToPageView(currentState);
    renderLogHelperStatus(currentState);
  }

  async function sendRuntimeMessage(message, options = {}) {
    const attempts = Math.max(1, Number(options.attempts) || 2);
    const retryDelayMs = Number.isFinite(options.retryDelayMs) ? options.retryDelayMs : 150;
    const suppressErrors = options.suppressErrors !== false;
    let lastError = null;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await chrome.runtime.sendMessage(message);
      } catch (error) {
        lastError = error;
        if (attempt + 1 < attempts) {
          await wait(retryDelayMs);
        }
      }
    }

    logger.warn("panel", "runtime_message_failed", {
      type: message?.type || "unknown",
      error: lastError
    });
    if (suppressErrors) {
      return Object.prototype.hasOwnProperty.call(options, "fallbackValue") ? options.fallbackValue : null;
    }
    throw lastError || new Error("runtime_message_failed");
  }

  function wait(durationMs) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, durationMs);
    });
  }

  function hydrateDynamicIcons() {
    itemsList.querySelectorAll('[data-role="reload-button"]').forEach((button) => {
      button.innerHTML = buildReloadIconMarkup();
    });
    itemsList.querySelectorAll('[data-role="locate-button"]').forEach((button) => {
      button.innerHTML = buildLocateIconMarkup();
    });
  }

  function render(state) {
    const page = state?.page || {};
    const language = state?.language === "en" ? "en" : "fa";
    const translation = TRANSLATIONS[language];
    const siteLabel = siteLabelFor(page.site, language);
    const targetSite = inferTargetSiteForPage(page, state);
    const targetLabel = siteLabelFor(targetSite, language);

    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = getEffectiveTheme(state?.themeMode);
    const fontScale = Number.isFinite(state?.fontScale) ? state.fontScale : 0;
    document.body.style.setProperty("--font-scale-step", String(fontScale));
    document.body.style.setProperty("--items-font-size", `${clamp(14 + fontScale, 11, 22)}px`);
    document.body.style.setProperty("--card-padding", `${clamp(12 + fontScale, 8, 20)}px`);
    document.body.style.setProperty("--thumb-size", `${clamp(58 + fontScale * 4, 42, 84)}px`);
    document.body.style.setProperty("--tool-size", `${clamp(30 + fontScale * 2, 24, 40)}px`);
    document.body.style.setProperty("--tool-radius", `${clamp(10 + fontScale, 8, 14)}px`);

    settingsTitle.textContent = translation.settingsTitle;
    reloadAllButton.innerHTML = buildReloadIconMarkup();
    toggleSettingsButton.innerHTML = buildSettingsIconMarkup();
    openSearchButton.innerHTML = buildSearchIconMarkup();
    helpButton.innerHTML = buildHelpIconMarkup();
    closeSettingsButton.innerHTML = buildCloseIconMarkup();
    setTitleAndAria(reloadAllButton, translation.reloadExtensionHint);
    setTitleAndAria(
      toggleSettingsButton,
      Boolean(state?.settingsOpen) ? translation.settingsCloseHint : translation.settingsOpenHint
    );
    setTitleAndAria(openSearchButton, translation.searchTabHint);
    setTitleAndAria(helpButton, translation.helpHint);
    setTitleAndAria(closeSettingsButton, translation.settingsCloseHint);
    setTitleAndAria(brandLink, translation.openRepository);
    languageButton.textContent = "A";
    setTitleAndAria(languageButton, translation.switchLanguageHint);
    const nextThemeMode = state?.themeMode || "system";
    const themeModeLabel = translation[`theme_${nextThemeMode}`] || translation.theme_system;
    themeButton.innerHTML = buildThemeIconMarkup(nextThemeMode);
    setTitleAndAria(themeButton, `${translation.cycleThemeHint} (${translation.theme}: ${themeModeLabel})`);
    switchLabels.selection.textContent = translation.elementSelect;
    switchLabels.syncPageView.textContent = translation.syncPageView;
    switchLabels.minimalView.textContent = translation.minimalView;
    switchLabels.debug.textContent = translation.debug;
    switchLabels.autoLogs.textContent = translation.autoLogs;
    switchLabels.guideNumbers.textContent = translation.guideNumbers;
    if (providerSectionLabels.search) {
      providerSectionLabels.search.textContent = translation.providerSearchSection;
    }
    if (providerSectionLabels.price) {
      providerSectionLabels.price.textContent = translation.providerPriceSection;
    }
    if (providerSettingsTitle) {
      providerSettingsTitle.textContent = translation.providerSettingsTitle;
    }
    if (providerWarningText) {
      providerWarningText.textContent = translation.providerWarning;
    }
    if (divarLocationLabel) {
      divarLocationLabel.textContent = translation.divarLocationLabel;
    }
    if (divarLocationHint) {
      divarLocationHint.textContent = translation.divarLocationHint;
    }
    for (const labelNode of providerLabels) {
      const provider = String(labelNode.getAttribute("data-provider-label") || "");
      labelNode.textContent = siteLabelFor(provider, language);
    }
    layoutLabel.textContent = translation.layout;
    fontLabel.textContent = translation.fontSize;
    layoutListButton.textContent = translation.layoutList;
    layoutGridButton.textContent = translation.layoutGrid;
    setTitleAndAria(selectionButton, translation.elementSelectHint);
    setTitleAndAria(syncPageViewButton, translation.syncPageViewHint);
    setTitleAndAria(minimalViewButton, translation.minimalViewHint);
    setTitleAndAria(guideNumbersButton, translation.guideNumbersHint);
    setTitleAndAria(
      autoLogsButton,
      state?.debugEnabled ? translation.autoLogsHint : translation.autoLogsHintDebugOff
    );
    setTitleAndAria(debugButton, translation.debugHint);
    setTitleAndAria(layoutListButton, translation.layoutListHint);
    setTitleAndAria(layoutGridButton, translation.layoutGridHint);
    setTitleAndAria(fontDownButton, translation.decreaseSizeHint);
    setTitleAndAria(fontUpButton, translation.increaseSizeHint);
    setTitleAndAria(exportLogsButton, translation.exportLogsHint);
    setTitleAndAria(clearLogsButton, translation.clearLogsHint);
    toggleSettingsButton.classList.toggle("is-active", Boolean(state?.settingsOpen));
    if (exportLogsButton) {
      exportLogsButton.textContent = translation.exportLogs;
    }
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
    autoLogsButton.classList.toggle("is-disabled", !Boolean(state?.debugEnabled));
    autoLogsButton.setAttribute("aria-disabled", String(!Boolean(state?.debugEnabled)));
    guideNumbersButton.classList.toggle("is-active", Boolean(state?.guideNumbersEnabled));
    guideNumbersButton.setAttribute("aria-pressed", String(Boolean(state?.guideNumbersEnabled)));
    for (const button of providerSearchButtons) {
      const provider = String(button.getAttribute("data-provider") || "");
      const enabled = isProviderSearchEnabled(state, provider);
      button.classList.toggle("is-active", enabled);
      button.setAttribute("aria-pressed", String(enabled));
    }
    for (const button of providerPriceButtons) {
      const provider = String(button.getAttribute("data-provider") || "");
      const enabled = isProviderPriceVisible(state, provider);
      button.classList.toggle("is-active", enabled);
      button.setAttribute("aria-pressed", String(enabled));
    }
    renderDivarLocationSelector(state, translation);
    updateProviderSettingsState(state, translation, language);
    layoutListButton.classList.toggle("is-active", state?.layoutMode !== "grid");
    layoutGridButton.classList.toggle("is-active", state?.layoutMode === "grid");
    settingsPanel.classList.toggle("is-open", Boolean(state?.settingsOpen));
    settingsPanel.setAttribute("aria-hidden", String(!state?.settingsOpen));
    itemsList.classList.remove("is-grid", "is-list", "is-minimal");
    itemsList.classList.add(state?.layoutMode === "grid" ? "is-grid" : "is-list");
    if (state?.minimalViewEnabled) {
      itemsList.classList.add("is-minimal");
    }

    settingsHelp.textContent = state?.selectionModeEnabled
      ? translation.settingsSelection
      : page?.mode === "detail"
        ? translation.detailHint
        : translation.listingHint;
    setDebugInfoVisibility(Boolean(state?.debugEnabled));

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
      ? t(language, "logPathReady", { path: helper.logPath || "research/artifacts/rashnu/rashnu-live-log.ndjson" })
      : buildLogHelperDisconnectedHint(language);
  }

  function setDebugInfoVisibility(enabled) {
    const nodes = [settingsHelp, logRow, helperStatusText, logPathText];
    for (const node of nodes) {
      if (!node) {
        continue;
      }
      node.classList.toggle("is-hidden", !enabled);
    }
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
    const matchBySite = {
      ...(match?.allResults && typeof match.allResults === "object" ? match.allResults : {})
    };
    if (match?.targetSite && !matchBySite[match.targetSite]) {
      matchBySite[match.targetSite] = match;
    }
    const allTargetSites = getProviderOrderForSource(item?.sourceSite);
    const allPriceSites = getPriceProviderOrderForSource(item?.sourceSite);
    const allSearchActionSites = getSearchButtonOrderForSource(item?.sourceSite);
    const targetSites = allSearchActionSites.filter((site) => isProviderSearchEnabled(state, site));
    const providerSites = [item.sourceSite, ...allPriceSites].filter(Boolean);
    const sourcePriceVisible = isProviderPriceVisible(state, item.sourceSite);
    const visibleProviderSites = providerSites.filter((site) => isProviderPriceVisible(state, site));
    const guideNumber = Number.isFinite(item.guideNumber)
      ? item.guideNumber
      : Number.isFinite(item.position)
        ? item.position + 1
        : null;
    const googleUrl = match?.googleUrl || globalThis.RashnuNormalize.buildGoogleSearchUrl(item.title);
    const minimalViewEnabled = Boolean(state?.minimalViewEnabled);
    const isGridLayout = state?.layoutMode === "grid";
    const useCompactActions = minimalViewEnabled || isGridLayout;
    const showCornerTools = !useCompactActions;
    const rashnuSearchQuery = String(item.title || "").trim();
    const imageMarkup = item.imageUrl
      ? `<img src="${escapeHtml(item.imageUrl)}" alt="" data-thumb loading="lazy" referrerpolicy="no-referrer">`
      : "";
    const sourceExtraMarkup = sourcePriceVisible
      ? buildPriceExtraMarkup(item.displayDiscountPercent, item.displayOriginalPriceText, language)
      : "";
    const providerPriceBoxesMarkup = visibleProviderSites
      .map((site) => {
        const isSource = site === item.sourceSite;
        const siteLabel = siteLabelFor(site, language);
        const siteIcon = siteIconFor(site);
        const siteMatch = isSource ? null : matchBySite[site];
        const siteSearchEnabled = targetSites.includes(site);
        const siteStatus = isSource
          ? null
          : siteMatch?.status || (siteSearchEnabled && entry?.isLoading ? "loading" : "not_found");
        const rawPriceText = isSource
          ? (item.displayPriceText || translation.unknown)
          : (siteMatch?.targetPriceText ||
              (siteSearchEnabled && siteStatus === "loading"
                ? translation.status_loading
                : translation.unknown));
        const priceText = localizeDynamicText(rawPriceText, language);
        const isLoadingPrice = !isSource && siteSearchEnabled && siteStatus === "loading";
        const priceMarkup = isLoadingPrice
          ? buildLoadingInlineMarkup(priceText)
          : escapeHtml(priceText);
        const extraMarkup = isSource
          ? sourceExtraMarkup
          : buildPriceExtraMarkup(siteMatch?.targetDiscountPercent, siteMatch?.targetOriginalPriceText, language);
        const fallbackSearchUrl =
          siteMatch?.searchUrl || (siteSearchEnabled ? buildTargetSearchUrl(site, item.title) : null);
        const providerProductUrl = isSource
          ? item.productUrl || null
          : siteMatch?.targetUrl && siteMatch?.targetUrl !== siteMatch?.searchUrl
            ? siteMatch.targetUrl
            : fallbackSearchUrl;
        const confidenceMarkup =
          !isSource && Number.isFinite(siteMatch?.confidence)
            ? `<span class="provider-confidence ${escapeHtml(classifyConfidenceTone(siteMatch?.confidence))}">${escapeHtml(
                formatConfidencePercent(siteMatch?.confidence)
              )}</span>`
            : "";
        const boxTag = providerProductUrl ? "a" : "div";
        const boxLinkAttributes = providerProductUrl
          ? ` href="${escapeHtml(providerProductUrl)}" target="_blank" rel="noreferrer" title="${escapeHtml(
              t(language, "openTargetHint", { site: siteLabel })
            )}" aria-label="${escapeHtml(t(language, "openTargetHint", { site: siteLabel }))}"`
          : "";
        return `
          <${boxTag} class="price-box ${providerProductUrl ? "price-box--link" : ""}" data-provider-site="${escapeHtml(site)}"${boxLinkAttributes}>
            <div class="price-main">
              <span class="price-value ${isLoadingPrice ? "price-value--loading" : ""}">${priceMarkup}</span>
              <div class="price-meta">
                ${confidenceMarkup}
                ${buildPriceSiteBadgeMarkup(language, siteLabel, siteIcon)}
              </div>
            </div>
            <div>${extraMarkup}</div>
          </${boxTag}>
        `;
      })
      .join("");
    const guideTooltip =
      guideNumber != null
        ? t(language, "guideNumberHint", {
            number: guideNumber
          })
        : "";

    const targetActionMarkupCompact = targetSites
      .map((site) => {
        const siteLabel = siteLabelFor(site, language);
        const siteIcon = siteIconFor(site);
        const siteMatch = matchBySite[site];
        const siteSearchUrl = siteMatch?.searchUrl || buildTargetSearchUrl(site, item.title);
        return `
          <a class="action-button action-button--icon" data-role="search-target" href="${escapeHtml(siteSearchUrl)}" target="_blank" rel="noreferrer" title="${escapeHtml(t(language, "searchTargetHint", { site: siteLabel }))}" aria-label="${escapeHtml(t(language, "searchTargetHint", { site: siteLabel }))}">
            <span class="action-icon action-icon--search" aria-hidden="true">${buildSearchIconMarkup()}${buildActionSiteIconMarkup(siteLabel, siteIcon)}</span>
          </a>
        `;
      })
      .join("");
    const targetActionMarkupRegular = targetSites
      .map((site) => {
        const siteLabel = siteLabelFor(site, language);
        const siteIcon = siteIconFor(site);
        const siteMatch = matchBySite[site];
        const siteSearchUrl = siteMatch?.searchUrl || buildTargetSearchUrl(site, item.title);
        return `
          <a class="action-button action-button--with-icon" data-role="search-target" href="${escapeHtml(siteSearchUrl)}" target="_blank" rel="noreferrer">
            <span class="action-icon action-icon--search" aria-hidden="true">${buildSearchIconMarkup()}${buildActionSiteIconMarkup(siteLabel, siteIcon)}</span>
            <span class="action-label">${escapeHtml(t(language, "searchTarget", { site: siteLabel }))}</span>
          </a>
        `;
      })
      .join("");

    const actionMarkup = useCompactActions
      ? `
        <div class="item-actions item-actions--minimal">
          <button class="action-button action-button--icon" type="button" data-item-action="rashnu-search" data-search-query="${escapeHtml(rashnuSearchQuery)}" title="${escapeHtml(translation.rashnuSearchHint)}" aria-label="${escapeHtml(translation.rashnuSearchHint)}">
            <span class="action-icon" aria-hidden="true">R</span>
          </button>
          ${targetActionMarkupCompact}
          <a class="action-button action-button--icon" data-role="google-link" href="${escapeHtml(googleUrl)}" target="_blank" rel="noreferrer" title="${escapeHtml(translation.googleHint)}" aria-label="${escapeHtml(translation.googleHint)}">
            <span class="action-icon action-icon--google" aria-hidden="true">${buildGoogleIconMarkup()}</span>
          </a>
          <button class="action-button action-button--icon" type="button" data-item-action="locate-item" data-role="locate-button-inline" data-source-id="${escapeHtml(item.sourceId)}" title="${escapeHtml(translation.locateItemHint)}" aria-label="${escapeHtml(translation.locateItemHint)}">
            <span class="action-icon action-icon--locate" aria-hidden="true">${buildLocateIconMarkup()}</span>
          </button>
          <button class="action-button action-button--icon" type="button" data-item-action="reload-item" data-role="reload-button-inline" data-source-id="${escapeHtml(item.sourceId)}" title="${escapeHtml(translation.reloadAllHint)}" aria-label="${escapeHtml(translation.reloadAllHint)}">
            <span class="action-icon action-icon--reload" aria-hidden="true">${buildReloadIconMarkup()}</span>
          </button>
        </div>`
      : `
        <div class="item-actions">
          <button class="action-button action-button--with-icon" type="button" data-item-action="rashnu-search" data-search-query="${escapeHtml(rashnuSearchQuery)}" title="${escapeHtml(translation.rashnuSearchHint)}" aria-label="${escapeHtml(translation.rashnuSearchHint)}">
            <span class="action-icon" aria-hidden="true">R</span>
            <span class="action-label">${escapeHtml(translation.rashnuSearch)}</span>
          </button>
          ${targetActionMarkupRegular}
          <a class="action-button action-button--with-icon" data-role="google-link" href="${escapeHtml(googleUrl)}" target="_blank" rel="noreferrer">
            <span class="action-icon action-icon--google" aria-hidden="true">${buildGoogleIconMarkup()}</span>
            <span class="action-label">${escapeHtml(t(language, "google"))}</span>
          </a>
        </div>`;

    const itemTitle = localizeDynamicText(item.title, language);

    return `
      <article class="item-card ${entry.isVisible ? "is-visible" : ""}" data-source-id="${escapeHtml(item.sourceId)}" data-item-fingerprint="${escapeHtml(fingerprint)}" data-guide-number="${guideNumber != null ? escapeHtml(String(guideNumber)) : ""}">
        ${
          showCornerTools
            ? `<div class="item-tools">
          <button class="icon-button item-tool" data-item-action="reload-item" data-role="reload-button" data-source-id="${escapeHtml(item.sourceId)}" title="${escapeHtml(translation.reloadAllHint)}" aria-label="${escapeHtml(translation.reloadAllHint)}">${buildReloadIconMarkup()}</button>
          <button class="icon-button item-tool" data-item-action="locate-item" data-role="locate-button" data-source-id="${escapeHtml(item.sourceId)}" title="${escapeHtml(translation.locateItemHint)}" aria-label="${escapeHtml(translation.locateItemHint)}">${buildLocateIconMarkup()}</button>
        </div>`
            : ""
        }
        <div class="item-top">
          <div class="thumb ${item.imageUrl ? "" : "is-broken"}">
            ${imageMarkup}
          </div>
          <div class="item-body">
            <div class="meta-row">
              ${guideNumber != null ? `<span class="guide-chip" data-role="guide-number" title="${escapeHtml(guideTooltip)}" aria-label="${escapeHtml(guideTooltip)}">#${escapeHtml(String(guideNumber))}</span>` : `<span class="guide-chip is-empty" data-role="guide-number"></span>`}
              ${
                entry?.retryCountMatch
                  ? `<span class="retry-chip" data-role="retry-chip">${escapeHtml(
                      t(language, "retriesChip", { value: `${entry.retryCountMatch}/3` })
                    )}</span>`
                  : ""
              }
            </div>
            <h2 class="item-title" data-role="item-title" title="${escapeHtml(itemTitle)}">${escapeHtml(itemTitle)}</h2>
          </div>
        </div>

        ${
          providerPriceBoxesMarkup
            ? `<div class="price-grid">
          ${providerPriceBoxesMarkup}
        </div>`
            : ""
        }

        ${actionMarkup}
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

  function forceRebuild() {
    lastStructureFingerprint = "";
  }

  function scheduleSoftRefresh(delayMs) {
    if (pendingSoftRefreshTimer) {
      window.clearTimeout(pendingSoftRefreshTimer);
    }
    pendingSoftRefreshTimer = window.setTimeout(() => {
      forceRebuild();
      refreshState().catch(() => {});
      pendingSoftRefreshTimer = 0;
    }, delayMs);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setTitleAndAria(element, text) {
    if (!element || !text) {
      return;
    }
    element.title = text;
    element.setAttribute("aria-label", text);
  }

  function themeIconFor(mode) {
    switch (mode) {
      case "dark":
        return "☾";
      case "light":
        return "☀";
      default:
        return "◐";
    }
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
    programmaticScrollTo(node, () => {
      triggerGuideJumpBlink(node);
    });
    node.classList.add("is-page-focus");
  }

  function triggerGuideJumpBlink(node) {
    if (!node) {
      return;
    }
    const activeTimer = guideJumpTimers.get(node);
    if (activeTimer) {
      window.clearTimeout(activeTimer);
    }
    node.classList.remove("is-guide-jump");
    void node.offsetWidth;
    node.classList.add("is-guide-jump");
    const timerId = window.setTimeout(() => {
      node.classList.remove("is-guide-jump");
      guideJumpTimers.delete(node);
    }, 1300);
    guideJumpTimers.set(node, timerId);
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

  function programmaticScrollTo(node, onDone) {
    isProgrammaticScroll = true;
    node.scrollIntoView({
      block: "nearest",
      behavior: "smooth"
    });
    window.clearTimeout(programmaticScrollTo._timerId);
    programmaticScrollTo._timerId = window.setTimeout(() => {
      isProgrammaticScroll = false;
      if (typeof onDone === "function") {
        onDone();
      }
    }, 360);
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
      allResults: Object.fromEntries(
        Object.entries(entry?.match?.allResults || {}).map(([site, result]) => [
          site,
          {
            status: result?.status || "",
            confidence: Number.isFinite(result?.confidence) ? Number(result.confidence) : null,
            targetPriceText: result?.targetPriceText || "",
            targetOriginalPriceText: result?.targetOriginalPriceText || "",
            targetDiscountPercent: result?.targetDiscountPercent || "",
            targetUrl: result?.targetUrl || "",
            searchUrl: result?.searchUrl || ""
          }
        ])
      ),
      providerSearchEnabled: state?.providerSearchEnabled || {},
      providerPriceVisible: state?.providerPriceVisible || {}
    });
  }

  function buildPriceExtraMarkup(discountPercent, originalPriceText, language) {
    const localizedDiscount = localizeDynamicText(discountPercent, language);
    const localizedOriginalPrice = localizeDynamicText(originalPriceText, language);
    const parts = [];
    if (localizedDiscount) {
      parts.push(
        `<span class="price-extra-chip">${escapeHtml(t(language, "discount"))}: ${escapeHtml(
          localizedDiscount
        )}</span>`
      );
    }
    if (localizedOriginalPrice) {
      parts.push(
        `<span class="price-extra-text">${escapeHtml(t(language, "originalPrice"))}: ${escapeHtml(
          localizedOriginalPrice
        )}</span>`
      );
    }
    if (!parts.length) {
      return "";
    }
    return `<div class="price-extra">${parts.join("")}</div>`;
  }

  function buildPriceSiteBadgeMarkup(language, siteLabel, iconUrl) {
    if (iconUrl) {
      const priceLabel = t(language, "sourcePrice", { site: siteLabel });
      return `
        <span class="price-site-badge" title="${escapeHtml(priceLabel)}" aria-label="${escapeHtml(priceLabel)}">
          <img class="price-site-icon" src="${escapeHtml(iconUrl)}" alt="${escapeHtml(siteLabel)}" loading="lazy" decoding="async">
        </span>
      `;
    }
    return `<span class="price-site-badge price-site-badge--text">${escapeHtml(siteLabel)}</span>`;
  }

  function buildActionSiteIconMarkup(siteLabel, iconUrl) {
    if (!iconUrl) {
      return `<span class="action-site-fallback">${escapeHtml((siteLabel || "?").slice(0, 1))}</span>`;
    }
    return `<img class="action-site-icon" src="${escapeHtml(iconUrl)}" alt="${escapeHtml(siteLabel)}" loading="lazy" decoding="async">`;
  }

  function buildGoogleIconMarkup() {
    const iconUrl = extensionAssetUrl("assets/site-icons/google-symbol.svg");
    return `<img class="action-google-icon" src="${escapeHtml(iconUrl)}" alt="Google" loading="lazy" decoding="async">`;
  }

  function buildSearchIconMarkup() {
    return `<svg class="action-symbol action-symbol--search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6"></circle><line x1="20" y1="20" x2="15.8" y2="15.8"></line></svg>`;
  }

  function buildLocateIconMarkup() {
    return `<svg class="action-symbol action-symbol--locate" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6"></circle><line x1="12" y1="3.5" x2="12" y2="7"></line><line x1="12" y1="17" x2="12" y2="20.5"></line><line x1="3.5" y1="12" x2="7" y2="12"></line><line x1="17" y1="12" x2="20.5" y2="12"></line></svg>`;
  }

  function buildReloadIconMarkup() {
    return `<svg class="action-symbol action-symbol--reload" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"></path><polyline points="21 3 21 9 15 9"></polyline></svg>`;
  }

  function buildLoadingInlineMarkup(label) {
    return `<span class="loading-inline"><span class="loading-spinner" aria-hidden="true"></span><span>${escapeHtml(label)}</span></span>`;
  }

  function buildSettingsIconMarkup() {
    return `<svg class="icon-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.05.05a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.05-.05a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.08a1.65 1.65 0 0 0-1.08-1.54 1.65 1.65 0 0 0-1.82.33l-.05.05a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.05-.05A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.08a1.65 1.65 0 0 0 1.54-1.08 1.65 1.65 0 0 0-.33-1.82l-.05-.05a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.05.05a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.08a1.65 1.65 0 0 0 1.08 1.54 1.65 1.65 0 0 0 1.82-.33l.05-.05a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.05.05A1.65 1.65 0 0 0 19.4 9c.2.48.67.8 1.2.82H21a2 2 0 0 1 0 4h-.08a1.65 1.65 0 0 0-1.52 1.18z"></path></svg>`;
  }

  function buildHelpIconMarkup() {
    return `<svg class="icon-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.1 9a3 3 0 1 1 5.46 1.7c-.73.82-1.56 1.38-2.06 2.1-.27.39-.4.72-.4 1.2"></path><circle cx="12" cy="17.2" r="1"></circle></svg>`;
  }

  function buildCloseIconMarkup() {
    return `<svg class="icon-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>`;
  }

  function buildThemeIconMarkup(mode) {
    switch (mode) {
      case "dark":
        return `<svg class="icon-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A8.8 8.8 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path></svg>`;
      case "light":
        return `<svg class="icon-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"></circle><line x1="12" y1="2.5" x2="12" y2="5"></line><line x1="12" y1="19" x2="12" y2="21.5"></line><line x1="2.5" y1="12" x2="5" y2="12"></line><line x1="19" y1="12" x2="21.5" y2="12"></line><line x1="5.2" y1="5.2" x2="7" y2="7"></line><line x1="17" y1="17" x2="18.8" y2="18.8"></line><line x1="17" y1="7" x2="18.8" y2="5.2"></line><line x1="5.2" y1="18.8" x2="7" y2="17"></line></svg>`;
      default:
        return `<svg class="icon-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c.8 0 1.57-.1 2.3-.3A8.5 8.5 0 0 1 12 3z"></path><path d="M12 3a9 9 0 0 1 0 18"></path></svg>`;
    }
  }

  function buildLogHelperDisconnectedHint(language) {
    if (isWindowsHost()) {
      return language === "en"
        ? "Windows setup: `.\\run-rashnu-helper.ps1 -InstallAutostart` · manual run: `.\\run-rashnu-helper.ps1`"
        : "برای ویندوز: `.\\run-rashnu-helper.ps1 -InstallAutostart` · اجرای دستی: `.\\run-rashnu-helper.ps1`";
    }
    return TRANSLATIONS[language].logPathDisconnected;
  }

  function isWindowsHost() {
    const platform =
      navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || "";
    return /win/i.test(platform);
  }

  function classifyConfidenceTone(confidenceValue) {
    if (!Number.isFinite(confidenceValue)) {
      return "confidence-unknown";
    }
    if (confidenceValue < 0.4) {
      return "confidence-low";
    }
    if (confidenceValue < 0.75) {
      return "confidence-average";
    }
    return "confidence-good";
  }

  function formatConfidencePercent(confidenceValue) {
    if (!Number.isFinite(confidenceValue)) {
      return "";
    }
    return `${Math.max(0, Math.min(100, Math.round(confidenceValue * 100)))}%`;
  }

  function localizeDynamicText(value, language) {
    const text = String(value || "");
    if (!text) {
      return "";
    }
    if (language !== "en") {
      return text;
    }
    return toLatinDigits(text)
      .replace(/نامشخص/gu, "Unknown")
      .replace(/ناموجود/gu, "Unavailable")
      .replace(/اتمام موجودی/gu, "Out of stock")
      .replace(/موجود نیست/gu, "Out of stock")
      .replace(/تومان/gu, "T")
      .replace(/ریال/gu, "IRR");
  }

  function toLatinDigits(value) {
    return String(value || "")
      .replace(/[۰-۹]/gu, (digit) => String(digit.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/gu, (digit) => String(digit.charCodeAt(0) - 1632))
      .replace(/٬/gu, ",")
      .replace(/٫/gu, ".");
  }

  function updateProviderSettingsState(state, translation, language) {
    if (!providerSettingsBlock) {
      return;
    }
    const expanded = isProviderSettingsExpanded(state);
    providerSettingsExpanded = expanded;
    providerSettingsBlock.classList.toggle("is-expanded", expanded);
    if (providerSettingsToggleButton) {
      providerSettingsToggleButton.setAttribute("aria-expanded", String(expanded));
      setTitleAndAria(
        providerSettingsToggleButton,
        expanded ? translation.providerSettingsCollapseHint : translation.providerSettingsExpandHint
      );
    }
    providerChipRows.search?.setAttribute("aria-label", translation.providerSearchSection);
    providerChipRows.price?.setAttribute("aria-label", translation.providerPriceSection);
    providerChipRows.search?.setAttribute("title", translation.providerSearchSection);
    providerChipRows.price?.setAttribute("title", translation.providerPriceSection);
    renderProviderSummaryChips(state, language, "search");
    renderProviderSummaryChips(state, language, "price");
  }

  function isProviderSettingsExpanded(state) {
    const autoExpanded = !Boolean(state?.minimalViewEnabled);
    if (providerSettingsExpandedOverride == null) {
      return autoExpanded;
    }
    return providerSettingsExpandedOverride;
  }

  function renderProviderSummaryChips(state, language, section) {
    const host = providerChipRows[section];
    if (!host) {
      return;
    }
    const enabledPredicate = section === "price" ? isProviderPriceVisible : isProviderSearchEnabled;
    const activeProviders = getProviderSitesForSection(section).filter((site) => enabledPredicate(state, site));
    if (!activeProviders.length) {
      host.innerHTML = `<span class="provider-chip provider-chip--empty">${escapeHtml(
        TRANSLATIONS[language].providerNoActive
      )}</span>`;
      return;
    }
    host.innerHTML = activeProviders
      .map((site) => `<span class="provider-chip">${escapeHtml(siteLabelFor(site, language))}</span>`)
      .join("");
  }

  function getProviderSitesForSection(section) {
    return (section === "price" ? PRICE_PROVIDER_SITES : SEARCH_PROVIDER_SITES).slice();
  }

  function isProviderSearchEnabled(state, site) {
    const map = state?.providerSearchEnabled || {};
    return map[site] !== false;
  }

  function isProviderPriceVisible(state, site) {
    const map = state?.providerPriceVisible || {};
    return map[site] !== false;
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
    return globalThis.RashnuNormalize.getSiteLabel(site, language);
  }

  function siteIconFor(site) {
    const iconPath = globalThis.RashnuNormalize.getProviderIconPath(site);
    return iconPath ? extensionAssetUrl(iconPath) : "";
  }

  function inferTargetSiteForPage(page, state) {
    const items = Array.isArray(page?.items) ? page.items : [];
    const counts = new Map();
    for (const entry of items) {
      const site = entry?.match?.targetSite;
      if (!site || !isProviderSearchEnabled(state, site)) {
        continue;
      }
      counts.set(site, (counts.get(site) || 0) + 1);
    }
    if (counts.size) {
      let selectedSite = "torob";
      let selectedCount = -1;
      for (const [site, count] of counts.entries()) {
        if (count > selectedCount) {
          selectedSite = site;
          selectedCount = count;
        }
      }
      return selectedSite;
    }

    const fallbackOrder = getProviderOrderForSource(page?.site);
    for (const site of fallbackOrder) {
      if (isProviderSearchEnabled(state, site)) {
        return site;
      }
    }
    return fallbackOrder[0] || "torob";
  }

  function inferTargetSiteForItem(item, state, match) {
    if (match?.targetSite) {
      return match.targetSite;
    }
    const order = getProviderOrderForSource(item?.sourceSite);
    for (const site of order) {
      if (isProviderSearchEnabled(state, site)) {
        return site;
      }
    }
    return order[0] || "torob";
  }

  function getProviderOrderForSource(sourceSite) {
    return globalThis.RashnuNormalize.getTargetSitesForSource(sourceSite);
  }

  function getSearchButtonOrderForSource(sourceSite) {
    return globalThis.RashnuNormalize.getSearchButtonSitesForSource(sourceSite);
  }

  function getPriceProviderOrderForSource(sourceSite) {
    return globalThis.RashnuNormalize.getPriceVisibilityProviderSites().filter((site) => site !== sourceSite);
  }

  function buildTargetSearchUrl(site, query) {
    if (site === "digikala") {
      return globalThis.RashnuNormalize.buildDigikalaSearchUrl(query);
    }
    if (site === "technolife") {
      return globalThis.RashnuNormalize.buildTechnolifeSearchUrl(query);
    }
    if (site === "emalls") {
      return globalThis.RashnuNormalize.buildEmallsSearchUrl(query);
    }
    if (site === "divar") {
      return globalThis.RashnuNormalize.buildDivarSearchUrl(query, currentState?.divarLocation?.slug || "tehran");
    }
    if (site === "amazon") {
      return globalThis.RashnuNormalize.buildAmazonSearchUrl(query);
    }
    if (site === "ebay") {
      return globalThis.RashnuNormalize.buildEbaySearchUrl(query);
    }
    if (site === "basalam") {
      return globalThis.RashnuNormalize.buildBasalamSearchUrl(query);
    }
    return globalThis.RashnuNormalize.buildTorobSearchUrl(query);
  }

  function extensionAssetUrl(path) {
    if (globalThis.chrome?.runtime?.getURL) {
      return globalThis.chrome.runtime.getURL(path);
    }
    return `../../${path}`;
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

  function getPanelScrollStateKey(state) {
    const tabId = state?.activeTabId;
    const page = state?.page;
    if (tabId == null || !page?.pageUrl) {
      return "";
    }
    return `${tabId}|${page.pageUrl}|${page.mode || "unsupported"}`;
  }

  function rememberPanelScrollPosition(state) {
    const key = getPanelScrollStateKey(state);
    if (!key) {
      return;
    }
    panelScrollPositions.set(key, itemsList.scrollTop);
  }

  function getSavedPanelScrollPosition(state) {
    const key = getPanelScrollStateKey(state);
    if (!key) {
      return null;
    }
    const saved = panelScrollPositions.get(key);
    return Number.isFinite(saved) ? saved : null;
  }

  function restorePanelScrollPosition(savedScrollTop) {
    if (!Number.isFinite(savedScrollTop)) {
      return;
    }
    itemsList.scrollTop = savedScrollTop;
  }

  function renderDivarLocationSelector(state, translation) {
    if (!divarLocationSelect) {
      return;
    }
    const options = Array.isArray(state?.divarLocationOptions) ? state.divarLocationOptions : [];
    const selected = String(state?.divarLocation?.id || "");
    divarLocationSelect.disabled = options.length <= 1;
    divarLocationSelect.innerHTML = options.length
      ? options.map((option) => `
          <option value="${escapeHtml(String(option.id))}" ${String(option.id) === selected ? "selected" : ""}>
            ${escapeHtml(option.name || translation.divarLocationLoading)}
          </option>
        `).join("")
      : `<option value="">${escapeHtml(translation.divarLocationLoading)}</option>`;
  }

  function getSelectedDivarLocation(state, idValue) {
    const options = Array.isArray(state?.divarLocationOptions) ? state.divarLocationOptions : [];
    const targetId = Number.parseInt(idValue, 10);
    if (!Number.isFinite(targetId)) {
      return null;
    }
    return options.find((option) => Number(option?.id) === targetId) || null;
  }

})();
