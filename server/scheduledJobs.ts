import cron from "node-cron";
import { syncGiveawayApplications } from "./giveawaySync";
import { runDailySnapshot } from "./jobs/dailySnapshot";
import { runWeeklyEmailReport } from "./jobs/weeklyEmailReport";

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduledJobs() {
  console.log("[ScheduledJobs] Initializing scheduled jobs...");

  // Sync Annual Giveaway applications daily at midnight CST (6 AM UTC)
  // Cron format: second minute hour day month weekday
  cron.schedule("0 0 6 * * *", async () => {
    try {
      console.log("[ScheduledJobs] Running daily giveaway sync at midnight CST...");
      const result = await syncGiveawayApplications();
      console.log(`[ScheduledJobs] Daily giveaway sync completed: ${result.synced} applications synced`);
    } catch (error) {
      console.error("[ScheduledJobs] Error in daily giveaway sync:", error);
    }
  }, {
    timezone: "America/Chicago" // CST/CDT timezone
  });

  // Daily campaign metrics snapshot at 2 AM CST (8 AM UTC)
  cron.schedule("0 0 8 * * *", async () => {
    try {
      console.log("[ScheduledJobs] Running daily campaign metrics snapshot at 2 AM CST...");
      const result = await runDailySnapshot();
      console.log(`[ScheduledJobs] Daily snapshot completed: ${result.snapshotCount} campaigns saved`);
    } catch (error) {
      console.error("[ScheduledJobs] Error in daily snapshot:", error);
    }
  }, {
    timezone: "America/Chicago"
  });

  // Weekly email report every Monday at 8 AM CST (14:00 UTC)
  cron.schedule("0 0 14 * * 1", async () => {
    try {
      console.log("[ScheduledJobs] Running weekly email report at Monday 8 AM CST...");
      const result = await runWeeklyEmailReport();
      console.log(`[ScheduledJobs] Weekly email report sent: ${result.success}`);
    } catch (error) {
      console.error("[ScheduledJobs] Error in weekly email report:", error);
    }
  }, {
    timezone: "America/Chicago"
  });

  console.log("[ScheduledJobs] Scheduled jobs initialized:");
  console.log("  - Annual Giveaway sync: Daily at 12:00 AM CST");
  console.log("  - Campaign metrics snapshot: Daily at 2:00 AM CST");
  console.log("  - Weekly email report: Every Monday at 8:00 AM CST");
}
