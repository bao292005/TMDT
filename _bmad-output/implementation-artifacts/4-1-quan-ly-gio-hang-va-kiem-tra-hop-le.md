# Story 4.1: Quản lý giỏ hàng và kiểm tra hợp lệ

Status: done

## Story

As a khách hàng,
I want thêm/cập nhật/xóa sản phẩm trong giỏ,
so that tôi kiểm soát đơn hàng trước checkout.

## Acceptance Criteria

1. Given khách hàng đã chọn biến thể sản phẩm, when khách hàng thao tác giỏ hàng, then hệ thống cập nhật giỏ chính xác theo số lượng và tồn kho, and chặn checkout khi giỏ không hợp lệ với thông điệp lỗi rõ ràng.

## Tasks / Subtasks

- [x] Thiết kế contract giỏ hàng cho customer flow theo pattern route mỏng + service dày (AC: 1)
  - [x] Chốt payload thêm/cập nhật/xóa item (productSlug, variantId, quantity)
  - [x] Chốt response envelope success/error theo pattern hiện có (`success/state/error/message/data` + `X-Correlation-Id`)
  - [x] Định nghĩa mã lỗi chuẩn cho cart (`CART_*`, `AUTH_*`) và mapping HTTP status
- [x] Triển khai domain logic giỏ hàng trong `src/modules/cart/*` (AC: 1)
  - [x] Tạo service thêm item biến thể vào giỏ với kiểm tra tồn kho tại thời điểm thao tác
  - [x] Tạo service cập nhật số lượng và xóa item khỏi giỏ
  - [x] Tạo hàm validate cart trước checkout để phát hiện item hết hàng/số lượng vượt tồn
- [x] Triển khai API route cart ở boundary `src/app/api/cart/*` (AC: 1)
  - [x] Tách validation input ở boundary (`src/shared/validation/*`) và giữ business logic trong module
  - [x] Bảo vệ route bằng session customer hiện có; trả `AUTH_UNAUTHORIZED`/`AUTH_FORBIDDEN` đúng pattern
  - [x] Gắn `X-Correlation-Id` cho success/error response
- [x] Tích hợp UI customer cart page với trạng thái hợp lệ/không hợp lệ (AC: 1)
  - [x] Hiển thị danh sách item, quantity control, remove action với trạng thái loading/disabled/error rõ ràng
  - [x] Hiển thị thông điệp lỗi dễ hiểu khi giỏ không hợp lệ để chặn checkout
  - [x] Giữ keyboard/focus behavior và semantics đúng baseline accessibility
- [x] Đảm bảo liên kết đúng với luồng checkout kế tiếp mà không implement trước scope Story 4.2 (AC: 1)
  - [x] Chỉ cung cấp tín hiệu “cart valid/invalid” cho bước checkout
  - [x] Không triển khai logic địa chỉ/vận chuyển/tổng tiền ở story này
- [x] Kiểm thử và regression guard cho Story 4.1 (AC: 1)
  - [x] Unit test cho cart service: add/update/remove + stock validation
  - [x] Route test cho auth, validation, và response envelope/error mapping
  - [x] UI/integration test cho cart invalid state chặn checkout với thông điệp rõ ràng
  - [x] Chạy `npm run lint` và `npm run build`

### Review Findings

- [x] [Review][Patch] Thiếu trường `state` trong response envelope cart API [`tmdt/src/app/api/cart/route.js:18`]
- [x] [Review][Patch] Thiếu UI/integration test chứng minh nhánh cart invalid chặn checkout và keyboard/focus path [`tmdt/src/app/(customer)/cart/cart-client.tsx:35`]
- [x] [Review][Patch] File-store giỏ hàng đọc/ghi không atomic, có nguy cơ lost update khi request đồng thời [`tmdt/src/modules/cart/cart-store.js:16`]
- [x] [Review][Patch] Parse `variantId` bị lossy với giá trị có nhiều dấu `-`, có thể map sai biến thể [`tmdt/src/shared/validation/cart.js:23`]
- [x] [Review][Patch] Add-to-cart từ Try-On có thể hiển thị thông điệp stale sau khi đổi biến thể nhanh [`tmdt/src/app/(public)/products/[slug]/try-on-panel.tsx:179`]
- [x] [Review][Patch] Update quantity theo từng lần gõ có thể lưu giá trị không mong muốn do disable toàn cục trong lúc request đang chạy [`tmdt/src/app/(customer)/cart/cart-client.tsx:183`]
- [x] [Review][Patch] Khi session hết hạn, cart UI giữ snapshot cũ thay vì điều hướng lại flow đăng nhập rõ ràng [`tmdt/src/app/(customer)/cart/cart-client.tsx:46`]
- [x] [Review][Defer] Rủi ro CSRF cho cart mutation API dùng cookie auth nhưng chưa có bằng chứng anti-CSRF ở layer này [`tmdt/src/app/api/cart/route.js:91`] — deferred, pre-existing
- [x] [Review][Defer] Guard kép role cookie + session ở trang `/cart` có thể redirect người dùng hợp lệ khi cookie role stale [`tmdt/src/app/(customer)/cart/page.tsx:17`] — deferred, pre-existing

