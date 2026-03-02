// Guest version of Leagues — uses trpc.guest.getCampaignsByCategory
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

export default function GuestLeagues() {
  const { data: campaigns = [], isLoading } = trpc.guest.getCampaigns.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leagues</h1>
        <p className="text-muted-foreground text-sm mt-1">Golf league programs and events</p>
      </div>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy size={16} />
            League Campaigns ({(campaigns as any[]).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />)}</div>
          ) : (campaigns as any[]).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No league campaigns found</p>
          ) : (
            <div className="space-y-2">
              {(campaigns as any[]).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <p className="text-sm font-medium">{c.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">{c.status}</Badge>
                    <span className="text-xs text-green-400">${parseFloat(c.actualRevenue || "0").toLocaleString()}</span>
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
