import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, TrendingUp, DollarSign, Eye, MousePointer } from "lucide-react";

type DatePreset = "today" | "yesterday" | "last_7d" | "last_14d" | "last_30d" | "last_90d" | "lifetime";

export default function MetaAds() {
  const [datePreset, setDatePreset] = useState<DatePreset>("last_30d");

  const { data: campaigns, isLoading, refetch } = trpc.metaAds.getAllCampaignsWithInsights.useQuery({ datePreset });
  

  const formatCurrency = (val: any) =>
    `$${parseFloat(String(val || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatNum = (val: any) => parseInt(String(val || 0)).toLocaleString();

  const totalSpend = (campaigns as any[])?.reduce((sum: number, c: any) => sum + parseFloat(c.insights?.spend || 0), 0) || 0;
  const totalReach = (campaigns as any[])?.reduce((sum: number, c: any) => sum + parseInt(c.insights?.reach || 0), 0) || 0;
  const totalImpressions = (campaigns as any[])?.reduce((sum: number, c: any) => sum + parseInt(c.insights?.impressions || 0), 0) || 0;
  const totalClicks = (campaigns as any[])?.reduce((sum: number, c: any) => sum + parseInt(c.insights?.clicks || 0), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meta Ads</h1>
          <p className="text-muted-foreground text-sm mt-1">Facebook & Instagram campaign performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last_7d">Last 7 days</SelectItem>
              <SelectItem value="last_14d">Last 14 days</SelectItem>
              <SelectItem value="last_30d">Last 30 days</SelectItem>
              <SelectItem value="last_90d">Last 90 days</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Sync
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Spend", value: formatCurrency(totalSpend), icon: <DollarSign size={18} />, color: "text-red-400" },
          { label: "Total Reach", value: formatNum(totalReach), icon: <Eye size={18} />, color: "text-blue-400" },
          { label: "Impressions", value: formatNum(totalImpressions), icon: <TrendingUp size={18} />, color: "text-green-400" },
          { label: "Clicks", value: formatNum(totalClicks), icon: <MousePointer size={18} />, color: "text-yellow-400" },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
                <span className={kpi.color}>{kpi.icon}</span>
              </div>
              <div className="text-xl font-bold text-foreground">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-card rounded-xl animate-pulse border border-border" />
          ))}
        </div>
      ) : campaigns && (campaigns as any[]).length > 0 ? (
        <div className="space-y-3">
          {(campaigns as any[]).map((c: any) => (
            <Card key={c.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-foreground text-sm">{c.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={c.status === "ACTIVE" ? "default" : "secondary"}
                        className={`text-xs ${c.status === "ACTIVE" ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}`}
                      >
                        {c.status}
                      </Badge>
                      {c.objective && (
                        <span className="text-xs text-muted-foreground">{c.objective}</span>
                      )}
                    </div>
                  </div>
                </div>
                {c.insights ? (
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Spend", value: formatCurrency(c.insights.spend || 0) },
                      { label: "Reach", value: formatNum(c.insights.reach || 0) },
                      { label: "Impressions", value: formatNum(c.insights.impressions || 0) },
                      { label: "Clicks", value: formatNum(c.insights.clicks || 0) },
                    ].map((m) => (
                      <div key={m.label} className="bg-muted/30 rounded-lg p-2 text-center">
                        <div className="text-sm font-semibold text-foreground">{m.value}</div>
                        <div className="text-xs text-muted-foreground">{m.label}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">No insights data for this period</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
          <p>No Meta Ads campaigns found</p>
        </div>
      )}
    </div>
  );
}
