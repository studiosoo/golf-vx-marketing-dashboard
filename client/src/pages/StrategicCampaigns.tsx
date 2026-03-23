import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp,
  Target,
  DollarSign,
  BarChart3,
  ChevronRight,
  CalendarRange,
  LayoutGrid,
  UserCheck,
  Users,
  Flag,
} from "lucide-react";
import { useLocation } from "wouter";
import { DEFAULT_VENUE_SLUG } from "@/lib/routes";
import AsanaTimeline from "@/components/AsanaTimeline";
import { MetaAdsStatusBadge } from "@/components/MetaAdsStatusBadge";
import { cn } from "@/lib/utils";

// ── Design-system campaign palette ─────────────────────────────────────────
const CAMPAIGN_STYLE: Record<string, {
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  kpiLabel: string;
}> = {
  trial_conversion: {
    label: "Trial Conversion",
    color: "#72B84A",
    bg: "#E6F0DC",
    icon: Target,
    kpiLabel: "Conversion Rate",
  },
  membership_acquisition: {
    label: "Membership Acquisition",
    color: "#4E8DF4",
    bg: "#EAF2FF",
    icon: UserCheck,
    kpiLabel: "Members Acquired",
  },
  member_retention: {
    label: "Member Retention",
    color: "#A87FBE",
    bg: "#F3EDF8",
    icon: Users,
    kpiLabel: "Retention Rate",
  },
  corporate_events: {
    label: "B2B & Events",
    color: "#D89A3C",
    bg: "#F6E5CF",
    icon: Flag,
    kpiLabel: "Events / Month",
  },
};

function fmt(n: number) {
  return n.toLocaleString("en-US");
}
function fmtCurrency(n: number) {
  return "$" + fmt(Math.round(n));
}

function getProgramRoute(program: { id: number; name: string }, venueSlug: string): string {
  const name = program.name.toLowerCase();
  if (name.includes("winter clinic") || name.includes("pbga winter")) {
    return `/app/${venueSlug}/activities/programs/winter-camp`;
  }
  if (name.includes("summer camp") || name.includes("junior")) {
    return `/app/${venueSlug}/activities/programs/junior-summer-camp`;
  }
  if (name.includes("sunday clinic") || name.includes("drive day")) {
    return `/app/${venueSlug}/activities/programs/sunday-clinic`;
  }
  if (name.includes("trial")) {
    return `/app/${venueSlug}/activities/promotions/trial-session`;
  }
  return `/app/${venueSlug}/activities/programs/${program.id}`;
}

