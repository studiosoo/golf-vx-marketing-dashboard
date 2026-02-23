import { describe, it, expect } from "vitest";
import { getTeams } from "./clickfunnels";

describe("ClickFunnels API Integration", () => {
  it("should have ClickFunnels API key configured", () => {
    const apiKey = process.env.CLICKFUNNELS_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("should successfully fetch teams from ClickFunnels API", async () => {
    const teams = await getTeams();
    expect(teams).toBeDefined();
    expect(Array.isArray(teams)).toBe(true);
    expect(teams.length).toBeGreaterThan(0);
    
    // Verify team structure
    const firstTeam = teams[0];
    expect(firstTeam).toHaveProperty("id");
    expect(firstTeam).toHaveProperty("name");
    expect(firstTeam).toHaveProperty("public_id");
  }, 15000); // 15 second timeout for API call
});
