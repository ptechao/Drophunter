/**
 * Airdrop Scoring Service
 * Computes scores based on reward potential, freshness, difficulty
 * Daily decay reduces scores for stale/expired airdrops
 */
import { db, schema } from '../db';
import { sql, eq, ne } from 'drizzle-orm';

const airdrops = schema.airdrops as any;

function parseReward(est: string | null): number {
  if (!est) return 200;
  const nums = est.match(/\d+/g);
  if (!nums || nums.length === 0) return 200;
  const vals = nums.map(Number);
  if (vals.length >= 2) return (vals[0] + vals[vals.length - 1]) / 2;
  return vals[0];
}

export function computeScore(a: {
  rewardEstimate: string | null;
  status: string;
  difficulty: string;
  taskCount: number;
  source: string | null;
  endDate: string | null;
  createdAt: string;
}): number {
  let score = 0;

  const reward = parseReward(a.rewardEstimate);
  if (reward >= 2000) score += 40;
  else if (reward >= 1000) score += 35;
  else if (reward >= 500) score += 25;
  else if (reward >= 200) score += 15;
  else score += 5;

  if (a.status === 'active') score += 20;
  else if (a.status === 'upcoming') score += 10;

  if (a.difficulty === '簡單') score += 15;
  else if (a.difficulty === '中等') score += 10;
  else score += 3;

  score += Math.min(a.taskCount, 10);

  const reliable = ['defillama', 'defillama-api', 'official'];
  if (a.source && reliable.includes(a.source)) score += 10;
  else if (a.source) score += 5;

  const daysAge = (Date.now() - new Date(a.createdAt).getTime()) / 86400000;
  if (daysAge < 7) score += 5;
  else if (daysAge < 30) score += 3;

  if (a.endDate) {
    const daysLeft = (new Date(a.endDate).getTime() - Date.now()) / 86400000;
    if (daysLeft < 0) score -= 30;
    else if (daysLeft < 7) score -= 10;
    else if (daysLeft < 30) score -= 3;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function rescoreAll() {
  console.log('[Scorer] Rescoring...');
  const all: any[] = await db.select().from(airdrops).where(eq(airdrops.disabled, 0));
  for (const a of all) {
    const score = computeScore(a);
    await db.update(airdrops).set({ score, updatedAt: new Date().toISOString() }).where(eq(airdrops.id, a.id));
  }
  console.log(`[Scorer] Scored ${all.length}`);
}

export async function dailyDecay() {
  console.log('[Scorer] Daily decay...');
  const all: any[] = await db.select().from(airdrops).where(ne(airdrops.status, 'ended'));
  let autoEnded = 0, decayed = 0;
  for (const a of all) {
    if (a.endDate && new Date(a.endDate) < new Date()) {
      await db.update(airdrops).set({ status: 'ended', score: Math.max(0, a.score - 30), updatedAt: new Date().toISOString() }).where(eq(airdrops.id, a.id));
      autoEnded++;
      continue;
    }
    const daysSinceUpdate = (Date.now() - new Date(a.updatedAt || a.createdAt).getTime()) / 86400000;
    const decay = Math.min(20, Math.floor(daysSinceUpdate / 7) * 2);
    if (decay > 0) {
      const newScore = Math.max(0, computeScore(a) - decay);
      await db.update(airdrops).set({ score: newScore, updatedAt: new Date().toISOString() }).where(eq(airdrops.id, a.id));
      decayed++;
    }
  }
  console.log(`[Scorer] Ended: ${autoEnded}, decayed: ${decayed}`);
}
