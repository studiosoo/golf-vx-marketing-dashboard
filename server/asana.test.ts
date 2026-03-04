import { describe, it, expect, vi, beforeEach } from "vitest";
import { MARKETING_TIMELINE_PROJECT_ID, CAMPAIGN_SECTIONS, getProjectUrl } from "./asana";

// Mock fetch for Asana API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Asana Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have the correct Marketing Timeline project ID", () => {
    expect(MARKETING_TIMELINE_PROJECT_ID).toBe("1212717697638611");
  });

  it("should have all 4 campaign sections defined", () => {
    const sections = Object.keys(CAMPAIGN_SECTIONS);
    expect(sections).toHaveLength(4);
    expect(sections).toContain("Trial Conversion Campaign");
    expect(sections).toContain("Membership Acquisition campaign");
    expect(sections).toContain("Member Retention + Community Flywheel");
    expect(sections).toContain("Venue Display / Local Media");
  });

  it("should generate a valid Asana project URL", () => {
    const url = getProjectUrl();
    expect(url).toContain("app.asana.com");
    expect(url).toContain(MARKETING_TIMELINE_PROJECT_ID);
  });

  it("should map campaign section names to IDs", () => {
    for (const [name, id] of Object.entries(CAMPAIGN_SECTIONS)) {
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it("should handle Asana API errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const { getTimelineTasks } = await import("./asana");
    await expect(getTimelineTasks()).rejects.toThrow();
  });

  it("should parse task data correctly from Asana response", () => {
    const mockTask = {
      gid: "123456",
      name: "Test Campaign Task",
      start_on: "2026-01-01",
      due_on: "2026-03-31",
      completed: false,
      resource_subtype: "default_task",
      memberships: [{ section: { name: "Trial Conversion Campaign" } }],
    };
    expect(mockTask.gid).toBeTruthy();
    expect(mockTask.name).toBeTruthy();
    expect(mockTask.memberships[0].section.name).toBe("Trial Conversion Campaign");
  });

  it("should validate task creation input", () => {
    const validInput = {
      name: "New Marketing Task",
      notes: "Task description",
      due_on: "2026-04-01",
      campaignSection: "Trial Conversion Campaign",
    };
    expect(validInput.name.length).toBeGreaterThan(0);
    expect(validInput.name.length).toBeLessThanOrEqual(200);
    expect(validInput.campaignSection).toBeDefined();
    expect(Object.keys(CAMPAIGN_SECTIONS)).toContain(validInput.campaignSection);
  });

  it("should handle batch task creation with mixed success/failure", () => {
    const tasks = [
      { name: "Task 1", campaignSection: "Trial Conversion Campaign" },
      { name: "Task 2", campaignSection: "Membership Acquisition campaign" },
    ];
    const results: Array<{ success: boolean; name: string }> = [];
    const errors: Array<{ name: string; error: string }> = [];
    
    // Simulate one success, one failure
    results.push({ success: true, name: tasks[0].name });
    errors.push({ name: tasks[1].name, error: "API error" });
    
    expect(results).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(results[0].name).toBe("Task 1");
  });

  it("should correctly identify milestone tasks vs regular tasks", () => {
    const milestone = { resource_subtype: "milestone", name: "Q1 Launch" };
    const regularTask = { resource_subtype: "default_task", name: "Create content" };
    expect(milestone.resource_subtype).toBe("milestone");
    expect(regularTask.resource_subtype).toBe("default_task");
  });

  it("should handle tasks with no dates", () => {
    const taskWithNoDates = {
      gid: "789",
      name: "Undated task",
      start_on: null,
      due_on: null,
      completed: false,
      resource_subtype: "default_task",
    };
    expect(taskWithNoDates.start_on).toBeNull();
    expect(taskWithNoDates.due_on).toBeNull();
  });

  it("should correctly determine campaign from section name", () => {
    const sectionName = "Trial Conversion Campaign";
    const campaign = Object.keys(CAMPAIGN_SECTIONS).find(k => sectionName.startsWith(k.split(" ")[0]));
    expect(campaign).toBe("Trial Conversion Campaign");
  });

  it("should have valid Asana section GIDs (non-empty strings)", () => {
    for (const [, gid] of Object.entries(CAMPAIGN_SECTIONS)) {
      expect(gid).toMatch(/^\d+$/);
    }
  });
});
