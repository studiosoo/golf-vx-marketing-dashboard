import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, TrendingUp, Users, DollarSign, Target, Sparkles, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatCard } from "@/components/giveaway/StatCard";
import { ProgressBar } from "@/components/giveaway/ProgressBar";
import { FunnelTable } from "@/components/giveaway/FunnelTable";
import { BottomFunnelConversion } from "@/components/giveaway/BottomFunnelConversion";
import { DemographicsTab } from "@/components/giveaway/DemographicsTab";
import { AIIntelligenceTab } from "@/components/giveaway/AIIntelligenceTab";
import { ApplicationsTab } from "@/components/giveaway/ApplicationsTab";
import { MetaAdsStatusBadge } from "@/components/MetaAdsStatusBadge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const ENTRY_GOAL = 1500;
const LONG_FORM_GOAL = 250;
// Campaign IDs for Annual Giveaway (A1 + A2)
const GIVEAWAY_CAMPAIGN_IDS = ["120239570172470217", "120239627905950217"];

export default function AnnualGiveaway() {
  const { toast } = useToast();

  const { data: applications, isLoading: loadingApps, refetch: refetchApps } = trpc.giveaway.getApplications.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = trpc.giveaway.getStats.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );
  const { data: lastSyncInfo } = trpc.giveaway.getLastSyncInfo.useQuery(undefined, { refetchInterval: 30000 });
  const { data: timeline } = trpc.giveaway.getTimeline.useQuery(undefined, { refetchInterval: 60000 });
  const { data: conversions } = trpc.giveaway.getConversions.useQuery(undefined, { refetchInterval: 60000 });

  // Pull live Meta Ads data for giveaway campaigns (lifetime spend + impressions)
  const { data: metaCampaigns } = trpc.metaAds.getAllCampaignsWithInsights.useQuery(
    { datePreset: "maximum" },
    { refetchInterval: 300000 } // refresh every 5 min
  );

  const syncMutation = trpc.giveaway.sync.useMutation({
    onSuccess: () => {
      refetchApps();
      refetchStats();
      toast({ title: "Synced", description: "Data refreshed from Google Sheets." });
    },
  });

  const updateStatusMutation = trpc.giveaway.updateStatus.useMutation({
    onSuccess: () => refetchApps(),
  });

  // Derive live ad spend and reach from Meta Ads data
  const giveawayCampaigns = metaCampaigns?.filter((c: any) =>
    GIVEAWAY_CAMPAIGN_IDS.includes(c.id)
  ) ?? [];
  const liveAdSpend = giveawayCampaigns.reduce(
    (sum: number, c: any) => sum + parseFloat(c.spend || c.totalSpend || "0"),
    0
  );
  const liveReach = giveawayCampaigns.reduce(
    (sum: number, c: any) => sum + parseInt(c.reach || "0", 10),
    0
  );
  // Fall back to last known values if Meta Ads not yet loaded
  const TOTAL_AD_SPEND = liveAdSpend > 0 ? liveAdSpend : 467.59;
  const ENTRY_PAGE_UV = liveReach > 0 ? liveReach : 875;

  const totalApplications = stats?.totalApplications || 0;
  const costPerSubmission = totalApplications > 0
    ? (TOTAL_AD_SPEND / totalApplications).toFixed(2)
    : "—";
  const funnelConversionRate = ENTRY_PAGE_UV > 0
    ? ((totalApplications / ENTRY_PAGE_UV) * 100).toFixed(1)
    : "—";

  const entryProgress = (ENTRY_PAGE_UV / ENTRY_GOAL) * 100;
  const healthStatus = entryProgress >= 80 ? "on_track" : entryProgress >= 40 ? "behind" : "critical";
  const healthColor = healthStatus === "on_track" ? "#72B84A" : healthStatus === "behind" ? "#F2DD48" : "#888888";
  const healthLabel = healthStatus === "on_track" ? "On Track" : healthStatus === "behind" ? "Behind" : "Critical";

  if (loadingApps || loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#AAAAAA]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] tracking-tight">Annual Membership Giveaway</h1>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${healthColor}20`, color: healthColor }}
            >
              {healthLabel}
            </span>
          </div>
          <p className="text-sm text-[#888888] mt-1">
            2026 Lead Generation Campaign
            {lastSyncInfo?.lastSyncedAt
              ? <span className="ml-2 text-xs text-[#AAAAAA]">• Last synced {new Date(lastSyncInfo.lastSyncedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              : <span className="ml-2 text-xs text-[#AAAAAA]">• Syncs 3× daily</span>
            }
            <span className="ml-2"><MetaAdsStatusBadge /></span>
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          size="sm"
          className="bg-[#F2DD48] hover:bg-[#e6b820] text-[#222222] font-semibold"
        >
          {syncMutation.isPending
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Syncing...</>
            : <><RefreshCw className="mr-2 h-4 w-4" />Refresh Data</>
          }
        </Button>
      </div>

      {/* Goal Progress */}
      <Card className="border border-[#DEDEDA] shadow-none">
        <CardContent className="pt-4 pb-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ProgressBar value={ENTRY_PAGE_UV} max={ENTRY_GOAL} label="Entry Goal (Short-Form)" color="#F2DD48" />
            <ProgressBar value={totalApplications} max={LONG_FORM_GOAL} label="Application Goal (Long-Form)" color="#545A60" />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Applications (Long-Form)"
          value={stats == null ? "N/A" : totalApplications}
          sub={`Goal: ${LONG_FORM_GOAL} • ${Math.max(0, LONG_FORM_GOAL - totalApplications)} remaining`}
          icon={Users}
        />
        <StatCard
          title="Entry Page UV"
          value={ENTRY_PAGE_UV}
          sub={`Goal: ${ENTRY_GOAL} entries • ${Math.max(0, ENTRY_GOAL - ENTRY_PAGE_UV)} remaining`}
          icon={Target}
          accent
        />
        <StatCard
          title="Funnel Conversion"
          value={stats == null ? "N/A" : `${funnelConversionRate}%`}
          sub={`${totalApplications} long-form / ${ENTRY_PAGE_UV} entry UV`}
          icon={TrendingUp}
        />
        <StatCard
          title="Cost per Application"
          value={`$${costPerSubmission}`}
          sub={`$${TOTAL_AD_SPEND.toFixed(2)} total ad spend`}
          icon={DollarSign}
        />
      </div>

      {/* Applicant Timeline Chart */}
      {timeline && timeline.length > 0 && (
        <Card className="border border-[#DEDEDA] shadow-none">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#AAAAAA]" />
              <CardTitle className="text-sm font-semibold text-[#222222]">Applications Over Time</CardTitle>
              <span className="text-xs text-[#AAAAAA] ml-1">— Cumulative applicant count</span>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={timeline} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F2DD48" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F2DD48" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#AAAAAA" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(d: string) => {
                    const dt = new Date(d + "T00:00:00");
                    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: "#AAAAAA" }} axisLine={false} tickLine={false} width={32} />
                <Tooltip
                  formatter={(value: number, name: string) => [value, name === "cumulative" ? "Total applicants" : "New today"]}
                  labelFormatter={(d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  contentStyle={{ fontSize: 12, border: "1px solid #DEDEDA", borderRadius: 8, boxShadow: "none" }}
                />
                <Area type="monotone" dataKey="cumulative" stroke="#F2DD48" strokeWidth={2} fill="url(#timelineGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Bottom Funnel Conversion */}
      <BottomFunnelConversion conversions={conversions} totalApplications={totalApplications} />

      {/* ClickFunnels Funnel Steps */}
      <FunnelTable />

      {/* AI Intelligence scroll anchor */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-[#222222]">Campaign Analysis</div>
          <MetaAdsStatusBadge />
        </div>
        <button
          onClick={() => {
            const el = document.getElementById("giveaway-ai-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
          style={{
            background: "linear-gradient(135deg, #F2DD48 0%, #e6b820 100%)",
            color: "#222222",
            boxShadow: "0 2px 8px rgba(245,199,44,0.4)",
          }}
        >
          <Sparkles className="h-4 w-4" />
          AI Intelligence
        </button>
      </div>

      {/* Tabs: Demographics / Applications */}
      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList className="bg-[#F1F1EF] border border-[#DEDEDA]">
          <TabsTrigger
            value="demographics"
            className="data-[state=active]:bg-white data-[state=active]:text-[#222222] data-[state=active]:shadow-none text-[#888888]"
          >
            Demographics
          </TabsTrigger>
          <TabsTrigger
            value="applications"
            className="data-[state=active]:bg-white data-[state=active]:text-[#222222] data-[state=active]:shadow-none text-[#888888]"
          >
            Applications ({totalApplications})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demographics">
          <DemographicsTab stats={stats} />
        </TabsContent>

        <TabsContent value="applications">
          <ApplicationsTab
            applications={applications}
            totalApplications={totalApplications}
            onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status: status as any })}
          />
        </TabsContent>
      </Tabs>

      {/* AI Intelligence Section */}
      <div
        id="giveaway-ai-section"
        className="border-2 rounded-xl p-1"
        style={{
          borderColor: "#F2DD48",
          background: "linear-gradient(135deg, rgba(245,199,44,0.05) 0%, rgba(245,199,44,0.02) 100%)",
        }}
      >
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <Sparkles className="h-5 w-5" style={{ color: "#F2DD48" }} />
          <span className="text-base font-bold text-[#222222]">AI Intelligence</span>
          <span className="text-xs text-[#888888] ml-1">— Powered by Golf VX Marketing Engine</span>
        </div>
        <div className="px-1 pb-1">
          <AIIntelligenceTab programId={5} />
        </div>
      </div>
    </div>
  );
}
