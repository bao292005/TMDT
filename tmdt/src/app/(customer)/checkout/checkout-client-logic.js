export function shouldRedirectToLogin(status, errorCode) {
  return status === 401 || status === 403 || errorCode === "AUTH_UNAUTHORIZED" || errorCode === "AUTH_FORBIDDEN";
}

export function resolveCheckoutFieldError(address, shippingMethod, paymentMethod) {
  const normalizedAddress = typeof address === "string" ? address.trim() : "";
  const normalizedShippingMethod = typeof shippingMethod === "string" ? shippingMethod.trim() : "";
  const normalizedPaymentMethod = typeof paymentMethod === "string" ? paymentMethod.trim() : "";

  if (!normalizedAddress) {
    return "address";
  }

  if (normalizedAddress.length < 10) {
    return "addressFormat";
  }

  if (!normalizedShippingMethod) {
    return "shippingMethod";
  }

  if (!normalizedPaymentMethod) {
    return "paymentMethod";
  }

  return null;
}

export function formatTimelineTimestamp(timestamp) {
  if (typeof timestamp !== "string" || !timestamp.trim()) {
    return "Chưa có mốc thời gian";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Chưa có mốc thời gian";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}
