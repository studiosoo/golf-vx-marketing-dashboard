import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Zap, Clock, Eye, CheckCircle, XCircle, RotateCcw, RefreshCw,
  ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Loader2,
  Trash2, Archive, ListPlus, ExternalLink, Activity,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
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
    low:    "bg-[#72B84A]/10 text-[#72B84A] border border-[#72B84A]/30",
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
  auto_executed:    { label: "Auto-Executed",     cls: "bg-[#F2DD48]/10 text-[#8B6E00] border border-[#F2DD48]/40" },
  pending_approval: { label: "Awaiting Approval", cls: "bg-[#F2DD48]/10 text-[#222222] border border-[#F2DD48]/40" },
  monitoring:       { label: "Monitoring",        cls: "bg-gray-50 text-gray-600 border border-gray-200" },
  approved:         { label: "Approved",          cls: "bg-[#72B84A]/10 text-[#72B84A] border border-[#72B84A]/30" },
  rejected:         { label: "Rejected",          cls: "bg-red-50 text-red-700 border border-red-200" },
  undone:           { label: "Undone",            cls: "bg-gray-50 text-gray-500 border border-gray-200" },
  dismissed:        { label: "Dismissed",         cls: "bg-gray-50 text-[#6F6F6B] border border-gray-200" },
  execution_failed: { label: "Failed",            cls: "bg-red-50 text-red-600 border border-red-200" },
  archived:         { label: "Archived",          cls: "bg-gray-50 text-[#6F6F6B] border border-gray-200" },
};

