# Story 2.3: PDP biến thể, tồn kho và SEO public

Status: done

## Story

As a khách hàng,
I want xem chi tiết sản phẩm, biến thể và tồn kho,
so that tôi có đủ thông tin để quyết định mua.

## Acceptance Criteria

1. Given khách hàng truy cập trang chi tiết sản phẩm, when khách hàng chọn biến thể size/màu, then hệ thống hiển thị đúng thông tin sản phẩm, biến thể, trạng thái tồn kho, and trang public có metadata/URL thân thiện phục vụ index SEO.

## Tasks / Subtasks

- [x] Mở rộng catalog domain cho PDP và biến thể tồn kho (AC: 1)
  - [x] Chuẩn hóa model sản phẩm chi tiết gồm mô tả, media, danh sách biến thể và tồn kho theo biến thể
  - [x] Định nghĩa contract truy vấn PDP theo `slug` và `variant` (size/màu) bằng query params rõ ràng
  - [x] Chuẩn hóa output API dạng `camelCase`, không lộ field nội bộ
- [x] Triển khai business logic PDP trong `src/modules/catalog` (AC: 1)
  - [x] Truy xuất sản phẩm theo slug và xác định biến thể đang chọn
  - [x] Trả trạng thái tồn kho theo biến thể (còn hàng/hết hàng) nhất quán với dữ liệu catalog
  - [x] Xử lý slug không tồn tại với response lỗi nhất quán
- [x] Mở rộng API public cho PDP tại `src/app/api/catalog` (AC: 1)
  - [x] Thêm endpoint đọc chi tiết sản phẩm theo slug phục vụ UI public
  - [x] Validate query params biến thể và trả lỗi namespace `CATALOG_*` khi không hợp lệ
  - [x] Giữ chuẩn response envelope + `X-Correlation-Id`
- [x] Xây dựng UI public PDP ở `src/app/(public)/products/[slug]` (AC: 1)
  - [x] Hiển thị thông tin cốt lõi: tên, giá, mô tả ngắn, danh mục, media
  - [x] Hiển thị selector size/màu và đồng bộ trạng thái variant qua URL/search params
  - [x] Hiển thị trạng thái tồn kho rõ ràng theo biến thể đang chọn
- [x] Triển khai SEO metadata cho trang public PDP (AC: 1)
  - [x] Cấu hình metadata động (title, description, canonical/open graph cơ bản) theo sản phẩm
  - [x] Đảm bảo slug URL thân thiện cho index, không thêm tham số SEO không cần thiết
  - [x] Giữ nội dung public render được theo baseline SEO hiện tại của App Router
- [x] Đảm bảo NFR hiệu năng và accessibility baseline cho PDP (AC: 1)
  - [x] Giữ thời gian phản hồi browse/PDP trong ngưỡng NFR1 (95% <= 2 giây) ở mức chức năng
  - [x] Bảo đảm keyboard navigation cho selector biến thể, focus/disabled/loading state rõ ràng
  - [x] Không làm regression các luồng browse/filter đã hoàn tất ở Story 2.1/2.2
- [x] Kiểm thử và xác nhận chất lượng Story 2.3 (AC: 1)
  - [x] Test route cho case slug hợp lệ, slug không tồn tại, query biến thể không hợp lệ
  - [x] Test business logic chọn biến thể + tồn kho
  - [x] Chạy `npm run lint` và `npm run build`

### Review Findings

- [x] [Review][Patch] Bổ sung trạng thái disabled/focus rõ ràng cho biến thể hết hàng để đáp ứng A11y baseline [tmdt/src/app/(public)/products/[slug]/page.tsx:129]
- [x] [Review][Patch] Chặn query đa giá trị `size/color` (hoặc trả lỗi rõ ràng) thay vì âm thầm lấy phần tử đầu tiên [tmdt/src/app/(public)/products/[slug]/page.tsx:14]
- [x] [Review][Patch] Bổ sung test cho nhánh lỗi nội bộ `CATALOG_INTERNAL_ERROR` của endpoint PDP detail [tmdt/src/app/api/catalog/products/[slug]/route.js:68]

## Dev Notes

- Story 2.3 hiện thực FR10/FR11/FR12, mở rộng trực tiếp sau 2.1/2.2 nên ưu tiên tái sử dụng module catalog và API conventions hiện có.
- Giữ boundary pattern: `src/app` chỉ routing/composition, domain logic ở `src/modules/catalog`, validation ở `src/shared/validation`.
- Không mở rộng sang try-on/recommendation trong story này; chỉ chuẩn bị PDP baseline để story epic 3 dùng lại.

### Technical Requirements

- Bắt buộc hỗ trợ xem chi tiết sản phẩm theo slug (FR10).
- Bắt buộc hỗ trợ chọn biến thể size/màu và hiển thị tồn kho theo biến thể (FR11).
- Bắt buộc hỗ trợ public SEO metadata/URL thân thiện cho PDP (FR12).
- API response dùng `camelCase`, theo envelope nhất quán và có `X-Correlation-Id`.
- Lỗi query/slug không hợp lệ theo namespace `CATALOG_INVALID_QUERY`/`CATALOG_NOT_FOUND` (hoặc mã cùng namespace `CATALOG_*` nhất quán toàn module).

### Architecture Compliance

