import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
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
                      <span className="text-[12px] font-bold text-[#8B6E00]">
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
  membership_acquisition: { label: "Membership Acquisition", color: "#E85D8A", bg: "#FDE8F0", icon: UserCheck, kpiLabel: "Members Acquired" },
  member_retention: { label: "Member Retention", color: "#007AFF", bg: "#E5F0FF", icon: Users, kpiLabel: "Retention Rate" },
  corporate_events: { label: "B2B Sales", color: "#F5A623", bg: "#FEF3E2", icon: Flag, kpiLabel: "Events Closed" },
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

  const [refreshing, setRefreshing] = useState(false);
  const [memberListOpen, setMemberListOpen] = useState(false);
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

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-5 max-w-sm px-6">
          <div className="h-14 w-14 bg-[#F5C72C]/20 rounded-2xl flex items-center justify-center mx-auto">
            <BarChart3 className="h-7 w-7 text-[#111111]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111111]">Golf VX Dashboard</h1>
            <p className="text-sm text-[#888888] mt-1">Arlington Heights — Marketing Dashboard</p>
          </div>
          <Button
            className="bg-[#F5C72C] text-[#111111] font-semibold hover:brightness-95 active:scale-95 transition-all w-full"
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

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "there";

  // Revenue values
  const mrr = members?.mrr ?? 0;
  const toastMTD = (toastSummary as any)?.thisMonthRevenue ?? 0;
  const toastOrders = (toastSummary as any)?.thisMonthOrders ?? 0;
  const toastLastMonth = (toastSummary as any)?.lastMonthRevenue ?? 0;
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
  const annualMrrRunRate = mrr * 12;
  // Estimate YTD revenue using MRR + Toast MTD * 12 as run rate proxy
  const annualRunRate = annualMrrRunRate + (toastMTD * 12) + (acuityTotal * 12);
  const annualGoalPct = Math.min((annualRunRate / ANNUAL_REVENUE_GOAL) * 100, 100);
  const hasAnyRevenue = mrr > 0 || toastMTD > 0 || acuityTotal > 0;

  // Strategic campaigns — filter out $0 spend AND $0 revenue
  const activeCampaigns = (strategicOverview ?? []).filter((c: any) => c.totalSpend > 0 || c.totalRevenue > 0 || c.primaryKpi?.current > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#111111] leading-tight">{greeting}, {firstName}</h1>
          <p className="text-[13px] text-[#888888] mt-0.5">
            Golf VX Arlington Heights · {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
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

      {/* ── Section 1: Members + Goal Progress ── */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#111111]" />
            <h2 className="text-[14px] font-bold text-[#111111]">Members</h2>
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
                {snapLoading ? "—" : fmt(memberTotal)}
              </button>
              {members?.newThisMonth !== undefined && members.newThisMonth !== 0 && (
                <span className={cn("text-[13px] font-semibold mb-1.5", members.newThisMonth > 0 ? "text-[#3DB855]" : "text-[#E8453C]")}>
                  {members.newThisMonth > 0 ? "+" : ""}{members.newThisMonth} this month
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#888888]">Active Members</p>
            {memberBreakdown.length > 0 && (
              <div className="flex gap-4 mt-3">
                {memberBreakdown.map(t => (
                  <div key={t.label}>
                    <p className="text-[16px] font-bold text-[#111111]">{t.count}</p>
                    <p className="text-[11px] text-[#AAAAAA]">{t.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[#111111]">Member Goal Progress</span>
              <span className="text-[18px] font-bold text-[#F5C72C]">{memberGoalPct.toFixed(0)}%</span>
            </div>
            <div className="h-2.5 bg-[#F2F2F7] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#F5C72C] transition-all" style={{ width: `${memberGoalPct}%` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-[#AAAAAA]">{fmt(memberTotal)} of {fmt(memberGoal)} members</span>
              <span className="text-[11px] text-[#AAAAAA]">{fmt(memberGoal - memberTotal)} remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Revenue (merged MRR + Toast + Acuity + Budget) ── */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#111111]" />
            <h2 className="text-[14px] font-bold text-[#111111]">Revenue</h2>
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
                  <span className={cn("flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full", revenue.mom > 0 ? "text-[#3DB855] bg-[#F0FAF3]" : "text-[#E8453C] bg-red-50")}>
                    {revenue.mom > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {Math.abs(revenue.mom).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-[24px] font-bold text-[#F5C72C] leading-none tracking-tight">{snapLoading ? "—" : fmtCurrency(mrr)}</p>
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
                <span className="text-[10px] text-[#AAAAAA]">Toast POS</span>
              </div>
              <p className="text-[24px] font-bold text-[#111111] leading-none tracking-tight">{fmtCurrency(toastMTD)}</p>
              <p className="text-[11px] text-[#888888] mt-1">This month</p>
              {toastOrders > 0 && <p className="text-[10px] text-[#AAAAAA] mt-0.5">{toastOrders} orders</p>}
              {toastLastMonth > 0 && <p className="text-[10px] text-[#AAAAAA]">Last month: {fmtCurrency(toastLastMonth)}</p>}
            </div>
          )}
          {acuityTotal > 0 && (
            <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
              <div className="flex items-center gap-1.5 mb-1">
                <CreditCard className="h-3 w-3 text-[#AAAAAA]" />
                <span className="text-[10px] text-[#AAAAAA]">Programs</span>
              </div>
              <p className="text-[24px] font-bold text-[#111111] leading-none tracking-tight">{fmtCurrency(acuityTotal)}</p>
              <p className="text-[11px] text-[#888888] mt-1">Acuity bookings</p>
              {acuityBookings > 0 && <p className="text-[10px] text-[#AAAAAA] mt-0.5">{acuityBookings} sessions</p>}
            </div>
          )}
          {hasAnyRevenue && (
            <div className="p-3 rounded-lg bg-[#F5C72C]/5 border border-[#F5C72C]/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Award className="h-3 w-3 text-[#8B6E00]" />
                <span className="text-[10px] text-[#8B6E00]">Total MTD</span>
              </div>
              <p className="text-[24px] font-bold text-[#8B6E00] leading-none tracking-tight">{fmtCurrency(mrr + toastMTD + acuityTotal)}</p>
              <p className="text-[11px] text-[#888888] mt-1">All channels</p>
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

        {/* Annual Revenue Goal — $2M */}
        <div className="mt-4 pt-4 border-t border-[#F0F0F0]">
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
        </div>

      </div>

      {/* ── Section 3: Campaigns (merged from sidebar, no ROI) ── */}
      {(stratLoading || activeCampaigns.length > 0) && (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-[#111111]" />
              <h2 className="text-[14px] font-bold text-[#111111]">Campaigns</h2>
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
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-[#111111]" />
              <h2 className="text-[14px] font-bold text-[#111111]">Active Programs</h2>
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
                    <div className={cn("h-2 w-2 rounded-full shrink-0 mt-1", isOnTrack ? "bg-[#3DB855]" : "bg-[#F5A623]")} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#E8E8E8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, background: isOnTrack ? "#3DB855" : "#F5A623" }}
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
