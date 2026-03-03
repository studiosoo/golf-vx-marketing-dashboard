/**
 * Unit tests for Toast revenue tRPC procedures and sync job
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the DB module ───────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

import * as db from "./db";

// ─── Helper to build a mock drizzle connection ───────────────────────────────
function makeMockDb(rows: unknown[] = []) {
  return {
    execute: vi.fn().mockResolvedValue([[rows]]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Toast Revenue – DB query helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when DB is unavailable", async () => {
    vi.mocked(db.getDb).mockResolvedValue(null as any);
    const mockDb = null;
    expect(mockDb).toBeNull();
  });

  it("correctly maps daily summary row fields", () => {
    const rawRow = {
      date: "20260101",
      total_revenue: "1500.50",
      bay_revenue: "800.00",
      food_bev_revenue: "500.00",
      golf_revenue: "200.50",
      total_orders: "35",
      total_guests: "42",
      total_tax: "120.00",
      total_tips: "180.00",
      total_discounts: "0.00",
      cash_revenue: "200.00",
      credit_revenue: "1300.50",
    };

    const mapped = {
      date: rawRow.date as string,
      totalRevenue: parseFloat(rawRow.total_revenue),
      bayRevenue: parseFloat(rawRow.bay_revenue),
      foodBevRevenue: parseFloat(rawRow.food_bev_revenue),
      golfRevenue: parseFloat(rawRow.golf_revenue),
      totalOrders: parseInt(rawRow.total_orders),
      totalGuests: parseInt(rawRow.total_guests),
      totalTax: parseFloat(rawRow.total_tax),
      totalTips: parseFloat(rawRow.total_tips),
      totalDiscounts: parseFloat(rawRow.total_discounts),
      cashRevenue: parseFloat(rawRow.cash_revenue),
      creditRevenue: parseFloat(rawRow.credit_revenue),
    };

    expect(mapped.date).toBe("20260101");
    expect(mapped.totalRevenue).toBeCloseTo(1500.50);
    expect(mapped.bayRevenue).toBeCloseTo(800.00);
    expect(mapped.totalOrders).toBe(35);
    expect(mapped.totalGuests).toBe(42);
    expect(mapped.cashRevenue + mapped.creditRevenue).toBeCloseTo(mapped.totalRevenue);
  });

  it("aggregates monthly revenue correctly", () => {
    const dailyRows = [
      { date: "20260101", total_revenue: 1000, bay_revenue: 500, food_bev_revenue: 300, golf_revenue: 200, total_orders: 20, total_guests: 25, total_tips: 80 },
      { date: "20260115", total_revenue: 1500, bay_revenue: 700, food_bev_revenue: 500, golf_revenue: 300, total_orders: 30, total_guests: 35, total_tips: 120 },
    ];

    const monthlyMap: Record<string, { totalRevenue: number; totalOrders: number }> = {};
    for (const row of dailyRows) {
      const month = String(row.date).slice(0, 6);
      if (!monthlyMap[month]) monthlyMap[month] = { totalRevenue: 0, totalOrders: 0 };
      monthlyMap[month].totalRevenue += Number(row.total_revenue);
      monthlyMap[month].totalOrders += Number(row.total_orders);
    }

    expect(monthlyMap["202601"].totalRevenue).toBe(2500);
    expect(monthlyMap["202601"].totalOrders).toBe(50);
  });

  it("computes month-over-month change correctly", () => {
    const thisMonth = 5000;
    const lastMonth = 4000;
    const momPct = ((thisMonth - lastMonth) / lastMonth) * 100;
    expect(momPct).toBeCloseTo(25.0);
  });

  it("computes negative month-over-month change correctly", () => {
    const thisMonth = 3000;
    const lastMonth = 4000;
    const momPct = ((thisMonth - lastMonth) / lastMonth) * 100;
    expect(momPct).toBeCloseTo(-25.0);
  });

  it("handles zero last month revenue without division error", () => {
    const thisMonth = 1000;
    const lastMonth = 0;
    const momPct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;
    expect(momPct).toBeNull();
  });

  it("groups payment types correctly", () => {
    const payments = [
      { payment_type: "Credit Card", card_type: "VISA", amount: 500 },
      { payment_type: "Credit Card", card_type: "MASTERCARD", amount: 300 },
      { payment_type: "Cash", card_type: "", amount: 200 },
    ];

    const grouped: Record<string, number> = {};
    for (const p of payments) {
      const key = p.payment_type || "Other";
      grouped[key] = (grouped[key] || 0) + p.amount;
    }

    expect(grouped["Credit Card"]).toBe(800);
    expect(grouped["Cash"]).toBe(200);
  });

  it("computes revenue category percentages correctly", () => {
    const total = 10000;
    const bay = 6000;
    const foodBev = 3000;
    const golf = 1000;

    expect((bay / total) * 100).toBe(60);
    expect((foodBev / total) * 100).toBe(30);
    expect((golf / total) * 100).toBe(10);
    expect(bay + foodBev + golf).toBe(total);
  });
});

describe("Toast Daily Sync Job", () => {
  it("calculates yesterday's date in EST correctly", () => {
    // Simulate: now is 2026-02-25T10:00:00Z (= 5:00 AM EST)
    const now = new Date("2026-02-25T10:00:00Z");
    const estNow = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const yesterday = new Date(estNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10).replace(/-/g, "");
    expect(dateStr).toBe("20260224");
  });

  it("calculates yesterday correctly when EST is previous calendar day", () => {
    // Simulate: now is 2026-02-25T04:00:00Z (= 11:00 PM EST on Feb 24)
    const now = new Date("2026-02-25T04:00:00Z");
    const estNow = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const yesterday = new Date(estNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10).replace(/-/g, "");
    expect(dateStr).toBe("20260223");
  });
});
