import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Zap, Clock, Eye, CheckCircle, XCircle, RotateCcw,
  RefreshCw, ChevronDown, ChevronUp, AlertTriangle,
  TrendingUp, Loader2, Trash2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ActionStatus = "auto_executed" | "pending_approval" | "monitoring" | "approved" | "rejected" | "undone" | "dismissed" | "execution_failed";

interface AutonomousAction {
  id: number;
  campaignId?: number | string | null;
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
  const hasMetaAdsError = action.errorMessage && action.errorMessage.includes("Meta Ads");
  const displayText = action.title || action.description;
  const detailText = action.title ? action.description : null;

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 space-y-3 hover:border-[#F5C72C]/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <RiskBadge level={action.riskLevel} />
            <span className="text-xs text-[#888] bg-[#F5F5F5] px-2 py-0.5 rounded font-mono">
              {action.actionType.replace(/_/g, " ")}
            </span>
            {action.campaignName && (
              <span className="text-xs text-[#666] bg-[#F5F5F5] px-2 py-0.5 rounded">{action.campaignName}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#111]">{displayText}</p>
          {detailText && <p className="text-xs text-[#666] mt-0.5">{detailText}</p>}
          {action.expectedImpact && (
            <p className="text-xs text-[#8B6E00] bg-[#F5C72C]/5 border border-[#F5C72C]/20 px-2 py-1 rounded mt-1.5">
              Expected: {action.expectedImpact}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {section === "approval" && (
            <>
              {onApprove && (
                <button onClick={() => onApprove(action.id)} disabled={isLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded text-xs font-medium transition-colors disabled:opacity-50">
                  {isLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Approve
                </button>
              )}
              {onReject && (
                <button onClick={() => onReject(action.id)} disabled={isLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded text-xs font-medium transition-colors disabled:opacity-50">
                  <XCircle size={12} /> Reject
                </button>
              )}
            </>
          )}
          {section === "auto" && onUndo && (
            <button onClick={() => onUndo(action.id)} disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F5F5F5] text-[#555] hover:bg-[#EBEBEB] border border-[#E0E0E0] rounded text-xs font-medium transition-colors disabled:opacity-50">
              <RotateCcw size={12} /> Undo
            </button>
          )}
          {section === "monitoring" && onDismiss && (
            <button onClick={() => onDismiss(action.id)} disabled={isLoading}
              className="p-1.5 text-[#999] hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Dismiss">
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-[#999] hover:text-[#111] hover:bg-[#F5F5F5] rounded transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {(action.previousValue || action.newValue) && (
        <div className="flex items-center gap-2 text-xs">
          {action.previousValue && <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-mono">{action.previousValue}</span>}
          {action.previousValue && action.newValue && <TrendingUp size={12} className="text-[#999]" />}
          {action.newValue && <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded font-mono">{action.newValue}</span>}
        </div>
      )}

      {hasMetaAdsError && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-amber-700 font-medium">Meta Ads API Error — </span>
            <span className="text-[#666]">Apply manually in </span>
            <a href="https://www.facebook.com/adsmanager" target="_blank" rel="noopener noreferrer"
              className="text-amber-700 hover:underline inline-flex items-center gap-0.5">
              Meta Ads Manager <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

      {expanded && (
        <div className="pt-2 border-t border-[#F0F0F0] space-y-2">
          {action.reasoning && (
            <div>
              <div className="text-xs font-semibold text-[#888] mb-1">Reasoning</div>
              <p className="text-xs text-[#555] leading-relaxed">{action.reasoning}</p>
            </div>
          )}
          {action.confidence != null && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#888]">Confidence:</span>
              <span className="px-2 py-0.5 bg-[#F5C72C]/10 text-[#8B6E00] border border-[#F5C72C]/30 rounded font-mono text-xs">{action.confidence}%</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-[#999]">
            <span>{action.executedAt ? `Executed: ${new Date(action.executedAt as any).toLocaleString()}` : action.createdAt ? `Created: ${new Date(action.createdAt).toLocaleString()}` : ""}</span>
            {action.reviewedBy && <span>Reviewed by: {action.reviewedBy}</span>}
          </div>
        </div>
      )}
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
    onError: (err) => toast.error(`Sync failed: ${err.message}`),
  });

  const approveMutation = trpc.autonomous.approveAction.useMutation({
    onSuccess: () => { toast.success("Action approved"); utils.autonomous.getApprovalCards.invalidate(); utils.autonomous.getAutoExecuted.invalidate(); setActionLoading(null); },
    onError: (err) => { toast.error(`Approval failed: ${err.message}`); setActionLoading(null); },
  });
  const rejectMutation = trpc.autonomous.rejectAction.useMutation({
    onSuccess: () => { toast.success("Action rejected"); utils.autonomous.getApprovalCards.invalidate(); setActionLoading(null); },
    onError: (err) => { toast.error(`Rejection failed: ${err.message}`); setActionLoading(null); },
  });
  const undoMutation = trpc.autonomous.undoAction.useMutation({
    onSuccess: () => { toast.success("Action undone"); utils.autonomous.getAutoExecuted.invalidate(); setActionLoading(null); },
    onError: (err) => { toast.error(`Undo failed: ${err.message}`); setActionLoading(null); },
  });
  const dismissMutation = trpc.autonomous.dismissAction.useMutation({
    onSuccess: () => { toast.success("Dismissed"); utils.autonomous.getMonitoring.invalidate(); setActionLoading(null); },
    onError: (err) => { toast.error(`Dismiss failed: ${err.message}`); setActionLoading(null); },
  });

  const handleApprove = (id: number) => { setActionLoading(id); approveMutation.mutate({ actionId: id }); };
  const handleReject = (id: number) => { setActionLoading(id); rejectMutation.mutate({ actionId: id }); };
  const handleUndo = (id: number) => { setActionLoading(id); undoMutation.mutate({ actionId: id }); };
  const handleDismiss = (id: number) => { setActionLoading(id); dismissMutation.mutate({ actionId: id }); };
  const isLoading = autoLoading || approvalLoading || monitoringLoading;

  return (
    <div className="p-6 space-y-6 bg-[#FAFAFA] min-h-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">AI Analysis</h1>
          <p className="text-sm text-[#666] mt-1">Autonomous decision engine — analyzes campaigns and takes action</p>
        </div>
        <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}
          className="flex items-center gap-2 bg-[#F5C72C] hover:bg-[#E6B800] text-[#111] font-semibold text-sm px-4 py-2 rounded-lg border-0">
          {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {syncMutation.isPending ? "Syncing…" : "Sync Now"}
        </Button>
      </div>

      {syncStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(syncStatus).map(([key, status]: [string, any]) => (
            <div key={key} className="bg-white border border-[#E0E0E0] rounded-xl p-3">
              <div className="text-xs text-[#888] capitalize mb-1">{key.replace(/([A-Z])/g, " $1").trim()}</div>
              <div className={`text-xs font-semibold ${status?.status === "ok" ? "text-green-600" : status?.status === "error" ? "text-red-600" : "text-yellow-600"}`}>
                {status?.status || "unknown"}
              </div>
              {status?.lastSync && <div className="text-xs text-[#AAAAAA] mt-0.5">{new Date(status.lastSync).toLocaleTimeString()}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Auto-Executed", value: autoExecuted.length, icon: Zap, color: "text-[#8B6E00]", bg: "bg-[#F5C72C]/10" },
          { label: "Awaiting Approval", value: approvalCards.length, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Monitoring", value: monitoring.length, icon: Eye, color: "text-[#666]", bg: "bg-[#F5F5F5]" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-[#E0E0E0] rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${color}`} /></div>
            <div><div className="text-2xl font-bold text-[#111]">{value}</div><div className="text-xs text-[#888]">{label}</div></div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#F5C72C]" /><span className="ml-2 text-[#666] text-sm">Loading actions…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#F5C72C]/10 flex items-center justify-center"><Zap className="w-4 h-4 text-[#8B6E00]" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[#111]">Auto-Executed</h2>
                  <span className="text-xs bg-[#F5F5F5] border border-[#E0E0E0] text-[#666] px-2 py-0.5 rounded-full">{autoExecuted.length}</span>
                </div>
                <p className="text-xs text-[#888]">Low-risk actions applied automatically</p>
              </div>
            </div>
            <div className="space-y-3">
              {autoExecuted.length === 0 ? (
                <div className="text-center py-8 text-sm text-[#999] border border-dashed border-[#E0E0E0] rounded-xl bg-white">No auto-executed actions</div>
              ) : autoExecuted.map((action: any) => (
                <ActionCard key={action.id} action={action as unknown as AutonomousAction} section="auto" onUndo={handleUndo} isLoading={actionLoading === action.id} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Clock className="w-4 h-4 text-blue-600" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[#111]">Awaiting Approval</h2>
                  <span className="text-xs bg-[#F5F5F5] border border-[#E0E0E0] text-[#666] px-2 py-0.5 rounded-full">{approvalCards.length}</span>
                </div>
                <p className="text-xs text-[#888]">Medium/high-risk actions needing review</p>
              </div>
            </div>
            <div className="space-y-3">
              {approvalCards.length === 0 ? (
                <div className="text-center py-8 text-sm text-[#999] border border-dashed border-[#E0E0E0] rounded-xl bg-white">No actions awaiting approval</div>
              ) : approvalCards.map((action: any) => (
                <ActionCard key={action.id} action={action as unknown as AutonomousAction} section="approval" onApprove={handleApprove} onReject={handleReject} isLoading={actionLoading === action.id} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] flex items-center justify-center"><Eye className="w-4 h-4 text-[#666]" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[#111]">Monitoring</h2>
                  <span className="text-xs bg-[#F5F5F5] border border-[#E0E0E0] text-[#666] px-2 py-0.5 rounded-full">{monitoring.length}</span>
                </div>
                <p className="text-xs text-[#888]">Campaigns with insufficient data</p>
              </div>
            </div>
            <div className="space-y-3">
              {monitoring.length === 0 ? (
                <div className="text-center py-8 text-sm text-[#999] border border-dashed border-[#E0E0E0] rounded-xl bg-white">No campaigns being monitored</div>
              ) : monitoring.map((action: any) => (
                <ActionCard key={action.id} action={action as unknown as AutonomousAction} section="monitoring" onDismiss={handleDismiss} isLoading={actionLoading === action.id} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
