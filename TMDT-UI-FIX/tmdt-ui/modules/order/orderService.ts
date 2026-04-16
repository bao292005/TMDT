import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const orderService = {
  /**
   * Lấy danh sách đơn hàng của một User (Dùng cho trang /orders)
   */
  async getUserOrders(userId: string, statusFilter?: string) {
    try {
      const whereClause: any = { userId };
      if (statusFilter && statusFilter !== 'ALL') {
        whereClause.status = statusFilter;
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: {
            include: { product: true }
          }
        }
      });
      return orders;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      throw new Error('Không thể tải lịch sử đơn hàng');
    }
  },

  /**
   * Cập nhật trạng thái đơn hàng (Dùng cho Admin hoặc Webhook)
   */
  async updateOrderStatus(orderId: string, status: OrderStatus) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
  }
};