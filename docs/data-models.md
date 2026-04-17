# Data Models

## 1. Tổng quan
Hệ thống định nghĩa dữ liệu chuẩn trong `prisma/schema.prisma` với SQLite, bao phủ đầy đủ các miền nghiệp vụ TMĐT: identity, catalog, cart, order, payment, shipping, audit/reporting.

## 2. Identity Domain
### Bảng chính
- `users`
- `user_addresses`
- `sessions`

### Vai trò
- Quản lý tài khoản, trạng thái account, profile.
- Lưu địa chỉ giao hàng theo thứ tự ưu tiên.
- Quản lý session đăng nhập.

## 3. Catalog Domain
### Bảng chính
- `products`
- `product_variants`
- `product_media`
- `inventory_movements`

### Vai trò
- Quản lý sản phẩm và biến thể size/màu.
- Theo dõi tồn kho và lịch sử biến động tồn.

## 4. Cart Domain
### Bảng chính
- `carts`
- `cart_items`

### Vai trò
- Mỗi user có một cart logic.
- Mỗi cart chứa nhiều item theo biến thể.

## 5. Order Domain
### Bảng chính
- `orders`
- `order_items`

### Vai trò
- Lưu snapshot đơn hàng tại thời điểm đặt.
- Theo dõi lifecycle trạng thái đơn.

## 6. Payment Domain
### Bảng chính
- `payment_transactions`
- `payment_callbacks`

### Vai trò
- Quản lý giao dịch thanh toán online/COD.
- Lưu callback từ provider và idempotency key.

## 7. Shipping Domain
### Bảng chính
- `shipments`
- `shipment_events`

### Vai trò
- Theo dõi vận đơn, tracking number, trạng thái đồng bộ provider.

## 8. Audit & Reporting Domain
### Bảng chính
- `audit_logs`
- `export_jobs`

### Vai trò
- Truy vết thao tác nghiệp vụ theo actor/correlation-id.
- Quản lý job xuất báo cáo.

## 9. Quan hệ dữ liệu nổi bật
- `users` 1-n `orders`
- `orders` 1-n `order_items`
- `orders` 1-n `payment_transactions`
- `orders` 1-1 `shipments` (logic theo thiết kế)
- `products` 1-n `product_variants`
- `product_variants` liên kết sang `cart_items`, `order_items`, `inventory_movements`

## 10. Index và tối ưu truy vấn
Schema đã định nghĩa nhiều index theo truy vấn nghiệp vụ thường gặp, ví dụ:
- Tra cứu order theo `user_id`, `created_at`.
- Tra cứu payment theo `provider_reference`.
- Tra cứu shipment theo `tracking_number`.
- Tra cứu audit log theo `correlation_id`.

## 11. Ghi chú triển khai
- Runtime hiện tại có sử dụng file-backed stores trong `.data/` cho nhiều module.
- Prisma schema đóng vai trò chuẩn hóa mô hình dữ liệu và phục vụ lộ trình migration.
