import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  RotateCcw,
  Target,
  TrendingDown,
  TrendingUp,
  Undo2,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Helper Components ───────────────────────────────────────────────────────

function RiskBadge({ level }: { level: string }) {
  const config: Record<string, { label: string; className: string }> = {
    low: { label: "Low Risk", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    medium: { label: "Medium Risk", className: "bg-amber-100 text-amber-700 border-amber-200" },
    high: { label: "High Risk", className: "bg-red-100 text-red-700 border-red-200" },
    monitor: { label: "Monitor", className: "bg-blue-100 text-blue-700 border-blue-200" },
  };
  const c = config[level] || config.monitor;
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    auto_executed: { label: "Auto-Executed", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <Zap className="h-3 w-3" /> },
    pending_approval: { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
    approved: { label: "Approved", className: "bg-green-100 text-green-700 border-green-200", icon: <Check className="h-3 w-3" /> },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200", icon: <X className="h-3 w-3" /> },
    undone: { label: "Undone", className: "bg-gray-100 text-gray-700 border-gray-200", icon: <Undo2 className="h-3 w-3" /> },
    monitoring: { label: "Monitoring", className: "bg-blue-100 text-blue-700 border-blue-200", icon: <Eye className="h-3 w-3" /> },
    expired: { label: "Expired", className: "bg-gray-100 text-gray-500 border-gray-200", icon: <Clock className="h-3 w-3" /> },
  };
  const c = config[status] || { label: status, className: "bg-gray-100 text-gray-700", icon: null };
  return (
    <Badge variant="outline" className={`${c.className} flex items-center gap-1`}>
      {c.icon}
      {c.label}
    </Badge>
  );
}

function ActionTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    budget_adjustment: <ArrowDown className="h-4 w-4" />,
    targeting_change: <Target className="h-4 w-4" />,
    alert: <AlertTriangle className="h-4 w-4" />,
    pause: <Activity className="h-4 w-4" />,
    email: <Brain className="h-4 w-4" />,
    creative_refresh: <RefreshCw className="h-4 w-4" />,
  };
  return <>{icons[type] || <Activity className="h-4 w-4" />}</>;
}

