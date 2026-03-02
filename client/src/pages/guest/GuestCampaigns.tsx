// Guest version of Campaigns — uses trpc.guest.getCampaigns public endpoint
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Lock } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-300 border-green-500/30",
  planned: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  completed: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  paused: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

export default function GuestCampaigns() {
  const { data: campaigns = [], isLoading } = trpc.guest.getCampaigns.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">Marketing campaign overview</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-1.5">
          <Lock size={11} />
          <span>Create/Edit disabled in guest mode</span>
        </div>
      </div>



      {/* Campaign list */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target size={16} />
            All Campaigns ({campaigns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No campaigns found</p>
          ) : (
            <div className="space-y-2">
              {campaigns.map((campaign: any) => (
                <div key={campaign.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {campaign.category?.replace(/_/g, " ")} · {campaign.type?.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs border ${statusColors[campaign.status] || ""}`}>
                      {campaign.status}
                    </Badge>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Budget: ${parseFloat(campaign.budget || "0").toLocaleString()}</p>
                      <p className="text-xs text-green-400">Revenue: ${parseFloat(campaign.actualRevenue || "0").toLocaleString()}</p>
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
