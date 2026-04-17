# Tổng quan dự án TMDT

## 1. Mục tiêu hệ thống
TMDT là hệ thống thương mại điện tử theo hướng full-stack, phục vụ các vai trò chính: **khách hàng**, **admin vận hành**, và **kho**. Hệ thống bao phủ luồng nghiệp vụ từ duyệt sản phẩm → giỏ hàng → checkout → thanh toán → theo dõi đơn → vận hành kho và báo cáo.

## 2. Kiến trúc tổng thể
- **Loại dự án:** Monolith web application.
- **Framework chính:** Next.js 16.2.3 (App Router) + React 19.
- **Ngôn ngữ:** JavaScript/TypeScript (allowJs bật, phần service chủ yếu `.js`).
- **Dữ liệu:** Kết hợp file-backed stores trong `.data/` và schema Prisma (`prisma/schema.prisma`, SQLite).

## 3. Thành phần chính
- `src/app/**`: Giao diện và API routes (adapter layer).
- `src/modules/**`: Nghiệp vụ cốt lõi theo domain (identity, catalog, cart, checkout, order, payment, tryon, recommendation, warehouse, reporting).
- `src/components/**`: UI primitives và layout dùng lại.
- `src/shared/**`: validation, config chuẩn hóa lỗi tích hợp.

## 4. Năng lực nghiệp vụ nổi bật
- Xác thực/RBAC theo role với session cookie.
- Checkout tạo draft + tạo đơn + khởi tạo payment.
- Webhook payment có kiểm tra chữ ký HMAC và idempotency.
- AI Try-On có cơ chế timeout/retry và snapshot theo phiên.
- Recommendation có cá nhân hóa nhẹ dựa trên lịch sử xem và tín hiệu try-on.

## 5. Tài liệu liên quan
- [Chương kiến trúc đầy đủ](./architecture.md)
- [Phân tích cây thư mục](./source-tree-analysis.md)
- [Hợp đồng API](./api-contracts.md)
- [Mô hình dữ liệu](./data-models.md)
- [Hướng dẫn phát triển](./development-guide.md)
