import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Target,
  RefreshCw,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Phone,
  Mail,
  MapPin,
  Trophy,
} from "lucide-react";

interface Submission {
  id: number;
  funnelId: number | null;
  contactId?: number | string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  golfLevel?: string | null;
  submittedAt: Date | null;
  rawData?: any;
}

function SubmissionsModal({
  funnelId,
  funnelName,
  onClose,
}: {
  funnelId: number;
  funnelName: string;
  onClose: () => void;
}) {
  const { data: submissions = [], isLoading } = trpc.funnels.submissions.useQuery({
    funnelId,
    limit: 500,
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-bold text-lg text-foreground">
              {funnelName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${submissions.length} contacts`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No submissions found for this funnel
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub: Submission) => (
                <div
                  key={sub.id}
                  className="flex items-start gap-4 p-3 bg-background border border-border rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {((sub.firstName || sub.email || "?")[0]).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {[sub.firstName, sub.lastName].filter(Boolean).join(" ") || sub.email || "Unknown"}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {sub.email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail size={10} />
                          {sub.email}
                        </span>
                      )}
                      {sub.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone size={10} />
                          {sub.phone}
                        </span>
                      )}
                      {(sub.city || sub.state) && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin size={10} />
                          {[sub.city, sub.state].filter(Boolean).join(", ")}
                        </span>
                      )}
                      {sub.golfLevel && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Trophy size={10} />
                          {sub.golfLevel}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    }) : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface FunnelSummary {
  funnelId: number;
  funnelName: string;
  archived: boolean;
  optInCount: number;
  lastSyncedAt: Date;
  submissionCount: number;
  lastSubmission: Date | null;
}

function FunnelCard({ funnel }: { funnel: FunnelSummary }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{funnel.funnelName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                funnel.archived
                  ? "bg-muted text-muted-foreground"
                  : "bg-green-50 text-green-700"
              }`}>
                {funnel.archived ? "Archived" : "Active"}
              </span>
            </div>
          </div>
          <Target size={18} className="text-muted-foreground shrink-0" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Opt-In Count</div>
            <button
              onClick={() => setShowModal(true)}
              className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              title="Click to view contacts"
            >
              {funnel.optInCount.toLocaleString()}
            </button>
            <div className="text-xs text-muted-foreground">total opt-ins</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Submissions</div>
            <div className="text-2xl font-bold text-foreground">
              {funnel.submissionCount.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">form submissions</div>
          </div>
        </div>

        {funnel.lastSubmission && (
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar size={12} />
            Last submission: {new Date(funnel.lastSubmission).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-primary/50 rounded-md transition-colors"
        >
          <Users size={12} />
          View {funnel.submissionCount} contacts
        </button>
      </div>

      {showModal && (
        <SubmissionsModal
          funnelId={funnel.funnelId}
          funnelName={funnel.funnelName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default function Funnels() {
  const { data: funnelSummary = [], isLoading, refetch } = trpc.funnels.summary.useQuery();
  const syncMutation = trpc.funnels.syncNow.useMutation({
    onSuccess: (result) => {
      toast.success(`Sync complete — ${result.funnels?.synced || 0} funnels synced`);
      refetch();
    },
    onError: (err) => {
      toast.error(`Sync failed: ${err.message}`);
    },
  });

  const activeFunnels = funnelSummary.filter((f: FunnelSummary) => !f.archived);
  const archivedFunnels = funnelSummary.filter((f: FunnelSummary) => f.archived);

  const totalOptIns = funnelSummary.reduce((sum: number, f: FunnelSummary) => sum + (f.optInCount || 0), 0);
  const totalSubmissions = funnelSummary.reduce((sum: number, f: FunnelSummary) => sum + (f.submissionCount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Funnels
          </h1>
          <p className="text-sm text-muted-foreground">ClickFunnels opt-in pages and submissions</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Active Funnels</div>
          <div className="text-3xl font-bold text-primary">{activeFunnels.length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Opt-Ins</div>
          <div className="text-3xl font-bold text-foreground">{totalOptIns.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Submissions</div>
          <div className="text-3xl font-bold text-foreground">{totalSubmissions.toLocaleString()}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Active funnels */}
          {activeFunnels.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Active Funnels ({activeFunnels.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeFunnels.map((funnel: FunnelSummary) => (
                  <FunnelCard key={funnel.funnelId} funnel={funnel} />
                ))}
              </div>
            </div>
          )}

          {/* Archived funnels */}
          {archivedFunnels.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Archived Funnels ({archivedFunnels.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {archivedFunnels.map((funnel: FunnelSummary) => (
                  <FunnelCard key={funnel.funnelId} funnel={funnel} />
                ))}
              </div>
            </div>
          )}

          {funnelSummary.length === 0 && (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <Target size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No funnels synced yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Sync Now" to fetch your ClickFunnels data</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
