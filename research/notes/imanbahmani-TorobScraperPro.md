# imanbahmani/TorobScraperPro

- Source: https://github.com/imanbahmani/TorobScraperPro
- Local folder: `research/repos/TorobScraperPro`
- Type: `scraper`
- Language: `Python`

This repo is a robust Torob crawler aimed at large-scale extraction with proxy rotation and contact scraping.

## Evidence

- README requires `Xray-core`, optional `curl_chrome116`, and `tmux`.
- `config.py` points directly at `https://api.torob.com/v4/base-product/search/`.
- `crawler_pro.py` manages proxy pools, retry loops, and contact caching across search/detail/contact flows.

## Result

- Install Status: `blocked_tooling`
- Run Status: `blocked`
- Useful For Chrome MVP: `medium`
- Reuse Decision: `reference`

## Notes

- Strong reference for resilient Torob crawling and rate-limit resistance.
- Overbuilt for a browser extension MVP, and the proxy infrastructure is out of scope for now.
