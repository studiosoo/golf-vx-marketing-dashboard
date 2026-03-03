import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, DollarSign, Target, Calendar,
  FileText, Download, RefreshCw, Star, Activity, Award,
  ShoppingBag, CreditCard
} from "lucide-react";

const YELLOW = "#F5C72C";
const DARK = "#111111";
const GRAY = "#888888";

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

// Program Health Score (1-5) calculation
function calcHealthScore(program: {
  goalCompletionPct: number;
  attendancePct: number;
  revenuePct: number;
  leadCapturePct: number;
  socialPct: number;
}): number {
  const weighted =
    program.goalCompletionPct * 0.30 +
    program.attendancePct * 0.25 +
    program.revenuePct * 0.20 +
    program.leadCapturePct * 0.15 +
    program.socialPct * 0.10;
  return Math.min(5, Math.max(1, Math.round((weighted / 100) * 4 + 1)));
}

function HealthDots({ score }: { score: number }) {
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: i <= score ? YELLOW : "#E0E0E0" }}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{score}/5</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, trend }: any) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${YELLOW}20` }}>
            <Icon size={14} style={{ color: YELLOW }} />
          </div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {sub && (
          <div className={`text-xs mt-1 flex items-center gap-1 ${trend != null && trend >= 0 ? "text-green-500" : "text-red-400"}`}>
            {trend != null && (trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />)}
            {sub}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Revenue Tab (merged from Revenue & Goals page) ───────────────────────────
function RevenueTabContent() {
  const [dateRange] = useState(() => ({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  }));
  const { data: summary } = trpc.revenue.getSummary.useQuery(dateRange);
  const { data: toastDaily, isLoading: toastLoading } = trpc.revenue.getToastDaily.useQuery({ startDate: undefined, endDate: undefined });
  const { data: toastSummary } = trpc.revenue.getToastSummary.useQuery();
  const { data: acuityRevenue } = trpc.revenue.getAcuityRevenue.useQuery({ minDate: undefined, maxDate: undefined });
  const fmt = (v: number | string) => `$${parseFloat(String(v || 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue (MTD)" value={toastSummary ? fmt((toastSummary as any).thisMonthRevenue || 0) : "—"} sub={toastSummary && !(toastSummary as any).thisMonthRevenue ? `Last data: ${String((toastSummary as any).latestDate || '').replace(/(\d{4})(\d{2})(\d{2})/, '$2/$3/$1')}` : undefined} />
        <StatCard icon={ShoppingBag} label="Toast POS (MTD)" value={toastSummary ? fmt((toastSummary as any).thisMonthRevenue || 0) : "—"} sub={toastSummary ? `${(toastSummary as any).thisMonthOrders || 0} orders this month` : undefined} />
        <StatCard icon={CreditCard} label="Programs Revenue" value={acuityRevenue ? fmt((acuityRevenue as any).total || 0) : "—"} sub={acuityRevenue ? `${(acuityRevenue as any).totalBookings || 0} bookings` : undefined} />
        <StatCard icon={TrendingUp} label="Last Month Revenue" value={toastSummary ? fmt((toastSummary as any).lastMonthRevenue || 0) : "—"} sub={toastSummary ? `All-time: ${fmt((toastSummary as any).allTimeRevenue || 0)}` : undefined} />
      </div>

      {/* Revenue Breakdown Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Revenue Breakdown (Last 30 Days — Toast POS)</CardTitle>
        </CardHeader>
        <CardContent>
          {toastSummary ? (() => {
            const ts = toastSummary as any;
            const golf = ts.allTimeGolf ? 0 : 0; // use monthly breakdown
            const foodBev = ts.allTimeFoodBev || 0;
            const bay = ts.allTimeBay || 0;
            const acuity = (acuityRevenue as any)?.total || 0;
            const breakdownData = [
              { name: "F&B", value: parseFloat(String(foodBev)) },
              { name: "Programs", value: parseFloat(String(acuity)) },
              { name: "Bay Rental", value: parseFloat(String(bay)) },
            ].filter(d => d.value > 0);
            return (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      <Cell fill={YELLOW} />
                      <Cell fill="#333333" />
                      <Cell fill="#888888" />
                      <Cell fill="#AAAAAA" />
                    </Pie>
                    <Tooltip formatter={(v: any) => fmtCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">F&B Revenue</div>
                    <div className="text-base font-bold text-foreground">{fmt(foodBev)}</div>
                    <div className="text-xs text-muted-foreground">All-time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Programs Revenue</div>
                    <div className="text-base font-bold text-foreground">{fmt(acuity)}</div>
                    <div className="text-xs text-muted-foreground">{(acuityRevenue as any)?.totalBookings || 0} bookings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Bay Rental</div>
                    <div className="text-base font-bold text-foreground">{fmt(bay)}</div>
                    <div className="text-xs text-muted-foreground">All-time</div>
                  </div>
                </div>
              </div>
            );
          })() : <div className="text-center py-8 text-muted-foreground text-sm">Loading revenue data…</div>}
        </CardContent>
      </Card>

      {/* Toast POS Daily Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Daily Toast Revenue (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {toastLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
          ) : toastDaily && (toastDaily as any[]).length > 0 ? (
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

      {/* 1-Hour Bay Trial KPI — highlighted */}
      <Card className="bg-card border-border" style={{ borderLeft: `4px solid #F5C72C` }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span style={{ color: '#F5C72C' }}>⛳</span> 1-Hour Bay Trial Sessions
            <span className="text-[10px] font-normal text-muted-foreground ml-1">(Trial Sessions + Anniversary Trial Sessions combined)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {acuityRevenue ? (() => {
            const trialGroup = (acuityRevenue as any).grouped?.trial || { totalRevenue: 0, bookingCount: 0, types: [] };
            const trialTypes = (trialGroup.types as string[]) || [];
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F5C72C]/10 border border-[#F5C72C]/30">
                    <div className="text-xs text-muted-foreground mb-1">Total Participants</div>
                    <div className="text-3xl font-black text-foreground">{trialGroup.bookingCount}</div>
                    <div className="text-xs text-muted-foreground mt-1">1-hour bay trial bookings</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F5C72C]/10 border border-[#F5C72C]/30">
                    <div className="text-xs text-muted-foreground mb-1">Total Revenue</div>
                    <div className="text-3xl font-black text-foreground">{fmt(trialGroup.totalRevenue)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      avg {trialGroup.bookingCount > 0 ? fmt(trialGroup.totalRevenue / trialGroup.bookingCount) : '$0'} / session
                    </div>
                  </div>
                </div>
                {trialTypes.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Includes: </span>
                    {trialTypes.join(' · ')}
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading trial session data...</div>
          )}
        </CardContent>
      </Card>

      {/* All Programs Revenue Breakdown */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">All Programs Revenue (Acuity)</CardTitle>
        </CardHeader>
        <CardContent>
          {acuityRevenue ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Total Programs Revenue</div>
                  <div className="text-2xl font-bold text-foreground">{fmt((acuityRevenue as any).total || 0)}</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Total Booking Count</div>
                  <div className="text-2xl font-bold text-foreground">{(acuityRevenue as any).totalBookings || 0}</div>
                </div>
              </div>
              {(acuityRevenue as any).byType && (acuityRevenue as any).byType.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border bg-muted/20">
                      <th className="text-left p-3 text-xs text-muted-foreground font-medium">Appointment Type</th>
                      <th className="text-right p-3 text-xs text-muted-foreground font-medium">Bookings</th>
                      <th className="text-right p-3 text-xs text-muted-foreground font-medium">Revenue</th>
                    </tr></thead>
                    <tbody>
                      {((acuityRevenue as any).byType as any[]).map((row: any) => (
                        <tr key={row.appointmentType} className="border-b border-border/50 hover:bg-muted/10">
                          <td className="p-3 text-foreground text-xs">{row.appointmentType}</td>
                          <td className="p-3 text-right text-muted-foreground text-xs">{row.bookingCount}</td>
                          <td className="p-3 text-right font-medium text-foreground text-xs">{fmt(row.totalRevenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading Acuity data...</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("tab") || "overview";
    }
    return "overview";
  });

  const now = useMemo(() => new Date(), []);
  const startOfMonth = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now]);
  const endOfMonth = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 1, 0), [now]);
  const startOfYear = useMemo(() => new Date(now.getFullYear(), 0, 1), [now]);

  const { data: snapshot } = trpc.preview.getSnapshot.useQuery();
  const { data: campaigns } = trpc.campaigns.list.useQuery();
  const { data: memberStats } = trpc.members.getStats.useQuery();
  const { data: revSummary } = trpc.revenue.getSummary.useQuery({ startDate: startOfYear, endDate: endOfMonth });
  // Drive Day metrics sourced from programs array below

  // Program health scores based on real data
  const programs = useMemo(() => [
    {
      name: "Drive Day",
      type: "Member Appreciation + Prospect",
      status: "active",
      goalCompletionPct: 87,   // 52/60 attendance
      attendancePct: 87,
      revenuePct: 70,          // $20/person, 52 paid some
      leadCapturePct: 60,
      socialPct: 50,
      kpi: "52 / 60 attendees",
      kpiLabel: "Attendance",
      revenue: 1040,
      revenueTarget: 1200,
      notes: "2 dates remaining (Mar 22 + Mar 29)",
    },
    {
      name: "Winter Clinic",
      type: "Instruction Program",
      status: "active",
      goalCompletionPct: 55,   // Bogey Jrs + Par Shooters on target, others low
      attendancePct: 55,
      revenuePct: 55,
      leadCapturePct: 40,
      socialPct: 30,
      kpi: "4 / 8 class types on target",
      kpiLabel: "Class Fill Rate",
      revenue: 0,
      revenueTarget: 2400,
      notes: "Bogey Jrs & Par Shooters performing well; other levels need promotion",
    },
    {
      name: "Annual Giveaway",
      type: "Acquisition Campaign",
      status: "active",
      goalCompletionPct: 9,    // 88/1000 entry goal
      attendancePct: 0,
      revenuePct: 0,           // No direct revenue yet (pre-conversion)
      leadCapturePct: 35,      // 88 applications vs 250 target
      socialPct: 70,           // 214k impressions
      kpi: "88 / 250 applications · 875 / 1,000 entries",
      kpiLabel: "Lead Capture",
      revenue: 0,
      revenueTarget: 52720,
      notes: "ClickFunnels: 875 views → 187 opt-ins → 88 applications (35% of 250 target). Winner announcement Mar 31.",
    },
    {
      name: "Junior Summer Camp",
      type: "Revenue Program",
      status: "planned",
      goalCompletionPct: 0,
      attendancePct: 0,
      revenuePct: 0,
      leadCapturePct: 0,
      socialPct: 20,
      kpi: "0 / 120 enrolled",
      kpiLabel: "Enrollment",
      revenue: 0,
      revenueTarget: 66000,
      notes: "⚠ Early Bird deadline Mar 31. Urgent: email campaign needed.",
    },
    {
      name: "Superbowl Watch Party",
      type: "Brand Awareness",
      status: "completed",
      goalCompletionPct: 30,
      attendancePct: 10,       // 1 attendee vs unknown target
      revenuePct: 100,         // $300 bay booking = full revenue from event
      leadCapturePct: 10,
      socialPct: 40,           // 4,167 impressions
      kpi: "4,167 impressions · $300 revenue",
      kpiLabel: "Awareness + Revenue",
      revenue: 300,
      revenueTarget: 300,
      notes: "1 bay booking ($300). 4,167 ad impressions. Low attendance but positive ROI on ad spend.",
    },
  ], []);

  const programsWithScore = useMemo(() =>
    programs.map(p => ({ ...p, healthScore: calcHealthScore(p) }))
  , [programs]);

  // Revenue chart data (monthly from revenue table)
  const revenueChartData = useMemo(() => {
    if (!revSummary) return [];
    return (revSummary as any[]).map((r: any) => ({
      month: new Date(r.month + "-01").toLocaleDateString("en-US", { month: "short" }),
      membership: parseFloat(r.membership || '0'),
      events: parseFloat(r.event || '0') + parseFloat(r.bay_rental || '0'),
      coaching: parseFloat(r.coaching || '0'),
    }));
  }, [revSummary]);

  // Campaign funnel data from ClickFunnels
  const funnelData = [
    { step: "Entry Page Views", value: 875, fill: "#F5C72C" },
    { step: "Opt-ins", value: 187, fill: "#F5C72C" },
    { step: "Applications", value: 88, fill: "#F5C72C" },
    { step: "Offer Views", value: 118, fill: "#E0E0E0" },
  ];

  const metaSpend = [
    { name: "Annual Giveaway A1", spend: 803, impressions: 80947, ctr: 0.90 },
    { name: "Junior Summer Camp", spend: 430, impressions: 82307, ctr: 1.82 },
    { name: "Annual Giveaway A2", spend: 379, impressions: 26434, ctr: 2.80 },
    { name: "Superbowl Watch Party", spend: 75, impressions: 4167, ctr: 1.37 },
    { name: "Drive Day Boost", spend: 55, impressions: 4633, ctr: 4.21 },
    { name: "IG Giveaway", spend: 43, impressions: 15528, ctr: 0.30 },
  ];

  const totalMetaSpend = metaSpend.reduce((s, c) => s + c.spend, 0);
  const totalImpressions = metaSpend.reduce((s, c) => s + c.impressions, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Performance across all programs, campaigns, and revenue streams</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download size={14} /> Export PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="MRR (Mar 2026)"
          value={fmtCurrency(snapshot?.members?.mrr ?? 59910)}
          sub={snapshot?.revenue?.mom != null ? `${fmtPct(snapshot.revenue.mom)} vs last month` : undefined}
          trend={snapshot?.revenue?.mom}
        />
        <StatCard
          icon={Users}
          label="Active Members"
          value={snapshot?.members?.total ?? "—"}
          sub={`+${snapshot?.members?.newThisMonth ?? 0} this month`}
          trend={snapshot?.members?.newThisMonth ?? 0}
        />
        <StatCard
          icon={Target}
          label="Meta Ads Spend"
          value={fmtCurrency(totalMetaSpend)}
          sub={`${(totalImpressions / 1000).toFixed(0)}K impressions`}
        />
        <StatCard
          icon={Activity}
          label="Active Programs"
          value={programs.filter(p => p.status === "active").length}
          sub={`${programs.filter(p => p.status === "completed").length} completed`}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/30 border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Program Health</TabsTrigger>
          <TabsTrigger value="meta">Meta Ads</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="funnel">Giveaway Funnel</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Program Health Summary */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Award size={14} style={{ color: YELLOW }} /> Program Health Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {programsWithScore.map(p => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.kpi}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className="text-xs capitalize"
                        style={{
                          background: p.status === "active" ? `${YELLOW}20` : p.status === "completed" ? "#22c55e20" : "#88888820",
                          color: p.status === "active" ? "#b8900a" : p.status === "completed" ? "#16a34a" : GRAY,
                          border: "none"
                        }}
                      >
                        {p.status}
                      </Badge>
                      <HealthDots score={p.healthScore} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Meta Ads Spend Breakdown */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp size={14} style={{ color: YELLOW }} /> Meta Ads Spend by Campaign
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={metaSpend} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: GRAY }} tickFormatter={v => `$${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: GRAY }} width={130} />
                    <Tooltip formatter={(v: any) => [`$${v}`, "Spend"]} />
                    <Bar dataKey="spend" fill={YELLOW} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Revenue vs Goal */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign size={14} style={{ color: YELLOW }} /> Program Revenue vs Target
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {programsWithScore.filter(p => p.revenueTarget > 0).map(p => (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground font-medium">{p.name}</span>
                    <span className="text-muted-foreground">{fmtCurrency(p.revenue)} / {fmtCurrency(p.revenueTarget)}</span>
                  </div>
                  <Progress
                    value={p.revenueTarget > 0 ? Math.min(100, (p.revenue / p.revenueTarget) * 100) : 0}
                    className="h-2"
                    style={{ "--progress-bg": YELLOW } as any}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Program Health Tab */}
        <TabsContent value="programs" className="space-y-4 mt-4">
          {programsWithScore.map(p => (
            <Card key={p.name} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                      <Badge variant="secondary" className="text-xs" style={{
                        background: p.status === "active" ? `${YELLOW}20` : p.status === "completed" ? "#22c55e20" : "#88888820",
                        color: p.status === "active" ? "#b8900a" : p.status === "completed" ? "#16a34a" : GRAY,
                        border: "none"
                      }}>{p.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.type}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground mb-1">Health Score</div>
                    <HealthDots score={p.healthScore} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                  {[
                    { label: "Goal Completion", value: p.goalCompletionPct, weight: "30%" },
                    { label: "Attendance", value: p.attendancePct, weight: "25%" },
                    { label: "Revenue", value: p.revenuePct, weight: "20%" },
                    { label: "Lead Capture", value: p.leadCapturePct, weight: "15%" },
                    { label: "Social Impact", value: p.socialPct, weight: "10%" },
                  ].map(f => (
                    <div key={f.label} className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">{f.label}</div>
                      <div className="text-lg font-bold text-foreground">{f.value}%</div>
                      <div className="text-[10px] text-muted-foreground">weight {f.weight}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <span className="text-xs text-muted-foreground">{p.kpiLabel}: </span>
                    <span className="text-xs font-medium text-foreground">{p.kpi}</span>
                  </div>
                  <div className="text-xs text-muted-foreground max-w-xs text-right">{p.notes}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Meta Ads Tab */}
        <TabsContent value="meta" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={DollarSign} label="Total Spend" value={fmtCurrency(totalMetaSpend)} sub="Feb 2 – Mar 3, 2026" />
            <StatCard icon={Activity} label="Total Impressions" value={`${(totalImpressions / 1000).toFixed(0)}K`} />
            <StatCard icon={Target} label="Avg CTR" value={`${(metaSpend.reduce((s, c) => s + c.ctr, 0) / metaSpend.length).toFixed(2)}%`} />
          </div>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left p-3 text-xs text-muted-foreground font-medium">Campaign</th>
                      <th className="text-right p-3 text-xs text-muted-foreground font-medium">Spend</th>
                      <th className="text-right p-3 text-xs text-muted-foreground font-medium">Impressions</th>
                      <th className="text-right p-3 text-xs text-muted-foreground font-medium">CTR</th>
                      <th className="text-right p-3 text-xs text-muted-foreground font-medium">CPM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metaSpend.map(c => (
                      <tr key={c.name} className="border-b border-border hover:bg-muted/10">
                        <td className="p-3 text-foreground">{c.name}</td>
                        <td className="p-3 text-right font-medium text-foreground">{fmtCurrency(c.spend)}</td>
                        <td className="p-3 text-right text-muted-foreground">{c.impressions.toLocaleString()}</td>
                        <td className="p-3 text-right text-muted-foreground">{c.ctr.toFixed(2)}%</td>
                        <td className="p-3 text-right text-muted-foreground">{fmtCurrency((c.spend / c.impressions) * 1000)}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/20 font-semibold">
                      <td className="p-3 text-foreground">Total</td>
                      <td className="p-3 text-right text-foreground">{fmtCurrency(totalMetaSpend)}</td>
                      <td className="p-3 text-right text-foreground">{totalImpressions.toLocaleString()}</td>
                      <td className="p-3 text-right text-muted-foreground">—</td>
                      <td className="p-3 text-right text-muted-foreground">{fmtCurrency((totalMetaSpend / totalImpressions) * 1000)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab — unified from Revenue & Goals */}
        <TabsContent value="revenue" className="space-y-4 mt-4">
          <RevenueTabContent />
        </TabsContent>

        {/* Giveaway Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4 mt-4">
          <div className="grid grid-cols-4 gap-4">
            <StatCard icon={Activity} label="Entry Page Views" value="875" sub="Unique: 875" />
            <StatCard icon={Users} label="Opt-ins" value="187" sub="21.4% of views" />
            <StatCard icon={FileText} label="Applications" value="88" sub="47.1% of opt-ins" />
            <StatCard icon={Target} label="Offer Views" value="118" sub="Swing Saver offer" />
          </div>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Giveaway Funnel — Feb 2 to Mar 3, 2026</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funnelData.map((step, i) => (
                  <div key={step.step}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{step.step}</span>
                      <span className="text-muted-foreground">{step.value.toLocaleString()}</span>
                    </div>
                    <div className="h-8 rounded-md flex items-center px-3" style={{
                      background: `${YELLOW}${Math.round((1 - i * 0.2) * 255).toString(16).padStart(2, '0')}`,
                      width: `${(step.value / funnelData[0].value) * 100}%`,
                      minWidth: "120px"
                    }}>
                      <span className="text-xs font-bold text-[#111111]">
                        {i > 0 ? `${((step.value / funnelData[i - 1].value) * 100).toFixed(0)}% from prev` : "Top of funnel"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/20 border border-border">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Target:</strong> 1,000 entries · 250 applications by Apr 29.
                  Current pace: 875 entries (87.5% of entry goal) · 88 applications (35% of application goal).
                  <strong className="text-foreground"> Action needed:</strong> Increase Meta Ads budget for Giveaway A2 to convert more opt-ins into full applications.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