export default function StrategicCampaigns() {
  const [location, setLocation] = useLocation();
  const venueSlugMatch = location.match(/\/app\/([^/]+)\//);
  const venueSlug = venueSlugMatch?.[1] || DEFAULT_VENUE_SLUG;

  const { data: campaigns, isLoading } = trpc.strategicCampaigns.getOverview.useQuery();
  const { data: kpiData } = trpc.intelligence.getStrategicKPIs.useQuery();
  const [activeTab, setActiveTab] = useState<"campaigns" | "timeline">("campaigns");

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="h-8 w-64 bg-[#F1F1EF] rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-[#F1F1EF] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-72 bg-[#F1F1EF] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalCampaigns = campaigns?.length ?? 0;
  const totalPrograms = campaigns?.reduce((s, c) => s + c.totalPrograms, 0) ?? 0;
  const totalSpend = campaigns?.reduce((s, c) => s + c.totalSpend, 0) ?? 0;
  const totalRevenue = campaigns?.reduce((s, c) => s + c.totalRevenue, 0) ?? 0;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#222222] leading-tight">Strategic Campaigns</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[13px] text-[#888888]">
              High-level strategic objectives with aggregated program performance
            </p>
            <MetaAdsStatusBadge />
          </div>
        </div>
        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#F1F1EF] rounded-xl border border-[#DEDEDA] self-start sm:self-auto shrink-0">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all",
              activeTab === "campaigns"
                ? "bg-white text-[#222222] shadow-sm"
                : "text-[#888888] hover:text-[#222222]"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all",
              activeTab === "timeline"
                ? "bg-white text-[#222222] shadow-sm"
                : "text-[#888888] hover:text-[#222222]"
            )}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            Asana Timeline
          </button>
        </div>
      </div>

      {activeTab === "timeline" && <AsanaTimeline />}

      {activeTab === "campaigns" && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Campaigns", value: fmt(totalCampaigns), icon: Target, note: "Strategic objectives" },
              { label: "Total Programs", value: fmt(totalPrograms), icon: BarChart3, note: "Tactical programs" },
              { label: "Total Spend", value: fmtCurrency(totalSpend), icon: DollarSign, note: "Across all programs" },
              { label: "Total Revenue", value: fmtCurrency(totalRevenue), icon: TrendingUp, note: "Generated revenue" },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-xl border border-[#DEDEDA] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-[#888888]">{stat.label}</span>
                    <Icon className="h-3.5 w-3.5 text-[#AAAAAA]" />
                  </div>
                  <p className="text-[22px] font-bold text-[#222222] leading-none">{stat.value}</p>
                  <p className="text-[11px] text-[#AAAAAA] mt-1">{stat.note}</p>
                </div>
              );
            })}
          </div>

          {/* Campaign cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(campaigns ?? []).map(campaign => {
              const style = CAMPAIGN_STYLE[campaign.id] ?? {
                label: campaign.name,
                color: "#888888",
                bg: "#F1F1EF",
                icon: BarChart3,
                kpiLabel: "KPI",
              };
              const Icon = style.icon;

              // Enrich primary KPI from live data
              let kpiBlock: React.ReactNode = null;
              if (campaign.id === "membership_acquisition" && kpiData) {
                const { current, target, progress } = kpiData.membershipAcquisition;
                kpiBlock = (
                  <div className="p-3 rounded-lg border border-[#DEDEDA] bg-[#FAFAFA] mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">
                      Primary KPI — Membership Goal
                    </p>
                    <div className="flex items-end justify-between mb-1.5">
                      <span className="text-[28px] font-bold text-[#222222] leading-none">{current}</span>
                      <span className="text-[12px] text-[#888888] mb-0.5">/ {target} members</span>
                    </div>
                    <div className="h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden mb-1">
                      <div className="h-full rounded-full bg-[#4E8DF4]" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <p className="text-[11px] text-[#888888]">
                      {progress.toFixed(1)}% to year-end target · Need {target - current} more members
                    </p>
                  </div>
                );
              } else if (campaign.id === "trial_conversion" && kpiData) {
                const { current, target, progress, note } = kpiData.trialConversion;
                kpiBlock = (
                  <div className="p-3 rounded-lg border border-[#DEDEDA] bg-[#FAFAFA] mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">
                      Primary KPI — New Paying Members (90d)
                    </p>
                    <div className="flex items-end justify-between mb-1.5">
                      <span
                        className="text-[28px] font-bold leading-none"
                        style={{
                          color: current >= target ? "#72B84A" : current > 0 ? "#D89A3C" : "#888888",
                        }}
                      >
                        {current}
                      </span>
                      <span className="text-[12px] text-[#888888] mb-0.5">goal: {target} members</span>
                    </div>
                    <div className="h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden mb-1">
                      <div className="h-full rounded-full bg-[#72B84A]" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <p className="text-[11px] text-[#888888]">{note}</p>
                  </div>
                );
              } else if (campaign.id === "member_retention" && kpiData) {
                const { current, target, progress } = kpiData.memberRetention;
                kpiBlock = (
                  <div className="p-3 rounded-lg border border-[#DEDEDA] bg-[#FAFAFA] mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">
                      Primary KPI — Retention Rate
                    </p>
                    <div className="flex items-end justify-between mb-1.5">
                      <span
                        className="text-[28px] font-bold leading-none"
                        style={{ color: current >= target ? "#72B84A" : "#D89A3C" }}
                      >
                        {current.toFixed(1)}%
                      </span>
                      <span className="text-[12px] text-[#888888] mb-0.5">target: {target}%</span>
                    </div>
                    <div className="h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden mb-1">
                      <div className="h-full rounded-full bg-[#A87FBE]" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <p className="text-[11px] text-[#888888]">
                      {current >= target
                        ? `Exceeding goal by ${(current - target).toFixed(1)}%`
                        : `${(target - current).toFixed(1)}% below target`}
                    </p>
                  </div>
                );
              } else if (campaign.id === "corporate_events" && kpiData) {
                const { current, target, progress } = kpiData.corporateEvents;
                kpiBlock = (
                  <div className="p-3 rounded-lg border border-[#DEDEDA] bg-[#FAFAFA] mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">
                      Primary KPI — B2B Events This Month
                    </p>
                    <div className="flex items-end justify-between mb-1.5">
                      <span className="text-[28px] font-bold text-[#222222] leading-none">{current}</span>
                      <span className="text-[12px] text-[#888888] mb-0.5">/ {target} events</span>
                    </div>
                    <div className="h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden mb-1">
                      <div className="h-full rounded-full bg-[#D89A3C]" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <p className="text-[11px] text-[#888888]">
                      Target: {target} events/mo ·{" "}
                      {current >= target ? "On track" : `Need ${target - current} more events`}
                    </p>
                  </div>
                );
              }

              return (
                <div
                  key={campaign.id}
                  className="bg-white rounded-xl border border-[#DEDEDA] p-5 flex flex-col gap-3"
                >
                  {/* Campaign header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: style.bg }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: style.color }} />
                      </div>
                      <div>
                        <h2 className="text-[15px] font-bold text-[#222222] leading-tight">{style.label}</h2>
                        <p className="text-[11px] text-[#888888] mt-0.5">{campaign.description}</p>
                      </div>
                    </div>
                    {campaign.totalPrograms > 0 && (
                      <span
                        className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ color: style.color, background: style.bg }}
                      >
                        {campaign.totalPrograms} {campaign.totalPrograms === 1 ? "program" : "programs"}
                      </span>
                    )}
                  </div>

                  {/* Primary KPI block */}
                  {kpiBlock}

                  {/* Metrics grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Budget", value: fmtCurrency(campaign.totalBudget) },
                      { label: "Spend", value: fmtCurrency(campaign.totalSpend) },
                      { label: "Revenue", value: fmtCurrency(campaign.totalRevenue) },
                    ].map(m => (
                      <div key={m.label} className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
                        <p className="text-[10px] text-[#888888]">{m.label}</p>
                        <p className="text-[13px] font-bold text-[#222222] mt-0.5">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Secondary metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
                      <p className="text-[10px] text-[#888888]">Cost per Acquisition</p>
                      <p className="text-[13px] font-bold text-[#222222] mt-0.5">
                        {campaign.totalSpend > 0 && campaign.programs.length > 0
                          ? fmtCurrency(campaign.totalSpend / Math.max(1, campaign.programs.filter(p => p.revenue > 0).length))
                          : campaign.totalSpend > 0
                          ? fmtCurrency(campaign.totalSpend) + " total"
                          : "—"}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
                      <p className="text-[10px] text-[#888888]">Financial ROI</p>
                      <p
                        className="text-[13px] font-bold mt-0.5"
                        style={{ color: campaign.roi >= 0 ? "#72B84A" : "#C81E1E" }}
                      >
                        {campaign.roi >= 0 ? "+" : ""}{campaign.roi.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Landing page CTA */}
                  {campaign.landingPageUrl && (
                    <a
                      href={campaign.landingPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full px-4 py-2 text-[13px] font-semibold text-[#222222] bg-[#F2DD48] hover:brightness-95 active:scale-95 rounded-lg transition-all"
                    >
                      View Landing Page
                    </a>
                  )}

                  {/* Supporting programs */}
                  {campaign.programs.length > 0 && (
                    <div className="pt-2 border-t border-[#F0F0F0]">
                      <p className="text-[11px] font-semibold text-[#888888] uppercase tracking-widest mb-2">
                        Supporting Programs
                      </p>
                      <div className="space-y-1">
                        {campaign.programs.map(program => {
                          const programRoi =
                            program.spend > 0
                              ? ((program.revenue - program.spend) / program.spend) * 100
                              : 0;
                          return (
                            <button
                              key={program.id}
                              onClick={() => setLocation(getProgramRoute(program, venueSlug))}
                              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F1F1EF] transition-colors text-left group"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-[#222222] truncate">{program.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-[#888888]">
                                    {fmtCurrency(program.spend)} spend
                                  </span>
                                  <span className="text-[11px] text-[#888888]">
                                    {fmtCurrency(program.revenue)} revenue
                                  </span>
                                  <span
                                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                                    style={{
                                      color: program.status === "active" ? "#4C882A" : program.status === "completed" ? "#B46A0B" : "#888888",
                                      background: program.status === "active" ? "#E6F0DC" : program.status === "completed" ? "#F6E5CF" : "#F1F1EF",
                                    }}
                                  >
                                    {program.status}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 ml-3 shrink-0">
                                <span
                                  className="text-[12px] font-semibold"
                                  style={{ color: programRoi >= 0 ? "#72B84A" : "#C81E1E" }}
                                >
                                  {programRoi >= 0 ? "+" : ""}{programRoi.toFixed(0)}%
                                </span>
                                <ChevronRight className="h-3.5 w-3.5 text-[#AAAAAA] group-hover:text-[#222222] transition-colors" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty state for campaigns with no programs yet */}
                  {campaign.programs.length === 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-[#FAFAFA] border border-dashed border-[#DEDEDA]">
                      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: style.color }} />
                      <p className="text-[11px] text-[#888888]">No programs linked yet — add programs in the Activities section</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
