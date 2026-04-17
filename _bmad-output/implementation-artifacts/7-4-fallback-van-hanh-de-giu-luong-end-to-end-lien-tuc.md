# Story 7.4: Fallback vận hành để giữ luồng end-to-end liên tục

Status: done

## Story

As a nhóm dự án,
I want fallback an toàn cho luồng core khi provider gián đoạn,
so that demo và trải nghiệm người dùng không bị dừng toàn bộ.

## Acceptance Criteria

1. Given một hoặc nhiều tích hợp ngoài không khả dụng, when người dùng thực hiện luồng chính từ catalog đến tracking, then hệ thống kích hoạt fallback tương ứng mà vẫn giữ được tiến trình nghiệp vụ hợp lệ.
2. And người dùng nhận thông báo trạng thái và next action rõ ràng.
3. And mọi lần kích hoạt fallback đều được ghi nhận event/log phục vụ hậu kiểm.

## Tasks / Subtasks

- [x] Thiết kế fallback matrix cho toàn bộ luồng core (AC: 1)
  - [x] Xác định các điểm lỗi chính theo lane: AI try-on, payment callback/status, shipping tracking/sync.
  - [x] Định nghĩa fallback action tương ứng cho từng lane (degrade mode, safe-state, manual retry, deferred sync).
  - [x] Chuẩn hóa tiêu chí “business-valid continuation” để đảm bảo flow không đứt.

- [x] Triển khai orchestration fallback ở module/service boundary (AC: 1, 3)
  - [x] Áp fallback nhất quán trong `tryon`, `payment`, `order`, `shipping` mà không bypass state machine.
  - [x] Đảm bảo fallback không ghi đè dữ liệu tốt hiện có (preserve last known safe state).
  - [x] Ghi event/log khi fallback activated/recovered kèm `correlationId`, `source`, `reason`, `actionTaken`.

- [x] Chuẩn hóa user-facing recovery messaging + next action (AC: 2)
  - [x] Tại các API route liên quan, trả state/error rõ ràng để UI render thông điệp recovery chuẩn.
  - [x] Reuse pattern `RecoveryActionBanner`/status timeline đã có để hiển thị next action theo ngữ cảnh.
  - [x] Đảm bảo semantics a11y: thông điệp không phụ thuộc màu, có label trạng thái + hành động kế tiếp.

- [x] Bổ sung fallback observability/reporting cho vận hành (AC: 3)
  - [x] Tạo summary fallback activations theo chu kỳ (count theo source, trạng thái recovered/unresolved).
  - [x] Cho phép admin đọc báo cáo fallback gần nhất qua endpoint bảo vệ RBAC.
  - [x] Liên kết fallback record với reconciliation trace để hậu kiểm end-to-end.

- [x] Thiết lập kiểm thử chaos chức năng cho fallback continuity (AC: 1, 2, 3)
  - [x] Mô phỏng provider down/timeout trên AI, payment, shipping và assert luồng core vẫn tiếp tục hợp lệ.
  - [x] Test message/next-action consistency cho các trạng thái degraded/recovered.
  - [x] Test log/event capture đầy đủ cho mỗi lần kích hoạt fallback.

## Dev Notes

### Technical Requirements

- Story này hiện thực FR50 với mục tiêu đảm bảo continuity cho demo end-to-end khi tích hợp ngoài lỗi.
- Gắn chặt với NFR12: kích hoạt fallback trong <= 5 giây khi tích hợp ngoài lỗi.
- Kế thừa NFR4/NFR11/NFR19: status clarity, retry có kiểm soát, schema lỗi/traceability nhất quán.
- Không mở rộng scope sang redesign UI tổng thể (Epic 8), chỉ đảm bảo recovery behavior xuyên luồng.

### Architecture Compliance

