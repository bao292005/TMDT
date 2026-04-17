# Story 4.5: PaymentStatusTimeline cho post-checkout clarity

Status: done

## Story

As a khách hàng,
I want xem timeline trạng thái thanh toán sau đặt hàng,
so that tôi biết bước tiếp theo cần làm gì mà không bị mơ hồ.

## Acceptance Criteria

1. Given khách hàng đang ở trang xác nhận đơn hoặc chi tiết đơn, when trạng thái thanh toán thay đổi, then timeline hiển thị nhất quán `label trạng thái + timestamp + next action`, and thông điệp không phụ thuộc chỉ vào màu sắc.
2. Given giao dịch ở trạng thái `pending_verification`, when callback/reconcile chưa hoàn tất, then timeline thể hiện rõ trạng thái chờ xác minh và cung cấp hành động refresh/chờ tiếp theo.
3. Given giao dịch `failed`, when khách hàng truy cập timeline, then hiển thị recovery-first message với CTA thanh toán lại rõ ràng.

## Tasks / Subtasks

- [ ] Chuẩn hóa contract dữ liệu timeline payment tại order detail boundary (AC: 1, 2)
  - [ ] Thêm trường `stateLabel`, `stateTimestamp`, `nextAction`, `stateSource`
  - [ ] Đồng bộ trạng thái từ payment transaction mới nhất theo `orderId`
- [ ] Xây dựng component `PaymentStatusTimeline` ở chế độ summary/full theo UX spec (AC: 1)
  - [ ] Hiển thị semantic timeline list có icon + text + timestamp
  - [ ] Bảo đảm fallback text khi thiếu timestamp từ provider
- [ ] Kết nối timeline với flow pending/failed/retry của Story 4.4 (AC: 2, 3)
  - [ ] Pending: hiển thị hành động refresh và guidance rõ ràng
  - [ ] Failed: hiển thị CTA retry và trạng thái loading/disabled khi retry
- [ ] Bảo đảm accessibility cho timeline (AC: 1)
  - [ ] Không dùng màu là kênh biểu đạt duy nhất
  - [ ] Keyboard focus rõ cho CTA trong timeline
- [ ] Bổ sung test và checklist chất lượng (AC: 1, 2, 3)
  - [ ] Unit test mapping trạng thái -> timeline item
  - [ ] UI test cho pending/failed/success timeline states

### Review Findings

- [x] [Review][Decision] Timeline có cần xuất hiện ở trang chi tiết đơn hàng ngay trong Story 4.5 không? — Đã chốt scope checkout confirmation là hợp lệ cho story này.
- [x] [Review][Patch] Payload guard phía client quá chặt, có thể loại bỏ response hợp lệ khi thiếu 1 field timeline phụ [tmdt/src/app/(customer)/checkout/checkout-client.tsx:99]
- [x] [Review][Patch] `nextAction` chỉ check kiểu string, không validate enum nên có thể rơi vào trạng thái không có CTA khi contract drift [tmdt/src/app/(customer)/checkout/checkout-client.tsx:115]
- [x] [Review][Patch] `callbackEventTime` không hợp lệ vẫn được ưu tiên, làm mất mốc thời gian fallback hợp lệ [tmdt/src/modules/payment/payment-service.js:39]
- [x] [Review][Patch] UI tự dựng fallback text từ raw status (`Trạng thái thanh toán: ${status}`), lệch nguyên tắc render theo contract module [tmdt/src/app/(customer)/checkout/checkout-client.tsx:407]
- [x] [Review][Patch] Chuỗi hiển thị có thể bị lặp ngữ nghĩa (`Trạng thái thanh toán hiện tại: Trạng thái thanh toán: ...`) [tmdt/src/app/(customer)/checkout/checkout-client.tsx:422]

## Dev Notes

Story 4.5 hoàn thiện lớp UX sau Story 4.4 bằng cách chuẩn hóa hiển thị trạng thái thanh toán hậu checkout theo component pattern trong UX specification (`PaymentStatusTimeline`). Scope tập trung vào hiển thị/diễn giải trạng thái, không mở rộng sang logic webhook hoặc reconciliation job sâu của Epic 7.

