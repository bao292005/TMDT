/**
 * Chuyển đổi số thành định dạng tiền tệ VNĐ
 * VD: 280000 -> "280.000đ"
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount).replace('₫', 'đ');
};

/**
 * Format ngày tháng năm
 * VD: "2026-04-12T00:00:00.000Z" -> "12/04/2026"
 */
export const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};