# Story 5.4: Fallback trạng thái vận chuyển khi tích hợp lỗi

Status: done

## Story

As a hệ thống vận hành,
I want có cơ chế dự phòng khi shipping API gián đoạn,
so that tracking không bị mất và luồng demo vẫn hoạt động.

## Acceptance Criteria

1. Given tích hợp vận chuyển lỗi hoặc timeout, when hệ thống không lấy được trạng thái mới từ provider, then hệ thống giữ trạng thái gần nhất an toàn, bật cờ degraded và retry theo policy.
2. And UI hiển thị `RecoveryActionBanner` với thông điệp + hành động tiếp theo cho customer/admin.
3. And không làm hỏng tiến trình theo dõi đơn của khách hàng.

## Tasks / Subtasks

- [x] Triển khai fallback tracking state ở service boundary (AC: 1, 3)
  - [x] Mở rộng flow đọc tracking trong `src/modules/order/order-service.js` để giữ `lastKnownSafeState` khi provider timeout/lỗi.
  - [x] Bổ sung metadata degraded (`isDegraded`, `degradedReason`, `lastSyncedAt`) trong payload tracking mà không phá contract hiện có.
  - [x] Đảm bảo chỉ retry với lỗi transient theo policy; lỗi business/validation không retry.
- [x] Chuẩn hóa tích hợp shipping adapter theo timeout/retry/fallback (AC: 1)
  - [x] Tạo/hoàn thiện shipping integration boundary trong `src/modules/integrations/shipping/*` theo kiến trúc module adapter.
  - [x] Chuẩn hóa mapping lỗi retryable/non-retryable và hành vi fallback an toàn.
  - [x] Ghi nhận event/log cho nhánh degraded phục vụ demo và hậu kiểm.
- [x] Bổ sung API contract cho tracking degraded state (AC: 1, 3)
  - [x] Cập nhật `GET /api/orders/[orderId]` để trả về tracking context đủ cho UI recovery.
  - [x] Giữ nguyên response envelope `{ success, state, data | error, message }` + `X-Correlation-Id`.
  - [x] Không thay đổi auth boundary Customer (`requireApiRole`).
- [x] Tích hợp `RecoveryActionBanner` vào UI tracking (AC: 2, 3)
  - [x] Cập nhật `OrderDetailClient` hiển thị banner khi tracking ở trạng thái degraded.
  - [x] Banner thể hiện rõ lý do ngắn gọn + CTA chính/phụ theo UX spec (retry/manual refresh/liên hệ hỗ trợ tùy trạng thái).
  - [x] Đảm bảo non-color cue và hành vi accessibility (role=alert cho trạng thái khẩn).
- [x] Regression + quality gates (AC: 1, 2, 3)
  - [x] Route tests: unauthorized/forbidden/success/degraded contract cho `GET /api/orders/[orderId]`.
  - [x] Service tests: timeout path, retry policy, safe-state preservation, degraded flag.
  - [x] UI tests: `RecoveryActionBanner` render đúng theo state + CTA + non-color cues.
  - [x] Chạy tối thiểu: `node --experimental-default-type=module --test src/app/api/orders/route.test.js` và test liên quan order detail client.

### Review Findings

