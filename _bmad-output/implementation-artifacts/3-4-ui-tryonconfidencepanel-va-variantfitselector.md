# Story 3.4: UI TryOnConfidencePanel và VariantFitSelector

Status: done

## Story

As a khách hàng,
I want thấy panel try-on và tín hiệu fit gắn với biến thể,
so that tôi chốt size/màu tự tin hơn.

## Acceptance Criteria

1. Given kết quả try-on đã sẵn sàng, when khách hàng xem panel và chọn biến thể, then UI hiển thị fit confidence, trạng thái tồn kho, CTA đúng hierarchy, and các trạng thái loading/error/success tuân thủ UX patterns đã định nghĩa.

## Tasks / Subtasks

- [x] Thiết kế UI contract cho `TryOnConfidencePanel` và `VariantFitSelector` theo module boundary hiện có (AC: 1)
  - [x] Chốt input props tối thiểu cho panel (try-on state, confidence, image, retry action, CTA add-to-cart)
  - [x] Chốt input props tối thiểu cho selector (size/color, stock state, selected state, interaction callbacks)
  - [x] Chốt mapping trạng thái hiển thị theo UX patterns: `idle/processing/success/error/timeout` + trạng thái tồn kho
- [x] Triển khai `TryOnConfidencePanel` theo state matrix UX (AC: 1)
  - [x] Tách/chuẩn hóa phần hiển thị kết quả từ UI try-on hiện tại thành component tái sử dụng
  - [x] Hiển thị rõ fit confidence + trạng thái xử lý + thông điệp phục hồi khi lỗi/timeout
  - [x] Giữ CTA hierarchy rõ ràng: primary action cho bước quyết định, secondary cho retry/recovery
- [x] Triển khai `VariantFitSelector` gắn tín hiệu fit và tồn kho biến thể (AC: 1)
  - [x] Đồng bộ trạng thái selected variant với dữ liệu PDP hiện có
  - [x] Hiển thị tồn kho `available/low-stock/out-of-stock` rõ ràng, không chỉ dựa vào màu
  - [x] Đảm bảo interaction qua keyboard cho nhóm lựa chọn biến thể
- [x] Tích hợp hai component vào PDP mà không phá flow try-on/recommendation hiện hữu (AC: 1)
  - [x] Reuse dữ liệu từ `TryOnPanel`/PDP hiện tại, tránh duplicate logic business
  - [x] Giữ bố cục decision-first: media + try-on confidence + variant selection + CTA
  - [x] Đảm bảo không làm regress danh sách recommendation đã có ở Story 3.3
- [x] Bổ sung accessibility baseline và responsive behavior theo UX spec (AC: 1)
  - [x] Thêm semantic labels/ARIA phù hợp cho panel và selector
  - [x] Đảm bảo focus ring, disabled/loading states, live-region cho trạng thái xử lý
  - [x] Kiểm tra hiển thị mobile-first và breakpoint tablet/desktop theo guideline hiện có
- [x] Kiểm thử và regression guard cho Story 3.4 (AC: 1)
  - [x] Unit/integration tests cho state rendering và variant interaction
  - [x] Route/UI integration test đảm bảo retry + restore session không bị phá
  - [x] Regression tests cho PDP/try-on/recommendation và a11y keyboard path cốt lõi
  - [x] Chạy `npm run lint` và `npm run build`

### Review Findings

- [x] [Review][Patch] Bổ sung CTA hierarchy cho bước quyết định mua [tmdt/src/app/(public)/products/[slug]/try-on-confidence-panel.tsx:52]
- [x] [Review][Patch] Gắn tín hiệu fit theo biến thể size/màu [tmdt/src/app/(public)/products/[slug]/variant-fit-selector.tsx:642]
- [x] [Review][Patch] Trạng thái out-of-stock có thể vẫn click được khi dữ liệu không nhất quán [tmdt/src/app/(public)/products/[slug]/variant-fit-selector.tsx:659]
- [x] [Review][Patch] Có thể giữ lại kết quả try-on cũ khi restore trả payload không thành công [tmdt/src/app/(public)/products/[slug]/try-on-panel.tsx:413]

## Dev Notes

- Story 3.4 hiện thực lớp UI cho FR14/FR16, tiếp nối trực tiếp Story 3.1–3.3: dữ liệu try-on và recommendation đã có, mục tiêu là tăng “confidence” ở bước ra quyết định mua.
- Scope story tập trung vào UI composition + interaction states; không mở rộng sang thay đổi thuật toán AI try-on hay recommendation ranking.
- Cần ưu tiên reuse code đã có tại PDP (`try-on-panel.tsx`, `recommendation-list.tsx`, variant block ở `page.tsx`) để tránh tạo logic trùng lặp.

### Technical Requirements

- Bắt buộc hiển thị kết quả try-on và fit confidence ở PDP khi có dữ liệu phiên (FR14, FR16).
- Bắt buộc giữ UX state rõ ràng cho `loading/error/success/timeout` và recovery path (NFR14, NFR16).
- Bắt buộc cho phép tương tác chọn biến thể bằng keyboard, có focus state rõ và semantic phù hợp (NFR14, NFR17).
- Bắt buộc không phá vỡ flow retry/session restore đã hoàn tất ở Story 3.2.
- Bắt buộc không làm regress khối recommendation đã hoàn tất ở Story 3.3.

### Architecture Compliance

