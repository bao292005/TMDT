---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - "/Users/nguyenquocbao/TMDT/_bmad-output/planning-artifacts/prd.md"
  - "/Users/nguyenquocbao/TMDT/_bmad-output/planning-artifacts/architecture.md"
  - "/Users/nguyenquocbao/TMDT/_bmad-output/planning-artifacts/ux-design-specification.md"
---

# TMDT - Epic Breakdown

## Overview

Tài liệu này phân rã requirements từ PRD, Architecture và UX Design thành nền tảng để thiết kế epics/stories có thể triển khai song song theo lane Contract/Data/Backend/AI/Frontend, đồng thời giữ traceability đầy đủ.

## Requirements Inventory

### Functional Requirements

FR1: Người dùng có thể đăng ký tài khoản bằng email và mật khẩu.
FR2: Người dùng có thể đăng nhập và đăng xuất hệ thống.
FR3: Hệ thống có thể phân quyền theo vai trò Customer, Admin, Warehouse Staff.
FR4: Người dùng có thể cập nhật hồ sơ cá nhân gồm tối thiểu họ tên, số điện thoại và tối đa 3 địa chỉ giao hàng.
FR5: Admin có thể khóa và mở khóa tài khoản người dùng.
FR6: Hệ thống có thể ghi nhận lịch sử hành động quản trị liên quan tài khoản.
FR7: Khách hàng có thể duyệt danh sách sản phẩm theo danh mục.
FR8: Khách hàng có thể tìm kiếm sản phẩm theo từ khóa.
FR9: Khách hàng có thể lọc sản phẩm theo tối thiểu các thuộc tính danh mục, khoảng giá, size và màu.
FR10: Khách hàng có thể xem chi tiết sản phẩm và biến thể.
FR11: Hệ thống có thể hiển thị trạng thái còn hàng của biến thể sản phẩm.
FR12: Hệ thống có thể cung cấp nội dung sản phẩm theo cách hỗ trợ khả năng index SEO cho các trang public.
FR13: Khách hàng có thể tải ảnh lên để sử dụng tính năng thử đồ AI.
FR14: Hệ thống có thể tạo và hiển thị kết quả thử đồ AI cho khách hàng.
FR15: Khách hàng có thể thực hiện lại thao tác thử đồ khi lần xử lý trước không thành công.
FR16: Hệ thống có thể lưu kết quả thử đồ của phiên mua hiện tại để hỗ trợ ra quyết định.
FR17: Hệ thống có thể hiển thị tối thiểu 5 gợi ý sản phẩm theo danh mục đã xem, lịch sử thử đồ hoặc sản phẩm trong giỏ hàng của người dùng.
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
FR43: Admin có thể xem dashboard gồm tối thiểu 5 KPI: số đơn, doanh thu, AOV, tỷ lệ hoàn trả và tỷ lệ thanh toán thành công theo bộ lọc thời gian.
FR44: Admin có thể xuất báo cáo doanh thu, đơn hàng và giao dịch theo khoảng thời gian dưới định dạng CSV và PDF.
FR45: Hệ thống có thể ghi nhận log nghiệp vụ chính phục vụ truy vết và đánh giá thực nghiệm.
FR46: Hệ thống có thể chuyển đổi giữa endpoint sandbox/mock và endpoint thật cho AI, payment, shipping thông qua cấu hình môi trường mà không thay đổi luồng nghiệp vụ chính.
FR47: Hệ thống có thể xử lý timeout/retry cho các tác vụ tích hợp quan trọng.
FR48: Hệ thống có thể đối soát trạng thái đơn hàng giữa các phân hệ payment, warehouse, shipping.
FR49: Hệ thống có thể duy trì tính nhất quán dữ liệu đơn hàng và giao dịch trong các luồng chính.
FR50: Hệ thống có thể hỗ trợ chế độ fallback để đảm bảo demo end-to-end không gián đoạn.

### NonFunctional Requirements

