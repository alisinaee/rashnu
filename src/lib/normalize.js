(function () {
  "use strict";

  const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  const GENERIC_STOPWORDS = new Set([
    "اصل",
    "اورجینال",
    "خرید",
    "مدل",
    "با",
    "برای",
    "همراه",
    "جدید",
    "اوریجینال",
    "تومان",
    "ریال",
    "کالا",
    "محصول",
    "فروش",
    "قیمت"
  ]);
  const BRAND_ALIASES = new Map([
    ["samsung", "samsung"],
    ["سامسونگ", "samsung"],
    ["xiaomi", "xiaomi"],
    ["شیائومی", "xiaomi"],
    ["mi", "xiaomi"],
    ["redmi", "xiaomi"],
    ["apple", "apple"],
    ["اپل", "apple"],
    ["iphone", "apple"],
    ["philips", "philips"],
    ["فیلیپس", "philips"],
    ["lg", "lg"],
    ["ال جی", "lg"],
    ["پاکشوما", "pakshoma"],
    ["pakshoma", "pakshoma"],
    ["bosch", "bosch"],
    ["بوش", "bosch"],
    ["asus", "asus"],
    ["ایسوس", "asus"],
    ["lenovo", "lenovo"],
    ["لنوو", "lenovo"],
    ["dell", "dell"],
    ["دل", "dell"],
    ["sony", "sony"],
    ["سونی", "sony"],
    ["nike", "nike"],
    ["نایک", "nike"],
    ["adidas", "adidas"],
    ["آدیداس", "adidas"],
    ["tcl", "tcl"],
    ["تی سی ال", "tcl"],
    ["haier", "haier"],
    ["هایر", "haier"],
    ["gplus", "gplus"],
    ["جی پلاس", "gplus"],
    ["هاردستون", "hardstone"],
    ["hardstone", "hardstone"],
    ["panasonic", "panasonic"],
    ["پاناسونیک", "panasonic"],
    ["midea", "midea"],
    ["مدیا", "midea"]
  ]);
  const TITLE_NOISE_PATTERNS = [
    /^\s*آگهی\s*\d*\s*/u,
    /^\s*تصویر\s+/u,
    /^\s*\d{1,2}\s*(?=[A-Za-zآ-ی])/u,
    /\s+\d{1,2}\s*:\s*\d{1,2}\s*:\s*\d{1,2}\s*$/u,
    /\s+\d{1,2}\s*:\s*\d{1,2}\s*$/u,
    /\s+\d{1,2}٪\s*$/u,
    /\s+\d{1,2}%\s*$/u,
    /\s+%?\s*فروش\s+رفته.*$/u,
    /\s+از\s+[۰-۹0-9][۰-۹0-9.,٬٫\s]*\s*(?:تومان|ریال)?(?:\s+در\s+فروشگاه\s+\d+)?\s*$/u,
    /\s+[۰-۹0-9][۰-۹0-9.,٬٫\s]{5,}\s*(?:تومان|ریال)\s*$/u,
    /\s+در\s+(?:فروشگاه|مهرمال|دیجی\s*کالا|تورب|ترب|باسلام|اپل\s*استور|تکنوکلاینت).+$/u,
    /\s+در\s+فروشگاه\s+\d+\s*$/u,
    /\s+بدون\s+تطابق\s+قطعی\s*$/u,
    /\s+فروشگاه\s+\d+\s*$/u,
    /\s+امتیاز\s+\d+(?:[.,]\d+)?\s*$/u,
    /\s+\d+(?:[.,]\d+)?\s*ستاره\s*$/u,
    /\s+پرسش.*$/u,
    /\s+دیدگاه.*$/u,
    /\s+نظر.*$/u
  ];

  function replacePersianVariants(value) {
    return String(value || "")
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/ۀ/g, "ه")
      .replace(/ة/g, "ه")
      .replace(/ـ/g, " ");
  }

  function normalizeDigits(value) {
    return String(value || "")
      .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
  }

  function normalizeWhitespace(value) {
    return String(value || "")
      .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
      .replace(/&zwnj;|&#8204;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeText(value) {
    const normalized = normalizeWhitespace(
      normalizeDigits(replacePersianVariants(value))
        .toLowerCase()
        .replace(/[\u200c\u200f]/g, " ")
        .replace(/[|/\\()[\]{}،,:;؛"'`~!@#$%^&*_+=<>?]/g, " ")
    );

    return normalized;
  }

  function cleanProductTitle(value) {
    let cleaned = normalizeWhitespace(replacePersianVariants(value || ""));
    if (!cleaned) {
      return "";
    }

    for (const pattern of TITLE_NOISE_PATTERNS) {
      cleaned = cleaned.replace(pattern, " ");
    }

    cleaned = cleaned
      .replace(/\s*تصویر\s+/gu, " ")
      .replace(/\s+از\s+[۰-۹0-9][۰-۹0-9.,٬٫\s]*\s*(?:تومان|ریال)\s*(?:در\s+\S+.*)?/gu, " ")
      .replace(/\s*[۰-۹0-9][۰-۹0-9.,٬٫\s]{5,}\s*(?:تومان|ریال)\s*(?:در\s+\S+.*)?/gu, " ")
      .replace(/\s*در\s+فروشگاه\s+\d+/gu, " ")
      .replace(/\s*(?:امتیاز|دیدگاه|پرسش)\s+[۰-۹0-9.,]+/gu, " ")
      .replace(/\s*[۰-۹0-9]{1,2}\s*:\s*[۰-۹0-9]{1,2}(?::\s*[۰-۹0-9]{1,2})?/gu, " ")
      .replace(/\s*[۰-۹0-9]{1,2}\s*[%٪]/gu, " ")
      .replace(/\s*فروش\s+رفته/gu, " ")
      .replace(/\s*[\-||]+\s*نامشخص\s*$/u, " ")
      .replace(/\s+/g, " ")
      .trim();

    return cleaned;
  }

  function tokenize(value) {
    return normalizeText(value)
      .split(" ")
      .map((token) => token.trim())
      .filter(Boolean);
  }

  function splitTokens(value) {
    const tokens = tokenize(value);
    const numericTokens = [];
    const textTokens = [];

    for (const token of tokens) {
      if (/^\d+$/.test(token)) {
        numericTokens.push(token);
      } else {
        textTokens.push(token);
      }
    }

    return {
      tokens,
      textTokens,
      numericTokens
    };
  }

  function filterMeaningfulTokens(tokens) {
    return (tokens || []).filter(
      (token) => token && token.length > 1 && !GENERIC_STOPWORDS.has(token)
    );
  }

  function parsePriceValue(value) {
    const normalized = normalizeWhitespace(normalizeDigits(replacePersianVariants(value || "")));
    if (!normalized) {
      return null;
    }

    const decimalCurrencyMatch = normalized.match(
      /(?:[$€£]|usd|eur|gbp)\s*([0-9][0-9,.\s٬٫]*)/i
    );
    if (decimalCurrencyMatch?.[1]) {
      const decimalRaw = decimalCurrencyMatch[1]
        .replace(/[٬\s]/g, "")
        .replace(/,/g, "");
      const decimalValue = Number(decimalRaw);
      if (Number.isFinite(decimalValue) && decimalValue > 0) {
        return Math.round(decimalValue);
      }
    }

    const candidates = [];
    const groupedNumberRegex = /[0-9]{1,3}(?:[٬٫,.\s][0-9]{3})+(?:[.,][0-9]{1,2})?/g;
    let groupedMatch;
    while ((groupedMatch = groupedNumberRegex.exec(normalized))) {
      let token = groupedMatch[0]
        .replace(/[٬\s]/g, "")
        .trim();
      token = token.replace(/([.,])[0-9]{1,2}$/g, "");
      const digits = token.replace(/[^\d]/g, "");
      const parsed = Number.parseInt(digits, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        candidates.push(parsed);
      }
    }

    if (!candidates.length) {
      const plainNumberRegex = /[0-9]{2,}/g;
      let plainMatch;
      while ((plainMatch = plainNumberRegex.exec(normalized))) {
        const parsed = Number.parseInt(plainMatch[0], 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          candidates.push(parsed);
        }
      }
    }

    if (!candidates.length) {
      return null;
    }
    return Math.max(...candidates);
  }

  function normalizePriceUnit(value, currencyHint) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    const normalizedCurrency = normalizeText(currencyHint);
    if (normalizedCurrency === "irr" || normalizedCurrency === "rial" || normalizedCurrency === "ریال") {
      return Math.round(parsed / 10);
    }

    return Math.round(parsed);
  }

  function formatToman(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return "";
    }
    try {
      return `${new Intl.NumberFormat("fa-IR").format(parsed)} تومان`;
    } catch (_error) {
      return `${parsed} تومان`;
    }
  }

  function parseDiscountPercent(value) {
    const parsed = parsePriceValue(value);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 99) {
      return null;
    }
    return parsed;
  }

  function formatDiscountPercent(value) {
    const parsed = parseDiscountPercent(value);
    if (!Number.isFinite(parsed)) {
      return "";
    }
    try {
      return `${new Intl.NumberFormat("fa-IR").format(parsed)}٪`;
    } catch (_error) {
      return `${parsed}%`;
    }
  }

  function canonicalizeUrl(url, baseUrl) {
    try {
      const target = new URL(url, baseUrl || location.href);
      target.hash = "";
      const unwanted = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term"
      ];
      unwanted.forEach((key) => target.searchParams.delete(key));
      return target.toString();
    } catch (_error) {
      return "";
    }
  }

  function extractProductIdFromUrl(url) {
    const match = String(url || "").match(/\/product\/dkp-(\d+)\//i);
    return match ? match[1] : null;
  }

  function extractTorobProductKey(url) {
    const match = String(url || "").match(/\/p\/([^/]+)\//i);
    return match ? match[1] : null;
  }

  function extractTechnolifeProductIdFromUrl(url) {
    const match = String(url || "").match(/\/product-(\d+)(?:\/|$)/i);
    return match ? match[1] : null;
  }

  function extractEmallsProductIdFromUrl(url) {
    const match = String(url || "").match(/~id~(\d+)(?:\/|$)?/i);
    return match ? match[1] : null;
  }

  function extractAmazonAsinFromUrl(url) {
    const match = String(url || "").match(/\/(?:dp|gp\/(?:aw\/d|product))\/([A-Z0-9]{10})(?:[/?]|$)/i);
    return match ? match[1].toUpperCase() : null;
  }

  function extractEbayItemIdFromUrl(url) {
    const match = String(url || "").match(/\/itm\/(\d+)(?:[/?]|$)/i);
    return match ? match[1] : null;
  }

  function buildSourceId(productUrl, site) {
    const canonicalUrl = canonicalizeUrl(productUrl);
    if (site === "digikala") {
      const productId = extractProductIdFromUrl(canonicalUrl);
      return productId ? `digikala:${productId}` : `digikala:${canonicalUrl}`;
    }

    if (site === "torob") {
      const productKey = extractTorobProductKey(canonicalUrl);
      return productKey ? `torob:${productKey}` : `torob:${canonicalUrl}`;
    }

    if (site === "technolife") {
      const productId = extractTechnolifeProductIdFromUrl(canonicalUrl);
      return productId ? `technolife:${productId}` : `technolife:${canonicalUrl}`;
    }

    if (site === "emalls") {
      const productId = extractEmallsProductIdFromUrl(canonicalUrl);
      return productId ? `emalls:${productId}` : `emalls:${canonicalUrl}`;
    }

    if (site === "amazon") {
      const asin = extractAmazonAsinFromUrl(canonicalUrl);
      return asin ? `amazon:${asin}` : `amazon:${canonicalUrl}`;
    }

    if (site === "ebay") {
      const itemId = extractEbayItemIdFromUrl(canonicalUrl);
      return itemId ? `ebay:${itemId}` : `ebay:${canonicalUrl}`;
    }

    return canonicalUrl;
  }

  function inferBrand(value) {
    const normalized = normalizeText(value);
    if (!normalized) {
      return null;
    }

    for (const [alias, canonicalBrand] of BRAND_ALIASES.entries()) {
      if (normalized.includes(alias)) {
        return canonicalBrand;
      }
    }

    return null;
  }

  function buildSearchQuery(value) {
    const cleaned = cleanProductTitle(value);
    const { textTokens, numericTokens } = splitTokens(cleaned);
    const filteredNumericTokens = (numericTokens || []).filter((token) => token.length <= 5);
    return [...filterMeaningfulTokens(textTokens), ...filteredNumericTokens].join(" ").trim();
  }

  function buildTorobSearchUrl(query) {
    const url = new URL("https://torob.com/search/");
    url.searchParams.set("query", normalizeWhitespace(valueOrFallback(query)));
    return url.toString();
  }

  function buildDigikalaSearchUrl(query) {
    const url = new URL("https://www.digikala.com/search/");
    url.searchParams.set("q", normalizeWhitespace(valueOrFallback(query)));
    return url.toString();
  }

  function buildTechnolifeSearchUrl(query) {
    const url = new URL("https://www.technolife.com/product/list/search");
    url.searchParams.set("keywords", normalizeWhitespace(valueOrFallback(query)));
    return url.toString();
  }

  function buildEmallsSearchUrl(query) {
    const normalizedQuery = normalizeWhitespace(valueOrFallback(query));
    return `https://emalls.ir/لیست-قیمت~skey~${encodeURIComponent(normalizedQuery)}`;
  }

  function buildAmazonSearchUrl(query) {
    const url = new URL("https://www.amazon.com/s");
    url.searchParams.set("k", normalizeWhitespace(valueOrFallback(query)));
    return url.toString();
  }

  function buildEbaySearchUrl(query) {
    const url = new URL("https://www.ebay.com/sch/i.html");
    url.searchParams.set("_nkw", normalizeWhitespace(valueOrFallback(query)));
    return url.toString();
  }

  function buildGoogleSearchUrl(query) {
    const url = new URL("https://www.google.com/search");
    url.searchParams.set("q", normalizeWhitespace(valueOrFallback(query)));
    return url.toString();
  }

  function getSiteLabel(site) {
    switch (site) {
      case "digikala":
        return "دیجیکالا";
      case "torob":
        return "ترب";
      case "technolife":
        return "تکنولایف";
      case "emalls":
        return "ایمالز";
      case "amazon":
        return "آمازون";
      case "ebay":
        return "ای‌بِی";
      default:
        return "نامشخص";
    }
  }

  function valueOrFallback(value) {
    return String(value || "").trim();
  }

  globalThis.DirobNormalize = {
    GENERIC_STOPWORDS,
    normalizeDigits,
    normalizeText,
    normalizeWhitespace,
    cleanProductTitle,
    tokenize,
    splitTokens,
    filterMeaningfulTokens,
    parsePriceValue,
    normalizePriceUnit,
    formatToman,
    parseDiscountPercent,
    formatDiscountPercent,
    canonicalizeUrl,
    extractProductIdFromUrl,
    extractTorobProductKey,
    extractTechnolifeProductIdFromUrl,
    extractEmallsProductIdFromUrl,
    extractAmazonAsinFromUrl,
    extractEbayItemIdFromUrl,
    buildSourceId,
    inferBrand,
    buildSearchQuery,
    buildTorobSearchUrl,
    buildDigikalaSearchUrl,
    buildTechnolifeSearchUrl,
    buildEmallsSearchUrl,
    buildAmazonSearchUrl,
    buildEbaySearchUrl,
    buildGoogleSearchUrl,
    getSiteLabel
  };
})();
