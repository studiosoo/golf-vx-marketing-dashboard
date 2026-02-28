import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

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

describe("Dashboard API", () => {
  const { ctx } = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  const dateRange = {
    startDate: new Date("2025-08-01"),
    endDate: new Date("2026-02-19"),
  };

  describe("campaigns", () => {
    it("should list all campaigns", async () => {
      const campaigns = await caller.campaigns.list();
      expect(campaigns).toBeDefined();
      expect(Array.isArray(campaigns)).toBe(true);
      expect(campaigns.length).toBeGreaterThan(0);
    });

    it("should get campaign by status", async () => {
      const activeCampaigns = await caller.campaigns.getByStatus({ status: "active" });
      expect(activeCampaigns).toBeDefined();
      expect(Array.isArray(activeCampaigns)).toBe(true);
      activeCampaigns.forEach(campaign => {
        expect(campaign.status).toBe("active");
      });
    });
  });

  describe("channels", () => {
    it("should list all channels", async () => {
      const channels = await caller.channels.list();
      expect(channels).toBeDefined();
      expect(Array.isArray(channels)).toBe(true);
      expect(channels.length).toBeGreaterThan(0);
    });

    it("should get channel performance summary", async () => {
      const performance = await caller.channels.getPerformanceSummary(dateRange);
      expect(performance).toBeDefined();
      expect(Array.isArray(performance)).toBe(true);
    });
  });

  describe("members", () => {
    it("should list all members", async () => {
      const members = await caller.members.list();
      expect(members).toBeDefined();
      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBeGreaterThan(0);
    });

    it("should get member stats", async () => {
      const stats = await caller.members.getStats();
      expect(stats).toBeDefined();
      expect(Number(stats?.totalMembers)).toBeGreaterThan(0);
      expect(Number(stats?.activeMembers)).toBeGreaterThan(0);
    });

    it("should filter members by tier", async () => {
      const allAccessMembers = await caller.members.getByTier({ tier: "all_access_aces" });
      expect(allAccessMembers).toBeDefined();
      expect(Array.isArray(allAccessMembers)).toBe(true);
      allAccessMembers.forEach(member => {
        expect(member.membershipTier).toBe("all_access_aces");
      });
    });
  });

  describe("revenue", () => {
    it("should get revenue by date range", async () => {
      const revenue = await caller.revenue.getByDateRange(dateRange);
      expect(revenue).toBeDefined();
      expect(Array.isArray(revenue)).toBe(true);
    });

    it("should get revenue summary", async () => {
      const summary = await caller.revenue.getSummary(dateRange);
      expect(summary).toBeDefined();
      expect(Array.isArray(summary)).toBe(true);
    });

    it("should get total revenue", async () => {
      const total = await caller.revenue.getTotal(dateRange);
      expect(total).toBeDefined();
      expect(typeof total).toBe("string");
      expect(parseFloat(total)).toBeGreaterThan(0);
    });
  });

  describe("tasks", () => {
    it("should list all tasks", async () => {
      const tasks = await caller.tasks.list();
      expect(tasks).toBeDefined();
      expect(Array.isArray(tasks)).toBe(true);
    });

    it("should filter tasks by completion status", async () => {
      const completedTasks = await caller.tasks.getByStatus({ completed: true });
      expect(completedTasks).toBeDefined();
      expect(Array.isArray(completedTasks)).toBe(true);
      completedTasks.forEach(task => {
        expect(task.completed).toBe(true);
      });
    });
  });

  describe("dashboard", () => {
    it("should get overview with all key metrics", async () => {
      const overview = await caller.dashboard.getOverview(dateRange);
      expect(overview).toBeDefined();
      expect(overview.totalRevenue).toBeDefined();
      expect(Number(overview.activeMembers)).toBeGreaterThan(0);
      expect(Number(overview.totalMembers)).toBeGreaterThan(0);
      expect(Number(overview.monthlyRecurringRevenue)).toBeGreaterThan(0);
      expect(Number(overview.activeCampaignsCount)).toBeGreaterThan(0);
      expect(overview.memberStats).toBeDefined();
      expect(overview.channelPerformance).toBeDefined();
    });

    it("should calculate MRR correctly based on membership tiers", async () => {
      const overview = await caller.dashboard.getOverview(dateRange);
      const stats = overview.memberStats;
      
      if (stats) {
        const expectedMRR = 
          (stats.allAccessCount || 0) * 325 +
          (stats.swingSaversCount || 0) * 225 +
          (stats.golfVxProCount || 0) * 500;
        
        expect(overview.monthlyRecurringRevenue).toBe(expectedMRR);
      }
    });

    it("should get revenue chart data", async () => {
      const chartData = await caller.dashboard.getRevenueChart(dateRange);
      expect(chartData).toBeDefined();
      expect(Array.isArray(chartData)).toBe(true);
      
      if (chartData.length > 0) {
        chartData.forEach(item => {
          expect(item.month).toBeDefined();
          expect(item.revenue).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });
});
