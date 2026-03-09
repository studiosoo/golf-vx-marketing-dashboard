import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Activity, ShoppingBag, CreditCard, Award, Info } from "lucide-react";

// ─── Design Tokens (Golf VX Style Guide v2) ────────────────────────────────────
const YELLOW  = "#F5C72C";   // App yellow — CTAs, active states, chart fills
const TEXT_P  = "#222222";   // --gvx-text-primary
const TEXT_S  = "#6F6F6B";   // --gvx-text-secondary
const TEXT_M  = "#A8A8A3";   // --gvx-text-muted
const BORDER  = "#DEDEDA";   // --gvx-border-subtle
const BG_S    = "#F1F1EF";   // --gvx-bg-subtle
const GRN_TXT = "#72B84A";   // --gvx-green-solid
const GRN_BG  = "#E6F0DC";   // --gvx-green-soft
const ORG_TXT = "#D89A3C";   // --gvx-orange-solid (ended / completed states)
const ORG_BG  = "#F6E5CF";   // --gvx-orange-soft

function fmt(v: number | string) {
  const n = parseFloat(String(v || 0));
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/** Convert YYYYMMDD → YYYY-MM-DD for display */
function fmtDate(raw: string) {
  if (!raw || raw.length < 8) return raw;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function calcHealthScore(p: {
  goalCompletionPct: number; attendancePct: number; revenuePct: number;
  leadCapturePct: number; socialPct: number;
}) {
  const w = p.goalCompletionPct * 0.30 + p.attendancePct * 0.25 + p.revenuePct * 0.20 +
    p.leadCapturePct * 0.15 + p.socialPct * 0.10;
  return Math.min(5, Math.max(1, Math.round((w / 100) * 4 + 1)));
}

function HealthDots({ score }: { score: number }) {
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="w-2 h-2 rounded-full" style={{ background: i <= score ? YELLOW : BORDER }} />
      ))}
      <span className="text-xs ml-1" style={{ color: TEXT_M }}>{score}/5</span>
    </div>
  );
}

function MetricTag({ type, value }: { type: "ROAS" | "ROI" | "KPI"; value: string }) {
  const styles =
    type === "ROAS" ? { bg: GRN_BG,  text: GRN_TXT } :
    type === "ROI"  ? { bg: "#EAF2FF", text: "#4E8DF4" } :
                     { bg: "#F8F1C8", text: "#b8900a" };
  return (
    <span
      className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border"
      style={{ background: styles.bg, color: styles.text, borderColor: styles.bg }}
    >
      {type}: {value}
    </span>
  );
}

// ─── Card (Golf VX v2: 16px radius, minimal shadow) ───────────────────────────
function Card({ children, className = "", accent = false }: {
  children: React.ReactNode; className?: string; accent?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}
      style={{
        border: accent ? `1px solid ${BORDER}` : `1px solid ${BORDER}`,
        ...(accent ? { borderLeft: `4px solid ${YELLOW}` } : {}),
      }}
    >
      {children}
    </div>
  );
}

