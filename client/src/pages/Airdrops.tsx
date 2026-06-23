import { Search, TrendingUp, Gift } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const MOCK_AIRDROPS = [
  { id: 1, name: 'LayerZero', chain: 'Ethereum', status: 'active', reward: '$500-2000', difficultyKey: 'airdrops.easy', tasks: 5 },
  { id: 2, name: 'zkSync Era', chain: 'zkSync', status: 'active', reward: '$300-1500', difficultyKey: 'airdrops.medium', tasks: 8 },
  { id: 3, name: 'StarkNet', chain: 'StarkNet', status: 'upcoming', reward: '$200-800', difficultyKey: 'airdrops.easy', tasks: 3 },
  { id: 4, name: 'Scroll', chain: 'Scroll', status: 'active', reward: '$400-1200', difficultyKey: 'airdrops.medium', tasks: 6 },
  { id: 5, name: 'Linea', chain: 'Linea', status: 'upcoming', reward: '$100-500', difficultyKey: 'airdrops.easy', tasks: 4 },
];

const CHAINS = ['全部', 'Ethereum', 'zkSync', 'StarkNet', 'Scroll', 'Linea', 'Arbitrum', 'Optimism'];
const DIFFICULTIES = ['全部', '簡單', '中等', '困難'];

export default function Airdrops() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">{t('airdrops.title')}</h1>
          <p className="text-sm text-foreground/60 mt-1">{t('airdrops.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            placeholder={t('airdrops.search')}
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:border-gold outline-none"
          />
        </div>
        <select className="bg-card border border-border rounded-lg px-3 py-2 text-sm">
          {CHAINS.map(c => <option key={c}>{c === '全部' ? t('airdrops.allChains') : c}</option>)}
        </select>
        <select className="bg-card border border-border rounded-lg px-3 py-2 text-sm">
          {DIFFICULTIES.map(d => <option key={d}>{d === '全部' ? t('airdrops.allDifficulty') : d}</option>)}
        </select>
      </div>

      {/* Airdrop Cards */}
      <div className="grid gap-4">
        {MOCK_AIRDROPS.map(a => (
          <div key={a.id} className="bg-card border border-border rounded-xl p-5 hover:border-gold/30 transition-all cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
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
                  <span>{t('airdrops.difficulty')}: {t(a.difficultyKey)}</span>
                  <span>{a.tasks} {t('airdrops.tasks')}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-gold font-black">
                  <TrendingUp className="w-4 h-4" />
                  {a.reward}
                </div>
                <span className="text-[10px] text-foreground/40">{t('airdrops.estReward')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
