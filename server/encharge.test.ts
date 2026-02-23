import { describe, it, expect } from "vitest";
import { isEnchargeConfigured, getEnchargeAccount, getEnchargePeople, getEnchargeSegments, getSubscriberMetrics } from "./encharge";

describe("Encharge API Integration", () => {
  it("should have isEnchargeConfigured function", () => {
    // isEnchargeConfigured should return a boolean, never throw
    const result = isEnchargeConfigured();
    expect(typeof result).toBe("boolean");
  });

  it("should handle getEnchargeAccount gracefully when not configured", async () => {
    // Should never throw, returns null if not configured or API fails
    const result = await getEnchargeAccount();
    // Result is either null or an EnchargeAccount object
    if (result !== null) {
      expect(result).toHaveProperty("accountId");
      expect(result).toHaveProperty("name");
    }
  });

  it("should handle getEnchargePeople gracefully", async () => {
    // Should never throw, returns empty array if not configured
    const result = await getEnchargePeople();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should handle getEnchargeSegments gracefully", async () => {
    // Should never throw, returns empty array if not configured
    const result = await getEnchargeSegments();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should handle getSubscriberMetrics gracefully", async () => {
    // Should never throw, always returns a valid metrics object
    const result = await getSubscriberMetrics();
    expect(result).toHaveProperty("totalSubscribers");
    expect(result).toHaveProperty("segments");
    expect(result).toHaveProperty("segmentDetails");
    expect(typeof result.totalSubscribers).toBe("number");
    expect(typeof result.segments).toBe("number");
    expect(Array.isArray(result.segmentDetails)).toBe(true);
    // Should have configured flag
    expect(typeof result.configured).toBe("boolean");
  });
});
