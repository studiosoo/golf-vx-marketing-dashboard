import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, RefreshCw, Gift, Calendar, Users, Sparkles } from "lucide-react";

export default function PrivateEvents() {
  const utils = trpc.useUtils();

  const { data: giveawayApps, isLoading: giveawayLoading } = trpc.giveaway.getApplications.useQuery();
  const { data: giveawayStats, isLoading: statsLoading } = trpc.giveaway.getStats.useQuery();
  const { data: corporateCampaigns, isLoading: corpLoading } = trpc.campaigns.getByCategory.useQuery({ category: "corporate_events" });

  const syncGiveaway = trpc.giveaway.sync.useMutation({
    onSuccess: () => { utils.giveaway.getApplications.invalidate(); utils.giveaway.getStats.invalidate(); },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Private Events</h1>
            <p className="text-muted-foreground mt-1 text-sm">Private event bookings, giveaway applications, and corporate inquiries</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => syncGiveaway.mutate()} disabled={syncGiveaway.isPending}>
            {syncGiveaway.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Sync Giveaway
          </Button>
        </div>

        {/* Giveaway Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Gift className="h-4 w-4 text-amber-400" /> 2026 Annual Giveaway
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Total Applications", value: (giveawayStats as any)?.total ?? 0, color: "text-primary" },
                  { label: "Approved", value: (giveawayStats as any)?.approved ?? 0, color: "text-green-400" },
                  { label: "Pending", value: (giveawayStats as any)?.pending ?? 0, color: "text-amber-400" },
                  { label: "Rejected", value: (giveawayStats as any)?.rejected ?? 0, color: "text-muted-foreground" },
                ].map((s) => (
                  <div key={s.label} className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{Number(s.value).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Giveaway Applications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" /> Giveaway Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {giveawayLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : !giveawayApps?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">No applications found. Click "Sync Giveaway" to fetch from ClickFunnels.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(giveawayApps as any[]).slice(0, 20).map((app: any) => (
                      <tr key={app.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-foreground">{app.firstName} {app.lastName}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{app.email}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className={`text-xs capitalize ${
                            app.status === "approved" ? "border-green-500/40 text-green-400" :
                            app.status === "rejected" ? "border-red-500/40 text-red-400" : ""
                          }`}>{app.status ?? "pending"}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(giveawayApps as any[]).length > 20 && <p className="text-xs text-muted-foreground text-center py-2">Showing 20 of {(giveawayApps as any[]).length}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Corporate Events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" /> Corporate Event Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {corpLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : !corporateCampaigns?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No corporate campaigns found</p>
            ) : (
              <div className="divide-y divide-border/50">
                {corporateCampaigns.map((c: any) => (
                  <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.startDate ? new Date(c.startDate).toLocaleDateString() : "No date"}</p>
                    </div>
                    <Badge variant={c.status === "active" ? "default" : "outline"} className="text-xs capitalize">{c.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
