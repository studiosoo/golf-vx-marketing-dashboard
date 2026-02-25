import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Sparkles, CheckCircle2, XCircle, RotateCcw, Loader2,
  AlertTriangle, TrendingUp, Eye, Zap, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const RISK_BADGE: Record<string, string> = {
  low: "bg-green-500/15 text-green-400 border-green-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  monitor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const STATUS_BADGE: Record<string, string> = {
  auto_executed: "bg-green-500/15 text-green-400 border-green-500/30",
  pending_approval: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  approved: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  undone: "bg-muted/60 text-muted-foreground border-border",
  monitoring: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  execution_failed: "bg-red-500/15 text-red-400 border-red-500/30",
};

const STATUS_LABEL: Record<string, string> = {
  auto_executed: "Auto-Executed",
  pending_approval: "Awaiting Approval",
  approved: "Approved",
  rejected: "Rejected",
  undone: "Undone",
  monitoring: "Monitoring",
  execution_failed: "Failed",
};

function fmtTime(ts: number | null | undefined) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

type Tab = "pending" | "executed" | "monitoring" | "history";

type AnyAction = {
  id: number;
  campaignName: string;
  actionType: string;
  riskLevel: string;
  status: string;
  title: string;
  description: string;
  confidence?: number | null;
  expectedImpact?: string | null;
  executedAt?: number | null;
  reviewedAt?: number | null;
  reviewedBy?: string | null;
  executionResult?: Record<string, unknown> | null;
  createdAt?: Date | string | null;
};

