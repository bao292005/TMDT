"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CartPayload = {
  success?: boolean;
  data?: {
    items?: Array<{ quantity?: number }>;
  };
};

export default function Header({ user }: { user?: { email?: string, username?: string, id?: string } | null }) {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    router.push(`/products?keyword=${encodeURIComponent(keyword.trim())}`);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCartCount() {
      try {
        const response = await fetch("/api/cart", { cache: "no-store" });
        if (!response.ok) return;

        const payload: CartPayload = await response.json();
        if (!payload?.success || !payload.data?.items) return;

        const total = payload.data.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
        if (!cancelled) {
          setCartCount(total);
        }
      } catch {
        // no-op
      }
    }

    void loadCartCount();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="bg-[#ee4d2d] text-white shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-2 text-xs">
        <div className="flex items-center gap-4">
          <Link href="/home" className="hover:opacity-85">
            TMĐT Store
          </Link>
          <Link href="/products" className="hover:opacity-85">
            Danh mục
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/orders" className="inline-flex items-center gap-1 hover:opacity-85">
            <span aria-hidden="true" className="text-[10px] font-bold">ĐH</span> Đơn hàng
          </Link>
          <Link href="/profile" className="inline-flex items-center gap-1 hover:opacity-85">
            <span aria-hidden="true" className="text-[10px] font-bold">TK</span> Tài khoản
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white/90">Xin chào, {user.email?.split('@')[0] || user.username || user.id || "Người dùng"}</span>
              <span className="w-px h-3 bg-white/40"></span>
              <button onClick={() => void handleLogout()} className="hover:opacity-85" disabled={loggingOut}>
                {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            </div>
          ) : (
            <>
              <Link href="/register" className="hover:opacity-85">
                Đăng ký
              </Link>
              <Link href="/login" className="hover:opacity-85">
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="container mx-auto flex items-center gap-4 px-4 py-4">
        <Link href="/home" className="shrink-0 text-2xl font-black tracking-tight">
          TMĐT STORE
        </Link>

        <div className="flex flex-1 justify-center px-8">
          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-3xl items-center rounded-sm bg-white p-1 shadow-inner"
          >
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="flex-1 bg-transparent px-3 py-1.5 text-sm text-zinc-800 focus:outline-none"
            />
            <button
              type="submit"
              className="flex shrink-0 items-center justify-center rounded-sm bg-[#ee4d2d] px-6 py-1.5 text-white hover:bg-[#d73211] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </form>
        </div>

        <Link href="/cart" className="relative ml-auto p-1 hover:opacity-85 transition-opacity" aria-label="Giỏ hàng">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          {cartCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[#ee4d2d] ring-2 ring-[#ee4d2d]">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          ) : null}
        </Link>
      </div>

      <nav className="container mx-auto flex flex-wrap items-center justify-center gap-8 px-4 pb-4 text-sm font-medium">
        <Link href="/products" className="hover:opacity-85 transition-opacity">Tất cả</Link>
        <Link href="/products?category=ao-thun" className="hover:opacity-85 transition-opacity">Áo thun</Link>
        <Link href="/products?category=quan-jean" className="hover:opacity-85 transition-opacity">Quần jean</Link>
        <Link href="/products?category=vay" className="hover:opacity-85 transition-opacity">Váy</Link>
        <Link href="/products?category=hoodie" className="hover:opacity-85 transition-opacity">Hoodie</Link>
      </nav>
    </header>
  );
}
