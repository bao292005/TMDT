import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[70vh]">
      <div className="bg-white p-8 rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.05)] w-full max-w-md border-t-4 border-[#ee4d2d]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#ee4d2d] mb-2">Đăng Ký</h1>
          <p className="text-sm text-gray-500">Tạo tài khoản TMĐT Store</p>
        </div>

        <form className="space-y-4">
          <div>
            <input 
              type="text" 
              placeholder="Họ và tên" 
              className="w-full border p-3 rounded-sm outline-none focus:border-[#ee4d2d] text-sm"
              required
            />
          </div>
          <div>
            <input 
              type="email" 
              placeholder="Email của bạn" 
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
            className="w-full bg-[#ee4d2d] text-white py-3 rounded-sm font-medium hover:bg-[#f05d40] transition uppercase text-sm mt-2"
          >
            Đăng Ký
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-6 px-4">
          Bằng việc đăng kí, bạn đã đồng ý với TMĐT Store về <Link href="#" className="text-[#ee4d2d]">Điều khoản dịch vụ</Link> & <Link href="#" className="text-[#ee4d2d]">Chính sách bảo mật</Link>
        </p>

        <div className="text-center mt-6 text-sm text-gray-500 border-t pt-4">
          Bạn đã có tài khoản? <Link href="/login" className="text-[#ee4d2d] font-medium">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}