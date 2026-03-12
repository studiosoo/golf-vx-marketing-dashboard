import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronDown, ChevronRight, ArrowRight, Target, UserCheck, Users, Flag } from "lucide-react";
import { CAMPAIGN_ITEMS, type CampaignItem, type ItemStatus } from "@/data/reportCampaignData";

const YELLOW  = "#F2DD48";
const TEXT_P  = "#222222";
const TEXT_S  = "#6F6F6B";
const TEXT_M  = "#A8A8A3";
const BORDER  = "#DEDEDA";
const BG_S    = "#F1F1EF";
const BG_APP  = "#F6F6F4";
const GRN_TXT = "#72B84A";
const GRN_BG  = "#E6F0DC";
const ORG_TXT = "#D89A3C";
const ORG_BG  = "#F6E5CF";
const BLU_TXT = "#4E8DF4";
const BLU_BG  = "#EAF2FF";

function fmt(v: number | string) {
  const n = parseFloat(String(v || 0));
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const STATUS_TABS: Array<{ value: ItemStatus | "all"; label: string }> = [
  { value: "active",    label: "Active"    },
  { value: "planned",   label: "Planned"   },
  { value: "completed", label: "Completed" },
  { value: "all",       label: "All"       },
];

const STATUS_PILL: Record<string, { bg: string; text: string }> = {
  active:    { bg: `${YELLOW}25`, text: "#9a7a00"  },
  completed: { bg: ORG_BG,        text: ORG_TXT    },
  planned:   { bg: BG_S,          text: TEXT_S     },
  archived:  { bg: BG_S,          text: TEXT_M     },
  pending:   { bg: BLU_BG,        text: BLU_TXT    },
};

// Category type label badge
const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  programs:   { label: "Program",  color: GRN_TXT },
  promotions: { label: "Promo",    color: BLU_TXT },
  paidAds:    { label: "Ad",       color: ORG_TXT },
};

const PRP_TXT = "#A87FBE"; // Member Retention — purple
const PRP_BG  = "#F3EDF8";

const CAMPAIGN_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; kpiLabel: string; kpiCurrent?: number; kpiTarget?: number }> = {
  trial_conversion:       { label: "Trial Conversion",      color: GRN_TXT, bg: GRN_BG, icon: Target,    kpiLabel: "Trial Sessions MTD" },
  membership_acquisition: { label: "Membership Acquisition", color: BLU_TXT, bg: BLU_BG, icon: UserCheck, kpiLabel: "Members",    kpiCurrent: 91, kpiTarget: 300 },
  member_retention:       { label: "Member Retention",       color: PRP_TXT, bg: PRP_BG, icon: Users,     kpiLabel: "Active Members" },
  corporate_events:       { label: "B2B & Events",           color: ORG_TXT, bg: ORG_BG, icon: Flag,      kpiLabel: "Events Q1", kpiCurrent: 1 },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_PILL[status] ?? { bg: BG_S, text: TEXT_S };
  return (
    <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full capitalize" style={{ background: s.bg, color: s.text }}>
      {status}
    </span>
  );
}

function TypeBadge({ category }: { category: string }) {
  const b = TYPE_BADGE[category] ?? { label: category, color: TEXT_M };
  return (
    <span className="text-[10px] font-medium" style={{ color: b.color }}>{b.label}</span>
  );
}

