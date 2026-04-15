import Link from 'next/link';
import ProductCard from '@/components/features/ProductCard';

// Giả lập Fetch Data từ Database
const fetchProducts = async () => {
  // Trong thực tế sẽ gọi: fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/catalog?q=...`)
  return [
    { id: '1', name: 'Áo thun basic cotton unisex', price: 150000, originalPrice: 200000, rating: 4.9, soldCount: 1200, hasAI: true },
    { id: '2', name: 'Váy midi hoa nhí mùa hè', price: 250000, originalPrice: 300000, rating: 4.8, soldCount: 450, hasAI: true },
    { id: '3', name: 'Quần Jeans ống rộng phong cách', price: 320000, originalPrice: 400000, rating: 4.7, soldCount: 890, hasAI: false },
    { id: '4', name: 'Áo Sơ Mi Trắng Nam Công Sở', price: 220000, originalPrice: 280000, rating: 5.0, soldCount: 2100, hasAI: true },
  ];
};

export default async function ProductsPage() {
  const products = await fetchProducts();

  return (
    <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
      {/* Cột Lọc bên trái */}
      <aside className="w-full md:w-48 flex-shrink-0">
        <div className="bg-white p-4 rounded-sm shadow-sm space-y-6">
          <div>
            <h3 className="font-bold border-b pb-2 mb-3 flex items-center gap-2">Tất Cả Danh Mục</h3>
            <ul className="text-sm space-y-2 text-gray-600">
              <li><Link href="#" className="hover:text-[#ee4d2d] text-[#ee4d2d] font-medium">Thời Trang Nữ</Link></li>
              <li><Link href="#" className="hover:text-[#ee4d2d]">Thời Trang Nam</Link></li>
              <li><Link href="#" className="hover:text-[#ee4d2d]">Phụ Kiện</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold border-b pb-2 mb-3">Khoảng Giá</h3>
            <div className="flex items-center gap-2 text-sm">
              <input type="text" placeholder="TỪ" className="w-full border p-1 rounded-sm text-center" />
              <span>-</span>
              <input type="text" placeholder="ĐẾN" className="w-full border p-1 rounded-sm text-center" />
            </div>
            <button className="w-full bg-[#ee4d2d] text-white py-1.5 rounded-sm mt-2 text-sm">Áp Dụng</button>
          </div>
        </div>
      </aside>

      {/* Danh sách sản phẩm bên phải */}
      <main className="flex-1">
        {/* Thanh sắp xếp */}
        <div className="bg-gray-100 p-3 rounded-sm flex items-center gap-4 text-sm mb-4">
          <span className="text-gray-500">Sắp xếp theo</span>
          <button className="bg-[#ee4d2d] text-white px-4 py-1.5 rounded-sm">Phổ Biến</button>
          <button className="bg-white border px-4 py-1.5 rounded-sm hover:bg-gray-50">Mới Nhất</button>
          <button className="bg-white border px-4 py-1.5 rounded-sm hover:bg-gray-50">Bán Chạy</button>
          <select className="bg-white border px-4 py-1.5 rounded-sm outline-none">
            <option>Giá</option>
            <option>Giá: Thấp đến Cao</option>
            <option>Giá: Cao đến Thấp</option>
          </select>
        </div>

        {/* Lưới sản phẩm */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard 
              key={p.id}
              id={p.id}
              name={p.name}
              price={p.price}
              originalPrice={p.originalPrice}
              rating={p.rating}
              soldCount={p.soldCount}
              hasAI={p.hasAI}
            />
          ))}
        </div>
      </main>
    </div>
  );
}