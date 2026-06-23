import { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, EyeOff, Eye, Loader2, Save, X } from 'lucide-react';
import { adminQuery, adminMutate } from '../../lib/adminClient';

export default function AdminAirdrops() {
  const [airdrops, setAirdrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDisabled, setFilterDisabled] = useState<number | undefined>();
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const load = () => {
    setLoading(true);
    adminQuery('admin.airdrops.list', { search: search || undefined, disabled: filterDisabled })
      .then(d => { setAirdrops(d || []); setLoading(false); });
  };
  useEffect(load, [search, filterDisabled]);

  const toggleDisabled = (a: any) => {
    adminMutate('admin.airdrops.update', { id: a.id, disabled: a.disabled ? 0 : 1 }).then(load);
  };
  const deleteAirdrop = (id: number) => {
    if (!confirm('確定要刪除此空投？（含所有任務）')) return;
    adminMutate('admin.airdrops.delete', { id }).then(load);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-black">🪂 空投管理</h2><p className="text-sm text-gray-500 mt-1">新增、編輯、停用/啟用空投</p></div>
        <button onClick={() => setEditTarget({})} className="bg-gold text-black px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 hover:bg-gold/80">
          <Plus className="w-4 h-4" /> 新增空投
        </button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input placeholder="搜尋空投..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-gold outline-none" />
        </div>
        <select value={filterDisabled ?? ''} onChange={e => setFilterDisabled(e.target.value === '' ? undefined : Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
          <option value="">全部狀態</option><option value="0">啟用中</option><option value="1">已停用</option>
        </select>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold"/></div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50 text-left text-xs font-bold text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-3">ID</th><th className="px-4 py-3">名稱</th><th className="px-4 py-3">協議</th>
                <th className="px-4 py-3">鏈</th><th className="px-4 py-3">狀態</th><th className="px-4 py-3">難度</th>
                <th className="px-4 py-3">停用</th><th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {airdrops.map(a => (
                <tr key={a.id} className={`hover:bg-gray-800/30 ${a.disabled ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-3 text-gray-500">{a.id}</td>
                  <td className="px-4 py-3 font-bold">{a.name}</td>
                  <td className="px-4 py-3 text-gray-400">{a.protocol}</td>
                  <td className="px-4 py-3"><span className="bg-gray-800 px-2 py-0.5 rounded text-xs">{a.chain}</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      a.status === 'active' ? 'bg-green-500/10 text-green-400' : a.status === 'ended' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{a.difficulty}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleDisabled(a)} className={`p-1.5 rounded ${a.disabled ? 'text-gray-500 hover:text-white' : 'text-green-400 hover:text-green-300'}`}>
                      {a.disabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditTarget(a)} className="p-1.5 text-gray-400 hover:text-gold rounded"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => deleteAirdrop(a.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {airdrops.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">無空投資料</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {editTarget !== null && <AirdropEditor airdrop={editTarget} onClose={() => { setEditTarget(null); load(); }} />}
    </div>
  );
}

function AirdropEditor({ airdrop, onClose }: { airdrop: any; onClose: () => void }) {
  const [form, setForm] = useState({
    name: airdrop.name || '', protocol: airdrop.protocol || '', chain: airdrop.chain || '',
    status: airdrop.status || 'upcoming', description: airdrop.description || '',
    difficulty: airdrop.difficulty || '中等', rewardEstimate: airdrop.rewardEstimate || '',
    source: airdrop.source || '', sourceUrl: airdrop.sourceUrl || '', imageUrl: airdrop.imageUrl || '',
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const isNew = !airdrop.id;
    await adminMutate(`admin.airdrops.${isNew ? 'create' : 'update'}`, isNew ? form : { id: airdrop.id, ...form });
    setSaving(false); onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-black">{airdrop.id ? `編輯 #${airdrop.id}` : '新增空投'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="名稱" value={form.name} onChange={v => setForm({...form, name: v})} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="協議" value={form.protocol} onChange={v => setForm({...form, protocol: v})} />
            <Field label="鏈" value={form.chain} onChange={v => setForm({...form, chain: v})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="upcoming">即將開始</option><option value="active">進行中</option><option value="ended">已結束</option>
            </select>
            <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="簡單">簡單</option><option value="中等">中等</option><option value="困難">困難</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">描述</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="預估收益" value={form.rewardEstimate} onChange={v => setForm({...form, rewardEstimate: v})} />
            <Field label="來源" value={form.source} onChange={v => setForm({...form, source: v})} />
          </div>
          <Field label="來源URL" value={form.sourceUrl} onChange={v => setForm({...form, sourceUrl: v})} />
          <Field label="圖片URL" value={form.imageUrl} onChange={v => setForm({...form, imageUrl: v})} />
          <button onClick={save} disabled={saving || !form.name || !form.protocol || !form.chain}
            className="w-full bg-gold text-black font-black py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-gold/80 disabled:opacity-40">
            <Save className="w-4 h-4" /> {saving ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  );
}
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-400 mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-gold outline-none" />
    </div>
  );
}
