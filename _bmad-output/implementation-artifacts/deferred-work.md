## Deferred from: code review of 1-2-dang-ky-va-dang-nhap-tai-khoan-khach-hang.md (2026-04-10)

- Session store dạng in-memory không phù hợp multi-instance (`tmdt/src/modules/identity/session-store.js:3`). Cần thay bằng shared store (DB/Redis) khi bước vào môi trường nhiều process/instance.

## Deferred from: code review of 3-3-recommendation-baseline-va-ca-nhan-hoa-co-ban.md (2026-04-12)

- `tryon_session` hiện dùng fallback secret mặc định (`tmdt/src/modules/tryon/tryon-session-service.js:7`). Đây là vấn đề pre-existing từ module cũ, cần harden theo môi trường (chỉ cho phép fallback ở local dev/test, fail-fast ở production).

## Deferred from: code review of 4-1-quan-ly-gio-hang-va-kiem-tra-hop-le.md (2026-04-13)

- Rủi ro CSRF cho cart mutation API dùng cookie auth nhưng chưa có bằng chứng anti-CSRF ở layer này (`tmdt/src/app/api/cart/route.js:91`).
- Guard kép role cookie + session ở trang `/cart` có thể redirect người dùng hợp lệ khi cookie role stale (`tmdt/src/app/(customer)/cart/page.tsx:17`).

## Deferred from: code review of 4-2-checkout-dia-chi-van-chuyen-va-tong-tien.md (2026-04-13)

- Rủi ro CSRF cho `POST /api/checkout` dùng cookie auth nhưng chưa có bằng chứng anti-CSRF ở layer này (`tmdt/src/app/api/checkout/route.js:383`).
- Guard kép role cookie + session ở trang `/checkout` có thể chặn người dùng hợp lệ khi cookie role stale (`tmdt/src/app/(customer)/checkout/page.tsx:585`).

## Deferred from: code review of 5-1-khach-hang-xem-danh-sach-va-chi-tiet-don-hang.md (2026-04-13)

- Thiếu compensation khi init payment thành công nhưng tạo order/clear cart lỗi (`tmdt/src/modules/order/order-service.js:142`). Cần thiết kế transactional/compensation flow ở phạm vi story payment/order thay vì xử lý cục bộ trong story 5.1.

## Deferred from: code review of 5-2-theo-doi-trang-thai-don-va-tracking-number.md (2026-04-14)

- `listCustomerOrders` fail-fast toàn bộ khi một payment summary lỗi (`tmdt/src/modules/order/order-service.js:276`). Đây là issue pre-existing ngoài scope story 5.2, nên defer sang hardening reliability của order list.
- Payload order detail chưa normalize dữ liệu legacy trước khi client dereference (`tmdt/src/modules/order/order-service.js:392`). Đây là issue pre-existing, defer sang story hardening compatibility/legacy data.

## Deferred from: code review of 5-2-theo-doi-trang-thai-don-va-tracking-number.md (2026-04-14 rerun)

- `listCustomerOrders` vẫn fail-fast toàn bộ khi một payment summary lỗi (`tmdt/src/modules/order/order-service.js:483`). Pre-existing, ngoài scope patch hiện tại.
- Client order detail dereference `order.items.map` chưa có normalize/guard cho payload legacy malformed (`tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.tsx:218`). Pre-existing compatibility gap, defer sang hardening data contract/legacy.

## Deferred from: code review of 5-3-warehouse-queue-xu-ly-dong-goi-va-tao-van-don.md (2026-04-14)

- Rủi ro CSRF cho endpoint mutation dùng cookie auth (`POST /api/warehouse/actions`) (`tmdt/src/app/api/warehouse/actions/route.js:41`).
- I/O JSON store chưa atomic (writeFile trực tiếp) có rủi ro partial write khi crash (`tmdt/src/modules/order/order-store.js:247`).

## Deferred from: code review of 5-4-fallback-trang-thai-van-chuyen-khi-tich-hop-loi.md (2026-04-14)

- `listCustomerOrders` vẫn fail-fast toàn bộ danh sách khi chỉ một payment summary lỗi (`tmdt/src/modules/order/order-service.js:446`). Pre-existing reliability gap ngoài phạm vi thay đổi trực tiếp của story 5.4.
- `reconcilePaymentCallback` chưa guard shape payload trước khi truy cập `payload.orderId` (`tmdt/src/modules/order/order-service.js:167`). Pre-existing robustness gap ngoài phạm vi story 5.4.
- UI test order detail còn phụ thuộc source-string assertion nên có khả năng lọt regression runtime (`tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.test.js:12`). Pre-existing test strategy gap, defer sang đợt nâng cấp test harness/UI behavior tests.
- Bổ sung recovery UI cho admin theo AC2 được defer vì hiện chưa có admin order-detail UI trong phạm vi story 5.4; cần tách thành story UI/admin riêng để tránh mở rộng scope.

## Deferred from: code review of 6-2-xu-ly-don-bat-thuong-va-bang-kpi-van-hanh.md (2026-04-15)

- Danh sách đơn bất thường chưa có trường “trạng thái xử lý” theo AC (`tmdt/src/modules/order/order-service.js:766`) — deferred, pre-existing.
- Tiêu chí exception còn hẹp (`payment_failed`, `cancelled`), chưa cover overdue/timeout/repeated-cancel theo intent story (`tmdt/src/modules/order/order-service.js:758`) — deferred, pre-existing.
- A11y theo spec chưa đầy đủ (`aria-live="polite"`, focus list items) ở dashboard/exceptions UI (`tmdt/src/app/admin/dashboard/admin-dashboard-client.tsx:41`) — deferred, pre-existing.
