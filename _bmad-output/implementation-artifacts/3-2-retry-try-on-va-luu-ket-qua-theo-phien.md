# Story 3.2: Retry try-on và lưu kết quả theo phiên

Status: done

## Story

As a khách hàng,
I want thử lại khi fail và giữ kết quả trong phiên mua,
so that tôi không mất ngữ cảnh quyết định.

## Acceptance Criteria

1. Given yêu cầu try-on trước đó thất bại hoặc khách hàng muốn thử lại, when khách hàng thực hiện retry, then hệ thống cho phép xử lý lại và cập nhật kết quả mới nhất, and lưu kết quả try-on theo phiên để dùng cho bước chọn biến thể.

## Tasks / Subtasks

- [x] Thiết kế contract retry + session result cho try-on (AC: 1)
  - [x] Chốt request/response envelope cho nhánh retry theo pattern `X-Correlation-Id`
  - [x] Xác định key phiên mua và policy cập nhật “kết quả mới nhất”
  - [x] Chuẩn hóa mã lỗi cho retry path (`TRYON_*`) theo convention reliability
- [x] Triển khai lưu kết quả try-on theo phiên trong module domain (AC: 1)
  - [x] Tạo/tích hợp session store cho ngữ cảnh try-on hiện tại (ưu tiên phù hợp pattern lưu session hiện có)
  - [x] Lưu snapshot tối thiểu: productSlug/variant context, tryOnImageUrl, confidence, updatedAt
  - [x] Đảm bảo chỉ truy cập dữ liệu theo đúng phiên, không rò rỉ chéo phiên
- [x] Triển khai cơ chế retry trong service try-on (AC: 1)
  - [x] Cho phép user retry khi lần xử lý trước fail/timeout
  - [x] Cập nhật kết quả mới nhất và ghi đè trạng thái cũ trong phiên
  - [x] Giữ timeout/retry/fallback behavior nhất quán với NFR3/NFR11/NFR12
- [x] Mở rộng API route cho retry + session result (AC: 1)
  - [x] Bổ sung boundary validation cho tham số retry/session tại route mỏng
  - [x] Trả HTTP status và envelope nhất quán cho success/error/timeout
  - [x] Không lộ field nội bộ session/persistence trong response public
- [x] Cập nhật UI flow để retry không mất ngữ cảnh (AC: 1)
  - [x] Bổ sung CTA retry rõ ràng ở trạng thái failed/timeout
  - [x] Sau retry thành công, hiển thị kết quả mới nhất và đồng bộ state panel
  - [x] Giữ accessibility baseline: keyboard, focus, disabled/loading, live-region
- [x] Kiểm thử và regression guard Story 3.2 (AC: 1)
  - [x] Unit test cho session result lifecycle: create/update/read theo phiên
  - [x] Service test cho retry path (fail → retry success, fail → retry fail)
  - [x] Route test cho các case hợp lệ/không hợp lệ/timeout + correlation id
  - [x] Chạy lại regression catalog + try-on hiện có, `npm run lint`, `npm run build`

## Dev Notes

- Story 3.2 hiện thực FR15/FR16, là bước nối trực tiếp từ Story 3.1 để tạo trải nghiệm try-on liên tục thay vì “thử lại từ đầu”.
- Mục tiêu chính là giữ “decision context” trong phiên mua: kết quả retry mới nhất phải sẵn sàng cho bước chọn biến thể và panel fit ở Story 3.4.
- Không mở rộng scope sang recommendation (Story 3.3) hoặc fit UI nâng cao (Story 3.4), chỉ chuẩn bị contract đủ ổn định để tái sử dụng.

### Technical Requirements

