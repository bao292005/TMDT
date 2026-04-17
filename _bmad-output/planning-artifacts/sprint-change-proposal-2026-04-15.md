# Sprint Change Proposal — Làm rõ Data Model và CSDL để tăng năng lực quản trị

**Ngày:** 2026-04-15
**Người yêu cầu:** bao
**Trigger stories:** 6.2, 6.3, 7.3
**Mode:** Batch

---

## 1) Issue Summary

### Problem statement
Trong implementation hiện tại, phần data đang vận hành theo mô hình tạm thời (in-memory + JSON files), chưa có CSDL quan hệ làm source of truth thống nhất. Điều này khiến năng lực quản trị, đối soát và truy vết ở các luồng admin/payment/order/warehouse khó mở rộng và dễ phát sinh sai lệch khi tăng độ phức tạp.

### Evidence
- Catalog dùng in-memory seed: `tmdt/src/modules/catalog/product-store.js`.
- Order dùng JSON file store: `tmdt/src/modules/order/order-store.js`.
- Payment dùng JSON file store: `tmdt/src/modules/payment/payment-store.js`.
- Session vẫn in-memory theo ghi chú kiến trúc vận hành hiện tại: `tmdt/CLAUDE.md`.
- Deferred items đã nêu rủi ro persistence/reliability cho multi-instance và I/O JSON atomicity: `_bmad-output/implementation-artifacts/deferred-work.md`.

### Issue type classification
- **Technical limitation discovered during implementation** (Checklist 1.2).

---

## 2) Impact Analysis

## 2.1 Epic Impact

- **Epic 6 (Admin KPI/Reports):** bị ảnh hưởng trực tiếp vì cần aggregate/query ổn định, nhất quán theo thời gian.
- **Epic 7 (Reconciliation/Resilience):** bị ảnh hưởng trực tiếp vì reconciliation cần transaction boundaries và source of truth chuẩn.
- **Epic 4/5 (Order-Payment-Fulfillment):** bị ảnh hưởng gián tiếp do lifecycle order/payment/shipping phụ thuộc mạnh vào persistence model.
- **Epic 1 (Identity/Session):** bị ảnh hưởng gián tiếp nếu muốn production-like multi-instance (session store shared).

## 2.2 Artifact Conflicts

- **PRD:** có yêu cầu nhất quán dữ liệu, đối soát, logging (FR45/FR48/FR49) nhưng chưa khóa rõ “DB là bắt buộc cho phase quản trị/reconciliation”.
- **Architecture:** đã định hướng `prisma/schema.prisma` trong project structure, nhưng implementation thực tế chưa đồng bộ với định hướng này.
- **Epics/Stories:** chưa có story nền tảng dữ liệu chung để dẫn dắt migration theo phase.
- **UX:** không mâu thuẫn trực tiếp, nhưng quality của dashboard/report/timeline phụ thuộc backend data consistency.

## 2.3 Technical Impact

- Cần chuẩn hóa schema quan hệ cho Identity, Catalog, Cart, Order, Payment, Shipment, Audit.
- Cần repository abstraction để chuyển dần từ file/in-memory sang DB mà không phá vỡ API contract.
- Cần migration plan + seed + test strategy cho data layer.
- Cần cập nhật sprint sequencing để tránh implement tiếp các story phụ thuộc dữ liệu trên nền store tạm.

---

## 3) Path Forward Evaluation

### Option 1 — Direct Adjustment (Modify/Add Stories)
- **Viable:** Có.
- **Effort:** Medium-High.
- **Risk:** Medium.
- **Nhận định:** Thêm “data foundation wave” và migrate theo lát dọc (admin/report/reconcile trước), giữ API contract ổn định.

### Option 2 — Potential Rollback
- **Viable:** Không khuyến nghị.
- **Effort:** High.
- **Risk:** High.
- **Nhận định:** Rollback các story đã làm xong gây mất momentum, không cần thiết nếu có migration plan phù hợp.

### Option 3 — PRD MVP Review (Reduce Scope)
- **Viable:** Có thể, nhưng không tối ưu.
- **Effort:** Medium.
- **Risk:** Medium.
- **Nhận định:** Giảm scope quản trị để né DB sẽ đi ngược mục tiêu bạn vừa nêu (dễ quản trị hơn).

### Recommended Approach
- **Chọn:** **Hybrid nghiêng Option 1 (Direct Adjustment + backlog re-sequencing)**.
- **Lý do:** Giữ được tiến độ, không phá scope MVP, đồng thời giải quyết đúng gốc vấn đề data clarity + admin operability.

---

## 4) Detailed Change Proposals (Batch)

## 4.1 Story/Epic Changes

### Proposal S1 — Thêm Epic mới về Data Foundation

**Artifact:** `epics.md`
**Section:** Epic list + chi tiết stories

**OLD:**
- Chưa có epic riêng cho nền tảng dữ liệu và migration persistence.

**NEW:**
- Thêm **Epic 9: Data Foundation & Persistence Standardization** với các stories:
  - **9.1**: Thiết kế schema quan hệ (ERD + constraints + index) cho identity/catalog/order/payment/shipping/audit.
  - **9.2**: Setup ORM + migration baseline + seed dữ liệu mẫu.
  - **9.3**: Refactor repository cho order/payment (ưu tiên luồng admin KPI/report/reconcile).
  - **9.4**: Refactor catalog/cart và chuẩn hóa transaction boundaries.
  - **9.5**: Data migration + backward compatibility window + cutover plan.

