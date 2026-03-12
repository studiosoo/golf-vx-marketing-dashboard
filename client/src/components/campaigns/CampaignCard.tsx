import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, ChevronDown, ChevronRight, DollarSign, CalendarRange, Zap } from "lucide-react";
import { CAMPAIGN_COLORS } from "@/components/reports/ReportTimeline";
import { CAMPAIGN_ITEMS, TIMELINE_ITEMS } from "@/data/reportCampaignData";

const CAMPAIGN_BG: Record<string, string> = {
  trial_conversion:       "#E6F0DC",
  membership_acquisition: "#EAF2FF",
  member_retention:       "#F3EDF8",
  corporate_events:       "#F6E5CF",
};

const CAMPAIGN_LABEL: Record<string, string> = {
  trial_conversion:       "Trial Conversion",
  membership_acquisition: "Membership Acquisition",
  member_retention:       "Member Retention",
  corporate_events:       "B2B & Events",
};

const CAMPAIGN_KPI_LABEL: Record<string, string> = {
  trial_conversion:       "New Visitors",
  membership_acquisition: "Membership Goal",
  member_retention:       "Retention Rate",
  corporate_events:       "B2B Events (Month)",
};

const TYPE_LABEL: Record<string, string> = {
  programs:   "Program",
  promotions: "Promo",
  paidAds:    "Ad",
};

const TYPE_COLOR: Record<string, string> = {
  programs:   "#72B84A",
  promotions: "#4E8DF4",
  paidAds:    "#D89A3C",
};

const STATUS_PILL: Record<string, { bg: string; text: string }> = {
  active:    { bg: "#F2DD4820", text: "#9a7a00"  },
  completed: { bg: "#F6E5CF",   text: "#D89A3C"  },
  planned:   { bg: "#F1F1EF",   text: "#6F6F6B"  },
  archived:  { bg: "#F1F1EF",   text: "#A8A8A3"  },
  pending:   { bg: "#EAF2FF",   text: "#4E8DF4"  },
};

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

