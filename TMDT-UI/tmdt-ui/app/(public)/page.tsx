import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Banner AI Virtual Try-On */}
      <div className="bg-gradient-to-r from-orange-500 to-[#ee4d2d] rounded-md p-6 text-white shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">✨ AI Virtual Try-On</h2>
          <p className="mt-1 text-sm opacity-90">Thử đồ ảo — Chọn đúng size ngay lần đầu tiên</p>
        </div>
        <Link href="/try-on">
          <button className="bg-yellow-400 text-black px-6 py-2 font-bold rounded-full text-sm hover:scale-105 transition-transform">
            Thử ngay miễn phí
          </button>
        </Link>
      </div>

      {/* Danh mục nổi bật */}
      <section className="bg-white p-4 rounded-md shadow-sm">
        <h3 className="font-semibold text-lg text-[#ee4d2d] border-b pb-2 mb-4">Danh mục nổi bật</h3>
        <div className="flex gap-8 overflow-x-auto pb-2">
          {['Áo thun', 'Váy đầm', 'Quần jean', 'Áo khoác', 'Giày dép', 'Túi xách'].map((cat, i) => (
            <Link href={`/products?category=${i}`} key={i} className="flex flex-col items-center gap-2 min-w-[80px] hover:text-[#ee4d2d]">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-400">Icon</span>
              </div>
              <span className="text-sm">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Gợi ý hôm nay */}
      <section className="bg-white p-4 rounded-md shadow-sm">
        <h3 className="font-semibold text-lg text-[#ee4d2d] border-b pb-2 mb-4 flex items-center gap-2">
           Gợi ý hôm nay
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <Link href={`/products/${item}`} key={item} className="border border-transparent hover:border-[#ee4d2d] hover:shadow-md transition bg-white p-2 rounded-sm relative group">
              <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 font-bold rounded z-10 shadow-sm">
                AI
              </div>
              <div className="aspect-square bg-gray-100 mb-2 flex items-center justify-center">
                <span className="text-gray-400 text-sm">Ảnh SP {item}</span>
              </div>
              <h4 className="text-sm line-clamp-2 mb-2 group-hover:text-[#ee4d2d]">Áo sơ mi trắng công sở nam / nữ chuẩn form</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-[#ee4d2d] font-bold">320.000đ</span>
                <span className="text-xs text-gray-400 line-through">400.000đ</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span className="text-yellow-400">★ 4.9</span>
                <span>Đã bán 200+</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}