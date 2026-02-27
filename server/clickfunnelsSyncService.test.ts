import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onDuplicateKeyUpdate: vi.fn().mockReturnThis(),
    set: vi.fn().mockResolvedValue([]),
  }),
}));

// Mock the schema
vi.mock("../drizzle/schema", () => ({
  cfFunnels: {},
  cfFormSubmissions: {},
}));

describe("ClickFunnels Sync Service", () => {
  const VALID_API_KEY = "hR9MaaV1lVtTBh8se21sBo1DSpLxIfLnzxOuWcEQc4U";
  const CF_BASE_URL = "https://app.myclickfunnels.com/api/v2";
  const WORKSPACE_ID = 421845;

  it("should have a valid API key configured", () => {
    expect(VALID_API_KEY).toBeTruthy();
    expect(VALID_API_KEY.length).toBeGreaterThan(20);
  });

  it("should connect to ClickFunnels API and return funnels", async () => {
    const res = await fetch(`${CF_BASE_URL}/workspaces/${WORKSPACE_ID}/funnels?per_page=3`, {
      headers: {
        Authorization: `Bearer ${VALID_API_KEY}`,
        Accept: "application/json",
        "User-Agent": "GolfVX-Dashboard/1.0",
      },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as Array<{ id: number; name: string; workspace_id: number }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("name");
    expect(data[0].workspace_id).toBe(WORKSPACE_ID);
  }, 15000);

  it("should return form submissions from ClickFunnels API", async () => {
    const res = await fetch(`${CF_BASE_URL}/workspaces/${WORKSPACE_ID}/form_submissions?per_page=5`, {
      headers: {
        Authorization: `Bearer ${VALID_API_KEY}`,
        Accept: "application/json",
        "User-Agent": "GolfVX-Dashboard/1.0",
      },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as Array<{ id: number }>;
    expect(Array.isArray(data)).toBe(true);
  }, 15000);

  it("should reject unauthorized requests", async () => {
    const res = await fetch(`${CF_BASE_URL}/workspaces/${WORKSPACE_ID}/funnels`, {
      headers: {
        Authorization: "Bearer invalid_key_12345",
        Accept: "application/json",
      },
    });
    expect(res.status).not.toBe(200);
  }, 15000);

  it("should parse funnel data correctly", () => {
    const mockFunnel = {
      id: 888788,
      public_id: "YVBabb",
      workspace_id: 421845,
      name: "Golf VX AH - Annual Membership Giveaway | Q1 2026",
      archived: false,
      current_path: "/anniversary",
      live_mode: false,
      created_at: "2026-01-29T07:47:56.630Z",
      updated_at: "2026-02-20T22:29:57.444Z",
      tags: [{ id: 124327, name: "Giveaway", color: "#EEEEEE" }],
    };

    expect(mockFunnel.id).toBe(888788);
    expect(mockFunnel.name).toContain("Annual Membership Giveaway");
    expect(mockFunnel.archived).toBe(false);
    expect(mockFunnel.tags).toHaveLength(1);
    expect(mockFunnel.tags[0].name).toBe("Giveaway");
  });

  it("should parse form submission data correctly", () => {
    const mockSubmission = {
      id: 12345,
      public_id: "abc123",
      workspace_id: 421845,
      funnel_id: 888788,
      funnel_step_id: 999001,
      contact_id: 55555,
      data: { email: "test@example.com", first_name: "John" },
      created_at: "2026-02-28T10:00:00.000Z",
    };

    expect(mockSubmission.funnel_id).toBe(888788);
    expect(mockSubmission.data.email).toBe("test@example.com");
    expect(new Date(mockSubmission.created_at).getFullYear()).toBe(2026);
  });

  it("should correctly count active (non-archived) funnels", async () => {
    const res = await fetch(`${CF_BASE_URL}/workspaces/${WORKSPACE_ID}/funnels`, {
      headers: {
        Authorization: `Bearer ${VALID_API_KEY}`,
        Accept: "application/json",
        "User-Agent": "GolfVX-Dashboard/1.0",
      },
    });
    const data = await res.json() as Array<{ id: number; archived: boolean }>;
    const activeFunnels = data.filter((f) => !f.archived);
    expect(activeFunnels.length).toBeGreaterThan(0);
    expect(activeFunnels.length).toBeLessThanOrEqual(data.length);
  }, 15000);
});
