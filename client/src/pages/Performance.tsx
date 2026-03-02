import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Users, BarChart3, Target, RefreshCw, Calendar } from "lucide-react";

const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
const fmtPct = (v: number | string) => `${parseFloat(String(v)).toFixed(1)}%`;
type Range = "7d" | "30d" | "90d";
function getRangeDates(range: Range) {
  const end = new Date(); const start = new Date();
  if (range === "7d") start.setDate(end.getDate() - 7);
  else if (range === "30d") start.setDate(end.getDate() - 30);
  else start.setDate(end.getDate() - 90);
  return { start, end };
}
export default function Performance() {
  const [range, setRange] = useState<Range>("30d");
  const dates = useMemo(() => getRangeDates(range), [range]);
  const { data: overview, isLoading: ovLoading, refetch } = trpc.dashboard.getOverview.useQuery({ startDate: dates.start, endDate: dates.end });
  const { data: categories, isLoading: catLoading } = trpc.campaigns.getCategorySummary.useQuery();
  const { data: revenueChart, isLoading: revLoading } = trpc.dashboard.getRevenueChart.useQuery({ startDate: dates.start, endDate: dates.end });
  const isLoading = ovLoading || catLoading;
  const roiValue = parseFloat(String(overview?.overallROI ?? 0));
  const kpis = [
    { label: "Total Revenue", value: fmt(parseFloat(String(overview?.totalRevenue ?? 0))), icon: DollarSign, color: "text-[#5daf68]", bg: "bg-[#5daf68]/10", trend: "up" as const },
    { label: "MRR", value: fmt(overview?.monthlyRecurringRevenue ?? 0), icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", trend: "up" as const },
    { label: "Active Members", value: String(overview?.activeMembers ?? "—"), icon: Users, color: "text-[#ef9253]", bg: "bg-[#ef9253]/10", trend: "up" as const },
    { label: "Marketing Spend", value: fmt(parseFloat(String(overview?.marketingSpend ?? 0))), icon: BarChart3, color: "text-[#76addc]", bg: "bg-[#76addc]/10", trend: "flat" as const },
    { label: "Overall ROI", value: fmtPct(overview?.overallROI ?? 0), icon: Target, color: roiValue >= 0 ? "text-[#5daf68]" : "text-red-400", bg: roiValue >= 0 ? "bg-[#5daf68]/10" : "bg-red-500/10", trend: roiValue >= 0 ? "up" as const : "down" as const },
    { label: "Active Campaigns", value: String(overview?.activeCampaignsCount ?? "—"), icon: Target, color: "text-[#a87fbe]", bg: "bg-[#a87fbe]/10", trend: "flat" as const },
  ];
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Performance</h1>
            <p className="text-muted-foreground mt-1 text-sm">Campaign KPIs, revenue, and ROI across all programs</p>
          </div>
          <div className="flex items-center gap-2">
            {(["7d", "30d", "90d"] as Range[]).map((r) => (
              <Button key={r} size="sm" variant={range === r ? "default" : "outline"} className="h-8 px-3 text-xs" onClick={() => setRange(r)}>
                {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
              </Button>
            ))}
            <Button size="sm" variant="outline" className="h-8 px-3 text-xs gap-1" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                      <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    </div>
                    <div className={`h-9 w-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 mt-2 text-xs ${kpi.color}`}>
                    {kpi.trend === "up" ? <TrendingUp className="h-3 w-3" /> : kpi.trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
                    <span>{kpi.trend === "up" ? "Trending up" : kpi.trend === "down" ? "Trending down" : "Stable"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Campaign Category Breakdown</CardTitle></CardHeader>
          <CardContent>
            {catLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              : !categories?.length ? <p className="text-sm text-muted-foreground text-center py-8">No campaign data available</p>
              : <div className="space-y-3">{categories.map((cat) => {
                  const pct = cat.totalBudget > 0 ? Math.round((cat.totalSpend / cat.totalBudget) * 100) : 0;
                  const over = pct > 100;
                  return (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{cat.name}</span>
                          <Badge variant="outline" className="text-xs">{cat.activeCampaigns} active</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className={over ? "text-red-400 font-semibold" : ""}>{fmt(cat.totalSpend)} / {fmt(cat.totalBudget)}</span>
                          <span className={`font-semibold ${over ? "text-red-400" : pct > 80 ? "text-amber-400" : "text-green-400"}`}>{pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${over ? "bg-red-500" : pct > 80 ? "bg-[#ef9253]" : "bg-primary"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">Monthly Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {revLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              : !revenueChart?.length ? <p className="text-sm text-muted-foreground text-center py-8">No revenue data for this period</p>
              : <div className="space-y-2">{revenueChart.map((row) => {
                  const maxRev = Math.max(...revenueChart.map((r) => r.revenue));
                  const pct = maxRev > 0 ? Math.round((row.revenue / maxRev) * 100) : 0;
                  return (
                    <div key={row.month} className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground w-16 text-xs shrink-0">{row.month}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-[#5daf68] transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-foreground w-20 text-right font-medium">{fmt(row.revenue)}</span>
                    </div>
                  );
                })}</div>}
          </CardContent>
        </Card>
        {overview?.memberStats && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Membership Tier Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Regular Members */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pb-1 border-b">Regular Members</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">All-Access Aces</p>
                    <p className="text-xl font-bold text-primary">{overview.memberStats.allAccessCount}</p>
                    <p className="text-xs text-muted-foreground">{fmt(parseFloat((overview.memberStats as any).allAccessMRR || overview.memberStats.allAccessCount * 325))} MRR</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Swing Savers</p>
                    <p className="text-xl font-bold text-[#76addc]">{overview.memberStats.swingSaversCount}</p>
                    <p className="text-xs text-muted-foreground">{fmt(parseFloat((overview.memberStats as any).swingSaversMRR || overview.memberStats.swingSaversCount * 225))} MRR</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Trial / Other</p>
                    <p className="text-xl font-bold text-[#ef9253]">{Math.max(0, overview.memberStats.activeMembers - overview.memberStats.allAccessCount - overview.memberStats.swingSaversCount - overview.memberStats.golfVxProCount)}</p>
                    <p className="text-xs text-muted-foreground">Unclassified</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Customer MRR</p>
                    <p className="text-xl font-bold text-[#5daf68]">{fmt(parseFloat((overview.memberStats as any).allAccessMRR || overview.memberStats.allAccessCount * 325) + parseFloat((overview.memberStats as any).swingSaversMRR || overview.memberStats.swingSaversCount * 225))}</p>
                    <p className="text-xs text-muted-foreground">AA + SS combined</p>
                  </div>
                </div>
              </div>
              {/* Pro Members */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pb-1 border-b">Pro Members (Coaches)</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Pro Coaches</p>
                    <p className="text-xl font-bold text-[#a87fbe]">{overview.memberStats.golfVxProCount}</p>
                    <p className="text-xs text-muted-foreground">incl. Coach Chuck Lynch</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Base MRR</p>
                    <p className="text-xl font-bold text-[#a87fbe]">{fmt(parseFloat((overview.memberStats as any).golfVxProMRR || overview.memberStats.golfVxProCount * 500))}</p>
                    <p className="text-xs text-muted-foreground">$500/mo · via Stripe</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Bay Credit</p>
                    <p className="text-xl font-bold" style={{color:'#a87fbe'}}>$25/session</p>
                    <p className="text-xs text-muted-foreground">Deducted from base</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Overage Rate</p>
                    <p className="text-xl font-bold" style={{color:'#a87fbe'}}>$25/hr</p>
                    <p className="text-xs text-muted-foreground">After 20 sessions/mo</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
