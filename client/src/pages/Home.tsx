import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Target, DollarSign, BarChart3, Loader2, ChevronRight, RefreshCw, Users, Sparkles, Share2, Wallet } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────
type Priority = "URGENT" | "TODAY" | "THIS WEEK";

interface Task {
  id: number;
  label: string;
  priority: Priority;
  category: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────
const KPI_BARS = [
  {
    label: "Membership Growth",
    value: "127 members",
    progress: 42,
    color: "bg-blue-500",
    badge: "+12 this month",
    badgeColor: "text-green-400",
    goal: "Goal: 300",
  },
  {
    label: "Trial Conversion",
    value: "18.5%",
    progress: 74,
    color: "bg-green-500",
    badge: "+2.1% vs last month",
    badgeColor: "text-green-400",
    goal: "Goal: 25%",
  },
  {
    label: "Member Retention",
    value: "92%",
    progress: 97,
    color: "bg-amber-500",
    badge: "Stable",
    badgeColor: "text-muted-foreground",
    goal: "Goal: 95%",
  },
  {
    label: "B2B Events",
    value: "2 booked",
    progress: 50,
    color: "bg-purple-500",
    badge: "+1 new this week",
    badgeColor: "text-green-400",
    goal: "Goal: 4",
  },
];

const STATIC_CAMPAIGNS = [
  { name: "Trial Conversion", spend: 800, budget: 1200 },
  { name: "Membership Acq.", spend: 320, budget: 1500 },
  { name: "Member Retention", spend: 110, budget: 400 },
  { name: "B2B Sales", spend: 91, budget: 300 },
];

const TODAY_TASKS: Task[] = [
  { id: 1, label: "Review Meta Ads CTR — pause 2 underperforming ad sets", priority: "URGENT", category: "Campaigns" },
  { id: 2, label: "Send Winter Clinic reminder email to leads segment", priority: "TODAY", category: "Communication" },
  { id: 3, label: "Confirm B2B event booking for March corporate outing", priority: "TODAY", category: "Programs" },
  { id: 4, label: "Update membership offer copy on site control page", priority: "THIS WEEK", category: "Website" },
  { id: 5, label: "Export monthly revenue report for ownership review", priority: "THIS WEEK", category: "Intelligence" },
];

const PRIORITY_STYLES: Record<Priority, string> = {
  URGENT: "bg-red-500/15 text-red-400 border border-red-500/30",
  TODAY: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  "THIS WEEK": "bg-muted/60 text-muted-foreground border border-border",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const { data: categories, isLoading } = trpc.campaigns.getCategorySummary.useQuery();
  const syncMutation = trpc.autonomous.syncAllData.useMutation();
  const utils = trpc.useUtils();

  const [checkedTasks, setCheckedTasks] = useState<Set<number>>(new Set());

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
      utils.invalidate();
      alert("All marketing data synced successfully!");
    } catch (error: any) {
      alert(`Sync failed: ${error.message}`);
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

  const toggleTask = (id: number) => {
    setCheckedTasks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
  const totalActiveCampaigns = categories?.reduce((sum, c) => sum + c.activeCampaigns, 0) ?? 0;
  const totalCompletedCampaigns = categories?.reduce((sum, c) => sum + c.completedCampaigns, 0) ?? 0;

  const remaining = totalBudget - totalSpend;
  const spentPct = totalBudget > 0 ? Math.round((totalSpend / totalBudget) * 100) : 0;
  const remainingPct = 100 - spentPct;

  const campaignRows =
    categories && categories.length > 0
      ? categories.map((c) => ({ name: c.name, spend: c.totalSpend, budget: c.totalBudget }))
      : STATIC_CAMPAIGNS;

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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

        {/* ── Section 1: KPI Progress Bars ── */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {KPI_BARS.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-5 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-medium">{kpi.label}</p>
                  <span className={`text-xs font-semibold ${kpi.badgeColor}`}>{kpi.badge}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${kpi.color} transition-all duration-500`}
                    style={{ width: `${kpi.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{kpi.progress}%</span>
                  <span>{kpi.goal}</span>
                </div>
              </CardContent>
            </Card>
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
              {/* Totals */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Total Budget</p>
                  <p className="font-bold text-foreground">{formatCurrency(totalBudget)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Total Spent</p>
                  <p className="font-bold text-orange-400">{formatCurrency(totalSpend)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Remaining</p>
                  <p className="font-bold text-green-400">{formatCurrency(remaining)}</p>
                </div>
              </div>

              {/* Stacked bar */}
              <div className="space-y-1">
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
                  <div
                    className="h-full bg-orange-400 transition-all duration-500"
                    style={{ width: `${spentPct}%` }}
                  />
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${remainingPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{spentPct}% of budget used</p>
              </div>

              {/* Campaign rows */}
              <div className="space-y-2 pt-1">
                {campaignRows.map((row) => {
                  const pct = row.budget > 0 ? Math.round((row.spend / row.budget) * 100) : 0;
                  return (
                    <div key={row.name} className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground w-36 truncate text-xs">{row.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
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
              {/* Priority badge */}
              <span className="inline-block text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded px-2 py-0.5">
                HIGH PRIORITY
              </span>

              <div>
                <p className="font-semibold text-foreground text-sm leading-snug mb-2">
                  Pause 2 underperforming Meta ad sets
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ad sets targeting "Golf Beginners 25–34" and "Corporate Events Chicago" are delivering
                  CTR below 0.4% over the last 7 days. Reallocating their combined $85/week budget to
                  the top-performing "Members Lookalike" ad set is projected to improve overall ROAS.
                </p>
              </div>

              <p className="text-xs font-medium text-amber-400">
                Estimated impact: Save ~$85/week
              </p>

              <div className="flex gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3">
                  APPROVE
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8 px-3">
                  DISMISS
                </Button>
              </div>

              <Link
                href="/intelligence"
                className="text-xs text-primary hover:underline flex items-center gap-1 pt-1"
              >
                3 more actions awaiting review <ChevronRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* ── Section 3: Today's Priorities ── */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold">Today's Priorities</CardTitle>
              <CardDescription className="text-xs mt-0.5">{todayStr}</CardDescription>
            </div>
            <span className="text-xs text-muted-foreground">
              {checkedTasks.size}/{TODAY_TASKS.length} done
            </span>
          </CardHeader>
          <CardContent className="space-y-2">
            {TODAY_TASKS.map((task) => {
              const done = checkedTasks.has(task.id);
              return (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-opacity
                    hover:bg-muted/50 ${done ? "opacity-40" : "opacity-100"}`}
                >
                  {/* Checkbox */}
                  <div
                    className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border transition-colors
                      ${done
                        ? "bg-primary border-primary flex items-center justify-center"
                        : "border-border bg-background"
                      }`}
                  >
                    {done && (
                      <svg className="h-2.5 w-2.5 text-primary-foreground" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`flex-1 text-sm text-foreground ${done ? "line-through" : ""}`}
                  >
                    {task.label}
                  </span>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-xs font-semibold rounded px-2 py-0.5 ${PRIORITY_STYLES[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:block">{task.category}</span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
