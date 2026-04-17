---
workflowType: 'prd'
workflow: 'edit'
date: '2026-04-15'
classification:
  projectType: web_app
  domain: fintech
  complexity: high
  projectContext: greenfield
inputDocuments:
  - "/Users/nguyenquocbao/TMDT/QLUD_CSDL_nhóm-2-distillate/_index.md"
  - "/Users/nguyenquocbao/TMDT/QLUD_CSDL_nhóm-2-distillate/01-tong-quan-muc-tieu-y-nghia.md"
  - "/Users/nguyenquocbao/TMDT/QLUD_CSDL_nhóm-2-distillate/02-use-case-khach-hang.md"
  - "/Users/nguyenquocbao/TMDT/QLUD_CSDL_nhóm-2-distillate/03-use-case-quan-tri-vien.md"
  - "/Users/nguyenquocbao/TMDT/QLUD_CSDL_nhóm-2-distillate/04-use-case-kho-van.md"
  - "/Users/nguyenquocbao/TMDT/QLUD_CSDL_nhóm-2-distillate/05-du-lieu-quan-he-va-nhat-quan.md"
stepsCompleted: ['step-e-01-discovery', 'step-e-02-review', 'step-e-03-edit']
lastEdited: '2026-04-15'
editHistory:
  - date: '2026-04-15'
    changes: 'MVP được nâng từ trọng tâm học thuật sang dual-goal học thuật + trình bày e-commerce đầy đủ; chuẩn hóa FR/NFR và bổ sung compliance matrix fintech.'
---

# Product Requirements Document - TMDT

**Author:** bao
**Date:** 2026-04-08

## Executive Summary

Nền tảng này là một web app thương mại điện tử thời trang tích hợp AI nhằm giải quyết bài toán cốt lõi của mua sắm online: khách hàng khó hình dung độ phù hợp thực tế của sản phẩm trước khi mua, dẫn đến chọn sai size/sai kiểu và tỷ lệ hoàn trả cao. Sản phẩm tập trung vào trải nghiệm trước mua bằng AI thử đồ nhanh, chính xác, kết hợp gợi ý cá nhân hóa để giúp người dùng ra quyết định mua tốt hơn ngay trong phiên truy cập.
Mục tiêu kinh doanh được ưu tiên theo thứ tự rõ ràng: giảm hoàn trả là KPI số 1, sau đó tăng conversion, rồi tăng AOV. Why now: chi phí hoàn đơn hiện ở mức cao và áp lực cạnh tranh TMĐT thời trang đang tăng mạnh, buộc doanh nghiệp cần lợi thế trải nghiệm khác biệt thay vì chỉ cạnh tranh giá.

### What Makes This Special

Điểm khác biệt của sản phẩm nằm ở việc biến AI từ tính năng “trưng bày” thành công cụ tác động trực tiếp tới chất lượng quyết định mua: thử đồ AI nhanh + chính xác để giảm sai lệch kỳ vọng, đồng thời đưa gợi ý sản phẩm/phối đồ phù hợp theo từng khách hàng để tăng xác suất mua thành công.
Core insight là: nếu giảm được “khoảng cách nhận thức” giữa hình ảnh sản phẩm và cảm nhận thực tế trước checkout, hệ thống sẽ đồng thời giảm hoàn trả, cải thiện conversion và mở rộng cơ hội tăng AOV qua gợi ý phù hợp ngữ cảnh người dùng.

## Project Classification

- **Project Type:** web_app
- **Domain:** fintech (trọng tâm vận hành giao dịch/thanh toán/tài chính) kết hợp e-commerce thời trang
- **Complexity:** high
- **Project Context:** greenfield

## Success Criteria

### User Success

- Người dùng hoàn thành luồng mua sắm chuẩn e-commerce (duyệt sản phẩm -> PDP -> giỏ hàng -> checkout -> theo dõi đơn) mà không cần hỗ trợ thủ công.
- Người dùng hoàn thành luồng AI try-on và nhận kết quả trực quan để hỗ trợ chọn sản phẩm/size.
- Người dùng nhận gợi ý sản phẩm từ AI baseline có liên quan đến hành vi phiên mua hiện tại.
- “Aha moment” của người dùng: sau 1-2 lần thử đồ AI, mức tự tin chọn size/sản phẩm tăng so với trước khi dùng try-on.

### Business Success

