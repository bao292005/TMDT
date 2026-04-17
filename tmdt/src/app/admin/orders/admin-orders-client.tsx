"use client";

import { useCallback, useEffect, useState } from "react";

import { ActionButton } from "@/components/ui/action-button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PageShell } from "@/components/ui/page-shell";
import { StatePanel } from "@/components/ui/state-panel";

type Order = {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  itemCount: number;
  pricing?: {
    total?: number;
  };
  allowedTransitions?: string[];
};

type ApiPayload = {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    orders?: Order[];
    order?: Order;
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function translateStatus(status: string) {
  const map: Record<string, string> = {
    pending_payment: "Chờ thanh toán",
    pending_verification: "Chờ xác nhận thanh toán",
    payment_failed: "Thanh toán thất bại",
    confirmed_cod: "Xác nhận COD",
    paid: "Đã thanh toán",
    processing: "Đang xử lý",
    shipped: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
  };
  return map[status] || status;
}

const DESTRUCTIVE_STATUSES = new Set(["cancelled", "payment_failed"]);

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [editingOrderId, setEditingOrderId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const payload: ApiPayload = await response.json();

      if (!response.ok || !payload.success || !payload.data?.orders) {
        setError(payload.message ?? payload.error ?? "Không thể tải danh sách đơn hàng.");
        return;
      }

      setOrders(payload.data.orders);
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function handleUpdateStatus() {
    if (!editingOrderId || !selectedStatus) return;

    if (DESTRUCTIVE_STATUSES.has(selectedStatus) && !isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/orders/${editingOrderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus, reason: "Cập nhật từ Admin UI" }),
      });
      const payload: ApiPayload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload.message ?? payload.error ?? "Không thể cập nhật trạng thái đơn hàng.");
        return;
      }

      setEditingOrderId("");
      setSelectedStatus("");
      setIsConfirming(false);
      await loadOrders();
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setIsProcessing(false);
    }
  }

  function startEditing(order: Order) {
    setEditingOrderId(order.id);
    setSelectedStatus("");
    setIsConfirming(false);
  }

  function cancelEditing() {
    setEditingOrderId("");
    setSelectedStatus("");
    setIsConfirming(false);
  }

  if (loading) {
    return (
      <PageShell title="Quản lý Đơn hàng">
        <StatePanel state="loading" title="Đang tải dữ liệu" description="Vui lòng chờ trong giây lát." />
      </PageShell>
    );
  }

  return (
    <PageShell title="Quản lý Đơn hàng">
      {error ? <FeedbackMessage tone="error" message={error} /> : null}

      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Mã Đơn</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 font-medium">Tổng tiền</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {orders.map((order) => {
              const allowedTransitions = order.allowedTransitions ?? [];
              const isEditing = editingOrderId === order.id;
              const totalAmount =
                typeof order.pricing?.total === "number" && Number.isFinite(order.pricing.total)
                  ? order.pricing.total
                  : 0;

              return (
                <tr key={order.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                  <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3">{formatCurrency(totalAmount)}</td>
                  <td className="px-4 py-3 font-medium">
                    {translateStatus(order.status)}
                  </td>
                  <td className="px-4 py-3 min-w-[300px]">
                    {!isEditing && allowedTransitions.length > 0 && (
                      <ActionButton onClick={() => startEditing(order)} variant="ghost" size="sm">
                        Đổi trạng thái
                      </ActionButton>
                    )}

                    {isEditing && (
                      <div className="flex flex-col gap-2">
                        <select
                          title="Trạng thái đơn hàng"
                          value={selectedStatus}
                          onChange={(e) => {
                            setSelectedStatus(e.target.value);
                            setIsConfirming(false);
                          }}
                          disabled={isProcessing}
                          className="border rounded px-2 py-1 bg-white text-sm focus:ring-2 focus:ring-black max-w-xs focus:outline-none"
                        >
                          <option value="">-- Chọn trạng thái mới --</option>
                          {allowedTransitions.map((status) => (
                            <option key={status} value={status}>
                              {translateStatus(status)}
                            </option>
                          ))}
                        </select>

                        {selectedStatus && (
                          <div className="flex flex-col gap-2">
                            {isConfirming && DESTRUCTIVE_STATUSES.has(selectedStatus) && (
                              <div className="rounded bg-red-50 p-2 text-sm text-red-800 border border-red-200 mt-1" role="alert">
                                <strong>Cảnh báo:</strong> Đổi sang trạng thái <span className="font-bold">{translateStatus(selectedStatus)}</span> là tác vụ nhạy cảm/không hoàn tác. Bạn đã chắc chắn?
                              </div>
                            )}
                            
                            <div className="flex gap-2">
                              <ActionButton
                                onClick={handleUpdateStatus}
                                disabled={isProcessing}
                                variant={isConfirming ? "destructive" : "primary"}
                                size="sm"
                              >
                                {isProcessing ? "Đang lưu..." : isConfirming ? "Xác nhận cập nhật" : "Cập nhật"}
                              </ActionButton>
                              <ActionButton onClick={cancelEditing} disabled={isProcessing} variant="secondary" size="sm">
                                Hủy
                              </ActionButton>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4">
                  <StatePanel state="empty" title="Không có đơn hàng" description="Không có đơn hàng nào." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
