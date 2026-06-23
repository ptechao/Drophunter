import { useLanguageContext } from '../contexts/LanguageContext';

type Dict = Record<string, string>;

const translations: Record<string, Dict> = {
  'nav.airdrops':         { en: 'Airdrops', 'zh-CN': '空投', 'zh-TW': '空投' },
  'nav.connect':          { en: 'Connect Wallet', 'zh-CN': '连接钱包', 'zh-TW': '連接錢包' },
  'home.title':           { en: 'AI finds your next 100x airdrop', 'zh-CN': 'AI 帮你找出下一个百倍空投', 'zh-TW': 'AI 幫你找出下一個百倍空投' },
  'home.subtitle':        { en: 'Auto-scan on-chain data, AI summarizes airdrops, one-click complete tasks. Stay ahead.', 'zh-CN': '自动扫描链上数据，AI 摘要空投重点，一键完成任务。比别人早一步。', 'zh-TW': '自動掃描鏈上數據，AI 摘要空投重點，一鍵完成任務。早別人一步。' },
  'home.cta':             { en: 'Start Hunting', 'zh-CN': '开始猎空投', 'zh-TW': '開始獵空投' },
  'home.feature1.title':  { en: 'AI Scanner', 'zh-CN': 'AI 扫描', 'zh-TW': 'AI 掃描' },
  'home.feature1.desc':   { en: 'Auto-track 20+ data sources to find potential airdrops', 'zh-CN': '自动追踪 20+ 数据源，找出潜在空投项目', 'zh-TW': '自動追蹤 20+ 數據源，找出潛在空投項目' },
  'home.feature2.title':  { en: 'Reward Estimate', 'zh-CN': '收益预估', 'zh-TW': '收益預估' },
  'home.feature2.desc':   { en: 'AI analyzes historical data to estimate reward range', 'zh-CN': 'AI 分析历史数据，估算潜在收益范围', 'zh-TW': 'AI 分析歷史數據，估算潛在收益範圍' },
  'home.feature3.title':  { en: 'Earn by Sharing', 'zh-CN': '推广赚钱', 'zh-TW': '推廣賺錢' },
  'home.feature3.desc':   { en: 'Invite friends, earn 20% subscription commission', 'zh-CN': '邀请朋友加入，赚 20% 订阅分润', 'zh-TW': '邀請朋友加入，賺 20% 訂閱分潤' },
  'home.vip.title':       { en: 'VIP $9.99/month', 'zh-CN': 'VIP ¥9.99/月', 'zh-TW': 'VIP $9.99/月' },
  'home.vip.desc':        { en: 'Unlock all airdrops, AI personalized recommendations, instant alerts. Invite friends, both earn $2.00.', 'zh-CN': '解锁全部空投、AI 个性化推荐、即时通知。邀请朋友加入，双方各赚 $2.00。', 'zh-TW': '解鎖全部空投、AI 個人化推薦、即時通知。邀請朋友加入，雙方各賺 $2.00。' },
  'home.vip.btn':         { en: 'Upgrade Now', 'zh-CN': '立即升级', 'zh-TW': '立即升級' },
  'airdrops.title':       { en: 'Airdrop Hunting Ground', 'zh-CN': '空投猎场', 'zh-TW': '空投獵場' },
  'airdrops.subtitle':    { en: 'AI scans the latest airdrop opportunities', 'zh-CN': 'AI 扫描最新的空投机会', 'zh-TW': 'AI 掃描最新的空投機會' },
  'airdrops.search':      { en: 'Search airdrops...', 'zh-CN': '搜索空投...', 'zh-TW': '搜尋空投...' },
  'airdrops.allChains':   { en: 'All Chains', 'zh-CN': '全部链', 'zh-TW': '全部鏈' },
  'airdrops.allDifficulty': { en: 'All Difficulty', 'zh-CN': '全部难度', 'zh-TW': '全部難度' },
  'airdrops.active':      { en: 'Active', 'zh-CN': '进行中', 'zh-TW': '進行中' },
  'airdrops.upcoming':    { en: 'Upcoming', 'zh-CN': '即将开始', 'zh-TW': '即將開始' },
  'airdrops.chain':       { en: 'Chain', 'zh-CN': '链', 'zh-TW': '鏈' },
  'airdrops.difficulty':  { en: 'Difficulty', 'zh-CN': '难度', 'zh-TW': '難度' },
  'airdrops.tasks':       { en: 'tasks', 'zh-CN': '个任务', 'zh-TW': '個任務' },
  'airdrops.estReward':   { en: 'Est. Reward', 'zh-CN': '预估收益', 'zh-TW': '預估收益' },
  'airdrops.easy':        { en: 'Easy', 'zh-CN': '简单', 'zh-TW': '簡單' },
  'airdrops.medium':      { en: 'Medium', 'zh-CN': '中等', 'zh-TW': '中等' },
  'airdrops.hard':        { en: 'Hard', 'zh-CN': '困难', 'zh-TW': '困難' },
  'detail.back':          { en: 'Back to Airdrops', 'zh-CN': '返回空投列表', 'zh-TW': '返回空投列表' },
  'detail.aiAnalysis':    { en: 'AI Analysis', 'zh-CN': 'AI 分析', 'zh-TW': 'AI 分析' },
  'detail.steps':         { en: 'Task Steps', 'zh-CN': '任务步骤', 'zh-TW': '任務步驟' },
  'detail.goto':          { en: 'Go to Official Site', 'zh-CN': '前往官方网站', 'zh-TW': '前往官方網站' },
  'detail.share':         { en: '🔗 Share & Earn', 'zh-CN': '🔗 分享赚佣金', 'zh-TW': '🔗 分享賺佣金' },
};

export function useTranslation() {
  const { language } = useLanguageContext();

  function t(key: string): string {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry['en'] || key;
  }

  return { t, language };
}

export function useT() {
  const { t } = useTranslation();
  return t;
}
