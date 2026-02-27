import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Mail, MousePointer, Eye, Send, TrendingUp, Clock } from "lucide-react";

function fmtNum(n: number) {
  return n.toLocaleString("en-US");
}
function fmtPct(n: number | string | null | undefined) {
  const val = parseFloat(String(n || 0));
  return val.toFixed(1) + "%";
}
function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function statusColor(status: string) {
  switch (status) {
    case "sent": return "bg-green-500/10 text-green-400 border-green-500/20";
    case "scheduled": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "draft": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    case "paused": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
}

export default function EmailCampaigns() {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const { data: broadcasts, isLoading, refetch } = trpc.emailCampaigns.list.useQuery();
  const { data: summary } = trpc.emailCampaigns.summary.useQuery();
  const syncMutation = trpc.emailCampaigns.syncNow.useMutation({
    onSuccess: (result) => {
      toast({
        title: "Sync complete",
        description: `${result.synced} new, ${result.updated} updated from Encharge`,
      });
      refetch();
      setSyncing(false);
    },
    onError: (err) => {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
      setSyncing(false);
    },
  });

  const handleSync = () => {
    setSyncing(true);
    syncMutation.mutate();
  };

  const sentBroadcasts = broadcasts?.filter((b) => b.status === "sent") || [];
  const otherBroadcasts = broadcasts?.filter((b) => b.status !== "sent") || [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Email Campaigns</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Synced from Encharge · Auto-refreshes every 30 minutes
              {summary?.lastSyncedAt && (
                <span className="ml-2 text-zinc-600">
                  · Last sync: {new Date(summary.lastSyncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncing}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync Now"}
          </Button>
        </div>

        {/* Summary KPIs */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Send className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-400">Broadcasts Sent</span>
                </div>
                <div className="text-2xl font-bold text-white">{summary.sentBroadcasts}</div>
                <div className="text-xs text-zinc-600 mt-1">{summary.totalBroadcasts} total</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-400">Total Delivered</span>
                </div>
                <div className="text-2xl font-bold text-white">{fmtNum(summary.totalDelivered)}</div>
                <div className="text-xs text-zinc-600 mt-1">{fmtNum(summary.totalOpens)} opens</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-400">Avg Open Rate</span>
                </div>
                <div className="text-2xl font-bold text-yellow-400">{fmtPct(summary.avgOpenRate)}</div>
                <div className="text-xs text-zinc-600 mt-1">Industry avg ~20%</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MousePointer className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-400">Avg Click Rate</span>
                </div>
                <div className="text-2xl font-bold text-yellow-400">{fmtPct(summary.avgClickRate)}</div>
                <div className="text-xs text-zinc-600 mt-1">{fmtNum(summary.totalClicks)} total clicks</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sent Broadcasts Table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              Sent Broadcasts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-zinc-500 text-sm">Loading…</div>
            ) : sentBroadcasts.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-sm">No sent broadcasts yet. Click "Sync Now" to pull from Encharge.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Campaign</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Sent</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Delivered</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Opens</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Open Rate</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Clicks</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Click Rate</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">CTOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentBroadcasts
                      .sort((a, b) => new Date(b.sendAt || 0).getTime() - new Date(a.sendAt || 0).getTime())
                      .map((b) => (
                        <tr key={b.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{b.name}</div>
                            {b.subject && <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-xs">{b.subject}</div>}
                            {b.segmentName && (
                              <div className="text-xs text-zinc-600 mt-0.5">→ {b.segmentName}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{fmtDate(b.sendAt)}</td>
                          <td className="px-4 py-3 text-right text-white font-medium">{fmtNum(b.delivered || 0)}</td>
                          <td className="px-4 py-3 text-right text-zinc-300">{fmtNum(b.opens || 0)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${parseFloat(String(b.openRate || 0)) >= 20 ? "text-green-400" : parseFloat(String(b.openRate || 0)) >= 10 ? "text-yellow-400" : "text-zinc-400"}`}>
                              {fmtPct(b.openRate)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-300">{fmtNum(b.clicks || 0)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${parseFloat(String(b.clickRate || 0)) >= 2 ? "text-green-400" : "text-zinc-400"}`}>
                              {fmtPct(b.clickRate)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-400">{fmtPct(b.clickToOpenRate)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drafts / Scheduled */}
        {otherBroadcasts.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" />
                Drafts & Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-800">
                {otherBroadcasts.map((b) => (
                  <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{b.name}</div>
                      {b.subject && <div className="text-xs text-zinc-500 mt-0.5">{b.subject}</div>}
                    </div>
                    <div className="flex items-center gap-3">
                      {b.sendAt && <span className="text-xs text-zinc-500">{fmtDate(b.sendAt)}</span>}
                      <Badge variant="outline" className={`text-xs border ${statusColor(b.status)}`}>
                        {b.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
