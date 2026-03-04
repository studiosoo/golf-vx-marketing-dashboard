/**
 * Autonomous Marketing Intelligence Engine — Rule-Based Analysis
 *
 * Rule-based fallback analysis used when LLM is unavailable.
 * Also provides the foundation for LLM-powered analysis decisions.
 */

import { invokeLLM } from "../_core/llm";
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

// ─── LLM-Powered Analysis ─────────────────────────────────────────────────────

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