NFR1: 95% yêu cầu duyệt danh mục, tìm kiếm và mở chi tiết sản phẩm phải phản hồi trong <= 2 giây, đo bằng log APM trong điều kiện tải thường.
NFR2: 95% phiên checkout phải hoàn tất từ bước xác nhận giỏ đến tạo đơn trong <= 90 giây, đo bằng event timestamp theo phiên.
NFR3: Luồng AI try-on phải trả kết quả hoặc timeout có thông báo trong <= 30 giây cho mỗi yêu cầu, đo bằng thời gian xử lý backend.
NFR4: Trạng thái đơn hàng trên trang theo dõi phải được đồng bộ trong <= 10 giây kể từ khi backend đổi trạng thái; khi realtime lỗi phải fallback polling chu kỳ 15 giây.
NFR5: Dữ liệu xác thực người dùng phải được bảo vệ bằng cơ chế băm mật khẩu an toàn.
NFR6: Hệ thống phải thực thi phân quyền truy cập theo vai trò (Customer/Admin/Warehouse).
NFR7: Hệ thống phải ghi audit log cho các thao tác quản trị quan trọng.
NFR8: Dữ liệu nhạy cảm và dữ liệu ảnh try-on phải được kiểm soát truy cập theo nguyên tắc tối thiểu cần thiết.
NFR9: Tích hợp thanh toán trong phạm vi đề tài phải sử dụng sandbox/mock để tránh rủi ro dữ liệu tài chính thật.
NFR10: Hệ thống phải duy trì tính nhất quán trạng thái đơn hàng giữa các phân hệ thanh toán, kho vận và vận chuyển.
NFR11: Các tích hợp ngoài (AI, payment, shipping) phải có cơ chế retry có kiểm soát.
NFR12: Khi tích hợp ngoài lỗi, hệ thống phải có fallback để không phá vỡ luồng demo end-to-end.
NFR13: Hệ thống phải hỗ trợ cơ chế đối soát định kỳ cho trạng thái thanh toán/đơn hàng khi callback bị trễ hoặc lệch.
NFR14: Các tác vụ chính phải thao tác được bằng bàn phím.
NFR15: Form quan trọng (đăng nhập, checkout) phải có label và thông báo lỗi dễ hiểu.
NFR16: Thành phần tương tác phải có trạng thái focus/disabled/loading rõ ràng.
NFR17: Giao diện phải đảm bảo khả năng đọc cơ bản (độ tương phản và cấu trúc semantic).
NFR18: Hệ thống phải hỗ trợ tích hợp AI service, payment service và shipping service qua giao tiếp API ổn định trong môi trường học thuật.
NFR19: Hệ thống phải chuẩn hóa xử lý lỗi tích hợp theo một mẫu nhất quán để dễ vận hành và debug.
NFR20: Hệ thống phải cho phép thay thế endpoint thật bằng mock endpoint mà không làm thay đổi hành vi nghiệp vụ chính.

### Additional Requirements

- Starter template bắt buộc từ Architecture: khởi tạo dự án bằng `npx create-next-app@latest tmdt --typescript --tailwind`.
- Bounded modules bắt buộc: identity, catalog, tryon, recommendation, cart, checkout, payment, order, fulfillment, warehouse, admin, reporting, integrations.
- Boundary rõ: `src/app` cho routing/composition; `src/modules` cho business logic; `src/shared` cho cross-cutting.
- Chuẩn API response bắt buộc:
  - success `{ data, meta }`
  - error `{ error: { code, message, details } }`
  - trả header `X-Correlation-Id`.
- Quy tắc dữ liệu bắt buộc: API `camelCase`, DB `snake_case`, datetime ISO-8601 UTC, money minor unit, không float cho tài chính.
- Event contract: `domain.entity.action.v1` với payload bắt buộc `eventId, occurredAt, source, correlationId, idempotencyKey, data`.
- Idempotency và reconciliation bắt buộc cho callback/webhook payment/shipping.
- Integration resilience bắt buộc: timeout, retry có kiểm soát, fallback, dead-letter/manual reconciliation.
- Jobs tách khỏi route handlers: reconciliation và tracking-sync.
- RBAC bắt buộc cho Customer/Admin/Warehouse và audit log cho hành động nhạy cảm.
- Config-driven endpoint switching bắt buộc cho sandbox/mock/real không đổi luồng nghiệp vụ.
- Baseline accessibility + SEO cho web app public/authenticated areas.

### UX Design Requirements

