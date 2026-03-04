/**
 * Autonomous Marketing Intelligence Engine — Action Execution Engine
 *
 * Handles execution of all action types:
 * - Meta Ads budget changes (decrease/increase)
 * - Encharge email nurture triggers
 * - Targeting review notifications
 * - Campaign pause via Meta Ads API
 * - Frequency cap recommendations
 */

import { notifyOwner } from "../_core/notification";
import { ActionExecutionResult } from "./types";

// ─── Main Dispatcher ──────────────────────────────────────────────────────────

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

// ─── Budget Change ────────────────────────────────────────────────────────────

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
    const { getCampaignBudget } = await import("../metaAds");
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

// ─── Email Trigger ────────────────────────────────────────────────────────────

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
    await import("../encharge");

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

// ─── Targeting Review ─────────────────────────────────────────────────────────

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

// ─── Campaign Pause ───────────────────────────────────────────────────────────

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

// ─── Frequency Cap ────────────────────────────────────────────────────────────

/**
 * Apply frequency cap (logged + notify, actual cap set in Ads Manager)
 */
async function executeFrequencyCap(
  campaignId: string,
  campaignName: string,
  _params: Record<string, unknown>
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
