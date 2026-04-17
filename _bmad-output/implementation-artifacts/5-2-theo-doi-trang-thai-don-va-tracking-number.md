# Story 5.2: Theo dõi trạng thái đơn và tracking number

Status: done

## Story

As a khách hàng,
I want thấy trạng thái xử lý và mã tracking,
so that tôi biết đơn đang ở đâu trong quá trình giao nhận.

## Acceptance Criteria

1. Given đơn đã được xử lý ở kho hoặc đơn vị vận chuyển, when thông tin tracking được cập nhật, then trang tracking hiển thị timeline trạng thái có label, timestamp, next action theo UX-DR4.
2. And SLA đồng bộ trạng thái tuân thủ NFR4 (realtime hoặc fallback polling 15 giây).
3. And thông tin trạng thái không phụ thuộc chỉ vào màu sắc.

## Tasks / Subtasks

- [x] Mở rộng domain dữ liệu tracking trong order detail (AC: 1, 3)
  - [x] Cập nhật `getCustomerOrderDetail` để trả cấu trúc tracking timeline rõ ràng: `status`, `statusLabel`, `timestamp`, `nextAction`, `trackingNumber`.
  - [x] Giữ tương thích response envelope hiện tại (`success/state/data|error/message`).
- [x] Hoàn thiện API customer order detail cho tracking clarity (AC: 1)
  - [x] Duy trì auth boundary Customer bằng `requireApiRole`.
  - [x] Chuẩn hóa mapping lỗi + `X-Correlation-Id` không hồi quy.
- [x] Nâng cấp UI `OrderDetailClient` thành tracking timeline (AC: 1, 3)
  - [x] Hiển thị timeline có label + timestamp + next action.
  - [x] Bổ sung non-color cue (icon/text/badge label) cho mỗi trạng thái.
  - [x] Hiển thị tracking number khi có; fallback message rõ khi chưa có.
- [x] Triển khai cơ chế đồng bộ trạng thái theo NFR4 (AC: 2)
  - [x] Polling từ client mỗi 15 giây khi trạng thái chưa terminal.
  - [x] Dừng polling khi trạng thái terminal hoặc component unmount.
  - [x] Không gây double-fetch/race condition khi đổi trang.
- [x] Regression + quality gates (AC: 1, 2, 3)
  - [x] Update/add tests cho route: unauthorized/forbidden/success + payload timeline.
  - [x] Update/add tests cho UI: render timeline, fallback tracking, polling behavior.
  - [x] Chạy tối thiểu: `node --experimental-default-type=module --test src/app/api/orders/route.test.js` và test liên quan orders detail UI.

### Review Findings

- [x] [Review][Patch] `payment_failed` bị đánh dấu terminal nhưng vẫn yêu cầu `retry_payment` [tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.tsx:90]
- [x] [Review][Patch] Polling bị dừng vĩnh viễn sau lỗi tạm thời nên không còn fallback sync 15s [tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.tsx:142]
- [x] [Review][Patch] Test UI chỉ assert string, chưa verify behavior polling/stop condition thực tế [tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.test.js:25]
- [x] [Review][Defer] `listCustomerOrders` fail-fast toàn bộ khi 1 payment summary lỗi [tmdt/src/modules/order/order-service.js:276] — deferred, pre-existing
- [x] [Review][Defer] Payload order detail chưa normalize dữ liệu legacy trước khi client dereference [tmdt/src/modules/order/order-service.js:392] — deferred, pre-existing

### Review Findings (rerun 2026-04-14)

- [x] [Review][Patch] Polling vẫn có thể schedule sau network error/unmount, gây retry nền không cần thiết [tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.tsx:148]
- [x] [Review][Patch] Test UI chưa verify behavior polling/stop-condition thực thi thật, mới dừng ở assert string source [tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.test.js:32]
- [x] [Review][Patch] Thiếu test unauthorized cho route detail `/api/orders/[orderId]` theo yêu cầu regression route coverage [tmdt/src/app/api/orders/route.test.js:93]
- [x] [Review][Defer] `listCustomerOrders` fail-fast toàn bộ khi 1 payment summary lỗi [tmdt/src/modules/order/order-service.js:483] — deferred, pre-existing
- [x] [Review][Defer] Client dereference `order.items.map` không có normalize/guard cho payload legacy malformed [tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.tsx:218] — deferred, pre-existing

## Dev Notes

Story này mở rộng Story 5.1 theo chiều sâu UX tracking (status clarity), không mở rộng sang thao tác warehouse (Story 5.3) hay resilience shipping integration (Story 5.4).

### Technical Requirements

