// Guest version of Overview — uses trpc.guest.* public endpoints
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Target, TrendingUp, BarChart3 } from "lucide-react";

export default function GuestOverview() {
  const [dateRange] = useState(() => ({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  }));

  const { data: dashboardData, isLoading } = trpc.guest.getDashboardOverview.useQuery(dateRange);
  const { data: memberStats } = trpc.guest.getMemberStats.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Business performance summary</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <CardContent className="pt-4 pb-4 h-24" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={16} className="text-blue-400" />
                  <span className="text-xs text-muted-foreground">Active Members</span>
                </div>
                <p className="text-2xl font-bold">{dashboardData?.activeMembers ?? "—"}</p>
                <p className="text-xs text-muted-foreground">of {dashboardData?.totalMembers ?? "?"} total</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={16} className="text-green-400" />
                  <span className="text-xs text-muted-foreground">MRR</span>
                </div>
                <p className="text-2xl font-bold">${Math.round(dashboardData?.monthlyRecurringRevenue ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Monthly Recurring</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={16} className="text-purple-400" />
                  <span className="text-xs text-muted-foreground">Active Campaigns</span>
                </div>
                <p className="text-2xl font-bold">{dashboardData?.activeCampaignsCount ?? "—"}</p>
                <p className="text-xs text-muted-foreground">ROI: {dashboardData?.overallROI ?? "0"}%</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={16} className="text-yellow-400" />
                  <span className="text-xs text-muted-foreground">Marketing Spend</span>
                </div>
                <p className="text-2xl font-bold">${parseFloat(dashboardData?.marketingSpend ?? "0").toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Member breakdown */}
          {memberStats && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users size={16} />
                  Membership Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{memberStats.allAccessCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">All Access Aces</p>
                    <p className="text-xs text-green-400">${parseFloat(memberStats.allAccessMRR as string || "0").toLocaleString()}/mo</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{memberStats.swingSaversCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Swing Savers</p>
                    <p className="text-xs text-green-400">${parseFloat(memberStats.swingSaversMRR as string || "0").toLocaleString()}/mo</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{memberStats.golfVxProCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Golf VX Pro</p>
                    <p className="text-xs text-green-400">${parseFloat(memberStats.golfVxProMRR as string || "0").toLocaleString()}/mo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Channel Performance */}
          {dashboardData?.channelPerformance && dashboardData.channelPerformance.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 size={16} />
                  Channel Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.channelPerformance.map((ch: any) => (
                    <div key={ch.channelName} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{ch.channelName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">${parseFloat(ch.totalRevenue || "0").toLocaleString()}</span>
                        <Badge variant="outline" className="text-xs">{ch.totalCampaigns} campaigns</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
