import { NextResponse } from 'next/server';
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Payload từ VNPAY hoặc MoMo IPN
    const data = await request.json(); 
    
    // TODO: Verify chữ ký số (Checksum) tại đây để tránh fake request
    
    const orderNumber = data.vnp_TxnRef || data.orderId;
    const responseCode = data.vnp_ResponseCode || data.resultCode;

    // Code '00' (VNPAY) hoặc 0 (MoMo) nghĩa là thanh toán thành công
    if (responseCode === '00' || responseCode === 0) {
      await prisma.order.update({
        where: { orderNumber: orderNumber },
        data: { 
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.SHIPPING
        }
      });
      return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
    } else {
      await prisma.order.update({
        where: { orderNumber: orderNumber },
        data: { paymentStatus: PaymentStatus.FAILED }
      });
      return NextResponse.json({ RspCode: '00', Message: 'Payment Failed Record' });
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ RspCode: '99', Message: 'Unknown error' }, { status: 500 });
  }
}