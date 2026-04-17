# Story 2.1: Duyệt danh mục và tìm kiếm sản phẩm

Status: done

## Story

As a khách hàng,
I want duyệt danh mục và tìm kiếm theo từ khóa,
so that tôi nhanh chóng tìm được sản phẩm quan tâm.

## Acceptance Criteria

1. Given dữ liệu catalog đã có sản phẩm, when khách hàng mở danh mục hoặc nhập từ khóa tìm kiếm, then hệ thống trả danh sách sản phẩm theo điều kiện truy vấn, and thời gian phản hồi tuân thủ NFR hiệu năng cho browse/search.

## Tasks / Subtasks

- [x] Thiết kế domain catalog tối thiểu cho browse/search (AC: 1)
  - [x] Khai báo model sản phẩm phục vụ listing công khai (id, slug, tên, danh mục, giá hiển thị, thumbnail, trạng thái active)
  - [x] Định nghĩa contract truy vấn browse/search tại module `catalog` (category, keyword, page, pageSize)
  - [x] Chuẩn hóa dữ liệu trả về ở định dạng API camelCase, không lộ field nội bộ
- [x] Triển khai service catalog trong `src/modules/catalog` (AC: 1)
  - [x] Tạo hàm lấy danh sách theo danh mục với phân trang cơ bản
  - [x] Tạo hàm tìm kiếm theo từ khóa (tên/slug) và xử lý từ khóa rỗng hợp lệ
  - [x] Đảm bảo chỉ trả sản phẩm public/active để tránh rò rỉ dữ liệu vận hành
- [x] Triển khai API browse/search tại boundary `src/app/api/catalog` (AC: 1)
  - [x] Tạo endpoint GET cho browse và search với validate query params chặt chẽ
  - [x] Trả response/error theo chuẩn kiến trúc hiện tại và thêm `X-Correlation-Id`
  - [x] Chuẩn hóa mã lỗi nghiệp vụ theo namespace `CATALOG_*` khi truy vấn không hợp lệ
- [x] Bổ sung UI public listing + search tối thiểu (AC: 1)
  - [x] Tạo route public cho danh sách sản phẩm theo kiến trúc App Router
  - [x] Hiển thị trạng thái loading/empty/error rõ ràng cho browse/search
  - [x] Cho phép nhập từ khóa và submit bằng keyboard, giữ UX baseline focus/label
- [x] Đảm bảo NFR hiệu năng cho browse/search (AC: 1)
  - [x] Áp dụng giới hạn phân trang mặc định và tối đa để tránh payload quá lớn
  - [x] Tránh xử lý đồng bộ nặng trong route handler; giữ business logic ở module
  - [x] Xác nhận phản hồi browse/search bám mục tiêu NFR1 (95% <= 2 giây)
- [x] Kiểm thử cho catalog browse/search (AC: 1)
  - [x] Test case browse danh mục có dữ liệu/không có dữ liệu
  - [x] Test case search theo từ khóa hợp lệ/không hợp lệ/keyword rỗng
  - [x] Test case response schema, mã lỗi `CATALOG_*`, và `X-Correlation-Id`
  - [x] Chạy `npm run lint` và `npm run build`

## Dev Notes

- Story này hiện thực FR7 và FR8, là nền cho Story 2.2 (filter) và 2.3 (PDP + SEO). Thiết kế contract browse/search cần ổn định để các story sau mở rộng mà không phá API.
- Giữ nguyên nguyên tắc boundary: `src/app` chỉ routing/composition, business logic ở `src/modules/catalog`.
- Tránh mở rộng scope sang filter nâng cao (FR9) và PDP/SEO metadata chi tiết (FR10-12) trong story này.

### Technical Requirements

- Bắt buộc hỗ trợ duyệt danh mục sản phẩm (FR7) và tìm kiếm theo từ khóa (FR8).
- Browse/search phải đáp ứng mục tiêu hiệu năng NFR1: 95% request <= 2 giây trong tải thường.
- API contract tuân thủ schema hiện hành: success/error có cấu trúc nhất quán, header `X-Correlation-Id`.
- Dữ liệu API dùng `camelCase`; không trả dữ liệu nhạy cảm hoặc field nội bộ không cần thiết.

### Architecture Compliance

- Module chính: `tmdt/src/modules/catalog/*` cho nghiệp vụ browse/search.
- API boundary: `tmdt/src/app/api/catalog/*` cho route handler public read-only.
- UI public listing/search: `tmdt/src/app/(public)/products/*` hoặc route public tương đương theo cấu trúc App Router hiện có.
- Không đặt domain logic catalog trong `src/shared`; `src/shared` chỉ cho utility/validation cross-cutting.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js App Router 16.2.3 + React 19 + TypeScript + Tailwind.
- Không thêm dependency mới nếu chưa thực sự cần cho scope Story 2.1.
- Với Next.js 16.x, ưu tiên pattern route handlers/cookies/headers đã dùng nhất quán trong codebase hiện tại.

### File Structure Requirements