- Chứng minh được giả thuyết nghiên cứu: AI try-on + gợi ý cá nhân hóa có tiềm năng cải thiện quyết định trước mua.
- Hoàn thành demo end-to-end ổn định, có tính trình bày như một web e-commerce thông thường.
- Tạo được bộ dữ liệu thực nghiệm và báo cáo phân tích phục vụ môn học/đề tài.

### Technical Success

- Hệ thống vận hành ổn định cho các luồng MVP: xác thực, catalog, PDP, try-on, giỏ hàng, checkout, thanh toán sandbox/mock, theo dõi đơn.
- Dữ liệu nghiệp vụ đơn hàng, giao dịch và trạng thái vận hành nhất quán xuyên suốt payment -> warehouse -> shipping.
- Có logging nghiệp vụ và logging tích hợp tối thiểu để phân tích chất lượng try-on/gợi ý và truy vết lỗi demo.

### Measurable Outcomes

- 100% use case chính trong tài liệu (2.1 -> 2.15) có thể chạy demo thành công ít nhất 1 lần.
- >= 80% người dùng thử nghiệm trong nhóm nhỏ hoàn thành luồng mua sắm chuẩn từ danh mục đến đặt đơn.
- >= 70% người dùng thử nghiệm tự đánh giá mức tự tin chọn size/sản phẩm tăng sau khi dùng try-on.
- Hoàn thiện báo cáo kết quả, giới hạn mô hình và đề xuất cải tiến hậu MVP.

## Product Scope

### MVP - Minimum Viable Product

- MVP phục vụ đồng thời hai mục tiêu: nghiên cứu học thuật và trình bày sản phẩm như một web e-commerce thông thường.
- Storefront đầy đủ: trang chủ, danh mục, tìm kiếm, lọc, PDP, trạng thái tồn kho biến thể, giỏ hàng, checkout và theo dõi đơn.
- Thanh toán sandbox/mock với xử lý callback, trạng thái pending và cơ chế retry thanh toán.
- AI try-on: upload ảnh, render kết quả, hiển thị kết quả và cho phép thử lại khi lỗi.
- Gợi ý sản phẩm baseline theo ngữ cảnh phiên mua.
- Quản trị vận hành: Admin quản lý sản phẩm/đơn/người dùng, Warehouse xử lý đơn và tạo vận đơn.
- Dashboard KPI cơ bản phục vụ cả demo trình bày và báo cáo học thuật.

### Growth Features (Post-MVP)

- Cải thiện chất lượng try-on (độ chân thực, tốc độ).
- Cải thiện chất lượng gợi ý theo hồ sơ/hành vi.
- Mở rộng tập dữ liệu và đa dạng danh mục sản phẩm.
- Bổ sung đánh giá định lượng sâu hơn cho nghiên cứu.

### Vision (Future)

- Nâng cấp từ prototype học thuật lên hệ thống có thể pilot thực tế.
- Từng bước chuẩn hóa kiến trúc để sẵn sàng mở rộng thương mại khi cần.

## User Journeys

### Journey 1 — Khách hàng (Happy Path): Từ khám phá đến mua thành công với AI try-on

Ngọc (22 tuổi) muốn mua váy dự tiệc online nhưng lo sai size và không hợp dáng như ảnh mẫu. Ngọc đăng nhập, tìm kiếm theo danh mục/từ khóa, lọc theo giá và size, xem chi tiết sản phẩm và mở tính năng thử đồ ảo. Sau khi upload ảnh hợp lệ, hệ thống AI render kết quả thử đồ; dựa trên kết quả try-on và gợi ý sản phẩm liên quan, Ngọc chọn biến thể size/màu, thêm vào giỏ, checkout, chọn địa chỉ, vận chuyển và thanh toán.

Khoảnh khắc giá trị cốt lõi xảy ra khi kết quả try-on đủ trực quan để Ngọc chốt đúng sản phẩm/size ngay trong phiên mua. Đơn hàng được tạo thành công, thanh toán ghi nhận, có mã theo dõi đơn, giảm lo lắng “mua sai” và tăng niềm tin với mua sắm thời trang online.

Các lỗi và phương án phục hồi gồm: AI xử lý chậm/lỗi (thông báo rõ + cho thử lại), hết hàng tại checkout (báo ngay + đề xuất biến thể gần nhất), thanh toán lỗi (cho chọn lại phương thức hoặc thanh toán lại).

