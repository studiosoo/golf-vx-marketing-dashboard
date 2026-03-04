/**
 * Autonomous Marketing Intelligence Engine — Main Entry Point
 *
 * Real Meta Ads API integration + Action Execution Engine:
 * - Syncs live campaign data from Meta Ads API via existing metaAds.ts
 * - Analyzes performance with LLM + rule-based fallback
 * - Low-risk actions (budget decreases) → auto-execute via Meta Ads API
 * - Medium/High-risk actions (budget increases, email sends) → hold for approval
 * - Insufficient data → monitor only
 * - On approve: executes the action (Meta Ads budget change, Encharge email, Owner notification)
 */

import { eq, desc, inArray, and, lt, or, sql } from "drizzle-orm";
import { getDb } from "../db";
import { autonomousSyncStatus, autonomousActions } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

import { CampaignMetrics, GeneratedAction, ActionExecutionResult } from "./types";
import { determineStatus } from "./riskClassifier";
import { analyzeWithLLM, analyzeWithRules } from "./ruleEngine";
import { executeAction } from "./executor";

// Re-export all public types and functions for backward compatibility
export type { CampaignMetrics, GeneratedAction, ActionExecutionResult };
export { classifyRisk, determineStatus, LOW_RISK_ACTIONS, HIGH_RISK_ACTIONS, MONITOR_ACTIONS } from "./riskClassifier";
export { analyzeWithRules, analyzeWithLLM } from "./ruleEngine";
export { executeAction } from "./executor";

// ─── Core Engine: Sync → Analyze → Act ───────────────────────────────────────