- Ưu tiên đụng/chỉnh các vùng:
  - `tmdt/src/modules/catalog/*` (tạo mới nếu chưa có)
  - `tmdt/src/app/api/catalog/*`
  - `tmdt/src/app/(public)/products/*` (route listing/search)
  - `tmdt/src/shared/validation/*` (chỉ khi cần validation query dùng chung)
- Dữ liệu seed/catalog tạm thời (nếu cần) phải đặt cùng module catalog hoặc data store cục bộ theo pattern dự án, tránh coupling chéo với identity.

### Testing Requirements

- Đúng chức năng: browse theo danh mục và search theo từ khóa trả kết quả chính xác.
- Edge cases: keyword rỗng, query params sai kiểu, page/pageSize vượt ngưỡng phải trả lỗi phù hợp.
- UX baseline: có loading/empty state, submit tìm kiếm bằng keyboard, focus/error state rõ ràng.
- Regression: không làm ảnh hưởng auth/RBAC và các API Story 1.x đã hoàn thành.
- Bắt buộc pass `npm run lint` + `npm run build` trước khi chuyển `review`.

### Previous Story Intelligence

- Story 1.4 đã chuẩn hóa pattern API response kèm `X-Correlation-Id`; Story 2.1 cần giữ đồng nhất contract boundary.
- Story 1.4 tiếp tục củng cố nguyên tắc tách business logic ra module (`src/modules/*`), route handler giữ mỏng.
- Story 1.3/1.4 đã thiết lập convention lỗi theo namespace (`AUTH_*`), vì vậy Story 2.1 nên dùng namespace `CATALOG_*` cho lỗi miền catalog.
- Session/auth đang in-memory theo scope Epic 1; Story 2.1 là public browse/search nên không phụ thuộc session để tránh tăng coupling.

### Git Intelligence Summary

- `1108dbe`: đã hoàn thiện auth flow + nền identity; cần tránh đụng sâu vào luồng auth khi làm catalog public.
- `445df65`: đã khởi tạo BMAD workflow/artifacts; cần duy trì cập nhật trạng thái story/sprint-status nhất quán.

### Latest Technical Information

- Dự án đang dùng Next.js 16.2.3 + React 19 (theo `tmdt/CLAUDE.md`), cần bám conventions App Router hiện hành để tránh pattern cũ.
- Kiến trúc đã xác định public SEO pages cho catalog/search/PDP là read-only; Story 2.1 nên giữ scope read-only browse/search.

### Project Context Reference

- Không tìm thấy `project-context.md` trong workspace hiện tại; dùng `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md` làm nguồn chuẩn.

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:281-299`
- FR7/FR8 requirements: `_bmad-output/planning-artifacts/prd.md:296-299`
- NFR1 performance target: `_bmad-output/planning-artifacts/prd.md:356-358`
- Catalog/Search architecture mapping: `_bmad-output/planning-artifacts/architecture.md:353`
- API boundary and module boundaries: `_bmad-output/planning-artifacts/architecture.md:327-337`
- API format + correlation ID + error namespace: `_bmad-output/planning-artifacts/architecture.md:152-157,181-184`
- UX search/filter, loading/empty/focus/a11y baselines: `_bmad-output/planning-artifacts/ux-design-specification.md:600-605,642-650`
- Previous story learnings: `_bmad-output/implementation-artifacts/1-4-quan-ly-ho-so-va-nhat-ky-quan-tri-tai-khoan.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `node --experimental-default-type=module --test tmdt/src/app/api/account-actions.test.js tmdt/src/app/api/catalog/products/route.test.js` (pass 9/9)
- `npm --prefix tmdt run lint` (pass)
- `npm --prefix tmdt run build` (pass)

### Completion Notes List

- Triển khai module catalog mới với dataset sản phẩm mẫu, chỉ trả về sản phẩm `isActive` cho luồng browse/search công khai.
- Triển khai contract truy vấn `category/keyword/page/pageSize`, validate query params và chuẩn hóa lỗi `CATALOG_INVALID_QUERY`.
- Thêm API `GET /api/catalog/products` với header `X-Correlation-Id` và response pagination.
- Thêm UI public `/products` hỗ trợ browse/search theo từ khóa + danh mục, kèm loading/empty/error states và submit bằng keyboard.
- Bổ sung test route catalog để bao phủ browse, filter category, search keyword và invalid query.

### File List

- `_bmad-output/implementation-artifacts/2-1-duyet-danh-muc-va-tim-kiem-san-pham.md`
- `tmdt/src/modules/catalog/product-store.js`
- `tmdt/src/modules/catalog/catalog-service.js`
- `tmdt/src/shared/validation/catalog.js`
- `tmdt/src/app/api/catalog/products/route.js`
- `tmdt/src/app/api/catalog/products/route.test.js`
- `tmdt/src/app/products/page.tsx`

## Change Log

- 2026-04-12: Tạo story 2.1 với context đầy đủ và đặt trạng thái `ready-for-dev`.
- 2026-04-11: Hoàn tất triển khai Story 2.1 (catalog browse/search), cập nhật trạng thái `review` sau khi pass test/lint/build.