### Journey 2 — Khách hàng (Edge Case): Checkout gián đoạn vì lỗi thanh toán/timeout

Minh đã chọn xong sản phẩm và thanh toán online qua ví điện tử. Giao dịch gặp timeout hoặc callback trạng thái chậm, Minh quay lại trang đơn nhưng chưa rõ đã trừ tiền hay chưa. Hệ thống phải đối soát trạng thái thanh toán theo callback/retry và chuyển đơn về trạng thái phù hợp (thành công/chờ xác minh/thất bại).

Giá trị của journey này là giảm mơ hồ sau thanh toán, tránh mua trùng hoặc bỏ dở đơn. Nếu giao dịch thất bại, người dùng có nút thanh toán lại; nếu thành công, đơn đi tiếp vào luồng kho vận.

Các lỗi và phương án phục hồi gồm: callback đến chậm (trạng thái “chờ xác minh” + làm mới định kỳ), trạng thái không đồng nhất (ưu tiên nguồn trạng thái cổng thanh toán khi đối soát), người dùng rời phiên (vẫn tra cứu được lịch sử đơn/giao dịch sau đăng nhập lại).

### Journey 3 — Quản trị viên (Admin): Vận hành sản phẩm, đơn hàng và kiểm soát hệ thống

Admin đăng nhập đầu ngày, kiểm tra dashboard tài chính-vận hành, theo dõi KPI nền tảng (đơn hàng, doanh thu, tỷ lệ hoàn trả), quản lý catalog (thêm/sửa sản phẩm, cập nhật biến thể/tồn kho), quản lý đơn (rà soát đơn chờ xử lý, cập nhật trạng thái), và quản lý người dùng (khóa/mở khóa khi cần, ghi nhận lý do và audit log).

Khoảnh khắc giá trị là khi Admin xử lý nhanh các điểm nghẽn (sản phẩm lỗi dữ liệu, đơn bất thường, user vi phạm), giữ vận hành ổn định và bảo toàn chất lượng dữ liệu phục vụ báo cáo học thuật.

Các lỗi và phương án phục hồi gồm: cập nhật trạng thái sai thứ tự (chặn chuyển trạng thái không hợp lệ), xóa nhầm sản phẩm (soft delete thay vì hard delete), email thông báo lỗi (đưa vào hàng đợi gửi lại).

### Journey 4 — Nhân viên kho vận (Warehouse Staff): Từ đơn đã thanh toán đến bàn giao vận chuyển

Nhân viên kho mở màn hình đơn cần xử lý theo FIFO, xem các đơn đã thanh toán, thực hiện pick/pack, xác nhận đóng gói, cập nhật trạng thái, chọn đơn vị vận chuyển, tạo vận đơn, nhận tracking number, in nhãn và bàn giao cho đơn vị vận chuyển.

Khoảnh khắc giá trị là tạo vận đơn thành công và đồng bộ tracking vào hệ thống, giúp đơn chuyển sang “đang giao” minh bạch cho khách hàng và đảm bảo SLA xử lý đơn.

Các lỗi và phương án phục hồi gồm: API vận chuyển timeout/lỗi (queue retry, giữ trạng thái chờ tạo vận đơn), địa chỉ không hợp lệ (gắn cờ lỗi, trả về Admin xử lý), thiếu hàng khi pick (cảnh báo để quyết định đổi/hủy/chờ bổ sung).

### Journey Requirements Summary

- Customer-facing: storefront hoàn chỉnh gồm home, danh mục, tìm kiếm/lọc, PDP, AI try-on, gợi ý sản phẩm, giỏ hàng, checkout, thanh toán và theo dõi đơn.
- Order lifecycle control: state machine đơn hàng rõ ràng, xử lý edge case thanh toán, đối soát callback, retry có kiểm soát.
- Admin operations: quản lý sản phẩm/đơn/người dùng, dashboard KPI, audit log, soft delete, cảnh báo nghiệp vụ.
- Warehouse operations: hàng đợi đơn FIFO, đóng gói, tạo vận đơn, tracking sync, xử lý lỗi vận chuyển.
- Integration reliability: tích hợp AI model, payment gateway, shipping API với timeout, fallback, queue retry, nhất quán dữ liệu xuyên luồng.

## Domain-Specific Requirements

