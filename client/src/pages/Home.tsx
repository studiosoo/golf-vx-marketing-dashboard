import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Target, DollarSign, BarChart3, Loader2, ChevronRight, RefreshCw, Users, Sparkles, Share2, Wallet, CheckCircle2, XCircle, ArrowRight, Clock, Plus, Trash2, Check, Mail, TrendingUp, MousePointerClick, Trophy, Calendar } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type Urgency = "URGENT" | "TODAY" | "THIS WEEK";

// ─── Static data ──────────────────────────────────────────────────────────────
const KPI_BARS = [
  {
    label: "Membership Acquisition",
    value: "Loading...",
    progress: 0,
    color: "bg-[#ef9253]",
    badge: "Loading...",
    badgeColor: "text-[#ef9253]",
    goal: "Goal: 300 members (2-yr)",
    href: "/audience/members",
  },
  {
    label: "Trial Conversion",
    value: "18.5%",
    progress: 74,
    color: "bg-[#5daf68]",
    badge: "+2.1% vs last month",
    badgeColor: "text-[#5daf68]",
    goal: "Goal: 25%",
    href: "/intelligence/performance",
  },
  {
    label: "Member Retention",
    value: "Loading...",
    progress: 0,
    color: "bg-[#5daf68]",
    badge: "Loading...",
    badgeColor: "text-muted-foreground",
    goal: "Goal: retain 106 members",
    href: "/audience/members",
  },
  {
    label: "Drive Day Clinic",
    value: "Loading...",
    progress: 0,
    color: "bg-[#a87fbe]",
    badge: "Loading...",
    badgeColor: "text-muted-foreground",
    goal: "Goal: 60 attendees",
    href: "/programs",
  },
  {
    label: "B2B Events",
    value: "Loading...",
    progress: 0,
    color: "bg-[#76addc]",
    badge: "Goal: 1/month",
    badgeColor: "text-[#76addc]",
    goal: "Goal: 1",
    href: "/campaigns",
  },
];

const STATIC_CAMPAIGNS = [
  { name: "Trial Conversion", spend: 800, budget: 1200 },
  { name: "Membership Acq.", spend: 320, budget: 1500 },
  { name: "Member Retention", spend: 110, budget: 400 },
  { name: "B2B Sales", spend: 91, budget: 300 },
];

const URGENCY_STYLES: Record<Urgency, string> = {
  URGENT: "bg-red-500/15 text-red-400 border border-red-500/30",
  TODAY: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  "THIS WEEK": "bg-muted/60 text-muted-foreground border border-border",
};

