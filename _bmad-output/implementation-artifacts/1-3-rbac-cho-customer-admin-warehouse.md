# Story 1.3: RBAC cho Customer, Admin, Warehouse

Status: done

## Story

As a quản trị hệ thống,
I want hệ thống áp quyền theo vai trò,
so that mỗi người chỉ truy cập đúng chức năng được phép.

## Acceptance Criteria

1. Given người dùng đã đăng nhập với một vai trò cụ thể, when người dùng truy cập route hoặc API ngoài quyền, then hệ thống chặn truy cập và trả lỗi AUTH_* phù hợp, and route/API đúng quyền vẫn hoạt động bình thường.

## Tasks / Subtasks

- [x] Chuẩn hóa role model trong Identity module (AC: 1)
  - [x] Bổ sung role vào user model/store với tập giá trị rõ ràng: `customer | admin | warehouse`
  - [x] Đảm bảo account mới mặc định role `customer`
  - [x] Chuẩn hóa hàm lấy session đã đăng nhập kèm thông tin role
- [x] Xây dựng guard RBAC dùng lại được cho route/API (AC: 1)
  - [x] Tạo helper authorization trong `src/modules/identity` (không nhúng business logic vào route handlers)
  - [x] Áp pattern chặn truy cập nhất quán cho cả page route và API route
  - [x] Chuẩn hóa lỗi quyền truy cập theo namespace `AUTH_*`
- [x] Áp RBAC vào các điểm truy cập hiện có của Story 1.x (AC: 1)
  - [x] Giữ khu vực customer (`/cart`) chỉ cho role `customer`
  - [x] Tạo tối thiểu các endpoint/route đại diện cho `admin` và `warehouse` để chứng minh guard hoạt động
  - [x] Xác minh truy cập đúng quyền vẫn pass, trái quyền bị chặn
- [x] Chuẩn hóa phản hồi lỗi/quan sát vận hành tại boundary API (AC: 1)
  - [x] Trả HTTP status phù hợp cho unauthorized/forbidden
  - [x] Giữ format lỗi nhất quán với chuẩn kiến trúc hiện tại
  - [x] Thêm `X-Correlation-Id` cho API mới/chỉnh sửa theo architecture contract
- [x] Kiểm thử RBAC end-to-end cho các role chính (AC: 1)
  - [x] Test case đúng quyền cho customer/admin/warehouse
  - [x] Test case sai quyền (cross-role access) cho cả route và API
  - [x] Chạy `npm run lint` và `npm run build`

### Review Findings

- [x] [Review][Patch] Guard `/cart` chưa xác thực session token với session store, chỉ kiểm tra tồn tại cookie token + role nên có thể cho phép truy cập khi session server-side đã hết hạn/không còn hợp lệ [tmdt/src/app/(customer)/cart/page.tsx:11]

## Dev Notes

- Story này hiện thực FR3 (RBAC) sau khi FR1/FR2 đã hoàn thành ở Story 1.2.
- Trọng tâm là enforcement quyền truy cập theo role tại boundary route/API, không mở rộng sang profile/audit management (để Story 1.4).
- Tận dụng nền sẵn có từ Story 1.2: auth service, session token cookie, customer guard server-side.

### Technical Requirements

- Bắt buộc enforce RBAC cho 3 vai trò: `Customer`, `Admin`, `Warehouse` (FR3, NFR6).
- Chặn truy cập ngoài quyền phải trả lỗi `AUTH_*` nhất quán với AC story.
- Không lưu hoặc log dữ liệu nhạy cảm trong payload lỗi authorization.
- Giữ nguyên nguyên tắc least-privilege tại boundary truy cập.

### Architecture Compliance

- Module identity/RBAC đặt tại `src/modules/identity`; API auth ở `src/app/api/auth`; enforcement route-level theo `src/middleware.ts` khi phù hợp.
- `src/app` chỉ làm routing/composition; không đặt authorization business rules trực tiếp trong UI component.
- Duy trì bounded-module structure, không kéo logic RBAC sang `src/shared` trừ utility thuần cross-cutting.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js App Router + TypeScript + Tailwind.
- Vì project dùng Next.js 16.x với thay đổi API/convention, kiểm tra guide trong `node_modules/next/dist/docs/` trước khi chốt middleware/handler patterns.
- Không thêm dependency mới nếu chưa thực sự cần cho scope Story 1.3.

### File Structure Requirements

- Ưu tiên đụng/chỉnh các vùng:
  - `tmdt/src/modules/identity/*`
  - `tmdt/src/app/api/auth/*` (nếu cần enrich session/auth context)
  - `tmdt/src/app/(customer)/*`
  - `tmdt/src/middleware.ts` (nếu triển khai centralized guard)
- Nếu cần route/API minh họa cho admin/warehouse, tạo theo module boundary hiện hữu và giới hạn tối thiểu để chứng minh AC.
- Không triển khai sớm nghiệp vụ hồ sơ người dùng, khóa/mở khóa tài khoản, audit log chi tiết của Story 1.4.

### Testing Requirements

