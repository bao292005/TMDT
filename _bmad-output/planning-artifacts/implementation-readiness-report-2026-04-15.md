# Implementation Readiness Assessment Report

**Date:** 2026-04-15
**Project:** TMDT

## Step 1: Document Discovery

### PRD Files Found

**Whole Documents:**
- prd.md (31,961 bytes, modified Apr 15 13:42:12 2026)
- prd-validation-report.md (11,041 bytes, modified Apr 15 13:42:13 2026) — supplemental validation artifact

**Sharded Documents:**
- None found

### Architecture Files Found

**Whole Documents:**
- architecture.md (21,568 bytes, modified Apr 8 23:03:27 2026)

**Sharded Documents:**
- None found

### Epics & Stories Files Found

**Whole Documents:**
- epics.md (49,588 bytes, modified Apr 15 13:57:14 2026)

**Sharded Documents:**
- None found

### UX Design Files Found

**Whole Documents:**
- ux-design-specification.md (35,433 bytes, modified Apr 9 08:12:46 2026)

**Sharded Documents:**
- None found

### Initial Selection for Readiness Assessment

- /Users/nguyenquocbao/TMDT/_bmad-output/planning-artifacts/prd.md
- /Users/nguyenquocbao/TMDT/_bmad-output/planning-artifacts/architecture.md
- /Users/nguyenquocbao/TMDT/_bmad-output/planning-artifacts/epics.md
- /Users/nguyenquocbao/TMDT/_bmad-output/planning-artifacts/ux-design-specification.md

### Issues Found

- No duplicate whole-vs-sharded conflicts detected.
- One supplemental PRD validation file exists (`prd-validation-report.md`) and is currently excluded from core input set.

## Step 2: PRD Analysis

### Functional Requirements