- Bắt buộc hỗ trợ retry thao tác try-on khi thất bại/timeout (FR15).
- Bắt buộc lưu kết quả try-on của phiên mua hiện tại và cập nhật kết quả mới nhất (FR16).
- Bắt buộc timeout có thông báo trong <= 30s cho mỗi yêu cầu try-on (NFR3).
- Bắt buộc tích hợp ngoài tuân thủ retry có kiểm soát + fallback ổn định (NFR11, NFR12).
- Bắt buộc giữ kiểm soát truy cập dữ liệu ảnh/kết quả try-on theo nguyên tắc tối thiểu cần thiết (NFR8).
- Bắt buộc giữ accessibility baseline cho trạng thái tương tác retry (NFR14, NFR16).

### Architecture Compliance

- Feature mapping: Try-On + Recommendation nằm trong `src/modules/tryon`, API ở `src/app/api/try-on`.
- Public/app boundaries: route mỏng ở `src/app/*`; business logic ở `src/modules/*`; validation ở `src/shared/*`.
- Adapter AI chỉ đi qua `src/modules/integrations/ai/*`.
- Không đặt logic background reconciliation trong route handler; chỉ xử lý synchronous retry/session scope của story.

### Library / Framework Requirements

- Tiếp tục stack hiện tại: Next.js App Router 16.2.3 + React 19 + TypeScript + Tailwind.
- Không thêm dependency mới nếu chưa cần cho scope story 3.2.
- Ưu tiên tái sử dụng pattern lưu phiên hiện có của Identity module thay vì tạo persistence mới không cần thiết.

### File Structure Requirements

- Ưu tiên chỉnh sửa trong phạm vi:
  - `tmdt/src/modules/tryon/*`
  - `tmdt/src/modules/integrations/ai/*`
  - `tmdt/src/app/api/try-on/*`
  - `tmdt/src/app/(public)/products/[slug]/*`
  - `tmdt/src/shared/validation/*`
- Nếu cần lưu trạng thái theo phiên, triển khai ở module phù hợp boundary hiện tại (không đẩy logic session xuống route).
- Không tạo abstraction lớn ngoài scope FR15/FR16.

### Testing Requirements

- Cover đủ luồng retry:
  - fail/timeout lần 1 → retry thành công,
  - fail/timeout lần 1 → retry tiếp tục thất bại,
  - đọc lại kết quả mới nhất theo đúng phiên.
- Kiểm thử isolation giữa hai phiên khác nhau (không chia sẻ kết quả).
- Kiểm thử response envelope + `X-Correlation-Id` cho các nhánh chính.
- Bắt buộc pass `npm run lint` + `npm run build` trước khi chuyển `review`.

### Previous Story Intelligence

- Story 3.1 đã chuẩn hóa timeout guard <=30s, error namespace `TRYON_*`, response envelope và `X-Correlation-Id`; Story 3.2 phải giữ nguyên convention này.
- Story 3.1 đã bổ sung adapter cancellation bằng `AbortSignal`; retry flow mới phải tương thích, không làm mất guard timeout hiện tại.
- Story 3.1 dùng route mỏng + service dày + validation tách lớp; tiếp tục bám boundary để tránh regression.
- Regression strategy đã hiệu quả: chạy lại full catalog + try-on tests cùng lint/build.

### Git Intelligence Summary

- Recent commits khả dụng trong repo hiện tại:
  - `1108dbe`: auth flow story 1.2
  - `445df65`: BMAD framework bootstrap
- Working tree có nhiều thay đổi chưa commit; ưu tiên bám conventions đang chạy trong codebase thay vì suy diễn từ lịch sử commit ngắn.

### Latest Technical Information

- PRD xác nhận FR15/FR16 là scope trực tiếp của Story 3.2 (retry + lưu theo phiên).
- UX yêu cầu retry/recovery rõ ràng tại trạng thái failed/timeout và giữ hành vi accessibility nhất quán.
- Architecture yêu cầu giữ strict module boundaries và integration adapter pattern để tiếp tục mở rộng Epic 3.

### Project Context Reference

