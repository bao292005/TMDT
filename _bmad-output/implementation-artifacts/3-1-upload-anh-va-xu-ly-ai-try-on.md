# Story 3.1: Upload ảnh và xử lý AI try-on

Status: done

## Story

As a khách hàng,
I want tải ảnh và nhận kết quả thử đồ AI,
so that tôi đánh giá độ phù hợp trước khi mua.

## Acceptance Criteria

1. Given khách hàng ở PDP và có ảnh hợp lệ, when khách hàng gửi yêu cầu try-on, then hệ thống xử lý và trả kết quả thử đồ hoặc trạng thái timeout trong ngưỡng NFR, and hiển thị phản hồi rõ ràng theo trạng thái success/error/timeout.

## Tasks / Subtasks

- [x] Thiết kế contract API upload + xử lý try-on theo boundary hiện tại (AC: 1)
  - [x] Định nghĩa request/response envelope cho endpoint try-on với `X-Correlation-Id`
  - [x] Chuẩn hóa namespace lỗi cho luồng try-on theo pattern xử lý lỗi tích hợp
  - [x] Ràng buộc input ảnh hợp lệ (định dạng/kích thước tối thiểu cần thiết cho demo)
- [x] Triển khai business logic try-on trong module domain (AC: 1)
  - [x] Tạo service xử lý nhận ảnh, gọi adapter AI và chuẩn hóa output kết quả
  - [x] Xử lý nhánh timeout theo NFR3 (<= 30s) với trạng thái và thông điệp nhất quán
  - [x] Xử lý nhánh lỗi tích hợp (retryable/non-retryable) theo convention reliability
- [x] Mở rộng API route cho try-on trong App Router (AC: 1)
  - [x] Tạo route handler ở khu vực `src/app/api/try-on/*` và giữ route mỏng
  - [x] Gắn validation biên request tại route, giữ business logic trong `src/modules/tryon/*`
  - [x] Trả mã trạng thái HTTP phù hợp cho success/error/timeout và không lộ field nội bộ
- [x] Xây dựng UI trạng thái try-on cho customer flow (AC: 1)
  - [x] Tạo điểm kích hoạt upload ảnh từ context PDP/try-on flow
  - [x] Hiển thị đầy đủ các trạng thái `processing/success/error/timeout` với thông điệp rõ ràng
  - [x] Đảm bảo focus/keyboard interaction đúng chuẩn accessibility baseline cho form upload
- [x] Đảm bảo NFR và regression guard cho Story 3.1 (AC: 1)
  - [x] Áp dụng timeout guard cho tác vụ AI và mapping fallback response ổn định
  - [x] Đảm bảo không làm regression các luồng catalog/PDP đã hoàn tất ở Epic 2
  - [x] Giữ cấu trúc module và naming theo kiến trúc đã chốt
- [x] Kiểm thử và xác nhận chất lượng Story 3.1 (AC: 1)
  - [x] Unit test cho service try-on (success/error/timeout)
  - [x] Route test cho endpoint try-on với case ảnh hợp lệ/không hợp lệ/timeout
  - [x] Chạy `npm run lint` và `npm run build`

### Review Findings

- [x] [Review][Patch] Timeout cấu hình có thể vượt NFR <=30s [tmdt/src/app/api/try-on/route.js:269]
- [x] [Review][Patch] Chưa triển khai retry/fallback cho lỗi upstream retryable [tmdt/src/modules/tryon/tryon-service.js:67]
- [x] [Review][Patch] Timeout không hủy tác vụ adapter đang chạy [tmdt/src/modules/tryon/tryon-service.js:67]
- [x] [Review][Patch] Timer timeout không được dọn khi adapter hoàn tất sớm [tmdt/src/modules/tryon/tryon-service.js:54]
- [x] [Review][Patch] Validation ảnh chỉ dựa MIME client, thiếu xác thực nội dung file [tmdt/src/shared/validation/tryon.js:192]
- [x] [Review][Patch] UI parse JSON cứng, dễ che mất lỗi server không-JSON [tmdt/src/app/(public)/products/[slug]/try-on-panel.tsx:468]
- [x] [Review][Patch] Thiếu guard shape dữ liệu success từ adapter trước khi trả API [tmdt/src/modules/tryon/tryon-service.js:73]

## Dev Notes

- Story 3.1 hiện thực FR13/FR14, là điểm mở đầu Epic 3 nên cần bám chặt module boundaries và integration patterns để các story 3.2/3.3/3.4 tái sử dụng.
- Ưu tiên thiết kế output đủ rõ để Story 3.4 (`TryOnConfidencePanel`) dùng trực tiếp mà không cần đổi contract lớn.
- Vì đây là tích hợp ngoài (AI), phải tuân thủ timeout/retry/fallback và chuẩn hóa lỗi tích hợp ngay từ story đầu tiên của Epic 3.

### Technical Requirements

- Bắt buộc hỗ trợ upload ảnh cho try-on (FR13) và trả kết quả thử đồ (FR14).
- Bắt buộc có timeout rõ ràng cho tác vụ try-on theo NFR3 (<= 30 giây).
- Bắt buộc tuân thủ chuẩn reliability cho tích hợp ngoài: timeout/retry/fallback (NFR11, NFR12).
- Bắt buộc tuân thủ accessibility baseline cho form/interactive states: keyboard, focus, disabled/loading (NFR14, NFR16).
- API response theo envelope nhất quán, có `X-Correlation-Id`, và không rò rỉ dữ liệu nội bộ.

### Architecture Compliance

- Feature mapping: Try-On + Recommendation nằm trong `src/modules/tryon`, API ở `src/app/api/try-on`.
- Public/app boundaries: route layer mỏng ở `src/app/*`; business logic trong `src/modules/*`; validation/cross-cutting trong `src/shared/*`.
- Integration adapters cho AI cần đặt theo integration pattern đã chốt để mở rộng/retry về sau.

