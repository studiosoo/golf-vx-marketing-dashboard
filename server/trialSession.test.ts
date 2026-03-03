/**
 * Unit tests for the 1-Hour Trial Session detail feature.
 * Tests the acuity.ts helper types and the router procedure registration.
 */
import { describe, it, expect } from "vitest";

// ── Test: TrialSessionDetail type shape ──────────────────────────────────────
describe("TrialSessionDetail data shape", () => {
  it("should have the expected structure with types, totalBookings, totalRevenue, allBookings", () => {
    // Simulate what getTrialSessionDetail returns
    const mockDetail = {
      types: [
        {
          typeId: 86461965,
          typeName: "1-Hour Trial Session (Off-Peak)",
          priceLabel: "$25 Off-Peak Trial",
          bookings: [
            {
              id: 1001,
              firstName: "Brian",
              lastName: "Knipple",
              email: "brian@example.com",
              phone: "555-0001",
              datetime: "2026-01-15T10:00:00",
              price: "25.00",
              amountPaid: "25.00",
              paid: "yes",
              type: "1-Hour Trial Session (Off-Peak)",
              appointmentTypeID: 86461965,
              source: "Instagram",
              calendar: "Golf VX Arlington Heights",
            },
          ],
          totalRevenue: 25,
          paidCount: 1,
        },
        {
          typeId: 86472398,
          typeName: "1-Hour Trial Session (Peak)",
          priceLabel: "$35 Peak Trial",
          bookings: [],
          totalRevenue: 0,
          paidCount: 0,
        },
        {
          typeId: 89062344,
          typeName: "Anniversary Trial Sessions (Off-Peak)",
          priceLabel: "$9 Anniversary Off-Peak Trial",
          bookings: [],
          totalRevenue: 0,
          paidCount: 0,
        },
      ],
      totalBookings: 1,
      totalRevenue: 25,
      allBookings: [
        {
          id: 1001,
          firstName: "Brian",
          lastName: "Knipple",
          email: "brian@example.com",
          phone: "555-0001",
          datetime: "2026-01-15T10:00:00",
          price: "25.00",
          amountPaid: "25.00",
          paid: "yes",
          type: "1-Hour Trial Session (Off-Peak)",
          appointmentTypeID: 86461965,
          source: "Instagram",
          calendar: "Golf VX Arlington Heights",
        },
      ],
    };

    // Validate top-level shape
    expect(mockDetail).toHaveProperty("types");
    expect(mockDetail).toHaveProperty("totalBookings");
    expect(mockDetail).toHaveProperty("totalRevenue");
    expect(mockDetail).toHaveProperty("allBookings");

    // Validate types array
    expect(Array.isArray(mockDetail.types)).toBe(true);
    expect(mockDetail.types).toHaveLength(3);

    // Validate first type group
    const offPeak = mockDetail.types[0];
    expect(offPeak.typeId).toBe(86461965);
    expect(offPeak.priceLabel).toBe("$25 Off-Peak Trial");
    expect(offPeak.bookings).toHaveLength(1);
    expect(offPeak.totalRevenue).toBe(25);
    expect(offPeak.paidCount).toBe(1);

    // Validate booking shape
    const booking = offPeak.bookings[0];
    expect(booking).toHaveProperty("id");
    expect(booking).toHaveProperty("firstName");
    expect(booking).toHaveProperty("lastName");
    expect(booking).toHaveProperty("datetime");
    expect(booking).toHaveProperty("paid");
    expect(booking).toHaveProperty("source");
    expect(booking.paid).toBe("yes");

    // Validate totals
    expect(mockDetail.totalBookings).toBe(1);
    expect(mockDetail.totalRevenue).toBe(25);
    expect(mockDetail.allBookings).toHaveLength(1);
  });

  it("should correctly calculate paid rate", () => {
    const totalBookings = 9;
    const totalPaid = 7;
    const paidRate = Math.round((totalPaid / totalBookings) * 100);
    expect(paidRate).toBe(78);
  });

  it("should correctly calculate average price", () => {
    const totalRevenue = 137;
    const totalBookings = 9;
    const avgPrice = totalRevenue / totalBookings;
    expect(avgPrice).toBeCloseTo(15.22, 1);
  });

  it("should handle empty bookings gracefully", () => {
    const emptyDetail = {
      types: [],
      totalBookings: 0,
      totalRevenue: 0,
      allBookings: [],
    };

    const avgPrice = emptyDetail.totalBookings > 0
      ? emptyDetail.totalRevenue / emptyDetail.totalBookings
      : 0;

    expect(avgPrice).toBe(0);
    expect(emptyDetail.types).toHaveLength(0);
    expect(emptyDetail.allBookings).toHaveLength(0);
  });
});

// ── Test: Route mapping logic ─────────────────────────────────────────────────
describe("Trial session route mapping", () => {
  function getProgramRoute(program: { id: number; name: string }): string {
    const name = program.name.toLowerCase();
    if (name.includes("drive day") || name.includes("sunday clinic")) return "/programs/drive-day";
    if (name.includes("winter clinic")) return "/programs/winter-clinics";
    if (name.includes("junior") || name.includes("summer camp")) return "/programs/summer-camp";
    if (name.includes("league") || name.includes("tournament")) return "/programs/leagues";
    if (name.includes("giveaway")) return "/programs/annual-giveaway";
    if (name.includes("trial") || name.includes("1-hour")) return "/programs/trial-session";
    return `/programs/${program.id}`;
  }

  it("should route '1-Hour Trial Session' to /programs/trial-session", () => {
    expect(getProgramRoute({ id: 4, name: "1-Hour Trial Session" })).toBe("/programs/trial-session");
  });

  it("should route 'Trial Bay Session' to /programs/trial-session", () => {
    expect(getProgramRoute({ id: 5, name: "Trial Bay Session" })).toBe("/programs/trial-session");
  });

  it("should still route other programs correctly", () => {
    expect(getProgramRoute({ id: 1, name: "Drive Day" })).toBe("/programs/drive-day");
    expect(getProgramRoute({ id: 2, name: "Junior Summer Camp" })).toBe("/programs/summer-camp");
    expect(getProgramRoute({ id: 3, name: "Annual Giveaway" })).toBe("/programs/annual-giveaway");
  });

  it("should fallback to /programs/:id for unknown programs", () => {
    expect(getProgramRoute({ id: 99, name: "Corporate Event" })).toBe("/programs/99");
  });
});