FR1: Người dùng có thể đăng ký tài khoản bằng email và mật khẩu.
FR2: Người dùng có thể đăng nhập và đăng xuất hệ thống.
FR3: Hệ thống có thể phân quyền theo vai trò Customer, Admin, Warehouse Staff.
FR4: Người dùng có thể cập nhật hồ sơ cá nhân gồm tối thiểu họ tên, số điện thoại và tối đa 3 địa chỉ giao hàng.
FR5: Admin có thể khóa và mở khóa tài khoản người dùng.
FR6: Hệ thống có thể ghi nhận lịch sử hành động quản trị liên quan tài khoản.
FR7: Khách hàng có thể duyệt danh sách sản phẩm theo danh mục.
FR8: Khách hàng có thể tìm kiếm sản phẩm theo từ khóa.
FR9: Khách hàng có thể lọc sản phẩm theo ít nhất 4 nhóm thuộc tính: danh mục, khoảng giá, size và màu.
FR10: Khách hàng có thể xem chi tiết sản phẩm và biến thể.
FR11: Hệ thống có thể hiển thị trạng thái còn hàng của biến thể sản phẩm.
FR12: Hệ thống có thể cung cấp nội dung sản phẩm theo cách hỗ trợ khả năng index SEO cho các trang public.
FR13: Khách hàng có thể tải ảnh lên để sử dụng tính năng thử đồ AI.
FR14: Hệ thống có thể tạo và hiển thị kết quả thử đồ AI cho khách hàng.
FR15: Khách hàng có thể thực hiện lại thao tác thử đồ khi lần xử lý trước không thành công.
FR16: Hệ thống có thể lưu kết quả thử đồ của phiên mua hiện tại để hỗ trợ ra quyết định.
FR17: Hệ thống có thể hiển thị tối thiểu 5 gợi ý sản phẩm có liên quan đến ít nhất 1 trong 3 tín hiệu: danh mục đã xem, lịch sử thử đồ hoặc sản phẩm trong giỏ hàng của người dùng.
FR18: Hệ thống có thể cung cấp cơ chế gợi ý baseline khi mô-đun cá nhân hóa nâng cao chưa khả dụng.
FR19: Khách hàng có thể thêm sản phẩm biến thể vào giỏ hàng.
FR20: Khách hàng có thể cập nhật số lượng hoặc xóa sản phẩm khỏi giỏ hàng.
FR21: Hệ thống có thể kiểm tra điều kiện hợp lệ của giỏ hàng trước checkout.
FR22: Khách hàng có thể cung cấp hoặc chọn địa chỉ giao hàng khi checkout.
FR23: Khách hàng có thể chọn phương thức vận chuyển khi checkout.
FR24: Hệ thống có thể tính toán và hiển thị tổng giá trị đơn hàng trước xác nhận đặt hàng.
FR25: Hệ thống có thể tạo đơn hàng từ giỏ hàng hợp lệ.
FR26: Khách hàng có thể thanh toán đơn hàng bằng phương thức online hoặc COD trong phạm vi dự án.
FR27: Hệ thống có thể tiếp nhận và xử lý kết quả phản hồi thanh toán từ cổng tích hợp.
FR28: Hệ thống có thể cập nhật trạng thái đơn hàng theo trạng thái thanh toán.
FR29: Hệ thống có thể cho phép khách hàng thanh toán lại khi giao dịch trước đó thất bại.
FR30: Hệ thống có thể cung cấp trạng thái chờ xác minh khi kết quả thanh toán chưa đồng nhất.
FR31: Hệ thống có thể lưu lịch sử giao dịch tài chính gắn với đơn hàng.
FR32: Khách hàng có thể xem danh sách và chi tiết đơn hàng của mình.
FR33: Khách hàng có thể theo dõi trạng thái đơn hàng theo tiến trình xử lý.
FR34: Hệ thống có thể liên kết thông tin vận đơn và mã tracking với đơn hàng.
FR35: Warehouse Staff có thể xem danh sách đơn chờ xử lý theo hàng đợi nghiệp vụ.
FR36: Warehouse Staff có thể xác nhận đóng gói đơn hàng.
FR37: Warehouse Staff có thể tạo yêu cầu vận chuyển cho đơn hàng đủ điều kiện.
FR38: Hệ thống có thể cập nhật trạng thái giao hàng dựa trên dữ liệu từ đơn vị vận chuyển.
FR39: Hệ thống có thể cung cấp cơ chế dự phòng trạng thái vận chuyển khi tích hợp ngoài gián đoạn.
FR40: Admin có thể tạo, cập nhật và ngừng kích hoạt sản phẩm.
FR41: Admin có thể quản lý trạng thái đơn hàng theo vòng đời vận hành.
FR42: Admin có thể xem và xử lý các trường hợp đơn hàng bất thường.
FR43: Admin có thể xem dashboard gồm tối thiểu 5 KPI: số đơn, doanh thu, AOV, tỷ lệ hoàn trả và tỷ lệ thanh toán thành công; dashboard hỗ trợ ít nhất 3 bộ lọc thời gian: ngày, tuần và tháng.
FR44: Admin có thể xuất báo cáo doanh thu, đơn hàng và giao dịch theo khoảng thời gian dưới định dạng CSV và PDF; mỗi lần xuất phải hoàn tất trong <= 30 giây với tập dữ liệu tối đa 10.000 bản ghi.
FR45: Hệ thống có thể ghi nhận log nghiệp vụ chính phục vụ truy vết và đánh giá thực nghiệm.
FR46: Hệ thống có thể chuyển đổi độc lập endpoint sandbox/mock và endpoint production cho 3 tích hợp AI, payment, shipping thông qua cấu hình môi trường mà không thay đổi luồng nghiệp vụ chính.
FR47: Hệ thống có thể xử lý timeout/retry cho các tác vụ tích hợp quan trọng.
FR48: Hệ thống có thể đối soát trạng thái đơn hàng giữa các phân hệ payment, warehouse, shipping.
FR49: Hệ thống có thể duy trì tính nhất quán dữ liệu đơn hàng và giao dịch trong các luồng chính.
FR50: Hệ thống có thể hỗ trợ chế độ fallback để đảm bảo demo end-to-end không gián đoạn.

Total FRs: 50

### Non-Functional Requirements

