# Story 8.1: Chuẩn hóa visual system và hierarchy cho toàn bộ màn hình chính

Status: in-progress

## Story

As a người dùng cuối,
I want giao diện có thứ bậc trực quan nhất quán giữa các khu vực,
so that tôi thao tác nhanh và hiểu trạng thái trang ngay lập tức.

## Acceptance Criteria

1. Given các màn hình customer/admin/warehouse hiện có, when áp dụng visual system chuẩn cho typography, spacing, button hierarchy và feedback styles, then các màn hình thể hiện hierarchy primary/secondary/destructive nhất quán.
2. And pattern loading/empty/error/info dùng chung một taxonomy trình bày.
3. And guideline sử dụng component được ghi rõ để tránh lệch style giữa các feature.

## Tasks / Subtasks

- [ ] Chuẩn hóa visual tokens và nguyên tắc hierarchy dùng chung (AC: 1, 3)
  - [ ] Chốt bộ token typography/spacing/color/state semantics áp dụng xuyên customer/admin/warehouse.
  - [ ] Quy định rõ button hierarchy theo screen context: 1 primary action, secondary/tertiary/destructive rõ ràng.
  - [ ] Đảm bảo state matrix cho component tương tác: default/hover/focus/disabled/loading/error/success.

- [ ] Áp dụng taxonomy feedback chuẩn cho các màn hình chính (AC: 2)
  - [ ] Chuẩn hóa pattern loading/empty/error/info và thông điệp recovery ngắn gọn.
  - [ ] Đồng bộ status label + icon/text để không phụ thuộc màu.
  - [ ] Reuse các pattern status đã có (timeline, recovery banners) để tránh phân mảnh UI.

- [ ] Refactor/reuse foundation components theo design direction Epic 8 (AC: 1, 3)
  - [ ] Ưu tiên dùng lại primitives trong `src/components/ui` và feature components hiện có.
  - [ ] Chuẩn hóa style API/variant naming để nhiều agent có thể implement nhất quán.
  - [ ] Loại bỏ style drift giữa các màn hình chính (catalog, checkout, orders, admin dashboard/operations).

- [ ] Viết guideline ngắn cho dev để áp dụng thống nhất (AC: 3)
  - [ ] Ghi rõ quy tắc chọn component, variant, hierarchy theo từng loại màn hình.
  - [ ] Bổ sung checklist “không merge nếu lệch hierarchy hoặc thiếu state/feedback”.
  - [ ] Đặt guideline ở vị trí dễ tra cứu cho team dev (theo cấu trúc docs hiện có).

- [ ] Thiết lập test/checklist cho visual consistency (AC: 1, 2, 3)
  - [ ] UI tests/checklist xác minh button hierarchy + interaction states trên các màn hình trọng yếu.
  - [ ] A11y checks cho contrast cơ bản + semantic states (NFR17).
  - [ ] Snapshot/visual smoke checks cho các layout chính để bắt regression style.

## Dev Notes

### Technical Requirements

- Story này bao phủ NFR16, NFR17 cùng UX-DR1, UX-DR5, UX-DR6.
- Mục tiêu là “presentation-ready” nhưng không thay đổi ownership FR nghiệp vụ của các epic trước.
- Cần đạt sự nhất quán visual + feedback patterns xuyên role/customer/admin/warehouse.

### Architecture Compliance

- Ưu tiên thay đổi ở layer UI/component (`src/components/*`, `src/app/*`) và không đẩy business logic vào UI refactor.
- Giữ ranh giới module hiện tại: `src/app` cho composition, `src/modules` cho nghiệp vụ, `src/shared` cho cross-cutting.
- API contracts/envelope giữ nguyên; story này tập trung presentation consistency.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js App Router + Tailwind CSS + component reuse nội bộ.
- Không thêm design library mới khi chưa cần; ưu tiên chuẩn hóa trên nền component hiện có.
- Nếu tạo mới component, phải có state matrix và accessibility notes theo UX spec.

### File Structure Requirements

Ưu tiên thay đổi ở:
- `tmdt/src/components/ui/**`
- `tmdt/src/components/features/**`
- `tmdt/src/app/(public)/**`
- `tmdt/src/app/(customer)/**`
- `tmdt/src/app/admin/**`
- `tmdt/src/app/(warehouse)/**`
- Tài liệu guideline trong khu vực tài liệu BMAD/UX phù hợp cấu trúc hiện tại
- Test files UI/a11y liên quan trong `tmdt/src/**`

### Testing Requirements

- Verify hierarchy consistency: mỗi màn hình có primary action rõ, secondary/destructive đúng vai trò.
- Verify interaction states đầy đủ cho thành phần tương tác (focus/disabled/loading/error/success).
- Verify loading/empty/error/info taxonomy nhất quán và có next action khi cần.
- Verify contrast + semantic labeling cho các thành phần chính (NFR17).

### Previous Story Intelligence

- Epic 7 đã chuẩn hóa status/recovery patterns (timeline/banner); Story 8.1 cần tái sử dụng trực quan các pattern đó thay vì tạo style mới.
- Các màn hình customer/admin/warehouse đã có nền chức năng, nên Story 8.1 tập trung chuẩn hóa trình bày, tránh mở rộng nghiệp vụ.
- Tránh regress các flow đã ổn định ở checkout/orders/payment/tracking khi refactor UI.

### Git Intelligence Summary

- Working tree lớn và nhiều lane song song; cần giới hạn phạm vi thay đổi ở visual system/hierarchy.
- Ưu tiên incremental refactor theo foundation components để giảm xung đột merge.

### References

- Story 8.1 source + AC: `_bmad-output/planning-artifacts/epics.md:679-693`
- Epic 8 scope: `_bmad-output/planning-artifacts/epics.md:675-677`
- NFR16, NFR17: `_bmad-output/planning-artifacts/prd.md:391-392`
- UX-DR1, UX-DR5, UX-DR6 + component/state guidance:
  - `_bmad-output/planning-artifacts/epics.md:113`, `:117-118`
  - `_bmad-output/planning-artifacts/ux-design-specification.md:173`, `:185-186`, `:327`, `:357-361`, `:527`, `:687`
- Architecture structure guardrails:
  - `_bmad-output/planning-artifacts/architecture.md:133`, `:140-141`, `:302`, `:310-311`, `:335-337`, `:428`
- Previous story intelligence baseline:
  - `_bmad-output/implementation-artifacts/7-4-fallback-van-hanh-de-giu-luong-end-to-end-lien-tuc.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- (to be filled by dev-story)

### Completion Notes List

- Story context created for implementation.

### File List

- `_bmad-output/implementation-artifacts/8-1-chuan-hoa-visual-system-va-hierarchy-cho-toan-bo-man-hinh-chinh.md`
