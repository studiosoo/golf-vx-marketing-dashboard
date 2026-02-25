/**
 * Toast SFTP Daily Sync Job
 * Runs at 5:30 AM EST daily to pick up the previous day's data.
 * Toast publishes data to SFTP at 5:00 AM EST.
 * Delegates to the Python import script which handles SFTP + DB upsert.
 */
import * as path from "path";
import { execSync } from "child_process";

export async function runToastDailySync(): Promise<{
  success: boolean;
  date: string;
  error?: string;
}> {
  // Determine yesterday's date in YYYYMMDD format (EST = UTC-5)
  const now = new Date();
  const estNow = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const yesterday = new Date(estNow);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10).replace(/-/g, "");

  console.log(`[ToastSync] Starting daily sync for date: ${dateStr}`);

  try {
    const scriptPath = path.join(process.cwd(), "scripts", "import-toast-history.py");
    // Pass the specific date as an argument so the script only processes that day
    execSync(`python3 "${scriptPath}" --date ${dateStr}`, {
      timeout: 180_000,
      stdio: "inherit",
      env: { ...process.env },
    });
    console.log(`[ToastSync] ✅ Sync completed for ${dateStr}`);
    return { success: true, date: dateStr };
  } catch (error: any) {
    console.error(`[ToastSync] ❌ Sync failed for ${dateStr}:`, error.message);
    return { success: false, date: dateStr, error: String(error.message) };
  }
}
