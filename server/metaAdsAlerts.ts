import { getDb } from "./db";
import { campaignAlerts } from "../drizzle/schema";
import { getCampaignDailyInsights } from "./metaAds";
import { eq, and, desc } from "drizzle-orm";

interface AlertThresholds {
  lowCTR: number;        // e.g., 1.0 (%)
  highCPC: number;       // e.g., 2.0 (USD)
  budgetExceeded: number; // e.g., 1.2 (120% of budget)
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  lowCTR: 1.0,
  highCPC: 2.0,
  budgetExceeded: 1.2,
};

/**
 * Check campaign performance and create alerts if thresholds are violated
 */
export async function checkCampaignAlerts(
  campaignId: string,
  campaignName: string,
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Get last 7 days of insights
    const insights = await getCampaignDailyInsights(campaignId, 7);
    
    if (!insights || insights.length === 0) {
      return 0;
    }
    
    let alertsCreated = 0;
    
    // Calculate average metrics
    const avgCTR = insights.reduce((sum, day) => sum + parseFloat(day.ctr || "0"), 0) / insights.length;
    const avgCPC = insights.reduce((sum, day) => sum + parseFloat(day.cpc || "0"), 0) / insights.length;
    const totalSpend = insights.reduce((sum, day) => sum + parseFloat(day.spend || "0"), 0);
    const dailyAvgSpend = totalSpend / insights.length;
    
    // Check for low CTR
    if (avgCTR < thresholds.lowCTR) {
      const existingAlert = await db.select()
        .from(campaignAlerts)
        .where(
          and(
            eq(campaignAlerts.campaignId, campaignId),
            eq(campaignAlerts.alertType, "low_ctr"),
            eq(campaignAlerts.status, "active")
          )
        )
        .limit(1);
      
      if (existingAlert.length === 0) {
        await db.insert(campaignAlerts).values({
          campaignId,
          campaignName,
          alertType: "low_ctr",
          severity: avgCTR < thresholds.lowCTR * 0.5 ? "high" : "medium",
          message: `CTR (${avgCTR.toFixed(2)}%) is below the threshold of ${thresholds.lowCTR}%. Consider improving ad creative or targeting.`,
          threshold: thresholds.lowCTR.toString(),
          actualValue: avgCTR.toString(),
          status: "active",
        });
        alertsCreated++;
      }
    }
    
    // Check for high CPC
    if (avgCPC > thresholds.highCPC) {
      const existingAlert = await db.select()
        .from(campaignAlerts)
        .where(
          and(
            eq(campaignAlerts.campaignId, campaignId),
            eq(campaignAlerts.alertType, "high_cpc"),
            eq(campaignAlerts.status, "active")
          )
        )
        .limit(1);
      
      if (existingAlert.length === 0) {
        await db.insert(campaignAlerts).values({
          campaignId,
          campaignName,
          alertType: "high_cpc",
          severity: avgCPC > thresholds.highCPC * 1.5 ? "high" : "medium",
          message: `CPC ($${avgCPC.toFixed(2)}) exceeds the threshold of $${thresholds.highCPC}. Review bidding strategy and audience targeting.`,
          threshold: thresholds.highCPC.toString(),
          actualValue: avgCPC.toString(),
          status: "active",
        });
        alertsCreated++;
      }
    }
    
    // Check for budget exceeded (comparing daily average to expected daily budget)
    // Note: This is a simplified check. In production, you'd compare against actual campaign budget from Meta Ads API
    const expectedDailyBudget = 50; // This should come from campaign budget / campaign duration
    if (dailyAvgSpend > expectedDailyBudget * thresholds.budgetExceeded) {
      const existingAlert = await db.select()
        .from(campaignAlerts)
        .where(
          and(
            eq(campaignAlerts.campaignId, campaignId),
            eq(campaignAlerts.alertType, "budget_exceeded"),
            eq(campaignAlerts.status, "active")
          )
        )
        .limit(1);
      
      if (existingAlert.length === 0) {
        await db.insert(campaignAlerts).values({
          campaignId,
          campaignName,
          alertType: "budget_exceeded",
          severity: "critical",
          message: `Daily spend ($${dailyAvgSpend.toFixed(2)}) exceeds budget by ${((dailyAvgSpend / expectedDailyBudget - 1) * 100).toFixed(0)}%. Consider pausing or adjusting budget.`,
          threshold: (expectedDailyBudget * thresholds.budgetExceeded).toString(),
          actualValue: dailyAvgSpend.toString(),
          status: "active",
        });
        alertsCreated++;
      }
    }
    
    return alertsCreated;
  } catch (error) {
    console.error(`Error checking alerts for campaign ${campaignId}:`, error);
    return 0;
  }
}

/**
 * Check all active Meta Ads campaigns for alerts
 */
export async function checkAllCampaignAlerts(): Promise<{ checked: number; alertsCreated: number }> {
  try {
    const { getCampaigns } = await import("./metaAds");
    const campaigns = await getCampaigns();
    
    let checked = 0;
    let alertsCreated = 0;
    
    for (const campaign of campaigns) {
      if (campaign.status === "ACTIVE") {
        const alerts = await checkCampaignAlerts(campaign.id, campaign.name);
        alertsCreated += alerts;
        checked++;
      }
    }
    
    return { checked, alertsCreated };
  } catch (error) {
    console.error("Error checking all campaign alerts:", error);
    return { checked: 0, alertsCreated: 0 };
  }
}

/**
 * Get all active alerts
 */
export async function getActiveAlerts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select()
    .from(campaignAlerts)
    .where(eq(campaignAlerts.status, "active"))
    .orderBy(desc(campaignAlerts.createdAt));
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(campaignAlerts)
    .set({
      status: "acknowledged",
      acknowledgedAt: new Date(),
      notes,
    })
    .where(eq(campaignAlerts.id, alertId));
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(campaignAlerts)
    .set({
      status: "resolved",
      resolvedAt: new Date(),
      notes,
    })
    .where(eq(campaignAlerts.id, alertId));
}

/**
 * Get alerts for a specific campaign
 */
export async function getCampaignAlertsById(campaignId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select()
    .from(campaignAlerts)
    .where(eq(campaignAlerts.campaignId, campaignId))
    .orderBy(desc(campaignAlerts.createdAt));
}
