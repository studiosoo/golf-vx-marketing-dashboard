import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BRAND_ASSETS } from "@/lib/brandAssets";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Target,
  ArrowRight,
  RefreshCw,
  BarChart3,
  Flag,
  UserCheck,
  Users,
  Crosshair,
  X,
  Instagram,
  Mail,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Megaphone,
  MapPin,
  ImageIcon,
} from "lucide-react";
// Navigation model:
// Overview    → High-level status for Golf VX + Studio Soo. Shows Key Goals + active Campaigns.
//               Clicking a Key Goal card expands detail inline.
// Reports     → Detailed analysis, BI summaries, action plans. Studio Soo reports progress here.
//               Campaigns shown in expandable rows with Asana integration.
// Campaigns   → Operational execution (Studio Soo only). Asana tasks, project management, content.
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return n.toLocaleString("en-US", opts);
}
function fmtCurrency(n: number) {
  return "$" + fmt(n, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtPct(n: number) {
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}

// ── Verified data constants ──────────────────────────────────────────────────
const MONTHLY_REVENUE = [
  { month: "Nov", value: 56257.90,  partial: false },
  { month: "Dec", value: 103811.32, partial: false },
  { month: "Jan", value: 129637.97, partial: false },
  { month: "Feb", value: 116401.75, partial: false },
  { month: "Mar", value: 29983.27,  partial: true  },
];

const REVENUE_MIX = [
  { category: "Bay Usage", value: 193608.98, pct: 70.1, color: "#F5C72C" },
  { category: "F&B",       value: 80444.43,  pct: 29.2, color: "#72B84A" },
  { category: "Other",     value: 1922.58,   pct: 0.7,  color: "#E0E0E0" },
];

const MRR_TIERS = [
  { label: "All-Access Aces", members: 54, rate: 325, monthly: 17550, highlight: true },
  { label: "Swing Savers",    members: 33, rate: 225, monthly: 7425,  highlight: false },
];
const MRR_FLOOR = 24975;

// Health score dots (1–5)
function HealthDots({ score, compact = false }: { score: number; compact?: boolean }) {
  if (compact) {
    const filled = Math.ceil(score * 3 / 5);
    return (
      <div className="flex gap-0.5 items-center shrink-0">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i <= filled ? "#F2DD48" : "#DEDEDA" }} />
        ))}
      </div>
    );
  }
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="w-2 h-2 rounded-full" style={{ background: i <= score ? "#F2DD48" : "#DEDEDA" }} />
      ))}
      <span className="text-[10px] text-[#6F6F6B] ml-1">{score}/5</span>
    </div>
  );
}

// Compute a simple health score from program KPI progress
function calcHealth(progress: number): number {
  if (progress >= 90) return 5;
  if (progress >= 70) return 4;
  if (progress >= 50) return 3;
  if (progress >= 25) return 2;
  return 1;
}

// Health score using goal progress + budget health
function calcProgramHealth(p: any): number {
  const goalActual = parseFloat(String(p.kpiActual ?? p.goalActual ?? 0));
  const goalTarget = parseFloat(String(p.goalTarget ?? 0));
  const goalPct = goalTarget > 0 ? (goalActual / goalTarget) * 100 : 50;
  const budgetUsed = parseFloat(String(p.actualSpend ?? 0));
  const budget = parseFloat(String(p.budget ?? 0));
  const score = calcHealth(goalPct);
  if (budget > 0 && budgetUsed / budget > 1.05) return Math.max(1, score - 1);
  return score;
}

// Programs that span multiple strategic campaigns
// Single-campaign programs use their strategicCampaign field directly
const CROSS_CAMPAIGN: Record<string, string[]> = {
  giveaway:       ["membership_acquisition", "trial_conversion"],
  "sunday clinic": ["trial_conversion", "member_retention"],
  "drive day":    ["trial_conversion"],
  "$9":           ["trial_conversion"],
  "super bowl":   ["corporate_events"],
  "watch party":  ["corporate_events"],
};

function getCampaignPrograms(campaignId: string, progs: any[]): any[] {
  return progs.filter((p: any) => {
    const name = (p.name ?? "").toLowerCase();
    for (const [kw, campaigns] of Object.entries(CROSS_CAMPAIGN)) {
      if (name.includes(kw)) return campaigns.includes(campaignId);
    }
    return p.strategicCampaign === campaignId;
  });
}

const ALL_CAMPAIGN_IDS = ["trial_conversion", "membership_acquisition", "member_retention", "corporate_events"] as const;

const PLAN_LABEL: Record<string, string> = {
  all_access_aces: "All Access Ace",
  swing_savers: "Swing Saver",
  golf_vx_pro: "Golf VX Pro",
  monthly: "Monthly",
  annual: "Annual",
  trial: "Trial",
  corporate: "Corporate",
};

