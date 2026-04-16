# 🛍️ TMĐT Storefront - AI Virtual Try-On E-commerce

Dự án Frontend Web Thương mại điện tử (Mô phỏng Shopee/Lazada) được xây dựng bằng kiến trúc hiện đại, tích hợp tính năng Thử đồ ảo (AI Virtual Try-On) và thanh toán nội địa Việt Nam.

## 🚀 Công nghệ sử dụng (Tech Stack)

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Ngôn ngữ:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Database ORM:** Prisma (PostgreSQL)
- **Icons:** Lucide React

## 📂 Cấu trúc thư mục nổi bật

- \`src/app/\`: Chứa toàn bộ các trang (Pages) và API Routes (BFF).
- \`src/modules/\`: Chứa Business Logic (gọi Database, xử lý Logic thanh toán) tách biệt khỏi UI.
- \`src/components/\`: UI components tái sử dụng (Header, Footer, ProductCard).
- \`src/store/\`: Trạng thái client-side (Giỏ hàng, Checkout).

## ✨ Tính năng chính

1. **AI Virtual Try-On:** Tích hợp gọi Microservice AI để xem trước trang phục trên ảnh người dùng.
2. **Quản lý Giỏ hàng:** Lưu trữ giỏ hàng ở Client (Zustand Persist).
3. **Thanh toán Nội địa:** API tạo URL và Webhook xử lý callback cho VNPAY & MoMo.
4. **Xác thực Người dùng:** Đăng nhập/Đăng ký và bảo vệ các trang yêu cầu bảo mật qua Middleware.
5. **Chuẩn SEO:** Tận dụng sức mạnh Server-Side Rendering (SSR) của Next.js.

## 🤝 Tác giả
Dự án được thiết kế theo chuẩn Enterprise Architecture.