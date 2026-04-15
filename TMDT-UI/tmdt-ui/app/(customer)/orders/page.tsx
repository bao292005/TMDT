import Link from 'next/link';
import { User, ClipboardList, Store, Truck, MessageSquare } from 'lucide-react';

export default function OrdersPage() {
  return (
    <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 space-y-4">
        <div className="flex items-center gap-3 p-4 bg-white rounded-sm shadow-sm">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl text-white font-bold">K</div>
          <div>
            <div className="font-bold">khachhang_52</div>
            <Link href="/profile" className="text-xs text-gray-500 hover:text-[#ee4d2d]">✎ Sửa Hồ Sơ</Link>
          </div>
        </div>

        <nav className="bg-white rounded-sm shadow-sm py-2">
          <Link href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm"><User size={18} className="text-blue-500"/> Tài Khoản</Link>
          <Link href="/orders" className="flex items-center gap-3 px-4 py-3 bg-orange-50 text-[#ee4d2d] font-medium text-sm"><ClipboardList size={18}/> Đơn Mua</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-4">
        {/* Tabs */}
        <div className="bg-white flex overflow-x-auto rounded-sm shadow-sm text-sm border-b">
          {['Tất cả', 'Chờ thanh toán', 'Vận chuyển', 'Hoàn thành', 'Đã hủy'].map((tab, i) => (
            <button key={tab} className={`px-6 py-4 whitespace-nowrap border-b-2 ${i === 0 ? 'border-[#ee4d2d] text-[#ee4d2d]' : 'border-transparent text-gray-600 hover:text-[#ee4d2d]'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Order Item */}
        <div className="bg-white rounded-sm shadow-sm">
          <div className="p-4 border-b flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 font-medium">
              <span className="bg-[#ee4d2d] text-white text-[10px] px-1 rounded">Yêu thích</span>
              Cửa Hàng Hạt Giống Uy Tín
              <button className="bg-[#ee4d2d] text-white p-1 rounded"><MessageSquare size={12}/></button>
              <Link href="#" className="flex items-center gap-1 text-gray-500 font-normal hover:text-[#ee4d2d] border px-2 py-0.5 rounded-sm"><Store size={14}/> Xem Shop</Link>
            </div>
            <div className="flex items-center gap-2 text-[#ee4d2d]">
              <span className="text-green-600 flex items-center gap-1 uppercase font-medium"><Truck size={14}/> Giao hàng thành công</span>
              <span className="border-l h-4 mx-2 border-gray-300"></span>
              <span className="uppercase font-medium">HOÀN THÀNH</span>
            </div>
          </div>
          
          <div className="p-4 border-b flex gap-4">
            <div className="w-20 h-20 bg-amber-800 rounded-sm flex-shrink-0"></div>
            <div className="flex-1 text-sm">
              <h3 className="line-clamp-2">1Kg Mùn xơ dừa đã qua xử lý phù hợp trồng hoa lan rau mầm, cây cảnh...</h3>
              <p className="text-gray-500 mt-1">Phân loại hàng: 1Kg Mùn Dừa Ẩm</p>
              <p className="mt-1">x2</p>
            </div>
            <div className="text-right">
              <span className="text-gray-400 line-through text-xs mr-2">15.000đ</span>
              <span className="text-[#ee4d2d]">11.899đ</span>
            </div>
          </div>

          <div className="p-4 flex flex-col md:flex-row justify-between items-end gap-4 bg-orange-50/50">
            <div className="text-sm text-gray-500">Không nhận được đánh giá</div>
            <div className="flex flex-col items-end gap-3">
              <div className="text-sm">Thành tiền: <span className="text-2xl text-[#ee4d2d] font-medium ml-2">23.798đ</span></div>
              <div className="flex gap-2">
                <button className="bg-[#ee4d2d] text-white px-8 py-2 rounded-sm text-sm hover:bg-[#f05d40] transition">Mua Lại</button>
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-sm text-sm hover:bg-gray-50">Liên Hệ Người Bán</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}