"use client";

import { useCallback, useEffect, useState } from "react";

import { ActionButton } from "@/components/ui/action-button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PageShell } from "@/components/ui/page-shell";
import { StatePanel } from "@/components/ui/state-panel";

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

  return (
    <PageShell title="Quản lý sản phẩm" maxWidth="4xl">
      {error ? <FeedbackMessage tone="error" message={error} /> : null}

      {loading ? (
        <StatePanel state="loading" title="Đang tải dữ liệu" description="Vui lòng chờ trong giây lát." />
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const isConfirming = deactivateConfirmId === product.id;
            const isProcessing = actionKey === product.id;

            return (
              <article key={product.id} className="space-y-3 rounded-sm border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-zinc-900">{product.name}</h2>
                    <p className="text-sm text-zinc-600">Mã: {product.slug} | Giá: {formatCurrency(product.price)}</p>
                    <p className="text-sm text-zinc-600">
                      Trạng thái:{" "}
                      {product.isActive ? (
                        <span className="font-medium text-emerald-700">Hoạt động</span>
                      ) : (
                        <span className="font-medium text-red-600">Ngừng kinh doanh</span>
                      )}
                    </p>
                  </div>

                  {product.isActive ? (
                    <div className="flex flex-col items-end gap-2">
                      {isConfirming ? (
                        <FeedbackMessage
                          tone="warning"
                          title="Cảnh báo"
                          message="Sản phẩm sẽ bị ẩn khỏi cửa hàng. Bạn có chắc chắn muốn ngừng kinh doanh?"
                          className="w-full md:w-auto"
                        />
                      ) : null}

                      <div className="flex w-full gap-2 md:w-auto">
                        {isConfirming ? (
                          <ActionButton
                            type="button"
                            variant="ghost"
                            disabled={isProcessing}
                            onClick={() => setDeactivateConfirmId("")}
                          >
                            Hủy
                          </ActionButton>
                        ) : null}
                        <ActionButton
                          type="button"
                          variant={isConfirming ? "destructive" : "primary"}
                          disabled={isProcessing}
                          onClick={() => handleDeactivate(product.id)}
                          aria-live="polite"
                        >
                          {isProcessing ? "Đang xử lý..." : isConfirming ? "Chắc chắn vô hiệu hóa" : "Ngừng kinh doanh"}
                        </ActionButton>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
