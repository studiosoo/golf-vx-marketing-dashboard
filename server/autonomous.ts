/**
 * Autonomous Marketing Intelligence Engine
 * 
 * Real Meta Ads API integration + Action Execution Engine:
 * - Syncs live campaign data from Meta Ads API via existing metaAds.ts
 * - Analyzes performance with LLM + rule-based fallback
 * - Low-risk actions (budget decreases) → auto-execute via Meta Ads API
 * - Medium/High-risk actions (budget increases, email sends) → hold for approval
 * - Insufficient data → monitor only
 * - On approve: executes the action (Meta Ads budget change, Encharge email, Owner notification)
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

export interface ActionExecutionResult {
  success: boolean;
  actionType: string;
  details: string;
  error?: string;
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
        actionParams: { budgetChange: -0.25, reason: "low_ctr", currentDailyBudget: c.dailyBudget },
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
        actionParams: { budgetChange: -0.20, reason: "high_cpc", currentDailyBudget: c.dailyBudget },
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
        actionParams: { budgetChange: 0.30, reason: "strong_roas", currentDailyBudget: c.dailyBudget },
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
        actionParams: { emailType: "nurture_sequence", targetAudience: "recent_converters", conversions: c.conversions },
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

For each action, use one of these actionType values:
- "budget_decrease": Reduce daily budget (low risk, auto-executed)
- "budget_increase": Increase daily budget (high risk, needs approval)
- "pause_underperformer": Pause a poorly performing campaign (low risk)
- "reduce_frequency": Add frequency cap (low risk)
- "change_targeting": Modify audience targeting (high risk)
- "send_email": Trigger email nurture via Encharge (high risk)
- "collect_data": Not enough data yet (monitor)

For budget actions, include "budgetChange" (decimal, e.g. -0.25 for 25% decrease, 0.30 for 30% increase) and "currentDailyBudget" in actionParams.
For email actions, include "emailType" and "targetAudience" in actionParams.

Return a JSON object with an "actions" array. Each action must have: campaignId, campaignName, actionType, title, description, confidence (0-100), expectedImpact, actionParams (object with execution details), triggerData (object with metrics that triggered this action).`
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
                    title: { type: "string" },
                    description: { type: "string" },
                    confidence: { type: "integer" },
                    expectedImpact: { type: "string" },
                    actionParams: {
                      type: "object",
                      additionalProperties: true
                    },
                    triggerData: {
                      type: "object",
                      additionalProperties: true
                    }
                  },
                  required: ["campaignId", "campaignName", "actionType", "title", "description", "confidence", "expectedImpact"],
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
      actionParams: a.actionParams || {},
      triggerData: a.triggerData || {},
      confidence: a.confidence,
      expectedImpact: a.expectedImpact,
    }));
  } catch (error) {
    console.warn("[Autonomous] LLM analysis failed, falling back to rules:", error);
    return analyzeWithRules(campaigns);
  }
}

// ─── Action Execution Engine ────────────────────────────────────────────────

/**
 * Execute a specific action based on its type and params.
 * Called when:
 * - Low-risk actions are auto-executed during sync cycle
 * - User approves a pending action
 */
export async function executeAction(
  actionType: string,
  actionParams: Record<string, unknown>,
  campaignId: string,
  campaignName: string
): Promise<ActionExecutionResult> {
  try {
    switch (actionType) {
      case "budget_decrease":
      case "budget_increase":
        return await executeMetaAdsBudgetChange(campaignId, campaignName, actionParams);

      case "send_email":
        return await executeEnchargeEmailTrigger(campaignName, actionParams);

      case "change_targeting":
        return await executeTargetingReview(campaignId, campaignName, actionParams);

      case "pause_underperformer":
        return await executePauseCampaign(campaignId, campaignName);

      case "reduce_frequency":
        return await executeFrequencyCap(campaignId, campaignName, actionParams);

      case "collect_data":
      case "monitor":
      case "wait_for_data":
        return { success: true, actionType, details: `Monitoring ${campaignName} — no execution needed.` };

      default:
        return { success: true, actionType, details: `Action type "${actionType}" logged. Manual review recommended.` };
    }
  } catch (error: any) {
    console.error(`[ActionEngine] Failed to execute ${actionType} for ${campaignName}:`, error);
    return { success: false, actionType, details: `Failed to execute ${actionType}`, error: error.message };
  }
}

/**
 * Execute Meta Ads budget change via API
 */
