'use client';
import { useState } from 'react';
import { Upload, Sparkles, Loader2 } from 'lucide-react';

export default function AITryOnPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleTryOn = async () => {
    setIsProcessing(true);
    // Call AI BFF API
    try {
      const res = await fetch('/api/try-on', { method: 'POST' });
      const data = await res.json();
      if(data.success) setResult(data.resultUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-[#ee4d2d]">
          ✨ AI Virtual Try-On
        </h1>
        <p className="text-gray-500">Xem ngay trang phục này trông như thế nào trên người bạn!</p>
      </div>

      <div className="bg-white p-6 rounded-md shadow-sm border flex flex-col md:flex-row gap-8">
        {/* Upload User Image */}
        <div className="flex-1 space-y-4">
          <h3 className="font-medium text-lg border-b pb-2">1. Tải ảnh của bạn lên</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-md p-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer min-h-[300px]">
            <Upload size={40} className="text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">Kéo thả hoặc nhấn để chọn ảnh</p>
            <p className="text-xs text-gray-400 mt-2">Định dạng JPG, PNG. Đứng thẳng, nhìn rõ dáng.</p>
          </div>
        </div>

        {/* Select Garment */}
        <div className="flex-1 space-y-4">
          <h3 className="font-medium text-lg border-b pb-2">2. Chọn trang phục</h3>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className={`aspect-square bg-gray-100 rounded-md border-2 cursor-pointer relative flex items-center justify-center text-gray-400 text-sm ${item === 1 ? 'border-purple-500 bg-purple-50' : 'border-transparent hover:border-purple-300'}`}>
                Mẫu {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={handleTryOn}
          disabled={isProcessing}
          className="bg-gradient-to-r from-purple-600 to-[#ee4d2d] text-white px-12 py-4 rounded-full text-lg font-bold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
          {isProcessing ? 'AI đang xử lý...' : 'Thử Đồ Ngay'}
        </button>
      </div>

      {/* Result Area */}
      {result && (
        <div className="bg-white p-6 rounded-md shadow-sm border text-center animate-fade-in-up">
          <h3 className="font-medium text-lg border-b pb-2 mb-6">🎉 Kết quả của bạn</h3>
          <div className="w-full max-w-sm mx-auto aspect-[3/4] bg-gray-100 rounded-md shadow-inner flex items-center justify-center text-purple-600 font-medium">
             [Ảnh AI Render Trả Về Tại Đây]
          </div>
        </div>
      )}
    </div>
  );
}