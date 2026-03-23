import { Database, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";

// ── Design-system compliant brand icons ─────────────────────────────────────
// Rule: Use simpleicons CDN <img> for brands that have a slug.
// For brands without a simpleicons slug, use a branded letter badge.
// Never use emoji or generic placeholder boxes.

type DataSource = {
  name: string;
  description: string;
  status: "live" | "scheduled" | "coming_soon";
  lastSync: string;
  iconNode: React.ReactNode;
};

const DATA_SOURCES: DataSource[] = [
  {
    name: "Stripe",
    description: "Membership subscriptions, revenue, and tier data",
    status: "live",
    lastSync: "Real-time",
    iconNode: (
      <img
        src="https://cdn.simpleicons.org/stripe/635BFF"
        className="h-5 w-5 flex-shrink-0"
        alt="Stripe"
      />
    ),
  },
  {
    name: "Acuity Scheduler",
    description: "Program registrations, appointments, and Stripe-verified revenue",
    status: "live",
    lastSync: "Real-time",
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
    name: "Meta Ads",
    description: "Campaign performance, impressions, clicks, and spend",
    status: "live",
    lastSync: "Real-time",
    iconNode: (
      <img
        src="https://cdn.simpleicons.org/meta/0082FB"
        className="h-5 w-5 flex-shrink-0"
        alt="Meta"
      />
    ),
  },
  {
    name: "Instagram",
    description: "Feed posts, follower count, engagement metrics, and reach",
    status: "live",
    lastSync: "Real-time",
    iconNode: (
      <img
        src="https://cdn.simpleicons.org/instagram/E1306C"
        className="h-5 w-5 flex-shrink-0"
        alt="Instagram"
      />
    ),
  },
  {
    name: "Encharge (AHTIL)",
    description: "Email subscriber list, automation sequences, and engagement",
    status: "live",
    lastSync: "Real-time",
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
    name: "Asana",
    description: "Production tasks, project status, and team workflow",
    status: "live",
    lastSync: "Real-time",
    iconNode: (
      <img
        src="https://cdn.simpleicons.org/asana/F06A6A"
        className="h-5 w-5 flex-shrink-0"
        alt="Asana"
      />
    ),
  },
  {
    name: "Toast POS",
    description: "F&B revenue and transaction data (published daily at 5 AM EST)",
    status: "scheduled",
    lastSync: "Daily 5 AM EST",
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
    name: "Google Business",
    description: "Local SEO, Google Maps reviews, and search visibility",
    status: "coming_soon",
    lastSync: "—",
    iconNode: (
      <img
        src="https://cdn.simpleicons.org/google/4285F4"
        className="h-5 w-5 flex-shrink-0"
        alt="Google Business"
      />
    ),
  },
];

const STATUS_CONFIG = {
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
  coming_soon: {
    label: "Coming Soon",
    color: "#6F6F6B",
    bg: "#F1F1EF",
    icon: AlertCircle,
  },
};

export default function DataHealthPlaceholder() {
  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database size={22} className="text-[#222222]" />
          <h1 className="text-[22px] font-bold text-[#222222] tracking-tight">Data Health</h1>
        </div>
        <p className="text-[13px] text-[#6F6F6B]">
          Monitor the sync status and freshness of all connected data sources. This page will surface
          anomalies, stale data warnings, and source-of-truth conflicts.
        </p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Live Sources",      value: DATA_SOURCES.filter(d => d.status === "live").length,        color: "#4C882A" },
          { label: "Scheduled Sources", value: DATA_SOURCES.filter(d => d.status === "scheduled").length,   color: "#B46A0B" },
          { label: "Coming Soon",       value: DATA_SOURCES.filter(d => d.status === "coming_soon").length, color: "#6F6F6B" },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-[#DEDEDA] rounded-xl px-5 py-4">
            <div className="text-[22px] font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[12px] text-[#6F6F6B] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Data Sources */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold text-[#A8A8A3] uppercase tracking-widest mb-3">
          Connected Sources
        </h2>
        {DATA_SOURCES.map(source => {
          const config = STATUS_CONFIG[source.status];
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
                  <div className="text-[13px] font-semibold text-[#222222] mt-0.5">{source.lastSync}</div>
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
        })}
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