UX-DR1: Áp dụng design direction hybrid D2 + D4 + D6 cho toàn hệ thống (visual confidence + speed minimal + role-aware workspace).
UX-DR2: Triển khai decision-first flow rõ ràng: Discover → PDP/Try-on → Cart → Checkout → Tracking.
UX-DR3: PDP phải ưu tiên khối try-on trực quan và CTA chốt mua rõ thứ bậc.
UX-DR4: Chuẩn hóa trạng thái payment/tracking theo timeline có label + timestamp + next action.
UX-DR5: Cài đặt Button hierarchy nhất quán (mỗi màn hình 1 primary, có secondary/tertiary/destructive).
UX-DR6: Chuẩn hóa feedback patterns: success/error/warning/info với recovery CTA rõ.
UX-DR7: Chuẩn hóa form patterns: validation 2 lớp, error rõ, focus về field lỗi đầu tiên, không mất dữ liệu đã nhập.
UX-DR8: Chuẩn hóa navigation theo vai trò: customer tuyến tính; admin/warehouse task-first.
UX-DR9: Triển khai modal/overlay rules nhất quán (focus trap, close behavior, escape handling).
UX-DR10: Triển khai loading/empty/search-filter patterns có hành động tiếp theo rõ ràng.
UX-DR11: Xây dựng component `TryOnConfidencePanel` với state matrix đầy đủ.
UX-DR12: Xây dựng component `PaymentStatusTimeline` (summary/full).
UX-DR13: Xây dựng component `VariantFitSelector` đồng bộ tín hiệu fit + tồn kho.
UX-DR14: Xây dựng component `RecoveryActionBanner` cho lỗi AI/payment/shipping.
UX-DR15: Xây dựng component `OperatorQueueBoard` cho admin/warehouse.
UX-DR16: Bảo đảm responsive strategy mobile-first, desktop mở rộng theo ngữ cảnh nhiệm vụ.
UX-DR17: Áp dụng breakpoint strategy đã chốt (`<640`, `640-767`, `768-1023`, `1024-1279`, `>=1280`).
UX-DR18: Đạt accessibility mức WCAG 2.1 AA cho luồng chính.
UX-DR19: Bắt buộc keyboard navigation, focus indicator rõ, touch target >=44x44, semantic/ARIA đúng ngữ cảnh.
UX-DR20: Thiết lập test strategy responsive+a11y (axe/Lighthouse + keyboard-only + screen reader spot-check).

### FR Coverage Map

FR1: Epic 1 - Đăng ký tài khoản
FR2: Epic 1 - Đăng nhập/đăng xuất
FR3: Epic 1 - RBAC theo vai trò
FR4: Epic 1 - Cập nhật hồ sơ người dùng
FR5: Epic 1 - Khóa/mở khóa tài khoản
FR6: Epic 1 - Audit hành động quản trị tài khoản
FR7: Epic 2 - Duyệt danh mục sản phẩm
FR8: Epic 2 - Tìm kiếm sản phẩm
FR9: Epic 2 - Lọc sản phẩm theo thuộc tính
FR10: Epic 2 - Xem chi tiết sản phẩm/biến thể
FR11: Epic 2 - Hiển thị trạng thái tồn kho biến thể
FR12: Epic 2 - Nội dung public hỗ trợ SEO
FR13: Epic 3 - Upload ảnh cho AI try-on
FR14: Epic 3 - Tạo/hiển thị kết quả try-on
FR15: Epic 3 - Retry khi try-on thất bại
FR16: Epic 3 - Lưu kết quả try-on theo phiên
FR17: Epic 3 - Gợi ý sản phẩm phù hợp
FR18: Epic 3 - Cơ chế recommendation baseline
FR19: Epic 4 - Thêm biến thể vào giỏ
FR20: Epic 4 - Cập nhật/xóa sản phẩm trong giỏ
FR21: Epic 4 - Kiểm tra giỏ trước checkout
FR22: Epic 4 - Cung cấp/chọn địa chỉ giao hàng
FR23: Epic 4 - Chọn phương thức vận chuyển
FR24: Epic 4 - Tính/hiển thị tổng giá trị đơn
FR25: Epic 4 - Tạo đơn từ giỏ hợp lệ
FR26: Epic 4 - Thanh toán online/COD
FR27: Epic 4 - Xử lý phản hồi thanh toán
FR28: Epic 4 - Cập nhật trạng thái đơn theo payment
FR29: Epic 4 - Cho phép thanh toán lại
FR30: Epic 4 - Trạng thái chờ xác minh
FR31: Epic 4 - Lưu lịch sử giao dịch tài chính
FR32: Epic 5 - Xem danh sách/chi tiết đơn hàng
FR33: Epic 5 - Theo dõi trạng thái đơn
FR34: Epic 5 - Liên kết vận đơn + tracking
FR35: Epic 5 - Warehouse queue đơn chờ xử lý
FR36: Epic 5 - Xác nhận đóng gói đơn
FR37: Epic 5 - Tạo yêu cầu vận chuyển
FR38: Epic 5 - Cập nhật trạng thái giao hàng
FR39: Epic 5 - Fallback trạng thái vận chuyển
FR40: Epic 6 - Quản lý sản phẩm bởi admin
FR41: Epic 6 - Quản lý vòng đời trạng thái đơn
FR42: Epic 6 - Xử lý đơn bất thường
FR43: Epic 6 - Dashboard KPI vận hành
FR44: Epic 6 - Xuất báo cáo CSV/PDF
FR45: Epic 6 - Ghi log nghiệp vụ chính
FR46: Epic 7 - Chuyển đổi sandbox/mock/real bằng config
FR47: Epic 7 - Timeout/retry cho tích hợp
FR48: Epic 7 - Đối soát trạng thái liên phân hệ
FR49: Epic 7 - Nhất quán dữ liệu đơn/giao dịch
FR50: Epic 7 - Fallback đảm bảo demo end-to-end