## Dev Notes

- Story 4.1 mở đầu Epic 4, triển khai FR19/FR20/FR21: thêm biến thể vào giỏ, cập nhật/xóa item, và kiểm tra hợp lệ trước checkout.
- Scope chỉ tập trung cart management + cart validation gate; chưa bao gồm nhập địa chỉ/vận chuyển/tổng tiền (Story 4.2) hay tạo đơn/thanh toán (Story 4.3+).
- Ưu tiên tái sử dụng pattern identity/auth, validation, response envelope, và `X-Correlation-Id` đã ổn định ở các API hiện có.

### Technical Requirements

- Bắt buộc hỗ trợ thao tác thêm/cập nhật/xóa item biến thể trong giỏ (FR19, FR20).
- Bắt buộc chặn checkout khi giỏ không hợp lệ và trả thông điệp lỗi rõ ràng (FR21).
- Bắt buộc giữ interaction state rõ `loading/disabled/error` và keyboard accessibility cho flow chính (NFR14, NFR16, NFR17).
- Bắt buộc bảo vệ dữ liệu phiên khách hàng theo session + RBAC customer đã có (NFR6).
- Bắt buộc tuân thủ reliability cơ bản: validation nhất quán giữa boundary và service, tránh trạng thái giỏ sai lệch (NFR10).

### Architecture Compliance

- Route layer `src/app/*` chỉ xử lý boundary/HTTP; business logic cart đặt trong `src/modules/cart/*`.
- Validation input ở `src/shared/validation/*`; không nhúng rule nghiệp vụ sâu vào UI component.
- Response theo envelope chuẩn, có `X-Correlation-Id`, code lỗi chuẩn hóa.
- Tái sử dụng guard authorization hiện có trong `src/modules/identity/authorization.js` thay vì tự viết cơ chế auth mới.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js 16.2.3 + React 19 + TypeScript + Tailwind CSS 4.
- Không thêm dependency mới cho state/form nếu có thể dùng pattern hiện có.
- Ưu tiên logic deterministic, dễ test, dễ debug; tránh abstraction lớn ngoài scope story.

### File Structure Requirements

- Ưu tiên tạo/chỉnh sửa trong phạm vi:
  - `tmdt/src/modules/cart/*`
  - `tmdt/src/app/api/cart/*`
  - `tmdt/src/shared/validation/*` (cart DTO/query validation)
  - `tmdt/src/app/(customer)/cart/*`
- Có thể tái sử dụng model variant từ `src/modules/catalog/*` để kiểm tra tồn kho.
- Không sửa contract checkout/payment/order ở story này.

### Testing Requirements

- Cover tối thiểu các nhánh:
  - add/update/remove item thành công,
  - quantity vượt tồn hoặc item hết hàng,
  - cart invalid chặn checkout,
  - unauthorized/forbidden request vào cart API.
- Kiểm thử response envelope + `X-Correlation-Id` cho cả success/error.
- Kiểm thử keyboard path và focus state cho tương tác chính ở cart UI.
- Bắt buộc pass `npm run lint` + `npm run build` trước khi chuyển `review`.

### Previous Story Intelligence

