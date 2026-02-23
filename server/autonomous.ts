import { eq, desc, and, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  autonomousSyncStatus,
  autonomousActions,
  type InsertAutonomousSyncStatus,
  type InsertAutonomousAction,
  type AutonomousAction,
} from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CampaignData {
  id: string;
  name: string;
  status: string;
  objective: string;
  dailyBudget: number;
  lifetimeBudget: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  costPerConversion: number;
  roas: number;
  reach: number;
  frequency: number;
  startDate: string;
  daysRunning: number;
}

export interface AnalysisResult {
  campaignId: string;
  campaignName: string;
  actionType: string;
  riskLevel: "low" | "medium" | "high" | "monitor";
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  impactEstimate: "low" | "medium" | "high";
  actionParams: Record<string, unknown>;
  campaignMetrics: Record<string, unknown>;
}

// ─── Meta Ads API Integration ────────────────────────────────────────────────

const META_ADS_BASE_URL = "https://graph.facebook.com/v21.0";

/**
 * Fetch campaign data from Meta Ads API.
 * Uses lifetime date preset for accurate total spend tracking.
 * Excludes Studio Soo portrait business account per user preference.
 */
export async function fetchMetaAdsCampaigns(
  accessToken: string,
  adAccountId: string
): Promise<CampaignData[]> {
  try {
    // Fetch campaigns with insights using lifetime date preset
    const campaignsUrl = `${META_ADS_BASE_URL}/act_${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time&access_token=${accessToken}&limit=100`;

    const campaignsRes = await fetch(campaignsUrl);
    if (!campaignsRes.ok) {
      const errText = await campaignsRes.text();
      throw new Error(`Meta Ads API error: ${campaignsRes.status} - ${errText}`);
    }
    const campaignsData = await campaignsRes.json();

    const campaigns: CampaignData[] = [];

    for (const campaign of campaignsData.data || []) {
      // Skip Studio Soo portrait business campaigns
      if (campaign.name?.toLowerCase().includes("studio soo")) continue;

      // Fetch insights with lifetime date preset
      const insightsUrl = `${META_ADS_BASE_URL}/${campaign.id}/insights?fields=spend,impressions,clicks,ctr,cpc,actions,cost_per_action_type,reach,frequency&date_preset=lifetime&access_token=${accessToken}`;

      let insights: Record<string, unknown> = {};
      try {
        const insightsRes = await fetch(insightsUrl);
        if (insightsRes.ok) {
          const insightsData = await insightsRes.json();
          insights = insightsData.data?.[0] || {};
        }
      } catch {
        // Continue with empty insights if fetch fails
      }

      const spend = parseFloat(String(insights.spend || "0"));
      const impressions = parseInt(String(insights.impressions || "0"), 10);
      const clicks = parseInt(String(insights.clicks || "0"), 10);
      const reach = parseInt(String(insights.reach || "0"), 10);
      const frequency = parseFloat(String(insights.frequency || "0"));
      const ctr = parseFloat(String(insights.ctr || "0"));
      const cpc = parseFloat(String(insights.cpc || "0"));

      // Extract conversions from actions array
      const actions = (insights.actions as Array<{ action_type: string; value: string }>) || [];
      const conversionAction = actions.find(
        (a) => a.action_type === "offsite_conversion" || a.action_type === "lead"
      );
      const conversions = conversionAction ? parseInt(conversionAction.value, 10) : 0;

      const costPerConversion = conversions > 0 ? spend / conversions : 0;
      const roas = spend > 0 && conversions > 0 ? (conversions * 50) / spend : 0; // Estimated $50 per conversion

      const startDate = campaign.start_time
        ? new Date(campaign.start_time).toISOString().split("T")[0]
        : "";
      const daysRunning = startDate
        ? Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      campaigns.push({
        id: campaign.id,
        name: campaign.name || "Unnamed Campaign",
        status: campaign.status || "UNKNOWN",
        objective: campaign.objective || "UNKNOWN",
        dailyBudget: parseFloat(campaign.daily_budget || "0") / 100,
        lifetimeBudget: parseFloat(campaign.lifetime_budget || "0") / 100,
        spend,
        impressions,
        clicks,
        ctr,
        cpc,
        conversions,
        costPerConversion,
        roas,
        reach,
        frequency,
        startDate,
        daysRunning,
      });
    }

    return campaigns;
  } catch (error) {
    console.error("[Autonomous] Failed to fetch Meta Ads campaigns:", error);
    throw error;
  }
}

