// Guest version of NewsManager — uses trpc.guest.getCampaigns (news/announcements)
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper } from "lucide-react";

export default function GuestNewsManager() {
  const { data: campaigns = [], isLoading } = trpc.guest.getCampaigns.useQuery();
  const newsCampaigns = (campaigns as any[]).filter((c: any) =>
    c.type?.toLowerCase().includes("news") || c.type?.toLowerCase().includes("announcement") || c.name?.toLowerCase().includes("news")
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">News Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">News and announcement campaigns</p>
      </div>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper size={16} />
            News Campaigns ({newsCampaigns.length || (campaigns as any[]).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {((newsCampaigns.length > 0 ? newsCampaigns : (campaigns as any[])).slice(0, 20)).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.type?.replace(/_/g, " ")}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{c.status}</span>
                </div>
              ))}
              {(campaigns as any[]).length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">No news campaigns found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
