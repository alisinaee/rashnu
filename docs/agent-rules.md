# AI Agent Rules & Change Memory

## Project Snapshot
- Keep updates focused on architecture, behavior rules, and high-impact changes only.
- Prefer short, implementation-focused bullets over narrative prose.

## Behavior Rules
- Keep this file concise and clear for AI agents.
- Update this file after assistant turns that edit repo-tracked files.
- Capture new user behavior instructions as short imperative rules.
- Skip updates when there are no file edits and no new behavior instructions.
- Retain only the latest 20 change entries.
- Support general Digikala listing pages; do not limit the MVP to phone pages only.
- Reuse researched repo logic as reference material instead of starting from zero.
- Use a real Chrome side panel instead of a popup when presenting Rashnu.
- Support reverse comparison on Torob pages by showing Digikala results.
- Ensure we need to gather all logs from this rashnu so you can find the issue bugs or other things by read that file to know and fix them.
- Ensure not loaded images should just show a minimal icon.
- Ensure rashnu should work on Torob and Digikala product detail pages too.
- Ensure top reload should work without refreshing the page.
- Treat the top reload as a safe in-panel Rashnu rebuild; do not call `chrome.runtime.reload()` from the side panel because Chrome may refuse to reopen it.
- Ensure changing lang should not require refreshing.

## Recent Changes (Last 20)
### 2026-04-14T10:09:22+03:30
- Changed files: `src/lib/extract-listing-cards.js`, `scripts/test_page_context_smoke.js`
- Summary: Improved Basalam listing stability: support /product/<id> detail URLs, lower Basalam listing detection threshold to one product link, filter non-product Basalam links, and dedupe listing records by sourceId before guide assignment to prevent guide-number drift from repeated carousel cards.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:84e50cc20de6 -->

### 2026-04-14T09:33:31+03:30
- Changed files: `manifest.json`, `src/panel/panel.js`, `src/background.js`
- Summary: Added www.basalam.com content-script/host coverage, made top reload button perform robust panel refresh plus extension runtime reload, and ensured Basalam is included in per-item price rows and clickable via fallback search URLs.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:4972229c3792 -->

### 2026-04-14T09:26:27+03:30
- Changed files: `src/lib/normalize.js`, `src/background.js`, `src/panel/panel.js`, `src/panel/panel.html`, `src/lib/extract-listing-cards.js`
- Summary: Fixed Basalam Phase 1 gaps: direct search buttons now include Basalam without enabling auto-match, panel settings expose the Basalam search toggle, and Basalam detail price extraction now reads the current __NEXT_DATA__ product shape.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:b39a4b1bfefa -->

### 2026-04-13T22:39:34+03:30
- Changed files: `manifest.json`, `README.md`, `src/background.js`, `src/lib/normalize.js`, `src/lib/extract-listing-cards.js`, `src/panel/panel.js`, `src/search/search.js`, `scripts/test_page_context_smoke.js`, +1 more
- Summary: Added a shared provider capability registry and Basalam source-page support. Basalam now injects on basalam.com, normalizes Basalam product URLs/source IDs/search URLs, extracts Basalam listing/detail data from DOM and SSR data, and stays excluded from automated target/global search flows.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:965e9f478143 -->

### 2026-04-13T22:07:17+03:30
- Changed files: `src/background.js`, `src/panel/panel.html`
- Summary: Panel first paint no longer blocks on log-helper health or Divar location loading, and the header action buttons now ship real inline SVG icons so the initial shell does not render empty buttons.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:1d59d4e3845e -->

### 2026-04-13T22:01:47+03:30
- Changed files: `src/background.js`, `src/lib/normalize.js`
- Summary: Added Divar location fallback via fields-search when places-web.json fails, and made Divar search URLs accept numeric city IDs as path segments.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:7184a868c4fe -->

### 2026-04-13T21:50:07+03:30
- Changed files: `src/search/search.css`
- Summary: Removed the empty-state search-shell height reservation so the global search area no longer leaves a large dead gap above the search bar; empty mode now uses only a modest top margin.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:ee3701dc0b62 -->

