import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, Clock, TrendingUp, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function AnnualGiveawayActions() {
  const { data: actionPlan, isLoading, refetch } = trpc.dailyActions.getTodayPlan.useQuery({
    campaignId: "annual-giveaway-2026",
  });

  const completeMutation = trpc.dailyActions.completeAction.useMutation({
    onSuccess: () => refetch(),
  });

  const skipMutation = trpc.dailyActions.skipAction.useMutation({
    onSuccess: () => refetch(),
  });

  const generateMutation = trpc.dailyActions.generatePlan.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
    );
  }

  if (!actionPlan) {
    return (
        <div className="container py-8">
          <Card>
            <CardHeader>
              <CardTitle>No Action Plan for Today</CardTitle>
              <CardDescription>
                Generate today's AI-powered action plan for the Annual Giveaway campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => generateMutation.mutate({ campaignId: "annual-giveaway-2026" })}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? "Generating..." : "Generate Today's Plan"}
              </Button>
            </CardContent>
          </Card>
        </div>
    );
  }

  const plan = actionPlan;
  const actions = actionPlan.actions;
  const pendingActions = actions.filter((a: any) => a.status === "pending");
  const completedActions = actions.filter((a: any) => a.status === "completed");
  const urgentActions = actions.filter((a: any) => a.priority === "urgent" && a.status === "pending");

  const priorityColors = {
    urgent: "destructive",
    high: "default",
    medium: "secondary",
    low: "outline",
  } as const;

  const priorityIcons = {
    urgent: AlertCircle,
    high: TrendingUp,
    medium: Clock,
    low: CheckCircle2,
  };

  const typeLabels = {
    meta_ads: "Meta Ads",
    content: "Content Creation",
    boost: "Boost Strategy",
    email: "Email Marketing",
    conversion: "Conversion Optimization",
  };

  return (
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Annual Giveaway - Today's Action Plan</h1>
          <p className="text-muted-foreground mt-2">
            Generated: {new Date(plan.generatedAt).toLocaleString()}
          </p>
        </div>

        {/* Summary Banner */}
        <Card className={urgentActions.length > 0 ? "border-destructive" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {urgentActions.length > 0 && (
                    <>
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      {urgentActions.length} urgent action{urgentActions.length > 1 ? "s" : ""} required
                    </>
                  )}
                  {urgentActions.length === 0 && (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      All urgent actions completed
                    </>
                  )}
                </CardTitle>
                <CardDescription className="mt-2">
                  {pendingActions.length} pending | {completedActions.length} completed | Est. time:{" "}
                  {actions
                    .filter((a: any) => a.status === "pending")
                    .reduce((sum: number, a: any) => {
                      const match = a.effortRequired.match(/(\d+)/);
                      return sum + (match ? parseInt(match[1]) : 0);
                    }, 0)}{" "}
                  minutes
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateMutation.mutate({ campaignId: "annual-giveaway-2026" })}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? "Regenerating..." : "Regenerate Plan"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">AI Analysis:</p>
              <p className="text-sm text-muted-foreground">{plan.aiAnalysis}</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="space-y-4">
          {actions.map((action: any) => {
            const PriorityIcon = priorityIcons[action.priority as keyof typeof priorityIcons];
            const isCompleted = action.status === "completed";
            const isSkipped = action.status === "skipped";

            return (
              <Card
                key={action.id}
                className={`${isCompleted ? "opacity-60" : ""} ${isSkipped ? "opacity-40" : ""}`}
              >
                <Collapsible>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={isCompleted}
                          disabled={isCompleted || isSkipped}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              completeMutation.mutate({ actionId: action.id });
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={priorityColors[action.priority as keyof typeof priorityColors]}>
                              <PriorityIcon className="h-3 w-3 mr-1" />
                              {action.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{typeLabels[action.type as keyof typeof typeLabels]}</Badge>
                            <span className="text-xs text-muted-foreground">{action.effortRequired}</span>
                            {isCompleted && (
                              <Badge variant="outline" className="bg-green-50">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                            {isSkipped && (
                              <Badge variant="outline" className="bg-gray-50">
                                <X className="h-3 w-3 mr-1" />
                                Skipped
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="mt-2 text-lg">{action.title}</CardTitle>
                          <CardDescription className="mt-1">{action.description}</CardDescription>
                          {action.expectedImpact && (
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-muted-foreground">Expected: {action.expectedImpact}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Execution Data Preview */}
                        {action.executionData && (
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-xs font-medium mb-2">Execution Details:</p>
                            <pre className="text-xs text-muted-foreground overflow-x-auto">
                              {JSON.stringify(action.executionData, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {!isCompleted && !isSkipped && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => completeMutation.mutate({ actionId: action.id })}
                              disabled={completeMutation.isPending}
                            >
                              {completeMutation.isPending ? "Executing..." : "Execute Now"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => skipMutation.mutate({ actionId: action.id })}
                              disabled={skipMutation.isPending}
                            >
                              Skip
                            </Button>
                            <Button variant="ghost" size="sm">
                              Modify
                            </Button>
                          </div>
                        )}

                        {/* Result */}
                        {action.result && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs font-medium mb-1">Result:</p>
                            <p className="text-sm text-muted-foreground">{action.result}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </div>
  );
}
