---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "/Users/nguyenquocbao/TMDT/_bmad-output/planning-artifacts/prd.md"
  - "/Users/nguyenquocbao/TMDT/_bmad-output/planning-artifacts/prd-validation-report.md"
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-04-08'
project_name: 'TMDT'
user_name: 'bao'
date: '2026-04-08'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
Hệ thống cần bao phủ đầy đủ năng lực TMĐT thời trang với AI try-on: account & RBAC, catalog/search/filter, try-on + recommendation, cart/checkout/payment, order tracking, admin operations, warehouse operations, và integration reliability. Về mặt kiến trúc, FR được nhóm thành các bounded capability rõ ràng: Identity, Catalog, Try-On, Checkout/Payment, Fulfillment, Admin/Reporting, Integration Orchestration.

**Non-Functional Requirements:**
Các NFR quan trọng định hướng kiến trúc gồm:
- Hiệu năng: 95% catalog/search/PDP <= 2s; 95% checkout <= 90s; try-on <= 30s; order status sync <= 10s + polling fallback 15s.
- Security: password hashing an toàn, RBAC, audit log, least-privilege access cho dữ liệu nhạy cảm.
- Reliability: retry có kiểm soát, fallback cho tích hợp ngoài, đối soát trạng thái định kỳ.
- Accessibility + SEO baseline cho web app.
- Integration flexibility: chuyển sandbox/mock ↔ endpoint thật không đổi luồng nghiệp vụ chính.

**Scale & Complexity:**
Dự án ở mức high complexity do kết hợp:
- AI inference workflow (latency/error-prone),
- payment callback reconciliation,
- shipping/tracking synchronization,
- multi-role operational flows.

- Primary domain: full-stack web app (e-commerce + fintech flow)
- Complexity level: high
- Estimated architectural components: 10-14 components/services (web app shell, auth, catalog, try-on orchestration, recommendation, cart/checkout, payment integration, order management, warehouse/fulfillment, admin/reporting, notification, observability, integration adapters, shared data layer)

### Technical Constraints & Dependencies

- Bắt buộc RBAC cho 3 vai trò Customer/Admin/Warehouse.
- Bắt buộc timeout/retry/fallback cho AI, payment, shipping.
- Bắt buộc đồng bộ trạng thái đơn xuyên suốt các phân hệ.
- Phạm vi học thuật ưu tiên sandbox/mock cho payment và shipping.
- Kiến trúc phải cho phép nâng cấp từ prototype lên pilot mà không phá vỡ capability contract.
- Cần giữ tương thích browser hiện đại, hỗ trợ SEO cho trang public, và baseline accessibility.

### Cross-Cutting Concerns Identified

- Identity & Access Control xuyên mọi module.
- Order State Machine + Idempotency cho callback/event tích hợp.
- Integration Resilience Pattern (timeout, retry policy, circuit/fallback, dead-letter/manual reconciliation).
- Data Consistency & Auditability (transaction boundaries, audit logs, reconciliation jobs).
- Observability (structured logging, trace luồng thanh toán/đơn hàng, KPI instrumentation cho nghiên cứu).
- Performance Budgeting (đặc biệt cho PDP, checkout, try-on, order tracking).
- Configuration-driven endpoint switching (sandbox/mock/real) theo môi trường.

## Starter Template Evaluation

### Primary Technology Domain

Web application full-stack (e-commerce + AI integrations) based on project requirements.

### Starter Options Considered

- Next.js: Strong SEO support, hybrid rendering, robust full-stack web patterns.
- Vite React: Excellent SPA developer experience, but SEO requires additional SSR/prerender setup.
- Remix: Solid web architecture, but less aligned with current team simplicity goals versus Next.js for this project.

### Selected Starter: Next.js (App Router)

**Rationale for Selection:**
Meets mandatory SEO needs while preserving SPA-like UX for core flows (catalog, try-on, cart, checkout, tracking). Provides practical full-stack foundation for payment/shipping/AI integrations and future scaling.

**Initialization Command:**