- [x] [Review][Patch] Bổ sung CTA thao tác trực tiếp cho `RecoveryActionBanner` theo AC2 (primary/secondary action thay vì chỉ guidance text) [tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.tsx]
- [x] [Review][Defer] Bổ sung recovery UI cho admin theo AC2 [tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.tsx] — deferred, hiện chưa có admin order-detail UI trong phạm vi story 5.4; cần tách sang story UI/admin riêng để tránh mở rộng scope.
- [x] [Review][Patch] Polling không dừng với lỗi cố định 403/404 khi `latestOrderRef` còn null [tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.tsx:1277]
- [x] [Review][Patch] Có thể hạ trạng thái từ delivered xuống shipped khi provider trả non-delivered [tmdt/src/modules/order/order-service.js:588]
- [x] [Review][Patch] `lastSyncedAt` degraded đang dùng timestamp safe-state thay vì thời điểm sync lỗi thực tế [tmdt/src/modules/order/order-service.js:625]
- [x] [Review][Patch] `timeoutMs` của shipping adapter chưa được chặn biên trước retry sleep [tmdt/src/modules/integrations/shipping/shipping-adapter.js:35]
- [x] [Review][Patch] Test retry của shipping adapter chưa xác thực số lần attempt/retry behavior [tmdt/src/modules/integrations/shipping/shipping-adapter.test.js:18]
- [x] [Review][Defer] `listCustomerOrders` fail-fast toàn bộ danh sách khi 1 payment summary lỗi [tmdt/src/modules/order/order-service.js:446] — deferred, pre-existing
- [x] [Review][Defer] `reconcilePaymentCallback` thiếu guard payload trước khi truy cập `payload.orderId` [tmdt/src/modules/order/order-service.js:167] — deferred, pre-existing
- [x] [Review][Defer] Test UI đang thiên về source-string assertion nên có thể lọt regression runtime [tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.test.js:12] — deferred, pre-existing

## Dev Notes

Story 5.4 mở rộng Story 5.2/5.3 theo hướng resilience cho tracking shipping integration. Scope tập trung fallback/degraded/retry policy khi provider lỗi, không mở rộng sang redesign UI tổng thể (Epic 8) hay reconciliation đa phân hệ full-stack (Epic 7.3).

### Technical Requirements

- Bám FR38/FR39: cập nhật trạng thái giao hàng từ provider + cơ chế fallback khi tích hợp gián đoạn.
- Tuân thủ NFR4: đồng bộ trạng thái <= 10 giây; khi realtime lỗi phải fallback polling 15 giây.
- Tuân thủ NFR11/NFR12/NFR13: timeout/retry có kiểm soát, degraded fallback không phá luồng demo, event/log đầy đủ để truy vết.
- Không làm regress contract tracking timeline đã có ở Story 5.2 (status label/timestamp/next action/tracking number).

### Architecture Compliance

- Route layer mỏng ở `src/app/api/orders/*`; business logic fallback/retry ở `src/modules/order/*` và integration adapter ở `src/modules/integrations/shipping/*`.
- Không nhúng business rule retry/fallback vào React client; UI chỉ render theo API contract.
- Tôn trọng boundary module: external provider chỉ đi qua integration adapter, không gọi trực tiếp từ route/UI.
- Giữ nhất quán dữ liệu order lifecycle payment -> warehouse -> shipping, tránh state transition tắt.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js App Router + React + Node test runner.
- Không thêm dependency mới nếu có thể xử lý bằng primitive hiện có.
- Nếu cần thay đổi behavior framework-level, đối chiếu docs local Next.js theo hướng dẫn `AGENTS.md`/`CLAUDE.md`.

### File Structure Requirements

Ưu tiên thay đổi trong:
- `tmdt/src/modules/order/order-service.js`
- `tmdt/src/modules/integrations/shipping/*` (tạo mới hoặc mở rộng boundary adapter)
- `tmdt/src/app/api/orders/[orderId]/route.js`
- `tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.tsx`
- `tmdt/src/app/(customer)/orders/[orderId]/order-detail-client-logic.js`
- `tmdt/src/app/api/orders/route.test.js`
- test service/integration liên quan order + shipping fallback

### Testing Requirements

- Cover đầy đủ nhánh timeout/provider error -> degraded flag -> fallback safe state.
- Verify retry policy: chỉ retry transient errors; không retry business errors.
- Verify UI `RecoveryActionBanner` đúng semantics (message + CTA), có non-color cue và role phù hợp.
- Đảm bảo regression của Story 5.1/5.2/5.3 không fail (orders detail, tracking timeline, warehouse tracking number).

### Previous Story Intelligence