## Epic List

### Epic 1: Tài khoản và truy cập an toàn theo vai trò
Người dùng có thể đăng ký/đăng nhập/quản lý hồ sơ; hệ thống kiểm soát quyền và audit hành động quản trị.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6

### Epic 2: Khám phá và đánh giá sản phẩm trước mua
Khách hàng có thể tìm, lọc, xem PDP/biến thể/tồn kho với nội dung public hỗ trợ SEO.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12

### Epic 3: Tăng tự tin quyết định mua bằng AI try-on
Khách hàng thử đồ AI, retry khi lỗi, lưu kết quả phiên và nhận gợi ý sản phẩm phù hợp.
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18

### Epic 4: Mua hàng và thanh toán đáng tin cậy
Khách hàng thao tác giỏ hàng, checkout, thanh toán/retry; hệ thống cập nhật trạng thái giao dịch nhất quán.
**FRs covered:** FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31

### Epic 5: Minh bạch trạng thái đơn và vận hành giao nhận
Khách hàng theo dõi đơn; kho vận xử lý hàng đợi, đóng gói, tạo vận đơn, đồng bộ tracking/fallback.
**FRs covered:** FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR39

### Epic 6: Vận hành quản trị và báo cáo
Admin quản lý sản phẩm/đơn bất thường và theo dõi KPI/báo cáo phục vụ vận hành + nghiên cứu.
**FRs covered:** FR40, FR41, FR42, FR43, FR44, FR45

### Epic 7: Độ bền tích hợp và khả năng chuyển môi trường
Hệ thống vận hành ổn định qua sandbox/mock/real với timeout-retry-reconcile-fallback xuyên phân hệ.
**FRs covered:** FR46, FR47, FR48, FR49, FR50

## Epic 1: Tài khoản và truy cập an toàn theo vai trò

Người dùng có thể đăng ký/đăng nhập/quản lý hồ sơ; hệ thống kiểm soát quyền và audit hành động quản trị.

### Story 1.1: Khởi tạo dự án từ starter template

As a nhóm phát triển,
I want khởi tạo codebase từ Next.js starter đã chốt,
So that toàn bộ stories tiếp theo triển khai trên nền tảng thống nhất.

**FRs implemented:** Additional Requirements (starter template từ Architecture)

**Acceptance Criteria:**

**Given** repository chưa có nền tảng ứng dụng chuẩn
**When** nhóm thực hiện khởi tạo bằng `npx create-next-app@latest tmdt --typescript --tailwind`
**Then** project được tạo với cấu trúc ban đầu, dependencies cốt lõi và cấu hình TypeScript/Tailwind hoạt động
**And** có thể chạy ứng dụng local thành công để làm nền cho các story kế tiếp.

### Story 1.2: Đăng ký và đăng nhập tài khoản khách hàng

As a khách hàng mới,
I want đăng ký và đăng nhập bằng email/mật khẩu,
So that tôi có thể truy cập khu vực mua sắm cá nhân hóa.

**FRs implemented:** FR1, FR2

**Acceptance Criteria:**

**Given** người dùng chưa có tài khoản
**When** người dùng đăng ký hợp lệ và đăng nhập
**Then** hệ thống tạo tài khoản, băm mật khẩu an toàn, tạo phiên đăng nhập
**And** trả lỗi chuẩn khi email trùng hoặc thông tin không hợp lệ.

### Story 1.3: RBAC cho Customer, Admin, Warehouse

As a quản trị hệ thống,
I want hệ thống áp quyền theo vai trò,
So that mỗi người chỉ truy cập đúng chức năng được phép.

**FRs implemented:** FR3

**Acceptance Criteria:**

