# ahmadsalamifar/mrp_price_scout

- Source: https://github.com/ahmadsalamifar/mrp_price_scout
- Local folder: `research/repos/mrp_price_scout`
- Type: `scraper`
- Language: `Python`

This is an Odoo module for manufacturing cost analysis that pulls market prices from Torob and other sites.

## Evidence

- README explains Torob and Emalls scraping plus production-cost workflows.
- README explicitly says the Digikala driver is currently disabled because of anti-bot systems.
- `__manifest__.py` declares an Odoo 19 Enterprise module depending on `product`, `stock`, `mrp`, and `mail`.

## Result

- Install Status: `blocked_tooling`
- Run Status: `blocked`
- Useful For Chrome MVP: `medium`
- Reuse Decision: `reference`

## Notes

- Good reference for Torob-specific scraping heuristics and business logic around ignoring outlier prices.
- The Odoo-specific runtime makes it unsuitable as a direct base for the extension.
