/**
 * Autonomous Marketing Intelligence Engine — Rule-Based Analysis
 *
 * Rule-based fallback analysis used when LLM is unavailable.
 * Also provides the foundation for LLM-powered analysis decisions.
 */

import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { autonomousSyncStatus } from "../../drizzle/schema";
import { CampaignMetrics, GeneratedAction } from "./types";
import { classifyRisk } from "./riskClassifier";

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

// ─── Anomaly Detection ────────────────────────────────────────────────────────

interface Anomaly {
  type: "stale_data" | "ctr_drop" | "spend_spike" | "zero_values";
  campaignId: string;
  campaignName: string;
  description: string;
  severity: "warning" | "critical";
}

async function detectAnomalies(campaigns: CampaignMetrics[]): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];

  // 1. Stale data: check if Meta Ads data was last synced >24h ago
  try {
    const db = await getDb();
    if (db) {
      const [syncStatus] = await db
        .select()
        .from(autonomousSyncStatus)
        .where(eq(autonomousSyncStatus.source, "meta_ads"))
        .limit(1);
      if (syncStatus?.lastSyncAt) {
        const hoursSinceSync = (Date.now() - Number(syncStatus.lastSyncAt)) / (1000 * 60 * 60);
        if (hoursSinceSync > 24) {
          anomalies.push({
            type: "stale_data",
            campaignId: "all",
            campaignName: "All Campaigns",
            description: `Campaign data is ${Math.round(hoursSinceSync)}h old (threshold: 24h). Data may be stale due to a failed Meta Ads API sync.`,
            severity: "warning",
          });
        }
      }
    }
  } catch (e) {
    console.warn("[Autonomous] Could not check sync status for stale data detection:", e);
  }

  for (const c of campaigns) {
    // 2. Zero values from failed API calls: active campaign with all-zero metrics
    if (
      (c.status === "ACTIVE" || c.status === "active") &&
      c.impressions === 0 &&
      c.clicks === 0 &&
      c.spend === 0
    ) {
      anomalies.push({
        type: "zero_values",
        campaignId: c.campaignId,
        campaignName: c.campaignName,
        description: `Active campaign "${c.campaignName}" reports all-zero metrics (impressions=0, clicks=0, spend=0). This likely indicates a failed API data fetch or a delivery issue.`,
        severity: "warning",
      });
    }

    // 3. CTR drop >50%: CTR below 0.3% with sufficient impressions
    //    (0.3% is >50% below the ~1% industry baseline for awareness campaigns)
    if (
      (c.status === "ACTIVE" || c.status === "active") &&
      c.impressions > 1000 &&
      c.ctr < 0.3
    ) {
      anomalies.push({
        type: "ctr_drop",
        campaignId: c.campaignId,
        campaignName: c.campaignName,
        description: `CTR of ${c.ctr.toFixed(2)}% is more than 50% below the ~1% industry baseline with ${c.impressions.toLocaleString()} impressions. Possible ad fatigue, audience saturation, or creative issue.`,
        severity: "warning",
      });
    }

    // 4. Spend spike >200%: total spend exceeds 3× the daily budget
    //    (3× daily budget = >200% over expected single-day spend)
    if (
      (c.status === "ACTIVE" || c.status === "active") &&
      c.dailyBudget > 0 &&
      c.spend > c.dailyBudget * 3
    ) {
      anomalies.push({
        type: "spend_spike",
        campaignId: c.campaignId,
        campaignName: c.campaignName,
        description: `Total spend ($${c.spend.toFixed(2)}) exceeds 3× the daily budget ($${c.dailyBudget.toFixed(2)}), indicating a potential spend spike of >200% above expected daily rate.`,
        severity: "critical",
      });
    }
  }

  return anomalies;
}

// ─── OpenAI-Powered Analysis ──────────────────────────────────────────────────