- Fallback logic nằm ở module/service + integration boundary, không hardcode trong UI.
- Route layer chỉ mapping response/status và giữ envelope + `X-Correlation-Id`.
- Reconciliation/reporting cho fallback phải tương thích lane jobs/reports đã định hướng ở Epic 7.3.
- External calls vẫn đi qua `src/modules/integrations/*`, không gọi provider trực tiếp từ app routes.

### Library / Framework Requirements

- Giữ stack hiện tại (Next.js App Router + Node test runner).
- Ưu tiên tái sử dụng primitive hiện có (retryable flags, timeline states, recovery banners).
- Không thêm dependency nặng nếu có thể triển khai bằng utilities/module hiện hữu.

### File Structure Requirements

Ưu tiên thay đổi ở:
- `tmdt/src/modules/tryon/*`
- `tmdt/src/modules/payment/*`
- `tmdt/src/modules/order/*`
- `tmdt/src/modules/integrations/shipping/*`
- `tmdt/src/app/api/try-on/route.js`
- `tmdt/src/app/api/checkout/*`
- `tmdt/src/app/api/orders/*`
- `tmdt/src/app/(customer)/**` (chỉ các điểm hiển thị recovery/status đã có)
- `tmdt/src/app/api/admin/**` (nếu cần summary fallback cho vận hành)
- Test files tương ứng ở `tmdt/src/modules/**` và `tmdt/src/app/api/**`

### Testing Requirements

- Chaos-style tests cho từng provider outage: AI timeout, payment callback inconsistency, shipping provider unavailable.
- Assert continuity: user vẫn hoàn thành được flow hợp lệ ở mức degraded mode.
- Assert user messaging có `state + next action` rõ và phù hợp role/context.
- Assert fallback activation/recovery đều có log/event kèm correlation context.
- Assert không regress các flow đã harden ở story 4.4, 5.4, 7.2, 7.3.

### Previous Story Intelligence

- Story 7.3 đã chuẩn hóa reconciliation định kỳ và trace context; story 7.4 cần bám framework đó để hậu kiểm fallback.
- Story 7.2 đã chốt timeout/retry/error taxonomy; story 7.4 phải reuse taxonomy thay vì tạo schema lỗi mới.
- Story 5.4 đã có degraded tracking + recovery banner; đây là baseline quan trọng cho shipping fallback.

### Git Intelligence Summary

- Lane payment callback/tracking đã được harden ở các story trước; story 7.4 cần nối continuity đa lane thay vì sửa từng lane độc lập.
- Working tree đang lớn, cần giới hạn thay đổi đúng lane fallback orchestration và observability.

### References

- Story 7.4 source + AC: `_bmad-output/planning-artifacts/epics.md:659-673`
- FR50: `_bmad-output/planning-artifacts/prd.md:365`
- NFR12 (+ liên quan NFR4/NFR11/NFR19): `_bmad-output/planning-artifacts/prd.md:373`, `_bmad-output/planning-artifacts/prd.md:384-385`, `_bmad-output/planning-artifacts/prd.md:396`
- Architecture resilience/fallback boundaries:
  - `_bmad-output/planning-artifacts/architecture.md:30`, `:48`, `:58-59`, `:342`, `:358`, `:382`
- UX recovery/status guidance:
  - `_bmad-output/planning-artifacts/ux-design-specification.md:77`, `:357-358`, `:495`, `:509-513`
- Baseline implementation context:
  - `_bmad-output/implementation-artifacts/5-4-fallback-trang-thai-van-chuyen-khi-tich-hop-loi.md`
  - `_bmad-output/implementation-artifacts/7-2-chuan-hoa-timeout-retry-error-taxonomy-cho-tich-hop-ngoai.md`
  - `_bmad-output/implementation-artifacts/7-3-doi-soat-dinh-ky-trang-thai-payment-warehouse-shipping.md`

### Review Findings

