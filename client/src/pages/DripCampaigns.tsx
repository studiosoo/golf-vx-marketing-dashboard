import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, TrendingUp } from "lucide-react";

export default function DripCampaigns() {
  const { data: metrics } = trpc.encharge.getMetrics.useQuery();
  const { data: segments } = trpc.encharge.getSegments.useQuery();
  const { data: broadcasts } = trpc.emailCampaigns.list.useQuery();

  const dripSequences = [
    { id: 1, name: "New Member Onboarding", emails: 5, openRate: 42, clickRate: 18, status: "active" },
    { id: 2, name: "Trial Conversion Sequence", emails: 7, openRate: 38, clickRate: 22, status: "active" },
    { id: 3, name: "Win-Back Sequence", emails: 4, openRate: 28, clickRate: 12, status: "active" },
    { id: 4, name: "Seasonal Promotion", emails: 3, openRate: 35, clickRate: 15, status: "paused" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Drip Campaigns</h1>
        <p className="text-muted-foreground text-sm mt-1">Email sequences and drip campaigns</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{(metrics as any)?.totalSubscribers || 0}</div>
            <div className="text-xs text-muted-foreground">Total Subscribers</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">{(broadcasts as any[])?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Broadcasts Sent</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{dripSequences.filter(s => s.status === "active").length}</div>
            <div className="text-xs text-muted-foreground">Active Sequences</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {dripSequences.map((seq) => (
          <Card key={seq.id} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-foreground">{seq.name}</div>
                  <div className="text-xs text-muted-foreground">{seq.emails} emails in sequence</div>
                </div>
                <Badge
                  className={seq.status === "active"
                    ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                    : "bg-muted text-muted-foreground text-xs"}
                >
                  {seq.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-lg font-bold text-foreground">{seq.openRate}%</div>
                  <div className="text-xs text-muted-foreground">Open Rate</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{seq.clickRate}%</div>
                  <div className="text-xs text-muted-foreground">Click Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
