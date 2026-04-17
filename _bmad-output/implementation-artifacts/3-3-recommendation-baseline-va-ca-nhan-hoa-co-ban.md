# Story 3.3: Recommendation baseline và cá nhân hóa cơ bản

Status: done

## Story

As a khách hàng,
I want nhận gợi ý sản phẩm phù hợp sau khi xem/try-on,
so that tôi dễ chọn thêm sản phẩm liên quan.

## Acceptance Criteria

1. Given khách hàng có ngữ cảnh duyệt sản phẩm hoặc kết quả try-on, when hệ thống tạo danh sách gợi ý, then hiển thị tối thiểu 5 gợi ý phù hợp theo rule baseline hoặc personalization, and fallback baseline hoạt động khi mô-đun cá nhân hóa nâng cao chưa sẵn sàng.

## Tasks / Subtasks

- [x] Thiết kế contract recommendation cho PDP theo module boundary (AC: 1)
  - [x] Chốt request context tối thiểu (productSlug, sessionKey, try-on context nếu có)
  - [x] Chốt response envelope nhất quán với pattern hiện tại (`success/state/error/message/data` + `X-Correlation-Id`)
  - [x] Định nghĩa mã lỗi `RECOMMENDATION_*` cho nhánh lỗi input/upstream/fallback
- [x] Triển khai baseline recommendation engine trong `src/modules/recommendation/*` (AC: 1)
  - [x] Tạo rule baseline theo danh mục đã xem + sản phẩm đang xem + ngữ cảnh try-on gần nhất
  - [x] Đảm bảo luôn trả tối thiểu 5 item khi catalog đủ dữ liệu
  - [x] Nếu personalization chưa sẵn sàng hoặc không đủ tín hiệu, tự động fallback baseline
- [x] Bổ sung lớp cá nhân hóa cơ bản, không phá vỡ baseline (AC: 1)
  - [x] Dùng tín hiệu đơn giản (lịch sử xem gần nhất, try-on session snapshot, sản phẩm liên quan)
  - [x] Giữ policy deterministic và có thứ tự ưu tiên rõ khi trộn baseline + personalization
  - [x] Không làm lộ dữ liệu nhạy cảm phiên người dùng trong payload public
- [x] Mở rộng API route để cung cấp recommendation (AC: 1)
  - [x] Giữ route mỏng, business logic nằm ở module
  - [x] Validation boundary rõ cho query/input context
  - [x] HTTP status + envelope nhất quán, có fallback path ổn định
- [x] Tích hợp UI hiển thị recommendation ở PDP (AC: 1)
  - [x] Hiển thị tối thiểu 5 sản phẩm gợi ý với loading/empty/error/fallback state rõ ràng
  - [x] Ưu tiên reuse component/card pattern hiện có ở catalog/PDP, tránh tạo UI trùng lặp
  - [x] Đảm bảo keyboard/focus/semantic baseline cho danh sách gợi ý
- [x] Kiểm thử và regression guard cho Story 3.3 (AC: 1)
  - [x] Unit test cho baseline ranking + fallback behavior
  - [x] Route test cho input hợp lệ/không hợp lệ/fallback path
  - [x] Integration test cho luồng có try-on context và không có try-on context
  - [x] Chạy `npm run lint` và `npm run build`

### Review Findings

- [x] [Review][Patch] API cho phép `limit < 5`, vi phạm AC tối thiểu 5 gợi ý [tmdt/src/shared/validation/recommendation.js:4]
- [x] [Review][Patch] `state: "success"` có thể bật dù thiếu tín hiệu personalization thực chất (chỉ có `updatedAt`) [tmdt/src/modules/recommendation/recommendation-service.js:208]
- [x] [Review][Patch] So khớp `variantId` bằng `includes` có thể boost nhầm sản phẩm [tmdt/src/modules/recommendation/recommendation-service.js:239]
- [x] [Review][Patch] Parser `viewed` materialize toàn bộ payload trước khi cắt ngưỡng 20 [tmdt/src/shared/validation/recommendation.js:74]
- [x] [Review][Patch] Race condition UI: request cũ abort vẫn có thể `setLoading(false)` sau request mới [tmdt/src/app/(public)/products/[slug]/recommendation-list.tsx:770]
- [x] [Review][Patch] Thiếu test cho nhánh `RECOMMENDATION_NOT_FOUND` (404 mapping) [tmdt/src/app/api/recommendations/route.test.js:560]
- [x] [Review][Defer] `tryon_session` dùng fallback secret mặc định trong module cũ [tmdt/src/modules/tryon/tryon-session-service.js:7] — deferred, pre-existing

