import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Zap,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  RotateCcw,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Trash2,
  ExternalLink,
} from "lucide-react";

type ActionStatus = "auto_executed" | "pending_approval" | "monitoring" | "approved" | "rejected" | "undone" | "dismissed";

interface AutonomousAction {
  id: number;
  campaignId?: number | null;
  campaignName?: string | null;
  actionType: string;
  description: string;
  reasoning: string;
  riskLevel: string;
  status: ActionStatus;
  previousValue?: string | null;
  newValue?: string | null;
  executedAt?: Date | null;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  errorMessage?: string | null;
  createdAt: Date;
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    low: "bg-green-500/10 text-green-400 border-green-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    high: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[level] || colors.medium}`}>
      {level.toUpperCase()}
    </span>
  );
}

function ActionCard({
  action,
  section,
  onApprove,
  onReject,
  onUndo,
  onDismiss,
  isLoading,
}: {
  action: AutonomousAction;
  section: "auto" | "approval" | "monitoring";
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onUndo?: (id: number) => void;
  onDismiss?: (id: number) => void;
  isLoading?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasMetaAdsError = action.errorMessage && action.errorMessage.includes("Meta Ads");

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <RiskBadge level={action.riskLevel} />
            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
              {action.actionType.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground">{action.description}</p>
          {action.campaignName && (
            <p className="text-xs text-muted-foreground mt-0.5">Campaign: {action.campaignName}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {section === "auto" && onUndo && (
            <button
              onClick={() => onUndo(action.id)}
              disabled={isLoading}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              title="Undo"
            >
              <RotateCcw size={14} />
            </button>
          )}
          {section === "approval" && (
            <>
              {onApprove && (
                <button
                  onClick={() => onApprove(action.id)}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded text-xs font-medium transition-colors"
                >
                  {isLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                  Approve
                </button>
              )}
              {onReject && (
                <button
                  onClick={() => onReject(action.id)}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded text-xs font-medium transition-colors"
                >
                  <XCircle size={12} />
                  Reject
                </button>
              )}
            </>
          )}
          {(section === "monitoring" || action.status === "dismissed") && onDismiss && (
            <button
              onClick={() => onDismiss(action.id)}
              disabled={isLoading}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
              title="Dismiss"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Value change */}
      {(action.previousValue || action.newValue) && (
        <div className="flex items-center gap-2 text-xs">
          {action.previousValue && (
            <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded font-mono">
              {action.previousValue}
            </span>
          )}
          {action.previousValue && action.newValue && (
            <TrendingUp size={12} className="text-muted-foreground" />
          )}
          {action.newValue && (
            <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded font-mono">
              {action.newValue}
            </span>
          )}
        </div>
      )}

      {/* Error message */}
      {hasMetaAdsError && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded text-xs">
          <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-amber-400 font-medium">Meta Ads API Error — </span>
            <span className="text-muted-foreground">Apply manually in </span>
            <a
              href="https://www.facebook.com/adsmanager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline inline-flex items-center gap-0.5"
            >
              Meta Ads Manager <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

      {/* Expanded reasoning */}
      {expanded && (
        <div className="pt-2 border-t border-border space-y-2">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Reasoning</div>
            <p className="text-xs text-foreground/80">{action.reasoning}</p>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {action.executedAt
                ? `Executed: ${new Date(action.executedAt).toLocaleString()}`
                : action.createdAt
                ? `Created: ${new Date(action.createdAt).toLocaleString()}`
                : ""}
            </span>
            {action.reviewedBy && (
              <span>Reviewed by: {action.reviewedBy}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  count,
  icon,
  color,
  description,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {title}
          </h2>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function MarketingIntelligence() {
  const utils = trpc.useUtils();

  const { data: autoExecuted = [], isLoading: autoLoading } = trpc.autonomous.getAutoExecuted.useQuery();
  const { data: approvalCards = [], isLoading: approvalLoading } = trpc.autonomous.getApprovalCards.useQuery();
  const { data: monitoring = [], isLoading: monitoringLoading } = trpc.autonomous.getMonitoring.useQuery();
  const { data: syncStatus } = trpc.autonomous.getSyncStatus.useQuery();

  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const syncMutation = trpc.autonomous.syncAllData.useMutation({
    onSuccess: () => {
      toast.success("Sync complete — new actions generated");
      utils.autonomous.getAutoExecuted.invalidate();
      utils.autonomous.getApprovalCards.invalidate();
      utils.autonomous.getMonitoring.invalidate();
      utils.autonomous.getSyncStatus.invalidate();
    },
    onError: (err) => {
      toast.error(`Sync failed: ${err.message}`);
    },
  });

  const approveMutation = trpc.autonomous.approveAction.useMutation({
    onSuccess: () => {
      toast.success("Action approved and executed");
      utils.autonomous.getApprovalCards.invalidate();
      utils.autonomous.getAutoExecuted.invalidate();
      setActionLoading(null);
    },
    onError: (err) => {
      toast.error(`Approval failed: ${err.message}`);
      setActionLoading(null);
    },
  });

  const rejectMutation = trpc.autonomous.rejectAction.useMutation({
    onSuccess: () => {
      toast.success("Action rejected");
      utils.autonomous.getApprovalCards.invalidate();
      setActionLoading(null);
    },
    onError: (err) => {
      toast.error(`Rejection failed: ${err.message}`);
      setActionLoading(null);
    },
  });

  const undoMutation = trpc.autonomous.undoAction.useMutation({
    onSuccess: () => {
      toast.success("Action undone");
      utils.autonomous.getAutoExecuted.invalidate();
      setActionLoading(null);
    },
    onError: (err) => {
      toast.error(`Undo failed: ${err.message}`);
      setActionLoading(null);
    },
  });

  const dismissMutation = trpc.autonomous.dismissAction.useMutation({
    onSuccess: () => {
      toast.success("Action dismissed");
      utils.autonomous.getMonitoring.invalidate();
      setActionLoading(null);
    },
    onError: (err) => {
      toast.error(`Dismiss failed: ${err.message}`);
      setActionLoading(null);
    },
  });

  const handleApprove = (id: number) => {
    setActionLoading(id);
    approveMutation.mutate({ actionId: id });
  };

  const handleReject = (id: number) => {
    setActionLoading(id);
    rejectMutation.mutate({ actionId: id });
  };

  const handleUndo = (id: number) => {
    setActionLoading(id);
    undoMutation.mutate({ actionId: id });
  };

  const handleDismiss = (id: number) => {
    setActionLoading(id);
    dismissMutation.mutate({ actionId: id });
  };

  const isLoading = autoLoading || approvalLoading || monitoringLoading;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Marketing Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            Autonomous decision engine — analyzes campaigns and takes action
          </p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {syncMutation.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {syncMutation.isPending ? "Syncing..." : "Sync Now"}
        </button>
      </div>

      {/* Sync status */}
      {syncStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(syncStatus).map(([key, status]: [string, any]) => (
            <div key={key} className="bg-card border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground capitalize mb-1">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </div>
              <div className={`text-xs font-medium ${
                status?.status === "ok" ? "text-green-400" :
                status?.status === "error" ? "text-red-400" :
                "text-yellow-400"
              }`}>
                {status?.status || "unknown"}
              </div>
              {status?.lastSync && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(status.lastSync).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section 1: Auto-Executed */}
          <div>
            <SectionHeader
              title="Auto-Executed"
              count={autoExecuted.length}
              icon={<Zap size={16} className="text-green-400" />}
              color="bg-green-500/10"
              description="Low-risk actions taken automatically"
            />
            <div className="space-y-3">
              {autoExecuted.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                  No auto-executed actions
                </div>
              ) : (
                autoExecuted.map((action: any) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    section="auto"
                    onUndo={handleUndo}
                    isLoading={actionLoading === action.id}
                  />
                ))
              )}
            </div>
          </div>

          {/* Section 2: Awaiting Approval */}
          <div>
            <SectionHeader
              title="Awaiting Approval"
              count={approvalCards.length}
              icon={<Clock size={16} className="text-yellow-400" />}
              color="bg-yellow-500/10"
              description="Medium/high-risk actions needing review"
            />
            <div className="space-y-3">
              {approvalCards.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                  No actions awaiting approval
                </div>
              ) : (
                approvalCards.map((action: any) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    section="approval"
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isLoading={actionLoading === action.id}
                  />
                ))
              )}
            </div>
          </div>

          {/* Section 3: Monitoring */}
          <div>
            <SectionHeader
              title="Monitoring"
              count={monitoring.length}
              icon={<Eye size={16} className="text-blue-400" />}
              color="bg-blue-500/10"
              description="Campaigns with insufficient data"
            />
            <div className="space-y-3">
              {monitoring.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                  No campaigns being monitored
                </div>
              ) : (
                monitoring.map((action: any) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    section="monitoring"
                    onDismiss={handleDismiss}
                    isLoading={actionLoading === action.id}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
