"use client";

import { useCallback, useEffect, useState } from "react";

type Variant = {
  size: string;
  color: string;
  stock: number;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  variants: Variant[];
  isActive: boolean;
};

type ApiPayload = {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    items?: Product[];
    isActive?: boolean;
    idempotent?: boolean;
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export function AdminProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionKey, setActionKey] = useState("");
  const [deactivateConfirmId, setDeactivateConfirmId] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" });
      const payload: ApiPayload = await response.json();

      if (!response.ok || !payload.success || !payload.data?.items) {
        setError(payload.message ?? payload.error ?? "Không thể tải danh sách sản phẩm.");
        return;
      }

      setProducts(payload.data.items);
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function handleDeactivate(productId: string) {
    if (deactivateConfirmId !== productId) {
      setDeactivateConfirmId(productId);
      return;
    }

    setActionKey(productId);
    setError("");

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });
      const payload: ApiPayload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload.message ?? payload.error ?? "Không thể vô hiệu hóa sản phẩm.");
        return;
      }

      await loadProducts();
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setActionKey("");
      setDeactivateConfirmId("");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 px-6 py-10">
        <h1 className="text-2xl font-semibold">Quản lý sản phẩm</h1>
        <p className="text-zinc-600">Đang tải dữ liệu...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Quản lý sản phẩm</h1>

      {error ? <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}

      <div className="space-y-4">
        {products.map((product) => {
          const isConfirming = deactivateConfirmId === product.id;
          const isProcessing = actionKey === product.id;

          return (
            <article key={product.id} className="rounded border p-4 shadow-sm bg-white">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-lg">{product.name}</h2>
                  <p className="text-zinc-600 text-sm">Mã: {product.slug} | Giá: {formatCurrency(product.price)}</p>
                  <p className="text-zinc-500 text-sm">
                    Trạng thái: {product.isActive ? <span className="text-green-600 font-medium">Hoạt động</span> : <span className="text-red-500 font-medium">Ngừng kinh doanh</span>}
                  </p>
                </div>

                {product.isActive ? (
                  <div className="flex flex-col items-end gap-2">
                    {isConfirming && (
                      <div className="rounded bg-red-50 p-3 text-sm text-red-800 border border-red-200 w-full md:w-auto" role="alert">
                        <p className="font-semibold mb-1">Cảnh báo: Hành động này không thể hoàn tác trên giao diện.</p>
                        <p>Sản phẩm sẽ bị ẩn khỏi cửa hàng. Bạn có chắc chắn muốn ngừng kinh doanh?</p>
                      </div>
                    )}
                    <div className="flex gap-2 w-full md:w-auto">
                      {isConfirming && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => setDeactivateConfirmId("")}
                          className="flex-1 md:flex-none rounded border px-4 py-2 text-sm bg-white hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50"
                        >
                          Hủy
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleDeactivate(product.id)}
                        className={`flex-1 md:flex-none rounded px-4 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 transition-colors ${
                          isConfirming ? "bg-red-600 hover:bg-red-700 font-bold" : "bg-red-500 hover:bg-red-600"
                        }`}
                        aria-live="polite"
                      >
                        {isProcessing ? "Đang xử lý..." : (isConfirming ? "Chắc chắn vô hiệu hóa" : "Ngừng kinh doanh")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
