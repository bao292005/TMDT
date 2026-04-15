import Link from 'next/link';

interface ProductCardProps {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  soldCount?: string | number;
  hasAI?: boolean;
}

export default function ProductCard({ id, name, price, originalPrice, rating, soldCount, hasAI }: ProductCardProps) {
  return (
    <Link href={`/products/${id}`} className="border border-transparent hover:border-[#ee4d2d] hover:shadow-md transition bg-white p-2 rounded-sm relative group flex flex-col h-full">
      {hasAI && (
        <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 font-bold rounded z-10 shadow-sm">
          AI
        </div>
      )}
      
      {/* Khung ảnh sản phẩm */}
      <div className="aspect-square bg-gray-100 mb-2 flex items-center justify-center relative overflow-hidden">
        <span className="text-gray-400 text-sm">Ảnh SP</span>
        {/* Lớp overlay khi hover */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
      
      {/* Thông tin sản phẩm */}
      <div className="flex flex-col flex-1">
        <h4 className="text-sm line-clamp-2 mb-2 group-hover:text-[#ee4d2d] transition-colors">{name}</h4>
        
        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-[#ee4d2d] font-bold">{price.toLocaleString()}đ</span>
            {originalPrice && (
              <span className="text-xs text-gray-400 line-through">{originalPrice.toLocaleString()}đ</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
            {rating && <span className="text-yellow-400">★ {rating}</span>}
            {soldCount && <span>Đã bán {soldCount}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}