export type ItemStatus = "active" | "planned" | "completed" | "archived" | "pending";

export type CampaignItem = {
  id: string;
  name: string;
  type: string;
  status: ItemStatus;
  kpi?: string;
  kpiCurrent?: number;
  kpiTarget?: number;
  kpiLabel?: string;
  adSpend?: number;
  revenue?: number;
  revenueTarget?: number;
  impressions?: number;
  ctr?: number;
  isCross?: boolean;
  costNote?: string;
  notes?: string;
  route: string;
  startDate?: string;
  endDate?: string;
};

export type CampaignData = {
  programs: CampaignItem[];
  promotions: CampaignItem[];
  paidAds: CampaignItem[];
};

// ─── Timeline item type ───────────────────────────────────────────────────────
// campaigns: array of campaign IDs (1 = single, 2 = cross-campaign dual-color bar)
// datesConfirmed: false → renders as dashed "Dates TBD" bar
// asanaTaskId / asanaProjectId: Phase 2 Asana sync fields (optional)

export type TimelineItem = {
  id: string;
  name: string;
  category: "program" | "promotion" | "paid_ads";
  campaigns: string[];
  start: string;            // YYYY-MM-DD or "" if TBD
  end: string;              // YYYY-MM-DD or "" if TBD
  datesConfirmed: boolean;
  status: ItemStatus;
  kpiHint?: string;         // brief tooltip KPI note
  asanaTaskId?: string;
  asanaProjectId?: string;
};

