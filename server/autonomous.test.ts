import { describe, expect, it } from "vitest";
import {
  classifyRisk,
  determineStatus,
  analyzeWithRules,
  type CampaignMetrics,
  type GeneratedAction,
  type ActionExecutionResult,
} from "./autonomous";

// ─── classifyRisk ──────────────────────────────────────────────────────────────

describe("classifyRisk", () => {
  it("classifies budget_decrease as low risk", () => {
    expect(classifyRisk("budget_decrease")).toBe("low");
  });

  it("classifies pause_underperformer as low risk", () => {
    expect(classifyRisk("pause_underperformer")).toBe("low");
  });

  it("classifies budget_increase as high risk", () => {
    expect(classifyRisk("budget_increase")).toBe("high");
  });

  it("classifies change_targeting as high risk", () => {
    expect(classifyRisk("change_targeting")).toBe("high");
  });

  it("classifies send_email as high risk", () => {
    expect(classifyRisk("send_email")).toBe("high");
  });

  it("classifies monitor as monitor", () => {
    expect(classifyRisk("monitor")).toBe("monitor");
  });

  it("classifies collect_data as monitor", () => {
    expect(classifyRisk("collect_data")).toBe("monitor");
  });

  it("classifies unknown actions as medium", () => {
    expect(classifyRisk("unknown_action")).toBe("medium");
  });
});

// ─── determineStatus ───────────────────────────────────────────────────────────

describe("determineStatus", () => {
  it("auto-executes low risk actions", () => {
    expect(determineStatus("low")).toBe("auto_executed");
  });

  it("requires approval for medium risk actions", () => {
    expect(determineStatus("medium")).toBe("pending_approval");
  });

  it("requires approval for high risk actions", () => {
    expect(determineStatus("high")).toBe("pending_approval");
  });

  it("sets monitoring status for monitor risk level", () => {
    expect(determineStatus("monitor")).toBe("monitoring");
  });
});

// ─── analyzeWithRules ──────────────────────────────────────────────────────────

function makeCampaign(overrides: Partial<CampaignMetrics> = {}): CampaignMetrics {
  return {
    campaignId: "camp-test",
    campaignName: "Test Campaign",
    status: "ACTIVE",
    spend: 100,
    impressions: 5000,
    clicks: 100,
    conversions: 5,
    ctr: 2.0,
    cpc: 1.0,
    cpm: 20.0,
    roas: 2.0,
    dailyBudget: 25,
    lifetimeBudget: 500,
    ...overrides,
  };
}