// ─── Custom Tab Bar (yellow underline, v2 spec) ────────────────────────────────
function TabBar({ tabs, active, onChange }: {
  tabs: Array<{ value: string; label: string }>;
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="h-11 flex overflow-x-auto" style={{ borderBottom: `1px solid ${BORDER}` }}>
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className="px-4 h-full shrink-0 text-sm transition-all duration-200"
          style={
            active === t.value
              ? { fontWeight: 600, color: TEXT_P, borderBottom: `2px solid ${YELLOW}` }
              : { fontWeight: 400, color: TEXT_S }
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Weekly Summary Tab ────────────────────────────────────────────────────────
function WeeklySummaryTab({ snapshot, toastDaily, toastSummary }: {
  snapshot: any; toastDaily: any; toastSummary: any;
}) {
  const lastWeek = useMemo(() => {
    if (!Array.isArray(toastDaily)) return { bay: 0, fnb: 0, total: 0 };
    const last7 = (toastDaily as any[]).slice(-7);
    return {
      bay:   last7.reduce((s: number, d: any) => s + parseFloat(d.bayRevenue || 0), 0),
      fnb:   last7.reduce((s: number, d: any) => s + parseFloat(d.foodBevRevenue || 0), 0),
      total: last7.reduce((s: number, d: any) => s + parseFloat(d.totalRevenue || 0), 0),
    };
  }, [toastDaily]);

  // If bayRevenue is 0 but total > fnb, bay = total - fnb (Toast sync gap)
  const bayDisplay = lastWeek.bay > 0 ? lastWeek.bay : Math.max(0, lastWeek.total - lastWeek.fnb);

  const ts           = toastSummary as any;
  const lastMonthTotal = parseFloat(ts?.lastMonthRevenue || 0);
  const mrr          = snapshot?.members?.mrr || 0;
  const newMembers   = snapshot?.members?.newThisMonth || 0;

  const rows = [
    { label: "Bay Rental Revenue",  week: fmt(bayDisplay),          month: "—",               note: bayDisplay > 0 && lastWeek.bay === 0 ? "calc." : "" },
    { label: "F&B Revenue",         week: fmt(lastWeek.fnb),        month: "—" },
    { label: "Toast Total",         week: fmt(lastWeek.total),      month: fmt(lastMonthTotal), highlight: true },
    { label: "MRR (memberships)",   week: mrr ? fmt(mrr) : "—",     month: "monthly recurring" },
    { label: "Meta Ad Spend",       week: "—",                      month: "$1,648 (Feb–Mar snapshot)" },
    { label: "New Members",         week: "—",                      month: `+${newMembers} this month` },
  ];

  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
        style={{ background: BG_S, border: `1px solid ${BORDER}`, color: TEXT_S }}
      >
        <Activity size={12} />
        <span>Last 7 days vs prior full month — live Toast POS where available</span>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              <th className="text-left px-4 py-3 text-xs font-normal" style={{ color: TEXT_M }}>Metric</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: YELLOW }}>Last 7 Days</th>
              <th className="text-right px-4 py-3 text-xs font-normal" style={{ color: TEXT_M }}>Last Month</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} style={{ borderBottom: `1px solid ${BORDER}`, background: r.highlight ? BG_S : undefined }}>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: TEXT_P }}>
                  {r.label}
                  {r.note && <span className="ml-1 text-[10px]" style={{ color: TEXT_M }}>({r.note})</span>}
                </td>
                <td className="px-4 py-3 text-right font-bold" style={{ color: TEXT_P }}>{r.week}</td>
                <td className="px-4 py-3 text-right text-xs" style={{ color: TEXT_S }}>{r.month}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Revenue Tab ───────────────────────────────────────────────────────────────
