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
### 2026-04-09T10:11:41+03:30
- Changed files: `src/panel/panel.html`, `src/panel/panel.css`, `src/panel/panel.js`
- Summary: Made the top brand area clickable to open the project GitHub repository and added a fixed app version line ('0.0.1 alpha test') under the Dirob title; removed obsolete page-mode header binding.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:467d79691057 -->

### 2026-04-09T10:07:35+03:30
- Changed files: `src/panel/panel.css`
- Summary: Reduced the header D brand badge footprint (box size, radius, and glyph size) to free horizontal space in the top bar.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:85e49a7a21f3 -->

### 2026-04-09T10:06:33+03:30
- Changed files: `src/panel/panel.html`, `src/panel/panel.css`
- Summary: Moved compact language and theme icon buttons into the settings top bar beside the close button, removing their separate row to save vertical space.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:06e8b6471d97 -->

### 2026-04-09T10:04:13+03:30
- Changed files: `src/panel/panel.html`, `src/panel/panel.css`, `src/panel/panel.js`
- Summary: Replaced wide Theme and Language controls with compact icon-style quick action buttons in one row, and moved labels to tooltips/ARIA so settings consumes less vertical space.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:7c40f783a0cf -->

### 2026-04-09T10:01:01+03:30
- Changed files: `src/panel/panel.html`, `src/panel/panel.css`
- Summary: Removed the top local-logger badge control from settings and replaced it with a simple colored status text line in the log section (green connected, red disconnected).
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:44378460f090 -->

### 2026-04-09T09:57:26+03:30
- Changed files: `src/panel/panel.css`
- Summary: Made the settings section more minimal by shrinking paddings, gaps, control heights, switch size, segmented controls, and paired cards while preserving behavior and responsive layout.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:5f94cc3bf869 -->

### 2026-04-09T09:54:42+03:30
- Changed files: `src/panel/panel.html`, `src/panel/panel.js`
- Summary: Removed the header placeholder text 'Waiting for a supported page...' by clearing the initial markup and rendering an empty subtitle when the active page is unsupported.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:60a8dbd43793 -->

### 2026-04-09T09:52:35+03:30
- Changed files: `src/panel/panel.css`
- Summary: Forced brand header icon placement to always stay on the right of Dirob text by using a fixed row-reverse brand layout, and increased the D badge size for better visual prominence.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:8b83e9dbba7c -->

### 2026-04-09T09:49:25+03:30
- Changed files: `src/panel/panel.css`
- Summary: Pinned brand header layout so the Dirob icon always stays to the right of title/subtitle in both FA and EN, while preserving language-specific text direction/alignment inside the text block.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:e040e9b9a8c6 -->

### 2026-04-09T09:43:34+03:30
- Changed files: `src/panel/panel.css`
- Summary: Fixed confusing light-theme switch states (clear gray OFF vs orange ON) while keeping a single active thumb direction across languages, and prevented list/grid card shrink-collapse by making item cards non-shrinking in the scroll list.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:4b95bf2d2f31 -->

### 2026-04-09T09:40:31+03:30
- Changed files: `src/panel/panel.css`
- Summary: Made switch thumb direction locale-invariant (no RTL/LTR flip) and improved light-theme contrast for switches, active controls, hover states, and logger status badges.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:e2c9f33fefef -->

### 2026-04-09T09:35:21+03:30
- Changed files: `src/panel/panel.css`
- Summary: Hardened grid layout against clipped/overlapping cards by using max-content implicit rows, max-content grid cards, and non-shrinking direct children so each product card keeps full vertical content.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:956714b29c61 -->

### 2026-04-09T09:33:02+03:30
- Changed files: `src/panel/panel.css`
- Summary: Fixed grid-card vertical overlap by forcing content-sized implicit rows and content-sized grid cards so full item blocks render without clipping in side panel grid mode.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:9f23586b9de6 -->

### 2026-04-09T09:26:55+03:30
- Changed files: `src/panel/panel.js`, `src/panel/panel.css`
- Summary: Reworked grid cards to use compact inline actions, removed overlapping corner tools in grid mode, reduced grid thumbnail footprint, and hide thumbnails in minimal grid so item content stays visible in both normal and minimal grid views.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:151bc41a0dc9 -->

### 2026-04-09T09:20:03+03:30
- Changed files: `src/panel/panel.css`
- Summary: Removed panel item-title clamping and freed minimal-mode header width so list cards can show full product names in both normal and minimal views.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:823d176d77e2 -->

### 2026-04-08T22:23:15+03:30
- Changed files: `src/panel/panel.js`, `src/panel/panel.css`, `src/help/help.css`
- Summary: Replaced layout-breaking panel zoom with variable-based sizing, made grid responsive, forced deterministic list/grid/minimal class switching, improved top refresh rebuild behavior, fixed card tool placement, and hardened help-page light-theme readability.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:a8bf5956db01 -->

### 2026-04-08T22:11:02+03:30
- Changed files: `src/panel/panel.css`, `src/panel/panel.js`
- Summary: Reworked panel scaling away from transform-based layout inflation, constrained grid to stable columns, removed card minimum-height forcing, and forced rebuild follow-up refreshes when switching minimal/layout modes.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:bfe827b11b82 -->

### 2026-04-08T22:06:17+03:30
- Changed files: `src/panel/panel.js`, `src/panel/panel.css`, `src/help/help.css`
- Summary: Improved light-theme contrast for the help page and panel hover states, forced top refresh to rebuild panel state with delayed follow-up refreshes, clamped item tools to the right side, and improved card text wrapping/visibility.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:9f9ad1d52c20 -->

### 2026-04-08T21:42:48+03:30
- Changed files: `src/panel/panel.html`, `src/panel/panel.js`, `src/panel/panel.css`, `src/background.js`, `src/help/help.html`, `src/help/help.css`, `src/help/help.js`
- Summary: Aligned the header with the brand block on the right and actions on the left, added theme mode for the panel and help page with system default, added real help-page language switching, and hardened list layout rendering to avoid collapsed item cards.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:7d626c3ae4d0 -->

### 2026-04-08T21:21:56+03:30
- Changed files: `src/panel/panel.html`, `src/panel/panel.js`, `src/panel/panel.css`, `src/lib/extract-listing-cards.js`, `src/lib/normalize.js`, `src/content.js`, `src/background.js`, `src/help/help.html`, +4 more
- Summary: Fixed top refresh wiring, made settings toggle from the header, added local help page, widened font-scale range, tightened title/image/query cleanup, reduced sync churn with sync dedupe, improved minimal/grid overflow handling, and prepared the repo for MIT GitHub publish.
- Behavior impact: Added or refreshed 4 behavior rule(s) from user instructions.
<!-- fingerprint:6b29e3f1faed -->

## Last Updated
- 2026-04-09T10:11:41+03:30
