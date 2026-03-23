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
  ArrowRight,
  RefreshCw,
  BarChart3,
  Flag,
  UserCheck,
  Crosshair,
  X,
  Instagram,
  Mail,
  Lock,
  Zap,
  AlertCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
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
          style={{ background: i <= score ? "#F2DD48" : "#DEDEDA" }}
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DEDEDA]">
          <div>
            <h2 className="text-[15px] font-bold text-[#222222]">Active Members</h2>
            {memberList && <p className="text-[12px] text-[#888888]">{memberList.length} members</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F1F1EF] transition-colors">
            <X className="h-4 w-4 text-[#888888]" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#F2DD48] border-t-transparent" />
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0F0]">
              {(memberList ?? []).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#FAFAFA] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#F2DD48]/20 flex items-center justify-center shrink-0">
                      <span className="text-[12px] font-bold text-[#222222]">
                        {m.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#222222]">{m.name}</p>
                      <p className="text-[11px] text-[#888888]">{m.email}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-medium text-[#222222]">
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
  trial_conversion: { label: "Trial Conversion", color: "#72B84A", bg: "#F0FAF3", icon: Target, kpiLabel: "Conversion Rate" },
  membership_acquisition: { label: "Membership Acquisition", color: "#1A56DB", bg: "#EBF4FF", icon: UserCheck, kpiLabel: "Members Acquired" },
  member_retention: { label: "Member Retention", color: "#222222", bg: "#F1F1EF", icon: Users, kpiLabel: "Retention Rate" },
  corporate_events: { label: "B2B Sales", color: "#6F6F6B", bg: "#F1F1EF", icon: Flag, kpiLabel: "Events Closed" },
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
  const { data: priorityItems } = trpc.priorities.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F2DD48] border-t-transparent" />
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
          <div className="h-14 w-14 bg-[#F2DD48]/20 rounded-2xl flex items-center justify-center mx-auto">
            <BarChart3 className="h-7 w-7 text-[#222222]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#222222]">Golf VX Dashboard</h1>
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
                className="pl-9 border-[#DEDEDA] focus:border-[#F2DD48] focus:ring-[#F2DD48]"
                autoFocus
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-500">{loginError}</p>
            )}
            <Button
              type="submit"
              disabled={loginLoading || !loginPassword}
              className="bg-[#F2DD48] text-[#222222] font-semibold hover:brightness-95 active:scale-95 transition-all w-full"
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
  // Email Subscribers: live Encharge API (AHTIL tag count); static fallback = 1000 (user-confirmed 2026-03-23)
  const AHTIL_FALLBACK = 1000;
  const emailSubscribers = ahtilData?.count != null ? ahtilData.count : AHTIL_FALLBACK;
  const emailSubscribersIsLive = ahtilData?.count != null;

  const igTokenNote = !tokenValid && tokenStatus !== undefined
    ? "Token refresh needed"
    : tokenStatus?.warning
    ? `Token expires in ${tokenStatus.daysRemaining}d`
    : null;

  const KEY_GOALS: Array<{
    id?: string;
    label: string;
    icon: React.ElementType;
    current: number | null;
    goal: number;
    display: string;
    goalDisplay: string;
    color: string;
    statusNote?: string | null;
    statusColor?: string;
    detail?: React.ReactNode;
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
      statusNote: hasAnyRevenue ? "MRR + Toast run rate · Acuity reported separately" : null,
      statusColor: "#888888",
      detail: hasAnyRevenue ? (
        <div className="mt-2.5 pt-2.5 border-t border-[#F0F0F0] space-y-1">
          {mrr > 0 && (
            <div className="flex justify-between">
              <span className="text-[11px] text-[#6F6F6B]">MRR</span>
              <span className="text-[11px] font-semibold text-[#222222]">{fmtCurrency(mrr)}</span>
            </div>
          )}
          {toastMTD > 0 && (
            <div className="flex justify-between">
              <span className="text-[11px] text-[#6F6F6B]">Toast MTD</span>
              <span className="text-[11px] font-semibold text-[#222222]">{fmtCurrency(toastMTD)}</span>
            </div>
          )}
          {acuityTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-[11px] text-[#6F6F6B]">Acuity</span>
              <span className="text-[11px] font-semibold text-[#222222]">{fmtCurrency(acuityTotal)}</span>
            </div>
          )}
        </div>
      ) : undefined,
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
      statusNote: stripeSnap ? `Stripe · as of ${stripeSnap.asOf}` : null,
      statusColor: "#888888",
      detail: memberBreakdown.length > 0 ? (
        <div className="mt-2.5 pt-2.5 border-t border-[#F0F0F0] space-y-1">
          {memberBreakdown.map((t: { label: string; count: number }) => (
            <div key={t.label} className="flex justify-between">
              <span className="text-[11px] text-[#6F6F6B]">{t.label}</span>
              <span className="text-[11px] font-semibold text-[#222222]">{t.count}</span>
            </div>
          ))}
        </div>
      ) : undefined,
    },
    {
      id: "instagram",
      label: "Instagram Followers",
      icon: Instagram,
      current: igFollowers,
      goal: 2000,
      display: igFollowers != null ? fmt(igFollowers) : "—",
      goalDisplay: "2,000",
      color: "#1A56DB",
      statusNote: igTokenNote,
      statusColor: igTokenNote && !tokenStatus?.warning ? "#D32F2F" : "#F2DD48",
    },
    {
      id: "email",
      label: "Email Subscribers",
      icon: Mail,
      current: emailSubscribers,
      goal: 5000,
      display: fmt(emailSubscribers),
      goalDisplay: "5,000",
      color: "#222222",
      statusNote: emailSubscribersIsLive ? "Encharge · AHTIL tag · live" : "Encharge · AHTIL tag · CSV 2026-03-18",
      statusColor: "#888888",
    },
  ];


  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#222222] leading-tight">{greeting}, {firstName}</h1>
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
          className="flex items-center gap-1.5 text-[12px] text-[#888888] hover:text-[#222222] border border-[#DEDEDA] rounded-lg px-3 py-1.5 hover:bg-[#F1F1EF] transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* ── 2026 Key Goals ── */}
      <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-[#F2DD48]" />
            <h2 className="text-[15px] font-bold text-[#222222]">2026 Key Goals</h2>
          </div>
          <span className="text-[11px] text-[#A8A8A3]">Year-end targets</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {KEY_GOALS.map((g) => {
            const pct = g.current != null && g.goal > 0 ? Math.min((g.current / g.goal) * 100, 100) : null;
            const Icon = g.icon;
            return (
              <div key={g.id} className="rounded-xl border border-[#F0F0F0] bg-[#F8F9FA] p-4">
                {/* Card header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `${g.color}18` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: g.color }} />
                  </div>
                  <span className="text-[12px] font-semibold text-[#6F6F6B]">{g.label}</span>
                </div>
                {/* KPI number */}
                <div className="flex items-end gap-1.5 mb-2">
                  <button
                    onClick={g.id === "members" ? () => setMemberListOpen(true) : undefined}
                    className={cn(
                      "text-[28px] font-bold text-[#222222] leading-none tracking-tight",
                      g.id === "members" && "hover:text-[#F2DD48] transition-colors cursor-pointer"
                    )}
                  >
                    {g.display}
                  </button>
                  <span className="text-[12px] text-[#A8A8A3] mb-0.5">/ {g.goalDisplay}</span>
                </div>
                {/* Progress bar */}
                {pct != null ? (
                  <>
                    <div className="h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden mb-1.5">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: g.color }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: g.color }}>{pct.toFixed(1)}%</span>
                      {g.statusNote && (
                        <span className="text-[10px]" style={{ color: g.statusColor ?? "#A8A8A3" }}>{g.statusNote}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-[11px]" style={{ color: g.statusColor ?? "#A8A8A3" }}>
                    {g.statusNote ?? "Connecting…"}
                  </span>
                )}
                {/* Detail breakdown */}
                {g.detail}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Campaigns (merged from sidebar, no ROI) ── */}
      {(stratLoading || activeCampaigns.length > 0) && (
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-[#222222]" />
              <h2 className="text-[14px] font-semibold text-[#222222]">Campaigns</h2>
            </div>
            <button onClick={() => setLocation("/campaigns/strategic")} className="flex items-center gap-1 text-[12px] text-[#888888] hover:text-[#222222] transition-colors">
              Details <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {stratLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[0,1,2,3].map(i => <div key={i} className="h-28 bg-[#F1F1EF] rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {activeCampaigns.map((c: any) => {
                const meta = CAMPAIGN_META[c.id] || { label: c.name, color: "#888888", bg: "#F1F1EF", icon: BarChart3, kpiLabel: "KPI" };
                const Icon = meta.icon;
                const kpi = c.primaryKpi;
                const kpiPct = kpi?.target > 0 ? Math.min((kpi.current / kpi.target) * 100, 100) : 0;
                return (
                  <button key={c.id} onClick={() => setLocation("/campaigns/strategic")}
                    className="text-left w-full bg-[#FAFAFA] rounded-xl border border-[#F0F0F0] p-4 hover:shadow-sm hover:border-[#DEDEDA] transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                        <Icon className="h-3 w-3" style={{ color: meta.color }} />
                      </div>
                      <span className="text-[12px] font-semibold text-[#222222] leading-tight">{meta.label}</span>
                    </div>
                    {kpi && (
                      <>
                        <div className="flex items-end gap-1 mb-1">
                          <span className="text-[20px] font-bold text-[#222222] leading-none">
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

      {/* ── Section 4: Today's Priority Actions ── */}
      {priorityItems && priorityItems.filter((p: any) => !p.completedAt).length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#F2DD48]" />
              <h2 className="text-[14px] font-semibold text-[#222222]">Priority Actions</h2>
              <span className="text-[10px] font-bold bg-[#FFF9D6] rounded-full px-1.5 py-0.5 text-[#888888]">
                {priorityItems.filter((p: any) => !p.completedAt).length}
              </span>
            </div>
            <button onClick={() => setLocation("/ask")} className="flex items-center gap-1 text-[12px] text-[#888888] hover:text-[#222222] transition-colors">
              Ask AI <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {priorityItems.filter((p: any) => !p.completedAt).slice(0, 5).map((p: any) => {
              const urgencyColor = p.urgency === "URGENT" ? "#EF4444" : p.urgency === "TODAY" ? "#F2DD48" : "#4E8DF4";
              const UrgencyIcon = p.urgency === "URGENT" ? AlertCircle : p.urgency === "TODAY" ? Zap : Clock;
              return (
                <button
                  key={p.id}
                  onClick={() => p.path ? setLocation(p.path) : undefined}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#F9F9F9] hover:bg-[#F0F0F0] transition-colors text-left"
                >
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: urgencyColor + "20" }}>
                    <UrgencyIcon className="h-3.5 w-3.5" style={{ color: urgencyColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#222222] leading-tight truncate">{p.title}</p>
                    <p className="text-[11px] text-[#888888] mt-0.5">{p.category} · Added by {p.createdBy || "Team"}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: urgencyColor + "20", color: urgencyColor }}>
                    {p.urgency}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section 5: Active Programs with Health Scores (moved down) ── */}
      {activePrograms.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-[#222222]" />
              <h2 className="text-[14px] font-semibold text-[#222222]">Active Programs</h2>
              <span className="text-[10px] font-bold bg-[#F1F1EF] rounded-full px-1.5 py-0.5 text-[#888888]">{activePrograms.length}</span>
            </div>
            <button onClick={() => setLocation("/programs")} className="flex items-center gap-1 text-[12px] text-[#888888] hover:text-[#222222] transition-colors">
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
                  className="flex flex-col gap-2 p-3 rounded-xl bg-[#F9F9F9] hover:bg-[#F0F0F0] transition-colors text-left group border border-transparent hover:border-[#DEDEDA]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12px] font-semibold text-[#222222] leading-tight">{p.name}</p>
                    <div className={cn("h-2 w-2 rounded-full shrink-0 mt-1", isOnTrack ? "bg-[#72B84A]" : "bg-[#DEDEDA]")} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#E8E8E8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, background: isOnTrack ? "#72B84A" : "#DEDEDA" }}
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


      <MemberListModal open={memberListOpen} onClose={() => setMemberListOpen(false)} />
    </div>
  );
}
