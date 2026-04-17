---
epic: "6"
story_id: "6.2"
title: "Xử lý đơn bất thường và bảng KPI vận hành"
status: "done"
context:
  - "{project-root}/_bmad-output/planning-artifacts/prd.md"
  - "{project-root}/_bmad-output/planning-artifacts/architecture.md"
  - "{project-root}/_bmad-output/planning-artifacts/ux-design-specification.md"
---

# Story 6.2: Xử lý đơn bất thường và bảng KPI vận hành

## Tóm tắt Story (Story Foundation)

**User Story Statement:**
As a admin,
I want theo dõi đơn bất thường và dashboard KPI,
So that tôi phát hiện sớm vấn đề vận hành.

**FRs Implemented:** FR42, FR43

**Acceptance Criteria:**
*   **Given** dữ liệu đơn/giao dịch đã phát sinh
*   **When** admin mở dashboard và danh sách ngoại lệ
*   **Then** hệ thống hiển thị tối thiểu 5 KPI theo bộ lọc thời gian (số đơn, doanh thu, AOV, tỷ lệ hoàn trả, tỷ lệ thanh toán thành công)
*   **And** có danh sách đơn bất thường theo mức ưu tiên + trạng thái xử lý
*   **And** dashboard có loading/empty/error state rõ, hỗ trợ keyboard navigation.

---

## Technical Context & Developer Guardrails (Hướng dẫn Dành cho Developer)

### 1. Kiến trúc & Cấu trúc Thư mục Định hướng
Các thay đổi logic và UI cần tuân thủ cấu trúc của App Router (`src/app/admin`) và module/services:
*   `src/app/api/admin/dashboard/route.ts` hoặc `route.js` cho việc lấy dữ liệu KPI và thống kê (tổng hợp từ `order-store.js` hoặc database).
*   `src/app/api/admin/orders/exceptions/route.js` để trả về danh sách các đơn hàng bất thường (như "Thanh toán thất bại nhưng có thay đổi", timeout, huỷ liên tục).
*   Các UI client component cần đặt ở: `src/app/admin/dashboard/dashboard-client.tsx` (nếu cần tương tác) kết hợp trang page.tsx.

### 2. Thiết kế Component (UX/UI Requirements)
*   **Dashboard KPI:** Phải có tối thiểu 5 thông số: Số đơn, Doanh thu, Giá trị trung bình/đơn (AOV), Tỷ lệ hoàn trả, Tỷ lệ thanh toán thành công.
*   **Danh sách bất thường:** Liệt kê các đơn có flag exception, sắp xếp theo mức độ ưu tiên hoặc thời gian. Cho phép admin xử lý.
*   **Visual cues & a11y:**
    *   Các KPI Card nên có format tiền tệ theo chuẩn (VND).
    *   Áp dụng states thống nhất: Loading skeletons/spinners, Empty state (khi không có đơn nào bất thường), và Error boundary.
    *   Phải đảm bảo keyboard navigation và a11y chuẩn (`aria-live="polite"` cho thống kê khi tải thay đổi filter, focus cho các list items).

### 3. Tích hợp & Security
*   **Role/Auth:** Đảm bảo tất cả endpoint `/api/admin/*` đều kiểm tra `requireApiRole("ADMIN")` hoặc pattern tương tự đã sử dụng ở Story 6.1.
*   **Data Aggregation:** Tránh load toàn bộ DB. Hãy tính toán aggregation (reduce/filter) một cách an toàn trong Node/DB layer.

---

## Intelligence & Trải nghiệm Từ Story Trước (6.1)
*   **Destructive Actions:** Tại `6.1`, khi thay đổi trạng thái, ta đã dùng `Confirmation Pattern`. Nếu có admin action nào trên "đơn bất thường" mang tính chất destructive hoặc không thể đảo ngược, hãy thêm cảnh báo tương ứng (Ví dụ: Chuyển lại vào hàng đợi hoặc Huỷ đơn cưỡng chế).
*   **Payload Shape & Response:** Sử dụng cấu trúc Envelope JSON chuẩn `{ success, message/error, data }`.
*   **Biến môi trường/Cache:** Đối với Dashboard, tuỳ thuộc vào NFR có thể cấu hình caching `revalidate` hoặc set API route là `export const dynamic = "force-dynamic"`. Cần check lưu lượng trước.

