/**
 * Update campaigns DB with latest Meta Ads spend from MCP refresh
 */
import { getDb } from "./server/db.ts";
import { campaigns } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.error("DB not available"); process.exit(1); }

  // Update PBGA Junior Summer Camp: $290.16 (latest from MCP)
  await db.update(campaigns).set({ 
    actualSpend: "290.16",
    metaAdsSpend: "290.16"
  }).where(eq(campaigns.id, 1));
  console.log("ID=1 PBGA Junior Summer Camp → $290.16");

  // Update Annual Membership Giveaway: A1 ($341.29) + A2 ($120.89) = $462.18
  await db.update(campaigns).set({ 
    actualSpend: "462.18",
    metaAdsSpend: "462.18"
  }).where(eq(campaigns.id, 5));
  console.log("ID=5 Annual Membership Giveaway → $462.18 (A1: $341.29 + A2: $120.89)");

  // Verify final state
  console.log("\n=== FINAL STATE ===");
  const all = await db.select().from(campaigns).orderBy(campaigns.id);
  for (const r of all) {
    console.log(`ID=${r.id} | ${r.name} | status=${r.status} | spend=${r.actualSpend} | metaSpend=${r.metaAdsSpend}`);
  }
  
  const totalSpend = all.reduce((sum, r) => sum + parseFloat(r.actualSpend || '0'), 0);
  const totalMetaSpend = all.reduce((sum, r) => sum + parseFloat(r.metaAdsSpend || '0'), 0);
  const active = all.filter(r => r.status === 'active').length;
  const completed = all.filter(r => r.status === 'completed').length;
  const paused = all.filter(r => r.status === 'paused').length;
  console.log(`\nTotal: ${all.length} programs (${active} active, ${completed} completed, ${paused} paused)`);
  console.log(`Total Spend: $${totalSpend.toFixed(2)} | Total Meta Ads Spend: $${totalMetaSpend.toFixed(2)}`);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
