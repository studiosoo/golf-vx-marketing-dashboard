import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Target, DollarSign, Layers } from "lucide-react";
import { CAMPAIGN_ITEMS } from "@/data/reportCampaignData";
import { CampaignCard } from "@/components/campaigns/CampaignCard";

const CAMPAIGN_ORDER = [
  "trial_conversion",
  "membership_acquisition",
  "member_retention",
  "corporate_events",
];

type Period = "mtd" | "alltime";

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex items-center gap-1 mt-1">
      {(["mtd", "alltime"] as Period[]).map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className="text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors"
          style={value === p ? { background: "#222222", color: "white" } : { background: "#F1F1EF", color: "#6F6F6B" }}
        >
          {p === "mtd" ? "MTD" : "All-Time"}
        </button>
      ))}
    </div>
  );
}

export default function StrategicCampaigns() {
  const { data: campaigns, isLoading } = trpc.strategicCampaigns.getOverview.useQuery();
  const { data: kpiData }              = trpc.intelligence.getStrategicKPIs.useQuery();

  const [spendPeriod, setSpendPeriod] = useState<Period>("mtd");
  const [revPeriod,   setRevPeriod]   = useState<Period>("mtd");

  const now        = new Date();
  const minDateMTD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: metaInsightsMTD } = trpc.metaAds.getAllCampaignsWithInsights.useQuery(
    { datePreset: "this_month" },
    { staleTime: 10 * 60 * 1000 }
  );
  const { data: toastSummary } = trpc.revenue.getToastSummary.useQuery(
    undefined, { staleTime: 5 * 60 * 1000 }
  );
  const { data: acuity } = trpc.revenue.getAcuityRevenue.useQuery(
    { minDate: minDateMTD },
    { staleTime: 5 * 60 * 1000 }
  );

  // Deduplicated item counts across all campaigns
  const itemCounts = useMemo(() => {
    const seen = new Set<string>();
    let programs = 0, promotions = 0, paidAds = 0;
    for (const id of CAMPAIGN_ORDER) {
      const data = CAMPAIGN_ITEMS[id];
      if (!data) continue;
      data.programs.forEach(i   => { if (!seen.has(i.id)) { seen.add(i.id); programs++;   } });
      data.promotions.forEach(i => { if (!seen.has(i.id)) { seen.add(i.id); promotions++; } });
      data.paidAds.forEach(i    => { if (!seen.has(i.id)) { seen.add(i.id); paidAds++;    } });
    }
    return { programs, promotions, paidAds, total: programs + promotions + paidAds };
  }, []);

  const metaMTDSpend = (metaInsightsMTD as any[] | undefined)
    ?.reduce((sum: number, c: any) => sum + parseFloat(String(c.spend ?? c.insights?.spend ?? "0")), 0) ?? 0;
  const allTimeSpend = campaigns?.reduce((sum, c) => sum + c.totalSpend,   0) ?? 0;
  const mtdRevenue   = (toastSummary?.thisMonthRevenue ?? 0) + ((acuity as any)?.total ?? 0);
  const allTimeRev   = campaigns?.reduce((sum, c) => sum + c.totalRevenue, 0) ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-7 w-64 bg-[#E9E9E6] rounded-lg animate-pulse" />
        <div className="grid gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-[#E9E9E6] rounded-xl animate-pulse border border-[#DEDEDA]" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-80 bg-[#E9E9E6] rounded-xl animate-pulse border border-[#DEDEDA]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-5">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#222222" }}>Strategic Campaigns</h1>
        <p style={{ fontSize: "13px", color: "#6F6F6B", marginTop: "4px" }}>
          High-level strategic objectives with aggregated program performance
        </p>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {/* Total Campaigns */}
        <div className="bg-white border border-[#DEDEDA] rounded-xl p-4" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#A8A8A3]">Total Campaigns</p>
            <Target className="h-4 w-4 text-[#A8A8A3]" />
          </div>
          <p className="text-2xl font-bold text-[#222222]">4</p>
          <p className="text-[10px] text-[#A8A8A3] mt-0.5">Trial · Membership · Retention · B2B</p>
        </div>

        {/* Items */}
        <div className="bg-white border border-[#DEDEDA] rounded-xl p-4" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#A8A8A3]">Items</p>
            <Layers className="h-4 w-4 text-[#A8A8A3]" />
          </div>
          <p className="text-2xl font-bold text-[#222222]">{itemCounts.total}</p>
          <p className="text-[10px] text-[#A8A8A3] mt-0.5">
            {itemCounts.programs} prg · {itemCounts.promotions} promo · {itemCounts.paidAds} ads
          </p>
        </div>

        {/* Total Spend */}
        <div className="bg-white border border-[#DEDEDA] rounded-xl p-4" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#A8A8A3]">Total Spend</p>
            <DollarSign className="h-4 w-4 text-[#A8A8A3]" />
          </div>
          <p className="text-2xl font-bold text-[#222222]">
            {spendPeriod === "mtd" ? fmt(metaMTDSpend) : fmt(allTimeSpend)}
          </p>
          <PeriodToggle value={spendPeriod} onChange={setSpendPeriod} />
          <p className="text-[10px] text-[#A8A8A3] mt-0.5">
            {spendPeriod === "mtd" ? "Meta Ads this month" : "All-time (DB)"}
          </p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white border border-[#DEDEDA] rounded-xl p-4" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#A8A8A3]">Total Revenue</p>
            <TrendingUp className="h-4 w-4 text-[#A8A8A3]" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-[#222222]">
              {revPeriod === "mtd" ? fmt(mtdRevenue) : fmt(allTimeRev)}
            </p>
            {revPeriod === "alltime" && (
              <span
                title="Full historical data pending complete Toast + Acuity sync. All-Time reads from campaign DB records which are not fully populated."
                className="text-[10px] font-medium px-1.5 py-0.5 rounded cursor-help"
                style={{ background: "rgba(216,154,60,0.12)", color: "#C47A20" }}
              >
                ESTIMATED
              </span>
            )}
          </div>
          <PeriodToggle value={revPeriod} onChange={setRevPeriod} />
          <p className="text-[10px] text-[#A8A8A3] mt-0.5">
            {revPeriod === "mtd" ? "Toast + Acuity MTD" : "All-time (DB · incomplete)"}
          </p>
        </div>
      </div>

      {/* Campaign Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {CAMPAIGN_ORDER.map(id => (
          <CampaignCard
            key={id}
            campaignId={id}
            campaign={campaigns?.find(c => c.id === id)}
            kpiData={kpiData}
          />
        ))}
      </div>
    </div>
  );
}
