# Chrome Extension MVP Checklist

## Goal

Build a Chrome extension named `Dirob` that activates while the user browses Digikala listing pages, detects visible products during scroll, queries Torob for matching products, and shows a sidebar list with Torob price information and links.

## Build Order

### 1. Create the extension shell

- Create a Manifest V3 extension.
- Keep permissions narrow:
  - `storage`
  - `scripting`
  - `activeTab`
- Keep host permissions narrow:
  - `https://www.digikala.com/*`
  - `https://torob.com/*`
  - `https://api.torob.com/*`
- Do not use wildcard host permissions.

### 2. Add Digikala listing-page detection

- Match Digikala listing/search/category pages first:
  - search result pages
  - category pages
  - brand pages
  - any product grid/list page with multiple product cards
- In the content script, extract:
  - page URL
  - visible product cards
  - for each visible card:
    - Digikala product id if present
    - product title
    - displayed price
    - product URL
    - image URL if available
    - brand if available
- Track cards that enter the viewport while the user scrolls.
- De-duplicate products by Digikala product id or product URL.
- If extraction fails for a card, skip that card and keep the sidebar alive.

### 3. Add background Torob search

- Put all Torob network calls in the background service worker.
- For each Digikala product card, query Torob search first.
- Start with these Torob flows:
  - search: `v4/base-product/search`
  - details: `v4/base-product/details`
- Return a normalized internal shape:
  - `title`
  - `price`
  - `price_text`
  - `torob_url`
  - `random_key`
  - `shop_text`
  - `more_info_url`

### 4. Add product matching and scoring

- Normalize Persian and English text:
  - unify Arabic/Persian character variants
  - remove extra spaces and punctuation noise
  - lowercase English tokens
- Remove generic words from scoring:
  - examples: `گوشی`, `موبایل`, `لپ تاپ`, `مدل`, `هواپز`, `اصل`, `اورجینال`
- Score candidates using:
  - exact brand match
  - exact model token match
  - title token overlap
  - numeric token overlap
  - optional variant token overlap when present
- Do not hardcode category-specific rules for phones only.
- The matcher must work for general product names such as appliances, electronics, and home products.
- Reject low-confidence results.
- If confidence is low, show:
  - “match not confident”
  - button to open Torob search for the same query

### 5. Add MVP UI

- Show a persistent right-side sidebar first.
- The sidebar should activate on supported Digikala listing pages.
- The sidebar content is a list of detected Digikala products currently in view.
- For each list item, show:
  - Digikala title
  - Digikala price
  - estimated or best Torob price
  - matched Torob title if found
  - confidence label
  - open Torob link
- If no Torob match is found, show:
  - “not found”
  - open Torob search link
- Keep the sidebar active while scrolling and append/update items as new cards become visible.

### 6. Add resilience

- Handle these states explicitly:
  - page has no detectable product cards
  - individual card extraction failed
  - Torob search returned no results
  - low-confidence match
  - Torob API/network error
- Add request timeout and one retry for Torob calls.
- Cache results per Digikala product id or card URL for a short duration.
- Limit concurrent Torob requests so scrolling does not flood the API.

### 7. Add developer diagnostics

- Add a debug mode in extension storage.
- In debug mode, show:
  - extracted Digikala payload
  - top 5 Torob candidates
  - candidate scores
  - rejection reason for low-confidence matches

## Code Reuse Guidance

### Reuse directly as reference

- `amiralibg/Digikala-Torob-Price-Finder`
  - extension structure
  - content/background message flow
  - Digikala selector ideas
- `hamidrezafarzin/Torob-Integration`
  - Torob endpoint usage
  - details-flow shape
- `torob/Torob-Sync`
  - official Torob context only

### Reuse only as ideas

- `itsMajid-dev/torobot`
  - seller/contact ideas
- `ahmadsalamifar/mrp_price_scout`
  - outlier filtering ideas
- `amirmokri/visual-price-compare`
  - future matching/ranking direction

### Do not use as MVP base

- Telegram bots
- Odoo modules
- proxy-heavy crawlers
- AI-heavy backend assistants

## Acceptance Criteria

- On a supported Digikala listing page, the extension detects visible product cards while scrolling.
- The background worker can query Torob and return candidate products for multiple cards.
- The sidebar updates continuously as the user scrolls.
- Each sidebar row shows either:
  - a Torob match with price/link
  - or a fallback not-found/search state
- No broad wildcard host permissions are required.

## First Milestone

Deliver a working slice with:

- Digikala listing-card extraction
- scroll detection for visible cards
- Torob search call per card
- basic scoring
- sidebar with:
  - Digikala title
  - Digikala price
  - Torob estimated/best price
  - open Torob link
- generic category support from day one, without restricting to phones

## Immediate Next Task

Create the extension skeleton with:

- `manifest.json`
- `src/content.js`
- `src/background.js`
- `src/sidebar.html`
- `src/sidebar.css`
- `src/sidebar.js`
- `src/lib/normalize.js`
- `src/lib/match.js`
- `src/lib/extract-listing-cards.js`
