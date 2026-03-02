// Guest version of Revenue — uses trpc.guest.* public endpoints
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users } from "lucide-react";

export default function GuestRevenue() {
  const [dateRange] = useState(() => ({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  }));

  const { data: summary, isLoading } = trpc.guest.getRevenueSummary.useQuery(dateRange);
  const { data: memberStats } = trpc.guest.getMemberStats.useQuery();

  const summaryAny = summary as any;
  const totalRevenue = Array.isArray(summaryAny)
    ? summaryAny.reduce((s: number, r: any) => s + parseFloat(r.totalRevenue || "0"), 0)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Revenue</h1>
        <p className="text-muted-foreground text-sm mt-1">Revenue overview for the current month</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-yellow-500" />
              <span className="text-xs text-muted-foreground">Total Revenue (MTD)</span>
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? "..." : `$${totalRevenue.toLocaleString()}`}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-blue-400" />
              <span className="text-xs text-muted-foreground">Active Members</span>
            </div>
            <p className="text-2xl font-bold">{(memberStats as any)?.activeMembers ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-green-400" />
              <span className="text-xs text-muted-foreground">Monthly MRR</span>
            </div>
            <p className="text-2xl font-bold">
              ${parseFloat((memberStats as any)?.monthlyRecurringRevenue || "0").toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Source */}
      {Array.isArray(summaryAny) && summaryAny.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Revenue by Source (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summaryAny.map((row: any) => (
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

      {/* Membership Revenue Breakdown */}
      {memberStats && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Membership Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold">{(memberStats as any).allAccessCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">All Access</p>
              </div>
              <div>
                <p className="text-xl font-bold">{(memberStats as any).swingSaverCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">Swing Saver</p>
              </div>
              <div>
                <p className="text-xl font-bold">{(memberStats as any).golfVxProCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">Golf VX Pro</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
