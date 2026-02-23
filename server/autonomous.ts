/**
 * Autonomous Marketing Intelligence Engine
 * 
 * Analyzes campaign data and generates optimization actions:
 * - Low-risk actions (budget decreases) → auto-execute
 * - Medium/High-risk actions (budget increases, email sends) → hold for approval
 * - Insufficient data → monitor only
 */

import { eq, desc, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { autonomousSyncStatus, autonomousActions } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  dailyBudget: number;
  lifetimeBudget: number;
}

export interface GeneratedAction {
  campaignId: string;
  campaignName: string;
  actionType: string;
  riskLevel: "low" | "medium" | "high" | "monitor";
  title: string;
  description: string;
  actionParams: Record<string, unknown>;
  triggerData: Record<string, unknown>;
  confidence: number;
  expectedImpact: string;
}

// ─── Risk Classification ─────────────────────────────────────────────────────

const LOW_RISK_ACTIONS = ["budget_decrease", "pause_underperformer", "reduce_frequency"];
const HIGH_RISK_ACTIONS = ["budget_increase", "send_email", "change_targeting", "launch_campaign"];
const MONITOR_ACTIONS = ["monitor", "collect_data", "wait_for_data"];

export function classifyRisk(actionType: string): "low" | "medium" | "high" | "monitor" {
  if (MONITOR_ACTIONS.includes(actionType)) return "monitor";
  if (LOW_RISK_ACTIONS.includes(actionType)) return "low";
  if (HIGH_RISK_ACTIONS.includes(actionType)) return "high";
  return "medium";
}

export function determineStatus(riskLevel: string): "auto_executed" | "pending_approval" | "monitoring" {
  switch (riskLevel) {
    case "low": return "auto_executed";
    case "monitor": return "monitoring";
    default: return "pending_approval";
  }
}

// ─── Rule-Based Analysis (Fallback) ──────────────────────────────────────────

export function analyzeWithRules(campaigns: CampaignMetrics[]): GeneratedAction[] {
  const actions: GeneratedAction[] = [];

  for (const c of campaigns) {
    if (c.status !== "ACTIVE" && c.status !== "active") continue;

    // Insufficient data → monitor
    if (c.impressions < 500 || c.spend < 10) {
      actions.push({
        campaignId: c.campaignId,
        campaignName: c.campaignName,
        actionType: "collect_data",
        riskLevel: "monitor",
        title: `Monitor: ${c.campaignName} — Insufficient Data`,
        description: `Campaign has only ${c.impressions} impressions and $${c.spend.toFixed(2)} spend. Need more data before making optimization decisions.`,
        actionParams: { minImpressions: 1000, minSpend: 25 },
        triggerData: { impressions: c.impressions, spend: c.spend, clicks: c.clicks },
        confidence: 90,
        expectedImpact: "Data collection will enable informed optimization decisions within 3-5 days.",
      });
      continue;
    }

    // High CTR but low conversions → targeting issue
    if (c.ctr > 2.0 && c.conversions === 0 && c.spend > 20) {
      actions.push({
        campaignId: c.campaignId,
        campaignName: c.campaignName,
        actionType: "change_targeting",
        riskLevel: "high",
        title: `Review Targeting: ${c.campaignName}`,
        description: `High CTR (${c.ctr.toFixed(2)}%) but 0 conversions after $${c.spend.toFixed(2)} spend. The ad creative attracts clicks but the landing page or audience may not be converting.`,
        actionParams: { suggestedAction: "Review landing page and audience targeting" },
        triggerData: { ctr: c.ctr, conversions: c.conversions, spend: c.spend, clicks: c.clicks },
        confidence: 75,
        expectedImpact: "Fixing the conversion funnel could yield 2-5% conversion rate from existing traffic.",
      });
    }

    // Very low CTR → creative issue, reduce budget
    if (c.ctr < 0.5 && c.impressions > 1000) {
      actions.push({
        campaignId: c.campaignId,
        campaignName: c.campaignName,
        actionType: "budget_decrease",
        riskLevel: "low",
        title: `Reduce Budget: ${c.campaignName} — Low CTR`,
        description: `CTR is only ${c.ctr.toFixed(2)}% (benchmark: 1-2%). Reducing budget by 25% until creative is refreshed.`,
        actionParams: { budgetChange: -0.25, reason: "low_ctr" },
        triggerData: { ctr: c.ctr, impressions: c.impressions, cpc: c.cpc },
        confidence: 85,
        expectedImpact: `Save ~$${(c.dailyBudget * 0.25).toFixed(2)}/day while creative is being optimized.`,
      });
    }

    // High CPC → budget efficiency issue
    if (c.cpc > 5.0 && c.clicks > 10) {
      actions.push({
        campaignId: c.campaignId,
        campaignName: c.campaignName,
        actionType: "budget_decrease",
        riskLevel: "low",
        title: `Optimize CPC: ${c.campaignName}`,
        description: `CPC of $${c.cpc.toFixed(2)} is above the $5.00 threshold. Reducing budget to improve efficiency.`,
        actionParams: { budgetChange: -0.20, reason: "high_cpc" },
        triggerData: { cpc: c.cpc, clicks: c.clicks, spend: c.spend },
        confidence: 80,
        expectedImpact: "Reducing spend on expensive clicks can improve overall ROAS.",
      });
    }

    // Strong performer → increase budget
    if (c.roas > 3.0 && c.conversions > 2 && c.spend > 30) {
      actions.push({
        campaignId: c.campaignId,
        campaignName: c.campaignName,
        actionType: "budget_increase",
        riskLevel: "high",
        title: `Scale Up: ${c.campaignName} — Strong ROAS`,
        description: `ROAS of ${c.roas.toFixed(1)}x with ${c.conversions} conversions. Recommend increasing daily budget by 30% to capture more conversions.`,
        actionParams: { budgetChange: 0.30, reason: "strong_roas" },
        triggerData: { roas: c.roas, conversions: c.conversions, spend: c.spend },
        confidence: 80,
        expectedImpact: `Scaling a ${c.roas.toFixed(1)}x ROAS campaign could yield additional revenue proportionally.`,
      });
    }

    // Good CTR + conversions → send follow-up email
    if (c.ctr > 1.5 && c.conversions > 0) {
      actions.push({
        campaignId: c.campaignId,
        campaignName: c.campaignName,
        actionType: "send_email",
        riskLevel: "high",
        title: `Email Follow-up: ${c.campaignName} Converters`,
        description: `${c.conversions} conversions detected. Recommend sending a nurture email sequence to new leads.`,
        actionParams: { emailType: "nurture_sequence", targetAudience: "recent_converters" },
        triggerData: { conversions: c.conversions, ctr: c.ctr },
        confidence: 70,
        expectedImpact: "Email nurture sequences typically convert 15-25% of leads into paying customers.",
      });
    }
  }

  return actions;
}

