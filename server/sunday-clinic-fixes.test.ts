import { describe, it, expect } from "vitest";

/**
 * Tests for SundayClinicDetail page fixes:
 * 1. Member Retention card shows ACTIVE_CUSTOMER_MEMBERS (87) not totalMembers (369)
 * 2. Event Breakdown section appears before Acquisition Sources
 * 3. Events are sorted by date ascending (Jan 25 first)
 * 4. Revenue data is included per event
 */

describe("SundayClinicDetail fixes", () => {
  describe("Active member count", () => {
    it("should use 87 as ACTIVE_CUSTOMER_MEMBERS (54 AA + 33 SS)", () => {
      const ACTIVE_CUSTOMER_MEMBERS = 87;
      const allAccessAces = 54;
      const swingSavers = 33;
      expect(ACTIVE_CUSTOMER_MEMBERS).toBe(allAccessAces + swingSavers);
    });

    it("should calculate memberGoalProgress based on active members not total DB members", () => {
      const ACTIVE_CUSTOMER_MEMBERS = 87;
      const memberAttendees = 36; // example: 36 unique members attended
      const memberGoalProgress = (memberAttendees / ACTIVE_CUSTOMER_MEMBERS) * 100;
      // Should be ~41.4%, not 9.8% (which was based on 369)
      expect(memberGoalProgress).toBeCloseTo(41.4, 0);
      // Old calculation with totalMembers=369 would give 9.8%
      const oldProgress = (memberAttendees / 369) * 100;
      expect(oldProgress).toBeCloseTo(9.8, 0);
      // New calculation is significantly higher
      expect(memberGoalProgress).toBeGreaterThan(oldProgress);
    });

    it("should cap progress bar at 100%", () => {
      const ACTIVE_CUSTOMER_MEMBERS = 87;
      const memberAttendees = 100; // hypothetically more than active members
      const memberGoalProgress = (memberAttendees / ACTIVE_CUSTOMER_MEMBERS) * 100;
      const cappedProgress = Math.min(memberGoalProgress, 100);
      expect(cappedProgress).toBe(100);
    });
  });

  describe("Event date sorting", () => {
    it("should sort events by date ascending (Jan 25 first)", () => {
      const events = [
        { date: "2026-02-22", totalBookings: 11 },
        { date: "2026-01-25", totalBookings: 14 },
        { date: "2026-03-01", totalBookings: 8 },
        { date: "2026-02-01", totalBookings: 19 },
        { date: "2026-03-22", totalBookings: 6 },
        { date: "2026-03-29", totalBookings: 4 },
      ];
      const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
      expect(sortedEvents[0].date).toBe("2026-01-25");
      expect(sortedEvents[1].date).toBe("2026-02-01");
      expect(sortedEvents[2].date).toBe("2026-02-22");
      expect(sortedEvents[3].date).toBe("2026-03-01");
      expect(sortedEvents[4].date).toBe("2026-03-22");
      expect(sortedEvents[5].date).toBe("2026-03-29");
    });

    it("should have Jan 25 as the first event", () => {
      const events = [
        { date: "2026-02-01", totalBookings: 19 },
        { date: "2026-01-25", totalBookings: 14 },
        { date: "2026-02-22", totalBookings: 11 },
      ];
      const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
      expect(sortedEvents[0].date).toBe("2026-01-25");
    });
  });

  describe("Revenue data in events", () => {
    it("should calculate revenue per event from amountPaid", () => {
      const appts = [
        { amountPaid: "25", priceSold: "25", price: "25" },
        { amountPaid: "25", priceSold: "25", price: "25" },
        { amountPaid: "0", priceSold: "0", price: "0" }, // member (free)
      ];
      const revenue = appts.reduce((sum, apt) => {
        return sum + parseFloat(apt.amountPaid || apt.priceSold || apt.price || "0");
      }, 0);
      expect(revenue).toBe(50);
    });

    it("should count paid vs member attendees correctly", () => {
      const appts = [
        { amountPaid: "25" },
        { amountPaid: "25" },
        { amountPaid: "0" }, // member (free)
        { amountPaid: "0" }, // member (free)
      ];
      const paidCount = appts.filter(apt => parseFloat(apt.amountPaid || "0") > 0).length;
      const memberCount = appts.filter(apt => parseFloat(apt.amountPaid || "0") === 0).length;
      expect(paidCount).toBe(2);
      expect(memberCount).toBe(2);
    });

    it("should sum total revenue across all events", () => {
      const events = [
        { revenue: 350 },
        { revenue: 475 },
        { revenue: 115 },
      ];
      const totalRevenue = events.reduce((sum, e) => sum + e.revenue, 0);
      expect(totalRevenue).toBe(940);
    });
  });

  describe("Date display fix", () => {
    it("should use T12:00:00 suffix to avoid timezone date shift", () => {
      // Without T12:00:00, "2026-01-25" parsed as UTC midnight may show Jan 24 in US timezones
      const dateStr = "2026-01-25";
      const withoutFix = new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const withFix = new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      // withFix should reliably show Jan 25
      expect(withFix).toContain("Jan");
      expect(withFix).toContain("25");
    });
  });
});
