# Story 2.2: Lọc sản phẩm theo thuộc tính mua sắm

Status: done

## Story

As a khách hàng,
I want lọc theo danh mục, giá, size, màu,
so that tôi thu hẹp lựa chọn phù hợp nhu cầu.

## Acceptance Criteria

1. Given khách hàng đang ở trang danh sách sản phẩm, when khách hàng áp dụng một hoặc nhiều bộ lọc, then hệ thống trả kết quả lọc chính xác theo tất cả điều kiện, and giữ trạng thái filter nhất quán khi phân trang hoặc quay lại danh sách.

## Tasks / Subtasks

- [x] Mở rộng catalog domain cho filter thuộc tính mua sắm (AC: 1)
  - [x] Chuẩn hóa model catalog có dữ liệu thuộc tính tối thiểu: `category`, `price`, `size`, `color`
  - [x] Định nghĩa contract query filter: `category`, `minPrice`, `maxPrice`, `size`, `color`, `page`, `pageSize`
  - [x] Chuẩn hóa output API `camelCase` và không lộ field nội bộ
- [x] Triển khai business filtering trong `src/modules/catalog` (AC: 1)
  - [x] Áp điều kiện lọc theo category, khoảng giá, size, màu và hỗ trợ kết hợp nhiều filter
  - [x] Giữ nguyên nguyên tắc chỉ trả sản phẩm active/public
  - [x] Giữ logic phân trang tương thích với filter để đảm bảo kết quả nhất quán
- [x] Mở rộng API catalog filter tại `src/app/api/catalog/products` (AC: 1)
  - [x] Validate chặt query params filter mới và trả lỗi namespace `CATALOG_*` khi không hợp lệ
  - [x] Trả response nhất quán kèm `X-Correlation-Id`
  - [x] Trả metadata đủ để UI giữ trạng thái filter khi đổi trang
- [x] Cập nhật UI public `/products` cho filter attributes (AC: 1)
  - [x] Thêm filter controls tối thiểu cho category, price range, size, color
  - [x] Giữ trạng thái filter nhất quán khi phân trang và khi quay lại danh sách (URL/search params)
  - [x] Bổ sung hành vi “xóa bộ lọc” rõ ràng, giữ UX keyboard/focus theo baseline
- [x] Đảm bảo NFR hiệu năng và độ ổn định (AC: 1)
  - [x] Giữ giới hạn phân trang mặc định/tối đa để tránh payload lớn
  - [x] Tránh xử lý đồng bộ nặng trong route handler, giữ business logic ở module
  - [x] Xác nhận browse/filter trong ngưỡng NFR1 (95% <= 2 giây)
- [x] Kiểm thử cho catalog filter attributes (AC: 1)
  - [x] Test route cho filter đơn lẻ và tổ hợp filter
  - [x] Test validation lỗi query (giá âm, minPrice > maxPrice, page/pageSize sai)
  - [x] Test giữ trạng thái filter theo pagination/back-navigation ở UI
  - [x] Chạy `npm run lint` và `npm run build`

## Dev Notes

- Story này hiện thực FR9, mở rộng trực tiếp trên nền Story 2.1 (FR7/FR8) nên cần ưu tiên backward-compatible API contract browse/search.
- Tiếp tục giữ boundary pattern: `src/app` chỉ routing/composition, business logic ở `src/modules/catalog`.
- Không mở rộng sang PDP/SEO (FR10-FR12) trong story này.

### Technical Requirements

- Bắt buộc hỗ trợ lọc theo tối thiểu: `category`, `price range`, `size`, `color` (FR9).
- Hỗ trợ áp đồng thời nhiều điều kiện lọc với kết quả chính xác theo logic AND.
- Giữ tính nhất quán trạng thái filter khi phân trang hoặc quay lại danh sách.
- API contract nhất quán schema hiện hành và header `X-Correlation-Id`.
- Dữ liệu API dùng `camelCase`; không trả dữ liệu nhạy cảm/field nội bộ.

### Architecture Compliance

- Module chính: `tmdt/src/modules/catalog/*`.
- API boundary: `tmdt/src/app/api/catalog/*` cho route handler public read-only.
- UI public listing/filter: `tmdt/src/app/(public)/products/*`.
- Không đặt domain logic catalog trong `src/shared`; `src/shared` chỉ cho utility/validation cross-cutting.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js App Router 16.2.3 + React 19 + TypeScript + Tailwind.
- Không thêm dependency mới nếu chưa thực sự cần cho scope Story 2.2.
- Với Next.js 16.x, ưu tiên patterns route handlers/search params hiện có trong codebase.

### File Structure Requirements

- Ưu tiên đụng/chỉnh các vùng:
  - `tmdt/src/modules/catalog/*`
  - `tmdt/src/app/api/catalog/*`
  - `tmdt/src/app/(public)/products/*`
  - `tmdt/src/shared/validation/*` (chỉ cho validation query dùng chung)
- Dữ liệu seed/catalog tạm thời (nếu cần) đặt cùng module catalog để tránh coupling chéo.

### Testing Requirements

- Đúng chức năng: filter theo category/price/size/color và tổ hợp trả kết quả chính xác.
- Edge cases: query params sai kiểu, minPrice > maxPrice, giá âm, filter không khớp trả empty hợp lệ.
- UX baseline: loading/empty/error rõ ràng, keyboard submit/navigation, giữ filter state khi back/pagination.
- Regression: không làm ảnh hưởng auth/RBAC và API Story 1.x + browse/search Story 2.1.
- Bắt buộc pass `npm run lint` + `npm run build` trước khi chuyển review.

