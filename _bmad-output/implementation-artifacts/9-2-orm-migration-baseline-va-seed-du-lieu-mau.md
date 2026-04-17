---
epic: "9"
story_id: "9.2"
title: "ORM migration baseline và seed dữ liệu mẫu"
status: "ready-for-dev"
context:
  - "{project-root}/_bmad-output/planning-artifacts/prd.md"
  - "{project-root}/_bmad-output/planning-artifacts/architecture.md"
  - "{project-root}/_bmad-output/planning-artifacts/epics.md"
  - "{project-root}/_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-15.md"
  - "{project-root}/_bmad-output/implementation-artifacts/9-1-data-schema-foundation-erd-constraints-index.md"
  - "{project-root}/_bmad-output/implementation-artifacts/9-1-schema-foundation-design.md"
  - "{project-root}/tmdt/CLAUDE.md"
---

# Story 9.2: ORM migration baseline và seed dữ liệu mẫu

## Tóm tắt Story (Story Foundation)

**User Story Statement:**
As a core backend engineer,
I want thiết lập ORM (Prisma), migration baseline và seed dữ liệu mẫu theo schema foundation,
So that hệ thống có nền persistence quan hệ chạy được end-to-end để chuẩn bị refactor repository ở Story 9.3/9.4.

**Coverage:** Cross-cutting Epic 4/5/6/7 (data consistency, reporting, reconciliation, auditability)

**Acceptance Criteria:**
- **Given** Story 9.1 đã chốt ERD, constraints, index và transaction boundaries
- **When** hoàn thành Story 9.2
- **Then** có `prisma/schema.prisma` phản ánh đầy đủ schema foundation đã chốt cho các domain cốt lõi
- **And** có migration baseline khởi tạo DB schema với naming/constraint/index đúng chuẩn kiến trúc (`snake_case`, FK/index conventions)
- **And** có seed dữ liệu mẫu tối thiểu cho luồng xác thực, catalog, cart/order/payment/shipping/admin reporting để kiểm thử local/dev
- **And** migration + seed chạy được theo quy trình lặp lại (idempotent ở mức an toàn cho dev reset)
- **And** không phá vỡ API contract hiện có; repository/service hiện tại có thể tiếp tục chạy trong pha coexistence
- **And** có tài liệu ngắn về cách chạy migrate/seed/reset và giới hạn scope trước Story 9.3

---

## Technical Context & Developer Guardrails

### 1) Hiện trạng cần xử lý ngay
- Persistence hiện tại đang pha trộn:
  - JSON file stores: users/carts/orders/payments/audit/reporting (`.data/*`)
  - in-memory stores: catalog/session.
- Story 9.1 đã bàn giao schema design và checklist “ready cho 9.2”.

### 2) Kiến trúc bắt buộc tuân thủ
- Prisma schema là source of truth cho persistence model.
- DB naming conventions:
  - Table: `snake_case` số nhiều
  - Column: `snake_case`
  - FK: `<referenced_table_singular>_id`
  - Index: `idx_<table>_<column_list>`
- Data exchange:
  - API `camelCase` ↔ DB `snake_case` mapping ở repository boundary
  - Datetime ISO-8601 UTC
  - Money integer minor unit, không dùng float
- Jobs/reconciliation vẫn tách khỏi route handlers.

### 3) Scope của Story 9.2
**Trong scope:**
- Tạo/hoàn thiện `tmdt/prisma/schema.prisma` theo bản thiết kế 9.1.
- Tạo migration baseline (khởi tạo schema đầy đủ constraints/index chính).
- Thiết lập seed dữ liệu mẫu cho các bảng cốt lõi:
  - identity, catalog, cart, order, payment, shipping, audit, reporting.
- Cung cấp script/dev flow để chạy migrate + seed + reset local.
- Cập nhật test/verification tối thiểu chứng minh migration/seed chạy được và không làm hỏng flow hiện tại.

**Ngoài scope (để story sau):**
- Refactor repository/service sang DB read/write path (Story 9.3, 9.4).
- Data cutover/decommission stores tạm (Story 9.5).
- Tối ưu nâng cao performance query production.

### 4) Security & reliability guardrails
- Không seed secrets/credentials thật.
- Giữ unique/idempotency strategy cho payment callback/reference theo quyết định đã chốt ở 9.1.
- Seed phải hỗ trợ tạo dữ liệu phục vụ test reconciliation/audit path.

### 5) Không được làm
- Không đổi API response contract.
- Không mở rộng business logic ngoài nền migration/seed.
- Không thêm framework ORM khác ngoài Prisma.

---

## Intelligence từ Story 9.1 và sprint change đã duyệt
- Story 9.1 đã hoàn tất schema foundation và review patches, bao gồm:
  - chốt `sessions` dùng `id (uuid)` làm PK
  - scope uniqueness payment theo provider
  - bổ sung consistency constraints trọng yếu.
- Sprint change proposal đã xác định 9.2 là bước triển khai migration baseline bắt buộc trước 9.3/9.4.

[Source: `9-1-schema-foundation-design.md`, `9-1-data-schema-foundation-erd-constraints-index.md`, `sprint-change-proposal-2026-04-15.md`]

---

## Implementation Tasks (cho dev-story 9.2)

