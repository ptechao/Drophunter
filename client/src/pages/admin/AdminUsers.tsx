import { useState, useEffect } from 'react';
import { Search, Edit3, Trash2, Loader2, Save, X, Crown, User } from 'lucide-react';
import { adminQuery, adminMutate } from '../../lib/adminClient';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const load = () => {
    setLoading(true);
    adminQuery('admin.users.list', { search: search || undefined })
      .then(d => { setUsers(d || []); setLoading(false); });
  };
  useEffect(load, [search]);

  const deleteUser = (id: number) => {
    if (!confirm(`確定刪除用戶 #${id}？`)) return;
    adminMutate('admin.users.delete', { id }).then(load);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-black">👥 用戶管理</h2><p className="text-sm text-gray-500 mt-1">管理用戶等級、檢視付款記錄</p></div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input placeholder="搜尋地址或 email..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-gold outline-none" />
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold"/></div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50 text-left text-xs font-bold text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-3">ID</th><th className="px-4 py-3">地址</th><th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">等級</th><th className="px-4 py-3">邀請碼</th>
                <th className="px-4 py-3">註冊時間</th><th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-500">{u.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{u.address ? `${u.address.slice(0,6)}...${u.address.slice(-4)}` : '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{u.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${u.tier === 'vip' ? 'bg-gold/10 text-gold' : 'bg-gray-700 text-gray-400'}`}>
                      {u.tier === 'vip' ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}{u.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.referralCode}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{u.createdAt?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditTarget(u)} className="p-1.5 text-gray-400 hover:text-gold rounded"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => deleteUser(u.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">無用戶資料</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {editTarget !== null && <UserEditor user={editTarget} onClose={() => { setEditTarget(null); load(); }} />}
    </div>
  );
}

function UserEditor({ user, onClose }: { user: any; onClose: () => void }) {
  const [tier, setTier] = useState(user.tier || 'free');
  const [saving, setSaving] = useState(false);
  const [userDetail, setUserDetail] = useState<any>(null);

  useEffect(() => { adminQuery('admin.users.get', { id: user.id }).then(d => setUserDetail(d)); }, [user.id]);

  const save = async () => {
    setSaving(true);
    await adminMutate('admin.users.update', { id: user.id, tier });
    setSaving(false); onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-black">用戶 #{user.id}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gray-800 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">地址</span><span className="font-mono text-xs">{user.address ? `${user.address.slice(0,8)}...${user.address.slice(-6)}` : '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Email</span><span>{user.email || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">邀請碼</span><span className="font-mono">{user.referralCode}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">推廣數</span><span>{userDetail?.referralCount ?? '-'}</span></div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">會員等級</label>
            <select value={tier} onChange={e => setTier(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="free">Free</option><option value="vip">VIP</option>
            </select>
          </div>
          {userDetail?.payments?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-2">付款記錄</h4>
              <div className="space-y-2">
                {userDetail.payments.map((p: any) => (
                  <div key={p.id} className="bg-gray-800 rounded-lg px-3 py-2 text-xs flex justify-between">
                    <span>{p.amount} {p.currency}</span>
                    <span className={`font-bold ${p.status === 'confirmed' ? 'text-green-400' : p.status === 'failed' ? 'text-red-400' : 'text-amber-400'}`}>{p.status}</span>
                    <span className="text-gray-500">{p.createdAt?.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={save} className="w-full bg-gold text-black font-black py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-gold/80">
            <Save className="w-4 h-4" /> {saving ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  );
}
