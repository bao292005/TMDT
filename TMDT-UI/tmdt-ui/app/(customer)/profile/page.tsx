import Link from 'next/link';
import { User, ClipboardList } from 'lucide-react';

export default function ProfilePage() {
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
          <Link href="/profile" className="flex items-center gap-3 px-4 py-3 bg-orange-50 text-[#ee4d2d] font-medium text-sm"><User size={18}/> Tài Khoản Của Tôi</Link>
          <Link href="/orders" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-600 text-sm"><ClipboardList size={18} className="text-blue-500"/> Đơn Mua</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white rounded-sm shadow-sm p-6">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-lg font-medium text-gray-800">Hồ Sơ Của Tôi</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          <div className="flex-1 space-y-6">
            <div className="flex items-center text-sm">
              <label className="w-1/3 text-gray-500 text-right pr-4">Tên đăng nhập</label>
              <div className="w-2/3 font-medium">khachhang_52</div>
            </div>
            <div className="flex items-center text-sm">
              <label className="w-1/3 text-gray-500 text-right pr-4">Tên</label>
              <input type="text" className="w-2/3 border p-2 rounded-sm outline-none focus:border-[#ee4d2d]" defaultValue="Nguyễn Văn A" />
            </div>
            <div className="flex items-center text-sm">
              <label className="w-1/3 text-gray-500 text-right pr-4">Email</label>
              <div className="w-2/3 flex items-center gap-2">
                ng***@gmail.com <button className="text-blue-600 underline text-xs">Thay đổi</button>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <label className="w-1/3 text-gray-500 text-right pr-4">Số điện thoại</label>
              <div className="w-2/3 flex items-center gap-2">
                *********78 <button className="text-blue-600 underline text-xs">Thay đổi</button>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <label className="w-1/3 text-gray-500 text-right pr-4">Giới tính</label>
              <div className="w-2/3 flex gap-4">
                <label className="flex items-center gap-2"><input type="radio" name="gender" className="accent-[#ee4d2d]" defaultChecked/> Nam</label>
                <label className="flex items-center gap-2"><input type="radio" name="gender" className="accent-[#ee4d2d]"/> Nữ</label>
                <label className="flex items-center gap-2"><input type="radio" name="gender" className="accent-[#ee4d2d]"/> Khác</label>
              </div>
            </div>
            <div className="flex items-center pt-4 text-sm">
               <div className="w-1/3 pr-4"></div>
               <button className="bg-[#ee4d2d] text-white px-8 py-2 rounded-sm font-medium hover:bg-[#f05d40] transition">
                 Lưu
               </button>
            </div>
          </div>

          <div className="w-full md:w-1/3 flex flex-col items-center border-l border-gray-100 pl-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl text-gray-400 mb-4">K</div>
            <button className="border border-gray-300 px-4 py-2 rounded-sm text-sm hover:bg-gray-50 mb-4">
              Chọn Ảnh
            </button>
            <div className="text-xs text-gray-400 text-center">
              Dụng lượng file tối đa 1 MB<br/>Định dạng: .JPEG, .PNG
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}