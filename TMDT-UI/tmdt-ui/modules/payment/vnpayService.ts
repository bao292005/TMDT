import crypto from 'crypto';
import { ENV } from '@/shared/config/env';

interface PaymentParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  ipAddress: string;
}

export const vnpayService = {
  /**
   * Tạo URL thanh toán VNPAY với chữ ký bảo mật (Secure Hash)
   */
  createPaymentUrl({ orderId, amount, orderInfo, ipAddress }: PaymentParams): string {
    const tmnCode = ENV.VNPAY.TMN_CODE;
    const secretKey = ENV.VNPAY.HASH_SECRET;
    let vnpUrl = ENV.VNPAY.URL;

    // Các tham số bắt buộc của VNPAY
    const vnp_Params: Record<string, string | number> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // VNPAY yêu cầu nhân 100
      vnp_ReturnUrl: 'http://localhost:3000/orders?payment=success',
      vnp_IpAddr: ipAddress,
      vnp_CreateDate: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
    };

    // Sắp xếp các tham số theo thứ tự alphabet
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((result: Record<string, string>, key) => {
        result[key] = String(vnp_Params[key]);
        return result;
      }, {});

    // Tạo chuỗi mã hóa
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Thêm chữ ký vào URL
    sortedParams['vnp_SecureHash'] = signed;
    vnpUrl += '?' + new URLSearchParams(sortedParams).toString();

    return vnpUrl;
  },

  /**
   * Kiểm tra tính hợp lệ của Webhook VNPAY gửi về
   */
  verifyWebhook(vnpParams: Record<string, string>): boolean {
    const secureHash = vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    const sortedParams = Object.keys(vnpParams)
      .sort()
      .reduce((result: Record<string, string>, key) => {
        result[key] = String(vnpParams[key]);
        return result;
      }, {});

    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', ENV.VNPAY.HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
  }
};