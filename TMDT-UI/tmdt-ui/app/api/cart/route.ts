import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lấy giỏ hàng của user từ Database
export async function GET(request: Request) {
  try {
    // Giả lập lấy userId từ session/token (Cần lấy từ Middleware/Auth thực tế)
    const userId = "dummy-user-id"; 

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true }
    });

    return NextResponse.json({ success: true, data: cartItems });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi lấy giỏ hàng' }, { status: 500 });
  }
}

// Lưu/Cập nhật giỏ hàng lên Database
export async function POST(request: Request) {
  try {
    const { userId, items } = await request.json();

    // Xóa giỏ hàng cũ của user
    await prisma.cartItem.deleteMany({ where: { userId } });

    // Tạo giỏ hàng mới dựa trên Zustand store gửi lên
    const newCartItems = items.map((item: any) => ({
      userId,
      productId: item.id,
      variantName: item.variant,
      quantity: item.quantity
    }));

    await prisma.cartItem.createMany({ data: newCartItems });

    return NextResponse.json({ success: true, message: 'Đồng bộ giỏ hàng thành công' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi đồng bộ' }, { status: 500 });
  }
}