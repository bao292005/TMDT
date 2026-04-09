---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
inputDocuments:
  - "/Users/nguyenquocbao/TMDT/QLUD_CSDL_nhóm-2-distillate/_index.md"
  - "/Users/nguyenquocbao/TMDT/QLUD_CSDL_nhóm-2-distillate/01-tong-quan-muc-tieu-y-nghia.md"
  - "/Users/nguyenquocbao/TMDT/QLUD_CSDL_nhóm-2-distillate/02-use-case-khach-hang.md"
  - "/Users/nguyenquocbao/TMDT/QLUD_CSDL_nhóm-2-distillate/03-use-case-quan-tri-vien.md"
  - "/Users/nguyenquocbao/TMDT/QLUD_CSDL_nhóm-2-distillate/04-use-case-kho-van.md"
  - "/Users/nguyenquocbao/TMDT/QLUD_CSDL_nhóm-2-distillate/05-du-lieu-quan-he-va-nhat-quan.md"
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 0
classification:
  projectType: web_app
  domain: fintech
  complexity: high
  projectContext: greenfield
workflowType: 'prd'
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

- Người dùng có thể hoàn thành luồng thử đồ AI và nhận kết quả trực quan để hỗ trợ chọn sản phẩm/size.
- Người dùng cảm nhận hệ thống hữu ích hơn cách xem ảnh tĩnh thông thường khi mua thời trang online.
- Người dùng có thể nhận gợi ý sản phẩm phù hợp từ AI ở mức chấp nhận được cho mục tiêu học thuật.
- “Aha moment” của người dùng: sau 1-2 lần thử đồ AI, họ cảm nhận rõ việc chọn size/sản phẩm chính xác hơn so với cách mua online thông thường.

### Business Success

- Chứng minh được giả thuyết nghiên cứu: AI try-on + gợi ý cá nhân hóa có tiềm năng cải thiện quyết định trước mua.
- Tạo được bộ dữ liệu thực nghiệm và báo cáo phân tích để phục vụ môn học/đề tài.
- Hoàn thành demo end-to-end ổn định để trình bày và đánh giá học thuật.

### Technical Success

- Hệ thống chạy ổn định đủ cho demo: đăng nhập, duyệt sản phẩm, try-on, giỏ hàng, checkout mô phỏng, theo dõi đơn.
- AI try-on phản hồi trong thời gian hợp lý cho môi trường nghiên cứu/lab.
- Dữ liệu nghiệp vụ (đơn hàng, giao dịch, trạng thái) nhất quán để phục vụ phân tích.
- Có logging cơ bản để đánh giá chất lượng kết quả thử đồ và gợi ý.

### Measurable Outcomes

- Hoàn thành các kịch bản use case chính trong tài liệu (2.1 → 2.15).
- Thu thập phản hồi người dùng thử nghiệm (nhóm nhỏ) về tính hữu ích của try-on/gợi ý.
- So sánh định tính hoặc bán định lượng trước/sau khi dùng try-on (mức tự tin chọn size/sản phẩm).
- Hoàn thiện báo cáo kết quả và giới hạn của mô hình.

## Product Scope

### MVP - Minimum Viable Product

- Danh mục sản phẩm + biến thể size/màu + tồn kho cơ bản.
- Giỏ hàng + checkout.
- Thanh toán mô phỏng hoặc tích hợp mức cơ bản (phục vụ minh họa luồng).
- AI try-on: upload ảnh, render kết quả, hiển thị cho người dùng.
- Gợi ý sản phẩm phù hợp mức baseline.
- Theo dõi đơn hàng.
- Admin quản lý sản phẩm/đơn/người dùng.
- Dashboard thống kê cơ bản phục vụ báo cáo học thuật.

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

