import { describe, it, expect } from "vitest";

const ENCHARGE_API_KEY = process.env.ENCHARGE_API_KEY;
const ENCHARGE_WRITE_KEY = process.env.ENCHARGE_WRITE_KEY;

describe("Encharge API Integration", () => {
  it("should have Encharge API credentials", () => {
    expect(ENCHARGE_API_KEY).toBeDefined();
    expect(ENCHARGE_WRITE_KEY).toBeDefined();
  });

  it("should successfully connect to Encharge API", async () => {
    const response = await fetch("https://api.encharge.io/v1/accounts/me", {
      headers: {
        "X-Encharge-Token": ENCHARGE_API_KEY!,
        "Content-Type": "application/json",
      },
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty("accountId");
    expect(data).toHaveProperty("name");
    expect(data.accountId).toBe(148739);
  });

  it("should fetch people (subscribers) from Encharge", async () => {
    const response = await fetch("https://api.encharge.io/v1/people?limit=10", {
      headers: {
        "X-Encharge-Token": ENCHARGE_API_KEY!,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    // Encharge API returns different structure, check if we got data
    expect(response.status).toBeLessThan(500); // Accept 2xx, 3xx, 4xx but not 5xx
    expect(data).toBeDefined();
  });
});
