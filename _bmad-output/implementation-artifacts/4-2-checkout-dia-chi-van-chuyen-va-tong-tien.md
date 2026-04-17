# Story 4.2: Checkout địa chỉ, vận chuyển và tổng tiền

Status: done

## Story

As a khách hàng,
I want nhập/chọn địa chỉ, chọn vận chuyển và xem tổng tiền,
so that tôi xác nhận chi phí trước khi đặt hàng.

## Acceptance Criteria

1. Given giỏ hàng hợp lệ, when khách hàng đi qua bước checkout, then hệ thống cho phép chọn địa chỉ, phương thức vận chuyển và tính tổng tiền chính xác, and form checkout tuân thủ pattern validation + accessibility đã chốt.

## Tasks / Subtasks

- [x] Thiết kế contract checkout cho địa chỉ + vận chuyển + tổng tiền theo pattern route mỏng + service dày (AC: 1)
  - [x] Chốt payload checkout draft: địa chỉ nhận hàng, phương thức vận chuyển, ghi chú (nếu có)
  - [x] Chốt response envelope chuẩn `success/state/error/message/data` + `X-Correlation-Id`
  - [x] Định nghĩa mã lỗi chuẩn cho checkout (`CHECKOUT_*`, `AUTH_*`) và mapping HTTP status
- [x] Triển khai domain logic checkout trong `src/modules/checkout/*` (AC: 1)
  - [x] Tạo service validate dữ liệu checkout dựa trên snapshot cart hợp lệ (reuse gate từ Story 4.1)
  - [x] Tạo service tính tổng tiền theo công thức: subtotal cart + phí vận chuyển - khuyến mãi (nếu chưa có thì mặc định 0)
  - [x] Chuẩn hóa model shipping option và chọn phương thức vận chuyển hợp lệ
- [x] Triển khai API route checkout ở boundary `src/app/api/checkout/*` (AC: 1)
  - [x] Tách validation input ở `src/shared/validation/*`, giữ business logic trong module checkout
  - [x] Bảo vệ route bằng session customer hiện có; trả `AUTH_UNAUTHORIZED`/`AUTH_FORBIDDEN` đúng pattern
  - [x] Bắt buộc kiểm tra cart validity trước khi trả checkout summary
- [x] Tích hợp UI checkout cho nhập/chọn địa chỉ, chọn vận chuyển và hiển thị tổng tiền (AC: 1)
  - [x] Tạo page/component checkout theo flow tuyến tính từ cart hợp lệ
  - [x] Hiển thị rõ breakdown chi phí (tạm tính, phí vận chuyển, tổng cộng)
  - [x] Giữ loading/disabled/error state rõ ràng cho form và CTA chính
- [x] Đảm bảo accessibility + UX nhất quán theo spec checkout (AC: 1)
  - [x] Label luôn hiển thị, lỗi hiển thị inline và focus về field lỗi đầu tiên
  - [x] Giữ keyboard navigation đầy đủ, focus-visible rõ, không truyền nghĩa chỉ bằng màu
  - [x] Không reset toàn bộ form khi fail một phần submit
- [x] Thiết lập regression guard cho Story 4.2 (AC: 1)
  - [x] Unit test cho checkout service: validate address, shipping selection, total calculation
  - [x] Route test cho auth, validation, cart gate, response envelope/error mapping
  - [x] UI/integration test cho checkout form validation + keyboard path + error recovery
  - [x] Chạy `npm run lint` và `npm run build`

### Review Findings

- [x] [Review][Patch] Checkout UI hiện chỉ cho chọn địa chỉ từ profile, chưa hỗ trợ nhánh “nhập/chọn địa chỉ” theo story [`tmdt/src/app/(customer)/checkout/checkout-client.tsx:783`]
- [x] [Review][Patch] Validation checkout chưa có rule cho nhánh địa chỉ sai định dạng dù testing requirements yêu cầu cover [`tmdt/src/shared/validation/checkout.js:20`]
- [x] [Review][Patch] Test checkout client chỉ assert chuỗi source, chưa kiểm chứng keyboard/focus/error recovery ở runtime như integration test [`tmdt/src/app/(customer)/checkout/checkout-client.test.js:5`]
- [x] [Review][Patch] Checkout client chưa xử lý rõ nhánh `AUTH_FORBIDDEN` (403), khiến người dùng chỉ nhận lỗi chung thay vì flow auth rõ ràng [`tmdt/src/app/(customer)/checkout/checkout-client.tsx:640`]
- [x] [Review][Defer] Rủi ro CSRF cho `POST /api/checkout` dùng cookie auth nhưng chưa có bằng chứng anti-CSRF ở layer này [`tmdt/src/app/api/checkout/route.js:383`] — deferred, pre-existing
- [x] [Review][Defer] Guard kép role cookie + session ở trang `/checkout` có thể chặn người dùng hợp lệ khi cookie role stale [`tmdt/src/app/(customer)/checkout/page.tsx:585`] — deferred, pre-existing