function StatusBadge({ status }: { status: ActionStatus }) {
  const { label, cls } = STATUS_MAP[status] ?? STATUS_MAP.monitoring;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

// Campaign accent colors for approval section
const CAMPAIGN_ACCENT: Record<string, string> = {
  trial_conversion:       "#72B84A",
  membership_acquisition: "#4E8DF4",
  member_retention:       "#A87FBE",
  corporate_events:       "#D89A3C",
};

const RISK_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

// ─── BC FIX A — Action type classification ────────────────────────────────────

type AutopilotActionType = "execute_immediately" | "requires_input" | "informational";

function getUiActionType(action: AutonomousAction, section: string): AutopilotActionType {
  if (section === "monitoring") return "informational";
  if (section !== "approval")   return "informational";
  // pending_approval: classify by available values
  if (action.previousValue != null && action.newValue != null) return "execute_immediately";
  if (action.previousValue != null || action.newValue != null) return "requires_input";
  return "informational";
}

// ─── BC FIX B — Dedup + auto-archive display filter ──────────────────────────

function cleanAutopilotItems(items: AutonomousAction[]): AutonomousAction[] {
  // 1) Remove already-archived items
  // 2) Dedup: same campaignId + actionType, keep first occurrence (already sorted by risk/date)
  const seen = new Set<string>();
  return items
    .filter(item => item.status !== "archived")
    .filter(item => {
      const key = `${String(item.campaignId ?? "none")}::${item.actionType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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
  const [inputValue, setInputValue] = useState(action.newValue ?? "");
  const uiActionType = getUiActionType(action, section);
  const hasMetaError = action.errorMessage?.includes("Meta Ads");
  const displayText = action.title ?? action.description;
  const detailText = action.title ? action.description : null;
  const formattedDate = new Date(action.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const accentColor = section === "approval" && action.campaignId
    ? (CAMPAIGN_ACCENT[String(action.campaignId)] ?? null)
    : null;

  return (
    <div
      className="bg-white border border-[#DEDEDA] rounded-xl p-4 space-y-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:border-[#DEDEDA] transition-colors"
      style={accentColor ? { borderLeftColor: accentColor, borderLeftWidth: "3px" } : {}}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <StatusBadge status={action.status} />
            <RiskBadge level={action.riskLevel || "medium"} />
            <span className="text-xs text-[#6F6F6B] bg-[#F1F1EF] px-2 py-0.5 rounded font-mono">
              {action.actionType.replace(/_/g, " ")}
            </span>
            {action.campaignName && (
              <span className="text-xs text-[#6F6F6B] bg-[#F1F1EF] px-2 py-0.5 rounded">{action.campaignName}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#111] leading-snug">{displayText}</p>
          {detailText && <p className="text-xs text-[#6F6F6B] mt-0.5">{detailText}</p>}
          {section === "approval" && (
            <p className="text-[11px] text-[#A8A8A3] mt-0.5">
              {[action.campaignName, formattedDate].filter(Boolean).join(" · ")}
            </p>
          )}
          {action.expectedImpact && (
            <p className="text-xs text-[#8B6E00] bg-[#F2DD48]/5 border border-[#F2DD48]/20 px-2 py-1 rounded mt-1.5">
              Expected: {action.expectedImpact}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {section === "approval" && uiActionType === "execute_immediately" && (
            <>
              <button onClick={() => onApprove?.(action.id)} disabled={isLoading}
                className="flex items-center gap-1 h-6 px-2 bg-[#72B84A]/10 text-[#72B84A] hover:bg-[#72B84A]/20 border border-[#72B84A]/30 rounded text-xs font-medium transition-colors disabled:opacity-50">
                <CheckCircle className="w-3 h-3" />Confirm & Execute
              </button>
              <button onClick={() => onDismiss?.(action.id)} disabled={isLoading}
                className="flex items-center gap-1 h-6 px-2 bg-[#F1F1EF] text-[#6F6F6B] hover:bg-[#E8E8E5] border border-[#DEDEDA] rounded text-xs font-medium transition-colors disabled:opacity-50">
                Dismiss
              </button>
            </>
          )}
          {section === "approval" && uiActionType === "requires_input" && (
            <>
              <button onClick={() => onApprove?.(action.id)} disabled={isLoading}
                className="flex items-center gap-1 h-6 px-2 bg-[#4E8DF4]/10 text-[#2F6CD4] hover:bg-[#4E8DF4]/20 border border-[#4E8DF4]/30 rounded text-xs font-medium transition-colors disabled:opacity-50">
                <CheckCircle className="w-3 h-3" />Review & Confirm
              </button>
              <button onClick={() => onDismiss?.(action.id)} disabled={isLoading}
                className="flex items-center gap-1 h-6 px-2 bg-[#F1F1EF] text-[#6F6F6B] hover:bg-[#E8E8E5] border border-[#DEDEDA] rounded text-xs font-medium transition-colors disabled:opacity-50">
                Dismiss
              </button>
            </>
          )}
          {section === "approval" && uiActionType === "informational" && (
            <>
              <button onClick={() => onDismiss?.(action.id)} disabled={isLoading}
                className="flex items-center gap-1 h-6 px-2 bg-[#F1F1EF] text-[#6F6F6B] hover:bg-[#E8E8E5] border border-[#DEDEDA] rounded text-xs font-medium transition-colors disabled:opacity-50">
                <Archive className="w-3 h-3" />Archive
              </button>
              <button disabled
                className="flex items-center gap-1 h-6 px-2 bg-transparent text-[#A8A8A3] border border-[#DEDEDA] rounded text-xs font-medium cursor-default">
                Keep Monitoring
              </button>
            </>
          )}
          {section === "auto" && (action.status === "auto_executed" || action.status === "approved") && (
            <button onClick={() => onUndo?.(action.id)} disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F1F1EF] text-[#6F6F6B] hover:bg-[#EBEBEB] border border-[#DEDEDA] rounded text-xs font-medium transition-colors disabled:opacity-50">
              <RotateCcw className="w-3.5 h-3.5" />Undo
            </button>
          )}
          <button onClick={() => onDismiss?.(action.id)} disabled={isLoading}
            className="p-1.5 text-[#999] hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Dismiss">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(e => !e)}
            className="p-1.5 text-[#999] hover:text-[#111] hover:bg-[#F1F1EF] rounded transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {(action.previousValue || action.newValue) && (
        <div className="flex items-center gap-2 text-xs">
          {action.previousValue && <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-mono">{action.previousValue}</span>}
          {action.previousValue && action.newValue && <TrendingUp className="w-3 h-3 text-[#999]" />}
          {action.newValue && <span className="px-2 py-1 bg-[#72B84A]/10 text-[#72B84A] border border-[#72B84A]/30 rounded font-mono">{action.newValue}</span>}
        </div>
      )}

      {section === "approval" && uiActionType === "requires_input" && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6F6F6B]">Recommended value:</span>
          <input
            type="number"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Enter value"
            className="w-28 h-6 px-2 text-xs border border-[#DEDEDA] rounded bg-white text-[#222222] focus:outline-none focus:border-[#4E8DF4]"
          />
        </div>
      )}

      {action.status === "execution_failed" && !hasMetaError && (
        <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>Execution failed — check sync logs for details</span>
        </div>
      )}

      {hasMetaError && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-[#F2DD48] flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-amber-700 font-medium">Meta Ads API Error — </span>
            <span className="text-[#6F6F6B]">Apply manually in </span>
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
              <p className="text-xs font-medium text-[#6F6F6B] uppercase tracking-wide mb-1">Reasoning</p>
              <p className="text-xs text-[#6F6F6B] leading-relaxed">{action.reasoning}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-[#6F6F6B] uppercase tracking-wide mb-1">Expected Impact</p>
            <p className="text-xs text-[#444] leading-relaxed">{action.expectedImpact ?? action.description}</p>
          </div>
          {action.confidence != null && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6F6F6B]">Confidence:</span>
              <span className="px-2 py-0.5 bg-[#F2DD48]/10 text-[#8B6E00] border border-[#F2DD48]/30 rounded font-mono">{action.confidence}%</span>
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-[#999]">
            <span>Type: <span className="text-[#6F6F6B]">{action.actionType}</span></span>
            <span>Created: <span className="text-[#6F6F6B]">{formattedDate}</span></span>
            {action.reviewedBy && <span>Reviewed by: <span className="text-[#6F6F6B]">{action.reviewedBy}</span></span>}
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
          <span className="text-xs bg-[#F1F1EF] border border-[#DEDEDA] text-[#6F6F6B] px-2 py-0.5 rounded-full font-medium">{count}</span>
        </div>
        <p className="text-xs text-[#6F6F6B]">{subtitle}</p>
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
          { label: "Awaiting Approval", value: pending.length,      color: "text-[#6F6F6B]" },
          { label: "Rejected",          value: rejected.length,     color: "text-red-600" },
          { label: "Dismissed",         value: dismissed.length,    color: "text-[#999]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-[#DEDEDA] rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className={`text-2xl font-bold tracking-tight ${color}`}>{value}</div>
            <div className="text-xs text-[#6F6F6B] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[#DEDEDA] rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold text-[#111] mb-3">Risk Distribution</h3>
          {Object.keys(riskCounts).length === 0 ? (
            <p className="text-xs text-[#999]">No active actions</p>
          ) : (
            <div className="space-y-2.5">
              {(["low", "medium", "high"] as const).map(level => {
                const count = riskCounts[level] ?? 0;
                const pct = Math.round((count / activeTotal) * 100);
                const bar = level === "low" ? "bg-[#72B84A]" : level === "high" ? "bg-red-500" : "bg-yellow-400";
                return (
                  <div key={level}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#6F6F6B] capitalize">{level} risk</span>
                      <span className="text-[#6F6F6B] font-mono">{count}</span>
                    </div>
                    <div className="h-1.5 bg-[#F1F1EF] rounded-full overflow-hidden">
                      <div className={`h-full ${bar} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#DEDEDA] rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold text-[#111] mb-3">Engine Overview</h3>
          <div className="space-y-0">
            {[
              { label: "Active actions",    value: String(actions.length) },
              { label: "Archived total",    value: String(archived.length) },
              { label: "Monitoring queue",  value: String(monitoring.length) },
              { label: "Auto-execute rate", value: `${Math.round((autoExecuted.length / decisionTotal) * 100)}%` },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className={`flex items-center justify-between py-1.5 text-xs ${i < arr.length - 1 ? "border-b border-[#F1F1EF]" : ""}`}>
                <span className="text-[#6F6F6B]">{label}</span>
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
            <div className="flex items-center gap-2 text-[#6F6F6B] text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(syncStatus).map(([key, entry]) => {
                const color = entry?.status === "ok" ? "text-[#72B84A]" : entry?.status === "error" ? "text-red-600" : "text-yellow-600";
                return (
                  <div key={key} className="bg-white border border-[#DEDEDA] rounded-xl p-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                    <div className="text-xs text-[#6F6F6B] capitalize mb-1">{key.replace(/([A-Z])/g, " $1").trim()}</div>
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

export default function Autopilot() {
  const [view, setView] = useState<"active" | "archive">("active");
  const [asanaModalOpen, setAsanaModalOpen] = useState(false);
  const [showAllApproval, setShowAllApproval] = useState(false);
  const [showAllAutoExecuted, setShowAllAutoExecuted] = useState(false);
  const APPROVAL_LIMIT = 5;

  const utils = trpc.useUtils();
  const { data: actions, isLoading, refetch } = trpc.autonomous.getAllActions.useQuery(undefined, { refetchInterval: 60_000 });
  const { data: archivedActions = [], isLoading: isArchiveLoading } = trpc.autonomous.getArchivedActions.useQuery(undefined, { enabled: view === "archive" });

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
  const rawActions  = (actions ?? []) as unknown as AutonomousAction[];
  const allActions  = cleanAutopilotItems(rawActions);

  const pendingApproval = allActions.filter(a => a.status === "pending_approval");
  const sortedPendingApproval = [...pendingApproval].sort((a, b) => {
    const ra = RISK_ORDER[a.riskLevel] ?? 1;
    const rb = RISK_ORDER[b.riskLevel] ?? 1;
    if (ra !== rb) return ra - rb;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  const visibleApprovals = showAllApproval ? sortedPendingApproval : sortedPendingApproval.slice(0, APPROVAL_LIMIT);

  const autoExecuted = allActions.filter(a => a.status === "auto_executed" || a.status === "approved");
  // BC FIX B: cap at 3 items, 1 per campaign (newest first)
  const cappedAutoExecuted = autoExecuted
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((item, idx, arr) => {
      const first = arr.findIndex(i => String(i.campaignId) === String(item.campaignId));
      return first === idx;
    })
    .slice(0, 3);
  const visibleAutoExecuted = showAllAutoExecuted ? autoExecuted : cappedAutoExecuted;

  const monitoring      = allActions.filter(a => a.status === "monitoring");
  const lastSync = allActions[0]?.createdAt
    ? new Date(allActions[0].createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="p-8 space-y-6 bg-[#F6F6F4] min-h-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: title + inline stats */}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[20px] font-semibold text-[#222222] leading-tight">Autopilot</h1>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
              !isLoading && allActions.length > 0
                ? "bg-[#72B84A]/10 text-[#72B84A] border-[#72B84A]/30"
                : "bg-[#F1F1EF] text-[#A8A8A3] border-[#DEDEDA]"
            }`}>
              <Activity className="w-3 h-3" />
              {!isLoading && allActions.length > 0 ? "Engine running" : "Engine idle"}
            </span>
          </div>

          {/* Stat row — inline with dividers */}
          <div className="flex items-center gap-0 mt-3">
            {[
              { value: autoExecuted.length,    label: "Executed" },
              { value: pendingApproval.length, label: "Awaiting Approval" },
              { value: monitoring.length,      label: "Monitoring" },
            ].map(({ value, label }, i) => (
              <div key={label} className="flex items-center">
                {i > 0 && <div className="w-px h-7 bg-[#DEDEDA] mx-3" />}
                <div>
                  <div className="text-[18px] font-bold text-[#222222] leading-none">{value}</div>
                  <div className="text-[11px] text-[#6F6F6B] uppercase tracking-[0.05em] mt-0.5">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {lastSync && (
            <p className="text-[12px] text-[#A8A8A3] mt-2">Last sync {lastSync}</p>
          )}
        </div>

        {/* Right: action buttons — all h-8, px-2 py-1.5 */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
            {view === "active" && (
              <>
                {/* Clear Stale — ghost/text */}
                <button
                  onClick={() => { if (confirm("Dismiss pending actions older than 3 days?")) clearStaleMutation.mutate(); }}
                  disabled={clearStaleMutation.isPending}
                  className="flex items-center gap-1.5 h-8 px-2 text-[13px] text-[#6F6F6B] hover:text-[#222222] transition-colors disabled:opacity-50 rounded"
                >
                  {clearStaleMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Clear Stale
                </button>
                {/* Clear All — ghost/text */}
                <button
                  onClick={() => { if (confirm("Clear all active AI actions?")) clearAllMutation.mutate(); }}
                  disabled={clearAllMutation.isPending}
                  className="flex items-center gap-1.5 h-8 px-2 text-[13px] text-[#6F6F6B] hover:text-[#222222] transition-colors disabled:opacity-50 rounded"
                >
                  {clearAllMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Clear All
                </button>
              </>
            )}
            {/* Sync Now — outlined, no yellow fill */}
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="flex items-center gap-1.5 h-8 px-2 text-[13px] font-medium text-[#222222] border border-[#DEDEDA] bg-transparent hover:bg-[#F1F1EF] hover:border-[#6F6F6B] rounded transition-colors disabled:opacity-50"
            >
              {syncMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {syncMutation.isPending ? "Syncing…" : "Sync Now"}
            </button>
            {/* Add Action Plan to Asana — yellow outlined, no fill */}
            {view === "active" && (
              <button
                onClick={() => setAsanaModalOpen(true)}
                className="flex items-center gap-1.5 h-8 px-2 text-[13px] font-medium text-[#B8A000] border border-[#F2DD48] bg-transparent hover:bg-[rgba(242,221,72,0.08)] rounded transition-colors"
              >
                <ListPlus className="w-3.5 h-3.5" />
                Add Action Plan to Asana
              </button>
            )}
          </div>
      </div>

      {/* Active / Archive toggle — underline style */}
          <div className="flex border-b border-[#DEDEDA]">
            {(["active", "archive"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-4 h-9 text-sm transition-all duration-200 border-b-2 -mb-px ${
                  view === v
                    ? "text-[#222222] font-semibold border-[#F2DD48]"
                    : "text-[#6F6F6B] font-normal border-transparent hover:text-[#222222]"
                }`}>
                {v === "active" ? "Active" : (
                  <>Archive
                    {archivedActions.length > 0 && (
                      <span className="ml-1.5 text-[11px] bg-[#F1F1EF] text-[#6F6F6B] px-1.5 py-0.5 rounded-full leading-none">
                        {archivedActions.length}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>

          {view === "archive" ? (
            <div className="space-y-4">
              <SectionHeader icon={Archive} iconBg="bg-gray-100" iconColor="text-[#6F6F6B]"
                title="Archived Actions" count={archivedActions.length}
                subtitle="Historical actions — older entries and duplicates moved here automatically" />
              {isArchiveLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#F2DD48]" /><span className="ml-2 text-[#6F6F6B] text-sm">Loading archive…</span></div>
              ) : archivedActions.length === 0 ? (
                <EmptyState icon={<Archive size={24} />} message="Archive is empty." />
              ) : (
                <div className="space-y-3">
                  {(archivedActions as unknown as AutonomousAction[]).map(action => (
                    <div key={action.id} className="bg-white border border-[#E8E8E8] rounded-xl p-4 opacity-75">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={action.status} />
                          {action.campaignName && <span className="text-xs font-mono bg-[#F1F1EF] text-[#6F6F6B] px-2 py-0.5 rounded border border-[#E8E8E8]">{action.campaignName}</span>}
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
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#F2DD48]" /><span className="ml-2 text-[#6F6F6B] text-sm">Loading actions…</span></div>
          ) : (
            <div className="space-y-10">
              {pendingApproval.length > 0 && (
                <section>
                  <SectionHeader icon={Clock} iconBg="bg-[#60A5FA]/10" iconColor="text-[#60A5FA]"
                    title="Awaiting Your Approval" count={pendingApproval.length}
                    subtitle="Medium-to-high risk actions that require your sign-off before execution" />
                  <div className="space-y-3">
                    {visibleApprovals.map(a => (
                      <ActionCard key={a.id} action={a} section="approval"
                        onApprove={id => approveMutation.mutate({ actionId: id })}
                        onReject={id => rejectMutation.mutate({ actionId: id })}
                        onDismiss={id => dismissMutation.mutate({ actionId: id })}
                        isLoading={isAnyMutating} />
                    ))}
                    {sortedPendingApproval.length > APPROVAL_LIMIT && (
                      <button
                        onClick={() => setShowAllApproval(v => !v)}
                        className="w-full text-center text-xs text-[#6F6F6B] hover:text-[#222222] py-2 border border-[#DEDEDA] rounded-lg bg-white transition-colors"
                      >
                        {showAllApproval
                          ? "Show less"
                          : `Show ${sortedPendingApproval.length - APPROVAL_LIMIT} more`}
                      </button>
                    )}
                  </div>
                </section>
              )}
              {autoExecuted.length > 0 && (
                <section>
                  <SectionHeader icon={Zap} iconBg="bg-[#4ADE80]/10" iconColor="text-[#4ADE80]"
                    title="Auto-Executed" count={autoExecuted.length}
                    subtitle="Low-risk optimizations applied automatically — undo any within 24 hours" />
                  <div className="space-y-3">
                    {visibleAutoExecuted.map(a => (
                      <ActionCard key={a.id} action={a} section="auto"
                        onUndo={id => undoMutation.mutate({ actionId: id })}
                        onDismiss={id => dismissMutation.mutate({ actionId: id })}
                        isLoading={isAnyMutating} />
                    ))}
                    {autoExecuted.length > cappedAutoExecuted.length && !showAllAutoExecuted && (
                      <button
                        onClick={() => setShowAllAutoExecuted(true)}
                        className="w-full text-center text-xs text-[#6F6F6B] hover:text-[#222222] py-2 border border-[#DEDEDA] rounded-lg bg-white transition-colors"
                      >
                        Show {autoExecuted.length - cappedAutoExecuted.length} more
                      </button>
                    )}
                    {showAllAutoExecuted && autoExecuted.length > cappedAutoExecuted.length && (
                      <button
                        onClick={() => setShowAllAutoExecuted(false)}
                        className="w-full text-center text-xs text-[#6F6F6B] hover:text-[#222222] py-2 border border-[#DEDEDA] rounded-lg bg-white transition-colors"
                      >
                        Show less
                      </button>
                    )}
                  </div>
                </section>
              )}
              {monitoring.length > 0 && (
                <section>
                  <SectionHeader icon={Eye} iconBg="bg-[#A78BFA]/10" iconColor="text-[#A78BFA]"
                    title="Monitoring" count={monitoring.length}
                    subtitle="Items being tracked — insufficient data for action or awaiting next sync" />
                  <div className="space-y-3">
                    {monitoring.slice(0, 4).map(a => (
                      <ActionCard key={a.id} action={a} section="monitoring"
                        onDismiss={id => dismissMutation.mutate({ actionId: id })}
                        isLoading={isAnyMutating} />
                    ))}
                    {monitoring.length > 4 && <p className="text-xs text-[#999] text-center py-2">+ {monitoring.length - 4} more items</p>}
                  </div>
                </section>
              )}
              {!pendingApproval.length && !autoExecuted.length && !monitoring.length && (
                <EmptyState icon={<Zap size={24} />} message='No actions yet. Click "Sync Now" to generate AI recommendations from live data.' />
              )}
            </div>
          )}

      {asanaModalOpen && (
        <AsanaTaskModal isOpen={asanaModalOpen} onClose={() => setAsanaModalOpen(false)} title="Add Action Plan to Asana" />
      )}
    </div>
  );
}
