# torob/Torob-Sync

- Source: https://github.com/torob/Torob-Sync
- Local folder: `research/repos/Torob-Sync`
- Type: `seller_api_docs`
- Language: `none`

This is official Torob documentation for partner shop integrations, not a consumer search API.

## Evidence

- `Readme.md` positions the repo as product sync and order tracking docs for large shops and shop builders.
- `product_api_v3.md` documents a partner-owned `POST /products` sync endpoint with JWT auth.
- `torob_api_token_guide.md` documents EdDSA JWT validation with `X-Torob-Token` and `X-Torob-Token-Version`.

## Result

- Install Status: `docs_only`
- Run Status: `not_run`
- Useful For Chrome MVP: `medium`
- Reuse Decision: `reference`

## Notes

- This is valuable as official context and for understanding Torob’s seller-side ecosystem.
- It does not help directly with Digikala-to-Torob consumer price comparison in the browser.
