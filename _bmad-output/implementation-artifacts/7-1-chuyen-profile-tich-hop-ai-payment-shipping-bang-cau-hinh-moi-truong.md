# Story 7.1: Chuyển profile tích hợp AI/payment/shipping bằng cấu hình môi trường

Status: done

## Story

As a kỹ sư triển khai,
I want chuyển profile endpoint theo môi trường mà không sửa luồng nghiệp vụ,
so that tôi có thể demo sandbox và vận hành production nhất quán.

## Acceptance Criteria

1. Given hệ thống có profile sandbox/mock/production cho AI, payment, shipping, when cấu hình môi trường được thay đổi và service khởi tạo lại, then hệ thống dùng đúng endpoint tương ứng cho từng tích hợp.
2. And contract request/response của các service không đổi giữa các profile.
3. And endpoint profile hiện tại được hiển thị qua health/config endpoint để tránh cấu hình nhầm.

## Tasks / Subtasks

- [x] Chuẩn hóa cơ chế resolve integration profile theo env (AC: 1)
  - [x] Tạo lớp config tập trung cho profile hiện tại và endpoint map của AI/payment/shipping trong `tmdt/src/shared/*` hoặc vị trí config chuẩn theo kiến trúc.
  - [x] Chuẩn hóa fallback an toàn cho môi trường demo (mặc định sandbox/mock), không để production endpoint bật ngoài ý muốn.
  - [x] Ràng buộc validation cấu hình khi khởi tạo app/service để fail-fast khi profile không hợp lệ.

- [x] Refactor integration adapters dùng config-driven endpoint switching (AC: 1, 2)
  - [x] Cập nhật `tmdt/src/modules/integrations/payment/payment-adapter.js` để bỏ hardcode `sandbox-gateway`, đọc provider/endpoint từ config profile.
  - [x] Cập nhật `tmdt/src/modules/integrations/ai/tryon-adapter.js` và `tmdt/src/modules/integrations/shipping/shipping-adapter.js` để đọc profile chung nhưng giữ nguyên contract output hiện có.
  - [x] Không đổi service contract ở layer module gọi adapter (`checkout/payment/order/tryon`).

- [x] Bổ sung health/config endpoint hiển thị profile tích hợp đang chạy (AC: 3)
  - [x] Thêm hoặc mở rộng endpoint admin health/config để trả profile hiện tại của AI/payment/shipping.
  - [x] Chỉ trả metadata an toàn (profile name, provider label, endpoint alias/masked host), không lộ secret/token.
  - [x] Giữ chuẩn response envelope và `X-Correlation-Id` theo pattern API hiện có.

- [x] Đảm bảo tương thích luồng nghiệp vụ hiện tại (AC: 2)
  - [x] Verify luồng checkout-payment, try-on, shipping tracking không cần sửa business rule khi đổi profile.
  - [x] Giữ nguyên error taxonomy/correlation patterns hiện đang dùng ở route/module.

- [x] Bổ sung test coverage cho switching và endpoint visibility (AC: 1, 2, 3)
  - [x] Unit test config resolver: profile hợp lệ/không hợp lệ, fallback behavior theo môi trường.
  - [x] Unit test adapter: khi đổi profile thì provider/endpoint thay đổi đúng, shape response không đổi.
  - [x] Route test health/config: có RBAC admin, có `X-Correlation-Id`, không rò rỉ thông tin nhạy cảm.

## Dev Notes

### Technical Requirements

- Story này hiện thực trực tiếp FR46 và gắn với NFR20 (switch endpoint bằng config, không sửa luồng nghiệp vụ).
- Ưu tiên config-driven switching cho 3 lane tích hợp: AI, payment, shipping.
- Môi trường học thuật/demo phải ưu tiên sandbox/mock làm mặc định an toàn.
- Không đổi contract business ở checkout/order/try-on khi chỉ đổi profile tích hợp.

### Architecture Compliance

- Bám boundary kiến trúc: external providers chỉ đi qua `src/modules/integrations/*`.
- Route layer (`src/app/api/*`) chỉ làm HTTP boundary + RBAC + envelope/header; không chứa logic chọn provider.
- Config tập trung tại shared config layer, không rải `process.env` trực tiếp khắp module business.
- Reconciliation/jobs thuộc story sau (7.2/7.3/7.4), không mở rộng scope ở story 7.1.

### Library / Framework Requirements

- Giữ stack hiện tại theo repo: Next.js App Router + React + Node test runner.
- Không thêm dependency mới nếu không thực sự cần; ưu tiên tận dụng cấu trúc sẵn có.
- Nếu có thay đổi liên quan framework-level, đối chiếu docs local Next.js theo `tmdt/CLAUDE.md`.

### File Structure Requirements

Ưu tiên thay đổi trong các khu vực sau:
- `tmdt/src/modules/integrations/payment/payment-adapter.js`
- `tmdt/src/modules/integrations/ai/tryon-adapter.js`
- `tmdt/src/modules/integrations/shipping/shipping-adapter.js`
- `tmdt/src/shared/*` (config utilities cho integration profile)
- `tmdt/src/app/api/admin/*` (health/config endpoint profile visibility)
- Test files tương ứng ở `tmdt/src/modules/**` và `tmdt/src/app/api/**`

