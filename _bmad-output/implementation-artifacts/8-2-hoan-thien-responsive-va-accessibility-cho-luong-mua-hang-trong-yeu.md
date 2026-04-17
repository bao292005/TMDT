# Story 8.2: Hoàn thiện responsive và accessibility cho luồng mua hàng trọng yếu

Status: ready-for-dev

## Story

As a khách hàng,
I want hoàn tất luồng mua hàng mượt trên mobile và desktop,
so that trải nghiệm trình bày đạt chuẩn web e-commerce thông thường.

## Acceptance Criteria

1. Given các luồng Discover -> PDP/Try-on -> Cart -> Checkout -> Tracking, when kiểm thử tại tất cả breakpoint mục tiêu và keyboard-only path, then không có blocker thao tác hoặc vỡ layout ở các điểm dừng chính.
2. And form quan trọng có label, trạng thái focus, lỗi rõ nghĩa và giữ dữ liệu người dùng.
3. And thành phần tương tác đạt touch target tối thiểu và không phụ thuộc chỉ vào màu.

## Tasks / Subtasks

- [ ] Chuẩn hóa responsive behavior cho các màn hình mua hàng chính (AC: 1)
  - [ ] Rà soát breakpoint mobile/tablet/desktop theo chuẩn Tailwind mobile-first cho Discover, PDP/Try-on, Cart, Checkout, Tracking.
  - [ ] Loại bỏ các điểm vỡ layout ở CTA, summary block, timeline, bảng thông tin đơn hàng.
  - [ ] Đảm bảo interaction parity giữa touch/pointer/keyboard cho các hành động trọng yếu.

- [ ] Hoàn thiện keyboard-only path xuyên suốt journey (AC: 1, 2)
  - [ ] Đảm bảo thứ tự focus hợp lý và có thể thao tác đầy đủ trên catalog, try-on, cart, checkout, tracking.
  - [ ] Áp dụng focus ring nhất quán cho các thành phần tương tác.
  - [ ] Với modal/drawer, bắt buộc focus trap + ESC close + restore focus.

- [ ] Chuẩn hóa form accessibility cho luồng quan trọng (AC: 2)
  - [ ] Kiểm tra label-input semantic cho form đăng nhập và checkout.
  - [ ] Bảo đảm lỗi hiển thị ngay dưới field, nội dung sửa lỗi rõ và focus về lỗi đầu tiên khi submit fail.
  - [ ] Giữ lại dữ liệu người dùng ở các nhánh lỗi/retry để tránh nhập lại không cần thiết.

- [ ] Chuẩn hóa touch target và semantic feedback (AC: 3)
  - [ ] Đảm bảo hit area đủ lớn cho button, link hành động, control chọn biến thể/phương thức thanh toán trên mobile.
  - [ ] Chuẩn hóa trạng thái info/warning/error/success bằng label + icon/text, không chỉ màu.
  - [ ] Đồng bộ trạng thái loading/disabled/error với feedback chữ theo ngữ cảnh.

- [ ] Thiết lập kiểm thử responsive + a11y guardrails (AC: 1, 2, 3)
  - [ ] Bổ sung checklist test cho các breakpoint chính trên Chrome/Safari/Firefox/Edge.
  - [ ] Thực hiện keyboard-only walkthrough cho toàn bộ luồng mua hàng.
  - [ ] Chạy a11y checks cho contrast, focus order, form error announcement và semantic labeling.

## Dev Notes

### Technical Requirements

- Story này bao phủ NFR14, NFR15, NFR17 cùng UX-DR16, UX-DR17, UX-DR18, UX-DR19, UX-DR20.
- Mục tiêu là đạt “presentation-ready” cho luồng mua hàng cốt lõi nhưng không mở rộng scope nghiệp vụ.
- Trọng tâm là loại bỏ blocker thao tác, cải thiện readability và trạng thái rõ ràng xuyên mobile/desktop.

### Architecture Compliance

- Chỉ thay đổi ở lớp UI/composition (`src/app/*`, `src/components/*`), không chuyển business logic vào UI.
- Tôn trọng ranh giới hiện có: `src/app` cho routing/composition, `src/modules` cho nghiệp vụ, `src/shared` cho cross-cutting.
- Giữ nguyên API contracts/envelope; story này tập trung responsive + accessibility presentation.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js App Router + Tailwind CSS + component reuse nội bộ.
- Bám breakpoints mobile-first chuẩn Tailwind; tối ưu theo task breakpoint, không theo từng model thiết bị.
- Không thêm dependency UI mới nếu chưa cần; ưu tiên chuẩn hóa behavior trên component hiện hữu.

### File Structure Requirements

Ưu tiên thay đổi ở:
- `tmdt/src/app/(public)/**`
- `tmdt/src/app/(customer)/**`
- `tmdt/src/components/ui/**`
- `tmdt/src/components/features/**`
- Test/checklist liên quan trong `tmdt/src/**`

### Testing Requirements

- Verify không vỡ layout ở các breakpoint chính cho Discover/PDP-Try-on/Cart/Checkout/Tracking.
- Verify full keyboard-only completion cho các tác vụ trọng yếu (NFR14).
- Verify form có label rõ, error message đúng field, và focus management đúng chuẩn (NFR15).
- Verify semantic feedback không phụ thuộc màu, contrast đạt baseline WCAG AA (NFR17).

### Previous Story Intelligence

- Story 8.1 đã chuẩn hóa visual hierarchy và feedback taxonomy; Story 8.2 cần kế thừa tokens/variants đó để tránh style drift.
- Các pattern trạng thái/recovery từ Epic 7 đã có baseline, cần giữ nhất quán khi tối ưu responsive và a11y.
- Ưu tiên thay đổi incremental để không regress các flow checkout/orders/tracking đã ổn định.

### Git Intelligence Summary

- Working tree hiện lớn và có nhiều lane song song; cần giới hạn thay đổi đúng phạm vi responsive + accessibility.
- Ưu tiên chỉnh ở foundation components và màn hình trọng yếu để giảm xung đột merge.

### References

- Story 8.2 source + AC: `_bmad-output/planning-artifacts/epics.md:695-709`
- NFR14, NFR15, NFR17: `_bmad-output/planning-artifacts/prd.md:389-392`
- UX responsive/a11y guidance:
  - `_bmad-output/planning-artifacts/ux-design-specification.md:307`, `:324`, `:327`, `:560`, `:583`, `:586`
  - `_bmad-output/planning-artifacts/ux-design-specification.md:618`, `:624`, `:628`, `:645`, `:649`, `:665`, `:682`, `:687`
- Architecture structure guardrails:
  - `_bmad-output/planning-artifacts/architecture.md:76`, `:139-141`, `:335-337`, `:422`
- Previous story intelligence baseline:
  - `_bmad-output/implementation-artifacts/8-1-chuan-hoa-visual-system-va-hierarchy-cho-toan-bo-man-hinh-chinh.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- (to be filled by dev-story)

### Completion Notes List

- Story context created for implementation.

### File List

- `_bmad-output/implementation-artifacts/8-2-hoan-thien-responsive-va-accessibility-cho-luong-mua-hang-trong-yeu.md`
