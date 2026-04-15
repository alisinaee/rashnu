(function () {
  "use strict";

  const ALL_PROVIDER_SITES = globalThis.RashnuNormalize.getGlobalSearchProviderSites();
  const STORAGE_KEYS = [
    "rashnuLanguage",
    "rashnuThemeMode",
    "rashnuProviderSearchEnabled",
    "rashnuGlobalSearchAdvancedMode",
    "rashnuDivarLocation"
  ];
  const root = document.querySelector(".search-page");
  const topStackNode = document.querySelector("[data-role='top-stack']");
  const titleNode = document.querySelector("[data-role='page-title']");
  const subtitleNode = document.querySelector("[data-role='page-subtitle']");
  const providerScopeNode = document.querySelector("[data-role='provider-scope']");
  const shortcutHintNode = document.querySelector("[data-role='shortcut-hint']");
  const searchForm = document.querySelector("[data-role='search-form']");
  const searchCardTitleNode = document.querySelector("[data-role='search-card-title']");
  const searchCardCaptionNode = document.querySelector("[data-role='search-card-caption']");
  const queryInput = document.querySelector("[data-role='query-input']");
  const searchSubmitButton = document.querySelector("[data-role='search-submit']");
  const providerChipsNode = document.querySelector("[data-role='provider-chips']");
  const openAllButton = document.querySelector("[data-action='open-all-searches']");
  const globalSettingsBlock = document.querySelector("[data-role='global-settings-block']");
  const globalSettingsTitleNode = document.querySelector("[data-role='global-settings-title']");
  const globalSettingsCaptionNode = document.querySelector("[data-role='global-settings-caption']");
  const globalSettingsSummaryNode = document.querySelector("[data-role='global-settings-summary']");
  const languageButton = document.querySelector("[data-action='toggle-language']");
  const themeButton = document.querySelector("[data-action='cycle-theme']");
  const advancedModeToggleButton = document.querySelector("[data-action='toggle-advanced-mode']");
  const advancedModeLabelNode = document.querySelector("[data-role='advanced-mode-label']");
  const groupingToggleButton = document.querySelector("[data-action='toggle-grouping']");
  const groupingLabelNode = document.querySelector("[data-role='grouping-label']");
  const dedupeToggleButton = document.querySelector("[data-action='toggle-dedupe']");
  const dedupeLabelNode = document.querySelector("[data-role='dedupe-label']");
  const maxResultsLabelNode = document.querySelector("[data-role='max-results-label']");
  const maxResultsValueNode = document.querySelector("[data-role='max-results-value']");
  const providerSettingsBlock = document.querySelector("[data-role='provider-settings-block']");
  const providerSettingsBody = document.querySelector("[data-role='provider-settings-body']");
  const providerSettingsTitleNode = document.querySelector("[data-role='providers-title']");
  const providerSettingsCaptionNode = document.querySelector("[data-role='providers-caption']");
  const providerWarningNode = document.querySelector("[data-role='provider-warning']");
  const divarLocationLabelNode = document.querySelector("[data-role='divar-location-label']");
  const divarLocationHintNode = document.querySelector("[data-role='divar-location-hint']");
  const divarLocationSelect = document.querySelector("[data-role='divar-location-select']");
  const divarLocationField = divarLocationSelect?.closest(".provider-select-field");
  const clearFiltersButton = document.querySelector("[data-role='clear-filters']");
  const decreaseMaxResultsButton = document.querySelector("[data-action='decrease-max-results']");
  const increaseMaxResultsButton = document.querySelector("[data-action='increase-max-results']");
  const heroTitleNode = document.querySelector("[data-role='hero-title']");
  const heroBodyNode = document.querySelector("[data-role='hero-body']");
  const providerBlockerNode = document.querySelector("[data-role='provider-blocker']");
  const statusBarNode = document.querySelector("[data-role='status-bar']");
  const resultsBodyNode = document.querySelector("[data-role='results-body']");
  const tableWrapNode = document.querySelector("[data-role='table-wrap']");
  const includeLabelNode = document.querySelector("[data-role='include-label']");
  const includeHintNode = document.querySelector("[data-role='include-hint']");
  const includeChipListNode = document.querySelector("[data-role='include-chip-list']");
  const includeInput = document.querySelector("[data-role='include-input']");
  const includeAddButton = document.querySelector("[data-action='add-include']");
  const excludeLabelNode = document.querySelector("[data-role='exclude-label']");
  const excludeHintNode = document.querySelector("[data-role='exclude-hint']");
  const excludeChipListNode = document.querySelector("[data-role='exclude-chip-list']");
  const excludeInput = document.querySelector("[data-role='exclude-input']");
  const excludeAddButton = document.querySelector("[data-action='add-exclude']");
  const conditionLabelNode = document.querySelector("[data-role='condition-label']");
  const conditionHintNode = document.querySelector("[data-role='condition-hint']");
  const conditionOptionsNode = document.querySelector("[data-role='condition-options']");
  const queryPreviewNode = document.querySelector("[data-role='query-preview']");
  const suggestionsNode = document.querySelector("[data-role='suggestions']");
  const columnNodes = {
    provider: document.querySelector("[data-role='col-provider']"),
    rank: document.querySelector("[data-role='col-rank']"),
    title: document.querySelector("[data-role='col-title']"),
    price: document.querySelector("[data-role='col-price']"),
    original: document.querySelector("[data-role='col-original']"),
    discount: document.querySelector("[data-role='col-discount']"),
    confidence: document.querySelector("[data-role='col-confidence']"),
    actions: document.querySelector("[data-role='col-actions']")
  };

  const TRANSLATIONS = {
    fa: {
      pageTitle: "جست‌وجوی سراسری",
      pageSubtitle: "یک عبارت را در همه‌ی منابع فعال جست‌وجو کن و نتیجه را در یک جدول ببین.",
      providerScope: "{count} منبع فعال",
      shortcutHint: "میانبرها: Cmd/Ctrl+K، O، S، 1..{maxProviderShortcut}",
      globalSettingsTitle: "تنظیمات Rashnu",
      globalSettingsCaption: "تنظیمات این بخش بالای نوار جست‌وجو می‌ماند.",
      advancedModeLabel: "حالت پیشرفته",
      advancedModeEnabledHint: "حالت پیشرفته را خاموش کن و به تنظیمات ساده برگرد.",
      advancedModeDisabledHint: "برای نمایش همه‌ی فیلترها و کنترل‌ها حالت پیشرفته را روشن کن.",
      providersTitle: "منابع",
      providersCaption: "منابع فعال همین تب جست‌وجو را انتخاب کن.",
      divarLocationLabel: "شهر دیوار",
      divarLocationHint: "فقط برای جست‌وجوهای دیوار استفاده می‌شود.",
      divarLocationLoading: "در حال بارگذاری...",
      providersExpandHint: "باز کردن منابع",
      providersCollapseHint: "بستن منابع",
      groupByProviders: "گروه‌بندی بر اساس منبع",
      groupDuplicates: "ادغام موارد مشابه",
      maxResults: "حداکثر نتیجه / منبع",
      searchPlaceholder: "مثلاً: iPhone 15 Pro Max 256",
      searchSubmit: "جست‌وجو",
      searchAllEnabled: "جست‌وجوی همه منابع فعال",
      openAllSearches: "باز کردن جست‌وجوی همه منابع",
      includeTerms: "باید شامل شود",
      includeHint: "مثل Apple، M4، 16GB",
      excludeTerms: "حذف واژه‌ها",
      excludeHint: "مثل استوک، used، refurbished",
      clearFilters: "پاک کردن همه فیلترها",
      chipInputPlaceholder: "عبارت را اضافه کن و Enter بزن",
      addChip: "افزودن",
      removeChip: "حذف",
      conditionLabel: "شرط وضعیت",
      conditionHint: "از عنوان و متادیتای وضعیت نتیجه استفاده می‌کند.",
      condition_any: "همه",
      condition_new_only: "فقط نو",
      condition_used_only: "فقط کارکرده",
      queryPreviewLabel: "پیش‌نمایش جست‌وجو",
      previewSearching: "جست‌وجو برای",
      previewInclude: "باید شامل شود",
      previewExclude: "حذف شده",
      previewCondition: "شرط",
      suggestionsTitle: "پیشنهاد برای دقیق‌تر کردن",
      suggestion_include: "افزودن",
      suggestion_exclude: "حذف",
      suggestionReason_repeated_spec: "مشخصه پرتکرار در نتیجه‌ها",
      suggestionReason_repeated_brand: "برند پرتکرار در نتیجه‌ها",
      suggestionReason_used_term: "واژه‌ی پرتکرار مربوط به کارکرده",
      suggestionReason_repeated_token: "واژه‌ی پرتکرار در نتیجه‌ها",
      heroTitle: "جست‌وجو را از اینجا شروع کن",
      heroBody: "نتیجه‌های رتبه‌بندی‌شده را از هر منبع فعال در یک جدول می‌بینی. انتخاب منبع در این صفحه فقط محلی است و تنظیمات پنل را تغییر نمی‌دهد.",
      providerWarning: "هشدار: آمازون و eBay ممکن است ترافیک افزونه را به‌عنوان رفتار بات تشخیص دهند، بنابراین نتایج این دو منبع همیشه کاملاً قابل اتکا نیست.",
      loading: "در حال جست‌وجو در منابع انتخاب‌شده...",
      loadingRows: "در حال آماده‌سازی ردیف‌های نتیجه...",
      statusReady: "نتایج برای «{query}» آماده شد.",
      statusIdle: "برای شروع، عبارت موردنظر را جست‌وجو کن.",
      statusNoQuery: "عبارت جست‌وجو خالی است.",
      statusNoProviders: "هیچ منبعی برای جست‌وجو انتخاب نشده است.",
      noProvidersTitle: "هیچ منبعی فعال نیست",
      noProvidersBody: "برای این نشست حداقل یک منبع را انتخاب کن. این تغییر فقط داخل همین تب اعمال می‌شود.",
      enableAllProviders: "فعال کردن همه منابع",
      langButton: "FA / EN",
      switchLanguageHint: "تغییر زبان Rashnu",
      cycleThemeHint: "تغییر تم Rashnu",
      theme_system: "خودکار",
      theme_dark: "تیره",
      theme_light: "روشن",
      summaryTheme: "تم {value}",
      summaryLanguage: "زبان {value}",
      summaryModeSimple: "حالت ساده",
      summaryModeAdvanced: "حالت پیشرفته",
      summaryMaxResults: "{value} / منبع",
      summaryGroupingOn: "گروهی",
      summaryGroupingOff: "بدون گروه",
      summaryDedupeOn: "ادغام مشابه‌ها",
      summaryDedupeOff: "بدون ادغام",
      colProvider: "منبع",
      colRank: "رتبه",
      colTitle: "عنوان",
      colPrice: "قیمت",
      colOriginal: "قیمت اصلی",
      colDiscount: "تخفیف",
      colConfidence: "اعتماد",
      colActions: "اقدام‌ها",
      sortAsc: "صعودی",
      sortDesc: "نزولی",
      open: "باز کردن",
      search: "جست‌وجو",
      noRows: "نتیجه‌ای برای این منبع پیدا نشد.",
      providerEmpty_error: "در ارتباط با این منبع خطا رخ داد. جست‌وجوی مستقیم این منبع را باز کن یا دوباره تلاش کن.",
      providerEmpty_not_found: "برای این منبع ردیفی برنگشت. جست‌وجوی مستقیم این منبع هنوز می‌تواند مفید باشد.",
      providerEmpty_low_confidence: "نتیجه‌ی قابل‌نمایش در جدول برنگشت. بهتر است جست‌وجوی مستقیم این منبع را باز کنی.",
      noResultsOverall: "برای منابع انتخاب‌شده نتیجه‌ای آماده نیست.",
      status_matched: "نتیجه خوب",
      status_low_confidence: "نیاز به بررسی",
      status_not_found: "بدون نتیجه",
      status_error: "خطا",
      reason_no_results: "مورد قابل‌اتکایی پیدا نشد.",
      reason_blocked_by_antibot: "این منبع درخواست را شبیه رفتار بات تشخیص داده است.",
      reason_network_unreachable: "ارتباط با منبع برقرار نشد.",
      reason_score_match: "تطابق عنوان قوی بود.",
      reason_results_available: "نتیجه وجود دارد اما دقت آن متوسط است.",
      reason_token_overlap: "هم‌پوشانی واژه‌ها پیدا شد.",
      reason_exact_title: "عنوان تقریباً دقیق تطبیق شد.",
      reason_default: "وضعیت این منبع.",
      providerCount: "{count} نتیجه",
      activeRowHint: "ردیف فعال",
      unknown: "نامشخص",
      rankPrefix: "#{rank}",
      duplicateGroup: "{count} مورد مشابه"
    },
    en: {
      pageTitle: "Global Search",
      pageSubtitle: "Search one phrase across every enabled provider and review the results in a single table.",
      providerScope: "{count} active providers",
      shortcutHint: "Shortcuts: Cmd/Ctrl+K, O, S, 1..{maxProviderShortcut}",
      globalSettingsTitle: "Rashnu Settings",
      globalSettingsCaption: "These controls stay above the search bar while you work.",
      advancedModeLabel: "Advanced Mode",
      advancedModeEnabledHint: "Turn advanced mode off and go back to the simple setup.",
      advancedModeDisabledHint: "Turn advanced mode on to reveal all filters and controls.",
      providersTitle: "Providers",
      providersCaption: "Choose the active providers for this search tab.",
      divarLocationLabel: "Divar City",
      divarLocationHint: "Used only for Divar searches.",
      divarLocationLoading: "Loading...",
      providersExpandHint: "Expand providers",
      providersCollapseHint: "Collapse providers",
      groupByProviders: "Group By Provider",
      groupDuplicates: "Group Duplicates",
      maxResults: "Max Results / Provider",
      searchPlaceholder: "For example: iPhone 15 Pro Max 256",
      searchSubmit: "Search",
      searchAllEnabled: "Search All Enabled",
      openAllSearches: "Open All Provider Searches",
      includeTerms: "Must Include",
      includeHint: "For example: Apple, M4, 16GB",
      excludeTerms: "Exclude Words",
      excludeHint: "For example: used, refurbished, A1347",
      clearFilters: "Clear All Filters",
      chipInputPlaceholder: "Add a phrase and press Enter",
      addChip: "Add",
      removeChip: "Remove",
      conditionLabel: "Condition",
      conditionHint: "Uses returned titles and condition metadata.",
      condition_any: "Any",
      condition_new_only: "New only",
      condition_used_only: "Used only",
      queryPreviewLabel: "Query Preview",
      previewSearching: "Searching for",
      previewInclude: "Must include",
      previewExclude: "Excluded",
      previewCondition: "Condition",
      suggestionsTitle: "Refinement Suggestions",
      suggestion_include: "Add",
      suggestion_exclude: "Exclude",
      suggestionReason_repeated_spec: "Repeated spec in results",
      suggestionReason_repeated_brand: "Repeated brand in results",
      suggestionReason_used_term: "Repeated used-condition term",
      suggestionReason_repeated_token: "Repeated result token",
      heroTitle: "Start with a product phrase",
      heroBody: "You will get ranked rows from each enabled provider in one table. Provider selection on this page is session-local and does not overwrite side-panel settings.",
      providerWarning: "Warning: Amazon and eBay may detect extension traffic as bot activity, so results on these providers are not always fully reliable.",
      loading: "Searching selected providers...",
      loadingRows: "Preparing result rows...",
      statusReady: "Results are ready for “{query}”.",
      statusIdle: "Run a query to start.",
      statusNoQuery: "Search query is empty.",
      statusNoProviders: "No providers are selected.",
      noProvidersTitle: "No providers selected",
      noProvidersBody: "Enable at least one provider for this session. This does not rewrite panel settings.",
      enableAllProviders: "Enable All Providers",
      langButton: "FA / EN",
      switchLanguageHint: "Switch Rashnu language",
      cycleThemeHint: "Cycle Rashnu theme",
      theme_system: "Auto",
      theme_dark: "Dark",
      theme_light: "Light",
      summaryTheme: "Theme {value}",
      summaryLanguage: "Language {value}",
      summaryModeSimple: "Simple Mode",
      summaryModeAdvanced: "Advanced Mode",
      summaryMaxResults: "{value} / provider",
      summaryGroupingOn: "Grouped",
      summaryGroupingOff: "Flat",
      summaryDedupeOn: "Duplicates merged",
      summaryDedupeOff: "No dedupe",
      colProvider: "Provider",
      colRank: "Rank",
      colTitle: "Title",
      colPrice: "Price",
      colOriginal: "Original",
      colDiscount: "Discount",
      colConfidence: "Confidence",
      colActions: "Actions",
      sortAsc: "Ascending",
      sortDesc: "Descending",
      open: "Open",
      search: "Search",
      noRows: "No results were returned for this provider.",
      providerEmpty_error: "This provider returned an error. Open direct provider search or try again.",
      providerEmpty_not_found: "No rows were returned for this provider. Direct provider search may still help.",
      providerEmpty_low_confidence: "No table-ready rows were returned. Direct provider search is likely more useful here.",
      noResultsOverall: "No results are ready for the selected providers.",
      status_matched: "Matched",
      status_low_confidence: "Review",
      status_not_found: "No Results",
      status_error: "Error",
      reason_no_results: "No reliable results were returned.",
      reason_blocked_by_antibot: "This provider treated the request like bot traffic.",
      reason_network_unreachable: "The provider could not be reached.",
      reason_score_match: "The title match was strong.",
      reason_results_available: "Results exist but confidence is moderate.",
      reason_token_overlap: "Shared title tokens were found.",
      reason_exact_title: "The title matched almost exactly.",
      reason_default: "Provider status.",
      providerCount: "{count} results",
      activeRowHint: "Active row",
      unknown: "Unknown",
      rankPrefix: "#{rank}",
      duplicateGroup: "{count} similar results"
    }
  };

  const state = {
    language: "fa",
    themeMode: "system",
    query: "",
    includeTerms: [],
    excludeTerms: [],
    conditionFilter: "any",
    selectedProviders: [],
    divarLocation: {
      id: 1,
      slug: "tehran",
      name: "تهران"
    },
    divarLocationOptions: [],
    advancedModeEnabled: false,
    groupByProvider: true,
    dedupeEnabled: false,
    maxResults: 3,
    sortKey: "rank",
    sortDir: "asc",
    loading: false,
    pendingSearchRerun: false,
    activeSearchRequestId: 0,
    response: null,
    activeRowKey: null
  };
  let pendingActiveRowReveal = false;

  boot().catch(() => {});

  async function boot() {
    await loadSettings();
    await loadDivarLocations();
    hydrateInitialQueryFromUrl();
    await notifyGlobalSearchTabOpened();
    bindEvents();
    render();
    syncStickyOffsets();
    window.setTimeout(() => {
      queryInput.focus();
      if (state.query) {
        queryInput.select();
      }
    }, 0);
    if (shouldAutorunFromUrl()) {
      runSearch().catch(() => {});
    }
  }

  async function loadSettings() {
    const stored = await chrome.storage.local.get(STORAGE_KEYS);
    state.language = stored.rashnuLanguage === "en" ? "en" : "fa";
    state.themeMode = ["system", "dark", "light"].includes(stored.rashnuThemeMode) ? stored.rashnuThemeMode : "system";
    state.selectedProviders = getEnabledProvidersFromFlags(stored.rashnuProviderSearchEnabled);
    state.advancedModeEnabled = Boolean(stored.rashnuGlobalSearchAdvancedMode);
    if (stored.rashnuDivarLocation && typeof stored.rashnuDivarLocation === "object") {
      state.divarLocation = {
        id: Number(stored.rashnuDivarLocation.id) || 1,
        slug: String(stored.rashnuDivarLocation.slug || "tehran"),
        name: String(stored.rashnuDivarLocation.name || "تهران")
      };
    }
  }

  async function loadDivarLocations() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "RASHNU_GET_DIVAR_LOCATIONS"
      });
      if (!response?.ok) {
        return;
      }
      if (response.location && typeof response.location === "object") {
        state.divarLocation = {
          id: Number(response.location.id) || 1,
          slug: String(response.location.slug || "tehran"),
          name: String(response.location.name || "تهران")
        };
      }
      state.divarLocationOptions = Array.isArray(response.options) ? response.options : [];
    } catch (_error) {}
  }

  function bindEvents() {
    searchForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await runSearch();
    });

    clearFiltersButton.addEventListener("click", () => {
      clearAllFilters();
    });

    languageButton.addEventListener("click", () => {
      cycleLanguage().catch(() => {});
    });

    themeButton.addEventListener("click", () => {
      cycleThemeMode().catch(() => {});
    });

    advancedModeToggleButton.addEventListener("click", () => {
      setAdvancedMode(!state.advancedModeEnabled).catch(() => {});
    });

    queryInput.addEventListener("input", () => {
      state.query = queryInput.value;
      renderStatus();
      renderQueryPreview();
      renderSuggestions();
    });

    includeInput.addEventListener("keydown", (event) => {
      handleChipInputKeydown(event, "include");
    });

    excludeInput.addEventListener("keydown", (event) => {
      handleChipInputKeydown(event, "exclude");
    });

    searchForm.addEventListener("click", (event) => {
      const addIncludeButton = event.target.closest("[data-action='add-include']");
      if (addIncludeButton) {
        commitChipInput("include");
        return;
      }
      const addExcludeButton = event.target.closest("[data-action='add-exclude']");
      if (addExcludeButton) {
        commitChipInput("exclude");
        return;
      }
      const removeChipButton = event.target.closest("[data-chip-remove]");
      if (removeChipButton) {
        const group = String(removeChipButton.getAttribute("data-chip-remove") || "");
        const index = Number.parseInt(removeChipButton.getAttribute("data-chip-index") || "", 10);
        removeChip(group, index);
        return;
      }
      const conditionButton = event.target.closest("[data-condition]");
      if (conditionButton) {
        const value = String(conditionButton.getAttribute("data-condition") || "any");
        if (["any", "new_only", "used_only"].includes(value)) {
          state.conditionFilter = value;
          rerunSearchIfNeeded();
          render();
        }
        return;
      }
      const suggestionButton = event.target.closest("[data-suggestion-type]");
      if (suggestionButton) {
        applySuggestion(
          String(suggestionButton.getAttribute("data-suggestion-type") || ""),
          String(suggestionButton.getAttribute("data-suggestion-label") || "")
        );
      }
    });

    providerChipsNode.addEventListener("click", (event) => {
      const button = event.target.closest("[data-provider]");
      if (!button) {
        return;
      }
      const provider = String(button.getAttribute("data-provider") || "");
      if (!ALL_PROVIDER_SITES.includes(provider)) {
        return;
      }
      if (state.selectedProviders.includes(provider)) {
        state.selectedProviders = state.selectedProviders.filter((site) => site !== provider);
      } else {
        state.selectedProviders = [...state.selectedProviders, provider];
      }
      ensureActiveRow();
      render();
    });

    divarLocationSelect?.addEventListener("change", async () => {
      const nextLocation = getSelectedDivarLocation(divarLocationSelect.value);
      if (!nextLocation) {
        return;
      }
      state.divarLocation = nextLocation;
      await chrome.runtime.sendMessage({
        type: "RASHNU_SET_DIVAR_LOCATION",
        payload: { location: nextLocation }
      });
      rerunSearchIfNeeded();
      render();
    });

    openAllButton.addEventListener("click", () => {
      openAllProviderSearches();
    });

    groupingToggleButton.addEventListener("click", () => {
      state.groupByProvider = !state.groupByProvider;
      ensureActiveRow();
      render();
    });

    dedupeToggleButton.addEventListener("click", () => {
      state.dedupeEnabled = !state.dedupeEnabled;
      rerunSearchIfNeeded();
      render();
    });

    decreaseMaxResultsButton.addEventListener("click", () => {
      updateMaxResults(state.maxResults - 1);
    });

    increaseMaxResultsButton.addEventListener("click", () => {
      updateMaxResults(state.maxResults + 1);
    });

    providerBlockerNode.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action='enable-all']");
      if (!action) {
        return;
      }
      state.selectedProviders = [...ALL_PROVIDER_SITES];
      render();
    });

    resultsBodyNode.addEventListener("click", (event) => {
      const providerSearchButton = event.target.closest("[data-provider-search]");
      if (providerSearchButton) {
        const provider = String(providerSearchButton.getAttribute("data-provider-search") || "");
        openProviderSearch(provider);
        return;
      }
      const actionLink = event.target.closest("[data-row-action]");
      if (actionLink) {
        const rowKey = String(actionLink.getAttribute("data-row-key") || "");
        const mode = String(actionLink.getAttribute("data-row-action") || "");
        setActiveRow(rowKey);
        if (mode === "open" || mode === "search") {
          handleRowAction(rowKey, mode);
        }
        return;
      }
      const row = event.target.closest("[data-row-key]");
      if (!row) {
        return;
      }
      const rowKey = String(row.getAttribute("data-row-key") || "");
      setActiveRow(rowKey);
      handleRowAction(rowKey, "open");
    });

    for (const headerNode of Object.values(columnNodes)) {
      headerNode?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-sort-key]");
        if (!button) {
          return;
        }
        const sortKey = String(button.getAttribute("data-sort-key") || "");
        if (!sortKey) {
          return;
        }
        if (state.sortKey === sortKey) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortKey = sortKey;
          state.sortDir = defaultSortDirection(sortKey);
        }
        ensureActiveRow();
        render();
      });
    }

    window.addEventListener("keydown", (event) => {
      handleKeydown(event);
    });

    window.addEventListener("resize", () => {
      syncStickyOffsets();
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }
      if (Object.prototype.hasOwnProperty.call(changes, "rashnuLanguage")) {
        state.language = changes.rashnuLanguage.newValue === "en" ? "en" : "fa";
      }
      if (Object.prototype.hasOwnProperty.call(changes, "rashnuThemeMode")) {
        state.themeMode = ["system", "dark", "light"].includes(changes.rashnuThemeMode.newValue)
          ? changes.rashnuThemeMode.newValue
          : "system";
      }
      if (Object.prototype.hasOwnProperty.call(changes, "rashnuGlobalSearchAdvancedMode")) {
        state.advancedModeEnabled = Boolean(changes.rashnuGlobalSearchAdvancedMode.newValue);
        if (!state.advancedModeEnabled) {
          applySimpleModeDefaults();
        }
      }
      if (Object.prototype.hasOwnProperty.call(changes, "rashnuDivarLocation")) {
        const nextLocation = changes.rashnuDivarLocation.newValue;
        if (nextLocation && typeof nextLocation === "object") {
          state.divarLocation = {
            id: Number(nextLocation.id) || 1,
            slug: String(nextLocation.slug || "tehran"),
            name: String(nextLocation.name || "تهران")
          };
        }
        rerunSearchIfNeeded();
      }
      render();
    });
  }

  async function runSearch() {
    state.query = queryInput.value;
    const payload = buildSearchPayload();
    if (!payload.query) {
      renderStatus("statusNoQuery");
      queryInput.focus();
      return;
    }
    if (!state.selectedProviders.length) {
      render();
      return;
    }

    const requestId = state.activeSearchRequestId + 1;
    state.activeSearchRequestId = requestId;
    state.pendingSearchRerun = false;
    state.loading = true;
    state.response = null;
    state.activeRowKey = null;
    render();

    const requestSignature = buildSearchSignature(payload);
    let response = null;
    try {
      response = await chrome.runtime.sendMessage({
        type: "RASHNU_GLOBAL_SEARCH",
        payload
      });
    } catch (_error) {
      response = {
        ok: false,
        reason: "request_failed",
        query: payload.query,
        requestedProviders: [...state.selectedProviders],
        providers: {}
      };
    }

    if (requestId !== state.activeSearchRequestId) {
      return;
    }

    const currentSignature = buildSearchSignature(buildSearchPayload());
    if (state.pendingSearchRerun && currentSignature !== requestSignature) {
      state.loading = false;
      render();
      runSearch().catch(() => {});
      return;
    }

    state.response = response && typeof response === "object" ? response : null;
    ensureActiveRow();
    pendingActiveRowReveal = Boolean(state.response?.ok);
    state.loading = false;
    render();
  }

  function render() {
    const translation = t();
    const hasSearchState = state.loading || Boolean(state.response) || !state.selectedProviders.length;
    root.dataset.mode = hasSearchState ? "results" : "empty";
    root.dataset.advancedMode = state.advancedModeEnabled ? "advanced" : "simple";
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === "fa" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = getEffectiveTheme(state.themeMode);
    document.title = `Rashnu | ${translation.pageTitle}`;

    titleNode.textContent = translation.pageTitle;
    subtitleNode.textContent = translation.pageSubtitle;
    searchCardTitleNode.textContent = state.language === "fa" ? "عبارت جست‌وجو" : "Search Query";
    searchCardCaptionNode.textContent =
      state.language === "fa"
        ? state.advancedModeEnabled
          ? "عبارت اصلی را اینجا وارد کن و بعد فقط در صورت نیاز با فیلترها محدودش کن."
          : "عبارت اصلی را وارد کن و مستقیم جست‌وجو بزن. برای فیلترها حالت پیشرفته را روشن کن."
        : state.advancedModeEnabled
          ? "Start with the main phrase here, then narrow it only when needed."
          : "Enter the main phrase and search directly. Turn on Advanced Mode only when you need extra controls.";
    providerScopeNode.textContent = formatString(translation.providerScope, {
      count: String(state.selectedProviders.length)
    });
    shortcutHintNode.textContent = formatString(translation.shortcutHint, {
      maxProviderShortcut: String(Math.min(9, ALL_PROVIDER_SITES.length))
    });
    globalSettingsTitleNode.textContent = translation.globalSettingsTitle;
    if (globalSettingsCaptionNode) {
      globalSettingsCaptionNode.textContent = translation.globalSettingsCaption;
    }
    languageButton.textContent = "A";
    themeButton.textContent = themeIconFor(state.themeMode);
    globalSettingsBlock.classList.add("is-expanded");
    providerSettingsTitleNode.textContent = translation.providersTitle;
    if (providerSettingsCaptionNode) {
      providerSettingsCaptionNode.textContent = translation.providersCaption;
    }
    if (divarLocationLabelNode) {
      divarLocationLabelNode.textContent = translation.divarLocationLabel;
    }
    if (divarLocationHintNode) {
      divarLocationHintNode.textContent = translation.divarLocationHint;
    }
    providerSettingsBlock.classList.add("is-expanded");
    clearFiltersButton.textContent = translation.clearFilters;
    clearFiltersButton.disabled = !hasActiveFilters();
    setTitleAndAria(languageButton, translation.switchLanguageHint);
    setTitleAndAria(
      themeButton,
      `${translation.cycleThemeHint} (${translation[`theme_${state.themeMode}`] || translation.theme_system})`
    );
    advancedModeLabelNode.textContent = translation.advancedModeLabel;
    advancedModeToggleButton.setAttribute("aria-pressed", String(state.advancedModeEnabled));
    setTitleAndAria(
      advancedModeToggleButton,
      state.advancedModeEnabled ? translation.advancedModeEnabledHint : translation.advancedModeDisabledHint
    );
    queryInput.placeholder = translation.searchPlaceholder;
    queryInput.value = state.query;
    searchSubmitButton.textContent = translation.searchSubmit;
    openAllButton.textContent = translation.openAllSearches;
    openAllButton.disabled = !getProviderSearchEntries().some(({ result }) => Boolean(result?.searchUrl));
    groupingLabelNode.textContent = translation.groupByProviders;
    groupingToggleButton.setAttribute("aria-pressed", String(state.groupByProvider));
    dedupeLabelNode.textContent = translation.groupDuplicates;
    dedupeToggleButton.setAttribute("aria-pressed", String(state.dedupeEnabled));
    maxResultsLabelNode.textContent = translation.maxResults;
    maxResultsValueNode.textContent = localizeDynamicText(String(state.maxResults), state.language);
    decreaseMaxResultsButton.disabled = state.maxResults <= 1;
    increaseMaxResultsButton.disabled = state.maxResults >= 10;
    includeLabelNode.textContent = translation.includeTerms;
    includeHintNode.textContent = translation.includeHint;
    includeInput.placeholder = translation.chipInputPlaceholder;
    includeAddButton.textContent = translation.addChip;
    excludeLabelNode.textContent = translation.excludeTerms;
    excludeHintNode.textContent = translation.excludeHint;
    excludeInput.placeholder = translation.chipInputPlaceholder;
    excludeAddButton.textContent = translation.addChip;
    conditionLabelNode.textContent = translation.conditionLabel;
    conditionHintNode.textContent = translation.conditionHint;
    heroTitleNode.textContent = translation.heroTitle;
    heroBodyNode.textContent = translation.heroBody;
    renderGlobalSettingsSummary();
    renderProviderChips();
    renderDivarLocationSelector();
    renderProviderWarning();
    renderChipEditor("include");
    renderChipEditor("exclude");
    renderConditionOptions();
    renderQueryPreview();
    renderSuggestions();
    renderProviderBlocker();
    renderStatus();
    renderColumns();
    renderResults();
    syncStickyOffsets();
  }

  function syncStickyOffsets() {
    const topStackHeight = topStackNode instanceof HTMLElement ? topStackNode.offsetHeight : 0;
    root.style.setProperty("--top-stack-height", `${topStackHeight}px`);
  }

  function renderProviderChips() {
    const language = state.language;
    providerChipsNode.innerHTML = ALL_PROVIDER_SITES.map((provider) => {
      const active = state.selectedProviders.includes(provider);
      const label = siteLabelFor(provider, language);
      return `
        <button class="provider-chip ${active ? "is-active" : ""}" type="button" data-provider="${escapeHtml(provider)}" aria-pressed="${String(active)}">
          ${buildProviderIconMarkup(provider, label, "provider-icon--chip")}
          <span>${escapeHtml(label)}</span>
        </button>
      `;
    }).join("");
  }

  function renderProviderWarning() {
    const showWarning = state.selectedProviders.includes("amazon") || state.selectedProviders.includes("ebay");
    providerWarningNode.textContent = showWarning ? t().providerWarning : "";
    providerWarningNode.classList.toggle("is-visible", showWarning);
  }

  function renderGlobalSettingsSummary() {
    const translation = t();
    const languageValue = state.language === "fa" ? "FA" : "EN";
    globalSettingsSummaryNode.innerHTML = [
      state.advancedModeEnabled ? translation.summaryModeAdvanced : translation.summaryModeSimple,
      formatString(translation.summaryLanguage, { value: languageValue }),
      formatString(translation.summaryTheme, { value: translation[`theme_${state.themeMode}`] || translation.theme_system }),
      formatString(translation.summaryMaxResults, { value: String(state.maxResults) }),
      state.groupByProvider ? translation.summaryGroupingOn : translation.summaryGroupingOff,
      state.dedupeEnabled ? translation.summaryDedupeOn : translation.summaryDedupeOff
    ]
      .map((entry) => `<span class="settings-summary-pill">${escapeHtml(localizeDynamicText(entry, state.language))}</span>`)
      .join("");
  }

  function hasActiveFilters() {
    return state.includeTerms.length > 0 || state.excludeTerms.length > 0 || state.conditionFilter !== "any";
  }

  function renderChipEditor(group) {
    const terms = group === "include" ? state.includeTerms : state.excludeTerms;
    const targetNode = group === "include" ? includeChipListNode : excludeChipListNode;
    const translation = t();
    targetNode.innerHTML = terms.map((term, index) => `
      <span class="term-chip">
        <span>${escapeHtml(localizeDynamicText(term, state.language))}</span>
        <button type="button" data-chip-remove="${escapeHtml(group)}" data-chip-index="${String(index)}" aria-label="${escapeHtml(translation.removeChip)}">×</button>
      </span>
    `).join("");
  }

  function renderConditionOptions() {
    const translation = t();
    const conditions = ["any", "new_only", "used_only"];
    conditionOptionsNode.innerHTML = conditions.map((value) => `
      <button
        class="provider-chip ${state.conditionFilter === value ? "is-active" : ""}"
        type="button"
        data-condition="${escapeHtml(value)}"
        aria-pressed="${String(state.conditionFilter === value)}"
      >
        <span>${escapeHtml(translation[`condition_${value}`])}</span>
      </button>
    `).join("");
  }

  function renderQueryPreview() {
    if (!state.advancedModeEnabled) {
      queryPreviewNode.innerHTML = "";
      queryPreviewNode.classList.remove("is-visible");
      return;
    }
    const translation = t();
    const plan = buildLocalQueryPlan();
    if (!plan.baseQuery && !plan.includeTerms.length && !plan.excludeTerms.length && plan.conditionFilter === "any") {
      queryPreviewNode.innerHTML = "";
      queryPreviewNode.classList.remove("is-visible");
      return;
    }
    queryPreviewNode.classList.add("is-visible");
    const rows = [
      {
        label: translation.previewSearching,
        value: plan.baseQuery
      }
    ];
    if (plan.includeTerms.length) {
      rows.push({
        label: translation.previewInclude,
        value: plan.includeTerms.join(" · ")
      });
    }
    if (plan.excludeTerms.length) {
      rows.push({
        label: translation.previewExclude,
        value: plan.excludeTerms.join(" · ")
      });
    }
    if (plan.conditionFilter !== "any") {
      rows.push({
        label: translation.previewCondition,
        value: translation[`condition_${plan.conditionFilter}`]
      });
    }
    queryPreviewNode.innerHTML = `
      <div class="query-preview-head">${escapeHtml(translation.queryPreviewLabel)}</div>
      <div class="query-preview-rows">
        ${rows.map((row) => `
          <div class="query-preview-row">
            <span class="query-preview-label">${escapeHtml(row.label)}</span>
            <strong>${escapeHtml(localizeDynamicText(row.value, state.language))}</strong>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderSuggestions() {
    const translation = t();
    const hasQuery = Boolean(String(state.query || "").trim());
    const suggestions = Array.isArray(state.response?.suggestions) ? state.response.suggestions : [];
    const queryMatchesResponse = areQueriesEquivalent(state.response?.query, state.query);
    if (state.loading || !hasQuery || !queryMatchesResponse) {
      suggestionsNode.innerHTML = "";
      suggestionsNode.classList.remove("is-visible");
      return;
    }
    const hasSuccessfulSearch = Boolean(state.response?.ok);
    const includeSuggestions = suggestions.filter((suggestion) => suggestion?.type !== "exclude");
    const excludeSuggestions = suggestions.filter((suggestion) => suggestion?.type === "exclude");
    suggestionsNode.classList.add("is-visible");
    suggestionsNode.innerHTML = `
      <div class="suggestion-strip-head">${escapeHtml(translation.suggestionsTitle)}</div>
      ${hasSuccessfulSearch ? "" : `<div class="suggestion-strip-note">${escapeHtml(
        state.language === "fa"
          ? "بعد از یک جست‌وجوی موفق، پیشنهادهای افزودن و حذف اینجا نمایش داده می‌شوند."
          : "Include and exclude suggestions appear here after a successful search."
      )}</div>`}
      <div class="suggestion-groups">
        ${renderSuggestionGroup("include", includeSuggestions, translation, hasSuccessfulSearch)}
        ${renderSuggestionGroup("exclude", excludeSuggestions, translation, hasSuccessfulSearch)}
      </div>
    `;
  }

  function renderSuggestionGroup(mode, suggestions, translation, hasSuccessfulSearch) {
    const actionLabel = translation[`suggestion_${mode}`] || translation.addChip;
    const label = mode === "exclude" ? translation.excludeTerms : translation.includeTerms;
    const emptyText =
      !hasSuccessfulSearch
        ? state.language === "fa"
          ? "بعد از دریافت نتیجه، پیشنهادها همین‌جا ظاهر می‌شوند."
          : "Suggestions will show up here after results are returned."
        : state.language === "fa"
          ? mode === "exclude"
            ? "فعلاً پیشنهاد حذفی پیدا نشد."
            : "فعلاً پیشنهاد افزودنی پیدا نشد."
          : mode === "exclude"
            ? "No exclude suggestions yet."
            : "No include suggestions yet.";
    return `
      <section class="suggestion-group suggestion-group--${escapeHtml(mode)}">
        <div class="suggestion-group-head">
          <span class="suggestion-group-pill suggestion-group-pill--${escapeHtml(mode)}">${escapeHtml(actionLabel)}</span>
          <strong>${escapeHtml(label)}</strong>
        </div>
        <div class="suggestion-chip-list">
          ${Array.isArray(suggestions) && suggestions.length ? suggestions.map((suggestion) => {
            const reason = translation[`suggestionReason_${suggestion?.reason}`] || "";
            return `
              <button
                class="suggestion-chip suggestion-chip--${escapeHtml(mode)}"
                type="button"
                data-suggestion-type="${escapeHtml(mode)}"
                data-suggestion-label="${escapeHtml(suggestion?.label || "")}"
                title="${escapeHtml(reason)}"
              >
                <span class="suggestion-chip-mode">${escapeHtml(actionLabel)}</span>
                <span>${escapeHtml(localizeDynamicText(String(suggestion?.label || ""), state.language))}</span>
              </button>
            `;
          }).join("") : `<span class="suggestion-empty">${escapeHtml(emptyText)}</span>`}
        </div>
      </section>
    `;
  }

  function buildLocalQueryPlan() {
    return {
      baseQuery: String(state.query || "").trim(),
      includeTerms: state.includeTerms,
      excludeTerms: state.excludeTerms,
      conditionFilter: state.conditionFilter
    };
  }

  function handleChipInputKeydown(event, group) {
    if (event.key !== "Enter" && event.key !== "," && event.key !== "،") {
      return;
    }
    event.preventDefault();
    commitChipInput(group);
  }

  function commitChipInput(group) {
    const input = group === "include" ? includeInput : excludeInput;
    const value = normalizeChipInputValue(input.value);
    if (!value) {
      input.value = "";
      return;
    }
    input.value = "";
    addChip(group, value);
  }

  function addChip(group, rawValue) {
    const value = normalizeChipInputValue(rawValue);
    if (!value) {
      return;
    }
    const key = group === "include" ? "includeTerms" : "excludeTerms";
    if (state[key].some((entry) => compareChipTerms(entry, value))) {
      render();
      return;
    }
    state[key] = [...state[key], value];
    rerunSearchIfNeeded();
    render();
  }

  function removeChip(group, index) {
    const key = group === "include" ? "includeTerms" : "excludeTerms";
    if (!Number.isFinite(index) || index < 0 || index >= state[key].length) {
      return;
    }
    state[key] = state[key].filter((_term, termIndex) => termIndex !== index);
    rerunSearchIfNeeded();
    render();
  }

  function applySuggestion(group, value) {
    if (group !== "exclude" && group !== "include") {
      return;
    }
    addChip(group, value);
  }

  function rerunSearchIfNeeded() {
    if (!String(state.query || "").trim()) {
      return;
    }
    if (state.loading) {
      state.pendingSearchRerun = true;
      return;
    }
    if (!state.response?.ok) {
      return;
    }
    runSearch().catch(() => {});
  }

  function clearAllFilters() {
    if (!hasActiveFilters()) {
      render();
      return;
    }
    state.includeTerms = [];
    state.excludeTerms = [];
    state.conditionFilter = "any";
    rerunSearchIfNeeded();
    render();
  }

  function applySimpleModeDefaults() {
    const previousSignature = buildSearchSignature(buildSearchPayload());
    const previousGroupByProvider = state.groupByProvider;
    state.includeTerms = [];
    state.excludeTerms = [];
    state.conditionFilter = "any";
    state.groupByProvider = true;
    state.dedupeEnabled = false;
    state.maxResults = 3;
    ensureActiveRow();
    return {
      searchPayloadChanged: previousSignature !== buildSearchSignature(buildSearchPayload()),
      tableChanged: previousGroupByProvider !== state.groupByProvider
    };
  }

  async function setAdvancedMode(enabled) {
    const nextValue = Boolean(enabled);
    if (state.advancedModeEnabled === nextValue) {
      render();
      return;
    }
    state.advancedModeEnabled = nextValue;
    let shouldRenderImmediately = true;
    if (!nextValue) {
      const { searchPayloadChanged, tableChanged } = applySimpleModeDefaults();
      if (searchPayloadChanged) {
        if (state.loading) {
          shouldRenderImmediately = true;
          state.pendingSearchRerun = true;
        } else if (state.response?.ok && String(state.query || "").trim()) {
          shouldRenderImmediately = false;
          runSearch().catch(() => {});
        } else {
          shouldRenderImmediately = true;
        }
      } else if (tableChanged) {
        ensureActiveRow();
      }
    }
    if (shouldRenderImmediately) {
      render();
    }
    await chrome.storage.local.set({
      rashnuGlobalSearchAdvancedMode: state.advancedModeEnabled
    });
  }

  function renderProviderBlocker() {
    const translation = t();
    if (state.selectedProviders.length) {
      providerBlockerNode.classList.remove("is-visible");
      providerBlockerNode.innerHTML = "";
      return;
    }
    providerBlockerNode.classList.add("is-visible");
    providerBlockerNode.innerHTML = `
      <div>
        <strong>${escapeHtml(translation.noProvidersTitle)}</strong>
        <div>${escapeHtml(translation.noProvidersBody)}</div>
      </div>
      <button class="primary-button" type="button" data-action="enable-all">${escapeHtml(translation.enableAllProviders)}</button>
    `;
  }

  function renderStatus(key) {
    const translation = t();
    if (key) {
      statusBarNode.innerHTML = `<strong>${escapeHtml(translation[key] || translation.statusIdle)}</strong>`;
      return;
    }
    if (!state.selectedProviders.length) {
      statusBarNode.innerHTML = `<strong>${escapeHtml(translation.statusNoProviders)}</strong>`;
      return;
    }
    if (state.loading) {
      statusBarNode.innerHTML = buildLoadingInlineMarkup(translation.loading);
      return;
    }
    if (state.response?.ok) {
      statusBarNode.innerHTML = `<strong>${escapeHtml(formatString(translation.statusReady, { query: state.response.query || state.query }))}</strong>`;
      return;
    }
    statusBarNode.innerHTML = `<strong>${escapeHtml(translation.statusIdle)}</strong>`;
  }

  function renderColumns() {
    const translation = t();
    renderSortableHeader(columnNodes.provider, "provider", translation.colProvider);
    renderSortableHeader(columnNodes.rank, "rank", translation.colRank);
    renderSortableHeader(columnNodes.title, "title", translation.colTitle);
    renderSortableHeader(columnNodes.price, "price", translation.colPrice);
    renderSortableHeader(columnNodes.original, "original", translation.colOriginal);
    renderSortableHeader(columnNodes.discount, "discount", translation.colDiscount);
    renderSortableHeader(columnNodes.confidence, "confidence", translation.colConfidence);
    columnNodes.actions.textContent = translation.colActions;
  }

  function renderResults() {
    const translation = t();
    const providerEntries = getProviderSearchEntries();

    if (state.loading && !state.response) {
      resultsBodyNode.innerHTML = `
        <tr class="empty-row">
          <td colspan="8">${buildLoadingInlineMarkup(translation.loadingRows, { centered: true })}</td>
        </tr>
      `;
      return;
    }

    if (!providerEntries.length) {
      resultsBodyNode.innerHTML = `
        <tr class="empty-row">
          <td colspan="8">${escapeHtml(translation.noResultsOverall)}</td>
        </tr>
      `;
      return;
    }

    if (!state.groupByProvider) {
      const flatRows = sortRows(
        providerEntries.flatMap(({ provider, result }) =>
          (Array.isArray(result.results) ? result.results : []).map((row) => ({
            provider,
            row,
            status: result.status
          }))
        )
      );
      resultsBodyNode.innerHTML = flatRows.length
        ? flatRows.map(({ provider, row }) => buildResultRowMarkup(provider, row)).join("")
        : `
          <tr class="empty-row">
            <td colspan="8">${escapeHtml(translation.noResultsOverall)}</td>
          </tr>
        `;
    } else {
      resultsBodyNode.innerHTML = providerEntries.map(({ provider, result }) => {
        const statusLabel = translation[`status_${result.status}`] || result.status || translation.status_not_found;
        const reasonText = translation[`reason_${result.reason}`] || translation.reason_default;
        const rows = sortRows(
          (Array.isArray(result.results) ? result.results : []).map((row) => ({
            provider,
            row,
            status: result.status
          }))
        );
        const rowsMarkup = rows.length
          ? rows.map(({ row: providerRow }) => buildResultRowMarkup(provider, providerRow)).join("")
          : `
            <tr class="provider-empty-row">
              <td colspan="8">
                <div class="provider-empty-card provider-empty-card--${escapeHtml(result.status || "not_found")}">
                  <div class="provider-empty-copy">
                    <strong>${escapeHtml(providerEmptyTitle(result.status, translation))}</strong>
                    <span>${escapeHtml(providerEmptyBody(result.status, translation))}</span>
                  </div>
                  <button class="row-action row-action--primary" type="button" data-provider-search="${escapeHtml(provider)}">
                    ${escapeHtml(translation.search)}
                  </button>
                </div>
              </td>
            </tr>
          `;
        return `
          <tr class="provider-group-row">
            <td colspan="8">
              <div class="provider-group">
                <div class="provider-group-label">
                  ${buildProviderIconMarkup(provider, siteLabelFor(provider, state.language), "provider-icon--group")}
                  <span>${escapeHtml(siteLabelFor(provider, state.language))}</span>
                  <span class="provider-status is-${escapeHtml(result.status || "not_found")}">${escapeHtml(statusLabel)}</span>
                </div>
                <div class="provider-reason">
                  ${escapeHtml(reasonText)}${rows.length ? ` · ${escapeHtml(formatString(translation.providerCount, { count: String(rows.length) }))}` : ""}
                </div>
              </div>
            </td>
          </tr>
          ${rowsMarkup}
        `;
      }).join("");
    }

    const activeRow = resultsBodyNode.querySelector(`[data-row-key="${cssEscape(state.activeRowKey || "")}"]`);
    if (activeRow && pendingActiveRowReveal) {
      activeRow.scrollIntoView({
        block: "nearest",
        inline: "nearest"
      });
    }
    pendingActiveRowReveal = false;
    hydrateResultThumbnails();
  }

  function buildResultRowMarkup(provider, row) {
    const translation = t();
    const rowKey = buildRowKey(provider, row.rank);
    const active = rowKey === state.activeRowKey;
    const localizedPrice = formatPriceCell(row.priceText, row.priceValue);
    const localizedOriginal = formatPriceCell(row.originalPriceText, row.originalPriceValue, { fallback: "—" });
    const localizedDiscount = localizeDynamicText(row.discountPercent || "—", state.language);
    const duplicateMeta = Number(row.duplicateCount || 0) > 1
      ? `<span class="result-meta-pill">${escapeHtml(formatString(translation.duplicateGroup, { count: String(row.duplicateCount) }))}</span>`
      : "";
    const thumbnailMarkup = row.imageUrl
      ? `<div class="result-thumb"><img src="${escapeHtml(row.imageUrl)}" alt="" data-row-thumb loading="lazy" referrerpolicy="no-referrer"></div>`
      : `<div class="result-thumb is-broken" aria-hidden="true"></div>`;
    return `
      <tr class="result-row ${active ? "is-active" : ""}" data-row-key="${escapeHtml(rowKey)}" title="${active ? escapeHtml(translation.activeRowHint) : ""}">
        <td class="col-provider-cell">
          <div class="provider-cell-label">
            ${buildProviderIconMarkup(provider, siteLabelFor(provider, state.language), "provider-icon--cell")}
            <span>${escapeHtml(siteLabelFor(provider, state.language))}</span>
          </div>
        </td>
        <td class="col-rank-cell"><span class="rank-pill">${escapeHtml(formatString(translation.rankPrefix, { rank: String(row.rank || 0) }))}</span></td>
        <td>
          <div class="result-title-cell">
            ${thumbnailMarkup}
            <div class="title-stack">
              <strong>${escapeHtml(localizeDynamicText(row.title || translation.unknown, state.language))}</strong>
              ${duplicateMeta ? `<div class="title-meta-row">${duplicateMeta}</div>` : ""}
            </div>
          </div>
        </td>
        <td class="col-price-cell price-value-cell">${escapeHtml(localizedPrice)}</td>
        <td class="col-original-cell price-value-cell">${escapeHtml(localizedOriginal)}</td>
        <td class="col-discount-cell discount-value-cell">${escapeHtml(localizedDiscount)}</td>
        <td class="col-confidence-cell"><span class="confidence-pill ${escapeHtml(confidenceTone(row.confidence))}">${escapeHtml(formatConfidence(row.confidence))}</span></td>
        <td class="col-actions-cell">
          <div class="table-actions">
            <button class="row-action row-action--primary" type="button" data-row-action="open" data-row-key="${escapeHtml(rowKey)}">${escapeHtml(translation.open)}</button>
            <button class="row-action" type="button" data-row-action="search" data-row-key="${escapeHtml(rowKey)}">${escapeHtml(translation.search)}</button>
          </div>
        </td>
      </tr>
    `;
  }

  function getProviderSearchEntries() {
    const providers = state.response?.providers && typeof state.response.providers === "object" ? state.response.providers : {};
    return state.selectedProviders
      .map((provider) => [provider, providers[provider] || fallbackProviderResult(provider)])
      .map(([provider, result]) => ({ provider, result }));
  }

  function renderSortableHeader(node, sortKey, label) {
    const isActive = state.sortKey === sortKey;
    const direction = isActive ? state.sortDir : "";
    const icon = !isActive ? "↕" : direction === "asc" ? "↑" : "↓";
    node.innerHTML = `
      <button type="button" data-sort-key="${escapeHtml(sortKey)}" aria-pressed="${String(isActive)}" title="${escapeHtml(label)}">
        <span>${escapeHtml(label)}</span>
        <span class="sort-indicator" aria-hidden="true">${escapeHtml(icon)}</span>
      </button>
    `;
  }

  function sortRows(entries) {
    const directionFactor = state.sortDir === "asc" ? 1 : -1;
    return [...entries].sort((leftEntry, rightEntry) => {
      const left = leftEntry.row || {};
      const right = rightEntry.row || {};
      let comparison = 0;

      if (state.sortKey === "provider") {
        comparison = siteLabelFor(leftEntry.provider, "en").localeCompare(siteLabelFor(rightEntry.provider, "en"));
      } else if (state.sortKey === "title") {
        comparison = String(left.title || "").localeCompare(String(right.title || ""), undefined, {
          sensitivity: "base",
          numeric: true
        });
      } else if (state.sortKey === "price") {
        comparison = comparePriceValuesForSort(left.priceValue, left.priceText, right.priceValue, right.priceText, directionFactor);
      } else if (state.sortKey === "original") {
        comparison = comparePriceValuesForSort(
          left.originalPriceValue,
          left.originalPriceText,
          right.originalPriceValue,
          right.originalPriceText,
          directionFactor
        );
      } else if (state.sortKey === "discount") {
        comparison = compareNullableNumbersForSort(
          parsePercentValue(left.discountPercent),
          parsePercentValue(right.discountPercent),
          directionFactor
        );
      } else if (state.sortKey === "confidence") {
        comparison = compareNullableNumbersForSort(left.confidence, right.confidence, directionFactor);
      } else {
        comparison = compareNullableNumbersForSort(left.rank, right.rank, directionFactor);
      }

      if (comparison !== 0) {
        return comparison;
      }

      if (leftEntry.provider !== rightEntry.provider) {
        return state.selectedProviders.indexOf(leftEntry.provider) - state.selectedProviders.indexOf(rightEntry.provider);
      }

      return compareNullableNumbersForSort(left.rank, right.rank, 1);
    });
  }

  function fallbackProviderResult(provider) {
    return {
      provider,
      status: state.loading ? "low_confidence" : "not_found",
      reason: state.loading ? "results_available" : "no_results",
      searchUrl: "",
      results: []
    };
  }

  function ensureActiveRow() {
    const rows = getAllRows();
    if (!rows.length) {
      state.activeRowKey = null;
      return;
    }
    if (rows.some((row) => row.key === state.activeRowKey)) {
      return;
    }
    state.activeRowKey = rows[0].key;
  }

  function getAllRows() {
    const rows = getProviderSearchEntries().flatMap(({ provider, result }) =>
      (Array.isArray(result.results) ? result.results : []).map((row) => ({
        key: buildRowKey(provider, row.rank),
        provider,
        row,
        result
      }))
    );
    if (!state.groupByProvider) {
      return sortRows(rows);
    }
    const grouped = [];
    for (const provider of state.selectedProviders) {
      const providerRows = rows.filter((entry) => entry.provider === provider);
      grouped.push(...sortRows(providerRows));
    }
    return grouped;
  }

  function setActiveRow(rowKey) {
    state.activeRowKey = rowKey;
    pendingActiveRowReveal = true;
    renderResults();
  }

  function updateMaxResults(nextValue) {
    const clamped = clampMaxResults(nextValue);
    if (clamped === state.maxResults) {
      render();
      return;
    }
    state.maxResults = clamped;
    if (String(state.query || "").trim() && (state.response?.ok || state.loading)) {
      if (state.loading) {
        state.pendingSearchRerun = true;
        render();
        return;
      }
      runSearch().catch(() => {});
      return;
    }
    render();
  }

  function hydrateInitialQueryFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const query = String(params.get("q") || "").trim();
    if (!query) {
      return;
    }
    state.query = query;
  }

  function shouldAutorunFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("autorun") === "1" && Boolean(String(state.query || "").trim());
  }

  function buildSearchPayload() {
    return {
      query: String(state.query || "").trim(),
      includeTerms: [...state.includeTerms],
      excludeTerms: [...state.excludeTerms],
      conditionFilter: state.conditionFilter,
      dedupeEnabled: state.dedupeEnabled,
      providers: [...state.selectedProviders],
      maxResults: state.maxResults
    };
  }

  function buildSearchSignature(payload) {
    return JSON.stringify({
      query: String(payload?.query || ""),
      includeTerms: Array.isArray(payload?.includeTerms) ? payload.includeTerms : [],
      excludeTerms: Array.isArray(payload?.excludeTerms) ? payload.excludeTerms : [],
      conditionFilter: String(payload?.conditionFilter || "any"),
      dedupeEnabled: Boolean(payload?.dedupeEnabled),
      providers: Array.isArray(payload?.providers) ? payload.providers : [],
      maxResults: clampMaxResults(payload?.maxResults)
    });
  }

  async function notifyGlobalSearchTabOpened() {
    try {
      await chrome.runtime.sendMessage({
        type: "RASHNU_GLOBAL_SEARCH_TAB_OPENED"
      });
    } catch (_error) {}
  }

  async function cycleLanguage() {
    const nextLanguage = state.language === "fa" ? "en" : "fa";
    await chrome.runtime.sendMessage({
      type: "RASHNU_SET_LANGUAGE",
      payload: { language: nextLanguage }
    });
  }

  async function cycleThemeMode() {
    const order = ["system", "dark", "light"];
    const current = order.includes(state.themeMode) ? state.themeMode : "system";
    const next = order[(order.indexOf(current) + 1) % order.length];
    await chrome.runtime.sendMessage({
      type: "RASHNU_SET_THEME_MODE",
      payload: { themeMode: next }
    });
  }

  function hydrateResultThumbnails() {
    resultsBodyNode.querySelectorAll("[data-row-thumb]").forEach((image) => {
      if (!(image instanceof HTMLImageElement) || image.dataset.bound === "true") {
        return;
      }
      image.dataset.bound = "true";
      const container = image.closest(".result-thumb");
      const markLoaded = () => {
        container?.classList.remove("is-broken");
      };
      const markBroken = () => {
        container?.classList.add("is-broken");
      };
      if (image.complete) {
        if (image.naturalWidth > 0) {
          markLoaded();
        } else {
          markBroken();
        }
      }
      image.addEventListener("load", markLoaded, { once: true });
      image.addEventListener("error", markBroken, { once: true });
    });
  }

  function moveSelection(delta) {
    const rows = getAllRows();
    if (!rows.length) {
      return;
    }
    const currentIndex = rows.findIndex((row) => row.key === state.activeRowKey);
    const nextIndex = currentIndex === -1 ? 0 : Math.max(0, Math.min(rows.length - 1, currentIndex + delta));
    state.activeRowKey = rows[nextIndex].key;
    renderResults();
  }

  function handleRowAction(rowKey, mode) {
    const target = getAllRows().find((row) => row.key === rowKey);
    if (!target) {
      return;
    }
    const url = mode === "search" ? target.row.searchUrl : (target.row.targetUrl || target.row.searchUrl);
    if (!url) {
      return;
    }
    chrome.tabs.create({
      url
    });
  }

  function openAllProviderSearches() {
    for (const { result } of getProviderSearchEntries()) {
      if (!result?.searchUrl) {
        continue;
      }
      chrome.tabs.create({
        url: result.searchUrl
      });
    }
  }

  function openProviderSearch(provider) {
    const providerEntry = getProviderSearchEntries().find((entry) => entry.provider === provider);
    const searchUrl = providerEntry?.result?.searchUrl || buildProviderSearchUrl(provider);
    if (!searchUrl) {
      return;
    }
    chrome.tabs.create({
      url: searchUrl
    });
  }

  function handleKeydown(event) {
    const isTyping = isTypingTarget();
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      queryInput.focus();
      queryInput.select();
      return;
    }

    if (event.key === "Escape") {
      state.activeRowKey = null;
      renderResults();
      if (String(state.query || "").trim()) {
        queryInput.focus();
        queryInput.select();
      }
      return;
    }

    if (isTyping) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      runSearch().catch(() => {});
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(-1);
      return;
    }

    if (event.key.toLowerCase() === "o") {
      event.preventDefault();
      handleRowAction(state.activeRowKey, "open");
      return;
    }

    if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      handleRowAction(state.activeRowKey, "search");
      return;
    }

    if (/^[1-9]$/.test(event.key)) {
      const index = Number.parseInt(event.key, 10) - 1;
      if (index >= ALL_PROVIDER_SITES.length) {
        return;
      }
      const provider = state.selectedProviders[index];
      if (!provider) {
        return;
      }
      const targetRow = getAllRows().find((row) => row.provider === provider);
      if (targetRow) {
        event.preventDefault();
        setActiveRow(targetRow.key);
      }
    }
  }

  function getEnabledProvidersFromFlags(flags) {
    const map = flags && typeof flags === "object" ? flags : {};
    return ALL_PROVIDER_SITES.filter((provider) => map[provider] !== false);
  }

  function siteLabelFor(provider, language) {
    return globalThis.RashnuNormalize.getSiteLabel(provider, language);
  }

  function siteIconFor(provider) {
    const iconPath = globalThis.RashnuNormalize.getProviderIconPath(provider);
    return iconPath ? extensionAssetUrl(iconPath) : "";
  }

  function buildProviderIconMarkup(provider, label, sizeClass) {
    const iconUrl = siteIconFor(provider);
    const iconClassName = `provider-icon ${sizeClass || ""}`.trim();
    if (iconUrl) {
      return `
        <span class="${escapeHtml(iconClassName)}" aria-hidden="true">
          <img src="${escapeHtml(iconUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">
        </span>
      `;
    }
    return `
      <span class="${escapeHtml(iconClassName)} provider-icon--fallback" aria-hidden="true">
        ${escapeHtml(String(label || provider || "?").slice(0, 1).toUpperCase())}
      </span>
    `;
  }

  function buildLoadingInlineMarkup(label, options = {}) {
    return `
      <span class="loading-inline ${options.centered ? "loading-inline--center" : ""}">
        <span class="loading-spinner" aria-hidden="true"></span>
        <span>${escapeHtml(label)}</span>
      </span>
    `;
  }

  function areQueriesEquivalent(left, right) {
    return normalizeQueryForUiComparison(left) === normalizeQueryForUiComparison(right);
  }

  function normalizeQueryForUiComparison(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }
    const normalized =
      globalThis.RashnuNormalize.buildSearchQuery(raw) ||
      globalThis.RashnuNormalize.cleanProductTitle(raw) ||
      raw;
    return globalThis.RashnuNormalize.normalizeWhitespace(normalized);
  }

  function buildProviderSearchUrl(provider) {
    const query = String(state.query || "").trim();
    if (!query) {
      return "";
    }
    if (provider === "digikala") {
      return globalThis.RashnuNormalize.buildDigikalaSearchUrl(query);
    }
    if (provider === "technolife") {
      return globalThis.RashnuNormalize.buildTechnolifeSearchUrl(query);
    }
    if (provider === "emalls") {
      return globalThis.RashnuNormalize.buildEmallsSearchUrl(query);
    }
    if (provider === "divar") {
      return globalThis.RashnuNormalize.buildDivarSearchUrl(query, state.divarLocation?.slug || "tehran");
    }
    if (provider === "amazon") {
      return globalThis.RashnuNormalize.buildAmazonSearchUrl(query);
    }
    if (provider === "ebay") {
      return globalThis.RashnuNormalize.buildEbaySearchUrl(query);
    }
    return globalThis.RashnuNormalize.buildTorobSearchUrl(query);
  }

  function formatPriceCell(priceText, priceValue, options = {}) {
    const fallback = options.fallback || t().unknown;
    const raw = String(priceText || "").trim();
    const numeric = Number(priceValue);
    const hasUsdLike = /[$€£]|usd|eur|gbp/i.test(raw);
    const startsFrom = /^(از|from)\b/i.test(raw);
    if (hasUsdLike) {
      return localizeDynamicText(raw, state.language);
    }
    if (Number.isFinite(numeric) && numeric > 0) {
      const formattedValue = localizeNumericValue(numeric);
      const prefix = startsFrom ? (state.language === "fa" ? "از " : "From ") : "";
      return `${prefix}${formattedValue} T`;
    }
    if (!raw) {
      return fallback;
    }
    const normalized = raw
      .replace(/\s*تومان/gu, " T")
      .replace(/\s*toman/gi, " T")
      .replace(/\s+/g, " ")
      .trim();
    return localizeDynamicText(normalized || fallback, state.language);
  }

  function formatConfidence(value) {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return "0%";
    }
    return `${Math.round(numeric * 100)}%`;
  }

  function confidenceTone(value) {
    const numeric = Number(value || 0);
    if (numeric >= 0.72) {
      return "is-high";
    }
    if (numeric >= 0.45) {
      return "is-medium";
    }
    return "is-low";
  }

  function buildRowKey(provider, rank) {
    return `${provider}:${rank}`;
  }

  function renderDivarLocationSelector() {
    if (!divarLocationSelect) {
      return;
    }
    const translation = t();
    const options = Array.isArray(state.divarLocationOptions) ? state.divarLocationOptions : [];
    const selectedId = String(state.divarLocation?.id || "");
    const showDivarLocation = state.selectedProviders.includes("divar");
    if (divarLocationField instanceof HTMLElement) {
      if (!showDivarLocation) {
        divarLocationField.remove();
        divarLocationField.hidden = true;
        divarLocationField.style.display = "none";
        divarLocationField.setAttribute("aria-hidden", "true");
        divarLocationField.classList.remove("provider-select-field--inline");
      } else {
        divarLocationField.hidden = false;
        divarLocationField.style.display = "";
        divarLocationField.setAttribute("aria-hidden", "false");
        divarLocationField.classList.add("provider-select-field--inline");
        const divarChip = providerChipsNode.querySelector('[data-provider="divar"]');
        if (divarChip?.parentNode === providerChipsNode) {
          divarChip.insertAdjacentElement("afterend", divarLocationField);
        } else if (providerChipsNode) {
          providerChipsNode.appendChild(divarLocationField);
        }
      }
    }
    divarLocationSelect.disabled = options.length <= 1;
    divarLocationSelect.innerHTML = options.length
      ? options.map((option) => `
          <option value="${escapeHtml(String(option.id))}" ${String(option.id) === selectedId ? "selected" : ""}>
            ${escapeHtml(option.name || translation.divarLocationLoading)}
          </option>
        `).join("")
      : `<option value="">${escapeHtml(translation.divarLocationLoading)}</option>`;
  }

  function getSelectedDivarLocation(idValue) {
    const targetId = Number.parseInt(idValue, 10);
    if (!Number.isFinite(targetId)) {
      return null;
    }
    return state.divarLocationOptions.find((option) => Number(option?.id) === targetId) || null;
  }

  function localizeDynamicText(value, language) {
    const raw = String(value || "");
    if (!raw) {
      return "";
    }
    if (language !== "fa") {
      return raw;
    }
    return raw.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
  }

  function localizeNumericValue(value) {
    const formatted = new Intl.NumberFormat(state.language === "fa" ? "fa-IR" : "en-US").format(Number(value || 0));
    return formatted;
  }

  function parsePercentValue(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return null;
    }
    const digits = raw.replace(/[^\d]/g, "");
    if (!digits) {
      return null;
    }
    return Number.parseInt(digits, 10);
  }

  function compareNullableNumbers(left, right) {
    const leftNumber = toSortableNumber(left);
    const rightNumber = toSortableNumber(right);
    const leftValid = leftNumber !== null;
    const rightValid = rightNumber !== null;
    if (!leftValid && !rightValid) {
      return 0;
    }
    if (!leftValid) {
      return 1;
    }
    if (!rightValid) {
      return -1;
    }
    return leftNumber - rightNumber;
  }

  function compareNullableNumbersForSort(left, right, directionFactor) {
    const leftNumber = toSortableNumber(left);
    const rightNumber = toSortableNumber(right);
    const leftValid = leftNumber !== null;
    const rightValid = rightNumber !== null;
    if (!leftValid && !rightValid) {
      return 0;
    }
    if (!leftValid) {
      return 1;
    }
    if (!rightValid) {
      return -1;
    }
    return (leftNumber - rightNumber) * directionFactor;
  }

  function comparePriceValuesForSort(leftValue, leftText, rightValue, rightText, directionFactor) {
    const leftNumber = toSortablePriceNumber(leftValue, leftText);
    const rightNumber = toSortablePriceNumber(rightValue, rightText);
    const leftValid = leftNumber !== null;
    const rightValid = rightNumber !== null;
    if (!leftValid && !rightValid) {
      return 0;
    }
    if (!leftValid) {
      return 1;
    }
    if (!rightValid) {
      return -1;
    }
    return (leftNumber - rightNumber) * directionFactor;
  }

  function toSortableNumber(value) {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === "string" && !value.trim()) {
      return null;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return null;
    }
    return numeric;
  }

  function toSortablePriceNumber(value, text) {
    const numeric = toSortableNumber(value);
    if (numeric === null || numeric <= 0) {
      return null;
    }
    const rawText = String(text || "").trim();
    if (rawText && !/\d/.test(rawText) && /نامشخص|unknown|contact|call|توافقی|معاوضه|بدون قیمت/iu.test(rawText)) {
      return null;
    }
    return numeric;
  }

  function defaultSortDirection(sortKey) {
    return sortKey === "price" || sortKey === "original" || sortKey === "discount" || sortKey === "confidence"
      ? "desc"
      : "asc";
  }

  function clampMaxResults(value) {
    const numeric = Number.parseInt(value, 10);
    if (!Number.isFinite(numeric)) {
      return 3;
    }
    return Math.max(1, Math.min(10, numeric));
  }

  function normalizeChipInputValue(value) {
    return globalThis.RashnuNormalize.normalizeWhitespace(
      globalThis.RashnuNormalize.cleanProductTitle(String(value || "").replace(/[،,]+$/g, "")) || value
    );
  }

  function compareChipTerms(left, right) {
    return globalThis.RashnuNormalize.normalizeText(left) === globalThis.RashnuNormalize.normalizeText(right);
  }

  function formatString(template, replacements) {
    return String(template || "").replace(/\{(\w+)\}/g, (_match, key) => replacements?.[key] ?? "");
  }

  function t() {
    return TRANSLATIONS[state.language] || TRANSLATIONS.fa;
  }

  function setTitleAndAria(node, value) {
    if (!node) {
      return;
    }
    node.setAttribute("title", value);
    node.setAttribute("aria-label", value);
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

  function extensionAssetUrl(path) {
    try {
      return chrome.runtime.getURL(path);
    } catch (_error) {
      return path;
    }
  }

  function getEffectiveTheme(mode) {
    if (mode === "dark" || mode === "light") {
      return mode;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function isTypingTarget() {
    const active = document.activeElement;
    return Boolean(
      active &&
      (active === queryInput ||
        active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.tagName === "SELECT" ||
        active.isContentEditable)
    );
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
    if (window.CSS?.escape) {
      return window.CSS.escape(String(value || ""));
    }
    return String(value || "").replace(/["\\]/g, "\\$&");
  }

  function providerEmptyTitle(status, translation) {
    if (status === "error") {
      return translation.status_error;
    }
    if (status === "low_confidence") {
      return translation.status_low_confidence;
    }
    return translation.status_not_found;
  }

  function providerEmptyBody(status, translation) {
    if (status === "error") {
      return translation.providerEmpty_error;
    }
    if (status === "low_confidence") {
      return translation.providerEmpty_low_confidence;
    }
    return translation.providerEmpty_not_found;
  }
})();
