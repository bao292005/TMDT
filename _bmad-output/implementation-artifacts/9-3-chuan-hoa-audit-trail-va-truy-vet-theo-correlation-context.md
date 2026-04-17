# Story 9.3: Chuẩn hóa audit trail và truy vết theo correlation context

Status: ready-for-dev

## Story

As a admin vận hành,
I want truy vết được chuỗi sự kiện nghiệp vụ xuyên phân hệ,
so that tôi có thể điều tra sự cố và đối soát dữ liệu nhanh chóng.

## Acceptance Criteria

1. Given các hành động quan trọng xảy ra ở checkout, payment, shipping, admin operations, when hệ thống ghi log/audit, then mỗi bản ghi có correlation context để nối chuỗi truy vết theo order hoặc transaction.
2. And có khả năng lọc và tra cứu theo mốc thời gian, loại sự kiện và trạng thái.
3. And dữ liệu audit không làm lộ thông tin nhạy cảm ngoài phạm vi cần thiết.

## Tasks / Subtasks

- [ ] Chuẩn hóa schema audit trail có correlation context xuyên lane (AC: 1, 3)
  - [ ] Thiết lập payload audit thống nhất gồm `eventId`, `occurredAt`, `source`, `correlationId`, `idempotencyKey`, `status`, `data`.
  - [ ] Chuẩn hóa mapping event cho checkout/payment/shipping/admin operations để truy vết theo `orderId` hoặc `transactionId`.
  - [ ] Bổ sung quy tắc redaction/masking để tránh lộ dữ liệu nhạy cảm trong trường `data`.

- [ ] Đồng bộ phát sinh audit event tại service/boundary layer (AC: 1)
  - [ ] Gắn `correlationId` xuyên route -> service -> integration cho các luồng quan trọng.
  - [ ] Đảm bảo callback/webhook path giữ idempotent behavior theo `idempotencyKey` khi ghi audit.
  - [ ] Ghi nhận before/after state cho các hành động override quan trọng của admin và cập nhật trạng thái đơn.

- [ ] Thiết lập cơ chế tra cứu/lọc audit cho vận hành (AC: 2)
  - [ ] Hỗ trợ filter theo mốc thời gian, event type/source, status, correlation key.
  - [ ] Chuẩn hóa response/summary để admin có thể truy dấu nhanh theo phiên sự cố.
  - [ ] Bảo đảm truy vấn không phụ thuộc lane cụ thể, cho phép nối chuỗi đa phân hệ.

- [ ] Chuẩn hóa audit logging cho các điểm nhạy cảm (AC: 1, 3)
  - [ ] Đảm bảo thao tác quản trị quan trọng phát sinh audit trong SLA đã đặt (NFR7).
  - [ ] Bổ sung guardrails tránh ghi PII không cần thiết và không lưu secrets.
  - [ ] Đồng bộ format log/audit để reporting extractor và reconciliation flow có thể tái sử dụng.

- [ ] Thiết lập test/checklist cho auditability và traceability (AC: 1, 2, 3)
  - [ ] Test mỗi hành động trọng yếu đều có correlation context đầy đủ.
  - [ ] Test khả năng filter/tra cứu theo thời gian, loại sự kiện, trạng thái.
  - [ ] Test dữ liệu nhạy cảm được che/mask đúng quy tắc và không rò rỉ trong output.

## Dev Notes

### Technical Requirements

- Story này hiện thực trọng tâm auditability của Epic 9, bám FR48/FR49 và NFR7/NFR13/NFR19.
- Mục tiêu là dựng nền traceability đa lane (checkout/payment/shipping/admin) để hỗ trợ điều tra sự cố và đối soát.
- Phải giữ tính idempotent/correlation cho callback-event flows, không tạo duplicate audit gây nhiễu.

### Architecture Compliance

- Audit logic và correlation mapping nằm ở `src/modules/*` + boundary integrations; route chỉ làm mapping/envelope.
- Tuân thủ pattern callback -> idempotency check -> state machine update -> audit log.
- Reconciliation/jobs/reporting extractors phải đọc được chuẩn audit payload thống nhất.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js App Router + module architecture + utilities nội bộ.
- Reuse logging/audit utilities hiện có; không thêm logging framework mới khi chưa cần.
- Duy trì chuẩn `X-Correlation-Id`/`correlationId` đang dùng ở API boundary và luồng tích hợp.

### File Structure Requirements

Ưu tiên thay đổi ở:
- `tmdt/src/modules/identity/audit-log-store.js`
- `tmdt/src/modules/order/**`
- `tmdt/src/modules/payment/**`
- `tmdt/src/modules/warehouse/**`
- `tmdt/src/modules/reporting/**`
- `tmdt/src/shared/utils/logger.js`
- `tmdt/src/app/api/admin/**`
- `tmdt/src/app/api/checkout/**`
- `tmdt/src/app/api/orders/**`
- `tmdt/src/app/api/webhooks/payment/route.js`
- Test files liên quan trong `tmdt/src/**`

### Testing Requirements

- Verify audit record có đủ correlation context (`correlationId`, `idempotencyKey`, source, event metadata).
- Verify filter/lookup theo time range, event type/source, status hoạt động nhất quán.
- Verify thao tác admin quan trọng luôn có audit log trong SLA và có before/after context phù hợp.
- Verify audit output không lộ dữ liệu nhạy cảm; chỉ chứa thông tin cần cho vận hành.

### Previous Story Intelligence

- Story 9.2 đã chốt nền migration + seed và handoff rõ cho 9.3/9.4; 9.3 cần tận dụng schema foundation thay vì tạo model rời.
- Epic 7.2–7.4 đã chuẩn hóa correlation/idempotency/reconciliation cho integration reliability; 9.3 phải kế thừa cùng taxonomy.
- Flow payment callback/tracking đã có hardening ở Epic 4/5, cần giữ tương thích khi thêm audit tracing.

### Git Intelligence Summary

- Working tree hiện có nhiều thay đổi song song; cần giới hạn sửa đúng lane audit + correlation tracing.
- Ưu tiên incremental standardization trên store/service hiện hữu để giảm xung đột merge và regress runtime.

### References

- Story 9.3 source + AC: `_bmad-output/planning-artifacts/epics.md:779-793`
- FR48, FR49: `_bmad-output/planning-artifacts/prd.md:363-364`
- NFR7, NFR13, NFR19: `_bmad-output/planning-artifacts/prd.md:378`, `:386`, `:396`
- Architecture correlation/idempotency/audit guidance:
  - `_bmad-output/planning-artifacts/architecture.md:171-172`, `:196`, `:209`, `:361`, `:364`, `:381`
- Previous story intelligence baseline:
  - `_bmad-output/implementation-artifacts/9-2-orm-migration-baseline-va-seed-du-lieu-mau.md`
  - `_bmad-output/implementation-artifacts/7-3-doi-soat-dinh-ky-trang-thai-payment-warehouse-shipping.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- (to be filled by dev-story)

### Completion Notes List

- Story context created for implementation.

### File List

- `_bmad-output/implementation-artifacts/9-3-chuan-hoa-audit-trail-va-truy-vet-theo-correlation-context.md`
