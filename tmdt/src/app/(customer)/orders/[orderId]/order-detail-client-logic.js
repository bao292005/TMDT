export function resolveNextActionText(nextAction) {
  if (nextAction === "retry_payment") return "Thanh toán lại để tiếp tục xử lý đơn.";
  if (nextAction === "refresh_status") return "Làm mới trạng thái để xem cập nhật mới nhất.";
  if (nextAction === "track_shipment") return "Theo dõi vận đơn bằng mã tracking.";
  if (nextAction === "contact_support") return "Liên hệ hỗ trợ để được xử lý thủ công.";
  return "Không cần thao tác thêm.";
}

export function resolveStatusCue(status) {
  if (status === "delivered") return "Hoàn tất";
  if (status === "shipped") return "Đang giao";
  if (status === "processing") return "Đang xử lý";
  if (status === "payment_failed") return "Cần xử lý";
  if (status === "cancelled" || status === "canceled") return "Đã hủy";
  return "Trạng thái";
}

export function isTerminalTrackingStatus(status) {
  return status === "delivered" || status === "cancelled" || status === "canceled";
}

export function shouldSchedulePollingForOrder(order) {
  if (!order) return true;
  return !isTerminalTrackingStatus(order.tracking?.status);
}