### Compliance & Regulatory
- Phạm vi triển khai phục vụ học tập/nghiên cứu; không yêu cầu chứng nhận tuân thủ production ở giai đoạn hiện tại.
- Không xử lý dữ liệu thẻ thanh toán thật trong môi trường production; toàn bộ luồng thanh toán chạy ở sandbox/test mode hoặc mock.
- Chưa triển khai KYC/AML production; chỉ mô tả luồng và điểm mở rộng kiến trúc.
- Áp dụng nguyên tắc lưu trữ dữ liệu tối thiểu và bảo vệ dữ liệu nhạy cảm trong phạm vi đề tài.

### Fintech Compliance Matrix (MVP)
| Control Area | MVP Requirement | Verification Method |
|--------------|-----------------|---------------------|
| Payment Data Safety | Không lưu PAN/CVV; chỉ lưu mã giao dịch và trạng thái thanh toán | Rà soát schema và log dữ liệu sau mỗi sprint |
| Access Control | RBAC bắt buộc cho Customer/Admin/Warehouse ở tất cả API nghiệp vụ | Chạy test phân quyền và kiểm tra truy cập trái vai trò |
| Auditability | Ghi audit log cho hành động quản trị quan trọng và thay đổi trạng thái đơn | Đối chiếu audit log theo 3 kịch bản kiểm thử chuẩn |
| Reconciliation | Có job/manual flow đối soát trạng thái payment callback và trạng thái đơn | Chạy kịch bản timeout/callback trễ và xác nhận kết quả reconcile |
| Sandbox Isolation | Endpoint production bị tắt mặc định trong môi trường demo/học thuật | Kiểm tra biến môi trường và cấu hình deploy trước demo |

### Technical Constraints
- Bắt buộc xác thực và phân quyền theo vai trò (Customer/Admin/Warehouse), mật khẩu băm an toàn, session/JWT.
- Bắt buộc audit log cho thao tác quản trị quan trọng (khóa user, đổi trạng thái đơn, cập nhật dữ liệu nhạy cảm).
- Bắt buộc timeout/retry cho các tích hợp ngoài (AI try-on, payment callback, shipping API).
- Bắt buộc tính nhất quán trạng thái đơn xuyên suốt payment -> warehouse -> shipping.

### Integration Requirements
- Payment tích hợp ở chế độ sandbox/test hoặc mock để đảm bảo an toàn khi demo.
- Shipping API dùng test mode và có cơ chế fallback trạng thái cache khi dịch vụ ngoài lỗi.
- AI try-on dùng service nội bộ hoặc endpoint mô phỏng có SLA mềm phù hợp môi trường học thuật.

### Fraud Prevention (MVP Scope)
- Phát hiện giao dịch bất thường ở mức rule-based tối thiểu: nhiều lần thanh toán thất bại liên tiếp trong 1 phiên hoặc 1 tài khoản.
- Gắn cờ đơn hàng cần rà soát thủ công khi có lệch trạng thái payment/order kéo dài quá ngưỡng vận hành.
- Yêu cầu audit trail đầy đủ cho mọi thao tác override trạng thái đơn hàng bởi Admin.

### Risk Mitigations
- Rủi ro lệch trạng thái thanh toán: có cơ chế reconcile/đối soát định kỳ.
- Rủi ro rò rỉ dữ liệu ảnh try-on: giới hạn retention, phân quyền truy cập, log truy vết.
- Rủi ro gián đoạn demo do phụ thuộc hệ thống ngoài: bắt buộc có mock/fallback cho luồng trình diễn cốt lõi.

## Innovation & Novel Patterns

### Detected Innovation Areas

- Tích hợp AI Virtual Try-On vào luồng TMĐT thời trang như một bước ra quyết định trước checkout.
- Kết hợp thử đồ ảo và gợi ý sản phẩm/size trong cùng hành trình người dùng để giảm sai lệch kỳ vọng.
- Thiết kế trải nghiệm “interactive decision” thay cho mô hình duyệt ảnh tĩnh truyền thống.

### Market Context & Competitive Landscape

- Nhiều nền tảng TMĐT đã có gợi ý sản phẩm, nhưng kết hợp đồng thời try-on trực quan + gợi ý theo ngữ cảnh vẫn là hướng đang phát triển.
- Trong bối cảnh chi phí hoàn đơn cao, hướng “pre-purchase validation” bằng AI có ý nghĩa thực tiễn rõ.
- Với phạm vi đề tài học thuật, trọng tâm là chứng minh tính khả thi và giá trị phương pháp, không phải lợi thế thị trường ngắn hạn.

