/**
 * CampaignDetail — per-campaign summary page
 * Reached from Overview "View →" links and StrategicCampaigns fallback.
 * For the 4 strategic campaign slugs, shows correct campaign data from CAMPAIGN_ITEMS.
 */
import type { ElementType } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Target, UserCheck, Users, Flag } from "lucide-react";
import { appRoutes, getVenueSlugFromPath } from "@/lib/routes";
import { CAMPAIGN_ITEMS, type CampaignItem } from "@/data/reportCampaignData";

// ─── Design tokens (v2) ────────────────────────────────────────────────────────
const TEXT_P = "#222222";
const TEXT_S = "#6F6F6B";
const TEXT_M = "#A8A8A3";
const BORDER = "#DEDEDA";
const BG_S   = "#F1F1EF";
const BG_APP = "#F6F6F4";
const GRN_TXT = "#72B84A";
const ORG_TXT = "#D89A3C";
const BLU_TXT = "#4E8DF4";
const PRP_TXT = "#A87FBE";
const YELLOW  = "#F2DD48";

// ─── Static campaign metadata ─────────────────────────────────────────────────
const CAMPAIGN_META: Record<string, {
  name: string;
  description: string;
  accentColor: string;
  Icon: ElementType;
}> = {
  trial_conversion: {
    name:        "Trial & Experience",
    description: "Trial sessions, clinics, and discovery programs that convert first-time visitors into members.",
    accentColor: GRN_TXT,
    Icon:        Target as ElementType,
  },
  membership_acquisition: {
    name:        "Membership Acquisition",
    description: "Campaigns, promotions, and referrals focused on growing the active member base.",
    accentColor: BLU_TXT,
    Icon:        UserCheck as ElementType,
  },
  member_retention: {
    name:        "Membership Retention",
    description: "Renewals, engagement programs, and loyalty initiatives that keep existing members active.",
    accentColor: PRP_TXT,
    Icon:        Users as ElementType,
  },
  corporate_events: {
    name:        "B2B & Corporate Events",
    description: "Group bookings, corporate outreach, and local event activations.",
    accentColor: ORG_TXT,
    Icon:        Flag as ElementType,
  },
};

// ─── Status pill ──────────────────────────────────────────────────────────────
const STATUS_PILL: Record<string, { bg: string; text: string }> = {
  active:    { bg: `${YELLOW}30`, text: "#8a7a00" },
  completed: { bg: "#F6E5CF",     text: ORG_TXT   },
  planned:   { bg: BG_S,          text: TEXT_S    },
  archived:  { bg: BG_S,          text: TEXT_M    },
  pending:   { bg: "#EAF2FF",     text: BLU_TXT   },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_PILL[status] ?? { bg: BG_S, text: TEXT_S };
  return (
    <span
      style={{
        background: s.bg,
        color: s.text,
        fontSize: "10px",
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: "20px",
      }}
    >
      {status}
    </span>
  );
}

// ─── Category label ──────────────────────────────────────────────────────────
const CATEGORY_LABEL: Record<string, { label: string; color: string }> = {
  programs:   { label: "Program",   color: GRN_TXT },
  promotions: { label: "Promo",     color: BLU_TXT },
  paidAds:    { label: "Paid Ads",  color: ORG_TXT },
};

// ─── Convert CAMPAIGN_ITEMS relative route → full venue-scoped activity route ─
function resolveItemRoute(relativeRoute: string, routes: ReturnType<typeof appRoutes.venue>): string {
  // Pattern: /activities/:tab/:id  →  full studio-soo activity detail
  const match = relativeRoute.match(/^\/activities\/(programs|promotions|local)\/(.+)$/);
  if (match) {
    const [, tab, id] = match;
    return routes.studioSoo.activityDetail(tab, id);
  }
  // Pattern: /activities/:tab (list, no specific id)  →  activities tab
  const tabMatch = relativeRoute.match(/^\/activities\/(programs|promotions|local)$/);
  if (tabMatch) {
    const [, tab] = tabMatch;
    if (tab === "programs")   return routes.studioSoo.activityPrograms;
    if (tab === "promotions") return routes.studioSoo.activityPromotions;
    return routes.studioSoo.activityLocal;
  }
  return relativeRoute;
}

