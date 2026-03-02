// Guest version of Revenue — uses trpc.guest.* public endpoints
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, ShoppingCart, Users } from "lucide-react";

export default function GuestRevenue() {
  const [dateRange] = useState(() => ({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  }));

  const { data: summary } = trpc.guest.getRevenueSummary.useQuery(dateRange);
  const { data: toastSummary } = trpc.guest.getToastSummary.useQuery();
  const { data: toastDaily } = trpc.guest.getToastDaily.useQuery();
  const { data: acuityRevenue } = trpc.guest.getAcuityRevenue.useQuery({ minDate: undefined, maxDate: undefined });

  const totalRevenue = summary?.reduce((s: number, r: any) => s + parseFloat(r.totalRevenue || "0"), 0) ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Revenue</h1>
        <p className="text-muted-foreground text-sm mt-1">Revenue breakdown and analytics</p>
      </div>

      {/* Toast POS Summary */}
      {toastSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={14} className="text-green-400" />
                <span className="text-xs text-muted-foreground">All-Time Revenue</span>
              </div>
              <p className="text-xl font-bold">${toastSummary.allTimeRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-blue-400" />
                <span className="text-xs text-muted-foreground">This Month</span>
              </div>
              <p className="text-xl font-bold">${toastSummary.thisMonthRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">vs ${toastSummary.lastMonthRevenue.toLocaleString()} last month</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart size={14} className="text-purple-400" />
                <span className="text-xs text-muted-foreground">Total Orders</span>
              </div>
              <p className="text-xl font-bold">{toastSummary.allTimeOrders.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Users size={14} className="text-orange-400" />
                <span className="text-xs text-muted-foreground">Total Guests</span>
              </div>
              <p className="text-xl font-bold">{toastSummary.allTimeGuests.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue by Source */}
      {summary && summary.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Revenue by Source (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.map((row: any) => (
                <div key={row.source} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground capitalize">{row.source?.replace(/_/g, " ")}</span>
                  <div className="text-right">
                    <p className="text-sm font-medium">${parseFloat(row.totalRevenue || "0").toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{row.transactionCount} transactions</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toast Revenue Breakdown */}
      {toastSummary && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Toast POS Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-400">${toastSummary.allTimeBay.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Bay Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-orange-400">${toastSummary.allTimeFoodBev.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Food & Beverage</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">${toastSummary.allTimeGolf.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Golf Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acuity Revenue */}
      {acuityRevenue && acuityRevenue.total > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Acuity Bookings Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-lg font-bold text-yellow-400">${acuityRevenue.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{acuityRevenue.totalBookings}</p>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">${acuityRevenue.grouped.pbga_clinics.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">PBGA Clinics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
