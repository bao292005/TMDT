# Source Tree Analysis

## 1. Cấu trúc tổng quan

```text
tmdt/
├── prisma/                     # Schema và seed dữ liệu
├── public/                     # Static assets public
├── src/
│   ├── app/                    # Next.js App Router (UI pages + API routes)
│   │   ├── (public)/           # Màn public (home, products)
│   │   ├── (auth)/             # Đăng nhập/đăng ký
│   │   ├── (customer)/         # Màn khách hàng sau đăng nhập
│   │   ├── (warehouse)/        # Màn kho
│   │   ├── admin/              # Màn quản trị
│   │   └── api/                # HTTP API adapters (route.js)
│   ├── components/             # UI components/layout/primitives
│   ├── modules/                # Business logic theo domain
│   ├── jobs/                   # Scheduled/background jobs (vd reconciliation)
│   └── shared/                 # Validation, config dùng chung
├── .data/                      # File-backed data stores runtime
├── package.json
├── tsconfig.json
└── next.config.ts
```

## 2. Phân tích thư mục trọng yếu

### `src/app/`
- Chứa toàn bộ entrypoints theo App Router.
- `layout.tsx` là root layout toàn ứng dụng.
- Route group tách bối cảnh giao diện theo vai trò/ngữ cảnh.

### `src/app/api/`
- Mỗi endpoint là một `route.js`.
- Vai trò chính: validate input, kiểm tra auth/role, gọi module service, chuẩn hóa response.

### `src/modules/`
- Trung tâm nghiệp vụ:
  - `identity`: auth/session/RBAC/profile.
  - `catalog`: danh mục và chi tiết sản phẩm.
  - `cart`, `checkout`, `order`, `payment`: xương sống giao dịch mua hàng.
  - `tryon`, `recommendation`: tính năng AI và gợi ý cá nhân hóa.
  - `warehouse`, `reporting`: vận hành nội bộ.
  - `integrations/*`: adapter tích hợp ngoài (payment, shipping, ai).

### `src/components/`
- Chứa layout chung (`Header`, `Footer`, `storefront-layout`) và UI primitives (`ActionButton`, `Input`, `FeedbackMessage`, `StatePanel`, `PageShell`).

### `prisma/`
- Chứa schema dữ liệu chuẩn hóa (`schema.prisma`) và seed script.

### `.data/`
- Lưu dữ liệu file-based cho nhiều store runtime.

## 3. Entry points quan trọng
- UI root: `src/app/layout.tsx`
- Trang home root: `src/app/page.tsx`
- API lane chính: `src/app/api/**/route.js`
- Domain orchestration tiêu biểu: `src/modules/order/order-service.js`

## 4. Nhận xét kiến trúc thư mục
- Cấu trúc đang bám pattern chuẩn Next.js App Router.
- Domain modules được tách rõ, thuận lợi cho bảo trì và mở rộng.
- API layer không nhúng nghiệp vụ nặng, giúp giữ tính nhất quán thiết kế.
