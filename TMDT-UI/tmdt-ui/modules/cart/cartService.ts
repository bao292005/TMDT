import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Lấy giỏ hàng của một user từ DB (dùng trong Server Components hoặc API Route)
 */
export async function getCartByUserId(userId: string) {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            stock: true,
          },
        },
      },
    });
    return cartItems;
  } catch (error) {
    console.error('Lỗi khi lấy giỏ hàng:', error);
    return [];
  }
}

/**
 * Thêm sản phẩm vào giỏ hàng trong DB
 */
export async function addToCartDB(userId: string, productId: string, variantId?: string) {
  try {
    const existing = await prisma.cartItem.findFirst({
      where: { userId, productId, variantId },
    });

    if (existing) {
      return await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: { increment: 1 } },
      });
    }

    return await prisma.cartItem.create({
      data: { userId, productId, variantId, quantity: 1 },
    });
  } catch (error) {
    console.error('Lỗi khi thêm vào giỏ hàng:', error);
    throw new Error('Không thể thêm sản phẩm vào giỏ hàng.');
  }
}

/**
 * Xóa một item khỏi giỏ hàng trong DB
 */
export async function removeFromCartDB(cartItemId: string) {
  try {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
  } catch (error) {
    console.error('Lỗi khi xóa khỏi giỏ hàng:', error);
    throw new Error('Không thể xóa sản phẩm khỏi giỏ hàng.');
  }
}

/**
 * Xóa toàn bộ giỏ hàng của user (dùng sau khi đặt hàng thành công)
 */
export async function clearCartDB(userId: string) {
  try {
    await prisma.cartItem.deleteMany({ where: { userId } });
  } catch (error) {
    console.error('Lỗi khi xóa giỏ hàng:', error);
    throw new Error('Không thể xóa giỏ hàng.');
  }
}