export const CAMPAIGN_ITEMS: Record<string, CampaignData> = {
  trial_conversion: {
    programs: [
      {
        id: "tc-trial", name: "$25 1-Hour Trial Session", type: "Trial Program", status: "active",
        kpiLabel: "Sessions Booked (MTD)", kpi: "Live · see Acuity",
        route: "/activities/promotions/trial-session",
      },
      {
        id: "tc-sunday", name: "Sunday Clinic", type: "Skills Clinic", status: "active",
        kpiLabel: "Weekly Enrollment", kpi: "Weekly enrollment", isCross: true,
        notes: "Also under Member Retention.",
        route: "/activities/programs/sunday-clinic",
      },
      {
        id: "tc-winter", name: "PBGA Winter Clinic", type: "Instruction Program", status: "active",
        kpiLabel: "Enrolled", kpi: "Live (Acuity)",
        startDate: "2026-01-01", endDate: "2026-03-31",
        route: "/activities/programs/winter-camp",
      },
      {
        id: "tc-junior", name: "PBGA Junior Summer Camp", type: "Revenue Program", status: "active",
        kpiLabel: "Enrolled", kpiCurrent: 0, kpiTarget: 120,
        adSpend: 293.16, revenueTarget: 66000,
        notes: "Early Bird Mar 31. Email campaign needed.",
        startDate: "2026-06-01", endDate: "2026-08-31",
        route: "/activities/programs/junior-summer-camp",
      },
      {
        id: "tc-drive-pub", name: "Drive Day — Open Sessions", type: "Open Play Event", status: "active",
        kpiLabel: "Sessions", kpi: "Ongoing",
        startDate: "2026-02-01", endDate: "2026-03-29",
        route: "/activities/programs/sunday-clinic",
      },
    ],
    promotions: [
      {
        id: "tc-giveaway", name: "Annual Membership Giveaway", type: "Acquisition Campaign", status: "active",
        kpiLabel: "Valid Applicants", kpiCurrent: 77, kpiTarget: 150,
        adSpend: 1561, revenueTarget: 52720, isCross: true,
        costNote: "Promo $1,182 / Paid Ads $379 / Total $1,561",
        notes: "Also under Membership Acquisition. Winner Apr 29. 77 valid / 82 raw (−4 dupes, −1 test).",
        startDate: "2026-02-02", endDate: "2026-04-29",
        route: "/activities/promotions/annual-giveaway",
      },
      {
        id: "tc-chicago", name: "Chicago Golf Show 2026", type: "Event", status: "completed",
        kpiLabel: "Coupon Redemptions", kpiCurrent: 0,
        kpi: "30 coupons distributed · 10–20 applications (pending source filter)",
        costNote: "AH Cost: $150 print (shared w/ Giveaway). HQ Fee: $1,500 — Informational Only. Not counted as AH expense. Excluded from AH ROI/ROAS.",
        isCross: true,
        notes: "HQ-led event. Studio Soo not present. AH benefit: 30 free-trial coupons + on-site giveaway applications.",
        startDate: "2026-02-27", endDate: "2026-03-01",
        route: "/activities/local/chicago-golf-show",
      },
    ],
    paidAds: [
      { id: "ta-ga1", name: "Annual Membership Giveaway — Ad Set A1 (Local Awareness)", type: "Facebook Paid Ads", status: "completed", adSpend: 803,    impressions: 80947, ctr: 0.90, isCross: true, startDate: "2026-02-02", endDate: "2026-03-03", route: "/activities/promotions/annual-giveaway" },
      { id: "ta-ig",  name: "Annual Membership Giveaway — Instagram Boost",             type: "Facebook Paid Ads", status: "active",    adSpend: 43,     impressions: 15528, ctr: 0.30, isCross: true, route: "/activities/promotions/annual-giveaway" },
      { id: "ta-jsc", name: "PBGA Junior Summer Camp",  type: "Facebook Paid Ads", status: "active",    adSpend: 293.16, impressions: 82307, ctr: 1.82, route: "/activities/programs/junior-summer-camp" },
      { id: "ta-dd",  name: "Drive Day Boost",     type: "Facebook Paid Ads", status: "completed", adSpend: 55,     impressions: 4633,  ctr: 4.21, route: "/activities/programs/sunday-clinic" },
    ],
  },

  membership_acquisition: {
    programs: [],
    promotions: [
      {
        id: "ma-giveaway", name: "Annual Membership Giveaway", type: "Acquisition Campaign", status: "active",
        kpiLabel: "Valid Applicants", kpiCurrent: 77, kpiTarget: 150,
        adSpend: 1225, revenueTarget: 52720, isCross: true,
        costNote: "Promo $1,182 / Paid Ads $1,225 / A1 ended Mar 3 · A2 + IG active",
        notes: "Also under Trial Conversion. Winner Apr 29. 77 valid / 82 raw (−4 dupes, −1 test). Prizes: 1× All-Access Annual + 1× Swing Saver + 3× $300 Gift Cards.",
        startDate: "2026-02-02", endDate: "2026-04-29",
        route: "/activities/promotions/annual-giveaway",
      },
      {
        id: "ma-chicago", name: "Chicago Golf Show 2026", type: "Event", status: "completed",
        kpi: "10–20 giveaway applications on-site (pending source filter)",
        costNote: "AH Cost: $150 print (shared w/ Giveaway). HQ Fee: $1,500 — Informational Only.",
        isCross: true,
        notes: "On-site applicants tagged 'Chicago Golf Show' in applicant source data.",
        startDate: "2026-02-27", endDate: "2026-03-01",
        route: "/activities/local/chicago-golf-show",
      },
    ],
    // Merged: 3 giveaway ad sets → 1 consolidated entry
    paidAds: [
      {
        id: "ma-giveaway-ads", name: "Annual Membership Giveaway Ads (A1 + A2 + IG)", type: "Facebook Paid Ads",
        status: "active", adSpend: 1225, impressions: 122909, ctr: 1.20, isCross: true,
        costNote: "A1 $803 (ended Mar 3) · A2 $379 · IG $43 · Total $1,225",
        startDate: "2026-02-02", endDate: "2026-04-29",
        route: "/activities/promotions/annual-giveaway",
      },
    ],
  },

  member_retention: {
    programs: [
      {
        id: "mr-sunday", name: "Sunday Clinic", type: "Skills Clinic", status: "active",
        kpiLabel: "Weekly Enrollment", kpi: "Weekly enrollment", isCross: true,
        notes: "Also under Trial Conversion.",
        route: "/activities/programs/sunday-clinic",
      },
      {
        id: "mr-drive", name: "Drive Day — Members", type: "Member Event", status: "active",
        kpiLabel: "Sessions", kpi: "Ongoing",
        startDate: "2026-01-25", endDate: "2026-03-22",
        route: "/activities/programs/sunday-clinic",
      },
    ],
    promotions: [
      {
        id: "mr-winter-league", name: "2026 Winter National League", type: "League", status: "completed",
        kpiLabel: "Participants", kpi: "Season completed",
        startDate: "2026-01-05", endDate: "2026-03-05",
        route: "/activities/promotions",
      },
      {
        id: "mr-feb-fairways", name: "February Fairways Tournament", type: "Tournament", status: "completed",
        kpiLabel: "Participants", kpi: "Tournament completed",
        startDate: "2026-02-01", endDate: "2026-02-28",
        route: "/activities/promotions",
      },
      {
        id: "mr-gift-card", name: "Gift Card Promo", type: "Promotion", status: "active",
        kpiLabel: "Redeemed", kpi: "Ongoing",
        startDate: "2025-11-24", endDate: "2026-03-31",
        route: "/activities/promotions/gift-card-promo",
      },
    ],
    paidAds: [],
  },

  corporate_events: {
    programs: [],
    promotions: [
      {
        id: "ce-superbowl", name: "Super Bowl Watch Party", type: "Event", status: "completed",
        kpiLabel: "Revenue", kpiCurrent: 300, kpiTarget: 300,
        revenue: 300, adSpend: 75,
        notes: "1 bay booking. 4,167 ad impressions. Strong local impression.",
        startDate: "2026-02-09", endDate: "2026-02-09",
        route: "/activities/local",
      },
      {
        id: "ce-chicago", name: "Chicago Golf Show 2026", type: "Event", status: "completed",
        kpi: "30 trial coupons · 10–20 giveaway applications",
        costNote: "AH Print Cost: $150. HQ Event Fee: $1,500 — Informational Only. Not counted as AH marketing expense. Excluded from AH cost totals, ROI, and ROAS calculations.",
        isCross: true,
        notes: "HQ-led event. Studio Soo not present. Putting challenge format confirmed for future events (NV5, Harmony Fest). Raffle to simplify to name/email/phone next year.",
        startDate: "2026-02-27", endDate: "2026-03-01",
        route: "/activities/local/chicago-golf-show",
      },
      {
        id: "ce-fundraising", name: "Fundraising / Sponsorships", type: "Community Outreach", status: "pending",
        kpi: "Pending confirmation",
        costNote: "Gift Card Value (Non-Cash): $100 per org (2 × $50 GCs) — not counted as cash spend in ROI",
        notes: "Flagged for follow-up. Awaiting org confirmation.",
        route: "/activities/local/cha-fundraiser",
      },
{
        id: "ce-events", name: "Local Events", type: "Local Marketing — Promotions", status: "pending",
        kpi: "B2B & Events primary",
        route: "/activities/local/corporate-b2b",
      },
    ],
    paidAds: [
      { id: "ce-sb", name: "Superbowl Watch Party", type: "Facebook Paid Ads", status: "completed", adSpend: 75, impressions: 4167, ctr: 1.37, route: "/activities/local" },
    ],
  },
};

