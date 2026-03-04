import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Target, Users, RefreshCw, BarChart3, ArrowRight } from "lucide-react";

export default function Performance() {
  const [, navigate] = useLocation();
  const [dateRange] = useState(() => ({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    endDate: new Date(),
  }));

  const { data: campaigns, isLoading: campaignsLoading } = trpc.campaigns.getByStatus.useQuery({ status: "active" });
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

          {/* Meta Ads callout */}
          <button
            onClick={() => navigate("/advertising")}
            className="w-full flex items-center justify-between px-4 py-3 mt-4 bg-[#F5C72C]/10 border border-[#F5C72C]/30 rounded-[10px] hover:bg-[#F5C72C]/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="h-4 w-4 text-[#F5C72C]" />
              <div className="text-left">
                <p className="text-sm font-semibold text-[#111111]">Meta Ads Campaigns</p>
                <p className="text-xs text-[#888888]">Facebook & Instagram 캠페인 상세 데이터는 Advertising에서 확인하세요</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#888888]" />
          </button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
