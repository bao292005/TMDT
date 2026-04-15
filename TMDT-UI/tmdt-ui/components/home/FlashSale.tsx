'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shirt, Zap } from 'lucide-react';

const flashProducts = [
  { id: 101, name: 'Áo sơ mi lụa nữ cao cấp', price: 159000, originalPrice: 420000, rating: 4.9, sold: 1200 },
  { id: 102, name: 'Váy wrap midi thanh lịch', price: 210000, originalPrice: 580000, rating: 4.8, sold: 870 },
  { id: 103, name: 'Quần jogger thể thao unisex', price: 135000, originalPrice: 310000, rating: 4.7, sold: 2100 },
  { id: 104, name: 'Áo croptop ren nữ cá tính', price: 89000, originalPrice: 220000, rating: 4.6, sold: 3400 },
  { id: 105, name: 'Chân váy da PU ngắn y2k', price: 175000, originalPrice: 390000, rating: 4.8, sold: 960 },
  { id: 106, name: 'Set đồ bộ thun cotton mặc nhà', price: 119000, originalPrice: 280000, rating: 4.7, sold: 1800 },
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function getEndTime() {
  const end = new Date();
  end.setHours(23, 59, 59, 0);
  return end.getTime();
}

export default function FlashSale() {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const endTime = getEndTime();
    const tick = () => {
      const diff = Math.max(0, endTime - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ h, m, s });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#ee4d2d] to-orange-400 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-yellow-300 fill-yellow-300" />
          <h2 className="text-white font-black text-lg tracking-wide">FLASH SALE</h2>
        </div>
        {/* Countdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-white/80 text-xs mr-1">Kết thúc sau</span>
          {[pad(timeLeft.h), pad(timeLeft.m), pad(timeLeft.s)].map((val, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="bg-black text-white font-mono font-bold text-sm px-2 py-0.5 rounded-md min-w-[30px] text-center">
                {val}
              </span>
              {i < 2 && <span className="text-white font-bold text-sm">:</span>}
            </span>
          ))}
        </div>
        <Link href="/products" className="text-white/90 text-xs hover:text-white underline underline-offset-2">
          Xem tất cả &rsaquo;
        </Link>
      </div>

      {/* Products */}
      <div className="flex gap-3 overflow-x-auto p-4 pb-5 scrollbar-hide">
        {flashProducts.map((item) => {
          const discount = Math.round((1 - item.price / item.originalPrice) * 100);
          const sold = Math.min(100, Math.round((item.sold / (item.sold + 400)) * 100));
          return (
            <Link
              href={`/products/${item.id}`}
              key={item.id}
              className="flex-shrink-0 w-[140px] border border-transparent hover:border-[#ee4d2d] hover:shadow-md transition-all rounded-sm group"
            >
              {/* Ảnh */}
              <div className="relative w-full aspect-square bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center rounded-sm overflow-hidden">
                <Shirt size={44} className="text-orange-300" />
                <div className="absolute top-1.5 left-1.5 bg-[#ee4d2d] text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                  -{discount}%
                </div>
              </div>
              {/* Info */}
              <div className="p-1.5">
                <p className="text-xs line-clamp-2 group-hover:text-[#ee4d2d] transition-colors mb-1">{item.name}</p>
                <p className="text-[#ee4d2d] font-bold text-sm">{item.price.toLocaleString('vi-VN')}đ</p>
                <p className="text-[10px] text-gray-400 line-through">{item.originalPrice.toLocaleString('vi-VN')}đ</p>
                {/* Progress bar sold */}
                <div className="mt-1.5">
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#ee4d2d] to-orange-400 rounded-full"
                      style={{ width: `${sold}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">Đã bán {item.sold.toLocaleString()}+</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
