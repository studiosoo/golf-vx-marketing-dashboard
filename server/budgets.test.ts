import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@golfvx.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Budget Management API", () => {
  describe("Campaign Budget Summary", () => {
    it("should calculate budget summary correctly", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Get a campaign to test with
      const campaigns = await caller.campaigns.list();
      expect(campaigns.length).toBeGreaterThan(0);

      const campaign = campaigns[0];
      const summary = await caller.budgets.getCampaignBudgetSummary({
        campaignId: campaign.id,
      });

      expect(summary).toBeDefined();
      expect(summary.campaignId).toBe(campaign.id);
      expect(summary.campaignName).toBe(campaign.name);
      expect(summary.plannedBudget).toBeDefined();
      expect(summary.totalActualSpend).toBeDefined();
      expect(summary.remaining).toBeDefined();
      expect(summary.utilization).toBeDefined();

      // Verify calculation: totalActualSpend = metaAdsSpend + manualExpenses
      const metaAdsSpend = parseFloat(summary.metaAdsSpend || "0");
      const manualExpenses = parseFloat(summary.manualExpenses);
      const totalActualSpend = parseFloat(summary.totalActualSpend);
      expect(totalActualSpend).toBeCloseTo(metaAdsSpend + manualExpenses, 2);

      // Verify remaining = plannedBudget - totalActualSpend
      const plannedBudget = parseFloat(summary.plannedBudget);
      const remaining = parseFloat(summary.remaining);
      expect(remaining).toBeCloseTo(plannedBudget - totalActualSpend, 2);

      // Verify utilization percentage
      const utilization = parseFloat(summary.utilization);
      const expectedUtilization = plannedBudget > 0 ? (totalActualSpend / plannedBudget) * 100 : 0;
      expect(utilization).toBeCloseTo(expectedUtilization, 2);
    });
  });

  describe("Campaign Expenses", () => {
    it("should add and retrieve campaign expenses", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Get a campaign
      const campaigns = await caller.campaigns.list();
      const campaign = campaigns[0];

      // Add an expense
      const expenseData = {
        campaignId: campaign.id,
        date: new Date("2026-02-15"),
        category: "food_beverage" as const,
        amount: "250.00",
        description: "Catering for event",
      };

      const result = await caller.budgets.addExpense(expenseData);
      expect(result.id).toBeDefined();

      // Retrieve expenses
      const expenses = await caller.budgets.getCampaignExpenses({
        campaignId: campaign.id,
      });

      const addedExpense = expenses.find(e => e.id === result.id);
      expect(addedExpense).toBeDefined();
      expect(addedExpense?.category).toBe(expenseData.category);
      expect(addedExpense?.amount).toBe(expenseData.amount);
      expect(addedExpense?.description).toBe(expenseData.description);
    });

    it("should update campaign expense", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Get a campaign and add an expense
      const campaigns = await caller.campaigns.list();
      const campaign = campaigns[0];

      const expenseResult = await caller.budgets.addExpense({
        campaignId: campaign.id,
        date: new Date("2026-02-15"),
        category: "promotional_materials" as const,
        amount: "100.00",
        description: "Original description",
      });

      // Update the expense
      await caller.budgets.updateExpense({
        id: expenseResult.id,
        amount: "150.00",
        description: "Updated description",
      });

      // Verify update
      const expenses = await caller.budgets.getCampaignExpenses({
        campaignId: campaign.id,
      });

      const updatedExpense = expenses.find(e => e.id === expenseResult.id);
      expect(updatedExpense?.amount).toBe("150.00");
      expect(updatedExpense?.description).toBe("Updated description");
    });

    it("should delete campaign expense", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Get a campaign and add an expense
      const campaigns = await caller.campaigns.list();
      const campaign = campaigns[0];

      const expenseResult = await caller.budgets.addExpense({
        campaignId: campaign.id,
        date: new Date("2026-02-15"),
        category: "other" as const,
        amount: "50.00",
      });

      // Delete the expense
      await caller.budgets.deleteExpense({ id: expenseResult.id });

      // Verify deletion
      const expenses = await caller.budgets.getCampaignExpenses({
        campaignId: campaign.id,
      });

      const deletedExpense = expenses.find(e => e.id === expenseResult.id);
      expect(deletedExpense).toBeUndefined();
    });
  });

  describe("Campaign Budget Updates", () => {
    it("should update campaign budget", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Get a campaign
      const campaigns = await caller.campaigns.list();
      const campaign = campaigns[0];

      // Update budget
      await caller.budgets.updateCampaignBudget({
        campaignId: campaign.id,
        budget: "5000.00",
        metaAdsBudget: "3000.00",
      });

      // Verify update
      const updatedCampaign = await caller.campaigns.getById({ id: campaign.id });
      expect(updatedCampaign.budget).toBe("5000.00");
      expect(updatedCampaign.metaAdsBudget).toBe("3000.00");
    });
  });

  describe("Meta Ads Integration", () => {
    it("should link Meta Ads campaign to database campaign", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Get a campaign
      const campaigns = await caller.campaigns.list();
      const campaign = campaigns.find(c => !c.metaAdsCampaignId);

      if (campaign) {
        // Link to a Meta Ads campaign
        const metaAdsCampaignId = "test_meta_campaign_123";
        await caller.budgets.linkMetaAdsCampaign({
          campaignId: campaign.id,
          metaAdsCampaignId,
        });

        // Verify link
        const updatedCampaign = await caller.campaigns.getById({ id: campaign.id });
        expect(updatedCampaign.metaAdsCampaignId).toBe(metaAdsCampaignId);
      }
    });

    it("should sync Meta Ads budgets", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // This will attempt to sync campaigns that have metaAdsCampaignId set
      const result = await caller.budgets.syncMetaAdsBudgets();

      expect(result).toBeDefined();
      expect(result.syncedCampaigns).toBeDefined();
      expect(Array.isArray(result.syncedCampaigns)).toBe(true);
    });

    it("should auto-link Meta Ads campaigns by name", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // This will attempt to match campaigns by name
      const result = await caller.budgets.autoLinkMetaAdsCampaigns();

      expect(result).toBeDefined();
      expect(result.linkedCampaigns).toBeDefined();
      expect(Array.isArray(result.linkedCampaigns)).toBe(true);
    });
  });

  describe("Budget Calculation Edge Cases", () => {
    it("should handle zero budget correctly", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const campaigns = await caller.campaigns.list();
      const campaign = campaigns[0];

      // Set budget to zero
      await caller.budgets.updateCampaignBudget({
        campaignId: campaign.id,
        budget: "0.00",
      });

      const summary = await caller.budgets.getCampaignBudgetSummary({
        campaignId: campaign.id,
      });

      expect(parseFloat(summary.plannedBudget)).toBe(0);
      // Utilization should be 0 when budget is 0
      expect(parseFloat(summary.utilization)).toBe(0);
    });

    it("should handle negative remaining budget (over budget)", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const campaigns = await caller.campaigns.list();
      const campaign = campaigns[0];

      // Set a small budget
      await caller.budgets.updateCampaignBudget({
        campaignId: campaign.id,
        budget: "100.00",
      });

      // Add expenses that exceed budget
      await caller.budgets.addExpense({
        campaignId: campaign.id,
        date: new Date(),
        category: "other" as const,
        amount: "150.00",
        description: "Over budget expense",
      });

      const summary = await caller.budgets.getCampaignBudgetSummary({
        campaignId: campaign.id,
      });

      const remaining = parseFloat(summary.remaining);
      const utilization = parseFloat(summary.utilization);

      // Remaining should be negative
      expect(remaining).toBeLessThan(0);
      // Utilization should be over 100%
      expect(utilization).toBeGreaterThan(100);
    });
  });
});
