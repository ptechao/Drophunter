import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Menu, Globe, Wallet, User, Crown } from 'lucide-react';
import { useLanguageContext, Language } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import WalletConnectModal from './WalletConnectModal';

const LANG_LABELS: Record<Language, string> = {
  'zh-TW': '繁',
  'zh-CN': '简',
  'en': 'EN',
};
const LANG_ORDER: Language[] = ['zh-TW', 'zh-CN', 'en'];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [wcModalOpen, setWcModalOpen] = useState(false);
  const { language, setLanguage } = useLanguageContext();
  const { t } = useTranslation();
  const { address, user, isConnecting, hasProvider, isMobile, connect, openMetaMaskApp, disconnect, refreshUser } = useAuth();

  const cycleLang = () => {
    const idx = LANG_ORDER.indexOf(language);
    setLanguage(LANG_ORDER[(idx + 1) % LANG_ORDER.length]);
  };

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  const handleConnect = () => {
    // Desktop + has provider → direct connect
    if (!isMobile && hasProvider) { connect(); return; }
    // Mobile + no provider → MetaMask deep link (primary for MetaMask users)
    if (isMobile && !hasProvider) { openMetaMaskApp(); return; }
    // Mobile + has provider (in MetaMask browser) → direct connect
    if (isMobile && hasProvider) { connect(); return; }
    // Desktop + no provider → WalletConnect modal
    setWcModalOpen(true);
  };
  const connectLabel = isMobile && !hasProvider ? '用 MetaMask App 登入' : '連接錢包';

  const handleWcConnect = async (addr: string) => {
    localStorage.setItem('dh_address', addr);
    try {
      const ref = new URLSearchParams(window.location.search).get('ref');
      const res = await fetch('/api/trpc/users.register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address: addr, referralCode: ref || undefined }),
      });
      const json = await res.json();
      if (json?.result?.data) {
        await refreshUser();
        window.location.reload();
      }
    } catch (e) {
      console.error('WC register failed:', e);
    }
  };

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-50">
      <WalletConnectModal isOpen={wcModalOpen} onClose={() => setWcModalOpen(false)} onConnect={handleWcConnect} />

      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-black text-lg text-gold">
          <Target className="w-6 h-6" />
          DropHunter
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          <Link to="/airdrops" className="text-sm font-bold text-foreground/70 hover:text-gold transition-colors">
            {t('nav.airdrops')}
          </Link>
          <button
            onClick={cycleLang}
            className="flex items-center gap-1 text-sm font-black text-foreground/50 hover:text-gold transition-colors px-2 py-1 rounded"
            title="Switch language"
          >
            <Globe className="w-4 h-4" />
            {LANG_LABELS[language]}
          </button>
          {address ? (
            <div className="flex items-center gap-2">
              {user?.tier === 'vip' && (
                <span className="flex items-center gap-1 text-[10px] font-black bg-gold/15 text-gold px-2 py-0.5 rounded-full">
                  <Crown className="w-3 h-3" /> VIP
                </span>
              )}
              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-sm font-bold text-foreground/70 hover:text-gold transition-colors px-2 py-1 rounded"
              >
                <User className="w-4 h-4" />
                {shortAddr}
              </Link>
              <button
                onClick={disconnect}
                className="text-xs font-bold text-foreground/40 hover:text-red-400 transition-colors"
              >
                {t('nav.disconnect')}
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-gold text-black px-4 py-1.5 rounded-lg text-sm font-black hover:bg-gold/80 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? '...' : connectLabel}
            </button>
          )}
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 sm:hidden">
          <button onClick={cycleLang} className="p-1 text-foreground/50">
            <Globe className="w-4 h-4" />
          </button>
          <button className="p-2" onClick={() => setOpen(!open)}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="sm:hidden border-t border-border bg-card p-4 space-y-3">
          <Link to="/airdrops" className="block text-sm font-bold" onClick={() => setOpen(false)}>
            {t('nav.airdrops')}
          </Link>
          {address ? (
            <>
              <Link to="/profile" className="block text-sm font-bold" onClick={() => setOpen(false)}>
                {shortAddr} {user?.tier === 'vip' ? '👑' : ''}
              </Link>
              <button onClick={() => { disconnect(); setOpen(false); }} className="text-sm font-bold text-red-400">
                {t('nav.disconnect')}
              </button>
            </>
          ) : (
            <button
              onClick={() => { handleConnect(); setOpen(false); }}
              disabled={isConnecting}
              className="w-full bg-gold text-black px-4 py-2 rounded-lg text-sm font-black flex items-center justify-center gap-1.5"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? '...' : connectLabel}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}