// ─── LLM-Powered Analysis Engine ─────────────────────────────────────────────

/**
 * Analyzes campaign performance data using LLM and generates optimization actions.
 * The engine considers:
 * - Budget efficiency (CPC, CPA, ROAS)
 * - Audience saturation (frequency, reach)
 * - Campaign maturity (days running, data sufficiency)
 * - Risk assessment for each recommended action
 */
export async function analyzeCampaigns(
  campaigns: CampaignData[]
): Promise<AnalysisResult[]> {
  if (campaigns.length === 0) return [];

  const campaignSummary = campaigns
    .map(
      (c) =>
        `Campaign: "${c.name}" (ID: ${c.id})
  Status: ${c.status}, Objective: ${c.objective}
  Budget: $${c.dailyBudget}/day, Spend: $${c.spend.toFixed(2)}
  Impressions: ${c.impressions}, Clicks: ${c.clicks}, CTR: ${c.ctr.toFixed(2)}%
  CPC: $${c.cpc.toFixed(2)}, Conversions: ${c.conversions}, CPA: $${c.costPerConversion.toFixed(2)}
  ROAS: ${c.roas.toFixed(2)}x, Reach: ${c.reach}, Frequency: ${c.frequency.toFixed(1)}
  Running for: ${c.daysRunning} days since ${c.startDate}`
    )
    .join("\n\n");

  const systemPrompt = `You are an expert Meta Ads campaign optimization engine for Golf VX Arlington Heights, an indoor golf simulator business.

Your job is to analyze campaign performance data and generate specific, actionable optimization recommendations.

RISK LEVEL RULES:
- "low" risk (AUTO-EXECUTE): Budget decreases, pausing clearly underperforming campaigns (CPA > 3x target, 0 conversions after 7+ days)
- "medium" risk (NEEDS APPROVAL): Budget increases up to 20%, minor targeting adjustments
- "high" risk (NEEDS APPROVAL): Budget increases > 20%, email campaigns, new audience creation, creative changes
- "monitor" risk: Campaigns with < 3 days of data, or performing within acceptable range (no action needed yet)

ACTION TYPES: budget_adjustment, targeting_change, alert, pause, email, creative_refresh

GOLF VX CONTEXT:
- Trial sessions ($25-$39) are the primary conversion goal
- Junior programs and seasonal camps are key revenue drivers
- Membership acquisition campaigns target long-term value
- Average customer lifetime value: ~$500
- Target CPA for trials: $15-25
- Target ROAS: 2x+

Respond with a JSON array of analysis results. Each result must have:
- campaignId, campaignName, actionType, riskLevel, title, description, recommendation, confidence (0-100), impactEstimate (low/medium/high), actionParams (object with specific values)`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze these Golf VX campaigns and generate optimization actions:\n\n${campaignSummary}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "campaign_analysis",
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
                    riskLevel: { type: "string", enum: ["low", "medium", "high", "monitor"] },
                    title: { type: "string" },
                    description: { type: "string" },
                    recommendation: { type: "string" },
                    confidence: { type: "number" },
                    impactEstimate: { type: "string", enum: ["low", "medium", "high"] },
                    actionParams: { type: "object", additionalProperties: true },
                  },
                  required: [
                    "campaignId",
                    "campaignName",
                    "actionType",
                    "riskLevel",
                    "title",
                    "description",
                    "recommendation",
                    "confidence",
                    "impactEstimate",
                    "actionParams",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["actions"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") return [];

    const parsed = JSON.parse(content);
    const results: AnalysisResult[] = (parsed.actions || []).map(
      (a: Record<string, unknown>) => {
        const campaign = campaigns.find((c) => c.id === a.campaignId);
        return {
          campaignId: String(a.campaignId),
          campaignName: String(a.campaignName),
          actionType: String(a.actionType),
          riskLevel: a.riskLevel as AnalysisResult["riskLevel"],
          title: String(a.title),
          description: String(a.description),
          recommendation: String(a.recommendation),
          confidence: Number(a.confidence),
          impactEstimate: a.impactEstimate as AnalysisResult["impactEstimate"],
          actionParams: (a.actionParams || {}) as Record<string, unknown>,
          campaignMetrics: campaign
            ? {
                spend: campaign.spend,
                impressions: campaign.impressions,
                clicks: campaign.clicks,
                ctr: campaign.ctr,
                cpc: campaign.cpc,
                conversions: campaign.conversions,
                costPerConversion: campaign.costPerConversion,
                roas: campaign.roas,
                reach: campaign.reach,
                frequency: campaign.frequency,
              }
            : {},
        };
      }
    );

    return results;
  } catch (error) {
    console.error("[Autonomous] LLM analysis failed:", error);
    return [];
  }
}

