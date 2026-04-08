# hamidrezafarzin/Torob-Integration

- Source: https://github.com/hamidrezafarzin/Torob-Integration
- Local folder: `research/repos/Torob-Integration`
- Type: `sdk`
- Language: `Python`

This is a small Python wrapper around Torob public-facing endpoints for suggestions, search, details, special offers, and price charts.

## Evidence

- `setup.py` packages the library with only one declared dependency: `requests`.
- `src/torob_integration/api.py` wraps `https://api.torob.com/v4/base-product/search/`, `details/`, `special-offers/`, and `price-chart/`.
- Smoke test:
  - `pip install -e research/repos/Torob-Integration`
  - `Torob().search('گوشی a55')` returned 11 results and injected `prk` and `search_id`.
  - `Torob().details(prk, search_id)` returned seller offers successfully.
- Live output:
  - search: `{'count': 11, 'first_name': 'گوشی آیفون 17 | حافظه 256 گیگابایت دو سیم‌کارت نات اکتیو', 'has_prk': True, 'has_search_id': True}`
  - details: `{'selected_name': 'گوشی سامسونگ (ویتنام) A55 5G | حافظه 256 رم 8 گیگابایت', 'price_text': 'از ۶۸٫۹۶۷٫۰۰۰ تومان', 'offers': 263, 'shop_text': 'در ۶ فروشگاه'}`
- No-VPN local recheck:
  - `torob.com` and `api.torob.com` were reachable from the user's machine.
  - Local editable install failed under Python `3.14.3` with `BackendUnavailable: Cannot import 'setuptools.build_meta'`.

## Result

- Install Status: `failed`
- Run Status: `failed`
- Useful For Chrome MVP: `high`
- Reuse Decision: `reference`

## Notes

- This is still one of the strongest direct code candidates for the Torob query layer.
- Search ranking is not good enough by itself for product matching. The first `a55` result was unrelated, so the extension still needs its own normalization and scoring layer.
- The no-VPN run shows that Torob access is not the problem. The failure is in packaging/runtime compatibility, so the code is still worth mining even though the package is not trustworthy as-is.
