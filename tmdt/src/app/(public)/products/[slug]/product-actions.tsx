"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import { FeedbackMessage } from "@/components/ui/feedback-message";

type ProductActionsProps = {
  productSlug: string;
  selectedVariantId: string;
  inStock: boolean;
  stock: number;
};

export function ProductActions({ productSlug, selectedVariantId, inStock, stock }: ProductActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAddToCart(redirectPath?: string) {
    if (!inStock || stock <= 0) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug,
          variantId: selectedVariantId,
          quantity: 1,
        }),
      });

      let payload;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      // If user isn't logged in, middleware might return 401 or redirect
      if (response.status === 401 || response.status === 403) {
        router.push("/login");
        return;
      }

      if (!response.ok || !payload?.success) {
        setMessage(payload?.message ?? "Không thể thêm vào giỏ hàng.");
        setLoading(false);
        return;
      }

      if (redirectPath) {
        router.push(redirectPath);
      } else {
        setMessage("Đã thêm sản phẩm vào giỏ hàng thành công!");
        setLoading(false);
        // Dispatch custom event to update cart counter if header listens to it, or standard router refresh
        router.refresh();
      }
    } catch {
      setMessage("Không thể kết nối tới máy chủ.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 pt-4 mt-4 border-t border-zinc-200">
      <div className="flex flex-col sm:flex-row gap-3">
        <ActionButton 
          type="button" 
          variant="secondary"
          className="flex-1 py-3 text-base border-[#ee4d2d] text-[#ee4d2d] bg-[#ee4d2d]/10 hover:bg-[#ee4d2d]/20 transition-colors"
          disabled={loading || !inStock || stock <= 0}
          onClick={() => handleAddToCart()}
        >
          {loading ? "Đang xử lý..." : "Thêm Vào Giỏ Hàng"}
        </ActionButton>
        <ActionButton 
          type="button" 
          variant="primary"
          className="flex-1 py-3 text-base bg-[#ee4d2d] hover:bg-[#d73211] hover:shadow-lg transition-all"
          disabled={loading || !inStock || stock <= 0}
          onClick={() => handleAddToCart('/cart')}
        >
          Mua Ngay
        </ActionButton>
      </div>
      {message && (
        <FeedbackMessage tone={message.includes("thành công") ? "success" : "error"} message={message} />
      )}
      {(!inStock || stock <= 0) && (
        <p className="text-red-500 font-medium text-sm">Sản phẩm này hiện đang hết hàng.</p>
      )}
    </div>
  );
}
