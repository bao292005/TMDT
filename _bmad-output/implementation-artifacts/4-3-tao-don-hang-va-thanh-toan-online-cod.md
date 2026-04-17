# Story 4.3: Tạo đơn hàng và thanh toán online/COD

Status: done

## Story

As a khách hàng,
I want đặt hàng và thanh toán bằng online hoặc COD,
so that tôi hoàn tất giao dịch theo phương thức mong muốn.

## Acceptance Criteria

1. Given khách hàng đã xác nhận checkout, when khách hàng đặt hàng và chọn phương thức thanh toán, then hệ thống tạo đơn hàng hợp lệ và khởi tạo giao dịch thanh toán tương ứng, and lưu lịch sử giao dịch gắn với order để truy vết.

## Tasks / Subtasks

- [x] Chốt contract tạo đơn + khởi tạo thanh toán theo response envelope chuẩn (AC: 1)
  - [x] Định nghĩa payload `place-order` gồm snapshot checkout hợp lệ + `paymentMethod` (`online` | `cod`)
  - [x] Chuẩn hóa response `success/state/error/message/data` + `X-Correlation-Id`
  - [x] Chốt mã lỗi nghiệp vụ (`ORDER_*`, `PAYMENT_*`, `CHECKOUT_*`, `AUTH_*`) và mapping HTTP status
- [x] Triển khai domain flow tạo đơn trong `src/modules/order/*` và `src/modules/payment/*` (AC: 1)
  - [x] Reuse gate checkout/cart hiện có để chỉ tạo đơn từ giỏ hợp lệ
  - [x] Tạo order theo state ban đầu phù hợp theo từng phương thức (`cod` vs `online`)
  - [x] Khởi tạo payment transaction record gắn `orderId` và lưu lịch sử giao dịch (FR31)
- [x] Triển khai API boundary cho place-order/payment-init trong `src/app/api/*` (AC: 1)
  - [x] Giữ route mỏng, dồn business logic vào modules
  - [x] Bảo vệ route bằng customer session; trả `AUTH_UNAUTHORIZED`/`AUTH_FORBIDDEN` đúng pattern
  - [x] Trả trạng thái online payment theo hướng “khởi tạo giao dịch” (không xử lý callback ở story này)
- [x] Tích hợp UI checkout -> đặt hàng với chọn phương thức thanh toán rõ ràng (AC: 1)
  - [x] Bổ sung lựa chọn thanh toán online/COD trong flow checkout hiện tại
  - [x] CTA đặt hàng chống double-submit, loading state rõ, và thông điệp thành công/thất bại có bước kế tiếp
  - [x] Hiển thị thông tin mã đơn + thông tin giao dịch khởi tạo sau khi đặt hàng thành công
- [x] Đảm bảo accessibility và UX consistency cho bước đặt hàng/thanh toán (AC: 1)
  - [x] Keyboard path đầy đủ cho chọn payment method + CTA chính
  - [x] Focus-first-invalid-field cho lỗi form/selection
  - [x] Không truyền nghĩa chỉ bằng màu cho trạng thái giao dịch ban đầu
- [x] Thiết lập regression guard cho Story 4.3 (AC: 1)
  - [x] Unit test order/payment service cho online vs COD branch + transaction history persist
  - [x] Route test cho auth, invalid checkout gate, error mapping, envelope/header
  - [x] UI/integration test cho chọn payment method, submit, loading/disable, success/error path
  - [x] Chạy `npm run lint` và `npm run build`

### Review Findings

- [x] [Review][Patch] placeOrder lưu order trước khi payment init nên có thể tạo orphan order khi payment fail [tmdt/src/modules/order/order-service.js:104]
- [x] [Review][Patch] Thiếu test unauthorized/forbidden cho `POST /api/checkout` theo testing requirements [tmdt/src/app/api/checkout/route.test.js:124]
- [x] [Review][Patch] Concurrent place-order cùng cart có thể tạo đơn trùng do thiếu server-side guard [tmdt/src/modules/order/order-service.js:93]
- [x] [Review][Patch] order/payment store đang nuốt lỗi read/parse và fallback `[]`, có rủi ro mất dữ liệu im lặng [tmdt/src/modules/order/order-store.js:27]
- [x] [Review][Patch] custom address rỗng đang focus về select thay vì input khi báo lỗi đầu tiên [tmdt/src/app/(customer)/checkout/checkout-client.tsx:140]