### Validation Approach

- So sánh nhóm người dùng thử nghiệm có/không dùng try-on về mức tự tin chọn size/sản phẩm.
- Đo mức chấp nhận tính năng qua phản hồi định tính và chỉ số hành vi cơ bản (dùng try-on, click gợi ý, hoàn tất checkout mô phỏng).
- Kiểm chứng tính ổn định kỹ thuật qua các kịch bản use case chính (2.1–2.15).

### Risk Mitigation

- Nếu chất lượng try-on chưa ổn định: fallback sang ảnh mẫu + gợi ý size rule-based.
- Nếu gợi ý cá nhân hóa chưa tốt: dùng baseline recommendation đơn giản theo danh mục/hành vi gần nhất.
- Nếu tích hợp ngoài gây gián đoạn demo: bắt buộc mock/sandbox cho payment/shipping và retry rõ ràng.

## Web App Specific Requirements

### Project-Type Overview

Sản phẩm được triển khai dưới dạng SPA cho trải nghiệm liền mạch trong các luồng chính: duyệt sản phẩm, thử đồ AI, thêm giỏ, checkout, theo dõi đơn. Kiến trúc ưu tiên tốc độ tương tác và tính liên tục của phiên người dùng, đồng thời vẫn phải đáp ứng yêu cầu SEO cho các trang public quan trọng.

### Technical Architecture Considerations

- Frontend theo mô hình SPA, routing phía client, quản lý state phù hợp cho luồng giỏ hàng/checkout/phiên try-on.
- Tối ưu hiệu năng cho các màn hình nặng (PDP, try-on, lịch sử đơn) bằng lazy loading/code splitting.
- Browser support: ưu tiên các trình duyệt hiện đại (Chrome/Edge/Safari/Firefox phiên bản mới).
- Realtime cập nhật trạng thái đơn hàng (polling hoặc websocket tùy phạm vi triển khai học thuật).
- SEO bắt buộc cho các trang public: danh sách sản phẩm, chi tiết sản phẩm, landing cơ bản.
- A11y mức cơ bản: semantic HTML, focus state rõ, tương phản đủ đọc, label/form control đầy đủ.

### Browser & Compatibility Requirements

- Hỗ trợ trình duyệt desktop/mobile hiện đại bản mới.
- Graceful degradation cho tính năng nâng cao nếu trình duyệt không hỗ trợ đầy đủ.
- Kiểm thử tối thiểu trên các browser mục tiêu trước demo.

### SEO Requirements

- Tối ưu metadata cơ bản (title, description, OG tags) cho trang danh mục/sản phẩm.
- URL thân thiện, cấu trúc điều hướng rõ ràng cho crawl.
- Nội dung sản phẩm có thể index được, tránh phụ thuộc hoàn toàn vào render động không thân thiện SEO.

### Real-time & UX Requirements

- Trạng thái đơn được cập nhật gần thời gian thực trên trang theo dõi đơn.
- Có fallback polling nếu kênh realtime không ổn định.
- Thông báo trạng thái rõ ràng để giảm mơ hồ sau thanh toán.

### Accessibility Baseline

- Điều hướng được bằng bàn phím cho các tác vụ chính.
- Form login/checkout có label và thông báo lỗi dễ hiểu.
- Thành phần tương tác (button/link/input) có trạng thái rõ (focus/disabled/loading).

### Implementation Considerations

- Vì mục tiêu học tập, ưu tiên giải pháp đơn giản, dễ demo, dễ kiểm chứng.
- Các phần SEO/realtime triển khai ở mức đủ chứng minh hướng kiến trúc, không over-engineer.
- Giữ khả năng mở rộng sau này nếu nâng cấp từ prototype học thuật lên pilot thực tế.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP (phục vụ học tập/nghiên cứu), tập trung chứng minh giả thuyết: AI try-on + gợi ý có thể cải thiện quyết định trước mua.
**Resource Requirements:** Nhóm 3–4 người (FE, BE, AI/Data, QA/PM kiêm nhiệm).

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Khách hàng happy path: duyệt sản phẩm -> try-on -> thêm giỏ -> checkout -> theo dõi đơn.
- Khách hàng edge case: lỗi/timeout thanh toán và phục hồi trạng thái.
- Admin vận hành: quản lý sản phẩm, đơn hàng, người dùng.
- Kho vận: xử lý đơn đã thanh toán, đóng gói, tạo vận đơn, cập nhật tracking.