- [x] [Review][Patch] Chuẩn hoá contract `nextAction` trong API fallback lane payment [tmdt/src/app/api/checkout/route.js]
- [x] [Review][Patch] Đảm bảo fallback event không bị mất khi ghi audit lỗi [tmdt/src/modules/payment/payment-service.js]
- [x] [Review][Patch] Ép buộc `correlationId` không null cho payment fallback events [tmdt/src/modules/payment/payment-service.js]
- [x] [Review][Decision] Chốt mức “liên kết fallback với reconciliation trace” ở cấp tổng hợp là đủ: API admin fallback tiếp tục trả co-return `{ fallback, reconciliation }`, chưa bắt buộc mapping event→run theo từng bản ghi.
- [x] [Review][Patch] Đáp ứng NFR12 fallback <= 5 giây cho lane try-on [tmdt/src/modules/tryon/tryon-service.js]
- [x] [Review][Patch] Bỏ cơ chế “best-effort swallow” để không làm mất fallback event/log [tmdt/src/modules/order/order-service.js]
- [x] [Review][Patch] Chuẩn hoá `correlationId` không null cho fallback events ở try-on/shipping/audit store [tmdt/src/modules/identity/audit-log-store.js]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Added fallback audit primitives in identity store (`appendFallbackAuditEvent`, fallback summary aggregation with unresolved/recovered breakdown and reconciliation linkage).
- Added multi-lane fallback activation/recovery event emission in try-on, payment, and order/shipping services with propagated `correlationId`.
- Added admin fallback observability endpoint with RBAC and combined fallback + reconciliation response shape.
- Validation commands executed:
  - `node --experimental-default-type=module --test src/modules/tryon/tryon-service.test.js`
  - `node --experimental-default-type=module --test src/modules/payment/payment-service.test.js`
  - `node --experimental-default-type=module --test src/modules/order/order-service.test.js`
  - `node --experimental-default-type=module --test src/app/api/try-on/route.test.js`
  - `node --experimental-default-type=module --test src/app/api/admin/fallback/route.test.js`
  - `node --experimental-default-type=module --test --test-concurrency=1 src/**/*.test.js` (216 passed)
  - `npm run lint` (pass with existing warning)

### Completion Notes List

- Hoàn tất fallback orchestration xuyên lane AI try-on, payment, shipping theo module/service boundary, không bypass state machine.
- Hoàn tất correlation propagation từ route layer vào service layer cho các luồng try-on, checkout, callback, retry-payment, order detail.
- Hoàn tất fallback observability cho vận hành: activation/recovery events, summary by source/status, unresolved tracking và reconciliation linkage.
- Hoàn tất ADMIN endpoint đọc fallback summary gần nhất với RBAC + response envelope + `X-Correlation-Id`.
- Hoàn tất test coverage cho fallback continuity scenarios và admin fallback reporting route.

### File List

- `_bmad-output/implementation-artifacts/7-4-fallback-van-hanh-de-giu-luong-end-to-end-lien-tuc.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `tmdt/src/modules/identity/audit-log-store.js`
- `tmdt/src/modules/order/order-service.js`
- `tmdt/src/modules/payment/payment-service.js`
- `tmdt/src/modules/tryon/tryon-service.js`
- `tmdt/src/modules/order/order-service.test.js`
- `tmdt/src/modules/payment/payment-service.test.js`
- `tmdt/src/modules/tryon/tryon-service.test.js`
- `tmdt/src/app/api/try-on/route.js`
- `tmdt/src/app/api/try-on/route.test.js`
- `tmdt/src/app/api/checkout/route.js`
- `tmdt/src/app/api/checkout/retry-payment/route.js`
- `tmdt/src/app/api/orders/[orderId]/route.js`
- `tmdt/src/app/api/webhooks/payment/route.js`
- `tmdt/src/app/api/admin/fallback/route.js`
- `tmdt/src/app/api/admin/fallback/route.test.js`

### Change Log

- 2026-04-15: Implemented Story 7.4 fallback continuity across AI/payment/shipping lanes, added fallback observability endpoint, and moved story/sprint status to review.