// ─── Item row ─────────────────────────────────────────────────────────────────
function ItemRow({ item, accentColor, category }: { item: CampaignItem; accentColor: string; category: string }) {
  const [, navigate] = useLocation();
  const hasPct = item.kpiCurrent != null && item.kpiTarget != null && item.kpiTarget > 0;
  const pct = hasPct ? Math.min(100, (item.kpiCurrent! / item.kpiTarget!) * 100) : null;

  return (
    <button
      onClick={() => navigate(item.route)}
      className="w-full px-4 py-3 flex items-start gap-3 text-left transition-colors"
      style={{ borderBottom: `1px solid ${BORDER}` }}
      onMouseEnter={e => (e.currentTarget.style.background = BG_APP)}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <TypeBadge category={category} />
          <span className="text-[13px] font-semibold" style={{ color: TEXT_P }}>{item.name}</span>
          <StatusPill status={item.status} />
          {item.isCross && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{ color: TEXT_M, borderColor: BORDER }}>cross</span>
          )}
        </div>
        <p className="text-[11px]" style={{ color: TEXT_S }}>{item.type}</p>

        {hasPct ? (
          <div className="mt-1.5">
            <div className="flex justify-between text-[10px] mb-0.5" style={{ color: TEXT_M }}>
              <span>{item.kpiLabel}</span>
              <span>{item.kpiCurrent} / {item.kpiTarget}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: BORDER }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accentColor }} />
            </div>
          </div>
        ) : item.kpi ? (
          <p className="text-[11px] mt-1" style={{ color: TEXT_S }}>{item.kpiLabel ? `${item.kpiLabel}: ` : ""}{item.kpi}</p>
        ) : null}

        {item.costNote && (
          <p className="text-[10px] mt-1 font-medium" style={{ color: ORG_TXT }}>{item.costNote}</p>
        )}
        {item.notes && (
          <p className="text-[10px] mt-0.5" style={{ color: TEXT_M }}>{item.notes}</p>
        )}
      </div>

      <div className="shrink-0 text-right space-y-0.5 mt-0.5">
        {item.adSpend != null && item.adSpend > 0 && (
          <p className="text-[11px] font-semibold" style={{ color: TEXT_P }}>{fmt(item.adSpend)}</p>
        )}
        {item.impressions != null && (
          <p className="text-[10px]" style={{ color: TEXT_M }}>{(item.impressions / 1000).toFixed(0)}K impr.</p>
        )}
        {item.ctr != null && (
          <p className="text-[10px]" style={{ color: TEXT_M }}>{item.ctr.toFixed(2)}% CTR</p>
        )}
        {item.revenue != null && item.revenue > 0 && (
          <p className="text-[11px] font-semibold" style={{ color: GRN_TXT }}>{fmt(item.revenue)}</p>
        )}
        <ArrowRight size={11} style={{ color: TEXT_M, marginLeft: "auto" }} />
      </div>
    </button>
  );
}

// ─── Flat item list with status tabs ─────────────────────────────────────────
type FlatItem = { item: CampaignItem; category: string };

function sortByDate(a: FlatItem, b: FlatItem): number {
  const da = a.item.startDate ?? "9999-99-99";
  const db = b.item.startDate ?? "9999-99-99";
  return da < db ? -1 : da > db ? 1 : 0;
}