export async function runAutonomousCycle(): Promise<{ actionsCreated: number; summary: string; executionResults: ActionExecutionResult[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await upsertSyncStatus(db, "meta_ads", "syncing");

  try {
    // Auto-dismiss stale pending_approval actions older than 3 days
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await db
      .update(autonomousActions)
      .set({ status: "dismissed" })
      .where(
        and(
          eq(autonomousActions.status, "pending_approval"),
          lt(autonomousActions.createdAt, threeDaysAgo)
        )
      );

    // Also dismiss stale monitoring actions older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await db
      .update(autonomousActions)
      .set({ status: "dismissed" })
      .where(
        and(
          eq(autonomousActions.status, "monitoring"),
          lt(autonomousActions.createdAt, sevenDaysAgo)
        )
      );

    const campaigns = await fetchCampaignData();

    let actions: GeneratedAction[];
    try {
      actions = await analyzeWithLLM(campaigns);
    } catch {
      actions = analyzeWithRules(campaigns);
    }

    if (actions.length === 0) {
      await upsertSyncStatus(db, "meta_ads", "success", campaigns.length);
      return { actionsCreated: 0, summary: "No optimization actions needed at this time.", executionResults: [] };
    }

    let autoExecuted = 0;
    let pendingApproval = 0;
    let monitoring = 0;
    const executionResults: ActionExecutionResult[] = [];

    for (const action of actions) {
      const status = determineStatus(action.riskLevel);
      const now = Date.now();

      // Deduplication: skip if there's already an active pending_approval or monitoring action
      // for the same campaign + actionType (prevents duplicate cards on re-sync)
      if (status === "pending_approval" || status === "monitoring") {
        const existing = await db
          .select({ id: autonomousActions.id })
          .from(autonomousActions)
          .where(
            and(
              eq(autonomousActions.campaignId, action.campaignId),
              eq(autonomousActions.actionType, action.actionType),
              eq(autonomousActions.status, status)
            )
          )
          .limit(1);
        if (existing.length > 0) {
          // Already have an active action for this campaign+type, skip
          if (status === "pending_approval") pendingApproval++;
          else monitoring++;
          continue;
        }
      }

      // For auto-executed actions, actually execute them
      let executionResult: ActionExecutionResult | null = null;
      if (status === "auto_executed") {
        executionResult = await executeAction(action.actionType, action.actionParams, action.campaignId, action.campaignName);
        executionResults.push(executionResult);
      }

      await db.insert(autonomousActions).values({
        campaignId: action.campaignId,
        campaignName: action.campaignName,
        actionType: action.actionType,
        riskLevel: action.riskLevel,
        status: executionResult && !executionResult.success ? "execution_failed" : status,
        title: action.title,
        description: action.description,
        actionParams: action.actionParams,
        triggerData: action.triggerData,
        confidence: action.confidence,
        expectedImpact: action.expectedImpact,
        executedAt: status === "auto_executed" ? now : null,
        executionResult: executionResult ? (executionResult as unknown as Record<string, unknown>) : null,
      });

      if (status === "auto_executed") autoExecuted++;
      else if (status === "pending_approval") pendingApproval++;
      else monitoring++;
    }

    await upsertSyncStatus(db, "meta_ads", "success", campaigns.length);

    // Notify owner about pending approvals
    if (pendingApproval > 0) {
      try {
        await notifyOwner({
          title: `Marketing: ${pendingApproval} Actions Awaiting Approval`,
          content: `The autonomous marketing engine generated ${actions.length} actions:\n- ${autoExecuted} auto-executed (low risk)\n- ${pendingApproval} awaiting your approval\n- ${monitoring} monitoring\n\nVisit the Marketing Intelligence dashboard to review.`,
        });
      } catch (e) {
        console.warn("[Autonomous] Failed to notify owner:", e);
      }
    }

    const summary = `Cycle complete: ${autoExecuted} auto-executed, ${pendingApproval} pending approval, ${monitoring} monitoring`;
    return { actionsCreated: actions.length, summary, executionResults };

  } catch (error: any) {
    await upsertSyncStatus(db, "meta_ads", "error", 0, error.message);
    throw error;
  }
}

// ─── Meta Ads Data Fetching (Real API Integration) ───────────────────────────

async function fetchCampaignData(): Promise<CampaignMetrics[]> {
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  const accountId = process.env.META_ADS_ACCOUNT_ID;

  if (accessToken && accountId) {
    try {
      console.log("[Autonomous] Fetching live data from Meta Ads API...");
      return await fetchFromMetaAdsReal();
    } catch (error) {
      console.warn("[Autonomous] Meta Ads API failed, trying cache fallback:", error);
    }
  } else {
    console.log("[Autonomous] Meta Ads credentials not configured, trying cache");
  }

  // Try cache fallback before demo data
  try {
    const { getAllCampaignsFromCache } = await import('../metaAdsCache');
    const cached = getAllCampaignsFromCache();
    if (cached.length > 0) {
      console.log(`[Autonomous] Using cached Meta Ads data (${cached.length} campaigns)`);
      return cached
        .filter((c: any) => !((c.campaign_name || '').toLowerCase().includes('studio soo') || (c.campaign_name || '').toLowerCase().includes('portrait')))
        .map((c: any) => ({
          campaignId: c.campaign_id || '',
          campaignName: c.campaign_name || '',
          status: c.status || 'ACTIVE',
          spend: parseFloat(c.spend || '0'),
          impressions: parseInt(c.impressions || '0'),
          clicks: parseInt(c.clicks || '0'),
          conversions: parseInt(c.conversions || '0'),
          ctr: parseFloat(c.ctr || '0'),
          cpc: parseFloat(c.cpc || '0'),
          cpm: parseFloat(c.cpm || '0'),
          roas: 0,
          dailyBudget: c.daily_budget ? parseInt(c.daily_budget) / 100 : 0,
          lifetimeBudget: 0,
        }));
    }
  } catch (cacheError) {
    console.warn('[Autonomous] Cache fallback also failed:', cacheError);
  }

  return getDemoCampaignData();
}

/**
 * Fetch real campaign data using existing metaAds.ts functions
 */
async function fetchFromMetaAdsReal(): Promise<CampaignMetrics[]> {
  const { getCampaigns, getCampaignInsights, getCampaignBudget } = await import("../metaAds");

  const campaigns = await getCampaigns();
  const metrics: CampaignMetrics[] = [];

  for (const campaign of campaigns) {
    // Skip Studio Soo portrait business campaigns
    const name = (campaign.name || "").toLowerCase();
    if (name.includes("studio soo") || name.includes("portrait")) continue;

    try {
      // Get lifetime insights
      const insights = await getCampaignInsights(campaign.id, "lifetime");

      // Get budget info
      let dailyBudget = 0;
      let lifetimeBudget = 0;
      try {
        const budgetInfo = await getCampaignBudget(campaign.id);
        dailyBudget = parseInt(budgetInfo.daily_budget || "0") / 100;
        lifetimeBudget = parseInt(budgetInfo.lifetime_budget || "0") / 100;
      } catch {
        // Budget info may not be available for all campaigns
      }

      const spend = parseFloat(insights.spend || "0");
      const conversions = parseInt(insights.conversions || "0");
      const revenue = conversions * 50; // Estimate $50 per conversion for Golf VX

      metrics.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        status: campaign.status,
        spend,
        impressions: parseInt(insights.impressions || "0"),
        clicks: parseInt(insights.clicks || "0"),
        conversions,
        ctr: parseFloat(insights.ctr || "0"),
        cpc: parseFloat(insights.cpc || "0"),
        cpm: parseFloat(insights.cpm || "0"),
        roas: spend > 0 ? revenue / spend : 0,
        dailyBudget,
        lifetimeBudget,
      });
    } catch (error) {
      console.warn(`[Autonomous] Failed to get insights for campaign ${campaign.name}:`, error);
    }
  }

  console.log(`[Autonomous] Fetched ${metrics.length} campaigns from Meta Ads API`);
  return metrics;
}