// ─── Expandable section ────────────────────────────────────────────────────────
function ExpandSection({ label, icon: Icon, defaultOpen = false, children }: {
  label: string; icon: React.ElementType; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-[#DEDEDA]">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F6F6F4] transition-colors text-left"
      >
        <span className="flex items-center gap-1.5 text-xs font-medium text-[#6F6F6B]">
          <Icon className="h-3.5 w-3.5" />{label}
        </span>
        {open
          ? <ChevronDown className="h-3.5 w-3.5 text-[#A8A8A3]" />
          : <ChevronRight className="h-3.5 w-3.5 text-[#A8A8A3]" />
        }
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

// ─── Cost breakdown ────────────────────────────────────────────────────────────
function CostBreakdown({ campaignId }: { campaignId: string }) {
  const data = CAMPAIGN_ITEMS[campaignId];
  const totalAds = data.paidAds.reduce((sum, i) => sum + (i.adSpend ?? 0), 0);
  const promoWithCost = data.promotions.filter(p => p.costNote);

  if (data.paidAds.length === 0 && promoWithCost.length === 0) {
    return <p className="text-[10px] text-[#A8A8A3]">No tracked costs for this campaign.</p>;
  }

  return (
    <div className="space-y-3 text-xs">
      {data.paidAds.length > 0 && (
        <div>
          <p className="font-semibold text-[#A8A8A3] uppercase tracking-wider text-[10px] mb-1.5">Paid Ads</p>
          {data.paidAds.map(item => (
            <div key={item.id} className="flex justify-between py-1 border-b border-[#F1F1EF]">
              <span className="text-[#6F6F6B] truncate pr-2 max-w-[200px]">
                {item.name.replace("Annual Membership Giveaway — ", "")}
              </span>
              <span className="font-semibold text-[#222222] shrink-0">
                {item.adSpend != null ? fmt(item.adSpend) : "—"}
              </span>
            </div>
          ))}
          <div className="flex justify-between py-1.5 font-semibold">
            <span className="text-[#6F6F6B]">Total Paid Ads</span>
            <span className="text-[#222222]">{fmt(totalAds)}</span>
          </div>
        </div>
      )}
      {promoWithCost.length > 0 && (
        <div>
          <p className="font-semibold text-[#A8A8A3] uppercase tracking-wider text-[10px] mb-1.5">Promotions</p>
          {promoWithCost.map(item => (
            <div key={item.id} className="py-1.5 border-b border-[#F1F1EF]">
              <p className="text-[#222222] font-medium">{item.name}</p>
              <p className="text-[#A8A8A3] mt-0.5 leading-relaxed">{item.costNote}</p>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-[#A8A8A3] pt-1">
        Non-cash costs tracked in Studio Soo &gt; Production
      </p>
    </div>
  );
}

// ─── Mini timeline ─────────────────────────────────────────────────────────────
function MiniTimeline({ campaignId }: { campaignId: string }) {
  const today = new Date();
  const winStart = new Date(today); winStart.setMonth(winStart.getMonth() - 1); winStart.setDate(1);
  const winEnd   = new Date(today); winEnd.setMonth(winEnd.getMonth() + 3);     winEnd.setDate(28);
  const winMs    = winEnd.getTime() - winStart.getTime();

  const items = TIMELINE_ITEMS.filter(i => i.campaigns.includes(campaignId));

  function toPct(dateStr: string) {
    return Math.max(0, Math.min(100, ((new Date(dateStr).getTime() - winStart.getTime()) / winMs) * 100));
  }

  const todayPct = Math.max(0, Math.min(100, ((today.getTime() - winStart.getTime()) / winMs) * 100));

  // Generate month labels
  const months: Array<{ label: string; pct: number }> = [];
  const d = new Date(winStart); d.setDate(1);
  while (d <= winEnd) {
    months.push({ label: d.toLocaleDateString("en-US", { month: "short" }), pct: toPct(d.toISOString().slice(0, 10)) });
    d.setMonth(d.getMonth() + 1);
  }

  if (items.length === 0) {
    return <p className="text-[10px] text-[#A8A8A3]">No timeline items for this campaign.</p>;
  }

  return (
    <div className="space-y-1">
      {/* Month header */}
      <div className="flex">
        <div className="w-[96px] shrink-0" />
        <div className="flex-1 relative h-4 text-[9px] text-[#A8A8A3]">
          {months.map((m, i) => (
            <span key={i} className="absolute -translate-x-1/2" style={{ left: `${m.pct}%` }}>{m.label}</span>
          ))}
        </div>
      </div>
      {/* Rows */}
      {items.map(item => {
        const color = CAMPAIGN_COLORS[item.campaigns[0]]?.solid ?? "#A8A8A3";
        const confirmed = item.datesConfirmed && item.start && item.end;
        const leftPct  = confirmed ? toPct(item.start) : 0;
        const widthPct = confirmed ? Math.max(1.5, toPct(item.end) - leftPct) : 2;
        const label    = item.name.length > 18 ? item.name.slice(0, 18) + "…" : item.name;

        return (
          <div key={item.id} className="flex items-center gap-2 mb-1">
            <span className="w-[96px] shrink-0 text-[9px] text-[#6F6F6B] truncate">{label}</span>
            <div className="flex-1 relative h-3 bg-[#F1F1EF] rounded overflow-hidden">
              <div
                className={`absolute top-0.5 h-2 rounded-sm ${!confirmed ? "border border-dashed border-[#A8A8A3]" : ""}`}
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  background: confirmed ? `${color}99` : "transparent",
                  minWidth: 4,
                }}
              />
              {/* Today marker */}
              <div
                className="absolute top-0 bottom-0 w-px opacity-80"
                style={{ left: `${todayPct}%`, background: "#F2DD48" }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-[9px] text-[#A8A8A3] pl-[104px] mt-1">
        Yellow line = today &nbsp;·&nbsp; {today.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </p>
    </div>
  );
}

// ─── AI strategy ──────────────────────────────────────────────────────────────
function AIStrategy({ campaignId, kpiData }: { campaignId: string; kpiData: any }) {
  if (!kpiData) return <p className="text-[10px] text-[#A8A8A3]">KPI data loading…</p>;

  const strategy: { status: string; action: string; color: string } = (() => {
    if (campaignId === "membership_acquisition") {
      const p = kpiData.membershipAcquisition?.progress ?? 0;
      if (p >= 80) return { status: "Strong trajectory", action: "Accelerate trial-to-member conversion",       color: "#72B84A" };
      if (p >= 50) return { status: "On track",          action: "Prioritize giveaway follow-up",               color: "#4E8DF4" };
      return               { status: "Behind pace",      action: "Email 77 giveaway applicants with $9 trial",  color: "#D89A3C" };
    }
    if (campaignId === "trial_conversion") {
      const cur = kpiData.trialConversion?.current ?? 0;
      const tgt = kpiData.trialConversion?.target  ?? 1;
      if (cur >= tgt) return { status: "Exceeding target", action: "Maintain Sunday Clinic momentum",              color: "#72B84A" };
      if (cur > 0)    return { status: "Below target",     action: "Add follow-up sequence for trial attendees",   color: "#D89A3C" };
      return                 { status: "No data yet",      action: "Set up trial booking tracking in Acuity",     color: "#A8A8A3" };
    }
    if (campaignId === "member_retention") {
      const cur = kpiData.memberRetention?.current ?? 0;
      if (cur >= 90) return { status: "Strong retention", action: "Focus on upsell and referral programs",    color: "#72B84A" };
      if (cur >= 75) return { status: "Good retention",   action: "Address churned member segments",          color: "#4E8DF4" };
      return                 { status: "Needs attention",  action: "Launch re-engagement campaign immediately", color: "#D89A3C" };
    }
    if (campaignId === "corporate_events") {
      const cur = kpiData.corporateEvents?.current ?? 0;
      const tgt = kpiData.corporateEvents?.target  ?? 1;
      if (cur >= tgt) return { status: "Goal met",     action: "Schedule next B2B outreach cycle",     color: "#72B84A" };
      return                 { status: "Below target", action: "Identify next event opportunity now",  color: "#D89A3C" };
    }
    return { status: "—", action: "No strategy available", color: "#A8A8A3" };
  })();

  return (
    <div className="space-y-2 text-xs">
      <span
        className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{ background: `${strategy.color}20`, color: strategy.color }}
      >
        {strategy.status}
      </span>
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#F6F6F4]">
        <Zap className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#F2DD48]" />
        <p className="text-[#222222] font-medium leading-snug">{strategy.action}</p>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
interface CampaignCardProps {
  campaignId: string;
  campaign: { totalBudget: number; totalSpend: number; totalRevenue: number; roi: number } | undefined;
  kpiData: any;
}

export function CampaignCard({ campaignId, campaign, kpiData }: CampaignCardProps) {
  const [, navigate] = useLocation();
  const data  = CAMPAIGN_ITEMS[campaignId];
  const color = CAMPAIGN_COLORS[campaignId]?.solid ?? "#A8A8A3";
  const bg    = CAMPAIGN_BG[campaignId] ?? "#F1F1EF";

  const allItems = [
    ...data.programs.map(i   => ({ item: i, category: "programs"   })),
    ...data.promotions.map(i => ({ item: i, category: "promotions" })),
    ...data.paidAds.map(i    => ({ item: i, category: "paidAds"    })),
  ];

  type KpiBlock = { value: string; sub: string; progress: number; isEstimated?: boolean };
  const kpi: KpiBlock | null = (() => {
    if (!kpiData) return null;
    if (campaignId === "membership_acquisition") {
      const d = kpiData.membershipAcquisition;
      return { value: String(d.current), sub: `/ ${d.target} members`, progress: d.progress };
    }
    if (campaignId === "trial_conversion") {
      const d = kpiData.trialConversion;
      return {
        value: String(d.current),
        sub: `visitors · target: ${d.target} / mo`,
        progress: d.progress,
        isEstimated: d.isEstimated ?? true,
      };
    }
    if (campaignId === "corporate_events") {
      const d = kpiData.corporateEvents;
      return {
        value: String(d.current),
        sub: `/ ${d.target} events / month`,
        progress: d.progress,
        isEstimated: d.isEstimated,
      };
    }
    // member_retention: handled separately as "model under review"
    return null;
  })();

  return (
    <div
      className="bg-white border border-[#DEDEDA] rounded-xl overflow-hidden"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
    >
      {/* Header */}
      <div
        className="px-4 pt-3.5 pb-3 flex items-center justify-between gap-3"
        style={{ background: `${bg}80` }}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
          <h2 className="text-[15px] font-semibold text-[#222222]">{CAMPAIGN_LABEL[campaignId]}</h2>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-[#DEDEDA] text-[#6F6F6B]">
          {allItems.length} items
        </span>
      </div>

      {/* KPI Block — Member Retention: model under review (Option A) */}
      {campaignId === "member_retention" && kpiData && (
        <div className="mx-4 my-3 p-3 rounded-lg border" style={{ background: bg, borderColor: `${color}30` }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A8A8A3] mb-2">
            MEMBER ENGAGEMENT SUPPORT
          </p>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[13px] font-semibold text-[#6F6F6B]">Retention model under review</span>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: "rgba(216,154,60,0.12)", color: "#C47A20" }}
            >
              UNDER REVIEW
            </span>
          </div>
          <p className="text-[10px] text-[#A8A8A3] mb-2">Engagement metrics active</p>
          <div className="space-y-1">
            {[
              { label: "Newsletter",          value: "Active"          },
              { label: "Monthly Happenings",  value: "Posted ✓"        },
              { label: "Sunday Clinic",        value: "Member benefit"  },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-0.5 border-b border-[#F1F1EF] last:border-0">
                <span className="text-[12px] text-[#6F6F6B]">{label}</span>
                <span className="text-[12px] text-[#72B84A] font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Block — standard (trial_conversion, membership_acquisition, corporate_events) */}
      {kpi && (
        <div className="mx-4 my-3 p-3 rounded-lg border" style={{ background: bg, borderColor: `${color}30` }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A8A8A3] mb-1">
            {CAMPAIGN_KPI_LABEL[campaignId]}
          </p>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[32px] font-bold leading-none text-[#222222]">{kpi.value}</span>
            <span className="text-sm text-[#6F6F6B]">{kpi.sub}</span>
            {kpi.isEstimated && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{ background: "rgba(216,154,60,0.12)", color: "#C47A20" }}
              >
                ESTIMATED
              </span>
            )}
          </div>
          <div className="h-1.5 bg-[#E9E9E6] rounded-full overflow-hidden mb-1.5">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, kpi.progress)}%`, background: color }} />
          </div>
          <p className="text-[10px] text-[#A8A8A3]">{kpi.progress.toFixed(1)}% of target</p>
          {campaignId === "corporate_events" && (
            <p className="text-[10px] text-[#A8A8A3] mt-1.5 leading-snug">
              B2B / group booking KPI requires further coordination with venue operations and HQ.
            </p>
          )}
        </div>
      )}

      {/* Financial Strip */}
      {campaign && (
        <div className="mx-4 mb-3">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: "Budget",  value: fmt(campaign.totalBudget)  },
              { label: "Spend",   value: fmt(campaign.totalSpend)   },
              { label: "Revenue", value: fmt(campaign.totalRevenue) },
            ].map(({ label, value }) => (
              <div key={label} className="p-2 rounded-lg bg-[#F6F6F4]">
                <p className="text-[10px] text-[#A8A8A3]">{label}</p>
                <p className="text-xs font-semibold text-[#222222] mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-[#A8A8A3] text-right mt-0.5 pr-0.5">All-Time (DB)</p>
        </div>
      )}

      {/* Items list */}
      <div className="border-t border-[#DEDEDA]">
        {allItems.map(({ item, category }) => {
          const pill = STATUS_PILL[item.status] ?? STATUS_PILL.pending;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className="w-full px-3.5 py-2 flex items-center gap-2 text-left hover:bg-[#F6F6F4] transition-colors border-b border-[#F1F1EF] last:border-b-0"
            >
              <span className="text-[10px] font-semibold shrink-0 w-14" style={{ color: TYPE_COLOR[category] }}>
                {TYPE_LABEL[category]}
              </span>
              <span className="flex-1 text-xs text-[#222222] truncate">{item.name}</span>
              {item.isCross && (
                <span className="text-[9px] px-1 py-0.5 rounded border border-[#DEDEDA] text-[#A8A8A3] shrink-0">cross</span>
              )}
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: pill.bg, color: pill.text }}
              >
                {item.status}
              </span>
              <ArrowRight className="h-3 w-3 text-[#A8A8A3] shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Next Actions stub — Membership Acquisition only */}
      {campaignId === "membership_acquisition" && (
        <div className="px-4 pb-3 border-t border-[#DEDEDA] pt-3">
          <div className="rounded-lg border border-[#DEDEDA] p-3 bg-[#F6F6F4]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span style={{ color: "#F2DD48", fontSize: "14px", lineHeight: 1 }}>✦</span>
              <span className="text-[12px] font-semibold text-[#222222]">Next Actions</span>
            </div>
            <p className="text-[10px] text-[#6F6F6B] mb-2 leading-snug">
              Recommended activities generated from dashboard analysis and synced into execution workflows.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                disabled
                className="text-[11px] px-2.5 py-1 rounded bg-white border border-[#DEDEDA] text-[#A8A8A3] cursor-not-allowed"
              >
                Generate next actions from data
              </button>
              <button
                disabled
                className="text-[11px] px-2.5 py-1 rounded bg-white border border-[#DEDEDA] text-[#A8A8A3] cursor-not-allowed"
              >
                Add activity manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expandable sections */}
      <ExpandSection label="Cost Breakdown" icon={DollarSign}>
        <CostBreakdown campaignId={campaignId} />
      </ExpandSection>
      <ExpandSection label="Timeline" icon={CalendarRange}>
        <MiniTimeline campaignId={campaignId} />
      </ExpandSection>
      <ExpandSection label="AI Strategy" icon={Zap}>
        <AIStrategy campaignId={campaignId} kpiData={kpiData} />
      </ExpandSection>
    </div>
  );
}
