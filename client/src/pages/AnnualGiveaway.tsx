import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, TrendingUp, Users, DollarSign, Target, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatCard } from "@/components/giveaway/StatCard";
import { ProgressBar } from "@/components/giveaway/ProgressBar";
import { FunnelTable } from "@/components/giveaway/FunnelTable";
import { BottomFunnelConversion } from "@/components/giveaway/BottomFunnelConversion";
import { DemographicsTab } from "@/components/giveaway/DemographicsTab";
import { AIIntelligenceTab } from "@/components/giveaway/AIIntelligenceTab";
import { ApplicationsTab } from "@/components/giveaway/ApplicationsTab";

const ENTRY_GOAL = 1500;
const LONG_FORM_GOAL = 150;           // Primary goal: 150 valid applicants (email list acquisition)
const TOTAL_AD_SPEND = 1182;          // A1 ($803 ended Mar 3) + A2 ($379 active) combined spend
const ENTRY_PAGE_UV = 875;            // Short-form entry page unique visitors (from ClickFunnels)
const VALID_APPLICANTS_NOTE = "77 valid · 82 raw (−4 duplicates, −1 test entry)";

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
  const { data: conversions } = trpc.giveaway.getConversions.useQuery(undefined, { refetchInterval: 60000 });

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

  const totalApplications = stats?.totalApplications || 0;
  const costPerSubmission = totalApplications > 0
    ? (TOTAL_AD_SPEND / totalApplications).toFixed(2)
    : "0.00";
  const funnelConversionRate = ENTRY_PAGE_UV > 0
    ? ((totalApplications / ENTRY_PAGE_UV) * 100).toFixed(1)
    : "0.0";

  const entryProgress = (ENTRY_PAGE_UV / ENTRY_GOAL) * 100;
  const healthStatus = entryProgress >= 80 ? "on_track" : entryProgress >= 40 ? "behind" : "critical";
  const healthLabel = healthStatus === "on_track" ? "On Track" : healthStatus === "behind" ? "Behind" : "Critical";
  // Status badge: solid background for contrast (min 4.5:1)
  const healthBadgeStyle = healthStatus === "on_track"
    ? { backgroundColor: "#72B84A", color: "#FFFFFF" }
    : healthStatus === "behind"
      ? { backgroundColor: "#F2DD48", color: "#1A1A1A" }
      : { backgroundColor: "#E55A5A", color: "#FFFFFF" };

  if (loadingApps || loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#A8A8A3]" />
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
              style={healthBadgeStyle}
            >
              {healthLabel}
            </span>
          </div>
          <p className="text-sm text-[#6F6F6B] mt-1">
            2026 Lead Generation Campaign · Goal: 150 valid applicants
            {lastSyncInfo && <span className="ml-2 text-xs text-[#A8A8A3]">· Syncs 3× daily</span>}
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          size="sm"
          variant="outline"
          className="border-[#DEDEDA] text-[#6F6F6B] hover:bg-[#F1F1EF] font-medium"
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
            <ProgressBar value={totalApplications} max={LONG_FORM_GOAL} label="Application Goal (Long-Form) ★" color="#F2DD48" />
            <ProgressBar value={ENTRY_PAGE_UV} max={ENTRY_GOAL} label="Entry Page Goal (Short-Form)" color="#DEDEDA" />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Applications (Long-Form)"
          value={totalApplications}
          sub={`${VALID_APPLICANTS_NOTE} · Goal: ${LONG_FORM_GOAL}`}
          icon={Users}
          accent
        />
        <StatCard
          title="Entry Page UV"
          value={ENTRY_PAGE_UV}
          sub={`Goal: ${ENTRY_GOAL} entries • ${Math.max(0, ENTRY_GOAL - ENTRY_PAGE_UV)} remaining`}
          icon={Target}
        />
        <StatCard
          title="Funnel Conversion"
          value={`${funnelConversionRate}%`}
          sub={`${totalApplications} long-form / ${ENTRY_PAGE_UV} entry UV`}
          icon={TrendingUp}
        />
        <StatCard
          title="Cost per Application"
          value={`$${costPerSubmission}`}
          sub={`$${TOTAL_AD_SPEND.toLocaleString()} total · A1 $803 (ended) + A2 $379 (active)`}
          icon={DollarSign}
        />
      </div>

      {/* Bottom Funnel Conversion */}
      <BottomFunnelConversion conversions={conversions} totalApplications={totalApplications} />

      {/* ClickFunnels Funnel Steps */}
      <FunnelTable />

      {/* Tabs: Demographics / Applications */}
      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList className="bg-[#E9E9E6] border border-[#DEDEDA]">
          <TabsTrigger
            value="demographics"
            className="data-[state=active]:bg-white data-[state=active]:text-[#222222] data-[state=active]:shadow-none text-[#6F6F6B]"
          >
            Demographics
          </TabsTrigger>
          <TabsTrigger
            value="applications"
            className="data-[state=active]:bg-white data-[state=active]:text-[#222222] data-[state=active]:shadow-none text-[#6F6F6B]"
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
        className="border rounded-xl p-1"
        style={{
          borderColor: "#DEDEDA",
          background: "rgba(242,221,72,0.06)",
        }}
      >
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <Sparkles className="h-4 w-4" style={{ color: "#B8A800" }} />
          <span className="text-sm font-semibold text-[#222222]">AI Intelligence</span>
          <span className="text-xs text-[#6F6F6B] ml-1">— Powered by Golf VX Marketing Engine</span>
        </div>
        <div className="px-1 pb-1">
          <AIIntelligenceTab programId={5} />
        </div>
      </div>
    </div>
  );
}
