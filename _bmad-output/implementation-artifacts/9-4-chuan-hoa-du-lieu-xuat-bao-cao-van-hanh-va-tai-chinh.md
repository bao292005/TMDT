# Story 9.4: Chuẩn hóa dữ liệu xuất báo cáo vận hành và tài chính

Status: ready-for-dev

## Story

As a admin,
I want dữ liệu báo cáo được chuẩn hóa và đối chiếu được với dữ liệu giao dịch gốc,
so that báo cáo CSV/PDF đáng tin để trình bày và quyết định vận hành.

## Acceptance Criteria

1. Given admin chọn khoảng thời gian báo cáo, when hệ thống tổng hợp doanh thu, đơn hàng, giao dịch, then số liệu báo cáo khớp với dữ liệu nguồn theo quy tắc đối soát đã định.
2. And các trường dữ liệu xuất ra dùng định dạng nhất quán cho downstream analysis.
3. And sai lệch (nếu có) được gắn cờ để xử lý thay vì im lặng bỏ qua.

## Tasks / Subtasks

- [ ] Chuẩn hóa data contract cho reporting export (AC: 1, 2)
  - [ ] Định nghĩa schema xuất báo cáo thống nhất cho doanh thu/đơn hàng/giao dịch với field naming rõ ràng.
  - [ ] Chuẩn hóa định dạng thời gian (UTC ISO-8601), tiền tệ (minor unit/format xuất), trạng thái và mã tham chiếu.
  - [ ] Đảm bảo mapping source fields nhất quán giữa order/payment/shipping/audit để downstream analysis không lệch nghĩa.

- [ ] Triển khai pipeline tổng hợp dữ liệu báo cáo có đối soát (AC: 1, 3)
  - [ ] Tổng hợp dữ liệu theo time range + dimension vận hành chính (doanh thu, đơn, thanh toán).
  - [ ] Đối chiếu số liệu tổng hợp với dữ liệu giao dịch gốc theo rule reconciliation đã chốt.
  - [ ] Khi phát hiện mismatch, gắn cờ rõ nguyên nhân/nhóm sai lệch thay vì bỏ qua.

- [ ] Chuẩn hóa export outputs CSV/PDF cho admin (AC: 2)
  - [ ] Đồng bộ thứ tự cột, định dạng giá trị, và metadata báo cáo (khoảng thời gian, thời điểm tạo, correlation context).
  - [ ] Đảm bảo output CSV/PDF cùng một nguồn dữ liệu và không khác logic tính.
  - [ ] Bảo toàn khả năng đọc máy (CSV) và khả năng trình bày (PDF) trên cùng chuẩn dữ liệu.

- [ ] Tích hợp reporting với audit/reconciliation context (AC: 1, 3)
  - [ ] Liên kết bản ghi báo cáo với run reconciliation/audit để truy xuất nguồn số liệu.
  - [ ] Bổ sung correlation keys cho các nhóm dữ liệu có sai lệch.
  - [ ] Cho phép truy vết ngược nhanh từ báo cáo tới lane giao dịch liên quan.

- [ ] Thiết lập test/checklist cho reporting reliability (AC: 1, 2, 3)
  - [ ] Test tính đúng đắn số liệu giữa report output và dữ liệu nguồn.
  - [ ] Test consistency định dạng field giữa các lần export và giữa CSV/PDF.
  - [ ] Test behavior khi có mismatch: phải gắn cờ và có thông tin xử lý tiếp theo.

## Dev Notes

### Technical Requirements

- Story này bám FR43/FR44/FR45 cùng FR48/FR49 để đảm bảo reporting vừa dùng vận hành vừa dùng trình bày.
- Trọng tâm là data correctness + format consistency + mismatch visibility cho báo cáo admin.
- Cần tương thích nền reconciliation/audit đã chuẩn hóa ở Epic 7 và Story 9.3.

### Architecture Compliance

- Business logic tổng hợp/đối soát đặt trong `src/modules/reporting` và modules domain liên quan; route chỉ làm boundary/export delivery.
- Tuân thủ boundary kiến trúc: `src/app/api/admin/*` không chứa logic domain nặng.
- Reuse correlation/idempotency/audit context hiện có để đảm bảo traceability xuyên lane.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js App Router + module architecture + reporting utilities nội bộ.
- Không thêm thư viện export mới nếu có thể dùng pipeline hiện hữu.
- Duy trì response envelope và correlation context nhất quán với API admin hiện tại.

### File Structure Requirements

Ưu tiên thay đổi ở:
- `tmdt/src/modules/reporting/**`
- `tmdt/src/modules/order/**`
- `tmdt/src/modules/payment/**`
- `tmdt/src/modules/warehouse/**`
- `tmdt/src/app/api/admin/reports/route.js`
- `tmdt/src/app/api/admin/dashboard/route.js`
- `tmdt/src/modules/reporting/report-store.js`
- Test files liên quan trong `tmdt/src/**`

### Testing Requirements

- Verify report totals khớp dữ liệu nguồn theo rule reconciliation.
- Verify định dạng field xuất ra nhất quán cho downstream analysis.
- Verify mismatch được flag rõ, không bị nuốt lỗi.
- Verify output CSV/PDF nhất quán logic tính và metadata báo cáo.

### Previous Story Intelligence

- Story 9.2 đã dựng migration/seed baseline cho dữ liệu mẫu phục vụ reporting scenarios.
- Story 9.3 đã chuẩn hóa audit trail + correlation context; 9.4 cần tái sử dụng để trace nguồn số liệu báo cáo.
- Epic 7.3 đã thiết lập reconciliation mindset (summary mismatch theo chu kỳ), cần kế thừa trong reporting layer.

### Git Intelligence Summary

- Working tree hiện nhiều lane song song; cần giới hạn thay đổi đúng lane reporting/reconciliation.
- Ưu tiên chuẩn hóa contract output trước, rồi nối vào pipeline tổng hợp để giảm regress.

### References

- Story 9.4 source + AC: `_bmad-output/planning-artifacts/epics.md:795-809`
- FR43, FR44, FR45, FR48, FR49: `_bmad-output/planning-artifacts/prd.md:356-358`, `:363-364`
- NFR13: `_bmad-output/planning-artifacts/prd.md:386`
- Architecture reporting/reconciliation/audit guidance:
  - `_bmad-output/planning-artifacts/architecture.md:296`, `:315`, `:357-358`, `:364`, `:381`, `:428`
- Previous story intelligence baselines:
  - `_bmad-output/implementation-artifacts/9-3-chuan-hoa-audit-trail-va-truy-vet-theo-correlation-context.md`
  - `_bmad-output/implementation-artifacts/9-2-orm-migration-baseline-va-seed-du-lieu-mau.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- (to be filled by dev-story)

### Completion Notes List

- Story context created for implementation.

### File List

- `_bmad-output/implementation-artifacts/9-4-chuan-hoa-du-lieu-xuat-bao-cao-van-hanh-va-tai-chinh.md`
