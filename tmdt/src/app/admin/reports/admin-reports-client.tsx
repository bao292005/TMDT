"use client";

import { useEffect, useState } from "react";

import { ActionButton } from "@/components/ui/action-button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { StatePanel } from "@/components/ui/state-panel";

type ExportJob = {
  id: string;
  type: string;
  format: string;
  startDate: string;
  endDate: string;
  status: string;
  downloadUrl: string | null;
  createdAt: string;
};

export default function AdminReportsClient() {
  const [loading, setLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [jobs, setJobs] = useState<ExportJob[]>([]);

  const [formData, setFormData] = useState({
    type: "Order",
    format: "CSV",
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await fetch("/api/admin/reports");
      const payload = await res.json();
      if (res.ok && payload.success) {
        setJobs(payload.data.jobs);
      }
    } catch {
      // no-op
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    void fetchJobs();
    const interval = setInterval(() => {
      void fetchJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.error?.message || "Lỗi khi tạo báo cáo");
      }

      setSuccessMsg("Đã đưa yêu cầu xuất báo cáo vào hàng đợi!");
      await fetchJobs();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Xuất Báo Cáo & Dữ Liệu"
      description="Yêu cầu xuất dữ liệu báo cáo dạng CSV hoặc PDF."
      maxWidth="6xl"
    >
      {error ? <FeedbackMessage tone="error" message={error} /> : null}
      {successMsg ? <FeedbackMessage tone="success" message={successMsg} /> : null}

      <div className="rounded-sm border border-zinc-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="report-type" className="text-sm font-medium text-zinc-700">
                Loại Báo Cáo
              </label>
              <select
                id="report-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-sm border border-zinc-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ee4d2d]"
                aria-label="Loại báo cáo"
              >
                <option value="Order">Đơn hàng</option>
                <option value="Transaction">Giao dịch thanh toán</option>
                <option value="Revenue">Doanh thu</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="report-format" className="text-sm font-medium text-zinc-700">
                Định dạng
              </label>
              <select
                id="report-format"
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full rounded-sm border border-zinc-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ee4d2d]"
                aria-label="Định dạng"
              >
                <option value="CSV">CSV</option>
                <option value="PDF">PDF</option>
              </select>
            </div>

            <Input
              id="start-date"
              type="date"
              label="Từ ngày"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              aria-label="Từ ngày"
              required
            />

            <Input
              id="end-date"
              type="date"
              label="Đến ngày"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              aria-label="Đến ngày"
              required
            />
          </div>

          <ActionButton type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "Xuất Báo Cáo"}
          </ActionButton>
        </form>
      </div>

      <div className="overflow-hidden rounded-sm border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-50 p-4">
          <h2 className="text-lg font-semibold text-zinc-900">Lịch Sử Xuất Dữ Liệu</h2>
        </div>

        {jobsLoading ? (
          <div className="p-4">
            <StatePanel state="loading" title="Đang tải lịch sử" description="Vui lòng chờ trong giây lát." />
          </div>
        ) : (
          <table className="w-full text-left" aria-label="Lịch sử xuất dữ liệu">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-sm text-zinc-600">
              <tr>
                <th className="p-4 font-medium">Mã yêu cầu</th>
                <th className="p-4 font-medium">Loại & Định dạng</th>
                <th className="p-4 font-medium">Thời gian data</th>
                <th className="p-4 font-medium">Ngày tạo</th>
                <th className="p-4 font-medium">Trạng thái</th>
                <th className="p-4 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4">
                    <StatePanel
                      state="empty"
                      title="Chưa có yêu cầu xuất báo cáo"
                      description="Hãy tạo yêu cầu đầu tiên để theo dõi lịch sử xuất dữ liệu."
                    />
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50">
                    <td className="p-4 font-mono text-sm text-zinc-500">{job.id.slice(0, 13)}...</td>
                    <td className="p-4">
                      <span className="font-medium text-zinc-800">{job.type}</span>
                      <span className="ml-2 rounded-sm bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{job.format}</span>
                    </td>
                    <td className="p-4 text-sm text-zinc-600">
                      {job.startDate} đến {job.endDate}
                    </td>
                    <td className="p-4 text-sm text-zinc-600">{new Date(job.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                          job.status === "Completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : job.status === "Failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-[#fff4f2] text-[#9a3412]"
                        }`}
                      >
                        {job.status === "Processing" ? <span className="h-2 w-2 animate-pulse rounded-full bg-[#ee4d2d]" /> : null}
                        {job.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {job.status === "Completed" && job.downloadUrl ? (
                        <a href={job.downloadUrl} className="text-sm font-medium text-[#ee4d2d] hover:underline" download>
                          Tải xuống
                        </a>
                      ) : (
                        <span className="text-sm text-zinc-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