## Dev Notes

- Story 4.3 hiện thực FR25/FR26/FR31, là bước nối trực tiếp sau Story 4.2 (checkout draft/summary) và trước Story 4.4 (callback, pending, retry).
- Phạm vi story này dừng ở **tạo order + khởi tạo transaction**. Không xử lý webhook/callback/reconciliation/pending retry trong story này.
- Bắt buộc giữ tính nhất quán dữ liệu order-transaction theo NFR10/NFR13 khi lưu trạng thái ban đầu.

### Technical Requirements

- Chỉ cho phép đặt hàng khi checkout/cart gate hợp lệ (không bypass điều kiện hợp lệ từ story trước).
- Bắt buộc hỗ trợ 2 phương thức thanh toán trong scope dự án: `online` và `cod` (FR26).
- Bắt buộc lưu lịch sử giao dịch tài chính gắn với order ngay tại bước khởi tạo (FR31).
- Form/CTA quan trọng phải đáp ứng NFR15/NFR16/NFR17: label rõ, lỗi dễ hiểu, focus/disabled/loading semantics chuẩn.
- Tôn trọng NFR9: integration payment trong môi trường đề tài theo sandbox/mock, không xử lý dữ liệu tài chính thật.

### Architecture Compliance

- Route layer `src/app/*` chỉ xử lý boundary/HTTP; business logic đặt trong `src/modules/order/*`, `src/modules/payment/*`.
- Validation input đặt ở `src/shared/validation/*`; không nhúng nghiệp vụ vào client component.
- Tuân thủ response/error conventions với correlation id cho các route nghiệp vụ.
- Adapter tích hợp payment chỉ đi qua `src/modules/integrations/payment/*`.
- Webhook/payment callback nằm ở boundary `src/app/api/webhooks/payment/*` và thuộc scope Story 4.4+, không kéo vào Story 4.3.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js 16.2.3 + React 19 + TypeScript + Tailwind CSS 4.
- Không thêm dependency mới cho form/state nếu có thể tái sử dụng pattern hiện có.
- Ưu tiên flow deterministic, dễ test, tránh abstraction vượt phạm vi story.

### File Structure Requirements

- Ưu tiên tạo/chỉnh sửa trong phạm vi:
  - `tmdt/src/modules/order/*`
  - `tmdt/src/modules/payment/*`
  - `tmdt/src/modules/integrations/payment/*` (nếu cần init payment online)
  - `tmdt/src/app/api/checkout/*` hoặc route place-order tương ứng theo App Router hiện hữu
  - `tmdt/src/shared/validation/*` (DTO place-order/payment-init)
  - `tmdt/src/app/(customer)/checkout/*` và/hoặc post-checkout page tối thiểu để hiển thị kết quả đặt hàng
- Không thay đổi contract callback/reconcile/tracking (Story 4.4/4.5/5.x).

### Testing Requirements

- Cover tối thiểu các nhánh:
  - checkout hợp lệ/không hợp lệ trước tạo order,
  - payment method thiếu/không hợp lệ,
  - online vs COD khởi tạo trạng thái/transaction khác nhau,
  - unauthorized/forbidden vào place-order,
  - transaction history được lưu gắn đúng `orderId`.
- Kiểm thử response envelope + `X-Correlation-Id` cho success/error.
- Kiểm thử UI submit path gồm disabled/loading/retry-safe (anti double-submit).
- Bắt buộc pass `npm run lint` + `npm run build` trước khi chuyển `review`.

### Previous Story Intelligence

- Story 4.2 đã chốt checkout draft contract: payload địa chỉ/vận chuyển/ghi chú và response envelope chuẩn; Story 4.3 cần kế thừa để tránh lệch contract.
- Story 4.2 đã bổ sung nhánh nhập địa chỉ custom + validation tối thiểu; flow đặt hàng không được làm mất khả năng này.
- Story 4.2 đã xử lý redirect auth cho cả `401/403`; các API/UI mới của Story 4.3 cần giữ nhất quán.
- Hai defer pre-existing từ Story 4.2 (CSRF checkout route, role-cookie stale guard) không mở rộng xử lý trong scope Story 4.3 nếu không đổi scope.

