'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const banners = [
  {
    id: 1,
    image: '/images/banner1.jpg',
    alt: 'Happy Vegan Food Day - Giảm 75%',
    link: '/products',
  },
  {
    id: 2,
    image: '/images/banner2.jpg',
    alt: 'Banner Mỹ Phẩm - 100% Organic',
    link: '/products',
  },
  {
    id: 3,
    image: '/images/banner3.jpg',
    alt: 'Bão Deal - Chào Thu Tháng 10',
    link: '/products',
  },
  {
    id: 4,
    image: '/images/banner4.jpg',
    alt: 'Quà Tặng Đồ Gia Dụng - BONDI',
    link: '/products',
  },
];

export default function BannerSlider() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }, []);

  // Auto slide mỗi 4 giây, dừng khi hover
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [isHovered, next]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl shadow-lg bg-gray-100"
      style={{ aspectRatio: '9 / 3' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides — chỉ hiện 1 ảnh tại một thời điểm */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${current * 100}%)`,
          width: `${banners.length * 100}%`,
        }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="relative h-full flex-shrink-0"
            style={{ width: `${100 / banners.length}%` }}
          >
            <Link href={banner.link}>
              <Image
                src={banner.image}
                alt={banner.alt}
                fill
                className="object-cover"
                priority={banner.id === 1}
              />
            </Link>
          </div>
        ))}
      </div>

      {/* Nút mũi tên trái */}
      <button
        onClick={prev}
        aria-label="Ảnh trước"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition-all duration-200 backdrop-blur-sm"
      >
        ‹
      </button>

      {/* Nút mũi tên phải */}
      <button
        onClick={next}
        aria-label="Ảnh tiếp theo"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition-all duration-200 backdrop-blur-sm"
      >
        ›
      </button>

      {/* Dots điều hướng */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Chuyển đến banner ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-6 h-2.5 bg-white'
                : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-white/30 w-full z-10">
        <div
          key={current}
          className="h-full bg-white"
          style={{
            animation: isHovered ? 'none' : 'progress 4s linear forwards',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
