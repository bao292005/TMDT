'use client';
import { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = 35000;
  
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');

  const handlePlaceOrder = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          totalAmount: totalAmount + shippingFee,
          paymentMethod,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Redirect tới cổng thanh toán hoặc trang thành công
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi đặt hàng!');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
      <div className="lg:w-2/3 space-y-6">
        
        {/* Địa chỉ giao hàng */}
        <section className="bg-white p-6 rounded-sm shadow-sm border-t-4 border-[#ee4d2d]">
          <h2 className="text-lg font-medium text-[#ee4d2d] mb-4 flex items-center gap-2">
            📍 Địa chỉ giao hàng
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-500 mb-1">Họ và tên *</label>
              <input type="text" defaultValue="Nguyễn Văn A" className="w-full border p-2 rounded-sm focus:border-[#ee4d2d] outline-none" />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Số điện thoại *</label>
              <input type="text" defaultValue="0912 345 678" className="w-full border p-2 rounded-sm focus:border-[#ee4d2d] outline-none" />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Tỉnh / Thành phố *</label>
              <select className="w-full border p-2 rounded-sm bg-white"><option>Hà Nội</option></select>
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Quận / Huyện *</label>
              <select className="w-full border p-2 rounded-sm bg-white"><option>Cầu Giấy</option></select>
            </div>
            <div className="col-span-2">
              <label className="block text-gray-500 mb-1">Địa chỉ chi tiết *</label>
              <input type="text" placeholder="Số nhà, tên đường, phường/xã" className="w-full border p-2 rounded-sm focus:border-[#ee4d2d] outline-none" />
            </div>
          </div>
        </section>

        {/* Phương thức thanh toán */}
        <section className="bg-white p-6 rounded-sm shadow-sm">
          <h2 className="text-lg font-medium mb-4">Phương thức thanh toán</h2>
          <div className="space-y-3">
            <label className={`flex items-center gap-3 border p-4 rounded-sm cursor-pointer transition ${paymentMethod === 'VNPAY' ? 'border-[#ee4d2d] bg-orange-50' : 'border-gray-200'}`}>
              <input type="radio" name="payment" checked={paymentMethod === 'VNPAY'} onChange={() => setPaymentMethod('VNPAY')} className="accent-[#ee4d2d]" />
              <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">VNPAY</div>
              <div>
                <p className="font-medium">VNPAY</p>
                <p className="text-xs text-gray-500">ATM, QR Code, Internet Banking</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 border p-4 rounded-sm cursor-pointer transition ${paymentMethod === 'MOMO' ? 'border-[#ee4d2d] bg-orange-50' : 'border-gray-200'}`}>
              <input type="radio" name="payment" checked={paymentMethod === 'MOMO'} onChange={() => setPaymentMethod('MOMO')} className="accent-[#ee4d2d]" />
              <div className="bg-pink-600 text-white text-xs px-2 py-1 rounded font-bold">MoMo</div>
              <div>
                <p className="font-medium">Ví MoMo</p>
              </div>
            </label>
          </div>
        </section>
      </div>

      {/* Tóm tắt đơn hàng */}
      <div className="lg:w-1/3">
        <div className="bg-white p-6 rounded-sm shadow-sm sticky top-24">
          <h2 className="text-lg font-medium border-b pb-4 mb-4">Đơn hàng của bạn</h2>
          
          <div className="space-y-4 mb-6 border-b pb-4 max-h-60 overflow-y-auto">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="flex-1 pr-4 line-clamp-1">{item.name} x {item.quantity}</span>
                <span className="font-medium">{(item.price * item.quantity).toLocaleString()}đ</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm text-gray-600 border-b pb-4 mb-4">
            <div className="flex justify-between"><span>Tạm tính</span><span>{totalAmount.toLocaleString()}đ</span></div>
            <div className="flex justify-between"><span>Phí vận chuyển</span><span>{shippingFee.toLocaleString()}đ</span></div>
          </div>

          <div className="flex justify-between items-end mb-6">
            <span className="text-gray-800 font-medium">Tổng thanh toán</span>
            <span className="text-2xl text-[#ee4d2d] font-medium block">{(totalAmount + shippingFee).toLocaleString()}đ</span>
          </div>

          <button 
            onClick={handlePlaceOrder}
            disabled={items.length === 0}
            className="w-full bg-[#ee4d2d] text-white py-3 rounded-sm font-medium hover:bg-[#f05d40] transition disabled:opacity-50"
          >
            ĐẶT HÀNG
          </button>
        </div>
      </div>
    </div>
  );
}