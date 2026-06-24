import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  address: text('address').unique(),
  email: text('email'),
  tier: text('tier').default('free').notNull(), // 'free' | 'vip'
  referralCode: text('referral_code').unique().notNull(),
  referrerId: integer('referrer_id').references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  addressIdx: index('users_address_idx').on(table.address),
  referralCodeIdx: index('users_referral_code_idx').on(table.referralCode),
}));

// Airdrops table
export const airdrops = sqliteTable('airdrops', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  protocol: text('protocol').notNull(),
  chain: text('chain').notNull(),
  status: text('status').default('upcoming').notNull(), // 'upcoming' | 'active' | 'ended'
  description: text('description').notNull(),
  guide: text('guide'),
  rewardEstimate: text('reward_estimate'),
  difficulty: text('difficulty').default('中等'), // '簡單' | '中等' | '困難'
  taskCount: integer('task_count').default(0),
  source: text('source'),
  sourceUrl: text('source_url'),
  imageUrl: text('image_url'),
  disabled: integer('disabled').default(0),
  score: integer('score').default(50),
  endDate: text('end_date'),
  likesCount: integer('likes_count').default(0),       // 👍 讚數快取
  commentsCount: integer('comments_count').default(0), // 💬 留言數快取
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  statusIdx: index('airdrops_status_idx').on(table.status),
  chainIdx: index('airdrops_chain_idx').on(table.chain),
  scoreIdx: index('airdrops_score_idx').on(table.score),
}));

// Tasks for each airdrop
export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  airdropId: integer('airdrop_id').references(() => airdrops.id).notNull(),
  step: integer('step').notNull(),
  instruction: text('instruction').notNull(),
  type: text('type').default('link').notNull(), // 'link' | 'tx' | 'social'
  url: text('url'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ❤️ Likes on airdrops
export const likes = sqliteTable('likes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  airdropId: integer('airdrop_id').references(() => airdrops.id).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  uniqueLike: index('likes_user_airdrop_unique').on(table.userId, table.airdropId),
}));

// ⭐ Bookmarks on airdrops
export const bookmarks = sqliteTable('bookmarks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  airdropId: integer('airdrop_id').references(() => airdrops.id).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  uniqueBookmark: index('bookmarks_user_airdrop_unique').on(table.userId, table.airdropId),
}));

// 💬 Comments / 討論串 on airdrops
export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  airdropId: integer('airdrop_id').references(() => airdrops.id).notNull(),
  parentId: integer('parent_id'), // null = top-level, set = reply
  content: text('content').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  airdropIdx: index('comments_airdrop_idx').on(table.airdropId),
}));

// 📝 Personal notes on airdrops
export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  airdropId: integer('airdrop_id').references(() => airdrops.id).notNull(),
  content: text('content').notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  uniqueNote: index('notes_user_airdrop_unique').on(table.userId, table.airdropId),
}));

// Referrals
export const referrals = sqliteTable('referrals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  referrerId: integer('referrer_id').references(() => users.id).notNull(),
  refereeId: integer('referee_id').references(() => users.id).notNull(),
  earnings: real('earnings').default(0),
  status: text('status').default('active').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Subscription payments
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').default('USDC').notNull(),
  txHash: text('tx_hash'),
  status: text('status').default('pending').notNull(),
  tierStart: text('tier_start'),
  tierEnd: text('tier_end'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});