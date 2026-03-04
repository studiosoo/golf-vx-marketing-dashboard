/**
 * Autonomous Marketing Intelligence Engine — Risk Classification
 */

// ─── Risk Level Constants ─────────────────────────────────────────────────────

export const LOW_RISK_ACTIONS = ["budget_decrease", "pause_underperformer", "reduce_frequency"];
export const HIGH_RISK_ACTIONS = ["budget_increase", "send_email", "change_targeting", "launch_campaign"];
export const MONITOR_ACTIONS = ["monitor", "collect_data", "wait_for_data"];

// ─── Risk Classification Functions ───────────────────────────────────────────

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
