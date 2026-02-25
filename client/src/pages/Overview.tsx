import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Target, DollarSign, BarChart3, Users, Sparkles, Share2, Wallet,
  ChevronRight, Loader2, TrendingUp, TrendingDown, Minus,
  Instagram, MessageSquare, Zap, Globe, Settings,
} from "lucide-react";
import { Link } from "wouter";

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

function StatCard({
  label, value, sub, trend, color,
}: { label: string; value: string; sub?: string; trend?: "up" | "down" | "flat"; color: string }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-muted-foreground";
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className={`h-1 w-10 rounded-full mb-4 ${color}`} />
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${trendColor}`}>
            <Icon className="h-3 w-3" />
            <span>{sub}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── section nav cards ─────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    group: "Marketing & Programs",
    items: [
      { label: "Strategic Campaigns", href: "/campaigns/strategic", icon: Target, desc: "Category-level campaign view" },
      { label: "Meta Ads", href: "/campaigns/meta-ads", icon: Share2, desc: "Live ad performance & spend" },
      { label: "AI Actions", href: "/intelligence/ai-actions", icon: Sparkles, desc: "Pending approvals & auto-executed" },
      { label: "Performance", href: "/intelligence/performance", icon: BarChart3, desc: "KPIs, ROAS, conversion rates" },
      { label: "Budget Manager", href: "/budget", icon: Wallet, desc: "Spend tracking & allocation" },
    ],
  },
  {
    group: "Audience",
    items: [
      { label: "Members", href: "/list/members", icon: Users, desc: "Full member database" },
      { label: "Leads", href: "/list/leads", icon: Target, desc: "Email captures & lead pipeline" },
      { label: "Guests", href: "/list/guests", icon: Users, desc: "Trial & walk-in guest list" },
      { label: "Announcements", href: "/communication/announcements", icon: MessageSquare, desc: "Broadcast messages" },
      { label: "Automations", href: "/communication/automations", icon: Zap, desc: "Triggered marketing flows" },
    ],
  },
  {
    group: "Website & Settings",
    items: [
      { label: "Instagram", href: "/website/instagram", icon: Instagram, desc: "Feed & analytics" },
      { label: "Site Control", href: "/website/site-control", icon: Globe, desc: "Landing page & CMS" },
      { label: "Integrations", href: "/settings/integrations", icon: Settings, desc: "Meta, Acuity, Boomerang, Encharge" },
    ],
  },
];

// ── component ─────────────────────────────────────────────────────────────────
export default function Overview() {
  const { data: categories, isLoading: catLoading } = trpc.campaigns.getCategorySummary.useQuery();
  const { data: memberStats, isLoading: memLoading } = trpc.members.getStats.useQuery();
  const { data: syncStatus } = trpc.autonomous.getSyncStatus.useQuery();
  const { data: approvalCards } = trpc.autonomous.getApprovalCards.useQuery();
  const { data: emailStats } = trpc.emailCapture.getStats.useQuery();

  const isLoading = catLoading || memLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const totalSpend = categories?.reduce((s, c) => s + c.totalSpend, 0) ?? 0;
  const totalBudget = categories?.reduce((s, c) => s + c.totalBudget, 0) ?? 0;
  const activeCampaigns = categories?.reduce((s, c) => s + c.activeCampaigns, 0) ?? 0;
  const pendingApprovals = approvalCards?.length ?? 0;

  const lastSync = syncStatus?.[0]?.lastSyncAt
    ? new Date(syncStatus[0].lastSyncAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Not synced";

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Golf VX Arlington Heights — all systems at a glance
            </p>
          </div>
          {pendingApprovals > 0 && (
            <Link href="/intelligence/ai-actions">
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-pointer hover:bg-amber-500/30 transition-colors px-3 py-1.5">
                <Sparkles className="h-3 w-3 mr-1.5" />
                {pendingApprovals} action{pendingApprovals > 1 ? "s" : ""} awaiting approval
              </Badge>
            </Link>
          )}
        </div>

        {/* KPI Strip */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active Programs" value={String(activeCampaigns)} sub="running now" trend="flat" color="bg-primary" />
          <StatCard label="Total Spend" value={fmt(totalSpend)} sub={`of ${fmt(totalBudget)} budget`} trend="up" color="bg-orange-500" />
          <StatCard label="Members" value={String(memberStats?.totalMembers ?? "—")} sub={`${memberStats?.activeMembers ?? 0} active`} trend="up" color="bg-green-500" />
          <StatCard label="Leads" value={String(emailStats?.total ?? "—")} sub={`${emailStats?.byStatus?.new ?? 0} new`} trend="up" color="bg-blue-500" />
        </div>

        {/* Last sync info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
          Last data sync: {lastSync}
        </div>

        {/* Section nav */}
        {NAV_SECTIONS.map((section) => (
          <div key={section.group} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {section.group}
            </h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {section.items.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                          <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}

      </div>
    </DashboardLayout>
  );
}
