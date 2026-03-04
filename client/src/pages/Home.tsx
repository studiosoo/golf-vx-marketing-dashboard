import { useAuth } from "@/_core/hooks/useAuth";
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
  Minus,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Zap,
  BarChart3,
  Flag,
  UserCheck,
  Sparkles,
  ShoppingBag,
  Activity,
  Calendar,
  FileText,
  CreditCard,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return n.toLocaleString("en-US", opts);
}
function fmtCurrency(n: number) {
  return "$" + fmt(n, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtPct(n: number) {
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}

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

  const { data: pendingActions, isLoading: actionsLoading } =
    trpc.autonomous.getApprovalCards.useQuery(undefined, {
      enabled: isAuthenticated,
      staleTime: 60 * 1000,
    });

  const { data: toastSummary } = trpc.revenue.getToastSummary.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const { data: programs } = trpc.campaigns.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const approveMutation = trpc.autonomous.approveAction.useMutation({
    onSuccess: () => utils.autonomous.getApprovalCards.invalidate(),
  });
  const rejectMutation = trpc.autonomous.rejectAction.useMutation({
    onSuccess: () => utils.autonomous.getApprovalCards.invalidate(),
  });

  const [refreshing, setRefreshing] = useState(false);
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
  const budget = snapshot?.budget;
  const pendingCount = pendingActions?.length ?? 0;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "there";

  const CAMPAIGN_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    trial_conversion: { label: "Trial Conversion", color: "#3DB855", bg: "#E8F5EB", icon: Target },
    membership_acquisition: { label: "Membership Acquisition", color: "#E85D8A", bg: "#FDE8F0", icon: UserCheck },
    member_retention: { label: "Member Retention", color: "#007AFF", bg: "#E5F0FF", icon: Users },
    corporate_events: { label: "B2B Sales", color: "#F5A623", bg: "#FEF3E2", icon: Flag },
  };

  // Active programs for the strip
  const activePrograms = (programs ?? []).filter((p: any) => p.status === "active").slice(0, 6);

  // Revenue data for snapshot section
  const { data: acuityRevenue } = trpc.revenue.getAcuityRevenue.useQuery({ minDate: undefined, maxDate: undefined }, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  const acuityTotal = (acuityRevenue as any)?.total ?? 0;
  const acuityBookings = (acuityRevenue as any)?.totalBookings ?? 0;
  const toastLastMonth = (toastSummary as any)?.lastMonthRevenue ?? 0;
  const toastAllTimeVal = (toastSummary as any)?.allTimeRevenue ?? 0;

  // Revenue values — only show if non-zero
  const mrr = members?.mrr ?? 0;
  const toastMTD = (toastSummary as any)?.thisMonthRevenue ?? 0;
  const toastOrders = (toastSummary as any)?.thisMonthOrders ?? 0;
  const toastAllTime = (toastSummary as any)?.allTimeRevenue ?? 0;
  const budgetSpent = budget?.spent ?? 0;
  const budgetTotal = budget?.total ?? 0;
  const budgetPct = budget?.utilization ?? 0;

  // Member breakdown — only show tiers with members
  const memberBreakdown = [
    { label: "All Access", count: (snapshot as any)?.membersByType?.allAccess ?? 0 },
    { label: "Swing Saver", count: (snapshot as any)?.membersByType?.swingSaver ?? 0 },
    { label: "Pro", count: (snapshot as any)?.membersByType?.pro ?? 0 },
  ].filter(t => t.count > 0);

  // Member goal progress
  const memberTotal = members?.total ?? 0;
  const memberGoal = 300;
  const memberGoalPct = memberGoal > 0 ? Math.min((memberTotal / memberGoal) * 100, 100) : 0;

  // Strategic campaigns — filter out those with $0 spend AND $0 revenue
  const activeCampaigns = (strategicOverview ?? []).filter((c: any) => c.totalSpend > 0 || c.totalRevenue > 0);

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

      {/* ── Section 1: Members + Goal Progress (grouped) ── */}
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
          {/* Left: counts */}
          <div>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-[42px] font-bold text-[#111111] leading-none tracking-tight">
                {snapLoading ? "—" : fmt(memberTotal)}
              </span>
              {members?.newThisMonth !== undefined && members.newThisMonth !== 0 && (
                <span className={cn("text-[13px] font-semibold mb-1.5", members.newThisMonth > 0 ? "text-[#3DB855]" : "text-red-500")}>
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

          {/* Right: goal progress */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[#111111]">Member Goal Progress</span>
              <span className="text-[18px] font-bold text-[#F5C72C]">{memberGoalPct.toFixed(0)}%</span>
            </div>
            <div className="h-2.5 bg-[#F2F2F7] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#F5C72C] transition-all"
                style={{ width: `${memberGoalPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-[#AAAAAA]">{fmt(memberTotal)} of {fmt(memberGoal)} members</span>
              <span className="text-[11px] text-[#AAAAAA]">{fmt(memberGoal - memberTotal)} remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Revenue (MRR + Toast grouped) ── */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#111111]" />
            <h2 className="text-[14px] font-bold text-[#111111]">Revenue</h2>
          </div>
          <button onClick={() => setLocation("/revenue")} className="flex items-center gap-1 text-[12px] text-[#888888] hover:text-[#111111] transition-colors">
            Details <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* MRR */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              {revenue?.mom !== undefined && revenue.mom !== 0 && (
                <span className={cn("flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full", revenue.mom > 0 ? "text-[#3DB855] bg-[#E8F5EB]" : "text-red-500 bg-red-50")}>
                  {revenue.mom > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(revenue.mom).toFixed(1)}% MoM
                </span>
              )}
            </div>
            <p className="text-[32px] font-bold text-[#F5C72C] leading-none tracking-tight">
              {snapLoading ? "—" : fmtCurrency(mrr)}
            </p>
            <p className="text-[12px] text-[#888888] mt-1">Monthly Recurring Revenue</p>
            {memberBreakdown.length > 0 && (
              <div className="flex gap-3 mt-2">
                {memberBreakdown.map(t => (
                  <div key={t.label}>
                    <p className="text-[13px] font-semibold text-[#111111]">{t.count}</p>
                    <p className="text-[10px] text-[#AAAAAA]">{t.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Toast MTD — only show if non-zero */}
          {toastMTD > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="h-3.5 w-3.5 text-[#AAAAAA]" />
                <span className="text-[11px] text-[#AAAAAA]">Toast POS</span>
              </div>
              <p className="text-[32px] font-bold text-[#111111] leading-none tracking-tight">
                {fmtCurrency(toastMTD)}
              </p>
              <p className="text-[12px] text-[#888888] mt-1">This month</p>
              {toastOrders > 0 && (
                <p className="text-[11px] text-[#AAAAAA] mt-0.5">{toastOrders} orders</p>
              )}
            </div>
          ) : null}

          {/* Budget */}
          {budgetSpent > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-[#AAAAAA]" />
                  <span className="text-[11px] text-[#AAAAAA]">Marketing Budget</span>
                </div>
                <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded-full", budgetPct > 100 ? "text-[#E85D8A] bg-[#FDE8F0]" : budgetPct > 80 ? "text-[#F5A623] bg-[#FEF3E2]" : "text-[#3DB855] bg-[#E8F5EB]")}>
                  {budgetPct.toFixed(0)}%
                </span>
              </div>
              <p className="text-[32px] font-bold text-[#111111] leading-none tracking-tight">
                {fmtCurrency(budgetSpent)}
              </p>
              <p className="text-[12px] text-[#888888] mt-1">of {fmtCurrency(budgetTotal)} budget</p>
              <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(budgetPct, 100)}%`, background: budgetPct > 100 ? "#E85D8A" : budgetPct > 80 ? "#F5A623" : "#3DB855" }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Combined total — only show if both MRR and Toast have data */}
        {mrr > 0 && toastMTD > 0 && (
          <div className="mt-4 pt-4 border-t border-[#F0F0F0] flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#111111]">MRR + Toast (MTD)</span>
            <span className="text-[18px] font-bold text-[#F5C72C]">{fmtCurrency(mrr + toastMTD)}</span>
          </div>
        )}
      </div>

      {/* ── Section 3: Active Programs ── */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {activePrograms.map((p: any) => {
              const progress = p.goalTarget > 0 ? Math.min((p.kpiActual / p.goalTarget) * 100, 100) : 0;
              const isOnTrack = progress >= 50;
              return (
                <button
                  key={p.id}
                  onClick={() => setLocation("/programs")}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#F9F9F9] hover:bg-[#F0F0F0] transition-colors text-left group"
                >
                  <div className={cn("h-2 w-2 rounded-full shrink-0 mt-0.5", isOnTrack ? "bg-[#3DB855]" : "bg-[#F5A623]")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-[#111111] truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-[#E8E8E8] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, background: isOnTrack ? "#3DB855" : "#F5A623" }}
                        />
                      </div>
                      <span className="text-[10px] text-[#AAAAAA] shrink-0">{progress.toFixed(0)}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section 4: Strategic Campaigns (only non-zero) ── */}
      {activeCampaigns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-[#111111]">Strategic Campaigns</h2>
            <button onClick={() => setLocation("/campaigns/strategic")} className="flex items-center gap-1 text-[12px] text-[#888888] hover:text-[#111111] transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {stratLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[0,1,2,3].map(i => <div key={i} className="h-36 bg-[#F5F5F5] rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {activeCampaigns.map((c: any) => {
                const meta = CAMPAIGN_META[c.id] || { label: c.name, color: "#888888", bg: "#F5F5F5", icon: BarChart3 };
                const Icon = meta.icon;
                const budgetPctC = c.totalBudget > 0 ? Math.min((c.totalSpend / c.totalBudget) * 100, 100) : 0;
                return (
                  <button key={c.id} onClick={() => setLocation("/campaigns/strategic")}
                    className="text-left w-full bg-white rounded-xl border border-[#E0E0E0] p-4 hover:shadow-md transition-shadow duration-150 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: meta.bg }}>
                          <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                        </div>
                        <span className="text-[12px] font-semibold text-[#111111]">{meta.label}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[#CCCCCC] group-hover:text-[#888888] transition-colors" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {c.totalSpend > 0 && (
                        <div>
                          <p className="text-[16px] font-bold text-[#111111] leading-none">{fmtCurrency(c.totalSpend)}</p>
                          <p className="text-[10px] text-[#AAAAAA] mt-0.5">Spend</p>
                        </div>
                      )}
                      {c.totalRevenue > 0 && (
                        <div>
                          <p className="text-[16px] font-bold text-[#111111] leading-none">{fmtCurrency(c.totalRevenue)}</p>
                          <p className="text-[10px] text-[#AAAAAA] mt-0.5">Revenue</p>
                        </div>
                      )}
                      {(c.totalSpend > 0 || c.totalRevenue > 0) && (
                        <div>
                          <p className={cn("text-[16px] font-bold leading-none", c.roi >= 0 ? "text-[#3DB855]" : "text-red-500")}>{fmtPct(c.roi)}</p>
                          <p className="text-[10px] text-[#AAAAAA] mt-0.5">ROI</p>
                        </div>
                      )}
                    </div>
                    {c.totalBudget > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-[#AAAAAA]">{fmtCurrency(c.totalSpend)} / {fmtCurrency(c.totalBudget)}</span>
                          {c.activePrograms > 0 && <span className="text-[10px] text-[#888888]">{c.activePrograms} active</span>}
                        </div>
                        <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${budgetPctC}%`, background: meta.color }} />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Section 4b: Revenue Snapshot (only show if data exists) ── */}
      {(mrr > 0 || toastMTD > 0 || acuityTotal > 0) && (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#111111]" />
              <h2 className="text-[14px] font-bold text-[#111111]">Revenue & Reports</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setLocation("/revenue")} className="flex items-center gap-1 text-[12px] text-[#888888] hover:text-[#111111] transition-colors">
                Revenue <ArrowRight className="h-3 w-3" />
              </button>
              <button onClick={() => setLocation("/intelligence/reports")} className="flex items-center gap-1 text-[12px] text-[#888888] hover:text-[#111111] transition-colors">
                Full Report <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {mrr > 0 && (
              <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="h-3.5 w-3.5 text-[#F5C72C]" />
                  <span className="text-[10px] text-[#AAAAAA] uppercase tracking-wide">MRR</span>
                </div>
                <p className="text-[20px] font-bold text-[#F5C72C] leading-none">{fmtCurrency(mrr)}</p>
                <p className="text-[11px] text-[#AAAAAA] mt-1">Monthly recurring</p>
              </div>
            )}
            {toastMTD > 0 && (
              <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShoppingBag className="h-3.5 w-3.5 text-[#AAAAAA]" />
                  <span className="text-[10px] text-[#AAAAAA] uppercase tracking-wide">Toast MTD</span>
                </div>
                <p className="text-[20px] font-bold text-[#111111] leading-none">{fmtCurrency(toastMTD)}</p>
                {toastOrders > 0 && <p className="text-[11px] text-[#AAAAAA] mt-1">{toastOrders} orders</p>}
              </div>
            )}
            {acuityTotal > 0 && (
              <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
                <div className="flex items-center gap-1.5 mb-1">
                  <CreditCard className="h-3.5 w-3.5 text-[#AAAAAA]" />
                  <span className="text-[10px] text-[#AAAAAA] uppercase tracking-wide">Programs</span>
                </div>
                <p className="text-[20px] font-bold text-[#111111] leading-none">{fmtCurrency(acuityTotal)}</p>
                {acuityBookings > 0 && <p className="text-[11px] text-[#AAAAAA] mt-1">{acuityBookings} bookings</p>}
              </div>
            )}
            {(mrr > 0 && toastMTD > 0) && (
              <div className="p-3 rounded-lg bg-[#F5C72C]/5 border border-[#F5C72C]/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <Award className="h-3.5 w-3.5 text-[#8B6E00]" />
                  <span className="text-[10px] text-[#8B6E00] uppercase tracking-wide">Total MTD</span>
                </div>
                <p className="text-[20px] font-bold text-[#8B6E00] leading-none">{fmtCurrency(mrr + toastMTD + acuityTotal)}</p>
                <p className="text-[11px] text-[#AAAAAA] mt-1">All channels</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Section 5: AI Actions (only show if there are pending actions or recently completed) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Actions panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E0E0E0] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#111111]" />
              <h3 className="text-[14px] font-bold text-[#111111]">AI Actions</h3>
              {pendingCount > 0 && (
                <span className="text-[10px] font-bold bg-[#F5C72C] rounded-full px-1.5 py-0.5 text-[#111111]">{pendingCount}</span>
              )}
            </div>
            <button onClick={() => setLocation("/intelligence/ai-actions")} className="text-[12px] text-[#888888] hover:text-[#111111] transition-colors flex items-center gap-1">
              All actions <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {actionsLoading ? (
            <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-12 bg-[#F5F5F5] rounded-lg animate-pulse" />)}</div>
          ) : pendingActions && pendingActions.length > 0 ? (
            <div>
              {(pendingActions as any[]).slice(0, 5).map((action: any) => {
                const statusMeta: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
                  pending: { icon: Clock, color: "#F5A623", bg: "#FEF3E2" },
                  approved: { icon: CheckCircle, color: "#3DB855", bg: "#E8F5EB" },
                  auto_executed: { icon: Zap, color: "#007AFF", bg: "#E5F0FF" },
                  error: { icon: AlertCircle, color: "#E85D8A", bg: "#FDE8F0" },
                };
                const sm = statusMeta[action.status] || statusMeta.pending;
                const SIcon = sm.icon;
                return (
                  <div key={action.id} className="flex items-start gap-3 py-3 border-b border-[#F0F0F0] last:border-0">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: sm.bg }}>
                      <SIcon className="h-3.5 w-3.5" style={{ color: sm.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#111111] leading-tight">{action.title}</p>
                      {action.description && <p className="text-[12px] text-[#888888] mt-0.5 line-clamp-2">{action.description}</p>}
                    </div>
                    {action.status === "pending" && (
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => approveMutation.mutate({ actionId: action.id })} className="text-[11px] font-semibold text-white bg-[#111111] rounded-md px-2.5 py-1 hover:bg-[#333333] active:scale-95 transition-all">Approve</button>
                        <button onClick={() => rejectMutation.mutate({ actionId: action.id })} className="text-[11px] font-semibold text-[#888888] bg-[#F5F5F5] rounded-md px-2.5 py-1 hover:bg-[#E8E8E8] active:scale-95 transition-all">Dismiss</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-8 w-8 text-[#3DB855] mb-2" />
              <p className="text-[13px] font-semibold text-[#111111]">All caught up</p>
              <p className="text-[12px] text-[#AAAAAA] mt-0.5">No pending actions right now</p>
            </div>
          )}
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-4">
          <h3 className="text-[14px] font-bold text-[#111111] mb-2">Quick Access</h3>
          <div className="space-y-0.5">
            {[
              { label: "Programs & Events", path: "/programs", icon: Flag },
              { label: "Advertising", path: "/advertising", icon: BarChart3 },
              { label: "Members", path: "/list/members", icon: UserCheck },
              { label: "AI Analysis", path: "/intelligence", icon: Sparkles },
              { label: "Reports", path: "/intelligence/reports", icon: Calendar },
            ].map((link) => {
              const Icon = link.icon;
              return (
                <button key={link.path} onClick={() => setLocation(link.path)}
                  className="flex items-center gap-2.5 w-full rounded-lg px-2 py-1.5 text-[12px] text-[#555555] hover:bg-[#F5F5F5] hover:text-[#111111] transition-colors text-left"
                >
                  <Icon className="h-3.5 w-3.5 text-[#AAAAAA]" />
                  <span>{link.label}</span>
                  <ArrowRight className="h-3 w-3 text-[#CCCCCC] ml-auto" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
