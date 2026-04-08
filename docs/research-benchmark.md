# Torob Research Benchmark

## Goal

Benchmark third-party Torob and Digikala tooling for a Chrome extension MVP that compares Torob prices while a user is viewing a Digikala product page.

## Method

- Staged evaluation, not full execution for every repo.
- Metadata and README inspection for all repos.
- Local smoke tests only for repos that fit the current toolchain.
- Missing system tools, incompatible Python versions, or credential-heavy setups are recorded as blockers instead of being installed in this phase.

## Environment

- Python `3.9.6`
- Node `24.7.0`
- npm `11.5.1`
- git `2.50.1`
- PHP unavailable
- Composer unavailable
- Docker unavailable
- Go unavailable

## No-VPN Findings

Results from the user's local machine on `2026-04-08` without VPN:

- Python `3.14.3`
- `torob.com` and `api.torob.com` were reachable
- `digikala.com` and `api.digikala.com` were reachable
- `pypi.org` and `files.pythonhosted.org` timed out repeatedly

This matters because several Python repo checks were distorted by package-download failures. The benchmark below separates:

- real site/API reachability
- real repo/runtime issues
- environment-side package-install issues

## Local Recheck

If you want to re-run the benchmark from your own machine without VPN, use:

```bash
./scripts/run_no_vpn_recheck.sh
```

Useful variants:

```bash
./scripts/run_no_vpn_recheck.sh --list
./scripts/run_no_vpn_recheck.sh --repo hamidrezafarzin/Torob-Integration
./scripts/run_no_vpn_recheck.sh --skip-network --repo amiralibg/Digikala-Torob-Price-Finder
```

The runner prints the report in the terminal and saves structured output under `research/artifacts/no-vpn-recheck-*`.

## Benchmark Table