// ─── Rule-Based Fallback Analysis ────────────────────────────────────────────

/**
 * Deterministic rule-based analysis as fallback when LLM is unavailable.
 * Applies standard marketing optimization rules.
 */
export function analyzeWithRules(campaigns: CampaignData[]): AnalysisResult[] {
  const results: AnalysisResult[] = [];

  for (const c of campaigns) {
    // Rule 1: Insufficient data → monitor
    if (c.daysRunning < 3 || c.impressions < 500) {
      results.push({
        campaignId: c.id,
        campaignName: c.name,
        actionType: "alert",
        riskLevel: "monitor",
        title: `Monitoring: ${c.name}`,
        description: `Campaign has only ${c.daysRunning} days of data and ${c.impressions} impressions. Need more data before making optimization decisions.`,
        recommendation: "Continue monitoring. Revisit after 3+ days and 1,000+ impressions.",
        confidence: 90,
        impactEstimate: "low",
        actionParams: { reason: "insufficient_data", daysRunning: c.daysRunning, impressions: c.impressions },
        campaignMetrics: { spend: c.spend, impressions: c.impressions, clicks: c.clicks, ctr: c.ctr, cpc: c.cpc, conversions: c.conversions, costPerConversion: c.costPerConversion, roas: c.roas },
      });
      continue;
    }

    // Rule 2: High CPA with no conversions after 7+ days → auto-pause (low risk)
    if (c.daysRunning >= 7 && c.conversions === 0 && c.spend > 50) {
      results.push({
        campaignId: c.id,
        campaignName: c.name,
        actionType: "pause",
        riskLevel: "low",
        title: `Auto-Pause: ${c.name} - Zero Conversions`,
        description: `Campaign has spent $${c.spend.toFixed(2)} over ${c.daysRunning} days with zero conversions. Automatic pause to prevent further budget waste.`,
        recommendation: `Pause campaign and review creative/targeting. Consider A/B testing with new ad copy.`,
        confidence: 95,
        impactEstimate: "medium",
        actionParams: { action: "pause", reason: "zero_conversions", spend: c.spend, daysRunning: c.daysRunning },
        campaignMetrics: { spend: c.spend, impressions: c.impressions, clicks: c.clicks, ctr: c.ctr, cpc: c.cpc, conversions: c.conversions, costPerConversion: c.costPerConversion, roas: c.roas },
      });
      continue;
    }

    // Rule 3: Very high CPA (> 3x target of $25) → reduce budget (low risk)
    if (c.costPerConversion > 75 && c.conversions > 0) {
      results.push({
        campaignId: c.id,
        campaignName: c.name,
        actionType: "budget_adjustment",
        riskLevel: "low",
        title: `Budget Decrease: ${c.name} - High CPA`,
        description: `CPA of $${c.costPerConversion.toFixed(2)} is ${(c.costPerConversion / 25).toFixed(1)}x above target. Reducing budget by 30% to limit waste while gathering more data.`,
        recommendation: `Reduce daily budget from $${c.dailyBudget.toFixed(2)} to $${(c.dailyBudget * 0.7).toFixed(2)}`,
        confidence: 85,
        impactEstimate: "medium",
        actionParams: { action: "decrease_budget", oldBudget: c.dailyBudget, newBudget: c.dailyBudget * 0.7, reductionPercent: 30 },
        campaignMetrics: { spend: c.spend, impressions: c.impressions, clicks: c.clicks, ctr: c.ctr, cpc: c.cpc, conversions: c.conversions, costPerConversion: c.costPerConversion, roas: c.roas },
      });
    }

    // Rule 4: Good ROAS (> 2x) → increase budget (medium risk)
    if (c.roas > 2 && c.conversions >= 3 && c.daysRunning >= 5) {
      results.push({
        campaignId: c.id,
        campaignName: c.name,
        actionType: "budget_adjustment",
        riskLevel: "medium",
        title: `Budget Increase: ${c.name} - Strong ROAS`,
        description: `ROAS of ${c.roas.toFixed(2)}x with ${c.conversions} conversions. Campaign is performing well and could benefit from increased budget.`,
        recommendation: `Increase daily budget from $${c.dailyBudget.toFixed(2)} to $${(c.dailyBudget * 1.2).toFixed(2)} (+20%)`,
        confidence: 80,
        impactEstimate: "high",
        actionParams: { action: "increase_budget", oldBudget: c.dailyBudget, newBudget: c.dailyBudget * 1.2, increasePercent: 20 },
        campaignMetrics: { spend: c.spend, impressions: c.impressions, clicks: c.clicks, ctr: c.ctr, cpc: c.cpc, conversions: c.conversions, costPerConversion: c.costPerConversion, roas: c.roas },
      });
    }

    // Rule 5: High frequency (> 3.0) → audience fatigue alert (medium risk)
    if (c.frequency > 3.0 && c.daysRunning >= 7) {
      results.push({
        campaignId: c.id,
        campaignName: c.name,
        actionType: "targeting_change",
        riskLevel: "medium",
        title: `Audience Fatigue: ${c.name}`,
        description: `Frequency of ${c.frequency.toFixed(1)} indicates audience saturation. Users are seeing the ad too many times, which can lead to ad fatigue and declining performance.`,
        recommendation: "Expand audience targeting or refresh creative assets to combat ad fatigue.",
        confidence: 75,
        impactEstimate: "medium",
        actionParams: { reason: "high_frequency", frequency: c.frequency, reach: c.reach },
        campaignMetrics: { spend: c.spend, impressions: c.impressions, clicks: c.clicks, ctr: c.ctr, cpc: c.cpc, conversions: c.conversions, costPerConversion: c.costPerConversion, roas: c.roas },
      });
    }

    // Rule 6: Low CTR (< 1%) with decent impressions → creative refresh needed (high risk)
    if (c.ctr < 1 && c.impressions > 5000 && c.daysRunning >= 5) {
      results.push({
        campaignId: c.id,
        campaignName: c.name,
        actionType: "creative_refresh",
        riskLevel: "high",
        title: `Creative Refresh Needed: ${c.name}`,
        description: `CTR of ${c.ctr.toFixed(2)}% across ${c.impressions.toLocaleString()} impressions suggests the creative is not resonating with the target audience.`,
        recommendation: "Create new ad variations with different headlines, images, and CTAs. Test video vs. static formats.",
        confidence: 70,
        impactEstimate: "high",
        actionParams: { reason: "low_ctr", ctr: c.ctr, impressions: c.impressions },
        campaignMetrics: { spend: c.spend, impressions: c.impressions, clicks: c.clicks, ctr: c.ctr, cpc: c.cpc, conversions: c.conversions, costPerConversion: c.costPerConversion, roas: c.roas },
      });
    }

    // Rule 7: Campaign performing within acceptable range → monitor
    if (
      c.costPerConversion > 0 &&
      c.costPerConversion <= 75 &&
      c.ctr >= 1 &&
      c.frequency <= 3.0
    ) {
      results.push({
        campaignId: c.id,
        campaignName: c.name,
        actionType: "alert",
        riskLevel: "monitor",
        title: `On Track: ${c.name}`,
        description: `Campaign is performing within acceptable parameters. CPA: $${c.costPerConversion.toFixed(2)}, CTR: ${c.ctr.toFixed(2)}%, Frequency: ${c.frequency.toFixed(1)}`,
        recommendation: "No action needed. Continue monitoring for trend changes.",
        confidence: 85,
        impactEstimate: "low",
        actionParams: { status: "healthy" },
        campaignMetrics: { spend: c.spend, impressions: c.impressions, clicks: c.clicks, ctr: c.ctr, cpc: c.cpc, conversions: c.conversions, costPerConversion: c.costPerConversion, roas: c.roas },
      });
    }
  }

  return results;
}

