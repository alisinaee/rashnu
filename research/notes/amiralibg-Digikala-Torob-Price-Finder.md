# amiralibg/Digikala-Torob-Price-Finder

- Source: https://github.com/amiralibg/Digikala-Torob-Price-Finder
- Local folder: `research/repos/Digikala-Torob-Price-Finder`
- Type: `other`
- Language: `JavaScript`

This is the closest repo to the target product: a Chrome/Firefox extension for Digikala and Torob price comparison.

## Evidence

- `chrome/manifest.json` is MV3 and uses a service worker plus content scripts.
- `chrome/src/js/background.js` calls both `api.digikala.com` and `api.torob.com`.
- `chrome/src/js/content.js` extracts Digikala and Torob product data from page DOM.
- `chrome/src/js/universal-product-detector.js` adds broad e-commerce detection beyond Digikala and Torob.
- Static manifest checks:
  - `manifest_version` = `3`
  - `host_permissions` count = `6`
- The manifest includes very broad host permissions: `https://*/*` and `http://*/*`.

## Result

- Install Status: `docs_only`
- Run Status: `not_run`
- Useful For Chrome MVP: `high`
- Reuse Decision: `reference`

## Notes

- Best direct reference for extension structure, content script extraction, and background messaging.
- Not safe to adopt wholesale because permissions are too broad and the repo claims “official APIs” without proving long-term stability.
