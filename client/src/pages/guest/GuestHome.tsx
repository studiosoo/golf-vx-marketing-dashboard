// Guest version of Home — uses trpc.guest.* public endpoints
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Target, TrendingUp, Mail, Zap, Eye, Lock } from "lucide-react";

export default function GuestHome() {
  const [dateRange] = useState(() => ({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  }));

  const { data: overview, isLoading: overviewLoading } = trpc.guest.getDashboardOverview.useQuery(dateRange);
  const { data: emailSummary } = trpc.guest.getEmailSummary.useQuery();
  const { data: funnelSummary } = trpc.guest.getFunnelSummary.useQuery();

  const kpiCards = [
    {
      label: "Active Members",
      value: overviewLoading ? "..." : (overview?.activeMembers ?? "—"),
      sub: `of ${overview?.totalMembers ?? "?"} total`,
      icon: <Users size={20} className="text-blue-400" />,
      color: "border-blue-500/30",
    },
    {
      label: "Monthly Revenue",
      value: overviewLoading ? "..." : `$${parseFloat(overview?.marketingSpend ?? "0").toLocaleString()}`,
      sub: "This month",
      icon: <DollarSign size={20} className="text-green-400" />,
      color: "border-green-500/30",
    },
    {
      label: "MRR",
      value: overviewLoading ? "..." : `$${Math.round(overview?.monthlyRecurringRevenue ?? 0).toLocaleString()}`,
      sub: "Monthly Recurring Revenue",
      icon: <TrendingUp size={20} className="text-yellow-400" />,
      color: "border-yellow-500/30",
    },
    {
      label: "Active Campaigns",
      value: overviewLoading ? "..." : (overview?.activeCampaignsCount ?? "—"),
      sub: `ROI: ${overview?.overallROI ?? "0"}%`,
      icon: <Target size={20} className="text-purple-400" />,
      color: "border-purple-500/30",
    },
    {
      label: "Email Open Rate",
      value: emailSummary ? `${emailSummary.avgOpenRate.toFixed(1)}%` : "—",
      sub: `${emailSummary?.sentBroadcasts ?? 0} broadcasts sent`,
      icon: <Mail size={20} className="text-orange-400" />,
      color: "border-orange-500/30",
    },
    {
      label: "Funnel Submissions",
      value: funnelSummary ? funnelSummary.reduce((s: number, f: any) => s + Number(f.submissionCount || 0), 0) : "—",
      sub: `${funnelSummary?.length ?? 0} active funnels`,
      icon: <Zap size={20} className="text-cyan-400" />,
      color: "border-cyan-500/30",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Guest notice */}
      <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-4 py-2.5 text-sm text-yellow-300">
        <Eye size={14} />
        <span>You are viewing in <strong>Guest Preview Mode</strong>. All data is read-only. Login to make changes.</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Golf VX Arlington Heights — Marketing Overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.label} className={`bg-card border ${card.color}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{String(card.value)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                </div>
                {card.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Channel Performance */}
      {overview?.channelPerformance && overview.channelPerformance.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Channel Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overview.channelPerformance.slice(0, 5).map((ch: any) => (
                <div key={ch.channelName} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{ch.channelName}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-foreground">${parseFloat(ch.totalRevenue || "0").toLocaleString()}</span>
                    <Badge variant="outline" className="text-xs">
                      {ch.totalCampaigns} campaigns
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disabled action hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-3">
        <Lock size={12} />
        <span>Action buttons (Create, Edit, Delete, Sync) are disabled in guest mode. Login to perform actions.</span>
      </div>
    </div>
  );
}
