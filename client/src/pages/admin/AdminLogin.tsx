import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound } from 'lucide-react';
import { getAdminKey, setAdminKey } from '../../lib/adminAuth';
import { adminCheck } from '../../lib/adminClient';

export default function AdminLogin() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Already logged in?
  const existingKey = getAdminKey();
  if (existingKey) {
    adminCheck().then(ok => { if (ok) navigate('/admin/dashboard', { replace: true }); });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    setAdminKey(key);
    const ok = await adminCheck();
    if (ok) {
      navigate('/admin/dashboard');
    } else {
      localStorage.removeItem('drophunter_admin_key');
      setError('密鑰錯誤');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold/10 mb-4">
            <Shield className="w-7 h-7 text-gold" />
          </div>
          <h2 className="text-xl font-black text-white">後台管理</h2>
          <p className="text-sm text-gray-400 mt-1">DropHunter Admin</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">管理密鑰</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="password" value={key} onChange={e => setKey(e.target.value)}
                placeholder="輸入 Admin Key" autoFocus
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gold outline-none" />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
          <button type="submit" className="w-full bg-gold text-black font-black py-2.5 rounded-lg hover:bg-gold/80 transition-colors">
            進入後台
          </button>
        </form>
      </div>
    </div>
  );
}
