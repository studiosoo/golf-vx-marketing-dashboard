import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, DollarSign, Calendar, User, Zap, TrendingUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const TIER_LABELS: Record<string, string> = {
  golf_vx_pro: "Golf VX Pro",
  all_access_aces: "All-Access Ace",
  swing_savers: "Swing Saver",
};

function formatCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function ProMembers() {
  const { data: kpiData, isLoading: kpiLoading, refetch } = trpc.intelligence.getStrategicKPIs.useQuery();
  const { data: members = [], isLoading: membersLoading } = trpc.members.list.useQuery({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const proMembers = (members as any[]).filter((m: any) => m.membershipTier === "golf_vx_pro");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success("Data refreshed");
  };

  const proKpi = kpiData?.proMembers;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Pro Members
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Golf VX Pro coaches — tracked separately from the 300-member goal</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw size={14} className={isRefreshing ? "animate-spin mr-2" : "mr-2"} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Pro Members</span>
              <Trophy size={16} className="text-yellow-500" />
            </div>
            <div className="text-3xl font-black text-foreground">
              {kpiLoading ? "—" : proKpi?.current ?? proMembers.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Active coaches</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Monthly Revenue</span>
              <DollarSign size={16} className="text-green-500" />
            </div>
            <div className="text-3xl font-black text-foreground">
              {kpiLoading ? "—" : formatCurrency(proKpi?.mrr ?? 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">$500/mo base + session credits</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Billing Model</span>
              <Zap size={16} className="text-blue-500" />
            </div>
            <div className="text-lg font-bold text-foreground">$500/mo base</div>
            <div className="text-xs text-muted-foreground mt-1">$25/session bay credit • $25/hr overage after 20 sessions</div>
          </CardContent>
        </Card>
      </div>

      {/* Pro Member Billing Info */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp size={15} className="text-yellow-500" />
            Billing Structure
          </CardTitle>
          <CardDescription className="text-xs">Golf VX Pro membership pricing and session tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/30 rounded-lg p-4 space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Base Fee</div>
              <div className="text-2xl font-bold text-foreground">$500</div>
              <div className="text-xs text-muted-foreground">per month</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bay Credit</div>
              <div className="text-2xl font-bold text-foreground">$25</div>
              <div className="text-xs text-muted-foreground">per session (up to 20/mo)</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Overage Rate</div>
              <div className="text-2xl font-bold text-foreground">$25/hr</div>
              <div className="text-xs text-muted-foreground">after 20 sessions per month</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
              Note: Chuck Lynch (PBGA Lead Coach) has a customized arrangement. Toast POS = non-member/overage bay usage. Stripe = membership fees.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pro Members List */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User size={15} className="text-yellow-500" />
            Pro Members ({membersLoading ? "…" : proMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : proMembers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No Golf VX Pro members found. Members with tier <code className="bg-muted px-1 rounded">golf_vx_pro</code> will appear here.
            </div>
          ) : (
            <div className="space-y-2">
              {proMembers.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-yellow-600">
                        {(m.firstName?.[0] || m.name?.[0] || "?").toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.name || "Unknown"}
                        {(m.firstName === "Chuck" || m.name?.includes("Chuck")) && (
                          <Badge className="ml-2 text-xs bg-yellow-500/20 text-yellow-600 border-yellow-500/30">PBGA Lead</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                      {m.boomerangEmail && (
                        <div className="text-xs text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500/60 flex-shrink-0" />
                          <span title="Boomerang-issued email">{m.boomerangEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        {m.monthlyAmount ? formatCurrency(parseFloat(m.monthlyAmount)) : "$500"}
                        <span className="text-muted-foreground font-normal">/mo</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {m.joinDate ? new Date(m.joinDate).toLocaleDateString() : "—"}
                      </div>
                    </div>
                    <Badge
                      variant={m.status === "active" ? "default" : "secondary"}
                      className={`text-xs ${m.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}`}
                    >
                      {m.status || "unknown"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Tracking Placeholder */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar size={15} className="text-blue-500" />
            Session Tracking
          </CardTitle>
          <CardDescription className="text-xs">Monthly session log and billing calculation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Session logging coming soon</p>
            <p className="text-xs mt-1">Track bay sessions, calculate monthly bills, and manage overage charges per coach</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
