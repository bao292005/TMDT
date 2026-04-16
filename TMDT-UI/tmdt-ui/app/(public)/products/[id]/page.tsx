'use client';
import { useState } from 'react';
import { ShoppingCart, Sparkles } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export default function ProductDetail() {
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState('Đen');
  const [selectedSize, setSelectedSize] = useState('M');
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      id: 'prod-1',
      name: 'Áo Thun Basic Cotton Unisex Form Rộng',
      price: 280000,
      quantity: qty,
      variant: `${selectedColor}, ${selectedSize}`
    });
    alert('Đã thêm vào giỏ hàng!');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white p-6 rounded-md shadow-sm flex flex-col md:flex-row gap-8">
        {/* Gallery */}
        <div className="md:w-2/5">
          <div className="aspect-square bg-gray-100 rounded-md mb-4 flex items-center justify-center text-gray-400">
            Ảnh sản phẩm chính
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(img => (
              <div key={img} className="w-20 h-20 bg-gray-100 rounded-md border hover:border-[#ee4d2d] cursor-pointer"></div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="md:w-3/5 space-y-6">
          <div>
            <div className="bg-[#ee4d2d] text-white text-xs px-2 py-0.5 inline-block rounded-sm mb-2">Mall</div>
            <h1 className="text-2xl font-medium">Áo Thun Basic Cotton Unisex Form Rộng — Nhiều màu tùy chọn</h1>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-[#ee4d2d] flex items-center border-b border-[#ee4d2d]">4.8 ★★★★★</span>
              <span className="border-l pl-4">124 đánh giá</span>
              <span className="border-l pl-4">312 đã mua</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 flex items-baseline gap-4 rounded-sm">
            <span className="text-3xl text-[#ee4d2d] font-medium">280.000đ</span>
            <span className="text-gray-400 line-through text-lg">350.000đ</span>
            <span className="bg-[#ee4d2d] text-white text-[10px] px-1 rounded font-bold">GIẢM 20%</span>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center">
              <span className="w-24 text-gray-500">Màu sắc</span>
              <div className="flex gap-2">
                {['Đen', 'Trắng', 'Xanh nhạt', 'Vàng'].map(color => (
                  <button 
                    key={color} onClick={() => setSelectedColor(color)}
                    className={`border px-4 py-1.5 rounded-sm ${selectedColor === color ? 'border-[#ee4d2d] text-[#ee4d2d]' : 'border-gray-200'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <span className="w-24 text-gray-500">Kích cỡ</span>
              <div className="flex gap-2">
                {['S', 'M', 'L', 'XL'].map(size => (
                  <button 
                    key={size} onClick={() => setSelectedSize(size)}
                    className={`border px-4 py-1.5 rounded-sm ${selectedSize === size ? 'border-[#ee4d2d] text-[#ee4d2d]' : 'border-gray-200'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <span className="w-24 text-gray-500">Số lượng</span>
              <div className="flex items-center border border-gray-300 rounded-sm">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-1 border-r hover:bg-gray-50">-</button>
                <input type="text" value={qty} readOnly className="w-12 text-center outline-none" />
                <button onClick={() => setQty(qty + 1)} className="px-3 py-1 border-l hover:bg-gray-50">+</button>
              </div>
              <span className="ml-4 text-gray-500">Còn 248 sản phẩm</span>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={handleAddToCart} className="flex items-center justify-center gap-2 border border-[#ee4d2d] text-[#ee4d2d] bg-orange-50 px-6 py-3 rounded-sm hover:bg-orange-100 w-1/2">
              <ShoppingCart size={20} /> Thêm vào giỏ hàng
            </button>
            <button className="bg-[#ee4d2d] text-white px-6 py-3 rounded-sm hover:bg-[#f05d40] w-1/2">
              Mua ngay
            </button>
          </div>

          <button className="w-full bg-gradient-to-r from-purple-700 to-indigo-600 text-white py-3.5 rounded-sm flex items-center justify-center gap-2 font-medium hover:opacity-90 shadow-sm mt-2">
            <Sparkles size={18} /> + THỬ ĐỒ VỚI AI — Xem sản phẩm trên người bạn
          </button>
        </div>
      </div>
    </div>
  );
}