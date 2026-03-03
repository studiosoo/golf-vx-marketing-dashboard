import { describe, expect, it } from "vitest";
import { syncGiveawayApplications, getGiveawayApplications, getGiveawayStats } from "./giveawaySync";

describe("GiveawaySync - Database-based sync (no rclone)", () => {
  it("should sync applications without rclone dependency", async () => {
    const result = await syncGiveawayApplications();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("synced");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("message");
    expect(typeof result.synced).toBe("number");
    expect(typeof result.total).toBe("number");
    expect(typeof result.message).toBe("string");
    // Should not throw rclone errors
    expect(result.synced).toBeGreaterThanOrEqual(0);
  }, 10000);

  it("should get giveaway applications from database", async () => {
    const applications = await getGiveawayApplications();
    expect(applications).toBeDefined();
    expect(Array.isArray(applications)).toBe(true);
    // Applications may be empty if none submitted yet
  }, 10000);

  it("should get giveaway stats from database", async () => {
    const stats = await getGiveawayStats();
    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalApplications");
    expect(stats).toHaveProperty("ageRangeDistribution");
    expect(stats).toHaveProperty("genderDistribution");
    expect(stats).toHaveProperty("golfExperienceDistribution");
    expect(typeof stats.totalApplications).toBe("number");
    expect(stats.totalApplications).toBeGreaterThanOrEqual(0);
  }, 10000);

  it("should not use rclone or child_process in the sync module", async () => {
    // Verify the module doesn't import or execute rclone
    const fs = await import("fs");
    const moduleContent = fs.readFileSync("./server/giveawaySync.ts", "utf-8");
    expect(moduleContent).not.toContain("execSync");
    expect(moduleContent).not.toContain("child_process");
    expect(moduleContent).not.toContain("exec(");
  });

  it("should not use child_process or exec in the googleSheets module", async () => {
    const fs = await import("fs");
    const moduleContent = fs.readFileSync("./server/googleSheets.ts", "utf-8");
    // Comments may mention rclone for documentation, but no actual imports/exec calls
    expect(moduleContent).not.toContain("child_process");
    expect(moduleContent).not.toContain("execAsync");
    expect(moduleContent).not.toContain("exec(");
  });
});