### Technical Requirements

- Triển khai đúng FR28 và FR30 cho trạng thái thanh toán sau checkout.
- Timeline phải hỗ trợ đầy đủ `success | pending_verification | failed | retrying`.
- Trạng thái cần có nguồn timestamp tin cậy (transaction update time hoặc reconcile time).
- Recovery message theo hướng dẫn UX-DR6/UX-DR12.

### Architecture Compliance

- UI ở `src/app/(customer)` chỉ render dữ liệu; business mapping để ở `src/modules/payment` hoặc `src/modules/order`.
- Không gọi trực tiếp provider từ component timeline.
- Giữ envelope response và `X-Correlation-Id` ở API boundary theo kiến trúc đã chốt.

### Library / Framework Requirements

- Dùng stack hiện có: Next.js App Router + React + TypeScript.
- Tận dụng component/pattern sẵn có, không thêm thư viện timeline mới nếu không cần.
- Dùng Tailwind utility và semantic HTML cho timeline.

### File Structure Requirements

- Ưu tiên thay đổi tại:
  - `tmdt/src/app/(customer)/checkout/*`
  - `tmdt/src/app/(customer)/orders/*`
  - `tmdt/src/modules/payment/*`
  - `tmdt/src/modules/order/*`
  - `tmdt/src/components/features/*` (nếu có shared feature component)
- Không kéo scope sang `src/jobs/reconciliation` của Epic 7.

### Testing Requirements

- Unit test mapping trạng thái transaction/order -> timeline display model.
- Integration/UI test cho 3 nhánh chính: success, pending_verification, failed->retry CTA.
- Accessibility test: keyboard path, screen-reader labels, color-independent semantics.
- Chạy tối thiểu `npm run lint` và test liên quan module checkout/order.

### Previous Story Intelligence

- Story 4.4 đã chốt callback/payment retry và trạng thái `pending_verification`; Story 4.5 phải tái sử dụng dữ liệu này, không tạo state machine mới.
- Story 4.4 đã chuẩn hóa recovery-first messaging và focus behavior cho lỗi payment; timeline phải giữ cùng ngôn ngữ trạng thái.

### Git Intelligence Summary

- Repository đang có luồng implementation artifacts theo từng story key và cập nhật sprint-status đồng bộ.
- Story file cần giữ format nhất quán với các artifact trước (đặc biệt 4-4).

### Latest Technical Information

- UX spec yêu cầu `PaymentStatusTimeline` có 2 mode `inline summary` và `full timeline`.
- NFR16/NFR17 yêu cầu trạng thái tương tác và khả năng đọc rõ ràng cho các thành phần transaction-critical.
- NFR4 yêu cầu đồng bộ trạng thái gần realtime với fallback polling khi cần.

### Project Context Reference

- `/_bmad-output/planning-artifacts/epics.md`
- `/_bmad-output/planning-artifacts/prd.md`
- `/_bmad-output/planning-artifacts/architecture.md`
- `/_bmad-output/planning-artifacts/ux-design-specification.md`

### References

- Story source: `_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.5)
- FR28, FR30: `_bmad-output/planning-artifacts/prd.md`
- Architecture patterns cho response/error/state: `_bmad-output/planning-artifacts/architecture.md`
- UX component `PaymentStatusTimeline`: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Previous intelligence: `_bmad-output/implementation-artifacts/4-4-xu-ly-callback-payment-trang-thai-pending-va-retry.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- N/A (story specification only, chưa triển khai code)

### Completion Notes List

- Tạo mới story 4.5 với trạng thái `ready-for-dev`.
- Đồng bộ section structure theo chuẩn implementation artifact hiện tại.

### File List

- `_bmad-output/implementation-artifacts/4-5-paymentstatustimeline-cho-post-checkout-clarity.md`

## Change Log

- 2026-04-13: Tạo mới story 4.5 từ backlog sang `ready-for-dev` với đầy đủ context kỹ thuật và UX.