### 2026-04-13T21:48:55+03:30
- Changed files: `src/search/search.css`
- Summary: Changed the global-search empty state to use a controlled top margin for the search section instead of vertically centering the whole content shell.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:ef4a5ac80449 -->

### 2026-04-13T21:48:04+03:30
- Changed files: `src/search/search.css`
- Summary: Made the desktop global-search settings grid stretch both accordion cards to equal height by stretching the grid row and letting each accordion fill its cell.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:055c0087b6ad -->

### 2026-04-13T21:47:23+03:30
- Changed files: `src/search/search.js`
- Summary: Changed the Divar city selector render path to remove it from the DOM layout unless Divar is active, and reinsert it inline after the Divar provider chip when enabled.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:bc28f8291a83 -->

### 2026-04-13T21:46:22+03:30
- Changed files: `src/background.js`
- Summary: Added automatic content-script reinjection and retry for supported tabs when rescans fail after extension reload, fixing the first-open-after-reload bug without requiring a page refresh.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:d55053fcc3ac -->

### 2026-04-13T21:44:14+03:30
- Changed files: `src/search/search.css`
- Summary: Fixed the desktop results-mode layout so the global search input row spans the full search card width across both grid columns.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:75850277267d -->

### 2026-04-13T21:43:10+03:30
- Changed files: `src/search/search.js`, `src/search/search.css`
- Summary: Moved the Divar city selector into the provider chip row as a minimal inline control shown only when Divar is active, so the provider settings card height stays compact.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:d35c8e60529d -->

### 2026-04-13T21:40:04+03:30
- Changed files: `src/search/search.css`
- Summary: Made the global search bar span the full available content width by removing the base search-card width cap and stretching the search shell.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:ea6bb97a9c6c -->

### 2026-04-13T21:39:00+03:30
- Changed files: `src/search/search.html`, `src/search/search.css`
- Summary: Moved global-search secondary actions into the search bar before the main search button and increased the Search Query heading prominence.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:882271b61f6a -->

### 2026-04-13T21:10:16+03:30
- Changed files: `src/search/search.html`, `src/search/search.js`, `src/search/search.css`
- Summary: Removed the redundant Search All Enabled button, normalized query matching so global-search suggestions render after backend query cleanup, improved action-row alignment under the search bar, animated the compact advanced-mode switch correctly, and centered the loading-row indicator.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:d6c5f0f7472b -->

### 2026-04-13T21:03:00+03:30
- Changed files: `src/search/search.html`, `src/search/search.css`
- Summary: Moved the global search advanced mode control into the settings header action row as a compact pill switch beside language and theme controls.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:1e028ab64f8c -->

### 2026-04-13T19:46:59+03:30
- Changed files: `src/panel/panel.css`, `src/search/search.css`, `src/help/help.css`, `src/popup/popup.html`
- Summary: Switched extension UI typography to a mixed-script font stack so Persian text always uses Vazir glyphs even when the interface language is English.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:8ec28b414142 -->

### 2026-04-13T19:44:47+03:30
- Changed files: `src/background.js`, `src/panel/panel.js`, `src/panel/panel.css`, `src/search/search.js`, `src/search/search.css`, `src/search/search.html`
- Summary: Added real provider launcher icons on search UI, animated loading states, Divar city visibility rules, panel scroll position persistence, stronger search query heading, safer price sorting for unknown prices, and background rescan log noise suppression.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:33e84b309647 -->

### 2026-04-13T18:24:00+03:30
- Changed files: `src/background.js`, `src/panel/panel.js`
- Summary: Replaced the side-panel runtime-reload experiment with a safe in-panel Rashnu hard refresh that force-rescans the active tab and only falls back to a tab reload if the content script is unresponsive, so the first top-button click no longer kills the panel.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:f5f23658f7be -->

## Last Updated
- 2026-04-14T10:09:22+03:30
