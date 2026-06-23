import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, CheckCircle, XCircle, Clock, Save, X } from 'lucide-react';
import { adminQuery, adminMutate } from '../../lib/adminClient';

const statusIcons: Record<string, any> = { confirmed: CheckCircle, pending: Clock, failed: XCircle };
const statusColors: Record<string, string> = { confirmed: 'text-green-400', pending: 'text-amber-400', failed: 'text-red-400' };

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = () => {
    setLoading(true);
    adminQuery('admin.payments.list').then(d => { setPayments(d || []); setLoading(false); });
  };
  useEffect(load, []);

  const deletePayment = (id: number) => {
    if (!confirm('確定刪除此付款記錄？')) return;
    adminMutate('admin.payments.delete', { id }).then(load);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-black">💰 金流管理</h2><p className="text-sm text-gray-500 mt-1">管理付款記錄、手動充值</p></div>
        <button onClick={() => setShowAdd(true)} className="bg-gold text-black px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 hover:bg-gold/80">
          <Plus className="w-4 h-4" /> 手動充值
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold"/></div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50 text-left text-xs font-bold text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-3">ID</th><th className="px-4 py-3">用戶ID</th><th className="px-4 py-3">金額</th>
                <th className="px-4 py-3">貨幣</th><th className="px-4 py-3">TX Hash</th>
                <th className="px-4 py-3">狀態</th><th className="px-4 py-3">時間</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {payments.map(p => {
                const SIcon = statusIcons[p.status] || Clock;
                return (
                  <tr key={p.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-gray-500">{p.id}</td>
                    <td className="px-4 py-3 font-mono text-xs">#{p.userId}</td>
                    <td className="px-4 py-3 font-bold">{p.amount}</td>
                    <td className="px-4 py-3 text-gray-400">{p.currency}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.txHash ? `${p.txHash.slice(0, 8)}...` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${statusColors[p.status]}`}><SIcon className="w-3.5 h-3.5" />{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.createdAt?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deletePayment(p.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">無付款記錄</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {showAdd && <AddPaymentModal onClose={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function AddPaymentModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ userId: '', amount: '', currency: 'USDC', status: 'confirmed', txHash: '', tierStart: '', tierEnd: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await adminMutate('admin.payments.create', {
      userId: Number(form.userId), amount: parseFloat(form.amount), currency: form.currency,
      status: form.status, txHash: form.txHash || undefined,
      tierStart: form.tierStart || undefined, tierEnd: form.tierEnd || undefined,
    });
    setSaving(false); onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-black">手動充值</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">用戶 ID</label>
            <input type="number" value={form.userId} onChange={e => setForm({...form, userId: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">金額</label>
            <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">貨幣</label>
            <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option>USDC</option><option>USDT</option><option>ETH</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">狀態</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="confirmed">confirmed (自動升級VIP)</option>
              <option value="pending">pending</option>
              <option value="failed">failed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">TX Hash (可選)</label>
            <input value={form.txHash} onChange={e => setForm({...form, txHash: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono text-xs" />
          </div>
          <button onClick={save} disabled={saving || !form.userId || !form.amount}
            className="w-full bg-gold text-black font-black py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-gold/80 disabled:opacity-40">
            <Save className="w-4 h-4" /> {saving ? '處理中...' : '確認充值'}
          </button>
        </div>
      </div>
    </div>
  );
}
