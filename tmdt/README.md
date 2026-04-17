# TMDT - Hệ thống Thương mại điện tử

Dự án web e-commerce xây bằng **Next.js 16 + React 19**, hỗ trợ đầy đủ luồng mua hàng từ catalog đến checkout/payment, cùng các màn vận hành cho admin và warehouse.

## Tính năng chính

- **Auth & RBAC**: đăng ký/đăng nhập, phân quyền `customer` / `admin` / `warehouse`
- **Catalog**: duyệt danh mục, xem chi tiết sản phẩm, biến thể size/màu
- **Cart & Checkout**: quản lý giỏ hàng, tạo draft checkout, đặt đơn
- **Payment**: online/COD, callback webhook, retry payment
- **Order Tracking**: theo dõi trạng thái đơn và vận chuyển
- **Admin**: quản lý sản phẩm, đơn hàng, dashboard, reports
- **Warehouse**: hàng chờ xử lý và thao tác vận hành
- **AI Try-On & Recommendation**: thử đồ AI theo phiên và gợi ý sản phẩm

---

## Kiến trúc ngắn gọn

- `src/app/**`: App Router pages + API routes
- `src/app/api/**/route.js`: lớp API adapter (validate/auth/call service)
- `src/modules/**`: business logic theo domain
- `src/components/**`: UI components và layout dùng lại
- `prisma/schema.prisma`: schema dữ liệu chuẩn hóa
- `.data/`: file-backed stores runtime

---

## Yêu cầu môi trường

Xem chi tiết tại [`REQUIREMENTS.md`](./REQUIREMENTS.md).

Tối thiểu:
- Node.js 18+
- npm

---

## Cài đặt nhanh

```bash
cd tmdt
npm install
```

Tạo file môi trường (nếu chưa có):

```bash
cp .env.example .env
```

---

## Chạy dự án

### Dev
```bash
npm run dev
```
Mở: http://localhost:3000

### Production build
```bash
npm run build
npm run start
```

---

## Database / Prisma

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Reset local:
```bash
npm run db:setup
```

---

## Test & Lint

```bash
npm run lint
node --test src/**/*.test.js
```

Chạy 1 test file:
```bash
node --test src/app/api/checkout/route.test.js
```

---

## API & tài liệu bổ sung

- API routes: `src/app/api/**/route.js`
- Tài liệu chi tiết đã tạo trong `../docs/`:
  - `architecture.md`
  - `api-contracts.md`
  - `data-models.md`
  - `development-guide.md`

---

## Lưu ý bảo mật

Các biến môi trường quan trọng:
- `SESSION_COOKIE_SECRET`
- `PAYMENT_WEBHOOK_SECRET`
- `TRYON_TIMEOUT_MS`
- `DATABASE_URL`

Không commit secrets lên repository.
