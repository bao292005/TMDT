# Story 8.3: Chuẩn hóa timeline trạng thái payment/tracking và recovery actions

Status: ready-for-dev

## Story

As a khách hàng và admin,
I want thấy trạng thái giao dịch/vận đơn cùng hành động khôi phục rõ ràng,
so that tôi biết chính xác bước tiếp theo khi có pending/degraded/error.

## Acceptance Criteria

1. Given đơn hàng có trạng thái payment hoặc shipping thay đổi, when trạng thái chuyển success/pending/failed/degraded, then timeline hiển thị label, timestamp, next action theo format nhất quán.
2. And RecoveryActionBanner xuất hiện đúng điều kiện với CTA phù hợp vai trò.
3. And người dùng có thể tiếp tục tác vụ chính mà không mất ngữ cảnh.

## Tasks / Subtasks

- [ ] Chuẩn hóa contract timeline cho payment + tracking (AC: 1)
  - [ ] Đồng bộ format chung gồm `statusLabel`, `timestamp`, `source`, `nextAction` cho cả payment và shipping timeline.
  - [ ] Chuẩn hóa mapping trạng thái `success | pending | failed | degraded` giữa module order/payment/shipping.
  - [ ] Bảo đảm timeline không bị phụ thuộc vào màu, luôn có label + text rõ nghĩa.

- [ ] Chuẩn hóa hiển thị PaymentStatusTimeline và tracking timeline theo cùng taxonomy (AC: 1, 3)
  - [ ] Reuse pattern `inline summary` và `full timeline` theo UX spec cho các màn hình customer/admin liên quan.
  - [ ] Đồng bộ cách hiển thị timestamp và source để giảm mơ hồ trạng thái hậu checkout.
  - [ ] Đảm bảo khi trạng thái thay đổi, người dùng vẫn giữ ngữ cảnh thao tác hiện tại.

- [ ] Chuẩn hóa điều kiện RecoveryActionBanner theo trạng thái và vai trò (AC: 2, 3)
  - [ ] Xác định trigger rõ cho các trạng thái pending/degraded/failed ở lane payment và tracking.
  - [ ] Mapping CTA theo vai trò customer/admin (retry, refresh, theo dõi thêm, xử lý vận hành).
  - [ ] Bảo đảm banner không chặn thao tác chính và không làm đứt hành trình người dùng.

- [ ] Đồng bộ accessibility cho timeline + recovery actions (AC: 1, 2)
  - [ ] Dùng semantic list/timeline, icon + text song song.
  - [ ] Đảm bảo keyboard focus rõ ràng cho CTA trong timeline/banner.
  - [ ] Giữ cấu trúc thông tin trạng thái có thể đọc được bởi screen reader.

- [ ] Thiết lập test/checklist cho status clarity và recovery continuity (AC: 1, 2, 3)
  - [ ] Test chuyển trạng thái success/pending/failed/degraded và assert format timeline nhất quán.
  - [ ] Test điều kiện hiển thị RecoveryActionBanner + CTA theo role/context.
  - [ ] Test người dùng tiếp tục được tác vụ chính sau khi tương tác recovery action.

## Dev Notes

### Technical Requirements

- Story này bao phủ NFR20 cùng UX-DR4, UX-DR10, UX-DR12, UX-DR14.
- Mục tiêu là chuẩn hóa status clarity sau checkout/tracking và giảm mơ hồ khi có pending/degraded/error.
- Không mở rộng scope nghiệp vụ mới; tập trung chuẩn hóa presentation contract + recovery actions.

### Architecture Compliance

- UI ở `src/app/*` chỉ render và orchestration; mapping trạng thái đặt ở `src/modules/*`.
- Giữ boundary: external provider data đi qua `src/modules/integrations/*`, không gọi trực tiếp từ UI.
- API contracts/envelope giữ nguyên; story này chỉ chuẩn hóa format trạng thái và hành động recovery.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js App Router + Tailwind CSS + component reuse nội bộ.
- Reuse component/pattern đã có: `PaymentStatusTimeline`, `RecoveryActionBanner`.
- Không thêm thư viện timeline mới; ưu tiên thống nhất từ foundation hiện có.

### File Structure Requirements

Ưu tiên thay đổi ở:
- `tmdt/src/app/(customer)/checkout/**`
- `tmdt/src/app/(customer)/orders/**`
- `tmdt/src/app/admin/**`
- `tmdt/src/modules/order/**`
- `tmdt/src/modules/payment/**`
- `tmdt/src/modules/integrations/shipping/**`
- `tmdt/src/components/features/**`
- Test files liên quan trong `tmdt/src/**`

### Testing Requirements

- Verify timeline hiển thị nhất quán `label + timestamp + next action` cho payment và tracking.
- Verify RecoveryActionBanner xuất hiện đúng điều kiện, CTA đúng role/context.
- Verify người dùng vẫn hoàn thành được tác vụ chính mà không mất ngữ cảnh sau recovery interaction.
- Verify semantics accessibility cho timeline/banner: keyboard path, text-first status clarity.

### Previous Story Intelligence

- Story 8.1 đã chuẩn hóa visual hierarchy và feedback taxonomy; Story 8.3 phải kế thừa để tránh style drift.
- Story 8.2 đã củng cố responsive + accessibility cho flow chính; Story 8.3 cần giữ cùng baseline keyboard/semantic patterns.
- Story 4.5 đã có baseline `PaymentStatusTimeline` (label + timestamp + next action); cần tái sử dụng thay vì tạo pattern trạng thái mới.

### Git Intelligence Summary

- Working tree đang lớn và nhiều lane song song; cần giới hạn thay đổi đúng lane timeline/recovery clarity.
- Ưu tiên refactor incremental trên component hiện có để giảm xung đột merge.

### References

- Story 8.3 source + AC: `_bmad-output/planning-artifacts/epics.md:711-725`
- NFR20: `_bmad-output/planning-artifacts/prd.md:397`
- UX timeline/recovery guidance:
  - `_bmad-output/planning-artifacts/ux-design-specification.md:357`, `:453`, `:495-499`, `:509`, `:522`, `:544`, `:607`, `:668`
- Architecture structure guardrails:
  - `_bmad-output/planning-artifacts/architecture.md:76`, `:139-141`, `:335-337`, `:341`, `:355-357`, `:422`
- Previous story intelligence baselines:
  - `_bmad-output/implementation-artifacts/8-2-hoan-thien-responsive-va-accessibility-cho-luong-mua-hang-trong-yeu.md`
  - `_bmad-output/implementation-artifacts/4-5-paymentstatustimeline-cho-post-checkout-clarity.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- (to be filled by dev-story)

### Completion Notes List

- Story context created for implementation.

### File List

- `_bmad-output/implementation-artifacts/8-3-chuan-hoa-timeline-trang-thai-payment-tracking-va-recovery-actions.md`
