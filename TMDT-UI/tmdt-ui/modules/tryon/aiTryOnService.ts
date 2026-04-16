import { ENV } from '@/shared/config/env';

export const aiTryOnService = {
  /**
   * Gửi ảnh người dùng và ID áo sang Server AI để xử lý
   */
  async generateTryOnImage(userImageFile: File, garmentId: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('person_image', userImageFile);
      formData.append('garment_id', garmentId);

      // Gọi sang server AI (VD: FastAPI hoặc Flask)
      const response = await fetch(ENV.AI_SERVICE.URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ENV.AI_SERVICE.API_KEY}`,
          // Lưu ý: Không set Content-Type khi gửi FormData trong trình duyệt/fetch, 
          // browser sẽ tự thêm boundary.
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`AI Service lỗi: ${response.status}`);
      }

      const data = await response.json();
      return data.result_image_url; // Trả về link ảnh kết quả
      
    } catch (error) {
      console.error('Lỗi module AI Try-On:', error);
      // Fallback mock data cho môi trường Dev nếu server AI chưa bật
      if (ENV.NODE_ENV === 'development') {
        console.warn('Đang dùng ảnh Mock AI do không kết nối được server.');
        return 'https://via.placeholder.com/400x600/6b21a8/ffffff?text=Mock+AI+Result';
      }
      throw new Error('Hệ thống AI đang quá tải, vui lòng thử lại sau.');
    }
  }
};