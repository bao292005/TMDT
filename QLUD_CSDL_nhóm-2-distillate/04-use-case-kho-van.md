## Context
- This section covers use case kho vận (2.13-2.15). Part 4 of 5 from QLUD_CSDL_nhóm 2.docx.

## Xem đơn hàng cần xử lý
- Warehouse xem đơn Đã thanh toán - Chờ xử lý theo FIFO (đơn cũ nhất trước).
- Dữ liệu hiển thị: mã đơn, thời gian, danh sách hàng, vị trí kho, địa chỉ giao, SLA.
- Có lọc theo ngày/mã đơn.
- Ngoại lệ: không có đơn, đơn quá SLA cảnh báo ưu tiên, thiếu hàng sau thanh toán thì gắn cờ xử lý đặc biệt.

## Xác nhận đóng gói
- Kho đối chiếu hàng thực tế, kiểm chất lượng, đóng gói, xác nhận.
- Cập nhật trạng thái thành Đã đóng gói - Chờ vận chuyển, ghi nhận thời gian, gửi realtime cho Admin dashboard.
- Ngoại lệ: sản phẩm lỗi (tạo ticket), thiếu hàng (báo Admin, đề xuất hủy/chờ nhập), ghi chú đặc biệt bắt buộc xác nhận đã đọc.

## Gửi đơn hàng vận chuyển
- Kho chọn GHN/Viettel Post, xác nhận khối lượng/địa chỉ, tạo vận đơn qua API.
- Hệ thống lưu tracking_number, in nhãn (QR + barcode), gửi email/SMS link theo dõi, chuyển trạng thái Đang giao hàng.
- Ngoại lệ: API lỗi/timeout 30 giây (retry queue 5 phút), địa chỉ INVALID_ADDRESS, không phục vụ khu vực SERVICE_NOT_AVAILABLE, lỗi in nhãn nhưng vận đơn vẫn hợp lệ.
