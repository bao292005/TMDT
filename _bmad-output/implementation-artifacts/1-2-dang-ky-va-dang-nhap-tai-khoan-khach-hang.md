# Story 1.2: Đăng ký và đăng nhập tài khoản khách hàng

Status: done

## Story

As a khách hàng mới,
I want đăng ký và đăng nhập bằng email/mật khẩu,
so that tôi có thể truy cập khu vực mua sắm cá nhân hóa.

## Acceptance Criteria

1. Given người dùng chưa có tài khoản, when người dùng đăng ký hợp lệ và đăng nhập, then hệ thống tạo tài khoản, băm mật khẩu an toàn, tạo phiên đăng nhập, and trả lỗi chuẩn khi email trùng hoặc thông tin không hợp lệ.

## Tasks / Subtasks

- [x] Xây dựng luồng đăng ký/đăng nhập ở module identity (AC: 1)
  - [x] Tạo service/repository cho tạo tài khoản và xác thực mật khẩu trong `src/modules/identity`
  - [x] Băm mật khẩu an toàn và không lưu/ghi log plaintext password
  - [x] Chuẩn hóa mã lỗi cho các case chính: email trùng, credential không hợp lệ
- [x] Tạo API auth theo đúng boundary kiến trúc (AC: 1)
  - [x] Thêm route handlers trong `src/app/api/auth/*` cho register/login/logout
  - [x] Dùng validation input nhất quán tại boundary API
  - [x] Trả HTTP status phù hợp cho success/failure auth flows
- [x] Tạo UI auth cơ bản cho login/register (AC: 1)
  - [x] Tạo page/forms trong `src/app/(auth)/register` và `src/app/(auth)/login`
  - [x] Đảm bảo label + thông báo lỗi dễ hiểu cho form quan trọng
  - [x] Điều hướng người dùng sau đăng nhập thành công về khu vực customer flow
- [x] Thiết lập guardrails phạm vi Story 1.2 (AC: 1)
  - [x] Chỉ triển khai flow Customer auth; không triển khai RBAC đầy đủ ở story này (để Story 1.3)
  - [x] Không mở rộng sang quản lý hồ sơ/audit log (để Story 1.4)
- [x] Kiểm thử và xác nhận baseline auth hoạt động (AC: 1)
  - [x] Test API register/login cho happy path + invalid credential + duplicate email
  - [x] Smoke test đăng ký → đăng nhập → đăng xuất trên local

### Review Findings

- [x] [Review][Patch] Khu vực customer chưa có auth guard server-side [tmdt/src/app/(customer)/cart/page.tsx:1]
- [x] [Review][Patch] Race condition khi đăng ký đồng thời có thể gây duplicate/lost update [tmdt/src/modules/identity/user-store.js:34]
- [x] [Review][Patch] Session không có kiểm tra hết hạn phía server [tmdt/src/modules/identity/session-store.js:20]
- [x] [Review][Patch] Route auth chưa chuẩn hóa lỗi khi service ném exception [tmdt/src/app/api/auth/login/route.js:27]
- [x] [Review][Defer] Session store dạng in-memory không phù hợp multi-instance [tmdt/src/modules/identity/session-store.js:3] — deferred, pre-existing

## Dev Notes

- Story này bám FR1, FR2 và là bước kế tiếp ngay sau setup nền của Story 1.1.
- Cần giữ đúng module boundary: routing/composition ở `src/app`, business logic ở `src/modules/identity`, cross-cutting ở `src/shared`.
- Trọng tâm là auth luồng Customer; RBAC theo vai trò (Customer/Admin/Warehouse) sẽ hoàn thiện ở Story 1.3.

### Technical Requirements

- Bắt buộc xử lý đăng ký + đăng nhập bằng email/mật khẩu theo FR1/FR2.
- Mật khẩu phải được băm an toàn trước khi lưu trữ (NFR5).
- Phản hồi lỗi phải nhất quán, không lộ thông tin nhạy cảm (ví dụ tránh phân biệt quá chi tiết account existence ngoài trường hợp duplicate email khi register).
- Form auth phải có label và thông báo lỗi rõ ràng (NFR15).

### Architecture Compliance

