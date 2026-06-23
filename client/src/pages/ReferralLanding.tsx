import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

export default function ReferralLanding() {
  const { t } = useTranslation();
  const { address, connect, isConnecting } = useAuth();
  const navigate = useNavigate();

  // Extract ref code from URL
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');

  // If already connected → go to airdrops
  useEffect(() => {
    if (address) navigate('/airdrops', { replace: true });
  }, [address]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-2">
          <Target className="w-8 h-8 text-gold" />
        </div>
        <h1 className="text-2xl font-black">{t('ref.title')}</h1>
        <p className="text-foreground/60">{t('ref.desc')}</p>
        {refCode && (
          <div className="bg-card border border-border rounded-lg px-4 py-2 inline-block">
            <span className="text-xs text-foreground/50">推薦碼: </span>
            <code className="text-gold font-black">{refCode}</code>
          </div>
        )}
        <div>
          <button
            onClick={connect}
            disabled={isConnecting}
            className="bg-gold text-black px-8 py-3 rounded-xl font-black text-lg hover:bg-gold/80 transition-all inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isConnecting ? '...' : t('ref.connect')}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-foreground/40">
          需要 MetaMask 錢包 · 免費註冊
        </p>
      </div>
    </div>
  );
}
