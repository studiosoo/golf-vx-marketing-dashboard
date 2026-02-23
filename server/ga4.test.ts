import { describe, it, expect } from "vitest";

describe("GA4 Integration", () => {
  it("should have GA4 Measurement ID configured", () => {
    const measurementId = process.env.VITE_GA4_MEASUREMENT_ID;
    expect(measurementId).toBeDefined();
    expect(measurementId).toMatch(/^G-[A-Z0-9]+$/);
  });

  it("should have correct GA4 Measurement ID format", () => {
    const measurementId = process.env.VITE_GA4_MEASUREMENT_ID;
    expect(measurementId).toBe("G-DBDZ2NF2W2");
  });
});
