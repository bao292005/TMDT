function normalizeText(value, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function isValidCheckoutAddressFormat(value) {
  const normalized = normalizeText(value, 250);
  if (!normalized) {
    return false;
  }

  return normalized.length >= 10;
}

export function validateCheckoutDraftPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { success: false, code: "CHECKOUT_INVALID_INPUT", error: "Dữ liệu checkout không hợp lệ." };
  }

  const address = normalizeText(payload.address, 250);
  const shippingMethod = normalizeText(payload.shippingMethod, 50).toLowerCase();
  const note = normalizeText(payload.note ?? "", 500);

  if (!address) {
    return { success: false, code: "CHECKOUT_INVALID_INPUT", error: "Địa chỉ giao hàng là bắt buộc." };
  }

  if (!isValidCheckoutAddressFormat(address)) {
    return {
      success: false,
      code: "CHECKOUT_INVALID_INPUT",
      error: "Địa chỉ giao hàng không đúng định dạng tối thiểu.",
    };
  }

  if (!shippingMethod) {
    return { success: false, code: "CHECKOUT_INVALID_INPUT", error: "Phương thức vận chuyển là bắt buộc." };
  }

  return {
    success: true,
    data: {
      address,
      shippingMethod,
      note,
    },
  };
}
