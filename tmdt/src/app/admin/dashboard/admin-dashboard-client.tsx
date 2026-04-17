"use client";

import { useEffect, useState } from "react";

import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PageShell } from "@/components/ui/page-shell";
import { StatePanel } from "@/components/ui/state-panel";

type DashboardKpis = {
  totalOrders: number;
  totalRevenue: number;
  aov: number;
  returnRate: number;
  successfulPaymentRate: number;
};

export default function AdminDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kpiData, setKpiData] = useState<DashboardKpis | null>(null);
  const [timeRange, setTimeRange] = useState("all");

  const fetchKpis = async (range: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/dashboard?timeRange=${range}`);
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || "Không thể lấy dữ liệu thống kê");
      }
      setKpiData(payload.data);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis(timeRange);
  }, [timeRange]);

  return (
    <PageShell title="Thống Kê Vận Hành" maxWidth="6xl">
      <div className="flex items-center justify-end">
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="rounded border p-2">
          <option value="today">Hôm nay</option>
          <option value="7days">7 ngày qua</option>
          <option value="30days">30 ngày qua</option>
          <option value="all">Tất cả</option>
        </select>
      </div>

      {error ? <FeedbackMessage tone="error" message={error} /> : null}

      {loading ? (
        <StatePanel state="loading" title="Đang tải thống kê" description="Vui lòng chờ trong giây lát." />
      ) : kpiData ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="rounded border bg-white p-4 shadow">
            <div className="text-sm text-gray-500">Tổng Đơn</div>
            <div className="text-2xl font-bold">{kpiData.totalOrders}</div>
          </div>
          <div className="rounded border bg-white p-4 shadow">
            <div className="text-sm text-gray-500">Doanh Thu</div>
            <div className="text-2xl font-bold">{kpiData.totalRevenue.toLocaleString("vi-VN")} đ</div>
          </div>
          <div className="rounded border bg-white p-4 shadow">
            <div className="text-sm text-gray-500">AOV</div>
            <div className="text-2xl font-bold">{kpiData.aov.toLocaleString("vi-VN")} đ</div>
          </div>
          <div className="rounded border bg-white p-4 shadow">
            <div className="text-sm text-gray-500">Tỷ lệ hủy/hoàn</div>
            <div className="text-2xl font-bold">{(kpiData.returnRate * 100).toFixed(1)}%</div>
          </div>
          <div className="rounded border bg-white p-4 shadow">
            <div className="text-sm text-gray-500">Tỷ lệ T.Toán T.Công</div>
            <div className="text-2xl font-bold">{(kpiData.successfulPaymentRate * 100).toFixed(1)}%</div>
          </div>
        </div>
      ) : (
        <StatePanel state="empty" title="Chưa có dữ liệu" description="Không có dữ liệu KPI cho khoảng thời gian đã chọn." />
      )}
    </PageShell>
  );
}
