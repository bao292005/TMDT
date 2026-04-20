'use client';

import Link from 'next/link';
import { User, ClipboardList, Wallet, TrendingUp, TrendingDown, ShoppingBag, CheckCircle, XCircle, Clock, BarChart2 } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/format';

// ─── Mock data: thay bằng API call thực tế khi có backend ───────────────────
const mockFinanceData = {
  totalSpent: 4_820_500,
  totalOrders: 34,
  completedOrders: 28,
  cancelledOrders: 3,
  pendingOrders: 3,
  avgOrderValue: 172_160,
  savedAmount: 890_000, // tiết kiệm qua giảm giá
  monthlyData: [
    { month: 'T11/2025', spent: 320_000, orders: 3 },
    { month: 'T12/2025', spent: 750_000, orders: 6 },
    { month: 'T1/2026',  spent: 210_000, orders: 2 },
    { month: 'T2/2026',  spent: 980_000, orders: 8 },
    { month: 'T3/2026',  spent: 1_340_500, orders: 9 },
    { month: 'T4/2026',  spent: 1_220_000, orders: 6 },
  ],
  recentOrders: [
    { id: 'ORD-001', date: '14/04/2026', shop: 'Cửa hàng Thời Trang ABC', items: 2, amount: 238_000, status: 'COMPLETED' },
    { id: 'ORD-002', date: '10/04/2026', shop: 'Shop Phụ Kiện XYZ', items: 1, amount: 89_000, status: 'SHIPPING' },
    { id: 'ORD-003', date: '05/04/2026', shop: 'Cửa Hàng Hạt Giống Uy Tín', items: 3, amount: 420_000, status: 'COMPLETED' },
    { id: 'ORD-004', date: '28/03/2026', shop: 'Shop Thời Trang Nữ', items: 2, amount: 315_000, status: 'CANCELLED' },
    { id: 'ORD-005', date: '20/03/2026', shop: 'Nhà Sách Online', items: 4, amount: 188_500, status: 'COMPLETED' },
  ],
  categoryBreakdown: [
    { name: 'Thời trang', percent: 45, amount: 2_169_225, color: '#ee4d2d' },
    { name: 'Phụ kiện', percent: 22, amount: 1_060_510, color: '#f5a623' },
    { name: 'Thực phẩm', percent: 18, amount: 867_690, color: '#4caf50' },
    { name: 'Sách & VPP', percent: 10, amount: 482_050, color: '#2196f3' },
    { name: 'Khác', percent: 5,  amount: 241_025, color: '#9e9e9e' },
  ],
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  COMPLETED: { label: 'Hoàn thành', color: 'text-green-600', icon: <CheckCircle size={14} /> },
  SHIPPING:  { label: 'Đang giao',  color: 'text-blue-500',  icon: <Clock size={14} /> },
  CANCELLED: { label: 'Đã hủy',    color: 'text-gray-400',  icon: <XCircle size={14} /> },
  PENDING:   { label: 'Chờ xử lý', color: 'text-orange-500',icon: <Clock size={14} /> },
};

const maxSpent = Math.max(...mockFinanceData.monthlyData.map(m => m.spent));

