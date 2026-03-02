// Guest version of PrivateEvents — uses trpc.guest.getCampaignsByCategory
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export default function GuestPrivateEvents() {
  const { data: campaigns = [], isLoading } = trpc.guest.getCampaignsByCategory.useQuery({ category: "corporate_events" });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Private Events</h1>
        <p className="text-muted-foreground text-sm mt-1">Corporate and private event bookings</p>
      </div>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar size={16} />
            Private Events ({(campaigns as any[]).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />)}</div>
          ) : (campaigns as any[]).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No private events found</p>
          ) : (
            <div className="space-y-2">
              {(campaigns as any[]).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.startDate ? new Date(c.startDate).toLocaleDateString() : "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">{c.status}</Badge>
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
