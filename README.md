# Dirob

Dirob is a Chrome side-panel extension for comparing Digikala and Torob prices while browsing listing and product pages.

## Features

- Side-panel comparison between Digikala and Torob
- Listing and detail page support
- Guide numbers on the page and in the panel
- Element select mode
- Sync-with-view mode
- List and grid layouts
- Minimal compact view
- Local development logs via `run-dirob-helper`

## Install In Chrome (Unofficial / Unpacked)

Use this when the extension is not from Chrome Web Store.

1. Open Chrome and go to `chrome://extensions`.
2. Turn on `Developer mode` (top-right).
3. Click `Load unpacked`.
4. Select this repository folder (must contain `manifest.json`).
5. Find **Dirob** in extension cards.
6. (Optional) Click the pin icon in Chrome toolbar so Dirob is always visible.
7. Open a Torob or Digikala page, then open Dirob from Chrome side panel.
8. After any local code change, go back to `chrome://extensions` and click `Reload` on the Dirob card.

## Development

### Logger Setup (Recommended)

One-time auto-start setup:

```bash
./run-dirob-helper --install-autostart
```

Check status:

```bash
./run-dirob-helper --status
```

Foreground/manual mode:

```bash
./run-dirob-helper
```

After setup, open Digikala or Torob pages and use the Dirob side panel.

## License

MIT

## Creator

- GitHub: [alisinaee](https://github.com/alisinaee)
- LinkedIn: [alisinaee](https://www.linkedin.com/in/alisinaee)
