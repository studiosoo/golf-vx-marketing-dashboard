import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Target, Users, RefreshCw } from "lucide-react";

export default function Performance() {
  const [dateRange] = useState(() => ({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    endDate: new Date(),
  }));

  const { data: campaigns, isLoading: campaignsLoading } = trpc.campaigns.getByStatus.useQuery({ status: "active" });
  const { data: metaAds, isLoading: metaLoading } = trpc.metaAds.getAllCampaignsWithInsights.useQuery({ datePreset: "last_30d" });
  const { data: channelSummary } = trpc.campaigns.getCategorySummary.useQuery();

  const formatCurrency = (val: number | string) =>
    `$${parseFloat(String(val || 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const formatROAS = (spend: number | string, revenue: number | string) => {
    const s = parseFloat(String(spend || 0));
    const r = parseFloat(String(revenue || 0));
    return s > 0 ? (r / s).toFixed(2) + "x" : "—";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance</h1>
          <p className="text-muted-foreground text-sm mt-1">Campaign & channel performance metrics</p>
        </div>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList className="bg-muted">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="meta-ads">Meta Ads</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="mt-4 space-y-4">
          {campaignsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-card rounded-xl animate-pulse border border-border" />
              ))}
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.map((c: any) => (
                <Card key={c.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground text-sm">{c.name}</span>
                          <Badge
                            variant={c.status === "active" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {c.status}
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Spend: {formatCurrency(c.actualSpend)}</span>
                          <span>Revenue: {formatCurrency(c.actualRevenue)}</span>
                          <span>ROAS: {formatROAS(c.actualSpend, c.actualRevenue)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">
                          {formatROAS(c.actualSpend, c.actualRevenue)}
                        </div>
                        <div className="text-xs text-muted-foreground">ROAS</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No active campaigns</div>
          )}
        </TabsContent>

        {/* Meta Ads Tab */}
        <TabsContent value="meta-ads" className="mt-4 space-y-4">
          {metaLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-card rounded-xl animate-pulse border border-border" />
              ))}
            </div>
          ) : metaAds && metaAds.length > 0 ? (
            <div className="space-y-3">
              {metaAds.map((ad: any) => (
                <Card key={ad.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-medium text-foreground text-sm">{ad.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={ad.status === "ACTIVE" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {ad.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{ad.objective}</span>
                        </div>
                      </div>
                    </div>
                    {ad.insights && (
                      <div className="grid grid-cols-4 gap-3 mt-3">
                        {[
                          { label: "Spend", value: formatCurrency(ad.insights.spend || 0) },
                          { label: "Reach", value: (ad.insights.reach || 0).toLocaleString() },
                          { label: "Impressions", value: (ad.insights.impressions || 0).toLocaleString() },
                          { label: "Clicks", value: (ad.insights.clicks || 0).toLocaleString() },
                        ].map((m) => (
                          <div key={m.label} className="text-center">
                            <div className="text-sm font-semibold text-foreground">{m.value}</div>
                            <div className="text-xs text-muted-foreground">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No Meta Ads data</div>
          )}
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="mt-4">
          {channelSummary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(channelSummary as any[]).map((ch: any) => (
                <Card key={ch.category} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-foreground capitalize">{ch.category}</span>
                      <Badge variant="outline" className="text-xs">{ch.campaignCount} campaigns</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm font-semibold">{formatCurrency(ch.totalSpend)}</div>
                        <div className="text-xs text-muted-foreground">Spend</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{formatCurrency(ch.totalRevenue)}</div>
                        <div className="text-xs text-muted-foreground">Revenue</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{formatROAS(ch.totalSpend, ch.totalRevenue)}</div>
                        <div className="text-xs text-muted-foreground">ROAS</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">Loading channel data...</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