function RevenueTab() {
  const { data: toastDaily, isLoading } = trpc.revenue.getToastDaily.useQuery({ startDate: undefined, endDate: undefined });
  const { data: toastSummary }           = trpc.revenue.getToastSummary.useQuery();
  const { data: acuityRevenue }          = trpc.revenue.getAcuityRevenue.useQuery({ minDate: undefined, maxDate: undefined });

  const weeklyChart = useMemo(() => {
    if (!Array.isArray(toastDaily) || !(toastDaily as any[]).length) return [];
    const days = (toastDaily as any[]).slice(-28);
    return [0, 1, 2, 3].map(w => {
      const chunk = days.slice(w * 7, (w + 1) * 7);
      if (!chunk.length) return null;
      const fnb  = chunk.reduce((s: number, d: any) => s + parseFloat(d.foodBevRevenue || 0), 0);
      const total = chunk.reduce((s: number, d: any) => s + parseFloat(d.totalRevenue || 0), 0);
      const rawBay = chunk.reduce((s: number, d: any) => s + parseFloat(d.bayRevenue || 0), 0);
      const bay = rawBay > 0 ? rawBay : Math.max(0, total - fnb);
      return { week: w === 3 ? "Last 7d" : `Week ${w + 1}`, bay, fnb };
    }).filter(Boolean) as Array<{ week: string; bay: number; fnb: number }>;
  }, [toastDaily]);

  const ts     = toastSummary as any;
  const acuity = acuityRevenue as any;
  const trial  = acuity?.grouped?.trial || { totalRevenue: 0, bookingCount: 0 };

  return (
    <div className="space-y-4">
      {/* MTD Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { icon: ShoppingBag, label: "Toast POS · MTD", value: ts ? fmt(ts.thisMonthRevenue) : "—", sub: `${ts?.thisMonthOrders || 0} orders` },
          { icon: TrendingUp,  label: "Toast · Last Month", value: ts ? fmt(ts.lastMonthRevenue) : "—", sub: "full month total" },
          { icon: CreditCard,  label: "Acuity · All Programs", value: acuity ? fmt(acuity.total) : "—", sub: `${acuity?.totalBookings || 0} bookings` },
        ].map(c => (
          <Card key={c.label} className="p-4">
            <div className="text-xs mb-1 flex items-center gap-1" style={{ color: TEXT_S }}><c.icon size={11} /> {c.label}</div>
            <div className="text-2xl font-bold" style={{ color: TEXT_P }}>{c.value}</div>
            <div className="text-xs mt-1" style={{ color: TEXT_S }}>{c.sub}</div>
          </Card>
        ))}
      </div>

      {/* Weekly Bay vs F&B chart */}
      <Card className="p-4">
        <div className="text-sm font-semibold mb-3" style={{ color: TEXT_P }}>Weekly Revenue · Bay Rental vs F&B (Last 4 Weeks)</div>
        {weeklyChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyChart} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: TEXT_S }} />
              <YAxis tick={{ fontSize: 10, fill: TEXT_S }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any, name: string) => [fmt(v), name === "bay" ? "Bay Rental" : "Food & Beverage"]} />
              <Legend formatter={v => v === "bay" ? "Bay Rental" : "Food & Beverage"} />
              <Bar dataKey="bay" fill={YELLOW} name="bay" radius={[3, 3, 0, 0]} />
              <Bar dataKey="fnb" fill={TEXT_P}  name="fnb" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-sm" style={{ color: TEXT_S }}>
            {isLoading ? "Loading revenue data…" : "No Toast POS data available"}
          </div>
        )}
      </Card>

      {/* Daily Toast table */}
      <Card>
        <div className="px-4 py-3 text-sm font-semibold" style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_P }}>
          Daily Toast Revenue (Last 14 Days)
        </div>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: BG_S }} />
            ))}
          </div>
        ) : Array.isArray(toastDaily) && (toastDaily as any[]).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Date", "Total", "Bay Rental", "F&B", "Orders"].map((h, i) => (
                    <th key={h} className={`px-4 py-2 text-xs font-normal ${i > 0 ? "text-right" : "text-left"}`} style={{ color: TEXT_M }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(toastDaily as any[]).slice(-14).reverse().map((row: any) => {
                  const bay = parseFloat(row.bayRevenue || 0);
                  const fnb = parseFloat(row.foodBevRevenue || 0);
                  const total = parseFloat(row.totalRevenue || 0);
                  const bayDisplay = bay > 0 ? bay : Math.max(0, total - fnb);
                  return (
                    <tr key={row.date} className="hover:bg-[#F6F6F4]" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-4 py-2 text-sm" style={{ color: TEXT_P }}>{fmtDate(row.date)}</td>
                      <td className="px-4 py-2 text-right font-semibold text-sm" style={{ color: TEXT_P }}>{fmt(total)}</td>
                      <td className="px-4 py-2 text-right text-sm" style={{ color: TEXT_S }}>
                        {fmt(bayDisplay)}{bay === 0 && total > fnb && <span className="text-[10px] ml-0.5" style={{ color: TEXT_M }}>*</span>}
                      </td>
                      <td className="px-4 py-2 text-right text-sm" style={{ color: TEXT_S }}>{fmt(fnb)}</td>
                      <td className="px-4 py-2 text-right text-sm" style={{ color: TEXT_S }}>{row.totalOrders}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 text-[10px]" style={{ borderTop: `1px solid ${BORDER}`, color: TEXT_M }}>
              * Bay Rental calculated as Total − F&B (raw bay_revenue column not yet populated in Toast sync)
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-sm" style={{ color: TEXT_S }}>No Toast POS data available</div>
        )}
      </Card>

      {/* Trial Sessions */}
      {trial.bookingCount > 0 && (
        <Card className="p-4" accent>
          <div className="text-sm font-semibold mb-3" style={{ color: TEXT_P }}>
            Trial Bay Sessions
            <span className="text-[10px] font-normal ml-2" style={{ color: TEXT_S }}>(all trial types combined)</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total Sessions", value: trial.bookingCount },
              { label: "Revenue", value: fmt(trial.totalRevenue), sub: `avg ${fmt(trial.totalRevenue / trial.bookingCount)}/session` },
            ].map(c => (
              <div key={c.label} className="p-4 rounded-xl" style={{ background: `${YELLOW}18`, border: `1px solid ${YELLOW}40` }}>
                <div className="text-xs mb-1" style={{ color: TEXT_S }}>{c.label}</div>
                <div className="text-3xl font-black" style={{ color: TEXT_P }}>{c.value}</div>
                {"sub" in c && c.sub && <div className="text-xs mt-1" style={{ color: TEXT_S }}>{c.sub}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Acuity by type */}
      {acuity?.byType?.length > 0 && (
        <Card>
          <div className="px-4 py-3 text-sm font-semibold" style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_P }}>
            Program Revenue by Type (Acuity)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}`, background: BG_S }}>
                  {["Appointment Type", "Bookings", "Revenue"].map((h, i) => (
                    <th key={h} className={`p-3 text-xs font-normal ${i > 0 ? "text-right" : "text-left"}`} style={{ color: TEXT_M }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(acuity.byType as any[]).map((row: any) => (
                  <tr key={row.appointmentType} className="hover:bg-[#F6F6F4]" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td className="p-3 text-xs" style={{ color: TEXT_P }}>{row.appointmentType}</td>
                    <td className="p-3 text-right text-xs" style={{ color: TEXT_S }}>{row.bookingCount}</td>
                    <td className="p-3 text-right font-semibold text-xs" style={{ color: TEXT_P }}>{fmt(row.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Programs Tab ──────────────────────────────────────────────────────────────
type ProgramEntry = {
  name: string; type: string; status: "active" | "completed" | "planned";
  metricType: "ROAS" | "ROI" | "KPI"; metricValue: string;
  kpiLabel: string; kpi: string;
  revenue: number; revenueTarget: number; adSpend: number;
  goalCompletionPct: number; attendancePct: number; revenuePct: number;
  leadCapturePct: number; socialPct: number; notes: string;
};

const FUNNEL_DATA = [
  { step: "Entry Page Views", value: 875 },
  { step: "Opt-ins",          value: 187 },
  { step: "Applications",     value: 88 },
  { step: "Offer Views",      value: 118 },
];

function ProgramsTab({ winterMetrics }: { winterMetrics: any }) {
  const programs = useMemo((): ProgramEntry[] => [
    {
      name: "Drive Day", type: "Member Appreciation + Prospect", status: "active",
      metricType: "KPI", metricValue: "87% attendance",
      kpiLabel: "Attendance", kpi: "52 / 60 attendees",
      revenue: 1040, revenueTarget: 1200, adSpend: 55,
      goalCompletionPct: 87, attendancePct: 87, revenuePct: 70, leadCapturePct: 60, socialPct: 50,
      notes: "2 dates remaining (Mar 22 + Mar 29). $55 Meta boost.",
    },
    {
      name: "Winter Clinic", type: "Instruction Program", status: "active",
      metricType: "KPI",
      metricValue: winterMetrics ? `${winterMetrics.totalRegistrations} enrolled` : "tracking",
      kpiLabel: "Class Fill Rate",
      kpi: winterMetrics
        ? `${winterMetrics.totalRegistrations} registrations · ${fmt(Math.round(winterMetrics.totalRevenue))} revenue`
        : "tracking",
      revenue: winterMetrics ? Math.round(winterMetrics.totalRevenue) : 0,
      revenueTarget: 15000, adSpend: 0,
      goalCompletionPct: 55, attendancePct: 55,
      revenuePct: winterMetrics ? Math.min(100, Math.round((winterMetrics.totalRevenue / 15000) * 100)) : 55,
      leadCapturePct: 40, socialPct: 30,
      notes: "Bogey Jrs & Par Shooters performing well; other levels need promotion",
    },
    {
      name: "Annual Giveaway", type: "Acquisition Campaign", status: "active",
      metricType: "KPI", metricValue: "88 / 250 applications",
      kpiLabel: "Lead Capture", kpi: "88 / 250 applications · 875 / 1,000 entries",
      revenue: 0, revenueTarget: 52720, adSpend: 1225,
      goalCompletionPct: 9, attendancePct: 0, revenuePct: 0, leadCapturePct: 35, socialPct: 70,
      notes: "875 views → 187 opt-ins → 88 applications (35% of 250 target). Winner Mar 31.",
    },
    {
      name: "Junior Summer Camp", type: "Revenue Program", status: "planned",
      metricType: "ROAS", metricValue: "pending enrollment",
      kpiLabel: "Enrollment", kpi: "0 / 120 enrolled",
      revenue: 0, revenueTarget: 66000, adSpend: 293.16,
      goalCompletionPct: 0, attendancePct: 0, revenuePct: 0, leadCapturePct: 0, socialPct: 20,
      notes: "Early Bird deadline Mar 31. $293.16 on Meta Ads (82K impressions, 1.82% CTR). Email campaign needed.",
    },
    {
      name: "Superbowl Watch Party", type: "Brand Awareness", status: "completed",
      metricType: "ROI", metricValue: "4x ($300 / $75)",
      kpiLabel: "Awareness + Revenue", kpi: "4,167 impressions · $300 revenue",
      revenue: 300, revenueTarget: 300, adSpend: 75,
      goalCompletionPct: 30, attendancePct: 10, revenuePct: 100, leadCapturePct: 10, socialPct: 40,
      notes: "1 bay booking ($300). 4,167 ad impressions.",
    },
  ], [winterMetrics]);

  // Status pill styles — v2: active=yellow, completed=orange (ended), planned=gray
  const statusStyle: Record<string, { bg: string; color: string }> = {
    active:    { bg: `${YELLOW}25`, color: "#9a7a00" },
    completed: { bg: ORG_BG,        color: ORG_TXT },
    planned:   { bg: BG_S,          color: TEXT_S },
  };

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 rounded-xl text-xs"
        style={{ background: BG_S, border: `1px solid ${BORDER}`, color: TEXT_S }}
      >
        <span className="font-semibold" style={{ color: TEXT_P }}>Metric types:</span>
        <span><span className="font-semibold" style={{ color: GRN_TXT }}>ROAS</span> = Revenue ÷ Ad Spend</span>
        <span>·</span>
        <span><span className="font-semibold" style={{ color: "#4E8DF4" }}>ROI</span> = (Revenue − Cost) ÷ Cost</span>
        <span>·</span>
        <span><span className="font-semibold" style={{ color: "#b8900a" }}>KPI</span> = Program Goal Metric</span>
      </div>

      {programs.map(p => {
        const healthScore = calcHealthScore(p);
        const pct = p.revenueTarget > 0 ? Math.min(100, (p.revenue / p.revenueTarget) * 100) : 0;
        const st  = statusStyle[p.status];
        return (
          <Card key={p.name} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold" style={{ color: TEXT_P }}>{p.name}</h3>
                  <Badge
                    variant="secondary"
                    className="text-xs capitalize border-0"
                    style={{ background: st.bg, color: st.color }}
                  >
                    {p.status}
                  </Badge>
                  <MetricTag type={p.metricType} value={p.metricValue} />
                  {p.adSpend > 0 && <span className="text-[10px]" style={{ color: TEXT_S }}>Ad spend: {fmt(p.adSpend)}</span>}
                </div>
                <p className="text-xs" style={{ color: TEXT_S }}>{p.type}</p>
              </div>
              <HealthDots score={healthScore} />
            </div>

            {p.revenueTarget > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: TEXT_S }}>Revenue vs Target</span>
                  <span className="font-semibold" style={{ color: TEXT_P }}>{fmt(p.revenue)} / {fmt(p.revenueTarget)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BG_S }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: YELLOW }} />
                </div>
              </div>
            )}

            <div className="flex items-start justify-between pt-3 gap-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <div className="shrink-0">
                <span className="text-xs" style={{ color: TEXT_S }}>{p.kpiLabel}: </span>
                <span className="text-xs font-semibold" style={{ color: TEXT_P }}>{p.kpi}</span>
              </div>
              <div className="text-xs text-right" style={{ color: TEXT_S }}>{p.notes}</div>
            </div>
          </Card>
        );
      })}

      {/* Annual Giveaway Funnel */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award size={14} style={{ color: YELLOW }} />
          <span className="text-sm font-semibold" style={{ color: TEXT_P }}>Annual Giveaway Funnel · Feb 2 – Mar 3</span>
        </div>
        <div className="space-y-2 mb-3">
          {FUNNEL_DATA.map((step, i) => (
            <div key={step.step}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold" style={{ color: TEXT_P }}>{step.step}</span>
                <span style={{ color: TEXT_S }}>{step.value.toLocaleString()}</span>
              </div>
              <div
                className="h-7 rounded flex items-center px-3 text-xs font-bold"
                style={{
                  background: `${YELLOW}${Math.round((1 - i * 0.2) * 255).toString(16).padStart(2, "0")}`,
                  width: `${(step.value / FUNNEL_DATA[0].value) * 100}%`,
                  minWidth: "100px",
                  color: TEXT_P,
                }}
              >
                {i > 0 ? `${((step.value / FUNNEL_DATA[i - 1].value) * 100).toFixed(0)}% from prev` : "Top of funnel"}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-xl text-xs" style={{ background: BG_S, border: `1px solid ${BORDER}`, color: TEXT_S }}>
          Target: 1,000 entries · 250 applications by Apr 29. Current: 875 entries (87.5%) · 88 applications (35%).
          <span className="font-semibold" style={{ color: TEXT_P }}> Action:</span> Increase Meta Ads budget for Giveaway A2.
        </div>
      </Card>
    </div>
  );
}

// ─── Advertising Tab ───────────────────────────────────────────────────────────
const META_CAMPAIGNS = [
  { name: "Annual Giveaway A1",    spend: 803,    impressions: 80947, ctr: 0.90, program: "Annual Giveaway" },
  { name: "Junior Summer Camp",    spend: 293.16, impressions: 82307, ctr: 1.82, program: "Junior Summer Camp" },
  { name: "Annual Giveaway A2",    spend: 379,    impressions: 26434, ctr: 2.80, program: "Annual Giveaway" },
  { name: "Superbowl Watch Party", spend: 75,     impressions: 4167,  ctr: 1.37, program: "Superbowl Watch Party" },
  { name: "Drive Day Boost",       spend: 55,     impressions: 4633,  ctr: 4.21, program: "Drive Day" },
  { name: "IG Giveaway",           spend: 43,     impressions: 15528, ctr: 0.30, program: "Annual Giveaway" },
];

function AdvertisingTab() {
  const totalSpend       = META_CAMPAIGNS.reduce((s, c) => s + c.spend, 0);
  const totalImpressions = META_CAMPAIGNS.reduce((s, c) => s + c.impressions, 0);
  const avgCtr           = META_CAMPAIGNS.reduce((s, c) => s + c.ctr, 0) / META_CAMPAIGNS.length;

  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
        style={{ background: BG_S, border: `1px solid ${BORDER}`, color: TEXT_S }}
      >
        <Info size={12} />
        <span>Manually tracked snapshot · Feb 2 – Mar 3, 2026. For live data, open Operations → Campaigns → Paid Ads tab.</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Spend",        value: fmt(totalSpend),                   sub: `${META_CAMPAIGNS.length} campaigns` },
          { label: "Total Impressions",  value: `${(totalImpressions/1000).toFixed(0)}K`, sub: "Feb 2 – Mar 3" },
          { label: "Avg CTR",            value: `${avgCtr.toFixed(2)}%`,            sub: "across all campaigns" },
        ].map(c => (
          <Card key={c.label} className="p-4">
            <div className="text-xs mb-1" style={{ color: TEXT_S }}>{c.label}</div>
            <div className="text-2xl font-bold" style={{ color: TEXT_P }}>{c.value}</div>
            <div className="text-xs mt-1" style={{ color: TEXT_S }}>{c.sub}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="px-4 py-3 text-sm font-semibold" style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_P }}>Campaign Performance</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, background: BG_S }}>
                {["Campaign", "Program", "Spend", "Impressions", "CTR", "CPM"].map((h, i) => (
                  <th key={h} className={`p-3 text-xs font-normal ${i < 2 ? "text-left" : "text-right"}`} style={{ color: TEXT_M }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {META_CAMPAIGNS.map(c => (
                <tr key={c.name} className="hover:bg-[#F6F6F4] h-14" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td className="p-3 font-semibold text-sm" style={{ color: TEXT_P }}>{c.name}</td>
                  <td className="p-3 text-xs" style={{ color: TEXT_S }}>{c.program}</td>
                  <td className="p-3 text-right font-semibold" style={{ color: TEXT_P }}>{fmt(c.spend)}</td>
                  <td className="p-3 text-right" style={{ color: TEXT_S }}>{c.impressions.toLocaleString()}</td>
                  <td className="p-3 text-right" style={{ color: TEXT_S }}>{c.ctr.toFixed(2)}%</td>
                  <td className="p-3 text-right" style={{ color: TEXT_S }}>{fmt((c.spend / c.impressions) * 1000)}</td>
                </tr>
              ))}
              <tr className="h-14 font-semibold" style={{ background: BG_S }}>
                <td className="p-3" style={{ color: TEXT_P }} colSpan={2}>Total</td>
                <td className="p-3 text-right" style={{ color: TEXT_P }}>{fmt(totalSpend)}</td>
                <td className="p-3 text-right" style={{ color: TEXT_P }}>{totalImpressions.toLocaleString()}</td>
                <td className="p-3 text-right" style={{ color: TEXT_S }}>—</td>
                <td className="p-3 text-right" style={{ color: TEXT_S }}>{fmt((totalSpend / totalImpressions) * 1000)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  { value: "weekly",      label: "Weekly Summary" },
  { value: "revenue",     label: "Revenue" },
  { value: "programs",    label: "Programs" },
  { value: "advertising", label: "Advertising" },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("weekly");

  const { data: snapshot }      = trpc.preview.getSnapshot.useQuery();
  const { data: toastDaily }    = trpc.revenue.getToastDaily.useQuery({ startDate: undefined, endDate: undefined });
  const { data: toastSummary }  = trpc.revenue.getToastSummary.useQuery();
  const { data: winterMetrics } = trpc.campaigns.getWinterClinicMetrics.useQuery(
    { minDate: "2026-01-01", maxDate: "2026-03-31" },
    { staleTime: 5 * 60 * 1000 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: TEXT_P }}>Reports</h1>
        <p className="text-sm mt-1" style={{ color: TEXT_S }}>Performance across all programs, campaigns, and revenue streams</p>
      </div>

      <div
        className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden"
        style={{ border: `1px solid ${BORDER}` }}
      >
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
        <div className="p-4">
          {activeTab === "weekly"      && <WeeklySummaryTab snapshot={snapshot} toastDaily={toastDaily} toastSummary={toastSummary} />}
          {activeTab === "revenue"     && <RevenueTab />}
          {activeTab === "programs"    && <ProgramsTab winterMetrics={winterMetrics} />}
          {activeTab === "advertising" && <AdvertisingTab />}
        </div>
      </div>
    </div>
  );
}
