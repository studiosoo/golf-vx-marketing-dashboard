import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  Sparkles, CheckCircle2, XCircle, RotateCcw, Loader2,
  AlertTriangle, TrendingUp, Eye, Zap, Clock, Mail, ChevronDown, ChevronUp, Copy, Check, ExternalLink,
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
  actionParams?: Record<string, unknown> | null;
  createdAt?: Date | string | null;
};

type EmailDraft = {
  subject: string;
  preheader: string;
  emails: Array<{
    emailNumber: number;
    subject: string;
    preheader: string;
    body: string;
    callToAction: string;
    sendDelay: string;
  }>;
};

// ─── Email Draft Modal ────────────────────────────────────────────────────────
function EmailDraftModal({
  open,
  onClose,
  draft,
  campaignName,
}: {
  open: boolean;
  onClose: () => void;
  draft: EmailDraft;
  campaignName: string;
}) {
  const [expandedEmail, setExpandedEmail] = useState<number>(1);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Sequence Draft — {campaignName}
          </DialogTitle>
          <DialogDescription>
            AI-generated email sequence. Review, edit, and copy into Encharge or your email tool.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-3 mt-2">
          {draft.emails.map((email) => (
            <div key={email.emailNumber} className="border border-border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                onClick={() => setExpandedEmail(expandedEmail === email.emailNumber ? -1 : email.emailNumber)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{email.emailNumber}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{email.subject}</p>
                    <p className="text-xs text-muted-foreground">{email.sendDelay} · {email.callToAction}</p>
                  </div>
                </div>
                {expandedEmail === email.emailNumber
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {expandedEmail === email.emailNumber && (
                <div className="px-4 pb-4 space-y-3 border-t border-border">
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Subject Line</p>
                      <p className="text-sm font-medium">{email.subject}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Preview Text</p>
                      <p className="text-sm">{email.preheader}</p>
                    </div>
                  </div>

                  <div className="bg-muted/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground">Email Body</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => handleCopy(email.body, email.emailNumber)}
                      >
                        {copiedIdx === email.emailNumber
                          ? <><Check className="h-3 w-3 text-green-400" /> Copied</>
                          : <><Copy className="h-3 w-3" /> Copy</>}
                      </Button>
                    </div>
                    <div
                      className="text-sm text-foreground prose prose-sm max-w-none prose-invert"
                      dangerouslySetInnerHTML={{ __html: email.body.replace(/\n/g, '<br/>') }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      CTA: <span className="text-primary font-medium">{email.callToAction}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Send: <span className="font-medium text-foreground">{email.sendDelay}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Copy each email into Encharge's flow builder or email composer.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(
                draft.emails.map(e => `--- Email ${e.emailNumber} (${e.sendDelay}) ---\nSubject: ${e.subject}\nPreview: ${e.preheader}\n\n${e.body}\n\nCTA: ${e.callToAction}`).join('\n\n'),
                0
              )}
              className="gap-1"
            >
              {copiedIdx === 0 ? <><Check className="h-3 w-3 text-green-400" /> Copied All</> : <><Copy className="h-3 w-3" /> Copy All</>}
            </Button>
            <Button size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Action Card ──────────────────────────────────────────────────────────────
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
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [draftModalOpen, setDraftModalOpen] = useState(false);

  const isEmailAction = action.actionType === "send_email" ||
    action.title?.toLowerCase().includes("email") ||
    action.description?.toLowerCase().includes("email");

  const params = action.actionParams as Record<string, unknown> | null;

  const generateDraftMutation = trpc.campaigns.generateEmailDraft.useMutation({
    onSuccess: (result) => {
      if (result.success && result.draft) {
        setEmailDraft(result.draft as EmailDraft);
        setDraftModalOpen(true);
      } else {
        toast.error("Failed to generate email draft");
      }
    },
    onError: (err) => toast.error(`Draft generation failed: ${err.message}`),
  });

  const handleGenerateDraft = () => {
    generateDraftMutation.mutate({
      actionId: action.id,
      actionTitle: action.title,
      actionDescription: action.description,
      campaignName: action.campaignName,
      targetAudience: (params?.targetAudience as string) || undefined,
      emailType: (params?.emailType as string) || undefined,
      conversions: (params?.conversions as number) || undefined,
    });
  };

  const result = action.executionResult as { success?: boolean; error?: string } | null;

  return (
    <>
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
                <div className="mt-2">
                  {result.success ? (
                    <div className="text-xs flex items-center gap-1 text-green-400">
                      <CheckCircle2 className="h-3 w-3" /> Executed successfully
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs flex items-start gap-1 text-amber-400">
                        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                        <span>{(result as any).error ?? "Execution failed"}</span>
                      </div>
                      {(action.actionType === "budget_increase" || action.actionType === "budget_decrease") && (
                        <a
                          href="https://www.facebook.com/adsmanager"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
                        >
                          <ExternalLink className="h-3 w-3" /> Apply manually in Meta Ads Manager
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {action.executedAt && <span>Executed {fmtTime(action.executedAt)}</span>}
                {action.reviewedBy && <span>by {action.reviewedBy}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {/* Email Draft button — shown for all email-type actions */}
              {isEmailAction && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                  onClick={handleGenerateDraft}
                  disabled={generateDraftMutation.isPending}
                  title="Generate AI email draft sequence"
                >
                  {generateDraftMutation.isPending
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Mail className="h-3 w-3" />}
                  {generateDraftMutation.isPending ? "Drafting…" : "Draft Emails"}
                </Button>
              )}

              {showApprove && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs gap-1"
                    onClick={onApprove}
                    disabled={isApproving}
                  >
                    {isApproving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                  >
                    <XCircle className="h-3 w-3" />Dismiss
                  </Button>
                </>
              )}

              {showUndo && action.status === "auto_executed" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs gap-1"
                  onClick={onUndo}
                  disabled={isUndoing}
                >
                  {isUndoing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}Undo
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {emailDraft && (
        <EmailDraftModal
          open={draftModalOpen}
          onClose={() => setDraftModalOpen(false)}
          draft={emailDraft}
          campaignName={action.campaignName}
        />
      )}
    </>
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
            <p className="text-muted-foreground mt-1 text-sm">Autonomous marketing decisions — approve, dismiss, or generate email drafts</p>
          </div>
          <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} variant="outline" size="sm" className="gap-2">
            <Zap className={`h-4 w-4 ${syncMutation.isPending ? "animate-pulse text-amber-400" : ""}`} />
            {syncMutation.isPending ? "Syncing…" : "Sync Now"}
          </Button>
        </div>

        {/* Email workflow tip */}
        <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
          <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Email actions:</span> Click <span className="font-medium text-primary">Draft Emails</span> on any email action to generate a full AI-written sequence (subject, body, CTA) — then copy into Encharge or send directly. Click <span className="font-medium text-green-400">Approve</span> to trigger the Encharge tag and activate your pre-built flow.
          </p>
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
                <ActionCard
                  key={a.id}
                  action={a}
                  onApprove={() => { setApprovingId(a.id); approveMutation.mutate({ actionId: a.id }); }}
                  isApproving={approvingId === a.id}
                  showApprove
                />
              ))}
          </div>
        )}
        {activeTab === "executed" && (
          <div className="space-y-3">
            {execLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              : !executedActions?.length ? <EmptyState message="No auto-executed actions yet" />
              : executedActions.map((a) => (
                <ActionCard
                  key={a.id}
                  action={a}
                  onUndo={() => { setUndoingId(a.id); undoMutation.mutate({ actionId: a.id }); }}
                  isUndoing={undoingId === a.id}
                  showUndo
                />
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
