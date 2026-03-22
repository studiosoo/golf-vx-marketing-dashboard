import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import { appRoutes, getVenueSlugFromPath } from "@/lib/routes";

// ─── Types ────────────────────────────────────────────────────

export type ActivityTab    = "programs" | "promotions" | "local" | "all";
export type ActivityStatus = "active" | "completed" | "upcoming" | "planned";

export interface ContentAsset {
  label: string;
  period?: string;
  format?: string;
  notes?: string;
  imageUrl?: string;
  status?: "available" | "planned" | "in_production";
}

export interface ActivityItem {
  id: string;
  name: string;
  tab: ActivityTab;
  asanaGid: string;
  projectName: string;
  status: ActivityStatus;
  color: string;
  description?: string;
  group?: string;
  startDate?: string;
  endDate?: string;
  note?: string;
  toastUrl?: string;
  acuityCategory?: string;
  isSocialMedia?: boolean;
  contentAssets?: ContentAsset[];
  analyticsNote?: string;
  strategicNote?: string;
  staticKpis?: { label: string; value: string; unit?: string; warning?: string; }[];
}

export interface PastProgramItem {
  id: string;
  name: string;
  note: string;
}

// ─── Seed Data ────────────────────────────────────────────────

export const ACTIVITY_ITEMS: ActivityItem[] = [
  // ── Programs ─────────────────────────────────────────────
  {
    id: "sunday-clinic",
    name: "Sunday Clinic",
    tab: "programs",
    group: "PBGA Lessons & Clinics",
    description: "Drive Day Series · Chuck Lynch, David Hannon · PGA Professionals",
    asanaGid: "1212078499567959",
    projectName: "PBGA Programs",
    acuityCategory: "Drive Day",
    status: "active",
    color: "#72B84A",
    startDate: "2026-01-25",
    endDate: "2026-03-29",
  },
  {
    id: "junior-summer-camp",
    name: "PBGA Junior Summer Camp",
    tab: "programs",
    group: "PBGA Lessons & Clinics",
    description: "Summer youth golf program · Ages 4–17",
    asanaGid: "1212078499567959",
    projectName: "PBGA Programs",
    acuityCategory: "Junior Summer Camp",
    status: "active",
    color: "#4E8DF4",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
  },
  {
    id: "winter-camp",
    name: "PBGA Winter Clinic",
    tab: "programs",
    group: "PBGA Lessons & Clinics",
    description: "4-Week structured clinic · PGA Professional instruction",
    asanaGid: "1212078499567959",
    projectName: "PBGA Programs",
    acuityCategory: "PBGA Winter Clinics",
    status: "active",
    color: "#A87FBE",
    startDate: "2026-01-01",
    endDate: "2026-04-30",
  },

  // ── Promotions ────────────────────────────────────────────
  {
    id: "trial-session",
    name: "Trial Session",
    tab: "promotions",
    description: "1-Hour intro session · $25 off-peak / $35 peak",
    asanaGid: "1212077269419925",
    projectName: "Trial Conversion Campaign",
    acuityCategory: "Trial Sessions",
    status: "active",
    color: "#72B84A",
  },
  {
    id: "gift-card-promo",
    name: "Gift Card Promo",
    tab: "promotions",
    description: "$100 purchase → $20 bonus certificate · Valid through Mar 31",
    asanaGid: "1211736985531595",
    projectName: "Member Retention",
    status: "active",
    color: "#4E8DF4",
    startDate: "2025-11-24",
    endDate: "2026-03-31",
    toastUrl: "https://order.toasttab.com/egiftcards/golf-vx-arlington-heights-644-east-rand-road",
    note: "Sales data managed via Toast POS. Manual entry required.",
    contentAssets: [
      { label: "Season of Giving Gift Card Flyer", period: "Nov 2025", format: "Social Media Graphic", status: "available" },
    ],
  },
  {
    id: "annual-giveaway",
    name: "Annual Membership Giveaway",
    tab: "promotions",
    description: "Anniversary Acquisition Campaign · Prizes: 1× All-Access Annual Membership + 1× Swing Saver Package + 3× $300 Gift Cards",
    asanaGid: "1212077289242708",
    projectName: "Membership Acquisition",
    status: "completed",
    color: "#4E8DF4",
    startDate: "2026-02-18",
    endDate: "2026-03-16",
    staticKpis: [
      { label: "Unique Applicants",   value: "116",     unit: "long-form completed" },
      { label: "Goal Attainment",     value: "116%",    unit: "vs 100-applicant goal" },
      { label: "Meta Ad Spend",       value: "$467.59", unit: "of $3,000 budget" },
      { label: "Cost per Applicant",  value: "$4.03",   unit: "blended CPL" },
      { label: "Meta Reach",          value: "18,297",  unit: "unique people" },
      { label: "Click → Apply Rate",  value: "15.9%",   unit: "731 clicks → 116 completions" },
    ],
    strategicNote: "Goal of 100 long-form applicants met and exceeded at 116 (+16%). Excellent $4.03 CPL. Key learning: 41% of applicants are existing GVX members — next campaign should tighten exclusion targeting to reach more net-new prospects.",
    analyticsNote: "Campaign ran Feb 18 – Mar 16, 2026. Two Meta ads: A1 ($342.64 · 38,651 impressions · 13,833 reach · 448 clicks · 1.16% CTR) and A2 ($124.95 · 8,825 impressions · 4,464 reach · 283 clicks · 3.21% CTR). 116 unique real applicants after dedup and test-entry removal. 33% of respondents were non-IL residents — recommend tighter geo-targeting in the next run. Source: GOLFVX AH | Anniversary Applications 2026.xlsx (verified March 2026).",
  },
  {
    id: "instagram-giveaway",
    name: "Instagram Follower Growth Giveaway",
    tab: "promotions",
    asanaGid: "1212077289242708",
    projectName: "Membership Acquisition",
    status: "completed",
    color: "#4E8DF4",
    endDate: "2026-02-13",
  },
  {
    id: "swing-saver-promo",
    name: "Swing Saver Annual — Promotional Sales",
    tab: "promotions",
    description: "Limited-time annual memberships at $1,500/yr · Black Friday · Year-End · Anniversary",
    asanaGid: "1212077289242708",
    projectName: "Membership Acquisition",
    status: "active",
    color: "#4E8DF4",
    startDate: "2025-11-01",
    endDate: "2026-02-28",
    staticKpis: [
      { label: "Units Sold",   value: "3",        unit: "members",    warning: "Self-reported. Pending Stripe/Boomerang verification (week of Mar 17, 2026)." },
      { label: "Revenue",      value: "$4,500",   unit: "USD",        warning: "Self-reported. Pending Stripe/Boomerang verification (week of Mar 17, 2026)." },
      { label: "Avg Discount", value: "44% off",  unit: "vs $2,700" },
    ],
    contentAssets: [
      { label: "Year End Membership Special (Portrait)",  period: "Dec 16–31, 2025", format: "11×17 Print",           status: "available" },
      { label: "Year End Membership Special (Landscape)", period: "Dec 15–31, 2025", format: "16:9 Digital / Optisign", status: "available" },
      { label: "5 Months Free Flyer",                     period: "Nov–Dec 2025",    format: "11×17 Print",           status: "available" },
    ],
    analyticsNote: "⚠️ Data Pending Verification — Sales figures are self-reported estimates. Exact transaction data is in Stripe and Boomerang (template ID: 359801 — Swing Savers Black Friday). Verified data expected week of March 17, 2026 following data analyst review.",
    note: "Boomerang template 359801 · Purchase at front desk only · Reg. $2,250 · Promo $1,500/yr",
  },
  {
    id: "member-referral",
    name: "Member Referral Promo",
    tab: "promotions",
    asanaGid: "1212077289242708",
    projectName: "Membership Acquisition",
    status: "planned",
    color: "#4E8DF4",
  },

  // ── Local & Events ────────────────────────────────────────
  {
    id: "venue-printouts",
    name: "Venue Printouts & Display",
    tab: "local",
    group: "In-Venue",
    description: "In-venue print materials and Optisign displays",
    asanaGid: "1211917285471271",
    projectName: "Venue Display / Local Media",
    status: "active",
    color: "#D89A3C",
  },
  {
    id: "venue-experience-materials",
    name: "Venue Experience Materials",
    tab: "local",
    group: "In-Venue",
    description: "In-venue educational materials · Club Distance Chart · Google Review incentive card",
    asanaGid: "1211917285471271",
    projectName: "Venue Display / Local Media",
    status: "active",
    color: "#D89A3C",
    contentAssets: [
      { label: "Club Distance Chart", format: "Print (Laminated Card)", status: "available", notes: "Displayed at each bay" },
      { label: "Google Review Card", format: "Print (Business Card)", status: "available", notes: "\"Fries on Us\" incentive. Distributed at counter." },
    ],
  },
  {
    id: "monthly-happenings",
    name: "Monthly Happenings",
    tab: "local",
    group: "In-Venue",
    description: "Monthly member newsletter posts · Seasonal events, leagues & promotions",
    asanaGid: "1211917285471271",
    projectName: "Venue Display / Local Media",
    status: "active",
    color: "#D89A3C",
    contentAssets: [
      { label: "January 2026 Happenings",  period: "Jan 2026", format: "11×17 Print", status: "available" },
      { label: "February 2026 Happenings", period: "Feb 2026", format: "11×17 Print", status: "available" },
      { label: "March 2026 Happenings",    period: "Mar 2026", format: "11×17 Print", status: "available" },
    ],
    analyticsNote: "Monthly engagement tracked via Instagram insights + Optisign impressions.",
  },
  {
    id: "stroll-magazine",
    name: "Stroll Arlington Heights",
    tab: "local",
    group: "Community & Outreach",
    description: "Sponsor spotlight · Print media · Local community magazine",
    asanaGid: "1211912937095581",
    projectName: "Stroll Magazine",
    status: "completed",
    color: "#D89A3C",
    note: "Spotlight article submitted. Word document delivered.",
  },
  {
    id: "corporate-b2b",
    name: "Corporate Events & B2B",
    tab: "local",
    group: "Community & Outreach",
    asanaGid: "1212077289242724",
    projectName: "Corporate Events & B2B",
    status: "active",
    color: "#D89A3C",
  },
  {
    id: "cha-fundraiser",
    name: "CHA Fundraiser Night",
    tab: "local",
    group: "Community & Outreach",
    description: "05/02/26 · Community Fundraiser",
    asanaGid: "1212077289242724",
    projectName: "Corporate Events & B2B",
    status: "upcoming",
    color: "#D89A3C",
    startDate: "2026-05-02",
  },
  {
    id: "chicago-golf-show",
    name: "Chicago Golf Show 2026",
    tab: "local",
    group: "Community & Outreach",
    description: "HQ-led event · Feb 27–Mar 1 · AH: 30 free-trial coupons distributed",
    asanaGid: "1212077289242724",
    projectName: "Corporate Events & B2B",
    status: "completed",
    color: "#D89A3C",
    startDate: "2026-02-27",
    endDate: "2026-03-01",
    note: "HQ-led event. Studio Soo not present. AH print cost: $150. HQ fee ($1,500) excluded from AH ROI.",
  },
  {
    id: "monthly-tournaments",
    name: "Monthly Tournaments",
    tab: "local",
    group: "Member Events",
    description: "Monthly member tournaments · Leaderboard tracking · Social media promotion",
    asanaGid: "1212077289242724",
    projectName: "Corporate Events & B2B",
    status: "active",
    color: "#D89A3C",
    contentAssets: [
      { label: "January Tournament Promo",    period: "Jan 2026",       format: "Social Media Graphic", status: "available" },
      { label: "February Fairways Tournament", period: "Feb 1–28, 2026", format: "11×17 Print",         status: "available", notes: "Corte Bella Golf Course · TaylorMade Spider Putter Red prize · Winners announced March" },
    ],
    analyticsNote: "Signups tracked via Acuity appointment bookings.",
  },
  {
    id: "winter-leagues",
    name: "Winter Leagues",
    tab: "local",
    group: "Member Events",
    description: "6-Week competitive league · Member engagement · Indoor simulator",
    asanaGid: "1212077289242724",
    projectName: "Corporate Events & B2B",
    status: "active",
    color: "#D89A3C",
    startDate: "2026-01-01",
    endDate: "2026-03-31",
    contentAssets: [
      { label: "Winter Leagues Flyer", period: "Jan–Mar 2026", format: "Print / Social", status: "available" },
      { label: "League Schedule Graphic", period: "Jan–Mar 2026", format: "Social Media Graphic", status: "available" },
    ],
  },
  {
    id: "watch-party-events",
    name: "Watch Party Events",
    tab: "local",
    group: "Member Events",
    description: "Member watch parties · Go Bears (Feb) + Super Bowl (Feb 9, 2026)",
    asanaGid: "1212077289242724",
    projectName: "Corporate Events & B2B",
    status: "completed",
    color: "#D89A3C",
    startDate: "2026-02-09",
    endDate: "2026-02-09",
    contentAssets: [
      { label: "Go Bears Watch Party Flyer", period: "Feb 2026", format: "Social Media Graphic", status: "available" },
      { label: "Super Bowl Watch Party Flyer", period: "Feb 9, 2026", format: "Social Media Graphic", status: "available" },
    ],
    strategicNote: "Watch parties drove off-peak traffic during NFL playoff season. Consider seasonal repeat.",
    analyticsNote: "Attendance tracked manually. No scheduling integration used.",
  },
  {
    id: "social-media-content",
    name: "AH Social Media Content",
    tab: "local",
    group: "Social Media",
    asanaGid: "1211673464711096",
    projectName: "AH Social Media Content",
    status: "active",
    color: "#A87FBE",
  },
];

