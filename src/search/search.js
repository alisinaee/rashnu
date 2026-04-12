(function () {
  "use strict";

  const ALL_PROVIDER_SITES = ["torob", "digikala", "technolife", "emalls", "amazon", "ebay"];
  const STORAGE_KEYS = [
    "rashnuLanguage",
    "rashnuThemeMode",
    "rashnuProviderSearchEnabled"
  ];
  const root = document.querySelector(".search-page");
  const topStackNode = document.querySelector("[data-role='top-stack']");
  const titleNode = document.querySelector("[data-role='page-title']");
  const subtitleNode = document.querySelector("[data-role='page-subtitle']");
  const providerScopeNode = document.querySelector("[data-role='provider-scope']");
  const shortcutHintNode = document.querySelector("[data-role='shortcut-hint']");
  const searchForm = document.querySelector("[data-role='search-form']");
  const queryInput = document.querySelector("[data-role='query-input']");
  const searchSubmitButton = document.querySelector("[data-role='search-submit']");
  const providerChipsNode = document.querySelector("[data-role='provider-chips']");
  const searchAllButton = document.querySelector("[data-action='run-search']");
  const openAllButton = document.querySelector("[data-action='open-all-searches']");
  const groupingToggleButton = document.querySelector("[data-action='toggle-grouping']");
  const groupingLabelNode = document.querySelector("[data-role='grouping-label']");
  const maxResultsLabelNode = document.querySelector("[data-role='max-results-label']");
  const maxResultsValueNode = document.querySelector("[data-role='max-results-value']");
  const providerWarningNode = document.querySelector("[data-role='provider-warning']");
  const decreaseMaxResultsButton = document.querySelector("[data-action='decrease-max-results']");
  const increaseMaxResultsButton = document.querySelector("[data-action='increase-max-results']");
  const heroTitleNode = document.querySelector("[data-role='hero-title']");
  const heroBodyNode = document.querySelector("[data-role='hero-body']");
  const providerBlockerNode = document.querySelector("[data-role='provider-blocker']");
  const statusBarNode = document.querySelector("[data-role='status-bar']");
  const resultsBodyNode = document.querySelector("[data-role='results-body']");
  const tableWrapNode = document.querySelector("[data-role='table-wrap']");
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
      shortcutHint: "میانبرها: Cmd/Ctrl+K، O، S، 1..6",
      groupByProviders: "گروه‌بندی بر اساس منبع",
      maxResults: "حداکثر نتیجه / منبع",
      searchPlaceholder: "مثلاً: iPhone 15 Pro Max 256",
      searchSubmit: "جست‌وجو",
      searchAllEnabled: "جست‌وجوی همه منابع فعال",
      openAllSearches: "باز کردن جست‌وجوی همه منابع",
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
      rankPrefix: "#{rank}"
    },
    en: {
      pageTitle: "Global Search",
      pageSubtitle: "Search one phrase across every enabled provider and review the results in a single table.",
      providerScope: "{count} active providers",
      shortcutHint: "Shortcuts: Cmd/Ctrl+K, O, S, 1..6",
      groupByProviders: "Group By Provider",
      maxResults: "Max Results / Provider",
      searchPlaceholder: "For example: iPhone 15 Pro Max 256",
      searchSubmit: "Search",
      searchAllEnabled: "Search All Enabled",
      openAllSearches: "Open All Provider Searches",
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
      rankPrefix: "#{rank}"
    }
  };

  const state = {
    language: "fa",
    themeMode: "system",
    query: "",
    selectedProviders: [],
    groupByProvider: true,
    maxResults: 3,
    sortKey: "rank",
    sortDir: "asc",
    loading: false,
    response: null,
    activeRowKey: null
  };

  boot().catch(() => {});

  async function boot() {
    await loadSettings();
    bindEvents();
    render();
    syncStickyOffsets();
    window.setTimeout(() => {
      queryInput.focus();
    }, 0);
  }

  async function loadSettings() {
    const stored = await chrome.storage.local.get(STORAGE_KEYS);
    state.language = stored.rashnuLanguage === "en" ? "en" : "fa";
    state.themeMode = ["system", "dark", "light"].includes(stored.rashnuThemeMode) ? stored.rashnuThemeMode : "system";
    state.selectedProviders = getEnabledProvidersFromFlags(stored.rashnuProviderSearchEnabled);
  }

  function bindEvents() {
    searchForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await runSearch();
    });

    queryInput.addEventListener("input", () => {
      state.query = queryInput.value;
      renderStatus();
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

    openAllButton.addEventListener("click", () => {
      openAllProviderSearches();
    });

    groupingToggleButton.addEventListener("click", () => {
      state.groupByProvider = !state.groupByProvider;
      ensureActiveRow();
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
      render();
    });
  }

  async function runSearch() {
    state.query = queryInput.value;
    const query = String(state.query || "").trim();
    if (!query) {
      renderStatus("statusNoQuery");
      queryInput.focus();
      return;
    }
    if (!state.selectedProviders.length) {
      render();
      return;
    }

    state.loading = true;
    state.response = null;
    state.activeRowKey = null;
    render();

    try {
      const response = await chrome.runtime.sendMessage({
        type: "RASHNU_GLOBAL_SEARCH",
        payload: {
          query,
          providers: state.selectedProviders,
          maxResults: state.maxResults
        }
      });
      state.response = response && typeof response === "object" ? response : null;
      ensureActiveRow();
    } catch (_error) {
      state.response = {
        ok: false,
        reason: "request_failed",
        query,
        requestedProviders: [...state.selectedProviders],
        providers: {}
      };
    } finally {
      state.loading = false;
      render();
    }
  }

  function render() {
    const translation = t();
    const hasSearchState = state.loading || Boolean(state.response) || !state.selectedProviders.length;
    root.dataset.mode = hasSearchState ? "results" : "empty";
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === "fa" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = getEffectiveTheme(state.themeMode);
    document.title = `Rashnu | ${translation.pageTitle}`;

    titleNode.textContent = translation.pageTitle;
    subtitleNode.textContent = translation.pageSubtitle;
    providerScopeNode.textContent = formatString(translation.providerScope, {
      count: String(state.selectedProviders.length)
    });
    shortcutHintNode.textContent = translation.shortcutHint;
    queryInput.placeholder = translation.searchPlaceholder;
    queryInput.value = state.query;
    searchSubmitButton.textContent = translation.searchSubmit;
    searchAllButton.textContent = translation.searchAllEnabled;
    openAllButton.textContent = translation.openAllSearches;
    openAllButton.disabled = !getProviderSearchEntries().some(({ result }) => Boolean(result?.searchUrl));
    groupingLabelNode.textContent = translation.groupByProviders;
    groupingToggleButton.setAttribute("aria-pressed", String(state.groupByProvider));
    maxResultsLabelNode.textContent = translation.maxResults;
    maxResultsValueNode.textContent = localizeDynamicText(String(state.maxResults), state.language);
    decreaseMaxResultsButton.disabled = state.maxResults <= 1;
    increaseMaxResultsButton.disabled = state.maxResults >= 10;
    heroTitleNode.textContent = translation.heroTitle;
    heroBodyNode.textContent = translation.heroBody;
    providerWarningNode.textContent = translation.providerWarning;
    renderProviderChips();
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
      return `
        <button class="provider-chip ${active ? "is-active" : ""}" type="button" data-provider="${escapeHtml(provider)}" aria-pressed="${String(active)}">
          <span class="provider-chip-dot" aria-hidden="true"></span>
          <span>${escapeHtml(siteLabelFor(provider, language))}</span>
        </button>
      `;
    }).join("");
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
      statusBarNode.innerHTML = `<strong>${escapeHtml(translation.loading)}</strong>`;
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
          <td colspan="8">${escapeHtml(translation.loadingRows)}</td>
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
    if (activeRow) {
      activeRow.scrollIntoView({
        block: "nearest"
      });
    }
  }

  function buildResultRowMarkup(provider, row) {
    const translation = t();
    const rowKey = buildRowKey(provider, row.rank);
    const active = rowKey === state.activeRowKey;
    const localizedPrice = formatPriceCell(row.priceText, row.priceValue);
    const localizedOriginal = formatPriceCell(row.originalPriceText, row.originalPriceValue, { fallback: "—" });
    const localizedDiscount = localizeDynamicText(row.discountPercent || "—", state.language);
    return `
      <tr class="result-row ${active ? "is-active" : ""}" data-row-key="${escapeHtml(rowKey)}" title="${active ? escapeHtml(translation.activeRowHint) : ""}">
        <td class="col-provider-cell">${escapeHtml(siteLabelFor(provider, state.language))}</td>
        <td class="col-rank-cell"><span class="rank-pill">${escapeHtml(formatString(translation.rankPrefix, { rank: String(row.rank || 0) }))}</span></td>
        <td>
          <div class="title-stack">
            <strong>${escapeHtml(localizeDynamicText(row.title || translation.unknown, state.language))}</strong>
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
        comparison = compareNullableNumbersForSort(left.priceValue, right.priceValue, directionFactor);
      } else if (state.sortKey === "original") {
        comparison = compareNullableNumbersForSort(left.originalPriceValue, right.originalPriceValue, directionFactor);
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
    renderResults();
  }

  function updateMaxResults(nextValue) {
    const clamped = clampMaxResults(nextValue);
    if (clamped === state.maxResults) {
      render();
      return;
    }
    state.maxResults = clamped;
    if (state.response?.ok && String(state.query || "").trim()) {
      runSearch().catch(() => {});
      return;
    }
    render();
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

    if (/^[1-6]$/.test(event.key)) {
      const index = Number.parseInt(event.key, 10) - 1;
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
    if (language === "fa") {
      return globalThis.RashnuNormalize.getSiteLabel(provider);
    }
    if (provider === "digikala") {
      return "Digikala";
    }
    if (provider === "technolife") {
      return "Technolife";
    }
    if (provider === "emalls") {
      return "Emalls";
    }
    if (provider === "ebay") {
      return "eBay";
    }
    if (provider === "torob") {
      return "Torob";
    }
    if (provider === "amazon") {
      return "Amazon";
    }
    return provider;
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
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    const leftValid = Number.isFinite(leftNumber);
    const rightValid = Number.isFinite(rightNumber);
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
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    const leftValid = Number.isFinite(leftNumber);
    const rightValid = Number.isFinite(rightNumber);
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

  function formatString(template, replacements) {
    return String(template || "").replace(/\{(\w+)\}/g, (_match, key) => replacements?.[key] ?? "");
  }

  function t() {
    return TRANSLATIONS[state.language] || TRANSLATIONS.fa;
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
