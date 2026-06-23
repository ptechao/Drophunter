import { Link } from 'react-router-dom';
import { ArrowRight, Gift, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

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
        <Link
          to="/airdrops"
          className="inline-flex items-center gap-2 bg-gold text-black px-8 py-3 rounded-xl font-black text-lg hover:bg-gold/80 transition-all"
        >
          {t('home.cta')} <ArrowRight className="w-5 h-5" />
        </Link>
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

      {/* CTA */}
      <section className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
        <h2 className="text-2xl font-black">{t('home.vip.title')}</h2>
        <p className="text-foreground/60 max-w-md mx-auto">{t('home.vip.desc')}</p>
        <button className="bg-gold text-black px-8 py-3 rounded-xl font-black text-lg hover:bg-gold/80 transition-all">
          {t('home.vip.btn')}
        </button>
      </section>
    </div>
  );
}