### Testing Requirements

- Cover đầy đủ nhánh profile switching: sandbox/mock/production.
- Assert contract ổn định khi đổi profile (không breaking shape response).
- Assert endpoint profile visibility có RBAC + correlation header + sanitization dữ liệu.
- Regression tối thiểu cho checkout/payment và shipping/try-on path liên quan adapter.

### Previous Story Intelligence

- Story 5.4 và 4.4 đã chuẩn hóa recovery/status + correlation header; story 7.1 phải giữ cùng chuẩn response.
- `payment-adapter` hiện hardcode sandbox, là điểm cần refactor chính của story này.
- `shipping-adapter` đã có retryable taxonomy; story 7.1 chỉ chuyển nguồn config/profile, không phá retry behavior.

### Git Intelligence Summary

- Commit gần nhất đã harden payment callback; tránh làm regress luồng callback/idempotency.
- Working tree đang có nhiều thay đổi; cần giới hạn chỉnh sửa đúng phạm vi profile switching.

### References

- Epic 7, Story 7.1 + AC: `_bmad-output/planning-artifacts/epics.md:611-625`
- FR46 + NFR20: `_bmad-output/planning-artifacts/prd.md:361`, `_bmad-output/planning-artifacts/prd.md:397`
- Integration switching & boundary patterns: `_bmad-output/planning-artifacts/architecture.md:146-147`, `_bmad-output/planning-artifacts/architecture.md:341-342`, `_bmad-output/planning-artifacts/architecture.md:388`, `_bmad-output/planning-artifacts/architecture.md:415`, `_bmad-output/planning-artifacts/architecture.md:442`
- UX định hướng clarity/recovery cho status flows: `_bmad-output/planning-artifacts/ux-design-specification.md:357-358`, `_bmad-output/planning-artifacts/ux-design-specification.md:509`
- Baseline implementation hiện tại:
  - `tmdt/src/modules/integrations/payment/payment-adapter.js:1-9`
  - `tmdt/src/modules/integrations/ai/tryon-adapter.js:45-73`
  - `tmdt/src/modules/integrations/shipping/shipping-adapter.js:69-112`

### Review Findings

- [x] [Review][Patch] Bật fail-fast toàn hệ thống cho integration profile theo quyết định review [tmdt/src/app/api/admin/config/route.js:40]
- [x] [Review][Patch] Ẩn `policy` khỏi admin config snapshot để đúng phạm vi metadata an toàn [tmdt/src/shared/config/integration-profile.js:210]
- [x] [Review][Patch] Tránh validation chéo lane ở import-time để không làm lane không liên quan bị crash [tmdt/src/modules/integrations/payment/payment-adapter.js:4]
- [x] [Review][Patch] Dùng `normalizedOrderId`/encode khi tạo providerReference và checkoutUrl [tmdt/src/modules/integrations/payment/payment-adapter.js:60]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Added shared integration profile resolver with env-based switching, production safety guard, and fail-fast validation.
- Refactored AI/payment/shipping adapters to consume centralized integration profile config while preserving service contracts.
- Added admin config endpoint for safe runtime profile visibility with correlation header and standard envelope.
- Added targeted unit/API tests and ran regression tests using Node test runner in ESM mode.
- Ran lint successfully; existing unrelated warning remains at `tmdt/src/app/admin/reports/admin-reports-client.tsx:36`.

### Completion Notes List

- Implemented centralized config-driven integration profile switching for AI/payment/shipping with safe fallback to non-production profiles.
- Added validation gate to fail fast on invalid profile configuration.
- Replaced payment adapter hardcode and made shipping/AI adapters profile-aware without changing module-level contracts.
- Added `GET /api/admin/config` to expose sanitized integration profile metadata (profile/provider/alias/masked host) with `X-Correlation-Id`.
- Added tests for config resolver, adapters, and new admin config route; regression test suites for payment/order/try-on/admin-orders all pass.

### File List

- `_bmad-output/implementation-artifacts/7-1-chuyen-profile-tich-hop-ai-payment-shipping-bang-cau-hinh-moi-truong.md`
- `tmdt/src/shared/config/integration-profile.js`
- `tmdt/src/shared/config/integration-profile.test.js`
- `tmdt/src/modules/integrations/payment/payment-adapter.js`
- `tmdt/src/modules/integrations/payment/payment-adapter.test.js`
- `tmdt/src/modules/integrations/ai/tryon-adapter.js`
- `tmdt/src/modules/integrations/ai/tryon-adapter.test.js`
- `tmdt/src/modules/integrations/shipping/shipping-adapter.js`
- `tmdt/src/modules/integrations/shipping/shipping-adapter.test.js`
- `tmdt/src/app/api/admin/config/route.js`
- `tmdt/src/app/api/admin/config/route.test.js`

### Change Log

- 2026-04-15: Completed Story 7.1 implementation for config-driven integration profile switching, admin config visibility endpoint, and associated automated tests.
