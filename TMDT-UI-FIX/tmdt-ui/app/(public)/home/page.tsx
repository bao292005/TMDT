import Link from 'next/link';
import { Shirt, ShoppingBag } from 'lucide-react';
import BannerSlider from '@/components/home/BannerSlider';

const categories = [
  { name: 'Áo thun', index: 0, emoji: '👕', bg: 'from-orange-100 to-orange-200', label: 'Basic & Trendy' },
  { name: 'Váy đầm', index: 1, emoji: '👗', bg: 'from-pink-100 to-pink-200', label: 'Thanh lịch & Nữ tính' },
  { name: 'Quần jean', index: 2, emoji: '👖', bg: 'from-blue-100 to-blue-200', label: 'Classic & Modern' },
  { name: 'Áo khoác', index: 3, emoji: '🧥', bg: 'from-amber-100 to-amber-200', label: 'Ấm áp & Style' },
  { name: 'Giày dép', index: 4, emoji: '👟', bg: 'from-green-100 to-green-200', label: 'Streetwear & Elegant' },
  { name: 'Túi xách', index: 5, emoji: '👜', bg: 'from-purple-100 to-purple-200', label: 'Thời trang & Tiện dụng' },
  { name: 'Phụ kiện', index: 6, emoji: '💍', bg: 'from-rose-100 to-rose-200', label: 'Mời nhất 2025' },
  { name: 'Đồ ngủ', index: 7, emoji: '😴', bg: 'from-indigo-100 to-indigo-200', label: 'Thoải mái & Cao cấp' },
];

const mockProducts = [
  { id: 1, name: 'Áo sơ mi trắng công sở nam / nữ chuẩn form', price: 320000, originalPrice: 400000, rating: 4.9, sold: 200 },
  { id: 2, name: 'Váy đầm maxi dự tiệc cao cấp phong cách Hàn Quốc', price: 550000, originalPrice: 720000, rating: 4.8, sold: 154 },
  { id: 3, name: 'Quần jean nữ ống đứng lưng cao basic', price: 285000, originalPrice: 380000, rating: 4.7, sold: 320 },
  { id: 4, name: 'Áo hoodie unisex form rộng oversize', price: 390000, originalPrice: 490000, rating: 4.9, sold: 510 },
  { id: 5, name: 'Set bộ đồ thể thao tập gym yoga nữ', price: 220000, originalPrice: 350000, rating: 4.6, sold: 180 },
  { id: 6, name: 'Áo khoác bomber nữ phong cách ulzzang', price: 450000, originalPrice: 580000, rating: 4.8, sold: 430 },
  { id: 7, name: 'Chân váy tennis xếp ly trắng tiểu thư', price: 195000, originalPrice: 280000, rating: 4.7, sold: 612 },
  { id: 8, name: 'Quần short kaki nam thời trang basic', price: 175000, originalPrice: 240000, rating: 4.6, sold: 289 },
  { id: 9, name: 'Áo croptop thun gân nữ cá tính', price: 120000, originalPrice: 180000, rating: 4.5, sold: 740 },
  { id: 10, name: 'Blazer nữ công sở kẻ caro thanh lịch', price: 680000, originalPrice: 890000, rating: 4.9, sold: 97 },
];