// ─── Timeline items ────────────────────────────────────────────────────────────
// Mirrors the "Golf VX Marketing Master Timeline" Asana project structure.
// campaigns: 2-element array = dual-color split bar on timeline.
// datesConfirmed: false → renders as dashed "Dates TBD" bar.

export const TIMELINE_ITEMS: TimelineItem[] = [
  // ── Programs ──
  {
    id: "p-trial",
    name: "$25 1-Hour Trial Session",
    category: "program",
    campaigns: ["trial_conversion"],
    start: "2026-01-01", end: "2026-12-31",
    datesConfirmed: true, status: "active",
    kpiHint: "Year-round · see Acuity for bookings",
  },
  {
    id: "p-winter",
    name: "PBGA Winter Clinic",
    category: "program",
    campaigns: ["trial_conversion"],
    start: "2026-01-01", end: "2026-03-31",
    datesConfirmed: true, status: "active",
    kpiHint: "Jan–Mar · enrollment via Acuity",
  },
  {
    id: "p-sunday",
    name: "Sunday Clinic",
    category: "program",
    campaigns: ["trial_conversion", "member_retention"],
    start: "2026-01-01", end: "2026-12-31",
    datesConfirmed: true, status: "active",
    kpiHint: "Year-round weekly · Trial + Retention cross-campaign",
  },
  {
    id: "p-junior",
    name: "PBGA Junior Summer Camp",
    category: "program",
    campaigns: ["trial_conversion"],
    start: "2026-06-01", end: "2026-08-31",
    datesConfirmed: true, status: "planned",
    kpiHint: "Jun–Aug · Early Bird Mar 31 · 0/120 enrolled",
  },

  // ── Promotions ──
  {
    id: "e-giveaway",
    name: "Annual Membership Giveaway",
    category: "promotion",
    campaigns: ["membership_acquisition", "trial_conversion"],
    start: "2026-02-02", end: "2026-04-29",
    datesConfirmed: true, status: "active",
    kpiHint: "77/150 valid applicants · Winner Apr 29",
  },
  {
    id: "e-superbowl",
    name: "Super Bowl Watch Party",
    category: "promotion",
    campaigns: ["corporate_events"],
    start: "2026-02-09", end: "2026-02-09",
    datesConfirmed: true, status: "completed",
    kpiHint: "1 bay · $300 revenue · 4,167 impr.",
  },
  {
    id: "e-chicago",
    name: "Chicago Golf Show",
    category: "promotion",
    campaigns: ["trial_conversion", "membership_acquisition"],
    start: "2026-02-27", end: "2026-03-01",
    datesConfirmed: true, status: "completed",
    kpiHint: "30 coupons distributed · on-site applicants",
  },
  {
    id: "e-fundraise",
    name: "Fundraising / Sponsorships",
    category: "promotion",
    campaigns: ["corporate_events"],
    start: "", end: "",
    datesConfirmed: false, status: "pending",
    kpiHint: "Awaiting org confirmation · $100 GC non-cash",
  },

  // ── Paid Ads ──
  {
    id: "a-giveaway",
    name: "Annual Membership Giveaway Ads (A1 + A2 + IG)",
    category: "paid_ads",
    campaigns: ["membership_acquisition", "trial_conversion"],
    start: "2026-02-02", end: "2026-04-29",
    datesConfirmed: true, status: "active",
    kpiHint: "$1,225 total spend · 123K+ impr. · A1 ended Mar 3 · A2 + IG active",
  },
  {
    id: "a-junior",
    name: "Junior Camp Ads",
    category: "paid_ads",
    campaigns: ["trial_conversion"],
    start: "2026-01-01", end: "2026-08-31",
    datesConfirmed: true, status: "active",
    kpiHint: "$293 spend · 82K impr. · 1.82% CTR",
  },
  {
    id: "a-superbowl",
    name: "Super Bowl Ad",
    category: "paid_ads",
    campaigns: ["corporate_events"],
    start: "2026-02-05", end: "2026-02-09",
    datesConfirmed: true, status: "completed",
    kpiHint: "$75 spend · 4,167 impr. · 1.37% CTR",
  },

  // ── New entries (naming alignment) ──
  {
    id: "p-drive-pub",
    name: "Drive Day — Open Sessions",
    category: "program",
    campaigns: ["trial_conversion"],
    start: "2026-02-01", end: "2026-03-29",
    datesConfirmed: true, status: "active",
    kpiHint: "Feb–Mar · open play event",
  },
  {
    id: "p-drive-members",
    name: "Drive Day — Members",
    category: "program",
    campaigns: ["member_retention"],
    start: "2026-01-25", end: "2026-03-22",
    datesConfirmed: true, status: "active",
    kpiHint: "Jan–Mar · member event",
  },
  {
    id: "e-winter-league",
    name: "2026 Winter National League",
    category: "promotion",
    campaigns: ["member_retention"],
    start: "2026-01-05", end: "2026-03-05",
    datesConfirmed: true, status: "completed",
    kpiHint: "Jan–Mar · season completed",
  },
  {
    id: "e-feb-fairways",
    name: "February Fairways Tournament",
    category: "promotion",
    campaigns: ["member_retention"],
    start: "2026-02-01", end: "2026-02-28",
    datesConfirmed: true, status: "completed",
    kpiHint: "Feb · tournament completed",
  },
  {
    id: "e-gift-card",
    name: "Gift Card Promo",
    category: "promotion",
    campaigns: ["member_retention"],
    start: "2025-11-24", end: "2026-03-31",
    datesConfirmed: true, status: "active",
    kpiHint: "Nov–Mar · ongoing promo",
  },
];
