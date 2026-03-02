// Guest version of Announcements — uses trpc.guest.getCampaigns to show announcement-type campaigns
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone } from "lucide-react";

export default function GuestAnnouncements() {
  const { data: campaigns = [], isLoading } = trpc.guest.getCampaigns.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
        <p className="text-muted-foreground text-sm mt-1">Member announcements and communications</p>
      </div>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone size={16} />
            Recent Campaigns ({(campaigns as any[]).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />)}</div>
          ) : (campaigns as any[]).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No announcements found</p>
          ) : (
            <div className="space-y-2">
              {(campaigns as any[]).slice(0, 15).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.type?.replace(/_/g, " ")}</p>
                  </div>
                  <Badge className={c.status === "active" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-gray-500/20 text-gray-300 border-gray-500/30"}>
                    {c.status}
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
