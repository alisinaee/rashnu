(function () {
  "use strict";

  const normalizeApi = globalThis.DirobNormalize;
  const TITLE_SELECTORS = [
    "[data-testid*='title']",
    'a[aria-label]',
    'img[alt]',
    "[class*='title']",
    "[class*='Title']",
    "h3",
    "h2",
    "h4",
    "strong"
  ];
  const PRICE_SELECTORS = [
    "[data-testid*='price']",
    "[class*='price']",
    "[class*='Price']",
    "[class*='amount']",
    "[class*='Amount']"
  ];
  const LINK_SELECTORS = {
    digikala:
      'a[href*="/product/dkp-"], a[href*="/product/"][href*="digikala.com"], a[href^="/product/dkp-"], a[href^="/product/"]',
    torob: 'a[href*="/p/"], a[href^="/p/"]'
  };
  const BAD_TITLE_PATTERNS = [
    /^تصویر\s+/u,
    /ارسال\s+سریع/u,
    /فروشنده/u,
    /پیشنهاد/u,
    /مطمئن/u,
    /ارسال\s+امروز/u,
    /گارانتی/u,
    /بازگشت/u,
    /دیجی.?کالا/u
  ];
  const BAD_PRICE_PATTERNS = [
    /بیمه/u,
    /گارانتی/u,
    /امتیاز/u,
    /دیدگاه/u,
    /پرسش/u,
    /فروشنده/u,
    /ارسال/u,
    /تخفیف/u
  ];
  const DIROB_IGNORE_SELECTOR =
    '[data-dirob-guide-badge], [data-dirob-highlight="true"], #dirob-selection-style, [data-dirob-role]';
  const DIGIKALA_CURRENT_PRICE_SELECTORS = [
    '[data-testid="price-final"]',
    '[data-testid="price-current"]',
    '[data-testid="price-no-discount"]',
    '[data-testid="price-value"]',
    ".c-product-price__selling",
    ".styles_Price__discounted__MhNIJ"
  ];
  const DIGIKALA_DISCOUNT_PERCENT_SELECTORS = [
    '[data-testid="price-discount-percent"]',
    '[class*="discount"][class*="percent"]'
  ];
  const DIGIKALA_ORIGINAL_PRICE_SELECTORS = [
    ".line-through",
    '[class*="line-through"]',
    '[data-testid="price-before-discount"]'
  ];
  const TOROB_CURRENT_PRICE_SELECTORS = [
    '[data-cy="product-price"]',
    '[data-testid="product-price"]',
    'a[href*="product-page/redirect"]'
  ];

  function detectSite() {
    const host = location.hostname;
    if (host.includes("digikala.com")) {
      return "digikala";
    }
    if (host.includes("torob.com")) {
      return "torob";
    }
    return "unsupported";
  }

  function isProductDetailPage(site) {
    if (site === "digikala") {
      return /\/product\/dkp-\d+\//i.test(location.pathname);
    }
    if (site === "torob") {
      return /^\/p\/[^/]+/i.test(location.pathname);
    }
    return false;
  }

  function getProductLinks(site) {
    const selector = LINK_SELECTORS[site];
    if (!selector) {
      return [];
    }

    const links = Array.from(document.querySelectorAll(selector));
    const filtered = [];
    const seen = new Set();

    for (const link of links) {
      if (!isNodeRendered(link, { minWidth: 2, minHeight: 2 })) {
        continue;
      }
      const href = normalizeApi.canonicalizeUrl(link.getAttribute("href"), location.href);
      if (!href) {
        continue;
      }
      if (site === "digikala" && !href.includes("/product/")) {
        continue;
      }
      if (site === "torob" && !href.includes("/p/")) {
        continue;
      }
      if (seen.has(href)) {
        continue;
      }
      seen.add(href);
      filtered.push(link);
    }

    return filtered;
  }

  function getPageContext() {
    const site = detectSite();
    const isDetail = site !== "unsupported" && isProductDetailPage(site);
    const isListing =
      site !== "unsupported" &&
      !isDetail &&
      getProductLinks(site).length >= 3;

    return {
      site,
      pageUrl: normalizeApi.canonicalizeUrl(location.href),
      pageTitle: document.title || "",
      mode: isDetail ? "detail" : isListing ? "listing" : "unsupported",
      isSupported: isDetail || isListing
    };
  }

  function textFromSelectors(root, selectors) {
    for (const selector of selectors) {
      const nodes = root.querySelectorAll(selector);
      for (const node of nodes) {
        if (isIgnoredNode(node)) {
          continue;
        }
        const text = nodeText(node);
        if (isUsefulTitle(text)) {
          return text;
        }
      }
    }
    return "";
  }

  function isUsefulTitle(text) {
    const normalized = normalizeApi.cleanProductTitle(text || "");
    if (!normalized || normalized.length < 4) {
      return false;
    }
    if (normalized.length > 180) {
      return false;
    }
    if (BAD_TITLE_PATTERNS.some((pattern) => pattern.test(normalized))) {
      return false;
    }
    return /[A-Za-zآ-ی]/.test(normalized);
  }

  function pickPriceText(root) {
    const site = detectSite();
    return pickPriceInfo(root, site).priceText;
  }

  function pickTitle(root, fallbackAnchor) {
    const preferredValues = [
      fallbackAnchor.querySelector("img")?.getAttribute("alt"),
      fallbackAnchor.getAttribute("aria-label"),
      fallbackAnchor.getAttribute("title")
    ];

    for (const value of preferredValues) {
      const text = normalizeApi.cleanProductTitle(value || "");
      if (isUsefulTitle(text)) {
        return text;
      }
    }

    const titleFromCard = textFromSelectors(root, TITLE_SELECTORS);
    if (titleFromCard) {
      return titleFromCard;
    }

    return "";
  }

  function isDecorativeImageUrl(value) {
    const normalized = String(value || "").toLowerCase();
    if (!normalized) {
      return true;
    }
    return (
      normalized.endsWith(".svg") ||
      normalized.includes("incredibleoffer") ||
      normalized.includes("placeholder") ||
      normalized.includes("badge") ||
      normalized.includes("icon") ||
      normalized.includes("logo")
    );
  }

  function pickImageUrl(root) {
    const prioritizedRoots = [
      root.querySelector(LINK_SELECTORS[detectSite()] || ""),
      root
    ].filter(Boolean);
    const seen = new Set();

    for (const scope of prioritizedRoots) {
      const images = Array.from(scope.querySelectorAll("img"));
      for (const image of images) {
        if (seen.has(image)) {
          continue;
        }
        seen.add(image);
        const candidate =
          image.currentSrc ||
          image.src ||
          image.getAttribute("data-src") ||
          image.getAttribute("data-lazy-src") ||
          null;
        if (!candidate || isDecorativeImageUrl(candidate)) {
          continue;
        }
        const altText = normalizeApi.cleanProductTitle(image.getAttribute("alt") || "");
        if (altText && BAD_TITLE_PATTERNS.some((pattern) => pattern.test(altText))) {
          continue;
        }
        const width = image.naturalWidth || image.width || 0;
        const height = image.naturalHeight || image.height || 0;
        if (width >= 80 || height >= 80) {
          return candidate;
        }
      }
    }
    return null;
  }

  function findCardContainer(link, site) {
    let current = link;
    let depth = 0;

    while (current && current !== document.body && depth < 8) {
      if (isLikelyCard(current, site)) {
        return current;
      }
      current = current.parentElement;
      depth += 1;
    }

    return link;
  }

  function isLikelyCard(element, site) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    if (!isNodeRendered(element, { minWidth: 120, minHeight: 120 })) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width < 120 || rect.height < 120) {
      return false;
    }

    const linkSelector = LINK_SELECTORS[site];
    const linkCount = element.querySelectorAll(linkSelector).length;
    if (linkCount < 1 || linkCount > 5) {
      return false;
    }

    const hasImage = !!element.querySelector("img");
    const textLength = normalizeApi.normalizeWhitespace(element.textContent || "").length;
    return hasImage && textLength >= 15;
  }

  function extractCardData(cardElement, position, site) {
    if (!isNodeRendered(cardElement, { minWidth: 80, minHeight: 80 })) {
      return null;
    }
    const productLinkSelector = LINK_SELECTORS[site];
    const link =
      cardElement.matches(productLinkSelector)
        ? cardElement
        : cardElement.querySelector(productLinkSelector);

    if (!link || !isNodeRendered(link, { minWidth: 2, minHeight: 2 })) {
      return null;
    }

    const productUrl = normalizeApi.canonicalizeUrl(link.getAttribute("href"), location.href);
    if (!productUrl) {
      return null;
    }

    const title = pickTitle(cardElement, link);
    if (!title) {
      return null;
    }

    const priceInfo = pickPriceInfo(cardElement, site);
    const brandFromNode =
      cardElement.getAttribute("data-brand") ||
      cardElement.querySelector("[data-brand]")?.getAttribute("data-brand") ||
      "";
    const brand = brandFromNode || normalizeApi.inferBrand(title);

    return {
      sourceId: normalizeApi.buildSourceId(productUrl, site),
      sourceSite: site,
      pageUrl: normalizeApi.canonicalizeUrl(location.href),
      productUrl,
      title,
      displayPriceText: priceInfo.priceText || "",
      displayPriceValue: priceInfo.priceValue,
      displayOriginalPriceText: priceInfo.originalPriceText || "",
      displayOriginalPriceValue: priceInfo.originalPriceValue,
      displayDiscountPercent: priceInfo.discountPercent || "",
      sourcePriceText: priceInfo.priceText || "",
      sourcePriceValue: priceInfo.priceValue,
      sourceOriginalPriceText: priceInfo.originalPriceText || "",
      sourceOriginalPriceValue: priceInfo.originalPriceValue,
      sourceDiscountPercent: priceInfo.discountPercent || "",
      brand: brand || null,
      imageUrl: pickImageUrl(cardElement),
      position,
      guideNumber: position + 1,
      seenAt: Date.now(),
      detailRole: "listing",
      pageSection: "listing"
    };
  }

  function scanListingCards() {
    const context = getPageContext();
    if (!context.isSupported || context.mode !== "listing") {
      return [];
    }

    const links = getProductLinks(context.site);
    const records = [];
    const seenElements = new Set();
    let position = 0;

    for (const link of links) {
      const container = findCardContainer(link, context.site);
      if (!isNodeRendered(container, { minWidth: 80, minHeight: 80 })) {
        continue;
      }
      if (seenElements.has(container)) {
        continue;
      }
      seenElements.add(container);
      const item = extractCardData(container, position, context.site);
      if (!item) {
        continue;
      }
      records.push({
        element: container,
        item
      });
      position += 1;
    }

    return records;
  }

  function textFromDocument(selectors) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const text = normalizeApi.normalizeWhitespace(node?.textContent || "");
      if (text && text.length >= 4) {
        return text;
      }
    }
    return "";
  }

  function contentFromMeta(selector) {
    const content = document.querySelector(selector)?.getAttribute("content") || "";
    return normalizeApi.normalizeWhitespace(content);
  }

  function parseJsonLdNodes() {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    const records = [];

    for (const script of scripts) {
      const raw = script.textContent || "";
      if (!raw.trim()) {
        continue;
      }
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          records.push(...parsed);
        } else {
          records.push(parsed);
        }
      } catch (_error) {
        continue;
      }
    }

    return records;
  }

  function getJsonLdProduct() {
    return parseJsonLdNodes().find((node) => {
      const type = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
      return type.includes("Product");
    }) || null;
  }

  function getNextDataJson() {
    const node = document.getElementById("__NEXT_DATA__");
    if (!node?.textContent) {
      return null;
    }
    try {
      return JSON.parse(node.textContent);
    } catch (_error) {
      return null;
    }
  }

  function pickDigikalaDetailTitle() {
    const title = normalizeApi.cleanProductTitle(
      textFromDocument([
      'h1[data-testid="pdp-product-title"]',
      ".styles_ProductTitle__content__4nE_l h1",
      ".c-product__title h1",
      'h1[class*="ProductTitle"]',
      "main h1"
      ])
    );
    if (title) {
      return title;
    }

    const jsonLdProduct = getJsonLdProduct();
    if (jsonLdProduct?.name) {
      return normalizeApi.cleanProductTitle(jsonLdProduct.name);
    }

    const ogTitle = contentFromMeta('meta[property="og:title"]');
    if (ogTitle) {
      return normalizeApi.cleanProductTitle(ogTitle.replace(/^خرید و قیمت\s*/u, "").trim());
    }

    return normalizeApi.cleanProductTitle(
      normalizeApi.normalizeWhitespace(document.title).replace(/\s*\|\s*دیجیکالا.*$/u, "").trim()
    );
  }

  function pickDigikalaDetailPrice() {
    return pickDigikalaDetailPriceInfo().priceText;
  }

  function pickDigikalaDetailPriceInfo() {
    const strictCurrent = textFromDocument([
      '[data-testid="price-final"]',
      '[data-testid="price-current"]',
      '[data-testid="price-no-discount"]'
    ]);
    const strictOriginal = textFromDocument(DIGIKALA_ORIGINAL_PRICE_SELECTORS);
    const strictDiscount = pickDiscountPercent(document, DIGIKALA_DISCOUNT_PERCENT_SELECTORS);
    const strictCurrentValue = normalizeApi.parsePriceValue(strictCurrent || "");
    if (strictCurrentValue) {
      const strictOriginalValue = normalizeApi.parsePriceValue(strictOriginal || "");
      return {
        priceText: normalizeApi.formatToman(strictCurrentValue),
        priceValue: strictCurrentValue,
        originalPriceText: strictOriginalValue ? normalizeApi.formatToman(strictOriginalValue) : "",
        originalPriceValue: strictOriginalValue,
        discountPercent:
          strictDiscount ||
          (strictOriginalValue && strictOriginalValue > strictCurrentValue
            ? normalizeApi.formatDiscountPercent(
                Math.round(((strictOriginalValue - strictCurrentValue) / strictOriginalValue) * 100)
              )
            : "")
      };
    }

    const addToCartRoot = findDigikalaBuyBoxRoot();
    if (addToCartRoot) {
      const buyBoxPriceInfo = pickPriceInfo(addToCartRoot, "digikala", {
        preferHighestValue: true
      });
      if (buyBoxPriceInfo.priceText) {
        return buyBoxPriceInfo;
      }
    }

    const directInfo = pickPriceInfo(document.querySelector("main") || document.body, "digikala", {
      preferHighestValue: false
    });
    if (directInfo.priceText) {
      return directInfo;
    }

    const jsonLdProduct = getJsonLdProduct();
    const offerPrice =
      jsonLdProduct?.offers?.price ||
      (Array.isArray(jsonLdProduct?.offers) ? jsonLdProduct.offers[0]?.price : null);
    const offerCurrency =
      jsonLdProduct?.offers?.priceCurrency ||
      (Array.isArray(jsonLdProduct?.offers) ? jsonLdProduct.offers[0]?.priceCurrency : null);
    if (offerPrice) {
      const normalizedPrice = normalizeApi.normalizePriceUnit(offerPrice, offerCurrency);
      return {
        priceText: normalizedPrice ? normalizeApi.formatToman(normalizedPrice) : String(offerPrice),
        priceValue: normalizedPrice,
        originalPriceText: "",
        originalPriceValue: null,
        discountPercent: ""
      };
    }

    const fallback = chooseBestPriceText(collectPriceNodes(document.body, PRICE_SELECTORS), {
      preferHighestValue: true
    });
    return {
      priceText: fallback || "",
      priceValue: normalizeApi.parsePriceValue(fallback || ""),
      originalPriceText: "",
      originalPriceValue: null,
      discountPercent: ""
    };
  }

  function pickTorobDetailTitle() {
    const title = normalizeApi.cleanProductTitle(
      textFromDocument([
      "h1",
      '[data-cy="pdp-product-title"]',
      '[data-testid="product-title"]'
      ])
    );
    if (title) {
      return title;
    }

    const jsonLdProduct = getJsonLdProduct();
    if (jsonLdProduct?.name) {
      return normalizeApi.cleanProductTitle(jsonLdProduct.name);
    }

    return normalizeApi.cleanProductTitle(
      contentFromMeta('meta[property="og:title"]').replace(/^خرید و قیمت\s*/u, "").trim()
    );
  }

  function pickTorobDetailPrice() {
    const jsonLdProduct = getJsonLdProduct();
    const offers = Array.isArray(jsonLdProduct?.offers) ? jsonLdProduct.offers : [jsonLdProduct?.offers];
    const firstOffer = offers.find((offer) => offer?.price);
    if (firstOffer?.price) {
      const normalizedPrice = normalizeApi.normalizePriceUnit(firstOffer.price, firstOffer.priceCurrency);
      if (normalizedPrice) {
        return normalizeApi.formatToman(normalizedPrice);
      }
    }

    const buyBoxLink = document.querySelector('a[href*="product-page/redirect"]');
    if (buyBoxLink) {
      const text = normalizeApi.normalizeWhitespace(buyBoxLink.textContent || "");
      const priceMatch = text.match(/([۰-۹0-9][۰-۹0-9\.\,\s٬٫]{3,}\s*(?:تومان|ریال)?)/);
      if (priceMatch) {
        return priceMatch[1];
      }
    }

    return textFromDocument([
      '[data-cy="product-price"]',
      "main [class*='price']",
      "main a[href*='product-page/redirect']"
    ]);
  }

  function pickTorobDetailPriceInfo() {
    const priceText = pickTorobDetailPrice();
    return {
      priceText,
      priceValue: normalizeApi.parsePriceValue(priceText || ""),
      originalPriceText: "",
      originalPriceValue: null,
      discountPercent: ""
    };
  }

  function pickTorobDetailImage() {
    const selectors = [
      'img[alt*="تصویر"]',
      'img[alt*="هواپز"]',
      'img[src*="image.torob.com"]'
    ];

    for (const selector of selectors) {
      const images = Array.from(document.querySelectorAll(selector));
      for (const image of images) {
        const candidate =
          image.currentSrc ||
          image.src ||
          image.getAttribute("data-src") ||
          null;
        const width = image.naturalWidth || image.width || 0;
        const height = image.naturalHeight || image.height || 0;
        if (candidate && (width >= 120 || height >= 120)) {
          return candidate;
        }
      }
    }

    return null;
  }

  function pickDigikalaDetailImage() {
    const selectors = [
      '[data-testid="pdp-gallery-image"] img',
      '[data-testid*="gallery"] img',
      'img[alt*="تصویر"]',
      'img[src*="dkstatics"]',
      "main img"
    ];

    for (const selector of selectors) {
      const images = Array.from(document.querySelectorAll(selector));
      for (const image of images) {
        const candidate =
          image.currentSrc ||
          image.src ||
          image.getAttribute("data-src") ||
          image.getAttribute("srcset")?.split(" ")[0] ||
          null;
        const width = image.naturalWidth || image.width || 0;
        const height = image.naturalHeight || image.height || 0;
        if (candidate && (width >= 120 || height >= 120)) {
          return candidate;
        }
      }
    }

    const jsonLdProduct = getJsonLdProduct();
    if (typeof jsonLdProduct?.image === "string") {
      return jsonLdProduct.image;
    }
    if (Array.isArray(jsonLdProduct?.image) && jsonLdProduct.image[0]) {
      return jsonLdProduct.image[0];
    }

    return null;
  }

  function buildDetailItem(site, title, priceText, imageUrl, position, detailRole) {
    const detailPriceInfo =
      site === "digikala" ? pickDigikalaDetailPriceInfo() : pickTorobDetailPriceInfo();
    return {
      sourceId: normalizeApi.buildSourceId(location.href, site),
      sourceSite: site,
      pageUrl: normalizeApi.canonicalizeUrl(location.href),
      productUrl: normalizeApi.canonicalizeUrl(location.href),
      title,
      displayPriceText: detailPriceInfo.priceText || priceText,
      displayPriceValue:
        detailPriceInfo.priceValue ?? normalizeApi.parsePriceValue(detailPriceInfo.priceText || priceText),
      displayOriginalPriceText: detailPriceInfo.originalPriceText || "",
      displayOriginalPriceValue: detailPriceInfo.originalPriceValue ?? null,
      displayDiscountPercent: detailPriceInfo.discountPercent || "",
      sourcePriceText: detailPriceInfo.priceText || priceText,
      sourcePriceValue:
        detailPriceInfo.priceValue ?? normalizeApi.parsePriceValue(detailPriceInfo.priceText || priceText),
      sourceOriginalPriceText: detailPriceInfo.originalPriceText || "",
      sourceOriginalPriceValue: detailPriceInfo.originalPriceValue ?? null,
      sourceDiscountPercent: detailPriceInfo.discountPercent || "",
      brand: normalizeApi.inferBrand(title),
      imageUrl,
      position,
      guideNumber: position + 1,
      seenAt: Date.now(),
      detailRole,
      pageSection: detailRole === "main" ? "main" : "suggested"
    };
  }

  function findMainDetailRoot(site) {
    const selectors =
      site === "digikala"
        ? [
            'h1[data-testid="pdp-product-title"]',
            '.styles_ProductTitle__content__4nE_l',
            ".c-product__title",
            "main h1"
          ]
        : [
            "h1",
            '[data-cy="pdp-product-title"]',
            '[data-testid="product-title"]'
          ];

    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (!node) {
        continue;
      }
      let current = node;
      let depth = 0;
      while (current && current !== document.body && depth < 6) {
        const rect = current.getBoundingClientRect();
        if (rect.width >= 280 && rect.height >= 180) {
          return current;
        }
        current = current.parentElement;
        depth += 1;
      }
    }

    return document.body;
  }

  function extractSuggestedDetailItems(site, mainSourceId, startPosition) {
    const links = getProductLinks(site);
    const records = [];
    const seenElements = new Set();
    const seenSourceIds = new Set([mainSourceId]);
    let position = startPosition;

    for (const link of links) {
      const container = findCardContainer(link, site);
      if (seenElements.has(container)) {
        continue;
      }
      seenElements.add(container);
      const item = extractCardData(container, position, site);
      if (!item) {
        continue;
      }
      if (seenSourceIds.has(item.sourceId)) {
        continue;
      }
      if (item.productUrl === normalizeApi.canonicalizeUrl(location.href)) {
        continue;
      }
      if (site === "torob" && !container.closest('[data-intro="similar-products"]') && !container.closest(".product-sector")) {
        continue;
      }
      seenSourceIds.add(item.sourceId);
      item.detailRole = "suggested";
      item.pageSection = "suggested";
      item.position = position;
      records.push({
        element: container,
        item
      });
      position += 1;
    }

    return records;
  }

  async function fetchTorobSimilarItems(startPosition) {
    const nextData = getNextDataJson();
    const apiUrl = nextData?.props?.pageProps?.baseProduct?.similar_products;
    if (!apiUrl) {
      return [];
    }

    try {
      const response = await fetch(apiUrl, {
        credentials: "omit"
      });
      if (!response.ok) {
        return [];
      }
      const payload = await response.json();
      const results = Array.isArray(payload?.results) ? payload.results : [];
      const seen = new Set();
      const records = [];
      let position = startPosition;

      for (const entry of results) {
        const productUrl = normalizeApi.canonicalizeUrl(
          entry?.web_client_absolute_url || "",
          "https://torob.com"
        );
        if (!productUrl || productUrl === normalizeApi.canonicalizeUrl(location.href)) {
          continue;
        }
        const sourceId = normalizeApi.buildSourceId(productUrl, "torob");
        if (seen.has(sourceId)) {
          continue;
        }
        seen.add(sourceId);
        const title = normalizeApi.cleanProductTitle(
          entry?.name1 || entry?.name2 || ""
        );
        if (!title) {
          continue;
        }
        records.push({
          element: null,
          item: {
            sourceId,
            sourceSite: "torob",
            pageUrl: normalizeApi.canonicalizeUrl(location.href),
            productUrl,
            title,
            displayPriceText: entry?.price_text || "",
            displayPriceValue: normalizeApi.parsePriceValue(entry?.price_text || ""),
            sourcePriceText: entry?.price_text || "",
            sourcePriceValue: normalizeApi.parsePriceValue(entry?.price_text || ""),
            sourceOriginalPriceText: "",
            sourceOriginalPriceValue: null,
            sourceDiscountPercent: "",
            brand: normalizeApi.inferBrand(title),
            imageUrl: entry?.image_url || null,
            position,
            guideNumber: position + 1,
            seenAt: Date.now(),
            detailRole: "suggested",
            pageSection: "suggested"
          }
        });
        position += 1;
      }

      return records;
    } catch (_error) {
      return [];
    }
  }

  async function extractDetailItem(site) {
    if (site === "digikala") {
      const title = pickDigikalaDetailTitle();
      if (!title) {
        return [];
      }
      const priceInfo = pickDigikalaDetailPriceInfo();
      const mainItem = buildDetailItem(
        site,
        title,
        priceInfo.priceText,
        pickDigikalaDetailImage() || pickImageUrl(document),
        0,
        "main"
      );
      const records = [
        {
          element: findMainDetailRoot(site),
          item: mainItem
        }
      ];
      return records.concat(extractSuggestedDetailItems(site, mainItem.sourceId, 1));
    }

    if (site === "torob") {
      const title = pickTorobDetailTitle();
      if (!title) {
        return [];
      }
      const priceText = pickTorobDetailPrice();
      const mainItem = buildDetailItem(
        site,
        title,
        priceText,
        pickTorobDetailImage(),
        0,
        "main"
      );
      const records = [
        {
          element: findMainDetailRoot(site),
          item: mainItem
        }
      ];
      const domSuggested = extractSuggestedDetailItems(site, mainItem.sourceId, 1);
      if (domSuggested.length) {
        return records.concat(domSuggested);
      }
      const apiSuggested = await fetchTorobSimilarItems(1);
      return records.concat(apiSuggested);
    }

    return [];
  }

  function chooseBestPriceText(nodes, options) {
    const candidates = [];
    const preferHighestValue = Boolean(options?.preferHighestValue);
    let candidateIndex = 0;

    for (const node of nodes || []) {
      if (isIgnoredNode(node)) {
        continue;
      }
      const text = nodeText(node);
      if (!text) {
        continue;
      }
      const extracted = extractPriceCandidates(text);
      for (const candidate of extracted) {
        candidate.index = candidateIndex;
        candidates.push(candidate);
        candidateIndex += 1;
      }
    }

    if (!candidates.length) {
      return "";
    }

    candidates.sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }
      if (preferHighestValue && left.value !== right.value) {
        return right.value - left.value;
      }
      if (!preferHighestValue && left.hasCurrency !== right.hasCurrency) {
        return Number(right.hasCurrency) - Number(left.hasCurrency);
      }
      if (preferHighestValue && left.value !== right.value) {
        return right.value - left.value;
      }
      return left.index - right.index;
    });

    return candidates[0]?.text || "";
  }

  function extractPriceCandidates(text) {
    const normalized = normalizeApi.normalizeWhitespace(text);
    if (!normalized) {
      return [];
    }

    const candidates = [];
    const seen = new Set();
    const currencyRegex = /([۰-۹0-9]{1,3}(?:[٬٫,.][۰-۹0-9]{3})+|[۰-۹0-9]{6,})\s*(تومان|ریال)/gu;
    let match;

    while ((match = currencyRegex.exec(normalized))) {
      pushPriceCandidate(candidates, seen, `${match[1]} ${match[2]}`, normalized);
    }

    if (!candidates.length) {
      const numericRegex = /([۰-۹0-9]{1,3}(?:[٬٫,.][۰-۹0-9]{3})+|[۰-۹0-9]{6,})/gu;
      while ((match = numericRegex.exec(normalized))) {
        pushPriceCandidate(candidates, seen, match[1], normalized);
      }
    }

    return candidates;
  }

  function pushPriceCandidate(target, seen, rawText, contextText) {
    const text = normalizeApi.normalizeWhitespace(rawText);
    if (!text || seen.has(text)) {
      return;
    }
    if (BAD_PRICE_PATTERNS.some((pattern) => pattern.test(contextText))) {
      if (!/(تومان|ریال)/.test(text)) {
        return;
      }
    }
    const value = normalizeApi.parsePriceValue(text);
    if (!Number.isFinite(value) || value < 10000) {
      return;
    }
    const score =
      (/(تومان|ریال)/.test(text) ? 20 : 0) +
      (value >= 1000000 ? 8 : 0) +
      (BAD_PRICE_PATTERNS.some((pattern) => pattern.test(contextText)) ? -6 : 0) +
      (text.length >= 8 ? 2 : 0);
    seen.add(text);
    target.push({
      text,
      value,
      hasCurrency: /(تومان|ریال)/.test(text),
      score
    });
  }

  function findDigikalaBuyBoxRoot() {
    const targets = Array.from(document.querySelectorAll("button, a, div, span")).filter((node) => {
      const text = normalizeApi.normalizeWhitespace(node.textContent || "");
      return /افزودن\s+به\s+سبد\s+خرید/u.test(text);
    });

    for (const node of targets) {
      let current = node;
      let depth = 0;
      while (current && current !== document.body && depth < 7) {
        const rect = current.getBoundingClientRect();
        if (rect.width >= 180 && rect.height >= 180) {
          return current;
        }
        current = current.parentElement;
        depth += 1;
      }
    }

    return null;
  }

  function pickPriceInfo(root, site, options) {
    const currentSelectors =
      site === "digikala" ? DIGIKALA_CURRENT_PRICE_SELECTORS : TOROB_CURRENT_PRICE_SELECTORS;
    const originalSelectors = site === "digikala" ? DIGIKALA_ORIGINAL_PRICE_SELECTORS : [];
    const discountSelectors = site === "digikala" ? DIGIKALA_DISCOUNT_PERCENT_SELECTORS : [];
    const preferHighestValue = Boolean(options?.preferHighestValue);

    const priceText =
      chooseBestPriceText(collectPriceNodes(root, currentSelectors), {
        preferHighestValue
      }) ||
      chooseBestPriceText(collectPriceNodes(root, PRICE_SELECTORS), {
        preferHighestValue
      });
    const originalPriceText =
      site === "digikala"
        ? chooseBestPriceText(collectPriceNodes(root, originalSelectors), {
            preferHighestValue: true
          })
        : "";
    let discountPercent = pickDiscountPercent(root, discountSelectors);
    const priceValue = normalizeApi.parsePriceValue(priceText || "");
    const originalPriceValue = normalizeApi.parsePriceValue(originalPriceText || "");

    if (!discountPercent && Number.isFinite(priceValue) && Number.isFinite(originalPriceValue) && originalPriceValue > priceValue) {
      const computed = Math.round(((originalPriceValue - priceValue) / originalPriceValue) * 100);
      discountPercent = normalizeApi.formatDiscountPercent(computed);
    }

    return {
      priceText: priceText || "",
      priceValue,
      originalPriceText: originalPriceText || "",
      originalPriceValue,
      discountPercent: discountPercent || ""
    };
  }

  function collectPriceNodes(root, selectors) {
    const nodes = [];
    const seen = new Set();
    if (!(root instanceof Element || root === document.body || root === document)) {
      return nodes;
    }
    for (const selector of selectors || []) {
      root.querySelectorAll(selector).forEach((node) => {
        if (!(node instanceof Element) || isIgnoredNode(node) || seen.has(node)) {
          return;
        }
        seen.add(node);
        nodes.push(node);
      });
    }
    return nodes;
  }

  function pickDiscountPercent(root, selectors) {
    for (const selector of selectors || []) {
      const nodes = root.querySelectorAll(selector);
      for (const node of nodes) {
        if (isIgnoredNode(node)) {
          continue;
        }
        const text = nodeText(node);
        const parsed = normalizeApi.parseDiscountPercent(text);
        if (Number.isFinite(parsed)) {
          return normalizeApi.formatDiscountPercent(parsed);
        }
      }
    }
    return "";
  }

  function isIgnoredNode(node) {
    return Boolean(node?.closest?.(DIROB_IGNORE_SELECTOR));
  }

  function isNodeRendered(node, options = {}) {
    if (!(node instanceof Element) || !node.isConnected || isIgnoredNode(node)) {
      return false;
    }
    const style = window.getComputedStyle(node);
    if (!style || style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") {
      return false;
    }
    const minWidth = Number.isFinite(options.minWidth) ? options.minWidth : 1;
    const minHeight = Number.isFinite(options.minHeight) ? options.minHeight : 1;
    const rect = node.getBoundingClientRect();
    if (!Number.isFinite(rect.width) || !Number.isFinite(rect.height)) {
      return false;
    }
    if (rect.width < minWidth || rect.height < minHeight) {
      return false;
    }
    return true;
  }

  function nodeText(node) {
    return normalizeApi.normalizeWhitespace(node?.textContent || "");
  }

  async function scanPageItems() {
    const context = getPageContext();
    if (!context.isSupported) {
      return [];
    }

    if (context.mode === "detail") {
      return extractDetailItem(context.site);
    }

    return scanListingCards();
  }

  globalThis.DirobListingExtractor = {
    getPageContext,
    scanListingCards,
    scanPageItems,
    extractCardData
  };
})();
