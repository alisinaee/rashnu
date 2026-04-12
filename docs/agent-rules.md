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
- Prefer a dedicated extension tab for table-heavy global search workflows instead of forcing them into the side panel.

## Recent Changes (Last 20)
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

### 2026-04-10T20:55:12+03:30
- Changed files: `src/panel/panel.js`, `src/background.js`
- Summary: Fixed English digit localization so Persian/Arabic numerals convert to real decimal digits (instead of ASCII code values), which corrected malformed Torob/Technolife price text in EN mode. Added Digikala match fallback on recoverable transport errors (`network_error`, `timeout`, retryable HTTP), returning a stable search-only result instead of hard error status.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:f7e0cc4d4e43 -->

### 2026-04-10T20:36:37+03:30
- Changed files: `src/background.js`, `src/lib/normalize.js`, `src/panel/panel.html`, `src/panel/panel.js`, `src/help/help.js`, `manifest.json`, `README.md`, `assets/site-icons/emalls.svg`, `assets/site-icons/amazon.svg`, `assets/site-icons/ebay.svg`
- Summary: Expanded provider registry from 3 to 6 providers and added `emalls`, `amazon`, and `ebay` as target providers. Implemented Emalls API search via `/_Search.ashx` and credential-aware Amazon/eBay placeholders that safely return fallback `searchUrl` results with explicit reasons when credentials are missing.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:6f8c19a2db91 -->

### 2026-04-10T12:03:02+03:30
- Changed files: `src/panel/panel.js`, `src/panel/panel.css`
- Summary: Removed top per-item status/confidence labels from cards and moved confidence display to per-provider badges inside price boxes, so confidence is shown provider-by-provider alongside provider icons.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:f30500fc7d35 -->

### 2026-04-10T11:56:49+03:30
- Changed files: `src/background.js`, `src/panel/panel.js`, `src/panel/panel.html`, `src/panel/panel.css`
- Summary: Changed matching/panel from single-target view to multi-provider display per item: fetch all enabled target providers, store per-site results, and render a price section for each active provider (source + enabled targets).
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:ed485b497fe2 -->

### 2026-04-10T11:51:21+03:30
- Changed files: `src/background.js`, `src/panel/panel.js`, `src/panel/panel.html`, `src/panel/panel.css`, `manifest.json`, `src/lib/normalize.js`, `src/lib/extract-listing-cards.js`, `assets/site-icons/technolife-192.png`
- Summary: Kept Digikala and enabled all 3 providers (Torob, Digikala, Technolife) with per-provider settings for search-button availability and price visibility; matching now uses enabled provider order/fallbacks, and panel settings include provider toggles.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:a31bb44b5d35 -->

### 2026-04-10T11:41:33+03:30
- Changed files: `manifest.json`, `src/lib/normalize.js`, `src/lib/extract-listing-cards.js`, `src/panel/panel.js`, `assets/site-icons/technolife-192.png`
- Summary: Enabled Technolife as a full source site: content script host match, technolife source IDs, listing/detail extraction via DOM + __NEXT_DATA__, upgraded technolife icon asset, and panel unsupported text updated.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:e33854a08c5c -->

### 2026-04-10T11:21:02+03:30
- Changed files: `manifest.json`, `src/background.js`, `src/lib/normalize.js`, `src/panel/panel.js`
- Summary: Added Technolife API-backed provider fallback via Next.js data endpoint, with manifest permissions, panel label/icon/search support, and normalization helpers.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:46b2841747e6 -->

### 2026-04-09T13:01:28+03:30
- Changed files: `src/panel/panel.css`
- Summary: Switched per-item corner tool anchoring to logical inline-end so in RTL they render on the left side, avoiding overlap on the right.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:4f83f1713ad7 -->

### 2026-04-09T12:59:18+03:30
- Changed files: `src/panel/panel.css`
- Summary: Fixed switch control geometry by forcing toggle track layout to LTR with explicit start alignment and clipping, preventing RTL overflow/misaligned thumbs.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:5533c1d56a59 -->

### 2026-04-09T12:38:27+03:30
- Changed files: `assets/fonts/Vazir-Regular-FD.woff2`, `assets/fonts/Vazir-Bold-FD.woff2`, `src/panel/panel.css`, `src/help/help.css`, `src/sidebar.css`, `src/popup/popup.html`
- Summary: Bundled Vazir font files into the extension and added local `@font-face` declarations for panel/help/sidebar/popup so Persian text consistently renders in Vazir regardless of OS-installed fonts.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:72ca5b4f58c4 -->

## Last Updated
- 2026-04-11T22:20:00+03:30