export default function FinancePage() {
  const { totalSpent, totalOrders, completedOrders, cancelledOrders, pendingOrders, avgOrderValue, savedAmount, monthlyData, recentOrders, categoryBreakdown } = mockFinanceData;

  return (
    <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">

      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 space-y-4 flex-shrink-0">
        <div className="flex items-center gap-3 p-4 bg-white rounded-sm shadow-sm">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl text-white font-bold">K</div>
          <div>
            <div className="font-bold">khachhang_52</div>
            <Link href="/profile" className="text-xs text-gray-500 hover:text-[#ee4d2d]">✎ Sửa Hồ Sơ</Link>
          </div>
        </div>

        <nav className="bg-white rounded-sm shadow-sm py-2">
          <Link href="/profile"  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-600 text-sm"><User size={18} className="text-blue-500"/> Tài Khoản</Link>
          <Link href="/orders"   className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-600 text-sm"><ClipboardList size={18} className="text-blue-500"/> Đơn Mua</Link>
          <Link href="/finance"  className="flex items-center gap-3 px-4 py-3 bg-orange-50 text-[#ee4d2d] font-medium text-sm"><Wallet size={18}/> Tài Chính</Link>
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 space-y-4 min-w-0">

        {/* Header */}
        <div className="bg-white rounded-sm shadow-sm p-5 border-b">
          <h1 className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <Wallet size={20} className="text-[#ee4d2d]"/> Tài Chính Của Tôi
          </h1>
          <p className="text-sm text-gray-500 mt-1">Thống kê tổng chi tiêu và lịch sử mua hàng</p>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={<Wallet size={22} className="text-[#ee4d2d]"/>}
            label="Tổng chi tiêu"
            value={formatCurrency(totalSpent)}
            bg="bg-orange-50"
          />
          <StatCard
            icon={<ShoppingBag size={22} className="text-blue-500"/>}
            label="Tổng đơn hàng"
            value={`${totalOrders} đơn`}
            sub={`${completedOrders} hoàn thành · ${cancelledOrders} hủy`}
            bg="bg-blue-50"
          />
          <StatCard
            icon={<TrendingUp size={22} className="text-green-500"/>}
            label="TB mỗi đơn"
            value={formatCurrency(avgOrderValue)}
            bg="bg-green-50"
          />
          <StatCard
            icon={<TrendingDown size={22} className="text-purple-500"/>}
            label="Đã tiết kiệm"
            value={formatCurrency(savedAmount)}
            sub="Qua các đợt giảm giá"
            bg="bg-purple-50"
          />
        </div>

        {/* ── Monthly Chart + Category ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-sm shadow-sm p-5">
            <h2 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
              <BarChart2 size={18} className="text-[#ee4d2d]"/> Chi tiêu theo tháng
            </h2>
            <div className="flex items-end gap-3 h-40">
              {monthlyData.map((m) => {
                const heightPct = Math.round((m.spent / maxSpent) * 100);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400 font-medium">{formatCurrencyShort(m.spent)}</span>
                    <div
                      className="w-full rounded-t-sm bg-[#ee4d2d] opacity-80 hover:opacity-100 transition-all cursor-default"
                      style={{ height: `${Math.max(heightPct, 6)}%` }}
                      title={`${m.month}: ${formatCurrency(m.spent)}`}
                    />
                    <span className="text-[10px] text-gray-500 text-center leading-tight">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-sm shadow-sm p-5">
            <h2 className="font-medium text-gray-700 mb-4">Danh mục chi tiêu</h2>
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: cat.color }}/>
                      {cat.name}
                    </span>
                    <span className="font-medium">{cat.percent}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${cat.percent}%`, background: cat.color }}/>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5 text-right">{formatCurrency(cat.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Order Status Summary ── */}
        <div className="bg-white rounded-sm shadow-sm p-5">
          <h2 className="font-medium text-gray-700 mb-4">Tình trạng đơn hàng</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-sm">
              <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                <CheckCircle size={12} className="text-green-500"/> Hoàn thành
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-sm">
              <div className="text-2xl font-bold text-blue-500">{pendingOrders}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Clock size={12} className="text-blue-400"/> Đang xử lý
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-sm">
              <div className="text-2xl font-bold text-gray-400">{cancelledOrders}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                <XCircle size={12} className="text-gray-400"/> Đã hủy
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Orders ── */}
        <div className="bg-white rounded-sm shadow-sm">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-medium text-gray-700">Đơn hàng gần đây</h2>
            <Link href="/orders" className="text-xs text-[#ee4d2d] hover:underline">Xem tất cả →</Link>
          </div>
          <div className="divide-y">
            {recentOrders.map((order) => {
              const st = STATUS_MAP[order.status];
              return (
                <div key={order.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition text-sm">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800 truncate">{order.shop}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{order.id} · {order.date} · {order.items} sản phẩm</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="font-semibold text-[#ee4d2d]">{formatCurrency(order.amount)}</div>
                    <div className={`text-xs mt-0.5 flex items-center justify-end gap-1 ${st.color}`}>
                      {st.icon} {st.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}

/* ── Helper Components ── */
function StatCard({ icon, label, value, sub, bg }: { icon: React.ReactNode; label: string; value: string; sub?: string; bg?: string }) {
  return (
    <div className={`bg-white rounded-sm shadow-sm p-4 flex items-start gap-3 border-l-4 border-[#ee4d2d]`}>
      <div className={`p-2 rounded-full ${bg ?? 'bg-gray-100'}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="font-bold text-gray-800 truncate">{value}</div>
        {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return `${amount}`;
}