**Must-Have Capabilities:**
- Danh mục sản phẩm + biến thể size/màu + tồn kho cơ bản.
- Đăng nhập/phân quyền theo vai trò.
- AI try-on (upload ảnh, xử lý, hiển thị kết quả).
- Gợi ý sản phẩm baseline.
- Giỏ hàng + checkout.
- Thanh toán sandbox/mock + xử lý callback/retry.
- Theo dõi đơn hàng realtime mức cơ bản (polling/websocket đơn giản).
- Admin dashboard tối thiểu phục vụ báo cáo học thuật.

### Post-MVP Features

**Phase 2 (Post-MVP):**
- Tăng chất lượng try-on (độ chân thực, độ ổn định, tốc độ).
- Nâng cấp recommendation từ baseline lên mô hình cá nhân hóa tốt hơn.
- Mở rộng analytics và báo cáo đánh giá thực nghiệm.
- Tối ưu SEO và A11y sâu hơn.

**Phase 3 (Expansion):**
- Chuẩn hóa kiến trúc để sẵn sàng pilot thực tế.
- Mở rộng dữ liệu và danh mục sản phẩm.
- Bổ sung các tính năng nâng cao cho cá nhân hóa theo ngữ cảnh.
- Hoàn thiện cơ chế vận hành gần production nếu cần thương mại hóa.

### Risk Mitigation Strategy

**Technical Risks:** Chất lượng AI try-on chưa ổn định (ảnh khó, pose/ánh sáng, timeout).
**Mitigation:** fallback hiển thị ảnh mẫu + size rule-based; pipeline retry; giới hạn điều kiện input; test dataset đại diện.

**Market Risks:** Kết quả thử đồ AI không tạo khác biệt cảm nhận người dùng trong bối cảnh học thuật.
**Mitigation:** chạy user test có kịch bản, so sánh trước/sau try-on, thu phản hồi định tính có cấu trúc.

**Resource Risks:** Nhóm nhỏ 3–4 người không đủ bandwidth cho full feature set.
**Mitigation:** khóa chặt MVP scope, hoãn growth features, ưu tiên demo end-to-end ổn định trước tối ưu chất lượng.

## Functional Requirements

### Quản lý tài khoản và phân quyền
- FR1: Người dùng có thể đăng ký tài khoản bằng email và mật khẩu.
- FR2: Người dùng có thể đăng nhập và đăng xuất hệ thống.
- FR3: Hệ thống có thể phân quyền theo vai trò Customer, Admin, Warehouse Staff.
- FR4: Người dùng có thể cập nhật hồ sơ cá nhân gồm tối thiểu họ tên, số điện thoại và tối đa 3 địa chỉ giao hàng.
- FR5: Admin có thể khóa và mở khóa tài khoản người dùng.
- FR6: Hệ thống có thể ghi nhận lịch sử hành động quản trị liên quan tài khoản.

### Khám phá sản phẩm và thông tin catalog
- FR7: Khách hàng có thể duyệt danh sách sản phẩm theo danh mục.
- FR8: Khách hàng có thể tìm kiếm sản phẩm theo từ khóa.
- FR9: Khách hàng có thể lọc sản phẩm theo ít nhất 4 nhóm thuộc tính: danh mục, khoảng giá, size và màu.
- FR10: Khách hàng có thể xem chi tiết sản phẩm và biến thể.
- FR11: Hệ thống có thể hiển thị trạng thái còn hàng của biến thể sản phẩm.
- FR12: Hệ thống có thể cung cấp nội dung sản phẩm theo cách hỗ trợ khả năng index SEO cho các trang public.

### AI Try-On và gợi ý cá nhân hóa
- FR13: Khách hàng có thể tải ảnh lên để sử dụng tính năng thử đồ AI.
- FR14: Hệ thống có thể tạo và hiển thị kết quả thử đồ AI cho khách hàng.
- FR15: Khách hàng có thể thực hiện lại thao tác thử đồ khi lần xử lý trước không thành công.
- FR16: Hệ thống có thể lưu kết quả thử đồ của phiên mua hiện tại để hỗ trợ ra quyết định.
- FR17: Hệ thống có thể hiển thị tối thiểu 5 gợi ý sản phẩm có liên quan đến ít nhất 1 trong 3 tín hiệu: danh mục đã xem, lịch sử thử đồ hoặc sản phẩm trong giỏ hàng của người dùng.
- FR18: Hệ thống có thể cung cấp cơ chế gợi ý baseline khi mô-đun cá nhân hóa nâng cao chưa khả dụng.

