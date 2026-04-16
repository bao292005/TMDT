import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Service này có thể được gọi trong các Server Components (VD: app/(public)/page.tsx)
export async function getFeaturedProducts(limit = 10) {
  try {
    const products = await prisma.product.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        aiMaskUrl: true, // Kiểm tra xem SP có hỗ trợ AI Try-on không
      }
    });
    return products;
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm nổi bật:", error);
    return [];
  }
}

export async function getProductDetail(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true }
    });
    return product;
  } catch (error) {
    console.error(`Lỗi khi lấy SP ${id}:`, error);
    return null;
  }
}