**Given** người dùng đã đăng nhập với một vai trò cụ thể
**When** người dùng truy cập route hoặc API ngoài quyền
**Then** hệ thống chặn truy cập và trả lỗi AUTH_* phù hợp
**And** route/API đúng quyền vẫn hoạt động bình thường.

### Story 1.4: Quản lý hồ sơ và nhật ký quản trị tài khoản

As a người dùng và admin,
I want cập nhật hồ sơ cá nhân và ghi nhận hành động quản trị,
So that thông tin tài khoản được duy trì chính xác và có khả năng truy vết.

**FRs implemented:** FR4, FR5, FR6

**Acceptance Criteria:**

**Given** người dùng đã đăng nhập
**When** người dùng cập nhật hồ sơ hoặc admin khóa/mở khóa tài khoản
**Then** hệ thống lưu dữ liệu đúng ràng buộc và cập nhật trạng thái tài khoản
**And** ghi audit log đầy đủ cho hành động quản trị nhạy cảm.

## Epic 2: Khám phá và đánh giá sản phẩm trước mua

Khách hàng có thể tìm, lọc, xem PDP/biến thể/tồn kho với nội dung public hỗ trợ SEO.

### Story 2.1: Duyệt danh mục và tìm kiếm sản phẩm

As a khách hàng,
I want duyệt danh mục và tìm kiếm theo từ khóa,
So that tôi nhanh chóng tìm được sản phẩm quan tâm.

**FRs implemented:** FR7, FR8

**Acceptance Criteria:**

**Given** dữ liệu catalog đã có sản phẩm
**When** khách hàng mở danh mục hoặc nhập từ khóa tìm kiếm
**Then** hệ thống trả danh sách sản phẩm theo điều kiện truy vấn
**And** thời gian phản hồi tuân thủ NFR hiệu năng cho browse/search.

### Story 2.2: Lọc sản phẩm theo thuộc tính mua sắm

As a khách hàng,
I want lọc theo danh mục, giá, size, màu,
So that tôi thu hẹp lựa chọn phù hợp nhu cầu.

**FRs implemented:** FR9

**Acceptance Criteria:**

**Given** khách hàng đang ở trang danh sách sản phẩm
**When** khách hàng áp dụng một hoặc nhiều bộ lọc
**Then** hệ thống trả kết quả lọc chính xác theo tất cả điều kiện
**And** giữ trạng thái filter nhất quán khi phân trang hoặc quay lại danh sách.

### Story 2.3: PDP biến thể, tồn kho và SEO public

As a khách hàng,
I want xem chi tiết sản phẩm, biến thể và tồn kho,
So that tôi có đủ thông tin để quyết định mua.

**FRs implemented:** FR10, FR11, FR12

**Acceptance Criteria:**

**Given** khách hàng truy cập trang chi tiết sản phẩm
**When** khách hàng chọn biến thể size/màu
**Then** hệ thống hiển thị đúng thông tin sản phẩm, biến thể, trạng thái tồn kho
**And** trang public có metadata/URL thân thiện phục vụ index SEO.

## Epic 3: Tăng tự tin quyết định mua bằng AI try-on

Khách hàng thử đồ AI, retry khi lỗi, lưu kết quả phiên và nhận gợi ý sản phẩm phù hợp.

### Story 3.1: Upload ảnh và xử lý AI try-on

As a khách hàng,
I want tải ảnh và nhận kết quả thử đồ AI,
So that tôi đánh giá độ phù hợp trước khi mua.

**FRs implemented:** FR13, FR14

**Acceptance Criteria:

**Given** khách hàng ở PDP và có ảnh hợp lệ
**When** khách hàng gửi yêu cầu try-on
**Then** hệ thống xử lý và trả kết quả thử đồ hoặc trạng thái timeout trong ngưỡng NFR
**And** hiển thị phản hồi rõ ràng theo trạng thái success/error/timeout.

### Story 3.2: Retry try-on và lưu kết quả theo phiên

As a khách hàng,
I want thử lại khi fail và giữ kết quả trong phiên mua,
So that tôi không mất ngữ cảnh quyết định.

**FRs implemented:** FR15, FR16

**Acceptance Criteria:

**Given** yêu cầu try-on trước đó thất bại hoặc khách hàng muốn thử lại
**When** khách hàng thực hiện retry
**Then** hệ thống cho phép xử lý lại và cập nhật kết quả mới nhất
**And** lưu kết quả try-on theo phiên để dùng cho bước chọn biến thể.

### Story 3.3: Recommendation baseline và cá nhân hóa cơ bản

As a khách hàng,
I want nhận gợi ý sản phẩm phù hợp sau khi xem/try-on,
So that tôi dễ chọn thêm sản phẩm liên quan.

