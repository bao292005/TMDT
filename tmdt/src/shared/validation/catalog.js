const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;
const MAX_SAFE_INT = Number.MAX_SAFE_INTEGER;

function parsePositiveInteger(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return { success: true, value: fallback };
  }

  const normalized = String(value).trim();
  if (!/^[1-9]\d*$/.test(normalized)) {
    return { success: false };
  }

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed > MAX_SAFE_INT) {
    return { success: false };
  }

  return { success: true, value: parsed };
}

function parseNonNegativeInteger(value) {
  if (value === null || value === undefined || value === "") {
    return { success: true, value: null };
  }

  const normalized = String(value).trim();
  if (!/^\d+$/.test(normalized)) {
    return { success: false };
  }

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed > MAX_SAFE_INT) {
    return { success: false };
  }

  return { success: true, value: parsed };
}

export function validateCatalogDetailQuery(searchParams) {
  const sizeValues = searchParams
    .getAll("size")
    .map((value) => value.trim())
    .filter((value) => value !== "");
  const colorValues = searchParams
    .getAll("color")
    .map((value) => value.trim())
    .filter((value) => value !== "");

  if (sizeValues.length > 1 || colorValues.length > 1) {
    return {
      success: false,
      error: "Biến thể không hợp lệ. Chỉ được chọn một size và một màu.",
      code: "CATALOG_INVALID_QUERY",
    };
  }

  const size = sizeValues[0] ?? "";
  const color = colorValues[0] ?? "";

  if ((size && !color) || (!size && color)) {
    return {
      success: false,
      error: "Biến thể không hợp lệ. Cần cung cấp đồng thời size và màu.",
      code: "CATALOG_INVALID_QUERY",
    };
  }

  return {
    success: true,
    data: {
      size,
      color,
    },
  };
}

function normalizeShortText(value, maxLength = 120) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeVariant(variant) {
  if (!variant || typeof variant !== "object") {
    return { success: false, error: "Biến thể sản phẩm không hợp lệ." };
  }

  const size = normalizeShortText(variant.size, 30).toLowerCase();
  const color = normalizeShortText(variant.color, 30).toLowerCase();
  const stock = Number(variant.stock);

  if (!size || !color || !Number.isInteger(stock) || stock < 0) {
    return { success: false, error: "Biến thể sản phẩm không hợp lệ." };
  }

  return {
    success: true,
    data: {
      size,
      color,
      stock,
    },
  };
}

export function validateAdminCatalogProductPayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== "object") {
    return {
      success: false,
      code: "CATALOG_INVALID_INPUT",
      error: "Dữ liệu sản phẩm không hợp lệ.",
    };
  }

  const slug = normalizeShortText(payload.slug, 120).toLowerCase();
  const name = normalizeShortText(payload.name, 160);
  const category = normalizeShortText(payload.category, 80).toLowerCase();
  const description = normalizeShortText(payload.description, 500);
  const thumbnail = normalizeShortText(payload.thumbnail, 250);
  const size = normalizeShortText(payload.size, 30).toLowerCase();
  const color = normalizeShortText(payload.color, 30).toLowerCase();
  const media = Array.isArray(payload.media)
    ? payload.media
        .map((item) => normalizeShortText(item, 250))
        .filter(Boolean)
    : [];
  const variants = Array.isArray(payload.variants) ? payload.variants : null;
  const hasPrice = payload.price !== undefined;
  const price = Number(payload.price);

  const checks = [
    ["slug", slug],
    ["name", name],
    ["category", category],
    ["description", description],
    ["thumbnail", thumbnail],
    ["size", size],
    ["color", color],
  ];

  for (const [field, value] of checks) {
    if (!partial || payload[field] !== undefined) {
      if (!value) {
        return {
          success: false,
          code: "CATALOG_INVALID_INPUT",
          error: `Trường ${field} là bắt buộc.`,
        };
      }
    }
  }

  if ((!partial || hasPrice) && (!Number.isInteger(price) || price <= 0 || !Number.isSafeInteger(price))) {
    return {
      success: false,
      code: "CATALOG_INVALID_INPUT",
      error: "Giá sản phẩm không hợp lệ.",
    };
  }

  if (!partial || payload.variants !== undefined) {
    if (!variants || variants.length === 0) {
      return {
        success: false,
        code: "CATALOG_INVALID_INPUT",
        error: "Biến thể sản phẩm không hợp lệ.",
      };
    }
  }

  const normalizedVariants = [];
  if (variants) {
    for (const variant of variants) {
      const normalized = normalizeVariant(variant);
      if (!normalized.success) {
        return {
          success: false,
          code: "CATALOG_INVALID_INPUT",
          error: normalized.error,
        };
      }
      normalizedVariants.push(normalized.data);
    }
  }

  if (!partial || payload.isActive !== undefined) {
    if (typeof payload.isActive !== "boolean") {
      return {
        success: false,
        code: "CATALOG_INVALID_INPUT",
        error: "Trạng thái isActive không hợp lệ.",
      };
    }
  }

  const data = {};

  if (!partial || payload.slug !== undefined) data.slug = slug;
  if (!partial || payload.name !== undefined) data.name = name;
  if (!partial || payload.category !== undefined) data.category = category;
  if (!partial || payload.description !== undefined) data.description = description;
  if (!partial || payload.thumbnail !== undefined) data.thumbnail = thumbnail;
  if (!partial || payload.size !== undefined) data.size = size;
  if (!partial || payload.color !== undefined) data.color = color;
  if (!partial || hasPrice) data.price = price;
  if (!partial || payload.media !== undefined) data.media = media;
  if (normalizedVariants.length > 0 || (!partial && variants)) data.variants = normalizedVariants;
  if (!partial || payload.isActive !== undefined) data.isActive = Boolean(payload.isActive);

  if (partial && Object.keys(data).length === 0) {
    return {
      success: false,
      code: "CATALOG_INVALID_INPUT",
      error: "Không có trường nào để cập nhật.",
    };
  }

  return {
    success: true,
    data,
  };
}

export function validateCatalogQuery(searchParams) {
  const category = (searchParams.get("category") ?? "").trim();
  const keyword = (searchParams.get("keyword") ?? "").trim();
  const size = (searchParams.get("size") ?? "").trim();
  const color = (searchParams.get("color") ?? "").trim();

  const pageResult = parsePositiveInteger(searchParams.get("page"), DEFAULT_PAGE);
  if (!pageResult.success) {
    return {
      success: false,
      error: "Trang hiện tại không hợp lệ.",
      code: "CATALOG_INVALID_QUERY",
    };
  }

  const pageSizeResult = parsePositiveInteger(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE);
  if (!pageSizeResult.success || pageSizeResult.value > MAX_PAGE_SIZE) {
    return {
      success: false,
      error: `Kích thước trang không hợp lệ. Tối đa ${MAX_PAGE_SIZE}.`,
      code: "CATALOG_INVALID_QUERY",
    };
  }

  const minPriceResult = parseNonNegativeInteger(searchParams.get("minPrice"));
  const maxPriceResult = parseNonNegativeInteger(searchParams.get("maxPrice"));
  if (!minPriceResult.success || !maxPriceResult.success) {
    return {
      success: false,
      error: "Khoảng giá không hợp lệ.",
      code: "CATALOG_INVALID_QUERY",
    };
  }

  if (
    minPriceResult.value !== null &&
    maxPriceResult.value !== null &&
    minPriceResult.value > maxPriceResult.value
  ) {
    return {
      success: false,
      error: "Khoảng giá không hợp lệ.",
      code: "CATALOG_INVALID_QUERY",
    };
  }

  return {
    success: true,
    data: {
      category,
      keyword,
      size,
      color,
      minPrice: minPriceResult.value,
      maxPrice: maxPriceResult.value,
      page: pageResult.value,
      pageSize: pageSizeResult.value,
    },
  };
}
