import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, TrendingUp, DollarSign, Eye, MousePointer, Sparkles, ChevronRight, ExternalLink, ChevronDown, Archive, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type DatePreset = "today" | "yesterday" | "last_7d" | "last_14d" | "last_30d" | "last_90d" | "lifetime";

const COMPLETED_DAYS_THRESHOLD = 7;

// Extract the program/campaign group name from a Meta campaign name.
// "Golf VX Annual Giveaway - A2 Social/Family" → "Annual Giveaway"
// "[BOOSTED] Instagram post: Drive Day"         → "Drive Day (Boosted)"
// "Junior Golf Summer Camp - Ad Set 1"          → "Junior Golf Summer Camp"
function parseProgramGroup(name: string): string {
  const boosted = /^\[BOOSTED\]/i.test(name);
  const cleaned = name.replace(/^\[.*?\]\s*/g, "").trim();
  // Strip "Golf VX " prefix for brevity
  const noBrand = cleaned.replace(/^golf\s+vx\s+/i, "").trim();
  // Split on " - " or " | " and take first segment
  const dashIdx = noBrand.indexOf(" - ");
  const pipeIdx = noBrand.indexOf(" | ");
  const cutIdx = dashIdx >= 0 && (pipeIdx < 0 || dashIdx < pipeIdx) ? dashIdx : pipeIdx;
  let group = cutIdx > 0 ? noBrand.slice(0, cutIdx).trim() : noBrand;
  // Handle "Instagram post: Drive Day" pattern
  const colonIdx = group.indexOf(": ");
  if (colonIdx > 0 && colonIdx < group.length - 2) group = group.slice(colonIdx + 2).trim();
  return boosted ? `${group} (Boosted)` : group;
}

// Sort order: ACTIVE → PAUSED → others
const STATUS_SORT: Record<string, number> = { ACTIVE: 0, IN_PROCESS: 0, PAUSED: 1 };
function campaignSortKey(c: any, overrideMap: Record<string, string>): number {
  const st = getEffectiveStatus(c, overrideMap);
  return STATUS_SORT[st] ?? 2;
}

