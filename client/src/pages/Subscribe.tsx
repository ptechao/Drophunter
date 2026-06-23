import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Copy, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

// Payment address (hardcoded for now — could be env-driven)
const PAYMENT_ADDRESS = '0xDropHunterVIPpaymentsUSDCerc20';

export default function Subscribe() {
  const { address, user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!address) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-foreground/60">請先連接錢包</p>
      </div>
    );
  }

  if (user?.tier === 'vip' || done) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
          <ShieldCheck className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-black">{t('subscribe.already')}</h1>
        <button onClick={() => navigate('/profile')} className="bg-gold text-black px-6 py-2.5 rounded-lg text-sm font-black">
          前往個人中心
        </button>
      </div>
    );
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(PAYMENT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!txHash.trim()) {
      setError('請輸入交易哈希');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/trpc/admin.payments.create', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-admin-key': localStorage.getItem('drophunter_admin_key') || '',
        },
        body: JSON.stringify({
          userId: user?.id,
          amount: 9.99,
          currency: 'USDC',
          txHash: txHash.trim(),
          status: 'pending',
        }),
      });
      const json = await res.json();
      if (json?.result?.data) {
        setDone(true);
        await refreshUser();
      } else {
        setError('提交失敗，請稍後再試');
      }
    } catch {
      setError('連線失敗');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 py-8">
      <div className="text-center space-y-2">
        <Crown className="w-10 h-10 text-gold mx-auto" />
        <h1 className="text-2xl font-black">{t('subscribe.title')}</h1>
        <p className="text-3xl font-black text-gold">{t('subscribe.price')}</p>
      </div>

      {/* Benefits */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h2 className="font-black text-sm">{t('subscribe.benefits')}</h2>
        <div className="space-y-2 text-sm text-foreground/70">
          <p>{t('subscribe.b1')}</p>
          <p>{t('subscribe.b2')}</p>
          <p>{t('subscribe.b3')}</p>
          <p>{t('subscribe.b4')}</p>
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <p className="text-sm text-foreground/60">{t('subscribe.payInfo')}</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-background rounded-lg px-3 py-2.5 text-xs font-mono truncate">
            {PAYMENT_ADDRESS}
          </code>
          <button
            onClick={copyAddress}
            className="flex items-center gap-1 bg-gold/10 text-gold px-3 py-2 rounded-lg text-xs font-black hover:bg-gold/20"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* TX Hash input */}
        <div>
          <label className="block text-xs font-bold text-foreground/50 mb-1.5">交易哈希 (TX Hash)</label>
          <input
            value={txHash}
            onChange={e => setTxHash(e.target.value)}
            placeholder="0x..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:border-gold outline-none"
          />
        </div>

        {error && <p className="text-red-400 text-xs font-bold">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-gold text-black font-black py-3 rounded-lg hover:bg-gold/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Crown className="w-4 h-4" />
          {submitting ? '提交中...' : t('subscribe.pay')}
        </button>
      </div>

      <p className="text-center text-xs text-foreground/40">
        付款後將由管理員確認，通常在 1-2 小時內開通 VIP
      </p>
    </div>
  );
}
