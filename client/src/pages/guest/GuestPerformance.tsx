// Guest version of Performance — uses trpc.guest.* public endpoints
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

export default function GuestPerformance() {
  const { data: campaigns = [], isLoading } = trpc.guest.getCampaignsByStatus.useQuery({ status: "active" });
  const { data: metaAds = [] } = trpc.guest.getMetaAdsCampaigns.useQuery({ datePreset: "last_30d" });
  const { data: channelSummary = [] } = trpc.guest.getCategorySummary.useQuery();

  const totalMetaSpend = (metaAds as any[]).reduce((s: number, c: any) => s + parseFloat(c.insights?.spend || "0"), 0);
  const totalMetaClicks = (metaAds as any[]).reduce((s: number, c: any) => s + parseInt(c.insights?.clicks || "0"), 0);

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
            <p className="text-xl font-bold">{(campaigns as any[]).length}</p>
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
            <p className="text-xs text-muted-foreground">Categories</p>
            <p className="text-xl font-bold">{(channelSummary as any[]).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp size={16} />
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
          ) : (campaigns as any[]).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No active campaigns</p>
          ) : (
            <div className="space-y-2">
              {(campaigns as any[]).map((c: any) => (
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

      {/* Category Summary */}
      {(channelSummary as any[]).length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Performance by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(channelSummary as any[]).map((cat: any) => (
                <div key={cat.category} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground capitalize">{cat.category?.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">${parseFloat(cat.totalRevenue || "0").toLocaleString()}</span>
                    <Badge variant="outline" className="text-xs">{cat.totalCampaigns} campaigns</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
