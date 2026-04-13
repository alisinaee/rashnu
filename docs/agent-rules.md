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
- Ensure changing lang should not require refreshing.
- Ensure in RTL the per-item corner tools (reload/find) should be on the left side to avoid overlap with title/status content.
- Ensure logger helper failures or disconnects must not freeze the panel, reload actions, or ongoing site matching.
- Provide working local-log helper commands for both macOS and Windows.
- Ensure small-screen settings areas remain scrollable instead of clipping content off-screen.
- Keep global-search section summaries visually inside the same rounded card as their section header/body.
- Align global-search section titles/captions by document direction; LTR must left-align and RTL must right-align.
- Keep global-search accordions as one unified rounded section, not separate bordered header/body boxes.
- Keep global-search settings cards visually single-piece; do not reintroduce divider-heavy split header/body styling.
- Keep global-search wide-screen layout compact and minimal instead of wasting horizontal space.
- Keep include/exclude suggestion areas visible after search attempts so users understand when suggestions are unavailable.
- Keep the global-search providers section always expanded; do not add a collapse control there.

## Recent Changes (Last 20)
### 2026-04-13T12:02:00+03:30
- Changed files: `src/search/search.html`, `src/search/search.css`, `src/search/search.js`
- Summary: Removed the global-search providers accordion toggle/state UI, kept the providers section permanently expanded, and simplified the card header/body structure to match the always-open behavior.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:0fc30d4e98ec -->

### 2026-04-13T11:49:00+03:30
- Changed files: `src/search/search.css`, `src/search/search.js`
- Summary: Removed the remaining internal split treatment from global-search settings cards, enforced full-width logical title alignment for LTR/RTL, tightened wide-screen search/settings density, and kept suggestion groups visible with explicit empty-state messaging after search attempts.
- Behavior impact: Added or refreshed 3 behavior rule(s) from user instructions.
<!-- fingerprint:5b2d930dc466 -->

### 2026-04-13T11:34:00+03:30
- Changed files: `src/search/search.css`, `src/search/search.js`, `src/search/search.html`
- Summary: Converted global-search accordions into single unified cards, fixed direction-aware section-title alignment, made wide-screen settings more compact with a two-column top layout, emphasized the main search field with clearer copy, and kept the suggestion strip visible with empty-state hints when include/exclude suggestions are unavailable.
- Behavior impact: Added or refreshed 2 behavior rule(s) from user instructions.
<!-- fingerprint:08cba4c83e91 -->

### 2026-04-13T11:18:00+03:30
- Changed files: `src/search/search.html`, `src/search/search.css`, `src/search/search.js`, `src/panel/panel.css`
- Summary: Reworked global-search section cards so summaries/body live inside the same rounded container, made provider pills consistently rounded/aligned, added a clearer search-query heading, stabilized accordion toggles so they preserve viewport position, and fixed panel minimal-view RTL action positioning plus scrollable settings on small screens.
- Behavior impact: Added or refreshed 2 behavior rule(s) from user instructions.
<!-- fingerprint:b8057d6bf7a1 -->

### 2026-04-13T10:45:00+03:30
- Changed files: `src/background.js`, `src/panel/panel.js`, `src/panel/panel.css`, `run-rashnu-helper`, `run-rashnu-helper.ps1`, `README.md`
- Summary: Hardened panel/background recovery so worker restarts and offline local logging cannot dead-end the UI, replaced toolbar/item glyph buttons with centered SVG icons for consistent Windows rendering, and added path-relative macOS plus Windows helper launchers/instructions for local logs.
- Behavior impact: Added or refreshed 2 behavior rule(s) from user instructions.
<!-- fingerprint:5fcb0e7e2b7d -->

### 2026-04-12T22:19:48+03:30
- Changed files: `src/panel/panel.js`, `src/background.js`, `src/search/search.js`, `src/help/help.html`, `src/help/help.js`
- Summary: Added a per-item Rashnu Search action in the panel that opens global search prefilled and autorun for the clicked item title, and refreshed the help guide to cover global-search filters, duplicate grouping, thumbnails, and the new item action.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:103fae984a7b -->

