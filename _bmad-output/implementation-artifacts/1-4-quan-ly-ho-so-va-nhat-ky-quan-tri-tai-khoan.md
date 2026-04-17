# Story 1.4: Quản lý hồ sơ và nhật ký quản trị tài khoản

Status: done

## Story

As a người dùng và admin,
I want cập nhật hồ sơ cá nhân và ghi nhận hành động quản trị,
so that thông tin tài khoản được duy trì chính xác và có khả năng truy vết.

## Acceptance Criteria

1. Given người dùng đã đăng nhập, when người dùng cập nhật hồ sơ hoặc admin khóa/mở khóa tài khoản, then hệ thống lưu dữ liệu đúng ràng buộc và cập nhật trạng thái tài khoản, and ghi audit log đầy đủ cho hành động quản trị nhạy cảm.

## Tasks / Subtasks

- [x] Thiết kế domain profile + account status trong identity module (AC: 1)
  - [x] Bổ sung model hồ sơ người dùng gồm tối thiểu: `fullName`, `phone`, `addresses` (tối đa 3 địa chỉ)
  - [x] Chuẩn hóa vòng đời trạng thái tài khoản cho thao tác admin: `active | locked`
  - [x] Đảm bảo tương thích dữ liệu người dùng hiện có từ Story 1.2/1.3 (backfill mặc định an toàn)
- [x] Triển khai API cập nhật hồ sơ cho user đã đăng nhập (AC: 1)
  - [x] Tạo endpoint profile trong boundary `src/app/api` và đặt business logic trong `src/modules/identity`
  - [x] Validate input chặt chẽ (format phone, số lượng địa chỉ tối đa 3, field bắt buộc)
  - [x] Trả response/error theo chuẩn kiến trúc hiện tại và thêm `X-Correlation-Id`
- [x] Triển khai API admin khóa/mở khóa tài khoản với RBAC (AC: 1)
  - [x] Chỉ role `admin` được phép thực hiện hành động khóa/mở khóa user
  - [x] Chặn tự khóa tài khoản admin đang thao tác (self-lock) để tránh lockout ngoài ý muốn
  - [x] Chuẩn hóa lỗi quyền truy cập theo namespace `AUTH_*` và lỗi nghiệp vụ phù hợp
- [x] Ghi audit log cho hành động quản trị nhạy cảm (AC: 1)
  - [x] Ghi tối thiểu các trường: `actorId`, `targetUserId`, `action`, `reason`, `timestamp`, `correlationId`
  - [x] Đảm bảo audit log không chứa dữ liệu nhạy cảm không cần thiết
  - [x] Liên kết log với response qua `correlationId` để hỗ trợ truy vết
- [x] Bổ sung UI/route tối thiểu để chứng minh luồng hoạt động (AC: 1)
  - [x] Trang profile customer cho phép cập nhật thông tin cơ bản và địa chỉ
  - [x] Luồng admin thao tác khóa/mở khóa user thông qua API representative endpoint
  - [x] Tuân thủ UX baseline: label rõ, focus/error state rõ, keyboard thao tác được
- [x] Kiểm thử đầy đủ cho profile + admin account actions (AC: 1)
  - [x] Test case cập nhật profile hợp lệ/không hợp lệ (bao gồm giới hạn 3 địa chỉ)
  - [x] Test case RBAC đúng quyền/sai quyền cho lock-unlock API
  - [x] Test case audit log được tạo đúng khi admin thao tác
  - [x] Chạy `npm run lint` và `npm run build`

### Review Findings

- [x] [Review][Patch] Ghi audit log có thể mất dữ liệu khi nhiều request đồng thời [tmdt/src/modules/identity/audit-log-store.js:28]
- [x] [Review][Patch] Lock/unlock có thể cập nhật trạng thái thành công nhưng trả lỗi nếu ghi audit log thất bại [tmdt/src/app/api/admin/users/[userId]/account-status/route.js:88]

## Dev Notes

- Story này hiện thực FR4, FR5, FR6 trên nền auth + RBAC đã hoàn thành ở Story 1.2 và 1.3.
- Trọng tâm: profile management cho customer và auditability cho admin account actions; không mở rộng sang dashboard/reporting (Epic 6).
- Cần giữ nguyên nguyên tắc least-privilege và pattern boundary: `src/app` chỉ routing/composition, business logic nằm trong module.

### Technical Requirements

- Bắt buộc hỗ trợ cập nhật hồ sơ cá nhân gồm tối thiểu: họ tên, số điện thoại, tối đa 3 địa chỉ giao hàng (FR4).
- Bắt buộc hỗ trợ admin khóa/mở khóa tài khoản người dùng (FR5).
- Bắt buộc ghi audit log cho thao tác quản trị liên quan tài khoản (FR6, NFR7).
- Error contract phải theo schema chuẩn và namespace mã lỗi kiến trúc (`AUTH_*` cho lỗi authz/authn).
- Không log dữ liệu nhạy cảm (password/token/raw secret) trong audit payload.

### Architecture Compliance