// ─── Action Execution Engine ─────────────────────────────────────────────────

/**
 * Process analysis results: auto-execute low-risk actions,
 * queue medium/high-risk for approval, set monitor items.
 */
export async function processAnalysisResults(
  results: AnalysisResult[],
  syncId: number
): Promise<{ autoExecuted: number; pendingApproval: number; monitoring: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let autoExecuted = 0;
  let pendingApproval = 0;
  let monitoring = 0;

  for (const result of results) {
    let status: InsertAutonomousAction["status"];

    if (result.riskLevel === "low") {
      status = "auto_executed";
      autoExecuted++;
    } else if (result.riskLevel === "monitor") {
      status = "monitoring";
      monitoring++;
    } else {
      status = "pending_approval";
      pendingApproval++;
    }

    // Set expiration for pending approval actions (48 hours)
    const expiresAt =
      status === "pending_approval"
        ? new Date(Date.now() + 48 * 60 * 60 * 1000)
        : undefined;

    const actionRecord: InsertAutonomousAction = {
      syncId,
      campaignId: result.campaignId,
      campaignName: result.campaignName,
      actionType: result.actionType,
      riskLevel: result.riskLevel,
      status,
      title: result.title,
      description: result.description,
      recommendation: result.recommendation,
      actionParams: result.actionParams,
      campaignMetrics: result.campaignMetrics,
      confidence: result.confidence,
      impactEstimate: result.impactEstimate,
      expiresAt,
    };

    await db.insert(autonomousActions).values(actionRecord);
  }

  // Notify owner if there are pending approval items
  if (pendingApproval > 0) {
    try {
      await notifyOwner({
        title: `🤖 Marketing Intelligence: ${pendingApproval} Actions Need Approval`,
        content: `The autonomous analysis engine has generated ${results.length} optimization recommendations:\n\n• ${autoExecuted} actions auto-executed (low risk)\n• ${pendingApproval} actions awaiting your approval\n• ${monitoring} campaigns being monitored\n\nPlease review the pending actions in the Marketing Intelligence dashboard.`,
      });
    } catch {
      console.warn("[Autonomous] Failed to send notification");
    }
  }

  return { autoExecuted, pendingApproval, monitoring };
}

