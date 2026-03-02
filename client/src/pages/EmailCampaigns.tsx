import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Mail,
  RefreshCw,
  Send,
  Eye,
  MousePointer,
  TrendingUp,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";

type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";

interface Broadcast {
  id: number;
  broadcastId: number;
  name: string;
  status: BroadcastStatus;
  subject?: string | null;
  fromEmail?: string | null;
  fromName?: string | null;
  segmentName?: string | null;
  sendAt?: Date | null;
  delivered?: number | null;
  opens?: number | null;
  clicks?: number | null;
  bounces?: number | null;
  unsubscribes?: number | null;
  openRate?: string | null;
  clickRate?: string | null;
  metricsStale?: boolean | null;
  lastSyncedAt?: Date | null;
  createdAt: Date;
}

function StatusBadge({ status }: { status: BroadcastStatus }) {
  const config: Record<BroadcastStatus, { label: string; className: string; icon: React.ReactNode }> = {
    sent: {
      label: "Sent",
      className: "bg-green-50 text-green-700 border-green-200",
      icon: <CheckCircle size={10} />,
    },
    sending: {
      label: "Sending",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <Loader2 size={10} className="animate-spin" />,
    },
    scheduled: {
      label: "Scheduled",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Clock size={10} />,
    },
    draft: {
      label: "Draft",
      className: "bg-muted text-muted-foreground border-border",
      icon: <FileText size={10} />,
    },
    failed: {
      label: "Failed",
      className: "bg-red-50 text-red-600 border-red-200",
      icon: <XCircle size={10} />,
    },
  };

  const { label, className, icon } = config[status] || config.draft;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${className}`}>
      {icon}
      {label}
    </span>
  );
}

function MetricPill({
  icon,
  value,
  label,
  highlight,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md ${highlight ? "bg-amber-50" : "bg-muted"}`}>
      <span className={highlight ? "text-amber-700" : "text-muted-foreground"}>{icon}</span>
      <div>
        <div className={`text-sm font-semibold leading-none ${highlight ? "text-amber-800" : "text-foreground"}`}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground leading-none mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function BroadcastCard({ broadcast }: { broadcast: Broadcast }) {
  const openRateNum = broadcast.openRate ? parseFloat(broadcast.openRate) : null;
  const clickRateNum = broadcast.clickRate ? parseFloat(broadcast.clickRate) : null;

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={broadcast.status} />
            {broadcast.metricsStale && (
              <span className="text-xs text-amber-700 flex items-center gap-1">
                <AlertCircle size={10} />
                Stale
              </span>
            )}
          </div>
          <h3 className="font-semibold text-foreground truncate">{broadcast.name}</h3>
          {broadcast.subject && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">{broadcast.subject}</p>
          )}
        </div>
        <Mail size={18} className="text-muted-foreground shrink-0" />
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
        {broadcast.fromName && (
          <span>From: {broadcast.fromName}</span>
        )}
        {broadcast.segmentName && (
          <span>Segment: {broadcast.segmentName}</span>
        )}
        {broadcast.sendAt && (
          <span>
            {broadcast.status === "scheduled" ? "Scheduled: " : "Sent: "}
            {new Date(broadcast.sendAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Metrics */}
      {broadcast.status === "sent" && (
        <div className="flex flex-wrap gap-2">
          {broadcast.delivered != null && (
            <MetricPill
              icon={<Send size={12} />}
              value={broadcast.delivered.toLocaleString()}
              label="Delivered"
            />
          )}
          {broadcast.opens != null && (
            <MetricPill
              icon={<Eye size={12} />}
              value={broadcast.opens.toLocaleString()}
              label="Opens"
            />
          )}
          {broadcast.clicks != null && (
            <MetricPill
              icon={<MousePointer size={12} />}
              value={broadcast.clicks.toLocaleString()}
              label="Clicks"
            />
          )}
          {openRateNum != null && (
            <MetricPill
              icon={<TrendingUp size={12} />}
              value={`${(openRateNum * 100).toFixed(1)}%`}
              label="Open Rate"
              highlight={openRateNum > 0.2}
            />
          )}
          {clickRateNum != null && (
            <MetricPill
              icon={<MousePointer size={12} />}
              value={`${(clickRateNum * 100).toFixed(1)}%`}
              label="CTR"
              highlight={clickRateNum > 0.03}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function EmailCampaigns() {
  const { data: broadcasts = [], isLoading, refetch } = trpc.emailCampaigns.list.useQuery();
  const { data: summary } = trpc.emailCampaigns.summary.useQuery();

  const syncMutation = trpc.emailCampaigns.syncNow.useMutation({
    onSuccess: (result) => {
      toast.success(`Sync complete — ${result.synced || 0} new, ${result.updated || 0} updated`);
      refetch();
    },
    onError: (err) => {
      toast.error(`Sync failed: ${err.message}`);
    },
  });

  const sentBroadcasts = (broadcasts as Broadcast[]).filter((b) => b.status === "sent");
  const otherBroadcasts = (broadcasts as Broadcast[]).filter((b) => b.status !== "sent");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Email Campaigns
          </h1>
          <p className="text-sm text-muted-foreground">Encharge broadcast performance</p>
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
          Sync Now
        </button>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Broadcasts</div>
            <div className="text-3xl font-bold text-foreground">{summary.totalBroadcasts}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Delivered</div>
            <div className="text-3xl font-bold text-foreground">
              {summary.totalDelivered.toLocaleString()}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Avg Open Rate</div>
            <div className="text-3xl font-bold text-primary">
              {(summary.avgOpenRate * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Avg Click Rate</div>
            <div className="text-3xl font-bold text-foreground">
              {(summary.avgClickRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Sent broadcasts */}
          {sentBroadcasts.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Sent ({sentBroadcasts.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sentBroadcasts.map((broadcast) => (
                  <BroadcastCard key={broadcast.id} broadcast={broadcast} />
                ))}
              </div>
            </div>
          )}

          {/* Other broadcasts */}
          {otherBroadcasts.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Other ({otherBroadcasts.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {otherBroadcasts.map((broadcast) => (
                  <BroadcastCard key={broadcast.id} broadcast={broadcast} />
                ))}
              </div>
            </div>
          )}

          {broadcasts.length === 0 && (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <Mail size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No email campaigns synced yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Sync Now" to fetch your Encharge broadcasts</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
