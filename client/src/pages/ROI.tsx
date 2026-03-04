import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { TrendChart } from "@/components/TrendChart";
import { TrendingUp, DollarSign, BarChart2, Target, AlertCircle } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtPercent(n: number) {
  return `${n >= 0 ? "+" : ""}${fmt(n, 1)}%`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <p className="text-xs text-[#AAAAAA] mb-1">{label}</p>
      <p
        className={`text-2xl font-bold tracking-tight ${
          highlight ? "text-[#F5C72C]" : "text-[#111111]"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-[#888888] mt-0.5">{sub}</p>}
    </div>
  );
}

function KpiRow({
  label,
  actual,
  target,
  score,
}: {
  label: string;
  actual: number;
  target: number;
  score: number;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  const color = pct >= 80 ? "#3DB855" : pct >= 50 ? "#F5C72C" : "#FF3B30";

  return (
    <div className="py-3 border-b border-[#E0E0E0] last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-[#111111]">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#888888]">
            {fmt(actual)} / {fmt(target)}
          </span>
          <span className="text-xs font-bold" style={{ color }}>
            {pct}%
          </span>
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: color }}>
            {score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D"}
          </div>
        </div>
      </div>
      <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ["ROI Overview", "KPI Tracking", "Channel Performance"] as const;
type Tab = (typeof TABS)[number];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ROI() {
  const [activeTab, setActiveTab] = useState<Tab>("ROI Overview");

  const revSummary = trpc.revenue.getSummary.useQuery(undefined);
  const toastDaily = trpc.revenue.getToastDaily.useQuery(undefined);
  const campaigns = trpc.campaigns.list.useQuery();
  const metaInsights = trpc.metaAds.getAllCampaignsWithInsights.useQuery({ datePreset: "last_30d" });

  // ── Derived: ROI Overview ──────────────────────────────────────────────────

  const rev = revSummary.data ?? { total: 0, toastRevenue: 0, acuityRevenue: 0, memberCount: 0 };

  const metaCampaignList = (metaInsights.data as any[]) ?? [];
  const totalMetaSpend = metaCampaignList.reduce((s: number, c: any) => {
    const ins = c.insights || c;
    return s + parseFloat(String(ins.spend ?? 0));
  }, 0);

  const roi = totalMetaSpend > 0 ? ((rev.total - totalMetaSpend) / totalMetaSpend) * 100 : 0;
  const roas = totalMetaSpend > 0 ? rev.total / totalMetaSpend : 0;

  // ── Derived: Daily trend ───────────────────────────────────────────────────

  const trendData = ((toastDaily.data as any[]) ?? []).map((row: any) => ({
    date: String(row.date),
    value: parseFloat(String(row.netSales ?? row.total_net_sales ?? row.revenue ?? 0)),
  }));

  // ── Derived: KPI Tracking ──────────────────────────────────────────────────

  const campaignList = (campaigns.data as any[]) ?? [];
  const kpiRows = campaignList
    .filter((c: any) => c.kpiTarget && c.kpiTarget > 0)
    .map((c: any) => ({
      label: c.name,
      actual: Number(c.kpiActual ?? 0),
      target: Number(c.kpiTarget ?? 1),
      score: Number(c.performanceScore ?? 0),
    }));

  // ── Derived: Channel Performance ──────────────────────────────────────────

  interface MetaCampaign {
    id: string;
    name: string;
    insights: {
      spend?: string | number;
      impressions?: string | number;
      clicks?: string | number;
      ctr?: string | number;
      cpc?: string | number;
      reach?: string | number;
    };
  }

  const metaRows: MetaCampaign[] = metaCampaignList.slice(0, 8).map((c: any) => ({
    id: String(c.id ?? ""),
    name: String(c.name ?? "Unknown"),
    insights: c.insights ?? c,
  }));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-[#F5C72C]" />
          <div>
            <h1 className="text-lg font-semibold text-[#111111]">ROI & KPI Dashboard</h1>
            <p className="text-xs text-[#888888]">Return on investment and campaign performance tracking</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="h-11 flex border-b border-[#E0E0E0] bg-white">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 text-sm transition-all duration-200 ${
                activeTab === tab
                  ? "text-[#111111] font-semibold border-b-2 border-[#F5C72C]"
                  : "text-[#888888] hover:text-[#111111]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Tab 1: ROI Overview ───────────────────────────────────────────── */}

        {activeTab === "ROI Overview" && (
          <div className="space-y-6">
            {revSummary.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-[#F5F5F5] rounded-[10px] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total Revenue (MTD)" value={fmtCurrency(rev.total)} sub={`${fmt(rev.memberCount)} transactions`} />
                <StatCard label="Ad Spend (Meta)" value={fmtCurrency(totalMetaSpend)} sub="Last 30 days" />
                <StatCard label="Overall ROI" value={fmtPercent(roi)} highlight={roi > 0} sub="(Revenue − Spend) / Spend" />
                <StatCard label="ROAS" value={`${fmt(roas, 2)}×`} highlight={roas >= 2} sub="Revenue per $1 ad spend" />
              </div>
            )}

            {/* Channel breakdown */}
            <div className="bg-white border border-[#E0E0E0] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E0E0E0]">
                <h2 className="text-sm font-semibold text-[#111111]">Channel Breakdown</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E0E0E0]">
                    {["Channel", "Revenue", "Ad Spend", "ROI", "ROAS"].map((h) => (
                      <th key={h} className="text-xs text-[#AAAAAA] font-normal px-4 py-2 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { channel: "Toast POS", revenue: rev.toastRevenue, spend: 0 },
                    { channel: "Acuity", revenue: rev.acuityRevenue, spend: 0 },
                    { channel: "Meta Ads", revenue: rev.total, spend: totalMetaSpend },
                  ].map((row) => {
                    const rowRoi = row.spend > 0 ? ((row.revenue - row.spend) / row.spend) * 100 : null;
                    const rowRoas = row.spend > 0 ? row.revenue / row.spend : null;
                    return (
                      <tr key={row.channel} className="h-12 border-b border-[#E0E0E0] last:border-0 hover:bg-[#F5F5F5]">
                        <td className="px-4 text-sm font-medium text-[#111111]">{row.channel}</td>
                        <td className="px-4 text-sm text-[#111111]">{fmtCurrency(row.revenue)}</td>
                        <td className="px-4 text-sm text-[#888888]">{row.spend > 0 ? fmtCurrency(row.spend) : "—"}</td>
                        <td className="px-4 text-sm">
                          {rowRoi !== null ? (
                            <span className={rowRoi >= 0 ? "text-[#3DB855]" : "text-[#FF3B30]"}>
                              {fmtPercent(rowRoi)}
                            </span>
                          ) : (
                            <span className="text-[#AAAAAA]">—</span>
                          )}
                        </td>
                        <td className="px-4 text-sm text-[#111111]">
                          {rowRoas !== null ? `${fmt(rowRoas, 2)}×` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Revenue trend */}
            <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              {toastDaily.isLoading ? (
                <div className="h-48 bg-[#F5F5F5] rounded animate-pulse" />
              ) : (
                <TrendChart
                  data={trendData}
                  title="Daily Revenue (Toast POS)"
                  valueLabel="Revenue"
                  color="#F5C72C"
                  height={220}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Tab 2: KPI Tracking ───────────────────────────────────────────── */}

        {activeTab === "KPI Tracking" && (
          <div className="space-y-6">
            {/* Summary cards */}
            {campaigns.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-[#F5F5F5] rounded-[10px] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard label="Active Campaigns" value={fmt(campaignList.filter((c: any) => c.status === "active").length)} />
                <StatCard
                  label="Avg Performance Score"
                  value={`${fmt(
                    campaignList.length > 0
                      ? campaignList.reduce((s: number, c: any) => s + Number(c.performanceScore ?? 0), 0) / campaignList.length
                      : 0,
                    0
                  )}`}
                  sub="Out of 100"
                />
                <StatCard
                  label="KPI Goals Met"
                  value={`${kpiRows.filter((r) => r.actual >= r.target).length} / ${kpiRows.length}`}
                  highlight
                />
              </div>
            )}

            {/* KPI rows */}
            <div className="bg-white border border-[#E0E0E0] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-4 py-3 border-b border-[#E0E0E0] flex items-center gap-2">
                <Target className="h-4 w-4 text-[#AAAAAA]" />
                <h2 className="text-sm font-semibold text-[#111111]">Campaign KPI Progress</h2>
              </div>
              <div className="px-4 py-2">
                {campaigns.isLoading ? (
                  <div className="space-y-3 py-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-10 bg-[#F5F5F5] rounded animate-pulse" />
                    ))}
                  </div>
                ) : kpiRows.length === 0 ? (
                  <div className="py-10 text-center">
                    <AlertCircle className="h-8 w-8 text-[#AAAAAA] mx-auto mb-2" />
                    <p className="text-sm text-[#888888]">No campaigns with KPI targets found.</p>
                    <p className="text-xs text-[#AAAAAA] mt-1">Set kpiTarget on campaigns to track goals here.</p>
                  </div>
                ) : (
                  kpiRows.map((row) => (
                    <KpiRow key={row.label} {...row} />
                  ))
                )}
              </div>
            </div>

            {/* All campaigns table */}
            {campaignList.length > 0 && (
              <div className="bg-white border border-[#E0E0E0] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E0E0E0]">
                  <h2 className="text-sm font-semibold text-[#111111]">All Campaigns</h2>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E0E0E0]">
                      {["Campaign", "Type", "Status", "Score"].map((h) => (
                        <th key={h} className="text-xs text-[#AAAAAA] font-normal px-4 py-2 text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaignList.slice(0, 15).map((c: any) => {
                      const score = Number(c.performanceScore ?? 0);
                      const scoreColor = score >= 80 ? "#3DB855" : score >= 50 ? "#F5C72C" : "#FF3B30";
                      return (
                        <tr key={c.id} className="h-12 border-b border-[#E0E0E0] last:border-0 hover:bg-[#F5F5F5]">
                          <td className="px-4 text-sm font-medium text-[#111111] max-w-[200px] truncate">{c.name}</td>
                          <td className="px-4 text-xs text-[#888888]">{c.type ?? "—"}</td>
                          <td className="px-4">
                            <span
                              className={`text-xs font-medium ${
                                c.status === "active"
                                  ? "text-[#3DB855]"
                                  : c.status === "upcoming"
                                  ? "text-[#F5C72C]"
                                  : "text-[#AAAAAA]"
                              }`}
                            >
                              {c.status ?? "—"}
                            </span>
                          </td>
                          <td className="px-4">
                            <span className="text-sm font-bold" style={{ color: scoreColor }}>
                              {fmt(score)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Channel Performance ────────────────────────────────────── */}

        {activeTab === "Channel Performance" && (
          <div className="space-y-6">
            {/* Meta Ads */}
            <div className="bg-white border border-[#E0E0E0] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E0E0E0] flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[#AAAAAA]" />
                <h2 className="text-sm font-semibold text-[#111111]">Meta Ads — Last 30 Days</h2>
              </div>
              {metaInsights.isLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-[#F5F5F5] rounded animate-pulse" />
                  ))}
                </div>
              ) : metaRows.length === 0 ? (
                <div className="py-10 text-center">
                  <DollarSign className="h-8 w-8 text-[#AAAAAA] mx-auto mb-2" />
                  <p className="text-sm text-[#888888]">No Meta Ads data available.</p>
                  <p className="text-xs text-[#AAAAAA] mt-1">Connect Meta Ads in Settings → Integrations.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E0E0E0]">
                      {["Campaign", "Spend", "Clicks", "CTR", "CPC", "Reach"].map((h) => (
                        <th key={h} className="text-xs text-[#AAAAAA] font-normal px-4 py-2 text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metaRows.map((c) => {
                      const ins = c.insights;
                      const spend = parseFloat(String(ins.spend ?? 0));
                      const clicks = parseInt(String(ins.clicks ?? 0));
                      const ctr = parseFloat(String(ins.ctr ?? 0));
                      const cpc = parseFloat(String(ins.cpc ?? 0));
                      const reach = parseInt(String(ins.reach ?? 0));
                      return (
                        <tr key={c.id} className="h-12 border-b border-[#E0E0E0] last:border-0 hover:bg-[#F5F5F5]">
                          <td className="px-4 text-sm font-medium text-[#111111] max-w-[200px] truncate">{c.name}</td>
                          <td className="px-4 text-sm text-[#111111]">{fmtCurrency(spend)}</td>
                          <td className="px-4 text-sm text-[#888888]">{fmt(clicks)}</td>
                          <td className="px-4 text-sm">
                            <span className={ctr >= 2 ? "text-[#3DB855]" : ctr >= 1 ? "text-[#F5C72C]" : "text-[#FF3B30]"}>
                              {fmt(ctr, 2)}%
                            </span>
                          </td>
                          <td className="px-4 text-sm text-[#888888]">{cpc > 0 ? fmtCurrency(cpc) : "—"}</td>
                          <td className="px-4 text-sm text-[#888888]">{reach > 0 ? fmt(reach) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Meta Ads totals */}
            {metaRows.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Total Meta Spend"
                  value={fmtCurrency(totalMetaSpend)}
                  sub="Last 30 days"
                />
                <StatCard
                  label="Total Clicks"
                  value={fmt(
                    metaRows.reduce((s, c) => s + parseInt(String(c.insights.clicks ?? 0)), 0)
                  )}
                />
                <StatCard
                  label="Avg CTR"
                  value={`${fmt(
                    metaRows.length > 0
                      ? metaRows.reduce((s, c) => s + parseFloat(String(c.insights.ctr ?? 0)), 0) / metaRows.length
                      : 0,
                    2
                  )}%`}
                />
                <StatCard
                  label="Total Reach"
                  value={fmt(
                    metaRows.reduce((s, c) => s + parseInt(String(c.insights.reach ?? 0)), 0)
                  )}
                />
              </div>
            )}

            {/* Revenue trend */}
            <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              {toastDaily.isLoading ? (
                <div className="h-48 bg-[#F5F5F5] rounded animate-pulse" />
              ) : (
                <TrendChart
                  data={trendData}
                  title="Daily Revenue Trend (Toast POS)"
                  valueLabel="Revenue ($)"
                  color="#F5C72C"
                  height={220}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
