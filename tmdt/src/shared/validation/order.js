import { isValidCheckoutAddressFormat } from "./checkout.js";

function normalizeText(value, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

const PAYMENT_METHODS = new Set(["online", "cod"]);

export const ADMIN_ORDER_STATUSES = new Set([
  "pending_payment",
  "pending_verification",
  "payment_failed",
  "confirmed_cod",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export function validateAdminOrderStatusPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { success: false, code: "ORDER_INVALID_INPUT", error: "Dữ liệu cập nhật trạng thái không hợp lệ." };
  }

  const status = normalizeText(payload.status, 40).toLowerCase();
  const reason = normalizeText(payload.reason ?? "", 250);

  if (!ADMIN_ORDER_STATUSES.has(status)) {
    return {
      success: false,
      code: "ORDER_INVALID_INPUT",
      error: "Trạng thái đơn hàng không hợp lệ.",
    };
  }

  return {
    success: true,
    data: {
      status,
      reason,
    },
  };
}

export function validatePlaceOrderPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { success: false, code: "ORDER_INVALID_INPUT", error: "Dữ liệu đặt hàng không hợp lệ." };
  }

  const address = normalizeText(payload.address, 250);
  const shippingMethod = normalizeText(payload.shippingMethod, 50).toLowerCase();
  const note = normalizeText(payload.note ?? "", 500);
  const paymentMethod = normalizeText(payload.paymentMethod, 20).toLowerCase();

  if (!address || !isValidCheckoutAddressFormat(address)) {
    return {
      success: false,
      code: "ORDER_INVALID_INPUT",
      error: "Địa chỉ giao hàng không hợp lệ.",
    };
  }

  if (!shippingMethod) {
    return {
      success: false,
      code: "ORDER_INVALID_INPUT",
      error: "Phương thức vận chuyển là bắt buộc.",
    };
  }

  if (!PAYMENT_METHODS.has(paymentMethod)) {
    return {
      success: false,
      code: "ORDER_INVALID_INPUT",
      error: "Phương thức thanh toán phải là online hoặc COD.",
    };
  }

  return {
    success: true,
    data: {
      address,
      shippingMethod,
      note,
      paymentMethod,
    },
  };
}
