# Story 4.4: Xử lý callback payment, trạng thái pending và retry

Status: review

## Story

As a khách hàng,
I want biết rõ trạng thái thanh toán và có thể thanh toán lại,
so that tôi không bị mơ hồ khi giao dịch lỗi/chậm.

## Acceptance Criteria

1. Given giao dịch có callback đến chậm hoặc thất bại, when hệ thống nhận/đối soát trạng thái payment, then đơn hàng chuyển đúng trạng thái success/pending/failed, and khách hàng có hành động retry rõ ràng khi giao dịch thất bại.

## Tasks / Subtasks

- [x] Chốt contract callback + reconcile cho payment status (AC: 1)
  - [x] Định nghĩa payload callback payment gồm `orderId`, `providerReference`, `status`, `eventTime`, `signature/idempotencyKey`
  - [x] Chuẩn hóa response envelope `success/state/error/message/data` + `X-Correlation-Id` cho route callback/retry/status
  - [x] Chốt mapping mã lỗi nghiệp vụ (`PAYMENT_*`, `ORDER_*`, `AUTH_*`, `CHECKOUT_*`) và HTTP status cho các nhánh callback/pending/retry
- [x] Triển khai domain flow xử lý callback, pending, retry trong `src/modules/payment/*` + `src/modules/order/*` (AC: 1)
  - [x] Cập nhật trạng thái transaction theo callback với idempotency guard (không xử lý trùng event)
  - [x] Đồng bộ trạng thái order theo payment state (`paid`/`pending_verification`/`payment_failed`) nhất quán với state machine hiện có
  - [x] Bổ sung flow retry payment cho giao dịch fail, tạo transaction mới gắn `orderId` và lưu lịch sử
- [x] Triển khai API boundary cho callback + retry + status query ở `src/app/api/*` (AC: 1)
  - [x] Tách route webhook payment rõ boundary (`src/app/api/webhooks/payment/*`) và giữ business logic trong modules
  - [x] Bảo vệ endpoint retry/status bằng customer session; webhook dùng cơ chế verify nguồn gọi
  - [x] Trả trạng thái pending có thông điệp recovery-first và hướng dẫn hành động kế tiếp
- [x] Tích hợp UI post-checkout cho pending/failed/retry flow tối thiểu (AC: 1)
  - [x] Hiển thị trạng thái thanh toán hiện tại với label text rõ ràng (không phụ thuộc màu)
  - [x] Có CTA retry khi trạng thái thất bại và chặn double-submit khi đang retry
  - [x] Có hành vi refresh/polling nhẹ cho trạng thái pending để giảm mơ hồ callback chậm
- [x] Đảm bảo accessibility + UX consistency cho flow thanh toán hậu checkout (AC: 1)
  - [x] Keyboard path đầy đủ cho CTA retry/refresh
  - [x] Focus-first-action khi xuất hiện lỗi thanh toán cần can thiệp
  - [x] Thông điệp trạng thái gồm `state + next action` theo pattern recovery-first
- [x] Thiết lập regression guard cho Story 4.4 (AC: 1)
  - [x] Unit test payment/order service cho callback duplicate, pending branch, failed branch, retry branch
  - [x] Route test cho webhook idempotency, auth retry route, error mapping, envelope/header
  - [x] UI/integration test cho pending view, failed->retry flow, loading/disable semantics
  - [x] Chạy `npm run lint` và `npm run build`

### Review Findings

- [x] [Review][Patch] Idempotency key có thể đụng cross-order do lookup toàn cục theo key [tmdt/src/modules/payment/payment-service.js:255]
- [x] [Review][Patch] Webhook signature đang cho phép fallback secret mặc định, không fail-fast theo môi trường [tmdt/src/app/api/webhooks/payment/route.js:1178]
- [x] [Review][Patch] Webhook signature check chưa ràng buộc vào raw payload (thiếu HMAC body verification) [tmdt/src/app/api/webhooks/payment/route.js:1176]
- [x] [Review][Patch] Callback có thể update nhầm transaction khi fallback sang latest theo orderId [tmdt/src/modules/payment/payment-service.js:266]
- [x] [Review][Patch] UI giữ checkoutUrl cũ sau retry, có thể điều hướng sai transaction mới [tmdt/src/app/(customer)/checkout/checkout-client.tsx:1795]
- [x] [Review][Patch] Thiếu route test cho webhook/retry/status (idempotency, auth, error mapping, envelope/header) [tmdt/src/modules/order/order-service.test.js:1]
- [x] [Review][Patch] Thiếu test nhánh callback đến trễ: pending trước rồi success sau [tmdt/src/modules/order/order-service.test.js:131]
- [x] [Review][Patch] Thiếu focus-first-action khi trạng thái payment failed yêu cầu retry [tmdt/src/app/(customer)/checkout/checkout-client.tsx:1763]