### Giỏ hàng và checkout
- FR19: Khách hàng có thể thêm sản phẩm biến thể vào giỏ hàng.
- FR20: Khách hàng có thể cập nhật số lượng hoặc xóa sản phẩm khỏi giỏ hàng.
- FR21: Hệ thống có thể kiểm tra điều kiện hợp lệ của giỏ hàng trước checkout.
- FR22: Khách hàng có thể cung cấp hoặc chọn địa chỉ giao hàng khi checkout.
- FR23: Khách hàng có thể chọn phương thức vận chuyển khi checkout.
- FR24: Hệ thống có thể tính toán và hiển thị tổng giá trị đơn hàng trước xác nhận đặt hàng.
- FR25: Hệ thống có thể tạo đơn hàng từ giỏ hàng hợp lệ.

### Thanh toán và trạng thái giao dịch
- FR26: Khách hàng có thể thanh toán đơn hàng bằng phương thức online hoặc COD trong phạm vi dự án.
- FR27: Hệ thống có thể tiếp nhận và xử lý kết quả phản hồi thanh toán từ cổng tích hợp.
- FR28: Hệ thống có thể cập nhật trạng thái đơn hàng theo trạng thái thanh toán.
- FR29: Hệ thống có thể cho phép khách hàng thanh toán lại khi giao dịch trước đó thất bại.
- FR30: Hệ thống có thể cung cấp trạng thái chờ xác minh khi kết quả thanh toán chưa đồng nhất.
- FR31: Hệ thống có thể lưu lịch sử giao dịch tài chính gắn với đơn hàng.

### Theo dõi đơn hàng và vận chuyển
- FR32: Khách hàng có thể xem danh sách và chi tiết đơn hàng của mình.
- FR33: Khách hàng có thể theo dõi trạng thái đơn hàng theo tiến trình xử lý.
- FR34: Hệ thống có thể liên kết thông tin vận đơn và mã tracking với đơn hàng.
- FR35: Warehouse Staff có thể xem danh sách đơn chờ xử lý theo hàng đợi nghiệp vụ.
- FR36: Warehouse Staff có thể xác nhận đóng gói đơn hàng.
- FR37: Warehouse Staff có thể tạo yêu cầu vận chuyển cho đơn hàng đủ điều kiện.
- FR38: Hệ thống có thể cập nhật trạng thái giao hàng dựa trên dữ liệu từ đơn vị vận chuyển.
- FR39: Hệ thống có thể cung cấp cơ chế dự phòng trạng thái vận chuyển khi tích hợp ngoài gián đoạn.

### Quản trị vận hành và báo cáo
- FR40: Admin có thể tạo, cập nhật và ngừng kích hoạt sản phẩm.
- FR41: Admin có thể quản lý trạng thái đơn hàng theo vòng đời vận hành.
- FR42: Admin có thể xem và xử lý các trường hợp đơn hàng bất thường.
- FR43: Admin có thể xem dashboard gồm tối thiểu 5 KPI: số đơn, doanh thu, AOV, tỷ lệ hoàn trả và tỷ lệ thanh toán thành công; dashboard hỗ trợ ít nhất 3 bộ lọc thời gian: ngày, tuần và tháng.
- FR44: Admin có thể xuất báo cáo doanh thu, đơn hàng và giao dịch theo khoảng thời gian dưới định dạng CSV và PDF; mỗi lần xuất phải hoàn tất trong <= 30 giây với tập dữ liệu tối đa 10.000 bản ghi.
- FR45: Hệ thống có thể ghi nhận log nghiệp vụ chính phục vụ truy vết và đánh giá thực nghiệm.

### Tích hợp và độ tin cậy nghiệp vụ
- FR46: Hệ thống có thể chuyển đổi độc lập endpoint sandbox/mock và endpoint production cho 3 tích hợp AI, payment, shipping thông qua cấu hình môi trường mà không thay đổi luồng nghiệp vụ chính.
- FR47: Hệ thống có thể xử lý timeout/retry cho các tác vụ tích hợp quan trọng.
- FR48: Hệ thống có thể đối soát trạng thái đơn hàng giữa các phân hệ payment, warehouse, shipping.
- FR49: Hệ thống có thể duy trì tính nhất quán dữ liệu đơn hàng và giao dịch trong các luồng chính.
- FR50: Hệ thống có thể hỗ trợ chế độ fallback để đảm bảo demo end-to-end không gián đoạn.