**Rationale:**
Tạo điểm neo chính thức trong backlog để thống nhất data architecture trước khi mở rộng quản trị/reconciliation.

---

### Proposal S2 — Cập nhật thứ tự ưu tiên sprint

**Artifact:** `sprint-status.yaml`
**Section:** development_status sequencing

**OLD:**
- Epic 6/7 tiếp tục theo flow hiện tại, chưa có gate data foundation.

**NEW:**
- Đưa Epic 9 thành **in-progress** ngay sau khi duyệt proposal.
- Đặt **dependency mềm**: các hạng mục còn lại của Epic 6/7 liên quan aggregate/reconcile chỉ chuyển done sau khi 9.2 + 9.3 hoàn tất.

**Rationale:**
Tránh “xây trên nền tạm”, giảm rework cho báo cáo/KPI/reconciliation.

---

## 4.2 PRD Changes

### Proposal P1 — Làm rõ yêu cầu persistence cho năng lực quản trị

**Artifact:** `prd.md`
**Section:** Functional Requirements + Technical Success + Non-Functional Reliability

**OLD (ý hiện tại):**
- Nhấn mạnh nhất quán dữ liệu, đối soát, logging nhưng chưa chốt rõ data store chuẩn cho phase quản trị nâng cao.

**NEW (bổ sung):**
- Thêm yêu cầu rõ:
  - “Các capability admin KPI/reporting/reconciliation bắt buộc dùng persistence quan hệ làm source of truth.”
  - “File/in-memory store chỉ dùng cho prototype cục bộ hoặc test fixtures, không phải nguồn dữ liệu vận hành chính.”

**Rationale:**
Đồng bộ kỳ vọng business với năng lực kỹ thuật cần có để quản trị hiệu quả.

---

## 4.3 Architecture Changes

### Proposal A1 — Chốt migration architecture thay vì để song song mơ hồ

**Artifact:** `architecture.md`
**Section:** Data Boundaries, Project Structure, Implementation Readiness

**OLD:**
- Có định hướng Prisma/schema trong structure, nhưng chưa có kế hoạch migration cụ thể từ store tạm.

**NEW:**
- Bổ sung kiến trúc migration 3-phase:
  1. **Coexistence phase:** repository dual-read (nếu cần), write vào DB làm nguồn chuẩn.
  2. **Cutover phase:** API/services đọc từ DB hoàn toàn.
  3. **Decommission phase:** loại bỏ file/in-memory stores khỏi production path.
- Bổ sung decision cho transaction boundaries (order + payment + reconciliation).

**Rationale:**
Làm rõ đường đi kỹ thuật, giảm rủi ro thay đổi lớn giữa sprint.

---

## 4.4 UX Spec Changes

### Proposal U1 — Bổ sung trạng thái dữ liệu quản trị

**Artifact:** `ux-design-specification.md`
**Section:** Admin dashboard/reporting/exceptions states

**OLD:**
- Đã có loading/empty/error, nhưng chưa phân biệt rõ “data delayed vs data unavailable vs partial consistency”.

**NEW:**
- Thêm trạng thái UX cho admin:
  - `data-syncing` (đang đồng bộ),
  - `partial-data` (một phần dữ liệu tạm thời chưa sẵn),
  - `reconciliation-required` (cần đối soát).

**Rationale:**
Khi chuyển sang DB + jobs reconciliation, trạng thái vận hành cần minh bạch hơn cho admin.

---

## 5) MVP Impact & Implementation Handoff

### MVP impact
- **Không giảm scope MVP.**
- **Có thay đổi sequencing:** ưu tiên data foundation trước các phần quản trị/reconciliation sâu.

### Scope classification
- **Moderate** (cần backlog reorganization + PO/SM coordination).

### Handoff recipients & responsibilities
- **PO/SM:** cập nhật epics/stories, resequence sprint.
- **Architect:** chốt schema + migration strategy + transaction boundaries.
- **Dev/Core:** triển khai ORM/migrations/repositories theo phase.
- **QA:** bổ sung test matrix cho data integrity, migration safety, reconciliation correctness.

### Success criteria
1. Có schema dữ liệu chuẩn + migration baseline chạy ổn định.
2. Luồng admin KPI/report/reconcile đọc từ DB và pass test.
3. API contract bên ngoài không bị phá vỡ.
4. Có kế hoạch loại bỏ dần store tạm khỏi production path.

---

## 6) Checklist Status Summary

- **1. Understand trigger/context:** [x] Done
- **2. Epic impact assessment:** [x] Done
- **3. Artifact conflict analysis:** [x] Done
- **4. Path forward evaluation:** [x] Done
- **5. Proposal components:** [x] Done
- **6. Final review/handoff:** [!] Action-needed (chờ user approval)

---

## 7) Next Step (Pending Approval)

Sau khi bạn phê duyệt proposal này, bước tiếp theo là:
1) Cập nhật `epics.md` theo Epic 9 + dependencies,
2) Cập nhật `sprint-status.yaml`,
3) Tạo story đầu tiên cho implementation wave mới (đề xuất: **Story 9.1 - Data Schema Foundation**).
