export function resolveWarehouseActionLabel(action) {
  if (action === "pick") return "Pick hàng";
  if (action === "pack") return "Đóng gói";
  if (action === "create_shipment") return "Tạo vận đơn";
  return "Xử lý";
}

export function shouldRedirectWarehouseAuth(status, error) {
  return status === 401 || status === 403 || error === "AUTH_UNAUTHORIZED" || error === "AUTH_FORBIDDEN";
}

export function resolveWarehouseErrorMessage(payload, fallbackMessage) {
  if (payload && typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  return fallbackMessage;
}

export function buildWarehouseActionSuccessMessage(action, order) {
  if (action === "create_shipment" && order?.trackingNumber) {
    return `Đã tạo vận đơn ${order.trackingNumber} cho đơn ${order.id}.`;
  }

  if (action === "pick") {
    return `Đã chuyển đơn ${order?.id ?? ""} sang bước đóng gói.`.trim();
  }

  if (action === "pack") {
    return `Đã xác nhận đóng gói đơn ${order?.id ?? ""}.`.trim();
  }

  return "Thao tác kho thành công.";
}