- Module chính: `tmdt/src/modules/identity/*` cho profile/account status/audit-account-actions.
- API boundary: `tmdt/src/app/api/*` (auth/profile/admin user actions), giữ `X-Correlation-Id` cho response API.
- RBAC enforcement giữ nhất quán pattern đã triển khai ở Story 1.3 (không rải business authorization vào UI component).
- Tôn trọng phân tách module: không đưa logic domain identity/admin vào `src/shared` trừ utility thuần cross-cutting.

### Library / Framework Requirements

- Giữ stack hiện tại: Next.js App Router + TypeScript + Tailwind.
- Không thêm dependency mới nếu chưa thực sự cần cho scope Story 1.4.
- Với Next.js 16.x, ưu tiên pattern route handlers/cookies/headers đang dùng nhất quán trong codebase hiện tại.

### File Structure Requirements

- Ưu tiên đụng/chỉnh các vùng:
  - `tmdt/src/modules/identity/*`
  - `tmdt/src/app/api/*` (profile/admin user actions)
  - `tmdt/src/app/(customer)/profile/*` (nếu chưa có thì tạo tối thiểu)
  - `tmdt/src/app/(admin)/*` hoặc endpoint đại diện admin theo boundary hiện hữu
- Nếu cần lưu audit dạng file/store tạm thời, đặt cùng module identity/admin; tránh tạo cross-module coupling sớm.

### Testing Requirements

- Đúng quyền: admin lock/unlock thành công; customer cập nhật profile của chính mình thành công.
- Sai quyền: customer/warehouse không được phép gọi admin account-action API.
- Validation: chặn payload profile sai định dạng, vượt quá 3 địa chỉ.
- Auditability: mỗi thao tác admin lock/unlock phải tạo audit entry có đủ trường tối thiểu.
- Regression: không phá auth flow và RBAC hiện có của Story 1.2/1.3.
- Bắt buộc pass `npm run lint` + `npm run build` trước khi chuyển `review`.

### Previous Story Intelligence

- Story 1.3 đã chuẩn hóa role model `customer | admin | warehouse`, helper RBAC, và chuẩn lỗi `AUTH_UNAUTHORIZED`/`AUTH_FORBIDDEN`.
- Story 1.3 đã thêm `X-Correlation-Id` cho auth/protected API; Story 1.4 cần giữ đồng nhất contract này.
- Guard `/cart` đã được harden để kiểm tra session server-side + role cookie signed; khi thêm profile route cần duy trì tiêu chuẩn xác thực tương tự.
- Hạn chế đã biết: session store hiện là in-memory (defer), không mở rộng infra trong story này.

### Git Intelligence Summary

- `1108dbe`: đã thiết lập auth flow khách hàng và nền identity.
- `445df65`: khởi tạo framework BMAD + artifacts; cần tiếp tục cập nhật story/sprint-status nhất quán.

### Latest Technical Information

- Dự án đang chạy Next.js 16.x; cần bám conventions App Router/Route Handlers hiện hành của repo để tránh pattern cũ.
- Ưu tiên tái sử dụng module/pattern đã có thay vì mở nhánh kiến trúc mới trong story này.

### Project Context Reference

- Không có `project-context.md` trong workspace hiện tại; dùng `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md` làm nguồn chuẩn.

### References

- Story source & AC: `_bmad-output/planning-artifacts/epics.md:266-279`
- FR4/FR5/FR6: `_bmad-output/planning-artifacts/prd.md:292-295`
- NFR7 audit logging: `_bmad-output/planning-artifacts/prd.md:365`
- Error schema + correlation header: `_bmad-output/planning-artifacts/architecture.md:152-157,181-184`
- Identity & RBAC mapping: `_bmad-output/planning-artifacts/architecture.md:329-353`
- Auditability principle: `_bmad-output/planning-artifacts/architecture.md:29,59,364,381`
- UX baseline (focus/error/keyboard/form): `_bmad-output/planning-artifacts/ux-design-specification.md:324,327,583,645,649,665`
- Previous story learnings: `_bmad-output/implementation-artifacts/1-3-rbac-cho-customer-admin-warehouse.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `node --experimental-default-type=module --test tmdt/src/app/api/account-actions.test.js` (pass 4/4)
- `npm --prefix tmdt run lint` (pass)
- `npm --prefix tmdt run build` (pass)

### Completion Notes List

- Mở rộng identity domain với `profile` (`fullName`, `phone`, tối đa 3 địa chỉ) và vòng đời `accountStatus` (`active | locked`) có backfill an toàn cho dữ liệu cũ.
- Triển khai API `GET/PUT /api/profile` với validation chặt chẽ, error contract chuẩn và `X-Correlation-Id`.
- Triển khai API `PUT /api/admin/users/[userId]/account-status` với RBAC admin-only, chặn self-lock, lock-session invalidation và audit log.
- Bổ sung UI `/profile` cho customer để cập nhật hồ sơ và quản lý địa chỉ giao hàng.
- Bổ sung test file `account-actions.test.js` bao phủ profile valid/invalid, RBAC lock-unlock, self-lock guard và audit log.

### File List

- `_bmad-output/implementation-artifacts/1-4-quan-ly-ho-so-va-nhat-ky-quan-tri-tai-khoan.md`

## Change Log

- 2026-04-11: Tạo story 1.4 với context đầy đủ và đặt trạng thái `ready-for-dev`.
