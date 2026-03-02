// Guest version of MetaAds — uses trpc.guest.getMetaAdsCampaigns public endpoint
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export default function GuestMetaAds() {
  const { data: campaigns = [], isLoading } = trpc.guest.getMetaAdsCampaigns.useQuery({ datePreset: "last_30d" });

  const totalSpend = campaigns.reduce((s: number, c: any) => s + parseFloat(c.insights?.spend || "0"), 0);
  const totalImpressions = campaigns.reduce((s: number, c: any) => s + parseInt(c.insights?.impressions || "0"), 0);
  const totalClicks = campaigns.reduce((s: number, c: any) => s + parseInt(c.insights?.clicks || "0"), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meta Ads</h1>
        <p className="text-muted-foreground text-sm mt-1">Facebook & Instagram advertising performance</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Total Spend (30d)</p>
            <p className="text-xl font-bold">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Impressions</p>
            <p className="text-xl font-bold">{totalImpressions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Clicks</p>
            <p className="text-xl font-bold">{totalClicks.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap size={16} />
            Campaigns ({campaigns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No campaign data available</p>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.objective}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={c.status === "ACTIVE" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-gray-500/20 text-gray-300 border-gray-500/30"}>
                      {c.status}
                    </Badge>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Spend: ${parseFloat(c.insights?.spend || "0").toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">CTR: {parseFloat(c.insights?.ctr || "0").toFixed(2)}%</p>
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
