/**
 * Cron scheduler — runs periodic tasks
 */
import cron from 'node-cron';
import { fullScan, seedAirdrops } from './airdropScanner';

let initialized = false;

export function startScheduler() {
  if (initialized) return;
  initialized = true;

  console.log('[Scheduler] Starting cron jobs...');

  // Run seed on startup
  seedAirdrops().catch(err => console.error('[Scheduler] Seed error:', err));

  // Full scan every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('[Scheduler] Running scheduled full scan...');
    try {
      await fullScan();
    } catch (err) {
      console.error('[Scheduler] Scan error:', err);
    }
  });

  console.log('[Scheduler] Cron jobs started (every 6h)');
}