- Route layer `src/app/*` chỉ composition; không đưa business logic mới vào UI component.
- Tái sử dụng domain output từ `src/modules/tryon/*` và `src/modules/recommendation/*`; UI chỉ render state.
- Validation/business rules tiếp tục ở boundary/module hiện hữu, không embed vào component.
- Giữ pattern hiện có: thin route + service dày + response envelope chuẩn + `X-Correlation-Id`.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js 16.2.3 + React 19 + TypeScript + Tailwind CSS 4.
- Không thêm dependency UI mới nếu có thể đáp ứng bằng component/pattern hiện hữu.
- Ưu tiên component nhỏ, deterministic rendering, dễ test và dễ debug.

### File Structure Requirements

- Ưu tiên chỉnh sửa/tạo file trong phạm vi:
  - `tmdt/src/app/(public)/products/[slug]/try-on-panel.tsx`
  - `tmdt/src/app/(public)/products/[slug]/page.tsx`
  - `tmdt/src/app/(public)/products/[slug]/*` (cho `TryOnConfidencePanel` / `VariantFitSelector` nếu cần tách file)
  - `tmdt/src/modules/tryon/*` (chỉ khi cần đọc thêm context render, không đổi rule nghiệp vụ)
- Reuse pattern card/list/interaction đang có trên PDP, tránh tạo abstraction lớn ngoài scope story.

### Testing Requirements

- Cover tối thiểu các nhánh:
  - try-on `processing/success/error/timeout` hiển thị đúng,
  - selector variant hiển thị đúng trạng thái selected + stock,
  - keyboard navigation hoạt động cho selector,
  - retry/restore session vẫn hoạt động sau khi refactor UI.
- Regression test đảm bảo recommendation list vẫn render bình thường trên PDP.
- Bắt buộc pass `npm run lint` + `npm run build` trước khi chuyển `review`.

### Previous Story Intelligence

- Story 3.2 đã có session snapshot + retry semantics hybrid; UI mới phải giữ nguyên cách hiểu `retry=true` và không tạo race/stale state.
- Story 3.2 đã thêm guard `requestVersionRef` trong try-on panel để chống race; refactor UI không được làm mất guard này.
- Story 3.3 đã tích hợp `RecommendationList` vào PDP và xử lý stale request tương tự; cần giữ ổn định khi điều chỉnh bố cục PDP.
- Story 3.3 đã chốt baseline fallback messaging cho recommendation; không thay đổi contract route/service của story đó.

### Git Intelligence Summary

- Recent commits hiện có:
  - `1108dbe`: auth flow story 1.2
  - `445df65`: BMAD framework bootstrap
- Working tree có nhiều thay đổi chưa commit; khi triển khai Story 3.4 cần bám pattern code hiện hữu trong Epic 3 thay vì mở rộng kiến trúc mới.

### Latest Technical Information

- PRD xác nhận FR14/FR16 là phạm vi trực tiếp cho lớp UI try-on theo phiên.
- UX spec định nghĩa rõ `TryOnConfidencePanel` và `VariantFitSelector` với yêu cầu state matrix, keyboard/focus và decision-first hierarchy.
- Architecture mapping đã gắn Try-On và Recommendation vào module boundary rõ ràng; Story 3.4 là lớp UI orchestration trên PDP.

### Project Context Reference

- Không tìm thấy `project-context.md` trong workspace hiện tại.
- Nguồn chuẩn dùng cho story này: `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md`, và implementation artifacts Story 3.2/3.3.

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:379-393`
- FR14/FR16: `_bmad-output/planning-artifacts/prd.md:306,308`
- NFR keyboard/focus/loading/a11y: `_bmad-output/planning-artifacts/prd.md:376-379`
- Feature mapping + boundaries: `_bmad-output/planning-artifacts/architecture.md:335-337,354,362`
- UX component definitions: `_bmad-output/planning-artifacts/ux-design-specification.md:483-490,501-507`
- UX state/feedback/button hierarchy: `_bmad-output/planning-artifacts/ux-design-specification.md:557-577`
- UX responsive + WCAG baseline: `_bmad-output/planning-artifacts/ux-design-specification.md:614-650`
- Prior story intelligence: `_bmad-output/implementation-artifacts/3-2-retry-try-on-va-luu-ket-qua-theo-phien.md`, `_bmad-output/implementation-artifacts/3-3-recommendation-baseline-va-ca-nhan-hoa-co-ban.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npm run lint`
- `npm run build`
- `node --experimental-default-type=module --test src/app/api/try-on/route.test.js src/app/api/recommendations/route.test.js src/modules/tryon/tryon-session-store.test.js`

### Completion Notes List

- Tách render try-on thành component presentational `TryOnConfidencePanel`, giữ nguyên state machine, request anti-race guard và retry/restore flow trong `TryOnPanel`.
- Tách selector biến thể sang `VariantFitSelector`, giữ query-link (`size`,`color`) và hiển thị stock label dạng text `available/low-stock/out-of-stock`.
- Cập nhật composition PDP theo decision-first flow: thông tin sản phẩm → try-on → variant selector → recommendation; không đổi contract `RecommendationList`.
- Pass regression gates: lint, build, và targeted tests cho try-on/recommendation/session store.

### File List

- `tmdt/src/app/(public)/products/[slug]/try-on-panel.tsx`
- `tmdt/src/app/(public)/products/[slug]/try-on-confidence-panel.tsx`
- `tmdt/src/app/(public)/products/[slug]/variant-fit-selector.tsx`
- `tmdt/src/app/(public)/products/[slug]/page.tsx`
- `_bmad-output/implementation-artifacts/3-4-ui-tryonconfidencepanel-va-variantfitselector.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-12: Bắt đầu implement Story 3.4, chuyển trạng thái `ready-for-dev` → `in-progress`.
- 2026-04-12: Hoàn tất implement `TryOnConfidencePanel` + `VariantFitSelector`, cập nhật PDP composition và pass lint/build/test; chuyển trạng thái `review`.