## Dev Notes

- Story 4.4 hiện thực FR27/FR28/FR29/FR30, nối trực tiếp sau Story 4.3 (khởi tạo giao dịch online/COD) và trước Story 4.5 (timeline UI hoàn chỉnh).
- Scope story này tập trung vào xử lý callback + đồng bộ trạng thái + retry payment; không mở rộng sang tracking shipment (Epic 5+) hay reconciliation liên phân hệ đầy đủ (Epic 7.3).
- Mục tiêu chính là loại bỏ trạng thái mơ hồ hậu thanh toán bằng nhánh `pending_verification` rõ ràng và recovery path có thể thao tác.

### Technical Requirements

- Bắt buộc tiếp nhận và xử lý callback payment từ cổng tích hợp (FR27).
- Bắt buộc cập nhật trạng thái order theo kết quả payment và đồng bộ nhất quán order-payment (FR28, NFR10).
- Bắt buộc cho phép retry payment khi transaction trước đó thất bại (FR29).
- Bắt buộc hỗ trợ trạng thái `pending`/`pending_verification` khi callback chưa đồng nhất hoặc đến chậm (FR30, NFR13).
- Bắt buộc dùng idempotency guard cho webhook/callback để tránh double-update trạng thái.
- Bắt buộc giữ retry có kiểm soát cho tích hợp ngoài và có fallback thông điệp rõ (NFR11, NFR12).
- Bắt buộc tuân thủ NFR15/NFR16/NFR17 cho feedback/CTA sau checkout: label rõ, loading/disabled semantics chuẩn, keyboard accessible.

### Architecture Compliance

- Route layer `src/app/*` chỉ xử lý boundary/HTTP; business logic đặt trong `src/modules/payment/*` và `src/modules/order/*`.
- Adapter payment chỉ đi qua `src/modules/integrations/payment/*`; không gọi trực tiếp provider từ UI route.
- Webhook/payment callback phải đặt tại boundary `src/app/api/webhooks/payment/*` theo kiến trúc đã chốt.
- Callback flow phải có `correlationId` và `idempotencyKey`, consumer xử lý idempotent theo pattern event.
- Reconciliation sâu qua jobs (`src/jobs/reconciliation/*`) là lane Epic 7; Story 4.4 chỉ xử lý pending/retry ở mức transaction/order path cần thiết.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js 16.2.3 + React 19 + TypeScript + Tailwind CSS 4.
- Không thêm dependency mới cho retry/polling nếu có thể tận dụng fetch/state pattern sẵn có.
- Ưu tiên flow deterministic, dễ test và dễ truy vết cho callback/retry.

### File Structure Requirements

- Ưu tiên tạo/chỉnh sửa trong phạm vi:
  - `tmdt/src/app/api/webhooks/payment/*`
  - `tmdt/src/app/api/checkout/*` (retry/status boundary nếu giữ cùng route lane)
  - `tmdt/src/modules/payment/*`
  - `tmdt/src/modules/order/*`
  - `tmdt/src/modules/integrations/payment/*`
  - `tmdt/src/app/(customer)/checkout/*` hoặc post-checkout page hiện có để hiển thị pending/retry
- Không kéo rộng sang shipment/tracking integration (Epic 5) hoặc hệ thống reconciliation batch hoàn chỉnh (Epic 7.3).

### Testing Requirements

- Cover tối thiểu các nhánh:
  - callback success/pending/failed,
  - callback duplicate cùng idempotency key,
  - callback đến trễ gây pending trước rồi success sau,
  - retry payment tạo transaction mới và giữ lịch sử cũ,
  - unauthorized/forbidden cho retry/status customer route,
  - invalid webhook payload/signature.
