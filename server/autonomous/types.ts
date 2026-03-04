/**
 * Autonomous Marketing Intelligence Engine — Type Definitions
 */

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
