# Story 1.1: Khởi tạo dự án từ starter template

Status: done

## Story

As a nhóm phát triển,
I want khởi tạo codebase từ Next.js starter đã chốt,
so that toàn bộ stories tiếp theo triển khai trên nền tảng thống nhất.

## Acceptance Criteria

1. Given repository chưa có nền tảng ứng dụng chuẩn, when nhóm thực hiện khởi tạo bằng `npx create-next-app@latest tmdt --typescript --tailwind`, then project được tạo với cấu trúc ban đầu, dependencies cốt lõi và cấu hình TypeScript/Tailwind hoạt động.
2. Given project đã được khởi tạo, when chạy local development, then ứng dụng chạy thành công để làm nền cho các story kế tiếp.

## Tasks / Subtasks

- [x] Khởi tạo project theo starter đã chốt (AC: 1)
  - [x] Chạy lệnh: `npx create-next-app@latest tmdt --typescript --tailwind`
  - [x] Bảo đảm structure nền đúng theo kiến trúc App Router
- [x] Chuẩn hóa baseline cấu trúc theo architecture (AC: 1)
  - [x] Thiết lập các thư mục nền sẽ dùng ở các story sau: `src/modules`, `src/shared`, `src/app/api`
  - [x] Giữ naming conventions và boundaries đúng tài liệu kiến trúc
- [x] Xác nhận môi trường local chạy được (AC: 2)
  - [x] Cài dependency và chạy dev server
  - [x] Kiểm tra app load thành công ở route mặc định
- [x] Chuẩn bị guardrails cho story kế tiếp (AC: 2)
  - [x] Đảm bảo có file env mẫu (`.env.example`) và config nền
  - [x] Không thêm logic business/domain ở story setup

## Dev Notes

- Story này là story đầu tiên bắt buộc theo kiến trúc: project initialization phải đứng trước toàn bộ implementation stories.
- Không triển khai business logic ở story này; chỉ thiết lập nền tảng kỹ thuật để các stories sau phát triển an toàn.
- Giữ đúng nguyên tắc architecture: `src/app` cho routing/composition, `src/modules` cho business logic, `src/shared` cho cross-cutting.
- Áp dụng chuẩn naming ngay từ đầu để tránh drift khi scale team/agent.

### Technical Requirements

- Starter command bắt buộc: `npx create-next-app@latest tmdt --typescript --tailwind`.
- Runtime/language: TypeScript-first trên Next.js App Router.
- Styling: Tailwind CSS preconfigured.
- Không thêm package ngoài phạm vi setup nếu chưa có yêu cầu story.

### Architecture Compliance

- Ưu tiên cấu trúc feature-first theo kiến trúc đã chốt.
- Không đặt domain logic vào `src/shared`.
- API route về sau sẽ đặt tại `src/app/api/*`.
- Giữ sẵn đường mở rộng cho modules tích hợp `ai/payment/shipping` theo boundary đã định.

### File Structure Requirements

- Baseline expected:
  - `src/app/` (routing + layout)
  - `src/modules/` (feature modules)
  - `src/shared/` (utils/config/types/observability)
- Không tạo trước toàn bộ files nghiệp vụ của epic sau; chỉ tạo nền tối thiểu để tránh upfront overbuild.

### Testing Requirements

- Smoke test thủ công cho story setup:
  - App khởi động được ở local.
  - Build pipeline cơ bản của Next.js hoạt động.
- Chưa yêu cầu test nghiệp vụ ở story này.

### Dependencies

- Không phụ thuộc story trước (đây là story đầu tiên).
- Là dependency bắt buộc cho các stories 1.2+.

### Risks / Guardrails

- Tránh tạo project sai stack (không dùng Vite/Remix cho story này).
- Tránh đặt sai root folder hoặc sai cấu trúc gây lệch toàn bộ stories sau.
- Tránh thêm logic auth/catalog/payment trong story setup.

### References

- Story source: `_bmad-output/planning-artifacts/epics.md:221`
- FR mapping/story intent: `_bmad-output/planning-artifacts/epics.md:227`
- Starter decision + command: `_bmad-output/planning-artifacts/architecture.md:76`
- Architecture note “first implementation story”: `_bmad-output/planning-artifacts/architecture.md:107`
- Structure boundaries: `_bmad-output/planning-artifacts/architecture.md:335`
- Structure mapping: `_bmad-output/planning-artifacts/architecture.md:349`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npm run build` (Next.js build thành công)
- `npm run lint` (eslint pass)
- `npm run dev -- --port 3001` (dev server ready)

### Completion Notes List

- Đã khởi tạo thành công project Next.js App Router bằng starter command đã chốt.
- Đã thiết lập baseline directories theo kiến trúc: `src/modules`, `src/shared`, `src/app/api`.
- Đã bổ sung `.env.example` làm cấu hình mẫu cho các story kế tiếp.
- Đã verify khả năng chạy local qua build/lint/dev.

### File List

- `_bmad-output/implementation-artifacts/1-1-khoi-tao-du-an-tu-starter-template.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `tmdt/.env.example`
- `tmdt/.gitignore`
- `tmdt/eslint.config.mjs`
- `tmdt/next.config.ts`
- `tmdt/package.json`
- `tmdt/package-lock.json`
- `tmdt/postcss.config.mjs`
- `tmdt/tsconfig.json`
- `tmdt/next-env.d.ts`
- `tmdt/README.md`
- `tmdt/CLAUDE.md`
- `tmdt/AGENTS.md`
- `tmdt/public/*`
- `tmdt/src/app/layout.tsx`
- `tmdt/src/app/page.tsx`
- `tmdt/src/app/globals.css`
- `tmdt/src/app/favicon.ico`
- `tmdt/src/modules/.gitkeep`
- `tmdt/src/shared/.gitkeep`
- `tmdt/src/app/api/.gitkeep`

## Change Log

- 2026-04-10: Hoàn tất implementation Story 1.1, verify build/lint/dev và chuyển trạng thái sang review.
