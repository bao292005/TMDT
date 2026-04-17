# Story 5.3: Warehouse queue xử lý đóng gói và tạo vận đơn

Status: done

## Story

As a nhân viên kho,
I want xử lý đơn theo hàng đợi và tạo vận đơn,
so that đơn được bàn giao nhanh và đúng quy trình.

## Acceptance Criteria

1. Given có đơn đủ điều kiện xử lý tại kho, when nhân viên kho thao tác qua `OperatorQueueBoard`, then hệ thống hỗ trợ pick/pack/create-shipment theo hàng đợi ưu tiên task-first.
2. And mỗi thao tác cập nhật trạng thái đơn hợp lệ theo state machine + ghi audit log.
3. And lưu tracking number ngay khi tạo vận đơn thành công.

## Tasks / Subtasks

- [x] Triển khai Warehouse queue API và authorization boundary (AC: 1)
  - [x] Thêm endpoint liệt kê đơn chờ xử lý kho theo hàng đợi ưu tiên.
  - [x] Áp RBAC Warehouse cho toàn bộ warehouse actions bằng `requireApiRole`.
  - [x] Chuẩn hóa response envelope + `X-Correlation-Id` như các route hiện có.
- [x] Triển khai thao tác pick/pack/create-shipment theo state machine (AC: 1, 2, 3)
  - [x] Thêm service cho thao tác xác nhận đóng gói với guard chuyển trạng thái hợp lệ.
  - [x] Thêm service tạo shipment request cho đơn đủ điều kiện và nhận `trackingNumber`.
  - [x] Persist `trackingNumber` vào order ngay khi shipment tạo thành công.
- [x] Ghi audit log cho thao tác nghiệp vụ kho (AC: 2)
  - [x] Log đầy đủ actor, orderId, action, before/after status, timestamp.
  - [x] Đảm bảo action thất bại không ghi trạng thái thành công giả.
- [x] Tích hợp UI warehouse task-first bằng `OperatorQueueBoard` (AC: 1, 2, 3)
  - [x] Hiển thị queue theo ưu tiên thao tác và trạng thái.
  - [x] Cho phép thao tác nhanh pick/pack/create-shipment với feedback rõ.
  - [x] Hiển thị `trackingNumber` ngay khi tạo vận đơn thành công.
- [x] Regression + quality gates cho luồng warehouse (AC: 1, 2, 3)
  - [x] Route tests: unauthorized/forbidden/success cho list + actions.
  - [x] Service tests: state-machine guard, audit logging, persist tracking.
  - [x] UI tests: queue render, action flow, success/error states.
  - [x] Chạy tối thiểu: `node --experimental-default-type=module --test src/app/api/warehouse/**/*.test.js` (hoặc file test tương ứng được thêm mới).

### Review Findings

- [x] [Review][Patch] `create_shipment` chưa guard `pickedAt` nên có thể ship đơn chưa pick [tmdt/src/modules/warehouse/warehouse-service.js:161]
- [x] [Review][Patch] Cập nhật order thành công nhưng audit log lỗi sẽ làm lệch trạng thái/audit [tmdt/src/modules/warehouse/warehouse-service.js:246]
- [x] [Review][Patch] `ensureStore` bắt mọi lỗi rồi reset file audit log về `[]` có thể gây mất log [tmdt/src/modules/identity/audit-log-store.js:15]
- [x] [Review][Patch] UI `handleAction` chưa redirect khi 401/403 như `loadQueue`, gây kẹt UX khi session hết hạn [tmdt/src/app/(warehouse)/queue/operator-queue-board.tsx:92]
- [x] [Review][Patch] Thiếu test forbidden cho `POST /api/warehouse/actions` (mới có unauthorized + success) [tmdt/src/app/api/warehouse/route.test.js:112]
- [x] [Review][Patch] UI test đang assert source string, chưa verify runtime action flow/error state như yêu cầu quality gate [tmdt/src/app/(warehouse)/queue/operator-queue-board.test.js:7]
- [x] [Review][Defer] Rủi ro CSRF cho endpoint mutation dùng cookie auth (`POST /api/warehouse/actions`) [tmdt/src/app/api/warehouse/actions/route.js:41] — deferred, pre-existing
- [x] [Review][Defer] I/O JSON store chưa atomic (writeFile trực tiếp) có rủi ro partial write khi crash [tmdt/src/modules/order/order-store.js:247] — deferred, pre-existing

## Dev Notes

Story 5.3 mở rộng Epic 5 sang lane vận hành kho, tập trung vào xử lý queue và chuyển trạng thái đơn an toàn theo state machine. Scope không bao gồm fallback provider khi shipping API lỗi (đã dành cho Story 5.4).

### Technical Requirements

- Bám FR35/FR36/FR37: warehouse queue, xác nhận đóng gói, tạo shipment request.
- Mọi thao tác kho phải đi qua state-machine guard, không cho chuyển trạng thái tắt.
- Bắt buộc persist `trackingNumber` sau khi tạo shipment thành công để customer tracking dùng ngay.
- Bắt buộc audit log cho thao tác nghiệp vụ kho có khả năng thay đổi trạng thái đơn.

### Architecture Compliance

