import { runFullSync } from "./autonomous";

// ─── Cron Scheduler ──────────────────────────────────────────────────────────
// Runs autonomous sync at 8:00 AM and 6:00 PM CST daily.
// CST = UTC-6, so 8 AM CST = 14:00 UTC, 6 PM CST = 00:00 UTC (next day)

const SYNC_HOURS_UTC = [14, 0]; // 8 AM CST = 14 UTC, 6 PM CST = 0 UTC

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let lastSyncHour: number | null = null;

/**
 * Check if it's time to run a sync and execute if so.
 * Prevents duplicate runs within the same hour.
 */
async function checkAndSync() {
  const now = new Date();
  const currentHourUTC = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  // Only trigger within the first 5 minutes of the target hour
  if (SYNC_HOURS_UTC.includes(currentHourUTC) && currentMinute < 5) {
    // Prevent duplicate runs in the same hour
    if (lastSyncHour === currentHourUTC) return;
    lastSyncHour = currentHourUTC;

    const cstHour = currentHourUTC === 14 ? "8:00 AM" : "6:00 PM";
    console.log(`[Scheduler] Starting scheduled sync at ${cstHour} CST (${now.toISOString()})`);

    try {
      const metaToken = process.env.META_ADS_ACCESS_TOKEN;
      const metaAccountId = process.env.META_ADS_ACCOUNT_ID;

      const result = await runFullSync(metaToken, metaAccountId);
      console.log(
        `[Scheduler] Sync completed: ${result.campaignsProcessed} campaigns, ` +
          `${result.actionsGenerated} actions (${result.autoExecuted} auto, ` +
          `${result.pendingApproval} pending, ${result.monitoring} monitoring)`
      );
    } catch (error) {
      console.error("[Scheduler] Sync failed:", error);
    }
  } else {
    // Reset lastSyncHour when we're past the sync window
    if (!SYNC_HOURS_UTC.includes(currentHourUTC)) {
      lastSyncHour = null;
    }
  }
}

/**
 * Start the scheduler. Checks every 60 seconds.
 */
export function startScheduler() {
  if (schedulerInterval) {
    console.warn("[Scheduler] Already running");
    return;
  }

  console.log("[Scheduler] Started - will sync at 8:00 AM and 6:00 PM CST daily");
  schedulerInterval = setInterval(checkAndSync, 60 * 1000);

  // Also run an initial check
  checkAndSync();
}

/**
 * Stop the scheduler.
 */
export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Scheduler] Stopped");
  }
}
