"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PageShell } from "@/components/ui/page-shell";
import { StatePanel } from "@/components/ui/state-panel";
import { resolveAuthRedirectPath } from "@/shared/utils/auth-redirect";

type OrderListItem = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  itemCount: number;
  pricing: {
    total: number;
  };
  payment: {
    status: string;
    stateLabel: string;
  } | null;
};

type OrdersResponse = {
  success: boolean;
  state?: string;
  error?: string;
  message?: string;
  data?: {
    orders?: OrderListItem[];
  };
};


function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Không rõ";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

export function OrdersClient() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        const payload: OrdersResponse = await response.json();

        const authRedirectPath = resolveAuthRedirectPath(response.status, payload.error);
        if (authRedirectPath) {
          window.location.assign(authRedirectPath);
          return;
        }

        if (!response.ok || !payload.success || !Array.isArray(payload.data?.orders)) {
          setError(payload.message ?? "Không thể tải danh sách đơn hàng.");
          setOrders([]);
          return;
        }

        setOrders(payload.data.orders);
      } catch {
        setError("Không thể kết nối tới máy chủ.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    void loadOrders();
  }, []);

  if (loading) {
    return (
      <PageShell title="Đơn hàng của tôi" maxWidth="4xl">
        <StatePanel state="loading" title="Đang tải đơn hàng" description="Vui lòng chờ trong giây lát." />
      </PageShell>
    );
  }

  return (
    <PageShell title="Đơn hàng của tôi" maxWidth="4xl">
      {error ? <FeedbackMessage tone="error" message={error} /> : null}

      {!error && orders.length === 0 ? (
        <StatePanel state="empty" title="Chưa có đơn hàng" description="Bạn chưa có đơn hàng nào." />
      ) : null}

      {!error && orders.length > 0 ? (
        <ul className="space-y-3" aria-label="Danh sách đơn hàng">
          {orders.map((order) => (
            <li key={order.id} className="rounded border border-zinc-200 bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-zinc-500">Mã đơn: {order.id}</p>
                  <p className="font-medium text-zinc-900">{order.payment?.stateLabel ?? order.status}</p>
                  <p className="text-sm text-zinc-600">Tạo lúc: {formatDate(order.createdAt)}</p>
                </div>

                <div className="space-y-1 text-sm text-zinc-700 sm:text-right">
                  <p>{order.itemCount} sản phẩm</p>
                  <p className="font-medium">{formatCurrency(order.pricing.total)}</p>
                  <Link href={`/orders/${order.id}`} className="inline-block text-blue-600 underline">
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </PageShell>
  );
}
