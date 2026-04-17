import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-10 bg-gray-900 text-gray-300">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-10 text-sm md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="mb-3 text-xl font-black tracking-tight text-white">
            TM<span className="text-[#ee4d2d]">ĐT</span> STORE
          </h3>
          <p className="text-xs leading-relaxed text-gray-400">
            Nền tảng thương mại điện tử thời trang với trải nghiệm mua sắm trực quan, liền mạch và an toàn.
          </p>
        </div>

        <div>
          <h4 className="mb-3 border-b border-gray-700 pb-2 text-xs font-bold uppercase tracking-widest text-white">
            Điều hướng nhanh
          </h4>
          <ul className="space-y-2">
            <li><Link href="/home" className="hover:text-[#ee4d2d]">Trang chủ</Link></li>
            <li><Link href="/products" className="hover:text-[#ee4d2d]">Sản phẩm</Link></li>
            <li><Link href="/cart" className="hover:text-[#ee4d2d]">Giỏ hàng</Link></li>
            <li><Link href="/checkout" className="hover:text-[#ee4d2d]">Checkout</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 border-b border-gray-700 pb-2 text-xs font-bold uppercase tracking-widest text-white">
            Tài khoản
          </h4>
          <ul className="space-y-2">
            <li><Link href="/login" className="hover:text-[#ee4d2d]">Đăng nhập</Link></li>
            <li><Link href="/register" className="hover:text-[#ee4d2d]">Đăng ký</Link></li>
            <li><Link href="/orders" className="hover:text-[#ee4d2d]">Đơn hàng của tôi</Link></li>
            <li><Link href="/profile" className="hover:text-[#ee4d2d]">Hồ sơ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 border-b border-gray-700 pb-2 text-xs font-bold uppercase tracking-widest text-white">
            Hỗ trợ
          </h4>
          <div className="rounded bg-gray-800 p-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Hotline</p>
            <p className="text-lg font-bold text-[#ee4d2d]">1800 6789</p>
            <p className="text-[10px] text-gray-500">08:00 - 22:00 mỗi ngày</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4">
        <div className="container mx-auto px-4 text-xs text-gray-500">
          © 2026 TMĐT Store. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
