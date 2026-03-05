import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Zap, Clock, Eye, CheckCircle, XCircle, RotateCcw, RefreshCw,
  ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Loader2,
  Trash2, Archive, ListPlus, ExternalLink, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AsanaTaskModal from "@/components/AsanaTaskModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionStatus =
  | "auto_executed" | "pending_approval" | "monitoring" | "approved"
  | "rejected" | "undone" | "dismissed" | "execution_failed" | "archived";

interface AutonomousAction {
  id: number;
  campaignId?: string | number | null;
  campaignName?: string | null;
  actionType: string;
  title?: string | null;
  description: string;
  reasoning?: string | null;
  expectedImpact?: string | null;
  riskLevel: string;
  status: ActionStatus;
  confidence?: number | null;
  previousValue?: string | null;
  newValue?: string | null;
  executedAt?: Date | number | null;
  reviewedAt?: Date | number | null;
  reviewedBy?: string | null;
  errorMessage?: string | null;
  createdAt: Date;
}

type SyncStatusEntry = { status: string; lastSync?: string | number | null };

// ─── Small components ─────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: string }) {
  const cls: Record<string, string> = {
    low:    "bg-[#3DB855]/10 text-[#3DB855] border border-[#3DB855]/30",
    medium: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    high:   "bg-red-50 text-red-700 border border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[level] ?? cls.medium}`}>
      {level.toUpperCase()} RISK
    </span>
  );
}

const STATUS_MAP: Record<ActionStatus, { label: string; cls: string }> = {
  auto_executed:    { label: "Auto-Executed",     cls: "bg-[#F5C72C]/10 text-[#8B6E00] border border-[#F5C72C]/40" },
  pending_approval: { label: "Awaiting Approval", cls: "bg-[#F5C72C]/10 text-[#111111] border border-[#F5C72C]/40" },
  monitoring:       { label: "Monitoring",        cls: "bg-gray-50 text-gray-600 border border-gray-200" },
  approved:         { label: "Approved",          cls: "bg-[#3DB855]/10 text-[#3DB855] border border-[#3DB855]/30" },
  rejected:         { label: "Rejected",          cls: "bg-red-50 text-red-700 border border-red-200" },
  undone:           { label: "Undone",            cls: "bg-gray-50 text-gray-500 border border-gray-200" },
  dismissed:        { label: "Dismissed",         cls: "bg-gray-50 text-[#888] border border-gray-200" },
  execution_failed: { label: "Failed",            cls: "bg-red-50 text-red-600 border border-red-200" },
  archived:         { label: "Archived",          cls: "bg-gray-50 text-[#888] border border-gray-200" },
};

