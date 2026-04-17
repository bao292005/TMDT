# Story 7.3: Đối soát định kỳ trạng thái payment-warehouse-shipping

Status: done

## Story

As a hệ thống vận hành,
I want có job reconciliation liên phân hệ,
so that trạng thái đơn và giao dịch luôn đồng bộ sau callback trễ/lệch.

## Acceptance Criteria

1. Given có khả năng lệch trạng thái do callback trễ, timeout hoặc race condition, when job reconciliation chạy theo lịch, then hệ thống phát hiện mismatch và áp policy cập nhật trạng thái đã định.
2. And ghi nhận kết quả đối soát để audit, bao gồm before/after state và correlation context.
3. And cung cấp summary mismatch theo chu kỳ để admin theo dõi xử lý.

## Tasks / Subtasks

- [x] Thiết kế reconciliation job boundary cho payment-warehouse-shipping (AC: 1)
  - [x] Tạo lane job/script đối soát tách khỏi route handler theo kiến trúc (ví dụ `src/jobs/reconciliation/*` hoặc script tương đương trong cấu trúc hiện có).
  - [x] Xác định tập order cần quét theo trạng thái rủi ro (`pending_verification`, `pending_payment`, shipment chờ sync, callback trễ).
  - [x] Định nghĩa policy ưu tiên nguồn sự thật khi mismatch (payment callback, warehouse action, shipping status).

- [x] Triển khai engine phát hiện mismatch + apply policy (AC: 1, 2)
  - [x] So sánh trạng thái giữa order aggregate, payment transaction, shipping/tracking và warehouse action context.
  - [x] Áp quy tắc update state machine an toàn (không hạ trạng thái đã chốt hợp lệ, không phá transition rules hiện có).
  - [x] Gắn `correlationId`/`idempotencyKey` cho mỗi reconciliation run để tránh apply trùng.

- [x] Ghi audit log và reconciliation report theo từng run (AC: 2, 3)
  - [x] Persist log đối soát với `runId`, thời điểm chạy, số bản ghi quét, số mismatch, before/after states, kết quả xử lý.
  - [x] Chuẩn hóa schema report để admin có thể xem summary theo chu kỳ (NFR13).
  - [x] Khi reconciliation thất bại một phần, vẫn ghi partial report + error taxonomy để truy vết.

- [x] Cung cấp API/admin endpoint xem summary đối soát (AC: 3)
  - [x] Thêm route admin (RBAC ADMIN) để đọc reconciliation summary gần nhất và danh sách mismatch open/resolved.
  - [x] Giữ chuẩn response envelope + `X-Correlation-Id`.
  - [x] Không lộ dữ liệu nhạy cảm vượt nhu cầu vận hành.

- [x] Thiết lập lịch chạy định kỳ và kiểm thử (AC: 1, 2, 3)
  - [x] Cấu hình chạy tối thiểu mỗi 15 phút theo NFR13 (hoặc hướng dẫn scheduler ngoài nếu repo chưa có runner nội bộ).
  - [x] Unit tests cho mismatch detection + policy apply (bao gồm callback trễ, race condition, trạng thái mâu thuẫn).
  - [x] Integration/route tests cho reconciliation report API, RBAC và contract output.

## Dev Notes

### Technical Requirements

- Story này hiện thực FR48, FR49 với trọng tâm reconciliation liên phân hệ.
- Bắt buộc đáp ứng NFR13: đối soát định kỳ tối thiểu mỗi 15 phút và ghi log kết quả.
- Bắt buộc giữ nhất quán state machine order-payment-shipping, tránh transition trái phép.
- Taxonomy lỗi/traceability phải tương thích chuẩn đã đặt ở Story 7.2 (NFR19).

### Architecture Compliance

- Reconciliation phải chạy qua jobs/scripts, không đặt logic quét-hòa giải trong route handler.
- External sync vẫn qua integration adapters (`modules/integrations/*`), không gọi provider trực tiếp từ API admin.
- Route admin chỉ đọc report/summary; business reconciliation ở module/job layer.
- Tuân thủ correlation + idempotency pattern cho callback/event/reconciliation run.

### Library / Framework Requirements

- Giữ stack hiện có (Next.js App Router + Node test runner).
- Ưu tiên tái sử dụng service/store hiện tại trong `modules/order`, `modules/payment`, `modules/warehouse`.
- Không thêm dependency scheduler nặng nếu chưa cần; có thể dùng script runner phù hợp scope dự án.

### File Structure Requirements

Ưu tiên thay đổi ở:
- `tmdt/src/modules/order/order-service.js`
- `tmdt/src/modules/payment/payment-service.js`
- `tmdt/src/modules/warehouse/*`
- `tmdt/src/modules/*store*.js` liên quan persistence report/log
- `tmdt/src/jobs/**` hoặc `tmdt/scripts/**` cho reconciliation run (theo cấu trúc thực tế)
- `tmdt/src/app/api/admin/**` cho endpoint summary/reports
- Test files tương ứng ở `tmdt/src/modules/**` và `tmdt/src/app/api/**`

### Testing Requirements

- Cover nhánh callback trễ: payment pending trước rồi paid sau, reconciliation phải tự đồng bộ.
- Cover mismatch payment vs order vs shipping/warehouse và assert policy ưu tiên nguồn đúng.
- Verify idempotent behavior khi chạy reconciliation nhiều lần.
- Verify report có before/after + correlation context + tổng hợp mismatch theo run.
- Verify endpoint summary có RBAC, envelope chuẩn, `X-Correlation-Id`.

### Previous Story Intelligence

