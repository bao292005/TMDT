---
type: bmad-distillate
sources:
  - "../QLUD_CSDL_nhóm 2.docx"
downstream_consumer: "general"
created: "2026-04-08"
token_estimate: 0
parts: 5
---

## Orientation
- Distillate nén thông tin loss-minimized từ 1 nguồn: QLUD_CSDL_nhóm 2.docx.
- Phạm vi bao phủ: tổng quan/mục tiêu, use case khách hàng, use case quản trị, use case kho vận, mô hình dữ liệu-ETL.
- Mục tiêu đầu ra: context token-efficient để làm đầu vào cho PRD, architecture, epics/stories.
- Cấu trúc split thành 5 phần ngữ nghĩa độc lập + 1 index chứa mục cắt ngang.

## Section manifest
- 01-tong-quan-muc-tieu-y-nghia.md — bối cảnh, mục tiêu hệ thống, giá trị thực tiễn.
- 02-use-case-khach-hang.md — luồng 2.1-2.8: đăng nhập, duyệt sản phẩm, thử đồ ảo, giỏ hàng, checkout, thanh toán, theo dõi đơn/giao dịch.
- 03-use-case-quan-tri-vien.md — luồng 2.9-2.12: quản lý sản phẩm/đơn hàng/báo cáo tài chính/người dùng.
- 04-use-case-kho-van.md — luồng 2.13-2.15: xử lý đơn kho, đóng gói, tạo vận đơn và giao vận.
- 05-du-lieu-quan-he-va-nhat-quan.md — thực thể, quan hệ, quy tắc nhất quán, tích hợp ETL.

## Cross-cutting items
- Tác nhân cốt lõi: khách hàng, Admin, Warehouse Staff; tích hợp ngoài: AI model, cổng thanh toán, vận chuyển.
- Kiểm soát nhất quán: reserve stock khi checkout; callback/webhook đồng bộ thanh toán; tracking và cache trạng thái vận chuyển.
- Ngưỡng vận hành: ảnh thử đồ <=10MB; timeout AI 30s; timeout thanh toán 15 phút; timeout API vận chuyển 30s + queue retry.
- Chính sách an toàn hệ thống: bcrypt + session/JWT; khóa tạm sau 5 lần sai/15 phút; soft delete sản phẩm; audit log cho thao tác quản trị.

## Bản đồ phủ nguồn
- Source headings: LỜI MỞ ĐẦU; I. Tổng quan; 1. Phát biểu bài toán; 2. Mục đích và ý nghĩa thực tiễn; 2.1. Mục đích; 2.2. Ý nghĩa thực tiễn; II. Phân tích yêu cầu và thiết kế hệ thống; 1. Biểu đồ use case; 2. Biểu đồ tuần tự và kịch bản; 2.1 Đăng nhập; 2.2 Xem sản phẩm; 2.3 Thử đồ ảo; 2.4 Thêm vào giỏ hàng; 2.5 Đặt hàng (Checkout); 2.6 Thanh toán; 2.7 Theo dõi đơn hàng; 2.8 Theo dõi lịch sử giao dịch tài chính; 2.9 Quản lý sản phẩm; 2.10 Quản lý đơn hàng; 2.11 Xem báo cáo thống kê tài chính; 2.12 Quản lý người dùng; 2.13 Xem đơn hàng cần xử lý; 2.14 Xác nhận đóng gói; 2.15 Gửi đơn hàng vận chuyển.
- Source named entities: Học viện Công nghệ Bưu chính Viễn thông; Khoa Tài chính - Kế toán 1; FIA1470; Trần Quốc Khánh; Nguyễn Tất Đạt; Nguyễn Quốc Bảo; Nguyễn Trần Thái Dương; Nguyễn Hữu Trọng; Nguyễn Thị Anh; TMĐT thời trang; Statista; AI Virtual Try-On; App Server; Database; AI Model Server; Virtual Try-On API; JWT; session; bcrypt; ETL; VNPAY; MoMo; COD; GHN; Viettel Post; tracking_number; Dashboard; KPI; AOV; Warehouse Staff; Admin; localStorage; CSV; Excel; PDF; QR code; barcode.
