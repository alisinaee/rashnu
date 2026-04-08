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
- Ensure in RTL the reload for each element should be on top right.

## Recent Changes (Last 20)
### 2026-04-08T21:21:56+03:30
- Changed files: `src/panel/panel.html`, `src/panel/panel.js`, `src/panel/panel.css`, `src/lib/extract-listing-cards.js`, `src/lib/normalize.js`, `src/content.js`, `src/background.js`, `src/help/help.html`, +4 more
- Summary: Fixed top refresh wiring, made settings toggle from the header, added local help page, widened font-scale range, tightened title/image/query cleanup, reduced sync churn with sync dedupe, improved minimal/grid overflow handling, and prepared the repo for MIT GitHub publish.
- Behavior impact: Added or refreshed 4 behavior rule(s) from user instructions.
<!-- fingerprint:6b29e3f1faed -->

### 2026-04-08T20:17:52+03:30
- Changed files: `src/lib/normalize.js`, `src/lib/extract-listing-cards.js`, `src/content.js`, `src/background.js`, `src/panel/panel.html`, `src/panel/panel.css`, `src/panel/panel.js`
- Summary: Stabilized Dirob around guide-number-first rows, filtered self-triggered DOM refreshes, added page-only source/match caches with retry cap 3, cleaned search queries, added background source-price resolution for Digikala, and redesigned the panel header/settings with minimal and grid/list modes.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:462a0878a185 -->

### 2026-04-08T19:38:45+03:30
- Changed files: `manifest.json`, `src/background.js`, `src/content.js`, `src/lib/extract-listing-cards.js`, `src/panel/panel.html`, `src/panel/panel.css`, `src/panel/panel.js`, `scripts/dirob_log_helper.py`, +2 more
- Summary: Switched Dirob to guide-number-first ordering, added localhost log helper, preserved panel scroll on soft reloads, added page/panel locate interactions, and tightened structured price extraction for Digikala/Torob detail pages.
- Behavior impact: Added or refreshed 2 behavior rule(s) from user instructions.
<!-- fingerprint:74a26c045aab -->

### 2026-04-08T17:38:44+03:30
- Changed files: `src/lib/normalize.js`, `src/lib/extract-listing-cards.js`, `src/content.js`, `src/background.js`, `src/panel/panel.html`, `src/panel/panel.css`, `src/panel/panel.js`
- Summary: Added collapsible settings, non-invasive page-view sync scrolling, fixed detail-page selection overwrite, improved Digikala price extraction to avoid insurance/rating noise, and made folder selection immediately create the log file target.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:318aa5af6a90 -->

### 2026-04-08T17:07:58+03:30
- Changed files: `src/background.js`, `src/content.js`, `src/panel/panel.js`, `src/panel/panel.css`
- Summary: Added persisted sync-page-view state, switched detail-page visibility tracking to real DOM visibility, and upgraded the panel settings to material-style switches with row focus syncing in the panel.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:f2febc054879 -->

### 2026-04-08T16:49:57+03:30
- Changed files: `src/background.js`, `src/panel/panel.js`
- Summary: Normalized Digikala API prices from rial to toman and replaced full panel list rewrites with keyed per-card patching to stop whole-list blinking on updates.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:ac99bc8dec67 -->

### 2026-04-08T16:42:33+03:30
- Changed files: `src/background.js`, `src/panel/panel.js`, `src/panel/panel.css`
- Summary: Stopped repeated cached reapplication for visible rows, added bounded auto retries up to 5 per item, reduced panel rerender flicker, and fixed side-panel scroll container layout with light loading animations.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:8b44683418ad -->

### 2026-04-08T16:33:31+03:30
- Changed files: `src/background.js`, `src/content.js`, `src/panel/panel.html`, `src/panel/panel.css`, `src/panel/panel.js`
- Summary: Added guide-number mode with panel toggle, in-page numbered badges, panel number chips, and preserved detail-page suggested products.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:143534ac4706 -->

### 2026-04-08T16:14:04+03:30
- Changed files: `src/lib/extract-listing-cards.js`, `src/background.js`
- Summary: Tightened Digikala listing title extraction to avoid shipping/seller labels and switched panel ordering to stable append order so infinite-scroll products are added at the end instead of reordering the list.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:bae71db3b643 -->

### 2026-04-08T15:59:14+03:30
- Changed files: `src/lib/extract-listing-cards.js`, `src/content.js`, `src/background.js`, `src/panel/panel.html`, `src/panel/panel.css`, `src/panel/panel.js`
- Summary: Added forced active-tab rescans, strengthened Digikala detail extraction with JSON-LD/meta fallbacks, switched font controls to minimal +/- with current size display, and fixed RTL per-item reload positioning.
- Behavior impact: Added or refreshed 4 behavior rule(s) from user instructions.
<!-- fingerprint:75f680e0a6c6 -->

### 2026-04-08T15:50:21+03:30
- Changed files: `src/lib/extract-listing-cards.js`, `src/content.js`, `src/background.js`, `src/panel/panel.html`, `src/panel/panel.css`, `src/panel/panel.js`
- Summary: Added product-detail page support for Digikala and Torob, localized panel text for Persian/English, added font-size and auto-log controls, moved per-item reload to the card corner, and tightened image fallback behavior.
- Behavior impact: Added or refreshed 2 behavior rule(s) from user instructions.
<!-- fingerprint:4e401d670265 -->

### 2026-04-08T15:23:07+03:30
- Changed files: `manifest.json`, `src/background.js`, `src/content.js`, `src/panel/panel.html`, `src/panel/panel.css`, `src/panel/panel.js`, `src/lib/logger.js`
- Summary: Added persistent Dirob log collection across content/background/panel, with side-panel export and clear actions so debugging can use a real JSON log file.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:756794fd5720 -->

### 2026-04-08T15:20:41+03:30
- Changed files: `manifest.json`, `src/background.js`, `src/content.js`, `src/lib/extract-listing-cards.js`, `src/lib/normalize.js`, `src/lib/match.js`, `src/panel/panel.html`, `src/panel/panel.css`, +1 more
- Summary: Converted Dirob from an injected overlay into a real Chrome side panel, added top settings/reload controls, hover-based selection mode, reverse Torob-to-Digikala lookup, and Google/reload actions per product.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:e12f6e9fb745 -->

### 2026-04-08T15:00:00+03:30
- Changed files: `manifest.json`, `src/background.js`, `src/content.js`, `src/sidebar.js`, `src/sidebar.css`, `src/sidebar.html`, `src/lib/normalize.js`, `src/lib/match.js`, +3 more
- Summary: Scaffolded the Dirob MV3 extension with Digikala listing extraction, background Torob search/matching, injected sidebar UI, and popup-backed debug mode.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:17168c3efbe1 -->

### 2026-04-08T14:22:14+03:30
- Changed files: `docs/extension-mvp-checklist.md`, `docs/research-benchmark.md`
- Summary: Shifted MVP from phone-only product-page comparison to a general Digikala listing-page sidebar that tracks visible products while scrolling and shows Torob matches.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:f0a6a8e2fd7b -->

## Last Updated
- 2026-04-08T21:21:56+03:30