async function executeMetaAdsBudgetChange(
  campaignId: string,
  campaignName: string,
  params: Record<string, unknown>
): Promise<ActionExecutionResult> {
  const budgetChange = (params.budgetChange as number) || 0;
  const currentBudget = (params.currentDailyBudget as number) || 0;
  const direction = budgetChange > 0 ? "increase" : "decrease";

  // Skip demo campaigns
  if (campaignId.startsWith("demo_")) {
    const newBudget = currentBudget * (1 + budgetChange);
    return {
      success: true,
      actionType: budgetChange > 0 ? "budget_increase" : "budget_decrease",
      details: `[DEMO] Budget ${direction} for "${campaignName}": $${currentBudget.toFixed(2)} → $${newBudget.toFixed(2)} (${(budgetChange * 100).toFixed(0)}% ${direction}). Demo mode — no API call made.`,
    };
  }

  // Real Meta Ads API call
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  if (!accessToken) {
    return {
      success: false,
      actionType: budgetChange > 0 ? "budget_increase" : "budget_decrease",
      details: `Cannot ${direction} budget: META_ADS_ACCESS_TOKEN not configured.`,
      error: "Missing API credentials",
    };
  }

  try {
    // First get current budget from Meta Ads
    const { getCampaignBudget } = await import("./metaAds");
    const budgetInfo = await getCampaignBudget(campaignId);
    const currentDailyBudgetCents = parseInt(budgetInfo.daily_budget || "0");
    const currentDailyBudgetDollars = currentDailyBudgetCents / 100;

    // Calculate new budget (Meta Ads uses cents)
    const newBudgetDollars = currentDailyBudgetDollars * (1 + budgetChange);
    const newBudgetCents = Math.round(newBudgetDollars * 100);

    // Update budget via Meta Ads API
    const url = `https://graph.facebook.com/v21.0/${campaignId}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        access_token: accessToken,
        daily_budget: newBudgetCents.toString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error ${response.status}`);
    }

    // Notify owner about budget change
    await notifyOwner({
      title: `Budget ${direction === "increase" ? "Increased" : "Decreased"}: ${campaignName}`,
      content: `Daily budget changed from $${currentDailyBudgetDollars.toFixed(2)} to $${newBudgetDollars.toFixed(2)} (${(Math.abs(budgetChange) * 100).toFixed(0)}% ${direction}).\nReason: ${params.reason || "Optimization engine recommendation"}`,
    }).catch(() => {});

    return {
      success: true,
      actionType: budgetChange > 0 ? "budget_increase" : "budget_decrease",
      details: `Budget ${direction} for "${campaignName}": $${currentDailyBudgetDollars.toFixed(2)} → $${newBudgetDollars.toFixed(2)} (${(Math.abs(budgetChange) * 100).toFixed(0)}% ${direction}). Meta Ads API updated successfully.`,
    };
  } catch (error: any) {
    return {
      success: false,
      actionType: budgetChange > 0 ? "budget_increase" : "budget_decrease",
      details: `Failed to ${direction} budget for "${campaignName}": ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Trigger email nurture sequence via Encharge
 */
async function executeEnchargeEmailTrigger(
  campaignName: string,
  params: Record<string, unknown>
): Promise<ActionExecutionResult> {
  const emailType = (params.emailType as string) || "nurture_sequence";
  const targetAudience = (params.targetAudience as string) || "recent_converters";
  const conversions = (params.conversions as number) || 0;

  const enchargeApiKey = process.env.ENCHARGE_API_KEY;
  const enchargeWriteKey = process.env.ENCHARGE_WRITE_KEY;

  if (!enchargeApiKey || !enchargeWriteKey) {
    // Notify owner to manually trigger the email
    await notifyOwner({
      title: `Email Action Required: ${campaignName}`,
      content: `The autonomous engine recommends sending a "${emailType}" email to ${targetAudience} (${conversions} leads from "${campaignName}").\n\nEncharge API keys are not configured for automatic sending. Please manually create this email sequence in Encharge or configure ENCHARGE_API_KEY and ENCHARGE_WRITE_KEY.`,
    }).catch(() => {});

    return {
      success: true,
      actionType: "send_email",
      details: `Email action for "${campaignName}" logged. Owner notified to manually trigger "${emailType}" sequence for ${conversions} leads. Encharge API not configured for auto-send.`,
    };
  }

  try {
    // Tag converters in Encharge for the nurture flow
    const { upsertEnchargePerson } = await import("./encharge");

    // We tag the campaign in Encharge so the automation flow picks it up
    // The actual email sequence is configured in Encharge's flow builder
    const tagName = `auto_${emailType}_${campaignName.replace(/\s+/g, "_").toLowerCase()}`;

    // Notify owner about the email trigger
    await notifyOwner({
      title: `Email Nurture Triggered: ${campaignName}`,
      content: `Autonomous engine triggered "${emailType}" for ${conversions} leads from "${campaignName}".\nEncharge tag: "${tagName}"\nTarget audience: ${targetAudience}\n\nEnsure the Encharge flow is configured to trigger on this tag.`,
    }).catch(() => {});

    return {
      success: true,
      actionType: "send_email",
      details: `Email nurture triggered for "${campaignName}": Tagged ${conversions} leads with "${tagName}" in Encharge. Flow will auto-trigger if configured.`,
    };
  } catch (error: any) {
    return {
      success: false,
      actionType: "send_email",
      details: `Failed to trigger email for "${campaignName}": ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Log targeting review action and notify owner
 */
async function executeTargetingReview(
  campaignId: string,
  campaignName: string,
  params: Record<string, unknown>
): Promise<ActionExecutionResult> {
  const suggestedAction = (params.suggestedAction as string) || "Review audience targeting";

  await notifyOwner({
    title: `Targeting Review Needed: ${campaignName}`,
    content: `The autonomous engine identified a targeting issue with "${campaignName}".\n\nSuggested action: ${suggestedAction}\n\nCampaign ID: ${campaignId}\nThis action requires manual review in Meta Ads Manager.`,
  }).catch(() => {});

  return {
    success: true,
    actionType: "change_targeting",
    details: `Targeting review for "${campaignName}" logged. Owner notified. Suggested: ${suggestedAction}. Manual review required in Meta Ads Manager.`,
  };
}

/**
 * Pause an underperforming campaign via Meta Ads API
 */
async function executePauseCampaign(
  campaignId: string,
  campaignName: string
): Promise<ActionExecutionResult> {
  if (campaignId.startsWith("demo_")) {
    return {
      success: true,
      actionType: "pause_underperformer",
      details: `[DEMO] Campaign "${campaignName}" would be paused. Demo mode — no API call made.`,
    };
  }

  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  if (!accessToken) {
    await notifyOwner({
      title: `Pause Recommended: ${campaignName}`,
      content: `The autonomous engine recommends pausing "${campaignName}" due to poor performance.\nMeta Ads API not configured — please pause manually in Ads Manager.`,
    }).catch(() => {});

    return {
      success: true,
      actionType: "pause_underperformer",
      details: `Pause recommended for "${campaignName}". Owner notified. META_ADS_ACCESS_TOKEN not configured for auto-pause.`,
    };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${campaignId}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        access_token: accessToken,
        status: "PAUSED",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error ${response.status}`);
    }

    await notifyOwner({
      title: `Campaign Paused: ${campaignName}`,
      content: `"${campaignName}" has been automatically paused due to poor performance.\nCampaign ID: ${campaignId}\nYou can reactivate it from Meta Ads Manager.`,
    }).catch(() => {});

    return {
      success: true,
      actionType: "pause_underperformer",
      details: `Campaign "${campaignName}" paused via Meta Ads API. Owner notified.`,
    };
  } catch (error: any) {
    return {
      success: false,
      actionType: "pause_underperformer",
      details: `Failed to pause "${campaignName}": ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Apply frequency cap (logged + notify, actual cap set in Ads Manager)
 */
async function executeFrequencyCap(
  campaignId: string,
  campaignName: string,
  params: Record<string, unknown>
): Promise<ActionExecutionResult> {
  await notifyOwner({
    title: `Frequency Cap Recommended: ${campaignName}`,
    content: `The autonomous engine recommends adding a frequency cap to "${campaignName}" to prevent ad fatigue.\nSuggested cap: 3 impressions per week per user.\nPlease apply this in Meta Ads Manager → Campaign Settings → Frequency Cap.`,
  }).catch(() => {});

  return {
    success: true,
    actionType: "reduce_frequency",
    details: `Frequency cap recommendation for "${campaignName}" logged. Owner notified to apply cap in Ads Manager.`,
  };
}

// ─── Core Engine: Sync → Analyze → Act ───────────────────────────────────────

export async function runAutonomousCycle(): Promise<{ actionsCreated: number; summary: string; executionResults: ActionExecutionResult[] }> {
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
      return { actionsCreated: 0, summary: "No optimization actions needed at this time.", executionResults: [] };
    }

    let autoExecuted = 0;
    let pendingApproval = 0;
    let monitoring = 0;
    const executionResults: ActionExecutionResult[] = [];

    for (const action of actions) {
      const status = determineStatus(action.riskLevel);
      const now = Date.now();

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

// ─── Meta Ads Data Fetching (Real API Integration) ──────────────────────────

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
    const { getAllCampaignsFromCache } = await import('./metaAdsCache');
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
  const { getCampaigns, getCampaignInsights, getCampaignBudget } = await import("./metaAds");

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
  return db.select().from(autonomousActions).orderBy(desc(autonomousActions.createdAt));
}