function StatusBadge({ status }: { status: ActionStatus }) {
  const { label, cls } = STATUS_MAP[status] ?? STATUS_MAP.monitoring;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

// ─── Action card ──────────────────────────────────────────────────────────────

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
  const hasMetaError = action.errorMessage?.includes("Meta Ads");
  const displayText = action.title ?? action.description;
  const detailText = action.title ? action.description : null;
  const formattedDate = new Date(action.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 space-y-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:border-[#F5C72C]/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <StatusBadge status={action.status} />
            <RiskBadge level={action.riskLevel || "medium"} />
            <span className="text-xs text-[#888] bg-[#F5F5F5] px-2 py-0.5 rounded font-mono">
              {action.actionType.replace(/_/g, " ")}
            </span>
            {action.campaignName && (
              <span className="text-xs text-[#666] bg-[#F5F5F5] px-2 py-0.5 rounded">{action.campaignName}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#111] leading-snug">{displayText}</p>
          {detailText && <p className="text-xs text-[#666] mt-0.5">{detailText}</p>}
          {action.expectedImpact && (
            <p className="text-xs text-[#8B6E00] bg-[#F5C72C]/5 border border-[#F5C72C]/20 px-2 py-1 rounded mt-1.5">
              Expected: {action.expectedImpact}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {section === "approval" && (
            <>
              <button onClick={() => onApprove?.(action.id)} disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#3DB855]/10 text-[#3DB855] hover:bg-[#3DB855]/20 border border-[#3DB855]/30 rounded text-xs font-medium transition-colors disabled:opacity-50">
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
            className="p-1.5 text-[#999] hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Dismiss">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(e => !e)}
            className="p-1.5 text-[#999] hover:text-[#111] hover:bg-[#F5F5F5] rounded transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {(action.previousValue || action.newValue) && (
        <div className="flex items-center gap-2 text-xs">
          {action.previousValue && <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-mono">{action.previousValue}</span>}
          {action.previousValue && action.newValue && <TrendingUp className="w-3 h-3 text-[#999]" />}
          {action.newValue && <span className="px-2 py-1 bg-[#3DB855]/10 text-[#3DB855] border border-[#3DB855]/30 rounded font-mono">{action.newValue}</span>}
        </div>
      )}

      {action.status === "execution_failed" && !hasMetaError && (
        <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>Execution failed — check sync logs for details</span>
        </div>
      )}

      {hasMetaError && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-[#F5C72C] flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-amber-700 font-medium">Meta Ads API Error — </span>
            <span className="text-[#666]">Apply manually in </span>
            <a href="https://www.facebook.com/adsmanager" target="_blank" rel="noopener noreferrer"
              className="text-amber-700 hover:underline inline-flex items-center gap-0.5">
              Meta Ads Manager <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      )}

      {expanded && (
        <div className="pt-2 border-t border-[#F0F0F0] space-y-2">
          {action.reasoning && (
            <div>
              <p className="text-xs font-medium text-[#888] uppercase tracking-wide mb-1">Reasoning</p>
              <p className="text-xs text-[#555] leading-relaxed">{action.reasoning}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-[#888] uppercase tracking-wide mb-1">Expected Impact</p>
            <p className="text-xs text-[#444] leading-relaxed">{action.expectedImpact ?? action.description}</p>
          </div>
          {action.confidence != null && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#888]">Confidence:</span>
              <span className="px-2 py-0.5 bg-[#F5C72C]/10 text-[#8B6E00] border border-[#F5C72C]/30 rounded font-mono">{action.confidence}%</span>
            </div>
          )}
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

// ─── Section header helper ────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, iconBg, iconColor, title, count, subtitle }: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  count: number;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[#111]">{title}</h2>
          <span className="text-xs bg-[#F5F5F5] border border-[#E0E0E0] text-[#666] px-2 py-0.5 rounded-full font-medium">{count}</span>
        </div>
        <p className="text-xs text-[#888]">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Insights tab ─────────────────────────────────────────────────────────────

function InsightsTab({ actions, archived, syncStatus, isSyncStatusLoading }: {
  actions: AutonomousAction[];
  archived: AutonomousAction[];
  syncStatus: Record<string, SyncStatusEntry> | null | undefined;
  isSyncStatusLoading: boolean;
}) {
  const autoExecuted = actions.filter(a => a.status === "auto_executed" || a.status === "approved");
  const pending      = actions.filter(a => a.status === "pending_approval");
  const rejected     = [...actions, ...archived].filter(a => a.status === "rejected");
  const dismissed    = [...actions, ...archived].filter(a => a.status === "dismissed");
  const monitoring   = actions.filter(a => a.status === "monitoring" || a.status === "execution_failed");

  const riskCounts: Record<string, number> = {};
  for (const a of actions) {
    const l = a.riskLevel || "medium";
    riskCounts[l] = (riskCounts[l] ?? 0) + 1;
  }
  const activeTotal = actions.length || 1;
  const decisionTotal = autoExecuted.length + rejected.length || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Auto-Executed",     value: autoExecuted.length, color: "text-[#8B6E00]" },
          { label: "Awaiting Approval", value: pending.length,      color: "text-[#888]" },
          { label: "Rejected",          value: rejected.length,     color: "text-red-600" },
          { label: "Dismissed",         value: dismissed.length,    color: "text-[#999]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-[#E0E0E0] rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className={`text-2xl font-bold tracking-tight ${color}`}>{value}</div>
            <div className="text-xs text-[#888] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold text-[#111] mb-3">Risk Distribution</h3>
          {Object.keys(riskCounts).length === 0 ? (
            <p className="text-xs text-[#999]">No active actions</p>
          ) : (
            <div className="space-y-2.5">
              {(["low", "medium", "high"] as const).map(level => {
                const count = riskCounts[level] ?? 0;
                const pct = Math.round((count / activeTotal) * 100);
                const bar = level === "low" ? "bg-[#3DB855]" : level === "high" ? "bg-red-500" : "bg-yellow-400";
                return (
                  <div key={level}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#555] capitalize">{level} risk</span>
                      <span className="text-[#888] font-mono">{count}</span>
                    </div>
                    <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                      <div className={`h-full ${bar} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold text-[#111] mb-3">Engine Overview</h3>
          <div className="space-y-0">
            {[
              { label: "Active actions",    value: String(actions.length) },
              { label: "Archived total",    value: String(archived.length) },
              { label: "Monitoring queue",  value: String(monitoring.length) },
              { label: "Auto-execute rate", value: `${Math.round((autoExecuted.length / decisionTotal) * 100)}%` },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className={`flex items-center justify-between py-1.5 text-xs ${i < arr.length - 1 ? "border-b border-[#F5F5F5]" : ""}`}>
                <span className="text-[#888]">{label}</span>
                <span className="font-semibold text-[#111]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {syncStatus && (
        <div>
          <h3 className="text-sm font-semibold text-[#111] mb-3">Data Source Status</h3>
          {isSyncStatusLoading ? (
            <div className="flex items-center gap-2 text-[#888] text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(syncStatus).map(([key, entry]) => {
                const color = entry?.status === "ok" ? "text-[#3DB855]" : entry?.status === "error" ? "text-red-600" : "text-yellow-600";
                return (
                  <div key={key} className="bg-white border border-[#E0E0E0] rounded-xl p-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                    <div className="text-xs text-[#888] capitalize mb-1">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                    <div className={`text-xs font-semibold ${color}`}>{entry?.status ?? "unknown"}</div>
                    {entry?.lastSync && <div className="text-xs text-[#AAA] mt-0.5">{new Date(entry.lastSync).toLocaleTimeString()}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = "actions" | "insights";

export default function Autopilot() {
  const [tab, setTab] = useState<Tab>("actions");
  const [view, setView] = useState<"active" | "archive">("active");
  const [asanaModalOpen, setAsanaModalOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: actions, isLoading, refetch } = trpc.autonomous.getAllActions.useQuery(undefined, { refetchInterval: 60_000 });
  const { data: archivedActions = [], isLoading: isArchiveLoading } = trpc.autonomous.getArchivedActions.useQuery(undefined, { enabled: view === "archive" || tab === "insights" });
  const { data: syncStatus, isLoading: isSyncStatusLoading } = trpc.autonomous.getSyncStatus.useQuery(undefined, { enabled: tab === "insights" });

  const afterMutate = () => { refetch(); utils.autonomous.getArchivedActions.invalidate(); };
  const approveMutation = trpc.autonomous.approveAction.useMutation({ onSuccess: () => { toast.success("Action approved"); afterMutate(); }, onError: e => toast.error(e.message) });
  const rejectMutation  = trpc.autonomous.rejectAction.useMutation({ onSuccess:  () => { toast.success("Action rejected"); afterMutate(); }, onError: e => toast.error(e.message) });
  const undoMutation    = trpc.autonomous.undoAction.useMutation({ onSuccess:    () => { toast.success("Action undone");  afterMutate(); }, onError: e => toast.error(e.message) });
  const dismissMutation = trpc.autonomous.dismissAction.useMutation({ onSuccess: () => refetch(), onError: e => toast.error(e.message) });
  const syncMutation    = trpc.autonomous.syncAllData.useMutation({
    onSuccess: () => { toast.success("Sync complete — new actions generated"); refetch(); utils.autonomous.getSyncStatus.invalidate(); },
    onError: e => toast.error("Sync failed: " + e.message),
  });
  const clearStaleMutation = trpc.autonomous.clearStaleActions.useMutation({ onSuccess: () => { toast.success("Stale actions cleared"); refetch(); }, onError: e => toast.error(e.message) });
  const clearAllMutation   = trpc.autonomous.clearAllActiveActions.useMutation({ onSuccess: () => { toast.success("All active actions cleared"); refetch(); }, onError: e => toast.error(e.message) });

  const isAnyMutating = approveMutation.isPending || rejectMutation.isPending || undoMutation.isPending || dismissMutation.isPending;
  const allActions     = (actions ?? []) as unknown as AutonomousAction[];
  const pendingApproval = allActions.filter(a => a.status === "pending_approval");
  const autoExecuted    = allActions.filter(a => a.status === "auto_executed" || a.status === "approved");
  const monitoring      = allActions.filter(a => a.status === "monitoring" || a.status === "execution_failed");
  const lastSync = allActions[0]?.createdAt
    ? new Date(allActions[0].createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="p-6 space-y-6 bg-[#FAFAFA] min-h-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">Autopilot</h1>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
              !isLoading && allActions.length > 0
                ? "bg-[#3DB855]/10 text-[#3DB855] border-[#3DB855]/30"
                : "bg-[#F5F5F5] text-[#999] border-[#E0E0E0]"
            }`}>
              <Activity className="w-3 h-3" />
              {!isLoading && allActions.length > 0 ? "Engine running" : "Engine idle"}
            </span>
          </div>
          <p className="text-sm text-[#666]">
            Autonomous marketing engine — review and approve AI decisions
            {lastSync && <span className="ml-2 text-[#999]">· Last sync {lastSync}</span>}
          </p>
        </div>

        {tab === "actions" && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {view === "active" && (
              <>
                <button onClick={() => { if (confirm("Dismiss pending actions older than 3 days?")) clearStaleMutation.mutate(); }}
                  disabled={clearStaleMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#666] border border-[#E0E0E0] bg-white hover:bg-[#F5F5F5] rounded-lg transition-colors disabled:opacity-50">
                  {clearStaleMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Clear Stale
                </button>
                <Button onClick={() => { if (confirm("Clear all active AI actions?")) clearAllMutation.mutate(); }} disabled={clearAllMutation.isPending}
                  variant="outline" className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-[#E0E0E0] text-[#666] hover:text-red-600 hover:border-red-200">
                  {clearAllMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Clear All
                </Button>
              </>
            )}
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}
              className="flex items-center gap-2 bg-[#F5C72C] hover:bg-[#E6B800] text-[#111] font-semibold text-sm px-4 py-2 rounded-lg border-0">
              {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncMutation.isPending ? "Syncing…" : "Sync Now"}
            </Button>
            {view === "active" && (
              <Button onClick={() => setAsanaModalOpen(true)} variant="outline"
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-[#F06A35]/40 text-[#F06A35] hover:bg-[#F06A35]/10">
                <ListPlus className="w-4 h-4" />Add to Asana
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="h-11 flex border-b border-[#E0E0E0] -mx-6 px-6">
        {(["actions", "insights"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 text-sm capitalize transition-all duration-200 border-b-2 ${
              tab === t ? "text-[#111] font-semibold border-[#F5C72C]" : "text-[#888] font-normal border-transparent hover:text-[#111]"
            }`}>
            {t === "actions" ? "Actions" : "Insights"}
          </button>
        ))}
      </div>

      {/* Tab: Actions */}
      {tab === "actions" && (
        <>
          {/* Summary counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Auto-Executed",     value: autoExecuted.length,   icon: Zap,   color: "text-[#F5C72C]", bg: "bg-[#F5C72C]/10" },
              { label: "Awaiting Approval", value: pendingApproval.length, icon: Clock, color: "text-[#F5C72C]", bg: "bg-[#F5C72C]/10" },
              { label: "Monitoring",        value: monitoring.length,      icon: Eye,   color: "text-[#666]",    bg: "bg-[#F5F5F5]" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white border border-[#E0E0E0] rounded-xl p-4 flex items-center gap-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${color}`} /></div>
                <div>
                  <div className="text-2xl font-bold text-[#111] tracking-tight">{value}</div>
                  <div className="text-xs text-[#888]">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Active / Archive toggle */}
          <div className="flex items-center">
            <div className="flex items-center bg-white border border-[#E0E0E0] rounded-lg p-1">
              {(["active", "archive"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === v ? "bg-[#111] text-white" : "text-[#666] hover:text-[#111]"
                  }`}>
                  {v === "active" ? <><Zap className="w-3.5 h-3.5" /> Active</> : (
                    <><Archive className="w-3.5 h-3.5" /> Archive
                      {archivedActions.length > 0 && <span className="ml-1 text-xs opacity-70">{archivedActions.length}</span>}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {view === "archive" ? (
            <div className="space-y-4">
              <SectionHeader icon={Archive} iconBg="bg-gray-100" iconColor="text-[#666]"
                title="Archived Actions" count={archivedActions.length}
                subtitle="Historical actions — older entries and duplicates moved here automatically" />
              {isArchiveLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#F5C72C]" /><span className="ml-2 text-[#666] text-sm">Loading archive…</span></div>
              ) : archivedActions.length === 0 ? (
                <div className="text-center py-16 text-[#999]"><Archive className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm font-medium">Archive is empty</p></div>
              ) : (
                <div className="space-y-3">
                  {(archivedActions as unknown as AutonomousAction[]).map(action => (
                    <div key={action.id} className="bg-white border border-[#E8E8E8] rounded-xl p-4 opacity-75">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={action.status} />
                          {action.campaignName && <span className="text-xs font-mono bg-[#F5F5F5] text-[#555] px-2 py-0.5 rounded border border-[#E8E8E8]">{action.campaignName}</span>}
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
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#F5C72C]" /><span className="ml-2 text-[#666] text-sm">Loading actions…</span></div>
          ) : (
            <div className="space-y-10">
              {pendingApproval.length > 0 && (
                <section>
                  <SectionHeader icon={Clock} iconBg="bg-[#F5C72C]/10" iconColor="text-[#F5C72C]"
                    title="Awaiting Your Approval" count={pendingApproval.length}
                    subtitle="Medium-to-high risk actions that require your sign-off before execution" />
                  <div className="space-y-3">
                    {pendingApproval.map(a => (
                      <ActionCard key={a.id} action={a} section="approval"
                        onApprove={id => approveMutation.mutate({ actionId: id })}
                        onReject={id => rejectMutation.mutate({ actionId: id })}
                        onDismiss={id => dismissMutation.mutate({ actionId: id })}
                        isLoading={isAnyMutating} />
                    ))}
                  </div>
                </section>
              )}
              {autoExecuted.length > 0 && (
                <section>
                  <SectionHeader icon={Zap} iconBg="bg-[#F5C72C]/10" iconColor="text-[#8B6E00]"
                    title="Auto-Executed" count={autoExecuted.length}
                    subtitle="Low-risk optimizations applied automatically — undo any within 24 hours" />
                  <div className="space-y-3">
                    {autoExecuted.map(a => (
                      <ActionCard key={a.id} action={a} section="auto"
                        onUndo={id => undoMutation.mutate({ actionId: id })}
                        onDismiss={id => dismissMutation.mutate({ actionId: id })}
                        isLoading={isAnyMutating} />
                    ))}
                  </div>
                </section>
              )}
              {monitoring.length > 0 && (
                <section>
                  <SectionHeader icon={TrendingUp} iconBg="bg-[#F5F5F5]" iconColor="text-[#666]"
                    title="Monitoring" count={monitoring.length}
                    subtitle="Items being tracked — insufficient data for action or awaiting next sync" />
                  <div className="space-y-3">
                    {monitoring.slice(0, 10).map(a => (
                      <ActionCard key={a.id} action={a} section="monitoring"
                        onDismiss={id => dismissMutation.mutate({ actionId: id })}
                        isLoading={isAnyMutating} />
                    ))}
                    {monitoring.length > 10 && <p className="text-xs text-[#999] text-center py-2">+ {monitoring.length - 10} more monitoring items</p>}
                  </div>
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
        </>
      )}

      {/* Tab: Insights */}
      {tab === "insights" && (
        <InsightsTab
          actions={allActions}
          archived={archivedActions as unknown as AutonomousAction[]}
          syncStatus={syncStatus as Record<string, SyncStatusEntry> | null | undefined}
          isSyncStatusLoading={isSyncStatusLoading}
        />
      )}

      {asanaModalOpen && (
        <AsanaTaskModal isOpen={asanaModalOpen} onClose={() => setAsanaModalOpen(false)} title="Add Action Plan to Asana" />
      )}
    </div>
  );
}
