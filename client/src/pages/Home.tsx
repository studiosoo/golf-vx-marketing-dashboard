import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  Target,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Zap,
  Gift,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  loading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="text-muted-foreground">{icon}</div>
        {trend && trendValue && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend === "up"
                ? "bg-green-500/10 text-green-400"
                : trend === "down"
                ? "bg-red-500/10 text-red-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight size={12} />
            ) : trend === "down" ? (
              <ArrowDownRight size={12} />
            ) : null}
            {trendValue}
          </div>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 bg-muted rounded animate-pulse w-24" />
          <div className="h-4 bg-muted rounded animate-pulse w-32" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
          <div className="text-sm text-muted-foreground">{subtitle || title}</div>
        </>
      )}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: summary, isLoading: summaryLoading, refetch } = trpc.preview.getSnapshot.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: emailSummary, isLoading: emailLoading } = trpc.emailCampaigns.summary.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: funnelSummary, isLoading: funnelLoading } = trpc.funnels.summary.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: giveawayStats, isLoading: giveawayLoading, refetch: refetchGiveaway } = trpc.giveaway.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: lastSyncInfo } = trpc.giveaway.getLastSyncInfo.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();
  const [syncStatus, setSyncStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; message?: string }>({ type: "idle" });

  const syncMutation = trpc.giveaway.sync.useMutation({
    onMutate: () => setSyncStatus({ type: "loading" }),
    onSuccess: (data) => {
      setSyncStatus({
        type: "success",
        message: `${data.message}`,
      });
      utils.giveaway.getStats.invalidate();
      utils.giveaway.getLastSyncInfo.invalidate();
      setTimeout(() => setSyncStatus({ type: "idle" }), 5000);
    },
    onError: (err) => {
      setSyncStatus({ type: "error", message: err.message });
      setTimeout(() => setSyncStatus({ type: "idle" }), 8000);
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Golf VX Marketing Dashboard
          </h1>
          <p className="text-muted-foreground mb-6">
            Sign in to access your marketing intelligence dashboard for Golf VX Arlington Heights.
          </p>
          <a
            href={getLoginUrl()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const isLoading = summaryLoading;
  const members = summary?.members;
  const revenue = summary?.revenue;
  const budget = summary?.budget;
  const campaigns = summary?.campaigns;

  // Top funnel this month
  const topFunnel = funnelSummary
    ? [...funnelSummary].sort((a, b) => (b.submissionCount || 0) - (a.submissionCount || 0))[0]
    : null;

  const totalApplications = giveawayStats?.totalApplications ?? 0;
  const GIVEAWAY_GOAL = 500;
  const giveawayProgress = Math.min((totalApplications / GIVEAWAY_GOAL) * 100, 100);

  const formatLastSync = (ts: unknown) => {
    if (!ts) return "Never synced";
    try {
      return new Date(ts as string).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Golf VX Arlington Heights — Marketing Overview</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-card transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Members"
          value={members ? members.total.toLocaleString() : "—"}
          subtitle={`Goal: ${members?.goal || 300} members`}
          icon={<Users size={20} />}
          trend={members && members.newThisMonth > 0 ? "up" : "neutral"}
          trendValue={members ? `+${members.newThisMonth} this month` : undefined}
          loading={isLoading}
        />
        <KpiCard
          title="Monthly Revenue"
          value={revenue ? `$${revenue.thisMonth.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "—"}
          subtitle="This month"
          icon={<DollarSign size={20} />}
          trend={revenue && revenue.mom > 0 ? "up" : revenue && revenue.mom < 0 ? "down" : "neutral"}
          trendValue={revenue ? `${revenue.mom > 0 ? "+" : ""}${revenue.mom.toFixed(1)}% MoM` : undefined}
          loading={isLoading}
        />
        <KpiCard
          title="Ad Spend"
          value={budget ? `$${Number(budget.spent).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "—"}
          subtitle={`of $${budget ? Number(budget.total).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "—"} budget`}
          icon={<Target size={20} />}
          trend={budget && budget.utilization < 90 ? "neutral" : "up"}
          trendValue={budget ? `${budget.utilization.toFixed(0)}% utilized` : undefined}
          loading={isLoading}
        />
        <KpiCard
          title="Active Campaigns"
          value={campaigns ? campaigns.active : "—"}
          subtitle="Running campaigns"
          icon={<TrendingUp size={20} />}
          loading={isLoading}
        />
      </div>

      {/* Secondary cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* MRR Card */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</span>
          </div>
          {isLoading ? (
            <div className="h-8 bg-muted rounded animate-pulse w-32" />
          ) : (
            <div className="text-3xl font-bold text-primary">
              ${members?.mrr ? members.mrr.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0"}
            </div>
          )}
          {members && !isLoading && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>
                <div className="font-medium text-foreground">{members.allAccessAce}</div>
                <div>All Access</div>
              </div>
              <div>
                <div className="font-medium text-foreground">{members.swingSaver}</div>
                <div>Swing Saver</div>
              </div>
              <div>
                <div className="font-medium text-foreground">{members.pro}</div>
                <div>Pro</div>
              </div>
            </div>
          )}
        </div>

        {/* Last Email Sent */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Last Email Sent</span>
          </div>
          {emailLoading ? (
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded animate-pulse w-40" />
              <div className="h-4 bg-muted rounded animate-pulse w-28" />
            </div>
          ) : emailSummary?.lastSyncedAt ? (
            <>
              <div className="text-base font-semibold text-foreground line-clamp-2 mb-1">
                {emailSummary.sentBroadcasts} broadcasts sent
              </div>
              <div className="text-xs text-muted-foreground">
                Last synced: {new Date(emailSummary.lastSyncedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              {emailSummary.avgOpenRate != null && (
                <div className="mt-2 text-xs text-green-400">
                  {(emailSummary.avgOpenRate * 100).toFixed(1)}% avg open rate
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No emails sent yet</div>
          )}
        </div>

        {/* Top Funnel This Month */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Top Funnel This Month</span>
          </div>
          {funnelLoading ? (
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded animate-pulse w-40" />
              <div className="h-4 bg-muted rounded animate-pulse w-28" />
            </div>
          ) : topFunnel ? (
            <>
              <div className="text-base font-semibold text-foreground line-clamp-2 mb-1">
                {topFunnel.funnelName}
              </div>
              <div className="text-2xl font-bold text-primary">
                {topFunnel.submissionCount || 0}
              </div>
              <div className="text-xs text-muted-foreground">opt-ins</div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No funnel data yet</div>
          )}
        </div>
      </div>

      {/* Member progress bar */}
      {members && !isLoading && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Member Goal Progress</h3>
              <p className="text-sm text-muted-foreground">
                {members.total} of {members.goal} members
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {Math.round((members.total / members.goal) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">of goal</div>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((members.total / members.goal) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0</span>
            <span>{members.goal}</span>
          </div>
        </div>
      )}

      {/* Annual Membership Giveaway Card */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-primary" />
            <h3 className="font-semibold">Annual Membership Giveaway</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              2026
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Sync status indicator */}
            {syncStatus.type === "success" && (
              <div className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle size={12} />
                <span className="hidden sm:inline">{syncStatus.message}</span>
              </div>
            )}
            {syncStatus.type === "error" && (
              <div className="flex items-center gap-1 text-xs text-red-400">
                <AlertCircle size={12} />
                <span className="hidden sm:inline">Sync failed</span>
              </div>
            )}
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncStatus.type === "loading"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Sync from Google Sheets"
            >
              {syncStatus.type === "loading" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              {syncStatus.type === "loading" ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        </div>

        {giveawayLoading ? (
          <div className="space-y-3">
            <div className="h-8 bg-muted rounded animate-pulse w-24" />
            <div className="h-3 bg-muted rounded animate-pulse w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-end gap-3 mb-3">
              <div className="text-3xl font-bold text-foreground">{totalApplications}</div>
              <div className="text-sm text-muted-foreground mb-1">
                of {GIVEAWAY_GOAL} goal applications
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2.5 mb-2">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${giveawayProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mb-3">
              <span>{giveawayProgress.toFixed(1)}% of goal</span>
              <span>{GIVEAWAY_GOAL - totalApplications} remaining</span>
            </div>

            {/* Demographics breakdown */}
            {giveawayStats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-border">
                {Object.entries(giveawayStats.genderDistribution || {})
                  .filter(([k]) => k !== "Unknown")
                  .slice(0, 3)
                  .map(([gender, count]) => (
                    <div key={gender} className="text-xs">
                      <div className="font-medium text-foreground">{count as number}</div>
                      <div className="text-muted-foreground">{gender}</div>
                    </div>
                  ))}
              </div>
            )}

            {/* Last sync info */}
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Auto-syncs at 8am, 2pm, 8pm CST</span>
              <span>Last sync: {formatLastSync(lastSyncInfo)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
