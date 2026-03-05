import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Mail, TrendingUp, Zap } from "lucide-react";

export default function Automations() {
  const { data: account, isLoading: accountLoading } = trpc.encharge.getAccount.useQuery();
  const { data: segments, isLoading: segmentsLoading } = trpc.encharge.getSegments.useQuery();
  const { data: metrics, isLoading: metricsLoading } = trpc.encharge.getMetrics.useQuery();

  const isLoading = accountLoading || segmentsLoading || metricsLoading;

  const automationFlows = [
    { id: 1, name: "Trial → Member Conversion", status: "active", trigger: "Trial Started", actions: 5, enrolled: 23 },
    { id: 2, name: "Welcome Sequence", status: "active", trigger: "New Member", actions: 3, enrolled: 45 },
    { id: 3, name: "Win-Back Campaign", status: "active", trigger: "Inactive 30 days", actions: 4, enrolled: 12 },
    { id: 4, name: "Drive Day Follow-up", status: "paused", trigger: "Drive Day Attended", actions: 2, enrolled: 8 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Automations</h1>
        <p className="text-muted-foreground text-sm mt-1">Email automation flows via Encharge</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{(metrics as any)?.totalSubscribers || 0}</div>
            <div className="text-xs text-muted-foreground">Total Subscribers</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-[#3DB855]">{(metrics as any)?.activeSubscribers || 0}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-[#888888]">{(segments as any[])?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Segments</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-[#888888]">{automationFlows.filter(f => f.status === "active").length}</div>
            <div className="text-xs text-muted-foreground">Active Flows</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Automation Flows</h2>
        <div className="space-y-3">
          {automationFlows.map((flow) => (
            <Card key={flow.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                      <Zap size={16} className="text-yellow-400" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">{flow.name}</div>
                      <div className="text-xs text-muted-foreground">Trigger: {flow.trigger} · {flow.actions} actions · {flow.enrolled} enrolled</div>
                    </div>
                  </div>
                  <Badge
                    className={flow.status === "active"
                      ? "bg-[#3DB855]/20 text-[#3DB855] border-[#3DB855]/30 text-xs"
                      : "bg-muted text-muted-foreground text-xs"}
                  >
                    {flow.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {(segments as any[])?.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Segments</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(segments as any[]).map((seg: any) => (
              <Card key={seg.id} className="bg-card border-border">
                <CardContent className="p-3">
                  <div className="font-medium text-foreground text-sm">{seg.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{seg.count || 0} subscribers</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
