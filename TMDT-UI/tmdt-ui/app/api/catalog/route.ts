import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('q') || '';
    const categoryId = searchParams.get('category');
    const sortBy = searchParams.get('sort') || 'createdAt'; // createdAt, price_asc, price_desc
    const sortOrder = sortBy === 'price_asc' ? 'asc' : 'desc';
    const orderByField = sortBy.includes('price') ? 'price' : 'createdAt';

    // Xây dựng query linh hoạt
    const whereClause: any = {
      name: { contains: keyword, mode: 'insensitive' },
    };
    if (categoryId) whereClause.categoryId = categoryId;

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { [orderByField]: sortOrder },
      include: { category: true },
      take: 20, // Phân trang cơ bản
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi khi tải danh sách sản phẩm' }, { status: 500 });
  }
}