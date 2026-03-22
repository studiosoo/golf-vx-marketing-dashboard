import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  BarChart3,
  Flag,
  UserCheck,
  ShoppingBag,
  CreditCard,
  Award,
  Crosshair,
  X,
  Instagram,
  Mail,
  Activity,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { MetaAdsStatusBadge } from "@/components/MetaAdsStatusBadge";

function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return n.toLocaleString("en-US", opts);
}
function fmtCurrency(n: number) {
  return "$" + fmt(n, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtPct(n: number) {
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}

// Health score dots (1–5)
function HealthDots({ score }: { score: number }) {
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: i <= score ? "#F5C72C" : "#E0E0E0" }}
        />
      ))}
      <span className="text-[10px] text-[#888888] ml-1">{score}/5</span>
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0]">
          <div>
            <h2 className="text-[15px] font-bold text-[#111111]">Active Members</h2>
            {memberList && <p className="text-[12px] text-[#888888]">{memberList.length} members</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors">
            <X className="h-4 w-4 text-[#888888]" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#F5C72C] border-t-transparent" />
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0F0]">
              {(memberList ?? []).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#FAFAFA] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#F5C72C]/20 flex items-center justify-center shrink-0">
                      <span className="text-[12px] font-bold text-[#111111]">
                        {m.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#111111]">{m.name}</p>
                      <p className="text-[11px] text-[#888888]">{m.email}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-medium text-[#111111]">
                      {PLAN_LABEL[m.membershipTier] ?? m.membershipTier ?? "—"}
                    </p>
                    {m.monthlyAmount && parseFloat(String(m.monthlyAmount)) > 0 && (
                      <p className="text-[11px] text-[#888888]">${parseFloat(String(m.monthlyAmount)).toFixed(0)}/mo</p>
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

const CAMPAIGN_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; kpiLabel: string }> = {
  trial_conversion: { label: "Trial Conversion", color: "#3DB855", bg: "#F0FAF3", icon: Target, kpiLabel: "Conversion Rate" },
  membership_acquisition: { label: "Membership Acquisition", color: "#007AFF", bg: "#EBF4FF", icon: UserCheck, kpiLabel: "Members Acquired" },
  member_retention: { label: "Member Retention", color: "#111111", bg: "#F5F5F5", icon: Users, kpiLabel: "Retention Rate" },
  corporate_events: { label: "B2B Sales", color: "#888888", bg: "#F5F5F5", icon: Flag, kpiLabel: "Events Closed" },
};

export default function Home() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: snapshot, isLoading: snapLoading, refetch } = trpc.preview.getSnapshot.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
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
    { minDate: undefined, maxDate: undefined },
    { enabled: isAuthenticated, staleTime: 5 * 60 * 1000 }
  );

  const { data: memberStats } = trpc.members.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  const { data: stripeSnap } = trpc.members.getStripeSnapshot.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60 * 60 * 1000,
  });
  const { data: strategicKPIs } = trpc.intelligence.getStrategicKPIs.useQuery(undefined, {
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
  const { data: metaAdsCampaigns, isLoading: metaAdsLoading, isError: metaAdsError } =
    trpc.metaAds.getAllCampaignsWithInsights.useQuery(
      { datePreset: "last_7d" },
      { enabled: isAuthenticated, staleTime: 5 * 60 * 1000, retry: 1 }
    );

  const [refreshing, setRefreshing] = useState(false);
  const [memberListOpen, setMemberListOpen] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F5C72C] border-t-transparent" />
      </div>
    );
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        setLoginError((data as any).error || "Invalid password");
      }
    } catch {
      setLoginError("Connection error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-5 max-w-sm px-6 w-full">
          <div className="h-14 w-14 bg-[#F5C72C]/20 rounded-2xl flex items-center justify-center mx-auto">
            <BarChart3 className="h-7 w-7 text-[#111111]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111111]">Golf VX Dashboard</h1>
            <p className="text-sm text-[#888888] mt-1">Arlington Heights — Marketing Dashboard</p>
          </div>
          <form onSubmit={handlePasswordLogin} className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
              <Input
                type="password"
                placeholder="Enter dashboard password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="pl-9 border-[#E0E0E0] focus:border-[#F5C72C] focus:ring-[#F5C72C]"
                autoFocus
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-500">{loginError}</p>
            )}
            <Button
              type="submit"
              disabled={loginLoading || !loginPassword}
              className="bg-[#F5C72C] text-[#111111] font-semibold hover:brightness-95 active:scale-95 transition-all w-full"
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="text-xs text-[#BBBBBB]">
            Or{" "}
            <button
              className="underline hover:text-[#888888] transition-colors"
              onClick={() => { window.location.href = getLoginUrl(); }}
            >
              sign in with Manus
            </button>
          </p>
        </div>
      </div>
    );
  }

  const members = snapshot?.members;
  const revenue = snapshot?.revenue;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "there";

  // Revenue values (mrr derived below after Stripe snapshot check)
  const toastMTD = (toastSummary as any)?.thisMonthRevenue ?? 0;
  const toastOrders = (toastSummary as any)?.thisMonthOrders ?? 0;
  const toastLastMonth = (toastSummary as any)?.lastMonthRevenue ?? 0;
  const acuityTotal = (acuityRevenue as any)?.total ?? 0;
  const acuityBookings = (acuityRevenue as any)?.totalBookings ?? 0;

  // Stripe snapshot is authoritative source for member count, MRR, and tier breakdown.
  // Falls back to Boomerang DB snapshot when Stripe snapshot is unavailable.
  const stripeTiers = stripeSnap?.tiers ?? [];
  const stripeMRR = stripeSnap?.totalMRR ?? null;
  const stripeMemberTotal = stripeSnap?.payingMembers ?? null;

  // Tier table for display (Stripe-derived, excludes comped/staff from the main count)
  const memberBreakdown = stripeTiers.length > 0
    ? stripeTiers.filter(t => t.mrr > 0).map(t => ({ label: t.name, count: t.count }))
    : [
        { label: "All Access Ace", count: memberStats?.allAccessCount ?? 0 },
        { label: "Swing Saver", count: memberStats?.swingSaversCount ?? 0 },
        { label: "Golf VX Pro", count: memberStats?.golfVxProCount ?? 0 },
      ].filter(t => t.count > 0);

  // Prefer Stripe snapshot for authoritative member count; fall back to DB snapshot
  const memberTotal = stripeMemberTotal ?? members?.total ?? 0;
  // MRR: prefer Stripe snapshot; fall back to DB-derived MRR
  const mrr = stripeMRR ?? members?.mrr ?? 0;

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
  const annualMrrRunRate = mrr * 12;
  // Run rate = MRR annualized + Toast MTD × 12 (month-over-month proxy)
  // Acuity is all-time cumulative — not projected monthly — so excluded here
  const annualRunRate = annualMrrRunRate + (toastMTD * 12);
  const annualGoalPct = Math.min((annualRunRate / ANNUAL_REVENUE_GOAL) * 100, 100);
  const hasAnyRevenue = mrr > 0 || toastMTD > 0 || acuityTotal > 0;

  // Strategic campaigns — enrich all 4 campaign cards with live KPI data
  const rawCampaigns = (strategicOverview ?? []) as any[];
  const enrichedCampaigns = rawCampaigns.map((c: any) => {
    if (c.id === "membership_acquisition" && memberTotal >= 0) {
      const remaining = Math.max(0, memberGoal - memberTotal);
      return {
        ...c,
        primaryKpi: { current: memberTotal, target: memberGoal, remaining, unit: "" },
      };
    }
    if (c.id === "trial_conversion" && strategicKPIs?.trialConversion != null) {
      const { current, target } = strategicKPIs.trialConversion;
      return {
        ...c,
        primaryKpi: { current: Math.round(current * 10) / 10, target, unit: "%" },
      };
    }
    if (c.id === "member_retention" && strategicKPIs?.memberRetention != null) {
      const { retentionRate, target } = strategicKPIs.memberRetention;
      return {
        ...c,
        primaryKpi: { current: Math.round(retentionRate * 10) / 10, target, unit: "%" },
      };
    }
    if (c.id === "corporate_events" && strategicKPIs?.corporateEvents != null) {
      const { current, target } = strategicKPIs.corporateEvents;
      return {
        ...c,
        primaryKpi: { current, target, unit: "/mo" },
        signal: `${current} events est. · target: ${target}/mo`,
      };
    }
    return c;
  });
  // Show all 4 campaign categories — include even those with no spend (KPI-only cards)
  const activeCampaigns = enrichedCampaigns.filter((c: any) =>
    c.totalSpend > 0 || c.totalRevenue > 0 || (c.primaryKpi?.current ?? 0) > 0 || c.id === "corporate_events"
  );

  // 2026 Key Goals data
  const igFollowers = (igStats as any)?.followers ?? (igStats as any)?.followers_count ?? null;
  // Email Subscribers: live Encharge API (AHTIL tag count); static fallback = 100 (CSV 2026-03-18)
  const AHTIL_FALLBACK = 100;
  const emailSubscribers = ahtilData?.count != null ? ahtilData.count : AHTIL_FALLBACK;
  const emailSubscribersIsLive = ahtilData?.count != null;

  const igTokenNote = !tokenValid && tokenStatus !== undefined
    ? "Token refresh needed"
    : tokenStatus?.warning
    ? `Token expires in ${tokenStatus.daysRemaining}d`
    : null;

  const KEY_GOALS: Array<{
    label: string;
    icon: React.ElementType;
    current: number | null;
    goal: number;
    display: string;
    goalDisplay: string;
    color: string;
    statusNote?: string | null;
    statusColor?: string;
  }> = [
    {
      label: "Annual Revenue (Est.)",
      icon: DollarSign,
      current: hasAnyRevenue ? annualRunRate : null,
      goal: ANNUAL_REVENUE_GOAL,
      display: hasAnyRevenue ? fmtCurrency(annualRunRate) : "—",
      goalDisplay: "$2M",
      color: "#F5C72C",
      statusNote: hasAnyRevenue ? "MRR + Toast run rate · Acuity reported separately" : null,
      statusColor: "#888888",
    },
    {
      label: "Members",
      icon: UserCheck,
      current: memberTotal,
      goal: memberGoal,
      display: fmt(memberTotal),
      goalDisplay: "300",
      color: "#3DB855",
      statusNote: stripeSnap ? `Stripe · as of ${stripeSnap.asOf}` : null,
      statusColor: "#888888",
    },
    {
      label: "Instagram Followers",
      icon: Instagram,
      current: igFollowers,
      goal: 2000,
      display: igFollowers != null ? fmt(igFollowers) : "—",
      goalDisplay: "2,000",
      color: "#007AFF",
      statusNote: igTokenNote,
      statusColor: igTokenNote && !tokenStatus?.warning ? "#FF3B30" : "#F5C72C",
    },
    {
      label: "Email Subscribers",
      icon: Mail,
      current: emailSubscribers,
      goal: 5000,
      display: fmt(emailSubscribers),
      goalDisplay: "5,000",
      color: "#111111",
      statusNote: emailSubscribersIsLive ? "Encharge · AHTIL tag · live" : "Encharge · AHTIL tag · CSV 2026-03-18",
      statusColor: "#888888",
    },
  ];

  // ── Data Health ──────────────────────────────────────────────────────────
  type DataSourceStatus = "live" | "warning" | "error" | "offline" | "loading";
  type DataSource = { label: string; status: DataSourceStatus; detail: string; note?: string };

  const STATUS_DOT: Record<DataSourceStatus, string> = {
    live: "#3DB855",
    warning: "#F5C72C",
    error: "#FF3B30",
    offline: "#E0E0E0",
    loading: "#E0E0E0",
  };
  const STATUS_LABEL: Record<DataSourceStatus, string> = {
    live: "Live",
    warning: "Renew soon",
    error: "Action needed",
    offline: "No data",
    loading: "Loading…",
  };
  const STATUS_TEXT: Record<DataSourceStatus, string> = {
    live: "#3DB855",
    warning: "#F5C72C",
    error: "#FF3B30",
    offline: "#888888",
    loading: "#888888",
  };

  const igDataSource = (): DataSource => {
    if (!tokenStatus) return { label: "Instagram", status: "loading", detail: "Checking token…" };
    if (!tokenValid) return {
      label: "Instagram",
      status: "error",
      detail: "Follower count unavailable — token expired",
      note: "Renew via Meta Graph API Explorer and update INSTAGRAM_ACCESS_TOKEN",
    };
    if (tokenStatus.warning) return {
      label: "Instagram",
      status: "warning",
      detail: igFollowers != null ? `${fmt(igFollowers)} followers` : "Followers loading…",
      note: `Token expires in ${tokenStatus.daysRemaining} day${tokenStatus.daysRemaining === 1 ? "" : "s"} — renew before it lapses`,
    };
    return {
      label: "Instagram",
      status: "live",
      detail: igFollowers != null ? `${fmt(igFollowers)} followers` : "Followers loading…",
    };
  };

  const DATA_SOURCES: DataSource[] = [
    {
      label: "Members · Stripe",
      status: stripeSnap ? "live" : snapLoading ? "loading" : memberTotal > 0 ? "live" : "offline",
      detail: stripeSnap
        ? `${fmt(memberTotal)} paying · ${fmtCurrency(mrr)} MRR · as of ${stripeSnap.asOf}`
        : snapLoading ? "Syncing…" : memberTotal > 0 ? `${fmt(memberTotal)} active` : "No members synced yet",
      note: stripeSnap ? "Static snapshot — update server/data/stripe-snapshot.ts on new export" : undefined,
    },
    {
      label: "Revenue · Toast POS",
      status: toastMTD > 0 ? "live" : "offline",
      detail: toastMTD > 0
        ? `${fmtCurrency(toastMTD)} MTD · ${toastOrders} orders`
        : "No orders recorded this month",
    },
    {
      label: "Revenue · Acuity",
      status: acuityTotal > 0 ? "live" : "offline",
      detail: acuityTotal > 0
        ? `${fmtCurrency(acuityTotal)} · ${acuityBookings} sessions`
        : "No sessions this month",
    },
    igDataSource(),
    {
      label: "Email · Encharge",
      status: emailSubscribersIsLive ? "live" : "warning",
      detail: `${fmt(emailSubscribers)} AHTIL contacts`,
      note: emailSubscribersIsLive ? undefined : "Encharge API not responding — showing CSV snapshot (2026-03-18)",
    },
    {
      label: "Meta Ads",
      status: metaAdsLoading ? "loading" : metaAdsError ? "error" : (metaAdsCampaigns && metaAdsCampaigns.length > 0) ? "live" : "offline",
      detail: metaAdsLoading
        ? "Connecting…"
        : metaAdsError
        ? "API connection failed — check META_ADS_ACCESS_TOKEN"
        : metaAdsCampaigns && metaAdsCampaigns.length > 0
        ? `${metaAdsCampaigns.length} campaigns live`
        : "No campaigns returned",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#111111] leading-tight">{greeting}, {firstName}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[13px] text-[#888888]">
              Golf VX Arlington Heights · {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <MetaAdsStatusBadge />
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-[12px] text-[#888888] hover:text-[#111111] border border-[#E0E0E0] rounded-lg px-3 py-1.5 hover:bg-[#F5F5F5] transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* ── 2026 Key Goals ── */}
      <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#F5C72C]" />
            <h2 className="text-[14px] font-semibold text-[#111111]">2026 Key Goals</h2>
          </div>
          <span className="text-[11px] text-[#AAAAAA]">Year-end targets</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {KEY_GOALS.map((g) => {
            const pct = g.current != null && g.goal > 0 ? Math.min((g.current / g.goal) * 100, 100) : null;
            const Icon = g.icon;
            return (
              <div key={g.label} className="rounded-xl border border-[#F0F0F0] bg-[#FAFAFA] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: `${g.color}18` }}>
                    <Icon className="h-3 w-3" style={{ color: g.color }} />
                  </div>
                  <span className="text-[11px] text-[#888888] font-medium truncate">{g.label}</span>
                </div>
                <div className="flex items-end gap-1 mb-1.5">
                  <span className="text-[22px] font-bold text-[#111111] leading-none tracking-tight">{g.display}</span>
                  <span className="text-[11px] text-[#AAAAAA] mb-0.5">/ {g.goalDisplay}</span>
                </div>
                {pct != null ? (
                  <>
                    <div className="h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden mb-1">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: g.color }} />
                    </div>
                    <span className="text-[10px]" style={{ color: g.color }}>{pct.toFixed(1)}%</span>
                    {g.statusNote && (
                      <p className="text-[10px] mt-0.5" style={{ color: g.statusColor ?? "#888888" }}>{g.statusNote}</p>
                    )}
                  </>
                ) : (
                  <span className="text-[10px]" style={{ color: g.statusNote ? (g.statusColor ?? "#888888") : "#AAAAAA" }}>
                    {g.statusNote ?? "Connecting…"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 1: Members + Goal Progress ── */}
      <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#111111]" />
            <h2 className="text-[14px] font-semibold text-[#111111]">Members</h2>
          </div>
          <button onClick={() => setLocation("/list/members")} className="flex items-center gap-1 text-[12px] text-[#888888] hover:text-[#111111] transition-colors">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <div className="flex items-end gap-3 mb-2">
              <button
                onClick={() => setMemberListOpen(true)}
                className="text-[42px] font-bold text-[#111111] leading-none tracking-tight hover:text-[#F5C72C] transition-colors cursor-pointer"
                title="View member list"
              >
                {fmt(memberTotal)}
              </button>
              {members?.newThisMonth !== undefined && members.newThisMonth !== 0 && (
                <span className={cn("text-[13px] font-semibold mb-1.5", members.newThisMonth > 0 ? "text-[#3DB855]" : "text-[#FF3B30]")}>
                  {members.newThisMonth > 0 ? "+" : ""}{members.newThisMonth} this month
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#888888]">
              Paying Members
              {stripeSnap && (
                <span className="ml-2 text-[10px] text-[#AAAAAA]">· Stripe · {stripeSnap.asOf}</span>
              )}
            </p>
            {stripeSnap && (
              <p className="text-[11px] text-[#AAAAAA] mt-0.5">{stripeSnap.totalContacts} total contacts · {stripeSnap.billingBreakdown.monthly} monthly · {stripeSnap.billingBreakdown.annual} annual</p>
            )}
          </div>
          {/* Stripe tier table */}
          <div>
            {stripeSnap ? (
              <div className="space-y-1.5">
                {stripeSnap.tiers.map(t => (
                  <div key={t.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[12px] font-medium text-[#111111] truncate">{t.name}</span>
                      <span className="text-[11px] text-[#AAAAAA] shrink-0">{t.count}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-[#111111] shrink-0">
                      {t.mrr > 0 ? fmtCurrency(t.mrr) : "—"}
                    </span>
                  </div>
                ))}
                <div className="pt-1.5 mt-1.5 border-t border-[#F0F0F0] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#888888]">Total MRR</span>
                  <span className="text-[13px] font-bold text-[#111111]">{fmtCurrency(stripeSnap.totalMRR)}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center space-y-2">
                <p className="text-[12px] text-[#888888]">Goal progress is tracked in the <strong className="text-[#111111]">2026 Key Goals</strong> section above.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Revenue (merged MRR + Toast + Acuity + Budget) ── */}
      <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#111111]" />
            <h2 className="text-[14px] font-semibold text-[#111111]">Revenue</h2>
          </div>
          <button onClick={() => setLocation("/intelligence/reports")} className="flex items-center gap-1 text-[12px] text-[#888888] hover:text-[#111111] transition-colors">
            Full Report <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Top row: MRR + Toast MTD + Programs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {mrr > 0 && (
            <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
              <div className="flex items-center gap-1.5 mb-1">
                {revenue?.mom !== undefined && revenue.mom !== 0 && (
                  <span className={cn("flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full", revenue.mom > 0 ? "text-[#3DB855] bg-[#F0FAF3]" : "text-[#FF3B30] bg-red-50")}>
                    {revenue.mom > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {Math.abs(revenue.mom).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-[24px] font-bold text-[#111111] leading-none tracking-tight">{snapLoading ? "—" : fmtCurrency(mrr)}</p>
              <p className="text-[11px] text-[#888888] mt-1">Monthly Recurring</p>
              {memberBreakdown.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                  {memberBreakdown.map(t => (
                    <span key={t.label} className="text-[10px] text-[#AAAAAA] whitespace-nowrap">{t.count} {t.label}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          {toastMTD > 0 && (
            <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
              <div className="flex items-center gap-1.5 mb-1">
                <ShoppingBag className="h-3 w-3 text-[#AAAAAA]" />
                <span className="text-[10px] text-[#AAAAAA]">Toast POS · MTD</span>
              </div>
              <p className="text-[24px] font-bold text-[#111111] leading-none tracking-tight">{fmtCurrency(toastMTD)}</p>
              <p className="text-[11px] text-[#888888] mt-1">{now.toLocaleDateString("en-US", { month: "long" })} · {toastOrders > 0 ? `${toastOrders} orders` : "No orders yet"}</p>
              {toastLastMonth > 0 && <p className="text-[10px] text-[#AAAAAA] mt-0.5">Last month: {fmtCurrency(toastLastMonth)}</p>}
            </div>
          )}
          {acuityTotal > 0 && (
            <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
              <div className="flex items-center gap-1.5 mb-1">
                <CreditCard className="h-3 w-3 text-[#AAAAAA]" />
                <span className="text-[10px] text-[#AAAAAA]">Programs · Acuity</span>
              </div>
              <p className="text-[24px] font-bold text-[#111111] leading-none tracking-tight">{fmtCurrency(acuityTotal)}</p>
              <p className="text-[11px] text-[#888888] mt-1">All sessions · {acuityBookings > 0 ? `${acuityBookings} bookings` : "No bookings"}</p>
            </div>
          )}
          {hasAnyRevenue && (
            <div className="p-3 rounded-lg bg-[#F5C72C]/5 border border-[#F5C72C]/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Award className="h-3 w-3 text-[#111111]" />
                <span className="text-[10px] text-[#888888]">Combined MTD + MRR</span>
              </div>
              <p className="text-[24px] font-bold text-[#111111] leading-none tracking-tight">{fmtCurrency(mrr + toastMTD)}</p>
              <p className="text-[11px] text-[#888888] mt-1">MRR + Toast this month</p>
              <p className="text-[10px] text-[#AAAAAA] mt-0.5">Acuity reported separately above</p>
            </div>
          )}
        </div>

        {/* $0 empty state — APIs not yet connected */}
        {!snapLoading && !hasAnyRevenue && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-dashed border-[#E0E0E0]">
            <div className="h-7 w-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
              <DollarSign className="h-3.5 w-3.5 text-[#AAAAAA]" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#888888]">Revenue data not yet connected</p>
              <p className="text-[11px] text-[#AAAAAA]">Toast POS and Acuity API connections pending. MRR available once Boomerang syncs.</p>
            </div>
          </div>
        )}

        {/* Annual Revenue Goal — $2M (only shown when revenue data is live) */}
        {hasAnyRevenue && <div className="mt-4 pt-4 border-t border-[#F0F0F0]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[#111111]" />
              <span className="text-[13px] font-semibold text-[#111111]">Annual Revenue Goal</span>
            </div>
            <div className="text-right">
              <span className="text-[18px] font-bold text-[#F5C72C]">{annualGoalPct.toFixed(1)}%</span>
              <span className="text-[11px] text-[#AAAAAA] ml-1">run rate</span>
            </div>
          </div>
          <div className="h-2 bg-[#F2F2F7] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#F5C72C] transition-all" style={{ width: `${annualGoalPct}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-[#AAAAAA]">{fmtCurrency(annualRunRate)} projected / {fmtCurrency(ANNUAL_REVENUE_GOAL)} goal</span>
            {annualRunRate < ANNUAL_REVENUE_GOAL && (
              <span className="text-[11px] text-[#AAAAAA]">{fmtCurrency(ANNUAL_REVENUE_GOAL - annualRunRate)} gap</span>
            )}
          </div>
        </div>}

      </div>

      {/* ── Section 3: Campaigns (merged from sidebar, no ROI) ── */}
      {(stratLoading || activeCampaigns.length > 0) && (
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-[#111111]" />
              <h2 className="text-[14px] font-semibold text-[#111111]">Campaigns</h2>
            </div>
            <button onClick={() => setLocation("/campaigns/strategic")} className="flex items-center gap-1 text-[12px] text-[#888888] hover:text-[#111111] transition-colors">
              Details <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {stratLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[0,1,2,3].map(i => <div key={i} className="h-28 bg-[#F5F5F5] rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {activeCampaigns.map((c: any) => {
                const meta = CAMPAIGN_META[c.id] || { label: c.name, color: "#888888", bg: "#F5F5F5", icon: BarChart3, kpiLabel: "KPI" };
                const Icon = meta.icon;
                const kpi = c.primaryKpi;
                const kpiPct = kpi?.target > 0 ? Math.min((kpi.current / kpi.target) * 100, 100) : 0;
                return (
                  <button key={c.id} onClick={() => setLocation("/campaigns/strategic")}
                    className="text-left w-full bg-[#FAFAFA] rounded-xl border border-[#F0F0F0] p-4 hover:shadow-sm hover:border-[#E0E0E0] transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                        <Icon className="h-3 w-3" style={{ color: meta.color }} />
                      </div>
                      <span className="text-[12px] font-semibold text-[#111111] leading-tight">{meta.label}</span>
                    </div>
                    {kpi && (
                      <>
                        <div className="flex items-end gap-1 mb-1">
                          <span className="text-[20px] font-bold text-[#111111] leading-none">
                            {typeof kpi.current === 'number' && kpi.current % 1 !== 0
                              ? kpi.current.toFixed(1) + (kpi.unit || '')
                              : fmt(kpi.current) + (kpi.unit || '')}
                          </span>
                          {kpi.target > 0 && (
                            <span className="text-[11px] text-[#AAAAAA] mb-0.5">/ {fmt(kpi.target)}{kpi.unit || ''}</span>
                          )}
                        </div>
                        {kpi.remaining != null && kpi.remaining > 0 && (
                          <p className="text-[10px] text-[#888888] mb-1">{fmt(kpi.remaining)} more needed</p>
                        )}
                        <p className="text-[10px] text-[#AAAAAA] mb-2">{meta.kpiLabel}</p>
                        {kpi.target > 0 && (
                          <div className="h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${kpiPct}%`, background: meta.color }} />
                          </div>
                        )}
                      </>
                    )}
                    {!kpi && c.activePrograms > 0 && (
                      <p className="text-[12px] text-[#888888]">{c.activePrograms} active programs</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Section 4: Active Programs with Health Scores (moved down) ── */}
      {activePrograms.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-[#111111]" />
              <h2 className="text-[14px] font-semibold text-[#111111]">Active Programs</h2>
              <span className="text-[10px] font-bold bg-[#F5F5F5] rounded-full px-1.5 py-0.5 text-[#888888]">{activePrograms.length}</span>
            </div>
            <button onClick={() => setLocation("/programs")} className="flex items-center gap-1 text-[12px] text-[#888888] hover:text-[#111111] transition-colors">
              All programs <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activePrograms.map((p: any) => {
              const progress = p.goalTarget > 0 ? Math.min((p.kpiActual / p.goalTarget) * 100, 100) : 0;
              const health = calcHealth(progress);
              const isOnTrack = progress >= 50;
              return (
                <button
                  key={p.id}
                  onClick={() => setLocation("/programs")}
                  className="flex flex-col gap-2 p-3 rounded-xl bg-[#F9F9F9] hover:bg-[#F0F0F0] transition-colors text-left group border border-transparent hover:border-[#E0E0E0]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12px] font-semibold text-[#111111] leading-tight">{p.name}</p>
                    <div className={cn("h-2 w-2 rounded-full shrink-0 mt-1", isOnTrack ? "bg-[#3DB855]" : "bg-[#E0E0E0]")} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#E8E8E8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, background: isOnTrack ? "#3DB855" : "#E0E0E0" }}
                      />
                    </div>
                    <span className="text-[10px] text-[#AAAAAA] shrink-0">{progress.toFixed(0)}%</span>
                  </div>
                  <HealthDots score={health} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section 5: Data Health ── */}
      <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#111111]" />
            <h2 className="text-[14px] font-semibold text-[#111111]">Data Health</h2>
          </div>
          <span className="text-[11px] text-[#AAAAAA]">Integration status</span>
        </div>
        <div className="divide-y divide-[#F5F5F5]">
          {DATA_SOURCES.map((src) => (
            <div key={src.label} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[13px] text-[#111111] min-w-0">{src.label}</span>
                <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border",
                    src.status === "live" && "bg-[#3DB855]/10 text-[#2A9040] border-[#3DB855]/20",
                    src.status === "warning" && "bg-[#F59E0B]/10 text-[#B45309] border-[#F59E0B]/20",
                    src.status === "error" && "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20",
                    (src.status === "offline" || src.status === "loading") && "bg-[#F2F2F7] text-[#AAAAAA] border-[#E0E0E0]"
                  )}>
                    {STATUS_LABEL[src.status]}
                  </span>
                  <p className="text-[11px] text-[#888888]">{src.detail}</p>
                </div>
              </div>
              {src.note && (
                <p className={cn(
                  "text-[11px] mt-1",
                  src.status === "error" && "text-[#FF3B30]/80",
                  src.status === "warning" && "text-[#B45309]/80",
                  (src.status === "live" || src.status === "offline" || src.status === "loading") && "text-[#888888]"
                )}>
                  {src.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <MemberListModal open={memberListOpen} onClose={() => setMemberListOpen(false)} />
    </div>
  );
}
