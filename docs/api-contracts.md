# API Contracts

## 1. Chuẩn phản hồi chung
Phần lớn API trả theo envelope:
```json
{
  "success": true,
  "state": "success",
  "data": {}
}
```
Khi lỗi:
```json
{
  "success": false,
  "state": "error",
  "error": "ERROR_CODE",
  "message": "Mô tả lỗi"
}
```
Header chuẩn: `X-Correlation-Id`.

## 2. Nhóm Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

## 3. Nhóm Catalog / Recommendation
- `GET /api/catalog/products`
- `GET /api/catalog/products/[slug]`
- `GET /api/recommendations`
- `GET /api/try-on` (lấy snapshot theo phiên)
- `POST /api/try-on` (upload ảnh try-on)

## 4. Nhóm Cart / Checkout / Order
- `GET /api/cart`
- `POST /api/cart`
- `PATCH /api/cart`
- `DELETE /api/cart`
- `GET /api/checkout`
- `PATCH /api/checkout`
- `POST /api/checkout` (place order)
- `POST /api/checkout/retry-payment`
- `GET /api/checkout/payment-status`
- `GET /api/orders`
- `GET /api/orders/[orderId]`

## 5. Nhóm Profile
- `GET /api/profile`
- `PUT /api/profile`

## 6. Nhóm Payment Webhook
- `POST /api/webhooks/payment`
  - Yêu cầu chữ ký: `x-payment-signature`
  - Kiểm tra HMAC bằng `PAYMENT_WEBHOOK_SECRET`

## 7. Nhóm Admin
- `GET /api/admin/ping`
- `GET /api/admin/dashboard`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/[orderId]/status`
- `GET /api/admin/orders/exceptions`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PATCH /api/admin/products/[productId]`
- `DELETE /api/admin/products/[productId]`
- `GET /api/admin/reports`
- `POST /api/admin/reports`
- `GET /api/admin/config`
- `GET /api/admin/fallback`
- `GET /api/admin/reconciliation`
- `POST /api/admin/reconciliation`
- `PUT /api/admin/users/[userId]/account-status`

## 8. Nhóm Warehouse
- `GET /api/warehouse/ping`
- `GET /api/warehouse/queue`
- `POST /api/warehouse/actions`

## 9. Ghi chú phân quyền
- API customer yêu cầu session role `customer`.
- API admin yêu cầu session role `admin`.
- API warehouse yêu cầu session role `warehouse`.
- Cơ chế kiểm tra đặt tại `requireApiRole(...)`.
