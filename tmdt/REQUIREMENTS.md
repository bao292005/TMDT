# REQUIREMENTS

## 1) System Requirements

- **OS**: macOS / Linux / Windows
- **Node.js**: `>= 18` (khuyến nghị LTS mới)
- **npm**: đi kèm Node.js
- **Disk**: tối thiểu 1GB trống cho dependencies/build cache

## 2) Runtime & Framework

- Next.js `16.2.3`
- React `19.2.4`
- React DOM `19.2.4`

## 3) Core Dependencies

- `@prisma/client`
- `redis` (cho tích hợp/khả năng mở rộng)

## 4) Dev Dependencies

- `prisma`
- `typescript`
- `eslint`
- `eslint-config-next`
- `tailwindcss`
- `@tailwindcss/postcss`

## 5) Environment Variables (required)

Tạo `.env` từ `.env.example` và đảm bảo có:

- `DATABASE_URL`
- `SESSION_COOKIE_SECRET`
- `PAYMENT_WEBHOOK_SECRET`
- `TRYON_TIMEOUT_MS` (optional, có default/cap trong code)

## 6) Required Commands

Cài đặt:
```bash
npm install
```

Chạy dev:
```bash
npm run dev
```

Build production:
```bash
npm run build
npm run start
```

Lint:
```bash
npm run lint
```

## 7) Database Requirements

- Prisma schema tại `prisma/schema.prisma`
- Lệnh khởi tạo:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## 8) Test Requirements

Dùng Node test runner:
```bash
node --test src/**/*.test.js
```
