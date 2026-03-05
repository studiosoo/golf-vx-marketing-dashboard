import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, TrendingUp, Target, Activity, Zap } from "lucide-react";

export default function Overview() {
  const [dateRange] = useState(() => ({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  }));
  const { data: dashboardData, isLoading } = trpc.dashboard.getOverview.useQuery(dateRange);

  const kpis = [
    {
      label: "Total Members",
      value: dashboardData?.totalMembers ?? "—",
      icon: <Users size={20} />,
      color: "text-[#888888]",
      bg: "bg-blue-400/10",
    },
    {
      label: "MRR",
      value: dashboardData?.monthlyRecurringRevenue ? `$${Math.round(dashboardData.monthlyRecurringRevenue).toLocaleString()}` : "—",
      icon: <DollarSign size={20} />,
      color: "text-[#3DB855]",
      bg: "bg-green-400/10",
    },
    {
      label: "Active Campaigns",
      value: dashboardData?.activeCampaignsCount ?? "—",
      icon: <Target size={20} />,
      color: "text-[#F5C72C]",
      bg: "bg-[#F5C72C]/10",
    },
    {
      label: "Conversion Rate",
      value: dashboardData?.overallROI ? `${dashboardData.overallROI}%` : "—",
      icon: <TrendingUp size={20} />,
      color: "text-[#888888]",
      bg: "bg-purple-400/10",
    },
    {
      label: "New Leads (30d)",
      value: dashboardData?.activeMembers ?? "—",
      icon: <Activity size={20} />,
      color: "text-[#F5C72C]",
      bg: "bg-orange-400/10",
    },
    {
      label: "Ad Spend (30d)",
      value: dashboardData?.marketingSpend ? `$${parseFloat(dashboardData.marketingSpend).toLocaleString()}` : "—",
      icon: <Zap size={20} />,
      color: "text-[#E8453C]",
      bg: "bg-red-400/10",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Business performance at a glance</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-card rounded-xl animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${kpi.bg}`}>
                    <span className={kpi.color}>{kpi.icon}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
           { label: "Meta Ads Sync", status: "active", time: "2 min ago" },            { label: "Encharge Sync", status: "active", time: "5 min ago" },
            { label: "Boomerang Sync", status: "active", time: "10 min ago" },
            { label: "ClickFunnels Sync", status: "active", time: "15 min ago" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-[#3DB855] border-green-400/30">
                  {item.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
