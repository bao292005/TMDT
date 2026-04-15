'use client';

import Link from 'next/link';
import { Search, ShoppingCart, Bell, HelpCircle, Shirt, Scissors, Package, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export default function Header() {
  // Lấy tổng số lượng items trong giỏ hàng từ Zustand store
  const totalItems = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  return (
    <header className="bg-[#ee4d2d] text-white">
      {/* Top Navigation */}
      <div className="container mx-auto px-4 flex justify-between text-xs py-3">
        <div className="flex gap-8">
          <Link href="#" className="hover:opacity-80">Tải ứng dụng</Link>
          <Link href="#" className="hover:opacity-80">Kết nối Facebook Instagram</Link>
        </div>
        <div className="flex gap-8 items-center">
          <Link href="#" className="flex items-center gap-1 hover:opacity-80"><Bell size={14} /> Thông Báo</Link>
          <Link href="#" className="flex items-center gap-1 hover:opacity-80"><HelpCircle size={14} /> Hỗ Trợ</Link>
          <Link href="#" className="hover:opacity-80">Tiếng Việt</Link>
          <Link href="/register" className="hover:opacity-80">Đăng Ký</Link>
          <Link href="/login" className="hover:opacity-80">Đăng Nhập</Link>
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="relative container mx-auto px-4 py-7 flex items-center">
        <Link href="/" className="text-3xl font-bold tracking-tighter flex-shrink-0">TMĐT STORE</Link>

        {/* Search - cạnh trái giữ nguyên, cạnh phải kéo đến gần giỏ hàng */}
        <div className="absolute right-24 flex bg-white rounded-sm p-1" style={{ left: 'calc(50% - 300px)' }}>
          <input
            type="text"
            placeholder="Tìm trong Thời Trang Nữ..."
            className="flex-1 text-black px-3 outline-none text-sm"
          />
          <button className="bg-[#ee4d2d] px-6 py-2 rounded-sm text-white hover:bg-[#f05d40]">
            <Search size={18} />
          </button>
        </div>

        {/* Cart icon với badge động từ Zustand */}
        <Link href="/cart" className="relative p-2 ml-auto flex-shrink-0" aria-label="Giỏ hàng">
          <ShoppingCart size={28} />
          {totalItems > 0 && (
            <span className="absolute top-0 right-0 bg-white text-[#ee4d2d] rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </Link>
      </div>


      {/* Category Links */}
      <nav className="container mx-auto px-4 pb-5 pt-1 flex gap-10 text-base font-medium justify-center">
        <Link href="#" className="flex items-center gap-1 hover:opacity-80">⚡ Flash Sale</Link>
        <Link href="/products?category=0" className="flex items-center gap-1 hover:opacity-80"><Shirt size={14} /> Áo</Link>
        <Link href="/products?category=2" className="flex items-center gap-1 hover:opacity-80"><Package size={14} /> Quần</Link>
        <Link href="/products?category=1" className="flex items-center gap-1 hover:opacity-80"><Scissors size={14} /> Váy đầm</Link>
        <Link href="/products?category=3" className="flex items-center gap-1 hover:opacity-80"><ShoppingBag size={14} /> Phụ kiện</Link>
        <Link href="/try-on" className="text-yellow-300 font-bold flex items-center gap-1 hover:opacity-80">
          ✨ AI Try-On
        </Link>
      </nav>
    </header>
  );
}