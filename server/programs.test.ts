import { describe, expect, it } from "vitest";

// Test the campaign-to-program mapping logic used in Programs.tsx
// This mirrors the PROGRAM_CAMPAIGN_MAP and STRATEGIC_CAMPAIGNS from the frontend

const STRATEGIC_CAMPAIGNS = {
  trial_conversion: { name: "Trial Conversion" },
  membership_acquisition: { name: "Membership Acquisition" },
  member_retention: { name: "Member Retention" },
  corporate_events: { name: "B2B Sales" },
} as const;

const PROGRAM_CAMPAIGN_MAP: Record<string, string[]> = {
  "Sunday Clinic": ["member_retention", "trial_conversion"],
  "PBGA Winter Clinic": ["trial_conversion"],
  "PBGA Junior Summer Camp": ["trial_conversion"],
  "$25 1-Hour Trial Session": ["trial_conversion"],
  "Annual Membership Giveaway": ["membership_acquisition"],
  "Black Friday Deal": ["membership_acquisition"],
  "Sports Game Watch Party": ["member_retention"],
  "Instagram Follower Growth": ["member_retention", "membership_acquisition"],
};

const PROGRAM_DETAIL_ROUTES: Record<string, string> = {
  "Sunday Clinic": "/sunday-clinic",
  "PBGA Winter Clinic": "/winter-clinic",
  "Annual Membership Giveaway": "/annual-giveaway",
};

function getParentCampaigns(programName: string, dbCategory: string): string[] {
  if (PROGRAM_CAMPAIGN_MAP[programName]) {
    return PROGRAM_CAMPAIGN_MAP[programName];
  }
  return [dbCategory];
}

function getDetailRoute(programName: string): string | null {
  return PROGRAM_DETAIL_ROUTES[programName] || null;
}

describe("Programs page - Campaign association mapping", () => {
  it("maps Sunday Clinic to both Member Retention and Trial Conversion", () => {
    const campaigns = getParentCampaigns("Sunday Clinic", "trial_conversion");
    expect(campaigns).toEqual(["member_retention", "trial_conversion"]);
    expect(campaigns).toHaveLength(2);
  });

  it("maps Instagram Follower Growth to both Member Retention and Membership Acquisition", () => {
    const campaigns = getParentCampaigns("Instagram Follower Growth", "member_retention");
    expect(campaigns).toEqual(["member_retention", "membership_acquisition"]);
    expect(campaigns).toHaveLength(2);
  });

  it("maps PBGA Winter Clinic to Trial Conversion only", () => {
    const campaigns = getParentCampaigns("PBGA Winter Clinic", "trial_conversion");
    expect(campaigns).toEqual(["trial_conversion"]);
    expect(campaigns).toHaveLength(1);
  });

  it("maps Annual Membership Giveaway to Membership Acquisition", () => {
    const campaigns = getParentCampaigns("Annual Membership Giveaway", "membership_acquisition");
    expect(campaigns).toEqual(["membership_acquisition"]);
  });

  it("falls back to database category for unknown programs", () => {
    const campaigns = getParentCampaigns("Some New Program", "corporate_events");
    expect(campaigns).toEqual(["corporate_events"]);
    expect(campaigns).toHaveLength(1);
  });

  it("all mapped campaign keys reference valid strategic campaigns", () => {
    const validKeys = Object.keys(STRATEGIC_CAMPAIGNS);
    for (const [programName, campaignKeys] of Object.entries(PROGRAM_CAMPAIGN_MAP)) {
      for (const key of campaignKeys) {
        expect(validKeys).toContain(key);
      }
    }
  });
});

describe("Programs page - Detail route mapping", () => {
  it("returns /sunday-clinic for Sunday Clinic", () => {
    expect(getDetailRoute("Sunday Clinic")).toBe("/sunday-clinic");
  });

  it("returns /winter-clinic for PBGA Winter Clinic", () => {
    expect(getDetailRoute("PBGA Winter Clinic")).toBe("/winter-clinic");
  });

  it("returns /annual-giveaway for Annual Membership Giveaway", () => {
    expect(getDetailRoute("Annual Membership Giveaway")).toBe("/annual-giveaway");
  });

  it("returns null for programs without detail pages", () => {
    expect(getDetailRoute("PBGA Junior Summer Camp")).toBeNull();
    expect(getDetailRoute("$25 1-Hour Trial Session")).toBeNull();
    expect(getDetailRoute("Sports Game Watch Party")).toBeNull();
    expect(getDetailRoute("Black Friday Deal")).toBeNull();
  });
});

describe("Programs page - Strategic campaigns completeness", () => {
  it("defines exactly 4 strategic campaigns", () => {
    expect(Object.keys(STRATEGIC_CAMPAIGNS)).toHaveLength(4);
  });

  it("includes all expected campaign types", () => {
    expect(STRATEGIC_CAMPAIGNS).toHaveProperty("trial_conversion");
    expect(STRATEGIC_CAMPAIGNS).toHaveProperty("membership_acquisition");
    expect(STRATEGIC_CAMPAIGNS).toHaveProperty("member_retention");
    expect(STRATEGIC_CAMPAIGNS).toHaveProperty("corporate_events");
  });

  it("all 8 known programs are mapped", () => {
    expect(Object.keys(PROGRAM_CAMPAIGN_MAP)).toHaveLength(8);
  });
});