| Repo | Link | Type | Language | Last Push | License | Torob Capability | Digikala Capability | Install Status | Run Status | Evidence | Useful For Chrome MVP | Reuse Decision | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `hamidrezafarzin/Torob-Integration` | [GitHub](https://github.com/hamidrezafarzin/Torob-Integration) | `sdk` | `Python` | `2023-11-22` | `MIT` | Search, details, offers, price chart wrapper over Torob public endpoints | None | `failed` | `failed` | [note](../research/notes/hamidrezafarzin-Torob-Integration.md) | `high` | `reference` | Torob access is valid, but local editable install failed under the recheck environment. |
| `TahaBakhtari/TorobjoMCP` | [GitHub](https://github.com/TahaBakhtari/TorobjoMCP) | `mcp_server` | `Python` | `2025-03-30` | `none` | Torob search pagination plus Instagram caption extraction | None | `failed` | `failed` | [note](../research/notes/TahaBakhtari-TorobjoMCP.md) | `low` | `reference` | Has both local package-download trouble and a likely broken MCP dependency story. |
| `itsMajid-dev/torobot` | [GitHub](https://github.com/itsMajid-dev/torobot) | `sdk` | `Python` | `2025-08-22` | `MIT` | Search, seller/contact helpers, suggestions, exports | None | `failed` | `failed` | [note](../research/notes/itsMajid-dev-torobot.md) | `medium` | `reference` | Package is broken on import, and local recheck was further distorted by PyPI timeouts. |
| `AmirAref/Torobot` | [GitHub](https://github.com/AmirAref/Torobot) | `telegram_bot` | `Python` | `2024-08-03` | `MIT` | Clean Torob card model and search helper | None | `failed` | `failed` | [note](../research/notes/AmirAref-Torobot.md) | `medium` | `reference` | Interesting helper code, but the no-VPN run could not validate it because dependency installation timed out. |
| `xmrrabbitx/scraper` | [GitHub](https://github.com/xmrrabbitx/scraper) | `scraper` | `PHP` | `2025-07-10` | `none` | Torob scraping | Digikala supermarket scraping | `blocked_tooling` | `blocked` | [note](../research/notes/xmrrabbitx-scraper.md) | `low` | `reference` | PHP-only and not focused on the Digikala product-page flow. |
| `torob/Torob-Sync` | [GitHub](https://github.com/torob/Torob-Sync) | `seller_api_docs` | `none` | `2026-01-27` | `none` | Official seller sync, webhook, and order-tracking docs | None | `docs_only` | `not_run` | [note](../research/notes/torob-Torob-Sync.md) | `medium` | `reference` | Official Torob context, but for partner shops rather than consumer comparison. |
| `amirmokri/visual-price-compare` | [GitHub](https://github.com/amirmokri/visual-price-compare) | `other` | `Python` | `2025-10-05` | `none` | Torob scraping/comparison in a large Django app | Digikala scraping/comparison in the same app | `blocked_tooling` | `blocked` | [note](../research/notes/amirmokri-visual-price-compare.md) | `medium` | `reference` | Strong architecture reference, too heavy for MVP reuse. |
| `amiralibg/Digikala-Torob-Price-Finder` | [GitHub](https://github.com/amiralibg/Digikala-Torob-Price-Finder) | `other` | `JavaScript` | `2025-09-14` | `none` | Torob API calls from extension background scripts | Digikala DOM extraction and API usage from the same extension | `docs_only` | `not_run` | [note](../research/notes/amiralibg-Digikala-Torob-Price-Finder.md) | `high` | `reference` | Closest product match; useful architecture, but permissions are too broad to adopt directly. |
| `jamshidi799/digi-bot` | [GitHub](https://github.com/jamshidi799/digi-bot) | `telegram_bot` | `Go` | `2022-10-14` | `none` | Torob price monitoring | Digikala price monitoring | `blocked_tooling` | `blocked` | [note](../research/notes/jamshidi799-digi-bot.md) | `low` | `discard` | Monitoring bot, not an in-page comparison tool. |
| `ahmadsalamifar/mrp_price_scout` | [GitHub](https://github.com/ahmadsalamifar/mrp_price_scout) | `scraper` | `Python` | `2026-01-27` | `LGPL-3.0` | Torob and Emalls price scraping for Odoo | Digikala driver currently disabled | `blocked_tooling` | `blocked` | [note](../research/notes/ahmadsalamifar-mrp_price_scout.md) | `medium` | `reference` | Good business heuristics, but tied to Odoo and not the right product shape. |
| `imanbahmani/TorobScraperPro` | [GitHub](https://github.com/imanbahmani/TorobScraperPro) | `scraper` | `Python` | `2026-02-25` | `MIT` | Large-scale Torob crawling, detail/contact scraping, proxy rotation | None | `blocked_tooling` | `blocked` | [note](../research/notes/imanbahmani-TorobScraperPro.md) | `medium` | `reference` | Good resilience ideas, too infrastructure-heavy for MVP. |
| `moein72002/AI_Shopping_Assistant` | [GitHub](https://github.com/moein72002/AI_Shopping_Assistant) | `other` | `Python` | `2026-02-17` | `none` | Torob-only agent backend with BM25, SQL, and vision | None | `blocked_tooling` | `blocked` | [note](../research/notes/moein72002-AI_Shopping_Assistant.md) | `low` | `discard` | Rich backend ideas, but far from the browser-extension MVP. |

## Curated Additions List

- `amirmokri/visual-price-compare`
  - Added because it is a recent Digikala + Torob comparison project with concrete scraping and matching architecture.
- `amiralibg/Digikala-Torob-Price-Finder`
  - Added because it is the closest open-source match to the target browser extension.
- `jamshidi799/digi-bot`
  - Added because it monitors both Digikala and Torob and may expose reusable tracking patterns.
- `ahmadsalamifar/mrp_price_scout`
  - Added because it contains live market-pricing heuristics and explicitly discusses Torob and Digikala constraints.
- `imanbahmani/TorobScraperPro`
  - Added because it is a recent Torob-focused crawler with resilient query/detail flows.
- `moein72002/AI_Shopping_Assistant`
  - Added because it is a recent Torob product-retrieval backend with ranking and comparison components.

## Reuse Shortlist

### Best Reusable Code

- `hamidrezafarzin/Torob-Integration`
  - Best current candidate for a reusable Torob API wrapper in the MVP, but it should be vendored or rewritten minimally instead of relying on its packaging as-is.
- `AmirAref/Torobot`
  - Worth mining for response modeling once ported to the target runtime.

### Best Reference Implementations

- `amiralibg/Digikala-Torob-Price-Finder`
  - Best direct reference for extension architecture, MV3 layout, DOM extraction, and background messaging.
- `torob/Torob-Sync`
  - Best official Torob documentation source, even though it is out of scope for consumer search.
- `amirmokri/visual-price-compare`
  - Best reference for future matching, scraping, and price-comparison architecture.
- `ahmadsalamifar/mrp_price_scout`
  - Best reference for price-quality heuristics and outlier handling.

### Not Useful For MVP

- `jamshidi799/digi-bot`
  - Monitoring bot, wrong product shape.
- `moein72002/AI_Shopping_Assistant`
  - Heavy backend with datasets and LLM infrastructure, wrong first-step dependency.

## Risks And Gaps

- Torob search ranking is noisy. A query like `گوشی a55` can return irrelevant top results, so the extension must rank candidates itself.
- Digikala access is more fragile than Torob. The extension should prefer page extraction on product pages and treat any `api.digikala.com` usage as unstable.
- PyPI access from the user's machine is unreliable, so local package installation is not a trustworthy signal by itself.
- Several open-source repos are outdated, broken, or incomplete. Benchmark value is mostly in ideas and snippets, not in ready-to-ship code.
- The best browser-extension reference uses over-broad host permissions. Our implementation should narrow those scopes.
- None of the sampled repos solves high-confidence cross-site product matching cleanly. That remains core product work.

## Recommended Build Inputs For Our Product

- Base the Torob query layer on `hamidrezafarzin/Torob-Integration`, but simplify it into a minimal internal wrapper and add result scoring.
- Use `amiralibg/Digikala-Torob-Price-Finder` as the main reference for:
  - MV3 manifest structure
  - content script to background messaging
  - Digikala page extraction patterns
- Use `torob/Torob-Sync` only as official context, not as the consumer API source.
- Borrow ranking and filtering ideas from:
  - `amirmokri/visual-price-compare`
  - `ahmadsalamifar/mrp_price_scout`
- Do not adopt Telegram bots, Odoo modules, proxy-heavy crawlers, or AI-heavy backends into the MVP codebase.

## Final Product Direction

- Product shape: Chrome extension MVP focused on Digikala listing and browsing pages.
- Core flow:
  - Detect visible Digikala product cards while the user scrolls.
  - Read product title, displayed price, URL, and image/brand when available.
  - Query Torob from the background service worker for each detected product.
  - Rank Torob candidates with product-specific matching logic.
  - Show a sidebar list with Torob estimated/best price, confidence, and link for each Digikala item.
- MVP boundaries:
  - Support general Digikala listing pages first, not just product detail pages.
  - Avoid category restriction in the MVP.
  - Show a fallback “open Torob search” action when confidence is low or no match is found.