function MetricPill({ label, value, trend }: { label: string; value: string; trend?: "up" | "down" | "neutral" }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
      {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
      {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
    </div>
  );
}

// ─── Action Card Component ───────────────────────────────────────────────────

interface ActionCardProps {
  action: {
    id: number;
    campaignName: string | null;
    actionType: string;
    riskLevel: string;
    status: string;
    title: string;
    description: string | null;
    recommendation: string | null;
    confidence: number | null;
    impactEstimate: string | null;
    campaignMetrics: unknown;
    createdAt: Date;
    expiresAt: Date | null;
  };
  showApprovalButtons?: boolean;
  showUndoButton?: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onUndo?: (id: number) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

function ActionCard({
  action,
  showApprovalButtons,
  showUndoButton,
  onApprove,
  onReject,
  onUndo,
  isApproving,
  isRejecting,
}: ActionCardProps) {
  const metrics = action.campaignMetrics as Record<string, number> | null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <ActionTypeIcon type={action.actionType} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold leading-tight">
                {action.title}
              </CardTitle>
              {action.campaignName && (
                <CardDescription className="text-xs mt-0.5 truncate">
                  {action.campaignName}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <RiskBadge level={action.riskLevel} />
            <StatusBadge status={action.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {action.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {action.description}
          </p>
        )}

        {action.recommendation && (
          <div className="rounded-md bg-muted/50 p-3 border border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Recommendation
            </p>
            <p className="text-sm">{action.recommendation}</p>
          </div>
        )}

        {/* Campaign Metrics */}
        {metrics && Object.keys(metrics).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {metrics.spend !== undefined && (
              <MetricPill label="Spend" value={`$${Number(metrics.spend).toFixed(2)}`} />
            )}
            {metrics.ctr !== undefined && (
              <MetricPill
                label="CTR"
                value={`${Number(metrics.ctr).toFixed(2)}%`}
                trend={Number(metrics.ctr) >= 1.5 ? "up" : Number(metrics.ctr) < 1 ? "down" : "neutral"}
              />
            )}
            {metrics.cpc !== undefined && (
              <MetricPill label="CPC" value={`$${Number(metrics.cpc).toFixed(2)}`} />
            )}
            {metrics.conversions !== undefined && (
              <MetricPill label="Conv." value={String(metrics.conversions)} />
            )}
            {metrics.costPerConversion !== undefined && metrics.costPerConversion > 0 && (
              <MetricPill
                label="CPA"
                value={`$${Number(metrics.costPerConversion).toFixed(2)}`}
                trend={Number(metrics.costPerConversion) <= 25 ? "up" : "down"}
              />
            )}
            {metrics.roas !== undefined && metrics.roas > 0 && (
              <MetricPill
                label="ROAS"
                value={`${Number(metrics.roas).toFixed(2)}x`}
                trend={Number(metrics.roas) >= 2 ? "up" : "down"}
              />
            )}
          </div>
        )}

        {/* Confidence & Impact */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {action.confidence !== null && (
            <span className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              Confidence: {action.confidence}%
            </span>
          )}
          {action.impactEstimate && (
            <span className="flex items-center gap-1">
              {action.impactEstimate === "high" ? (
                <ArrowUp className="h-3 w-3 text-red-500" />
              ) : action.impactEstimate === "medium" ? (
                <ArrowUp className="h-3 w-3 text-amber-500" />
              ) : (
                <ArrowDown className="h-3 w-3 text-blue-500" />
              )}
              Impact: {action.impactEstimate}
            </span>
          )}
          <span>
            {new Date(action.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {action.expiresAt && (
            <span className="text-amber-600">
              Expires:{" "}
              {new Date(action.expiresAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        {showApprovalButtons && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => onApprove?.(action.id)}
              disabled={isApproving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isApproving ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject?.(action.id)}
              disabled={isRejecting}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {isRejecting ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <X className="mr-1 h-3 w-3" />
              )}
              Reject
            </Button>
          </div>
        )}

        {showUndoButton && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUndo?.(action.id)}
            className="text-muted-foreground"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Undo Action
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function MarketingIntelligence() {
  const [undoDialogId, setUndoDialogId] = useState<number | null>(null);
  const [undoReason, setUndoReason] = useState("");
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const syncStatus = trpc.autonomous.getSyncStatus.useQuery();
  const autoExecuted = trpc.autonomous.getAutoExecutedActions.useQuery();
  const approvalCards = trpc.autonomous.getApprovalCards.useQuery();
  const monitoringItems = trpc.autonomous.getMonitoringItems.useQuery();

  const syncMutation = trpc.autonomous.syncAllData.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Sync complete: ${data.campaignsProcessed} campaigns, ${data.actionsGenerated} actions generated`
      );
      utils.autonomous.invalidate();
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  const approveMutation = trpc.autonomous.approveAction.useMutation({
    onSuccess: () => {
      toast.success("Action approved successfully");
      setApprovingId(null);
      utils.autonomous.invalidate();
    },
    onError: (error) => {
      toast.error(`Approval failed: ${error.message}`);
      setApprovingId(null);
    },
  });

  const rejectMutation = trpc.autonomous.rejectAction.useMutation({
    onSuccess: () => {
      toast.success("Action rejected");
      setRejectingId(null);
      utils.autonomous.invalidate();
    },
    onError: (error) => {
      toast.error(`Rejection failed: ${error.message}`);
      setRejectingId(null);
    },
  });

  const undoMutation = trpc.autonomous.undoAction.useMutation({
    onSuccess: () => {
      toast.success("Action undone successfully");
      setUndoDialogId(null);
      setUndoReason("");
      utils.autonomous.invalidate();
    },
    onError: (error) => {
      toast.error(`Undo failed: ${error.message}`);
    },
  });

  const handleApprove = (id: number) => {
    setApprovingId(id);
    approveMutation.mutate({ actionId: id });
  };

  const handleReject = (id: number) => {
    setRejectingId(id);
    rejectMutation.mutate({ actionId: id });
  };

  const handleUndo = (id: number) => {
    setUndoDialogId(id);
  };

  const confirmUndo = () => {
    if (undoDialogId && undoReason.trim()) {
      undoMutation.mutate({ actionId: undoDialogId, reason: undoReason.trim() });
    }
  };

  const latest = syncStatus.data?.latest;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-yellow-500" />
              <h1 className="text-2xl font-bold tracking-tight">
                Marketing Intelligence
              </h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Autonomous decision engine for Meta Ads campaign optimization
            </p>
          </div>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="bg-yellow-500 text-black hover:bg-yellow-400"
          >
            {syncMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {syncMutation.isPending ? "Syncing..." : "Sync Now"}
          </Button>
        </div>

        {/* Sync Status */}
        {latest && (
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  <Activity
                    className={`h-4 w-4 ${
                      latest.status === "running"
                        ? "text-yellow-500 animate-pulse"
                        : latest.status === "completed"
                          ? "text-emerald-500"
                          : "text-red-500"
                    }`}
                  />
                  <span className="font-medium">
                    {latest.status === "running"
                      ? "Sync in progress..."
                      : latest.status === "completed"
                        ? "Last sync completed"
                        : "Last sync failed"}
                  </span>
                  {latest.completedAt && (
                    <span className="text-muted-foreground">
                      {new Date(latest.completedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{latest.campaignsProcessed} campaigns</span>
                  <span>{latest.actionsGenerated} actions</span>
                  <span>{latest.actionsAutoExecuted} auto-executed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Three Section Tabs */}
        <Tabs defaultValue="auto-executed" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auto-executed" className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Auto-Executed
              {(autoExecuted.data?.count ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {autoExecuted.data?.count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approval" className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Awaiting Approval
              {(approvalCards.data?.count ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] bg-amber-100 text-amber-700">
                  {approvalCards.data?.count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Monitoring
              {(monitoringItems.data?.count ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {monitoringItems.data?.count}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Auto-Executed Section */}
          <TabsContent value="auto-executed" className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>
                These low-risk actions were automatically applied by the engine.
              </span>
            </div>
            {autoExecuted.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (autoExecuted.data?.actions?.length ?? 0) === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Zap className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No auto-executed actions yet. Run a sync to analyze campaigns.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {autoExecuted.data?.actions.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    showUndoButton
                    onUndo={handleUndo}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Awaiting Approval Section */}
          <TabsContent value="approval" className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>
                These medium/high-risk actions require your explicit approval before execution.
              </span>
            </div>
            {approvalCards.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (approvalCards.data?.actions?.length ?? 0) === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No actions awaiting approval. All clear!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {approvalCards.data?.actions.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    showApprovalButtons
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isApproving={approvingId === action.id}
                    isRejecting={rejectingId === action.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Monitoring Section */}
          <TabsContent value="monitoring" className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4 text-blue-500" />
              <span>
                These campaigns are being monitored. Actions will be generated once sufficient data is available.
              </span>
            </div>
            {monitoringItems.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (monitoringItems.data?.actions?.length ?? 0) === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Eye className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No campaigns currently in monitoring. Run a sync to start tracking.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {monitoringItems.data?.actions.map((action) => (
                  <ActionCard key={action.id} action={action} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Sync History */}
        {syncStatus.data?.history && syncStatus.data.history.length > 1 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-3">Recent Sync History</h3>
              <div className="space-y-2">
                {syncStatus.data.history.map((sync) => (
                  <div
                    key={sync.id}
                    className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          sync.status === "completed"
                            ? "bg-emerald-500"
                            : sync.status === "running"
                              ? "bg-yellow-500 animate-pulse"
                              : "bg-red-500"
                        }`}
                      />
                      <span>{sync.platform}</span>
                      <span>—</span>
                      <span>{sync.campaignsProcessed} campaigns</span>
                      <span>—</span>
                      <span>{sync.actionsGenerated} actions</span>
                    </div>
                    <span>
                      {new Date(sync.startedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Undo Dialog */}
      <Dialog open={undoDialogId !== null} onOpenChange={() => { setUndoDialogId(null); setUndoReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undo Action</DialogTitle>
            <DialogDescription>
              Please provide a reason for undoing this action. This will be logged for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={3}
            placeholder="Enter reason for undo..."
            value={undoReason}
            onChange={(e) => setUndoReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUndoDialogId(null); setUndoReason(""); }}>
              Cancel
            </Button>
            <Button
              onClick={confirmUndo}
              disabled={!undoReason.trim() || undoMutation.isPending}
              className="bg-yellow-500 text-black hover:bg-yellow-400"
            >
              {undoMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Confirm Undo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
