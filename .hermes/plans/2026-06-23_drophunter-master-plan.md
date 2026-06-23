# DropHunter — 加密空投獵人 開發規劃書

> **For Hermes:** 照此規劃逐 Phase 實作，每完成一個 Task 就 commit。

**Goal:** 建立一個 AI 驅動的加密貨幣空投/任務聚合平台，自動掃描鏈上數據找出潛在空投項目，提供一鍵任務教學，內建邀請返傭機制，KOL 專屬推廣碼分潤。

**Architecture:** React 18 + Express + tRPC + SQLite，延續 FORXO 既有架構快速開發。前端 Tailwind 暗色主題。後端定時爬蟲 + AI 摘要 + 鏈上掃描。部署至 VPS。

**Tech Stack:** TypeScript, React 18, Express, tRPC, SQLite (WAL), Tailwind CSS, ethers.js v6, node-cron

---

## Phase 0: 專案初始化 (P0)

### Task 0.1: 建立 monorepo 結構
```bash
cd D:\DropHunter
pnpm init
# 建立 client/ server/ drizzle/ 目錄
# 複製 FORXO 的 tsconfig、tailwind.config、vite.config 模板
```

### Task 0.2: 基礎依賴安裝
```bash
pnpm add -w typescript react react-dom express @trpc/server @trpc/client zod drizzle-orm better-sqlite3 tailwindcss ethers node-cron
```

### Task 0.3: 建立首頁 + Express 起動
- `client/src/App.tsx` — 暗色主題首頁
- `server/index.ts` — Express :5000
- 驗證: `pnpm dev` → localhost:5000 顯示首頁

---

## Phase 1: 空投資料核心 (P0)

### Task 1.1: 資料庫 Schema
- `drizzle/schema.ts` — airdrops, tasks, users, referrals 表
- `airdrops` 表: id, name, protocol, chain, status, description, guide, rewardEstimate, url, source, createdAt
- `tasks` 表: id, airdropId, step, instruction, type(link/tx/social), url
- `users` 表: id, address, email, tier(free/vip), referralCode, referrerId, createdAt
- `referrals` 表: id, referrerId, refereeId, earnings, status

### Task 1.2: AI 空投掃描爬蟲
- `server/services/airdropScanner.ts`
- 爬取來源: DefiLlama API、Dune Analytics、Twitter/X 關鍵字、Commonwealth 治理論壇
- AI (DeepSeek) 摘要每個空投的重點、難度、預估收益
- `node-cron` 每 6 小時自動掃描一次
- 結果寫入 `airdrops` 表

### Task 1.3: 空投列表 API
- `server/routers.ts` → `airdrops.list` / `airdrops.getOne`
- 支援排序（熱度/收益/難度）、過濾（鏈/狀態）
- 前端 `client/src/pages/Airdrops.tsx` — 卡片列表

### Task 1.4: 空投詳情 + 任務教學
- `client/src/pages/AirdropDetail.tsx` — 完整說明 + 逐步任務
- 每個任務附「一鍵完成」連結（跳轉至項目方頁面）
- AI 生成的注意事項/風險提示

---

## Phase 2: 會員 + 訂閱金流 (P1)

### Task 2.1: 用戶註冊/登入
- 錢包簽名登入（ethers.js signMessage）
- Email 可選（用於通知）
- JWT session

### Task 2.2: VIP 分級
- Free: 看到基本空投，延遲 24h 解鎖
- VIP ($9.99/月): 即時解鎖全部 + 高級空投 + AI 個人化推薦
- `users.tier` 欄位控制

### Task 2.3: 金流整合
- Stripe / Crypto 付款（USDC/USDT）
- 付款成功 → 自動升級 tier
- 到期自動降級 + 通知
- `server/services/paymentService.ts`

---

## Phase 3: 裂變推廣系統 (P1)

### Task 3.1: 邀請碼生成
- 每個用戶自動生成唯一邀請碼
- 邀請連結: `drophunter.io/?ref=CODE`

### Task 3.2: 邀請返傭追蹤
- 被邀請人付費 → 邀請人獲得 20% 佣金（月付循環）
- `referrals` 表記錄每筆佣金
- 可提領至錢包或抵扣月費

### Task 3.3: KOL 專屬推廣面板
- `client/src/pages/KOLDashboard.tsx`
- 顯示: 總邀請數、活躍會員、累積佣金、本月收益
- 專屬推廣連結 + 素材包下載（Banner、文案模板）
- 排行榜（TOP KOL 收益榜）→ 刺激競爭

### Task 3.4: 分享即賺
- 一鍵分享空投到 Twitter/Telegram/Discord
- 附帶用戶推廣碼
- 分享後的點擊追蹤

---

## Phase 4: AI 增強功能 (P2)

### Task 4.1: AI 個人化推薦
- 根據用戶錢包歷史（互動過的協議）推薦相關空投
- `server/services/aiRecommender.ts`

### Task 4.2: 空投收益估算器
- 根據歷史類似項目，AI 估算潛在收益範圍
- 顯示: 預估金額、信心度、風險等級

### Task 4.3: 智能警報
- 用戶自訂監控條件（特定鏈、協議類型、最低收益）
- 符合條件 → Email/Telegram 通知

---

## Phase 5: 部署上線 (P0)

### Task 5.1: VPS 部署
- 同一台 VPS (130.94.29.23)，不同 port 或 subdomain
- PM2: `drophunter` process
- Nginx reverse proxy → `drophunter.forxo.net` 或獨立域名

### Task 5.2: CI/CD
- GitHub Actions 自動 deploy
- 或沿用 remote_deploy.py 模式

---

## 開發時程估計

| Phase | 內容 | 估計 |
|-------|------|:--:|
| 0 | 專案初始化 | 1 天 |
| 1 | 空投資料核心 | 5-7 天 |
| 2 | 會員+金流 | 3-5 天 |
| 3 | 裂變推廣 | 3-5 天 |
| 4 | AI 增強 | 3-5 天 |
| 5 | 部署上線 | 1 天 |
| **總計** | | **3-4 週** |

---

## 收入模型

| 來源 | 預估 ARPU | 說明 |
|------|:--:|------|
| VIP 訂閱 | $19.99/月 | 主力收入 |
| 項目方廣告 | $500-2000/次 | 置頂推薦 |
| 聯盟佣金 | 變動 | 錢包/交易所推薦連結 |
| **KOL 分潤** | **20%** | 從 VIP 訂閱中分出 |

---

## 裂變飛輪

```
用戶註冊 → 獲得邀請碼 → 分享空投資訊(附邀請碼)
    → 新用戶點擊 → 看到誘人空投 → 想解鎖VIP
    → 付費 → 原用戶賺20% → 更積極分享
    → 循環放大
```

---

## 下一步

確認以上規劃，我就開始 Phase 0 搭建專案骨架。