- Route layer mỏng tại `src/app/api/warehouse/*`; business logic đặt ở `src/modules/warehouse/*` hoặc module domain tương ứng.
- Không đưa business rule state machine vào UI component.
- Tái sử dụng contract order/tracking hiện có, tránh tạo shape payload song song.
- Tích hợp shipment phải giữ idempotency/retry-safe semantics ở service boundary.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js App Router + React + Node test runner.
- Không thêm dependency mới nếu chưa có nhu cầu bắt buộc.
- Tuân thủ quy ước response/error code và correlation id của project.

### File Structure Requirements

Ưu tiên thay đổi trong:
- `tmdt/src/app/api/warehouse/*`
- `tmdt/src/modules/warehouse/*`
- `tmdt/src/modules/order/*` (chỉ phần cần thiết cho state transition/tracking persistence)
- `tmdt/src/app/(warehouse)/*` hoặc UI lane warehouse hiện có
- `tmdt/src/app/api/warehouse/**/*.test.js` và test liên quan modules warehouse/order

### Testing Requirements

- Route tests phải cover đầy đủ unauthorized/forbidden/success cho queue và actions.
- Service tests phải cover:
  - guard chuyển trạng thái hợp lệ/không hợp lệ,
  - audit log được ghi đúng,
  - persist tracking number đúng thời điểm.
- UI tests phải cover queue rendering + thao tác task-first + feedback states.
- Không làm fail regression các story Epic 4/5 đã done.

### Previous Story Intelligence

- Story 5.1/5.2 đã chuẩn hóa customer order detail/tracking timeline; Story 5.3 phải cập nhật dữ liệu tương thích contract này.
- Story 5.2 có defer về reliability/legacy compatibility; tránh mở rộng scope fix defer ở story kho nếu không bắt buộc cho AC hiện tại.
- Gần đây đã harden payment callback/status flow, nên chuyển trạng thái ở kho cần nhất quán với lifecycle đã có.

### Git Intelligence Summary

- Commit gần nhất: `89e1d32` tập trung harden callback payment + coverage story 4.4; Story 5.3 nên kế thừa quy tắc state consistency và error mapping hiện có.

### Latest Technical Information

- UX đã định nghĩa `OperatorQueueBoard` cho lane warehouse với trọng tâm queue/filter/quick actions.
- Flow vận hành kho yêu cầu minh bạch trạng thái + non-color cues + feedback/recovery rõ sau thao tác.

### Project Context Reference

- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/implementation-artifacts/5-1-khach-hang-xem-danh-sach-va-chi-tiet-don-hang.md`
- `_bmad-output/implementation-artifacts/5-2-theo-doi-trang-thai-don-va-tracking-number.md`

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:515-530`
- FR mapping: `_bmad-output/planning-artifacts/prd.md:333-335`
- Architecture boundaries: `_bmad-output/planning-artifacts/architecture.md:331`, `:356`, `:381`
- UX component định hướng: `_bmad-output/planning-artifacts/ux-design-specification.md:516-523`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `node --experimental-default-type=module --test src/modules/warehouse/warehouse-service.test.js`
- `node --experimental-default-type=module --test src/app/api/warehouse/route.test.js "src/app/(warehouse)/queue/operator-queue-board.test.js" src/modules/warehouse/warehouse-service.test.js`
- `node --experimental-default-type=module --test src/app/api/warehouse/**/*.test.js`

### Completion Notes List

- Triển khai `warehouse-service` cho queue task-first và thao tác `pick/pack/create_shipment` với state-machine guard.
- Bổ sung API warehouse: `GET /api/warehouse/queue` và `POST /api/warehouse/actions` với RBAC Warehouse + envelope chuẩn + `X-Correlation-Id`.
- Bổ sung UI lane warehouse qua `OperatorQueueBoard` tại `/queue` (group `(warehouse)`), hỗ trợ thao tác nhanh và feedback rõ.
- Persist `trackingNumber` ngay khi tạo shipment thành công, đồng thời ghi audit log actor/order/action/before-after status/timestamp.
- Đã chạy pass toàn bộ test cho phạm vi story 5.3 (service + route + UI logic + required api wildcard test).

### File List

- `_bmad-output/implementation-artifacts/5-3-warehouse-queue-xu-ly-dong-goi-va-tao-van-don.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `tmdt/src/modules/order/order-store.js`
- `tmdt/src/modules/identity/audit-log-store.js`
- `tmdt/src/modules/warehouse/warehouse-service.js`
- `tmdt/src/modules/warehouse/warehouse-service.test.js`
- `tmdt/src/app/api/warehouse/queue/route.js`
- `tmdt/src/app/api/warehouse/actions/route.js`
- `tmdt/src/app/api/warehouse/route.test.js`
- `tmdt/src/app/(warehouse)/queue/page.tsx`
- `tmdt/src/app/(warehouse)/queue/operator-queue-board.tsx`
- `tmdt/src/app/(warehouse)/queue/operator-queue-board-logic.js`
- `tmdt/src/app/(warehouse)/queue/operator-queue-board.test.js`

## Change Log

- 2026-04-14: Tạo mới Story 5.3 từ trạng thái `backlog` sang `ready-for-dev`.
- 2026-04-14: Hoàn tất implementation Story 5.3, chạy test phạm vi story và cập nhật trạng thái `review`.
