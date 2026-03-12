import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Target,
  RefreshCw,
  Users,
  Calendar,
  Loader2,
  X,
  Phone,
  Mail,
  MapPin,
  Trophy,
  Eye,
  BarChart2,
  Pencil,
  Check,
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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#DEDEDA] rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#DEDEDA]">
          <div>
            <h2 className="font-bold text-lg" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {funnelName}
            </h2>
            <p className="text-sm text-[#6F6F6B]">
              {isLoading ? "Loading..." : `${submissions.length} contacts`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6F6F6B] hover:text-[#222222] hover:bg-[#F1F1EF] rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#F2DD48]" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-[#6F6F6B]">
              No submissions found for this funnel
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub: Submission) => (
                <div
                  key={sub.id}
                  className="flex items-start gap-4 p-3 bg-white border border-[#DEDEDA] rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-[#F2DD48]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#F2DD48]">
                      {((sub.firstName || sub.email || "?")[0]).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {[sub.firstName, sub.lastName].filter(Boolean).join(" ") || sub.email || "Unknown"}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {sub.email && (
                        <span className="flex items-center gap-1 text-xs text-[#6F6F6B]">
                          <Mail size={10} />
                          {sub.email}
                        </span>
                      )}
                      {sub.phone && (
                        <span className="flex items-center gap-1 text-xs text-[#6F6F6B]">
                          <Phone size={10} />
                          {sub.phone}
                        </span>
                      )}
                      {(sub.city || sub.state) && (
                        <span className="flex items-center gap-1 text-xs text-[#6F6F6B]">
                          <MapPin size={10} />
                          {[sub.city, sub.state].filter(Boolean).join(", ")}
                        </span>
                      )}
                      {sub.golfLevel && (
                        <span className="flex items-center gap-1 text-xs text-[#6F6F6B]">
                          <Trophy size={10} />
                          {sub.golfLevel}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-[#6F6F6B] shrink-0">
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
  uniqueVisitors: number;
  pageViews: number;
  lastSyncedAt: Date;
  submissionCount: number;
  lastSubmission: Date | null;
}

function UvPvEditModal({
  funnel,
  onClose,
  onSaved,
}: {
  funnel: FunnelSummary;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [uv, setUv] = useState(String(funnel.uniqueVisitors || ""));
  const [pv, setPv] = useState(String(funnel.pageViews || ""));

  const updateMutation = trpc.funnels.updateUvPv.useMutation({
    onSuccess: () => {
      toast.success("UV/PV stats updated successfully");
      onSaved();
      onClose();
    },
    onError: (err) => {
      toast.error(`Failed to update: ${err.message}`);
    },
  });

  const handleSave = () => {
    const uvNum = parseInt(uv) || 0;
    const pvNum = parseInt(pv) || 0;
    if (uvNum < 0 || pvNum < 0) {
      toast.error("Values must be non-negative");
      return;
    }
    updateMutation.mutate({
      cfId: funnel.funnelId,
      uniqueVisitors: uvNum,
      pageViews: pvNum,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#DEDEDA] rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-[#DEDEDA]">
          <div>
            <h2 className="font-bold text-base" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Edit UV/PV Stats
            </h2>
            <p className="text-xs text-[#6F6F6B] mt-0.5 max-w-[220px] truncate">
              {funnel.funnelName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6F6F6B] hover:text-[#222222] hover:bg-[#F1F1EF] rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-[#6F6F6B]">
            ClickFunnels API does not expose visit counts. Enter the values manually from your ClickFunnels dashboard.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#222222] mb-1.5 flex items-center gap-1.5">
                <Eye size={12} className="text-[#F2DD48]" />
                Unique Visitors (UV)
              </label>
              <input
                type="number"
                min="0"
                value={uv}
                onChange={(e) => setUv(e.target.value)}
                placeholder="e.g. 176"
                className="w-full px-3 py-2 text-sm bg-white border border-[#DEDEDA] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#222222] mb-1.5 flex items-center gap-1.5">
                <BarChart2 size={12} className="text-[#F2DD48]" />
                Page Views (PV)
              </label>
              <input
                type="number"
                min="0"
                value={pv}
                onChange={(e) => setPv(e.target.value)}
                placeholder="e.g. 312"
                className="w-full px-3 py-2 text-sm bg-white border border-[#DEDEDA] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>

          {/* Conversion rate preview */}
          {parseInt(uv) > 0 && funnel.optInCount > 0 && (
            <div className="bg-[#FDF9E3] border border-[#F2DD48]/20 rounded-md p-3">
              <p className="text-xs text-[#6F6F6B]">Conversion Rate Preview</p>
              <p className="text-sm font-semibold text-[#F2DD48] mt-0.5">
                {((funnel.optInCount / parseInt(uv)) * 100).toFixed(1)}% opt-in rate
                <span className="text-xs font-normal text-[#6F6F6B] ml-1">
                  ({funnel.optInCount} opt-ins / {parseInt(uv).toLocaleString()} UV)
                </span>
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-[#DEDEDA] rounded-md hover:bg-[#F1F1EF] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#F2DD48] text-[#222222] rounded-md hover:brightness-95 transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FunnelCard({ funnel, onRefetch }: { funnel: FunnelSummary; onRefetch: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [showUvPvModal, setShowUvPvModal] = useState(false);

  const conversionRate = funnel.uniqueVisitors > 0
    ? ((funnel.optInCount / funnel.uniqueVisitors) * 100).toFixed(1)
    : null;

  return (
    <>
      <div className="bg-white border border-[#DEDEDA] rounded-lg p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#222222] truncate">{funnel.funnelName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                funnel.archived
                  ? "bg-[#F1F1EF] text-[#6F6F6B]"
                  : "bg-green-500/10 text-[#72B84A]"
              }`}>
                {funnel.archived ? "Archived" : "Active"}
              </span>
              {conversionRate && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#F2DD48]/10 text-[#F2DD48] font-medium">
                  {conversionRate}% CVR
                </span>
              )}
            </div>
          </div>
          <Target size={18} className="text-[#6F6F6B] shrink-0" />
        </div>

        {/* UV / PV row */}
        <div className="flex items-center justify-between mb-3 p-2.5 bg-[#F6F6F4] rounded-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Eye size={12} className="text-[#6F6F6B]" />
              <span className="text-xs text-[#6F6F6B]">UV</span>
              <span className="text-sm font-semibold text-[#222222]">
                {funnel.uniqueVisitors > 0 ? funnel.uniqueVisitors.toLocaleString() : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart2 size={12} className="text-[#6F6F6B]" />
              <span className="text-xs text-[#6F6F6B]">PV</span>
              <span className="text-sm font-semibold text-[#222222]">
                {funnel.pageViews > 0 ? funnel.pageViews.toLocaleString() : "—"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowUvPvModal(true)}
            className="flex items-center gap-1 text-xs text-[#6F6F6B] hover:text-[#F2DD48] transition-colors"
            title="Edit UV/PV stats"
          >
            <Pencil size={11} />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-[#6F6F6B] mb-1">Opt-In Count</div>
            <button
              onClick={() => setShowModal(true)}
              className="text-2xl font-bold text-[#F2DD48] hover:text-[#F2DD48]/80 transition-colors cursor-pointer"
              title="Click to view contacts"
            >
              {funnel.optInCount.toLocaleString()}
            </button>
            <div className="text-xs text-[#6F6F6B]">total opt-ins</div>
          </div>
          <div>
            <div className="text-xs text-[#6F6F6B] mb-1">Submissions</div>
            <div className="text-2xl font-bold text-[#222222]">
              {funnel.submissionCount.toLocaleString()}
            </div>
            <div className="text-xs text-[#6F6F6B]">form submissions</div>
          </div>
        </div>

        {funnel.lastSubmission && (
          <div className="mt-4 pt-4 border-t border-[#DEDEDA] flex items-center gap-2 text-xs text-[#6F6F6B]">
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
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs text-[#6F6F6B] hover:text-[#222222] border border-[#DEDEDA] hover:border-[#F2DD48]/50 rounded-md transition-colors"
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

      {showUvPvModal && (
        <UvPvEditModal
          funnel={funnel}
          onClose={() => setShowUvPvModal(false)}
          onSaved={onRefetch}
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
  const totalUv = funnelSummary.reduce((sum: number, f: FunnelSummary) => sum + (f.uniqueVisitors || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Funnels
          </h1>
          <p className="text-sm text-[#6F6F6B]">ClickFunnels opt-in pages and submissions</p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-[#F2DD48] text-[#222222] rounded-md text-sm font-medium hover:brightness-95 transition-colors disabled:opacity-50"
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DEDEDA] rounded-lg p-4">
          <div className="text-sm text-[#6F6F6B] mb-1">Active Funnels</div>
          <div className="text-3xl font-bold text-[#F2DD48]">{activeFunnels.length}</div>
        </div>
        <div className="bg-white border border-[#DEDEDA] rounded-lg p-4">
          <div className="text-sm text-[#6F6F6B] mb-1">Total Unique Visitors</div>
          <div className="text-3xl font-bold text-[#222222]">
            {totalUv > 0 ? totalUv.toLocaleString() : "—"}
          </div>
        </div>
        <div className="bg-white border border-[#DEDEDA] rounded-lg p-4">
          <div className="text-sm text-[#6F6F6B] mb-1">Total Opt-Ins</div>
          <div className="text-3xl font-bold text-[#222222]">{totalOptIns.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-[#DEDEDA] rounded-lg p-4">
          <div className="text-sm text-[#6F6F6B] mb-1">Total Submissions</div>
          <div className="text-3xl font-bold text-[#222222]">{totalSubmissions.toLocaleString()}</div>
        </div>
      </div>

      {/* UV/PV info banner */}
      <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400">
        <Eye size={14} className="shrink-0 mt-0.5" />
        <span>
          <strong>UV/PV stats are entered manually.</strong> ClickFunnels API does not expose visit counts.
          Click the <strong>Edit</strong> button on each funnel card to enter UV and PV from your ClickFunnels dashboard.
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#F2DD48]" />
        </div>
      ) : (
        <>
          {/* Active funnels */}
          {activeFunnels.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[#6F6F6B] mb-3 uppercase tracking-wider">
                Active Funnels ({activeFunnels.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeFunnels.map((funnel: FunnelSummary) => (
                  <FunnelCard key={funnel.funnelId} funnel={funnel} onRefetch={refetch} />
                ))}
              </div>
            </div>
          )}

          {/* Archived funnels */}
          {archivedFunnels.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[#6F6F6B] mb-3 uppercase tracking-wider">
                Archived Funnels ({archivedFunnels.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {archivedFunnels.map((funnel: FunnelSummary) => (
                  <FunnelCard key={funnel.funnelId} funnel={funnel} onRefetch={refetch} />
                ))}
              </div>
            </div>
          )}

          {funnelSummary.length === 0 && (
            <div className="text-center py-12 border border-dashed border-[#DEDEDA] rounded-lg">
              <Target size={32} className="text-[#6F6F6B] mx-auto mb-3" />
              <p className="text-[#6F6F6B]">No funnels synced yet</p>
              <p className="text-sm text-[#6F6F6B] mt-1">Click "Sync Now" to fetch your ClickFunnels data</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