describe("analyzeWithRules", () => {
  it("returns empty array for empty input", () => {
    const actions = analyzeWithRules([]);
    expect(actions).toEqual([]);
  });

  it("skips non-active campaigns", () => {
    const campaigns = [makeCampaign({ status: "PAUSED" })];
    const actions = analyzeWithRules(campaigns);
    expect(actions).toEqual([]);
  });

  it("generates collect_data (monitor) for low-data campaigns", () => {
    const campaigns = [
      makeCampaign({
        campaignId: "camp3",
        campaignName: "New Campaign",
        spend: 5,
        impressions: 50,
        clicks: 2,
        conversions: 0,
      }),
    ];

    const actions = analyzeWithRules(campaigns);
    const monitorAction = actions.find((a) => a.actionType === "collect_data");
    expect(monitorAction).toBeDefined();
    expect(monitorAction?.riskLevel).toBe("monitor");
  });

  it("generates budget_decrease for very low CTR campaigns", () => {
    const campaigns = [
      makeCampaign({
        campaignId: "camp5",
        campaignName: "Low CTR Campaign",
        impressions: 5000,
        clicks: 10,
        ctr: 0.2,
        cpc: 5.0,
        spend: 50,
        conversions: 0,
      }),
    ];

    const actions = analyzeWithRules(campaigns);
    const budgetAction = actions.find((a) => a.actionType === "budget_decrease");
    expect(budgetAction).toBeDefined();
    expect(budgetAction?.riskLevel).toBe("low");
  });

  it("generates budget_decrease for high CPC campaigns", () => {
    const campaigns = [
      makeCampaign({
        campaignId: "camp1",
        campaignName: "Expensive Campaign",
        spend: 200,
        impressions: 2000,
        clicks: 20,
        conversions: 0,
        ctr: 1.0,
        cpc: 10.0,
      }),
    ];

    const actions = analyzeWithRules(campaigns);
    const budgetAction = actions.find(
      (a) => a.actionType === "budget_decrease" && a.description.includes("CPC")
    );
    expect(budgetAction).toBeDefined();
    expect(budgetAction?.riskLevel).toBe("low");
    expect(budgetAction?.campaignName).toBe("Expensive Campaign");
  });

  it("generates budget_increase for strong ROAS campaigns", () => {
    const campaigns = [
      makeCampaign({
        campaignId: "camp4",
        campaignName: "Star Campaign",
        spend: 200,
        impressions: 20000,
        clicks: 600,
        conversions: 30,
        ctr: 3.0,
        cpc: 0.33,
        roas: 5.0,
      }),
    ];

    const actions = analyzeWithRules(campaigns);
    const increaseAction = actions.find((a) => a.actionType === "budget_increase");
    expect(increaseAction).toBeDefined();
    expect(increaseAction?.riskLevel).toBe("high");
  });

  it("generates send_email for campaigns with conversions and good CTR", () => {
    const campaigns = [
      makeCampaign({
        campaignId: "camp6",
        campaignName: "Converting Campaign",
        ctr: 2.5,
        conversions: 10,
        spend: 100,
        impressions: 5000,
      }),
    ];

    const actions = analyzeWithRules(campaigns);
    const emailAction = actions.find((a) => a.actionType === "send_email");
    expect(emailAction).toBeDefined();
    expect(emailAction?.riskLevel).toBe("high");
  });

  it("generates change_targeting for high CTR but zero conversions", () => {
    const campaigns = [
      makeCampaign({
        campaignId: "camp7",
        campaignName: "Clicks No Convert",
        ctr: 3.5,
        conversions: 0,
        spend: 50,
        impressions: 2000,
        clicks: 70,
      }),
    ];

    const actions = analyzeWithRules(campaigns);
    const targetAction = actions.find((a) => a.actionType === "change_targeting");
    expect(targetAction).toBeDefined();
    expect(targetAction?.riskLevel).toBe("high");
  });

  it("can generate multiple actions for the same campaign", () => {
    const campaigns = [
      makeCampaign({
        campaignId: "camp8",
        campaignName: "Multi-Issue Campaign",
        ctr: 0.3,
        cpc: 8.0,
        impressions: 5000,
        clicks: 15,
        conversions: 0,
        spend: 120,
      }),
    ];

    const actions = analyzeWithRules(campaigns);
    // Should generate both budget_decrease for low CTR and budget_decrease for high CPC
    expect(actions.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── GeneratedAction structure ────────────────────────────────────────────────

describe("GeneratedAction structure", () => {
  it("generates actions with all required fields", () => {
    const campaigns = [
      makeCampaign({
        campaignId: "camp-struct",
        campaignName: "Structure Test",
        ctr: 0.2,
        impressions: 5000,
        clicks: 10,
        spend: 50,
        conversions: 0,
      }),
    ];

    const actions = analyzeWithRules(campaigns);
    expect(actions.length).toBeGreaterThan(0);

    const action = actions[0];
    expect(action).toHaveProperty("campaignId");
    expect(action).toHaveProperty("campaignName");
    expect(action).toHaveProperty("actionType");
    expect(action).toHaveProperty("riskLevel");
    expect(action).toHaveProperty("title");
    expect(action).toHaveProperty("description");
    expect(action).toHaveProperty("confidence");
    expect(action).toHaveProperty("expectedImpact");
    expect(typeof action.confidence).toBe("number");
    expect(action.confidence).toBeGreaterThanOrEqual(0);
    expect(action.confidence).toBeLessThanOrEqual(100);
  });

  it("includes actionParams for budget actions", () => {
    const campaigns = [
      makeCampaign({
        campaignId: "camp-params",
        campaignName: "Params Test",
        ctr: 0.2,
        impressions: 5000,
        clicks: 10,
        spend: 50,
        conversions: 0,
      }),
    ];

    const actions = analyzeWithRules(campaigns);
    const budgetAction = actions.find((a) => a.actionType === "budget_decrease");
    expect(budgetAction).toBeDefined();
    expect(budgetAction?.actionParams).toBeDefined();
  });
});

// ─── ActionExecutionResult type ───────────────────────────────────────────────

describe("ActionExecutionResult type", () => {
  it("validates success result structure", () => {
    const result: ActionExecutionResult = {
      success: true,
      message: "Budget decreased successfully",
      details: { previousBudget: 100, newBudget: 80 },
    };
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
    expect(result.details).toBeDefined();
  });

  it("validates failure result structure", () => {
    const result: ActionExecutionResult = {
      success: false,
      message: "Meta Ads API error",
    };
    expect(result.success).toBe(false);
    expect(result.message).toBeDefined();
  });
});

// ─── Risk-based action flow ───────────────────────────────────────────────────

describe("Risk-based action flow", () => {
  it("low-risk actions get auto_executed status", () => {
    const campaigns = [
      makeCampaign({
        ctr: 0.2,
        impressions: 5000,
        clicks: 10,
        spend: 50,
        conversions: 0,
      }),
    ];
    const actions = analyzeWithRules(campaigns);
    const lowRisk = actions.filter((a) => a.riskLevel === "low");
    lowRisk.forEach((a) => {
      expect(determineStatus(a.riskLevel)).toBe("auto_executed");
    });
  });

  it("high-risk actions get pending_approval status", () => {
    const campaigns = [
      makeCampaign({
        ctr: 3.0,
        conversions: 20,
        spend: 200,
        impressions: 10000,
        clicks: 300,
        roas: 5.0,
      }),
    ];
    const actions = analyzeWithRules(campaigns);
    const highRisk = actions.filter((a) => a.riskLevel === "high");
    highRisk.forEach((a) => {
      expect(determineStatus(a.riskLevel)).toBe("pending_approval");
    });
  });

  it("monitor actions get monitoring status", () => {
    const campaigns = [
      makeCampaign({
        spend: 5,
        impressions: 50,
        clicks: 2,
        conversions: 0,
      }),
    ];
    const actions = analyzeWithRules(campaigns);
    const monitorActions = actions.filter((a) => a.riskLevel === "monitor");
    monitorActions.forEach((a) => {
      expect(determineStatus(a.riskLevel)).toBe("monitoring");
    });
  });
});
