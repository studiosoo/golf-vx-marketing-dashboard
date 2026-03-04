import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, TrendingUp, DollarSign, Eye, MousePointer, Sparkles, ChevronRight, ExternalLink } from "lucide-react";

type DatePreset = "today" | "yesterday" | "last_7d" | "last_14d" | "last_30d" | "last_90d" | "lifetime";

const STATUS_ORDER: Record<string, number> = { ACTIVE: 0, IN_PROCESS: 1, WITH_ISSUES: 2, PAUSED: 3, COMPLETED: 4, ARCHIVED: 5, DELETED: 6, UNKNOWN: 7 };

function statusBadgeClass(status: string) {
  switch (status) {
    case "ACTIVE": return "bg-green-500/20 text-green-600 border-green-500/30";
    case "PAUSED": return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
    case "COMPLETED": return "bg-blue-500/20 text-blue-600 border-blue-500/30";
    case "ARCHIVED": return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    default: return "bg-muted text-muted-foreground";
  }
}

interface MetaAdsProps {
  embedded?: boolean;
  params?: Record<string, string | undefined>;
}

export default function MetaAds({ embedded }: MetaAdsProps = {}) {
  const [, navigate] = useLocation();
  const [datePreset, setDatePreset] = useState<DatePreset>("last_30d");
  const [aiCampaign, setAiCampaign] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  const { data: campaigns, isLoading, refetch } = trpc.metaAds.getAllCampaignsWithInsights.useQuery(
    { datePreset },
    { staleTime: 5 * 60 * 1000 }
  );

  const generateAiInsight = trpc.metaAds.generateCampaignInsights.useMutation({
    onSuccess: (data) => { setAiInsight(String(data.insights || "No insights generated.")); setAiLoading(false); },
    onError: () => { setAiInsight("Unable to generate insights at this time."); setAiLoading(false); },
  });

  const formatCurrency = (val: any) =>
    `$${parseFloat(String(val || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatNum = (val: any) => parseInt(String(val || 0)).toLocaleString();

  const sortedCampaigns = campaigns
    ? [...(campaigns as any[])].sort((a, b) => (STATUS_ORDER[a.status] ?? 7) - (STATUS_ORDER[b.status] ?? 7))
    : [];

  const totalSpend = sortedCampaigns.reduce((sum, c) => sum + parseFloat(c.insights?.spend || 0), 0);
  const totalReach = sortedCampaigns.reduce((sum, c) => sum + parseInt(c.insights?.reach || 0), 0);
  const totalImpressions = sortedCampaigns.reduce((sum, c) => sum + parseInt(c.insights?.impressions || 0), 0);
  const totalClicks = sortedCampaigns.reduce((sum, c) => sum + parseInt(c.insights?.clicks || 0), 0);

  const handleAiClick = (e: React.MouseEvent, campaign: any) => {
    e.stopPropagation();
    setAiCampaign(campaign);
    setAiInsight("");
    setAiLoading(true);
    generateAiInsight.mutate({ campaignId: campaign.id, datePreset });
  };

  const handleCardClick = (campaign: any) => {
    navigate(embedded ? `/campaigns/meta-ads/campaign/${campaign.id}` : `/meta-ads/campaign/${campaign.id}`);
  };

  return (
    <div className={embedded ? "space-y-6" : "p-6 space-y-6"}>
      <div className="flex items-center justify-between">
        {!embedded && <div>
          <h1 className="text-2xl font-bold text-foreground">Meta Ads</h1>
          <p className="text-muted-foreground text-sm mt-1">Facebook & Instagram campaign performance</p>
        </div>}
        {embedded && <div />}
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
      ) : sortedCampaigns.length > 0 ? (
        <div className="space-y-3">
          {sortedCampaigns.map((c: any) => (
            <Card
              key={c.id}
              className="bg-card border-border hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => handleCardClick(c)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm flex items-center gap-1">
                      {c.name}
                      <ChevronRight size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs border ${statusBadgeClass(c.status)}`} variant="outline">
                        {c.status}
                      </Badge>
                      {c.objective && (
                        <span className="text-xs text-muted-foreground">{c.objective}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 gap-1 border-primary/40 text-primary hover:bg-primary/10"
                      onClick={(e) => handleAiClick(e, c)}
                    >
                      <Sparkles size={11} />
                      AI Insights
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2 gap-1 text-muted-foreground hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); handleCardClick(c); }}
                    >
                      <ExternalLink size={11} />
                      Report
                    </Button>
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

      {/* AI Insights Dialog */}
      <Dialog open={!!aiCampaign} onOpenChange={(open) => { if (!open) { setAiCampaign(null); setAiInsight(""); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              AI Intelligence — {aiCampaign?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge className={`text-xs border ${statusBadgeClass(aiCampaign?.status || "")}`} variant="outline">
                {aiCampaign?.status}
              </Badge>
              <span>{aiCampaign?.objective}</span>
            </div>
            {aiCampaign?.insights && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Spend", value: formatCurrency(aiCampaign.insights.spend || 0) },
                  { label: "Reach", value: formatNum(aiCampaign.insights.reach || 0) },
                  { label: "Impressions", value: formatNum(aiCampaign.insights.impressions || 0) },
                  { label: "Clicks", value: formatNum(aiCampaign.insights.clicks || 0) },
                ].map((m) => (
                  <div key={m.label} className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="text-base font-bold text-foreground">{m.value}</div>
                    <div className="text-xs text-muted-foreground">{m.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-primary" />
                <span className="text-sm font-semibold text-primary">AI Analysis & Recommendations</span>
              </div>
              {aiLoading ? (
                <div className="space-y-2">
                  {["w-full", "w-4/5", "w-3/4", "w-full", "w-2/3"].map((w, i) => (
                    <div key={i} className={`h-3 bg-muted rounded animate-pulse ${w}`} />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{aiInsight}</div>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { if (aiCampaign) handleCardClick(aiCampaign); setAiCampaign(null); }}
              >
                <ExternalLink size={13} className="mr-1" />
                View Full Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
