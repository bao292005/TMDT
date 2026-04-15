import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authService } from '@/modules/identity/authService';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 1. Tìm user theo email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Sai email' }, { status: 401 });
    }

    // 2. Kiểm tra mật khẩu
    const isMatch = authService.verifyPassword(password, user.passwordHash);
    if (!isMatch) {
       return NextResponse.json({ success: false, message: 'Sai mật khẩu' }, { status: 401 });
    }

    // 3. Đăng nhập thành công -> Tạo Token
    const token = authService.generateSessionToken(user.id);

    const response = NextResponse.json({ success: true, message: 'Đăng nhập thành công' });
    
    // 4. Lưu Token vào Cookie để duy trì đăng nhập
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
    });

    return response;

  } catch (error: unknown) {
    console.error('Lỗi đăng nhập:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}