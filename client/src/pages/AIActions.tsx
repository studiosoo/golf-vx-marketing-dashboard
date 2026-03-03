import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Zap, Clock, Eye, CheckCircle, XCircle, RotateCcw,
  RefreshCw, ChevronDown, ChevronUp, AlertTriangle,
  TrendingUp, Loader2, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ActionStatus =
  | "auto_executed" | "pending_approval" | "monitoring"
  | "approved" | "rejected" | "undone" | "dismissed" | "execution_failed";

interface AutonomousAction {
  id: number;
  campaignId?: string | null;
  campaignName?: string | null;
  actionType: string;
  title?: string | null;
  description: string;
  expectedImpact?: string | null;
  riskLevel: string;
  status: ActionStatus;
  confidence?: number | null;
  executedAt?: number | null;
  reviewedAt?: number | null;
  reviewedBy?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    low: "bg-green-50 text-green-700 border border-green-200",
    medium: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    high: "bg-red-50 text-red-700 border border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[level] || styles.medium}`}>
      {level.toUpperCase()} RISK
    </span>
  );
}

function StatusBadge({ status }: { status: ActionStatus }) {
  const map: Record<ActionStatus, { label: string; className: string }> = {
    auto_executed:    { label: "Auto-Executed",    className: "bg-[#F5C72C]/10 text-[#8B6E00] border border-[#F5C72C]/40" },
    pending_approval: { label: "Awaiting Approval", className: "bg-blue-50 text-blue-700 border border-blue-200" },
    monitoring:       { label: "Monitoring",        className: "bg-gray-50 text-gray-600 border border-gray-200" },
    approved:         { label: "Approved",          className: "bg-green-50 text-green-700 border border-green-200" },
    rejected:         { label: "Rejected",          className: "bg-red-50 text-red-700 border border-red-200" },
    undone:           { label: "Undone",            className: "bg-gray-50 text-gray-500 border border-gray-200" },
    dismissed:        { label: "Dismissed",         className: "bg-gray-50 text-gray-400 border border-gray-200" },
    execution_failed: { label: "Failed",            className: "bg-red-50 text-red-600 border border-red-200" },
  };
  const s = map[status] || map.monitoring;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

function ActionCard({
  action, section, onApprove, onReject, onUndo, onDismiss, isLoading,
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
  const formattedDate = action.createdAt
    ? new Date(action.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "";
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 space-y-3 hover:border-[#F5C72C]/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <StatusBadge status={action.status} />
            <RiskBadge level={action.riskLevel || "medium"} />
            {action.campaignName && (
              <span className="text-xs text-[#666] bg-[#F5F5F5] px-2 py-0.5 rounded font-mono">{action.campaignName}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#111] leading-snug">{action.description}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {section === "approval" && (
            <>
              <button onClick={() => onApprove?.(action.id)} disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded text-xs font-medium transition-colors disabled:opacity-50">
                <CheckCircle className="w-3.5 h-3.5" />Approve
              </button>
              <button onClick={() => onReject?.(action.id)} disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded text-xs font-medium transition-colors disabled:opacity-50">
                <XCircle className="w-3.5 h-3.5" />Reject
              </button>
            </>
          )}
          {section === "auto" && (action.status === "auto_executed" || action.status === "approved") && (
            <button onClick={() => onUndo?.(action.id)} disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F5F5F5] text-[#555] hover:bg-[#EBEBEB] border border-[#E0E0E0] rounded text-xs font-medium transition-colors disabled:opacity-50">
              <RotateCcw className="w-3.5 h-3.5" />Undo
            </button>
          )}
          <button onClick={() => onDismiss?.(action.id)} disabled={isLoading}
            className="p-1.5 text-[#999] hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Dismiss">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(e => !e)}
            className="p-1.5 text-[#999] hover:text-[#111] hover:bg-[#F5F5F5] rounded transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {action.confidence !== null && action.confidence !== undefined && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#888]">Confidence:</span>
          <span className="px-2 py-1 bg-[#F5C72C]/10 text-[#8B6E00] border border-[#F5C72C]/30 rounded font-mono">{action.confidence}%</span>
        </div>
      )}
      {action.status === "execution_failed" && (
        <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>Execution failed — check sync logs for details</span>
        </div>
      )}
      {expanded && (
        <div className="pt-2 border-t border-[#F0F0F0] space-y-2">
          <div>
            <p className="text-xs font-medium text-[#888] uppercase tracking-wide mb-1">Expected Impact</p>
            <p className="text-xs text-[#444] leading-relaxed">{action.expectedImpact || action.description}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#999]">
            <span>Type: <span className="text-[#555]">{action.actionType}</span></span>
            <span>Created: <span className="text-[#555]">{formattedDate}</span></span>
            {action.reviewedBy && <span>Reviewed by: <span className="text-[#555]">{action.reviewedBy}</span></span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIActions() {
  const { data: actions, isLoading, refetch } = trpc.autonomous.getAllActions.useQuery(undefined, { refetchInterval: 60_000 });
  const approveMutation = trpc.autonomous.approveAction.useMutation({ onSuccess: () => { toast.success("Action approved"); refetch(); }, onError: (e) => toast.error(e.message) });
  const rejectMutation = trpc.autonomous.rejectAction.useMutation({ onSuccess: () => { toast.success("Action rejected"); refetch(); }, onError: (e) => toast.error(e.message) });
  const undoMutation = trpc.autonomous.undoAction.useMutation({ onSuccess: () => { toast.success("Action undone"); refetch(); }, onError: (e) => toast.error(e.message) });
  const dismissMutation = trpc.autonomous.dismissAction.useMutation({ onSuccess: () => { refetch(); }, onError: (e) => toast.error(e.message) });
  const syncMutation = trpc.autonomous.syncAllData.useMutation({ onSuccess: () => { toast.success("Sync complete"); refetch(); }, onError: (e) => toast.error("Sync failed: " + e.message) });
  const isAnyLoading = approveMutation.isPending || rejectMutation.isPending || undoMutation.isPending || dismissMutation.isPending;
  const autoExecuted = (actions || []).filter(a => a.status === "auto_executed" || a.status === "approved");
  const pendingApproval = (actions || []).filter(a => a.status === "pending_approval");
  const monitoring = (actions || []).filter(a => a.status === "monitoring" || a.status === "execution_failed");
  const lastSync = actions?.[0]?.createdAt ? new Date(actions[0].createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null;
  return (
    <div className="p-6 space-y-8 bg-[#FAFAFA] min-h-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">AI Actions</h1>
          <p className="text-sm text-[#666] mt-1">Autonomous decisions and recommendations based on live campaign data{lastSync && <span className="ml-2 text-[#999]">· Last sync {lastSync}</span>}</p>
        </div>
        <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}
          className="flex items-center gap-2 bg-[#F5C72C] hover:bg-[#E6B800] text-[#111] font-semibold text-sm px-4 py-2 rounded-lg border-0">
          {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {syncMutation.isPending ? "Syncing…" : "Sync Now"}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Auto-Executed", value: autoExecuted.length, icon: Zap, color: "text-[#F5C72C]", bg: "bg-[#F5C72C]/10" },
          { label: "Awaiting Approval", value: pendingApproval.length, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Monitoring", value: monitoring.length, icon: Eye, color: "text-[#666]", bg: "bg-[#F5F5F5]" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-[#E0E0E0] rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${color}`} /></div>
            <div><div className="text-2xl font-bold text-[#111]">{value}</div><div className="text-xs text-[#888]">{label}</div></div>
          </div>
        ))}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#F5C72C]" /><span className="ml-2 text-[#666] text-sm">Loading actions…</span></div>
      ) : (
        <div className="space-y-10">
          {pendingApproval.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Clock className="w-4 h-4 text-blue-600" /></div>
                <div>
                  <div className="flex items-center gap-2"><h2 className="text-base font-semibold text-[#111]">Awaiting Your Approval</h2><span className="text-xs bg-[#F5F5F5] border border-[#E0E0E0] text-[#666] px-2 py-0.5 rounded-full font-medium">{pendingApproval.length}</span></div>
                  <p className="text-xs text-[#888]">Medium-to-high risk actions that require your sign-off before execution</p>
                </div>
              </div>
              <div className="space-y-3">{pendingApproval.map(action => <ActionCard key={action.id} action={action as unknown as AutonomousAction} section="approval" onApprove={id => approveMutation.mutate({ actionId: id })} onReject={id => rejectMutation.mutate({ actionId: id })} onDismiss={id => dismissMutation.mutate({ actionId: id })} isLoading={isAnyLoading} />)}</div>
            </section>
          )}
          {autoExecuted.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#F5C72C]/10 flex items-center justify-center"><Zap className="w-4 h-4 text-[#8B6E00]" /></div>
                <div>
                  <div className="flex items-center gap-2"><h2 className="text-base font-semibold text-[#111]">Auto-Executed</h2><span className="text-xs bg-[#F5F5F5] border border-[#E0E0E0] text-[#666] px-2 py-0.5 rounded-full font-medium">{autoExecuted.length}</span></div>
                  <p className="text-xs text-[#888]">Low-risk optimizations applied automatically — undo any within 24 hours</p>
                </div>
              </div>
              <div className="space-y-3">{autoExecuted.map(action => <ActionCard key={action.id} action={action as unknown as AutonomousAction} section="auto" onUndo={id => undoMutation.mutate({ actionId: id })} onDismiss={id => dismissMutation.mutate({ actionId: id })} isLoading={isAnyLoading} />)}</div>
            </section>
          )}
          {monitoring.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] flex items-center justify-center"><TrendingUp className="w-4 h-4 text-[#666]" /></div>
                <div>
                  <div className="flex items-center gap-2"><h2 className="text-base font-semibold text-[#111]">Monitoring</h2><span className="text-xs bg-[#F5F5F5] border border-[#E0E0E0] text-[#666] px-2 py-0.5 rounded-full font-medium">{monitoring.length}</span></div>
                  <p className="text-xs text-[#888]">Items being tracked — insufficient data for action or awaiting next sync</p>
                </div>
              </div>
              <div className="space-y-3">{monitoring.slice(0, 10).map(action => <ActionCard key={action.id} action={action as unknown as AutonomousAction} section="monitoring" onDismiss={id => dismissMutation.mutate({ actionId: id })} isLoading={isAnyLoading} />)}</div>
              {monitoring.length > 10 && <p className="text-xs text-[#999] text-center py-2">+ {monitoring.length - 10} more monitoring items</p>}
            </section>
          )}
          {!pendingApproval.length && !autoExecuted.length && !monitoring.length && (
            <div className="text-center py-16 text-[#999]">
              <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No actions yet</p>
              <p className="text-xs mt-1">Click "Sync Now" to generate AI recommendations from live data</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