**FRs implemented:** FR17, FR18

**Acceptance Criteria:

**Given** khách hàng có ngữ cảnh duyệt sản phẩm hoặc kết quả try-on
**When** hệ thống tạo danh sách gợi ý
**Then** hiển thị tối thiểu 5 gợi ý phù hợp theo rule baseline hoặc personalization
**And** fallback baseline hoạt động khi mô-đun cá nhân hóa nâng cao chưa sẵn sàng.

### Story 3.4: UI TryOnConfidencePanel và VariantFitSelector

As a khách hàng,
I want thấy panel try-on và tín hiệu fit gắn với biến thể,
So that tôi chốt size/màu tự tin hơn.

**FRs implemented:** FR14, FR16

**Acceptance Criteria:

**Given** kết quả try-on đã sẵn sàng
**When** khách hàng xem panel và chọn biến thể
**Then** UI hiển thị fit confidence, trạng thái tồn kho, CTA đúng hierarchy
**And** các trạng thái loading/error/success tuân thủ UX patterns đã định nghĩa.

## Epic 4: Mua hàng và thanh toán đáng tin cậy

Khách hàng thao tác giỏ hàng, checkout, thanh toán/retry; hệ thống cập nhật trạng thái giao dịch nhất quán.

### Story 4.1: Quản lý giỏ hàng và kiểm tra hợp lệ

As a khách hàng,
I want thêm/cập nhật/xóa sản phẩm trong giỏ,
So that tôi kiểm soát đơn hàng trước checkout.

**FRs implemented:** FR19, FR20, FR21

**Acceptance Criteria:

**Given** khách hàng đã chọn biến thể sản phẩm
**When** khách hàng thao tác giỏ hàng
**Then** hệ thống cập nhật giỏ chính xác theo số lượng và tồn kho
**And** chặn checkout khi giỏ không hợp lệ với thông điệp lỗi rõ ràng.

### Story 4.2: Checkout địa chỉ, vận chuyển và tổng tiền

As a khách hàng,
I want nhập/chọn địa chỉ, chọn vận chuyển và xem tổng tiền,
So that tôi xác nhận chi phí trước khi đặt hàng.

**FRs implemented:** FR22, FR23, FR24

**Acceptance Criteria:

**Given** giỏ hàng hợp lệ
**When** khách hàng đi qua bước checkout
**Then** hệ thống cho phép chọn địa chỉ, phương thức vận chuyển và tính tổng tiền chính xác
**And** form checkout tuân thủ pattern validation + accessibility đã chốt.

### Story 4.3: Tạo đơn hàng và thanh toán online/COD

As a khách hàng,
I want đặt hàng và thanh toán bằng online hoặc COD,
So that tôi hoàn tất giao dịch theo phương thức mong muốn.

**FRs implemented:** FR25, FR26, FR31

**Acceptance Criteria:

**Given** khách hàng đã xác nhận checkout
**When** khách hàng đặt hàng và chọn phương thức thanh toán
**Then** hệ thống tạo đơn hàng hợp lệ và khởi tạo giao dịch thanh toán tương ứng
**And** lưu lịch sử giao dịch gắn với order để truy vết.

### Story 4.4: Xử lý callback payment, trạng thái pending và retry

As a khách hàng,
I want biết rõ trạng thái thanh toán và có thể thanh toán lại,
So that tôi không bị mơ hồ khi giao dịch lỗi/chậm.

**FRs implemented:** FR27, FR28, FR29, FR30

**Acceptance Criteria:

**Given** giao dịch có callback đến chậm hoặc thất bại
**When** hệ thống nhận/đối soát trạng thái payment
**Then** đơn hàng chuyển đúng trạng thái success/pending/failed
**And** khách hàng có hành động retry rõ ràng khi giao dịch thất bại.

### Story 4.5: PaymentStatusTimeline cho post-checkout clarity

As a khách hàng,
I want xem timeline trạng thái thanh toán sau đặt hàng,
So that tôi biết bước tiếp theo cần làm gì.

**FRs implemented:** FR28, FR30

**Acceptance Criteria:

**Given** khách hàng ở trang xác nhận đơn hoặc chi tiết đơn
**When** trạng thái thanh toán thay đổi
**Then** timeline hiển thị label trạng thái, timestamp, next action nhất quán
**And** thông điệp trạng thái không phụ thuộc chỉ vào màu sắc.

## Epic 5: Minh bạch trạng thái đơn và vận hành giao nhận

