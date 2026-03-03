import { describe, it, expect } from "vitest";

// ── Mirrors the logic from MarketResearch.tsx ────────────────────────────────

interface Promotion {
  id: string;
  name: string;
  month: string;
  channel: string;
  budget: number;
  reach: number;
  conversions: number;
  status: string;
  notes: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const SEASONAL = [
  { month: "Jan", outdoor: 15, indoor: 85, sportsBar: 70 },
  { month: "Feb", outdoor: 20, indoor: 80, sportsBar: 65 },
  { month: "Mar", outdoor: 45, indoor: 75, sportsBar: 60 },
  { month: "Apr", outdoor: 70, indoor: 65, sportsBar: 55 },
  { month: "May", outdoor: 85, indoor: 55, sportsBar: 50 },
  { month: "Jun", outdoor: 95, indoor: 50, sportsBar: 55 },
  { month: "Jul", outdoor: 100, indoor: 45, sportsBar: 60 },
  { month: "Aug", outdoor: 95, indoor: 50, sportsBar: 55 },
  { month: "Sep", outdoor: 85, indoor: 60, sportsBar: 60 },
  { month: "Oct", outdoor: 65, indoor: 70, sportsBar: 65 },
  { month: "Nov", outdoor: 30, indoor: 80, sportsBar: 70 },
  { month: "Dec", outdoor: 10, indoor: 75, sportsBar: 75 },
];

function buildPromoChartData(promotions: Promotion[]) {
  const budgetByMonth: Record<string, number> = {};
  const convByMonth: Record<string, number> = {};
  const countByMonth: Record<string, number> = {};
  promotions.forEach(p => {
    budgetByMonth[p.month] = (budgetByMonth[p.month] || 0) + p.budget;
    convByMonth[p.month] = (convByMonth[p.month] || 0) + p.conversions;
    countByMonth[p.month] = (countByMonth[p.month] || 0) + 1;
  });
  return SEASONAL.map(row => ({
    ...row,
    budget: budgetByMonth[row.month] || 0,
    conversions: convByMonth[row.month] || 0,
    promoCount: countByMonth[row.month] || 0,
  }));
}

function buildGapAnalysis(promotions: Promotion[]) {
  const budgetByMonth: Record<string, number> = {};
  promotions.forEach(p => { budgetByMonth[p.month] = (budgetByMonth[p.month] || 0) + p.budget; });
  return SEASONAL.map(row => {
    const demandScore = Math.round((row.indoor + row.sportsBar) / 2);
    const spend = budgetByMonth[row.month] || 0;
    const gap = demandScore - Math.min(spend / 10, 100);
    const severity = gap > 50 ? "high" : gap > 20 ? "medium" : "low";
    return { month: row.month, demandScore, spend, gap: Math.round(gap), severity };
  });
}

function calcCPL(budget: number, conversions: number): number | null {
  if (conversions === 0) return null;
  return Math.round(budget / conversions);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Promotions vs. Demand — chart data builder", () => {
  it("aggregates budget and conversions per month", () => {
    const promos: Promotion[] = [
      { id: "1", name: "A", month: "Jan", channel: "Meta Ads", budget: 400, reach: 1000, conversions: 10, status: "completed", notes: "" },
      { id: "2", name: "B", month: "Jan", channel: "Email",    budget: 100, reach: 500,  conversions: 5,  status: "completed", notes: "" },
      { id: "3", name: "C", month: "Mar", channel: "Meta Ads", budget: 600, reach: 2000, conversions: 20, status: "planned",   notes: "" },
    ];
    const data = buildPromoChartData(promos);
    const jan = data.find(d => d.month === "Jan")!;
    const mar = data.find(d => d.month === "Mar")!;
    const feb = data.find(d => d.month === "Feb")!;

    expect(jan.budget).toBe(500);
    expect(jan.conversions).toBe(15);
    expect(jan.promoCount).toBe(2);
    expect(mar.budget).toBe(600);
    expect(mar.conversions).toBe(20);
    expect(feb.budget).toBe(0);
    expect(feb.conversions).toBe(0);
    expect(feb.promoCount).toBe(0);
  });

  it("preserves demand index values from seasonal data", () => {
    const data = buildPromoChartData([]);
    const jul = data.find(d => d.month === "Jul")!;
    expect(jul.outdoor).toBe(100);
    expect(jul.indoor).toBe(45);
    expect(jul.sportsBar).toBe(60);
  });

  it("returns 12 months of data regardless of promotions", () => {
    expect(buildPromoChartData([]).length).toBe(12);
  });
});