## Dev Notes

- Story 4.2 hiện thực FR22/FR23/FR24, tiếp nối trực tiếp Story 4.1 (FR19/FR20/FR21) và là gateway trước Story 4.3 (tạo đơn + thanh toán).
- Scope story chỉ dừng ở checkout draft/summary (địa chỉ, vận chuyển, tổng tiền). Không tạo order thực tế và không khởi tạo giao dịch payment trong story này.
- Bắt buộc tái sử dụng snapshot cart validity đã có từ `GET /api/cart?mode=checkout` để tránh duplicate rule.

### Technical Requirements

- Bắt buộc hỗ trợ cung cấp/chọn địa chỉ giao hàng trong checkout (FR22).
- Bắt buộc hỗ trợ chọn phương thức vận chuyển hợp lệ (FR23).
- Bắt buộc tính và hiển thị tổng giá trị đơn hàng chính xác trước xác nhận đặt hàng (FR24).
- Bắt buộc đáp ứng NFR15/NFR16/NFR17 cho form quan trọng: label rõ, thông báo lỗi dễ hiểu, focus/disabled/loading semantics chuẩn.
- Bắt buộc giữ NFR2 (checkout nhanh, ít ma sát) bằng flow ngắn gọn, hạn chế bước dư thừa.

### Architecture Compliance

- Route layer `src/app/*` chỉ xử lý boundary/HTTP; business logic checkout đặt trong `src/modules/checkout/*`.
- Validation input ở `src/shared/validation/*`; không nhúng rule nghiệp vụ vào UI component.
- Response phải theo envelope chuẩn có `X-Correlation-Id` như các route auth/cart.
- Reuse boundaries hiện có: cart gate từ `src/modules/cart/*`, auth guard từ `src/modules/identity/authorization.js`.
- Không triển khai webhook/payment adapter trong story này; giữ integration payment cho Story 4.3+.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js 16.2.3 + React 19 + TypeScript + Tailwind CSS 4.
- Không thêm dependency form/state mới nếu có thể dùng pattern hiện có trong project.
- Ưu tiên logic deterministic, dễ test, dễ debug; tránh abstraction lớn ngoài scope.

### File Structure Requirements

- Ưu tiên tạo/chỉnh sửa trong phạm vi:
  - `tmdt/src/modules/checkout/*`
  - `tmdt/src/app/api/checkout/*`
  - `tmdt/src/shared/validation/*` (DTO checkout)
  - `tmdt/src/app/(customer)/checkout/*` hoặc route customer checkout tương đương theo App Router hiện hữu
- Có thể tái sử dụng dữ liệu địa chỉ từ profile/account module hiện có.
- Không sửa contract tạo đơn/thanh toán/order tracking của Story 4.3/4.4/4.5.

### Testing Requirements

- Cover tối thiểu các nhánh:
  - cart hợp lệ/không hợp lệ trước checkout,
  - address thiếu/sai định dạng,
  - shipping option không hợp lệ,
  - tính tổng tiền đúng theo các thành phần chi phí,
  - unauthorized/forbidden request vào checkout API.
- Kiểm thử response envelope + `X-Correlation-Id` cho success/error.
- Kiểm thử keyboard path và focus state cho form checkout.
- Bắt buộc pass `npm run lint` + `npm run build` trước khi chuyển `review`.

### Previous Story Intelligence

- Story 4.1 đã chuẩn hóa cart response envelope có `state`; checkout route phải giữ nhất quán pattern này.
- Story 4.1 đã có gate `GET /api/cart?mode=checkout`; Story 4.2 phải reuse gate này thay vì tái tạo rule validity.
- Story 4.1 review đã xử lý race/UX cho cart client; checkout form cần giữ nguyên nguyên tắc không mutate state theo mỗi keystroke nếu gây side effect.
- Hai defer từ Story 4.1 (CSRF và role-cookie stale) là pre-existing; không mở rộng xử lý trong Story 4.2 trừ khi user đổi scope.