function getDemoCampaignData(): CampaignMetrics[] {
  return [
    {
      campaignId: "demo_junior_summer_camp",
      campaignName: "Junior Summer Camp 2026",
      status: "ACTIVE",
      spend: 45.20, impressions: 3200, clicks: 89, conversions: 0,
      ctr: 2.78, cpc: 0.51, cpm: 14.13, roas: 0,
      dailyBudget: 15, lifetimeBudget: 300,
    },
    {
      campaignId: "demo_anniversary_giveaway",
      campaignName: "Anniversary Giveaway 2026",
      status: "ACTIVE",
      spend: 70.50, impressions: 8500, clicks: 245, conversions: 12,
      ctr: 2.88, cpc: 0.29, cpm: 8.29, roas: 4.2,
      dailyBudget: 20, lifetimeBudget: 400,
    },
    {
      campaignId: "demo_trial_session",
      campaignName: "Trial Session - Spring Push",
      status: "ACTIVE",
      spend: 105.00, impressions: 12000, clicks: 180, conversions: 5,
      ctr: 1.50, cpc: 0.58, cpm: 8.75, roas: 2.8,
      dailyBudget: 25, lifetimeBudget: 500,
    },
    {
      campaignId: "demo_membership_retention",
      campaignName: "Member Retention - Drive Days",
      status: "ACTIVE",
      spend: 8.50, impressions: 350, clicks: 12, conversions: 0,
      ctr: 3.43, cpc: 0.71, cpm: 24.29, roas: 0,
      dailyBudget: 10, lifetimeBudget: 200,
    },
    {
      campaignId: "demo_corporate_events",
      campaignName: "Corporate Events B2B",
      status: "ACTIVE",
      spend: 0, impressions: 0, clicks: 0, conversions: 0,
      ctr: 0, cpc: 0, cpm: 0, roas: 0,
      dailyBudget: 15, lifetimeBudget: 300,
    },
    {
      campaignId: "demo_instagram_growth",
      campaignName: "Instagram Follower Growth",
      status: "ACTIVE",
      spend: 35.00, impressions: 15000, clicks: 420, conversions: 0,
      ctr: 2.80, cpc: 0.08, cpm: 2.33, roas: 0,
      dailyBudget: 10, lifetimeBudget: 200,
    },
    {
      campaignId: "demo_winter_clinic",
      campaignName: "Winter Clinic Promo",
      status: "PAUSED",
      spend: 266.00, impressions: 22000, clicks: 580, conversions: 18,
      ctr: 2.64, cpc: 0.46, cpm: 12.09, roas: 3.5,
      dailyBudget: 0, lifetimeBudget: 300,
    },
  ];
}

