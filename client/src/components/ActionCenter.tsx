import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Lightbulb, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface ActionItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface Alert {
  id: number;
  campaignName: string;
  priority: "urgent" | "high" | "medium" | "low";
  type: "performance_issue" | "opportunity" | "recommendation";
  title: string;
  description: string;
  impact: string;
  actionItems: ActionItem[];
  dismissed: boolean;
  createdAt: Date;
}

const priorityConfig = {
  urgent: {
    label: "URGENT",
    color: "bg-[#E8453C] text-white",
    icon: AlertTriangle,
    borderColor: "border-[#E8453C]",
  },
  high: {
    label: "HIGH PRIORITY",
    color: "bg-orange-500 text-white",
    icon: TrendingUp,
    borderColor: "border-orange-500",
  },
  medium: {
    label: "MEDIUM",
    color: "bg-yellow-500 text-white",
    icon: Lightbulb,
    borderColor: "border-yellow-500",
  },
  low: {
    label: "LOW",
    color: "bg-[#888888]/100 text-white",
    icon: Lightbulb,
    borderColor: "border-blue-500",
  },
};

export function ActionCenter() {
  const { data: dbAlerts, isLoading } = trpc.intelligence.getAlerts.useQuery();
  const markCompleteMutation = trpc.intelligence.markActionComplete.useMutation();
  const dismissMutation = trpc.intelligence.dismissAlert.useMutation();
  const utils = trpc.useUtils();

  // Transform database alerts to UI format
  const mockAlerts: Alert[] = (dbAlerts || []).map(rec => {
    const data = typeof rec.data === 'string' ? JSON.parse(rec.data) : rec.data;
    return {
      id: rec.id,
      campaignName: data.campaignName || "Unknown Campaign",
      priority: rec.priority === "high" ? "urgent" : rec.priority as "high" | "medium" | "low",
      type: rec.type === "performance_alert" ? "performance_issue" : "recommendation",
      title: rec.title,
      description: rec.description,
      impact: data.impact || "",
      actionItems: data.actionItems || [],
      dismissed: rec.status === "rejected",
      createdAt: new Date(rec.createdAt),
    };
  });

  // Fallback to hardcoded alert if no DB alerts exist
  const hardcodedAlerts: Alert[] = mockAlerts.length === 0 ? [
    {
      id: 1,
      campaignName: "Junior Golf Summer Camp 2026",
      priority: "urgent",
      type: "performance_issue",
      title: "Optimize Campaign for Lead Building - Reduce Budget",
      description: "Spent $224.56 for only 1 registration, but generated 587 quality leads. Current $7-8/day spend is too high for lead-building phase. Landing page needs optimization (0.17% conversion vs 2-5% industry standard).",
      impact: "Reduce budget to $3-5/day to build 200-300 more leads by May at $1-2/lead. Fix landing page to convert existing 587 leads (expected: 30-60 registrations at $0 cost). Total potential profit: $33,000-66,000.",
      actionItems: [
        {
          id: "reduce-budget",
          title: "Reduce Meta Ads daily budget to $3-5",
          description: "Lower spend while continuing to build lead list. Keep pixel warm for retargeting.",
          completed: false,
        },
        {
          id: "fix-landing-page",
          title: "Fix landing page conversion issues",
          description: "Add clear pricing, testimonials, photos, and simplify registration",
          completed: false,
        },
        {
          id: "email-nurture",
          title: "Set up email nurture sequence for 587 leads",
          description: "Create 3-email sequence in Encharge to convert existing traffic (expected: 30-60 registrations at $0 cost)",
          completed: false,
        },
        {
          id: "schedule-relaunch",
          title: "Schedule campaign relaunch for March 15",
          description: "Set calendar reminder to resume with optimized targeting and creative",
          completed: false,
        },
      ],
      dismissed: false,
      createdAt: new Date(),
    },
  ] : mockAlerts;

  const [alerts, setAlerts] = useState<Alert[]>(hardcodedAlerts);

  // Update alerts when DB data loads
  if (!isLoading && mockAlerts.length > 0 && alerts !== mockAlerts) {
    setAlerts(mockAlerts);
  }
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set([1])); // First alert expanded by default

  const toggleAlert = (alertId: number) => {
    setExpandedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(alertId)) {
        next.delete(alertId);
      } else {
        next.add(alertId);
      }
      return next;
    });
  };

  const toggleActionItem = async (alertId: number, actionId: string) => {
    // Optimistic update
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? {
              ...alert,
              actionItems: alert.actionItems.map(item =>
                item.id === actionId ? { ...item, completed: !item.completed } : item
              ),
            }
          : alert
      )
    );

    // Only persist to database if this is a real DB alert (not hardcoded fallback)
    const isDbAlert = dbAlerts && dbAlerts.some(a => a.id === alertId);
    if (!isDbAlert) {
      // This is a hardcoded fallback alert, just update local state
      return;
    }

    // Persist to database
    try {
      const alert = alerts.find(a => a.id === alertId);
      const item = alert?.actionItems.find(i => i.id === actionId);
      if (item) {
        await markCompleteMutation.mutateAsync({
          recommendationId: alertId,
          actionId,
          completed: !item.completed,
        });
        utils.intelligence.getAlerts.invalidate();
      }
    } catch (error) {
      console.error('Failed to update action:', error);
      // Revert optimistic update on error
      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? {
                ...alert,
                actionItems: alert.actionItems.map(item =>
                  item.id === actionId ? { ...item, completed: !item.completed } : item
                ),
              }
            : alert
        )
      );
    }
  };

  const dismissAlert = async (alertId: number) => {
    // Optimistic update
    setAlerts(prev =>
      prev.map(alert => (alert.id === alertId ? { ...alert, dismissed: true } : alert))
    );

    // Only persist to database if this is a real DB alert (not hardcoded fallback)
    const isDbAlert = dbAlerts && dbAlerts.some(a => a.id === alertId);
    if (!isDbAlert) {
      // This is a hardcoded fallback alert, just update local state
      return;
    }

    // Persist to database
    try {
      await dismissMutation.mutateAsync({ recommendationId: alertId });
      utils.intelligence.getAlerts.invalidate();
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      // Revert optimistic update on error
      setAlerts(prev =>
        prev.map(alert => (alert.id === alertId ? { ...alert, dismissed: false } : alert))
      );
    }
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const urgentCount = activeAlerts.filter(a => a.priority === "urgent").length;
  const highCount = activeAlerts.filter(a => a.priority === "high").length;

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      {(urgentCount > 0 || highCount > 0) && (
        <div className="bg-[#FFF5F5] dark:bg-[#E8453C]/10 border-l-4 border-[#E8453C] p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-[#E8453C]" />
            <p className="font-semibold text-red-900 dark:text-red-100">
              {urgentCount > 0 && `${urgentCount} urgent action${urgentCount > 1 ? 's' : ''} required`}
              {urgentCount > 0 && highCount > 0 && " • "}
              {highCount > 0 && `${highCount} high priority item${highCount > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      )}

      {/* Alert Cards */}
      {activeAlerts.map(alert => {
        const config = priorityConfig[alert.priority];
        const Icon = config.icon;
        const isExpanded = expandedAlerts.has(alert.id);
        const completedCount = alert.actionItems.filter(item => item.completed).length;
        const totalCount = alert.actionItems.length;
        const allCompleted = completedCount === totalCount;

        return (
          <Card key={alert.id} className={`border-l-4 ${config.borderColor}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={config.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{alert.campaignName}</span>
                    {allCompleted && (
                      <Badge variant="outline" className="bg-green-50 text-[#72B84A] border-green-200">
                        ✓ All actions completed
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{alert.title}</CardTitle>
                  <CardDescription className="text-base">{alert.description}</CardDescription>
                  {alert.impact && (
                    <div className="bg-[#888888]/10 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-2">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        💡 {alert.impact}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAlert(alert.id)}
                    className="h-8 w-8 p-0"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  {allCompleted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-sm">Action Items</h4>
                    <span className="text-sm text-muted-foreground">
                      {completedCount} of {totalCount} completed
                    </span>
                  </div>

                  {alert.actionItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        item.completed
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                          : "bg-background border-border"
                      }`}
                    >
                      <Checkbox
                        id={`${alert.id}-${item.id}`}
                        checked={item.completed}
                        onCheckedChange={() => toggleActionItem(alert.id, item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={`${alert.id}-${item.id}`}
                          className={`font-medium cursor-pointer ${
                            item.completed ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {index + 1}. {item.title}
                        </label>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}

                  {allCompleted && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        ✓ Great work! All actions completed. Click the X button above to dismiss this alert.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
