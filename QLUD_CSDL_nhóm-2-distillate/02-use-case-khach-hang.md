## Context
- This section covers use case khách hàng (2.1-2.8). Part 2 of 5 from QLUD_CSDL_nhóm 2.docx.

## Đăng nhập
- Tiền đề: có tài khoản, vào trang login.
- Luồng chính: email/mật khẩu -> truy vấn tài khoản -> so khớp bcrypt -> tạo session/JWT -> vào trang chủ.
- Ngoại lệ: email sai, mật khẩu sai, quá 5 lần sai khóa 15 phút + email cảnh báo, tài khoản locked bởi Admin.

## Xem sản phẩm
- Cho phép tìm theo từ khóa/danh mục, xem danh sách và chi tiết (mô tả, size/màu, tồn kho, đánh giá).
- Ngoại lệ: không có kết quả, hết hàng disable thêm giỏ, lỗi DB thì retry 3 lần mỗi 3 giây.

## Thử đồ ảo
- Luồng: mở modal -> upload/chụp ảnh -> validate ảnh -> gửi AI model -> nhận ảnh kết quả -> lưu storage -> hiển thị lưu/chia sẻ/thêm giỏ.
- Ngoại lệ: không nhận diện người, ảnh >10MB, AI timeout/lỗi sau 30 giây, sản phẩm chưa có template thì disable nút.

## Thêm vào giỏ
- Bắt buộc chọn biến thể size/màu và số lượng.
- Kiểm tra tồn kho trước ghi Cart; nếu đã có item thì tăng số lượng.
- Ngoại lệ: thiếu biến thể, tồn kho không đủ, chưa login thì lưu local/session, giới hạn tối đa 10 sản phẩm cùng loại.

## Đặt hàng (Checkout)
- Điều kiện: đã login, giỏ có hàng, còn tồn.
- Luồng: nhập/chọn địa chỉ -> chọn vận chuyển -> gọi API tính ship -> hiển thị tổng tiền -> tạo đơn Chờ thanh toán + reserve stock -> gửi email xác nhận.
- Ngoại lệ: giỏ trống, hết hàng lúc checkout, lỗi phí ship thì dùng phí mặc định, địa chỉ không hợp lệ.

## Thanh toán
- Hỗ trợ VNPAY/MoMo/COD.
- Online: tạo phiên -> redirect cổng -> khách xác nhận -> webhook callback -> cập nhật Đã thanh toán + lưu giao dịch tài chính -> báo kho xử lý.
- COD: bỏ qua bước cổng, chuyển Đã xác nhận - Chờ xử lý.
- Ngoại lệ: thiếu số dư, khách hủy, timeout 15 phút thì đối soát trạng thái và có thể chuyển Chờ xác minh thanh toán.

## Theo dõi đơn hàng
- Khách xem danh sách đơn theo thời gian, xem chi tiết, lấy trạng thái vận chuyển theo tracking_number.
- Trạng thái ship từ đơn vị vận chuyển: Đang lấy hàng/Đang vận chuyển/Đã giao/Thất bại.
- Ngoại lệ: chưa có đơn, API ship lỗi thì hiển thị trạng thái cache cuối, đơn chưa có vận đơn, đơn đã hủy.

## Theo dõi lịch sử tài chính
- Hiển thị giao dịch thanh toán/hoàn tiền với bộ lọc thời gian-loại.
- Xem chi tiết giao dịch gồm liên kết đơn hàng và mã giao dịch cổng.
- Cho phép xuất PDF/Excel; ngoại lệ dữ liệu rỗng hoặc DB lỗi.
