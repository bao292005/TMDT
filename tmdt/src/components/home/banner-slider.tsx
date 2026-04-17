"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BANNERS = [
  { id: 1, title: "Flash Deal thời trang", subtitle: "Ưu đãi đến 50%", href: "/products" },
  { id: 2, title: "AI Try-On thông minh", subtitle: "Thử đồ trực quan", href: "/products" },
  { id: 3, title: "Bộ sưu tập mới", subtitle: "Mẫu hot cập nhật", href: "/products" },
];

export default function BannerSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BANNERS.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="flex transition-transform duration-700" style={{ transform: `translateX(-${current * 100}%)` }}>
        {BANNERS.map((banner) => (
          <div key={banner.id} className="w-full shrink-0 bg-gradient-to-r from-orange-400 to-[#ee4d2d] p-8 text-white">
            <p className="text-2xl font-black">{banner.title}</p>
            <p className="mt-1 text-sm text-orange-50">{banner.subtitle}</p>
            <Link href={banner.href} className="mt-4 inline-block rounded-sm bg-white px-4 py-2 text-sm font-medium text-[#ee4d2d]">
              Khám phá ngay
            </Link>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            aria-label={`Chuyển banner ${index + 1}`}
            className={`h-2.5 rounded-full transition-all ${index === current ? "w-6 bg-white" : "w-2.5 bg-white/60"}`}
          />
        ))}
      </div>
    </section>
  );
}
