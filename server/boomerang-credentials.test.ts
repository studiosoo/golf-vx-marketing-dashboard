import { describe, it, expect } from "vitest";

describe("Boomerang API Credentials", () => {
  it("should have BOOMERANG_API_TOKEN configured", () => {
    const token = process.env.BOOMERANG_API_TOKEN;
    expect(token).toBeDefined();
    expect(token!.length).toBeGreaterThan(10);
  });

  it("should successfully call getTemplates API", async () => {
    const token = process.env.BOOMERANG_API_TOKEN;
    const url = `https://app.boomerangme.cards/api/v1/getTemplates`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-Key": token!,
      },
    });
    
    console.log("Boomerang API response status:", response.status);
    const data = await response.json();
    console.log("Boomerang API response:", JSON.stringify(data, null, 2));
    
    expect(response.ok).toBe(true);
    expect(data).toBeDefined();
    // The API should return templates array
    expect(data.templates).toBeDefined();
    expect(Array.isArray(data.templates)).toBe(true);
  });
});
