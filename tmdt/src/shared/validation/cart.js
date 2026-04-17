function normalizeText(value, maxLength = 120) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function parseQuantity(value) {
  if (!Number.isInteger(value)) {
    return null;
  }

  if (value < 1 || value > 99) {
    return null;
  }

  return value;
}

function parseVariantId(variantId) {
  const normalized = normalizeText(variantId, 120).toLowerCase();
  if (!normalized) {
    return "";
  }

  const separatorIndex = normalized.indexOf("-");
  if (separatorIndex <= 0 || separatorIndex >= normalized.length - 1) {
    return "";
  }

  const size = normalized.slice(0, separatorIndex).trim();
  const color = normalized.slice(separatorIndex + 1).trim();
  if (!size || !color) {
    return "";
  }

  return `${size}-${color}`;
}

export function validateAddCartPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { success: false, code: "CART_INVALID_INPUT", error: "Dữ liệu giỏ hàng không hợp lệ." };
  }

  const productSlug = normalizeText(payload.productSlug);
  const variantId = parseVariantId(payload.variantId);
  const quantity = parseQuantity(payload.quantity);

  if (!productSlug) {
    return { success: false, code: "CART_INVALID_INPUT", error: "Thiếu productSlug hợp lệ." };
  }

  if (!variantId) {
    return { success: false, code: "CART_INVALID_INPUT", error: "Thiếu variantId hợp lệ." };
  }

  if (quantity === null) {
    return { success: false, code: "CART_INVALID_INPUT", error: "Số lượng phải từ 1 đến 99." };
  }

  return {
    success: true,
    data: {
      productSlug,
      variantId,
      quantity,
    },
  };
}

export function validateUpdateCartPayload(payload) {
  return validateAddCartPayload(payload);
}

export function validateRemoveCartPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { success: false, code: "CART_INVALID_INPUT", error: "Dữ liệu giỏ hàng không hợp lệ." };
  }

  const productSlug = normalizeText(payload.productSlug);
  const variantId = parseVariantId(payload.variantId);

  if (!productSlug) {
    return { success: false, code: "CART_INVALID_INPUT", error: "Thiếu productSlug hợp lệ." };
  }

  if (!variantId) {
    return { success: false, code: "CART_INVALID_INPUT", error: "Thiếu variantId hợp lệ." };
  }

  return {
    success: true,
    data: {
      productSlug,
      variantId,
    },
  };
}