function FlatItemList({ data, accentColor }: {
  data: { programs: CampaignItem[]; promotions: CampaignItem[]; paidAds: CampaignItem[] };
  accentColor: string;
}) {
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">("active");

  const allItems: FlatItem[] = [
    ...data.programs.map(item => ({ item, category: "programs" })),
    ...data.promotions.map(item => ({ item, category: "promotions" })),
    ...data.paidAds.map(item => ({ item, category: "paidAds" })),
  ].sort(sortByDate);

  const filtered = statusFilter === "all"
    ? allItems
    : allItems.filter(({ item }) => item.status === statusFilter);

  const visibleTabs = STATUS_TABS.filter(t =>
    t.value === "all" || allItems.some(({ item }) => item.status === t.value)
  );

  const counts: Record<string, number> = {
    active:    allItems.filter(({ item }) => item.status === "active").length,
    planned:   allItems.filter(({ item }) => item.status === "planned").length,
    completed: allItems.filter(({ item }) => item.status === "completed").length,
  };

  return (
    <div style={{ borderTop: `1px solid ${BORDER}` }}>
      {/* Status tabs */}
      <div className="flex overflow-x-auto px-4 py-2 gap-1">
        {visibleTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className="shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors"
            style={statusFilter === tab.value
              ? { background: TEXT_P, color: "white" }
              : { background: BG_S, color: TEXT_S }}
          >
            {tab.label}
            {tab.value !== "all" && counts[tab.value] > 0 && (
              <span className="ml-1 opacity-70">{counts[tab.value]}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-3 text-[12px]" style={{ color: TEXT_M }}>No {statusFilter} items.</p>
      ) : (
        filtered.map(({ item, category }) => (
          <ItemRow key={item.id} item={item} accentColor={accentColor} category={category} />
        ))
      )}
    </div>
  );
}

// ─── One campaign card (1/4 of 2×2 grid) ─────────────────────────────────────
function CampaignCard({
  campaignId, snapshot, acuity,
}: {
  campaignId: string; snapshot: any; acuity: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta    = CAMPAIGN_META[campaignId];
  const Icon    = meta.icon;
  const data    = CAMPAIGN_ITEMS[campaignId];
  const allItems = [...data.programs, ...data.promotions, ...data.paidAds];
  const activeCount = allItems.filter(i => i.status === "active").length;

  // Live KPI overrides
  const liveKpi = (() => {
    if (campaignId === "membership_acquisition") {
      const total = snapshot?.members?.total ?? 0;
      return total > 0 ? { current: total, target: 300 } : null;
    }
    if (campaignId === "trial_conversion") {
      const bookings = (acuity?.byType as any[] | undefined)?.find((t: any) =>
        (t.appointmentType ?? "").toLowerCase().includes("trial"))?.bookingCount;
      return bookings != null ? { current: bookings, target: undefined } : null;
    }
    return null;
  })();

  const kpiCurrent = liveKpi?.current ?? meta.kpiCurrent;
  const kpiTarget  = liveKpi?.target  ?? meta.kpiTarget;
  const pct        = kpiCurrent != null && kpiTarget != null && kpiTarget > 0
    ? Math.min(100, (kpiCurrent / kpiTarget) * 100)
    : null;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: BORDER, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full p-4 flex items-start justify-between gap-2 transition-colors hover:bg-[#F6F6F4]"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
            <Icon size={14} style={{ color: meta.color }} />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[13px] font-semibold leading-tight" style={{ color: TEXT_P }}>{meta.label}</p>
            <p className="text-[10px]" style={{ color: TEXT_M }}>{activeCount} active · {allItems.length} total</p>
          </div>
        </div>
        {expanded
          ? <ChevronDown size={14} style={{ color: TEXT_M }} />
          : <ChevronRight size={14} style={{ color: TEXT_M }} />
        }
      </button>

      {/* KPI summary strip */}
      <div className="px-4 pb-3 -mt-1">
        {pct != null ? (
          <>
            <div className="flex justify-between text-[10px] mb-1" style={{ color: TEXT_M }}>
              <span>{meta.kpiLabel}</span>
              <span style={{ color: meta.color }}>{pct.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BG_S }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
            </div>
            {kpiTarget != null && (
              <p className="text-[10px] mt-0.5" style={{ color: TEXT_M }}>
                {kpiCurrent} / {kpiTarget}
              </p>
            )}
          </>
        ) : kpiCurrent != null ? (
          <p className="text-[12px] font-semibold" style={{ color: TEXT_P }}>
            {meta.kpiLabel}: <span style={{ color: meta.color }}>{kpiCurrent}</span>
          </p>
        ) : null}
      </div>

      {/* Expandable body — flat list */}
      {expanded && (
        <FlatItemList data={data} accentColor={meta.color} />
      )}
    </div>
  );
}

// ─── 2×2 Grid ─────────────────────────────────────────────────────────────────
export function CampaignGrid({ snapshot, acuity }: { snapshot: any; acuity: any }) {
  const CAMPAIGN_IDS = ["trial_conversion", "membership_acquisition", "member_retention", "corporate_events"];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAMPAIGN_IDS.map(id => (
          <CampaignCard key={id} campaignId={id} snapshot={snapshot} acuity={acuity} />
        ))}
      </div>
    </div>
  );
}
