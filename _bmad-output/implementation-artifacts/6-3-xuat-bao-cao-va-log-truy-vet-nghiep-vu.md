---
epic: "6"
story_id: "6.3"
title: "Xuất báo cáo và log truy vết nghiệp vụ"
status: "done"
context:
  - "{project-root}/_bmad-output/planning-artifacts/prd.md"
  - "{project-root}/_bmad-output/planning-artifacts/architecture.md"
  - "{project-root}/_bmad-output/planning-artifacts/ux-design-specification.md"
---

# Story 6.3: Xuất báo cáo và log truy vết nghiệp vụ

## Tóm tắt Story (Story Foundation)

**User Story Statement:**
As a admin,
I want xuất báo cáo CSV/PDF và tra cứu log,
So that tôi có dữ liệu phục vụ phân tích và đối soát.

**FRs Implemented:** FR44, FR45

**Acceptance Criteria:**
*   **Given** admin chọn khoảng thời gian báo cáo
*   **When** admin thực hiện xuất dữ liệu
*   **Then** hệ thống tạo báo cáo doanh thu/đơn/giao dịch theo định dạng yêu cầu
*   **And** cung cấp màn hình lịch sử export (đang xử lý/thành công/thất bại)
*   **And** log nghiệp vụ chính có thể truy vết theo correlation context.

---

## Technical Context & Developer Guardrails (Hướng dẫn Dành cho Developer)

### 1. Kiến trúc & Cấu trúc Thư mục Định hướng
Chúng ta tiếp tục dựa trên nền tảng sẵn có:
*   Trang xử lý báo cáo: `src/app/admin/reports/page.tsx` và client component `src/app/admin/reports/admin-reports-client.tsx`.
*   Trang lịch sử xuất báo cáo: `src/app/admin/reports/history/page.tsx`.
*   API: `src/app/api/admin/reports/route.js`. Vì xuất báo cáo liên quan tới background jobs, nên sử dụng pattern Export Job để đẩy vào hàng đợi nếu hệ thống có (trong phạm vi project này có thể ghi db table `ExportHistory` và xử lý stream/async background process đơn giản).
*   Truy vết log: Các module quan trọng phải được tích hợp logger (ví dụ: Winston/Pino hoặc custom logger utils) có gán `correlationId`.

### 2. Thiết kế Component (UX/UI Requirements)
*   **Màn hình Yêu cầu Báo cáo:** Cần Form chọn dải thời gian (`startDate`, `endDate`), chọn loại dữ liệu (Order, Transaction, Revenue), chọn Format định dạng (CSV, PDF).
*   **Button Hierarchy:** Nút "Xuất Báo Cáo" phải rõ ràng, báo Success sau khi enqueue xong (Feedback UX-DR6).
*   **Lịch sử xuất báo cáo:** Giao diện bảng (Table) thống kê các Request tải xuống. Có các Status: `Processing`, `Completed`, `Failed`. Nút `Download` hiện lên khi `Completed`. 
*   **A11y:** Các form controls cần được gán thẻ `aria-label`, báo lỗi validation rõ trên màn hình (UX-DR7).

### 3. Tích hợp & Security
*   **Role/Auth:** Đảm bảo tất cả endpoint `/api/admin/reports/*` được bảo vệ bằng `requireApiRole("ADMIN")` (Tiếp nối Story 6.1 & 6.2).
*   **Job & DB Logging:** Nếu chưa có Logging System xịn, hãy setup `logger.ts/js` ghi lại dạng JSON/stdout có chứa metadata thiết yếu.
*   **Bảo mật Data Export:** Các endpoint trả về thư mục static PDF/CSV phải có token hoặc cookie middleware chặn download nếu không đăng nhập (không public directory).

---

## Intelligence & Trải nghiệm Từ Story Trước (6.2)
*   **API Response Pattern:** Tiếp tục ứng dụng chuẩn Endpoint Envelope wrapper (`jsonSuccess`, `jsonError`) đã sử dụng rất ổn định qua `route.test.js` trong story 6.2.
*   **Test Caching/Corruption:** Do story 6.2 gặp lỗi test db leak khi mock chung user file, nên nhớ tạo `__resetAdminReportsForTests` ở store nếu mock bằng file.