## Dev Notes

- Story 3.3 hiện thực FR17/FR18, là cầu nối từ Try-On (Story 3.1/3.2) sang quyết định mua tiếp theo trên PDP.
- Mục tiêu story là tạo recommendation đủ tin cậy cho demo học thuật bằng baseline + cá nhân hóa cơ bản, không mở rộng sang mô hình ML phức tạp.
- Scope story tập trung vào khả năng phục hồi: khi personalization chưa khả dụng vẫn phải trả được danh sách gợi ý hợp lệ.

### Technical Requirements

- Bắt buộc hiển thị tối thiểu 5 gợi ý sản phẩm theo ngữ cảnh duyệt/try-on (FR17).
- Bắt buộc có cơ chế baseline fallback khi personalization nâng cao chưa sẵn sàng (FR18).
- Bắt buộc giữ timeout/retry/fallback nhất quán cho tích hợp ngoài nếu có sử dụng adapter AI/recommendation (NFR11, NFR12).
- Bắt buộc kiểm soát truy cập dữ liệu ngữ cảnh try-on theo nguyên tắc tối thiểu cần thiết (NFR8).
- Bắt buộc đảm bảo trạng thái tương tác UI rõ ràng (loading/disabled/error) và truy cập bàn phím (NFR14, NFR16).

### Architecture Compliance

- Feature mapping: Recommendation thuộc `src/modules/recommendation`; liên quan Try-On context ở `src/modules/tryon`; API delivery qua `src/app/api/*` theo boundary hiện tại.
- Route layer (`src/app/*`) chỉ điều phối request/response; logic recommendation đặt ở `src/modules/*`; validation dùng `src/shared/*`.
- Không đặt reconciliation/background logic trong route handler.
- Reuse integration pattern hiện có nếu cần gọi provider ngoài: chỉ đi qua `src/modules/integrations/*`.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js 16.2.3 + React 19.2.4 + TypeScript + Tailwind CSS 4 (theo `tmdt/package.json`).
- Không thêm dependency mới nếu baseline + personalization cơ bản có thể triển khai bằng code nội bộ.
- Ưu tiên deterministic, dễ test, dễ debug thay vì tối ưu sớm bằng thuật toán phức tạp.

### File Structure Requirements

- Ưu tiên tạo/chỉnh sửa trong phạm vi:
  - `tmdt/src/modules/recommendation/*`
  - `tmdt/src/modules/tryon/*` (chỉ khi cần đọc context phiên)
  - `tmdt/src/app/api/*recommend*` hoặc route PDP liên quan
  - `tmdt/src/app/(public)/products/[slug]/*`
  - `tmdt/src/shared/validation/*`
- Reuse pattern card/list hiện có ở catalog/PDP; tránh tạo abstraction lớn ngoài scope FR17/FR18.

### Testing Requirements

- Cover nhánh chính:
  - Có try-on/session context → trả >= 5 gợi ý,
  - Không có personalization context → fallback baseline vẫn trả >= 5 gợi ý,
  - Context không hợp lệ → trả lỗi chuẩn hóa, không crash route.
- Kiểm thử isolation dữ liệu theo phiên/người dùng, không rò rỉ gợi ý từ phiên khác.
- Kiểm thử response envelope + `X-Correlation-Id` cho success/error/fallback.
- Bắt buộc pass `npm run lint` + `npm run build` trước khi chuyển `review`.

### Previous Story Intelligence