const CATEGORY_OPTIONS = [
  { value: "Campaigns", path: "/campaigns" },
  { value: "Communication", path: "/communication/announcements" },
  { value: "Programs", path: "/programs" },
  { value: "Website", path: "/website/site-control" },
  { value: "Intelligence", path: "/intelligence/reports" },
  { value: "Members", path: "/audience/members" },
  { value: "General", path: "/overview" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const { data: categories, isLoading } = trpc.campaigns.getCategorySummary.useQuery();
  const { data: pendingActions } = trpc.autonomous.getApprovalCards.useQuery();
  const { data: toastSummary } = trpc.revenue.getToastSummary.useQuery();
  const { data: strategicKPIs } = trpc.intelligence.getStrategicKPIs.useQuery();
  const { data: previewSnapshot } = trpc.preview.getSnapshot.useQuery();
  const { data: driveDayData } = trpc.campaigns.getDriveDaySessions.useQuery();
  const syncMutation = trpc.autonomous.syncAllData.useMutation();
  const utils = trpc.useUtils();
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [dismissingId, setDismissingId] = useState<number | null>(null);
  const [, setLocation] = useLocation();

  // Priorities DB state
  const { data: dbPriorities, isLoading: prioritiesLoading } = trpc.priorities.list.useQuery();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newUrgency, setNewUrgency] = useState<Urgency>("TODAY");

  const createPriority = trpc.priorities.create.useMutation({
    onSuccess: () => {
      utils.priorities.list.invalidate();
      setNewTitle("");
      setNewCategory("General");
      setNewUrgency("TODAY");
      setShowAddForm(false);
      toast.success("Priority added");
    },
    onError: (err) => toast.error(err.message),
  });

  const completePriority = trpc.priorities.complete.useMutation({
    onMutate: async ({ id, completed }) => {
      await utils.priorities.list.cancel();
      const prev = utils.priorities.list.getData();
      utils.priorities.list.setData(undefined, (old) =>
        old?.map((p) => p.id === id ? { ...p, completedAt: completed ? Date.now() : null } : p)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.priorities.list.setData(undefined, ctx.prev);
      toast.error("Failed to update");
    },
    onSettled: () => utils.priorities.list.invalidate(),
  });

  const deletePriority = trpc.priorities.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.priorities.list.cancel();
      const prev = utils.priorities.list.getData();
      utils.priorities.list.setData(undefined, (old) => old?.filter((p) => p.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.priorities.list.setData(undefined, ctx.prev);
      toast.error("Failed to delete");
    },
    onSettled: () => utils.priorities.list.invalidate(),
  });

  const approveMutation = trpc.autonomous.approveAction.useMutation({
    onSuccess: (result) => {
      utils.autonomous.getApprovalCards.invalidate();
      utils.autonomous.getAutoExecuted.invalidate();
      if (result.success) {
        toast.success("Action approved and executed");
      } else {
        const errMsg = (result.executionResult as any)?.error ?? "Execution failed";
        toast.error(`Execution failed: ${errMsg}`);
      }
      setApprovingId(null);
    },
    onError: (err) => { toast.error(err.message); setApprovingId(null); },
  });

  const dismissMutation = trpc.autonomous.rejectAction.useMutation({
    onSuccess: () => {
      utils.autonomous.getApprovalCards.invalidate();
      toast.success("Action dismissed");
      setDismissingId(null);
    },
    onError: (err) => { toast.error(err.message); setDismissingId(null); },
  });

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
      utils.invalidate();
      toast.success("All marketing data synced successfully!");
    } catch (error: any) {
      toast.error(`Sync failed: ${error.message}`);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (ts: Date | string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handlePriorityClick = (path: string) => {
    setLocation(path);
  };

  const getCategoryPath = (category: string): string => {
    return CATEGORY_OPTIONS.find((c) => c.value === category)?.path ?? "/overview";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Calculate totals from categories
  const totalSpend = categories?.reduce((sum, c) => sum + c.totalSpend, 0) ?? 0;
  const totalBudget = categories?.reduce((sum, c) => sum + c.totalBudget, 0) ?? 0;

  const remaining = totalBudget - totalSpend;
  const spentPct = totalBudget > 0 ? Math.round((totalSpend / totalBudget) * 100) : 0;
  const remainingPct = 100 - spentPct;

  const campaignRows =
    categories && categories.length > 0
      ? categories.map((c) => ({ name: c.name, spend: c.totalSpend, budget: c.totalBudget }))
      : STATIC_CAMPAIGNS;

  // Build live KPI bars with real data from strategicKPIs
  const b2bCount = strategicKPIs?.corporateEvents?.current ?? null;
  const customerMembers = strategicKPIs?.membershipAcquisition?.current ?? null;
  const memberGoal = strategicKPIs?.membershipAcquisition?.target ?? 300;
  const memberRemaining = strategicKPIs?.membershipAcquisition?.remaining ?? null;
  const allAccess = strategicKPIs?.membershipAcquisition?.breakdown?.allAccess ?? 0;
  const swingSaver = strategicKPIs?.membershipAcquisition?.breakdown?.swingSaver ?? 0;

  const liveKpiBars = KPI_BARS.map((kpi) => {
    if (kpi.label === "B2B Events" && b2bCount !== null) {
      const progress = Math.min(b2bCount * 100, 100);
      return {
        ...kpi,
        value: `${b2bCount} booked`,
        progress,
        badge: b2bCount >= 1 ? "Goal met! ✓" : "Goal: 1/month",
        badgeColor: b2bCount >= 1 ? "text-green-500" : "text-[#76addc]",
      };
    }
    if (kpi.label === "Membership Acquisition" && customerMembers !== null) {
      const progress = Math.min((customerMembers / 300) * 100, 100);
      const newThisMonth = strategicKPIs?.membershipAcquisition?.newThisMonth ?? 0;
      const newLastMonth = strategicKPIs?.membershipAcquisition?.newLastMonth ?? 0;
      const momDiff = newThisMonth - newLastMonth;
      const totalMRR = (strategicKPIs as any)?.totalMRR ?? 0;
      const mrrDisplay = totalMRR > 0 ? ` · MRR: $${Math.round(totalMRR).toLocaleString()}` : '';
      return {
        ...kpi,
        value: `${customerMembers} / 300`,
        progress,
        badge: newThisMonth > 0 ? `+${newThisMonth} this month${momDiff >= 0 ? ` (↑${momDiff} vs last)` : ` (↓${Math.abs(momDiff)} vs last)`}` : `${300 - customerMembers} more to goal`,
        badgeColor: newThisMonth > 0 ? "text-green-500" : "text-[#ef9253]",
        goal: `AA: ${allAccess} · SS: ${swingSaver}${mrrDisplay}`,
      };
    }
    if (kpi.label === "Member Retention" && customerMembers !== null) {
      // Retention = how many of the 106 active members are still active
      // Until Boomerang data is fully synced, show current active count vs 106 baseline
      const RETENTION_BASE = 106;
      const retentionRate = Math.min(Math.round((customerMembers / RETENTION_BASE) * 100), 100);
      return {
        ...kpi,
        value: `${customerMembers} / ${RETENTION_BASE} active`,
        progress: retentionRate,
        badge: `${retentionRate}% retention rate`,
        badgeColor: retentionRate >= 90 ? "text-green-500" : retentionRate >= 75 ? "text-yellow-500" : "text-red-400",
        goal: `${RETENTION_BASE - customerMembers > 0 ? `${RETENTION_BASE - customerMembers} churned` : 'All members retained'} · Boomerang sync pending`,
      };
    }
    if (kpi.label === "Drive Day Clinic" && driveDayData) {
      const totalReg = driveDayData.overall.totalRegistrations;
      const revenue = driveDayData.overall.revenueCollected;
      const DRIVE_DAY_GOAL = 60; // 3 sessions × 20 attendees goal
      const progress = Math.min((totalReg / DRIVE_DAY_GOAL) * 100, 100);
      const completedSessions = driveDayData.sessions.filter(s => s.totalRegistrations > 0).length;
      return {
        ...kpi,
        value: `${totalReg} registered`,
        progress,
        badge: `$${revenue.toFixed(0)} revenue · ${completedSessions}/3 sessions`,
        badgeColor: "text-[#a87fbe]",
        goal: `Paid: ${driveDayData.overall.paidAttendees} · Members: ${driveDayData.overall.memberAttendees}`,
      };
    }
    return kpi;
  });

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Split priorities: active vs completed
  const activePriorities = dbPriorities?.filter((p) => !p.completedAt) ?? [];
  const completedPriorities = dbPriorities?.filter((p) => p.completedAt) ?? [];
  const doneCount = completedPriorities.length;
  const totalCount = (dbPriorities?.length ?? 0);

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Marketing <span className="text-primary">HQ</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Golf VX Arlington Heights — Campaign Command Center
            </p>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? "Syncing..." : "Sync All Data"}
          </Button>
        </div>

        {/* ── Section 0: Revenue KPI ── */}
        {toastSummary && (
          <Link href="/revenue">
            <Card className="border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-4">
                {/* Mobile: stacked, Desktop: side-by-side */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">This Month's Revenue</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(toastSummary.thisMonthRevenue)}</p>
                    </div>
                  </div>
                  {/* Mobile: 3-col grid, Desktop: inline flex */}
                  <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-6 text-sm">
                    <div className="sm:text-right">
                      <p className="text-xs text-muted-foreground">Last Month</p>
                      <p className="font-semibold text-foreground text-sm">{formatCurrency(toastSummary.lastMonthRevenue)}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs text-muted-foreground">Orders</p>
                      <p className="font-semibold text-foreground text-sm">{toastSummary.thisMonthOrders.toLocaleString()}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs text-muted-foreground">MoM</p>
                      <p className={`font-semibold text-sm ${
                        toastSummary.lastMonthRevenue > 0
                          ? toastSummary.thisMonthRevenue >= toastSummary.lastMonthRevenue
                            ? 'text-green-400'
                            : 'text-red-400'
                          : 'text-muted-foreground'
                      }`}>
                        {toastSummary.lastMonthRevenue > 0
                          ? `${toastSummary.thisMonthRevenue >= toastSummary.lastMonthRevenue ? '+' : ''}${(((toastSummary.thisMonthRevenue - toastSummary.lastMonthRevenue) / toastSummary.lastMonthRevenue) * 100).toFixed(1)}%`
                          : '—'
                        }
                      </p>
                    </div>
                    <ChevronRight className="hidden sm:block h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* ── Section 1: KPI Progress Bars ── */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {liveKpiBars.map((kpi) => (
            <Link key={kpi.label} href={kpi.href}>
              <Card className="hover:bg-muted/40 transition-colors cursor-pointer h-full">
                <CardContent className="pt-5 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground font-medium">{kpi.label}</p>
                    <span className={`text-xs font-semibold ${kpi.badgeColor}`}>{kpi.badge}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${kpi.color} transition-all duration-500`}
                      style={{ width: `${kpi.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Math.round(kpi.progress)}%</span>
                    <span>{kpi.goal}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* ── Section 2: Budget Snapshot + AI Recommendation ── */}
        <div className="grid gap-4 lg:grid-cols-5">

          {/* Budget Snapshot – col-span-3 */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Budget Overview</CardTitle>
              <Link href="/budget" className="text-xs text-primary hover:underline flex items-center gap-1">
                Manage <ChevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Total Budget</p>
                  <p className="font-bold text-foreground">{formatCurrency(totalBudget)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Total Spent</p>
                  <p className="font-bold text-[#ef9253]">{formatCurrency(totalSpend)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Remaining</p>
                  <p className="font-bold text-[#5daf68]">{formatCurrency(remaining)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
                  <div className="h-full bg-[#ef9253] transition-all duration-500" style={{ width: `${spentPct}%` }} />
                  <div className="h-full bg-[#5daf68] transition-all duration-500" style={{ width: `${remainingPct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{spentPct}% of budget used</p>
              </div>
              <div className="space-y-2 pt-1">
                {campaignRows.map((row) => {
                  const pct = row.budget > 0 ? Math.round((row.spend / row.budget) * 100) : 0;
                  return (
                    <div key={row.name} className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground w-36 truncate text-xs">{row.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-20 text-right">
                        {formatCurrency(row.spend)} / {formatCurrency(row.budget)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendation – col-span-2 */}
          <Card className="lg:col-span-2 border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-base font-semibold">AI Recommendation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!pendingActions || pendingActions.length === 0 ? (
                <div className="py-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">All clear!</p>
                  <p className="text-xs text-muted-foreground mt-1">No actions awaiting approval</p>
                </div>
              ) : (() => {
                const action = pendingActions[0];
                const remaining = pendingActions.length - 1;
                const riskColor = action.riskLevel === "high"
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : action.riskLevel === "medium"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-green-500/20 text-green-400 border-green-500/30";
                return (
                  <>
                    <span className={`inline-block text-xs font-bold border rounded px-2 py-0.5 ${riskColor}`}>
                      {action.riskLevel.toUpperCase()} PRIORITY
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-sm leading-snug mb-2">{action.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                    </div>
                    {action.expectedImpact && (
                      <p className="text-xs font-medium text-amber-400">{action.expectedImpact}</p>
                    )}
                    {action.confidence != null && (
                      <p className="text-xs text-muted-foreground">{action.confidence}% confidence</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3 gap-1"
                        onClick={() => { setApprovingId(action.id); approveMutation.mutate({ actionId: action.id }); }}
                        disabled={approvingId === action.id || dismissingId === action.id}
                      >
                        {approvingId === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                        APPROVE
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 px-3 gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => { setDismissingId(action.id); dismissMutation.mutate({ actionId: action.id }); }}
                        disabled={approvingId === action.id || dismissingId === action.id}
                      >
                        {dismissingId === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                        DISMISS
                      </Button>
                    </div>
                    {remaining > 0 && (
                      <Link
                        href="/intelligence/ai-actions"
                        className="text-xs text-primary hover:underline flex items-center gap-1 pt-1"
                      >
                        {remaining} more action{remaining > 1 ? "s" : ""} awaiting review <ChevronRight className="h-3 w-3" />
                      </Link>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* ── Section 2b: Last Email Sent + Top Funnel ── */}
        {(previewSnapshot?.lastEmailSent || previewSnapshot?.topFunnel) && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {previewSnapshot?.lastEmailSent && (
              <Link href="/email-campaigns">
                <Card className="hover:bg-muted/40 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                        <Mail className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Last Email Sent</p>
                        <p className="font-semibold text-foreground text-sm leading-snug truncate">
                          {previewSnapshot.lastEmailSent.subject || previewSnapshot.lastEmailSent.name}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {previewSnapshot.lastEmailSent.sentAt && (
                            <span>{new Date(previewSnapshot.lastEmailSent.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          )}
                          {previewSnapshot.lastEmailSent.delivered > 0 && (
                            <span>{previewSnapshot.lastEmailSent.delivered.toLocaleString()} delivered</span>
                          )}
                          {previewSnapshot.lastEmailSent.openRate > 0 && (
                            <span className="text-green-400">{previewSnapshot.lastEmailSent.openRate.toFixed(1)}% open rate</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}
            {previewSnapshot?.topFunnel && (
              <Link href="/funnels">
                <Card className="hover:bg-muted/40 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-yellow-500/10 rounded-lg shrink-0">
                        <MousePointerClick className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Top Funnel This Month</p>
                        <p className="font-semibold text-foreground text-sm leading-snug truncate">
                          {previewSnapshot.topFunnel.name}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="text-yellow-500 font-medium">
                            {previewSnapshot.topFunnel.submissionsThisMonth} opt-ins this month
                          </span>
                          <span>{previewSnapshot.topFunnel.optInCount.toLocaleString()} total</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        )}

        {/* ── Section 2c: Drive Day Clinic KPI ── */}
        {driveDayData && driveDayData.overall.totalRegistrations > 0 && (
          <Link href="/programs">
            <Card className="border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <Trophy className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Drive Day Clinic Series</p>
                      <p className="text-2xl font-bold text-foreground">{driveDayData.overall.totalRegistrations} Registered</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-6 text-sm">
                    <div className="sm:text-right">
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="font-semibold text-foreground text-sm">{driveDayData.overall.paidAttendees}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs text-muted-foreground">Members</p>
                      <p className="font-semibold text-foreground text-sm">{driveDayData.overall.memberAttendees}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="font-semibold text-amber-400 text-sm">${driveDayData.overall.revenueCollected.toLocaleString()}</p>
                    </div>
                    <ChevronRight className="hidden sm:block h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                {/* Session mini-breakdown */}
                <div className="mt-3 pt-3 border-t border-amber-500/20 grid grid-cols-3 gap-2">
                  {driveDayData.sessions.map((s) => (
                    <div key={s.name} className="text-center">
                      <p className="text-xs text-muted-foreground truncate">{s.day}</p>
                      <p className="text-sm font-semibold text-foreground">{s.totalRegistrations}</p>
                      <p className="text-xs text-amber-400">${s.revenueCollected}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* ── Section 3: Today's Priorities (DB-backed) ── */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold">Today's Priorities</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {todayStr} &nbsp;·&nbsp; {doneCount}/{totalCount} done
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs"
              onClick={() => setShowAddForm((v) => !v)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </CardHeader>

          <CardContent className="space-y-1">
            {/* ── Add form ── */}
            {showAddForm && (
              <div className="mb-3 p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                <Input
                  placeholder="What needs to be done?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTitle.trim()) {
                      createPriority.mutate({
                        title: newTitle.trim(),
                        category: newCategory,
                        path: getCategoryPath(newCategory),
                        urgency: newUrgency,
                      });
                    }
                  }}
                  className="h-8 text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Select value={newUrgency} onValueChange={(v) => setNewUrgency(v as Urgency)}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="URGENT">URGENT</SelectItem>
                      <SelectItem value="TODAY">TODAY</SelectItem>
                      <SelectItem value="THIS WEEK">THIS WEEK</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="h-8 text-xs px-3"
                    disabled={!newTitle.trim() || createPriority.isPending}
                    onClick={() => {
                      if (!newTitle.trim()) return;
                      createPriority.mutate({
                        title: newTitle.trim(),
                        category: newCategory,
                        path: getCategoryPath(newCategory),
                        urgency: newUrgency,
                      });
                    }}
                  >
                    {createPriority.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Loading state ── */}
            {prioritiesLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* ── Empty state ── */}
            {!prioritiesLoading && activePriorities.length === 0 && completedPriorities.length === 0 && (
              <div className="py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">All clear!</p>
                <p className="text-xs text-muted-foreground mt-1">No priorities yet — click Add to create one</p>
              </div>
            )}

            {/* ── Active priorities ── */}
            {activePriorities.map((task) => (
              <div
                key={task.id}
                className="w-full flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60 group"
              >
                {/* Complete checkbox */}
                <button
                  onClick={() => completePriority.mutate({ id: task.id, completed: true })}
                  className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border border-border hover:border-green-400 hover:bg-green-400/10 transition-colors flex items-center justify-center"
                  title="Mark complete"
                >
                  <Check className="h-3 w-3 text-transparent group-hover:text-green-400/60 transition-colors" />
                </button>

                {/* Label + created date — click to navigate */}
                <button
                  onClick={() => handlePriorityClick(task.path)}
                  className="flex-1 min-w-0 text-left"
                >
                  <span className="text-sm text-foreground leading-snug block">{task.title}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3 w-3 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground/60">
                      Added {formatDate(task.createdAt)}
                      {task.createdBy && ` · ${task.createdBy}`}
                    </span>
                  </div>
                </button>

                {/* Badges + navigate arrow + delete */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold rounded px-2 py-0.5 ${URGENCY_STYLES[task.urgency as Urgency]}`}>
                    {task.urgency}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:block">{task.category}</span>
                  <button
                    onClick={() => handlePriorityClick(task.path)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Go to section"
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </button>
                  <button
                    onClick={() => deletePriority.mutate({ id: task.id })}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400/60 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* ── Completed priorities (collapsed) ── */}
            {completedPriorities.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground/60 px-3 mb-1">
                  {completedPriorities.length} completed
                </p>
                {completedPriorities.map((task) => (
                  <div
                    key={task.id}
                    className="w-full flex items-start gap-3 rounded-lg px-3 py-2 opacity-50 group"
                  >
                    {/* Uncheck */}
                    <button
                      onClick={() => completePriority.mutate({ id: task.id, completed: false })}
                      className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border border-green-500/50 bg-green-500/20 flex items-center justify-center"
                      title="Mark incomplete"
                    >
                      <Check className="h-3 w-3 text-green-400" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-muted-foreground line-through leading-snug block">{task.title}</span>
                      <span className="text-xs text-muted-foreground/50">
                        Done {task.completedAt ? formatDate(new Date(task.completedAt)) : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => deletePriority.mutate({ id: task.id })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400/60 hover:text-red-400 mt-0.5"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