// ─── LLM-Powered Analysis ────────────────────────────────────────────────────

export async function analyzeWithLLM(campaigns: CampaignMetrics[]): Promise<GeneratedAction[]> {
  try {
    const campaignSummary = campaigns.map(c =>
      `- ${c.campaignName} (${c.status}): Spend=$${c.spend.toFixed(2)}, Impressions=${c.impressions}, Clicks=${c.clicks}, CTR=${c.ctr.toFixed(2)}%, CPC=$${c.cpc.toFixed(2)}, Conversions=${c.conversions}, ROAS=${c.roas.toFixed(1)}x, DailyBudget=$${c.dailyBudget}`
    ).join("\n");

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a marketing optimization AI for Golf VX Arlington Heights, an indoor golf simulator facility.
Analyze campaign performance data and generate specific optimization actions.
IMPORTANT: Do NOT consider anything related to 'Studio Soo portrait business' Meta ad account.

For each action, classify the risk level:
- "low": Safe to auto-execute (budget decreases, pausing underperformers)
- "medium": Needs review (audience adjustments, creative changes)
- "high": Requires approval (budget increases, email sends, new campaigns)
- "monitor": Insufficient data, just watch

Return a JSON object with an "actions" array. Each action must have: campaignId, campaignName, actionType, riskLevel, title, description, confidence (0-100), expectedImpact.`
        },
        {
          role: "user",
          content: `Analyze these Golf VX campaigns and generate optimization actions:\n\n${campaignSummary}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "campaign_actions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              actions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    campaignId: { type: "string" },
                    campaignName: { type: "string" },
                    actionType: { type: "string" },
                    riskLevel: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    confidence: { type: "integer" },
                    expectedImpact: { type: "string" }
                  },
                  required: ["campaignId", "campaignName", "actionType", "riskLevel", "title", "description", "confidence", "expectedImpact"],
                  additionalProperties: false
                }
              }
            },
            required: ["actions"],
            additionalProperties: false
          }
        }
      }
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("No LLM response content");
    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

    const parsed = JSON.parse(content);
    return (parsed.actions || []).map((a: any) => ({
      campaignId: a.campaignId,
      campaignName: a.campaignName,
      actionType: a.actionType,
      riskLevel: classifyRisk(a.actionType),
      title: a.title,
      description: a.description,
      actionParams: {},
      triggerData: {},
      confidence: a.confidence,
      expectedImpact: a.expectedImpact,
    }));
  } catch (error) {
    console.warn("[Autonomous] LLM analysis failed, falling back to rules:", error);
    return analyzeWithRules(campaigns);
  }
}