### 2026-04-12T21:54:58+03:30
- Changed files: `src/search/search.html`, `src/search/search.css`, `src/search/search.js`, `src/background.js`, `src/lib/match.js`
- Summary: Refined global search layout, moved providers into top settings, matched panel-style icon controls, split include/exclude suggestions visually, preserved candidate thumbnails, and close the Rashnu side panel when opening global search with sidePanel.close fallback.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:3583e013eb8c -->

### 2026-04-12T21:39:31+03:30
- Changed files: `src/background.js`
- Summary: Expanded global-search include/exclude suggestion generation to use larger suggestion samples, stronger term-difference scoring between stronger and weaker result bands, and better formatting/classification for spec/model tokens like capacities and product codes.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:8be22aabaeba -->

### 2026-04-12T21:09:58+03:30
- Changed files: `src/search/search.html`, `src/search/search.js`, `src/search/search.css`
- Summary: Added a Clear All Filters action to global search that resets include terms, exclude terms, and condition back to default without changing the base query or selected providers.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:2ba56580a4be -->

### 2026-04-12T21:08:35+03:30
- Changed files: `src/search/search.html`, `src/search/search.js`, `src/search/search.css`, `src/panel/panel.js`, `src/background.js`
- Summary: Refined global search UI with collapsible Rashnu settings and provider sections, conditional Amazon/eBay warning inside providers, theme/language controls, search-result thumbnails, and search-tab side-panel disabling so the Rashnu side panel closes on the global-search tab.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:1ffd42efc183 -->

### 2026-04-12T19:55:32+03:30
- Changed files: `src/search/search.html`, `src/search/search.js`, `src/search/search.css`, `src/background.js`
- Summary: Expanded global search with include and exclude chips, condition filters, query preview, duplicate grouping, background post-filter and dedupe logic, smart suggestions, and safe rerun handling during in-flight searches.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:2ac1f5216b88 -->

### 2026-04-12T19:50:58+03:30
- Changed files: `src/search/search.html`, `src/search/search.js`, `src/search/search.css`, `src/background.js`
- Summary: Expanded global search with include/exclude chips, condition filters, query preview, duplicate grouping toggle, background post-filter/dedupe controls, and result-driven refinement suggestions.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:bd1e087a1123 -->

### 2026-04-12T17:33:20+03:30
- Changed files: `src/content.js`, `src/lib/extract-listing-cards.js`, `src/background.js`, `scripts/test_page_context_smoke.js`, `docs/manual-regression-checklist.md`
- Summary: Optimized content page-context detection with cached listing checks, limited URL polling to panel-active fallback windows, batched debug log persistence to chrome.storage, and added smoke/manual regression verification artifacts.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:623e58b999de -->

### 2026-04-11T22:20:00+03:30
- Changed files: `src/search/search.html`, `src/search/search.js`, `src/search/search.css`
- Summary: Split the global-search settings into a compact sticky strip below the header, added measured sticky offsets so the search bar docks beneath that strip after search, and turned the empty state into a centered hero search layout instead of a full stacked settings card.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:10f3902178be -->

### 2026-04-11T16:44:23+0330
- Changed files: `src/background.js`, `src/lib/match.js`, `src/panel/panel.html`, `src/panel/panel.js`, `src/panel/panel.css`, `src/search/search.html`, `src/search/search.js`, `src/search/search.css`
- Summary: Added a new panel header search button that opens a dedicated Rashnu global-search tab, implemented a background `RASHNU_GLOBAL_SEARCH` provider API with configurable per-provider result limits, and built a keyboard-driven search/table UI with row-click open, compact action buttons, sortable columns, a panel-style grouping switch, `- / +` max-result stepper, and compact `T` price formatting.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:5f4cdb544d2a -->

### 2026-04-11T11:43:56+03:30
- Changed files: `manifest.json`, `README.md`, `src/background.js`, `src/content.js`, `src/help/help.html`, `src/help/help.js`, `src/lib/extract-listing-cards.js`, `src/lib/logger.js`, +11 more
- Summary: Renamed GitHub repository to alisinaee/rashnu and performed full project token rename from dirob/Dirob/DIROB to rashnu/Rashnu/RASHNU, including helper script filenames and artifact paths.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:53a51a4275ae -->