- Customer-facing: tìm kiếm/lọc sản phẩm, chi tiết sản phẩm, AI try-on, gợi ý cá nhân hóa, giỏ hàng, checkout, thanh toán đa phương thức, theo dõi đơn/giao dịch.
- Order lifecycle control: state machine đơn hàng rõ ràng, xử lý edge case thanh toán, đối soát callback, retry có kiểm soát.
- Admin operations: quản lý sản phẩm/đơn/người dùng, dashboard KPI, audit log, soft delete, cảnh báo nghiệp vụ.
- Warehouse operations: hàng đợi đơn FIFO, đóng gói, tạo vận đơn, tracking sync, xử lý lỗi vận chuyển.
- Integration reliability: tích hợp AI model, payment gateway, shipping API với timeout, fallback, queue retry, nhất quán dữ liệu xuyên luồng.

## Domain-Specific Requirements

### Compliance & Regulatory
- Phạm vi triển khai phục vụ học tập/nghiên cứu; không yêu cầu chứng nhận tuân thủ production ở giai đoạn hiện tại.
- Không xử lý dữ liệu thẻ thanh toán thật trong môi trường production; ưu tiên sandbox/test mode hoặc mock.
- Chưa triển khai KYC/AML production; chỉ mô tả luồng và điểm mở rộng kiến trúc.
- Áp dụng nguyên tắc lưu trữ dữ liệu tối thiểu và bảo vệ dữ liệu nhạy cảm trong phạm vi đề tài.

### Technical Constraints
- Bắt buộc xác thực và phân quyền theo vai trò (Customer/Admin/Warehouse), mật khẩu băm bcrypt, session/JWT.
- Bắt buộc audit log cho thao tác quản trị quan trọng (khóa user, đổi trạng thái đơn, cập nhật dữ liệu nhạy cảm).
- Bắt buộc timeout/retry cho các tích hợp ngoài (AI try-on, payment callback, shipping API).
- Bắt buộc tính nhất quán trạng thái đơn xuyên suốt payment -> warehouse -> shipping.

### Integration Requirements
- Payment tích hợp ở chế độ sandbox/test hoặc mock để đảm bảo an toàn khi demo.
- Shipping API dùng test mode và có cơ chế fallback trạng thái cache khi dịch vụ ngoài lỗi.
- AI try-on dùng service nội bộ hoặc endpoint mô phỏng có SLA mềm phù hợp môi trường học thuật.

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
- FR9: Khách hàng có thể lọc sản phẩm theo tối thiểu các thuộc tính danh mục, khoảng giá, size và màu.
- FR10: Khách hàng có thể xem chi tiết sản phẩm và biến thể.
- FR11: Hệ thống có thể hiển thị trạng thái còn hàng của biến thể sản phẩm.
- FR12: Hệ thống có thể cung cấp nội dung sản phẩm theo cách hỗ trợ khả năng index SEO cho các trang public.

### AI Try-On và gợi ý cá nhân hóa
- FR13: Khách hàng có thể tải ảnh lên để sử dụng tính năng thử đồ AI.
- FR14: Hệ thống có thể tạo và hiển thị kết quả thử đồ AI cho khách hàng.
- FR15: Khách hàng có thể thực hiện lại thao tác thử đồ khi lần xử lý trước không thành công.
- FR16: Hệ thống có thể lưu kết quả thử đồ của phiên mua hiện tại để hỗ trợ ra quyết định.
- FR17: Hệ thống có thể hiển thị tối thiểu 5 gợi ý sản phẩm theo danh mục đã xem, lịch sử thử đồ hoặc sản phẩm trong giỏ hàng của người dùng.
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
- FR43: Admin có thể xem dashboard gồm tối thiểu 5 KPI: số đơn, doanh thu, AOV, tỷ lệ hoàn trả và tỷ lệ thanh toán thành công theo bộ lọc thời gian.
- FR44: Admin có thể xuất báo cáo doanh thu, đơn hàng và giao dịch theo khoảng thời gian dưới định dạng CSV và PDF.
- FR45: Hệ thống có thể ghi nhận log nghiệp vụ chính phục vụ truy vết và đánh giá thực nghiệm.