// ─── DB Helper Functions ──────────────────────────────────────────────────────

async function upsertSyncStatus(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  source: string,
  status: "idle" | "syncing" | "success" | "error",
  recordCount?: number,
  errorMessage?: string
) {
  const now = Date.now();
  const nextSync = now + 12 * 60 * 60 * 1000;

  const existing = await db.select().from(autonomousSyncStatus).where(eq(autonomousSyncStatus.source, source)).limit(1);

  if (existing.length > 0) {
    await db.update(autonomousSyncStatus)
      .set({
        status,
        lastSyncAt: status === "success" ? now : existing[0].lastSyncAt,
        nextSyncAt: nextSync,
        recordCount: recordCount ?? 0,
        errorMessage: errorMessage ?? null,
        metadata: { lastRunAt: now },
      })
      .where(eq(autonomousSyncStatus.source, source));
  } else {
    await db.insert(autonomousSyncStatus).values({
      source,
      status,
      lastSyncAt: status === "success" ? now : null,
      nextSyncAt: nextSync,
      recordCount: recordCount ?? 0,
      errorMessage: errorMessage ?? null,
      metadata: { lastRunAt: now },
    });
  }
}

// ─── Query Functions for tRPC ─────────────────────────────────────────────────

export async function getSyncStatusAll() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autonomousSyncStatus);
}

export async function getActionsByStatus(status: string | string[]) {
  const db = await getDb();
  if (!db) return [];
  const statuses = Array.isArray(status) ? status : [status];
  return db.select()
    .from(autonomousActions)
    .where(inArray(autonomousActions.status, statuses as any))
    .orderBy(desc(autonomousActions.createdAt));
}

export async function getAutoExecutedActions() {
  return getActionsByStatus(["auto_executed", "execution_failed"]);
}

export async function getPendingApprovalActions() {
  return getActionsByStatus("pending_approval");
}

export async function getMonitoringActions() {
  return getActionsByStatus("monitoring");
}

/**
 * Approve and execute a pending action
 */
export async function approveAction(actionId: number, reviewerName: string): Promise<{ success: boolean; executionResult?: ActionExecutionResult }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the action details
  const [action] = await db.select().from(autonomousActions).where(eq(autonomousActions.id, actionId)).limit(1);
  if (!action) throw new Error("Action not found");
  if (action.status !== "pending_approval") throw new Error("Action is not pending approval");

  // Execute the action
  const executionResult = await executeAction(
    action.actionType,
    (action.actionParams as Record<string, unknown>) || {},
    action.campaignId,
    action.campaignName
  );

  // Update DB with result
  await db.update(autonomousActions)
    .set({
      status: executionResult.success ? "approved" : "execution_failed",
      reviewedBy: reviewerName,
      reviewedAt: Date.now(),
      executedAt: executionResult.success ? Date.now() : null,
      executionResult: executionResult as unknown as Record<string, unknown>,
    })
    .where(eq(autonomousActions.id, actionId));

  return { success: executionResult.success, executionResult };
}

export async function rejectAction(actionId: number, reviewerName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(autonomousActions)
    .set({ status: "rejected", reviewedBy: reviewerName, reviewedAt: Date.now() })
    .where(eq(autonomousActions.id, actionId));
  return { success: true };
}

export async function undoAction(actionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(autonomousActions)
    .set({ status: "undone", reviewedAt: Date.now() })
    .where(eq(autonomousActions.id, actionId));
  return { success: true };
}

export async function dismissAction(actionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(autonomousActions)
    .set({ status: "dismissed", reviewedAt: Date.now() })
    .where(eq(autonomousActions.id, actionId));
  return { success: true };
}

export async function getAllActions() {
  const db = await getDb();
  if (!db) return [];
  // Exclude archived actions from the main view
  return db.select().from(autonomousActions)
    .where(sql`${autonomousActions.status} != 'archived'`)
    .orderBy(desc(autonomousActions.createdAt));
}

export async function getArchivedActions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autonomousActions)
    .where(sql`${autonomousActions.status} = 'archived'`)
    .orderBy(desc(autonomousActions.createdAt))
    .limit(200);
}
