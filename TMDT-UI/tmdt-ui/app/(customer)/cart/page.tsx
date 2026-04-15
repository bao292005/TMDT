'use client';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCartStore();
  
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="container mx-auto px-4 py-6 pb-32">
      {/* Header Bảng */}
      <div className="bg-white p-4 rounded-sm shadow-sm flex text-gray-500 text-sm font-medium mb-4">
        <div className="w-2/5 flex items-center gap-4">
          <input type="checkbox" className="w-4 h-4 accent-[#ee4d2d]" />
          <span>Sản Phẩm</span>
        </div>
        <div className="w-1/5 text-center">Đơn Giá</div>
        <div className="w-1/5 text-center">Số Lượng</div>
        <div className="w-[10%] text-center">Số Tiền</div>
        <div className="w-[10%] text-center">Thao Tác</div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="bg-white rounded-sm shadow-sm">
        <div className="p-4 border-b flex items-center gap-3">
          <input type="checkbox" className="w-4 h-4 accent-[#ee4d2d]" />
          <span className="font-medium">TMĐT Fashion Official</span>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Giỏ hàng của bạn đang trống</div>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="p-4 flex items-center text-sm border-b last:border-b-0">
              <div className="w-2/5 flex items-center gap-4">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#ee4d2d]" />
                <div className="w-20 h-20 bg-gray-100 border rounded flex-shrink-0"></div>
                <div>
                  <Link href={`/products/${item.id}`} className="line-clamp-2 hover:text-[#ee4d2d]">{item.name}</Link>
                  <p className="text-gray-500 text-xs mt-1">Phân loại: {item.variant}</p>
                </div>
              </div>
              <div className="w-1/5 text-center">{item.price.toLocaleString()}đ</div>
              <div className="w-1/5 flex justify-center">
                <div className="flex items-center border border-gray-300 rounded-sm">
                  <button onClick={() => updateQuantity(item.id, item.variant, Math.max(1, item.quantity - 1))} className="w-8 h-8 border-r hover:bg-gray-50">-</button>
                  <input type="text" value={item.quantity} readOnly className="w-10 h-8 text-center outline-none text-sm" />
                  <button onClick={() => updateQuantity(item.id, item.variant, item.quantity + 1)} className="w-8 h-8 border-l hover:bg-gray-50">+</button>
                </div>
              </div>
              <div className="w-[10%] text-center text-[#ee4d2d] font-medium">{(item.price * item.quantity).toLocaleString()}đ</div>
              <div className="w-[10%] text-center">
                <button onClick={() => removeItem(item.id, item.variant)} className="hover:text-[#ee4d2d] transition">Xóa</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Thanh công cụ Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#ee4d2d]" />
              Chọn Tất Cả ({items.length})
            </label>
            <button className="hover:text-[#ee4d2d]">Xóa</button>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right flex items-center gap-3">
              <span className="text-gray-600">Tổng thanh toán:</span>
              <span className="text-2xl font-medium text-[#ee4d2d]">{totalAmount.toLocaleString()}đ</span>
            </div>
            <Link href="/checkout">
              <button disabled={items.length === 0} className="bg-[#ee4d2d] text-white px-12 py-3 rounded-sm font-medium hover:bg-[#f05d40] transition disabled:opacity-50">
                Mua Hàng
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}