Khách hàng theo dõi đơn; kho vận xử lý hàng đợi, đóng gói, tạo vận đơn, đồng bộ tracking/fallback.

### Story 5.1: Khách hàng xem danh sách và chi tiết đơn hàng

As a khách hàng,
I want truy cập lịch sử đơn và chi tiết đơn,
So that tôi theo dõi được tiến trình mua sắm của mình.

**Acceptance Criteria:**

**Given** khách hàng đã đăng nhập
**When** khách hàng mở trang đơn hàng
**Then** hệ thống hiển thị danh sách đơn và chi tiết từng đơn đúng quyền truy cập
**And** dữ liệu đơn có trạng thái nhất quán với backend order state machine.

### Story 5.2: Theo dõi trạng thái đơn và tracking number

As a khách hàng,
I want thấy trạng thái xử lý và mã tracking,
So that tôi biết đơn đang ở đâu trong quá trình giao nhận.

**Acceptance Criteria:**

**Given** đơn đã được xử lý ở kho hoặc đơn vị vận chuyển
**When** thông tin tracking được cập nhật
**Then** trang tracking hiển thị trạng thái mới trong SLA đồng bộ theo NFR
**And** fallback polling hoạt động khi realtime channel không ổn định.

### Story 5.3: Warehouse queue xử lý đóng gói và tạo vận đơn

As a nhân viên kho,
I want xử lý đơn theo hàng đợi và tạo vận đơn,
So that đơn được bàn giao nhanh và đúng quy trình.

**Acceptance Criteria:**

**Given** có đơn đủ điều kiện xử lý tại kho
**When** nhân viên kho pick/pack và gửi yêu cầu vận chuyển
**Then** hệ thống cập nhật trạng thái đơn theo các bước kho vận chuẩn
**And** lưu lại tracking number khi tạo vận đơn thành công.

### Story 5.4: Fallback trạng thái vận chuyển khi tích hợp lỗi

As a hệ thống vận hành,
I want có cơ chế dự phòng khi shipping API gián đoạn,
So that tracking không bị mất và luồng demo vẫn hoạt động.

**Acceptance Criteria:**

**Given** tích hợp vận chuyển lỗi hoặc timeout
**When** hệ thống không lấy được trạng thái mới từ provider
**Then** hệ thống giữ trạng thái ổn định với cờ cảnh báo và retry theo policy
**And** không làm hỏng tiến trình theo dõi đơn của khách hàng.

## Epic 6: Vận hành quản trị và báo cáo

Admin quản lý sản phẩm/đơn bất thường và theo dõi KPI/báo cáo phục vụ vận hành + nghiên cứu.

### Story 6.1: Quản lý sản phẩm và vòng đời trạng thái đơn

As a admin,
I want tạo/cập nhật/ngừng kích hoạt sản phẩm và quản lý trạng thái đơn,
So that vận hành catalog và order lifecycle ổn định.

**Acceptance Criteria:**

**Given** admin có quyền truy cập khu vực quản trị
**When** admin chỉnh sửa sản phẩm hoặc cập nhật trạng thái đơn
**Then** hệ thống lưu thay đổi hợp lệ theo business rules
**And** chặn các chuyển trạng thái đơn không hợp lệ.

### Story 6.2: Xử lý đơn bất thường và bảng KPI vận hành

As a admin,
I want theo dõi đơn bất thường và dashboard KPI,
So that tôi phát hiện sớm vấn đề vận hành.

**Acceptance Criteria:**

**Given** dữ liệu đơn/giao dịch đã phát sinh
**When** admin mở dashboard và danh sách ngoại lệ
**Then** hệ thống hiển thị tối thiểu 5 KPI theo bộ lọc thời gian
**And** cung cấp danh sách đơn bất thường để xử lý có ưu tiên.

### Story 6.3: Xuất báo cáo và log truy vết nghiệp vụ

As a admin,
I want xuất báo cáo CSV/PDF và tra cứu log,
So that tôi có dữ liệu phục vụ phân tích và đối soát.

**Acceptance Criteria:**

**Given** admin chọn khoảng thời gian báo cáo
**When** admin thực hiện xuất dữ liệu
**Then** hệ thống tạo báo cáo doanh thu/đơn/giao dịch theo định dạng yêu cầu
**And** log nghiệp vụ chính có thể truy vết theo correlation context.

## Epic 7: Độ bền tích hợp và khả năng chuyển môi trường

Hệ thống vận hành ổn định qua sandbox/mock/real với timeout-retry-reconcile-fallback xuyên phân hệ.