const suggestedProducts = [
  { id: 11, name: 'Túi tote canvas in chữ thời trang', price: 145000, originalPrice: 200000, rating: 4.7, sold: 1200 },
  { id: 12, name: 'Giày sneaker trắng nữ đế dày ulzzang', price: 380000, originalPrice: 520000, rating: 4.8, sold: 856 },
  { id: 13, name: 'Mũ bucket vải nhung unisex', price: 95000, originalPrice: 140000, rating: 4.6, sold: 430 },
  { id: 14, name: 'Dây chuyền inox nữ mặt hoa đơn giản', price: 65000, originalPrice: 110000, rating: 4.5, sold: 980 },
  { id: 15, name: 'Kính mát chống UV râm y2k thời trang', price: 110000, originalPrice: 160000, rating: 4.4, sold: 567 },
  { id: 16, name: 'Áo len cổ lọ mỏng dáng ôm nữ', price: 260000, originalPrice: 360000, rating: 4.8, sold: 341 },
  { id: 17, name: 'Quần legging nâng mông co giãn tốt', price: 155000, originalPrice: 230000, rating: 4.7, sold: 1050 },
  { id: 18, name: 'Set áo gile + áo bên trong phong cách', price: 330000, originalPrice: 450000, rating: 4.6, sold: 210 },
  { id: 19, name: 'Dép sandal đế bằng quai ngang nữ', price: 180000, originalPrice: 250000, rating: 4.5, sold: 760 },
  { id: 20, name: 'Bộ pyjamas lụa satin cao cấp nữ', price: 420000, originalPrice: 560000, rating: 4.9, sold: 320 },
];

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">

      {/* ===== BANNER SLIDER - Auto chuyển ảnh ===== */}
      <div className="my-4">
        <BannerSlider />
      </div>

      {/* ===== BANNER 2 - AI Virtual Try-On ===== */}
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
        <h2 className="font-semibold text-lg text-[#ee4d2d] border-b pb-2 mb-4">Danh mục nổi bật</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Link
              href={`/products?category=${cat.index}`}
              key={cat.index}
              className="flex-shrink-0 group"
            >
              <div className="w-[140px] rounded-lg overflow-hidden border border-gray-100 hover:border-[#ee4d2d] hover:shadow-md transition-all duration-200">
                {/* Ảnh danh mục */}
                <div className={`w-full h-[90px] bg-gradient-to-br ${cat.bg} flex items-center justify-center`}>
                  <span className="text-5xl">{cat.emoji}</span>
                </div>
                {/* Thông tin */}
                <div className="p-2 bg-white">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-[#ee4d2d] transition-colors">{cat.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{cat.label}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Gợi ý hôm nay */}
      <section className="bg-white p-4 rounded-md shadow-sm">
        <h2 className="font-semibold text-lg text-[#ee4d2d] border-b pb-2 mb-4 flex items-center gap-2">
          🔥 Gợi ý hôm nay
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mockProducts.map((item) => {
            const discount = Math.round((1 - item.price / item.originalPrice) * 100);
            return (
              <Link
                href={`/products/${item.id}`}
                key={item.id}
                className="border border-transparent hover:border-[#ee4d2d] hover:shadow-md transition bg-white p-2 rounded-sm relative group"
              >
                {/* Badge AI */}
                <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 font-bold rounded z-10 shadow-sm">
                  AI
                </div>
                {/* Badge giảm giá */}
                <div className="absolute top-2 right-2 bg-[#ee4d2d] text-white text-[10px] px-1.5 py-0.5 font-bold rounded z-10">
                  -{discount}%
                </div>
                {/* Placeholder ảnh */}
                <div className="aspect-square bg-gradient-to-br from-orange-50 to-orange-100 mb-2 flex items-center justify-center rounded-sm">
                  <Shirt size={40} className="text-orange-300" />
                </div>
                <h3 className="text-sm line-clamp-2 mb-2 group-hover:text-[#ee4d2d] transition-colors">
                  {item.name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-[#ee4d2d] font-bold">
                    {item.price.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-xs text-gray-400 line-through">
                    {item.originalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <span className="text-yellow-400">★ {item.rating}</span>
                  <span>Đã bán {item.sold}+</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Có thể bạn thích */}
      <section className="bg-white p-4 rounded-md shadow-sm">
        <h2 className="font-semibold text-lg text-[#ee4d2d] border-b pb-2 mb-4 flex items-center gap-2">
          💜 Có thể bạn thích
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {suggestedProducts.map((item) => {
            const discount = Math.round((1 - item.price / item.originalPrice) * 100);
            return (
              <Link
                href={`/products/${item.id}`}
                key={item.id}
                className="border border-transparent hover:border-[#ee4d2d] hover:shadow-md transition bg-white p-2 rounded-sm relative group"
              >
                {/* Badge giảm giá */}
                <div className="absolute top-2 right-2 bg-[#ee4d2d] text-white text-[10px] px-1.5 py-0.5 font-bold rounded z-10">
                  -{discount}%
                </div>
                {/* Placeholder ảnh */}
                <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-100 mb-2 flex items-center justify-center rounded-sm">
                  <ShoppingBag size={40} className="text-purple-300" />
                </div>
                <h3 className="text-sm line-clamp-2 mb-2 group-hover:text-[#ee4d2d] transition-colors">
                  {item.name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-[#ee4d2d] font-bold">
                    {item.price.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-xs text-gray-400 line-through">
                    {item.originalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <span className="text-yellow-400">★ {item.rating}</span>
                  <span>Đã bán {item.sold}+</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
