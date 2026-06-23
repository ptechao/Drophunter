import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Copy, Check, CreditCard, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

export default function Profile() {
  const { address, user } = useAuth();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!address || !user) {
    return (
      <div className="text-center py-20 space-y-4">
        <h1 className="text-2xl font-black">{t('profile.title')}</h1>
        <p className="text-foreground/60">{t('nav.connect')}{' '}{t('nav.connect')}</p>
      </div>
    );
  }

  const refLink = `${window.location.origin}?ref=${user.referralCode}`;

  const copyRefLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-black">{t('profile.title')}</h1>

      {/* User Info Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-foreground/50 font-bold uppercase">{t('profile.tier')}</p>
            <div className="flex items-center gap-2 mt-1">
              {user.tier === 'vip' ? (
                <span className="flex items-center gap-1.5 text-gold font-black text-lg">
                  <Crown className="w-5 h-5" /> VIP
                </span>
              ) : (
                <span className="text-foreground/50 font-black text-lg">Free</span>
              )}
            </div>
          </div>
          {user.tier !== 'vip' && (
            <Link to="/subscribe" className="bg-gold text-black px-4 py-2 rounded-lg text-sm font-black flex items-center gap-1.5 hover:bg-gold/80">
              <Crown className="w-4 h-4" /> {t('profile.upgrade')}
            </Link>
          )}
        </div>
        <div className="font-mono text-xs text-foreground/50 bg-background rounded-lg p-3">
          {address}
        </div>
      </div>

      {/* Referral Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gold" />
          <h2 className="font-black">{t('profile.referral')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-background rounded-lg px-4 py-2.5 font-mono text-sm font-bold text-gold">
            {user.referralCode}
          </code>
          <button
            onClick={copyRefLink}
            className="flex items-center gap-1.5 bg-gold/10 text-gold px-4 py-2.5 rounded-lg text-sm font-black hover:bg-gold/20 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t('profile.copied') : t('profile.copy')}
          </button>
        </div>
        <p className="text-xs text-foreground/50">
          每邀請一位朋友訂閱 VIP，你賺 <span className="text-gold font-bold">$2.00 (20%)</span>
        </p>
      </div>

      {/* Payment History */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-gold" />
          <h2 className="font-black">{t('profile.payments')}</h2>
        </div>
        <PaymentList userId={user.id} t={t} />
      </div>
    </div>
  );
}

function PaymentList({ userId, t }: { userId: number; t: (k: string) => string }) {
  const [payments, setPayments] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    fetch('/api/trpc/admin.payments.list?input=%7B%7D', {
      headers: { 'x-admin-key': localStorage.getItem('drophunter_admin_key') || '' },
    }).then(r => r.json()).then(j => {
      const all = j?.result?.data || [];
      setPayments(all.filter((p: any) => p.userId === userId));
      setLoading(false);
    }).catch(() => setLoading(false));
  });

  if (loading) return <p className="text-xs text-foreground/40">...</p>;
  if (!payments?.length) return <p className="text-sm text-foreground/40">{t('profile.noPayments')}</p>;

  return (
    <div className="space-y-2">
      {payments.map((p: any) => (
        <div key={p.id} className="flex items-center justify-between bg-background rounded-lg px-3 py-2 text-xs">
          <span className="font-bold">{p.amount} {p.currency}</span>
          <span className={`font-bold ${
            p.status === 'confirmed' ? 'text-green-400' : p.status === 'failed' ? 'text-red-400' : 'text-amber-400'
          }`}>{p.status}</span>
          <span className="text-foreground/40">{p.createdAt?.slice(0, 10)}</span>
        </div>
      ))}
    </div>
  );
}