// ── Member List Modal ─────────────────────────────────────────────────────────
function MemberListModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: memberList, isLoading } = trpc.members.list.useQuery(
    { status: "active" },
    { enabled: open, staleTime: 2 * 60 * 1000 }
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg sm:mx-4 max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DEDEDA]">
          <div>
            <h2 className="text-[15px] font-bold text-[#222222]">Active Members</h2>
            {memberList && <p className="text-[12px] text-[#6F6F6B]">{memberList.length} members</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F1F1EF] transition-colors">
            <X className="h-4 w-4 text-[#6F6F6B]" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#F2DD48] border-t-transparent" />
            </div>
          ) : (
            <div className="divide-y divide-[#DEDEDA]">
              {(memberList ?? []).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#F6F6F4] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#F2DD48]/20 flex items-center justify-center shrink-0">
                      <span className="text-[12px] font-bold text-[#222222]">
                        {m.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#222222]">{m.name}</p>
                      <p className="text-[11px] text-[#6F6F6B]">{m.email}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-medium text-[#222222]">
                      {PLAN_LABEL[m.membershipTier] ?? m.membershipTier ?? "—"}
                    </p>
                    {m.monthlyAmount && parseFloat(String(m.monthlyAmount)) > 0 && (
                      <p className="text-[11px] text-[#6F6F6B]">${parseFloat(String(m.monthlyAmount)).toFixed(0)}/mo</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CAMPAIGN_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  trial_conversion: { label: "Trial Conversion", color: "#72B84A", bg: "#E6F0DC", icon: Target },
  membership_acquisition: { label: "Membership Acquisition", color: "#4E8DF4", bg: "#EAF2FF", icon: UserCheck },
  member_retention: { label: "Member Retention", color: "#222222", bg: "#F1F1EF", icon: Users },
  corporate_events: { label: "B2B & Events", color: "#6F6F6B", bg: "#F1F1EF", icon: Flag },
};

export default function Home() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: snapshot, isLoading: snapLoading, refetch } = trpc.preview.getSnapshot.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
  });
  const { data: strategicOverview, isLoading: stratLoading } =
    trpc.strategicCampaigns.getOverview.useQuery(undefined, {
      enabled: isAuthenticated,
      staleTime: 5 * 60 * 1000,
    });
  const { data: toastSummary } = trpc.revenue.getToastSummary.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  const { data: programs } = trpc.campaigns.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  const { data: acuityRevenue } = trpc.revenue.getAcuityRevenue.useQuery(
    { minDate: monthStart, maxDate: undefined },
    { enabled: isAuthenticated, staleTime: 5 * 60 * 1000 }
  );

  const { data: memberStats } = trpc.members.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  const { data: ahtilData } = trpc.encharge.getAHTILCount.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
  });
  const { data: tokenStatus } = trpc.instagram.checkTokenExpiry.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60 * 60 * 1000,
  });
  const tokenValid = tokenStatus?.valid === true;
  const { data: igStats } = trpc.instagram.getAccountStats.useQuery(undefined, {
    enabled: isAuthenticated && tokenValid,
    staleTime: 30 * 60 * 1000,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [memberListOpen, setMemberListOpen] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F2DD48] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-5 max-w-sm px-6">
          <div className="h-14 w-14 bg-[#F2DD48]/20 rounded-2xl flex items-center justify-center mx-auto">
            <BarChart3 className="h-7 w-7 text-[#222222]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#222222]">Golf VX Overview</h1>
            <p className="text-sm text-[#6F6F6B] mt-1">Arlington Heights — Marketing Overview</p>
          </div>
          <Button
            className="bg-[#F2DD48] text-[#222222] font-semibold hover:brightness-95 active:scale-95 transition-all w-full"
            onClick={() => { window.location.href = getLoginUrl(); }}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const members = snapshot?.members;
  const revenue = snapshot?.revenue;

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "there";

  // Revenue values
  const mrr = members?.mrr ?? 0;
  const toastMTD = (toastSummary as any)?.thisMonthRevenue ?? 0;
  const toastOrders = (toastSummary as any)?.thisMonthOrders ?? 0;
  const toastLastMonth = (toastSummary as any)?.lastMonthRevenue ?? 0;
  const fbMTD = (toastSummary as any)?.fbMTD ?? 0;
  const bayMTD = toastMTD > 0 ? Math.max(0, toastMTD - fbMTD) : 0;
  const acuityTotal = (acuityRevenue as any)?.total ?? 0;
  const acuityBookings = (acuityRevenue as any)?.totalBookings ?? 0;

  // Member breakdown by plan (from getStats)
  const memberBreakdown = [
    { label: "All Access Ace", count: memberStats?.allAccessCount ?? 0 },
    { label: "Swing Saver", count: memberStats?.swingSaversCount ?? 0 },
    { label: "Golf VX Pro", count: memberStats?.golfVxProCount ?? 0 },
  ].filter(t => t.count > 0);

  const memberTotal = members?.total ?? 0;
  const memberGoal = 300;
  const memberGoalPct = memberGoal > 0 ? Math.min((memberTotal / memberGoal) * 100, 100) : 0;

  // All programs — active ones for the programs section
  // Use date-based check so "ad ended" doesn't incorrectly hide running programs
  const allPrograms = (programs ?? []) as any[];
  const today = new Date();
  const activePrograms = allPrograms.filter((p: any) => {
    if (p.status === "active") return true;
    // Include programs whose end date hasn't passed yet (ad may have ended but program runs on)
    const endDate = p.endDate ? new Date(p.endDate) : null;
    return endDate && endDate >= today && p.status !== "completed" && p.status !== "paused";
  });

  // Annual revenue goal tracking
  const ANNUAL_REVENUE_GOAL = 2_000_000;
  // Run rate = (MRR + Toast MTD + Acuity MTD) × 12
  const annualRunRate = (mrr + toastMTD + acuityTotal) * 12;
  const annualGoalPct = Math.min((annualRunRate / ANNUAL_REVENUE_GOAL) * 100, 100);
  const hasAnyRevenue = mrr > 0 || toastMTD > 0 || acuityTotal > 0;

  // Strategic campaigns
  const rawCampaigns = (strategicOverview ?? []) as any[];

  const revenueMTD = toastMTD + acuityTotal;

  // 2026 Key Goals data
  const igFollowers = (igStats as any)?.followers ?? (igStats as any)?.followers_count
    ?? (!tokenValid && tokenStatus !== undefined ? 202 : null);
  const emailSubscribers = ahtilData?.count ?? null;

  const igTokenNote = !tokenValid && tokenStatus !== undefined
    ? "Token refresh needed"
    : tokenStatus?.warning
    ? `Token expires in ${tokenStatus.daysRemaining}d`
    : null;

  // Annualized breakdown — each component × 12 sums to annualRunRate
  const annualBreakdown = hasAnyRevenue ? [
    ...(fbMTD > 0    ? [{ label: "F&B",      value: fmtCurrency(fbMTD    * 12) }] : []),
    ...(bayMTD > 0   ? [{ label: "Bay Time", value: fmtCurrency(bayMTD   * 12) }] : []),
    ...(mrr > 0      ? [{ label: "MRR",      value: fmtCurrency(mrr      * 12) }] : []),
    ...(acuityTotal > 0 ? [{ label: "Programs", value: fmtCurrency(acuityTotal * 12) }] : []),
  ] : undefined;

  const KEY_GOALS: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    current: number | null;
    goal: number;
    display: string;
    goalDisplay: string;
    color: string;
    gradient?: string;
    statusNote?: string | null;
    statusColor?: string;
    subStats?: Array<{ label: string; value: string }>;
  }> = [
    {
      id: "revenue",
      label: "Annual Revenue (Est.)",
      icon: DollarSign,
      current: hasAnyRevenue ? annualRunRate : null,
      goal: ANNUAL_REVENUE_GOAL,
      display: hasAnyRevenue ? fmtCurrency(annualRunRate) : "—",
      goalDisplay: "$2M",
      color: "#F2DD48",
      statusNote: hasAnyRevenue ? null : "Revenue APIs connecting…",
      statusColor: "#6F6F6B",
      subStats: annualBreakdown,
    },
    {
      id: "members",
      label: "Members",
      icon: UserCheck,
      current: memberTotal,
      goal: memberGoal,
      display: fmt(memberTotal),
      goalDisplay: "300",
      color: "#72B84A",
      subStats: memberBreakdown.length > 0
        ? memberBreakdown.map(t => ({ label: t.label.replace("All Access Ace", "Ace").replace("Swing Saver", "Saver").replace("Golf VX Pro", "Pro"), value: String(t.count) }))
        : undefined,
    },
    {
      id: "instagram",
      label: "Instagram Followers",
      icon: Instagram,
      current: igFollowers,
      goal: 2000,
      display: igFollowers != null ? fmt(igFollowers) : "—",
      goalDisplay: "2,000",
      color: BRAND_ASSETS.instagram.solidColor,
      gradient: BRAND_ASSETS.instagram.gradient,
      statusNote: igTokenNote,
      statusColor: igTokenNote && !tokenStatus?.warning ? "#FF3B30" : "#F2DD48",
    },
    {
      id: "email",
      label: "Email Subscribers",
      icon: Mail,
      current: emailSubscribers,
      goal: 5000,
      display: emailSubscribers != null ? fmt(emailSubscribers) : "—",
      goalDisplay: "5,000",
      color: "#222222",
    },
  ];

  // ── Sparkline max value for Branch Snapshot card ──────────────────────────
  const sparkMax = Math.max(...MONTHLY_REVENUE.map(r => r.value));

  return (
    <div className="p-8 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#222222] leading-tight mb-1">{greeting}, {firstName}</h1>
          <p className="text-[13px] text-[#6F6F6B] mb-8">
            Golf VX Arlington Heights · {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-[12px] text-[#6F6F6B] hover:text-[#222222] border border-[#DEDEDA] rounded-lg px-3 py-1.5 hover:bg-[#F1F1EF] transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* ── Branch Snapshot ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[#A8A8A3] uppercase tracking-widest">Branch Snapshot · Arlington Heights</h2>
          <span className="text-[11px] text-[#A8A8A3]">Nov 2025 – Mar 2026</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">

          {/* Card 1 — Revenue Trend */}
          <div className="bg-white rounded-xl border border-[#DEDEDA] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A8A8A3] mb-1.5">Revenue Trend</p>
            <div className="relative w-full">
              <svg viewBox="0 0 200 54" className="w-full" preserveAspectRatio="none">
                {MONTHLY_REVENUE.map((r, i) => {
                  const barW = 28;
                  const gap = 12;
                  const totalW = MONTHLY_REVENUE.length * barW + (MONTHLY_REVENUE.length - 1) * gap;
                  const offsetX = (200 - totalW) / 2;
                  const x = offsetX + i * (barW + gap);
                  const barH = Math.max(4, (r.value / sparkMax) * 36);
                  const y = 36 - barH;
                  const isJan = r.month === "Jan";
                  return (
                    <g key={r.month}>
                      {r.partial ? (
                        <>
                          <defs>
                            <pattern id={`stripe-${i}`} patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                              <line x1="0" y1="0" x2="0" y2="4" stroke="#A8A8A3" strokeWidth="2" />
                            </pattern>
                          </defs>
                          <rect x={x} y={y} width={barW} height={barH} fill={`url(#stripe-${i})`} rx="2" />
                        </>
                      ) : (
                        <rect x={x} y={y} width={barW} height={barH} fill="#F2DD48" rx="2" />
                      )}
                      {isJan && (
                        <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="7" fill="#A8A8A3" fontFamily="Inter, sans-serif">Peak</text>
                      )}
                      <text x={x + barW / 2} y={50} textAnchor="middle" fontSize="7" fill="#A8A8A3" fontFamily="Inter, sans-serif">{r.month}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <p className="text-[10px] text-[#A8A8A3] mt-1">Nov 2025 – Mar 2026</p>
          </div>

          {/* Card 2 — Revenue MTD */}
          <div className="bg-white rounded-xl border border-[#DEDEDA] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A8A8A3] mb-1.5">Revenue MTD</p>
            <p className="text-[24px] font-bold text-[#222222] leading-none tracking-tight mb-1">$29,983</p>
            <p className="text-[11px] text-[#6F6F6B] mb-1.5">Mar 1–9 only</p>
            <span className="text-[12px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">PARTIAL</span>
          </div>

          {/* Card 3 — Known MRR Floor */}
          <div className="bg-white rounded-xl border border-[#DEDEDA] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A8A8A3] mb-1.5">Known MRR Floor</p>
            <p className="text-[24px] font-bold text-[#222222] leading-none tracking-tight mb-1">$24,975/mo</p>
            <p className="text-[11px] text-[#6F6F6B] mb-1.5">87 named-tier members · Stripe pending</p>
            <span className="text-[12px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">ESTIMATED</span>
          </div>

          {/* Card 4 — Membership Visibility */}
          <div className="bg-white rounded-xl border border-[#DEDEDA] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A8A8A3] mb-1.5">Membership Visibility</p>
            <div className="space-y-0.5 mb-2">
              <p className="text-[13px] text-[#222222]">54 Aces</p>
              <p className="text-[13px] text-[#222222]">33 Savers</p>
              <p className="text-[13px] text-[#A8A8A3]">4 Pro</p>
              <p className="text-[13px] text-[#A8A8A3]">188 untiered</p>
            </div>
            <p className="text-[11px] text-amber-600">Untiered billing source not mapped</p>
          </div>

          {/* Card 5 — Active Marketing Scope */}
          <div className="bg-white rounded-xl border border-[#DEDEDA] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A8A8A3] mb-1.5">Active Marketing Scope</p>
            <div className="space-y-0.5 mb-2">
              <p className="text-[13px] font-semibold text-[#222222]">4 Campaigns</p>
              <p className="text-[13px] font-semibold text-[#222222]">3 Programs</p>
              <p className="text-[13px] font-semibold text-[#222222]">5 Promotions</p>
            </div>
            <p className="text-[11px] text-[#6F6F6B]">Managed by Studio Soo</p>
          </div>

          {/* Card 6 — Data Confidence */}
          <div className="bg-white rounded-xl border border-[#DEDEDA] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A8A8A3] mb-1.5">Data Confidence</p>
            <p className="text-[22px] font-bold leading-none tracking-tight mb-1" style={{ color: "#D89A3C" }}>◑ Partial</p>
            <p className="text-[11px] text-[#6F6F6B]">Toast POS verified · Stripe pending</p>
          </div>

        </div>
      </div>

      {/* ── 2026 Key Goals ── */}
      <div className="bg-white rounded-xl border border-[#DEDEDA] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#F2DD48]" />
            <h2 className="text-[14px] font-semibold text-[#222222]">2026 Key Goals</h2>
          </div>
          <span className="text-[11px] text-[#A8A8A3]">Year-end targets · click to expand</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {KEY_GOALS.map((g) => {
            const pct = g.current != null && g.goal > 0 ? Math.min((g.current / g.goal) * 100, 100) : null;
            const Icon = g.icon;
            const isExpanded = expandedGoal === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setExpandedGoal(isExpanded ? null : g.id)}
                className={cn(
                  "rounded-xl border border-[#DEDEDA] bg-[#F6F6F4] p-3 text-left cursor-pointer transition-all hover:shadow-md",
                  isExpanded && "ring-1 ring-[#F2DD48]/50 bg-white"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: g.gradient ?? `${g.color}18` }}>
                      <Icon className="h-3 w-3" style={{ color: g.gradient ? "#FFFFFF" : g.color }} />
                    </div>
                    <span className="text-[11px] text-[#6F6F6B] font-medium truncate">{g.label}</span>
                  </div>
                  {isExpanded
                    ? <ChevronDown className="h-3 w-3 text-[#A8A8A3] shrink-0" />
                    : <ChevronRight className="h-3 w-3 text-[#A8A8A3] shrink-0" />}
                </div>
                <div className="flex items-end gap-1 mb-1.5">
                  <span className="text-[22px] font-bold text-[#222222] leading-none tracking-tight">{g.display}</span>
                  <span className="text-[11px] text-[#A8A8A3] mb-0.5">/ {g.goalDisplay}</span>
                </div>
                {/* Revenue MTD inline — Annual Revenue card only */}
                {g.id === "revenue" && revenueMTD > 0 && (
                  <p className="text-[11px] text-[#6F6F6B] mb-1">Revenue MTD: <span className="font-semibold text-[#222222]">{fmtCurrency(revenueMTD)}</span></p>
                )}
                {pct != null ? (
                  <>
                    <div className="h-1.5 bg-[#E9E9E6] rounded-full overflow-hidden mb-1">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: g.gradient ?? g.color }} />
                    </div>
                    <span className="text-[13px] font-semibold text-[#222222]">{pct.toFixed(1)}%</span>
                    {g.statusNote && (
                      <p className="text-[10px] mt-0.5" style={{ color: g.statusColor ?? "#6F6F6B" }}>{g.statusNote}</p>
                    )}
                  </>
                ) : (
                  <span className="text-[10px]" style={{ color: g.statusNote ? (g.statusColor ?? "#6F6F6B") : "#A8A8A3" }}>
                    {g.statusNote ?? "Connecting…"}
                  </span>
                )}
                {g.subStats && g.subStats.length > 0 && (
                  <div className="flex gap-3 mt-2 pt-2 border-t border-[#E9E9E6]">
                    {g.subStats.map(s => (
                      <div key={s.label}>
                        <p className="text-[11px] font-semibold text-[#222222]">{s.value}</p>
                        <p className="text-[10px] text-[#A8A8A3]">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Expanded detail panel ── */}
        {expandedGoal === "revenue" && hasAnyRevenue && (
          <div className="mt-3 pt-4 border-t border-[#E9E9E6]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#A8A8A3] mb-3">Annual breakdown (MTD × 12 run rate)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {annualBreakdown?.map(s => (
                <div key={s.label} className="rounded-lg bg-[#F6F6F4] px-3 py-2.5 border border-[#DEDEDA]">
                  <p className="text-[10px] text-[#A8A8A3] uppercase tracking-wide mb-0.5">{s.label}</p>
                  <p className="text-[15px] font-bold text-[#222222]">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-[#F6F6F4] px-4 py-3 border border-[#DEDEDA]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#6F6F6B]">Revenue MTD (Toast + Programs)</span>
                <span className="text-[13px] font-bold text-[#222222]">{fmtCurrency(revenueMTD)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#6F6F6B]">MRR</span>
                <span className="text-[13px] font-bold text-[#222222]">{fmtCurrency(mrr)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#DEDEDA]">
                <span className="text-[11px] font-semibold text-[#222222]">Total MTD</span>
                <span className="text-[13px] font-bold text-[#222222]">{fmtCurrency(revenueMTD + mrr)}</span>
              </div>
            </div>
            <p className="text-[10px] text-[#A8A8A3] mt-2">Annual run rate = MTD × 12 · Historical by-month data coming with full revenue API</p>
            <p className="text-[11px] text-[#6F6F6B] mt-2 italic">
              Annual run rate based on current pacing. Membership recurring revenue is a partial estimate pending Stripe access.
            </p>
          </div>
        )}

        {expandedGoal === "members" && (
          <div className="mt-3 pt-4 border-t border-[#E9E9E6]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#A8A8A3]">Membership breakdown</p>
              <button
                onClick={() => setMemberListOpen(true)}
                className="text-[11px] text-[#4E8DF4] hover:underline"
              >
                View all members →
              </button>
            </div>
            {memberBreakdown.length > 0 ? (
              <div className="space-y-2">
                {memberBreakdown.map(t => {
                  const tierPct = memberTotal > 0 ? (t.count / memberTotal) * 100 : 0;
                  return (
                    <div key={t.label}>
                      <div className="flex justify-between text-[12px] mb-0.5">
                        <span style={{ color: "#222222" }}>{t.label}</span>
                        <span className="font-semibold text-[#222222]">{t.count}</span>
                      </div>
                      <div className="h-1.5 bg-[#E9E9E6] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#72B84A]" style={{ width: `${tierPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[12px] text-[#A8A8A3]">Member tier data loading…</p>
            )}
            <p className="text-[11px] text-[#6F6F6B] mt-3">
              Pacing: {memberTotal} of 300 ({memberGoalPct.toFixed(1)}%) ·
              {memberGoal - memberTotal > 0 ? ` ${memberGoal - memberTotal} needed to reach goal` : " Goal reached!"}
            </p>
          </div>
        )}

        {expandedGoal === "instagram" && (
          <div className="mt-3 pt-4 border-t border-[#E9E9E6]">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-lg bg-[#F6F6F4] px-3 py-2.5 border border-[#DEDEDA]">
                <p className="text-[10px] text-[#A8A8A3] uppercase tracking-wide mb-0.5">Followers</p>
                <p className="text-[15px] font-bold text-[#222222]">{igFollowers != null ? fmt(igFollowers) : "—"}</p>
              </div>
              <div className="rounded-lg bg-[#F6F6F4] px-3 py-2.5 border border-[#DEDEDA]">
                <p className="text-[10px] text-[#A8A8A3] uppercase tracking-wide mb-0.5">Goal</p>
                <p className="text-[15px] font-bold text-[#222222]">2,000</p>
              </div>
            </div>
            {igTokenNote && (
              <div className="rounded-lg px-3 py-2.5 border" style={{ background: "#FFF3E0", borderColor: "#F2DD48" }}>
                <p className="text-[12px] font-medium" style={{ color: "#b08000" }}>{igTokenNote}</p>
                <p className="text-[11px] text-[#6F6F6B] mt-0.5">Renew via Meta Graph API Explorer to restore live data</p>
              </div>
            )}
            {(igStats as any)?.mediaCount != null && (
              <p className="text-[11px] text-[#6F6F6B] mt-2">Posts: {(igStats as any).mediaCount}</p>
            )}
          </div>
        )}

        {expandedGoal === "email" && (
          <div className="mt-3 pt-4 border-t border-[#E9E9E6]">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-lg bg-[#F6F6F4] px-3 py-2.5 border border-[#DEDEDA]">
                <p className="text-[10px] text-[#A8A8A3] uppercase tracking-wide mb-0.5">Subscribers</p>
                <p className="text-[15px] font-bold text-[#222222]">{emailSubscribers != null ? fmt(emailSubscribers) : "—"}</p>
              </div>
              <div className="rounded-lg bg-[#F6F6F4] px-3 py-2.5 border border-[#DEDEDA]">
                <p className="text-[10px] text-[#A8A8A3] uppercase tracking-wide mb-0.5">Goal</p>
                <p className="text-[15px] font-bold text-[#222222]">5,000</p>
              </div>
            </div>
            <p className="text-[11px] text-[#6F6F6B]">
              {emailSubscribers != null
                ? `${emailSubscribers} of 5,000 (${((emailSubscribers / 5000) * 100).toFixed(1)}%) · ${5000 - emailSubscribers} needed`
                : "Subscriber count loading via Encharge…"}
            </p>
          </div>
        )}
      </div>

      {/* ── Revenue Mix ── */}
      <div className="bg-white rounded-xl border border-[#DEDEDA] p-5">
        <h2 className="text-[14px] font-semibold text-[#222222] mb-1">Revenue Mix</h2>
        <p className="text-[12px] text-[#6F6F6B] mb-3">Jan 1 – Mar 9, 2026 · Toast POS net sales</p>
        {/* Stacked horizontal bar */}
        <div className="flex h-5 rounded-full overflow-hidden mb-4">
          {REVENUE_MIX.map(r => (
            <div
              key={r.category}
              style={{ width: `${r.pct}%`, background: r.color }}
              title={`${r.category}: ${r.pct}%`}
            />
          ))}
        </div>
        {/* Legend rows */}
        <div className="space-y-2 mb-3">
          {REVENUE_MIX.map(r => {
            const barWidthPct = r.pct;
            return (
              <div key={r.category} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: r.color }} />
                <span className="text-[13px] text-[#222222] w-24 shrink-0">{r.category}</span>
                <div className="flex-1 h-1.5 bg-[#F1F1EF] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${barWidthPct}%`, background: r.color }} />
                </div>
                <span className="text-[13px] font-semibold text-[#222222] w-24 text-right shrink-0">
                  ${r.value >= 1000 ? (r.value / 1000).toFixed(0) + "K" : r.value.toFixed(0)}
                </span>
                <span className="text-[12px] text-[#6F6F6B] w-10 text-right shrink-0">{r.pct}%</span>
              </div>
            );
          })}
        </div>
        <p className="text-[12px] text-[#6F6F6B] bg-[#F6F6F4] rounded-lg px-4 py-3 mt-3">
          Membership recurring revenue (~$24,975/month estimated) is not included in Toast sales categories. Full recurring revenue visibility requires Stripe integration.
        </p>
      </div>

      {/* ── Known MRR Floor ── */}
      <div className="bg-white rounded-xl border border-[#DEDEDA] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#DEDEDA] flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[#222222]">Known MRR Floor</h2>
          <span className="text-[12px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">ESTIMATED</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-[#F6F6F4]">
              <th className="text-[11px] font-semibold text-[#A8A8A3] uppercase tracking-wide px-5 py-2 text-left">Tier</th>
              <th className="text-[11px] font-semibold text-[#A8A8A3] uppercase tracking-wide px-5 py-2 text-right">Members</th>
              <th className="text-[11px] font-semibold text-[#A8A8A3] uppercase tracking-wide px-5 py-2 text-right">Rate</th>
              <th className="text-[11px] font-semibold text-[#A8A8A3] uppercase tracking-wide px-5 py-2 text-right">Monthly</th>
            </tr>
          </thead>
          <tbody>
            {MRR_TIERS.map(tier => (
              <tr key={tier.label} className="border-t border-[#DEDEDA]">
                <td className="px-5 py-3 text-[13px] font-semibold text-[#222222]">{tier.label}</td>
                <td className="px-5 py-3 text-[13px] text-[#222222] text-right">{tier.members}</td>
                <td className="px-5 py-3 text-[13px] text-[#222222] text-right">${tier.rate}/mo</td>
                <td className="px-5 py-3 text-[13px] font-semibold text-[#222222] text-right">${tier.monthly.toLocaleString()}</td>
              </tr>
            ))}
            {/* MRR Floor total row */}
            <tr className="border-t-2 border-t-[#DEDEDA] border-l-4 border-l-[#F2DD48] bg-[#FFFDE7]">
              <td className="px-5 py-3 text-[13px] font-bold text-[#222222]">MRR Floor (Named Tiers)</td>
              <td className="px-5 py-3 text-[13px] font-bold text-[#222222] text-right">87</td>
              <td className="px-5 py-3 text-[13px] text-[#6F6F6B] text-right">—</td>
              <td className="px-5 py-3 text-[13px] font-bold text-[#222222] text-right">${MRR_FLOOR.toLocaleString()}</td>
            </tr>
            {/* Pro row — de-emphasized */}
            <tr className="border-t border-[#DEDEDA]">
              <td className="px-5 py-3 text-[13px] text-[#A8A8A3]">Golf VX Pro</td>
              <td className="px-5 py-3 text-[13px] text-[#A8A8A3] text-right">4</td>
              <td className="px-5 py-3 text-[13px] text-[#A8A8A3] text-right">varies</td>
              <td className="px-5 py-3 text-[13px] text-[#A8A8A3] text-right">—</td>
            </tr>
            {/* General / No Tier row — de-emphasized */}
            <tr className="border-t border-[#DEDEDA]">
              <td className="px-5 py-3 text-[13px] text-[#A8A8A3]">General / No Tier</td>
              <td className="px-5 py-3 text-[13px] text-[#A8A8A3] text-right">188</td>
              <td className="px-5 py-3 text-[13px] text-[#A8A8A3] text-right">unknown</td>
              <td className="px-5 py-3 text-[13px] text-[#A8A8A3] text-right">Stripe pending</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Studio Soo Execution ── */}
      <div className="bg-white rounded-xl border border-[#DEDEDA] p-5">
        <h2 className="text-[14px] font-semibold text-[#222222] mb-0.5">Studio Soo · Execution Scope</h2>
        <p className="text-[12px] text-[#6F6F6B] mb-4">Oct 2025 – Mar 2026 · What has been managed</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          {/* Tile 1 — Infrastructure & Reporting */}
          <div className="rounded-[10px] border border-[#DEDEDA] py-4 px-5 bg-[#F6F6F4]">
            <div className="flex items-center gap-2 mb-2">
              <LayoutDashboard className="h-4 w-4 text-[#F2DD48]" />
              <span className="text-[13px] font-semibold text-[#222222]">Infrastructure & Reporting</span>
            </div>
            <ul className="space-y-1">
              {[
                "Custom dashboard build + reporting system",
                "Public website (ah.playgolfvx.com)",
                "Landing pages & funnel setup",
              ].map(b => (
                <li key={b} className="text-[12px] text-[#6F6F6B]">· {b}</li>
              ))}
            </ul>
          </div>

          {/* Tile 2 — Campaigns & Promotions */}
          <div className="rounded-[10px] border border-[#DEDEDA] py-4 px-5 bg-[#F6F6F4]">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="h-4 w-4 text-[#F2DD48]" />
              <span className="text-[13px] font-semibold text-[#222222]">Campaigns & Promotions</span>
            </div>
            <ul className="space-y-1">
              {[
                "Annual Membership Giveaway · Gift Card Promo",
                "Trial Session · Drive Day · Junior Summer Camp ads",
                "Black Friday Swing Saver · PBGA Winter Clinic",
              ].map(b => (
                <li key={b} className="text-[12px] text-[#6F6F6B]">· {b}</li>
              ))}
            </ul>
          </div>

          {/* Tile 3 — Venue & In-Store */}
          <div className="rounded-[10px] border border-[#DEDEDA] py-4 px-5 bg-[#F6F6F4]">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-[#F2DD48]" />
              <span className="text-[13px] font-semibold text-[#222222]">Venue & In-Store</span>
            </div>
            <ul className="space-y-1">
              {[
                "Monthly Happenings flyers (11×17, each bay)",
                "OptiSign / in-venue display updates",
                "Tournament & league poster production",
              ].map(b => (
                <li key={b} className="text-[12px] text-[#6F6F6B]">· {b}</li>
              ))}
            </ul>
          </div>

          {/* Tile 4 — Content & Creative */}
          <div className="rounded-[10px] border border-[#DEDEDA] py-4 px-5 bg-[#F6F6F4]">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-4 w-4 text-[#F2DD48]" />
              <span className="text-[13px] font-semibold text-[#222222]">Content & Creative</span>
            </div>
            <ul className="space-y-1">
              {[
                "Member testimonial ads",
                "Social reels & content calendar",
                "Event visuals · seasonal promotions",
              ].map(b => (
                <li key={b} className="text-[12px] text-[#6F6F6B]">· {b}</li>
              ))}
            </ul>
          </div>

          {/* Tile 5 — Programs & Strategic Support */}
          <div className="rounded-[10px] border border-[#DEDEDA] py-4 px-5 bg-[#F6F6F4]">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-[#F2DD48]" />
              <span className="text-[13px] font-semibold text-[#222222]">Programs & Strategic Support</span>
            </div>
            <ul className="space-y-1">
              {[
                "PBGA Winter Clinic · Sunday Clinic · Summer Camp",
                "Coach coordination & copy review",
                "COO / HQ coordination & strategic alignment",
              ].map(b => (
                <li key={b} className="text-[12px] text-[#6F6F6B]">· {b}</li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* ── Section 2: Campaigns ── */}
      <div className="bg-white rounded-xl border border-[#DEDEDA] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-[#222222]" />
            <h2 className="text-[14px] font-semibold text-[#222222]">Campaigns</h2>
          </div>
          <button onClick={() => setLocation("/campaigns/strategic")} className="flex items-center gap-1 text-[12px] text-[#6F6F6B] hover:text-[#222222] transition-colors">
            Details <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <p className="text-[12px] text-[#6F6F6B] mt-1 mb-4">
          Current strategic campaign groups and the main programs, promotions, and paid efforts supporting them.
        </p>
        {stratLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[0,1,2,3].map(i => <div key={i} className="h-36 bg-[#F1F1EF] rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ALL_CAMPAIGN_IDS.map((cId) => {
              const meta = CAMPAIGN_META[cId];
              const Icon = meta.icon;
              const campaignProgs = getCampaignPrograms(cId, activePrograms);
              return (
                <button key={cId} onClick={() => setLocation("/campaigns/strategic")}
                  className="text-left w-full bg-[#F6F6F4] rounded-xl border border-[#DEDEDA] p-4 hover:shadow-sm hover:border-[#CFCFCA] transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                      <Icon className="h-3 w-3" style={{ color: meta.color }} />
                    </div>
                    <span className="text-[12px] font-semibold text-[#222222] leading-tight">{meta.label}</span>
                  </div>
                  {campaignProgs.length > 0 ? (
                    <div className="space-y-2">
                      {campaignProgs.slice(0, 3).map((p: any) => {
                        const goalTarget = parseFloat(String(p.goalTarget ?? 0));
                        const goalActual = parseFloat(String(p.kpiActual ?? p.goalActual ?? 0));
                        const progress = goalTarget > 0 ? Math.min((goalActual / goalTarget) * 100, 100) : 0;
                        const health = calcProgramHealth(p);
                        return (
                          <div key={p.id} className="space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[11px] text-[#222222] font-medium truncate leading-tight">{p.name}</span>
                              <HealthDots score={health} compact />
                            </div>
                            {goalTarget > 0 && (
                              <div className="h-1 bg-[#E9E9E6] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: meta.color }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {campaignProgs.length > 3 && (
                        <p className="text-[10px] text-[#A8A8A3]">+{campaignProgs.length - 3} more</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#A8A8A3]">No active programs</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>


      <MemberListModal open={memberListOpen} onClose={() => setMemberListOpen(false)} />
    </div>
  );
}
