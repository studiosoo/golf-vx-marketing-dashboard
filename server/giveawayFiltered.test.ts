import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: any, val: any) => ({ type: "eq", col, val })),
  like: vi.fn((col: any, val: any) => ({ type: "like", col, val })),
  and: vi.fn((...args: any[]) => ({ type: "and", args })),
  or: vi.fn((...args: any[]) => ({ type: "or", args })),
  desc: vi.fn((col: any) => ({ type: "desc", col })),
  asc: vi.fn((col: any) => ({ type: "asc", col })),
  ilike: vi.fn((col: any, val: any) => ({ type: "ilike", col, val })),
}));

// ─── Helper: compute Drive Day score (mirrors server logic) ──────────────────

function computeDriveDayScore(app: {
  golfExperienceLevel?: string | null;
  visitedBefore?: string | null;
  illinoisResident?: boolean | null;
  indoorGolfFamiliarity?: string | null;
}): number {
  let score = 50;
  const expLower = (app.golfExperienceLevel || "").toLowerCase();
  if (expLower.includes("beginner") || expLower.includes("new") || expLower.includes("never")) {
    score += 20;
  } else if (expLower.includes("intermediate")) {
    score += 15;
  } else if (expLower.includes("advanced") || expLower.includes("experienced")) {
    score += 5;
  }
  const visitLower = (app.visitedBefore || "").toLowerCase();
  if (visitLower === "yes") score += 10;
  else if (visitLower === "no" || visitLower === "new") score += 5;
  if (app.illinoisResident) score += 10;
  const indoorLower = (app.indoorGolfFamiliarity || "").toLowerCase();
  if (indoorLower.includes("never")) score += 15;
  else if (indoorLower.includes("once") || indoorLower.includes("twice")) score += 10;
  return Math.min(score, 100);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Drive Day Score Computation", () => {
  it("gives baseline score of 50 for unknown applicant", () => {
    expect(computeDriveDayScore({})).toBe(50);
  });

  it("adds 20 for beginner golf experience", () => {
    expect(computeDriveDayScore({ golfExperienceLevel: "Beginner" })).toBe(70);
  });

  it("adds 15 for intermediate golf experience", () => {
    expect(computeDriveDayScore({ golfExperienceLevel: "Intermediate" })).toBe(65);
  });

  it("adds 5 for advanced golf experience", () => {
    expect(computeDriveDayScore({ golfExperienceLevel: "Advanced" })).toBe(55);
  });

  it("adds 10 for Illinois resident", () => {
    expect(computeDriveDayScore({ illinoisResident: true })).toBe(60);
  });

  it("adds 15 for never tried indoor golf", () => {
    expect(computeDriveDayScore({ indoorGolfFamiliarity: "Never tried before" })).toBe(65);
  });

  it("adds 10 for tried indoor golf once", () => {
    expect(computeDriveDayScore({ indoorGolfFamiliarity: "Tried once or twice" })).toBe(60);
  });

  it("adds 10 for visited before", () => {
    expect(computeDriveDayScore({ visitedBefore: "yes" })).toBe(60);
  });

  it("adds 5 for new visitor", () => {
    expect(computeDriveDayScore({ visitedBefore: "no" })).toBe(55);
  });

  it("caps score at 100 for maximum-scoring applicant", () => {
    const maxApp = {
      golfExperienceLevel: "Beginner",
      visitedBefore: "yes",
      illinoisResident: true,
      indoorGolfFamiliarity: "Never tried before",
    };
    // 50 + 20 + 10 + 10 + 15 = 105 → capped at 100
    expect(computeDriveDayScore(maxApp)).toBe(100);
  });

  it("computes correct score for typical high-value prospect", () => {
    const app = {
      golfExperienceLevel: "Intermediate",
      visitedBefore: "no",
      illinoisResident: true,
      indoorGolfFamiliarity: "Never tried before",
    };
    // 50 + 15 + 5 + 10 + 15 = 95
    expect(computeDriveDayScore(app)).toBe(95);
  });

  it("handles null/undefined fields gracefully", () => {
    expect(computeDriveDayScore({ golfExperienceLevel: null, visitedBefore: null, illinoisResident: null, indoorGolfFamiliarity: null })).toBe(50);
  });
});

describe("Pagination Logic", () => {
  const mockApps = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `Applicant ${i + 1}`,
    driveDayScore: 50 + i,
  }));

  it("returns correct page slice for page 1", () => {
    const pageSize = 10;
    const page = 1;
    const offset = (page - 1) * pageSize;
    const result = mockApps.slice(offset, offset + pageSize);
    expect(result.length).toBe(10);
    expect(result[0].id).toBe(1);
  });

  it("returns correct page slice for page 2", () => {
    const pageSize = 10;
    const page = 2;
    const offset = (page - 1) * pageSize;
    const result = mockApps.slice(offset, offset + pageSize);
    expect(result.length).toBe(10);
    expect(result[0].id).toBe(11);
  });

  it("returns partial last page correctly", () => {
    const pageSize = 10;
    const page = 3;
    const offset = (page - 1) * pageSize;
    const result = mockApps.slice(offset, offset + pageSize);
    expect(result.length).toBe(5);
  });

  it("calculates total pages correctly", () => {
    const total = 67;
    const pageSize = 50;
    const totalPages = Math.ceil(total / pageSize);
    expect(totalPages).toBe(2);
  });
});

describe("Sort Logic", () => {
  const apps = [
    { name: "Charlie", driveDayScore: 70, status: "pending", submissionTimestamp: new Date("2026-01-15") },
    { name: "Alice", driveDayScore: 90, status: "contacted", submissionTimestamp: new Date("2026-02-01") },
    { name: "Bob", driveDayScore: 80, status: "completed", submissionTimestamp: new Date("2026-01-20") },
  ];

  it("sorts by name ascending", () => {
    const sorted = [...apps].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    expect(sorted[0].name).toBe("Alice");
    expect(sorted[1].name).toBe("Bob");
    expect(sorted[2].name).toBe("Charlie");
  });

  it("sorts by driveDayScore descending", () => {
    const sorted = [...apps].sort((a, b) => b.driveDayScore - a.driveDayScore);
    expect(sorted[0].driveDayScore).toBe(90);
    expect(sorted[1].driveDayScore).toBe(80);
    expect(sorted[2].driveDayScore).toBe(70);
  });

  it("sorts by submissionTimestamp descending (newest first)", () => {
    const sorted = [...apps].sort((a, b) => b.submissionTimestamp.getTime() - a.submissionTimestamp.getTime());
    expect(sorted[0].name).toBe("Alice");
    expect(sorted[2].name).toBe("Charlie");
  });
});
