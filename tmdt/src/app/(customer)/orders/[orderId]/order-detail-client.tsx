"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ActionButton } from "@/components/ui/action-button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PageShell } from "@/components/ui/page-shell";
import { StatePanel } from "@/components/ui/state-panel";
import { resolveAuthRedirectPath } from "@/shared/utils/auth-redirect";

import {
  resolveNextActionText,
  resolveStatusCue,
  shouldSchedulePollingForOrder,
} from "./order-detail-client-logic.js";

type OrderItem = {
  productSlug: string;
  variantId: string;
  quantity: number;
  title: string;
  price: number;
};

type TrackingTimelineEntry = {
  status: string;
  statusLabel: string;
  timestamp: string | null;
  nextAction: string;
};

type OrderDetail = {
  id: string;
  status: string;
  createdAt: string;
  checkout: {
    selectedAddress: string;
    selectedShippingMethod: string;
    note: string;
  };
  pricing: {
    subtotal: number;
    shippingFee: number;
    discount: number;
    total: number;
  };
  items: OrderItem[];
  payment: {
    status: string;
    stateLabel: string;
    stateTimestamp: string | null;
  } | null;
  tracking: {
    status: string;
    statusLabel: string;
    timestamp: string | null;
    nextAction: string;
    trackingNumber: string | null;
    isDegraded?: boolean;
    degradedReason?: string | null;
    lastSyncedAt?: string | null;
    retryable?: boolean;
    timeline: TrackingTimelineEntry[];
  };
};

type DetailResponse = {
  success: boolean;
  error?: string;
  message?: string;
  data?: OrderDetail;
};


function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Không rõ";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Không rõ";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

function resolveDegradedReasonText(reason?: string | null) {
  if (reason === "SHIPPING_TIMEOUT") return "Kênh vận chuyển phản hồi chậm hơn bình thường.";
  if (reason === "SHIPPING_PROVIDER_UNAVAILABLE") return "Đơn vị vận chuyển đang tạm gián đoạn.";
  if (reason === "SHIPPING_INVALID_TRACKING") return "Thông tin tracking hiện tại không hợp lệ.";
  return "Không thể đồng bộ trạng thái vận chuyển ở thời điểm này.";
}

function shouldStopPollingAfterResponseError(status: number) {
  return status === 403 || status === 404;
}