### Git Intelligence Summary

- Recent commits hiện có:
  - `1108dbe`: auth flow story 1.2
  - `445df65`: BMAD framework bootstrap
- Working tree đang có nhiều thay đổi chưa commit; cần khóa phạm vi Story 4.3 vào order/payment-init để tránh chạm callback/tracking ngoài scope.

### Latest Technical Information

- UX spec yêu cầu recovery-first feedback cho payment: thông điệp phải nêu rõ trạng thái + hành động kế tiếp.
- A11y baseline yêu cầu keyboard navigation đầy đủ, focus indicator rõ, và trạng thái không phụ thuộc màu.
- Architecture mapping đã phân tách rõ checkout/payment/order boundaries; route mỏng + service dày vẫn là nguyên tắc bắt buộc.

### Project Context Reference

- Không tìm thấy `project-context.md` trong workspace hiện tại.
- Nguồn chuẩn cho story này: `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md`, và implementation artifact Story 4.2.

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:428-441`
- FR25/FR26/FR31 + NFR liên quan: `_bmad-output/planning-artifacts/prd.md:319-327,358-379`
- Architecture boundaries & mapping: `_bmad-output/planning-artifacts/architecture.md:327-358,368-382`
- UX payment/feedback/form/accessibility patterns: `_bmad-output/planning-artifacts/ux-design-specification.md:568-587,642-654`
- Previous story intelligence: `_bmad-output/implementation-artifacts/4-2-checkout-dia-chi-van-chuyen-va-tong-tien.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `node --experimental-default-type=module --test --test-concurrency=1 src/modules/payment/payment-service.test.js src/modules/order/order-service.test.js src/app/api/checkout/route.test.js "src/app/(customer)/checkout/checkout-client.test.js"` (pass)
- `node --experimental-default-type=module --test --test-concurrency=1 src/app/api/account-actions.test.js src/modules/cart/cart-service.test.js src/app/api/cart/route.test.js src/modules/checkout/checkout-service.test.js src/app/api/checkout/route.test.js src/modules/payment/payment-service.test.js src/modules/order/order-service.test.js "src/app/(customer)/cart/cart-client.test.js" "src/app/(customer)/checkout/checkout-client.test.js"` (pass)
- `npm run lint` (pass)
- `npm run build` (pass)

### Completion Notes List

- Hoàn tất place-order flow với payload `address/shippingMethod/paymentMethod/note`, response envelope chuẩn và `X-Correlation-Id`.
- Hoàn tất order/payment domain: tạo order theo nhánh online/COD, khởi tạo payment transaction và lưu lịch sử gắn `orderId`.
- Hoàn tất API checkout: tách rõ `PATCH` cho update draft và `POST` cho place-order + payment-init, giữ auth guard customer.
- Hoàn tất checkout UI đặt hàng: chọn payment method online/COD, chống double-submit, hiển thị kết quả order/payment và CTA thanh toán online.
- Hoàn tất regression guard: cập nhật test route/service/client cho nhánh online/COD, invalid input, auth, và error mapping.

### File List

- `tmdt/src/modules/order/order-store.js`
- `tmdt/src/modules/order/order-service.js`
- `tmdt/src/modules/order/order-service.test.js`
- `tmdt/src/modules/payment/payment-store.js`
- `tmdt/src/modules/payment/payment-service.js`
- `tmdt/src/modules/payment/payment-service.test.js`
- `tmdt/src/modules/integrations/payment/payment-adapter.js`
- `tmdt/src/shared/validation/order.js`
- `tmdt/src/app/api/checkout/route.js`
- `tmdt/src/app/api/checkout/route.test.js`
- `tmdt/src/app/(customer)/checkout/checkout-client-logic.js`
- `tmdt/src/app/(customer)/checkout/checkout-client.tsx`
- `tmdt/src/app/(customer)/checkout/checkout-client.test.js`
- `_bmad-output/implementation-artifacts/4-3-tao-don-hang-va-thanh-toan-online-cod.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-13: Tạo mới Story 4.3 từ trạng thái `backlog` và chuẩn hóa context triển khai theo BMAD create-story workflow.
- 2026-04-13: Hoàn tất implementation Story 4.3 (order + payment init online/COD), cập nhật test coverage và chuyển trạng thái `review`.
