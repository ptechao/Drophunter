import { Link } from 'react-router-dom';
import { ArrowRight, Gift, TrendingUp, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          <span className="text-gold">AI</span> 幫你找出下一個<br/>
          百倍空投
        </h1>
        <p className="text-lg text-foreground/60 max-w-xl mx-auto">
          自動掃描鏈上數據，AI 摘要空投重點，一鍵完成任務。早別人一步，賺別人賺不到的。
        </p>
        <Link
          to="/airdrops"
          className="inline-flex items-center gap-2 bg-gold text-black px-8 py-3 rounded-xl font-black text-lg hover:bg-gold/80 transition-all"
        >
          開始獵空投 <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Features */}
      <section className="grid sm:grid-cols-3 gap-6">
        {[
          { icon: Gift, title: 'AI 掃描', desc: '自動追蹤 20+ 數據源，找出潛在空投項目' },
          { icon: TrendingUp, title: '收益預估', desc: 'AI 分析歷史數據，估算潛在收益範圍' },
          { icon: Users, title: '推廣賺錢', desc: '邀請朋友加入，賺 20% 訂閱分潤' },
        ].map((f) => (
          <div key={f.title} className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
            <f.icon className="w-8 h-8 text-gold mx-auto" />
            <h3 className="font-black text-lg">{f.title}</h3>
            <p className="text-sm text-foreground/60">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
        <h2 className="text-2xl font-black">VIP 會員 $9.99/月</h2>
        <p className="text-foreground/60 max-w-md mx-auto">
          解鎖全部空投、AI 個人化推薦、即時通知。邀請朋友加入，雙方各賺 $2.00。
        </p>
        <button className="bg-gold text-black px-8 py-3 rounded-xl font-black text-lg hover:bg-gold/80 transition-all">
          立即升級
        </button>
      </section>
    </div>
  );
}