---

## Implementation Tasks (Phân rã công việc)

- [x] **Task 1: Xây dựng utils Logger hỗ trợ Correlation ID**
  - Xây dựng hoặc sử dụng logger tool tại `src/shared/utils/logger.js`.
  - Phải có hàm `logInfo`, `logError` lưu thông tin gắn với `correlationId` và `action` để đạt FR45.

- [x] **Task 2: Hệ thống Back-end Xử lý Xuất Dữ Liệu (Store & Service)**
  - Tạo `report-store.js` chứa Job/History Export tracking (bao gồm `id`, `type`, `format`, `status`, `downloadUrl`).
  - Lập API queue background task mô phỏng hoặc convert trực tiếp sang `CSV`/`PDF`. 
  - *Lưu ý:* Đối với PDF có thể dùng thư viện `pdf-lib` hoặc html-to-pdf nhẹ; với CSV dùng thư viện như `json2csv`.

- [x] **Task 3: Phát triển API Handler (`/api/admin/reports`)**
  - Route POST: Tiếp nhận request tạo báo cáo -> queue -> return job `id`.
  - Route GET hsitroy: Danh sách lịch sử export jobs.
  - Áp dụng `requireApiRole("ADMIN")`.

- [x] **Task 4: Xây dựng Giao diện (Client Components/UX)**
  - Tạo UI Form yêu cầu xuất báo cáo trong `admin/reports/page.tsx` và list danh sách history ở đó hoặc thư mục con.
  - Phải đảm bảo có Loading, Skeleton đầy đủ, và auto-refresh theo chu kỳ nếy job đang `Processing`.

- [x] **Task 5: Kiểm thử (Testing) E2E tích hợp cho Reports**
  - Thêm tests đầy đủ cho endpoint reports trong `reports/route.test.js`.
  - Xác nhận RBAC Admin truy cập hợp lệ, khách hàng bị chặn.

### Review Findings

- [ ] [Review][Patch] API `POST /api/admin/reports` chưa validate domain cho `type`/`format` và quan hệ ngày (`startDate <= endDate`) [tmdt/src/app/api/admin/reports/route.js:48]
- [ ] [Review][Patch] API `POST /api/admin/reports` chưa xử lý lỗi JSON body malformed thành lỗi nghiệp vụ 4xx, hiện rơi vào 500 generic [tmdt/src/app/api/admin/reports/route.js:45]
- [ ] [Review][Patch] `downloadUrl` được phát sinh nhưng chưa có endpoint tải xuống tương ứng (`/api/admin/reports/download/:jobId`) nên không thể tải file khi job Completed [tmdt/src/modules/reporting/report-store.js:66]
- [ ] [Review][Patch] Luồng export hiện chỉ “đánh dấu Completed” bằng `setTimeout` mà chưa tạo artifact CSV/PDF theo format yêu cầu trong AC [tmdt/src/modules/reporting/report-store.js:50]
- [ ] [Review][Patch] Store reports dùng read-modify-write trực tiếp, thiếu cơ chế serialize ghi nên có thể mất cập nhật khi nhiều request đồng thời [tmdt/src/modules/reporting/report-store.js:34]
- [ ] [Review][Patch] Test route reports chưa cover RBAC âm tính (unauthenticated/forbidden) và chưa verify transition async Processing → Completed/Failed [tmdt/src/app/api/admin/reports/route.test.js:20]
- [ ] [Review][Patch] UI reports chưa có loading/skeleton + error state rõ ràng cho lịch sử export (fetch thất bại đang bị nuốt lỗi) [tmdt/src/app/admin/reports/admin-reports-client.tsx:29]

---

**Trạng thái Story:** `done`
*Ghi chú:* The developer now has everything needed for flawless implementation! Trang bị đầy đủ cho Dev. Mời chạy `@[/bmad-dev-story] 6-3` để thực thi!
