(function () {
  "use strict";

  const normalizeApi = globalThis.DirobNormalize;

  function safeSet(tokens) {
    return new Set(tokens || []);
  }

  function intersectionSize(left, right) {
    let count = 0;
    for (const token of left) {
      if (right.has(token)) {
        count += 1;
      }
    }
    return count;
  }

  function ratio(leftSet, rightSet) {
    const union = new Set([...leftSet, ...rightSet]).size;
    if (!union) {
      return 0;
    }
    return intersectionSize(leftSet, rightSet) / union;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeCandidate(rawCandidate) {
    const title = [rawCandidate.name1, rawCandidate.name2, rawCandidate.title]
      .filter(Boolean)
      .join(" | ")
      .trim();
    const targetUrl = rawCandidate.web_client_absolute_url
      ? new URL(rawCandidate.web_client_absolute_url, "https://torob.com").toString()
      : rawCandidate.torobUrl ||
        rawCandidate.targetUrl ||
        rawCandidate.productUrl ||
        rawCandidate.url ||
        null;

    return {
      title,
      priceText: rawCandidate.price_text || rawCandidate.priceText || "",
      priceValue:
        rawCandidate.price ||
        normalizeApi.parsePriceValue(rawCandidate.price_text || rawCandidate.priceText),
      targetSite: rawCandidate.targetSite || rawCandidate.site || "torob",
      targetUrl,
      moreInfoUrl: rawCandidate.more_info_url || rawCandidate.moreInfoUrl || null,
      randomKey: rawCandidate.random_key || rawCandidate.randomKey || null,
      shopText: rawCandidate.shop_text || rawCandidate.shopText || "",
      sellerCount:
        rawCandidate.sellerCount ||
        parseSellerCount(rawCandidate.shop_text || rawCandidate.shopText || ""),
      rawSource: {
        name1: rawCandidate.name1 || "",
        name2: rawCandidate.name2 || "",
        price_text: rawCandidate.price_text || "",
        shop_text: rawCandidate.shop_text || "",
        more_info_url: rawCandidate.more_info_url || "",
        web_client_absolute_url: rawCandidate.web_client_absolute_url || "",
        target_url: targetUrl || ""
      }
    };
  }

  function parseSellerCount(value) {
    const parsed = normalizeApi.parsePriceValue(value);
    return parsed == null ? null : parsed;
  }

  function extractMoreInfoParams(url) {
    try {
      const target = new URL(url);
      return {
        prk: target.searchParams.get("prk"),
        searchId: target.searchParams.get("search_id")
      };
    } catch (_error) {
      return {
        prk: null,
        searchId: null
      };
    }
  }

  function scoreCandidate(item, candidate) {
    const itemNormalized = normalizeApi.normalizeText(item.title);
    const candidateNormalized = normalizeApi.normalizeText(candidate.title);
    const itemSplit = normalizeApi.splitTokens(item.title);
    const candidateSplit = normalizeApi.splitTokens(candidate.title);
    const itemTokens = safeSet(normalizeApi.filterMeaningfulTokens(itemSplit.textTokens));
    const candidateTokens = safeSet(
      normalizeApi.filterMeaningfulTokens(candidateSplit.textTokens)
    );
    const itemNumeric = safeSet(itemSplit.numericTokens);
    const candidateNumeric = safeSet(candidateSplit.numericTokens);
    const itemBrand = item.brand || normalizeApi.inferBrand(item.title);
    const candidateBrand = normalizeApi.inferBrand(candidate.title);
    const overlap = ratio(itemTokens, candidateTokens);
    const numericOverlap = ratio(itemNumeric, candidateNumeric);
    const rareItemTokens = safeSet(
      [...itemTokens].filter((token) => token.length >= 4 && !/^[a-z]$/i.test(token))
    );
    const rareCandidateTokens = safeSet(
      [...candidateTokens].filter((token) => token.length >= 4 && !/^[a-z]$/i.test(token))
    );
    const rareOverlap = ratio(rareItemTokens, rareCandidateTokens);
    const contains =
      itemNormalized.includes(candidateNormalized) || candidateNormalized.includes(itemNormalized);
    const itemOnlyNumeric = itemNumeric.size > 0;
    const candidateOnlyNumeric = candidateNumeric.size > 0;
    let score = 0.08;
    const reasons = [];

    if (itemNormalized && candidateNormalized && itemNormalized === candidateNormalized) {
      score += 0.42;
      reasons.push("exact_title");
    }

    if (contains) {
      score += 0.12;
      reasons.push("title_containment");
    }

    score += overlap * 0.38;
    if (overlap > 0.2) {
      reasons.push("token_overlap");
    }

    score += rareOverlap * 0.16;
    if (rareOverlap > 0.15) {
      reasons.push("rare_overlap");
    }

    if (itemOnlyNumeric && candidateOnlyNumeric) {
      if (numericOverlap === 0) {
        score -= 0.28;
        reasons.push("numeric_conflict");
      } else {
        score += numericOverlap * 0.28;
        reasons.push("numeric_overlap");
      }
    }

    if (itemBrand && candidateBrand) {
      if (itemBrand === candidateBrand) {
        score += 0.12;
        reasons.push("brand_match");
      } else {
        score -= 0.22;
        reasons.push("brand_conflict");
      }
    }

    if (itemTokens.size && candidateTokens.size) {
      const overlapCount = intersectionSize(itemTokens, candidateTokens);
      if (overlapCount <= 1 && Math.abs(itemTokens.size - candidateTokens.size) >= 4) {
        score -= 0.12;
        reasons.push("token_loss");
      }
    }

    return {
      confidence: clamp(Number(score.toFixed(4)), 0, 1),
      reasons
    };
  }

  function rankCandidates(item, rawCandidates) {
    return (rawCandidates || [])
      .map(normalizeCandidate)
      .map((candidate) => {
        const scoring = scoreCandidate(item, candidate);
        return {
          ...candidate,
          confidence: scoring.confidence,
          reasons: scoring.reasons
        };
      })
      .sort((left, right) => right.confidence - left.confidence);
  }

  function classifyTopCandidate(candidates) {
    if (!candidates.length) {
      return {
        status: "not_found",
        reason: "no_results"
      };
    }

    const top = candidates[0];
    if (top.confidence >= 0.72) {
      return {
        status: "matched",
        reason: top.reasons[0] || "score_match"
      };
    }

    if (top.confidence >= 0.45) {
      return {
        status: "low_confidence",
        reason: top.reasons[0] || "low_score"
      };
    }

    return {
      status: "not_found",
      reason: "score_below_threshold"
    };
  }

  globalThis.DirobMatch = {
    normalizeCandidate,
    extractMoreInfoParams,
    rankCandidates,
    classifyTopCandidate
  };
})();
