import { Database, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";

const DATA_SOURCES = [
  {
    name: "Stripe",
    description: "Membership subscriptions, revenue, and tier data",
    status: "live" as const,
    lastSync: "Real-time",
    icon: "💳",
  },
  {
    name: "Acuity Scheduler",
    description: "Program registrations, appointments, and Stripe-verified revenue",
    status: "live" as const,
    lastSync: "Real-time",
    icon: "📅",
  },
  {
    name: "Meta Ads",
    description: "Campaign performance, impressions, clicks, and spend",
    status: "live" as const,
    lastSync: "Real-time",
    icon: "📣",
  },
  {
    name: "Encharge (AHTIL)",
    description: "Email subscriber list, automation sequences, and engagement",
    status: "live" as const,
    lastSync: "Real-time",
    icon: "✉️",
  },
  {
    name: "Asana",
    description: "Production tasks, project status, and team workflow",
    status: "live" as const,
    lastSync: "Real-time",
    icon: "✅",
  },
  {
    name: "Toast POS",
    description: "F&B revenue and transaction data (published daily at 5 AM EST)",
    status: "scheduled" as const,
    lastSync: "Daily 5 AM EST",
    icon: "🍽️",
  },
  {
    name: "Instagram",
    description: "Feed posts, engagement metrics, and follower data",
    status: "coming_soon" as const,
    lastSync: "—",
    icon: "📸",
  },
];

const STATUS_CONFIG = {
  live: {
    label: "Live",
    color: "#4C882A",
    bg: "#F0F7EC",
    icon: CheckCircle2,
  },
  scheduled: {
    label: "Scheduled",
    color: "#B07D2A",
    bg: "#FDF6EC",
    icon: Clock,
  },
  coming_soon: {
    label: "Coming Soon",
    color: "#AAAAAA",
    bg: "#F5F5F3",
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
          <h1 className="text-[22px] font-semibold text-[#222222] tracking-tight">Data Health</h1>
        </div>
        <p className="text-[13px] text-[#888882]">
          Monitor the sync status and freshness of all connected data sources. This page will surface
          anomalies, stale data warnings, and source-of-truth conflicts.
        </p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Live Sources", value: DATA_SOURCES.filter(d => d.status === "live").length, color: "#4C882A" },
          { label: "Scheduled Sources", value: DATA_SOURCES.filter(d => d.status === "scheduled").length, color: "#B07D2A" },
          { label: "Coming Soon", value: DATA_SOURCES.filter(d => d.status === "coming_soon").length, color: "#AAAAAA" },
        ].map(stat => (
          <div key={stat.label} className="bg-[#F6F6F4] rounded-lg px-5 py-4">
            <div className="text-[22px] font-semibold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[12px] text-[#888882] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Data Sources */}
      <div className="space-y-3">
        <h2 className="text-[13px] font-semibold text-[#888882] uppercase tracking-[0.08em] mb-3">
          Connected Sources
        </h2>
        {DATA_SOURCES.map(source => {
          const config = STATUS_CONFIG[source.status];
          const StatusIcon = config.icon;
          return (
            <div
              key={source.name}
              className="flex items-center justify-between bg-white border border-[#EBEBEB] rounded-lg px-5 py-4"
            >
              <div className="flex items-center gap-4">
                <span className="text-xl">{source.icon}</span>
                <div>
                  <div className="text-[14px] font-medium text-[#222222]">{source.name}</div>
                  <div className="text-[12px] text-[#888882] mt-0.5">{source.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <div className="text-[11px] text-[#AAAAAA] uppercase tracking-[0.06em]">Last Sync</div>
                  <div className="text-[12px] text-[#555550] mt-0.5">{source.lastSync}</div>
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
      <div className="mt-8 p-4 bg-[#F6F6F4] rounded-lg border border-[#DEDEDA]">
        <div className="flex items-start gap-3">
          <RefreshCw size={14} className="text-[#AAAAAA] mt-0.5 shrink-0" />
          <div>
            <div className="text-[12px] font-medium text-[#555550]">Phase 3 — Full Data Health Dashboard</div>
            <div className="text-[12px] text-[#888882] mt-0.5">
              This page will be expanded with per-source sync logs, anomaly detection, stale data alerts,
              and source-of-truth conflict resolution tools. Currently showing a live status summary.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
