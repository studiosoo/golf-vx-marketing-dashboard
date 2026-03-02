import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function Integrations() {
  const { data: status, isLoading, refetch } = trpc.dashboard.getOverview.useQuery({ startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), endDate: new Date() });

  const integrations = [
    { key: "metaAds", name: "Meta Ads", description: "Facebook & Instagram advertising" },
    { key: "encharge", name: "Encharge", description: "Email marketing automation" },
    { key: "acuity", name: "Acuity Scheduling", description: "Booking & appointment management" },
    { key: "clickfunnels", name: "ClickFunnels", description: "Sales funnel management" },
    { key: "boomerang", name: "Boomerang", description: "Membership management" },
    { key: "toast", name: "Toast POS", description: "Point of sale system" },
  ];

  const getStatusBadge = (s: string) => {
    if (s === "connected" || s === "ok") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Connected</Badge>;
    if (s === "error") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Error</Badge>;
    if (s === "syncing") return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Syncing</Badge>;
    return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
  };

  const getStatusIcon = (s: string) => {
    if (s === "connected" || s === "ok") return <CheckCircle size={16} className="text-green-400" />;
    if (s === "error") return <AlertCircle size={16} className="text-red-400" />;
    return <Clock size={16} className="text-muted-foreground" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="text-muted-foreground text-sm mt-1">Third-party service connections</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-xl animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((integration) => {
            const s = (status as any)?.[integration.key] || {};
            const statusStr = s.status || "unknown";
            return (
              <Card key={integration.key} className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-foreground">{integration.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{integration.description}</div>
                    </div>
                    {getStatusIcon(statusStr)}
                  </div>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(statusStr)}
                    {s.lastSync && (
                      <span className="text-xs text-muted-foreground">
                        Last sync: {new Date(s.lastSync).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {s.count !== undefined && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {s.count.toLocaleString()} records synced
                    </div>
                  )}
                  {s.error && (
                    <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded p-2">
                      {s.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