- Story 3.2 đã chuẩn hóa retry semantics hybrid cho try-on (`retry=true` mới cho retryable retry), cần giữ nguyên cách hiểu khi tận dụng try-on context.
- Story 3.2 đã có session snapshot theo phiên với integrity-protected cookie và dữ liệu `variantContext`; có thể tái sử dụng làm tín hiệu personalization cơ bản.
- Story 3.2 đã chốt pattern route mỏng + service dày + validation tách lớp + `X-Correlation-Id`; Story 3.3 phải bám cùng convention để tránh regression.
- Story 3.2 đã thêm guard chống race/stale ở UI panel; phần recommendation không được tạo side-effect làm mất ổn định flow PDP hiện có.

### Git Intelligence Summary

- Recent commits hiện có:
  - `1108dbe`: auth flow story 1.2
  - `445df65`: BMAD framework bootstrap
- Working tree có nhiều thay đổi chưa commit; ưu tiên bám pattern đang hiện hữu trong codebase (đặc biệt Epic 2/3) hơn là mở rộng kiến trúc mới.

### Latest Technical Information

- PRD xác nhận FR17/FR18 là scope trực tiếp của Story 3.3 (recommendation >=5 item + baseline fallback).
- UX spec nhấn mạnh discovery nhanh + recommendation theo ngữ cảnh quyết định mua; tránh dark-pattern/FOMO và phải có trạng thái phục hồi rõ.
- Kiến trúc hiện tại đã mapping rõ recommendation vào `src/modules/recommendation`, cho phép triển khai theo module boundary mà không phá flow try-on/PDP.

### Project Context Reference

- Không tìm thấy `project-context.md` trong workspace hiện tại.
- Nguồn chuẩn dùng cho story này: `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md`, và implementation artifacts Story 3.1/3.2.

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:364-377`
- FR17/FR18: `_bmad-output/planning-artifacts/prd.md:309-310`
- NFR access control + reliability + a11y baseline: `_bmad-output/planning-artifacts/prd.md:366,371-372,376-379`
- Feature mapping + boundaries: `_bmad-output/planning-artifacts/architecture.md:334-337,354,371,374`
- UX discovery/recommendation patterns: `_bmad-output/planning-artifacts/ux-design-specification.md:138-143,155-163`
- UX feedback/recovery + component baseline: `_bmad-output/planning-artifacts/ux-design-specification.md:483-490,566-577,642-650`
- Prior story intelligence: `_bmad-output/implementation-artifacts/3-2-retry-try-on-va-luu-ket-qua-theo-phien.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `node --experimental-default-type=module --test src/modules/recommendation/recommendation-service.test.js src/app/api/recommendations/route.test.js src/modules/catalog/catalog-service.test.js src/app/api/catalog/products/route.test.js src/app/api/catalog/products/[slug]/route.test.js src/modules/tryon/tryon-service.test.js src/app/api/try-on/route.test.js`
- `npm run lint`
- `npm run build`

### Completion Notes List

- Triển khai API `GET /api/recommendations` với `X-Correlation-Id`, validation boundary riêng và fallback baseline ổn định.
- Thêm recommendation service deterministic (baseline + personalization nhẹ từ viewed/try-on snapshot) và đảm bảo trả tối thiểu 5 gợi ý khi dữ liệu đủ.
- Tích hợp component recommendation list vào PDP cạnh TryOnPanel với loading/success/empty/error/fallback state.
- Bổ sung test cho recommendation service và route; chạy regression catalog + try-on + recommendation, lint và build thành công.

### File List

- `tmdt/src/shared/validation/recommendation.js`
- `tmdt/src/modules/recommendation/recommendation-service.js`
- `tmdt/src/modules/recommendation/recommendation-service.test.js`
- `tmdt/src/app/api/recommendations/route.js`
- `tmdt/src/app/api/recommendations/route.test.js`
- `tmdt/src/app/(public)/products/[slug]/recommendation-list.tsx`
- `tmdt/src/app/(public)/products/[slug]/page.tsx`
- `_bmad-output/implementation-artifacts/3-3-recommendation-baseline-va-ca-nhan-hoa-co-ban.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-12: Tạo mới Story 3.3 từ backlog với trạng thái `ready-for-dev` và context triển khai chi tiết.
- 2026-04-12: Hoàn tất implementation Story 3.3 (recommendation baseline + personalization cơ bản), bổ sung test, tích hợp PDP và chuyển `Status` sang `review`.
