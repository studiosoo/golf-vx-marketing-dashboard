import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
  ShieldCheck,
  Eye,
  CheckCircle2,
  XCircle,
  Undo2,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Mail,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Database,
  Wifi,
  WifiOff,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SyncStatus {
  id: number;
  source: string;
  status: string;
  lastSyncAt: number | null;
  nextSyncAt: number | null;
  recordCount: number | null;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
}

interface AutonomousAction {
  id: number;
  campaignId: string;
  campaignName: string;
  actionType: string;
  riskLevel: string;
  status: string;
  title: string;
  description: string;
  actionParams: Record<string, unknown> | null;
  triggerData: Record<string, unknown> | null;
  confidence: number | null;
  expectedImpact: string | null;
  executedAt: number | null;
  reviewedBy: string | null;
  reviewedAt: number | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatTimeAgo(timestamp: number | string | null): string {
  if (!timestamp) return "Never";
  const ms = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
  const diff = Date.now() - ms;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function getActionIcon(actionType: string) {
  switch (actionType) {
    case "budget_decrease":
    case "budget_increase":
      return <DollarSign className="w-4 h-4" />;
    case "send_email":
    case "email_alert":
      return <Mail className="w-4 h-4" />;
    case "change_targeting":
      return <Target className="w-4 h-4" />;
    case "pause_campaign":
      return <XCircle className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
}

function getRiskBadge(riskLevel: string) {
  switch (riskLevel) {
    case "low":
      return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Low Risk</Badge>;
    case "medium":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">Medium Risk</Badge>;
    case "high":
      return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">High Risk</Badge>;
    case "monitor":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Monitor</Badge>;
    default:
      return <Badge variant="outline">{riskLevel}</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "auto_executed":
      return <Badge className="bg-green-600 text-white hover:bg-green-600">Auto-Executed</Badge>;
    case "pending_approval":
      return <Badge className="bg-amber-500 text-white hover:bg-amber-500">Pending Approval</Badge>;
    case "approved":
      return <Badge className="bg-blue-600 text-white hover:bg-blue-600">Approved</Badge>;
    case "rejected":
      return <Badge className="bg-red-600 text-white hover:bg-red-600">Rejected</Badge>;
    case "undone":
      return <Badge className="bg-gray-500 text-white hover:bg-gray-500">Undone</Badge>;
    case "monitoring":
      return <Badge className="bg-indigo-500 text-white hover:bg-indigo-500">Monitoring</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getConfidenceColor(confidence: number | null): string {
  if (!confidence) return "text-muted-foreground";
  if (confidence >= 80) return "text-green-600";
  if (confidence >= 60) return "text-yellow-600";
  return "text-red-600";
}

// ─── Sync Status Bar ───────────────────────────────────────────────────────────

function SyncStatusBar({ syncData }: { syncData: SyncStatus[] | undefined }) {
  if (!syncData || syncData.length === 0) {
    return (
      <Card className="p-4 border-dashed">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Database className="w-5 h-5" />
          <span className="text-sm">No sync data available. Run your first sync to get started.</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold">Data Sources</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Next sync: {syncData[0]?.nextSyncAt ? new Date(syncData[0].nextSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Not scheduled"}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {syncData.map((source) => (
          <div
            key={source.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              source.status === "success"
                ? "border-green-200 bg-green-50"
                : source.status === "error"
                ? "border-red-200 bg-red-50"
                : source.status === "syncing"
                ? "border-blue-200 bg-blue-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              source.status === "success" ? "bg-green-500" :
              source.status === "error" ? "bg-red-500" :
              source.status === "syncing" ? "bg-blue-500 animate-pulse" :
              "bg-gray-400"
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium capitalize truncate">
                {source.source.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-muted-foreground">
                {source.lastSyncAt ? formatTimeAgo(source.lastSyncAt) : "Never synced"}
                {source.recordCount ? ` · ${source.recordCount} records` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Auto-Executed Action Card ─────────────────────────────────────────────────

function AutoExecutedCard({
  action,
  onUndo,
  isUndoing,
}: {
  action: AutonomousAction;
  onUndo: (id: number) => void;
  isUndoing: boolean;
}) {
  return (
    <Card className="p-4 border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-green-100 text-green-700 flex-shrink-0">
            {getActionIcon(action.actionType)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm truncate">{action.title}</h4>
              {getRiskBadge(action.riskLevel)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {action.campaignName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(action.executedAt || action.createdAt)}
              </span>
              {action.confidence && (
                <span className={`flex items-center gap-1 ${getConfidenceColor(action.confidence)}`}>
                  <Activity className="w-3 h-3" />
                  {action.confidence}% confidence
                </span>
              )}
            </div>
            {action.expectedImpact && (
              <div className="mt-2 p-2 rounded bg-green-50 border border-green-100">
                <p className="text-xs text-green-800">
                  <strong>Impact:</strong> {action.expectedImpact}
                </p>
              </div>
            )}
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUndo(action.id)}
              disabled={isUndoing}
              className="flex-shrink-0 text-muted-foreground hover:text-red-600"
            >
              {isUndoing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo this action</TooltipContent>
        </Tooltip>
      </div>
    </Card>
  );
}

// ─── Approval Card ─────────────────────────────────────────────────────────────

function ApprovalCard({
  action,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  action: AutonomousAction;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const riskColor = action.riskLevel === "high" ? "border-l-red-500" : "border-l-amber-500";

  return (
    <Card className={`p-5 border-l-4 ${riskColor} hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${
          action.riskLevel === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
        }`}>
          {getActionIcon(action.actionType)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold">{action.title}</h4>
            {getRiskBadge(action.riskLevel)}
            {action.confidence && (
              <span className={`text-xs font-medium ${getConfidenceColor(action.confidence)}`}>
                {action.confidence}% confidence
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">{action.description}</p>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {action.campaignName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(action.createdAt)}
            </span>
          </div>

          {/* Trigger Data Summary */}
          {action.triggerData && Object.keys(action.triggerData).length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                <Info className="w-3 h-3" /> Trigger Metrics
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(action.triggerData).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {action.expectedImpact && (
            <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-800">
                <strong>Expected Impact:</strong> {action.expectedImpact}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              onClick={() => onApprove(action.id)}
              disabled={isApproving || isRejecting}
              className="bg-green-600 hover:bg-green-700 text-white gap-1"
            >
              {isApproving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(action.id)}
              disabled={isApproving || isRejecting}
              className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
            >
              {isRejecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              Reject
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Monitoring Card ───────────────────────────────────────────────────────────

function MonitoringCard({ action }: { action: AutonomousAction }) {
  return (
    <Card className="p-4 border-l-4 border-l-indigo-400 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 flex-shrink-0">
          <Eye className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm">{action.title}</h4>
            {getRiskBadge(action.riskLevel)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {action.campaignName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(action.createdAt)}
            </span>
            {action.confidence && (
              <span className={`flex items-center gap-1 ${getConfidenceColor(action.confidence)}`}>
                <Activity className="w-3 h-3" />
                {action.confidence}% confidence
              </span>
            )}
          </div>
          {action.expectedImpact && (
            <p className="text-xs text-indigo-700 mt-2 italic">{action.expectedImpact}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Summary Stats ─────────────────────────────────────────────────────────────

function SummaryStats({
  autoExecuted,
  pending,
  monitoring,
}: {
  autoExecuted: AutonomousAction[];
  pending: AutonomousAction[];
  monitoring: AutonomousAction[];
}) {
  const total = autoExecuted.length + pending.length + monitoring.length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Total Actions</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100">
            <Zap className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{autoExecuted.length}</p>
            <p className="text-xs text-muted-foreground">Auto-Executed</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
            <p className="text-xs text-muted-foreground">Awaiting Approval</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Eye className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-600">{monitoring.length}</p>
            <p className="text-xs text-muted-foreground">Monitoring</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MarketingIntelligence() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("auto-executed");
  const [undoingId, setUndoingId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  // ─── Queries ───────────────────────────────────────────────────────────────
  const syncStatusQuery = trpc.autonomous.getSyncStatus.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const autoExecutedQuery = trpc.autonomous.getAutoExecuted.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const approvalQuery = trpc.autonomous.getApprovalCards.useQuery(undefined, {
    refetchInterval: 15_000,
  });
  const monitoringQuery = trpc.autonomous.getMonitoring.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();

  const syncMutation = trpc.autonomous.syncAllData.useMutation({
    onSuccess: (data) => {
      toast.success("Sync Complete", {
        description: data.summary,
      });
      utils.autonomous.getSyncStatus.invalidate();
      utils.autonomous.getAutoExecuted.invalidate();
      utils.autonomous.getApprovalCards.invalidate();
      utils.autonomous.getMonitoring.invalidate();
    },
    onError: (error) => {
      toast.error("Sync Failed", {
        description: error.message,
      });
    },
  });

  const approveMutation = trpc.autonomous.approveAction.useMutation({
    onSuccess: () => {
      toast.success("Action Approved", {
        description: "The action has been approved and will be executed.",
      });
      setApprovingId(null);
      utils.autonomous.getApprovalCards.invalidate();
      utils.autonomous.getAutoExecuted.invalidate();
    },
    onError: (error) => {
      toast.error("Approval Failed", { description: error.message });
      setApprovingId(null);
    },
  });

  const rejectMutation = trpc.autonomous.rejectAction.useMutation({
    onSuccess: () => {
      toast.success("Action Rejected", {
        description: "The action has been rejected.",
      });
      setRejectingId(null);
      utils.autonomous.getApprovalCards.invalidate();
    },
    onError: (error) => {
      toast.error("Rejection Failed", { description: error.message });
      setRejectingId(null);
    },
  });

  const undoMutation = trpc.autonomous.undoAction.useMutation({
    onSuccess: () => {
      toast.success("Action Undone", {
        description: "The action has been reverted.",
      });
      setUndoingId(null);
      utils.autonomous.getAutoExecuted.invalidate();
    },
    onError: (error) => {
      toast.error("Undo Failed", { description: error.message });
      setUndoingId(null);
    },
  });

  const seedMutation = trpc.autonomous.seedDemo.useMutation({
    onSuccess: (data) => {
      toast.success("Demo Data Seeded", {
        description: data.message,
      });
      utils.autonomous.getSyncStatus.invalidate();
      utils.autonomous.getAutoExecuted.invalidate();
      utils.autonomous.getApprovalCards.invalidate();
      utils.autonomous.getMonitoring.invalidate();
    },
    onError: (error) => {
      toast.error("Seed Failed", { description: error.message });
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSync = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to sync data");
      return;
    }
    syncMutation.mutate();
  };

  const handleApprove = (id: number) => {
    setApprovingId(id);
    approveMutation.mutate({ actionId: id });
  };

  const handleReject = (id: number) => {
    setRejectingId(id);
    rejectMutation.mutate({ actionId: id });
  };

  const handleUndo = (id: number) => {
    setUndoingId(id);
    undoMutation.mutate({ actionId: id });
  };

  const handleSeedDemo = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to seed demo data");
      return;
    }
    seedMutation.mutate();
  };

  // ─── Data ──────────────────────────────────────────────────────────────────
  const autoExecuted = (autoExecutedQuery.data ?? []) as AutonomousAction[];
  const pending = (approvalQuery.data ?? []) as AutonomousAction[];
  const monitoring = (monitoringQuery.data ?? []) as AutonomousAction[];
  const syncData = (syncStatusQuery.data ?? []) as SyncStatus[];

  const isLoading =
    autoExecutedQuery.isLoading ||
    approvalQuery.isLoading ||
    monitoringQuery.isLoading;

  const isEmpty = autoExecuted.length === 0 && pending.length === 0 && monitoring.length === 0;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            Marketing Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Autonomous decision engine — analyzes campaigns, executes low-risk optimizations, and escalates high-risk actions for your approval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEmpty && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDemo}
              disabled={seedMutation.isPending}
              className="gap-1"
            >
              {seedMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Database className="w-3 h-3" />
              )}
              Load Demo
            </Button>
          )}
          <Button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="gap-2"
          >
            {syncMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sync Status Bar */}
      <SyncStatusBar syncData={syncData} />

      {/* Summary Stats */}
      {!isLoading && !isEmpty && (
        <SummaryStats
          autoExecuted={autoExecuted}
          pending={pending}
          monitoring={monitoring}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-3">Loading intelligence data...</p>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && isEmpty && (
        <Card className="p-12 text-center">
          <Sparkles className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Actions Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            The autonomous engine hasn't generated any actions yet. Click "Sync Now" to fetch campaign data and generate optimization recommendations, or "Load Demo" to see sample data.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={handleSeedDemo} variant="outline" disabled={seedMutation.isPending}>
              {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
              Load Demo Data
            </Button>
            <Button onClick={handleSync} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Sync Now
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs: 3 Sections */}
      {!isLoading && !isEmpty && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auto-executed" className="gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Auto-Executed</span>
              <span className="sm:hidden">Auto</span>
              {autoExecuted.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {autoExecuted.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approval" className="gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Awaiting Approval</span>
              <span className="sm:hidden">Approval</span>
              {pending.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-xs bg-amber-500 text-white hover:bg-amber-500">
                  {pending.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Monitoring</span>
              <span className="sm:hidden">Monitor</span>
              {monitoring.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {monitoring.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Auto-Executed Tab */}
          <TabsContent value="auto-executed" className="mt-4 space-y-3">
            {autoExecuted.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No auto-executed actions</p>
                <p className="text-sm mt-1">Low-risk optimizations will appear here when detected.</p>
              </Card>
            ) : (
              autoExecuted.map((action) => (
                <AutoExecutedCard
                  key={action.id}
                  action={action}
                  onUndo={handleUndo}
                  isUndoing={undoingId === action.id}
                />
              ))
            )}
          </TabsContent>

          {/* Awaiting Approval Tab */}
          <TabsContent value="approval" className="mt-4 space-y-4">
            {pending.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No actions awaiting approval</p>
                <p className="text-sm mt-1">Medium and high-risk actions will appear here for your review.</p>
              </Card>
            ) : (
              pending.map((action) => (
                <ApprovalCard
                  key={action.id}
                  action={action}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isApproving={approvingId === action.id}
                  isRejecting={rejectingId === action.id}
                />
              ))
            )}
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="mt-4 space-y-3">
            {monitoring.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No items being monitored</p>
                <p className="text-sm mt-1">Campaigns with insufficient data will be tracked here.</p>
              </Card>
            ) : (
              monitoring.map((action) => (
                <MonitoringCard key={action.id} action={action} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Footer Info */}
      <div className="text-xs text-muted-foreground text-center pt-4 border-t">
        <p>
          Autonomous sync runs daily at <strong>8:00 AM</strong> and <strong>6:00 PM CST</strong>.
          Low-risk actions are auto-executed. Medium/high-risk actions require manual approval.
        </p>
      </div>
    </div>
  );
}
