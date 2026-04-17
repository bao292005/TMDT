"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ActionButton } from "@/components/ui/action-button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { StatePanel } from "@/components/ui/state-panel";
import { resolveAuthRedirectPath } from "@/shared/utils/auth-redirect";

import {
  buildWarehouseActionSuccessMessage,
  resolveWarehouseActionLabel,
  resolveWarehouseErrorMessage,
} from "./operator-queue-board-logic.js";

type WarehouseQueueItem = {
  orderId: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  nextAction: "pick" | "pack" | "create_shipment";
  priority: number;
  trackingNumber: string | null;
  itemCount: number;
};

type ApiPayload = {
  success: boolean;
  state?: string;
  error?: string;
  message?: string;
  data?: {
    queue?: WarehouseQueueItem[];
    order?: {
      id: string;
      status: string;
      trackingNumber?: string | null;
    };
  };
};

function formatDate(value: string | null) {
  if (!value) return "Không rõ";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Không rõ";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(parsed);
}

export function OperatorQueueBoard() {
  const [queue, setQueue] = useState<WarehouseQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/warehouse/queue", { cache: "no-store" });
      const payload: ApiPayload = await response.json();

      const authRedirectPath = resolveAuthRedirectPath(response.status, payload.error);
      if (authRedirectPath) {
        window.location.assign(authRedirectPath);
        return;
      }

      if (!response.ok || !payload.success || !Array.isArray(payload.data?.queue)) {
        setQueue([]);
        setError(resolveWarehouseErrorMessage(payload, "Không thể tải hàng đợi kho."));
        return;
      }

      setQueue(payload.data.queue);
    } catch {
      setQueue([]);
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const handleAction = useCallback(async (orderId: string, action: WarehouseQueueItem["nextAction"]) => {
    setBusyOrderId(orderId);
    setError("");
    setFeedback("");

    try {
      const response = await fetch("/api/warehouse/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action }),
      });
      const payload: ApiPayload = await response.json();

      const authRedirectPath = resolveAuthRedirectPath(response.status, payload.error);
      if (authRedirectPath) {
        window.location.assign(authRedirectPath);
        return;
      }

      if (!response.ok || !payload.success || !payload.data?.order) {
        setError(resolveWarehouseErrorMessage(payload, "Không thể xử lý thao tác kho."));
        return;
      }

      setFeedback(buildWarehouseActionSuccessMessage(action, payload.data.order));
      await loadQueue();
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setBusyOrderId("");
    }
  }, [loadQueue]);

  const headline = useMemo(() => {
    if (queue.length === 0) {
      return "Không có đơn cần xử lý.";
    }

    return `Có ${queue.length} đơn trong hàng đợi task-first.`;
  }, [queue.length]);

  if (loading) {
    return <StatePanel state="loading" title="Đang tải hàng đợi kho" description="Vui lòng chờ trong giây lát." />;
  }

  return (
    <section className="space-y-4" aria-label="OperatorQueueBoard">
      <p className="text-sm text-zinc-600">{headline}</p>
      {error ? <FeedbackMessage tone="error" message={error} /> : null}
      {feedback ? <FeedbackMessage tone="success" message={feedback} /> : null}

      {queue.length === 0 ? (
        <StatePanel state="empty" title="Không còn tác vụ" description="Không còn tác vụ kho nào." />
      ) : (
        <ul className="space-y-3" aria-label="Danh sách queue kho">
          {queue.map((item) => {
            const actionLabel = resolveWarehouseActionLabel(item.nextAction);
            const busy = busyOrderId === item.orderId;

            return (
              <li key={item.orderId} className="rounded border border-zinc-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 text-sm text-zinc-700">
                    <p className="font-medium text-zinc-900">Đơn: {item.orderId}</p>
                    <p>Trạng thái: {item.status}</p>
                    <p>Số sản phẩm: {item.itemCount}</p>
                    <p>Ưu tiên thao tác: {item.priority}</p>
                    <p>Tạo lúc: {formatDate(item.createdAt)}</p>
                    <p>Cập nhật: {formatDate(item.updatedAt)}</p>
                    <p>Tracking: {item.trackingNumber ?? "Chưa có mã tracking"}</p>
                  </div>

                  <ActionButton
                    onClick={() => void handleAction(item.orderId, item.nextAction)}
                    disabled={Boolean(busyOrderId) || busy}
                  >
                    {busy ? "Đang xử lý..." : actionLabel}
                  </ActionButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