### Tích hợp và độ tin cậy nghiệp vụ
- FR46: Hệ thống có thể chuyển đổi giữa endpoint sandbox/mock và endpoint thật cho AI, payment, shipping thông qua cấu hình môi trường mà không thay đổi luồng nghiệp vụ chính.
- FR47: Hệ thống có thể xử lý timeout/retry cho các tác vụ tích hợp quan trọng.
- FR48: Hệ thống có thể đối soát trạng thái đơn hàng giữa các phân hệ payment, warehouse, shipping.
- FR49: Hệ thống có thể duy trì tính nhất quán dữ liệu đơn hàng và giao dịch trong các luồng chính.
- FR50: Hệ thống có thể hỗ trợ chế độ fallback để đảm bảo demo end-to-end không gián đoạn.

## Non-Functional Requirements

### Performance
- NFR1: 95% yêu cầu duyệt danh mục, tìm kiếm và mở chi tiết sản phẩm phải phản hồi trong <= 2 giây, đo bằng log APM trong điều kiện tải thường.
- NFR2: 95% phiên checkout phải hoàn tất từ bước xác nhận giỏ đến tạo đơn trong <= 90 giây, đo bằng event timestamp theo phiên.
- NFR3: Luồng AI try-on phải trả kết quả hoặc timeout có thông báo trong <= 30 giây cho mỗi yêu cầu, đo bằng thời gian xử lý backend.
- NFR4: Trạng thái đơn hàng trên trang theo dõi phải được đồng bộ trong <= 10 giây kể từ khi backend đổi trạng thái; khi realtime lỗi phải fallback polling chu kỳ 15 giây.

### Security
- NFR5: Dữ liệu xác thực người dùng phải được bảo vệ bằng cơ chế băm mật khẩu an toàn.
- NFR6: Hệ thống phải thực thi phân quyền truy cập theo vai trò (Customer/Admin/Warehouse).
- NFR7: Hệ thống phải ghi audit log cho các thao tác quản trị quan trọng.
- NFR8: Dữ liệu nhạy cảm và dữ liệu ảnh try-on phải được kiểm soát truy cập theo nguyên tắc tối thiểu cần thiết.
- NFR9: Tích hợp thanh toán trong phạm vi đề tài phải sử dụng sandbox/mock để tránh rủi ro dữ liệu tài chính thật.

### Reliability
- NFR10: Hệ thống phải duy trì tính nhất quán trạng thái đơn hàng giữa các phân hệ thanh toán, kho vận và vận chuyển.
- NFR11: Các tích hợp ngoài (AI, payment, shipping) phải có cơ chế retry có kiểm soát.
- NFR12: Khi tích hợp ngoài lỗi, hệ thống phải có fallback để không phá vỡ luồng demo end-to-end.
- NFR13: Hệ thống phải hỗ trợ cơ chế đối soát định kỳ cho trạng thái thanh toán/đơn hàng khi callback bị trễ hoặc lệch.

### Accessibility
- NFR14: Các tác vụ chính phải thao tác được bằng bàn phím.
- NFR15: Form quan trọng (đăng nhập, checkout) phải có label và thông báo lỗi dễ hiểu.
- NFR16: Thành phần tương tác phải có trạng thái focus/disabled/loading rõ ràng.
- NFR17: Giao diện phải đảm bảo khả năng đọc cơ bản (độ tương phản và cấu trúc semantic).

### Integration
- NFR18: Hệ thống phải hỗ trợ tích hợp AI service, payment service và shipping service qua giao tiếp API ổn định trong môi trường học thuật.
- NFR19: Hệ thống phải chuẩn hóa xử lý lỗi tích hợp theo một mẫu nhất quán để dễ vận hành và debug.
- NFR20: Hệ thống phải cho phép thay thế endpoint thật bằng mock endpoint mà không làm thay đổi hành vi nghiệp vụ chính.
