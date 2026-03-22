import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Zap, Clock, Eye, CheckCircle, XCircle, RotateCcw,
  RefreshCw, ChevronDown, ChevronUp, AlertTriangle,
  TrendingUp, Loader2, Trash2, Archive, ListPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AsanaTaskModal from "@/components/AsanaTaskModal";

type ActionStatus =
  | "auto_executed" | "pending_approval" | "monitoring"
  | "approved" | "rejected" | "undone" | "dismissed" | "execution_failed" | "archived";

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
    low: "bg-[#72B84A]/10 text-[#72B84A] border border-[#72B84A]/30",
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
    auto_executed:    { label: "Auto-Executed",    className: "bg-[#F2DD48]/10 text-[#8B6E00] border border-[#F2DD48]/40" },
    pending_approval: { label: "Awaiting Approval", className: "bg-[#F2DD48]/10 text-[#222222] border border-[#F2DD48]/40" },
    monitoring:       { label: "Monitoring",        className: "bg-gray-50 text-gray-600 border border-gray-200" },
    approved:         { label: "Approved",          className: "bg-[#72B84A]/10 text-[#72B84A] border border-[#72B84A]/30" },
    rejected:         { label: "Rejected",          className: "bg-red-50 text-red-700 border border-red-200" },
    undone:           { label: "Undone",            className: "bg-gray-50 text-gray-500 border border-gray-200" },
    dismissed:        { label: "Dismissed",         className: "bg-gray-50 text-[#888888] border border-gray-200" },
    execution_failed: { label: "Failed",            className: "bg-red-50 text-red-600 border border-red-200" },
    archived:         { label: "Archived",          className: "bg-gray-50 text-[#888888] border border-gray-200" },
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
    <div className="bg-white border border-[#DEDEDA] rounded-xl p-4 space-y-3 hover:border-[#F2DD48]/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <StatusBadge status={action.status} />
            <RiskBadge level={action.riskLevel || "medium"} />
            {action.campaignName && (
              <span className="text-xs text-[#666] bg-[#F1F1EF] px-2 py-0.5 rounded font-mono">{action.campaignName}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#111] leading-snug">{action.description}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {section === "approval" && (
            <>
              <button onClick={() => onApprove?.(action.id)} disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#72B84A]/10 text-[#72B84A] hover:bg-[#72B84A]/20 border border-[#72B84A]/30 rounded text-xs font-medium transition-colors disabled:opacity-50">
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
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F1F1EF] text-[#555] hover:bg-[#EBEBEB] border border-[#DEDEDA] rounded text-xs font-medium transition-colors disabled:opacity-50">
              <RotateCcw className="w-3.5 h-3.5" />Undo
            </button>
          )}
          <button onClick={() => onDismiss?.(action.id)} disabled={isLoading}
            className="p-1.5 text-[#999] hover:text-[#E8453C] hover:bg-red-50 rounded transition-colors" title="Dismiss">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(e => !e)}
            className="p-1.5 text-[#999] hover:text-[#111] hover:bg-[#F1F1EF] rounded transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {action.confidence !== null && action.confidence !== undefined && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#888]">Confidence:</span>
          <span className="px-2 py-1 bg-[#F2DD48]/10 text-[#8B6E00] border border-[#F2DD48]/30 rounded font-mono">{action.confidence}%</span>
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
  const [view, setView] = useState<"active" | "archive">("active");
  const [asanaModalOpen, setAsanaModalOpen] = useState(false);
  const { data: actions, isLoading, refetch } = trpc.autonomous.getAllActions.useQuery(undefined, { refetchInterval: 60_000 });
  const { data: archivedActions, isLoading: isArchiveLoading } = trpc.autonomous.getArchivedActions.useQuery(undefined, { enabled: view === "archive" });
  const approveMutation = trpc.autonomous.approveAction.useMutation({ onSuccess: () => { toast.success("Action approved"); refetch(); }, onError: (e) => toast.error(e.message) });
  const rejectMutation = trpc.autonomous.rejectAction.useMutation({ onSuccess: () => { toast.success("Action rejected"); refetch(); }, onError: (e) => toast.error(e.message) });
  const undoMutation = trpc.autonomous.undoAction.useMutation({ onSuccess: () => { toast.success("Action undone"); refetch(); }, onError: (e) => toast.error(e.message) });
  const dismissMutation = trpc.autonomous.dismissAction.useMutation({ onSuccess: () => { refetch(); }, onError: (e) => toast.error(e.message) });
  const syncMutation = trpc.autonomous.syncAllData.useMutation({ onSuccess: () => { toast.success("Sync complete"); refetch(); }, onError: (e) => toast.error("Sync failed: " + e.message) });
  const clearAllMutation = trpc.autonomous.clearAllActiveActions.useMutation({ onSuccess: () => { toast.success("All active actions cleared"); refetch(); }, onError: (e) => toast.error(e.message) });
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
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-[#DEDEDA] rounded-lg p-1">
            <button onClick={() => setView("active")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === "active" ? "bg-[#111] text-white" : "text-[#666] hover:text-[#111]"
            }`}>
              <Zap className="w-3.5 h-3.5" /> Active
            </button>
            <button onClick={() => setView("archive")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === "archive" ? "bg-[#111] text-white" : "text-[#666] hover:text-[#111]"
            }`}>
              <Archive className="w-3.5 h-3.5" /> Archive {archivedActions && archivedActions.length > 0 && <span className="ml-1 text-xs opacity-70">{archivedActions.length}</span>}
            </button>
          </div>
          {view === "active" && (
            <>
              <Button onClick={() => { if (confirm("모든 활성 AI 액션을 dismissed 처리할까요?")) clearAllMutation.mutate(); }} disabled={clearAllMutation.isPending}
                variant="outline"
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-[#DEDEDA] text-[#666] hover:text-red-600 hover:border-red-200">
                {clearAllMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Clear All
              </Button>
              <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}
                className="flex items-center gap-2 bg-[#F2DD48] hover:bg-[#E6B800] text-[#111] font-semibold text-sm px-4 py-2 rounded-lg border-0">
                {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {syncMutation.isPending ? "Syncing…" : "Sync Now"}
              </Button>
              <Button onClick={() => setAsanaModalOpen(true)}
                variant="outline"
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-[#F06A35]/40 text-[#F06A35] hover:bg-[#F06A35]/10">
                <ListPlus className="w-4 h-4" />Add to Asana
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Auto-Executed", value: autoExecuted.length, icon: Zap, color: "text-[#F2DD48]", bg: "bg-[#F2DD48]/10" },
          { label: "Awaiting Approval", value: pendingApproval.length, icon: Clock, color: "text-[#F2DD48]", bg: "bg-[#F2DD48]/10" },
          { label: "Monitoring", value: monitoring.length, icon: Eye, color: "text-[#666]", bg: "bg-[#F1F1EF]" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-[#DEDEDA] rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${color}`} /></div>
            <div><div className="text-2xl font-bold text-[#111]">{value}</div><div className="text-xs text-[#888]">{label}</div></div>
          </div>
        ))}
      </div>
      {view === "archive" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Archive className="w-4 h-4 text-[#666]" /></div>
            <div>
              <h2 className="text-base font-semibold text-[#111]">Archived Actions</h2>
              <p className="text-xs text-[#888]">Historical actions — older entries and duplicates moved here automatically</p>
            </div>
          </div>
          {isArchiveLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#F2DD48]" /><span className="ml-2 text-[#666] text-sm">Loading archive…</span></div>
          ) : !archivedActions?.length ? (
            <div className="text-center py-16 text-[#999]">
              <Archive className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Archive is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedActions.map(action => (
                <div key={action.id} className="bg-white border border-[#E8E8E8] rounded-xl p-4 opacity-75">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={action.status as ActionStatus} />
                      {action.campaignName && <span className="text-xs font-mono bg-[#F1F1EF] text-[#555] px-2 py-0.5 rounded border border-[#E8E8E8]">{action.campaignName}</span>}
                    </div>
                    <span className="text-xs text-[#AAA] whitespace-nowrap">{new Date(action.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                  <p className="text-sm text-[#444] mt-2 leading-relaxed">{action.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#F2DD48]" /><span className="ml-2 text-[#666] text-sm">Loading actions…</span></div>
      ) : (
        <div className="space-y-10">
          {pendingApproval.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#F2DD48]/10 flex items-center justify-center"><Clock className="w-4 h-4 text-[#F2DD48]" /></div>
                <div>
                  <div className="flex items-center gap-2"><h2 className="text-base font-semibold text-[#111]">Awaiting Your Approval</h2><span className="text-xs bg-[#F1F1EF] border border-[#DEDEDA] text-[#666] px-2 py-0.5 rounded-full font-medium">{pendingApproval.length}</span></div>
                  <p className="text-xs text-[#888]">Medium-to-high risk actions that require your sign-off before execution</p>
                </div>
              </div>
              <div className="space-y-3">{pendingApproval.map(action => <ActionCard key={action.id} action={action as unknown as AutonomousAction} section="approval" onApprove={id => approveMutation.mutate({ actionId: id })} onReject={id => rejectMutation.mutate({ actionId: id })} onDismiss={id => dismissMutation.mutate({ actionId: id })} isLoading={isAnyLoading} />)}</div>
            </section>
          )}
          {autoExecuted.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#F2DD48]/10 flex items-center justify-center"><Zap className="w-4 h-4 text-[#8B6E00]" /></div>
                <div>
                  <div className="flex items-center gap-2"><h2 className="text-base font-semibold text-[#111]">Auto-Executed</h2><span className="text-xs bg-[#F1F1EF] border border-[#DEDEDA] text-[#666] px-2 py-0.5 rounded-full font-medium">{autoExecuted.length}</span></div>
                  <p className="text-xs text-[#888]">Low-risk optimizations applied automatically — undo any within 24 hours</p>
                </div>
              </div>
              <div className="space-y-3">{autoExecuted.map(action => <ActionCard key={action.id} action={action as unknown as AutonomousAction} section="auto" onUndo={id => undoMutation.mutate({ actionId: id })} onDismiss={id => dismissMutation.mutate({ actionId: id })} isLoading={isAnyLoading} />)}</div>
            </section>
          )}
          {monitoring.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#F1F1EF] flex items-center justify-center"><TrendingUp className="w-4 h-4 text-[#666]" /></div>
                <div>
                  <div className="flex items-center gap-2"><h2 className="text-base font-semibold text-[#111]">Monitoring</h2><span className="text-xs bg-[#F1F1EF] border border-[#DEDEDA] text-[#666] px-2 py-0.5 rounded-full font-medium">{monitoring.length}</span></div>
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
      {asanaModalOpen && (
        <AsanaTaskModal
          isOpen={asanaModalOpen}
          onClose={() => setAsanaModalOpen(false)}
          title="Add Action Plan to Asana"
        />
      )}
    </div>
  );
}
