/**
 * Golf VX Dashboard · Overview
 * ─────────────────────────────────────────────────────────────────────
 * Role:  Read-only live metrics — entry point to campaigns and programs.
 *        Designed as a 60-second pulse: open the app, see what matters.
 * Data:  trpc.dashboard.getOverview (real-time snapshot)
 *        CAMPAIGN_PULSE (static — refreshed manually from campaign data)
 * Users: All roles (studio_soo, location_staff, hq_admin)
 */
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, Target, Activity, Zap } from "lucide-react";
import { appRoutes, getVenueSlugFromPath } from "@/lib/routes";

// ─── Static pulse data — 4 strategic campaign groups ──────────────────────────
const CAMPAIGN_PULSE = [
  {
    id:          "membership_acquisition",
    name:        "Member Acquisition",
    sub:         "Memberships · Promotions · Referrals",
    status:      "Active",
    statusBg:    "rgba(242,221,72,0.18)",
    statusColor: "#8A7A00",
    signal:      "127 members · ~$24,975 est. MRR",
  },
  {
    id:          "trial_conversion",
    name:        "Trial & Experience",
    sub:         "Trial Sessions · Sunday Clinic · Drive Days",
    status:      "Active",
    statusBg:    "rgba(242,221,72,0.18)",
    statusColor: "#8A7A00",
    signal:      "~80 new visitors this quarter",
  },
  {
    id:          "member_retention",
    name:        "Membership Retention",
    sub:         "Renewals · Engagement · Loyalty",
    status:      "Active",
    statusBg:    "rgba(242,221,72,0.18)",
    statusColor: "#8A7A00",
    signal:      "Retention model under review",
  },
  {
    id:          "corporate_events",
    name:        "B2B / Corporate Events",
    sub:         "Group bookings · Corporate outreach",
    status:      "Active",
    statusBg:    "rgba(242,221,72,0.18)",
    statusColor: "#8A7A00",
    signal:      "2 events est. · target: 2/mo",
  },
] as const;

// ─── Design tokens ────────────────────────────────────────────────────────────
const TEXT_P = "#222222";
const TEXT_S = "#6F6F6B";
const TEXT_M = "#A8A8A3";
const BORDER = "#DEDEDA";
const BG_S   = "#F1F1EF";

export default function Overview() {
  const [dateRange] = useState(() => ({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate:   new Date(),
  }));
  const { data: dashboardData, isLoading } = trpc.dashboard.getOverview.useQuery(dateRange);

  const [location] = useLocation();
  const params = useParams<{ venueSlug?: string }>();
  const venueSlug = params.venueSlug ?? getVenueSlugFromPath(location) ?? "arlington-heights";
  const routes = appRoutes.venue(venueSlug);

  const kpis = [
    {
      label: "Total Members",
      value: dashboardData?.totalMembers ?? "—",
      icon:  <Users size={20} />,
      color: "text-[#6F6F6B]",
      bg:    "bg-blue-400/10",
    },
    {
      label: "MRR",
      value: dashboardData?.monthlyRecurringRevenue
        ? `$${Math.round(dashboardData.monthlyRecurringRevenue).toLocaleString()}`
        : "—",
      icon:  <DollarSign size={20} />,
      color: "text-[#72B84A]",
      bg:    "bg-green-400/10",
    },
    {
      label: "Active Campaigns",
      value: dashboardData?.activeCampaignsCount ?? "—",
      icon:  <Target size={20} />,
      color: "text-[#F2DD48]",
      bg:    "bg-[#F2DD48]/10",
    },
    {
      label: "Conversion Rate",
      value: dashboardData?.overallROI ? `${dashboardData.overallROI}%` : "—",
      icon:  <TrendingUp size={20} />,
      color: "text-[#6F6F6B]",
      bg:    "bg-purple-400/10",
    },
    {
      label: "New Leads (30d)",
      value: dashboardData?.activeMembers ?? "—",
      icon:  <Activity size={20} />,
      color: "text-[#F2DD48]",
      bg:    "bg-orange-400/10",
    },
    {
      label: "Ad Spend (30d)",
      value: dashboardData?.marketingSpend
        ? `$${parseFloat(dashboardData.marketingSpend).toLocaleString()}`
        : "—",
      icon:  <Zap size={20} />,
      color: "text-[#FF3B30]",
      bg:    "bg-red-400/10",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: TEXT_P }}>Overview</h1>
        <p style={{ fontSize: "13px", color: TEXT_S, marginTop: "4px" }}>
          Business performance at a glance
        </p>
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-[#DEDEDA]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map(kpi => (
            <Card key={kpi.label} className="bg-white border-[#DEDEDA]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs mb-1" style={{ color: TEXT_S }}>{kpi.label}</p>
                    <p className="text-2xl font-bold" style={{ color: TEXT_P }}>{kpi.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${kpi.bg}`}>
                    <span className={kpi.color}>{kpi.icon}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Campaign Pulse */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: BORDER }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h2 className="text-[15px] font-semibold" style={{ color: TEXT_P }}>Quick Campaign Pulse</h2>
          <p className="text-[12px] mt-0.5" style={{ color: TEXT_S }}>
            Current strategic campaign groups and the main programs, promotions, and paid efforts supporting them.
          </p>
        </div>

        <table className="w-full">
          <thead>
            <tr style={{ background: BG_S, borderBottom: `1px solid ${BORDER}` }}>
              <th className="text-left px-5 py-2.5 text-[11px] font-normal" style={{ color: TEXT_M }}>Campaign</th>
              <th className="text-left px-5 py-2.5 text-[11px] font-normal" style={{ color: TEXT_M }}>Status</th>
              <th className="text-left px-5 py-2.5 text-[11px] font-normal" style={{ color: TEXT_M }}>Signal</th>
              <th className="text-right px-5 py-2.5 text-[11px] font-normal" style={{ color: TEXT_M }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {CAMPAIGN_PULSE.map((row, i) => (
              <tr key={row.id} style={{ borderBottom: i < CAMPAIGN_PULSE.length - 1 ? `1px solid ${BORDER}` : undefined }}>
                <td className="px-5 py-3">
                  <div className="text-[13px] font-semibold" style={{ color: TEXT_P }}>{row.name}</div>
                  <div className="text-[11px]" style={{ color: TEXT_M }}>{row.sub}</div>
                </td>
                <td className="px-5 py-3">
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: row.statusBg, color: row.statusColor }}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-[13px]" style={{ color: TEXT_S }}>{row.signal}</td>
                <td className="px-5 py-3 text-right">
                  <a href={routes.studioSoo.campaignDetail(row.id)} className="text-[12px]" style={{ color: "#4E8DF4" }}>
                    View →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Campaigns link hidden — StrategicCampaigns has a conditional useState hook violation (React #310). Re-expose once fixed. */}
      </div>
    </div>
  );
}
