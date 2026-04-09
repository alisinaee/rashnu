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
- Ensure icon-first controls expose localized hover titles and aria labels based on selected language.
- Ensure font scale affects list/item content only and must not resize header/settings sections.
- Ensure settings tooltips explain feature behavior (not just label text), and guide/status chips must expose explanatory tooltips.
- Ensure compact item action icons use site-aware symbols (D/T, search+D/T, Google) with non-heavy reload iconography.
- Ensure size scale range remains constrained to -5 through +5.
- Ensure logger setup supports one-time autostart installation so users avoid per-session manual helper launch.
- Ensure compact action icons remain slightly larger for readability, and normal list/grid cards compress subtitle/metrics into one-row chips.
- Ensure search-on-site and reload icons stay visually larger/heavier than default compact icon sizing.
- Ensure confidence is displayed adjacent to status in the top meta row across all layouts, and remove long subtitle chips below titles.

## Recent Changes (Last 20)
### 2026-04-09T10:51:14+03:30
- Changed files: `src/panel/panel.js`, `src/panel/panel.css`
- Summary: Removed the long subtitle chip below item titles and moved confidence (plus retries when available) into compact chips beside status in the meta row for list/grid and minimal/normal views.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:a3014510f7fa -->

### 2026-04-09T10:46:57+03:30
- Changed files: `src/panel/panel.css`
- Summary: Increased visual weight and size for compact search-target and reload icons (including corner reload tool) to improve legibility in minimal/grid action rows.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:ec5ff8b57b07 -->

### 2026-04-09T10:44:05+03:30
- Changed files: `src/panel/panel.js`, `src/panel/panel.css`
- Summary: Increased compact action icon sizing for better readability and replaced normal-mode subtitle/meta text lines with a single-row chip strip (target/confidence/retries) to save vertical space in both list and grid cards.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:d5de93f56de9 -->

### 2026-04-09T10:41:09+03:30
- Changed files: `run-dirob-helper`, `src/panel/panel.js`, `README.md`
- Summary: Added helper lifecycle commands (`--install-autostart`, `--uninstall-autostart`, `--status`) backed by a macOS LaunchAgent for persistent logger startup, and updated panel/README guidance to prefer one-time autostart setup over repeated manual runs.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:0ea5ee888cfa -->

### 2026-04-09T10:37:27+03:30
- Changed files: `src/background.js`
- Summary: Tightened global font-scale clamp to enforce a hard UI range of `-5..+5` for panel size adjustments.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:e5f9f6b78683 -->

### 2026-04-09T10:35:44+03:30
- Changed files: `src/panel/panel.js`, `src/panel/panel.css`, `src/panel/panel.html`
- Summary: Expanded localized tooltip/ARIA coverage with detailed behavior descriptions for top controls and settings toggles, added tooltip explanations for guide numbers and status chips, and redesigned compact action icons to use site-aware marks (D/T, search+D/T, Google, locate, lighter reload symbol).
- Behavior impact: Added or refreshed 2 behavior rule(s) from user instructions.
<!-- fingerprint:7bc31b5b1f14 -->

### 2026-04-09T10:27:26+03:30
- Changed files: `src/panel/panel.js`, `src/panel/panel.css`
- Summary: Scoped size scaling to item list typography by introducing `--items-font-size`, removed scale coupling from global panel text, and converted item/list text styles to `em` so item titles/meta/prices/actions scale consistently with size controls.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:3a19f53f37ef -->

### 2026-04-09T10:23:18+03:30
- Changed files: `src/panel/panel.html`, `src/panel/panel.js`, `src/help/help.html`, `src/help/help.js`
- Summary: Added centralized localized tooltip/ARIA wiring for panel and help icon controls, including settings toggles/layout/size actions and GitHub brand links, and removed hardcoded English title attributes from markup.
- Behavior impact: Added or refreshed 1 behavior rule(s) from user instructions.
<!-- fingerprint:6ea9f37002c4 -->

### 2026-04-09T10:14:18+03:30
- Changed files: `src/help/help.html`, `src/help/help.css`
- Summary: Updated help/guide header so Dirob icon+title open the GitHub repo and added a visible version line (0.0.1 alpha test) under the title while keeping the localized subtitle below.
- Behavior impact: Recorded code-level deltas for future AI context.
<!-- fingerprint:9fba763f1626 -->

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

## Last Updated
- 2026-04-09T10:51:14+03:30
