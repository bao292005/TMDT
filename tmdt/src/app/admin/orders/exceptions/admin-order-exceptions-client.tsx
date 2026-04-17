"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ActionButton } from "@/components/ui/action-button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PageShell } from "@/components/ui/page-shell";
import { StatePanel } from "@/components/ui/state-panel";

type ExceptionOrder = {
  id: string;
  status: string;
  createdAt: string;
  pricing?: {
    total: number;
  };
  priority: string;
};

export default function AdminOrderExceptionsClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<ExceptionOrder[]>([]);

  const fetchExceptions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders/exceptions");
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || "Không thể tải danh sách đơn ngoại lệ");
      }
      setOrders(payload.data.orders || []);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  if (loading) {
    return (
      <PageShell title="Đơn Hàng Bất Thường">
        <StatePanel state="loading" title="Đang tải đơn ngoại lệ" description="Vui lòng chờ trong giây lát." />
      </PageShell>
    );
  }

  return (
    <PageShell title="Đơn Hàng Bất Thường">
      <div className="flex items-center justify-end">
        <ActionButton onClick={fetchExceptions} variant="secondary" size="sm">
          Làm mới
        </ActionButton>
      </div>

      {error ? <FeedbackMessage tone="error" message={error} /> : null}

      {orders.length === 0 ? (
        <StatePanel state="empty" title="Không có đơn bất thường" description="Không có đơn hàng bất thường nào." />
      ) : (
        <div className="overflow-x-auto rounded border bg-white shadow">
          <table className="w-full text-left" aria-label="Danh sách đơn hàng bất thường">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-4 font-medium text-gray-600">Mã đơn</th>
                <th className="p-4 font-medium text-gray-600">Ngày tạo</th>
                <th className="p-4 font-medium text-gray-600">Tổng tiền</th>
                <th className="p-4 font-medium text-gray-600">Mức độ</th>
                <th className="p-4 font-medium text-gray-600">Lỗi/Trạng thái</th>
                <th className="p-4 font-medium text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-mono text-sm">{order.id.slice(0, 8)}...</td>
                  <td className="p-4">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="p-4">{order.pricing?.total ? `${order.pricing.total.toLocaleString("vi-VN")} đ` : "-"}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${order.priority === "High" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                    >
                      {order.priority === "High" ? "Cao" : "Trung bình"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-red-600">{order.status}</span>
                  </td>
                  <td className="p-4">
                    <Link href={`/admin/orders/${order.id}`} className="mr-4 inline-block text-blue-600 hover:underline">
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