// ─── Full Sync Orchestrator ──────────────────────────────────────────────────

/**
 * Orchestrates the full sync cycle:
 * 1. Create sync record
 * 2. Fetch campaign data from Meta Ads
 * 3. Analyze campaigns (LLM with rule-based fallback)
 * 4. Process results (auto-execute / queue / monitor)
 * 5. Update sync record with results
 */
export async function runFullSync(
  metaAccessToken?: string,
  metaAdAccountId?: string
): Promise<{
  syncId: number;
  campaignsProcessed: number;
  actionsGenerated: number;
  autoExecuted: number;
  pendingApproval: number;
  monitoring: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Create sync record
  const [syncResult] = await db.insert(autonomousSyncStatus).values({
    platform: "meta_ads",
    status: "running",
  });
  const syncId = syncResult.insertId;

  try {
    // 2. Fetch campaign data
    let campaigns: CampaignData[] = [];

    if (metaAccessToken && metaAdAccountId) {
      campaigns = await fetchMetaAdsCampaigns(metaAccessToken, metaAdAccountId);
    } else {
      // Use demo data if no Meta Ads credentials
      campaigns = getDemoCampaigns();
    }

    // 3. Analyze campaigns
    let analysisResults: AnalysisResult[];
    try {
      analysisResults = await analyzeCampaigns(campaigns);
      // Fallback to rules if LLM returns empty
      if (analysisResults.length === 0) {
        analysisResults = analyzeWithRules(campaigns);
      }
    } catch {
      console.warn("[Autonomous] LLM analysis failed, using rule-based fallback");
      analysisResults = analyzeWithRules(campaigns);
    }

    // 4. Process results
    const { autoExecuted, pendingApproval, monitoring } = await processAnalysisResults(
      analysisResults,
      syncId
    );

    // 5. Update sync record
    await db
      .update(autonomousSyncStatus)
      .set({
        status: "completed",
        campaignsProcessed: campaigns.length,
        actionsGenerated: analysisResults.length,
        actionsAutoExecuted: autoExecuted,
        completedAt: new Date(),
        metadata: {
          campaignNames: campaigns.map((c) => c.name),
          pendingApproval,
          monitoring,
        },
      })
      .where(eq(autonomousSyncStatus.id, syncId));

    return {
      syncId,
      campaignsProcessed: campaigns.length,
      actionsGenerated: analysisResults.length,
      autoExecuted,
      pendingApproval,
      monitoring,
    };
  } catch (error) {
    // Update sync record with error
    await db
      .update(autonomousSyncStatus)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(autonomousSyncStatus.id, syncId));

    throw error;
  }
}

