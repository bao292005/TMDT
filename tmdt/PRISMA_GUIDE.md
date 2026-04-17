# Prisma Data Foundation Guide (Epic 9)

## 📌 Hướng dẫn cài đặt và Reset Local Database

Dự án hiện đã thiết lập `Prisma ORM` với SQLite làm foundation persistence baseline cho hệ thống TMDT theo thiết kế của `Story 9.1`.

### 1) Khởi tạo và thiết lập

Để setup mới database, thực thi:
```bash
npm run db:setup
```
*Lệnh này reset DB local về baseline migration và seed lại dữ liệu mẫu (`prisma/seed.js`) để có trạng thái sạch, lặp lại an toàn cho dev.*

### 2) Reset dữ liệu dev local
Trong trường hợp database bị rối, dev có thể reset toàn bộ về trạng thái của seed bằng lệnh:
```bash
npx prisma migrate reset --force
```
*(Hoặc npm run db:reset)*

### 3) Prisma Studio
Để xem trực quan dữ liệu đã được seed bằng giao diện UI của Prisma:
```bash
npx prisma studio
```

---

## ⚠️ Coexistence Note (Giai đoạn chuyển giao Epic 9)

> **QUAN TRỌNG:** Hiện tại ứng dụng (các Repository/Service) **CHƯA ĐƯỢC CHUYỂN SANG (cutover)** để nối vào DB này.

- Mọi API route (`/api/*`), NextJS App Router server component và business logic **vẫn đang đọc/ghi vào các persistence store tạm** (in-memory, JSON File tại thư mục `.data/`).
- Các **Story 9.3** và **Story 9.4** sẽ từ từ thay thế (refactor) repository implementation (ví dụ thay `order-store.js` bằng Prisma `prisma.order`).
- Không sửa schema trong Prisma nếu chưa tuân thủ đúng bước review thiết kế của 9.1 hoặc chưa check tác động lên các mapping.
- Nếu phải thêm cột mới ở thời điểm này, hãy tạo tiếp migration bằng lệnh:
  `npx prisma migrate dev --name <tên_migration>`