- Không tìm thấy `project-context.md` trong workspace hiện tại.
- Nguồn chuẩn dùng cho story này: `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md`, và Story 3.1 implementation artifact.

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:349-363`
- FR15/FR16: `_bmad-output/planning-artifacts/prd.md:307-309`
- NFR timeout + reliability + access control: `_bmad-output/planning-artifacts/prd.md:359,366,371-373`
- Try-on feature mapping & boundaries: `_bmad-output/planning-artifacts/architecture.md:334-337,354,374`
- UX try-on/retry states: `_bmad-output/planning-artifacts/ux-design-specification.md:483-490,509-514,571,576`
- UX accessibility baseline: `_bmad-output/planning-artifacts/ux-design-specification.md:642-650`
- Prior implementation intelligence: `_bmad-output/implementation-artifacts/3-1-upload-anh-va-xu-ly-ai-try-on.md`

### Review Findings

- [x] [Review][Decision] Làm rõ semantics `retry` giữa user-triggered retry và auto-retry nội bộ service — đã chốt hybrid: auto-retry cho timeout/abort, retry lỗi retryable khi `retry=true`.
- [x] [Review][Patch] Bổ sung `variant context` trong snapshot lưu theo phiên [tmdt/src/modules/tryon/tryon-session-store.js:37]
- [x] [Review][Patch] Thêm integrity protection cho `tryon_session` cookie bằng chữ ký HMAC [tmdt/src/modules/tryon/tryon-session-service.js:1]
- [x] [Review][Patch] Reset state tránh hiển thị kết quả stale khi đổi product và GET restore non-OK [tmdt/src/app/(public)/products/[slug]/try-on-panel.tsx:30]
- [x] [Review][Patch] Thêm guard chống race giữa restore request và submit request bằng `requestVersionRef` [tmdt/src/app/(public)/products/[slug]/try-on-panel.tsx:26]
- [x] [Review][Patch] Bổ sung assert `X-Correlation-Id` cho các nhánh lỗi chính của GET route [tmdt/src/app/api/try-on/route.test.js:94]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `node --experimental-default-type=module --test src/modules/catalog/catalog-service.test.js src/modules/tryon/tryon-service.test.js src/modules/tryon/tryon-session-store.test.js src/app/api/try-on/route.test.js`
- `npm run lint`
- `npm run build`

### Completion Notes List

- Hoàn tất retry contract cho try-on với cờ `retry` ở boundary validation và giữ response envelope + `X-Correlation-Id` nhất quán.
- Bổ sung lưu/đọc snapshot kết quả try-on theo phiên mua với cookie `tryon_session`, policy cập nhật kết quả mới nhất và isolation theo phiên.
- Mở rộng API `GET/POST /api/try-on` để đọc lại kết quả phiên, hỗ trợ retry, map mã lỗi `TRYON_*` và status HTTP tương ứng.
- Cập nhật UI panel try-on: khôi phục kết quả gần nhất theo phiên, hiển thị CTA `Thử lại` ở state `error/timeout`, giữ accessibility baseline.
- Bổ sung regression tests cho lifecycle session store, retry path ở service, và route cases (valid/invalid/timeout/correlation id/session isolation).

### File List

- `_bmad-output/implementation-artifacts/3-2-retry-try-on-va-luu-ket-qua-theo-phien.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `tmdt/src/modules/tryon/tryon-session-store.js`
- `tmdt/src/modules/tryon/tryon-session-store.test.js`
- `tmdt/src/modules/tryon/tryon-session-service.js`
- `tmdt/src/modules/tryon/tryon-service.test.js`
- `tmdt/src/shared/validation/tryon.js`
- `tmdt/src/app/api/try-on/route.js`
- `tmdt/src/app/api/try-on/route.test.js`
- `tmdt/src/app/(public)/products/[slug]/try-on-panel.tsx`

## Change Log

- 2026-04-12: Tạo Story 3.2 từ backlog với context đầy đủ cho retry try-on và lưu kết quả theo phiên; trạng thái `ready-for-dev`.
- 2026-04-12: Hoàn tất implementation Story 3.2 (retry + session persistence + API/UI/test regression) và chuyển trạng thái sang `review`.
