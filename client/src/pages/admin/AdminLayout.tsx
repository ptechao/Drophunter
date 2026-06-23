import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Gift, Users, CreditCard, LogOut, ArrowLeft } from 'lucide-react';
import { clearAdminKey } from '../../lib/adminAuth';

const links = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: '儀表板' },
  { to: '/admin/airdrops', icon: Gift, label: '空投管理' },
  { to: '/admin/users', icon: Users, label: '用戶管理' },
  { to: '/admin/payments', icon: CreditCard, label: '金流管理' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    clearAdminKey();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen flex bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-800">
          <h1 className="font-black text-gold text-lg flex items-center gap-2">
            <ShieldIcon />
            DropHunter
          </h1>
          <p className="text-[10px] text-gray-500 mt-0.5 font-bold">ADMIN PANEL</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map(l => {
            const active = location.pathname === l.to;
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  active ? 'bg-gold/15 text-gold' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-800 space-y-2">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-300 rounded-lg">
            <ArrowLeft className="w-3.5 h-3.5" />
            返回前台
          </Link>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-lg w-full text-left">
            <LogOut className="w-3.5 h-3.5" />
            登出
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.06 1.06 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    </svg>
  );
}
