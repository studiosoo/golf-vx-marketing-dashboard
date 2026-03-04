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

  // Revenue data
  const { data: toastSummary } = trpc.revenue.getToastSummary.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  // Programs data
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
            <p className="text-sm text-[#888888] mt-1">Arlington Heights — Marketing Command Center</p>
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
  const activePrograms = (programs ?? []).filter((p: any) => p.status === "active").slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#111111] leading-tight">{greeting}, {firstName}</h1>
          <p className="text-[13px] text-[#888888] mt-0.5">
            Golf VX Arlington Heights — {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
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

      {/* ── Row 1: Core KPIs (Members + MRR + Revenue + Budget + AI) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Active Members */}
        <button
          onClick={() => setLocation("/list/members")}
          className="text-left bg-white rounded-xl border border-[#E0E0E0] p-4 hover:shadow-md transition-shadow duration-150 group"
        >
          <div className="h-8 w-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center mb-3">
            <Users className="h-4 w-4 text-[#111111]" />
          </div>
          <p className="text-[26px] font-bold text-[#111111] leading-none tracking-tight">
            {snapLoading ? "—" : fmt(members?.total ?? 0)}
          </p>
          <p className="text-[12px] text-[#888888] mt-1">Active Members</p>
          <p className="text-[11px] text-[#AAAAAA] mt-0.5">
            {members ? `${members.newThisMonth > 0 ? `+${members.newThisMonth}` : members.newThisMonth} this month` : "Goal: 300"}
          </p>
        </button>

        {/* MRR */}
        <button
          onClick={() => setLocation("/revenue")}
          className="text-left bg-white rounded-xl border border-[#E0E0E0] p-4 hover:shadow-md transition-shadow duration-150 group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-[#111111]" />
            </div>
            {revenue?.mom !== undefined && (
              <span className={cn("flex items-center gap-0.5 text-[11px] font-medium", revenue.mom > 0 ? "text-[#3DB855]" : revenue.mom < 0 ? "text-red-500" : "text-[#AAAAAA]")}>
                {revenue.mom > 0 ? <TrendingUp className="h-3 w-3" /> : revenue.mom < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {Math.abs(revenue.mom).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-[26px] font-bold text-[#111111] leading-none tracking-tight">
            {snapLoading ? "—" : fmtCurrency(members?.mrr ?? 0)}
          </p>
          <p className="text-[12px] text-[#888888] mt-1">Monthly Recurring Revenue</p>
          <p className="text-[11px] text-[#AAAAAA] mt-0.5">MoM change</p>
        </button>

        {/* Toast Revenue MTD */}
        <button
          onClick={() => setLocation("/revenue")}
          className="text-left bg-white rounded-xl border border-[#E0E0E0] p-4 hover:shadow-md transition-shadow duration-150 group"
        >
          <div className="h-8 w-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center mb-3">
            <ShoppingBag className="h-4 w-4 text-[#111111]" />
          </div>
          <p className="text-[26px] font-bold text-[#111111] leading-none tracking-tight">
            {toastSummary ? fmtCurrency((toastSummary as any).thisMonthRevenue ?? 0) : "—"}
          </p>
          <p className="text-[12px] text-[#888888] mt-1">Toast Revenue (MTD)</p>
          <p className="text-[11px] text-[#AAAAAA] mt-0.5">
            {toastSummary ? `${(toastSummary as any).thisMonthOrders ?? 0} orders this month` : "Updated 5 AM EST"}
          </p>
        </button>

        {/* Budget Utilization */}
        <button
          onClick={() => setLocation("/campaigns/strategic")}
          className="text-left bg-white rounded-xl border border-[#E0E0E0] p-4 hover:shadow-md transition-shadow duration-150 group"
        >
          <div className="h-8 w-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center mb-3">
            <Target className="h-4 w-4 text-[#111111]" />
          </div>
          <p className="text-[26px] font-bold text-[#111111] leading-none tracking-tight">
            {snapLoading ? "—" : `${(budget?.utilization ?? 0).toFixed(0)}%`}
          </p>
          <p className="text-[12px] text-[#888888] mt-1">Budget Utilization</p>
          <p className="text-[11px] text-[#AAAAAA] mt-0.5">
            {budget ? `${fmtCurrency(budget.spent)} of ${fmtCurrency(budget.total)}` : ""}
          </p>
        </button>

        {/* Pending AI Actions */}
        <button
          onClick={() => setLocation("/intelligence/ai-actions")}
          className={cn(
            "text-left rounded-xl border p-4 hover:shadow-md transition-shadow duration-150 group",
            pendingCount > 0 ? "bg-[#FFFBEA] border-[#F5C72C]/60" : "bg-white border-[#E0E0E0]"
          )}
        >
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-3", pendingCount > 0 ? "bg-[#F5C72C]/20" : "bg-[#F5F5F5]")}>
            <Sparkles className="h-4 w-4 text-[#111111]" />
          </div>
          <p className="text-[26px] font-bold text-[#111111] leading-none tracking-tight">
            {actionsLoading ? "—" : fmt(pendingCount)}
          </p>
          <p className="text-[12px] text-[#888888] mt-1">AI Actions Pending</p>
          <p className="text-[11px] text-[#AAAAAA] mt-0.5">{pendingCount > 0 ? "Awaiting approval" : "All caught up"}</p>
        </button>
      </div>

      {/* ── Row 2: Active Programs Strip ── */}
      {activePrograms.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-4">
          <div className="flex items-center justify-between mb-3">
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

      {/* ── Row 3: Strategic Campaigns ── */}
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
            {(strategicOverview ?? []).map((c: any) => {
              const meta = CAMPAIGN_META[c.id] || { label: c.name, color: "#888888", bg: "#F5F5F5", icon: BarChart3 };
              const Icon = meta.icon;
              const budgetPct = c.totalBudget > 0 ? Math.min((c.totalSpend / c.totalBudget) * 100, 100) : 0;
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
                    <div>
                      <p className="text-[16px] font-bold text-[#111111] leading-none">{fmtCurrency(c.totalSpend)}</p>
                      <p className="text-[10px] text-[#AAAAAA] mt-0.5">Spend</p>
                    </div>
                    <div>
                      <p className="text-[16px] font-bold text-[#111111] leading-none">{fmtCurrency(c.totalRevenue)}</p>
                      <p className="text-[10px] text-[#AAAAAA] mt-0.5">Revenue</p>
                    </div>
                    <div>
                      <p className={cn("text-[16px] font-bold leading-none", c.roi >= 0 ? "text-[#3DB855]" : "text-red-500")}>{fmtPct(c.roi)}</p>
                      <p className="text-[10px] text-[#AAAAAA] mt-0.5">ROI</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-[#AAAAAA]">{fmtCurrency(c.totalSpend)} / {fmtCurrency(c.totalBudget)}</span>
                      <span className="text-[10px] text-[#888888]">{c.activePrograms} active</span>
                    </div>
                    <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${budgetPct}%`, background: meta.color }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Row 4: AI Actions + Revenue Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending AI Actions */}
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

        {/* Revenue Snapshot + Quick Links */}
        <div className="space-y-3">
          {/* Revenue Snapshot */}
          <div className="bg-white rounded-xl border border-[#E0E0E0] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#111111]" />
                <h3 className="text-[14px] font-bold text-[#111111]">Revenue Snapshot</h3>
              </div>
              <button onClick={() => setLocation("/revenue")} className="text-[12px] text-[#888888] hover:text-[#111111] transition-colors flex items-center gap-1">
                Details <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#888888]">Memberships (MRR)</span>
                <span className="text-[13px] font-bold text-[#111111]">{snapLoading ? "—" : fmtCurrency(members?.mrr ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#888888]">Toast POS (MTD)</span>
                <span className="text-[13px] font-bold text-[#111111]">{toastSummary ? fmtCurrency((toastSummary as any).thisMonthRevenue ?? 0) : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#888888]">All-Time Toast</span>
                <span className="text-[13px] font-bold text-[#111111]">{toastSummary ? fmtCurrency((toastSummary as any).allTimeRevenue ?? 0) : "—"}</span>
              </div>
              <div className="pt-2 border-t border-[#F0F0F0] flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#111111]">MRR + Toast (MTD)</span>
                <span className="text-[14px] font-bold text-[#F5C72C]">
                  {(members?.mrr && toastSummary) ? fmtCurrency((members.mrr) + ((toastSummary as any).thisMonthRevenue ?? 0)) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
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
    </div>
  );
}