NFR1: 95% yêu cầu duyệt danh mục, tìm kiếm và mở chi tiết sản phẩm phải phản hồi trong <= 2 giây dưới tải đồng thời 100 người dùng, đo bằng APM log.
NFR2: 95% phiên checkout phải hoàn tất từ bước xác nhận giỏ đến tạo đơn trong <= 90 giây, đo bằng event timestamp theo phiên.
NFR3: 95% yêu cầu AI try-on phải trả kết quả hoặc timeout có thông báo trong <= 30 giây, đo bằng thời gian xử lý backend.
NFR4: Trạng thái đơn hàng trên trang theo dõi phải đồng bộ trong <= 10 giây kể từ khi backend đổi trạng thái; khi realtime lỗi phải fallback polling chu kỳ 15 giây, đo bằng log timestamp frontend/backend.
NFR5: 100% mật khẩu người dùng phải được băm trước khi lưu bằng thuật toán băm một chiều có salt; xác minh bằng kiểm tra dữ liệu DB và test xác thực.
NFR6: 100% API nghiệp vụ phải áp dụng RBAC theo vai trò Customer/Admin/Warehouse; xác minh bằng test truy cập trái quyền cho từng vai trò.
NFR7: 100% thao tác quản trị quan trọng (khóa user, đổi trạng thái đơn, cập nhật dữ liệu nhạy cảm) phải tạo audit log trong <= 5 giây, xác minh bằng kiểm tra log integration test.
NFR8: 100% tài nguyên dữ liệu nhạy cảm và ảnh try-on phải yêu cầu xác thực + kiểm tra quyền truy cập; xác minh bằng test truy cập trái phép.
NFR9: 100% luồng thanh toán trong môi trường học thuật phải dùng sandbox/mock endpoint; xác minh bằng cấu hình môi trường và smoke test trước demo.
NFR10: 100% đơn hàng phải giữ trạng thái hợp lệ theo state machine xuyên suốt payment -> warehouse -> shipping; xác minh bằng test vòng đời đơn hàng.
NFR11: Các tích hợp AI/payment/shipping phải retry tối đa 3 lần với backoff tăng dần khi lỗi tạm thời; xác minh bằng test mô phỏng timeout.
NFR12: Khi tích hợp ngoài lỗi, hệ thống phải kích hoạt fallback trong <= 5 giây để không phá vỡ luồng demo end-to-end; xác minh bằng kịch bản chaos test mức chức năng.
NFR13: Hệ thống phải chạy đối soát trạng thái payment/order tối thiểu mỗi 15 phút và ghi log kết quả; xác minh bằng lịch job và reconciliation report.
NFR14: 100% tác vụ chính (duyệt sản phẩm, thêm giỏ, checkout, theo dõi đơn) phải thao tác được bằng bàn phím; xác minh bằng checklist kiểm thử thủ công.
NFR15: 100% form quan trọng (đăng nhập, checkout) phải có label và thông báo lỗi rõ nghĩa; xác minh bằng test UI và review semantic.
NFR16: 100% thành phần tương tác phải có trạng thái focus/disabled/loading rõ ràng; xác minh bằng test UI theo component checklist.
NFR17: Giao diện phải đạt tỷ lệ tương phản tối thiểu WCAG AA cho văn bản chính và dùng semantic HTML cho layout/form; xác minh bằng tool kiểm tra a11y và manual review.
NFR18: Tích hợp AI, payment, shipping phải đạt tỷ lệ gọi API thành công >= 99% trong bộ test tích hợp chuẩn của dự án; đo bằng báo cáo integration test.
NFR19: 100% lỗi tích hợp phải theo một schema lỗi thống nhất (mã lỗi, nguồn lỗi, thông điệp, correlation id); xác minh bằng contract test.
NFR20: Hệ thống phải cho phép chuyển đổi endpoint thật/mock qua cấu hình môi trường trong <= 5 phút mà không sửa mã nguồn nghiệp vụ; xác minh bằng quy trình deploy test.

Total NFRs: 20

### Additional Requirements

- Project constraints: phạm vi triển khai học thuật, payment chạy sandbox/mock, không xử lý PAN/CVV thực.
- Domain controls: fintech compliance matrix yêu cầu RBAC, auditability, reconciliation, sandbox isolation.
- Integration constraints: AI/payment/shipping bắt buộc timeout/retry/fallback và config-driven endpoint switching.
- Web app constraints: hỗ trợ SEO public pages, realtime status với fallback polling, baseline accessibility.

### PRD Completeness Assessment

- PRD đầy đủ cấu trúc, có FR/NFR đánh số rõ ràng và đo lường cụ thể.
- Dual-goal (học thuật + presentation-ready e-commerce) đã phản ánh rõ trong success criteria và MVP scope.
- Mức độ sẵn sàng cho traceability validation: cao.

## Step 3: Epic Coverage Validation

