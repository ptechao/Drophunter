import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ExternalLink, Gift, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { trpc } from '../lib/trpc';

export default function AirdropDetail() {
  const { id } = useParams();
  const { t } = useTranslation();

  const { data: airdrop, isLoading } = trpc.airdrops.getOne.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!airdrop) {
    return (
      <div className="text-center py-20">
        <p className="text-foreground/40">Airdrop not found</p>
        <Link to="/airdrops" className="text-gold hover:underline mt-2 inline-block">
          {t('detail.back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/airdrops" className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-gold transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t('detail.back')}
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-6 h-6 text-gold" />
              <h1 className="text-2xl font-black">{airdrop.name}</h1>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                airdrop.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {t(airdrop.status === 'active' ? 'airdrops.active' : 'airdrops.upcoming')}
              </span>
            </div>
            <p className="text-foreground/60">{airdrop.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-gold">{airdrop.rewardEstimate || 'TBD'}</div>
            <span className="text-[10px] text-foreground/40">{t('airdrops.estReward')}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t('airdrops.chain'), value: airdrop.chain },
            { label: t('airdrops.difficulty'), value: t(`airdrops.${airdrop.difficulty === '簡單' ? 'easy' : airdrop.difficulty === '中等' ? 'medium' : 'hard'}`) },
            { label: t('airdrops.tasks'), value: String(airdrop.taskCount) },
          ].map(s => (
            <div key={s.label} className="bg-muted rounded-lg p-3 text-center">
              <div className="text-[10px] text-foreground/40 uppercase font-black">{s.label}</div>
              <div className="font-black mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        {/* AI Guide */}
        {airdrop.guide && (
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-black text-blue-400">{t('detail.aiAnalysis')}</h3>
            </div>
            <p className="text-sm text-foreground/70">{airdrop.guide}</p>
          </div>
        )}

        {/* Task Steps */}
        {airdrop.tasks && airdrop.tasks.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-black text-lg">{t('detail.steps')}</h3>
            {airdrop.tasks.map((task: any) => (
              <div key={task.id} className="flex items-start gap-3 bg-muted rounded-lg p-4">
                <div className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  {task.step}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{task.instruction}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-foreground/20" />
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-3">
          {airdrop.sourceUrl && (
            <a href={airdrop.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 bg-gold text-black py-3 rounded-xl font-black hover:bg-gold/80 transition-all flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4" /> {t('detail.goto')}
            </a>
          )}
          <button className="px-4 py-3 border border-border rounded-xl hover:bg-muted transition-all">
            {t('detail.share')}
          </button>
        </div>
      </div>
    </div>
  );
}
