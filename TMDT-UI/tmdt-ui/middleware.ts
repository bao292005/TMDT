import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Giả lập kiểm tra người dùng đã đăng nhập (Thông qua Token/Cookie)
  // Trong thực tế bạn sẽ decode JWT hoặc check session ở đây
  const authToken = request.cookies.get('auth_token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');

  // Nếu truy cập các trang (customer) mà chưa có token -> Đẩy về /login
  if (!authToken && (request.nextUrl.pathname.startsWith('/checkout') || request.nextUrl.pathname.startsWith('/orders') || request.nextUrl.pathname.startsWith('/profile'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Nếu đã đăng nhập mà vào trang /login -> Đẩy về trang chủ
  if (authToken && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Chỉ cấu hình chạy middleware trên các routes cần bảo vệ
export const config = {
  matcher: ['/checkout/:path*', '/orders/:path*', '/profile/:path*', '/login', '/register'],
};