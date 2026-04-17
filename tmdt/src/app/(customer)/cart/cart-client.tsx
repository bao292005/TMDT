"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ActionButton } from "@/components/ui/action-button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PageShell } from "@/components/ui/page-shell";
import { StatePanel } from "@/components/ui/state-panel";
import { resolveAuthRedirectPath } from "@/shared/utils/auth-redirect";

type CartItem = {
  productSlug: string;
  variantId: string;
  quantity: number;
  title: string;
  price: number;
  stock: number;
  inStock: boolean;
  isValid: boolean;
  reason: string;
};

type CartSnapshot = {
  items: CartItem[];
  subtotal: number;
  isValid: boolean;
  invalidItems: CartItem[];
};

type ApiPayload = {
  success: boolean;
  state?: string;
  error?: string;
  message?: string;
  data?: CartSnapshot;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}


function toQuantityDraftMap(snapshot: CartSnapshot) {
  return Object.fromEntries(snapshot.items.map((item) => [`${item.productSlug}-${item.variantId}`, String(item.quantity)]));
}

export function CartClient() {
  const [cart, setCart] = useState<CartSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [actionKey, setActionKey] = useState("");
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});

  const redirectByAuthState = useCallback((response: Response, payload: ApiPayload | null) => {
    const authRedirectPath = resolveAuthRedirectPath(response.status, payload?.error);
    if (!authRedirectPath) {
      return false;
    }

    window.location.assign(authRedirectPath);
    return true;
  }, []);

  const applySnapshot = useCallback((snapshot: CartSnapshot) => {
    setCart(snapshot);
    setQuantityDrafts(toQuantityDraftMap(snapshot));
  }, []);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const payload: ApiPayload = await response.json();

      if (redirectByAuthState(response, payload)) {
        return;
      }

      if (!response.ok || !payload.success || !payload.data) {
        setError(payload.message ?? "Không thể tải giỏ hàng.");
        setCart(null);
        setQuantityDrafts({});
        return;
      }

      applySnapshot(payload.data);
    } catch {
      setError("Không thể kết nối tới máy chủ.");
      setCart(null);
      setQuantityDrafts({});
    } finally {
      setLoading(false);
    }
  }, [applySnapshot, redirectByAuthState]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  async function mutateCart(method: "PATCH" | "DELETE", body: Record<string, unknown>, key: string) {
    setActionKey(key);
    setError("");
    setCheckoutError("");

    try {
      const response = await fetch("/api/cart", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload: ApiPayload = await response.json();
      if (redirectByAuthState(response, payload)) {
        return;
      }

      if (!response.ok || !payload.success || !payload.data) {
        setError(payload.message ?? "Không thể cập nhật giỏ hàng.");
        return;
      }

      applySnapshot(payload.data);
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setActionKey("");
    }
  }

  async function handleCheckoutValidate() {
    setCheckoutError("");
    setError("");
    setActionKey("checkout");

    try {
      const response = await fetch("/api/cart?mode=checkout", { cache: "no-store" });
      const payload: ApiPayload = await response.json();

      if (redirectByAuthState(response, payload)) {
        return;
      }

      if (!response.ok || !payload.success || !payload.data) {
        setCheckoutError(payload.message ?? "Giỏ hàng chưa thể checkout.");
        if (payload.data) {
          applySnapshot(payload.data);
        }
        return;
      }

      applySnapshot(payload.data);
      window.location.assign("/checkout");
    } catch {
      setCheckoutError("Không thể kết nối tới máy chủ.");
    } finally {
      setActionKey("");
    }
  }

  const hasItems = (cart?.items.length ?? 0) > 0;
  const canCheckout = Boolean(cart?.isValid && hasItems);
  const subtotal = useMemo(() => formatCurrency(cart?.subtotal ?? 0), [cart?.subtotal]);

  if (loading) {
    return (
      <PageShell title="Giỏ hàng" maxWidth="4xl">
        <StatePanel state="loading" title="Đang tải giỏ hàng" description="Vui lòng chờ trong giây lát." />
      </PageShell>
    );
  }

  return (
    <PageShell title="Giỏ hàng" maxWidth="4xl">
      {error ? <FeedbackMessage tone="error" message={error} /> : null}

      {!cart || !hasItems ? (
        <StatePanel state="empty" title="Giỏ hàng trống" description="Giỏ hàng của bạn đang trống." />
      ) : (
        <section className="space-y-3" aria-label="Danh sách sản phẩm trong giỏ">
          {cart.items.map((item) => {
            const rowKey = `${item.productSlug}-${item.variantId}`;
            const updating = actionKey === `update-${rowKey}`;
            const removing = actionKey === `remove-${rowKey}`;
            const draftValue = quantityDrafts[rowKey] ?? String(item.quantity);

            return (
              <article key={rowKey} className="space-y-2 rounded-sm border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-medium">{item.title}</h2>
                    <p className="text-sm text-zinc-600">Biến thể: {item.variantId}</p>
                    <p className="text-sm text-zinc-700">{formatCurrency(item.price)}</p>
                  </div>

                  <ActionButton
                    onClick={() =>
                      void mutateCart(
                        "DELETE",
                        { productSlug: item.productSlug, variantId: item.variantId },
                        `remove-${rowKey}`,
                      )
                    }
                    disabled={Boolean(actionKey) || removing}
                    variant="secondary"
                  >
                    {removing ? "Đang xóa..." : "Xóa"}
                  </ActionButton>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor={`qty-${rowKey}`} className="text-sm text-zinc-700">
                    Số lượng
                  </label>
                  <input
                    id={`qty-${rowKey}`}
                    type="number"
                    min={1}
                    max={Math.max(item.stock, 1)}
                    value={draftValue}
                    onChange={(event) => {
                      setQuantityDrafts((prev) => ({ ...prev, [rowKey]: event.target.value }));
                    }}
                    onBlur={() => {
                      const next = Number(draftValue);
                      if (!Number.isInteger(next) || next < 1) {
                        setQuantityDrafts((prev) => ({ ...prev, [rowKey]: String(item.quantity) }));
                        return;
                      }

                      const maxAllowed = Math.max(item.stock, 1);
                      if (next > maxAllowed) {
                        setQuantityDrafts((prev) => ({ ...prev, [rowKey]: String(maxAllowed) }));
                        return;
                      }

                      if (next === item.quantity) {
                        return;
                      }

                      void mutateCart(
                        "PATCH",
                        {
                          productSlug: item.productSlug,
                          variantId: item.variantId,
                          quantity: next,
                        },
                        `update-${rowKey}`,
                      );
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.currentTarget.blur();
                      }
                    }}
                    disabled={Boolean(actionKey) || updating}
                    className="w-24 rounded-sm border border-zinc-300 px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee4d2d] focus-visible:ring-offset-2"
                  />
                  <span className="text-sm text-zinc-500">Tồn kho: {item.stock}</span>
                </div>

                {!item.isValid ? <FeedbackMessage tone="warning" message={item.reason} /> : null}
              </article>
            );
          })}
        </section>
      )}

      <section className="space-y-3 rounded-sm border border-zinc-200 bg-white p-4 shadow-sm" aria-label="Tóm tắt giỏ hàng">
        <p className="text-sm text-zinc-600">Tạm tính</p>
        <p className="text-2xl font-semibold text-[#ee4d2d]">{subtotal}</p>

        {!canCheckout && hasItems ? (
          <FeedbackMessage
            tone="warning"
            message="Giỏ hàng chưa hợp lệ. Vui lòng xử lý các sản phẩm lỗi trước khi checkout."
          />
        ) : null}

        {checkoutError ? <FeedbackMessage tone="error" message={checkoutError} /> : null}

        <ActionButton
          onClick={() => void handleCheckoutValidate()}
          disabled={!hasItems || actionKey === "checkout"}
          className="w-full"
        >
          {actionKey === "checkout" ? "Đang kiểm tra..." : "Kiểm tra giỏ trước checkout"}
        </ActionButton>
      </section>
    </PageShell>
  );
}
