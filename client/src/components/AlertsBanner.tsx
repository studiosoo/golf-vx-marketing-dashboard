import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Check } from "lucide-react";
import { useState } from "react";

export default function AlertsBanner() {
  const { data: alerts, isLoading, refetch } = trpc.metaAds.getActiveAlerts.useQuery();
  const acknowledgeMutation = trpc.metaAds.acknowledgeAlert.useMutation({
    onSuccess: () => refetch(),
  });
  const resolveMutation = trpc.metaAds.resolveAlert.useMutation({
    onSuccess: () => refetch(),
  });

  const [expandedAlertId, setExpandedAlertId] = useState<number | null>(null);

  if (isLoading || !alerts || alerts.length === 0) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getSeverityIcon = (severity: string) => {
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert: any) => (
        <Card key={alert.id} className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getSeverityColor(alert.severity) as any}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">{alert.campaignName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  {expandedAlertId === alert.id && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <div>Threshold: {alert.threshold}</div>
                      <div>Actual: {alert.actualValue}</div>
                      <div>Created: {new Date(alert.createdAt).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedAlertId(expandedAlertId === alert.id ? null : alert.id)}
                >
                  {expandedAlertId === alert.id ? "Less" : "More"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => acknowledgeMutation.mutate({ alertId: alert.id })}
                  disabled={acknowledgeMutation.isPending}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resolveMutation.mutate({ alertId: alert.id })}
                  disabled={resolveMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
