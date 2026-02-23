import { describe, expect, it } from "vitest";
import {
  analyzeWithRules,
  getDemoCampaigns,
  type CampaignData,
  type AnalysisResult,
} from "./autonomous";

// ─── Helper: Create a campaign with overrides ────────────────────────────────

function makeCampaign(overrides: Partial<CampaignData> = {}): CampaignData {
  return {
    id: "test_001",
    name: "Test Campaign",
    status: "ACTIVE",
    objective: "CONVERSIONS",
    dailyBudget: 30,
    lifetimeBudget: 0,
    spend: 200,
    impressions: 10000,
    clicks: 150,
    ctr: 1.5,
    cpc: 1.33,
    conversions: 10,
    costPerConversion: 20,
    roas: 2.5,
    reach: 7000,
    frequency: 1.4,
    startDate: "2026-02-01",
    daysRunning: 22,
    ...overrides,
  };
}

// ─── Rule-Based Analysis Tests ───────────────────────────────────────────────

describe("analyzeWithRules", () => {
  it("returns monitoring for campaigns with insufficient data (< 3 days)", () => {
    const campaigns = [makeCampaign({ daysRunning: 2, impressions: 400 })];
    const results = analyzeWithRules(campaigns);

    expect(results.length).toBeGreaterThanOrEqual(1);
    const monitorResult = results.find((r) => r.riskLevel === "monitor");
    expect(monitorResult).toBeDefined();
    expect(monitorResult!.actionType).toBe("alert");
    expect(monitorResult!.title).toContain("Monitoring");
  });

  it("returns monitoring for campaigns with insufficient impressions (< 500)", () => {
    const campaigns = [makeCampaign({ daysRunning: 5, impressions: 300 })];
    const results = analyzeWithRules(campaigns);

    expect(results.length).toBeGreaterThanOrEqual(1);
    const monitorResult = results.find((r) => r.riskLevel === "monitor");
    expect(monitorResult).toBeDefined();
  });

  it("returns low-risk pause for zero conversions after 7+ days with $50+ spend", () => {
    const campaigns = [
      makeCampaign({
        daysRunning: 10,
        conversions: 0,
        costPerConversion: 0,
        spend: 100,
        impressions: 5000,
        roas: 0,
      }),
    ];
    const results = analyzeWithRules(campaigns);

    const pauseResult = results.find((r) => r.actionType === "pause");
    expect(pauseResult).toBeDefined();
    expect(pauseResult!.riskLevel).toBe("low");
    expect(pauseResult!.title).toContain("Auto-Pause");
  });

  it("returns low-risk budget decrease for very high CPA (> 3x target)", () => {
    const campaigns = [
      makeCampaign({
        costPerConversion: 100,
        conversions: 3,
        ctr: 0.8,
        daysRunning: 10,
        impressions: 20000,
      }),
    ];
    const results = analyzeWithRules(campaigns);

    const budgetResult = results.find(
      (r) => r.actionType === "budget_adjustment" && r.riskLevel === "low"
    );
    expect(budgetResult).toBeDefined();
    expect(budgetResult!.title).toContain("Budget Decrease");
  });

  it("returns medium-risk budget increase for campaigns with good ROAS (> 2x)", () => {
    const campaigns = [
      makeCampaign({
        roas: 3.0,
        conversions: 10,
        daysRunning: 10,
        costPerConversion: 20,
        ctr: 1.5,
        frequency: 1.4,
      }),
    ];
    const results = analyzeWithRules(campaigns);

    const budgetIncrease = results.find(
      (r) => r.actionType === "budget_adjustment" && r.riskLevel === "medium"
    );
    expect(budgetIncrease).toBeDefined();
    expect(budgetIncrease!.title).toContain("Budget Increase");
  });

  it("returns medium-risk targeting change for high frequency (> 3.0)", () => {
    const campaigns = [
      makeCampaign({
        frequency: 3.5,
        daysRunning: 10,
        costPerConversion: 100,
        conversions: 2,
        ctr: 0.8,
        impressions: 20000,
      }),
    ];
    const results = analyzeWithRules(campaigns);

    const fatigueResult = results.find(
      (r) => r.actionType === "targeting_change"
    );
    expect(fatigueResult).toBeDefined();
    expect(fatigueResult!.riskLevel).toBe("medium");
    expect(fatigueResult!.title).toContain("Audience Fatigue");
  });

  it("returns high-risk creative refresh for low CTR (< 1%) with decent impressions", () => {
    const campaigns = [
      makeCampaign({
        ctr: 0.5,
        impressions: 10000,
        daysRunning: 7,
        costPerConversion: 100,
        conversions: 2,
      }),
    ];
    const results = analyzeWithRules(campaigns);

    const creativeResult = results.find(
      (r) => r.actionType === "creative_refresh"
    );
    expect(creativeResult).toBeDefined();
    expect(creativeResult!.riskLevel).toBe("high");
  });

  it("returns monitoring for healthy campaigns within acceptable range", () => {
    const campaigns = [
      makeCampaign({
        costPerConversion: 20,
        ctr: 1.5,
        frequency: 1.4,
        conversions: 10,
        daysRunning: 15,
      }),
    ];
    const results = analyzeWithRules(campaigns);

    const healthyResult = results.find(
      (r) => r.riskLevel === "monitor" && r.title.startsWith("On Track")
    );
    expect(healthyResult).toBeDefined();
  });

  it("returns empty array for empty campaign list", () => {
    const results = analyzeWithRules([]);
    expect(results).toEqual([]);
  });

  it("includes campaign metrics in all results", () => {
    const campaigns = [makeCampaign()];
    const results = analyzeWithRules(campaigns);

    for (const result of results) {
      expect(result.campaignMetrics).toBeDefined();
      expect(result.campaignMetrics).toHaveProperty("spend");
      expect(result.campaignMetrics).toHaveProperty("impressions");
    }
  });

  it("includes required fields in all results", () => {
    const campaigns = [makeCampaign()];
    const results = analyzeWithRules(campaigns);

    for (const result of results) {
      expect(result.campaignId).toBeDefined();
      expect(result.campaignName).toBeDefined();
      expect(result.actionType).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.recommendation).toBeDefined();
      expect(typeof result.confidence).toBe("number");
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
      expect(["low", "medium", "high"]).toContain(result.impactEstimate);
    }
  });
});

