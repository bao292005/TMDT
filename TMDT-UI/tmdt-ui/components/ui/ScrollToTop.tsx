'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Lên đầu trang"
      className="fixed bottom-6 right-6 z-50 bg-[#ee4d2d] text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:bg-[#d63d1e] hover:scale-110 transition-all duration-200"
    >
      <ChevronUp size={22} />
    </button>
  );
}
