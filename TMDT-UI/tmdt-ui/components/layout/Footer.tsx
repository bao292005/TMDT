import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-10">
      {/* Top section */}
      <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-sm">

        {/* Cột 1: Thương hiệu */}
        <div>
          <h3 className="text-white text-xl font-black tracking-tight mb-3">
            TM<span className="text-[#ee4d2d]">ĐT</span> STORE
          </h3>
          <p className="text-gray-400 text-xs leading-relaxed mb-4">
            Nền tảng thương mại điện tử thời trang hàng đầu Việt Nam. Với công nghệ AI Virtual Try-On, mua sắm chưa bao giờ dễ dàng đến thế!
          </p>
          {/* Mạng xã hội */}
          <div className="flex gap-3 mt-4">
            {[
              { label: 'fb', color: 'hover:bg-blue-600', text: 'f' },
              { label: 'ig', color: 'hover:bg-pink-600', text: '📷' },
              { label: 'tt', color: 'hover:bg-black', text: '🎵' },
              { label: 'yt', color: 'hover:bg-red-600', text: '▶' },
            ].map((s) => (
              <Link
                key={s.label}
                href="#"
                className={`w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs ${s.color} transition-colors duration-200`}
              >
                {s.text}
              </Link>
            ))}
          </div>
          {/* Hotline */}
          <div className="mt-5 p-3 bg-gray-800 rounded-lg">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Hotline hỗ trợ</p>
            <p className="text-[#ee4d2d] font-bold text-base">1800 6789</p>
            <p className="text-gray-500 text-[10px]">Miễn phí • 8:00 – 22:00 mỗi ngày</p>
          </div>
        </div>

        {/* Cột 2: Chăm sóc khách hàng */}
        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest border-b border-gray-700 pb-2">
            Chăm sóc khách hàng
          </h4>
          <ul className="space-y-2.5">
            {[
              'Trung Tâm Trợ Giúp',
              'Hướng Dẫn Mua Hàng',
              'Chính Sách Vận Chuyển',
              'Trả Hàng & Hoàn Tiền',
              'Bảo Hành Sản Phẩm',
              'Liên Hệ Chúng Tôi',
            ].map((item) => (
              <li key={item}>
                <Link href="#" className="hover:text-[#ee4d2d] transition-colors flex items-center gap-1.5">
                  <span className="text-[#ee4d2d] text-xs">›</span> {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Cột 3: Về TMĐT Store */}
        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest border-b border-gray-700 pb-2">
            Về TMĐT Store
          </h4>
          <ul className="space-y-2.5">
            {[
              'Giới Thiệu',
              'Tuyển Dụng',
              'Điều Khoản Dịch Vụ',
              'Chính Sách Bảo Mật',
              'Quy Chế Hoạt Động',
              'Kênh Người Bán',
            ].map((item) => (
              <li key={item}>
                <Link href="#" className="hover:text-[#ee4d2d] transition-colors flex items-center gap-1.5">
                  <span className="text-[#ee4d2d] text-xs">›</span> {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Cột 4: Thanh toán & Vận chuyển */}
        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest border-b border-gray-700 pb-2">
            Thanh toán
          </h4>
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { label: 'VNPAY', color: 'text-blue-400' },
              { label: 'MoMo', color: 'text-pink-400' },
              { label: 'ZaloPay', color: 'text-blue-300' },
              { label: 'COD', color: 'text-green-400' },
              { label: 'Visa', color: 'text-blue-500' },
              { label: 'Mast.', color: 'text-red-400' },
            ].map((p) => (
              <div key={p.label} className={`bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] font-bold ${p.color}`}>
                {p.label}
              </div>
            ))}
          </div>

          <h4 className="text-white font-bold mb-3 uppercase text-xs tracking-widest border-b border-gray-700 pb-2">
            Đơn vị vận chuyển
          </h4>
          <div className="flex flex-wrap gap-2">
            {['GHN', 'GHTK', 'J&T', 'Viettel Post', 'VNPost'].map((s) => (
              <div key={s} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] font-bold text-gray-300">
                {s}
              </div>
            ))}
          </div>

          {/* App download */}
          <div className="mt-5">
            <p className="text-xs text-gray-500 mb-2">Tải ứng dụng</p>
            <div className="flex gap-2">
              <div className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-[10px] text-gray-300 flex items-center gap-1">
                🍎 App Store
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-[10px] text-gray-300 flex items-center gap-1">
                🤖 Google Play
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800 py-4">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-600">
          <p>© 2026 TMĐT Store. Bản quyền thuộc về Công ty TNHH Thương Mại Điện Tử Việt Nam.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-gray-400">Điều khoản</Link>
            <Link href="#" className="hover:text-gray-400">Bảo mật</Link>
            <Link href="#" className="hover:text-gray-400">Cookie</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}