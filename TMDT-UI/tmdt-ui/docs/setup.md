# Hướng Dẫn Cài Đặt (Setup Guide)

## 1. Yêu cầu hệ thống
- Node.js >= 18.x
- PostgreSQL (Hoặc Docker để chạy DB ảo)
- Git

## 2. Khởi tạo dự án
\`\`\`bash
# Cài đặt thư viện
npm install

# Copy file biến môi trường
cp .env.example .env.local

# Cập nhật thông tin DATABASE_URL trong file .env.local
\`\`\`

## 3. Cấu hình Database (Prisma)
\`\`\`bash
# Áp dụng schema vào database
npx prisma db push

# (Tùy chọn) Khởi tạo dữ liệu mẫu
npx prisma db seed
\`\`\`

## 4. Chạy dự án
\`\`\`bash
npm run dev
\`\`\`
Dự án sẽ chạy tại: \`http://localhost:3000\`