// Past programs — no detail page, shown as read-only memo cards
export const PAST_PROGRAMS: PastProgramItem[] = [
  {
    id: "danny-woj-wedge-clinic",
    name: "Danny Woj Wedge Clinic",
    note: "Oct 2025 · Managed via Eventbrite. Design only.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────

function fmtDateRange(start?: string, end?: string): string {
  if (!start && !end) return "";
  const fmt = (d: string) => {
    const [, m, day] = d.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(m,10)-1]} ${parseInt(day,10)}`;
  };
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
}

// ─── Status Badge ─────────────────────────────────────────────

function StatusBadge({ status }: { status: ActivityStatus }) {
  const map: Record<ActivityStatus, { bg: string; color: string; label: string }> = {
    active:    { bg: "rgba(242,221,72,0.18)",  color: "#B89A00", label: "Active" },
    completed: { bg: "rgba(216,154,60,0.18)",  color: "#C47A20", label: "Completed" },
    upcoming:  { bg: "rgba(78,141,244,0.15)",  color: "#2F6CD4", label: "Upcoming" },
    planned:   { bg: "rgba(168,168,163,0.2)",  color: "#6F6F6B", label: "Planned" },
  };
  const s = map[status];
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "4px", whiteSpace: "nowrap" as const }}>
      {s.label}
    </span>
  );
}

// ─── KPI Bar ──────────────────────────────────────────────────

const TAB_KPI_HINT: Record<ActivityTab, string | null> = {
  programs:   "Acuity-tracked registrations",
  promotions: "Active offer windows",
  local:      "Community touchpoints",
  all:        null,
};

function KpiBar({ items, activeTab }: { items: ActivityItem[]; activeTab: ActivityTab }) {
  const activeCount    = items.filter(i => i.status === "active").length;
  const upcomingCount  = items.filter(i => i.status === "upcoming").length;
  const completedCount = items.filter(i => i.status === "completed").length;
  const hint = TAB_KPI_HINT[activeTab];

  return (
    <div style={{
      background: "#F1F1EF",
      borderRadius: "10px",
      padding: "14px 24px",
      display: "flex",
      alignItems: "center",
      gap: "32px",
      marginBottom: "20px",
    }}>
      {[
        { label: "Active",    value: String(activeCount) },
        { label: "Upcoming",  value: String(upcomingCount) },
        { label: "Completed", value: String(completedCount) },
      ].map(({ label, value }) => (
        <div key={label}>
          <div style={{ fontSize: "11px", textTransform: "uppercase" as const, color: "#A8A8A3", letterSpacing: "0.05em", marginBottom: "2px" }}>
            {label}
          </div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#222222", lineHeight: 1 }}>
            {value}
          </div>
        </div>
      ))}
      {hint && (
        <div style={{ marginLeft: "auto", fontSize: "11px", color: "#A8A8A3", fontStyle: "italic" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ─── Type Badge (for "All" tab) ───────────────────────────────

const TAB_LABEL: Record<ActivityTab, string> = {
  programs:   "Program",
  promotions: "Promo",
  local:      "Local",
  all:        "All",
};

const TAB_COLOR: Record<ActivityTab, string> = {
  programs:   "#72B84A",
  promotions: "#4E8DF4",
  local:      "#D89A3C",
  all:        "#A8A8A3",
};

// ─── Activity Card ────────────────────────────────────────────

function ActivityCard({ item, onClick, showType }: { item: ActivityItem; onClick: () => void; showType?: boolean }) {
  const dateRange = fmtDateRange(item.startDate, item.endDate);
  const hasMeta = dateRange || item.note;
  return (
    <div
      onClick={onClick}
      style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", padding: "16px 20px", cursor: "pointer" }}
      className="hover:shadow-sm transition-shadow duration-150"
    >
      {/* Row 1: color dot + name + [type badge] + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0, display: "inline-block" }} />
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#222222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {item.name}
          </span>
          {showType && item.tab !== "all" && (
            <span style={{ fontSize: "10px", fontWeight: 500, color: TAB_COLOR[item.tab], background: `${TAB_COLOR[item.tab]}18`, padding: "1px 6px", borderRadius: "4px", flexShrink: 0 }}>
              {TAB_LABEL[item.tab]}
            </span>
          )}
        </div>
        <StatusBadge status={item.status} />
      </div>
      {/* Row 2: description */}
      {item.description && (
        <div style={{ fontSize: "13px", color: "#6F6F6B", marginTop: "4px", marginLeft: "16px" }}>
          {item.description}
        </div>
      )}
      {/* Row 3: dates AND note (both shown when available) */}
      {hasMeta && (
        <div style={{ fontSize: "12px", color: "#A8A8A3", marginTop: "4px", marginLeft: "16px", display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
          {dateRange && <span>{dateRange}</span>}
          {dateRange && item.note && <span style={{ color: "#DEDEDA" }}>·</span>}
          {item.note && <span>{item.note}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Past Program Card (read-only, no navigation) ─────────────

function PastProgramCard({ prog }: { prog: PastProgramItem }) {
  return (
    <div style={{ background: "#FAFAF9", border: "1px solid #DEDEDA", borderRadius: "10px", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 500, color: "#6F6F6B" }}>{prog.name}</div>
        <div style={{ fontSize: "12px", color: "#A8A8A3", marginTop: "2px" }}>{prog.note}</div>
      </div>
      <span style={{ fontSize: "11px", color: "#A8A8A3", background: "#F1F1EF", padding: "2px 8px", borderRadius: "4px" }}>Past</span>
    </div>
  );
}

// ─── Group Header ─────────────────────────────────────────────

function GroupHeader({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
      <span style={{ fontSize: "11px", fontWeight: 600, color: "#6F6F6B", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
        {label}
      </span>
      <hr style={{ flex: 1, border: "none", borderTop: "1px solid #DEDEDA" }} />
    </div>
  );
}

// ─── Status Sub-filter bar ────────────────────────────────────

type StatusFilter = ActivityStatus | "all";

function SubFilterBar({
  items,
  value,
  onChange,
}: {
  items: ActivityItem[];
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  const statuses: StatusFilter[] = ["all", "active", "upcoming", "planned", "completed"];
  const counts: Record<StatusFilter, number> = {
    all:       items.length,
    active:    items.filter(i => i.status === "active").length,
    upcoming:  items.filter(i => i.status === "upcoming").length,
    planned:   items.filter(i => i.status === "planned").length,
    completed: items.filter(i => i.status === "completed").length,
  };

  const labels: Record<StatusFilter, string> = {
    all: "All", active: "Active", upcoming: "Upcoming", planned: "Planned", completed: "Completed",
  };

  const visible = statuses.filter(s => s === "all" || counts[s] > 0);
  if (visible.length <= 2) return null;

  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, marginBottom: "16px" }}>
      {visible.map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          style={{
            fontSize: "12px",
            fontWeight: value === s ? 600 : 400,
            color: value === s ? "#222222" : "#6F6F6B",
            background: value === s ? "#FFFFFF" : "transparent",
            border: `1px solid ${value === s ? "#DEDEDA" : "transparent"}`,
            borderRadius: "20px",
            padding: "3px 10px",
            cursor: "pointer",
            transition: "all 0.1s",
          }}
        >
          {labels[s]}
          {s !== "all" && counts[s] > 0 && (
            <span style={{ marginLeft: "4px", fontSize: "10px", color: "#A8A8A3" }}>{counts[s]}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function Activities() {
  const [location, navigate] = useLocation();
  const params = useParams<{ venueSlug?: string; tab?: string }>();
  const venueSlug = params.venueSlug ?? getVenueSlugFromPath(location) ?? "arlington-heights";
  const routes = appRoutes.venue(venueSlug);
  const tab = params.tab;

  const activeTab: ActivityTab =
    tab === "all"        ? "all"        :
    tab === "promotions" ? "promotions" :
    tab === "local"      ? "local"      :
    "programs";

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const handlePrimaryTabChange = (path: string, newTab: ActivityTab) => {
    if (newTab !== activeTab) setStatusFilter("all");
    navigate(path);
  };

  const PRIMARY_TABS: { id: ActivityTab; label: string; path: string }[] = [
    { id: "all",        label: "All",            path: routes.studioSoo.activityPrograms.replace(/\/programs$/, "/all") },
    { id: "programs",   label: "Programs",       path: routes.studioSoo.activityPrograms },
    { id: "promotions", label: "Promotions",     path: routes.studioSoo.activityPromotions },
    { id: "local",      label: "Local & Events", path: routes.studioSoo.activityLocal },
  ];

  const primaryItems = activeTab === "all"
    ? ACTIVITY_ITEMS
    : ACTIVITY_ITEMS.filter(i => i.tab === activeTab);

  const tabItems = statusFilter === "all"
    ? primaryItems
    : primaryItems.filter(i => i.status === statusFilter);

  function getDetailPath(item: ActivityItem): string {
    if (item.tab === "programs")   return routes.studioSoo.activityProgramDetail(item.id);
    if (item.tab === "promotions") return routes.studioSoo.activityPromotionDetail(item.id);
    return routes.studioSoo.activityLocalDetail(item.id);
  }

  // Group programs by their group field (programs tab)
  const programGroups = activeTab === "programs"
    ? tabItems.reduce<Record<string, ActivityItem[]>>((acc, item) => {
        const g = item.group ?? "Other";
        return { ...acc, [g]: [...(acc[g] ?? []), item] };
      }, {})
    : {};

  // Group local items by their group field (local tab)
  const LOCAL_GROUP_ORDER = ["In-Venue", "Community & Outreach", "Member Events", "Social Media"];
  const localGroups = activeTab === "local"
    ? tabItems.reduce<Record<string, ActivityItem[]>>((acc, item) => {
        const g = item.group ?? "Other";
        return { ...acc, [g]: [...(acc[g] ?? []), item] };
      }, {})
    : {};

  // Subtitle: contextual per tab
  const SUBTITLE: Record<ActivityTab, string> = {
    all:        "All programs, promotions, and local events — linked to campaigns and Asana",
    programs:   "PBGA-led clinics and programs tracked via Acuity",
    promotions: "Active and upcoming promotional offers tied to membership campaigns",
    local:      "In-venue displays, community outreach, member events, and social content",
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#222222" }}>Activities</h1>
        <p style={{ fontSize: "13px", color: "#6F6F6B", marginTop: "4px" }}>
          {SUBTITLE[activeTab]}
        </p>
      </div>

      {/* Primary tab bar */}
      <div style={{ borderBottom: "1px solid #DEDEDA", display: "flex" }}>
        {PRIMARY_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => handlePrimaryTabChange(t.path, t.id)}
            style={{
              padding: "8px 16px",
              paddingBottom: "9px",
              fontSize: "14px",
              fontWeight: activeTab === t.id ? 600 : 400,
              color: activeTab === t.id ? "#222222" : "#A8A8A3",
              borderTop: "none", borderLeft: "none", borderRight: "none",
              borderBottom: `2px solid ${activeTab === t.id ? "#F2DD48" : "transparent"}`,
              background: "none",
              cursor: "pointer",
              marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI bar (shown for all tabs except "all") */}
      {activeTab !== "all" && <KpiBar items={primaryItems} activeTab={activeTab} />}

      {/* Status sub-filter */}
      {activeTab !== "all" && (
        <SubFilterBar items={primaryItems} value={statusFilter} onChange={setStatusFilter} />
      )}

      {/* Card list */}
      <div className="space-y-3">

        {/* "All" tab: type summary chips + flat list */}
        {activeTab === "all" && (
          <>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" as const }}>
              {(["programs", "promotions", "local"] as const).map(t => {
                const count = ACTIVITY_ITEMS.filter(i => i.tab === t).length;
                return (
                  <span
                    key={t}
                    style={{ fontSize: "12px", color: TAB_COLOR[t], background: `${TAB_COLOR[t]}15`, padding: "3px 10px", borderRadius: "20px" }}
                  >
                    {TAB_LABEL[t]} · {count}
                  </span>
                );
              })}
            </div>
            {tabItems.map(item => (
              <ActivityCard key={item.id} item={item} onClick={() => navigate(getDetailPath(item))} showType />
            ))}
          </>
        )}

        {/* Programs tab: group header + cards */}
        {activeTab === "programs" && (
          <>
            {Object.entries(programGroups).map(([group, items]) => (
              <div key={group}>
                <GroupHeader label={group} />
                <div className="space-y-3">
                  {items.map(item => (
                    <ActivityCard key={item.id} item={item} onClick={() => navigate(getDetailPath(item))} />
                  ))}
                </div>
              </div>
            ))}
            {statusFilter === "all" && PAST_PROGRAMS.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <GroupHeader label="Past Programs" />
                <div className="space-y-2">
                  {PAST_PROGRAMS.map(p => <PastProgramCard key={p.id} prog={p} />)}
                </div>
              </div>
            )}
          </>
        )}

        {/* Promotions tab: flat list */}
        {activeTab === "promotions" && (
          tabItems.map(item => (
            <ActivityCard key={item.id} item={item} onClick={() => navigate(getDetailPath(item))} />
          ))
        )}

        {/* Local & Events tab: grouped by category */}
        {activeTab === "local" && (
          <>
            {LOCAL_GROUP_ORDER
              .filter(g => localGroups[g]?.length > 0)
              .map(group => (
                <div key={group}>
                  <GroupHeader label={group} />
                  <div className="space-y-3">
                    {localGroups[group].map(item => (
                      <ActivityCard key={item.id} item={item} onClick={() => navigate(getDetailPath(item))} />
                    ))}
                  </div>
                </div>
              ))
            }
            {/* Ungrouped items */}
            {Object.keys(localGroups)
              .filter(g => !LOCAL_GROUP_ORDER.includes(g))
              .map(group => (
                <div key={group}>
                  <GroupHeader label={group} />
                  <div className="space-y-3">
                    {localGroups[group].map(item => (
                      <ActivityCard key={item.id} item={item} onClick={() => navigate(getDetailPath(item))} />
                    ))}
                  </div>
                </div>
              ))
            }
          </>
        )}

        {/* Empty state */}
        {activeTab !== "all" && tabItems.length === 0 && (
          <div style={{ textAlign: "center" as const, padding: "32px 16px", color: "#A8A8A3", fontSize: "14px" }}>
            No items match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
