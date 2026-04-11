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
- Use a real Chrome side panel instead of a popup when presenting Dirob.
- Support reverse comparison on Torob pages by showing Digikala results.
- Ensure we need to gather all logs from this dirob so you can find the issue bugs or other things by read that file to know and fix them.
- Ensure not loaded images should just show a minimal icon.
- Ensure dirob should work on Torob and Digikala product detail pages too.
- Ensure top reload should work without refreshing the page.
- Ensure changing lang should not require refreshing.
- Ensure in RTL the per-item corner tools (reload/find) should be on the left side to avoid overlap with title/status content.

## Recent Changes (Last 20)
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

### 2026-04-09T12:35:14+03:30
- Changed files: `src/panel/panel.js`, `src/background.js`, `src/content.js`
- Summary: Added a panel-open connection channel (`runtime.connect`) to drive a shared `dirobPanelActive` state, disabled on-page guide/highlight behavior when panel is closed, and strengthened navigation resync on tab/url/back-forward events (including `pageshow`) plus auto-rescan on panel activation.
- Behavior impact: Added or refreshed 2 behavior rule(s) from user instructions.
<!-- fingerprint:1b28aab5ea74 -->

### 2026-04-09T12:25:02+03:30
- Changed files: `src/content.js`
- Summary: Added navigation rescan retries after URL changes (state reset + delayed repeated `notifyPageState/refreshCards`) so SPA transitions settle and Dirob updates automatically without manual refresh.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:866dc4af6581 -->

### 2026-04-09T12:05:45+03:30
- Changed files: `src/panel/panel.js`
- Summary: Removed per-item raw debug payload rendering from panel cards while keeping debug mode available for diagnostics/status behavior.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:bbf24e372e79 -->

### 2026-04-09T12:04:18+03:30
- Changed files: `src/content.js`, `src/background.js`
- Summary: Added explicit SPA navigation URL-change detection in content script (`pushState`/`replaceState`/`popstate`/poll) and changed background sync reconciliation to delete untouched rows and related caches so old-page products cannot persist in panel state.
- Behavior impact: Added or refreshed 2 behavior rule(s) from user instructions.
<!-- fingerprint:eb9f1d4b6132 -->

### 2026-04-09T11:13:18+03:30
- Changed files: `README.md`
- Summary: Rewrote install guidance as a dedicated “Install In Chrome (Unofficial / Unpacked)” section with explicit `chrome://extensions` developer-mode steps, load-unpacked flow, and reload instructions.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:34a69a4fdc4f -->

### 2026-04-09T11:11:47+03:30
- Changed files: `src/panel/panel.html`, `src/panel/panel.js`, `src/panel/panel.css`, `src/background.js`
- Summary: Added a bottom "Export logs" action, hid the entire diagnostics/info block unless Debug is enabled, disabled the Auto Logs toggle while Debug is off, and enforced background log writes to run only when both Debug and Auto Logs are enabled.
- Behavior impact: Added or refreshed 3 behavior rule(s) from user instructions.
<!-- fingerprint:b46633e2a343 -->

## Last Updated
- 2026-04-10T22:07:36+03:30
