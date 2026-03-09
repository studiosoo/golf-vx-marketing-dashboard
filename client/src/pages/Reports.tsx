import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, Activity, Award, ShoppingBag, CreditCard,
} from "lucide-react";

const YELLOW = "#F5C72C";
const GRAY = "#888888";

function fmt(v: number | string) {
  const n = parseFloat(String(v || 0));
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
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
        <div key={i} className="w-2 h-2 rounded-full" style={{ background: i <= score ? YELLOW : "#E0E0E0" }} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{score}/5</span>
    </div>
  );
}

function MetricTag({ type, value }: { type: "ROAS" | "ROI" | "KPI"; value: string }) {
  const cls =
    type === "ROAS" ? "bg-green-50 text-green-700 border-green-200" :
    type === "ROI"  ? "bg-blue-50 text-blue-700 border-blue-200" :
                     "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded border ${cls}`}>
      {type}: {value}
    </span>
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

  const ts = toastSummary as any;
  const lastMonthTotal  = parseFloat(ts?.lastMonthRevenue || 0);
  const mrr             = snapshot?.members?.mrr || 0;
  const newMembers      = snapshot?.members?.newThisMonth || 0;
  const totalMetaSpend  = 1648.16; // Feb 2 – Mar 3 snapshot

  const rows: Array<{ label: string; lastWeek: string; lastMonth: string }> = [
    { label: "Bay Rental Revenue", lastWeek: fmt(lastWeek.bay),   lastMonth: "—" },
    { label: "F&B Revenue",        lastWeek: fmt(lastWeek.fnb),   lastMonth: "—" },
    { label: "Toast Total",        lastWeek: fmt(lastWeek.total), lastMonth: fmt(lastMonthTotal) },
    { label: "MRR (memberships)",  lastWeek: mrr ? fmt(mrr) : "—", lastMonth: "monthly" },
    { label: "Meta Ad Spend",      lastWeek: "—",                 lastMonth: `${fmt(totalMetaSpend)} (Feb–Mar)` },
    { label: "New Members",        lastWeek: "—",                 lastMonth: `+${newMembers} this month` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
        <Activity size={12} />
        <span>Last 7 days vs prior full month — live POS data where available</span>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Metric</th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: YELLOW }}>Last 7 Days</th>
                <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Last Month</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label} className={`border-b border-border/50 ${i === 2 ? "bg-muted/10" : ""}`}>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{r.label}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">{r.lastWeek}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{r.lastMonth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
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
      return {
        week: w === 3 ? "Last 7d" : `Week ${w + 1}`,
        bay:  chunk.reduce((s: number, d: any) => s + parseFloat(d.bayRevenue || 0), 0),
        fnb:  chunk.reduce((s: number, d: any) => s + parseFloat(d.foodBevRevenue || 0), 0),
      };
    }).filter(Boolean) as Array<{ week: string; bay: number; fnb: number }>;
  }, [toastDaily]);

  const ts     = toastSummary as any;
  const acuity = acuityRevenue as any;
  const trial  = acuity?.grouped?.trial || { totalRevenue: 0, bookingCount: 0, types: [] as string[] };

  return (
    <div className="space-y-4">
      {/* MTD Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><ShoppingBag size={11} /> Toast POS · MTD</div>
            <div className="text-2xl font-bold text-foreground">{ts ? fmt(ts.thisMonthRevenue) : "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">{ts?.thisMonthOrders || 0} orders this month</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp size={11} /> Toast · Last Month</div>
            <div className="text-2xl font-bold text-foreground">{ts ? fmt(ts.lastMonthRevenue) : "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">full month total</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><CreditCard size={11} /> Acuity · All Programs</div>
            <div className="text-2xl font-bold text-foreground">{acuity ? fmt(acuity.total) : "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">{acuity?.totalBookings || 0} bookings cumulative</div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Bay vs F&B chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Weekly Revenue · Bay Rental vs F&B (Last 4 Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyChart} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: GRAY }} />
                <YAxis tick={{ fontSize: 10, fill: GRAY }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any, name: string) => [fmt(v), name === "bay" ? "Bay Rental" : "Food & Beverage"]} />
                <Legend formatter={v => v === "bay" ? "Bay Rental" : "Food & Beverage"} />
                <Bar dataKey="bay" fill={YELLOW} name="bay" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fnb" fill="#111111" name="fnb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {isLoading ? "Loading revenue data…" : "No Toast POS data available"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Toast table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Daily Toast Revenue (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
            </div>
          ) : Array.isArray(toastDaily) && (toastDaily as any[]).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Date</th>
                  <th className="text-right px-4 py-2 text-muted-foreground font-medium text-xs">Total</th>
                  <th className="text-right px-4 py-2 text-muted-foreground font-medium text-xs">Bay</th>
                  <th className="text-right px-4 py-2 text-muted-foreground font-medium text-xs">F&B</th>
                  <th className="text-right px-4 py-2 text-muted-foreground font-medium text-xs">Orders</th>
                </tr></thead>
                <tbody>
                  {(toastDaily as any[]).slice(-14).reverse().map((row: any) => (
                    <tr key={row.date} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-2 text-foreground text-sm">{row.date}</td>
                      <td className="px-4 py-2 text-right font-medium text-foreground text-sm">{fmt(row.totalRevenue)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground text-sm">{fmt(row.bayRevenue)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground text-sm">{fmt(row.foodBevRevenue)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground text-sm">{row.totalOrders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">No Toast POS data available</div>
          )}
        </CardContent>
      </Card>

      {/* Trial Sessions */}
      {trial.bookingCount > 0 && (
        <Card className="bg-card border-border" style={{ borderLeft: `4px solid ${YELLOW}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Trial Bay Sessions
              <span className="text-[10px] font-normal text-muted-foreground ml-2">(all trial types combined)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F5C72C]/10 border border-[#F5C72C]/30">
                <div className="text-xs text-muted-foreground mb-1">Total Sessions</div>
                <div className="text-3xl font-black text-foreground">{trial.bookingCount}</div>
              </div>
              <div className="p-4 rounded-xl bg-[#F5C72C]/10 border border-[#F5C72C]/30">
                <div className="text-xs text-muted-foreground mb-1">Revenue</div>
                <div className="text-3xl font-black text-foreground">{fmt(trial.totalRevenue)}</div>
                <div className="text-xs text-muted-foreground mt-1">avg {fmt(trial.totalRevenue / trial.bookingCount)}/session</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acuity by type */}
      {acuity?.byType?.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Program Revenue by Type (Acuity)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/20">
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium">Appointment Type</th>
                  <th className="text-right p-3 text-xs text-muted-foreground font-medium">Bookings</th>
                  <th className="text-right p-3 text-xs text-muted-foreground font-medium">Revenue</th>
                </tr></thead>
                <tbody>
                  {(acuity.byType as any[]).map((row: any) => (
                    <tr key={row.appointmentType} className="border-b border-border/50 hover:bg-muted/10">
                      <td className="p-3 text-foreground text-xs">{row.appointmentType}</td>
                      <td className="p-3 text-right text-muted-foreground text-xs">{row.bookingCount}</td>
                      <td className="p-3 text-right font-medium text-foreground text-xs">{fmt(row.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Programs Tab ──────────────────────────────────────────────────────────────
type Program = {
  name: string; type: string; status: "active" | "completed" | "planned";
  metricType: "ROAS" | "ROI" | "KPI"; metricValue: string;
  kpiLabel: string; kpi: string;
  revenue: number; revenueTarget: number; adSpend: number;
  goalCompletionPct: number; attendancePct: number; revenuePct: number;
  leadCapturePct: number; socialPct: number;
  notes: string;
};

const FUNNEL_DATA = [
  { step: "Entry Page Views", value: 875 },
  { step: "Opt-ins",          value: 187 },
  { step: "Applications",     value: 88 },
  { step: "Offer Views",      value: 118 },
];

const STATUS_BG: Record<string, string> = { active: `${YELLOW}20`, completed: "#22c55e20", planned: "#88888820" };
const STATUS_COLOR: Record<string, string> = { active: "#b8900a", completed: "#16a34a", planned: GRAY };

function ProgramsTab({ winterMetrics }: { winterMetrics: any }) {
  const programs = useMemo((): Program[] => [
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
        : "4 / 8 class types on target",
      revenue: winterMetrics ? Math.round(winterMetrics.totalRevenue) : 0,
      revenueTarget: 2400, adSpend: 0,
      goalCompletionPct: 55, attendancePct: 55,
      revenuePct: winterMetrics ? Math.min(100, Math.round((winterMetrics.totalRevenue / 2400) * 100)) : 55,
      leadCapturePct: 40, socialPct: 30,
      notes: "Bogey Jrs & Par Shooters performing well; other levels need promotion",
    },
    {
      name: "Annual Giveaway", type: "Acquisition Campaign", status: "active",
      metricType: "KPI", metricValue: "88 / 250 applications",
      kpiLabel: "Lead Capture", kpi: "88 / 250 applications · 875 / 1,000 entries",
      revenue: 0, revenueTarget: 52720, adSpend: 1225,
      goalCompletionPct: 9, attendancePct: 0, revenuePct: 0, leadCapturePct: 35, socialPct: 70,
      notes: "875 page views → 187 opt-ins → 88 applications (35% of 250 target). Winner Mar 31.",
    },
    {
      name: "Junior Summer Camp", type: "Revenue Program", status: "planned",
      metricType: "ROAS", metricValue: "pending enrollment",
      kpiLabel: "Enrollment", kpi: "0 / 120 enrolled",
      revenue: 0, revenueTarget: 66000, adSpend: 293.16,
      goalCompletionPct: 0, attendancePct: 0, revenuePct: 0, leadCapturePct: 0, socialPct: 20,
      notes: "⚠ Early Bird deadline Mar 31. $293.16 on Meta (82K impressions, 1.82% CTR). Email campaign needed.",
    },
    {
      name: "Superbowl Watch Party", type: "Brand Awareness", status: "completed",
      metricType: "ROI", metricValue: "4x ($300 rev / $75 spend)",
      kpiLabel: "Awareness + Revenue", kpi: "4,167 impressions · $300 revenue",
      revenue: 300, revenueTarget: 300, adSpend: 75,
      goalCompletionPct: 30, attendancePct: 10, revenuePct: 100, leadCapturePct: 10, socialPct: 40,
      notes: "1 bay booking ($300). 4,167 ad impressions.",
    },
  ], [winterMetrics]);

  return (
    <div className="space-y-4">
      {/* Metric legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Metric types:</span>
        <span><span className="text-green-700 font-semibold">ROAS</span> = Revenue ÷ Ad Spend</span>
        <span>·</span>
        <span><span className="text-blue-700 font-semibold">ROI</span> = (Revenue − Cost) ÷ Cost</span>
        <span>·</span>
        <span><span className="text-amber-700 font-semibold">KPI</span> = Program Goal Metric</span>
      </div>

      {programs.map(p => {
        const healthScore = calcHealthScore(p);
        const pct = p.revenueTarget > 0 ? Math.min(100, (p.revenue / p.revenueTarget) * 100) : 0;
        return (
          <Card key={p.name} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    <Badge variant="secondary" className="text-xs capitalize" style={{
                      background: STATUS_BG[p.status], color: STATUS_COLOR[p.status], border: "none",
                    }}>{p.status}</Badge>
                    <MetricTag type={p.metricType} value={p.metricValue} />
                    {p.adSpend > 0 && (
                      <span className="text-[10px] text-muted-foreground">Ad spend: {fmt(p.adSpend)}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.type}</p>
                </div>
                <HealthDots score={healthScore} />
              </div>

              {p.revenueTarget > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Revenue vs Target</span>
                    <span className="text-foreground font-medium">{fmt(p.revenue)} / {fmt(p.revenueTarget)}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" style={{ "--progress-bg": YELLOW } as any} />
                </div>
              )}

              <div className="flex items-start justify-between pt-3 border-t border-border gap-4">
                <div className="shrink-0">
                  <span className="text-xs text-muted-foreground">{p.kpiLabel}: </span>
                  <span className="text-xs font-medium text-foreground">{p.kpi}</span>
                </div>
                <div className="text-xs text-muted-foreground text-right">{p.notes}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Giveaway Funnel */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Award size={14} style={{ color: YELLOW }} /> Annual Giveaway Funnel · Feb 2 – Mar 3
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-3">
            {FUNNEL_DATA.map((step, i) => (
              <div key={step.step}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{step.step}</span>
                  <span className="text-muted-foreground">{step.value.toLocaleString()}</span>
                </div>
                <div
                  className="h-7 rounded flex items-center px-3 text-xs font-bold text-[#111]"
                  style={{
                    background: `${YELLOW}${Math.round((1 - i * 0.2) * 255).toString(16).padStart(2, "0")}`,
                    width: `${(step.value / FUNNEL_DATA[0].value) * 100}%`,
                    minWidth: "100px",
                  }}
                >
                  {i > 0 ? `${((step.value / FUNNEL_DATA[i - 1].value) * 100).toFixed(0)}% from prev` : "Top of funnel"}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded bg-muted/20 border border-border text-xs text-muted-foreground">
            Target: 1,000 entries · 250 applications by Apr 29.
            Current: 875 entries (87.5%) · 88 applications (35%).
            <strong className="text-foreground"> Action:</strong> Increase Meta Ads budget for Giveaway A2 to convert more opt-ins.
          </div>
        </CardContent>
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
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
        <span>📌</span>
        <span>Manually tracked snapshot · Feb 2 – Mar 3, 2026. For live Meta Ads data, see the Paid Media page.</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border"><CardContent className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Spend</div>
          <div className="text-2xl font-bold text-foreground">{fmt(totalSpend)}</div>
          <div className="text-xs text-muted-foreground mt-1">{META_CAMPAIGNS.length} campaigns</div>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Impressions</div>
          <div className="text-2xl font-bold text-foreground">{(totalImpressions / 1000).toFixed(0)}K</div>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Avg CTR</div>
          <div className="text-2xl font-bold text-foreground">{avgCtr.toFixed(2)}%</div>
        </CardContent></Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/20">
                <th className="text-left p-3 text-xs text-muted-foreground font-medium">Campaign</th>
                <th className="text-left p-3 text-xs text-muted-foreground font-medium">Program</th>
                <th className="text-right p-3 text-xs text-muted-foreground font-medium">Spend</th>
                <th className="text-right p-3 text-xs text-muted-foreground font-medium">Impressions</th>
                <th className="text-right p-3 text-xs text-muted-foreground font-medium">CTR</th>
                <th className="text-right p-3 text-xs text-muted-foreground font-medium">CPM</th>
              </tr></thead>
              <tbody>
                {META_CAMPAIGNS.map(c => (
                  <tr key={c.name} className="border-b border-border hover:bg-muted/10">
                    <td className="p-3 text-foreground text-sm">{c.name}</td>
                    <td className="p-3 text-muted-foreground text-xs">{c.program}</td>
                    <td className="p-3 text-right font-medium text-foreground">{fmt(c.spend)}</td>
                    <td className="p-3 text-right text-muted-foreground">{c.impressions.toLocaleString()}</td>
                    <td className="p-3 text-right text-muted-foreground">{c.ctr.toFixed(2)}%</td>
                    <td className="p-3 text-right text-muted-foreground">{fmt((c.spend / c.impressions) * 1000)}</td>
                  </tr>
                ))}
                <tr className="bg-muted/20 font-semibold">
                  <td className="p-3 text-foreground" colSpan={2}>Total</td>
                  <td className="p-3 text-right text-foreground">{fmt(totalSpend)}</td>
                  <td className="p-3 text-right text-foreground">{totalImpressions.toLocaleString()}</td>
                  <td className="p-3 text-right text-muted-foreground">—</td>
                  <td className="p-3 text-right text-muted-foreground">{fmt((totalSpend / totalImpressions) * 1000)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Reports() {
  const [activeTab, setActiveTab] = useState("weekly");

  const { data: snapshot }      = trpc.preview.getSnapshot.useQuery();
  const { data: toastDaily }    = trpc.revenue.getToastDaily.useQuery({ startDate: undefined, endDate: undefined });
  const { data: toastSummary }  = trpc.revenue.getToastSummary.useQuery();
  const { data: memberStats }   = trpc.members.getStats.useQuery();
  const { data: winterMetrics } = trpc.campaigns.getWinterClinicMetrics.useQuery(
    { minDate: "2026-01-01", maxDate: "2026-03-31" },
    { staleTime: 5 * 60 * 1000 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Performance across all programs, campaigns, and revenue streams
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-px">
          <TabsList className="bg-muted/30 border border-border min-w-max">
            <TabsTrigger value="weekly">Weekly Summary</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="advertising">Advertising</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="weekly" className="mt-4">
          <WeeklySummaryTab snapshot={snapshot} toastDaily={toastDaily} toastSummary={toastSummary} />
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <RevenueTab />
        </TabsContent>

        <TabsContent value="programs" className="mt-4">
          <ProgramsTab winterMetrics={winterMetrics} />
        </TabsContent>

        <TabsContent value="advertising" className="mt-4">
          <AdvertisingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