- Identity & RBAC implementation path: `src/modules/identity`, `src/app/api/auth`, `src/middleware.ts`.
- API boundary: route handler gọi module service; không nhúng business logic trực tiếp trong `src/app/api/*`.
- `src/shared/*` chỉ chứa cross-cutting (validation/config/utils), không chứa domain logic identity.

### Library / Framework Requirements

- Giữ stack hiện tại của project baseline: Next.js App Router + TypeScript + Tailwind.
- Không thêm package ngoài phạm vi cần thiết cho auth flow của Story 1.2.

### File Structure Requirements

- Ưu tiên tạo/đụng các vùng sau:
  - `src/modules/identity/*`
  - `src/app/(auth)/login/*`
  - `src/app/(auth)/register/*`
  - `src/app/api/auth/*`
  - `src/shared/validation/*` (nếu cần schema input)
- Không triển khai sớm module/profile/audit của Story 1.4.

### Testing Requirements

- Kiểm thử tối thiểu cho Story 1.2:
  - Register thành công với dữ liệu hợp lệ.
  - Register thất bại khi email trùng.
  - Login thành công với credential đúng.
  - Login thất bại với credential sai.
  - Logout invalidates session theo cơ chế đã chọn.
- Chạy lint/build sau khi hoàn tất implementation.

### Previous Story Intelligence

- Story 1.1 đã xác nhận baseline App Router + cấu trúc `src/modules`, `src/shared`, `src/app/api` hoạt động ổn định.
- `.env.example` đã được giữ lại trong repo và `.gitignore` đã whitelist; tiếp tục duy trì convention này cho biến môi trường auth.
- Đã có smoke evidence cho build/lint/dev; Story 1.2 cần giữ tính ổn định tương tự trước khi chuyển review.

### References

- Story source: `_bmad-output/planning-artifacts/epics.md:236`
- Story FR mapping: `_bmad-output/planning-artifacts/epics.md:242`
- Story AC (BDD): `_bmad-output/planning-artifacts/epics.md:246`
- FR1/FR2 definition: `_bmad-output/planning-artifacts/prd.md:289`
- Security requirement password hashing (NFR5): `_bmad-output/planning-artifacts/prd.md:363`
- Form accessibility baseline (NFR15): `_bmad-output/planning-artifacts/prd.md:377`
- Identity/module mapping: `_bmad-output/planning-artifacts/architecture.md:352`
- Auth route structure: `_bmad-output/planning-artifacts/architecture.md:271`
- App structure for auth pages: `_bmad-output/planning-artifacts/architecture.md:252`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npm run lint` (pass)
- `npm run build` (pass)
- Smoke test API local (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`) với kết quả: register=201, duplicate=409, login_bad=401, login_ok=200, logout=200

### Completion Notes List

- Hoàn tất luồng register/login/logout cho Customer auth theo module boundary `src/modules/identity` + `src/app/api/auth/*`.
- Chuẩn hóa phản hồi lỗi auth tại API boundary với các mã lỗi chính: `INVALID_INPUT`, `EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`.
- Thêm UI đăng ký/đăng nhập cơ bản với label rõ ràng, hiển thị lỗi dễ hiểu và điều hướng thành công về `/cart`.
- Xác nhận chất lượng bằng lint, build và smoke test end-to-end auth flow.

### File List

- `tmdt/src/modules/identity/auth-service.js`
- `tmdt/src/modules/identity/password.js`
- `tmdt/src/modules/identity/session-store.js`
- `tmdt/src/modules/identity/user-store.js`
- `tmdt/src/shared/validation/auth.js`
- `tmdt/src/shared/validation/auth.ts`
- `tmdt/src/app/api/auth/register/route.js`
- `tmdt/src/app/api/auth/login/route.js`
- `tmdt/src/app/api/auth/logout/route.js`
- `tmdt/src/app/(auth)/register/page.tsx`
- `tmdt/src/app/(auth)/login/page.tsx`
- `tmdt/src/app/(customer)/cart/page.tsx`
- `_bmad-output/implementation-artifacts/1-2-dang-ky-va-dang-nhap-tai-khoan-khach-hang.md`

## Change Log

- 2026-04-10: Hoàn tất Story 1.2 với API auth, UI auth và kiểm thử baseline; cập nhật trạng thái sang `review`.
