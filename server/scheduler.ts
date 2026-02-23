/**
 * Autonomous Marketing Intelligence Scheduler
 * 
 * Runs sync cycles at 8am and 6pm CST daily.
 * Uses setInterval with minute-level checks to determine if it's time to run.
 */

import { runAutonomousCycle } from "./autonomous";

const CST_OFFSET = -6; // CST is UTC-6

function getCSTHour(): number {
  const now = new Date();
  const utcHour = now.getUTCHours();
  let cstHour = utcHour + CST_OFFSET;
  if (cstHour < 0) cstHour += 24;
  return cstHour;
}

function getCSTMinute(): number {
  return new Date().getUTCMinutes();
}

let lastRunKey = "";

async function checkAndRun() {
  const cstHour = getCSTHour();
  const cstMinute = getCSTMinute();
  const today = new Date().toISOString().split("T")[0];
  const runKey = `${today}-${cstHour}`;

  // Run at 8:00 CST or 18:00 CST (within first 5 minutes of the hour)
  if ((cstHour === 8 || cstHour === 18) && cstMinute < 5 && lastRunKey !== runKey) {
    lastRunKey = runKey;
    console.log(`[Scheduler] Running autonomous cycle at CST hour ${cstHour}`);
    try {
      const result = await runAutonomousCycle();
      console.log(`[Scheduler] ${result.summary}`);
    } catch (error) {
      console.error("[Scheduler] Autonomous cycle failed:", error);
    }
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startScheduler() {
  if (intervalId) {
    console.log("[Scheduler] Already running");
    return;
  }

  console.log("[Scheduler] Started — will run at 8am and 6pm CST");

  // Check every 60 seconds
  intervalId = setInterval(checkAndRun, 60 * 1000);

  // Also check immediately on startup
  checkAndRun().catch(console.error);
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Scheduler] Stopped");
  }
}
