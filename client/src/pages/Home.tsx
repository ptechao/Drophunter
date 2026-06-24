import { Link } from 'react-router-dom';
import { ArrowRight, Gift, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import SearchBar from '../components/SearchBar';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="space-y-16 py-8">
      {/* Hero */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          <span className="text-gold">{t('home.title').split(' ')[0]}</span>{' '}
          {t('home.title').split(' ').slice(1).join(' ')}
        </h1>
        <p className="text-lg text-foreground/60 max-w-xl mx-auto">
          {t('home.subtitle')}
        </p>
        <div className="flex flex-col items-center gap-4">
          <SearchBar />
          <Link
            to="/airdrops"
            className="inline-flex items-center gap-2 bg-gold text-black px-8 py-3 rounded-xl font-black text-lg hover:bg-gold/80 transition-all"
          >
            {t('home.cta')} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid sm:grid-cols-3 gap-6">
        {[
          { icon: Gift, tKey: 'home.feature1' },
          { icon: TrendingUp, tKey: 'home.feature2' },
          { icon: Users, tKey: 'home.feature3' },
        ].map((f) => (
          <div key={f.tKey} className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
            <f.icon className="w-8 h-8 text-gold mx-auto" />
            <h3 className="font-black text-lg">{t(f.tKey + '.title')}</h3>
            <p className="text-sm text-foreground/60">{t(f.tKey + '.desc')}</p>
          </div>
        ))}
      </section>

      {/* Pricing Comparison */}
      <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-2xl font-black text-center">選擇你的方案</h2>
        
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Free */}
          <div className="border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-black text-lg">🆓 免費</h3>
            <p className="text-3xl font-black">$0</p>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li>✅ 瀏覽前 5 個空投</li>
              <li>✅ 基本空投資訊</li>
              <li>❌ 無 AI 分析</li>
              <li>❌ 無完整任務攻略</li>
              <li>❌ 無個人化推薦</li>
            </ul>
          </div>

          {/* VIP */}
          <div className="border-2 border-gold rounded-xl p-5 space-y-3 bg-gold/5 relative">
            <span className="absolute -top-3 right-4 bg-gold text-black text-[10px] font-black px-3 py-1 rounded-full">推薦</span>
            <h3 className="font-black text-lg">👑 VIP</h3>
            <p className="text-3xl font-black text-gold">$9.99<span className="text-sm text-foreground/40 font-normal">/月</span></p>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li>✅ 全部空投無限制</li>
              <li>✅ AI 分析 + 詳細攻略</li>
              <li>✅ 完整任務步驟</li>
              <li>✅ 即時 Telegram 通知</li>
              <li>✅ 推廣賺 20% 分潤</li>
            </ul>
            <Link to="/subscribe" className="block w-full text-center bg-gold text-black py-2.5 rounded-lg font-black text-sm hover:bg-gold/80 transition-all">
              立即升級 VIP
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
