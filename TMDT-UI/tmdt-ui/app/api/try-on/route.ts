import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Nhận File ảnh người dùng và ID áo từ form data
    // const formData = await request.formData();
    // const userImage = formData.get('userImage');
    // const garmentId = formData.get('garmentId');

    // 2. Gửi request sang Microservice AI thực tế (Python, FastAPI...)
    // const aiResponse = await fetch('http://ai-server.internal/v1/try-on', { ... });
    
    // Giả lập delay của model AI (Khoảng 3s)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Trả về URL kết quả
    return NextResponse.json({ 
      success: true, 
      resultUrl: 'https://via.placeholder.com/400x600?text=AI+Result' 
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi khi gọi model AI' }, { status: 500 });
  }
}