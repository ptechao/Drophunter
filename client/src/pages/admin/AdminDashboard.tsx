import { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Users2, Gift, TrendingUp, Loader2 } from 'lucide-react';
import { adminQuery } from '../../lib/adminClient';

interface DashboardData {
  counts: {
    totalAirdrops: number; activeAirdrops: number; disabledAirdrops: number;
    totalUsers: number; freeUsers: number; vipUsers: number;
    totalPayments: number; confirmedPayments: number;
    totalRevenue: number; pendingRevenue: number; totalReferrals: number;
  };
  revenueByMonth: { month: string; amount: number }[];
  usersByMonth: { month: string; count: number }[];
  chainsBreakdown: { chain: string; count: number }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminQuery('admin.dashboard').then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold"/></div>;
  if (!data) return <div className="text-red-400">載入失敗 — 請檢查 Admin Key</div>;

  const c = data.counts;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-black">📊 儀表板</h2><p className="text-sm text-gray-500 mt-1">DropHunter 數據總覽</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="總營收" value={`$${c.totalRevenue.toFixed(2)}`} sub={`待入帳 $${c.pendingRevenue.toFixed(2)}`} color="emerald" />
        <StatCard icon={Users2} label="總用戶" value={String(c.totalUsers)} sub={`VIP ${c.vipUsers} / Free ${c.freeUsers}`} color="blue" />
        <StatCard icon={Gift} label="空投數" value={String(c.totalAirdrops)} sub={`${c.activeAirdrops} 進行中 · ${c.disabledAirdrops} 停用`} color="gold" />
        <StatCard icon={TrendingUp} label="推廣數" value={String(c.totalReferrals)} sub={`${c.confirmedPayments} 筆已確認付款`} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard icon={BarChart3} title="月營收" color="emerald" items={data.revenueByMonth} valueKey="amount" prefix="$" />
        <ChartCard icon={Users2} title="月註冊用戶" color="blue" items={data.usersByMonth} valueKey="count" prefix="" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="font-black text-sm mb-4 flex items-center gap-2"><Gift className="w-4 h-4 text-gold"/> 鏈上分佈</h3>
        <div className="flex flex-wrap gap-2">
          {data.chainsBreakdown.map(c => (
            <span key={c.chain} className="bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300">
              {c.chain} <span className="text-gold ml-1">{c.count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) {
  const cm: Record<string, string> = { emerald: 'text-emerald-400 bg-emerald-400/10', blue: 'text-blue-400 bg-blue-400/10', gold: 'text-gold bg-gold/10', purple: 'text-purple-400 bg-purple-400/10' };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className={`inline-flex p-2 rounded-lg ${cm[color]} mb-3`}><Icon className="w-4 h-4" /></div>
      <p className="text-[10px] text-gray-500 font-bold uppercase">{label}</p>
      <p className="text-xl font-black mt-1">{value}</p>
      <p className="text-[10px] text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function ChartCard({ icon: Icon, title, color, items, valueKey, prefix }: { icon: any; title: string; color: string; items: any[]; valueKey: string; prefix: string }) {
  const maxVal = Math.max(...items.map(x => x[valueKey]), 1);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="font-black text-sm mb-4 flex items-center gap-2"><Icon className={`w-4 h-4 text-${color === 'emerald' ? 'emerald' : 'blue'}-400`}/>{title}</h3>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-xs text-gray-500">尚無數據</p>}
        {items.map(m => (
          <div key={m.month} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-16">{m.month}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-5 overflow-hidden">
              <div className={`h-full bg-${color === 'emerald' ? 'emerald' : 'blue'}-500 rounded-full flex items-center justify-end px-2 text-[10px] font-black text-white`}
                   style={{ width: `${Math.min(100, (m[valueKey] / maxVal) * 100)}%` }}>
                {prefix}{m[valueKey]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