- Kiểm thử response envelope + `X-Correlation-Id` cho success/error routes.
- Kiểm thử UI path cho pending polling, failed->retry, disabled/loading, recovery CTA.
- Bắt buộc pass `npm run lint` + `npm run build` trước khi chuyển `review`.

### Previous Story Intelligence

- Story 4.3 đã hoàn tất tạo order + payment init và đã lưu transaction theo `orderId`; Story 4.4 cần tái sử dụng transaction history này thay vì tạo store song song.
- Story 4.3 đã chuẩn hóa response envelope `success/state/error/message/data` và header `X-Correlation-Id`; callback/retry routes phải giữ nhất quán.
- Story 4.3 đã thêm server-side guard chống double-submit place-order; Story 4.4 cần áp dụng tinh thần tương tự cho retry payment để tránh retry trùng.
- Story 4.3 đã fix data-store parse/read fail không được nuốt lỗi; Story 4.4 không được reintroduce silent fallback trong payment/order stores.

### Git Intelligence Summary

- Recent commits hiện có:
  - `1108dbe`: auth flow story 1.2
  - `445df65`: BMAD framework bootstrap
- Working tree hiện có nhiều thay đổi chưa commit; cần khóa phạm vi Story 4.4 vào payment callback/pending/retry và không chạm lane shipping/tracking ngoài scope.

### Latest Technical Information

- UX spec yêu cầu payment/tracking state phải minh bạch bằng `label + timestamp + next action`, đặc biệt khi callback chậm.
- UX spec yêu cầu recovery-first messaging cho timeout/lỗi payment: luôn có CTA retry/refresh/hành động kế tiếp rõ.
- Architecture yêu cầu webhook path chuyên biệt, idempotency cho callback consumer, và retry có kiểm soát (không retry vô hạn).

### Project Context Reference

- Không tìm thấy `project-context.md` trong workspace hiện tại.
- Nguồn chuẩn cho story này: `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md`, và implementation artifact Story 4.3.

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:443-456`
- FR27-FR30 + FR31 context: `_bmad-output/planning-artifacts/prd.md:323-327`
- Architecture webhook/idempotency/reconciliation boundaries: `_bmad-output/planning-artifacts/architecture.md:128,169-172,332,355,381-383`
- UX payment status/recovery/accessibility patterns: `_bmad-output/planning-artifacts/ux-design-specification.md:62,357-358,460-461,493-499,576,645-654`
- Previous story intelligence: `_bmad-output/implementation-artifacts/4-3-tao-don-hang-va-thanh-toan-online-cod.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `NODE_OPTIONS=--experimental-default-type=module node --test src/modules/order/order-service.test.js`
- `NODE_OPTIONS=--experimental-default-type=module node --test "src/app/(customer)/checkout/checkout-client.test.js"`
- `NODE_OPTIONS=--experimental-default-type=module node --test "src/app/api/checkout/route.test.js"`
- `npm run lint`
- `npm run build`

### Completion Notes List

- Hoàn tất hardening callback payment: verify HMAC theo raw payload, fail-fast khi thiếu secret/signature.
- Loại bỏ fallback transaction theo order latest và áp idempotency guard theo transaction/providerReference.
- Hoàn tất flow post-checkout retry/focus-first-action + đồng bộ checkoutUrl theo transaction mới nhất.
- Bổ sung regression test cho pending→success callback và route tests cho webhook/retry/status (auth/idempotency/envelope/header).
- Đã pass test mục tiêu + lint + build, chuyển story sang `review`.

### File List

- `tmdt/src/modules/payment/payment-service.js`
- `tmdt/src/modules/order/order-service.test.js`
- `tmdt/src/app/api/webhooks/payment/route.js`
- `tmdt/src/app/api/checkout/route.test.js`
- `tmdt/src/app/(customer)/checkout/checkout-client.tsx`
- `tmdt/src/app/(customer)/checkout/checkout-client.test.js`
- `_bmad-output/implementation-artifacts/4-4-xu-ly-callback-payment-trang-thai-pending-va-retry.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-13: Tạo mới Story 4.4 từ trạng thái `backlog` và chuẩn hóa context triển khai theo BMAD create-story workflow.
- 2026-04-13: Áp dụng toàn bộ review patches Story 4.4, bổ sung test coverage webhook/retry/status và cập nhật trạng thái sang `review`.
