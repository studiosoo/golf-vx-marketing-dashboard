// Guest version of EmailCampaigns — uses trpc.guest.* public endpoints
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Lock } from "lucide-react";

export default function GuestEmailCampaigns() {
  const { data: broadcasts = [], isLoading } = trpc.guest.getEmailCampaigns.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">Encharge broadcast performance</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-1.5">
          <Lock size={11} />
          <span>Sync disabled in guest mode</span>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail size={16} />
            Broadcasts ({broadcasts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : broadcasts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No broadcasts found</p>
          ) : (
            <div className="space-y-2">
              {(broadcasts as any[]).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.name || b.subject || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">{b.sentAt ? new Date(b.sentAt).toLocaleDateString() : "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={b.status === "sent" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-gray-500/20 text-gray-300 border-gray-500/30"}>
                      {b.status}
                    </Badge>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Opens: {b.openRate ? `${parseFloat(b.openRate).toFixed(1)}%` : "—"}</p>
                      <p>Clicks: {b.clickRate ? `${parseFloat(b.clickRate).toFixed(1)}%` : "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