- Story 5.2 đã chuẩn hóa tracking timeline và polling fallback 15 giây; Story 5.4 phải mở rộng theo hướng degraded mà vẫn giữ shape payload ổn định.
- Story 5.2 có deferred risk fail-fast khi payment summary lỗi; khi thêm shipping fallback cần tránh làm nặng thêm fail-fast behavior.
- Story 5.3 đã persist `trackingNumber` khi create shipment thành công; Story 5.4 cần tận dụng `trackingNumber` + trạng thái gần nhất thay vì reset/blank khi provider lỗi.

### Git Intelligence Summary

- Commit gần nhất `89e1d32` đã harden callback payment/status consistency; Story 5.4 nên kế thừa nguyên tắc state consistency + error mapping rõ ràng.
- Commit `1108dbe` thiết lập auth/session nền tảng; giữ nguyên auth boundary hiện có khi mở rộng tracking fallback.

### Latest Technical Information

- UX spec định nghĩa `RecoveryActionBanner` cho lỗi shipping/payment/AI với anatomy: severity + short reason + primary/secondary CTA, trạng thái: info/warning/error/success-recovered.
- Accessibility yêu cầu role=alert cho trạng thái khẩn và thông điệp không phụ thuộc màu.
- Epic runbook phân vai nhấn mạnh wave W4/W5: Core triển khai reliability + Frontend áp status/recovery UI theo contract.

### Project Context Reference

- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/implementation-artifacts/5-2-theo-doi-trang-thai-don-va-tracking-number.md`
- `_bmad-output/implementation-artifacts/5-3-warehouse-queue-xu-ly-dong-goi-va-tao-van-don.md`

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:531-545`
- FR mapping: `_bmad-output/planning-artifacts/prd.md:336-337`
- NFR mapping: `_bmad-output/planning-artifacts/prd.md:360`, `:371-372`
- Architecture boundaries: `_bmad-output/planning-artifacts/architecture.md:332`, `:356`, `:376`, `:441`
- UX component guidance: `_bmad-output/planning-artifacts/ux-design-specification.md:509-515`
- Existing baseline:
  - `tmdt/src/modules/order/order-service.js:337-399`
  - `tmdt/src/app/api/orders/[orderId]/route.js:40-63`
  - `tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.tsx:196-213`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `node --experimental-default-type=module --test src/app/api/orders/route.test.js`
- `node --experimental-default-type=module --test src/modules/order/order-service.test.js`
- `node --experimental-default-type=module --test src/modules/integrations/shipping/shipping-adapter.test.js`
- `node --experimental-default-type=module --test src/app/(customer)/orders/[orderId]/order-detail-client.test.js`

### Completion Notes List

- Hoàn thiện fallback tracking tại service boundary: giữ safe state khi provider lỗi, trả metadata degraded (`isDegraded`, `degradedReason`, `lastSyncedAt`, `retryable`) và next action phù hợp.
- Bổ sung shipping adapter boundary với timeout/retry policy và phân loại lỗi retryable/non-retryable, đảm bảo lỗi business không retry.
- Tích hợp `RecoveryActionBanner` cho order detail client khi degraded, có thông điệp recovery và semantics accessibility `role="alert"`.
- Mở rộng regression coverage cho integration/service/API/UI; các test mục tiêu của Story 5.4 đều pass.

### File List

- `tmdt/src/modules/integrations/shipping/shipping-adapter.js`
- `tmdt/src/modules/integrations/shipping/shipping-adapter.test.js`
- `tmdt/src/modules/order/order-service.js`
- `tmdt/src/modules/order/order-service.test.js`
- `tmdt/src/app/api/orders/route.test.js`
- `tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.tsx`
- `tmdt/src/app/(customer)/orders/[orderId]/order-detail-client-logic.js`
- `tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.test.js`
- `_bmad-output/implementation-artifacts/5-4-fallback-trang-thai-van-chuyen-khi-tich-hop-loi.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-14: Tạo mới Story 5.4 từ trạng thái `backlog` sang `ready-for-dev`.
- 2026-04-14: Hoàn tất implementation Story 5.4, cập nhật status sang `review` cùng test evidence.
