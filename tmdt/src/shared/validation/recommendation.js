const DEFAULT_LIMIT = 5;
const MIN_LIMIT = 5;
const MAX_LIMIT = 12;
const MAX_VIEWED_ITEMS = 20;

function parseLimit(rawLimit) {
  if (rawLimit === null || rawLimit === undefined || rawLimit === "") {
    return { success: true, value: DEFAULT_LIMIT };
  }

  const normalized = String(rawLimit).trim();
  if (!/^[1-9]\d*$/.test(normalized)) {
    return { success: false };
  }

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed < MIN_LIMIT || parsed > MAX_LIMIT) {
    return { success: false };
  }

  return { success: true, value: parsed };
}

function parseViewed(searchParams) {
  const uniqueViewed = [];

  for (const rawValue of searchParams.getAll("viewed")) {
    const parts = rawValue.split(",");

    for (const part of parts) {
      const slug = part.trim().slice(0, 120);
      if (!slug || uniqueViewed.includes(slug)) {
        continue;
      }

      uniqueViewed.push(slug);
      if (uniqueViewed.length >= MAX_VIEWED_ITEMS) {
        return uniqueViewed;
      }
    }
  }

  return uniqueViewed;
}

export function validateRecommendationQuery(searchParams) {
  const productSlug = (searchParams.get("productSlug") ?? "").trim().slice(0, 120);
  if (!productSlug) {
    return {
      success: false,
      code: "RECOMMENDATION_INVALID_INPUT",
      error: "Thiếu productSlug hợp lệ để lấy gợi ý sản phẩm.",
    };
  }

  const limitResult = parseLimit(searchParams.get("limit"));
  if (!limitResult.success) {
    return {
      success: false,
      code: "RECOMMENDATION_INVALID_INPUT",
      error: `limit không hợp lệ. Từ ${MIN_LIMIT} đến ${MAX_LIMIT}.`,
    };
  }

  return {
    success: true,
    data: {
      productSlug,
      limit: limitResult.value,
      viewed: parseViewed(searchParams),
    },
  };
}
