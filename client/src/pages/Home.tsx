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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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

      {/* Snapshot KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: Users, label: "Active Members",
            value: snapLoading ? "—" : fmt(members?.total ?? 0),
            sub: members ? `Retention goal: 300 · Acquisition goal: ${fmt(members.acquisitionGoal ?? Math.max(0, 300 - (members.total ?? 0)))} remaining · ${members.newThisMonth} new this month` : undefined,
            trend: undefined as number | undefined, accent: false, path: "/list/members",
          },
          {
            icon: DollarSign, label: "MRR",
            value: snapLoading ? "—" : fmtCurrency(members?.mrr ?? 0),
            sub: revenue ? `Revenue this month: ${fmtCurrency(revenue.thisMonth)}` : undefined,
            trend: revenue?.mom, accent: false, path: "/revenue",
          },
          {
            icon: Target, label: "Budget Utilization",
            value: snapLoading ? "—" : `${(budget?.utilization ?? 0).toFixed(0)}%`,
            sub: budget ? `${fmtCurrency(budget.spent)} of ${fmtCurrency(budget.total)}` : undefined,
            trend: undefined as number | undefined, accent: false, path: "/campaigns/strategic",
          },
          {
            icon: Sparkles, label: "Pending AI Actions",
            value: actionsLoading ? "—" : fmt(pendingCount),
            sub: pendingCount > 0 ? "Awaiting your approval" : "All caught up",
            trend: undefined as number | undefined, accent: pendingCount > 0, path: "/intelligence/ai-actions",
          },
        ].map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.trend === undefined ? null : card.trend > 0 ? TrendingUp : card.trend < 0 ? TrendingDown : Minus;
          return (
            <button
              key={card.label}
              onClick={() => setLocation(card.path)}
              className={cn(
                "text-left w-full bg-white rounded-xl border border-[#E0E0E0] p-4 hover:shadow-md transition-shadow duration-150 group",
                card.accent && "border-[#F5C72C]/60 bg-[#FFFBEA]"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", card.accent ? "bg-[#F5C72C]/20" : "bg-[#F5F5F5]")}>
                  <Icon className="h-4 w-4 text-[#111111]" />
                </div>
                {TrendIcon && card.trend !== undefined && (
                  <span className={cn("flex items-center gap-1 text-[11px] font-medium", card.trend > 0 ? "text-[#3DB855]" : card.trend < 0 ? "text-red-500" : "text-[#AAAAAA]")}>
                    <TrendIcon className="h-3 w-3" />
                    {Math.abs(card.trend).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-[28px] font-bold text-[#111111] leading-none tracking-tight">{card.value}</p>
              <p className="text-[12px] text-[#888888] mt-1">{card.label}</p>
              {card.sub && <p className="text-[11px] text-[#AAAAAA] mt-0.5">{card.sub}</p>}
            </button>
          );
        })}
      </div>

      {/* 4-Campaign KPI grid */}
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

      {/* Bottom row */}
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

        {/* Quick links */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-4">
          <h3 className="text-[14px] font-bold text-[#111111] mb-3">Quick Access</h3>
          <div className="space-y-1">
            {[
              { label: "Programs & Events", path: "/programs", icon: Flag },
              { label: "Meta Advertising", path: "/campaigns/meta-ads", icon: BarChart3 },
              { label: "Members", path: "/list/members", icon: UserCheck },
              { label: "Revenue & Goals", path: "/revenue", icon: DollarSign },
              { label: "AI Analysis", path: "/intelligence", icon: Sparkles },
              { label: "AI Workspace", path: "/workspace", icon: Zap },
            ].map((link) => {
              const Icon = link.icon;
              return (
                <button key={link.path} onClick={() => setLocation(link.path)}
                  className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-[13px] text-[#555555] hover:bg-[#F5F5F5] hover:text-[#111111] transition-colors text-left"
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