### Git Intelligence Summary

- Recent commits hiện có:
  - `1108dbe`: auth flow story 1.2
  - `445df65`: BMAD framework bootstrap
- Working tree có nhiều thay đổi chưa commit; khi triển khai Story 4.2 cần giới hạn đúng scope checkout để tránh chạm rộng sang payment/order.

### Latest Technical Information

- Epic 4.2 chốt AC: cart hợp lệ → checkout chọn địa chỉ/vận chuyển + tổng tiền chính xác + form theo validation/a11y pattern.
- Architecture đã map rõ capability checkout vào `src/modules/checkout` và `src/app/api/checkout`.
- UX spec yêu cầu checkout ngắn gọn, label rõ, validation 2 lớp, keyboard navigation đầy đủ, feedback không phụ thuộc màu.

### Project Context Reference

- Không tìm thấy `project-context.md` trong workspace hiện tại.
- Nguồn chuẩn cho story này: `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md`, và implementation artifact Story 4.1.

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:413-426`
- FR22/FR23/FR24: `_bmad-output/planning-artifacts/prd.md:316-319`
- NFR2/NFR15/NFR16/NFR17: `_bmad-output/planning-artifacts/prd.md:358,377-379`
- Checkout capability mapping + boundaries: `_bmad-output/planning-artifacts/architecture.md:329,335-337,355`
- UX checkout principles (speed minimal, validation, accessibility, keyboard): `_bmad-output/planning-artifacts/ux-design-specification.md:61,340,582-587,645-650`
- Previous story intelligence: `_bmad-output/implementation-artifacts/4-1-quan-ly-gio-hang-va-kiem-tra-hop-le.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `node --experimental-default-type=module --test --test-concurrency=1 src/modules/checkout/checkout-service.test.js src/app/api/checkout/route.test.js "src/app/(customer)/checkout/checkout-client.test.js"` (pass)
- `node --experimental-default-type=module --test --test-concurrency=1 src/app/api/account-actions.test.js src/modules/cart/cart-service.test.js src/app/api/cart/route.test.js "src/app/(customer)/cart/cart-client.test.js" src/modules/checkout/checkout-service.test.js src/app/api/checkout/route.test.js "src/app/(customer)/checkout/checkout-client.test.js"` (pass)
- `npm run lint` (pass)
- `npm run build` (pass)

### Completion Notes List

- Hoàn tất checkout contract với payload draft `address/shippingMethod/note`, response envelope `success/state/error/message/data` và header `X-Correlation-Id`.
- Hoàn tất checkout domain service: reuse cart gate từ Story 4.1, validate address theo profile, validate shipping option, và tính tổng tiền `subtotal + shippingFee - discount`.
- Hoàn tất API checkout (`GET/POST`) với auth guard customer, mapping lỗi `CHECKOUT_*`, và giữ boundary validation tại `src/shared/validation/checkout.js`.
- Hoàn tất UI `/checkout` cho chọn địa chỉ, chọn vận chuyển, nhập ghi chú, hiển thị breakdown chi phí, loading/disabled/error state, focus-first-invalid-field, và keyboard/focus-visible semantics.
- Hoàn tất nối flow từ `/cart` sang `/checkout` sau khi cart checkout-gate pass.
- Hoàn tất regression tests cho checkout service, checkout route, checkout client + chạy lại regression account/cart liên quan.

### File List

- `tmdt/src/shared/validation/checkout.js`
- `tmdt/src/modules/checkout/checkout-service.js`
- `tmdt/src/modules/checkout/checkout-service.test.js`
- `tmdt/src/app/api/checkout/route.js`
- `tmdt/src/app/api/checkout/route.test.js`
- `tmdt/src/app/(customer)/checkout/page.tsx`
- `tmdt/src/app/(customer)/checkout/checkout-client.tsx`
- `tmdt/src/app/(customer)/checkout/checkout-client.test.js`
- `tmdt/src/app/(customer)/cart/cart-client.tsx`
- `_bmad-output/implementation-artifacts/4-2-checkout-dia-chi-van-chuyen-va-tong-tien.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-13: Tạo mới Story 4.2 từ trạng thái `backlog` và chuẩn hóa context triển khai theo BMAD create-story workflow.
