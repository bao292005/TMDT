# Chương: Kiến trúc hệ thống TMDT

## 1. Giới thiệu chương
Chương này mô tả kiến trúc tổng thể của hệ thống TMDT theo góc nhìn triển khai thực tế trong đồ án: cấu trúc ứng dụng, phân lớp xử lý, mô hình dữ liệu, tích hợp ngoài và các cơ chế đảm bảo an toàn – ổn định.

## 2. Bối cảnh và mục tiêu kiến trúc
Hệ thống phục vụ 3 nhóm người dùng chính:
- **Khách hàng**: duyệt sản phẩm, giỏ hàng, checkout, theo dõi đơn.
- **Admin**: quản trị sản phẩm/đơn hàng, dashboard, báo cáo.
- **Warehouse**: xử lý hàng trong kho.

Mục tiêu kiến trúc:
- Đảm bảo luồng mua hàng end-to-end rõ ràng.
- Dễ mở rộng theo domain nghiệp vụ.
- Tách biệt UI/API/Business logic để dễ bảo trì.
- Chuẩn hóa phản hồi API bằng correlation-id và mã lỗi.

## 3. Kiến trúc tổng thể
### 3.1 Kiểu kiến trúc
- **Monolith web application** trên Next.js App Router.
- Dùng mô hình **modular monolith** theo domain:
  - `identity`, `catalog`, `cart`, `checkout`, `order`, `payment`, `tryon`, `recommendation`, `warehouse`, `reporting`.

### 3.2 Công nghệ chính
- Next.js `16.2.3`, React `19.2.4`
- Node.js runtime
- TypeScript + JavaScript (`allowJs: true`)
- Prisma + SQLite (schema chuẩn hóa)
- ESLint + Node test runner

## 4. Góc nhìn phân lớp
Hệ thống được tổ chức thành 4 lớp chính:

### 4.1 Presentation Layer (UI)
- Vị trí: `src/app/**/page.tsx`, `src/components/**`
- Chức năng:
  - Render giao diện theo route group `(public)`, `(auth)`, `(customer)`, `admin`, `(warehouse)`.
  - Gọi API nội bộ qua `fetch`.

### 4.2 API Adapter Layer
- Vị trí: `src/app/api/**/route.js`
- Chức năng:
  - Parse request, validate payload/query.
  - Enforce auth/role bằng `requireApiRole`.
  - Gọi service ở `src/modules/**`.
  - Chuẩn hóa JSON envelope và `X-Correlation-Id`.

### 4.3 Domain Service Layer
- Vị trí: `src/modules/**`
- Chức năng:
  - Chứa business rules và orchestration chính.
  - Ví dụ:
    - `order-service.js`: đặt đơn, reconcile callback payment, retry payment.
    - `payment-service.js`: init payment, callback, idempotency.
    - `tryon-service.js`: timeout/retry và fallback cho AI try-on.

### 4.4 Data Layer
- 2 hướng lưu trữ song song theo bối cảnh:
  - **File-backed stores** trong `.data/` cho runtime hiện hành.
  - **Prisma schema** trong `prisma/schema.prisma` để chuẩn hóa mô hình dữ liệu.

## 5. Kiến trúc nghiệp vụ trọng tâm
### 5.1 Luồng Checkout – Order – Payment
1. Client gọi `GET/PATCH /api/checkout` để lấy/cập nhật draft.
2. Client gọi `POST /api/checkout` để đặt đơn.
3. `order-service` dựng order từ checkout draft.
4. `payment-service` khởi tạo giao dịch (online/COD).
5. Với online: webhook `/api/webhooks/payment` cập nhật trạng thái giao dịch và đồng bộ trạng thái order.

Đặc điểm kiến trúc:
- Có hàng đợi logic theo user/order (`runPlaceOrderQueue`, `runOrderQueue`) để giảm race condition.
- Tách rõ nghiệp vụ order và payment nhưng liên kết qua `orderId`, `providerReference`.