function resolveRecoveryPrimaryAction(nextAction: string, retryable?: boolean) {
  if (nextAction === "contact_support" || retryable === false) {
    return { kind: "link" as const, label: "Liên hệ hỗ trợ", href: "/profile" };
  }

  return { kind: "refresh" as const, label: "Làm mới trạng thái" };
}

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const latestOrderRef = useRef<OrderDetail | null>(null);

  useEffect(() => {
    let unmounted = false;

    function clearPollingTimer() {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    }

    function schedulePolling(nextOrder: OrderDetail | null) {
      clearPollingTimer();
      if (!shouldSchedulePollingForOrder(nextOrder)) {
        return;
      }

      pollingTimerRef.current = setTimeout(() => {
        void loadDetail(false);
      }, 15_000);
    }

    async function loadDetail(showLoading: boolean) {
      if (unmounted || inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      if (showLoading) {
        setLoading(true);
        setError("");
      }

      try {
        const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        const payload: DetailResponse = await response.json();

        const authRedirectPath = resolveAuthRedirectPath(response.status, payload.error);
        if (authRedirectPath) {
          window.location.assign(authRedirectPath);
          return;
        }

        if (!response.ok || !payload.success || !payload.data) {
          if (!unmounted) {
            setError(payload.message ?? "Không thể tải chi tiết đơn hàng.");
          }

          if (!shouldStopPollingAfterResponseError(response.status)) {
            schedulePolling(latestOrderRef.current);
          }
          return;
        }

        if (!unmounted) {
          latestOrderRef.current = payload.data;
          setOrder(payload.data);
          setError("");
          schedulePolling(payload.data);
        }
      } catch {
        if (!unmounted) {
          setError("Không thể kết nối tới máy chủ.");
          schedulePolling(latestOrderRef.current);
        }
      } finally {
        inFlightRef.current = false;
        if (!unmounted && showLoading) {
          setLoading(false);
        }
      }
    }

    void loadDetail(true);

    return () => {
      unmounted = true;
      latestOrderRef.current = null;
      clearPollingTimer();
    };
  }, [orderId]);

  if (loading) {
    return (
      <PageShell title="Chi tiết đơn hàng" maxWidth="4xl">
        <StatePanel state="loading" title="Đang tải chi tiết đơn hàng" description="Vui lòng chờ trong giây lát." />
      </PageShell>
    );
  }

  return (
    <PageShell title="Chi tiết đơn hàng" maxWidth="4xl">
      <Link href="/orders" className="w-fit text-sm font-medium text-[#ee4d2d] hover:underline">
        ← Quay lại danh sách đơn
      </Link>

      {error ? <FeedbackMessage tone="error" message={error} /> : null}

      {!error && !order ? (
        <StatePanel state="empty" title="Không tìm thấy đơn hàng" description="Vui lòng quay lại danh sách đơn và thử lại." />
      ) : null}

      {!error && order ? (
        <>
          <section className="space-y-1 rounded-sm border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
            <p>Mã đơn: {order.id}</p>
            <p>Ngày tạo: {formatDate(order.createdAt)}</p>
            <p>Trạng thái đơn: {order.status}</p>
            <p>Trạng thái thanh toán: {order.payment?.stateLabel ?? "Chưa có thông tin"}</p>
            <p>Địa chỉ nhận hàng: {order.checkout.selectedAddress}</p>
            <p>Phương thức giao: {order.checkout.selectedShippingMethod}</p>
          </section>

          <section className="space-y-3 rounded-sm border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Theo dõi đơn hàng</h2>
            <p>
              Mã tracking: <span className="font-medium">{order.tracking.trackingNumber ?? "Chưa có mã tracking"}</span>
            </p>

            {order.tracking.isDegraded ? (
              <FeedbackMessage
                tone="warning"
                title="Đồng bộ vận chuyển đang ở chế độ dự phòng"
                message={resolveDegradedReasonText(order.tracking.degradedReason)}
              >
                <p className="mt-1">Thời điểm đồng bộ gần nhất: {formatDate(order.tracking.lastSyncedAt ?? null)}</p>
                <p>Gợi ý xử lý: {order.tracking.retryable ? "Làm mới lại sau ít phút." : "Liên hệ hỗ trợ để kiểm tra thủ công."}</p>
                <div className="mt-3 flex gap-2">
                  {(() => {
                    const action = resolveRecoveryPrimaryAction(order.tracking.nextAction, order.tracking.retryable);
                    if (action.kind === "link") {
                      return (
                        <Link href={action.href}>
                          <ActionButton size="sm">{action.label}</ActionButton>
                        </Link>
                      );
                    }

                    return (
                      <ActionButton size="sm" onClick={() => window.location.reload()}>
                        {action.label}
                      </ActionButton>
                    );
                  })()}
                </div>
              </FeedbackMessage>
            ) : null}

            <ul className="space-y-3" aria-label="Timeline trạng thái đơn hàng">
              {order.tracking.timeline.map((entry, index) => (
                <li key={`${entry.status}-${entry.timestamp ?? index}`} className="rounded-sm border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-medium text-zinc-900">{entry.statusLabel}</p>
                  <p>
                    Dấu hiệu trạng thái: <span className="font-medium">{resolveStatusCue(entry.status)}</span>
                  </p>
                  <p>Thời gian: {formatDate(entry.timestamp)}</p>
                  <p>Hành động tiếp theo: {resolveNextActionText(entry.nextAction)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900">Sản phẩm</h2>
            <ul className="space-y-3" aria-label="Danh sách sản phẩm trong đơn">
              {order.items.map((item) => (
                <li key={`${item.productSlug}-${item.variantId}`} className="rounded-sm border border-zinc-200 bg-white p-4 shadow-sm">
                  <p className="font-medium text-zinc-900">{item.title}</p>
                  <p className="text-sm text-zinc-600">Biến thể: {item.variantId}</p>
                  <p className="text-sm text-zinc-600">Số lượng: {item.quantity}</p>
                  <p className="text-sm text-zinc-700">Đơn giá: {formatCurrency(item.price)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-1 rounded-sm border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            <p>Tạm tính: {formatCurrency(order.pricing.subtotal)}</p>
            <p>Phí vận chuyển: {formatCurrency(order.pricing.shippingFee)}</p>
            <p>Giảm giá: {formatCurrency(order.pricing.discount)}</p>
            <p className="font-semibold text-zinc-900">Tổng cộng: {formatCurrency(order.pricing.total)}</p>
          </section>
        </>
      ) : null}
    </PageShell>
  );
}
