/**
 * Daily Snapshot Job
 * Runs every night at 2 AM to save campaign metrics for historical tracking
 */
import { getDb } from "../db";
import { campaigns, campaignMetrics } from "../../drizzle/schema";

export async function runDailySnapshot() {
  console.log("[Daily Snapshot] Starting campaign metrics snapshot...");
  console.log("[Daily Snapshot] Environment check:", { NODE_ENV: process.env.NODE_ENV });
  
  try {
    // Fetch all active campaigns
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    const allCampaigns = await db.select().from(campaigns);
    
    const snapshotDate = new Date();
    const snapshots = [];
    
    for (const campaign of allCampaigns) {
      // Calculate current metrics
      const spend = Number(campaign.actualSpend) || Number(campaign.metaAdsSpend) || 0;
      const revenue = Number(campaign.actualRevenue) || 0;
      const conversions = Number(campaign.actualConversions) || 0;
      const leads = Number(campaign.actualApplications) || 0; // Using actualApplications as leads
      const impressions = 0; // Not available in campaigns table
      const clicks = 0; // Not available in campaigns table
      const goalCurrent = Number(campaign.goalActual) || 0;
      const goalTarget = Number(campaign.goalTarget) || 0;
      
      const snapshot = {
        campaignId: campaign.id,
        snapshotDate: snapshotDate,
        spend: spend.toFixed(2),
        revenue: revenue.toFixed(2),
        conversions,
        leads,
        impressions,
        clicks,
        goalCurrent,
        goalTarget,
        // Calculated metrics
        roi: (revenue && spend ? ((revenue - spend) / spend) * 100 : 0).toFixed(2),
        roas: (revenue && spend ? revenue / spend : 0).toFixed(2),
        ctr: (impressions && clicks ? (clicks / impressions) * 100 : 0).toFixed(4),
        cpc: (clicks && spend ? spend / clicks : 0).toFixed(2),
        cpl: (leads && spend ? spend / leads : 0).toFixed(2),
        conversionRate: (clicks && conversions ? (conversions / clicks) * 100 : 0).toFixed(4),
      };
      
      snapshots.push(snapshot);
    }
    
    // Save all snapshots to database
    if (snapshots.length > 0) {
      await db.insert(campaignMetrics).values(snapshots);
      console.log(`[Daily Snapshot] Saved ${snapshots.length} campaign snapshots`);
    }
    
    return {
      success: true,
      snapshotCount: snapshots.length,
      date: snapshotDate,
    };
  } catch (error) {
    console.error("[Daily Snapshot] Error:", error);
    throw error;
  }
}

// For manual testing, run: node --loader ts-node/esm server/jobs/dailySnapshot.ts

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDailySnapshot()
    .then((result) => {
      console.log("✅ Snapshot completed:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Snapshot failed:", error);
      process.exit(1);
    });
}
