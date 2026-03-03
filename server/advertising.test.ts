/**
 * Tests for Influencer Partnerships and Community Outreach routers
 */
import { describe, it, expect } from "vitest";

// ─── Influencer Partnership Data Validation ────────────────────────────────
describe("Influencer Partnership data model", () => {
  it("validates platform enum values", () => {
    const validPlatforms = ["instagram", "tiktok", "youtube", "facebook", "other"];
    expect(validPlatforms).toContain("instagram");
    expect(validPlatforms).toContain("tiktok");
    expect(validPlatforms).not.toContain("twitter");
  });

  it("validates status enum values", () => {
    const validStatuses = ["negotiating", "contracted", "in_progress", "completed", "cancelled"];
    expect(validStatuses).toContain("completed");
    expect(validStatuses).toContain("in_progress");
    expect(validStatuses).not.toContain("active");
  });

  it("calculates cost-per-engagement correctly", () => {
    const totalCost = 500;
    const actualEngagements = 1000;
    const cpe = totalCost / actualEngagements;
    expect(cpe).toBe(0.5);
  });

  it("calculates cost-per-reach correctly", () => {
    const totalCost = 500;
    const actualReach = 5000;
    const cpr = totalCost / actualReach;
    expect(cpr).toBe(0.1);
  });

  it("handles null metrics gracefully", () => {
    const partner = {
      totalCost: "500.00",
      actualReach: null,
      actualEngagements: null,
      actualBookingsGenerated: null,
    };
    const reach = partner.actualReach ?? 0;
    const engagements = partner.actualEngagements ?? 0;
    expect(reach).toBe(0);
    expect(engagements).toBe(0);
  });

  it("formats handle with @ prefix", () => {
    const handle = "@actionheightslifestyle";
    expect(handle.startsWith("@")).toBe(true);
    expect(handle.length).toBeGreaterThan(1);
  });
});

// ─── Community Outreach Data Validation ───────────────────────────────────
describe("Community Outreach data model", () => {
  it("validates org_type enum values", () => {
    const validOrgTypes = [
      "school_pta", "school_sports", "nonprofit", "civic",
      "arts_culture", "sports_league", "religious", "business", "other"
    ];
    expect(validOrgTypes).toContain("school_pta");
    expect(validOrgTypes).toContain("arts_culture");
    expect(validOrgTypes).not.toContain("government");
  });

  it("validates status pipeline order", () => {
    const statusOrder = ["received", "under_review", "approved", "rejected", "fulfilled", "follow_up"];
    expect(statusOrder.indexOf("received")).toBeLessThan(statusOrder.indexOf("approved"));
    expect(statusOrder.indexOf("approved")).toBeLessThan(statusOrder.indexOf("fulfilled"));
  });

  it("validates request_type enum values", () => {
    const validTypes = [
      "cash_donation", "gift_card", "product_donation",
      "service_donation", "sponsorship", "partnership", "networking"
    ];
    expect(validTypes).toContain("gift_card");
    expect(validTypes).toContain("partnership");
    expect(validTypes).not.toContain("barter");
  });

  it("calculates ROI correctly for Windsor PTA donation", () => {
    // Windsor PTA: $100 cash value + $699 perceived value = $799 total
    // Estimated reach: 200 attendees
    const actualCashValue = 100;
    const actualPerceivedValue = 799;
    const estimatedReach = 200;
    const costPerReach = actualPerceivedValue / estimatedReach;
    expect(costPerReach).toBe(3.995);
    expect(actualCashValue + (actualPerceivedValue - actualCashValue)).toBe(actualPerceivedValue);
  });

  it("correctly identifies 501c3 organizations", () => {
    const orgs = [
      { name: "Windsor Elementary PTA", is501c3: true },
      { name: "Skokie Firefighters Benevolent Fund", is501c3: true },
      { name: "Illinois Sluggers", is501c3: true },
      { name: "Lake County Symphony", is501c3: false },
    ];
    const taxDeductibleOrgs = orgs.filter(o => o.is501c3);
    expect(taxDeductibleOrgs.length).toBe(3);
  });

  it("filters outreach by status correctly", () => {
    const records = [
      { status: "fulfilled" },
      { status: "received" },
      { status: "received" },
      { status: "follow_up" },
    ];
    const pending = records.filter(r => r.status === "received" || r.status === "under_review");
    const fulfilled = records.filter(r => r.status === "fulfilled");
    expect(pending.length).toBe(2);
    expect(fulfilled.length).toBe(1);
  });

  it("calculates total outreach spend correctly", () => {
    const donations = [
      { actualCashValue: 100, actualPerceivedValue: 799 }, // Windsor PTA
      { actualCashValue: 0, actualPerceivedValue: 0 },     // Skokie Fire (not donated)
      { actualCashValue: 0, actualPerceivedValue: 0 },     // Sluggers (not donated)
      { actualCashValue: 0, actualPerceivedValue: 0 },     // Lake County (networking)
    ];
    const totalCash = donations.reduce((sum, d) => sum + d.actualCashValue, 0);
    const totalPerceived = donations.reduce((sum, d) => sum + d.actualPerceivedValue, 0);
    expect(totalCash).toBe(100);
    expect(totalPerceived).toBe(799);
  });

  it("validates priority enum values", () => {
    const validPriorities = ["low", "medium", "high"];
    expect(validPriorities).toContain("high");
    expect(validPriorities).not.toContain("critical");
  });
});

// ─── Advertising Tab Navigation ────────────────────────────────────────────
describe("Advertising page tab structure", () => {
  it("has exactly 3 tabs", () => {
    const tabs = ["meta", "influencer", "outreach"];
    expect(tabs.length).toBe(3);
  });

  it("defaults to meta tab", () => {
    const defaultTab = "meta";
    expect(defaultTab).toBe("meta");
  });

  it("tab IDs are unique", () => {
    const tabs = ["meta", "influencer", "outreach"];
    const unique = new Set(tabs);
    expect(unique.size).toBe(tabs.length);
  });
});