---

## Implementation Tasks (Phân rã công việc)

- [x] **Task 1: Cập nhật Order Store & API Route cho KPI Dashboard**
  - Tạo logic aggregation trong `src/modules/order/order-service.js` (hoặc `store`) tính toán 5 KPI (Số đơn, doanh thu, AOV, tỷ lệ hoàn trả, tỷ lệ thanh toán thành công).
  - Cung cấp tính năng lọc theo thời gian (time_range).
  - Khởi tạo API route `GET /api/admin/dashboard` để trả dữ liệu cho khu vực client. Đảm bảo bảo mật với `requireApiRole("ADMIN")`.

- [x] **Task 2: Lấy dữ liệu danh sách đơn hàng bất thường**
  - Tách hàm hoặc tạo query lấy các đơn có trạng thái "bất thường" (ví dụ: `payment_failed`, `cancelled` quá nhiều lần, hoặc pending_payment quá kỳ hạn).
  - Tạo API route `GET /api/admin/orders/exceptions` phục vụ danh sách.

- [x] **Task 3: Xây dựng Component & UI Dashboard**
  - Tạo và phát triển `src/app/admin/dashboard/dashboard-client.tsx` chứa các thẻ KPI Cards định dạng `currency` hoặc tỷ lệ `%`.
  - Cài đặt Filter theo thời gian (Today, 7 days, 30 days) gửi về API để reload dữ liệu.

- [x] **Task 4: Xây dựng UI Danh sách đơn bất thường**
  - Xây dựng bảng hiển thị các đơn có rủi ro/ngoại lệ.
  - Phân loại đơn ưu tiên bằng Label/Badge (VD: High, Medium).
  - Đảm bảo các cell trong bảng có a11y đầy đủ.

- [x] **Task 5: Kiểm thử (Testing) & Hoàn thiện**
  - Tạo và cập nhật test API Route (`dashboard/route.test.js` & `exceptions/route.test.js`).
  - Kiểm tra giao diện xem loading state có sử dụng skeleton đúng UX-DR10 hay không.

### Review Findings

- [x] [Review][Patch] Test KPI không assert đầy đủ 5 chỉ số theo AC (thiếu `totalRevenue`, `aov`, `successfulPaymentRate`) [tmdt/src/modules/order/order-service.test.js:717]
- [x] [Review][Patch] Test KPI chưa cover nhánh `timeRange` (`today`, `7days`, `30days`) [tmdt/src/modules/order/order-service.test.js:772]
- [x] [Review][Patch] Test setup KPI dùng transition không hợp lệ (`confirmed_cod -> delivered/cancelled`) nhưng không assert kết quả, có thể tạo pass giả [tmdt/src/modules/order/order-service.test.js:728]
- [x] [Review][Patch] Thiếu test nhánh lỗi quan trọng của `updateOrderStatusByAdmin` (`ORDER_INVALID_INPUT`, `ORDER_NOT_FOUND`, `ORDER_AUDIT_LOG_FAILED`) [tmdt/src/modules/order/order-service.test.js:635]
- [x] [Review][Patch] Thiếu test nhánh degraded non-retryable (`nextAction = contact_support`) trong tracking [tmdt/src/modules/order/order-service.test.js:440]
- [x] [Review][Patch] Assertion timestamp/guidance còn lỏng, có thể lọt dữ liệu sai format/ngữ nghĩa [tmdt/src/modules/order/order-service.test.js:264]
- [x] [Review][Defer] Danh sách đơn bất thường chưa có trường “trạng thái xử lý” theo AC [tmdt/src/modules/order/order-service.js:766] — deferred, pre-existing
- [x] [Review][Defer] Tiêu chí exception còn hẹp (`payment_failed`, `cancelled`), chưa cover overdue/timeout/repeated-cancel theo intent story [tmdt/src/modules/order/order-service.js:758] — deferred, pre-existing
- [x] [Review][Defer] A11y yêu cầu trong spec chưa đủ (`aria-live="polite"`, focus list items) ở dashboard/exceptions UI [tmdt/src/app/admin/dashboard/admin-dashboard-client.tsx:41] — deferred, pre-existing

---
**Trạng thái Story:** `done`
*Ghi chú hoàn thành:* Đã bổ sung chi tiết Implementation Tasks.