// ─── Demo Campaign Data ──────────────────────────────────────────────────────

/**
 * Returns realistic demo campaigns for Golf VX Arlington Heights
 * when Meta Ads API credentials are not configured.
 */
export function getDemoCampaigns(): CampaignData[] {
  return [
    {
      id: "demo_camp_001",
      name: "Junior Summer Camp 2026 - Early Bird",
      status: "ACTIVE",
      objective: "CONVERSIONS",
      dailyBudget: 40,
      lifetimeBudget: 0,
      spend: 312.47,
      impressions: 18420,
      clicks: 287,
      ctr: 1.56,
      cpc: 1.09,
      conversions: 14,
      costPerConversion: 22.32,
      roas: 2.24,
      reach: 12800,
      frequency: 1.4,
      startDate: "2026-02-01",
      daysRunning: 22,
    },
    {
      id: "demo_camp_002",
      name: "Anniversary Giveaway - Annual Membership",
      status: "ACTIVE",
      objective: "LEAD_GENERATION",
      dailyBudget: 60,
      lifetimeBudget: 0,
      spend: 847.23,
      impressions: 45200,
      clicks: 892,
      ctr: 1.97,
      cpc: 0.95,
      conversions: 38,
      costPerConversion: 22.30,
      roas: 3.15,
      reach: 28400,
      frequency: 1.6,
      startDate: "2026-01-15",
      daysRunning: 39,
    },
    {
      id: "demo_camp_003",
      name: "$25 Trial Session - Spring Promo",
      status: "ACTIVE",
      objective: "CONVERSIONS",
      dailyBudget: 30,
      lifetimeBudget: 0,
      spend: 456.80,
      impressions: 32100,
      clicks: 198,
      ctr: 0.62,
      cpc: 2.31,
      conversions: 4,
      costPerConversion: 114.20,
      roas: 0.44,
      reach: 8900,
      frequency: 3.6,
      startDate: "2026-02-05",
      daysRunning: 18,
    },
    {
      id: "demo_camp_004",
      name: "Corporate Team Building Package",
      status: "ACTIVE",
      objective: "CONVERSIONS",
      dailyBudget: 25,
      lifetimeBudget: 0,
      spend: 89.50,
      impressions: 4200,
      clicks: 42,
      ctr: 1.0,
      cpc: 2.13,
      conversions: 0,
      costPerConversion: 0,
      roas: 0,
      reach: 3100,
      frequency: 1.4,
      startDate: "2026-02-18",
      daysRunning: 5,
    },
    {
      id: "demo_camp_005",
      name: "PBGA Winter Clinic Series",
      status: "ACTIVE",
      objective: "CONVERSIONS",
      dailyBudget: 35,
      lifetimeBudget: 0,
      spend: 623.15,
      impressions: 28900,
      clicks: 412,
      ctr: 1.43,
      cpc: 1.51,
      conversions: 22,
      costPerConversion: 28.33,
      roas: 1.76,
      reach: 15600,
      frequency: 1.9,
      startDate: "2026-01-20",
      daysRunning: 34,
    },
    {
      id: "demo_camp_006",
      name: "Instagram Follower Growth - Brand Awareness",
      status: "ACTIVE",
      objective: "REACH",
      dailyBudget: 15,
      lifetimeBudget: 0,
      spend: 178.90,
      impressions: 52000,
      clicks: 310,
      ctr: 0.60,
      cpc: 0.58,
      conversions: 0,
      costPerConversion: 0,
      roas: 0,
      reach: 38000,
      frequency: 1.4,
      startDate: "2026-02-01",
      daysRunning: 22,
    },
    {
      id: "demo_camp_007",
      name: "New Campaign - Weekend Drive Day",
      status: "ACTIVE",
      objective: "CONVERSIONS",
      dailyBudget: 20,
      lifetimeBudget: 0,
      spend: 28.40,
      impressions: 890,
      clicks: 12,
      ctr: 1.35,
      cpc: 2.37,
      conversions: 0,
      costPerConversion: 0,
      roas: 0,
      reach: 720,
      frequency: 1.2,
      startDate: "2026-02-21",
      daysRunning: 2,
    },
  ];
}

