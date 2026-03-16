import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DollarSign, BarChart3, ArrowRight, TrendingUp, Activity } from "lucide-react";
import { useState } from "react";

export default function Performance() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"campaigns" | "channels">("campaigns");

  const { data: campaigns, isLoading: campaignsLoading } = trpc.campaigns.list.useQuery();
  const { data: channelSummary } = trpc.campaigns.getCategorySummary.useQuery();
  const { data: revSummary } = trpc.revenue.getSummary.useQuery(undefined);

  const formatCurrency = (val: number | string) =>
    `$${parseFloat(String(val || 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const formatROAS = (spend: number | string, revenue: number | string) => {
    const s = parseFloat(String(spend || 0));
    const r = parseFloat(String(revenue || 0));
    return s > 0 ? (r / s).toFixed(2) + "x" : "—";
  };

  const campaignList = (campaigns as any[]) ?? [];
  const totalSpend = campaignList.reduce((s: number, c: any) => s + parseFloat(String(c.actualSpend || 0)), 0);
  const totalRevenue = parseFloat(String(revSummary?.total || 0));
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : null;

  const kpis = [
    { label: "Revenue (MTD)", value: formatCurrency(totalRevenue), icon: DollarSign, color: "#72B84A", bg: "#E6F0DC" },
    { label: "Ad Spend",       value: formatCurrency(totalSpend),  icon: TrendingUp, color: "#F2DD48", bg: "#FDF9E3" },
    { label: "Active Campaigns", value: String(campaignList.length), icon: Activity, color: "#6F6F6B", bg: "#F1F1EF" },
    { label: "Avg ROAS",       value: roas !== null ? `${roas.toFixed(2)}×` : "—", icon: BarChart3, color: "#6F6F6B", bg: "#F1F1EF" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold text-[#222222] leading-tight">Performance</h1>
        <p className="text-sm text-[#6F6F6B] mt-0.5">Campaign & channel performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white border border-[#DEDEDA] rounded-xl p-4 flex items-center gap-3"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: bg }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <p className="text-xs text-[#A8A8A3]">{label}</p>
              <p className="text-lg font-bold text-[#222222] leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="h-11 flex border-b border-[#DEDEDA]">
        {(["campaigns", "channels"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 text-sm capitalize transition-all duration-200 ${
              activeTab === tab
                ? "text-[#222222] font-semibold border-b-2 border-[#F2DD48]"
                : "text-[#A8A8A3] font-normal hover:text-[#222222]"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <div className="space-y-3">
          {campaignsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-[#F1F1EF] rounded-xl animate-pulse border border-[#DEDEDA]" />
            ))
          ) : campaigns && campaigns.length > 0 ? (
            campaigns.map((c: any) => (
              <div
                key={c.id}
                className="bg-white border border-[#DEDEDA] rounded-xl p-4"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[#222222] text-sm">{c.name}</span>
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                        c.status === "active"
                          ? "bg-[#E6F0DC] text-[#4D7A30]"
                          : "bg-[#F1F1EF] text-[#A8A8A3]"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-[#6F6F6B]">
                      <span>Spend: {formatCurrency(c.actualSpend)}</span>
                      <span>Revenue: {formatCurrency(c.actualRevenue)}</span>
                      <span>ROAS: {formatROAS(c.actualSpend, c.actualRevenue)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[#222222]">
                      {formatROAS(c.actualSpend, c.actualRevenue)}
                    </div>
                    <div className="text-xs text-[#A8A8A3]">ROAS</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-[#A8A8A3] text-sm">No campaigns found</div>
          )}
        </div>
      )}

      {/* Channels Tab */}
      {activeTab === "channels" && (
        <div>
          {channelSummary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(channelSummary as any[]).map((ch: any) => (
                <div
                  key={ch.id ?? ch.category ?? ch.name}
                  className="bg-white border border-[#DEDEDA] rounded-xl p-4"
                  style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-[#222222] text-sm capitalize">
                      {ch.name ?? ch.category}
                    </span>
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded border border-[#DEDEDA] text-[#6F6F6B]">
                      {ch.totalCampaigns ?? ch.campaignCount ?? 0} campaigns
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "Spend",   value: formatCurrency(ch.totalSpend) },
                      { label: "Revenue", value: formatCurrency(ch.totalRevenue) },
                      { label: "ROAS",    value: formatROAS(ch.totalSpend, ch.totalRevenue) },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div className="text-sm font-semibold text-[#222222]">{value}</div>
                        <div className="text-xs text-[#A8A8A3]">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#A8A8A3] text-sm">Loading channel data...</div>
          )}

          {/* Meta Ads callout */}
          <button
            onClick={() => navigate("/advertising")}
            className="w-full flex items-center justify-between px-4 py-3 mt-4 bg-[#FDF9E3] border border-[#F2DD48]/30 rounded-[10px] hover:bg-[#F2DD48]/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="h-4 w-4 text-[#F2DD48]" />
              <div className="text-left">
                <p className="text-sm font-semibold text-[#222222]">Meta Ads Campaigns</p>
                <p className="text-xs text-[#6F6F6B]">Facebook & Instagram campaign details in Advertising</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#A8A8A3]" />
          </button>
        </div>
      )}
    </div>
  );
}
