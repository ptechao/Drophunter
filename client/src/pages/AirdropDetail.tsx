import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ExternalLink, Gift, AlertCircle, Loader2, Lock, Crown, MessageSquare } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { trpc } from '../lib/trpc';
import HeartButton from '../components/HeartButton';
import BookmarkButton from '../components/BookmarkButton';
import CommentSection from '../components/CommentSection';
import NotesEditor from '../components/NotesEditor';

export default function AirdropDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: airdrop, isLoading } = (trpc as any).airdrops.getOne.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  const isVip = user?.tier === 'vip';
  const isLoggedIn = !!user;

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
            <div className="flex items-center gap-3 mb-2">
              {airdrop.imageUrl && (
                <img src={airdrop.imageUrl} alt={airdrop.name} className="w-12 h-12 rounded-xl bg-muted object-contain" 
                     onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <Gift className="w-6 h-6 text-gold" />
                  <h1 className="text-2xl font-black">{airdrop.name}</h1>
                </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                airdrop.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {t(airdrop.status === 'active' ? 'airdrops.active' : 'airdrops.upcoming')}
              </span>
              </div>
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

        {/* ❤️ Social Actions */}
        <div className="flex items-center gap-2">
          <HeartButton airdropId={airdrop.id} initialLikes={airdrop.likesCount || 0} />
          <BookmarkButton airdropId={airdrop.id} />
        </div>

        {/* AI Guide — login required */}
        {airdrop.guide && isLoggedIn && (
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-black text-blue-400">{t('detail.aiAnalysis')}</h3>
              {!isVip && <Lock className="w-3.5 h-3.5 text-foreground/30" />}
            </div>
            <p className="text-sm text-foreground/70">
              {isVip ? airdrop.guide : airdrop.guide.slice(0, 120) + '...'}
            </p>
            {!isVip && (
              <Link to="/subscribe" className="inline-flex items-center gap-1 mt-2 text-xs font-black text-gold hover:underline">
                <Crown className="w-3 h-3" /> {t('detail.upgrade')}
              </Link>
            )}
          </div>
        )}

        {/* Task Steps — login required */}
        {airdrop.tasks && airdrop.tasks.length > 0 && isLoggedIn && (
          <div className="space-y-3">
            <h3 className="font-black text-lg">{t('detail.steps')}</h3>
            {airdrop.tasks.map((task: any, idx: number) => {
              const locked = !isVip && idx >= 2;
              return (
                <div key={task.id} className={`flex items-start gap-3 rounded-lg p-4 ${locked ? 'bg-muted/50 opacity-40' : 'bg-muted'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${locked ? 'bg-foreground/10 text-foreground/30' : 'bg-gold/20 text-gold'}`}>
                    {task.step}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{locked ? '🔒 VIP 專屬任務' : task.instruction}</p>
                  </div>
                  {locked ? <Lock className="w-5 h-5 text-foreground/20" /> : <CheckCircle className="w-5 h-5 text-foreground/20" />}
                </div>
              );
            })}
            {!isVip && airdrop.tasks.length > 2 && (
              <div className="bg-gold/5 border border-gold/10 rounded-xl p-4 text-center">
                <p className="text-sm font-bold text-gold mb-2">{t('detail.vipLocked')}</p>
                <Link to="/subscribe" className="inline-flex items-center gap-1.5 bg-gold text-black px-4 py-2 rounded-lg text-sm font-black hover:bg-gold/80">
                  <Crown className="w-4 h-4" /> {t('detail.upgrade')}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Login prompt */}
        {!isLoggedIn && (
          <div className="bg-gold/5 border border-gold/10 rounded-xl p-6 text-center space-y-3">
            <Lock className="w-8 h-8 text-gold mx-auto" />
            <p className="font-black text-gold">連接錢包查看詳細攻略與任務步驟</p>
            <p className="text-sm text-foreground/50">免費連接 MetaMask 即可解鎖 AI 分析與空投任務</p>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <div className="flex-1 space-y-4">
            <NotesEditor airdropId={airdrop.id} />
            <CommentSection airdropId={airdrop.id} />
          </div>
        </div>

        {/* Action buttons */}
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
