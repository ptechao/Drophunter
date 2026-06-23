import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ExternalLink, Gift, AlertCircle } from 'lucide-react';

export default function AirdropDetail() {
  const { id } = useParams();

  const steps = [
    '連接錢包至 LayerZero 官方網站',
    '在 Stargate Finance 跨鏈至少 $100',
    '質押 STG 代幣 30 天',
    '加入官方 Discord 並驗證',
    '完成 Galxe 任務系列',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/airdrops" className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-gold transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回空投列表
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-6 h-6 text-gold" />
              <h1 className="text-2xl font-black">LayerZero</h1>
              <span className="bg-green-500/10 text-green-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">進行中</span>
            </div>
            <p className="text-foreground/60">跨鏈互操作協議空投，預計 TGE 2024 Q4</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-gold">$500-2000</div>
            <span className="text-[10px] text-foreground/40">預估收益</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '鏈', value: 'Ethereum' },
            { label: '難度', value: '簡單' },
            { label: '任務數', value: '5' },
          ].map(s => (
            <div key={s.label} className="bg-muted rounded-lg p-3 text-center">
              <div className="text-[10px] text-foreground/40 uppercase font-black">{s.label}</div>
              <div className="font-black mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        {/* AI Analysis */}
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-black text-blue-400">AI 分析</h3>
          </div>
          <p className="text-sm text-foreground/70">
            LayerZero 已確認空投，總量 10% 分配給早期用戶。根據歷史類似項目 (Arbitrum, Optimism)，
            預估單帳號收益 $500-2000。建議使用主網帳號操作以提高權重。
          </p>
        </div>

        {/* Task Steps */}
        <div className="space-y-3">
          <h3 className="font-black text-lg">任務步驟</h3>
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3 bg-muted rounded-lg p-4">
              <div className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm">{step}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-foreground/20" />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <button className="flex-1 bg-gold text-black py-3 rounded-xl font-black hover:bg-gold/80 transition-all flex items-center justify-center gap-2">
            <ExternalLink className="w-4 h-4" /> 前往官方網站
          </button>
          <button className="px-4 py-3 border border-border rounded-xl hover:bg-muted transition-all">
            🔗 分享賺佣金
          </button>
        </div>
      </div>
    </div>
  );
}