- Tối thiểu phải có các nhóm kiểm thử:
  - Đúng quyền: customer/admin/warehouse truy cập resource của chính mình.
  - Sai quyền: từng role truy cập resource role khác bị chặn.
  - Chưa đăng nhập: truy cập protected route/API bị chặn theo cơ chế đã chọn.
- Kiểm tra nhất quán mã lỗi `AUTH_*`, HTTP status và payload lỗi.
- Re-run `npm run lint` + `npm run build` trước khi chuyển review.

### Previous Story Intelligence

- Story 1.2 đã hoàn tất customer auth flow với register/login/logout và validation/input boundary rõ ràng.
- Đã có server-side guard cho `/cart`; Story 1.3 mở rộng guard này thành role-based.
- Review patches từ Story 1.2 đã xử lý các rủi ro chính: race condition tạo user, session TTL check, chuẩn hóa catch exception ở auth routes.
- Hạn chế đã defer: session store in-memory không phù hợp multi-instance; giữ nguyên trạng trong Story 1.3 (không mở rộng infra scope).

### Git Intelligence Summary

- Commit gần nhất (`1108dbe`) đã thiết lập auth nền và cấu trúc identity module; ưu tiên mở rộng trên nền này thay vì tạo nhánh logic mới.
- Commit khởi tạo (`445df65`) đặt BMAD workflow/artifacts; cần duy trì cập nhật trạng thái story và sprint-status nhất quán.

### Latest Technical Information

- Next.js 16 dùng App Router + Route Handlers với một số thay đổi so với phiên bản cũ; khi triển khai middleware/headers/cookies cần đối chiếu docs nội bộ dự án (`node_modules/next/dist/docs/`) để tránh dùng pattern lỗi thời.

### Project Context Reference

- Không tìm thấy `project-context.md` trong workspace hiện tại; sử dụng `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md` làm nguồn chuẩn.

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:251-264`
- FR3 requirement: `_bmad-output/planning-artifacts/prd.md:291`
- NFR6 role-based access: `_bmad-output/planning-artifacts/prd.md:364`
- Identity/RBAC architecture mapping: `_bmad-output/planning-artifacts/architecture.md:352`
- AUTH_* error namespace: `_bmad-output/planning-artifacts/architecture.md:183`
- Correlation ID requirement: `_bmad-output/planning-artifacts/architecture.md:157`
- Security + RBAC architectural principles: `_bmad-output/planning-artifacts/architecture.md:24,29,47`
- UX error/focus/form accessibility baselines: `_bmad-output/planning-artifacts/ux-design-specification.md:186,324,327,583,649`
- Previous story learnings: `_bmad-output/implementation-artifacts/1-2-dang-ky-va-dang-nhap-tai-khoan-khach-hang.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npm run lint` (pass)
- `npm run build` (pass)
- RBAC smoke test local:
  - register customer: 201
  - login admin/warehouse/customer: 200
  - `GET /api/admin/ping` with admin: 200
  - `GET /api/admin/ping` with customer: 403 (`AUTH_FORBIDDEN`)
  - `GET /api/admin/ping` anonymous: 401 (`AUTH_UNAUTHORIZED`)
  - `GET /api/warehouse/ping` with warehouse: 200
  - `GET /api/warehouse/ping` with admin: 403 (`AUTH_FORBIDDEN`)
  - `/cart` với customer: 200; với admin: 307 redirect `/login`

### Completion Notes List

- Thêm role model rõ ràng trong identity store (`customer | admin | warehouse`) và mặc định role `customer` khi tạo tài khoản.
- Chuẩn hóa session context có role, thêm helper authorization dùng lại được cho API.
- Bổ sung endpoint đại diện cho RBAC verification: `GET /api/admin/ping`, `GET /api/warehouse/ping`.
- Chuẩn hóa mã lỗi quyền truy cập theo `AUTH_UNAUTHORIZED` (401) và `AUTH_FORBIDDEN` (403).
- Bổ sung `X-Correlation-Id` cho auth routes và RBAC-protected API routes.
- Cập nhật guard `/cart` để chỉ cho phép customer hợp lệ truy cập.

### File List

- `tmdt/src/modules/identity/user-store.js`
- `tmdt/src/modules/identity/session-store.js`
- `tmdt/src/modules/identity/auth-service.js`
- `tmdt/src/modules/identity/authorization.js`
- `tmdt/src/modules/identity/session-context.js`
- `tmdt/src/app/api/auth/register/route.js`
- `tmdt/src/app/api/auth/login/route.js`
- `tmdt/src/app/api/auth/logout/route.js`
- `tmdt/src/app/api/admin/ping/route.js`
- `tmdt/src/app/api/warehouse/ping/route.js`
- `tmdt/src/app/(customer)/cart/page.tsx`
- `_bmad-output/implementation-artifacts/1-3-rbac-cho-customer-admin-warehouse.md`

## Change Log

- 2026-04-10: Tạo story 1.3 với context đầy đủ và đặt trạng thái `ready-for-dev`.
- 2026-04-10: Hoàn tất triển khai RBAC Story 1.3, cập nhật trạng thái `review` sau khi pass lint/build và smoke test quyền truy cập.