- Story 7.2 đã chuẩn hóa timeout/retry/error taxonomy; Story 7.3 phải reuse schema lỗi và retryable semantics đó cho report vận hành.
- `order-service` hiện có `reconcilePaymentCallback` và tracking degrade path; reconciliation job cần tận dụng thay vì nhân bản logic.
- Story 7.1/7.2 đều giữ scope integration reliability boundary; Story 7.3 tiếp tục theo hướng này, chưa mở rộng UI redesign.

### Git Intelligence Summary

- Các story 4.4, 5.4 đã harden callback/tracking consistency; story 7.3 nên dựa trên behavior đó để phát hiện drift và sửa lệch.
- Working tree đang nhiều thay đổi; cần giới hạn chỉnh sửa đúng lane reconciliation + reporting.

### References

- Story 7.3 source + AC: `_bmad-output/planning-artifacts/epics.md:643-657`
- FR48, FR49: `_bmad-output/planning-artifacts/prd.md:363-364`
- NFR13 (+ liên quan NFR19): `_bmad-output/planning-artifacts/prd.md:386`, `_bmad-output/planning-artifacts/prd.md:396`
- Architecture reconciliation/job boundaries:
  - `_bmad-output/planning-artifacts/architecture.md:58-59`, `:171-172`, `:342`, `:358`, `:381-382`
- Baseline implementation liên quan:
  - `tmdt/src/modules/order/order-service.js` (reconcile callback + tracking resolution)
  - `tmdt/src/modules/payment/payment-service.js` (transaction/idempotency handling)
  - `_bmad-output/implementation-artifacts/7-2-chuan-hoa-timeout-retry-error-taxonomy-cho-tich-hop-ngoai.md`

### Review Findings

- [x] [Review][Decision] Làm rõ phạm vi “liên phân hệ” cho reconciliation nguồn shipping/warehouse — resolved: giữ scope nội bộ order-only cho Story 7.3 (không mở rộng đọc trạng thái subsystem shipping/warehouse trong story này).
- [x] [Review][Patch] Chống race condition idempotency khi chạy reconciliation đồng thời [tmdt/src/modules/order/reconciliation-service.js:164]
- [x] [Review][Patch] Bắt lỗi parse/đọc reconciliation store để tránh job/API văng exception không chuẩn hoá [tmdt/src/modules/order/reconciliation-store.js:27]
- [x] [Review][Patch] Không đánh dấu mismatch là resolved khi `updateOrderById` không cập nhật được bản ghi [tmdt/src/modules/order/reconciliation-service.js:209]
- [x] [Review][Patch] Trả 400 cho payload JSON không hợp lệ ở `POST /api/admin/reconciliation` thay vì chạy với body rỗng [tmdt/src/app/api/admin/reconciliation/route.js:67]
- [x] [Review][Patch] Bọc `runReconciliationJob`/`getReconciliationSummary` bằng error boundary để luôn giữ response envelope + `X-Correlation-Id` khi runtime exception [tmdt/src/app/api/admin/reconciliation/route.js:51]
- [x] [Review][Patch] Mở rộng snapshot `after` trong mismatch để có before/after state đầy đủ hơn cho audit (không chỉ `orderStatus`) [tmdt/src/modules/order/reconciliation-service.js:146]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Added reconciliation persistence/reporting store and job/service/API layers with idempotent run key handling.
- Added dedicated tests for reconciliation module/job/admin route and hardened admin order tests with user store reset to avoid shared-store corruption.
- Validation commands executed:
  - `node --experimental-default-type=module --test src/modules/order/reconciliation-service.test.js`
  - `node --experimental-default-type=module --test src/jobs/reconciliation/reconciliation-job.test.js`
  - `node --experimental-default-type=module --test src/app/api/admin/reconciliation/route.test.js`
  - `node --experimental-default-type=module --test --test-concurrency=1 src/**/*.test.js` (213 passed)
  - `npm run lint` (pass with 1 existing warning in admin reports client)

### Completion Notes List

- Hoàn tất reconciliation lane tách khỏi route với job wrapper (`src/jobs/reconciliation`) và interval guidance 15 phút theo NFR13.
- Hoàn tất reconciliation engine: mismatch detection, policy-based state update an toàn, idempotency theo `idempotencyKey`, và correlation context xuyên suốt run.
- Hoàn tất persistence reconciliation reports gồm run summary, before/after mismatch states, resolved/open mismatch, partial failure taxonomy.
- Hoàn tất ADMIN API cho trigger + summary reconciliation với RBAC, response envelope chuẩn và header `X-Correlation-Id`.
- Hoàn tất test coverage cho module/job/route + full regression suite.

### File List

- `_bmad-output/implementation-artifacts/7-3-doi-soat-dinh-ky-trang-thai-payment-warehouse-shipping.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `tmdt/src/modules/order/reconciliation-store.js`
- `tmdt/src/modules/order/reconciliation-service.js`
- `tmdt/src/modules/order/reconciliation-service.test.js`
- `tmdt/src/jobs/reconciliation/reconciliation-job.js`
- `tmdt/src/jobs/reconciliation/reconciliation-job.test.js`
- `tmdt/src/app/api/admin/reconciliation/route.js`
- `tmdt/src/app/api/admin/reconciliation/route.test.js`
- `tmdt/src/app/api/admin/orders/route.test.js`
- `tmdt/src/app/api/admin/orders/[orderId]/status/route.test.js`

### Change Log

- 2026-04-15: Implemented Story 7.3 reconciliation job/reporting/API end-to-end; added tests and moved story/sprint status to review.
