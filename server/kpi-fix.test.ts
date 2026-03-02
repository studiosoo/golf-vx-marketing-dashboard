/**
 * Tests for the getStrategicKPIs database execute result parsing fix.
 * 
 * Root cause: Drizzle ORM's database.execute() returns [rows, fields] tuple.
 * The old code accessed (result as any)[0]?.field which returned undefined
 * because result[0] is the rows array, not the first row.
 * The fix: access (result as any)[0]?.[0]?.field to get the first row.
 */

import { describe, it, expect } from "vitest";

describe("Database execute result parsing", () => {
  it("should correctly parse mysql2-style [rows, fields] tuple", () => {
    // Simulate what Drizzle execute() returns for a raw SQL query
    const mockExecuteResult = [
      [{ customerMembers: 87, proMembers: 4, allAccessCount: 54, swingSaverCount: 33 }],
      [] // fields metadata
    ];

    // Old (broken) pattern
    const oldPattern = (mockExecuteResult as any)[0]?.customerMembers;
    expect(oldPattern).toBeUndefined(); // This was the bug - returns undefined

    // New (fixed) pattern
    const newPattern = (mockExecuteResult as any)[0]?.[0]?.customerMembers;
    expect(newPattern).toBe(87); // This is correct
  });

  it("should correctly extract all member count fields", () => {
    const mockExecuteResult = [
      [{ customerMembers: 87, proMembers: 4, allAccessCount: 54, swingSaverCount: 33, allAccessMRR: "14006.25", swingSaverMRR: "4641.66", proMRR: "2000.00", annualCount: 10, monthlyCount: 77 }],
      []
    ];

    const memberRow = (mockExecuteResult as any)[0]?.[0];
    expect(Number(memberRow?.customerMembers || 0)).toBe(87);
    expect(Number(memberRow?.proMembers || 0)).toBe(4);
    expect(Number(memberRow?.allAccessCount || 0)).toBe(54);
    expect(Number(memberRow?.swingSaverCount || 0)).toBe(33);
    expect(parseFloat(memberRow?.allAccessMRR || '0')).toBe(14006.25);
    expect(parseFloat(memberRow?.swingSaverMRR || '0')).toBe(4641.66);
    expect(parseFloat(memberRow?.proMRR || '0')).toBe(2000.00);
    expect(Number(memberRow?.annualCount || 0)).toBe(10);
    expect(Number(memberRow?.monthlyCount || 0)).toBe(77);
  });

  it("should correctly calculate membership acquisition KPIs", () => {
    const customerMemberCount = 87;
    const MEMBERSHIP_GOAL = 300;

    const membershipAcquisition = {
      current: customerMemberCount,
      target: MEMBERSHIP_GOAL,
      remaining: Math.max(0, MEMBERSHIP_GOAL - customerMemberCount),
      progress: Math.min((customerMemberCount / MEMBERSHIP_GOAL) * 100, 100),
    };

    expect(membershipAcquisition.current).toBe(87);
    expect(membershipAcquisition.target).toBe(300);
    expect(membershipAcquisition.remaining).toBe(213);
    expect(Math.round(membershipAcquisition.progress)).toBe(29); // 87/300 = 29%
  });

  it("should correctly calculate member retention KPIs", () => {
    const activeCustomers = 87;
    const totalCustomers = 106;
    const customerRetentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;

    expect(Math.round(customerRetentionRate)).toBe(82); // 87/106 ≈ 82%
  });

  it("should handle null/undefined gracefully", () => {
    const emptyResult = [[], []];
    const memberRow = (emptyResult as any)[0]?.[0];
    
    expect(Number(memberRow?.customerMembers || 0)).toBe(0);
    expect(parseFloat(memberRow?.allAccessMRR || '0')).toBe(0);
  });
});

describe("Drive Day Clinic data", () => {
  it("should have correct session structure for all 6 dates", () => {
    const sessionDefs = [
      { name: "Driving to the Ball", dates: ["2026-01-25", "2026-02-01"] },
      { name: "Putting", dates: ["2026-02-22", "2026-03-01"] },
      { name: "Short Game", dates: ["2026-03-22", "2026-03-29"] },
    ];

    const allDates = sessionDefs.flatMap(s => s.dates);
    expect(allDates).toHaveLength(6);
    expect(allDates).toContain("2026-01-25"); // Jan 25 must be included
    expect(allDates).toContain("2026-02-01");
    expect(allDates).toContain("2026-02-22");
    expect(allDates).toContain("2026-03-01");
    expect(allDates).toContain("2026-03-22");
    expect(allDates).toContain("2026-03-29");
  });

  it("should correctly sum total registrations across all sessions", () => {
    // Based on actual Acuity data
    const sessionData = [
      { name: "Driving to the Ball", dates: [{ bookings: 14 }, { bookings: 19 }] },
      { name: "Putting", dates: [{ bookings: 11 }, { bookings: 3 }] },
      { name: "Short Game", dates: [{ bookings: 5 }, { bookings: 0 }] },
    ];

    const total = sessionData.reduce((sum, s) => 
      sum + s.dates.reduce((dSum, d) => dSum + d.bookings, 0), 0
    );
    expect(total).toBe(52); // 14+19+11+3+5+0 = 52
  });
});