### Coverage Matrix

| FR Number | Epic Coverage | Status |
| --------- | ------------- | ------ |
| FR1 | Epic 1 (Story 1.2) | ✓ Covered |
| FR2 | Epic 1 (Story 1.2) | ✓ Covered |
| FR3 | Epic 1 (Story 1.3) | ✓ Covered |
| FR4 | Epic 1 (Story 1.4) | ✓ Covered |
| FR5 | Epic 1 (Story 1.4) | ✓ Covered |
| FR6 | Epic 1 (Story 1.4) | ✓ Covered |
| FR7 | Epic 2 (Story 2.1) | ✓ Covered |
| FR8 | Epic 2 (Story 2.1) | ✓ Covered |
| FR9 | Epic 2 (Story 2.2) | ✓ Covered |
| FR10 | Epic 2 (Story 2.3) | ✓ Covered |
| FR11 | Epic 2 (Story 2.3) | ✓ Covered |
| FR12 | Epic 2 (Story 2.3) | ✓ Covered |
| FR13 | Epic 3 (Story 3.1) | ✓ Covered |
| FR14 | Epic 3 (Story 3.1, 3.4) | ✓ Covered |
| FR15 | Epic 3 (Story 3.2) | ✓ Covered |
| FR16 | Epic 3 (Story 3.2, 3.4) | ✓ Covered |
| FR17 | Epic 3 (Story 3.3) | ✓ Covered |
| FR18 | Epic 3 (Story 3.3) | ✓ Covered |
| FR19 | Epic 4 (Story 4.1) | ✓ Covered |
| FR20 | Epic 4 (Story 4.1) | ✓ Covered |
| FR21 | Epic 4 (Story 4.1) | ✓ Covered |
| FR22 | Epic 4 (Story 4.2) | ✓ Covered |
| FR23 | Epic 4 (Story 4.2) | ✓ Covered |
| FR24 | Epic 4 (Story 4.2) | ✓ Covered |
| FR25 | Epic 4 (Story 4.3) | ✓ Covered |
| FR26 | Epic 4 (Story 4.3) | ✓ Covered |
| FR27 | Epic 4 (Story 4.4) | ✓ Covered |
| FR28 | Epic 4 (Story 4.4, 4.5) | ✓ Covered |
| FR29 | Epic 4 (Story 4.4) | ✓ Covered |
| FR30 | Epic 4 (Story 4.4, 4.5) | ✓ Covered |
| FR31 | Epic 4 (Story 4.3) | ✓ Covered |
| FR32 | Epic 5 (Story 5.1) | ✓ Covered |
| FR33 | Epic 5 (Story 5.2) | ✓ Covered |
| FR34 | Epic 5 (Story 5.2) | ✓ Covered |
| FR35 | Epic 5 (Story 5.3) | ✓ Covered |
| FR36 | Epic 5 (Story 5.3) | ✓ Covered |
| FR37 | Epic 5 (Story 5.3) | ✓ Covered |
| FR38 | Epic 5 (Story 5.4) | ✓ Covered |
| FR39 | Epic 5 (Story 5.4) | ✓ Covered |
| FR40 | Epic 6 (Story 6.1) | ✓ Covered |
| FR41 | Epic 6 (Story 6.1) | ✓ Covered |
| FR42 | Epic 6 (Story 6.2) | ✓ Covered |
| FR43 | Epic 6 (Story 6.2) | ✓ Covered |
| FR44 | Epic 6 (Story 6.3) | ✓ Covered |
| FR45 | Epic 6 (Story 6.3) | ✓ Covered |
| FR46 | Epic 7 (Story 7.1) | ✓ Covered |
| FR47 | Epic 7 (Story 7.2) | ✓ Covered |
| FR48 | Epic 7 (Story 7.3) | ✓ Covered |
| FR49 | Epic 7 (Story 7.3) | ✓ Covered |
| FR50 | Epic 7 (Story 7.4) | ✓ Covered |

### Missing Requirements

- Không có FR nào bị thiếu coverage.
- Không phát hiện FR ngoài PRD xuất hiện sai lệch trong coverage map.

### Coverage Statistics

- Total PRD FRs: 50
- FRs covered in epics: 50
- Coverage percentage: 100%

## Step 4: UX Alignment Assessment

### UX Document Status

