import { getDb } from "./server/db";
import { giveawayApplications } from "./drizzle/schema";
import { sql, isNull, isNotNull, eq } from "drizzle-orm";

const db = await getDb();
if (!db) { console.log("No DB"); process.exit(1); }

const total = await db.select({ count: sql<number>`COUNT(*)` }).from(giveawayApplications);
const withId = await db.select({ count: sql<number>`COUNT(*)` }).from(giveawayApplications).where(isNotNull(giveawayApplications.googleSheetRowId));
const withoutId = await db.select({ count: sql<number>`COUNT(*)` }).from(giveawayApplications).where(isNull(giveawayApplications.googleSheetRowId));
const nonTest = await db.select({ count: sql<number>`COUNT(*)` }).from(giveawayApplications).where(eq(giveawayApplications.isTestEntry, false));

console.log("=== Giveaway Applications DB Status ===");
console.log("Total:", total[0].count);
console.log("With googleSheetRowId:", withId[0].count);
console.log("Without googleSheetRowId (legacy):", withoutId[0].count);
console.log("Non-test entries:", nonTest[0].count);

// Show last 5 entries
const recent = await db.select({
  id: giveawayApplications.id,
  name: giveawayApplications.name,
  email: giveawayApplications.email,
  googleSheetRowId: giveawayApplications.googleSheetRowId,
  isTestEntry: giveawayApplications.isTestEntry,
  submissionTimestamp: giveawayApplications.submissionTimestamp,
}).from(giveawayApplications)
  .orderBy(sql`id DESC`)
  .limit(5);

console.log("\nLast 5 entries:");
recent.forEach(r => {
  console.log(`  [${r.id}] ${r.name} | sheetRow=${r.googleSheetRowId} | test=${r.isTestEntry} | ts=${r.submissionTimestamp}`);
});

process.exit(0);