### Library / Framework Requirements

- Tiếp tục stack hiện tại: Next.js App Router 16.2.3 + React 19 + TypeScript + Tailwind.
- Không thêm dependency mới nếu chưa cần thiết cho scope story 3.1.
- Nếu cần upload handling đặc thù, ưu tiên tận dụng nền tảng có sẵn của Next/App Router trước khi thêm thư viện.

### File Structure Requirements

- Ưu tiên chỉnh sửa/tạo mới trong phạm vi:
  - `tmdt/src/modules/tryon/*`
  - `tmdt/src/modules/integrations/ai/*` (nếu cần adapter)
  - `tmdt/src/app/api/try-on/*`
  - `tmdt/src/app/(public)/try-on/*` hoặc điểm tích hợp PDP liên quan
  - `tmdt/src/shared/*` cho validation/response helpers dùng chung
- Không đặt business logic xử lý try-on trực tiếp trong route handler.

### Testing Requirements

- Cover đầy đủ 3 trạng thái cốt lõi: success, error, timeout cho cả service và API route.
- Kiểm thử validation input ảnh không hợp lệ (thiếu file, định dạng sai, vượt ngưỡng cho phép).
- Kiểm thử response envelope + correlation id cho các nhánh chính.
- Bắt buộc pass `npm run lint` + `npm run build` trước khi chuyển `review`.

### Previous Story Intelligence

- Story 2.3 đã chuẩn hóa pattern API/detail route + validation query + response envelope nhất quán; tiếp tục tái sử dụng pattern này cho try-on route.
- Story 2.3 review nhấn mạnh rõ accessibility state (focus/disabled/loading) và edge-case handling; cần áp dụng tương tự cho upload UI.
- Story 2.3 đã khẳng định mô hình test route + test service tách biệt giúp bắt regression sớm; giữ nguyên approach.

### Git Intelligence Summary

- Recent commits khả dụng trong repo hiện tại:
  - `1108dbe`: auth flow story 1.2
  - `445df65`: BMAD framework bootstrap
- Working tree có nhiều thay đổi chưa commit; ưu tiên bám conventions hiện hữu trong codebase thay vì suy diễn từ lịch sử commit ngắn.

### Latest Technical Information

- PRD xác nhận FR13/FR14 là phạm vi cốt lõi Story 3.1; NFR3 đặt ngưỡng timeout try-on <= 30s.
- UX spec yêu cầu trạng thái try-on rõ ràng (processing/success/error/timeout) và accessibility baseline cho interaction chính.
- Kiến trúc yêu cầu tách try-on thành capability riêng (domain module + API layer) để hỗ trợ stories tiếp theo trong Epic 3.

### Project Context Reference

- Không tìm thấy `project-context.md` trong workspace hiện tại.
- Nguồn chuẩn dùng cho story này: `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md`.

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:330-348`
- FR13/FR14: `_bmad-output/planning-artifacts/prd.md:304-307`
- NFR timeout try-on: `_bmad-output/planning-artifacts/prd.md:359`
- NFR reliability integration: `_bmad-output/planning-artifacts/prd.md:371-373`
- NFR accessibility baseline: `_bmad-output/planning-artifacts/prd.md:376-379`
- Try-on feature mapping & module boundaries: `_bmad-output/planning-artifacts/architecture.md:273,287,334-337,354`
- UX try-on states và interaction: `_bmad-output/planning-artifacts/ux-design-specification.md:483-490,571,601-603`
- UX accessibility/focus/keyboard requirements: `_bmad-output/planning-artifacts/ux-design-specification.md:643-647`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `node --experimental-default-type=module --test "src/modules/catalog/catalog-service.test.js" "src/modules/tryon/tryon-service.test.js" "src/app/api/catalog/products/route.test.js" "src/app/api/catalog/products/[slug]/route.test.js" "src/app/api/try-on/route.test.js"` ✅ (30 tests passed)
- `npm run lint` ✅
- `npm run build` ✅

### Completion Notes List

- Hoàn tất flow upload ảnh try-on từ PDP với UI trạng thái `processing/success/error/timeout` và accessibility baseline (focus/keyboard/disabled).
- Hoàn tất module domain `tryon-service` + AI adapter mock, có timeout guard <= 30s và mapping lỗi retryable/non-retryable theo namespace `TRYON_*`.
- Hoàn tất API `POST /api/try-on` theo response envelope nhất quán, có `X-Correlation-Id`, validation ảnh (thiếu file/sai định dạng/sai kích thước) và HTTP status mapping theo từng trạng thái.
- Đảm bảo regression Epic 2 không bị ảnh hưởng bằng cách chạy lại đầy đủ test catalog hiện hữu cùng test mới cho try-on.

### File List

- `tmdt/src/modules/integrations/ai/tryon-adapter.js`
- `tmdt/src/modules/tryon/tryon-service.js`
- `tmdt/src/modules/tryon/tryon-service.test.js`
- `tmdt/src/shared/validation/tryon.js`
- `tmdt/src/app/api/try-on/route.js`
- `tmdt/src/app/api/try-on/route.test.js`
- `tmdt/src/app/(public)/products/[slug]/try-on-panel.tsx`
- `tmdt/src/app/(public)/products/[slug]/page.tsx`
- `_bmad-output/implementation-artifacts/3-1-upload-anh-va-xu-ly-ai-try-on.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-12: Tạo mới Story 3.1 từ backlog với context triển khai đầy đủ, trạng thái `ready-for-dev`.
- 2026-04-12: Hoàn tất triển khai Story 3.1 (upload + xử lý AI try-on), pass test/lint/build và chuyển trạng thái `review`.