// ─── Item row ─────────────────────────────────────────────────────────────────
function ItemRow({
  item,
  category,
  accentColor,
  onNavigate,
}: {
  item: CampaignItem;
  category: string;
  accentColor: string;
  onNavigate: () => void;
}) {
  const hasPct = item.kpiCurrent != null && item.kpiTarget != null && item.kpiTarget > 0;
  const pct    = hasPct ? Math.min(100, (item.kpiCurrent! / item.kpiTarget!) * 100) : null;
  const cat    = CATEGORY_LABEL[category] ?? { label: category, color: TEXT_M };

  return (
    <button
      onClick={onNavigate}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "12px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        borderBottom: `1px solid ${BORDER}`,
        background: "transparent",
        border: "none",
        borderBottomColor: BORDER,
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        cursor: "pointer",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = BG_APP)}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "3px" }}>
          <span style={{ fontSize: "10px", fontWeight: 500, color: cat.color }}>{cat.label}</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: TEXT_P }}>{item.name}</span>
          <StatusPill status={item.status} />
          {item.isCross && (
            <span style={{ fontSize: "10px", padding: "1px 5px", border: `1px solid ${BORDER}`, borderRadius: "4px", color: TEXT_M }}>
              cross-campaign
            </span>
          )}
        </div>
        <p style={{ fontSize: "11px", color: TEXT_S, marginBottom: hasPct || item.kpi ? "6px" : 0 }}>{item.type}</p>

        {hasPct && (
          <div style={{ marginTop: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: TEXT_M, marginBottom: "3px" }}>
              <span>{item.kpiLabel}</span>
              <span>{item.kpiCurrent} / {item.kpiTarget}</span>
            </div>
            <div style={{ height: "4px", background: BORDER, borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: accentColor, borderRadius: "2px" }} />
            </div>
          </div>
        )}

        {!hasPct && item.kpi && (
          <p style={{ fontSize: "11px", color: TEXT_S, marginTop: "2px" }}>
            {item.kpiLabel ? `${item.kpiLabel}: ` : ""}{item.kpi}
          </p>
        )}

        {item.costNote && (
          <p style={{ fontSize: "10px", fontWeight: 500, color: ORG_TXT, marginTop: "3px" }}>{item.costNote}</p>
        )}
        {item.notes && (
          <p style={{ fontSize: "10px", color: TEXT_M, marginTop: "2px" }}>{item.notes}</p>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0, marginTop: "2px" }}>
        {item.adSpend != null && item.adSpend > 0 && (
          <span style={{ fontSize: "11px", fontWeight: 600, color: TEXT_P }}>
            ${item.adSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        )}
        {item.impressions != null && (
          <span style={{ fontSize: "10px", color: TEXT_M }}>
            {(item.impressions / 1000).toFixed(0)}K impr.
          </span>
        )}
        {item.revenue != null && item.revenue > 0 && (
          <span style={{ fontSize: "11px", fontWeight: 600, color: GRN_TXT }}>
            ${item.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} rev.
          </span>
        )}
        <ArrowRight size={11} style={{ color: TEXT_M }} />
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CampaignDetail() {
  const [location, navigate] = useLocation();
  const params    = useParams<{ venueSlug?: string; id?: string }>();
  const venueSlug = params.venueSlug ?? getVenueSlugFromPath(location) ?? "arlington-heights";
  const campaignId = params.id ?? "";
  const routes    = appRoutes.venue(venueSlug);

  const meta = CAMPAIGN_META[campaignId];
  const data = CAMPAIGN_ITEMS[campaignId];

  // Unknown campaign slug — redirect to campaigns list
  if (!meta) {
    return (
      <div className="p-8 space-y-6">
        <button
          onClick={() => navigate(routes.studioSoo.campaigns)}
          style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: TEXT_S, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={14} />
          Back to Campaigns
        </button>
        <p style={{ fontSize: "14px", color: TEXT_M }}>Campaign not found.</p>
      </div>
    );
  }

  const { name, description, accentColor, Icon } = meta;

  // Build flat item list with category labels
  type FlatItem = { item: CampaignItem; category: string };
  const allItems: FlatItem[] = [
    ...(data?.programs   ?? []).map(item => ({ item, category: "programs"   })),
    ...(data?.promotions ?? []).map(item => ({ item, category: "promotions" })),
    ...(data?.paidAds    ?? []).map(item => ({ item, category: "paidAds"    })),
  ];

  const totalSpend = allItems.reduce((sum, { item }) => sum + (item.adSpend ?? 0), 0);

  const statuses = allItems.reduce<Record<string, number>>((acc, { item }) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(routes.studioSoo.campaigns)}
          style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: TEXT_S, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "16px" }}
        >
          <ArrowLeft size={14} />
          Back to Campaigns
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
          <div style={{ width: 36, height: 36, borderRadius: "10px", background: `${accentColor}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={18} style={{ color: accentColor }} />
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 600, color: TEXT_P }}>{name}</h1>
        </div>
        <p style={{ fontSize: "13px", color: TEXT_S, marginLeft: "48px" }}>{description}</p>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
        {[
          { label: "Total Items",  value: String(allItems.length)  },
          { label: "Active",       value: String(statuses.active ?? 0)    },
          { label: "Completed",    value: String(statuses.completed ?? 0) },
          ...(totalSpend > 0
            ? [{ label: "Ad Spend", value: `$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}` }]
            : []
          ),
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "11px", color: TEXT_M, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "6px" }}>{label}</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: TEXT_P, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Items list */}
      {allItems.length > 0 ? (
        <div style={{ background: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BG_S}`, background: BG_S }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: TEXT_M, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
              Supporting Programs, Promotions &amp; Paid Ads
            </span>
          </div>
          {allItems.map(({ item, category }) => (
            <ItemRow
              key={item.id}
              item={item}
              category={category}
              accentColor={accentColor}
              onNavigate={() => navigate(resolveItemRoute(item.route, routes))}
            />
          ))}
        </div>
      ) : (
        <div style={{ background: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "40px 20px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: TEXT_M }}>No items configured for this campaign yet.</p>
        </div>
      )}
    </div>
  );
}
