import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Check, TrendingUp, Zap, Info, ChevronDown, ChevronUp } from "lucide-react";
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
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  if (isLoading || !alerts || alerts.length === 0) {
    return null;
  }

  const visible = alerts.filter((a: any) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const getSeverityStyle = (severity: string): { border: string; badge: string; icon: React.ReactNode } => {
    switch (severity) {
      case "critical":
        return {
          border: "border-l-[#E8453C]",
          badge: "bg-[#E8453C]/10 text-[#E8453C] border-[#E8453C]/30",
          icon: <AlertTriangle className="h-4 w-4 text-[#E8453C]" />,
        };
      case "high":
        return {
          border: "border-l-orange-500",
          badge: "bg-orange-100 text-orange-700 border-orange-300",
          icon: <AlertTriangle className="h-4 w-4 text-[#F5C72C]" />,
        };
      case "medium":
        return {
          border: "border-l-[#F5C72C]",
          badge: "bg-yellow-100 text-yellow-700 border-yellow-300",
          icon: <Info className="h-4 w-4 text-yellow-500" />,
        };
      case "opportunity":
        return {
          border: "border-l-[#3DB855]",
          badge: "bg-[#3DB855]/10 text-[#3DB855] border-[#3DB855]/30",
          icon: <TrendingUp className="h-4 w-4 text-[#3DB855]" />,
        };
      default:
        return {
          border: "border-l-border",
          badge: "bg-muted text-muted-foreground border-border",
          icon: <Info className="h-4 w-4 text-muted-foreground" />,
        };
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "critical": return "CRITICAL";
      case "high": return "WARNING";
      case "medium": return "NOTICE";
      case "opportunity": return "OPPORTUNITY";
      default: return severity.toUpperCase();
    }
  };

  return (
    <div className="space-y-2">
      {visible.map((alert: any) => {
        const style = getSeverityStyle(alert.severity);
        const isExpanded = expandedAlertId === alert.id;
        return (
          <Card key={alert.id} className={`border-l-4 ${style.border}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">{style.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className={`text-xs font-semibold ${style.badge}`}>
                        {getSeverityLabel(alert.severity)}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">{alert.campaignName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">{alert.message}</p>
                    {isExpanded && (
                      <div className="mt-3 space-y-2">
                        {alert.action && (
                          <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                            <Zap className="h-4 w-4 text-[#F5C72C] mt-0.5 shrink-0" />
                            <div>
                              <span className="text-xs font-semibold text-foreground">Recommended Action: </span>
                              <span className="text-xs text-muted-foreground">{alert.action}</span>
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div><span className="font-medium">Threshold:</span> {alert.threshold}</div>
                          <div><span className="font-medium">Actual:</span> {alert.actualValue}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => acknowledgeMutation.mutate({ alertId: alert.id })}
                    disabled={acknowledgeMutation.isPending}
                    title="Acknowledge"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setDismissed(prev => { const next = new Set(prev); next.add(alert.id); return next; })}
                    title="Dismiss"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
