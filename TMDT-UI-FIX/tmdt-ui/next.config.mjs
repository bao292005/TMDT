/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // Cho phép hiển thị ảnh mock AI
      },
      // Thêm domain lưu ảnh thực tế của bạn sau này (ví dụ S3, Cloudinary)
      // { protocol: 'https', hostname: 'res.cloudinary.com' }
    ],
  },
};

export default nextConfig;