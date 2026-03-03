/**
 * Direct test of syncGiveawayFromSheets
 * Run with: npx tsx run-sync-test.ts
 */
import { syncGiveawayFromSheets } from "./server/googleSheetsSync";

console.log("Starting Google Sheets → DB sync test...");
console.log("Time:", new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }), "CST");

try {
  const result = await syncGiveawayFromSheets();
  
  console.log("\n=== Sync Result ===");
  console.log(`Total rows in sheet: ${result.totalRows}`);
  console.log(`Inserted (new): ${result.inserted}`);
  console.log(`Updated (existing): ${result.updated}`);
  console.log(`Skipped (invalid): ${result.skipped}`);
  console.log(`Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log("\nErrors:");
    result.errors.forEach(e => console.log(`  - ${e}`));
  }
  
  console.log(`\n✅ Sync completed at ${result.lastSyncTime.toISOString()}`);
  console.log(`   Total synced: ${result.inserted + result.updated} applications`);
} catch (err) {
  console.error("❌ Sync failed:", err);
  process.exit(1);
}