function isAutoCompleted(campaign: any): boolean {
  const ins = campaign.insights || campaign;
  const dateStop = ins.date_stop || ins.dateStop;
  if (!dateStop) return false;
  const stopDate = new Date(dateStop);
  const daysDiff = (Date.now() - stopDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff > COMPLETED_DAYS_THRESHOLD;
}

function getEffectiveStatus(campaign: any, overrideMap: Record<string, string>): string {
  if (overrideMap[campaign.id]) return overrideMap[campaign.id].toUpperCase();
  if (isAutoCompleted(campaign)) return "COMPLETED";
  return campaign.status || "ACTIVE";
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "ACTIVE": return "bg-[#3DB855]/20 text-[#3DB855] border-[#3DB855]/30";
    case "PAUSED": return "bg-[#F5C72C]/20 text-[#111111] border-[#F5C72C]/50";
    case "COMPLETED": return "bg-[#888888]/20 text-[#888888] border-[#888888]/30";
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
  const { toast } = useToast();
  const [datePreset, setDatePreset] = useState<DatePreset>("last_30d");
  const [aiCampaign, setAiCampaign] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { data: campaigns, isLoading, refetch } = trpc.metaAds.getAllCampaignsWithInsights.useQuery(
    { datePreset },
    { staleTime: 5 * 60 * 1000 }
  );
  const { data: overrides, refetch: refetchOverrides } = trpc.metaAds.getStatusOverrides.useQuery();
  const utils = trpc.useUtils();

  const generateAiInsight = trpc.metaAds.generateCampaignInsights.useMutation({
    onSuccess: (data) => { setAiInsight(String(data.insights || "No insights generated.")); setAiLoading(false); },
    onError: () => { setAiInsight("Unable to generate insights at this time."); setAiLoading(false); },
  });
  const syncCache = trpc.metaAds.syncCache.useMutation({
    onSuccess: () => { refetch(); refetchOverrides(); },
  });
  const setOverride = trpc.metaAds.setStatusOverride.useMutation({
    onSuccess: () => {
      refetchOverrides();
      utils.metaAds.getAllCampaignsWithInsights.invalidate();
    },
  });

  const formatCurrency = (val: any) =>
    `$${parseFloat(String(val || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatNum = (val: any) => parseInt(String(val || 0)).toLocaleString();

  const overrideMap: Record<string, string> = {};
  if (overrides) {
    for (const o of overrides as any[]) {
      overrideMap[(o as any).campaignId] = (o as any).overrideStatus;
    }
  }

  const allCampaigns = (campaigns as any[]) ?? [];
  const activeCampaigns = allCampaigns.filter(c => {
    const eff = getEffectiveStatus(c, overrideMap);
    return eff === "ACTIVE" || eff === "PAUSED" || eff === "IN_PROCESS";
  });
  const archivedCampaigns = allCampaigns.filter(c => {
    const eff = getEffectiveStatus(c, overrideMap);
    return eff === "COMPLETED" || eff === "ARCHIVED";
  });

  const totalSpend = activeCampaigns.reduce((sum, c) => sum + parseFloat(c.insights?.spend || 0), 0);
  const totalReach = activeCampaigns.reduce((sum, c) => sum + parseInt(c.insights?.reach || 0), 0);
  const totalImpressions = activeCampaigns.reduce((sum, c) => sum + parseInt(c.insights?.impressions || 0), 0);
  const totalClicks = activeCampaigns.reduce((sum, c) => sum + parseInt(c.insights?.clicks || 0), 0);

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
  const handleMarkCompleted = (e: React.MouseEvent, campaign: any) => {
    e.stopPropagation();
    setOverride.mutate(
      { campaignId: campaign.id, campaignName: campaign.name, overrideStatus: "completed" },
      { onSuccess: () => toast({ title: "Marked as Completed", description: campaign.name }) }
    );
  };
  const handleRestoreActive = (e: React.MouseEvent, campaign: any) => {
    e.stopPropagation();
    setOverride.mutate(
      { campaignId: campaign.id, campaignName: campaign.name, overrideStatus: "active" },
      { onSuccess: () => toast({ title: "Restored to Active", description: campaign.name }) }
    );
  };

  const CampaignCard = ({ c, isArchived }: { c: any; isArchived: boolean }) => {
    const effStatus = getEffectiveStatus(c, overrideMap);
    const autoClassified = isAutoCompleted(c) && !overrideMap[c.id];
    return (
      <Card
        className={`border-border hover:shadow-md transition-all cursor-pointer group ${isArchived ? "opacity-70 hover:opacity-100 bg-muted/20" : "bg-card hover:border-primary/30"}`}
        onClick={() => handleCardClick(c)}
      >
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-sm flex items-center gap-1">
                <span className="truncate">{c.name}</span>
                <ChevronRight size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={`text-xs border ${statusBadgeClass(effStatus)}`} variant="outline">
                  {effStatus}
                </Badge>
                {autoClassified && (
                  <span className="text-xs text-muted-foreground italic">auto-classified by date</span>
                )}
                {c.objective && (
                  <span className="text-xs text-muted-foreground">{c.objective}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {!isArchived ? (
                <>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2 gap-1 text-muted-foreground hover:text-[#E8453C]"
                    onClick={(e) => handleMarkCompleted(e, c)}
                    title="Mark as Completed"
                  >
                    <Archive size={11} />
                    Archive
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2 gap-1 text-muted-foreground hover:text-[#3DB855]"
                    onClick={(e) => handleRestoreActive(e, c)}
                    title="Restore to Active"
                  >
                    <RotateCcw size={11} />
                    Restore
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
                </>
              )}
            </div>
          </div>
          {c.insights ? (
            (() => {
              const spend = parseFloat(c.insights.spend || 0);
              const clicks = parseInt(c.insights.clicks || 0);
              const impressions = parseInt(c.insights.impressions || 0);
              const reach = parseInt(c.insights.reach || 0);
              const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
              const cpc = clicks > 0 ? spend / clicks : 0;
              const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
              const metrics = [
                { label: "Spend", value: formatCurrency(spend), highlight: false },
                { label: "Reach", value: formatNum(reach), highlight: false },
                { label: "Clicks", value: formatNum(clicks), highlight: false },
                { label: "CTR", value: ctr > 0 ? `${ctr.toFixed(2)}%` : "—", highlight: ctr >= 2 },
                { label: "CPC", value: cpc > 0 ? formatCurrency(cpc) : "—", highlight: false },
                { label: "CPM", value: cpm > 0 ? formatCurrency(cpm) : "—", highlight: false },
              ];
              return (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {metrics.map((m) => (
                    <div key={m.label} className="bg-muted/30 rounded-lg p-2 text-center">
                      <div className={`text-sm font-semibold ${m.highlight ? "text-[#3DB855]" : "text-foreground"}`}>{m.value}</div>
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="text-xs text-muted-foreground">No insights data for this period</div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={embedded ? "space-y-6" : "p-6 space-y-6"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
            onClick={() => syncCache.mutate()}
            disabled={syncCache.isPending || isLoading}
          >
            <RefreshCw size={14} className={(syncCache.isPending || isLoading) ? "animate-spin" : ""} />
            {syncCache.isPending ? "Syncing..." : "Sync"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Spend", value: formatCurrency(totalSpend), icon: <DollarSign size={18} />, color: "text-[#E8453C]" },
          { label: "Total Reach", value: formatNum(totalReach), icon: <Eye size={18} />, color: "text-[#888888]" },
          { label: "Impressions", value: formatNum(totalImpressions), icon: <TrendingUp size={18} />, color: "text-[#3DB855]" },
          { label: "Clicks", value: formatNum(totalClicks), icon: <MousePointer size={18} />, color: "text-[#F5C72C]" },
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

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-card rounded-xl animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Active Campaigns</span>
              <Badge className="bg-[#3DB855]/20 text-[#3DB855] border-[#3DB855]/30 text-xs border" variant="outline">
                {activeCampaigns.length}
              </Badge>
            </div>
            {activeCampaigns.length > 0 ? (() => {
              // Group by program name
              const grouped = new Map<string, any[]>();
              for (const c of activeCampaigns) {
                const group = parseProgramGroup(c.name);
                if (!grouped.has(group)) grouped.set(group, []);
                grouped.get(group)!.push(c);
              }
              // Sort within each group: ACTIVE first, PAUSED second
              Array.from(grouped.values()).forEach((arr) => {
                arr.sort((a: any, b: any) => campaignSortKey(a, overrideMap) - campaignSortKey(b, overrideMap));
              });
              // Sort groups: groups containing ACTIVE campaigns come first
              const sortedGroups = Array.from(grouped.entries()).sort((a, b) => {
                const aActive = a[1].some((c: any) => getEffectiveStatus(c, overrideMap) === "ACTIVE");
                const bActive = b[1].some((c: any) => getEffectiveStatus(c, overrideMap) === "ACTIVE");
                if (aActive !== bActive) return aActive ? -1 : 1;
                return a[0].localeCompare(b[0]);
              });
              return sortedGroups.map(([group, cList]) => (
                <div key={group} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group}</span>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{cList.length} ad{cList.length !== 1 ? "s" : ""}</span>
                  </div>
                  {cList.map((c: any) => <CampaignCard key={c.id} c={c} isArchived={false} />)}
                </div>
              ));
            })() : (
              <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
                <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No active campaigns</p>
              </div>
            )}
          </div>

          {archivedCampaigns.length > 0 && (
            <div className="space-y-3">
              <button
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                onClick={() => setShowArchived(!showArchived)}
              >
                <Archive size={14} />
                Completed / Archived
                <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30 text-xs border" variant="outline">
                  {archivedCampaigns.length}
                </Badge>
                <ChevronDown size={14} className={`ml-auto transition-transform ${showArchived ? "rotate-180" : ""}`} />
              </button>
              {showArchived && archivedCampaigns.map((c: any) => (
                <CampaignCard key={c.id} c={c} isArchived={true} />
              ))}
            </div>
          )}

          {allCampaigns.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
              <p>No Meta Ads campaigns found</p>
            </div>
          )}
        </div>
      )}

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
              <Badge className={`text-xs border ${statusBadgeClass(getEffectiveStatus(aiCampaign || {}, overrideMap))}`} variant="outline">
                {getEffectiveStatus(aiCampaign || {}, overrideMap)}
              </Badge>
              <span>{aiCampaign?.objective}</span>
            </div>
            {aiCampaign?.insights && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
