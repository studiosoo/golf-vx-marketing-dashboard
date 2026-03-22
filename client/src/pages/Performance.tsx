import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, BarChart3, ArrowRight, TrendingUp, Activity } from "lucide-react";

export default function Performance() {
  const [, navigate] = useLocation();

  const { data: campaigns, isLoading: campaignsLoading } = trpc.campaigns.getByStatus.useQuery({ status: "active" });
  const { data: channelSummary } = trpc.campaigns.getCategorySummary.useQuery();
  const { data: revSummary, isLoading: revLoading } = trpc.revenue.getSummary.useQuery(undefined);

  const formatCurrency = (val: number | string) =>
    `$${parseFloat(String(val || 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const formatROAS = (spend: number | string, revenue: number | string) => {
    const s = parseFloat(String(spend || 0));
    const r = parseFloat(String(revenue || 0));
    return s > 0 ? (r / s).toFixed(2) + "x" : "—";
  };

  // Aggregate spend/revenue from active campaigns
  const campaignList = (campaigns as any[]) ?? [];
  const totalSpend = campaignList.reduce((s: number, c: any) => s + parseFloat(String(c.actualSpend || 0)), 0);
  const totalRevenue = parseFloat(String(revSummary?.total || 0));
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : null;
  const kpiLoading = campaignsLoading || revLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance</h1>
          <p className="text-muted-foreground text-sm mt-1">Campaign & channel performance metrics</p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Revenue (MTD)",
            value: revLoading ? "—" : revSummary == null ? "N/A" : formatCurrency(totalRevenue),
            icon: DollarSign,
            color: "text-[#72B84A]",
            bg: "bg-[#72B84A]/10",
          },
          {
            label: "Ad Spend",
            value: campaignsLoading ? "—" : campaigns == null ? "N/A" : formatCurrency(totalSpend),
            icon: TrendingUp,
            color: "text-[#F2DD48]",
            bg: "bg-[#F2DD48]/10",
          },
          {
            label: "Active Campaigns",
            value: campaignsLoading ? "—" : String(campaignList.length),
            icon: Activity,
            color: "text-[#888888]",
            bg: "bg-[#888888]/10",
          },
          {
            label: "Avg ROAS",
            value: kpiLoading ? "—" : (roas !== null ? `${roas.toFixed(2)}×` : "—"),
            icon: BarChart3,
            color: "text-[#888888]",
            bg: "bg-[#F1F1EF]",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="bg-white border-[#DEDEDA] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-[#AAAAAA]">{label}</p>
                <p className="text-lg font-bold text-[#222222] leading-tight">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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
                <Card key={ch.id ?? ch.category ?? ch.name} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-foreground capitalize">{ch.name ?? ch.category}</span>
                      <Badge variant="outline" className="text-xs">{ch.totalCampaigns ?? ch.campaignCount ?? 0} campaigns</Badge>
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
            className="w-full flex items-center justify-between px-4 py-3 mt-4 bg-[#F2DD48]/10 border border-[#F2DD48]/30 rounded-[10px] hover:bg-[#F2DD48]/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="h-4 w-4 text-[#F2DD48]" />
              <div className="text-left">
                <p className="text-sm font-semibold text-[#222222]">Meta Ads Campaigns</p>
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
