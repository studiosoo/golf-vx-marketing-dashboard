// Guest version of DripCampaigns — uses trpc.guest.* public endpoints
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets } from "lucide-react";

export default function GuestDripCampaigns() {
  const { data: broadcasts = [], isLoading } = trpc.guest.getEmailCampaigns.useQuery();
  const { data: metrics } = trpc.guest.getEnchargeMetrics.useQuery();
  const { data: segments = [] } = trpc.guest.getEnchargeSegments.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Drip Campaigns</h1>
        <p className="text-muted-foreground text-sm mt-1">Automated email drip sequences</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Total Subscribers</p>
            <p className="text-xl font-bold">{metrics?.totalSubscribers?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Segments</p>
            <p className="text-xl font-bold">{(segments as any[]).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Broadcasts</p>
            <p className="text-xl font-bold">{(broadcasts as any[]).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets size={16} />
            Email Sequences ({(broadcasts as any[]).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />)}</div>
          ) : (broadcasts as any[]).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No drip campaigns found</p>
          ) : (
            <div className="space-y-2">
              {(broadcasts as any[]).slice(0, 20).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{b.name || b.subject || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">{b.sentAt ? new Date(b.sentAt).toLocaleDateString() : "—"}</p>
                  </div>
                  <Badge className={b.status === "sent" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-gray-500/20 text-gray-300 border-gray-500/30"}>
                    {b.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