- Found: `/Users/nguyenquocbao/TMDT/_bmad-output/planning-artifacts/ux-design-specification.md`

### Alignment Issues

- **PRD ↔ UX:** Nhìn chung aligned tốt về customer journey (Discover -> PDP/Try-on -> Cart -> Checkout -> Tracking), trạng thái payment/tracking và mục tiêu confidence/trust.
- **PRD ↔ UX detail drift (minor):** PRD đã nâng mức định lượng một số FR/NFR trong bản cập nhật 2026-04-15, còn UX spec (2026-04-09) chưa phản ánh đầy đủ các ngưỡng định lượng mới ở mọi phần narrative.
- **UX ↔ Architecture:** Architecture đã hỗ trợ đầy đủ phần lớn UX requirements qua module boundaries, component strategy, responsive/a11y baseline và integration reliability patterns.
- **Naming/wording drift (minor):** Có chênh nhẹ cách gọi giữa một số component/pattern theo thời điểm tài liệu (không phải mâu thuẫn chức năng).

### Warnings

- Không có warning mức blocking cho implementation.
- Khuyến nghị đồng bộ versioning nhỏ giữa PRD/UX/Architecture ở đợt grooming đầu sprint để giảm sai khác diễn giải khi dev đa agent.

## Step 5: Epic Quality Review

### Best-Practice Compliance Findings

#### ✅ Điểm đạt chuẩn
- Epic 1–7 giữ được user-value orientation rõ và traceable tới FR1–FR50.
- Không phát hiện forward dependency dạng “story hiện tại phụ thuộc story tương lai”.
- Có story khởi tạo starter template ở Epic 1 Story 1, phù hợp architecture greenfield.
- Hầu hết stories có user story format As a / I want / So that và AC dạng Given/When/Then.

#### 🟠 Major Issues
1. **Epic 9 thiên technical milestone**
   - Epic 9 tập trung mạnh vào data foundation/persistence/migration.
   - Dù có giá trị vận hành, mức “user-facing value” trực tiếp thấp hơn tiêu chuẩn user-outcome-first.
   - Khuyến nghị: khi vào implementation nên ràng buộc Epic 9 theo outcome cụ thể cho admin/reporting/reconciliation UX để tránh drift kỹ thuật thuần túy.

2. **Epic 10 là cross-cutting retrofit lớn**
   - Epic 10 gom remediation cho Epic 1–5, phạm vi rộng.
   - Không sai về chiến lược, nhưng có rủi ro story slicing chưa đủ nhỏ khi lập sprint chi tiết.
   - Khuyến nghị: tách thành các story upgrade theo capability + định lượng acceptance gates theo NFR.

#### 🟡 Minor Concerns
1. **Formatting không nhất quán ở một số AC block**
   - Nhiều story cũ có tiêu đề `**Acceptance Criteria:` thiếu đóng markdown chuẩn.
   - Không ảnh hưởng nội dung nhưng ảnh hưởng tính rõ ràng khi parse tự động.

2. **Một số AC còn thiên capability hơn là metric test cụ thể**
   - Nhất là ở nhóm cross-cutting stories (Epic 8–10), có thể bổ sung thêm ngưỡng đo để giảm tranh cãi done criteria.

### Severity Summary
- 🔴 Critical: 0
- 🟠 Major: 2
- 🟡 Minor: 2

## Summary and Recommendations

### Overall Readiness Status

**NEEDS WORK (minor-to-major refinements, non-blocking for kickoff)**

### Critical Issues Requiring Immediate Action

- Không có issue mức critical cần chặn implementation.

### Recommended Next Steps

1. Chuẩn hóa markdown/AC formatting trong `epics.md` để tránh lỗi parse và tăng clarity cho team multi-agent.
2. Refine Epic 9 và Epic 10 thành backlog sprint-ready nhỏ hơn với acceptance metrics định lượng rõ theo NFR liên quan.
3. Chạy Sprint Planning ngay sau khi chốt refinement để lock execution order và done criteria theo story.

### Final Note

Assessment ghi nhận **4 vấn đề** trên **2 nhóm chính** (cấu trúc epic và chất lượng story specification), trong đó **0 critical**. Bộ tài liệu nhìn chung đủ nền để vào implementation, với khuyến nghị xử lý các điểm major/minor sớm trong grooming đầu sprint.