### Story 7.1: Cấu hình endpoint sandbox/mock/real theo môi trường

As a kỹ sư triển khai,
I want chuyển endpoint tích hợp bằng config,
So that luồng nghiệp vụ không phải sửa code khi đổi môi trường.

**Acceptance Criteria:**

**Given** hệ thống chạy ở các môi trường khác nhau
**When** cấu hình endpoint AI/payment/shipping thay đổi
**Then** ứng dụng sử dụng đúng endpoint theo môi trường
**And** không thay đổi contract nghiệp vụ ở layer service.

### Story 7.2: Timeout, retry và chuẩn hóa lỗi tích hợp

As a hệ thống tích hợp,
I want có policy timeout/retry và error schema nhất quán,
So that giảm lỗi gián đoạn và dễ debug vận hành.

**Acceptance Criteria:**

**Given** provider ngoài phản hồi chậm hoặc lỗi tạm thời
**When** request tích hợp được thực thi
**Then** hệ thống áp policy timeout/retry theo cấu hình
**And** trả lỗi theo format chuẩn có correlationId để truy vết.

### Story 7.3: Reconciliation trạng thái payment-warehouse-shipping

As a hệ thống vận hành,
I want đối soát trạng thái liên phân hệ định kỳ,
So that dữ liệu order và transaction luôn nhất quán.

**Acceptance Criteria:**

**Given** có khả năng lệch trạng thái do callback trễ hoặc lỗi mạng
**When** job reconciliation chạy
**Then** hệ thống phát hiện sai lệch và cập nhật theo policy đã định
**And** ghi nhận kết quả đối soát để audit và theo dõi.

### Story 7.4: Fallback đảm bảo demo end-to-end liên tục

As a nhóm dự án,
I want cơ chế fallback cho luồng core khi provider gián đoạn,
So that vẫn trình diễn được hành trình end-to-end ổn định.

**Acceptance Criteria:**

**Given** một hoặc nhiều tích hợp ngoài không khả dụng
**When** người dùng thực hiện luồng chính từ khám phá đến theo dõi đơn
**Then** hệ thống kích hoạt fallback tương ứng mà không dừng toàn bộ hành trình
**And** thông báo trạng thái rõ ràng cho người dùng và vận hành.

## Execution Runbook (Mô hình 2 vai trò)

### Phân vai cố định

- **Role A (Frontend):** chịu trách nhiệm toàn bộ UI/UX implementation, tích hợp API vào màn hình, xử lý trạng thái loading/error/empty, accessibility ở lớp giao diện.
- **Role B (Core):** chịu trách nhiệm toàn bộ phần còn lại gồm backend, database, AI integration, payment/shipping integration, reliability jobs, và QA automation cơ bản.

### Phân công theo wave

| Wave | Role B (Core) triển khai chính | Role A (Frontend) triển khai song song |
|---|---|---|
| W0 (Epic 1) | 1.1, 1.2, 1.3, 1.4 | Dựng shell UI + auth/profile screens theo contract/mock |
| W1 (Epic 2) | 2.1, 2.2 | 2.3 |
| W2 (Epic 4) | 4.1, 4.3, 4.4 | 4.2, 4.5 |
| W3 (Epic 3) | 3.1, 3.2, 3.3 | 3.4 |
| W4 (Epic 5 + 6) | 5.3, 5.4, 6.1, 6.3 | 5.1, 5.2, 6.2 |
| W5 (Epic 7) | 7.1, 7.2, 7.3, 7.4 | Polish recovery/status UI theo contract |

### Quy trình bàn giao bắt buộc giữa 2 vai trò

Mỗi story khi chuyển từ Core sang Frontend hoặc QA phải có đầy đủ:

1. Story ID + FRs implemented.
2. API contract (endpoint, request/response, error code).
3. Payload mẫu thành công/thất bại.
4. Ghi chú dependency và known issues.
5. Evidence AC pass ở phạm vi role hiện tại.

### Luật vận hành hằng ngày

- Daily 15 phút: chốt story kéo trong ngày + blockers.
- Midday sync 10 phút: cập nhật thay đổi contract và ảnh hưởng tích hợp.
- EOD 15 phút: cập nhật trạng thái board + handoff note cho story đang chuyển pha.

### Điều kiện chuyển wave

Chỉ chuyển wave khi thỏa cả 3 điều kiện:

- Ít nhất 80% story của wave hiện tại đã Done.
- Critical-path story của wave đã Done.
- Không còn blocker mức cao chưa có owner xử lý.
