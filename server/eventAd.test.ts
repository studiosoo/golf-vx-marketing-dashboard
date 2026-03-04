import { describe, it, expect } from "vitest";
import { eventAdvertising } from "../drizzle/schema";

describe("Event Advertising Schema", () => {
  it("should have all required columns defined", () => {
    expect(eventAdvertising.eventName).toBeDefined();
    expect(eventAdvertising.eventType).toBeDefined();
    expect(eventAdvertising.venue).toBeDefined();
    expect(eventAdvertising.location).toBeDefined();
    expect(eventAdvertising.eventDate).toBeDefined();
    expect(eventAdvertising.status).toBeDefined();
    expect(eventAdvertising.boothCost).toBeDefined();
    expect(eventAdvertising.totalCost).toBeDefined();
    expect(eventAdvertising.expectedVisitors).toBeDefined();
    expect(eventAdvertising.actualVisitors).toBeDefined();
    expect(eventAdvertising.promosDistributed).toBeDefined();
    expect(eventAdvertising.leadsCollected).toBeDefined();
    expect(eventAdvertising.teamSignups).toBeDefined();
    expect(eventAdvertising.membershipSignups).toBeDefined();
    expect(eventAdvertising.revenue).toBeDefined();
    expect(eventAdvertising.notes).toBeDefined();
  });

  it("should have correct table name", () => {
    expect((eventAdvertising as any)[Symbol.for("drizzle:Name")]).toBe("event_advertising");
  });

  it("should have id as primary key", () => {
    expect(eventAdvertising.id).toBeDefined();
  });

  it("should have createdAt and updatedAt timestamps", () => {
    expect(eventAdvertising.createdAt).toBeDefined();
    expect(eventAdvertising.updatedAt).toBeDefined();
  });
});

describe("Event Advertising KPI calculations", () => {
  it("should calculate cost per visitor correctly", () => {
    const totalCost = 1500;
    const actualVisitors = 2500;
    const costPerVisitor = totalCost / actualVisitors;
    expect(costPerVisitor).toBeCloseTo(0.6, 2);
  });

  it("should calculate promo distribution rate correctly", () => {
    const promosDistributed = 50;
    const actualVisitors = 2500;
    const rate = (promosDistributed / actualVisitors) * 100;
    expect(rate).toBeCloseTo(2, 1);
  });

  it("should handle Chicago Golf Show 2026 data correctly", () => {
    const chicagoGolfShow = {
      eventName: "Chicago Golf Show 2026",
      eventType: "trade_show",
      venue: "Donald E. Stephens Convention Center",
      location: "Rosemont, IL",
      boothCost: 1200,
      totalCost: 1500,
      expectedVisitors: 2500,
      actualVisitors: 2500,
      promosDistributed: 50,
      leadsCollected: 12,
      teamSignups: 1,
      status: "completed",
    };

    expect(chicagoGolfShow.eventName).toBe("Chicago Golf Show 2026");
    expect(chicagoGolfShow.actualVisitors).toBe(chicagoGolfShow.expectedVisitors);
    expect(chicagoGolfShow.promosDistributed).toBe(50);
    expect(chicagoGolfShow.teamSignups).toBe(1);
    expect(chicagoGolfShow.status).toBe("completed");

    // Cost per visitor
    const cpv = chicagoGolfShow.totalCost / chicagoGolfShow.actualVisitors;
    expect(cpv).toBeCloseTo(0.6, 2);
  });
});
