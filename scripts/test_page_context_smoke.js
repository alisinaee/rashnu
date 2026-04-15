#!/usr/bin/env node

"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class MockElement {
  constructor(href = "", options = {}) {
    this._href = href;
    this.isConnected = options.isConnected !== false;
    this._width = options.width ?? 120;
    this._height = options.height ?? 48;
  }

  getAttribute(name) {
    if (name === "href") {
      return this._href;
    }
    return null;
  }

  closest() {
    return null;
  }

  getBoundingClientRect() {
    return {
      width: this._width,
      height: this._height
    };
  }

  querySelector() {
    return null;
  }

  querySelectorAll() {
    return [];
  }
}

function createHarness({ hostname, pathname, href, title, links }) {
  let queryCount = 0;
  const currentLinks = links.map((linkHref) => new MockElement(linkHref));
  const sandbox = {
    console,
    URL,
    location: {
      hostname,
      pathname,
      href
    },
    document: {
      title,
      body: {},
      querySelectorAll() {
        queryCount += 1;
        return currentLinks;
      },
      querySelector() {
        return null;
      }
    },
    window: {
      getComputedStyle() {
        return {
          display: "block",
          visibility: "visible"
        };
      }
    },
    Element: MockElement,
    setTimeout,
    clearTimeout
  };
  sandbox.globalThis = sandbox;
  sandbox.globalThis.RashnuNormalize = {
    canonicalizeUrl(value, base) {
      try {
        return new URL(value, base || href).toString();
      } catch (_error) {
        return "";
      }
    }
  };

  vm.createContext(sandbox);
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "lib", "extract-listing-cards.js"),
    "utf8"
  );
  vm.runInContext(source, sandbox);

  return {
    extractor: sandbox.RashnuListingExtractor,
    getQueryCount() {
      return queryCount;
    }
  };
}

function run() {
  const detailHarness = createHarness({
    hostname: "www.digikala.com",
    pathname: "/product/dkp-1234/example/",
    href: "https://www.digikala.com/product/dkp-1234/example/",
    title: "Detail Page",
    links: []
  });
  const detailContext = detailHarness.extractor.getPageContext();
  assert.equal(detailContext.mode, "detail");
  assert.equal(detailContext.isSupported, true);
  assert.equal(detailHarness.getQueryCount(), 0);

  const listingHarness = createHarness({
    hostname: "www.digikala.com",
    pathname: "/search/",
    href: "https://www.digikala.com/search/?q=test",
    title: "Listing Page",
    links: ["/product/dkp-1/", "/product/dkp-2/", "/product/dkp-3/"]
  });
  const listingContext = listingHarness.extractor.getPageContext();
  assert.equal(listingContext.mode, "listing");
  assert.equal(listingContext.isSupported, true);
  assert.equal(listingHarness.getQueryCount(), 1);

  listingHarness.extractor.getPageContext();
  assert.equal(
    listingHarness.getQueryCount(),
    1,
    "cached page context should avoid rescanning listing links"
  );

  listingHarness.extractor.invalidatePageContextCache();
  listingHarness.extractor.getPageContext();
  assert.equal(
    listingHarness.getQueryCount(),
    2,
    "cache invalidation should force listing detection to recompute"
  );

  listingHarness.extractor.getPageContext({ forceRefresh: true });
  assert.equal(
    listingHarness.getQueryCount(),
    3,
    "forceRefresh should bypass the cached listing detection result"
  );

  const unsupportedHarness = createHarness({
    hostname: "www.digikala.com",
    pathname: "/search/",
    href: "https://www.digikala.com/search/?q=test",
    title: "Incomplete Listing",
    links: ["/product/dkp-1/", "/product/dkp-2/"]
  });
  const unsupportedContext = unsupportedHarness.extractor.getPageContext();
  assert.equal(unsupportedContext.mode, "unsupported");
  assert.equal(unsupportedContext.isSupported, false);

  const basalamDetailHarness = createHarness({
    hostname: "basalam.com",
    pathname: "/vendor/product/36498124",
    href: "https://basalam.com/vendor/product/36498124",
    title: "Basalam Detail",
    links: []
  });
  const basalamDetailContext = basalamDetailHarness.extractor.getPageContext();
  assert.equal(basalamDetailContext.mode, "detail");
  assert.equal(basalamDetailContext.isSupported, true);

  const basalamShortDetailHarness = createHarness({
    hostname: "basalam.com",
    pathname: "/product/36498124",
    href: "https://basalam.com/product/36498124",
    title: "Basalam Short Detail",
    links: []
  });
  const basalamShortDetailContext = basalamShortDetailHarness.extractor.getPageContext();
  assert.equal(basalamShortDetailContext.mode, "detail");
  assert.equal(basalamShortDetailContext.isSupported, true);

  const basalamListingHarness = createHarness({
    hostname: "basalam.com",
    pathname: "/cat/digital/laptop",
    href: "https://basalam.com/cat/digital/laptop",
    title: "Basalam Listing",
    links: [
      "/vendor-a/product/1001",
      "/vendor-b/product/1002",
      "/vendor-c/product/1003"
    ]
  });
  const basalamListingContext = basalamListingHarness.extractor.getPageContext();
  assert.equal(basalamListingContext.mode, "listing");
  assert.equal(basalamListingContext.isSupported, true);

  const basalamThinListingHarness = createHarness({
    hostname: "basalam.com",
    pathname: "/landings/special-offers-landing",
    href: "https://basalam.com/landings/special-offers-landing",
    title: "Basalam Thin Listing",
    links: ["/vendor-x/product/5001"]
  });
  const basalamThinListingContext = basalamThinListingHarness.extractor.getPageContext();
  assert.equal(basalamThinListingContext.mode, "listing");
  assert.equal(basalamThinListingContext.isSupported, true);

  console.log("page-context smoke tests passed");
}

run();
