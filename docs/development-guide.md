# Development Guide

## 1. Yêu cầu môi trường
- Node.js (khuyến nghị bản LTS mới)
- npm
- SQLite (thông qua Prisma datasource)

## 2. Cài đặt
```bash
cd tmdt
npm install
```

## 3. Chạy ứng dụng
```bash
npm run dev
```
Mặc định mở tại `http://localhost:3000`.

## 4. Build và chạy production
```bash
npm run build
npm run start
```

## 5. Lint
```bash
npm run lint
```

## 6. Database / Prisma
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```
Reset môi trường local:
```bash
npm run db:setup
```

## 7. Chạy test
Theo cấu hình hiện tại có nhiều file test `.test.js` với Node test runner:
```bash
node --test src/**/*.test.js
```
Chạy một test cụ thể:
```bash
node --test src/app/api/checkout/route.test.js
```

## 8. Biến môi trường quan trọng
- `SESSION_COOKIE_SECRET`
- `PAYMENT_WEBHOOK_SECRET`
- `TRYON_TIMEOUT_MS` (được giới hạn bởi logic route/service)
- `DATABASE_URL` (Prisma datasource)

## 9. Quy ước kiến trúc khi phát triển
- Không đặt business logic nặng trong `src/app/api/**`.
- Nghiệp vụ đặt trong `src/modules/**`.
- Giữ response API nhất quán với `success/state/error/message` + `X-Correlation-Id`.
- Ưu tiên tái sử dụng UI primitives trong `src/components/ui/**`.
