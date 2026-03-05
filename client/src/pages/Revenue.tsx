import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, CreditCard, ShoppingBag } from "lucide-react";

export default function Revenue() {
  const [dateRange] = useState(() => ({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  }));

  const { data: summary, isLoading: summaryLoading } = trpc.revenue.getSummary.useQuery(dateRange);
  const { data: toastDaily, isLoading: toastLoading } = trpc.revenue.getToastDaily.useQuery({ startDate: undefined, endDate: undefined });
  const { data: toastSummary } = trpc.revenue.getToastSummary.useQuery();
  const { data: acuityRevenue } = trpc.revenue.getAcuityRevenue.useQuery({ minDate: undefined, maxDate: undefined });

  const formatCurrency = (val: number | string) =>
    `$${parseFloat(String(val || 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const kpis = [
    {
      label: "Total Revenue (MTD)",
      value: summary ? formatCurrency((summary as any).total || 0) : "—",
      icon: <DollarSign size={20} />,
      color: "text-[#3DB855]",
      bg: "bg-green-400/10",
    },
    {
      label: "Toast POS (MTD)",
      value: toastSummary ? formatCurrency((toastSummary as any).totalRevenue || 0) : "—",
      icon: <ShoppingBag size={20} />,
      color: "text-[#888888]",
      bg: "bg-blue-400/10",
    },
    {
      label: "Acuity Bookings",
      value: acuityRevenue ? formatCurrency((acuityRevenue as any).total || 0) : "—",
      icon: <CreditCard size={20} />,
      color: "text-[#F5C72C]",
      bg: "bg-[#F5C72C]/10",
    },
    {
      label: "Avg Daily Revenue",
      value: toastSummary ? formatCurrency((toastSummary as any).avgDailyRevenue || 0) : "—",
      icon: <TrendingUp size={20} />,
      color: "text-[#888888]",
      bg: "bg-purple-400/10",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Revenue</h1>
        <p className="text-muted-foreground text-sm mt-1">Revenue tracking across all channels</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                  <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <span className={kpi.color}>{kpi.icon}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="toast">
        <TabsList className="bg-muted">
          <TabsTrigger value="toast">Toast POS</TabsTrigger>
          <TabsTrigger value="acuity">Acuity</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
        </TabsList>

        {/* Toast POS Tab */}
        <TabsContent value="toast" className="mt-4">
          {toastLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-card rounded-lg animate-pulse border border-border" />
              ))}
            </div>
          ) : toastDaily && (toastDaily as any[]).length > 0 ? (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Daily Toast Revenue</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2 text-muted-foreground font-medium">Date</th>
                        <th className="text-right px-4 py-2 text-muted-foreground font-medium">Total</th>
                        <th className="text-right px-4 py-2 text-muted-foreground font-medium">Bay</th>
                        <th className="text-right px-4 py-2 text-muted-foreground font-medium">F&B</th>
                        <th className="text-right px-4 py-2 text-muted-foreground font-medium">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(toastDaily as any[]).slice(-14).reverse().map((row: any) => (
                        <tr key={row.date} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-4 py-2 text-foreground">{row.date}</td>
                          <td className="px-4 py-2 text-right font-medium text-foreground">{formatCurrency(row.totalRevenue)}</td>
                          <td className="px-4 py-2 text-right text-muted-foreground">{formatCurrency(row.bayRevenue)}</td>
                          <td className="px-4 py-2 text-right text-muted-foreground">{formatCurrency(row.foodBevRevenue)}</td>
                          <td className="px-4 py-2 text-right text-muted-foreground">{row.totalOrders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No Toast POS data available</div>
          )}
        </TabsContent>

        {/* Acuity Tab */}
        <TabsContent value="acuity" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              {acuityRevenue ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Total Bookings Revenue</div>
                      <div className="text-2xl font-bold text-foreground">
                        {formatCurrency((acuityRevenue as any).total || 0)}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Booking Count</div>
                      <div className="text-2xl font-bold text-foreground">
                        {(acuityRevenue as any).count || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Loading Acuity data...</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Membership Tab */}
        <TabsContent value="membership" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                Membership revenue data is sourced from Boomerang. View in Members section.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
