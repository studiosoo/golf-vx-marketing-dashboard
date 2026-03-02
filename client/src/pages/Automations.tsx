import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Zap, Users, BarChart3, RefreshCw, ExternalLink, CheckCircle2, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AUTOMATION_RULES = [
  { trigger: "Boomerang CardIssuedEvent", action: "Encharge: upsert subscriber + #card-issued tag", status: "active", channel: "Boomerang → Encharge" },
  { trigger: "Boomerang CardInstalledEvent", action: "Encharge: add #apple-wallet tag", status: "active", channel: "Boomerang → Encharge" },
  { trigger: "Boomerang CardDeletedEvent", action: "Encharge: add #churned tag (pending)", status: "pending", channel: "Boomerang → Encharge" },
  { trigger: "New Member Created", action: "Encharge: upsert person with membership tier", status: "active", channel: "Dashboard → Encharge" },
  { trigger: "Member Status Updated", action: "Encharge: sync status + tags", status: "active", channel: "Dashboard → Encharge" },
  { trigger: "Giveaway Application", action: "Encharge: add #giveaway-2026 tag", status: "active", channel: "ClickFunnels → Encharge" },
  { trigger: "Meta Lead Ad", action: "Email capture → Encharge subscriber", status: "active", channel: "Meta → Encharge" },
  { trigger: "Acuity Booking", action: "Conversion tracking + member sync", status: "active", channel: "Acuity → Dashboard" },
];

export default function Automations() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: account, isLoading: acctLoading } = trpc.encharge.getAccount.useQuery();
  const { data: metrics } = trpc.encharge.getMetrics.useQuery();
  const { data: segments, isLoading: segsLoading } = trpc.encharge.getSegments.useQuery();

  const syncConversions = trpc.conversion.syncConversions.useMutation({
    onSuccess: (r: any) => { toast({ title: `Conversion sync complete: ${r.synced ?? 0} records` }); utils.conversion.getPerformanceWithROAS.invalidate(); },
    onError: (e: any) => toast({ title: "Sync failed", description: e.message, variant: "destructive" }),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Automations</h1>
            <p className="text-muted-foreground mt-1 text-sm">Active automation rules and Encharge integration status</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
              onClick={() => { utils.encharge.getAccount.invalidate(); utils.encharge.getMetrics.invalidate(); utils.encharge.getSegments.invalidate(); }}>
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
            <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => syncConversions.mutate()} disabled={syncConversions.isPending}>
              {syncConversions.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Sync Conversions
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Encharge Account
            </CardTitle>
            {account && (
              <a href="https://app.encharge.io" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                Open Encharge <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardHeader>
          <CardContent>
            {acctLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
            ) : account ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Account", value: (account as any).name ?? "Connected", color: "text-green-400" },
                  { label: "Subscribers", value: (metrics as any)?.total?.toLocaleString() ?? "—", color: "text-primary" },
                  { label: "Active", value: (metrics as any)?.active?.toLocaleString() ?? "—", color: "text-green-400" },
                  { label: "Unsubscribed", value: (metrics as any)?.unsubscribed?.toLocaleString() ?? "—", color: "text-muted-foreground" },
                ].map((s) => (
                  <div key={s.label} className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Encharge connection unavailable</p>
            )}
          </CardContent>
        </Card>

        {!segsLoading && segments && (segments as any[]).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" /> Encharge Segments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(segments as any[]).slice(0, 20).map((seg: any) => (
                  <div key={seg.id} className="flex items-center gap-1.5 bg-muted/40 rounded-full px-3 py-1">
                    <span className="text-xs font-medium text-foreground">{seg.name}</span>
                    {seg.count !== undefined && <span className="text-xs text-muted-foreground">({seg.count})</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Active Automation Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {AUTOMATION_RULES.map((rule, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {rule.status === "active"
                      ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                      : <div className="h-4 w-4 rounded-full border-2 border-amber-400/50 bg-amber-400/10" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{rule.trigger}</span>
                      <Badge variant="outline" className="text-xs">{rule.channel}</Badge>
                      {rule.status === "pending" && <Badge className="text-xs bg-amber-500/15 text-amber-400 border-amber-500/30">Pending</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{rule.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-400" /> Conversion Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Links Acuity bookings with Meta Ad campaigns to calculate accurate ROAS. Click to refresh.
            </p>
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => syncConversions.mutate()} disabled={syncConversions.isPending}>
              {syncConversions.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Run Conversion Sync
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
