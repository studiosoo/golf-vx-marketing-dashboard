import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { TrendChart } from "@/components/TrendChart";
import {
  TrendingUp, DollarSign, BarChart2, Target, AlertCircle,
  Flag, UserCheck, Users, Crosshair, MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
function fmtPercent(n: number, prefix = true) {
  return `${prefix && n >= 0 ? "+" : ""}${fmt(n, 1)}%`;
}

// ─── Campaign type meta ────────────────────────────────────────────────────────

const CAMPAIGN_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  trial_conversion:      { label: "Trial Conversion",      color: "#3DB855", bg: "#F0FAF3", icon: Target },
  membership_acquisition:{ label: "Membership Acquisition", color: "#F5C72C", bg: "#FFFBEB", icon: UserCheck },
  member_retention:      { label: "Member Retention",       color: "#888888", bg: "#F5F5F5", icon: Users },
  corporate_events:      { label: "B2B Sales",              color: "#111111", bg: "#F5F5F5", icon: Flag },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <p className="text-xs text-[#AAAAAA] mb-1">{label}</p>
      <p className={cn("text-2xl font-bold tracking-tight", highlight ? "text-[#F5C72C]" : "text-[#111111]")}>{value}</p>
      {sub && <p className="text-xs text-[#888888] mt-0.5">{sub}</p>}
    </div>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ["By Program", "KPI Goals", "Meta Ads"] as const;
type Tab = (typeof TABS)[number];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ROI() {
  const [activeTab, setActiveTab] = useState<Tab>("By Program");

  const campaigns       = trpc.campaigns.list.useQuery();
  const metaInsights    = trpc.metaAds.getAllCampaignsWithInsights.useQuery({ datePreset: "last_30d" });
  const toastDaily      = trpc.revenue.getToastDaily.useQuery(undefined);
  const revSummary      = trpc.revenue.getSummary.useQuery(undefined);

  // ── Derived ────────────────────────────────────────────────────────────────

  const campaignList   = (campaigns.data as any[]) ?? [];
  const metaList       = (metaInsights.data as any[]) ?? [];

  // Build lookup: metaAdsCampaignId → insights
  const metaById = new Map<string, any>();
  for (const m of metaList) {
    metaById.set(String(m.id ?? ""), m.insights ?? m);
  }

  const totalMetaSpend = metaList.reduce((s: number, c: any) => {
    const ins = c.insights || c;
    return s + parseFloat(String(ins.spend ?? 0));
  }, 0);

  // Per-program ROI data
  interface ProgramROI {
    id: number;
    name: string;
    category: string;
    status: string;
    metaSpend: number;
    kpiActual: number;
    kpiTarget: number;
    kpiLabel: string;
    costPerConversion: number;
    ctr: number;
    hasMetaAds: boolean;
    performanceScore: number;
  }

  const programROI: ProgramROI[] = campaignList.map((p: any) => {
    const ins = p.metaAdsCampaignId ? (metaById.get(String(p.metaAdsCampaignId)) ?? null) : null;
    const metaSpend = ins ? parseFloat(String(ins.spend ?? 0)) : 0;
    const ctr = ins ? parseFloat(String(ins.ctr ?? 0)) : 0;
    const kpiActual = parseFloat(String(p.kpiActual ?? 0));
    const kpiTarget = parseFloat(String(p.kpiTarget ?? 0));
    const costPerConversion = metaSpend > 0 && kpiActual > 0 ? metaSpend / kpiActual : 0;
    return {
      id: p.id,
      name: p.name,
      category: p.category ?? "member_retention",
      status: p.status ?? "planned",
      metaSpend,
      kpiActual,
      kpiTarget,
      kpiLabel: p.primaryKpi ?? p.kpiUnit ?? "Conversions",
      costPerConversion,
      ctr,
      hasMetaAds: !!p.metaAdsCampaignId,
      performanceScore: parseFloat(String(p.performanceScore ?? 0)),
    };
  });

  const programsWithAds = programROI.filter((p) => p.hasMetaAds && p.metaSpend > 0);
  const programsNoAds   = programROI.filter((p) => !p.hasMetaAds || p.metaSpend === 0);

  // KPI goals
  const kpiPrograms = campaignList.filter((c: any) => c.kpiTarget && parseFloat(String(c.kpiTarget)) > 0);

  // Revenue trend
  const rev = (revSummary.data as any) ?? { total: 0 };
  const trendData = ((toastDaily.data as any[]) ?? []).map((row: any) => {
    const raw = String(row.date ?? "");
    const iso = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
    return { date: iso, value: parseFloat(String(row.totalRevenue ?? 0)) };
  });

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-[#F5C72C]" />
        <div>
          <h1 className="text-lg font-semibold text-[#111111]">ROI & KPI Dashboard</h1>
          <p className="text-xs text-[#888888]">Meta Ads performance by program · Goal tracking · Channel metrics</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="h-11 flex border-b border-[#E0E0E0] bg-white overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 text-sm transition-all duration-200",
              activeTab === tab
                ? "text-[#111111] font-semibold border-b-2 border-[#F5C72C]"
                : "text-[#888888] hover:text-[#111111]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab 1: By Program ──────────────────────────────────────────────────── */}

      {activeTab === "By Program" && (
        <div className="space-y-6">
          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Meta Spend" value={totalMetaSpend > 0 ? fmtCurrency(totalMetaSpend) : "—"} sub="Last 30 days" />
            <StatCard label="Programs with Ads" value={fmt(programsWithAds.length)} sub={`of ${fmt(programROI.length)} total`} />
            <StatCard
              label="Avg Cost/Conversion"
              value={
                programsWithAds.filter((p) => p.costPerConversion > 0).length > 0
                  ? fmtCurrency(
                      programsWithAds.filter((p) => p.costPerConversion > 0)
                        .reduce((s, p) => s + p.costPerConversion, 0) /
                        programsWithAds.filter((p) => p.costPerConversion > 0).length
                    )
                  : "—"
              }
              highlight
            />
            <StatCard label="Revenue (MTD)" value={rev.total > 0 ? fmtCurrency(rev.total) : "—"} sub="All channels" />
          </div>

          {/* Programs with Meta Ads */}
          {metaInsights.isLoading || campaigns.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-36 bg-[#F5F5F5] rounded-[10px] animate-pulse" />
              ))}
            </div>
          ) : programsWithAds.length === 0 && programROI.length === 0 ? (
            <div className="py-12 text-center bg-white border border-[#E0E0E0] rounded-[10px]">
              <AlertCircle className="h-8 w-8 text-[#AAAAAA] mx-auto mb-2" />
              <p className="text-sm text-[#888888]">No program data available.</p>
            </div>
          ) : (
            <>
              {/* Programs tied to Meta campaigns */}
              {programsWithAds.length > 0 && (
                <div>
                  <p className="text-[12px] font-semibold text-[#888888] uppercase tracking-wide mb-3">
                    Active Meta Campaigns ({programsWithAds.length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {programsWithAds.map((p) => {
                      const meta = CAMPAIGN_META[p.category] ?? CAMPAIGN_META.member_retention;
                      const Icon = meta.icon;
                      const kpiPct = p.kpiTarget > 0 ? Math.min(100, (p.kpiActual / p.kpiTarget) * 100) : 0;
                      const kpiColor = kpiPct >= 80 ? "#3DB855" : kpiPct >= 50 ? "#F5C72C" : "#FF3B30";
                      return (
                        <div key={p.id} className="bg-white border border-[#E0E0E0] rounded-[10px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                          {/* Program header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ background: meta.bg }}>
                                <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-[#111111] leading-tight">{p.name}</p>
                                <p className="text-[10px] text-[#AAAAAA]">{meta.label}</p>
                              </div>
                            </div>
                            <span className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                              p.status === "active" ? "bg-[#F0FAF3] text-[#3DB855]" : "bg-[#F5F5F5] text-[#888888]"
                            )}>
                              {p.status}
                            </span>
                          </div>

                          {/* Metrics */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div>
                              <p className="text-[15px] font-bold text-[#111111]">{fmtCurrency(p.metaSpend)}</p>
                              <p className="text-[10px] text-[#AAAAAA]">Meta Spend</p>
                            </div>
                            <div>
                              <p className="text-[15px] font-bold text-[#111111]">
                                {p.kpiActual > 0 ? fmt(p.kpiActual) : "—"}
                              </p>
                              <p className="text-[10px] text-[#AAAAAA]">{p.kpiLabel}</p>
                            </div>
                            <div>
                              <p className="text-[15px] font-bold text-[#111111]">
                                {p.costPerConversion > 0 ? fmtCurrency(p.costPerConversion) : "—"}
                              </p>
                              <p className="text-[10px] text-[#AAAAAA]">Cost/Booking</p>
                            </div>
                          </div>

                          {/* CTR */}
                          {p.ctr > 0 && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <MousePointerClick className="h-3 w-3 text-[#AAAAAA]" />
                              <span className="text-[11px] text-[#888888]">CTR:</span>
                              <span className={cn(
                                "text-[11px] font-semibold",
                                p.ctr >= 2 ? "text-[#3DB855]" : p.ctr >= 1 ? "text-[#F5C72C]" : "text-[#FF3B30]"
                              )}>
                                {fmt(p.ctr, 2)}%
                              </span>
                            </div>
                          )}

                          {/* KPI progress */}
                          {p.kpiTarget > 0 && (
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-[10px] text-[#AAAAAA]">
                                  {fmt(p.kpiActual)} / {fmt(p.kpiTarget)} {p.kpiLabel}
                                </span>
                                <span className="text-[10px] font-bold" style={{ color: kpiColor }}>
                                  {kpiPct.toFixed(0)}%
                                </span>
                              </div>
                              <ProgressBar pct={kpiPct} color={kpiColor} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Programs without Meta Ads */}
              {programsNoAds.length > 0 && (
                <div>
                  <p className="text-[12px] font-semibold text-[#888888] uppercase tracking-wide mb-3">
                    Organic / No Ad Spend ({programsNoAds.length})
                  </p>
                  <div className="bg-white border border-[#E0E0E0] rounded-[10px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#E0E0E0]">
                          {["Program", "Type", "Status", "KPI Actual", "KPI Target"].map((h, i) => (
                            <th key={h} className={cn("text-xs text-[#AAAAAA] font-normal px-4 py-2", i > 0 ? "text-right" : "text-left")}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {programsNoAds.slice(0, 10).map((p) => {
                          const meta = CAMPAIGN_META[p.category] ?? CAMPAIGN_META.member_retention;
                          return (
                            <tr key={p.id} className="h-11 border-b border-[#E0E0E0] last:border-0 hover:bg-[#FAFAFA]">
                              <td className="px-4 text-sm font-medium text-[#111111] max-w-[180px] truncate">{p.name}</td>
                              <td className="px-4 text-right text-xs text-[#888888]">{meta.label}</td>
                              <td className="px-4 text-right">
                                <span className={cn("text-xs font-medium", p.status === "active" ? "text-[#3DB855]" : "text-[#AAAAAA]")}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-4 text-right text-sm text-[#111111]">{p.kpiActual > 0 ? fmt(p.kpiActual) : "—"}</td>
                              <td className="px-4 text-right text-sm text-[#AAAAAA]">{p.kpiTarget > 0 ? fmt(p.kpiTarget) : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Tab 2: KPI Goals ────────────────────────────────────────────────── */}

      {activeTab === "KPI Goals" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard
              label="Programs Tracked"
              value={fmt(campaignList.length)}
              sub={`${fmt(campaignList.filter((c: any) => c.status === "active").length)} active`}
            />
            <StatCard
              label="Avg Performance Score"
              value={
                campaignList.length > 0
                  ? `${fmt(campaignList.reduce((s: number, c: any) => s + parseFloat(String(c.performanceScore ?? 0)), 0) / campaignList.length)}`
                  : "—"
              }
              sub="Out of 100"
            />
            <StatCard
              label="KPI Goals Met"
              value={`${kpiPrograms.filter((c: any) => parseFloat(String(c.kpiActual ?? 0)) >= parseFloat(String(c.kpiTarget))).length} / ${kpiPrograms.length}`}
              highlight
            />
          </div>

          {/* KPI by campaign type */}
          {Object.entries(CAMPAIGN_META).map(([key, meta]) => {
            const typeCampaigns = kpiPrograms.filter((c: any) => c.category === key);
            if (typeCampaigns.length === 0) return null;
            const Icon = meta.icon;
            return (
              <div key={key} className="bg-white border border-[#E0E0E0] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E0E0E0] flex items-center gap-2" style={{ background: meta.bg }}>
                  <Icon className="h-4 w-4" style={{ color: meta.color }} />
                  <h2 className="text-sm font-semibold text-[#111111]">{meta.label}</h2>
                  <span className="text-xs text-[#888888] ml-auto">{typeCampaigns.length} programs</span>
                </div>
                <div className="px-4 py-2">
                  {typeCampaigns.map((c: any) => {
                    const actual = parseFloat(String(c.kpiActual ?? 0));
                    const target = parseFloat(String(c.kpiTarget ?? 1));
                    const pct = Math.min(100, Math.round((actual / target) * 100));
                    const color = pct >= 80 ? "#3DB855" : pct >= 50 ? "#F5C72C" : "#FF3B30";
                    return (
                      <div key={c.id} className="py-3 border-b border-[#F0F0F0] last:border-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-[#111111]">{c.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#888888]">{fmt(actual)} / {fmt(target)}</span>
                            <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
                          </div>
                        </div>
                        <ProgressBar pct={pct} color={color} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {kpiPrograms.length === 0 && !campaigns.isLoading && (
            <div className="py-10 text-center bg-white border border-[#E0E0E0] rounded-[10px]">
              <Crosshair className="h-8 w-8 text-[#AAAAAA] mx-auto mb-2" />
              <p className="text-sm text-[#888888]">No KPI targets set on programs.</p>
              <p className="text-xs text-[#AAAAAA] mt-1">Set kpiTarget on programs to track goals here.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Meta Ads ─────────────────────────────────────────────────── */}

      {activeTab === "Meta Ads" && (
        <div className="space-y-6">
          {metaInsights.isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-[#F5F5F5] rounded animate-pulse" />
              ))}
            </div>
          ) : metaList.length === 0 ? (
            <div className="py-12 text-center bg-white border border-[#E0E0E0] rounded-[10px]">
              <BarChart2 className="h-8 w-8 text-[#AAAAAA] mx-auto mb-2" />
              <p className="text-sm text-[#888888]">No Meta Ads data.</p>
              <p className="text-xs text-[#AAAAAA] mt-1">Data loads from Meta Ads API when connected.</p>
            </div>
          ) : (
            <>
              {/* Totals */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total Spend" value={fmtCurrency(totalMetaSpend)} sub="Last 30 days" />
                <StatCard
                  label="Total Clicks"
                  value={fmt(metaList.reduce((s: number, c: any) => s + parseInt(String((c.insights || c).clicks ?? 0)), 0))}
                />
                <StatCard
                  label="Avg CTR"
                  value={`${fmt(
                    metaList.length > 0
                      ? metaList.reduce((s: number, c: any) => s + parseFloat(String((c.insights || c).ctr ?? 0)), 0) / metaList.length
                      : 0,
                    2
                  )}%`}
                />
                <StatCard
                  label="Total Reach"
                  value={fmt(metaList.reduce((s: number, c: any) => s + parseInt(String((c.insights || c).reach ?? 0)), 0))}
                />
              </div>

              {/* Campaign table */}
              <div className="bg-white border border-[#E0E0E0] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E0E0E0] flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-[#AAAAAA]" />
                  <h2 className="text-sm font-semibold text-[#111111]">All Meta Campaigns — Last 30 Days</h2>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E0E0E0]">
                      {["Campaign", "Spend", "Clicks", "CTR", "CPC", "Reach"].map((h, i) => (
                        <th key={h} className={cn("text-xs text-[#AAAAAA] font-normal px-4 py-2", i > 0 ? "text-right" : "text-left")}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metaList.slice(0, 10).map((c: any) => {
                      const ins = c.insights || c;
                      const spend = parseFloat(String(ins.spend ?? 0));
                      const clicks = parseInt(String(ins.clicks ?? 0));
                      const ctr = parseFloat(String(ins.ctr ?? 0));
                      const cpc = parseFloat(String(ins.cpc ?? 0));
                      const reach = parseInt(String(ins.reach ?? 0));
                      return (
                        <tr key={c.id} className="h-12 border-b border-[#E0E0E0] last:border-0 hover:bg-[#FAFAFA]">
                          <td className="px-4 text-sm font-medium text-[#111111] max-w-[200px] truncate">{c.name}</td>
                          <td className="px-4 text-right text-sm text-[#111111]">{spend > 0 ? fmtCurrency(spend) : "—"}</td>
                          <td className="px-4 text-right text-sm text-[#888888]">{clicks > 0 ? fmt(clicks) : "—"}</td>
                          <td className="px-4 text-right text-sm">
                            {ctr > 0 ? (
                              <span className={cn(ctr >= 2 ? "text-[#3DB855]" : ctr >= 1 ? "text-[#F5C72C]" : "text-[#FF3B30]")}>
                                {fmt(ctr, 2)}%
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-4 text-right text-sm text-[#888888]">{cpc > 0 ? fmtCurrency(cpc) : "—"}</td>
                          <td className="px-4 text-right text-sm text-[#888888]">{reach > 0 ? fmt(reach) : "—"}</td>
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
                    title="Daily Revenue Trend (Toast POS)"
                    valueLabel="Revenue ($)"
                    color="#F5C72C"
                    height={220}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