// ─── DB Query Helpers ────────────────────────────────────────────────────────

export async function getLatestSyncStatus() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(autonomousSyncStatus)
    .orderBy(desc(autonomousSyncStatus.createdAt))
    .limit(1);
  return rows[0] || null;
}

export async function getSyncHistory(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(autonomousSyncStatus)
    .orderBy(desc(autonomousSyncStatus.createdAt))
    .limit(limit);
}

export async function getActionsByStatus(
  statusFilter: AutonomousAction["status"][]
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(autonomousActions)
    .where(inArray(autonomousActions.status, statusFilter))
    .orderBy(desc(autonomousActions.createdAt));
}

export async function getAutoExecutedActions(limit = 50) {
  return getActionsByStatus(["auto_executed"]);
}

export async function getPendingApprovalActions() {
  return getActionsByStatus(["pending_approval"]);
}

export async function getMonitoringActions() {
  return getActionsByStatus(["monitoring"]);
}

export async function approveActionById(
  actionId: number,
  reviewerName: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(autonomousActions)
    .set({
      status: "approved",
      reviewedBy: reviewerName,
      reviewedAt: new Date(),
    })
    .where(eq(autonomousActions.id, actionId));

  const rows = await db
    .select()
    .from(autonomousActions)
    .where(eq(autonomousActions.id, actionId))
    .limit(1);
  return rows[0] || null;
}

export async function rejectActionById(
  actionId: number,
  reviewerName: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(autonomousActions)
    .set({
      status: "rejected",
      reviewedBy: reviewerName,
      reviewedAt: new Date(),
    })
    .where(eq(autonomousActions.id, actionId));
}

export async function undoActionById(
  actionId: number,
  reason: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(autonomousActions)
    .set({
      isUndone: true,
      undoneAt: new Date(),
      undoReason: reason,
      status: "undone",
    })
    .where(eq(autonomousActions.id, actionId));
}

export async function getAllActions(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(autonomousActions)
    .orderBy(desc(autonomousActions.createdAt))
    .limit(limit);
}
