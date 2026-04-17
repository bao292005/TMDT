# Story 5.1: Khách hàng xem danh sách và chi tiết đơn hàng

Status: done

## Story

As a khách hàng,
I want truy cập lịch sử đơn và chi tiết đơn,
so that tôi theo dõi được tiến trình mua sắm của mình.

## Acceptance Criteria

1. Given khách hàng đã đăng nhập, when khách hàng mở trang đơn hàng, then hệ thống hiển thị danh sách đơn và chi tiết từng đơn đúng quyền truy cập, and dữ liệu đơn có trạng thái nhất quán với backend order state machine.

## Tasks / Subtasks

- [x] Triển khai customer order list API + authorization boundary (AC: 1)
  - [x] Thêm endpoint lấy danh sách đơn theo `userId` từ session
  - [x] Chuẩn hóa response envelope + `X-Correlation-Id`
- [x] Triển khai customer order detail API (AC: 1)
  - [x] Trả chi tiết items, pricing, trạng thái order/payment/tracking cơ bản
  - [x] Chặn truy cập cross-user (forbidden)
- [x] Tích hợp UI danh sách đơn và chi tiết đơn (AC: 1)
  - [x] Trang danh sách đơn có trạng thái loading/empty/error rõ
  - [x] Trang chi tiết đơn hiển thị thông tin tóm tắt + item breakdown
- [x] Đảm bảo consistency với state machine hiện có (AC: 1)
  - [x] Reuse model trạng thái từ `src/modules/order/*`
- [x] Thiết lập regression guard (AC: 1)
  - [x] Route tests: unauthorized/forbidden/success
  - [x] UI tests: list/detail render và empty state
  - [x] Chạy `npm run lint` và `npm run build`

### Review Findings

- [x] [Review][Patch] Payment summary lỗi bị nuốt và vẫn trả success [tmdt/src/modules/order/order-service.js:247]
- [x] [Review][Patch] Test chưa xác thực rõ consistency với state machine như yêu cầu AC [tmdt/src/modules/order/order-service.test.js:307]
- [x] [Review][Patch] Story artifact chưa đồng bộ: checklist/changelog chưa phản ánh trạng thái done [/_bmad-output/implementation-artifacts/5-1-khach-hang-xem-danh-sach-va-chi-tiet-don-hang.md:17]
- [x] [Review][Defer] Thiếu compensation khi init payment thành công nhưng tạo order/clear cart lỗi [tmdt/src/modules/order/order-service.js:142] — deferred, pre-existing

## Dev Notes

Story 5.1 mở đầu Epic 5, tạo bề mặt truy cập order history cho customer. Scope ưu tiên minh bạch dữ liệu và quyền truy cập đúng vai trò; chưa mở rộng hành vi tracking nâng cao (story 5.2).

### Technical Requirements

- Bắt buộc hiện thực FR32 với dữ liệu nhất quán từ order lifecycle hiện tại.
- Bắt buộc xác thực session customer và cấm truy cập đơn của user khác.
- Bắt buộc giữ envelope chuẩn `success/state/error/message/data`.

### Architecture Compliance

- Route layer: `src/app/api/orders/*` (hoặc lane customer API tương ứng) chỉ xử lý boundary.
- Business logic ở `src/modules/order/*`.
- Không truy cập storage trực tiếp từ UI.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js App Router + React 19 + TypeScript + Tailwind CSS 4.
- Không thêm dependency mới cho table/list nếu chưa cần.

### File Structure Requirements

- Ưu tiên thay đổi trong:
  - `tmdt/src/app/(customer)/orders/*`
  - `tmdt/src/app/api/orders/*`
  - `tmdt/src/modules/order/*`
- Không mở rộng sang shipping integration ở story này.

### Testing Requirements

- Cover tối thiểu:
  - customer list/detail success,
  - unauthorized/forbidden,
  - dữ liệu trạng thái map đúng state machine.
- Bắt buộc pass lint/build.

### Previous Story Intelligence

- Story 4.4/4.5 đã chuẩn hóa payment status clarity; 5.1 cần hiển thị nhất quán ở order detail.
- Reuse correlation/envelope pattern từ các route checkout/payment.

### Git Intelligence Summary

- Luồng gần nhất tập trung payment callback/retry/status; Epic 5 cần kế thừa trạng thái order-payment đã ổn định.

### Latest Technical Information

- UX spec nhấn mạnh order/tracking clarity và fallback khi realtime không ổn định.
- Accessibility baseline: keyboard/focus/semantic labels bắt buộc.

### Project Context Reference

- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md` (Epic 5, Story 5.1)
- FR32: `_bmad-output/planning-artifacts/prd.md:330`
- Architecture boundaries: `_bmad-output/planning-artifacts/architecture.md:329-358`
- UX clarity/a11y: `_bmad-output/planning-artifacts/ux-design-specification.md:357,460-461,564`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- N/A (story ở trạng thái ready-for-dev)

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.

### File List

- `_bmad-output/implementation-artifacts/5-1-khach-hang-xem-danh-sach-va-chi-tiet-don-hang.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-13: Tạo mới Story 5.1 từ trạng thái `backlog` sang `ready-for-dev`.
- 2026-04-13: Hoàn tất implementation + test Story 5.1, cập nhật `Status: done` và bổ sung kết quả review.