### 5.2 Luồng AI Try-On
1. PDP gọi `GET /api/try-on?productSlug=...` để lấy snapshot theo phiên.
2. Upload ảnh qua `POST /api/try-on` (multipart).
3. `tryon-service` gọi adapter AI với timeout/retry/backoff.
4. Kết quả lưu theo session + product trong `tryon-session-store` (TTL 30 phút).

Đặc điểm kiến trúc:
- Session key được ký HMAC trong cookie `tryon_session`.
- Có state rõ ràng: `success/error/timeout`.

### 5.3 Recommendation cá nhân hóa nhẹ
- `recommendation-service` kết hợp:
  - baseline theo category + giá,
  - signal từ lịch sử xem,
  - signal từ try-on session (size/color/variant).

## 6. Kiến trúc bảo mật và phân quyền
### 6.1 Xác thực phiên
- Đăng nhập trả session token và dùng cookie `session_token`.
- Truy xuất session qua `auth-service` + `session-store`.

### 6.2 Phân quyền RBAC
- `requireApiRole(request, allowedRoles)` kiểm tra quyền theo role.
- Các lane admin/warehouse được tách route và kiểm tra role riêng.

### 6.3 Bảo vệ callback
- Webhook payment kiểm tra chữ ký HMAC (`PAYMENT_WEBHOOK_SECRET`).
- So sánh chữ ký bằng `timingSafeEqual`.

### 6.4 Idempotency và traceability
- Callback payment có `idempotencyKey` để chống xử lý trùng.
- Hầu hết API trả `X-Correlation-Id` để trace xuyên suốt.

## 7. Kiến trúc dữ liệu
- Miền dữ liệu chính trong Prisma:
  - `users`, `sessions`
  - `products`, `product_variants`, `inventory_movements`
  - `carts`, `cart_items`
  - `orders`, `order_items`
  - `payment_transactions`, `payment_callbacks`
  - `shipments`, `shipment_events`
  - `audit_logs`, `export_jobs`

Thiết kế tập trung vào:
- Quan hệ rõ ràng theo khóa ngoại.
- Index cho truy vấn nghiệp vụ thường xuyên.
- Snapshot dữ liệu tại thời điểm phát sinh order/payment.

## 8. Kiến trúc tích hợp ngoài
- `modules/integrations/payment/payment-adapter.js`
- `modules/integrations/ai/tryon-adapter.js`
- `modules/integrations/shipping/shipping-adapter.js`

Mô hình tích hợp:
- Domain service gọi adapter, không gọi trực tiếp từ route.
- Có chuẩn hóa lỗi tích hợp (`integration-error`) và fallback event log.

## 9. Đánh giá kiến trúc theo thuộc tính chất lượng
### 9.1 Maintainability
- Tách domain theo module giúp code dễ đọc, dễ thay đổi cục bộ.

### 9.2 Reliability
- Có retry/timeout cho AI và payment.
- Có idempotency cho payment callback.

### 9.3 Security
- RBAC rõ ràng theo API lane.
- HMAC verification cho webhook.

### 9.4 Observability
- Correlation id + audit/fallback logs tăng khả năng điều tra sự cố.

## 10. Hạn chế và hướng cải tiến
- Hiện tồn tại đồng thời file-store và Prisma schema; cần chiến lược hợp nhất persistence.
- Một số session đang in-memory, chưa bền vững khi restart process.
- Nên bổ sung kiến trúc giám sát (metrics/tracing dashboard) ở mức hệ thống.

## 11. Kết luận chương
Kiến trúc TMDT đang theo hướng modular monolith phù hợp đồ án sinh viên: triển khai nhanh, domain tách rõ, có các cơ chế an toàn quan trọng (RBAC, webhook signature, idempotency, correlation-id). Đây là nền tảng tốt để tiếp tục mở rộng thành hệ thống production-grade theo từng giai đoạn.
