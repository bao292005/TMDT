import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[70vh]">
      <div className="bg-white p-8 rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.05)] w-full max-w-md border-t-4 border-[#ee4d2d]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#ee4d2d] mb-2">Đăng Nhập</h1>
          <p className="text-sm text-gray-500">Đăng nhập để quản lý đơn hàng & trải nghiệm AI</p>
        </div>

        <form className="space-y-4">
          <div>
            <input 
              type="text" 
              placeholder="Email / Số điện thoại / Tên đăng nhập" 
              className="w-full border p-3 rounded-sm outline-none focus:border-[#ee4d2d] text-sm"
              required
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              className="w-full border p-3 rounded-sm outline-none focus:border-[#ee4d2d] text-sm"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-[#ee4d2d] text-white py-3 rounded-sm font-medium hover:bg-[#f05d40] transition uppercase text-sm"
          >
            Đăng Nhập
          </button>
        </form>

        <div className="flex items-center justify-between mt-4 text-xs">
          <Link href="#" className="text-blue-600 hover:opacity-80">Quên mật khẩu</Link>
          <Link href="#" className="text-blue-600 hover:opacity-80">Đăng nhập với SMS</Link>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400 uppercase">Hoặc</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <div className="mt-6 flex gap-2">
          <button className="flex-1 border py-2 rounded-sm text-sm hover:bg-gray-50 text-gray-600">Facebook</button>
          <button className="flex-1 border py-2 rounded-sm text-sm hover:bg-gray-50 text-gray-600">Google</button>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          Bạn mới biết đến TMĐT Store? <Link href="/register" className="text-[#ee4d2d] font-medium">Đăng ký</Link>
        </div>
      </div>
    </div>
  );
}