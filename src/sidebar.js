(function () {
  "use strict";

  const MAX_ROWS = 30;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function createSidebarTemplate() {
    return `
      <section id="dirob-root" aria-live="polite">
        <div class="dirob-shell">
          <header class="dirob-header">
            <div>
              <h1>Dirob</h1>
              <p>مقایسه سریع دیجیکالا با ترب</p>
            </div>
            <span class="dirob-pill" data-dirob-debug-badge hidden>Debug</span>
          </header>
          <div class="dirob-summary" data-dirob-summary>در حال بررسی محصولات قابل مشاهده...</div>
          <div class="dirob-list" data-dirob-list></div>
        </div>
      </section>
    `;
  }

  async function ensureSidebarRoot() {
    let root = document.getElementById("dirob-root");
    if (root) {
      return root;
    }

    const host = document.createElement("div");
    host.id = "dirob-host";

    try {
      const response = await fetch(chrome.runtime.getURL("src/sidebar.html"));
      host.innerHTML = response.ok ? await response.text() : createSidebarTemplate();
    } catch (_error) {
      host.innerHTML = createSidebarTemplate();
    }

    document.body.appendChild(host);
    root = host.querySelector("#dirob-root");
    return root;
  }

  function render(state) {
    const root = document.getElementById("dirob-root");
    if (!root) {
      return;
    }

    const summary = root.querySelector("[data-dirob-summary]");
    const list = root.querySelector("[data-dirob-list]");
    const debugBadge = root.querySelector("[data-dirob-debug-badge]");
    debugBadge.hidden = !state.debugEnabled;
    summary.textContent = buildSummaryText(state);
    list.innerHTML = buildListMarkup(state);
  }

  function buildSummaryText(state) {
    if (state.errorMessage) {
      return state.errorMessage;
    }

    if (!state.hasCards) {
      return "در این صفحه هنوز کارت محصول قابل تشخیص پیدا نشد.";
    }

    if (!state.items.length) {
      return "در حال بررسی محصولات قابل مشاهده...";
    }

    const visibleCount = state.items.filter((item) => item.isVisible).length;
    return `${visibleCount} محصول روی صفحه دیده شده و ${state.items.length} مورد در نوار ثبت شده است.`;
  }

  function buildListMarkup(state) {
    const items = state.items.slice(0, MAX_ROWS);
    if (!items.length) {
      return "";
    }

    return items.map((entry) => buildCardMarkup(entry, state.debugEnabled)).join("");
  }

  function buildCardMarkup(entry, debugEnabled) {
    const status = entry.match?.status || "loading";
    const statusLabel = getStatusLabel(status);
    const digikalaPrice = entry.item.displayPriceText || "قیمت در کارت پیدا نشد";
    const torobPrice =
      entry.match?.torobPriceText ||
      (status === "loading" ? "در حال جستجو..." : "یافت نشد");
    const confidence =
      typeof entry.match?.confidence === "number"
        ? `${Math.round(entry.match.confidence * 100)}%`
        : "نامشخص";
    const torobTitle = entry.match?.matchedTitle || "بدون تطابق قطعی";
    const searchLink = globalThis.DirobNormalize.buildTorobSearchUrl(
      entry.match?.query || entry.item.title
    );
    const openLink =
      entry.match?.torobUrl || entry.match?.moreInfoUrl || searchLink;
    const imageMarkup = entry.item.imageUrl
      ? `<img class="dirob-thumb" src="${escapeHtml(entry.item.imageUrl)}" alt="">`
      : `<div class="dirob-thumb dirob-thumb--empty">بدون تصویر</div>`;
    const debugMarkup =
      debugEnabled && entry.match?.debug
        ? `<div class="dirob-debug">${escapeHtml(JSON.stringify(entry.match.debug, null, 2))}</div>`
        : "";

    return `
      <article class="dirob-card" data-visible="${entry.isVisible ? "true" : "false"}">
        <div class="dirob-row">
          ${imageMarkup}
          <div class="dirob-body">
            <span class="dirob-status dirob-status--${escapeHtml(status)}">${escapeHtml(
      statusLabel
    )}</span>
            <h2 class="dirob-title">${escapeHtml(entry.item.title)}</h2>
            <div class="dirob-price-grid">
              <div class="dirob-price-box">
                <span class="dirob-label">دیجیکالا</span>
                <span class="dirob-value">${escapeHtml(digikalaPrice)}</span>
              </div>
              <div class="dirob-price-box">
                <span class="dirob-label">ترب</span>
                <span class="dirob-value">${escapeHtml(torobPrice)}</span>
              </div>
            </div>
            <p class="dirob-subtitle">${escapeHtml(torobTitle)}</p>
            <p class="dirob-meta">اعتماد: ${escapeHtml(confidence)}${
      entry.match?.sellerCount ? ` | فروشنده: ${escapeHtml(entry.match.sellerCount)}` : ""
    }</p>
            <div class="dirob-links">
              <a class="dirob-link" href="${escapeHtml(openLink)}" target="_blank" rel="noreferrer">باز کردن در ترب</a>
              <a class="dirob-link" href="${escapeHtml(searchLink)}" target="_blank" rel="noreferrer">جستجوی ترب</a>
            </div>
            ${debugMarkup}
          </div>
        </div>
      </article>
    `;
  }

  function getStatusLabel(status) {
    switch (status) {
      case "matched":
        return "تطابق خوب";
      case "low_confidence":
        return "نیاز به بررسی";
      case "not_found":
        return "پیدا نشد";
      case "error":
        return "خطای شبکه";
      default:
        return "در حال جستجو";
    }
  }

  globalThis.DirobSidebar = {
    ensureSidebarRoot,
    render
  };
})();