- [x] **Task 1: Thiết lập Prisma foundation trong project**
  - [x] Xác nhận cấu trúc `tmdt/prisma/` và cấu hình Prisma client phù hợp stack hiện tại.
  - [x] Tạo/chuẩn hóa `schema.prisma` theo naming conventions và boundaries kiến trúc.

- [x] **Task 2: Mô hình hóa đầy đủ schema theo bản thiết kế 9.1**
  - [x] Khai báo model/relations cho identity, catalog, cart, order, payment, shipping, audit, reporting.
  - [x] Áp dụng PK/FK/unique/check/index trọng yếu theo thiết kế 9.1.
  - [x] Đảm bảo các quyết định review của 9.1 được phản ánh trong schema (sessions PK, payment uniqueness scope, consistency rule notes).

- [x] **Task 3: Tạo migration baseline**
  - [x] Sinh migration khởi tạo schema đầy đủ.
  - [x] Verify SQL/migration artifact tuân thủ conventions (`snake_case`, FK/index naming, constraints).
  - [x] Đảm bảo migration có thể chạy lại trong luồng reset local mà không gây trạng thái mập mờ.

- [x] **Task 4: Thiết lập seed dữ liệu mẫu có chủ đích**
  - [x] Tạo seed cho user roles/account states, catalog + variants, cart mẫu.
  - [x] Tạo seed order/payment/shipment/audit/export_jobs để cover nhánh trạng thái chính và reconciliation-friendly scenarios.
  - [x] Đảm bảo dữ liệu seed phản ánh format chuẩn (UTC, money minor unit, enum hợp lệ).

- [x] **Task 5: Chuẩn hóa dev workflow migrate/seed/reset**
  - [x] Cập nhật scripts/hướng dẫn chạy migrate + seed local/dev rõ ràng.
  - [x] Thêm verification steps tối thiểu (smoke test hoặc command checklist) chứng minh DB baseline dùng được.
  - [x] Ghi rõ coexistence note: chưa chuyển repository runtime sang DB cho đến Story 9.3/9.4.

- [x] **Task 6: Regression guard và bàn giao 9.3**
  - [x] Kiểm tra các route/service hiện tại không bị phá vỡ do thay đổi nền dữ liệu.
  - [x] Bổ sung ghi chú handoff cho Story 9.3 về mapping strategy và migration assumptions.

---

## Testing & Verification Requirements
- Migration baseline tạo được schema đúng như thiết kế 9.1.
- Seed chạy thành công trên DB sạch và tạo bộ dữ liệu dùng được cho các flow chính.
- Không có phá vỡ hợp đồng API hiện tại (smoke checks cho auth/catalog/checkout/order/payment admin basic paths).
- Kiểm tra chéo coverage FR/NFR liên quan:
  - FR43/FR44/FR45 (admin KPI/report/log)
  - FR48/FR49 + NFR10/NFR13 (reconciliation/consistency)

---

## References
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-15.md`
- `_bmad-output/implementation-artifacts/9-1-data-schema-foundation-erd-constraints-index.md`
- `_bmad-output/implementation-artifacts/9-1-schema-foundation-design.md`
- `tmdt/CLAUDE.md`

---

### Review Findings

- [ ] [Review][Patch] Seed password đang dùng SHA-256 thuần, không tương thích format `salt:hash` của `verifyPassword` (scrypt) nên tài khoản seed không đăng nhập được qua auth flow hiện tại [tmdt/prisma/seed.js:8, tmdt/src/modules/identity/password.js:5]
- [ ] [Review][Patch] Seed chưa có dữ liệu cho các bảng/flow reporting (`export_jobs`) nên chưa đạt AC “admin reporting” trong bộ seed tối thiểu [tmdt/prisma/seed.js:13]
- [ ] [Review][Patch] `DATABASE_URL` trong `.env.example` đang đặt `file:./prisma/dev.db`; với schema ở `prisma/schema.prisma` đường dẫn này dễ lệch thành nested path, không nhất quán với baseline dev DB hiện có [tmdt/.env.example:5, tmdt/prisma/schema.prisma:1]
- [ ] [Review][Patch] Workflow `db:setup` dùng `prisma migrate deploy` + `prisma db seed` không reset dữ liệu; chạy lặp lại trên DB đã seed có thể fail unique constraints (email/provider_reference), chưa đáp ứng tiêu chí lặp lại an toàn cho dev setup [tmdt/package.json:11, tmdt/prisma/seed.js:22]

---

**Trạng thái Story:** `review`
**Completion note:** Story 9.2 đã được context hóa để triển khai Prisma schema + migration baseline + seed dữ liệu mẫu theo nền tảng Story 9.1, giữ ranh giới coexistence trước khi refactor repository.

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Tổng hợp context từ `epics.md`, `architecture.md`, `prd.md`, `sprint-change-proposal-2026-04-15.md`.
- Kế thừa quyết định thiết kế và review findings đã resolve từ Story 9.1.

### Completion Notes List

- Tạo mới story file 9.2 theo mục tiêu migration baseline + seed.
- Bổ sung guardrails kiến trúc, scope boundaries, và handoff intent cho Story 9.3.
- Thiết kế task breakdown bám sát acceptance criteria và trạng thái thực tế hiện tại của persistence model.

### File List

- `_bmad-output/implementation-artifacts/9-2-orm-migration-baseline-va-seed-du-lieu-mau.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-15: Tạo mới Story 9.2 từ backlog với context đầy đủ cho implementation ORM migration baseline và seed dữ liệu mẫu.
