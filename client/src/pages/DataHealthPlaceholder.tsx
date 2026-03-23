import { Database, RefreshCw, CheckCircle2, AlertCircle, Clock, XCircle, Wifi } from "lucide-react";
import { trpc } from "@/lib/trpc";

// ── Design-system compliant brand icons ─────────────────────────────────────
// Rule: Use simpleicons CDN <img> for brands that have a slug.
// For brands without a simpleicons slug, use a branded letter badge.
// Never use emoji or generic placeholder boxes.

type SourceKey = "stripe" | "acuity" | "metaAds" | "instagram" | "encharge" | "asana" | "toast" | "googleBusiness";

type DataSource = {
  key: SourceKey;
  name: string;
  description: string;
  defaultStatus: "live" | "scheduled" | "coming_soon";
  defaultLastSync: string;
  iconNode: React.ReactNode;
};

const DATA_SOURCES: DataSource[] = [
  {
    key: "stripe",
    name: "Stripe",
    description: "Membership subscriptions, revenue, and tier data",
    defaultStatus: "live",
    defaultLastSync: "Real-time",
    iconNode: (
      <img
        src="https://cdn.simpleicons.org/stripe/635BFF"
        className="h-5 w-5 flex-shrink-0"
        alt="Stripe"
      />
    ),
  },
  {
    key: "acuity",
    name: "Acuity Scheduler",
    description: "Program registrations, appointments, and Stripe-verified revenue",
    defaultStatus: "live",
    defaultLastSync: "Real-time",
    iconNode: (
      // Acuity is owned by Squarespace — use Squarespace icon as brand proxy
      <img
        src="https://cdn.simpleicons.org/squarespace/000000"
        className="h-5 w-5 flex-shrink-0"
        alt="Acuity Scheduler"
        title="Acuity Scheduling (by Squarespace)"
      />
    ),
  },
  {
    key: "metaAds",
    name: "Meta Ads",
    description: "Campaign performance, impressions, clicks, and spend",
    defaultStatus: "live",
    defaultLastSync: "Real-time",
    iconNode: (
      <img
        src="https://cdn.simpleicons.org/meta/0082FB"
        className="h-5 w-5 flex-shrink-0"
        alt="Meta"
      />
    ),
  },
  {
    key: "instagram",
    name: "Instagram",
    description: "Feed posts, follower count, engagement metrics, and reach",
    defaultStatus: "live",
    defaultLastSync: "Real-time",
    iconNode: (
      <img
        src="https://cdn.simpleicons.org/instagram/E1306C"
        className="h-5 w-5 flex-shrink-0"
        alt="Instagram"
      />
    ),
  },
  {
    key: "encharge",
    name: "Encharge (AHTIL)",
    description: "Email subscriber list, automation sequences, and engagement",
    defaultStatus: "live",
    defaultLastSync: "Real-time",
    iconNode: (
      // Encharge does not have a simpleicons slug — use branded letter badge
      <div
        className="h-5 w-5 rounded flex items-center justify-center flex-shrink-0 text-white font-bold"
        style={{ background: "#6C47FF", fontSize: "11px", lineHeight: 1 }}
        title="Encharge"
      >
        E
      </div>
    ),
  },
  {
    key: "asana",
    name: "Asana",
    description: "Production tasks, project status, and team workflow",
    defaultStatus: "live",
    defaultLastSync: "Real-time",
    iconNode: (
      <img
        src="https://cdn.simpleicons.org/asana/F06A6A"
        className="h-5 w-5 flex-shrink-0"
        alt="Asana"
      />
    ),
  },
  {
    key: "toast",
    name: "Toast POS",
    description: "F&B revenue and transaction data (published daily at 5 AM EST)",
    defaultStatus: "scheduled",
    defaultLastSync: "Daily 5 AM EST",
    iconNode: (
      // Toast does not have a simpleicons slug — use branded letter badge
      <div
        className="h-5 w-5 rounded flex items-center justify-center flex-shrink-0 text-white font-bold"
        style={{ background: "#FF4C00", fontSize: "11px", lineHeight: 1 }}
        title="Toast POS"
      >
        T
      </div>
    ),
  },
  {
    key: "googleBusiness",
    name: "Google Business",
    description: "Local SEO, Google Maps reviews, and search visibility",
    defaultStatus: "coming_soon",
    defaultLastSync: "—",
    iconNode: (
      <img
        src="https://cdn.simpleicons.org/google/4285F4"
        className="h-5 w-5 flex-shrink-0"
        alt="Google Business"
      />
    ),
  },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  live: {
    label: "Live",
    color: "#4C882A",
    bg: "#E6F0DC",
    icon: CheckCircle2,
  },
  scheduled: {
    label: "Scheduled",
    color: "#B46A0B",
    bg: "#F6E5CF",
    icon: Clock,
  },
  error: {
    label: "Error",
    color: "#C81E1E",
    bg: "#FDE8E8",
    icon: XCircle,
  },
  coming_soon: {
    label: "Coming Soon",
    color: "#6F6F6B",
    bg: "#F1F1EF",
    icon: AlertCircle,
  },
};

function formatCheckedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return "—";
  }
}

export default function DataHealthPlaceholder() {
  const { data: health, isLoading, refetch, isFetching } = trpc.encharge.getSourceHealth.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Merge live health data with static source definitions
  const sources = DATA_SOURCES.map(source => {
    const liveHealth = health?.[source.key];
    let resolvedStatus: string = source.defaultStatus;
    let resolvedLastSync = source.defaultLastSync;

    if (liveHealth) {
      if (liveHealth.status === "coming_soon") {
        resolvedStatus = "coming_soon";
        resolvedLastSync = "—";
      } else if (liveHealth.status === "error") {
        resolvedStatus = "error";
        resolvedLastSync = "Check failed";
      } else if (liveHealth.status === "live") {
        resolvedStatus = source.key === "toast" ? "scheduled" : "live";
        resolvedLastSync = liveHealth.note ?? `Checked ${formatCheckedAt(liveHealth.checkedAt)}`;
      }
    }

    return { ...source, resolvedStatus, resolvedLastSync };
  });

  const liveCount = sources.filter(s => s.resolvedStatus === "live").length;
  const scheduledCount = sources.filter(s => s.resolvedStatus === "scheduled").length;
  const errorCount = sources.filter(s => s.resolvedStatus === "error").length;
  const comingSoonCount = sources.filter(s => s.resolvedStatus === "coming_soon").length;
  const firstCheckedAt = health ? Object.values(health)[0]?.checkedAt : null;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Database size={22} className="text-[#222222]" />
            <h1 className="text-[22px] font-bold text-[#222222] tracking-tight">Data Health</h1>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-[12px] text-[#6F6F6B] hover:text-[#222222] border border-[#DEDEDA] rounded-lg px-3 py-1.5 hover:bg-[#F1F1EF] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? "Checking…" : "Refresh"}
          </button>
        </div>
        <p className="text-[13px] text-[#6F6F6B]">
          Monitor the sync status and freshness of all connected data sources. This page surfaces
          anomalies, stale data warnings, and source-of-truth conflicts.
        </p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Live",        value: liveCount,       color: "#4C882A" },
          { label: "Scheduled",   value: scheduledCount,  color: "#B46A0B" },
          { label: "Errors",      value: errorCount,      color: errorCount > 0 ? "#C81E1E" : "#A8A8A3" },
          { label: "Coming Soon", value: comingSoonCount, color: "#6F6F6B" },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-[#DEDEDA] rounded-xl px-5 py-4">
            <div className="text-[22px] font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[12px] text-[#6F6F6B] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Data Sources */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold text-[#A8A8A3] uppercase tracking-widest">
            Connected Sources
          </h2>
          {firstCheckedAt && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#A8A8A3]">
              <Wifi size={11} />
              Live status · {formatCheckedAt(firstCheckedAt)}
            </div>
          )}
        </div>

        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#F1F1EF] rounded-xl animate-pulse" />
          ))
        ) : (
          sources.map(source => {
            const config = STATUS_CONFIG[source.resolvedStatus] ?? STATUS_CONFIG.coming_soon;
            const StatusIcon = config.icon;
            return (
              <div
                key={source.name}
                className="flex items-center justify-between bg-white border border-[#DEDEDA] rounded-xl px-5 py-4"
              >
                <div className="flex items-center gap-4">
                  {source.iconNode}
                  <div>
                    <div className="text-[15px] font-bold text-[#222222]">{source.name}</div>
                    <div className="text-[12px] text-[#6F6F6B] mt-0.5">{source.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <div className="text-[11px] text-[#A8A8A3] uppercase tracking-widest">Last Sync</div>
                    <div className="text-[13px] font-semibold text-[#222222] mt-0.5">{source.resolvedLastSync}</div>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
                    style={{ color: config.color, backgroundColor: config.bg }}
                  >
                    <StatusIcon size={12} />
                    {config.label}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Phase Notice */}
      <div className="mt-8 p-4 bg-white rounded-xl border border-[#DEDEDA]">
        <div className="flex items-start gap-3">
          <RefreshCw size={14} className="text-[#A8A8A3] mt-0.5 shrink-0" />
          <div>
            <div className="text-[13px] font-semibold text-[#222222]">Phase 3 — Full Data Health Dashboard</div>
            <div className="text-[12px] text-[#6F6F6B] mt-0.5">
              This page will be expanded with per-source sync logs, anomaly detection, stale data alerts,
              and source-of-truth conflict resolution tools. Currently showing a live status summary.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
