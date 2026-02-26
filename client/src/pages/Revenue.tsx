import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Phone, X } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Users, ShoppingCart, CreditCard, Banknote, Calendar, BookOpen, GraduationCap } from "lucide-react";

const COLORS = ["#ffcb00", "#ef9253", "#5daf68", "#a87fbe", "#76addc", "#EC4899"];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtMonth(yyyymm: string) {
  if (!yyyymm || yyyymm.length < 6) return yyyymm;
  const y = yyyymm.slice(0, 4);
  const m = yyyymm.slice(4, 6);
  return new Date(`${y}-${m}-01`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function StatCard({ title, value, sub, icon: Icon, trend }: {
  title: string; value: string; sub?: string; icon: any; trend?: "up" | "down" | null;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            vs last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Revenue() {
  const [view, setView] = useState<"monthly" | "daily">("monthly");

  const { data: summary, isLoading: summaryLoading } = trpc.revenue.getToastSummary.useQuery();
  const { data: monthly, isLoading: monthlyLoading } = trpc.revenue.getToastMonthly.useQuery();
  const { data: daily, isLoading: dailyLoading } = trpc.revenue.getToastDaily.useQuery({});
  const { data: payments, isLoading: paymentsLoading } = trpc.revenue.getToastPaymentBreakdown.useQuery();
  const { data: syncStatus } = trpc.revenue.getToastSyncStatus.useQuery();
  const currentYear = new Date().getFullYear();
  const [selectedAcuityType, setSelectedAcuityType] = useState<{ id: number; name: string } | null>(null);
  const { data: acuityRevenue, isLoading: acuityLoading } = trpc.revenue.getAcuityRevenue.useQuery({
    minDate: `${currentYear}-01-01`,
    maxDate: `${currentYear}-12-31`,
  });
  const { data: acuityMonthly } = trpc.revenue.getAcuityMonthly.useQuery({ months: 6 });

  // Last 30 days daily data
  const last30Days = useMemo(() => {
    if (!daily) return [];
    return daily.slice(-30);
  }, [daily]);

  // Payment type pie data
  const paymentPieData = useMemo(() => {
    if (!payments) return [];
    const grouped: Record<string, number> = {};
    for (const p of payments) {
      const key = p.paymentType || "Other";
      grouped[key] = (grouped[key] || 0) + p.totalAmount;
    }
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [payments]);

  // Revenue category pie data
  const categoryPieData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Bay Usage", value: summary.allTimeBay },
      { name: "Food & Beverage", value: summary.allTimeFoodBev },
      { name: "Golf", value: summary.allTimeGolf },
    ].filter(d => d.value > 0);
  }, [summary]);

  const momChange = summary
    ? summary.lastMonthRevenue > 0
      ? ((summary.thisMonthRevenue - summary.lastMonthRevenue) / summary.lastMonthRevenue) * 100
      : null
    : null;

  const isLoading = summaryLoading || monthlyLoading || dailyLoading || paymentsLoading;

  // MoM category drill-down: last 2 months
  const momCategoryData = useMemo(() => {
    if (!monthly || monthly.length < 2) return null;
    const sorted = [...monthly].sort((a, b) => a.month.localeCompare(b.month));
    const curr = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    const delta = (c: number, p: number) => p === 0 ? null : ((c - p) / p) * 100;
    return {
      currMonth: curr.month,
      prevMonth: prev.month,
      categories: [
        { name: "Bay Usage", color: "#ffcb00", curr: curr.bayRevenue, prev: prev.bayRevenue, delta: delta(curr.bayRevenue, prev.bayRevenue), note: "Non-member & additional-hour bay time" },
        { name: "Food & Beverage", color: "#5daf68", curr: curr.foodBevRevenue, prev: prev.foodBevRevenue, delta: delta(curr.foodBevRevenue, prev.foodBevRevenue), note: "Bar & food sales" },
        { name: "Golf / Merch", color: "#76addc", curr: curr.golfRevenue, prev: prev.golfRevenue, delta: delta(curr.golfRevenue, prev.golfRevenue), note: "Golf retail & merchandise" },
      ],
      totalCurr: curr.totalRevenue,
      totalPrev: prev.totalRevenue,
      totalDelta: delta(curr.totalRevenue, prev.totalRevenue),
    };
  }, [monthly]);

  // Combined monthly chart data (Toast + Acuity)
  const combinedMonthly = useMemo(() => {
    if (!monthly) return [];
    return monthly.map(m => {
      const acuityM = acuityMonthly?.find(a => a.month === m.month);
      return { ...m, acuityRevenue: acuityM?.revenue || 0, acuityBookings: acuityM?.bookings || 0 };
    });
  }, [monthly, acuityMonthly]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Revenue <span className="text-primary">Dashboard</span></h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Toast POS data — {syncStatus ? `${syncStatus.success} days synced` : "Loading..."}{" "}
              {syncStatus?.latest && `· Last sync: ${new Date(syncStatus.latest).toLocaleDateString()}`}
            </p>
          </div>
          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Live Toast Data
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-5 h-24 animate-pulse bg-muted/30 rounded-lg" /></Card>
            ))}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="All-Time Revenue"
                value={fmt(summary?.allTimeRevenue || 0)}
                sub={`${summary?.daysWithData || 0} days of data`}
                icon={DollarSign}
              />
              <StatCard
                title="This Month"
                value={fmt(summary?.thisMonthRevenue || 0)}
                sub={momChange !== null ? `${momChange > 0 ? "+" : ""}${momChange.toFixed(1)}% vs last month` : undefined}
                icon={TrendingUp}
                trend={momChange !== null ? (momChange >= 0 ? "up" : "down") : null}
              />
              <StatCard
                title="All-Time Orders"
                value={(summary?.allTimeOrders || 0).toLocaleString()}
                sub={`${summary?.allTimeGuests || 0} total guests`}
                icon={ShoppingCart}
              />
              <StatCard
                title="All-Time Tips"
                value={fmt(summary?.allTimeTips || 0)}
                sub="Included in revenue"
                icon={Users}
              />
            </div>

            {/* Revenue Category Breakdown */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Bay Usage Revenue</p>
                  <p className="text-xl font-bold">{fmt(summary?.allTimeBay || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary?.allTimeRevenue ? ((summary.allTimeBay / summary.allTimeRevenue) * 100).toFixed(1) : 0}% of total
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-[#76addc]">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Food & Beverage</p>
                  <p className="text-xl font-bold">{fmt(summary?.allTimeFoodBev || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary?.allTimeRevenue ? ((summary.allTimeFoodBev / summary.allTimeRevenue) * 100).toFixed(1) : 0}% of total
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-[#5daf68]">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Golf Revenue</p>
                  <p className="text-xl font-bold">{fmt(summary?.allTimeGolf || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary?.allTimeRevenue ? ((summary.allTimeGolf / summary.allTimeRevenue) * 100).toFixed(1) : 0}% of total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Revenue Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Monthly Revenue Trend</CardTitle>
                <div className="flex gap-2">
                  <button
                    onClick={() => setView("monthly")}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${view === "monthly" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >Monthly</button>
                  <button
                    onClick={() => setView("daily")}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${view === "daily" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >Last 30 Days</button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  {view === "monthly" ? (
                    <AreaChart data={monthly || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [fmt(v), "Revenue"]} labelFormatter={fmtMonth} />
                      <Area type="monotone" dataKey="totalRevenue" stroke="var(--color-brand-primary)" fill="url(#colorRevenue)" strokeWidth={2} name="Total Revenue" />
                    </AreaChart>
                  ) : (
                    <AreaChart data={last30Days} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(4)} />
                      <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [fmt(v), "Revenue"]} />
                      <Area type="monotone" dataKey="totalRevenue" stroke="var(--color-brand-primary)" fill="url(#colorRevenue2)" strokeWidth={2} name="Daily Revenue" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Breakdown by Category (Monthly Stacked) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Revenue by Category (Monthly)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthly || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={fmtMonth} />
                    <Legend />
                    <Bar dataKey="bayRevenue" name="Bay Usage" stackId="a" fill="var(--color-brand-primary)" />
                    <Bar dataKey="foodBevRevenue" name="Food & Bev" stackId="a" fill="var(--color-brand-green)" />
                    <Bar dataKey="golfRevenue" name="Golf" stackId="a" fill="var(--color-brand-blue)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Breakdown + Category Pie */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Payment Method Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={paymentPieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {paymentPieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1">
                    {payments?.slice(0, 6).map((p, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{p.paymentType}{p.cardType ? ` · ${p.cardType}` : ""}</span>
                        <span className="font-medium">{fmt(p.totalAmount)} ({p.count} txns)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Banknote className="w-4 h-4" /> Revenue Category Split
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={categoryPieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {categoryPieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1">
                    {categoryPieData.map((d, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i] }} />
                          <span className="text-muted-foreground">{d.name}</span>
                        </span>
                        <span className="font-medium">{fmt(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Orders & Guests */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Monthly Orders & Guests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthly || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={fmtMonth} />
                    <Legend />
                    <Bar dataKey="totalOrders" name="Orders" fill="var(--color-brand-primary)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="totalGuests" name="Guests" fill="var(--color-brand-blue)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ── Acuity Revenue Section ── */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Acuity Scheduling Revenue
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">PBGA Clinics, Drive Day, Trial Sessions — Coach Chuck Lynch programs</p>
                </div>
                <Badge variant="outline" className="gap-1 text-blue-600 border-blue-600">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  Acuity Live
                </Badge>
              </div>

              {acuityLoading ? (
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}><CardContent className="p-5 h-20 animate-pulse bg-muted/30 rounded-lg" /></Card>
                  ))}
                </div>
              ) : (
                <>
                  {/* Acuity KPI Cards */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Card className="border-l-4 border-l-[#a87fbe]">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">PBGA Clinics Revenue</p>
                        <p className="text-xl font-bold">{fmt(acuityRevenue?.grouped?.pbga_clinics?.totalRevenue || 0)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{acuityRevenue?.grouped?.pbga_clinics?.bookingCount || 0} bookings</p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-[#ef9253]">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Trial Sessions Revenue</p>
                        <p className="text-xl font-bold">{fmt(acuityRevenue?.grouped?.trial?.totalRevenue || 0)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{acuityRevenue?.grouped?.trial?.bookingCount || 0} trial bookings</p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-teal-500">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Acuity Revenue</p>
                        <p className="text-xl font-bold">{fmt(acuityRevenue?.total || 0)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{acuityRevenue?.totalBookings || 0} total bookings</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Acuity by Appointment Type */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Revenue by Appointment Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(acuityRevenue?.byType || []).filter(t => t.totalRevenue > 0).map((t, i) => {
                          const pct = acuityRevenue?.total ? (t.totalRevenue / acuityRevenue.total) * 100 : 0;
                          const isPbga = (t.appointmentType || '').toLowerCase().includes('pbga') || (t.appointmentType || '').toLowerCase().includes('clinic') || (t.appointmentType || '').toLowerCase().includes('drive day') || (t.appointmentType || '').toLowerCase().includes('camp');
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-3 cursor-pointer hover:bg-muted/40 rounded-md px-1 py-0.5 transition-colors group"
                              onClick={() => setSelectedAcuityType({ id: t.appointmentTypeId, name: t.appointmentType })}
                              title="Click to see attendee list"
                            >
                              <div className="w-40 text-xs text-muted-foreground truncate group-hover:text-foreground">{t.appointmentType}</div>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${pct}%`, background: isPbga ? 'var(--color-brand-purple)' : 'var(--color-brand-orange)' }}
                                />
                              </div>
                              <div className="text-xs font-medium w-20 text-right">{fmt(t.totalRevenue)}</div>
                              <button
                                className="text-xs text-primary underline w-20 text-right"
                                onClick={(e) => { e.stopPropagation(); setSelectedAcuityType({ id: t.appointmentTypeId, name: t.appointmentType }); }}
                              >{t.bookingCount} bookings</button>
                            </div>
                          );
                        })}
                        {(acuityRevenue?.byType || []).filter(t => t.totalRevenue > 0).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No paid Acuity appointments found for this period.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* MoM Category Drill-Down */}
                  {momCategoryData && (
                    <Card className="border border-primary/20 bg-primary/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-red-500" />
                          Month-over-Month Drill-Down
                          <span className="text-xs font-normal text-muted-foreground ml-2">
                            {fmtMonth(momCategoryData.prevMonth)} → {fmtMonth(momCategoryData.currMonth)}
                          </span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Toast POS revenue = non-member bay usage + additional hours. Membership fees tracked separately via Stripe.</p>
                      </CardHeader>
                      <CardContent>
                        {/* Total MoM row */}
                        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-background border">
                          <span className="font-semibold text-sm">Total POS Revenue</span>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">{fmtMonth(momCategoryData.prevMonth)}</p>
                              <p className="font-medium">{fmt(momCategoryData.totalPrev)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">{fmtMonth(momCategoryData.currMonth)}</p>
                              <p className="font-medium">{fmt(momCategoryData.totalCurr)}</p>
                            </div>
                            <div className="text-right min-w-[60px]">
                              {momCategoryData.totalDelta !== null && (
                                <span className={`text-sm font-bold ${momCategoryData.totalDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {momCategoryData.totalDelta > 0 ? '+' : ''}{momCategoryData.totalDelta.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Per-category rows */}
                        <div className="space-y-3">
                          {momCategoryData.categories.map((cat, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: cat.color }} />
                                  <span className="text-sm font-medium">{cat.name}</span>
                                  <span className="text-xs text-muted-foreground hidden md:inline">{cat.note}</span>
                                </div>
                                <div className="flex items-center gap-6">
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">{fmtMonth(momCategoryData.prevMonth)}</p>
                                    <p className="text-sm">{fmt(cat.prev)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">{fmtMonth(momCategoryData.currMonth)}</p>
                                    <p className="text-sm font-medium">{fmt(cat.curr)}</p>
                                  </div>
                                  <div className="text-right min-w-[60px]">
                                    {cat.delta !== null ? (
                                      <span className={`text-xs font-bold ${cat.delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {cat.delta > 0 ? '+' : ''}{cat.delta.toFixed(1)}%
                                      </span>
                                    ) : <span className="text-xs text-muted-foreground">—</span>}
                                  </div>
                                </div>
                              </div>
                              {/* Progress bar showing curr vs prev */}
                              <div className="flex gap-1 h-1.5">
                                <div className="h-full rounded-full opacity-40" style={{ width: `${Math.min(100, cat.prev > 0 ? (cat.prev / Math.max(cat.prev, cat.curr)) * 100 : 0)}%`, background: cat.color }} />
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, cat.curr > 0 ? (cat.curr / Math.max(cat.prev, cat.curr)) * 100 : 0)}%`, background: cat.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Side-by-side bar chart */}
                        <div className="mt-4">
                          <ResponsiveContainer width="100%" height={160}>
                            <BarChart
                              data={momCategoryData.categories.map(c => ({ name: c.name, [fmtMonth(momCategoryData.prevMonth)]: c.prev, [fmtMonth(momCategoryData.currMonth)]: c.curr }))}
                              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                              <Tooltip formatter={(v: number) => fmt(v)} />
                              <Legend />
                              <Bar dataKey={fmtMonth(momCategoryData.prevMonth)} fill="var(--color-brand-gray)" radius={[3, 3, 0, 0]} />
                              <Bar dataKey={fmtMonth(momCategoryData.currMonth)} fill="var(--color-brand-primary)" radius={[3, 3, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Combined Toast + Acuity Monthly Chart */}
                  <Card className="mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">Toast vs Acuity Revenue (Last 6 Months)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={combinedMonthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={fmtMonth} />
                          <Legend />
                          <Bar dataKey="totalRevenue" name="Toast (POS)" fill="var(--color-brand-primary)" stackId="a" />
                          <Bar dataKey="acuityRevenue" name="Acuity (Clinics)" fill="var(--color-brand-purple)" stackId="a" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </>
        )}
      </div>
      {/* Acuity Bookings Drill-Down Modal */}
      {selectedAcuityType && (
        <AcuityBookingsModal
          typeId={selectedAcuityType.id}
          typeName={selectedAcuityType.name}
          onClose={() => setSelectedAcuityType(null)}
        />
      )}
    </DashboardLayout>
  );
}

function AcuityBookingsModal({ typeId, typeName, onClose }: { typeId: number; typeName: string; onClose: () => void }) {
  const currentYear = new Date().getFullYear();
  const { data: bookings, isLoading } = trpc.revenue.getAcuityBookingsList.useQuery({
    appointmentTypeId: typeId,
    minDate: `${currentYear}-01-01`,
    maxDate: `${currentYear}-12-31`,
  });
  const sendEmail = trpc.communication.sendEmail.useMutation();
  const sendSMS = trpc.communication.sendSMS.useMutation();

  const handleEmailAll = async () => {
    if (!bookings) return;
    const unique = Array.from(new Map(bookings.map(b => [b.email, b])).values());
    for (const b of unique) {
      if (b.email) {
        await sendEmail.mutateAsync({
          recipientId: b.id,
          recipientType: 'lead' as const,
          email: b.email,
          subject: `Thank you for booking ${typeName}`,
          htmlBody: `<p>Hi ${b.firstName}, thank you for your recent booking at Golf VX Arlington Heights. We look forward to seeing you!</p>`,
          recipientName: `${b.firstName} ${b.lastName}`,
          campaignName: typeName,
        });
      }
    }
  };

  const handleSMSAll = async () => {
    if (!bookings) return;
    const unique = Array.from(new Map(bookings.map(b => [b.phone, b])).values());
    for (const b of unique.filter(b => b.phone)) {
      await sendSMS.mutateAsync({
        recipientId: b.id,
        recipientType: 'lead' as const,
        phone: b.phone,
        body: `Hi ${b.firstName}! Thanks for booking ${typeName} at Golf VX Arlington Heights. See you soon!`,
        recipientName: `${b.firstName} ${b.lastName}`,
        campaignName: typeName,
      });
    }
  };

  const uniqueBookings = bookings ? Array.from(new Map(bookings.map(b => [b.email, b])).values()) : [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{typeName}</span>
            <Badge variant="outline">{uniqueBookings.length} unique bookers</Badge>
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading bookings...</div>
        ) : (
          <>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {uniqueBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{b.firstName} {b.lastName}</p>
                    <p className="text-xs text-muted-foreground">{b.date} · {b.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-green-600">${b.amountPaid.toFixed(2)}</span>
                    {b.email && (
                      <a href={`mailto:${b.email}`} className="p-1 rounded hover:bg-muted" title={b.email}>
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      </a>
                    )}
                    {b.phone && (
                      <a href={`tel:${b.phone}`} className="p-1 rounded hover:bg-muted" title={b.phone}>
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {uniqueBookings.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No bookings found for this appointment type.</p>
              )}
            </div>
            <div className="flex gap-2 pt-3 border-t">
              <Button size="sm" variant="outline" className="flex-1" onClick={handleEmailAll} disabled={sendEmail.isPending}>
                <Mail className="w-3.5 h-3.5 mr-1" /> Email All ({uniqueBookings.filter(b => b.email).length})
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={handleSMSAll} disabled={sendSMS.isPending}>
                <Phone className="w-3.5 h-3.5 mr-1" /> SMS All ({uniqueBookings.filter(b => b.phone).length})
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
