import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, totalAmount, paymentMethod } = body;

    // 1. Sinh mã đơn hàng ngẫu nhiên (hoặc lưu qua Prisma DB tại đây)
    const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let paymentUrl = '';

    // 2. Tạo URL redirect tương ứng với phương thức thanh toán
    if (paymentMethod === 'VNPAY') {
      // Mock URL VNPAY
      paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?order_id=${orderId}&amount=${totalAmount}`;
    } else if (paymentMethod === 'MOMO') {
      // Mock URL MoMo
      paymentUrl = `https://test-payment.momo.vn/pay?order_id=${orderId}&amount=${totalAmount}`;
    } else {
      paymentUrl = `/orders?success=true`;
    }

    // 3. Trả về cho client
    return NextResponse.json({ 
      success: true, 
      orderId,
      paymentUrl 
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}