// ─── Core Engine: Sync → Analyze → Act ───────────────────────────────────────

export async function runAutonomousCycle(): Promise<{ actionsCreated: number; summary: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await upsertSyncStatus(db, "meta_ads", "syncing");

  try {
    const campaigns = await fetchCampaignData();

    let actions: GeneratedAction[];
    try {
      actions = await analyzeWithLLM(campaigns);
    } catch {
      actions = analyzeWithRules(campaigns);
    }

    if (actions.length === 0) {
      await upsertSyncStatus(db, "meta_ads", "success", campaigns.length);
      return { actionsCreated: 0, summary: "No optimization actions needed at this time." };
    }

    let autoExecuted = 0;
    let pendingApproval = 0;
    let monitoring = 0;

    for (const action of actions) {
      const status = determineStatus(action.riskLevel);
      const now = Date.now();

      await db.insert(autonomousActions).values({
        campaignId: action.campaignId,
        campaignName: action.campaignName,
        actionType: action.actionType,
        riskLevel: action.riskLevel,
        status,
        title: action.title,
        description: action.description,
        actionParams: action.actionParams,
        triggerData: action.triggerData,
        confidence: action.confidence,
        expectedImpact: action.expectedImpact,
        executedAt: status === "auto_executed" ? now : null,
      });

      if (status === "auto_executed") autoExecuted++;
      else if (status === "pending_approval") pendingApproval++;
      else monitoring++;
    }

    await upsertSyncStatus(db, "meta_ads", "success", campaigns.length);

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
    return { actionsCreated: actions.length, summary };

  } catch (error: any) {
    await upsertSyncStatus(db, "meta_ads", "error", 0, error.message);
    throw error;
  }
}

// ─── Meta Ads Data Fetching ──────────────────────────────────────────────────

async function fetchCampaignData(): Promise<CampaignMetrics[]> {
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  const accountId = process.env.META_ADS_ACCOUNT_ID;

  if (accessToken && accountId) {
    try {
      return await fetchFromMetaAds(accessToken, accountId);
    } catch (error) {
      console.warn("[Autonomous] Meta Ads API failed, using demo data:", error);
    }
  }

  return getDemoCampaignData();
}

async function fetchFromMetaAds(accessToken: string, accountId: string): Promise<CampaignMetrics[]> {
  const url = `https://graph.facebook.com/v21.0/act_${accountId}/campaigns?fields=name,status,insights.date_preset(lifetime){spend,impressions,clicks,actions,ctr,cpc,cpm}&access_token=${accessToken}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Meta API error: ${response.status}`);

  const data = await response.json();

  return (data.data || [])
    .filter((c: any) => {
      const name = (c.name || "").toLowerCase();
      return !name.includes("studio soo") && !name.includes("portrait");
    })
    .map((c: any) => {
      const insights = c.insights?.data?.[0] || {};
      const conversions = (insights.actions || [])
        .filter((a: any) => ["lead", "complete_registration", "purchase"].includes(a.action_type))
        .reduce((sum: number, a: any) => sum + parseInt(a.value || "0"), 0);

      return {
        campaignId: c.id,
        campaignName: c.name,
        status: c.status,
        spend: parseFloat(insights.spend || "0"),
        impressions: parseInt(insights.impressions || "0"),
        clicks: parseInt(insights.clicks || "0"),
        conversions,
        ctr: parseFloat(insights.ctr || "0"),
        cpc: parseFloat(insights.cpc || "0"),
        cpm: parseFloat(insights.cpm || "0"),
        roas: 0,
        dailyBudget: 0,
        lifetimeBudget: 0,
      };
    });
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

// ─── DB Helper Functions ─────────────────────────────────────────────────────

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

// ─── Query Functions for tRPC ────────────────────────────────────────────────

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
  return getActionsByStatus("auto_executed");
}

export async function getPendingApprovalActions() {
  return getActionsByStatus("pending_approval");
}

export async function getMonitoringActions() {
  return getActionsByStatus("monitoring");
}

export async function approveAction(actionId: number, reviewerName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(autonomousActions)
    .set({ status: "approved", reviewedBy: reviewerName, reviewedAt: Date.now(), executedAt: Date.now() })
    .where(eq(autonomousActions.id, actionId));
  return { success: true };
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

export async function getAllActions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autonomousActions).orderBy(desc(autonomousActions.createdAt));
}
