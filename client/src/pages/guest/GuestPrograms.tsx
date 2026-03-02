// Guest version of Programs — uses trpc.guest.getCampaigns
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export default function GuestPrograms() {
  const { data: campaigns = [], isLoading } = trpc.guest.getCampaigns.useQuery();
  const programCampaigns = (campaigns as any[]).filter((c: any) =>
    c.category === "corporate_events" || c.type?.toLowerCase().includes("program") || c.type?.toLowerCase().includes("event")
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Programs</h1>
        <p className="text-muted-foreground text-sm mt-1">Golf programs, clinics, and events</p>
      </div>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar size={16} />
            Programs ({programCampaigns.length || (campaigns as any[]).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {((programCampaigns.length > 0 ? programCampaigns : (campaigns as any[])).slice(0, 20)).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.category?.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{c.status}</Badge>
                    <span className="text-xs text-green-400">${parseFloat(c.actualRevenue || "0").toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {(campaigns as any[]).length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">No programs found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