### 2026-04-11T10:55:38+03:30
- Changed files: `manifest.json`, `src/background.js`, `assets/extension-icons/icon-active-16.png`, `assets/extension-icons/icon-active-32.png`, `assets/extension-icons/icon-active-48.png`, `assets/extension-icons/icon-active-128.png`, `assets/extension-icons/icon-inactive-16.png`, `assets/extension-icons/icon-inactive-32.png`, +2 more
- Summary: Added Rashnu extension toolbar/manifest icons and dynamic active-state icon switching (background color appears only when side panel is open/active).
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:b7268677926f -->

### 2026-04-11T10:53:04+03:30
- Changed files: `src/lib/extract-listing-cards.js`
- Summary: Fixed Digikala detail price extraction to avoid insurance/add-on prices by selecting best strict price candidates from buy-box scope instead of first global price-final match.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:800be745567b -->

### 2026-04-11T10:39:08+03:30
- Changed files: `src/panel/panel.html`, `src/panel/panel.js`, `src/panel/panel.css`
- Summary: Simplified compact provider summary UI: title is 'Active Providers', removed extra compact text/labels, and made chip rows responsive (wide: one-row layout, narrow: stacked/two-row).
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:c934dbc1e0a8 -->

### 2026-04-11T10:33:14+03:30
- Changed files: `manifest.json`, `src/panel/panel.html`, `src/panel/panel.js`, `src/help/help.html`, `src/help/help.js`, `src/sidebar.js`, `README.md`, `docs/extension-mvp-checklist.md`
- Summary: Renamed product branding from Rashnu to Rashnu in user-facing metadata/UI/docs and fixed panel header version badge to 0.0.3.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:d26be2ed6fdc -->

### 2026-04-11T10:27:41+03:30
- Changed files: `src/panel/panel.html`, `src/panel/panel.js`, `src/panel/panel.css`
- Summary: Made provider settings section collapsible with compact active-chip summary in minimal mode and expandable full controls for editing.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:5c2655dc36f5 -->

### 2026-04-10T22:07:36+03:30
- Changed files: `README.md`, `manifest.json`, `src/background.js`, `src/help/help.html`, `src/help/help.js`, `src/lib/extract-listing-cards.js`, `src/lib/normalize.js`, `src/panel/panel.js`
- Summary: Added source-site support for Emalls/Amazon/eBay in extractor/background, hardened Emalls matching with JSON+HTML fallback, improved price parsing, and refreshed panel/help/readme copy for 6 supported providers.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:5a2051ccdb69 -->

### 2026-04-10T21:39:18+03:30
- Changed files: `src/background.js`, `manifest.json`
- Summary: Added anti-bot-aware marketplace fallback for Amazon/eBay: keep direct search-page fetch first, detect challenge/blocked responses, then fetch `r.jina.ai` mirror markdown and parse product title/price/url candidates for ranking. Added targeted debug logs for candidate source/count and proxy usage, plus host permission for `https://r.jina.ai/*`.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:fe07dbf15442 -->

### 2026-04-10T21:12:36+03:30
- Changed files: `src/background.js`
- Summary: Fixed marketplace query translation resilience: when online translation is unreachable, Amazon/eBay now use a local heuristic Persian→English mapper (brand/category/model/storage keywords + digit normalization) so search URLs still become English-oriented instead of falling back to raw Persian text.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:3cbec8dd25f1 -->

### 2026-04-10T21:03:19+03:30
- Changed files: `src/background.js`, `manifest.json`
- Summary: Added Persian/Arabic-to-English query translation for Amazon/eBay search URLs using cached Google Translate requests in background (`translate.googleapis.com`), with safe fallback to original query when translation fails. This ensures global marketplace searches are normalized toward English query text whenever possible.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:b84dc5c35bc4 -->

## Last Updated
- 2026-04-13T12:02:00+03:30
