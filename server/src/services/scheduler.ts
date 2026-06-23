/**
 * Cron scheduler — runs periodic tasks
 */
import cron from 'node-cron';
import { fullScan, seedAirdrops } from './airdropScanner';
import { rescoreAll, dailyDecay } from './scorer';

let initialized = false;

export function startScheduler() {
  if (initialized) return;
  initialized = true;

  console.log('[Scheduler] Starting cron jobs...');

  // Run seed + score on startup
  seedAirdrops()
    .then(() => rescoreAll())
    .catch(err => console.error('[Scheduler] Seed error:', err));

  // Full scan + rescore every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('[Scheduler] Running scheduled full scan...');
    try {
      await fullScan();
      await rescoreAll();
    } catch (err) {
      console.error('[Scheduler] Scan error:', err);
    }
  });

  // Daily decay every midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Running daily decay...');
    try {
      await dailyDecay();
    } catch (err) {
      console.error('[Scheduler] Decay error:', err);
    }
  });

  console.log('[Scheduler] Cron jobs started (scan 6h / decay daily)');
}
