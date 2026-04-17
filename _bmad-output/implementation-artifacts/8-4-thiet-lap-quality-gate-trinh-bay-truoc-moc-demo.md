# Story 8.4: Thiết lập quality gate trình bày trước mốc demo

Status: ready-for-dev

## Story

As a nhóm dự án,
I want checklist chất lượng UI/UX bắt buộc trước demo,
so that feature hoàn tất không chỉ đúng chức năng mà còn đạt mức trình bày thuyết phục.

## Acceptance Criteria

1. Given một epic hoặc wave được đánh dấu hoàn tất chức năng, when thực hiện pre-demo quality gate, then phải pass checklist consistency/responsive/a11y/feedback/recovery đã chốt.
2. And có evidence kiểm thử (keyboard walkthrough, a11y scan, screenshot trạng thái chính).
3. And chỉ được chuyển Done khi pass đồng thời AC chức năng và AC trải nghiệm.

## Tasks / Subtasks

- [ ] Thiết lập checklist quality gate hợp nhất cho pre-demo (AC: 1, 3)
  - [ ] Chuẩn hóa checklist theo các trục bắt buộc: consistency, responsive, accessibility, feedback/recovery.
  - [ ] Mapping checklist vào các màn hình trọng yếu customer/admin/warehouse theo scope Epic 8.
  - [ ] Định nghĩa điều kiện fail-fast: không đạt checklist thì không được mark Done.

- [ ] Chuẩn hóa bộ evidence bắt buộc cho mỗi lần gate (AC: 2)
  - [ ] Keyboard walkthrough evidence cho luồng mua hàng và thao tác vận hành chính.
  - [ ] A11y scan evidence (contrast, semantic structure, focus behavior) cho màn hình trọng yếu.
  - [ ] Screenshot bộ trạng thái chính (success/pending/failed/degraded, loading/empty/error/info) theo taxonomy đã chốt.

- [ ] Đồng bộ quality gate vào quy trình review/merge (AC: 1, 3)
  - [ ] Bổ sung PR checklist bắt buộc mục responsive + a11y + status clarity.
  - [ ] Ràng buộc component mới/chỉnh sửa lớn phải có state matrix + a11y notes trước merge.
  - [ ] Gắn quality gate như điều kiện trước khi chuyển trạng thái story/epic sang Done.

- [ ] Chuẩn hóa cách đánh giá consistency và role-aware status language (AC: 1)
  - [ ] Kiểm tra hierarchy và ngôn ngữ trạng thái thống nhất giữa Customer/Admin/Warehouse.
  - [ ] Kiểm tra luồng recovery (timeline/banner/CTA) nhất quán giữa các lane payment/tracking.
  - [ ] Đảm bảo mọi màn hình mới/chỉnh sửa lớn pass tiêu chí decision-first, status-clarity, low-friction, role-fit.

- [ ] Thiết lập mẫu báo cáo gate outcome để truy vết (AC: 2, 3)
  - [ ] Ghi rõ phạm vi kiểm tra, danh sách tiêu chí pass/fail, và evidence đi kèm.
  - [ ] Ghi các điểm chưa đạt và hành động khắc phục trước mốc demo.
  - [ ] Đảm bảo có thể rà soát nhanh tình trạng “functionality pass vs experience pass”.

## Dev Notes

### Technical Requirements

- Story này bao phủ NFR14-NFR17, NFR20 cùng UX-DR1-UX-DR20 theo scope quality gate trước demo.
- Mục tiêu là kiểm soát chất lượng trình bày ở mức hệ thống, không thay đổi ownership nghiệp vụ của các epic trước.
- Quality gate phải đánh giá đồng thời correctness chức năng và clarity trải nghiệm.

### Architecture Compliance

- Ưu tiên thay đổi ở lớp UI/docs/checklist và quy trình review, không đẩy business logic mới vào modules.
- Giữ boundary kiến trúc hiện tại: `src/app` cho composition, `src/modules` cho nghiệp vụ, `src/shared` cho cross-cutting.
- Story tập trung governance + evidence workflow, không thay đổi contract API.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js App Router + Tailwind CSS + component reuse nội bộ.
- Không thêm thư viện nặng chỉ để phục vụ checklist nếu đã có công cụ/flow hiện hữu.
- Reuse patterns và components đã chuẩn hóa ở Story 8.1–8.3.

### File Structure Requirements

Ưu tiên thay đổi ở:
- `_bmad-output/implementation-artifacts/**` (quality gate guidance nếu cần cập nhật)
- `tmdt/src/app/(public)/**`
- `tmdt/src/app/(customer)/**`
- `tmdt/src/app/admin/**`
- `tmdt/src/app/(warehouse)/**`
- `tmdt/src/components/ui/**`
- `tmdt/src/components/features/**`
- Test/checklist liên quan trong `tmdt/src/**`

### Testing Requirements

- Verify checklist gate bao phủ đầy đủ consistency/responsive/a11y/feedback/recovery.
- Verify evidence bắt buộc gồm keyboard walkthrough + a11y scan + screenshot trạng thái chính.
- Verify rule “không Done nếu chưa pass đồng thời AC chức năng + AC trải nghiệm”.
- Verify PR/review flow có cổng kiểm soát cho responsive/a11y/state matrix theo UX governance.

### Previous Story Intelligence

- Story 8.1 đã chuẩn hóa visual hierarchy/tokens; Story 8.4 phải dùng đó làm baseline consistency check.
- Story 8.2 đã củng cố responsive + accessibility; quality gate cần khóa các tiêu chí này thành điều kiện bắt buộc trước demo.
- Story 8.3 đã chuẩn hóa timeline/recovery clarity; quality gate cần kiểm tra trạng thái và next-action consistency xuyên vai trò.

### Git Intelligence Summary

- Working tree hiện lớn và nhiều lane song song; quality gate cần rõ tiêu chí để giảm regress presentation trước demo.
- Ưu tiên kiểm soát bằng checklist/evidence nhất quán để giảm tranh luận chủ quan khi review.

### References

- Story 8.4 source + AC: `_bmad-output/planning-artifacts/epics.md:727-741`
- NFR14-NFR17, NFR20: `_bmad-output/planning-artifacts/prd.md:389-392`, `:397`
- UX quality/guidance baseline:
  - `_bmad-output/planning-artifacts/ux-design-specification.md:364`, `:592`, `:665`, `:684`, `:686`
- Previous story intelligence baselines:
  - `_bmad-output/implementation-artifacts/8-1-chuan-hoa-visual-system-va-hierarchy-cho-toan-bo-man-hinh-chinh.md`
  - `_bmad-output/implementation-artifacts/8-2-hoan-thien-responsive-va-accessibility-cho-luong-mua-hang-trong-yeu.md`
  - `_bmad-output/implementation-artifacts/8-3-chuan-hoa-timeline-trang-thai-payment-tracking-va-recovery-actions.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- (to be filled by dev-story)

### Completion Notes List

- Story context created for implementation.

### File List

- `_bmad-output/implementation-artifacts/8-4-thiet-lap-quality-gate-trinh-bay-truoc-moc-demo.md`
