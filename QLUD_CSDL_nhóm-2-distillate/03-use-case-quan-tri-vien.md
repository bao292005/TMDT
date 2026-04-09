## Context
- This section covers use case quản trị viên (2.9-2.12). Part 3 of 5 from QLUD_CSDL_nhóm 2.docx.

## Quản lý sản phẩm
- Admin thêm/sửa/xóa sản phẩm; dữ liệu gồm tên, mô tả, giá, danh mục, ảnh, biến thể, tồn kho.
- Xóa dùng soft delete (status = inactive).
- Ngoại lệ: thiếu trường bắt buộc, giá <=0/không phải số, không xóa nếu còn trong đơn chưa hoàn thành, ảnh sai định dạng hoặc >5MB.

## Quản lý đơn hàng
- Admin xem danh sách có lọc/tìm kiếm, xem chi tiết, cập nhật trạng thái hoặc hủy.
- Cập nhật trạng thái chuẩn: Chờ xử lý -> Đang đóng gói -> Đã gửi hàng -> Hoàn thành.
- Hủy đơn: kiểm tra đã thanh toán thì tạo yêu cầu hoàn tiền, hoàn tồn kho, gửi thông báo.
- Ngoại lệ: không hủy đơn đã giao/hoàn thành, không đổi trạng thái đơn đã hủy, lỗi email thì queue gửi lại.

## Báo cáo thống kê tài chính
- Dashboard gồm doanh thu theo thời gian, số đơn, AOV, top sản phẩm bán chạy, tỷ lệ hoàn trả.
- Trực quan hóa: line chart doanh thu, pie chart cơ cấu danh mục, bảng top 10, KPI cards.
- Hỗ trợ lọc thời gian và xuất Excel/PDF.
- Ngoại lệ: không dữ liệu, query timeout/phức tạp, lỗi xuất báo cáo.

## Quản lý người dùng
- Admin lọc/tìm người dùng, xem hồ sơ + timeline, khóa/mở khóa có lý do.
- Ghi audit log bắt buộc: admin_id, action, reason, timestamp.
- Gửi email thông báo trạng thái tài khoản; xuất danh sách CSV/Excel.
- Ngoại lệ: không khóa tài khoản role admin nếu không đủ quyền, cảnh báo khi user có đơn chưa hoàn thành, email lỗi thì queue retry.