```bash
npx create-next-app@latest tmdt --typescript --tailwind
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript-first setup on modern Node runtime.

**Styling Solution:**
Tailwind CSS preconfigured.

**Build Tooling:**
Next.js integrated build pipeline with production optimization defaults.

**Testing Framework:**
Not fully opinionated by default; test stack can be added in subsequent architecture decisions.

**Code Organization:**
App Router structure with clear separation between public SEO pages and authenticated application areas.

**Development Experience:**
Fast local dev server, strong TypeScript support, and standardized project conventions.

**Note:** Project initialization using this command should be the first implementation story.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
5 nhóm xung đột chính: naming, structure, format, communication, process.

### Naming Patterns

**Database Naming Conventions:**
- Table: `snake_case` số nhiều (`users`, `order_items`, `payment_transactions`).
- Column: `snake_case` (`user_id`, `created_at`, `updated_at`).
- FK: `<referenced_table_singular>_id` (`order_id`, `product_variant_id`).
- Index: `idx_<table>_<column_list>`.

**API Naming Conventions:**
- REST resource dùng số nhiều: `/api/users`, `/api/orders/{id}`.
- Route param: `{id}` trong spec, `params.id` trong code.
- Query param: `camelCase` ở API boundary (`pageSize`, `sortBy`).
- Webhook path rõ provider: `/api/webhooks/payment`, `/api/webhooks/shipping`.

**Code Naming Conventions:**
- Type/Component: `PascalCase` (`OrderCard`, `CheckoutService`).
- Function/variable: `camelCase` (`createOrder`, `paymentStatus`).
- File: `kebab-case.ts(x)` cho module thường, `PascalCase.tsx` cho React component.
- Constant: `UPPER_SNAKE_CASE`.

### Structure Patterns

**Project Organization:**
- Tổ chức theo feature trong `src/modules/*` (catalog, checkout, order, fulfillment, admin).
- Shared code trong `src/shared/*` (types, utils, lib, constants).
- API route trong `src/app/api/*`.
- Test colocated với file nguồn: `*.test.ts` / `*.test.tsx`.

**File Structure Patterns:**
- Validation schema đặt cạnh boundary layer (request DTO/schema cạnh route/handler).
- Integration adapters tách riêng: `src/modules/integrations/{ai|payment|shipping}`.
- Config tập trung trong `src/shared/config`.
- Observability helpers trong `src/shared/observability`.

### Format Patterns

**API Response Formats:**
- Success:
  - `{ "data": ..., "meta": ... }`
- Error:
  - `{ "error": { "code": "STRING_CODE", "message": "human-readable", "details": ... } }`
- Correlation ID trả qua header `X-Correlation-Id`.

**Data Exchange Formats:**
- API JSON: `camelCase`.
- DB persistence: `snake_case` (mapping qua ORM).
- Datetime: ISO-8601 UTC (`2026-04-08T10:15:00Z`).
- Money: integer minor unit (VND đồng) + currency code, không dùng float.

### Communication Patterns

**Event System Patterns:**
- Event name: `domain.entity.action.v1`
  - Ví dụ: `order.status.updated.v1`, `payment.callback.received.v1`.
- Payload bắt buộc:
  - `eventId`, `occurredAt`, `source`, `correlationId`, `idempotencyKey`, `data`.
- Consumer phải idempotent theo `idempotencyKey`.

**State Management Patterns:**
- Server state: query cache (fetch/revalidate) theo key chuẩn `['resource', id, filters]`.
- UI state local theo feature; tránh global state cho dữ liệu chỉ dùng nội bộ màn hình.
- Update pattern immutable, optimistic update chỉ áp dụng cho action có rollback rõ.

### Process Patterns

**Error Handling Patterns:**
- Chuẩn hóa domain error code:
  - `AUTH_*`, `CATALOG_*`, `TRYON_*`, `PAYMENT_*`, `ORDER_*`, `SHIP_*`.
- Không lộ lỗi nội bộ ra client; log chi tiết ở server.
- Retry chỉ cho lỗi transient; lỗi validation/business không retry.

**Loading State Patterns:**
- Mỗi async flow có 4 trạng thái: `idle | loading | success | error`.
- Checkout/Payment/Try-on bắt buộc hiển thị progress rõ ràng.
- Nút hành động quan trọng disable khi `loading` để tránh double-submit.

### Enforcement Guidelines

**All AI Agents MUST:**
- Tuân thủ naming conventions và response/error schema đã chốt.
- Bổ sung `correlationId` + `idempotencyKey` cho luồng tích hợp callback/event.
- Dùng ISO-8601 UTC, tiền tệ minor unit, không dùng float cho financial value.

**Pattern Enforcement:**
- PR checklist bắt buộc mục “Pattern Compliance”.
- CI lint + typecheck + test phải pass trước merge.
- Vi phạm pattern ghi trong PR comment với tag `pattern-violation`.
- Thay đổi pattern chỉ qua cập nhật tài liệu kiến trúc trước khi code.

### Pattern Examples

**Good Examples:**
- `POST /api/orders` trả `{ data: { orderId, status }, meta: { correlationId } }`
- Event `payment.callback.received.v1` có `idempotencyKey`.
- DB cột `created_at`, code map sang `createdAt`.

**Anti-Patterns:**
- Trộn `snake_case` và `camelCase` trong cùng API payload.
- Trả lỗi dạng plain string không có `code`.
- Dùng số thực cho tổng tiền thanh toán.
- Retry vô hạn webhook thất bại mà không dead-letter/manual reconciliation.

## Project Structure & Boundaries

### Complete Project Directory Structure
```text
tmdt/
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── .env.example
├── .env.local
├── .gitignore
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── quality.yml
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── images/
│   └── icons/
├── docs/
│   ├── api/
│   ├── architecture/
│   └── runbooks/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── products/
│   │   │   └── try-on/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (customer)/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   └── profile/
│   │   ├── (admin)/
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── users/
│   │   │   └── reports/
│   │   ├── (warehouse)/
│   │   │   ├── picking/
│   │   │   ├── packing/
│   │   │   └── shipment/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── catalog/
│   │   │   ├── try-on/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   ├── admin/
│   │   │   ├── warehouse/
│   │   │   └── webhooks/
│   │   │       ├── payment/
│   │   │       └── shipping/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── modules/
│   │   ├── identity/
│   │   ├── catalog/
│   │   ├── tryon/
│   │   ├── recommendation/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── payment/
│   │   ├── order/
│   │   ├── fulfillment/
│   │   ├── warehouse/
│   │   ├── admin/
│   │   ├── reporting/
│   │   ├── notification/
│   │   └── integrations/
│   │       ├── ai/
│   │       ├── payment/
│   │       └── shipping/
│   ├── shared/
│   │   ├── config/
│   │   ├── lib/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── types/
│   │   ├── validation/
│   │   └── observability/
│   ├── components/
│   │   ├── ui/
│   │   └── features/
│   ├── middleware.ts
│   └── jobs/
│       ├── reconciliation/
│       └── tracking-sync/
├── tests/
│   ├── integration/
│   └── e2e/
└── scripts/
    ├── seed.ts
    └── reconcile-orders.ts
```

### Architectural Boundaries

**API Boundaries:**
- Public SEO pages: read-only catalog/search/PDP.
- Authenticated customer APIs: cart/checkout/order tracking/profile.
- Admin APIs: product/order/user/report với Admin RBAC.
- Warehouse APIs: picking/packing/shipment với Warehouse RBAC.
- External inbound boundaries: payment webhook, shipping webhook.

**Component Boundaries:**
- `src/app/*` chỉ xử lý routing + composition.
- `src/modules/*` chứa business logic theo capability.
- `src/shared/*` chỉ chứa cross-cutting utility, không chứa domain-specific logic.

**Service Boundaries:**
- Mỗi module expose service contract riêng, giao tiếp qua typed interfaces.
- External providers chỉ đi qua `modules/integrations/*`.
- Reconciliation và sync chạy qua `src/jobs/*`, không đặt trong route handler.

**Data Boundaries:**
- Prisma schema là source of truth cho persistence model.
- Mapping DB `snake_case` ↔ API `camelCase` ở repository/DTO boundary.
- Cache tracking/order status có TTL và policy invalidation rõ trong fulfillment/order modules.

### Requirements to Structure Mapping

**Feature/Epic Mapping:**
- Identity & RBAC → `src/modules/identity`, `src/app/api/auth`, `src/middleware.ts`.
- Catalog/Search/Filter → `src/modules/catalog`, `src/app/(public)/products`, `src/app/api/catalog`.
- AI Try-On + Recommendation → `src/modules/tryon`, `src/modules/recommendation`, `src/modules/integrations/ai`, `src/app/api/try-on`.
- Cart/Checkout/Payment → `src/modules/cart`, `src/modules/checkout`, `src/modules/payment`, `src/modules/integrations/payment`, `src/app/api/checkout`.
- Order Tracking/Fulfillment → `src/modules/order`, `src/modules/fulfillment`, `src/modules/warehouse`, `src/modules/integrations/shipping`, `src/app/api/orders`, `src/app/api/warehouse`.
- Admin Operations/Reporting → `src/modules/admin`, `src/modules/reporting`, `src/app/(admin)/*`, `src/app/api/admin/*`.
- Integration Reliability/Reconciliation → `src/jobs/reconciliation`, `src/jobs/tracking-sync`, `scripts/reconcile-orders.ts`.

**Cross-Cutting Concerns:**
- Observability → `src/shared/observability`.
- Validation → `src/shared/validation`.
- Config-driven endpoint switching → `src/shared/config`.
- Audit logging → identity/admin/order modules + reporting extractors.

### Integration Points

**Internal Communication:**
- Route handlers gọi module service.
- Module service gọi repository/integration adapter.
- Module chỉ import từ `shared` và chính module nội bộ; không import chéo logic sâu giữa modules.

**External Integrations:**
- AI try-on provider: `src/modules/integrations/ai`.
- Payment gateway: `src/modules/integrations/payment`.
- Shipping provider: `src/modules/integrations/shipping`.
- Inbound webhook endpoints đặt dưới `src/app/api/webhooks/*`.

**Data Flow:**
- User action → App Route/API → Module Service → DB/Integration.
- Callback external → webhook endpoint → idempotency check → state machine update → audit log.
- Reconciliation jobs quét sai lệch trạng thái và cập nhật theo policy.

### File Organization Patterns

**Configuration Files:**
- Runtime env trong `.env.local`, template trong `.env.example`.
- Module config typed trong `src/shared/config`.

**Source Organization:**
- Ưu tiên feature-first cho domain logic.
- App Router chỉ là entrypoint + orchestration layer.

**Test Organization:**
- Unit test colocated (`*.test.ts(x)`).
- Cross-module integration trong `tests/integration`.
- End-to-end critical journeys trong `tests/e2e`.

**Asset Organization:**
- Public static assets trong `public/`.
- Feature-specific assets đặt cạnh feature component khi cần.

### Development Workflow Integration

**Development Server Structure:**
- Next.js App Router phục vụ cả public + authenticated areas.
- Module boundaries giúp chia task song song cho nhiều agents.

**Build Process Structure:**
- Typecheck/lint/test chạy theo module ownership.
- CI workflow validate pattern compliance trước merge.

**Deployment Structure:**
- Cùng một artifact deploy cho web + API routes.
- Endpoint tích hợp đổi bằng env config, không đổi business flow.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
Các lựa chọn kiến trúc tương thích lẫn nhau: Next.js App Router + TypeScript + Tailwind + module-based domain organization + integration adapters tách biệt cho AI/payment/shipping.

**Pattern Consistency:**
Implementation patterns (naming, format, communication, process) nhất quán với kiến trúc đã chọn và phù hợp cho multi-agent development.

**Structure Alignment:**
Project structure hỗ trợ đầy đủ architectural decisions: App Router cho delivery layer, modules cho domain boundaries, shared cho cross-cutting concerns, jobs/scripts cho reconciliation và đồng bộ trạng thái.

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
Tất cả capability chính đều có vị trí triển khai rõ ràng: identity, catalog, try-on/recommendation, checkout/payment, order/fulfillment, admin/reporting, warehouse, integration reliability.

**Functional Requirements Coverage:**
Các FR được hỗ trợ kiến trúc đầy đủ thông qua mapping module + API + integration points; không có FR category bị thiếu capability kiến trúc.

**Non-Functional Requirements Coverage:**
- Performance targets được phản ánh vào flow-level constraints.
- Security (RBAC, auditability, least-privilege boundaries) đã được thể hiện trong structure/patterns.
- Reliability (timeout/retry/idempotency/reconciliation) đã có pattern và boundary rõ.
- Integration switching sandbox/mock/real được hỗ trợ qua config-driven approach.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Các quyết định cốt lõi đã được xác lập đủ để bắt đầu implementation nhất quán.

**Structure Completeness:**
Project tree và boundaries đủ cụ thể để chia task cho nhiều AI agents mà không chồng chéo ownership.

**Pattern Completeness:**
Các conflict points phổ biến đã được cover; có rules và anti-pattern rõ cho naming/format/communication/process.

### Gap Analysis Results

**Critical Gaps:** Không phát hiện.

**Important Gaps:**
1. Cần bổ sung FR-to-endpoint matrix chi tiết để tăng tốc handoff implementation.
2. Cần bổ sung test matrix theo KPI NFR (latency, timeout, sync SLA).

**Nice-to-Have Gaps:**
- Mở rộng runbook xử lý incident và reconciliation cho vận hành pilot.

### Validation Issues Addressed

- Đã chuẩn hóa các điểm dễ conflict giữa agents (naming/API/error format/event payload).
- Đã xác lập boundaries rõ cho tích hợp ngoài và luồng callback/webhook.
- Đã bảo toàn alignment giữa architecture decisions và project structure.

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** high

**Key Strengths:**
- Bounded capability rõ, phù hợp domain TMĐT + fintech integration.
- Cross-cutting concerns được chuẩn hóa thành rules có thể enforce.
- Cấu trúc thư mục và boundary thực dụng cho parallel implementation.

**Areas for Future Enhancement:**
- Bổ sung endpoint matrix và NFR test matrix trước sprint implementation lớn.
- Bổ sung operational runbook chi tiết cho callback/reconciliation.

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**
Khởi tạo project bằng starter command đã chốt:
`npx create-next-app@latest tmdt --typescript --tailwind`