- Bám FR33/FR34: hiển thị tiến trình đơn hàng + tracking number cho customer.
- Tuân thủ NFR4: đồng bộ trạng thái <=10s; khi không có realtime thì fallback polling 15s.
- Duy trì chuẩn UX-DR4: timeline phải có `label + timestamp + next action`.
- Không phá vỡ behavior auth hiện có của customer orders pages/API.

### Architecture Compliance

- Route layer mỏng tại `src/app/api/orders/*`, business logic đặt ở `src/modules/order/*`.
- Không đưa business rule vào component client; client chỉ render và polling theo contract API.
- Không implement shipping provider integration ở story này (giữ scope story 5.4).

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js App Router + React + Node test runner.
- Không thêm dependency mới nếu có thể xử lý bằng primitives hiện tại.

### File Structure Requirements

Ưu tiên thay đổi trong:
- `tmdt/src/modules/order/order-service.js`
- `tmdt/src/app/api/orders/[orderId]/route.js`
- `tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.tsx`
- `tmdt/src/app/api/orders/route.test.js` (và test liên quan order detail nếu cần)

### Testing Requirements

- Route tests phải cover contract tracking timeline (shape + field semantics).
- UI tests phải cover:
  - timeline render đúng theo trạng thái,
  - fallback khi chưa có tracking number,
  - polling 15s và stop condition.
- Không làm fail regression của Story 5.1.

### Previous Story Intelligence

- Story 5.1 đã có order list/detail + auth boundary + envelope/correlation id, cần reuse thay vì tạo endpoint song song.
- Story 5.1 có lưu ý consistency với state machine; Story 5.2 phải kế thừa và chỉ tăng clarity ở presentation contract.

### Git Intelligence Summary

- Commit gần nhất tập trung payment callback/status hardening (`89e1d32`), vì vậy story này nên tái sử dụng mapping status hiện có thay vì tạo state mới tách rời.

### Latest Technical Information

- Theo UX spec, luồng post-checkout/tracking phải ưu tiên trust và state clarity; lỗi/chậm phải có next action rõ.
- Theo epics cập nhật, Story 5.2 yêu cầu timeline UX rõ và polling fallback 15s.

### Project Context Reference

- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/implementation-artifacts/5-1-khach-hang-xem-danh-sach-va-chi-tiet-don-hang.md`

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:499-513`
- FR33/FR34 mapping: `_bmad-output/planning-artifacts/epics.md:168-169`
- NFR4: `_bmad-output/planning-artifacts/epics.md:75`
- UX timeline clarity: `_bmad-output/planning-artifacts/epics.md:116`, `_bmad-output/planning-artifacts/ux-design-specification.md:453-454`, `_bmad-output/planning-artifacts/ux-design-specification.md:492-499`
- Existing implementation baseline:
  - `tmdt/src/modules/order/order-service.js:300-339`
  - `tmdt/src/app/api/orders/[orderId]/route.js:40-63`
  - `tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.tsx:58-149`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `node --experimental-default-type=module --test src/app/api/orders/route.test.js "src/app/(customer)/orders/[orderId]/order-detail-client.test.js"`
- `node --experimental-default-type=module --test --test-concurrency=1 src/**/*.test.js`
- `npm run lint`
- `npm run build`

### Completion Notes List

- Mở rộng contract `getCustomerOrderDetail` với `tracking` gồm `status`, `statusLabel`, `timestamp`, `nextAction`, `trackingNumber` và `timeline`.
- Giữ nguyên envelope API hiện có và auth boundary customer tại route `/api/orders/[orderId]`.
- Nâng cấp `OrderDetailClient` hiển thị timeline tracking, non-color cue bằng text label, fallback khi chưa có tracking number.
- Bổ sung polling 15 giây cho order detail; dừng khi trạng thái terminal/unmount và có guard tránh double-fetch.
- Cập nhật test route để verify payload tracking timeline; cập nhật test UI cho timeline/fallback/polling signals.
- Đã chạy test mục tiêu, full regression, lint và build thành công.

### File List

- `_bmad-output/implementation-artifacts/5-2-theo-doi-trang-thai-don-va-tracking-number.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `tmdt/src/modules/order/order-service.js`
- `tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.tsx`
- `tmdt/src/app/api/orders/route.test.js`
- `tmdt/src/app/(customer)/orders/[orderId]/order-detail-client.test.js`

## Change Log

- 2026-04-14: Tạo mới Story 5.2 từ trạng thái `backlog` sang `ready-for-dev`.
- 2026-04-14: Hoàn tất implementation Story 5.2, cập nhật trạng thái sang `review`.
