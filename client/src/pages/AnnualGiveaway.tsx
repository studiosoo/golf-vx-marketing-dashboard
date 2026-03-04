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

const ENTRY_GOAL = 250;
const LONG_FORM_GOAL = 250;
const TOTAL_AD_SPEND = 467.59;
const ENTRY_PAGE_UV = 875;

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
  const healthColor = healthStatus === "on_track" ? "#3DB855" : healthStatus === "behind" ? "#F5C72C" : "#888888";
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
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">Annual Membership Giveaway</h1>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${healthColor}20`, color: healthColor }}
            >
              {healthLabel}
            </span>
          </div>
          <p className="text-sm text-[#888888] mt-1">
            2026 Lead Generation Campaign
            {lastSyncInfo && <span className="ml-2 text-xs text-[#AAAAAA]">• Syncs 3× daily</span>}
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          size="sm"
          className="bg-[#F5C72C] hover:bg-[#e6b820] text-[#111111] font-semibold"
        >
          {syncMutation.isPending
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Syncing...</>
            : <><RefreshCw className="mr-2 h-4 w-4" />Refresh Data</>
          }
        </Button>
      </div>

      {/* Goal Progress */}
      <Card className="border border-[#E0E0E0] shadow-none">
        <CardContent className="pt-4 pb-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ProgressBar value={ENTRY_PAGE_UV} max={ENTRY_GOAL} label="Entry Goal (Short-Form)" color="#F5C72C" />
            <ProgressBar value={totalApplications} max={LONG_FORM_GOAL} label="Application Goal (Long-Form)" color="#545A60" />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Applications (Long-Form)"
          value={totalApplications}
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
          value={`${funnelConversionRate}%`}
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

      {/* Bottom Funnel Conversion */}
      <BottomFunnelConversion conversions={conversions} totalApplications={totalApplications} />

      {/* ClickFunnels Funnel Steps */}
      <FunnelTable />

      {/* AI Intelligence scroll anchor */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-[#111111]">Campaign Analysis</div>
        <button
          onClick={() => {
            const el = document.getElementById("giveaway-ai-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
          style={{
            background: "linear-gradient(135deg, #F5C72C 0%, #e6b820 100%)",
            color: "#111111",
            boxShadow: "0 2px 8px rgba(245,199,44,0.4)",
          }}
        >
          <Sparkles className="h-4 w-4" />
          AI Intelligence
        </button>
      </div>

      {/* Tabs: Demographics / Applications */}
      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList className="bg-[#F2F2F7] border border-[#E0E0E0]">
          <TabsTrigger
            value="demographics"
            className="data-[state=active]:bg-white data-[state=active]:text-[#111111] data-[state=active]:shadow-none text-[#888888]"
          >
            Demographics
          </TabsTrigger>
          <TabsTrigger
            value="applications"
            className="data-[state=active]:bg-white data-[state=active]:text-[#111111] data-[state=active]:shadow-none text-[#888888]"
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
          borderColor: "#F5C72C",
          background: "linear-gradient(135deg, rgba(245,199,44,0.05) 0%, rgba(245,199,44,0.02) 100%)",
        }}
      >
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <Sparkles className="h-5 w-5" style={{ color: "#F5C72C" }} />
          <span className="text-base font-bold text-[#111111]">AI Intelligence</span>
          <span className="text-xs text-[#888888] ml-1">— Powered by Golf VX Marketing Engine</span>
        </div>
        <div className="px-1 pb-1">
          <AIIntelligenceTab programId={5} />
        </div>
      </div>
    </div>
  );
}