## Non-Functional Requirements

### Performance
- NFR1: 95% yêu cầu duyệt danh mục, tìm kiếm và mở chi tiết sản phẩm phải phản hồi trong <= 2 giây dưới tải đồng thời 100 người dùng, đo bằng APM log.
- NFR2: 95% phiên checkout phải hoàn tất từ bước xác nhận giỏ đến tạo đơn trong <= 90 giây, đo bằng event timestamp theo phiên.
- NFR3: 95% yêu cầu AI try-on phải trả kết quả hoặc timeout có thông báo trong <= 30 giây, đo bằng thời gian xử lý backend.
- NFR4: Trạng thái đơn hàng trên trang theo dõi phải đồng bộ trong <= 10 giây kể từ khi backend đổi trạng thái; khi realtime lỗi phải fallback polling chu kỳ 15 giây, đo bằng log timestamp frontend/backend.

### Security
- NFR5: 100% mật khẩu người dùng phải được băm trước khi lưu bằng thuật toán băm một chiều có salt; xác minh bằng kiểm tra dữ liệu DB và test xác thực.
- NFR6: 100% API nghiệp vụ phải áp dụng RBAC theo vai trò Customer/Admin/Warehouse; xác minh bằng test truy cập trái quyền cho từng vai trò.
- NFR7: 100% thao tác quản trị quan trọng (khóa user, đổi trạng thái đơn, cập nhật dữ liệu nhạy cảm) phải tạo audit log trong <= 5 giây, xác minh bằng kiểm tra log integration test.
- NFR8: 100% tài nguyên dữ liệu nhạy cảm và ảnh try-on phải yêu cầu xác thực + kiểm tra quyền truy cập; xác minh bằng test truy cập trái phép.
- NFR9: 100% luồng thanh toán trong môi trường học thuật phải dùng sandbox/mock endpoint; xác minh bằng cấu hình môi trường và smoke test trước demo.

### Reliability
- NFR10: 100% đơn hàng phải giữ trạng thái hợp lệ theo state machine xuyên suốt payment -> warehouse -> shipping; xác minh bằng test vòng đời đơn hàng.
- NFR11: Các tích hợp AI/payment/shipping phải retry tối đa 3 lần với backoff tăng dần khi lỗi tạm thời; xác minh bằng test mô phỏng timeout.
- NFR12: Khi tích hợp ngoài lỗi, hệ thống phải kích hoạt fallback trong <= 5 giây để không phá vỡ luồng demo end-to-end; xác minh bằng kịch bản chaos test mức chức năng.
- NFR13: Hệ thống phải chạy đối soát trạng thái payment/order tối thiểu mỗi 15 phút và ghi log kết quả; xác minh bằng lịch job và reconciliation report.

### Accessibility
- NFR14: 100% tác vụ chính (duyệt sản phẩm, thêm giỏ, checkout, theo dõi đơn) phải thao tác được bằng bàn phím; xác minh bằng checklist kiểm thử thủ công.
- NFR15: 100% form quan trọng (đăng nhập, checkout) phải có label và thông báo lỗi rõ nghĩa; xác minh bằng test UI và review semantic.
- NFR16: 100% thành phần tương tác phải có trạng thái focus/disabled/loading rõ ràng; xác minh bằng test UI theo component checklist.
- NFR17: Giao diện phải đạt tỷ lệ tương phản tối thiểu WCAG AA cho văn bản chính và dùng semantic HTML cho layout/form; xác minh bằng tool kiểm tra a11y và manual review.

### Integration
- NFR18: Tích hợp AI, payment, shipping phải đạt tỷ lệ gọi API thành công >= 99% trong bộ test tích hợp chuẩn của dự án; đo bằng báo cáo integration test.
- NFR19: 100% lỗi tích hợp phải theo một schema lỗi thống nhất (mã lỗi, nguồn lỗi, thông điệp, correlation id); xác minh bằng contract test.
- NFR20: Hệ thống phải cho phép chuyển đổi endpoint thật/mock qua cấu hình môi trường trong <= 5 phút mà không sửa mã nguồn nghiệp vụ; xác minh bằng quy trình deploy test.
