import { getCatalogProducts } from "../catalog/catalog-service.js";

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function toRecommendationItem(product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    price: product.price,
    size: product.size,
    color: product.color,
    thumbnail: product.thumbnail,
  };
}

function buildCatalogBySlug(products) {
  return new Map(products.map((product) => [normalizeText(product.slug), product]));
}

function buildBaselineCandidates(products, currentProduct) {
  return products
    .filter((product) => normalizeText(product.slug) !== normalizeText(currentProduct.slug))
    .map((product) => ({
      product,
      sameCategory: normalizeText(product.category) === normalizeText(currentProduct.category),
      priceDistance: Math.abs(product.price - currentProduct.price),
    }))
    .sort((left, right) => {
      if (left.sameCategory !== right.sameCategory) {
        return left.sameCategory ? -1 : 1;
      }

      if (left.priceDistance !== right.priceDistance) {
        return left.priceDistance - right.priceDistance;
      }

      return left.product.slug.localeCompare(right.product.slug);
    });
}

function extractViewedSignals(products, viewed) {
  if (!Array.isArray(viewed) || viewed.length === 0) {
    return {
      viewedCategories: [],
      viewedSlugs: [],
    };
  }

  const catalogBySlug = buildCatalogBySlug(products);
  const viewedCategories = [];
  const viewedSlugs = [];

  for (const value of viewed) {
    const slug = normalizeText(value);
    const product = catalogBySlug.get(slug);
    if (!product) {
      continue;
    }

    if (!viewedSlugs.includes(slug)) {
      viewedSlugs.push(slug);
    }

    const category = normalizeText(product.category);
    if (category && !viewedCategories.includes(category)) {
      viewedCategories.push(category);
    }
  }

  return {
    viewedCategories,
    viewedSlugs,
  };
}

function getTryOnSignals(tryOnSnapshot) {
  const preferredSize = normalizeText(tryOnSnapshot?.variantContext?.size ?? tryOnSnapshot?.variantContext?.variantSize ?? "");
  const preferredColor = normalizeText(tryOnSnapshot?.variantContext?.color ?? tryOnSnapshot?.variantContext?.variantColor ?? "");
  const preferredVariantId = normalizeText(tryOnSnapshot?.variantContext?.variantId ?? "");
  const hasTryOnImage = typeof tryOnSnapshot?.tryOnImageUrl === "string" && tryOnSnapshot.tryOnImageUrl.trim() !== "";
  const hasTryOnSignal = Boolean(preferredSize || preferredColor || preferredVariantId || hasTryOnImage);

  return {
    hasTryOnSignal,
    preferredSize,
    preferredColor,
    preferredVariantId,
  };
}

function scoreCandidate(candidate, signals) {
  let score = 0;

  if (signals.viewedCategories.includes(normalizeText(candidate.product.category))) {
    score += 40;
  }

  if (signals.viewedSlugs.includes(normalizeText(candidate.product.slug))) {
    score += 10;
  }

  if (signals.hasTryOnSignal) {
    score += 5;

    if (signals.preferredSize && normalizeText(candidate.product.size) === signals.preferredSize) {
      score += 15;
    }

    if (signals.preferredColor && normalizeText(candidate.product.color) === signals.preferredColor) {
      score += 10;
    }

    if (signals.preferredVariantId && normalizeText(candidate.product.id) === signals.preferredVariantId) {
      score += 5;
    }
  }

  return score;
}

function applyPersonalization(candidates, signals) {
  return [...candidates].sort((left, right) => {
    const leftScore = scoreCandidate(left, signals);
    const rightScore = scoreCandidate(right, signals);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    if (left.sameCategory !== right.sameCategory) {
      return left.sameCategory ? -1 : 1;
    }

    if (left.priceDistance !== right.priceDistance) {
      return left.priceDistance - right.priceDistance;
    }

    return left.product.slug.localeCompare(right.product.slug);
  });
}

export async function getProductRecommendations(
  { productSlug, limit, viewed, tryOnSnapshot },
  { catalogProducts } = {},
) {
  const fallbackCatalog = await getCatalogProducts({
    category: "",
    keyword: "",
    size: "",
    color: "",
    minPrice: null,
    maxPrice: null,
    page: 1,
    pageSize: 1000,
  });
  const products = (catalogProducts ?? fallbackCatalog.items).filter(
    (product) => product.isActive ?? true,
  );
  const normalizedProductSlug = normalizeText(productSlug);
  const currentProduct = products.find((product) => normalizeText(product.slug) === normalizedProductSlug);

  if (!currentProduct) {
    return {
      success: false,
      state: "error",
      code: "RECOMMENDATION_NOT_FOUND",
      message: "Không tìm thấy sản phẩm để tạo danh sách gợi ý.",
    };
  }

  const baseline = buildBaselineCandidates(products, currentProduct);
  const viewedSignals = extractViewedSignals(products, viewed);
  const tryOnSignals = getTryOnSignals(tryOnSnapshot);

  const signals = {
    ...viewedSignals,
    ...tryOnSignals,
  };

  const signalsUsed = [];
  if (viewedSignals.viewedCategories.length > 0 || viewedSignals.viewedSlugs.length > 0) {
    signalsUsed.push("viewed");
  }
  if (tryOnSignals.hasTryOnSignal) {
    signalsUsed.push("try-on-session");
  }

  const hasPersonalizationSignals = signalsUsed.length > 0;
  const rankedCandidates = hasPersonalizationSignals ? applyPersonalization(baseline, signals) : baseline;
  const safeLimit = Number.isSafeInteger(limit) ? Math.min(Math.max(limit, 5), 12) : 5;
  const items = rankedCandidates.slice(0, safeLimit).map(({ product }) => toRecommendationItem(product));

  return {
    success: true,
    state: hasPersonalizationSignals ? "success" : "fallback",
    data: {
      items,
      strategy: hasPersonalizationSignals ? "baseline-personalized" : "baseline",
      signalsUsed,
    },
  };
}