- Story 3.4 đã chốt pattern UI state matrix rõ ràng (`idle/processing/success/error/timeout`) và ưu tiên CTA hierarchy; cart UI nên giữ cách tổ chức trạng thái rõ tương tự.
- Story 3.4 giữ nguyên nguyên tắc không đưa business logic vào component presentational; story 4.1 cần duy trì route mỏng + service dày.
- Story 3.3/3.4 đều bám response envelope + `X-Correlation-Id`; story 4.1 cần nhất quán để giảm regression cross-module.
- Story 3.4 xác nhận guard race/stale state quan trọng cho UX; khi thao tác quantity/remove liên tiếp cần chú ý tránh ghi đè trạng thái cũ.

### Git Intelligence Summary

- Recent commits hiện có:
  - `1108dbe`: auth flow story 1.2
  - `445df65`: BMAD framework bootstrap
- Working tree đang có nhiều thay đổi chưa commit; khi implement Story 4.1 cần giới hạn đúng scope cart, tránh chạm rộng sang checkout/payment.

### Latest Technical Information

- PRD xác nhận FR19/FR20/FR21 thuộc Story 4.1 và là gate trước checkout.
- Architecture mapping đã định vị rõ cart capability ở `src/modules/cart` + `src/app/api/cart`.
- UX spec yêu cầu feedback state rõ, không phụ thuộc màu đơn thuần, và keyboard accessibility cho tác vụ chính.

### Project Context Reference

- Không tìm thấy `project-context.md` trong workspace hiện tại.
- Nguồn chuẩn dùng cho story này: `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md`, và implementation artifacts Story 3.3/3.4.

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:398-412`
- FR19/FR20/FR21: `_bmad-output/planning-artifacts/prd.md:313-316`
- NFR a11y + interaction states: `_bmad-output/planning-artifacts/prd.md:376-379`
- Cart/checkout feature mapping + boundaries: `_bmad-output/planning-artifacts/architecture.md:335-337,355,369-372`
- Response envelope + correlation id pattern: `_bmad-output/planning-artifacts/architecture.md:154-158`
- UX feedback/validation/accessibility baseline: `_bmad-output/planning-artifacts/ux-design-specification.md:323-327,582-587,642-650`
- Previous story intelligence: `_bmad-output/implementation-artifacts/3-4-ui-tryonconfidencepanel-va-variantfitselector.md`, `_bmad-output/implementation-artifacts/3-3-recommendation-baseline-va-ca-nhan-hoa-co-ban.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npm run lint` (pass)
- `npm run build` (pass)
- `node --experimental-default-type=module --test --test-concurrency=1 src/modules/cart/cart-service.test.js src/app/api/cart/route.test.js src/app/(customer)/cart/cart-client.test.js` (pass)

### Completion Notes List

- Hoàn tất cart contract (payload add/update/remove, error mapping HTTP, response envelope + `X-Correlation-Id`).
- Hoàn tất cart domain/service + file store và kiểm tra hợp lệ trước checkout.
- Hoàn tất cart API route với guard customer role và mapping lỗi `CART_*`.
- Hoàn tất tích hợp UI `/cart` cho danh sách item, quantity/update/remove, invalid-state checkout gate.
- Hoàn tất tích hợp CTA "Thêm vào giỏ" từ PDP Try-On thành gọi thực tế `/api/cart`.
- Hoàn tất kiểm thử: lint/build pass, cart service + cart route + cart client tests pass (sequential).

### File List

- `tmdt/src/modules/cart/cart-store.js`
- `tmdt/src/modules/cart/cart-service.js`
- `tmdt/src/shared/validation/cart.js`
- `tmdt/src/app/api/cart/route.js`
- `tmdt/src/app/api/cart/route.test.js`
- `tmdt/src/modules/cart/cart-service.test.js`
- `tmdt/src/app/(customer)/cart/page.tsx`
- `tmdt/src/app/(customer)/cart/cart-client.tsx`
- `tmdt/src/app/(customer)/cart/cart-client.test.js`
- `tmdt/src/app/(public)/products/[slug]/try-on-panel.tsx`
- `tmdt/src/app/(public)/products/[slug]/try-on-confidence-panel.tsx`
- `_bmad-output/implementation-artifacts/4-1-quan-ly-gio-hang-va-kiem-tra-hop-le.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-12: Tạo mới Story 4.1 từ backlog với trạng thái `ready-for-dev`.
- 2026-04-12: Triển khai hoàn chỉnh Story 4.1 (cart domain/API/UI/tests), cập nhật trạng thái sang `review`.