### Previous Story Intelligence

- Story 2.1 đã tạo nền module catalog, API `GET /api/catalog/products`, query validation và UI `/products`.
- Story 2.1 đã chuẩn hóa namespace lỗi `CATALOG_INVALID_QUERY` và `X-Correlation-Id`; Story 2.2 cần giữ đồng nhất.
- Story 2.1 đã bổ sung “xóa bộ lọc” ở UI; Story 2.2 cần mở rộng để áp cho toàn bộ filter attributes và trạng thái URL.
- Story 1.4 củng cố pattern API response và nguyên tắc tách business logic vào module.

### Git Intelligence Summary

- `1108dbe`: nền identity/auth ổn định, hạn chế đụng sâu để tránh regression ngoài scope catalog.
- `445df65`: khởi tạo BMAD workflow/artifacts; cần giữ đồng bộ trạng thái story/sprint-status.

### Latest Technical Information

- Dự án đang dùng Next.js 16.2.3 + React 19 (theo `tmdt/CLAUDE.md`), cần bám conventions App Router hiện tại.
- Kiến trúc xác định Catalog/Search/Filter ở `src/modules/catalog`, route public `/products`, API `/api/catalog`.

### Project Context Reference

- Không tìm thấy `project-context.md` trong workspace hiện tại; dùng `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md` làm nguồn chuẩn.

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:300-313`
- FR9 requirement: `_bmad-output/planning-artifacts/prd.md:299`
- NFR1 performance target: `_bmad-output/planning-artifacts/prd.md:357`
- Catalog/Search/Filter mapping: `_bmad-output/planning-artifacts/architecture.md:353`
- API format + correlation ID + error namespace: `_bmad-output/planning-artifacts/architecture.md:152-157,181-184`
- API/query naming camelCase: `_bmad-output/planning-artifacts/architecture.md:127,160`
- UX filter-state + clear filters baseline: `_bmad-output/planning-artifacts/ux-design-specification.md:604`
- Accessibility baseline: `_bmad-output/planning-artifacts/ux-design-specification.md:642-650`
- Previous story learnings: `_bmad-output/implementation-artifacts/2-1-duyet-danh-muc-va-tim-kiem-san-pham.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `node --experimental-default-type=module --test tmdt/src/app/api/catalog/products/route.test.js tmdt/src/app/api/account-actions.test.js` (pass 11/11)
- `npm --prefix tmdt run lint` (pass)
- `npm --prefix tmdt run build` (pass)

### Completion Notes List

- Mở rộng catalog dataset với thuộc tính `size` và `color`, giữ nguyên nguyên tắc chỉ trả sản phẩm `isActive` cho luồng public.
- Mở rộng contract filter/query gồm `size`, `color`, `minPrice`, `maxPrice` cùng validate chặt cho khoảng giá.
- Cập nhật service catalog hỗ trợ lọc tổ hợp theo category/size/color/khoảng giá và vẫn tương thích pagination.
- Mở rộng API `GET /api/catalog/products` trả metadata `filters` và giữ chuẩn `X-Correlation-Id` + `CATALOG_INVALID_QUERY`.
- Cập nhật UI `/products` với controls filter thuộc tính, đồng bộ trạng thái qua URL search params, phân trang và clear filter.
- Bổ sung test route catalog cho filter tổ hợp và validation khoảng giá không hợp lệ.

### File List

- `_bmad-output/implementation-artifacts/2-2-loc-san-pham-theo-thuoc-tinh-mua-sam.md`
- `tmdt/src/modules/catalog/product-store.js`
- `tmdt/src/modules/catalog/catalog-service.js`
- `tmdt/src/shared/validation/catalog.js`
- `tmdt/src/app/api/catalog/products/route.js`
- `tmdt/src/app/api/catalog/products/route.test.js`
- `tmdt/src/app/(public)/products/page.tsx`

## Change Log

- 2026-04-12: Tạo story 2.2 với context đầy đủ và đặt trạng thái `ready-for-dev`.
- 2026-04-12: Hoàn tất triển khai Story 2.2 (catalog filter attributes), cập nhật trạng thái `review` sau khi pass test/lint/build.

### Review Findings

- [x] [Review][Patch] Bọc GET catalog bằng guard runtime để luôn trả error envelope có `X-Correlation-Id` [tmdt/src/app/api/catalog/products/route.js:15]
- [x] [Review][Patch] Xử lý fallback khi response không parse được JSON ở UI catalog [tmdt/src/app/(public)/products/page.tsx:119]
- [x] [Review][Patch] Chuẩn hóa pagination khi request page vượt totalPages để tránh trạng thái không khả thi [tmdt/src/modules/catalog/catalog-service.js:65]
- [x] [Review][Patch] Tránh lộ mutable shared state từ product store [tmdt/src/modules/catalog/product-store.js:59]
- [x] [Review][Patch] Chặn giá trị số vượt safe integer cho query `page/pageSize/minPrice/maxPrice` [tmdt/src/shared/validation/catalog.js:15]
- [x] [Review][Patch] Đồng bộ state lỗi với URL filter hiện tại, tránh reset pagination gây lệch trạng thái [tmdt/src/app/(public)/products/page.tsx:124]
- [x] [Review][Patch] Làm test catalog deterministic và bổ sung case regression cho phân trang/filter [tmdt/src/app/api/catalog/products/route.test.js:24]