export async function analyzeWithLLM(campaigns: CampaignMetrics[]): Promise<GeneratedAction[]> {
  // Fall back to rules immediately if OPENAI_API_KEY is not configured
  if (!process.env.OPENAI_API_KEY) {
    console.log("[Autonomous] OPENAI_API_KEY not set — using rule-based analysis fallback");
    return analyzeWithRules(campaigns);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Detect data quality and anomaly issues before sending to AI
    const anomalies = await detectAnomalies(campaigns);

    const campaignSummary = campaigns
      .map(
        (c) =>
          `- ${c.campaignName} (${c.status}): Spend=$${c.spend.toFixed(2)}, Impressions=${c.impressions}, Clicks=${c.clicks}, CTR=${c.ctr.toFixed(2)}%, CPC=$${c.cpc.toFixed(2)}, Conversions=${c.conversions}, ROAS=${c.roas.toFixed(1)}x, DailyBudget=$${c.dailyBudget}`
      )
      .join("\n");

    const anomalySummary =
      anomalies.length > 0
        ? "\n\nDetected data quality / anomaly issues (must be addressed in your actions):\n" +
          anomalies
            .map((a) => `- [${a.type.toUpperCase()} / ${a.severity}] ${a.campaignName}: ${a.description}`)
            .join("\n")
        : "\n\nNo data quality anomalies detected.";

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
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
                      additionalProperties: true,
                    },
                    triggerData: {
                      type: "object",
                      additionalProperties: true,
                    },
                  },
                  required: [
                    "campaignId",
                    "campaignName",
                    "actionType",
                    "title",
                    "description",
                    "confidence",
                    "expectedImpact",
                    "actionParams",
                    "triggerData",
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
      messages: [
        {
          role: "system",
          content: `You are a marketing optimization AI for Golf VX Arlington Heights, an indoor golf simulator facility.
Analyze campaign performance data and generate specific optimization actions.
IMPORTANT: Do NOT consider anything related to 'Studio Soo portrait business' Meta ad account.

Pay special attention to the following anomaly types that may be present in the data:
- stale_data: Campaign data has not synced in >24h — recommend triggering a data refresh action
- zero_values: Active campaign with all-zero metrics — likely a failed API fetch, flag for investigation
- ctr_drop: CTR has dropped >50% below baseline — may indicate ad fatigue or audience issues
- spend_spike: Spend exceeds 200% of expected daily rate — flag for budget review

For each action, use one of these actionType values:
- "budget_decrease": Reduce daily budget (low risk, auto-executed)
- "budget_increase": Increase daily budget (high risk, needs approval)
- "pause_underperformer": Pause a poorly performing campaign (low risk)
- "reduce_frequency": Add frequency cap (low risk)
- "change_targeting": Modify audience targeting (high risk)
- "send_email": Trigger email nurture via Encharge (high risk)
- "collect_data": Not enough data yet (monitor)
- "investigate_data": Data quality issue detected — investigate API sync (monitor)

For budget actions, include "budgetChange" (decimal, e.g. -0.25 for 25% decrease, 0.30 for 30% increase) and "currentDailyBudget" in actionParams.
For email actions, include "emailType" and "targetAudience" in actionParams.
For data issues, include "anomalyType" and "severity" in actionParams.

Return a JSON object with an "actions" array. Each action must have: campaignId, campaignName, actionType, title, description, confidence (0-100), expectedImpact, actionParams (object), triggerData (object).`,
        },
        {
          role: "user",
          content: `Analyze these Golf VX campaigns and generate optimization actions:\n\n${campaignSummary}${anomalySummary}`,
        },
      ],
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("OpenAI returned empty response");

    const parsed = JSON.parse(rawContent) as { actions: Array<{
      campaignId: string;
      campaignName: string;
      actionType: string;
      title: string;
      description: string;
      confidence: number;
      expectedImpact: string;
      actionParams?: Record<string, unknown>;
      triggerData?: Record<string, unknown>;
    }> };

    return (parsed.actions || []).map((a) => ({
      campaignId: a.campaignId,
      campaignName: a.campaignName,
      actionType: a.actionType,
      riskLevel: classifyRisk(a.actionType),
      title: a.title,
      description: a.description,
      actionParams: a.actionParams ?? {},
      triggerData: a.triggerData ?? {},
      confidence: a.confidence,
      expectedImpact: a.expectedImpact,
    }));
  } catch (error) {
    console.warn("[Autonomous] OpenAI analysis failed, falling back to rule-based analysis:", error);
    return analyzeWithRules(campaigns);
  }
}