describe("Gap Analysis", () => {
  it("marks high gap when demand is high and spend is zero", () => {
    const gaps = buildGapAnalysis([]); // no promotions → all months have $0 spend
    const jan = gaps.find(g => g.month === "Jan")!;
    // Jan demandScore = (85+70)/2 = 77, spend=0, gap=77 → high
    expect(jan.demandScore).toBe(78); // rounded
    expect(jan.spend).toBe(0);
    expect(jan.severity).toBe("high");
  });

  it("marks low gap when spend covers demand", () => {
    // $1000 budget → normalised to 100, demand ~78 → gap = 78-100 = -22 → low
    const promos: Promotion[] = [
      { id: "1", name: "A", month: "Jan", channel: "Meta Ads", budget: 1000, reach: 0, conversions: 0, status: "completed", notes: "" },
    ];
    const gaps = buildGapAnalysis(promos);
    const jan = gaps.find(g => g.month === "Jan")!;
    expect(jan.severity).toBe("low");
  });

  it("returns exactly 12 gap rows", () => {
    expect(buildGapAnalysis([]).length).toBe(12);
  });

  it("identifies summer months (Jul) as lower demand for indoor", () => {
    const gaps = buildGapAnalysis([]);
    const jul = gaps.find(g => g.month === "Jul")!;
    const jan = gaps.find(g => g.month === "Jan")!;
    // Jul indoor demand is lower than Jan — gap should still be high (no spend)
    // but Jan demand score should be higher than Jul
    expect(jan.demandScore).toBeGreaterThan(jul.demandScore);
  });
});

describe("CPL (Cost Per Lead) calculation", () => {
  it("calculates CPL correctly", () => {
    expect(calcCPL(500, 10)).toBe(50);
    expect(calcCPL(441, 31)).toBe(14);
    expect(calcCPL(462, 67)).toBe(7);
  });

  it("returns null when conversions is zero", () => {
    expect(calcCPL(500, 0)).toBeNull();
  });

  it("rounds to nearest dollar", () => {
    expect(calcCPL(100, 3)).toBe(33); // 33.33 → 33
  });
});

describe("Promotion summary stats", () => {
  const promos: Promotion[] = [
    { id: "1", name: "A", month: "Jan", channel: "Meta Ads", budget: 400, reach: 1000, conversions: 10, status: "completed", notes: "" },
    { id: "2", name: "B", month: "Feb", channel: "Email",    budget: 100, reach: 500,  conversions: 5,  status: "active",    notes: "" },
    { id: "3", name: "C", month: "Mar", channel: "Meta Ads", budget: 600, reach: 2000, conversions: 0,  status: "planned",   notes: "" },
  ];

  it("calculates total budget", () => {
    const total = promos.reduce((s, p) => s + p.budget, 0);
    expect(total).toBe(1100);
  });

  it("calculates total conversions", () => {
    const total = promos.reduce((s, p) => s + p.conversions, 0);
    expect(total).toBe(15);
  });

  it("counts planned promotions", () => {
    const planned = promos.filter(p => p.status === "planned").length;
    expect(planned).toBe(1);
  });

  it("counts completed promotions", () => {
    const completed = promos.filter(p => p.status === "completed").length;
    expect(completed).toBe(1);
  });
});