- Mapping capability Catalog/Search/Filter/PDP: `_bmad-output/planning-artifacts/architecture.md:351-357`.
- Public SEO pages nằm ở khu vực public app router: `_bmad-output/planning-artifacts/architecture.md:102,328`.
- Module boundaries:
  - `src/app/*` chỉ route/composition
  - `src/modules/*` cho business logic
  - `src/shared/*` cho cross-cutting utility/validation
  (ref: `_bmad-output/planning-artifacts/architecture.md:334-337`)

### Library / Framework Requirements

- Tiếp tục stack hiện tại: Next.js App Router 16.2.3 + React 19 + TypeScript + Tailwind.
- Tuân thủ pattern SEO/public page của Next.js App Router đã chọn cho kiến trúc.
- Không thêm dependency mới nếu chưa thực sự cần cho scope Story 2.3.

### File Structure Requirements

- Ưu tiên chỉnh sửa/tạo mới trong phạm vi:
  - `tmdt/src/modules/catalog/*`
  - `tmdt/src/app/api/catalog/*`
  - `tmdt/src/app/(public)/products/[slug]/page.tsx` (và file liên quan trong cùng route)
  - `tmdt/src/shared/validation/*` (validation query/path params)
- Tránh đặt business logic PDP trong `src/shared`.

### Testing Requirements

- Đúng chức năng: truy cập PDP theo slug, chọn variant size/màu, cập nhật tồn kho đúng biến thể.
- Edge cases: slug không tồn tại, thiếu hoặc sai query biến thể, biến thể không khớp sản phẩm.
- SEO baseline: metadata theo sản phẩm được set ở route PDP public.
- Regression: không ảnh hưởng API browse/search/filter story 2.1/2.2.
- Bắt buộc pass `npm run lint` + `npm run build`.

### Previous Story Intelligence

- Story 2.1 đã chuẩn hóa browse/search API và cấu trúc catalog module; nên tái sử dụng contract/query validation patterns.
- Story 2.2 đã bổ sung filter attributes + đồng bộ state qua URL; có thể tái dùng approach search params khi sync variant ở PDP.
- Story 2.2 review đã fix thêm các guard quan trọng:
  - runtime guard trong API route để giữ response envelope ổn định,
  - clamp pagination,
  - safe integer validation,
  - test deterministic + thêm regression cases.

### Git Intelligence Summary

- Recent commits khả dụng trong repo hiện tại:
  - `1108dbe`: auth flow story 1.2
  - `445df65`: BMAD framework bootstrap
- Working tree đang chứa nhiều thay đổi chưa commit; cần bám conventions code hiện hành thay vì dựa commit history ngắn.

### Latest Technical Information

- Kiến trúc yêu cầu public SEO pages cho catalog/PDP, nên Story 2.3 cần bám sát metadata/canonical pattern của App Router.
- UX spec nhấn mạnh PDP decision-centric và hiển thị đồng thời selector biến thể + thông tin tồn kho rõ ràng.

### Project Context Reference

- Không tìm thấy `project-context.md` trong workspace hiện tại.
- Nguồn chuẩn dùng cho story này: `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md`.

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:315-329`
- FR10/FR11/FR12: `_bmad-output/planning-artifacts/prd.md:300-302`
- Catalog/PDP + public SEO mapping: `_bmad-output/planning-artifacts/architecture.md:102,328,351-357`
- Boundary rules app/modules/shared: `_bmad-output/planning-artifacts/architecture.md:334-337`
- NFR1 performance target: `_bmad-output/planning-artifacts/prd.md:357`
- UX định hướng PDP/variant/decision flow: `_bmad-output/planning-artifacts/ux-design-specification.md:123,139,485-505,585,590`
- A11y baseline: `_bmad-output/planning-artifacts/ux-design-specification.md:642-650`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npm run lint` ✅
- `npm run build` ✅
- `node --experimental-default-type=module --test "src/modules/catalog/catalog-service.test.js" "src/app/api/catalog/products/route.test.js" "src/app/api/catalog/products/[slug]/route.test.js"` ✅ (19 tests passed)

### Completion Notes List

- Hoàn tất PDP public theo slug với metadata động (title/description/canonical/openGraph) cho SEO baseline.
- Hoàn tất flow chọn biến thể `size/color` qua URL query params và hiển thị trạng thái tồn kho theo biến thể.
- Hoàn tất API chi tiết sản phẩm `/api/catalog/products/[slug]` với validation query, error namespace `CATALOG_*`, response envelope và `X-Correlation-Id`.
- Hoàn tất mở rộng catalog domain/service cho dữ liệu mô tả, media, variants tồn kho và logic chọn biến thể.
- Đã chạy lint/build và test unit+route liên quan catalog/PDP, không phát hiện regression.

### File List

- `tmdt/src/modules/catalog/product-store.js`
- `tmdt/src/modules/catalog/catalog-service.js`
- `tmdt/src/modules/catalog/catalog-service.test.js`
- `tmdt/src/shared/validation/catalog.js`
- `tmdt/src/app/api/catalog/products/[slug]/route.js`
- `tmdt/src/app/api/catalog/products/[slug]/route.test.js`
- `tmdt/src/app/(public)/products/page.tsx`
- `tmdt/src/app/(public)/products/[slug]/page.tsx`
- `_bmad-output/implementation-artifacts/2-3-pdp-bien-the-ton-kho-va-seo-public.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-12: Tạo mới Story 2.3 từ backlog với context triển khai đầy đủ, trạng thái `ready-for-dev`.
- 2026-04-12: Triển khai xong phạm vi Story 2.3 (PDP, variant stock, SEO metadata), chạy test/lint/build pass và chuyển trạng thái sang `review`.
