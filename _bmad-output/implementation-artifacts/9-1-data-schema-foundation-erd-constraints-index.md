---
epic: "9"
story_id: "9.1"
title: "Data schema foundation (ERD, constraints, index)"
status: "done"
context:
  - "{project-root}/_bmad-output/planning-artifacts/prd.md"
  - "{project-root}/_bmad-output/planning-artifacts/architecture.md"
  - "{project-root}/_bmad-output/planning-artifacts/epics.md"
  - "{project-root}/_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-15.md"
  - "{project-root}/tmdt/CLAUDE.md"
---

# Story 9.1: Data schema foundation (ERD, constraints, index)

## Tóm tắt Story (Story Foundation)

**User Story Statement:**
As a core backend engineer,
I want thiết kế schema dữ liệu quan hệ (ERD + constraints + index) cho các domain cốt lõi,
So that hệ thống có source of truth rõ ràng để quản trị, đối soát và truy vết ổn định.

**Coverage:** Cross-cutting Epic 4/5/6/7 (data consistency, reporting, reconciliation, auditability)

**Acceptance Criteria:**
- **Given** hệ thống hiện có persistence pha trộn (in-memory + JSON file stores)
- **When** hoàn thành story data foundation
- **Then** có ERD và schema quan hệ cho tối thiểu các domain: identity, catalog, cart, order, payment, shipping, audit-log
- **And** mỗi bảng có PK/FK, unique constraints, check constraints cần thiết và index strategy rõ theo truy vấn nghiệp vụ hiện tại
- **And** chuẩn đặt tên và mapping dữ liệu tuân thủ kiến trúc (DB `snake_case` ↔ API `camelCase`)
- **And** có tài liệu quyết định transaction boundaries cho các luồng nhạy cảm (place order, payment callback, reconciliation)
- **And** schema thiết kế không phá vỡ API contract hiện tại và có đường dẫn migration cho story 9.2+

---

## Technical Context & Developer Guardrails

### 1) Hiện trạng cần xử lý ngay
- Catalog đang in-memory: `tmdt/src/modules/catalog/product-store.js`.
- Order đang JSON file store: `tmdt/src/modules/order/order-store.js`.
- Payment đang JSON file store: `tmdt/src/modules/payment/payment-store.js`.
- Session đang in-memory map theo hiện trạng dự án: `tmdt/CLAUDE.md`.

### 2) Kiến trúc bắt buộc tuân thủ
- Prisma schema là source of truth cho persistence model.
  [Source: `_bmad-output/planning-artifacts/architecture.md` – Data Boundaries]
- DB naming conventions:
  - Table: `snake_case` số nhiều
  - Column: `snake_case`
  - FK: `<referenced_table_singular>_id`
  - Index: `idx_<table>_<column_list>`
  [Source: `_bmad-output/planning-artifacts/architecture.md` – Naming Patterns]
- Data exchange rules:
  - API: `camelCase`
  - DB: `snake_case`
  - Datetime: ISO-8601 UTC
  - Money: integer minor unit (không dùng float)
  [Source: `_bmad-output/planning-artifacts/architecture.md` – Format Patterns]

### 3) Scope thiết kế của Story 9.1
**Trong scope (thiết kế + định nghĩa chuẩn):**
- Xác định entity/table cốt lõi:
  - `users`, `sessions` (nếu đưa vào DB phase sau), `addresses`
  - `products`, `product_variants`, `inventory_movements` (nếu cần)
  - `carts`, `cart_items`
  - `orders`, `order_items`
  - `payment_transactions`, `payment_callbacks` (hoặc log tương đương)
  - `shipments`, `shipment_events`
  - `audit_logs`
- Xác định quan hệ, cardinality, deletion/update policy.
- Xác định constraints:
  - unique (vd: email, slug, idempotency keys)
  - check (status enum hợp lệ, amount >= 0)
  - FK integrity cho order/payment/shipping chain.
- Xác định index strategy theo truy vấn thực tế:
  - admin KPI/report filters theo thời gian
  - order tracking theo `user_id`, `order_id`, `status`, `updated_at`
  - payment callback lookup theo provider reference/idempotency key
  - reconciliation scans theo trạng thái + thời gian.
- Chốt transaction boundaries trên giấy cho luồng:
  - place order + create payment transaction
  - payment callback reconcile
  - shipment status updates.

**Ngoài scope (để story sau):**
- Viết migration thực thi (Story 9.2)
- Refactor repository code (Story 9.3, 9.4)
- Cutover/decommission store tạm (Story 9.5)

### 4) Security & reliability guardrails
- Bảo toàn auditability cho hành động quản trị và state change quan trọng (NFR7, FR45).
- Thiết kế để hỗ trợ reconciliation định kỳ (NFR13, FR48, FR49).
- Tất cả key cho idempotency/callback phải có unique strategy ở DB layer.

### 5) Không được làm
- Không đổi API response contract hiện tại.
- Không gộp implementation migration vào story này.
- Không thêm dependency framework ngoài hướng kiến trúc đã chọn.

---

## Intelligence từ sprint change đã duyệt
- Story này là bước đầu của Epic 9 theo proposal đã approved.
- Mục tiêu là loại bỏ rủi ro quản trị từ nền dữ liệu tạm, trước khi tiếp tục hardening Epic 6/7.
- Deferred work hiện có chỉ ra nhiều vấn đề liên quan tính bền vững dữ liệu và multi-instance; schema phải giải quyết được hướng mở rộng đó.

