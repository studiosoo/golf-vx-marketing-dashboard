// Guest version of Integrations — uses trpc.autonomous.getSyncStatus (public)
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, CheckCircle, XCircle } from "lucide-react";

export default function GuestIntegrations() {
  const { data: syncStatus } = trpc.autonomous.getSyncStatus.useQuery();

  const integrations = [
    { name: "Meta Ads", key: "metaAds", description: "Facebook & Instagram advertising" },
    { name: "Encharge", key: "encharge", description: "Email automation platform" },
    { name: "ClickFunnels", key: "clickfunnels", description: "Lead capture funnels" },
    { name: "Acuity Scheduling", key: "acuity", description: "Booking and scheduling" },
    { name: "Toast POS", key: "toast", description: "Point of sale system" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-muted-foreground text-sm mt-1">Connected data sources and services</p>
      </div>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings size={16} />
            Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {integrations.map((integration) => {
              const status = (syncStatus as any)?.[integration.key];
              const isConnected = status?.status === "ok" || status?.lastSync;
              return (
                <div key={integration.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : (
                      <XCircle size={16} className="text-muted-foreground" />
                    )}
                    <Badge className={isConnected ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-gray-500/20 text-gray-300 border-gray-500/30"}>
                      {isConnected ? "Connected" : "Unknown"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