function ActionCard({
  action, onApprove, onUndo, isApproving, isUndoing, showApprove, showUndo,
}: {
  action: AnyAction;
  onApprove?: () => void;
  onUndo?: () => void;
  isApproving?: boolean;
  isUndoing?: boolean;
  showApprove?: boolean;
  showUndo?: boolean;
}) {
  const result = action.executionResult as { success?: boolean; error?: string } | null;
  return (
    <Card className={action.status === "pending_approval" ? "border-amber-500/30" : ""}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground font-medium">{action.campaignName}</span>
              <Badge variant="outline" className={`text-xs border ${RISK_BADGE[action.riskLevel] ?? ""}`}>
                {action.riskLevel.toUpperCase()}
              </Badge>
              <Badge variant="outline" className={`text-xs border ${STATUS_BADGE[action.status] ?? ""}`}>
                {STATUS_LABEL[action.status] ?? action.status}
              </Badge>
              {action.confidence != null && (
                <span className="text-xs text-muted-foreground">{action.confidence}% confidence</span>
              )}
            </div>
            <p className="font-semibold text-foreground text-sm leading-snug">{action.title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{action.description}</p>
            {action.expectedImpact && (
              <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />{action.expectedImpact}
              </p>
            )}
            {result && (
              <div className={`mt-2 text-xs flex items-center gap-1 ${result.success ? "text-green-400" : "text-red-400"}`}>
                {result.success
                  ? <><CheckCircle2 className="h-3 w-3" /> Executed successfully</>
                  : <><AlertTriangle className="h-3 w-3" /> {(result as any).error ?? "Execution failed"}</>}
              </div>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {action.executedAt && <span>Executed {fmtTime(action.executedAt)}</span>}
              {action.reviewedBy && <span>by {action.reviewedBy}</span>}
            </div>
          </div>
          {(showApprove || showUndo) && (
            <div className="flex flex-col gap-2 shrink-0">
              {showApprove && (
                <>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs gap-1" onClick={onApprove} disabled={isApproving}>
                    {isApproving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 px-3 text-xs gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10">
                    <XCircle className="h-3 w-3" />Dismiss
                  </Button>
                </>
              )}
              {showUndo && action.status === "auto_executed" && (
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs gap-1" onClick={onUndo} disabled={isUndoing}>
                  {isUndoing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}Undo
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground mt-1">Sync data to generate new AI actions</p>
      </CardContent>
    </Card>
  );
}

function AllHistory() {
  const { data: executed } = trpc.autonomous.getAutoExecuted.useQuery();
  const { data: pending } = trpc.autonomous.getApprovalCards.useQuery();
  const { data: monitoring } = trpc.autonomous.getMonitoring.useQuery();
  const all = [...(executed ?? []), ...(pending ?? []), ...(monitoring ?? [])].sort((a, b) => {
    const ta = a.executedAt ?? (a.createdAt ? new Date(a.createdAt as unknown as string).getTime() : 0);
    const tb = b.executedAt ?? (b.createdAt ? new Date(b.createdAt as unknown as string).getTime() : 0);
    return tb - ta;
  });
  if (!all.length) return <EmptyState message="No action history yet" />;
  return <div className="space-y-3">{all.map((a) => <ActionCard key={`${a.status}-${a.id}`} action={a} />)}</div>;
}

export default function Actions() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [undoingId, setUndoingId] = useState<number | null>(null);

  const { data: pendingActions, isLoading: pendingLoading } = trpc.autonomous.getApprovalCards.useQuery();
  const { data: executedActions, isLoading: execLoading } = trpc.autonomous.getAutoExecuted.useQuery();
  const { data: monitoringItems, isLoading: monLoading } = trpc.autonomous.getMonitoring.useQuery();
  const { data: syncStatus } = trpc.autonomous.getSyncStatus.useQuery();

  const approveMutation = trpc.autonomous.approveAction.useMutation({
    onSuccess: (result) => {
      utils.autonomous.getApprovalCards.invalidate();
      utils.autonomous.getAutoExecuted.invalidate();
      if (result.success) {
        toast.success("Action approved and executed successfully");
      } else {
        const errMsg = (result.executionResult as any)?.error
          ?? (result.executionResult as any)?.details
          ?? "Execution failed — check server logs";
        toast.error(`Execution failed: ${errMsg}`);
      }
      setApprovingId(null);
    },
    onError: (err) => { toast.error(err.message); setApprovingId(null); },
  });

  const undoMutation = trpc.autonomous.undoAction.useMutation({
    onSuccess: () => { utils.autonomous.getAutoExecuted.invalidate(); toast.success("Action undone"); setUndoingId(null); },
    onError: (err) => { toast.error(err.message); setUndoingId(null); },
  });

  const syncMutation = trpc.autonomous.syncAllData.useMutation({
    onSuccess: () => { utils.autonomous.invalidate(); toast.success("Synced — new actions may have been generated"); },
    onError: (err) => toast.error(err.message),
  });

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "pending", label: "Awaiting Approval", count: pendingActions?.length },
    { id: "executed", label: "Auto-Executed", count: executedActions?.length },
    { id: "monitoring", label: "Monitoring", count: monitoringItems?.length },
    { id: "history", label: "All History" },
  ];

  const lastSync = syncStatus?.[0]?.lastSyncAt ? fmtTime(syncStatus[0].lastSyncAt) : "Not synced yet";

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-400" />Actions
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Autonomous marketing decisions — approve, dismiss, or let the engine execute</p>
          </div>
          <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} variant="outline" size="sm" className="gap-2">
            <Zap className={`h-4 w-4 ${syncMutation.isPending ? "animate-pulse text-amber-400" : ""}`} />
            {syncMutation.isPending ? "Syncing…" : "Sync Now"}
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-2.5">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
          <span>Last sync: {lastSync}</span>
          <span className="text-border">·</span>
          <span>Auto-sync at 8:00 AM and 6:00 PM CST</span>
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Awaiting Approval", value: pendingActions?.length ?? 0, icon: Clock, color: "text-amber-400" },
            { label: "Auto-Executed", value: executedActions?.length ?? 0, icon: CheckCircle2, color: "text-green-400" },
            { label: "Monitoring", value: monitoringItems?.length ?? 0, icon: Eye, color: "text-blue-400" },
            { label: "Avg Confidence", value: `${Math.round((executedActions?.reduce((s, a) => s + (a.confidence ?? 0), 0) ?? 0) / Math.max(executedActions?.length ?? 1, 1))}%`, icon: TrendingUp, color: "text-primary" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <s.icon className={`h-5 w-5 ${s.color} shrink-0`} />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeTab === tab.id ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 text-xs bg-primary/20 text-primary rounded-full px-1.5 py-0.5">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "pending" && (
          <div className="space-y-3">
            {pendingLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              : !pendingActions?.length ? <EmptyState message="All clear — no actions awaiting approval" />
              : pendingActions.map((a) => (
                <ActionCard key={a.id} action={a} onApprove={() => { setApprovingId(a.id); approveMutation.mutate({ actionId: a.id }); }} isApproving={approvingId === a.id} showApprove />
              ))}
          </div>
        )}
        {activeTab === "executed" && (
          <div className="space-y-3">
            {execLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              : !executedActions?.length ? <EmptyState message="No auto-executed actions yet" />
              : executedActions.map((a) => (
                <ActionCard key={a.id} action={a} onUndo={() => { setUndoingId(a.id); undoMutation.mutate({ actionId: a.id }); }} isUndoing={undoingId === a.id} showUndo />
              ))}
          </div>
        )}
        {activeTab === "monitoring" && (
          <div className="space-y-3">
            {monLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              : !monitoringItems?.length ? <EmptyState message="No items under monitoring" />
              : monitoringItems.map((a) => <ActionCard key={a.id} action={a} />)}
          </div>
        )}
        {activeTab === "history" && <AllHistory />}
      </div>
    </DashboardLayout>
  );
}
