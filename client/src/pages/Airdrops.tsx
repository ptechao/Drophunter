import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Gift, Loader2, Lock, Crown, ArrowRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { trpc } from '../lib/trpc';

const CHAINS = ['全部', 'Ethereum', 'zkSync Era', 'StarkNet', 'Scroll', 'Linea', 'Base', 'Arbitrum', 'Polygon zkEVM'];
const FREE_LIMIT = 5;

export default function Airdrops() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [chain, setChain] = useState('全部');
  const [status, setStatus] = useState('全部');

  const { data: airdrops, isLoading } = (trpc as any).airdrops.list.useQuery({
    chain: chain !== '全部' ? chain : undefined,
    status: status !== '全部' ? status : undefined,
    search: search || undefined,
  });

  const isVip = user?.tier === 'vip';
  const isLoggedIn = !!user;
  const visibleAirdrops = isVip ? airdrops : (airdrops || []).slice(0, FREE_LIMIT);
  const lockedCount = !isVip && airdrops ? Math.max(0, airdrops.length - FREE_LIMIT) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">{t('airdrops.title')}</h1>
          <p className="text-sm text-foreground/60 mt-1">{t('airdrops.subtitle')}</p>
        </div>
        {!isVip && (
          <Link to="/subscribe" className="hidden sm:flex items-center gap-1.5 bg-gold/10 text-gold px-3 py-1.5 rounded-lg text-xs font-black hover:bg-gold/20">
            <Crown className="w-3.5 h-3.5" /> {t('detail.upgrade')}
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            placeholder={t('airdrops.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:border-gold outline-none"
          />
        </div>
        <select value={chain} onChange={e => setChain(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm">
          {CHAINS.map(c => <option key={c}>{c === '全部' ? t('airdrops.allChains') : c}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm">
          <option value="全部">{t('airdrops.allDifficulty')}</option>
          <option value="active">{t('airdrops.active')}</option>
          <option value="upcoming">{t('airdrops.upcoming')}</option>
        </select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gold" />
        </div>
      )}

      <div className="grid gap-4">
        {visibleAirdrops?.map((a: any) => (
          <Link key={a.id} to={`/airdrops/${a.id}`}>
            <div className="bg-card border border-border rounded-xl p-5 hover:border-gold/30 transition-all cursor-pointer group">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {a.imageUrl && (
                      <img src={a.imageUrl} alt={a.name} className="w-8 h-8 rounded-full bg-muted object-contain" 
                           onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                    )}
                    <Gift className="w-5 h-5 text-gold" />
                    <h3 className="font-black text-lg group-hover:text-gold transition-colors">{a.name}</h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                      a.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {t(a.status === 'active' ? 'airdrops.active' : 'airdrops.upcoming')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-foreground/50">
                    <span>{t('airdrops.chain')}: {a.chain}</span>
                    <span>{t('airdrops.difficulty')}: {t(`airdrops.${a.difficulty === '簡單' ? 'easy' : a.difficulty === '中等' ? 'medium' : 'hard'}`)}</span>
                    <span>{a.taskCount} {t('airdrops.tasks')}</span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-1 text-gold font-black">
                    <TrendingUp className="w-4 h-4" />
                    {a.rewardEstimate || 'TBD'}
                  </div>
                  {a.score > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      a.score >= 70 ? 'bg-green-500/10 text-green-400' : a.score >= 40 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                    }`}>★ {a.score}</span>
                  )}
                  <div className="text-[10px] text-foreground/40">{t('airdrops.estReward')}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {lockedCount > 0 && (
          <>
            {Array.from({ length: Math.min(lockedCount, 3) }).map((_, i) => (
              <div key={`locked-${i}`} className="bg-card/30 border border-border/20 rounded-xl p-5 opacity-30 blur-[2px] select-none pointer-events-none">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted" />
                      <div className="w-32 h-5 bg-muted rounded" />
                      <div className="w-12 h-4 bg-muted rounded-full" />
                    </div>
                    <div className="flex gap-4"><div className="w-20 h-3 bg-muted rounded" /><div className="w-16 h-3 bg-muted rounded" /><div className="w-12 h-3 bg-muted rounded" /></div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="w-20 h-5 bg-muted rounded" />
                    <div className="w-8 h-3 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
            <Link to="/subscribe" className="bg-gold/10 border border-gold/20 rounded-xl p-6 text-center space-y-3 hover:bg-gold/15 transition-all">
              <Crown className="w-8 h-8 text-gold mx-auto" />
              <p className="font-black text-gold">解鎖全部 {airdrops.length} 個空投攻略</p>
              <p className="text-sm text-foreground/50">VIP $9.99/月 — 隱藏 {lockedCount} 個高回報空投 + AI 分析</p>
              <span className="inline-flex items-center gap-1.5 bg-gold text-black px-5 py-2 rounded-lg text-sm font-black">
                立即升級 <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </>
        )}
      </div>

      {airdrops?.length === 0 && !isLoading && (
        <div className="text-center py-12 text-foreground/40">No airdrops found</div>
      )}
    </div>
  );
}