// ─── Demo Campaign Data Tests ────────────────────────────────────────────────

describe("getDemoCampaigns", () => {
  it("returns 7 demo campaigns", () => {
    const campaigns = getDemoCampaigns();
    expect(campaigns).toHaveLength(7);
  });

  it("includes Junior Summer Camp and Anniversary Giveaway", () => {
    const campaigns = getDemoCampaigns();
    const names = campaigns.map((c) => c.name);
    expect(names).toContain("Junior Summer Camp 2026 - Early Bird");
    expect(names).toContain("Anniversary Giveaway - Annual Membership");
  });

  it("does not include Studio Soo campaigns", () => {
    const campaigns = getDemoCampaigns();
    const studioSoo = campaigns.filter((c) =>
      c.name.toLowerCase().includes("studio soo")
    );
    expect(studioSoo).toHaveLength(0);
  });

  it("all campaigns have valid numeric fields", () => {
    const campaigns = getDemoCampaigns();
    for (const c of campaigns) {
      expect(c.spend).toBeGreaterThanOrEqual(0);
      expect(c.impressions).toBeGreaterThanOrEqual(0);
      expect(c.clicks).toBeGreaterThanOrEqual(0);
      expect(c.ctr).toBeGreaterThanOrEqual(0);
      expect(c.daysRunning).toBeGreaterThanOrEqual(0);
      expect(c.dailyBudget).toBeGreaterThan(0);
    }
  });

  it("generates correct analysis results for demo campaigns", () => {
    const campaigns = getDemoCampaigns();
    const results = analyzeWithRules(campaigns);

    // Should generate at least some results
    expect(results.length).toBeGreaterThan(0);

    // Check risk level distribution
    const lowRisk = results.filter((r) => r.riskLevel === "low");
    const mediumRisk = results.filter((r) => r.riskLevel === "medium");
    const highRisk = results.filter((r) => r.riskLevel === "high");
    const monitor = results.filter((r) => r.riskLevel === "monitor");

    // Should have a mix of risk levels
    expect(lowRisk.length + mediumRisk.length + highRisk.length + monitor.length).toBe(results.length);

    // Weekend Drive Day (2 days) should be in monitoring
    const weekendDrive = results.find((r) =>
      r.campaignName.includes("Weekend Drive Day")
    );
    expect(weekendDrive).toBeDefined();
    expect(weekendDrive!.riskLevel).toBe("monitor");

    // $25 Trial Session (high CPA $114.20) should have budget decrease
    const trialSession = results.find(
      (r) =>
        r.campaignName.includes("Trial Session") &&
        r.actionType === "budget_adjustment"
    );
    expect(trialSession).toBeDefined();
    expect(trialSession!.riskLevel).toBe("low");

    // Anniversary Giveaway (ROAS 3.15x) should have budget increase
    const anniversary = results.find(
      (r) =>
        r.campaignName.includes("Anniversary Giveaway") &&
        r.actionType === "budget_adjustment"
    );
    expect(anniversary).toBeDefined();
    expect(anniversary!.riskLevel).toBe("medium");
  });
});

// ─── Risk Level Classification Tests ─────────────────────────────────────────

describe("risk level classification", () => {
  it("classifies budget decrease as low risk", () => {
    const campaigns = [
      makeCampaign({
        costPerConversion: 120,
        conversions: 2,
        ctr: 0.8,
        daysRunning: 10,
        impressions: 15000,
      }),
    ];
    const results = analyzeWithRules(campaigns);
    const budgetDecrease = results.find(
      (r) => r.actionType === "budget_adjustment" && r.riskLevel === "low"
    );
    expect(budgetDecrease).toBeDefined();
  });

  it("classifies budget increase as medium risk", () => {
    const campaigns = [
      makeCampaign({
        roas: 3.0,
        conversions: 5,
        daysRunning: 10,
        costPerConversion: 20,
        ctr: 1.5,
        frequency: 1.4,
      }),
    ];
    const results = analyzeWithRules(campaigns);
    const budgetIncrease = results.find(
      (r) => r.actionType === "budget_adjustment" && r.riskLevel === "medium"
    );
    expect(budgetIncrease).toBeDefined();
  });

  it("classifies creative refresh as high risk", () => {
    const campaigns = [
      makeCampaign({
        ctr: 0.5,
        impressions: 10000,
        daysRunning: 7,
        costPerConversion: 100,
        conversions: 2,
      }),
    ];
    const results = analyzeWithRules(campaigns);
    const creative = results.find((r) => r.actionType === "creative_refresh");
    expect(creative).toBeDefined();
    expect(creative!.riskLevel).toBe("high");
  });
});
