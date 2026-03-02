// Guest version of Performance — uses trpc.guest.* public endpoints
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, BarChart3 } from "lucide-react";

export default function GuestPerformance() {
  const { data: allCampaigns = [], isLoading } = trpc.guest.getCampaigns.useQuery();
  const { data: metaAds = [] } = trpc.guest.getMetaAdsCampaigns.useQuery({ datePreset: "last_30d" });
  const { data: memberStats } = trpc.guest.getMemberStats.useQuery();

  const campaigns = (allCampaigns as any[]).filter((c: any) => c.status === "active");
  const totalMetaSpend = (metaAds as any[]).reduce((s: number, c: any) => s + parseFloat(c.insights?.spend || "0"), 0);
  const totalMetaClicks = (metaAds as any[]).reduce((s: number, c: any) => s + parseInt(c.insights?.clicks || "0"), 0);
  const totalMetaImpressions = (metaAds as any[]).reduce((s: number, c: any) => s + parseInt(c.insights?.impressions || "0"), 0);
  const avgCTR = totalMetaImpressions > 0 ? ((totalMetaClicks / totalMetaImpressions) * 100).toFixed(2) : "0.00";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance</h1>
        <p className="text-muted-foreground text-sm mt-1">Campaign and channel performance metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Active Campaigns</p>
            <p className="text-xl font-bold">{campaigns.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Meta Ad Spend (30d)</p>
            <p className="text-xl font-bold">${totalMetaSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Meta Clicks (30d)</p>
            <p className="text-xl font-bold">{totalMetaClicks.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Avg CTR</p>
            <p className="text-xl font-bold">{avgCTR}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target size={16} className="text-yellow-500" />
            Active Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No active campaigns</p>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.category?.replace(/_/g, " ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Budget: ${parseFloat(c.budget || "0").toLocaleString()}</p>
                    <p className="text-xs text-green-400">Revenue: ${parseFloat(c.actualRevenue || "0").toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meta Ads Performance */}
      {(metaAds as any[]).length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-500" />
              Meta Ads Performance (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(metaAds as any[]).slice(0, 5).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <Badge variant="outline" className="text-xs mt-1">{c.status}</Badge>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">${parseFloat(c.insights?.spend || "0").toFixed(0)} spent</p>
                    <p className="text-xs text-muted-foreground">{parseInt(c.insights?.clicks || "0").toLocaleString()} clicks</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Membership Performance */}
      {memberStats && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={16} className="text-green-500" />
              Membership Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{(memberStats as any).totalMembers}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{(memberStats as any).activeMembers}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">
                  {(memberStats as any).totalMembers > 0
                    ? Math.round((parseInt((memberStats as any).activeMembers) / (memberStats as any).totalMembers) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Retention Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