[Source: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-15.md`, `_bmad-output/implementation-artifacts/deferred-work.md`]

---

## Implementation Tasks (cho dev-story 9.1)

- [x] **Task 1: Thu thập và chuẩn hóa domain model hiện tại**
  - [x] Liệt kê data shape đang dùng trong `identity/catalog/cart/order/payment/shipping/admin`.
  - [x] Chuẩn hóa glossary entity + status enums dùng chung.

- [x] **Task 2: Thiết kế ERD v1 cho domain cốt lõi**
  - [x] Dựng ERD thể hiện đủ entity + quan hệ + cardinality.
  - [x] Xác định ownership boundary theo module (`src/modules/*`).

- [x] **Task 3: Định nghĩa constraints và index strategy**
  - [x] Khai báo PK/FK/unique/check theo từng bảng.
  - [x] Định nghĩa index theo truy vấn nghiệp vụ hiện tại (admin KPI/report/tracking/reconcile).

- [x] **Task 4: Định nghĩa transaction boundaries và consistency rules**
  - [x] Ghi rõ transaction unit cho place order/payment/reconcile/shipment update.
  - [x] Đưa ra nguyên tắc rollback/compensation ở mức design.

- [x] **Task 5: Tạo tài liệu schema foundation để bàn giao story 9.2**
  - [x] Xuất tài liệu thiết kế (ERD + table specs + constraints/index + transaction notes).
  - [x] Kèm mapping guide `snake_case` DB ↔ `camelCase` API.
  - [x] Kèm checklist ready cho migration implementation ở 9.2.

### Review Findings

- [x] [Review][Patch] Áp dụng quyết định: dùng `id (uuid)` làm PK chính cho `sessions`, giữ `token_hash` unique (không dùng token làm PK) [9-1-schema-foundation-design.md:182]
- [x] [Review][Patch] Áp dụng quyết định: scope uniqueness payment theo provider (provider_reference và callback idempotency không để unique toàn cục) [9-1-schema-foundation-design.md:364]

- [x] [Review][Patch] Sửa sai lệch mô tả session store hiện trạng để khớp project context [9-1-schema-foundation-design.md:13]
- [x] [Review][Patch] Chuẩn hóa tên FK `requested_by` theo convention `<referenced_table_singular>_id` [9-1-schema-foundation-design.md:453]
- [x] [Review][Patch] Bổ sung/ghi rõ ràng ràng buộc consistency giữa `payment_callbacks.order_id` và `payment_transactions.order_id` [9-1-schema-foundation-design.md:378]
- [x] [Review][Patch] Bổ sung rule consistency cho công thức tổng tiền order (`total_minor`) thay vì chỉ non-negative [9-1-schema-foundation-design.md:318]
- [x] [Review][Patch] Làm rõ mapping money field API để tránh hiểu sai major/minor unit ở `shippingFee` [9-1-schema-foundation-design.md:540]
- [x] [Review][Patch] Bổ sung note tương thích dữ liệu trạng thái `canceled`/`cancelled` cho migration [9-1-schema-foundation-design.md:70]
- [x] [Review][Patch] Đồng bộ lại sprint-status cho phạm vi review story 9.1 để tránh drift trạng thái ngoài scope [sprint-status.yaml:74]

---

## Testing & Verification Requirements
- Kiểm tra chéo coverage FR/NFR liên quan dữ liệu:
  - FR43/FR44/FR45 (admin KPI/report/log)
  - FR48/FR49 + NFR10/NFR13 (reconciliation/consistency)
- Validate design review checklist:
  - Không orphan FK
  - Có index cho truy vấn nóng
  - Có unique/idempotency strategy cho payment callback
  - Có timestamp/audit fields nhất quán.

---

## References
- `_bmad-output/planning-artifacts/prd.md` (FR43-45, FR48-49, NFR10-13)
- `_bmad-output/planning-artifacts/architecture.md` (Naming/Format/Data Boundaries/Project Structure)
- `_bmad-output/planning-artifacts/epics.md` (Epic 9 context)
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-15.md` (approved change direction)
- `tmdt/CLAUDE.md` (current persistence model and constraints)

---

**Trạng thái Story:** `done`
**Completion note:** Đã hoàn tất tài liệu schema foundation cho Epic 9.1, bao gồm domain model hiện trạng, ERD v1, constraints/index strategy, transaction boundaries và mapping guide DB/API để bàn giao Story 9.2.

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Đối chiếu shape dữ liệu từ các store/service hiện tại trong `tmdt/src/modules/*` và API query patterns trong `tmdt/src/app/api/*`.
- Kiểm tra đồng bộ status story trong `sprint-status.yaml`.

### Completion Notes List

- Hoàn tất inventory data shape hiện trạng cho identity/catalog/cart/order/payment/shipping/admin.
- Chuẩn hóa glossary entity và status enums dùng chung cho order/payment/shipping/reporting.
- Hoàn tất ERD v1, ownership boundaries theo module, table specs với PK/FK/unique/check/index.
- Hoàn tất transaction boundaries cho các luồng nhạy cảm: place order, payment callback reconcile, shipment update.
- Hoàn tất mapping guide `snake_case` ↔ `camelCase` và checklist ready cho migration implementation Story 9.2.

### File List

- `_bmad-output/implementation-artifacts/9-1-data-schema-foundation-erd-constraints-index.md`
- `_bmad-output/implementation-artifacts/9-1-schema-foundation-design.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-15: Chuyển Story 9.1 sang `in-progress`, hoàn tất tài liệu thiết kế schema foundation, cập nhật task checklist đầy đủ và chuyển trạng thái sang `review`.
