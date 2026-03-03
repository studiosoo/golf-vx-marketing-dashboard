/**
 * Fix programs: remove incorrect entries, update statuses, fix Meta Ads spend
 */
import { getDb } from "./server/db.ts";
import { campaigns, programCampaigns } from "./drizzle/schema.ts";
import { eq, sql, inArray } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.error("DB not available"); process.exit(1); }

  // 1. DELETE incorrect programs that don't exist
  console.log("=== REMOVING INCORRECT PROGRAMS ===");
  
  // Delete junction table entries first (foreign key)
  await db.delete(programCampaigns).where(inArray(programCampaigns.programId, [6, 8]));
  console.log("Removed junction entries for IDs 6 (Drive Day Competition), 8 (Corporate Events B2B)");
  
  // Delete the programs themselves
  await db.delete(campaigns).where(eq(campaigns.id, 6));
  console.log("Deleted ID=6 Drive Day Competition");
  await db.delete(campaigns).where(eq(campaigns.id, 8));
  console.log("Deleted ID=8 Corporate Events B2B");

  // 2. FIX STATUSES
  console.log("\n=== FIXING STATUSES ===");
  
  // Superbowl Watch Party → completed
  await db.update(campaigns).set({ status: "completed" }).where(eq(campaigns.id, 30001));
  console.log("ID=30001 Superbowl Watch Party → completed");
  
  // Instagram Follower Growth → paused (previous ad done, needs new strategy)
  await db.update(campaigns).set({ 
    status: "paused",
    description: "Previous IG $100 Giveaway ad completed ($43.24 spent, 8,854 engagements). Needs new ad strategy for continued follower growth."
  }).where(eq(campaigns.id, 7));
  console.log("ID=7 Instagram Follower Growth → paused");
  
  // PBGA Winter Clinic → completed (ended Jan 14, 2026 per Meta Ads)
  await db.update(campaigns).set({ status: "completed" }).where(eq(campaigns.id, 3));
  console.log("ID=3 PBGA Winter Clinic → completed");

  // 3. UPDATE META ADS SPEND with latest data
  console.log("\n=== UPDATING META ADS SPEND ===");
  
  // PBGA Junior Summer Camp: $290.07
  await db.update(campaigns).set({ 
    actualSpend: "290.07",
    metaAdsSpend: "290.07"
  }).where(eq(campaigns.id, 1));
  console.log("ID=1 PBGA Junior Summer Camp → $290.07");
  
  // Annual Membership Giveaway: A1 ($341.23) + A2 ($120.46) = $461.69
  await db.update(campaigns).set({ 
    actualSpend: "461.69",
    metaAdsSpend: "461.69",
    metaAdsCampaignId: "120239570172470217,120239627905950217"
  }).where(eq(campaigns.id, 5));
  console.log("ID=5 Annual Membership Giveaway → $461.69 (A1+A2)");
  
  // Superbowl Watch Party: $75.43 (confirmed)
  await db.update(campaigns).set({ 
    actualSpend: "75.43",
    metaAdsSpend: "75.43"
  }).where(eq(campaigns.id, 30001));
  console.log("ID=30001 Superbowl Watch Party → $75.43");

  // Instagram Follower Growth: link to IG Giveaway campaign
  await db.update(campaigns).set({ 
    actualSpend: "43.24",
    metaAdsSpend: "43.24",
    metaAdsCampaignId: "120238971719500217"
  }).where(eq(campaigns.id, 7));
  console.log("ID=7 Instagram Follower Growth → $43.24 (IG $100 Giveaway)");

  // 4. CLEAR fake metaAdsCampaignId values
  console.log("\n=== CLEARING FAKE META IDS ===");
  
  // Sunday Clinic, PBGA Winter Clinic, $25 Trial - had "test_meta_campaign_123"
  for (const id of [2, 3, 4]) {
    await db.update(campaigns).set({ 
      metaAdsCampaignId: null,
      metaAdsSpend: "0"
    }).where(eq(campaigns.id, id));
    console.log(`ID=${id} → cleared fake metaAdsCampaignId`);
  }

  // 5. Verify final state
  console.log("\n=== FINAL STATE ===");
  const all = await db.select().from(campaigns).orderBy(campaigns.id);
  for (const r of all) {
    console.log(`ID=${r.id} | ${r.name} | status=${r.status} | spend=${r.actualSpend} | metaSpend=${r.metaAdsSpend} | metaId=${r.metaAdsCampaignId}`);
  }
  console.log(`\nTotal: ${all.length} programs`);

  // Check junction table
  const mappings = await db.select().from(programCampaigns).orderBy(programCampaigns.programId);
  console.log("\n=== PROGRAM-CAMPAIGN MAPPINGS ===");
  for (const m of mappings) {
    console.log(`programId=${m.programId} → ${m.strategicCampaign}`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
