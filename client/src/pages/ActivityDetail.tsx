import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import { AlertCircle, CheckSquare, ArrowLeft, BarChart2, Lightbulb, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { appRoutes, getVenueSlugFromPath } from "@/lib/routes";
import { EmptyState } from "@/components/ui/EmptyState";
import { AssetGallery } from "@/components/activities/AssetGallery";
import { ACTIVITY_ITEMS, ActivityItem, ActivityStatus, ContentAsset } from "./Activities";
import SundayClinicDetail from "./SundayClinicDetail";
import WinterClinicDetail from "./WinterClinicDetail";

// ─── Types ────────────────────────────────────────────────────

type DetailTab = "overview" | "tasks" | "content" | "budget" | "analytics";

// ─── Status Badge ─────────────────────────────────────────────

function StatusBadge({ status }: { status: ActivityStatus }) {
  const map: Record<ActivityStatus, { bg: string; color: string; label: string }> = {
    active:    { bg: "rgba(242,221,72,0.18)",  color: "#B89A00", label: "Active" },
    completed: { bg: "rgba(216,154,60,0.18)",  color: "#C47A20", label: "Completed" },
    upcoming:  { bg: "rgba(78,141,244,0.15)",  color: "#2F6CD4", label: "Upcoming" },
    planned:   { bg: "rgba(168,168,163,0.2)",  color: "#6F6F6B", label: "Planned" },
  };
  const s = map[status];
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "4px" }}>
      {s.label}
    </span>
  );
}

// ─── Helpers ───────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// ─── Acuity KPI Skeleton ───────────────────────────────────────

function KpiSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse" style={{ background: "#F1F1EF", borderRadius: "10px", height: "88px" }} />
      ))}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────

function OverviewTab({ item, venueSlug }: { item: ActivityItem; venueSlug: string }) {
  // Annual Giveaway uses its own dedicated query
  const { data: giveawayStats } = trpc.giveaway.getStats.useQuery(
    undefined,
    { enabled: item.id === "annual-giveaway", staleTime: 30 * 1000 }
  );

  // Acuity data for Acuity-linked programs
  const { data: acuityData, isLoading: acuityLoading, isError: acuityError } =
    trpc.activities.getActivityAcuityData.useQuery(
      { venueId: venueSlug, activityId: item.id, activityName: item.name },
      { enabled: !!item.acuityCategory && item.id !== "annual-giveaway", staleTime: 2 * 60 * 1000 }
    );

  const dateRange =
    item.startDate && item.endDate ? `${item.startDate} – ${item.endDate}` :
    item.startDate ? `From ${item.startDate}` :
    item.endDate   ? `Until ${item.endDate}` :
    null;

  const integrations = [
    "Asana",
    ...(item.acuityCategory ? ["Acuity"] : []),
    ...(item.toastUrl       ? ["Toast POS"] : []),
  ].join(" · ");

  // ── KPI values ──────────────────────────────────────────────
  type Kpi = { label: string; value: string; unit?: string; warning?: string; note?: string };

  let kpis: Kpi[];

  if (item.id === "annual-giveaway" && giveawayStats) {
    kpis = [
      { label: "Applications",  value: String(giveawayStats.totalApplications ?? "—"), unit: "long-form entries" },
      { label: "Entry Page UV", value: "875",   unit: "short-form visits" },
      { label: "Funnel Rate",   value: giveawayStats.totalApplications ? `${((giveawayStats.totalApplications / 875) * 100).toFixed(1)}%` : "—", unit: "long-form / UV" },
    ];
  } else if (item.acuityCategory && acuityData) {
    const noCredentials = acuityData.source === "no_credentials";
    const noMatch       = acuityData.source === "no_match";

    const participantsVal = noCredentials ? "[AWAITING INTEGRATION]"
      : noMatch            ? "— (type not mapped)"
      : acuityData.participants != null ? String(acuityData.participants)
      : "—";

    const revenueVal = noCredentials ? "[AWAITING INTEGRATION]"
      : noMatch ? "—"
      : acuityData.revenue != null ? fmtCurrency(acuityData.revenue)
      : "[AWAITING INTEGRATION]";

    kpis = [
      {
        label:   "Participants",
        value:   participantsVal,
        unit:    "unique attendees · Acuity",
        warning: noMatch ? acuityData.mappingNote : undefined,
      },
      {
        label: "Revenue",
        value: revenueVal,
        unit:  "USD · Acuity",
        note:  acuityData.revenue == null && !noCredentials && !noMatch ? "Acuity price data not available for this type" : undefined,
      },
      ...(item.staticKpis?.slice(2) ?? [
        { label: "Goal Rate", value: "—", unit: "%" },
      ]),
    ];
  } else if (item.staticKpis) {
    kpis = item.staticKpis;
  } else {
    kpis = [
      { label: "Participants", value: "—", unit: "members" },
      { label: "Revenue",      value: "—", unit: "USD" },
      { label: "Goal Rate",    value: "—", unit: "%" },
    ];
  }

  // ── Recent appointments from Acuity ────────────────────────
  const recentApts = (item.acuityCategory && acuityData && "recentAppointments" in acuityData)
    ? acuityData.recentAppointments
    : [];

  return (
    <div className="space-y-6">
      {/* Strategic Note (pinned insight) */}
      {item.strategicNote && (
        <div style={{ background: "rgba(242,221,72,0.1)", border: "1px solid rgba(242,221,72,0.4)", borderRadius: "10px", padding: "14px 16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <Lightbulb size={15} style={{ color: "#B89A00", flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "13px", color: "#6F6F6B", lineHeight: 1.5 }}>{item.strategicNote}</p>
        </div>
      )}

      {/* Metadata card */}
      <div style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", padding: "20px" }}>
        {item.description && (
          <p style={{ fontSize: "13px", color: "#6F6F6B", marginBottom: "16px" }}>{item.description}</p>
        )}
        {item.note && (
          <p style={{ fontSize: "13px", color: "#A8A8A3", marginBottom: "16px", fontStyle: "italic" }}>{item.note}</p>
        )}
        <div style={{ display: "grid", gap: "10px" }}>
          {dateRange && (
            <div style={{ display: "flex", gap: "12px", fontSize: "13px" }}>
              <span style={{ color: "#A8A8A3", minWidth: "96px" }}>Period</span>
              <span style={{ color: "#222222" }}>{dateRange}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: "12px", fontSize: "13px", alignItems: "center" }}>
            <span style={{ color: "#A8A8A3", minWidth: "96px" }}>Status</span>
            <StatusBadge status={item.status} />
          </div>
          {item.group && (
            <div style={{ display: "flex", gap: "12px", fontSize: "13px" }}>
              <span style={{ color: "#A8A8A3", minWidth: "96px" }}>Group</span>
              <span style={{ color: "#222222" }}>{item.group}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: "12px", fontSize: "13px" }}>
            <span style={{ color: "#A8A8A3", minWidth: "96px" }}>Integrations</span>
            <span style={{ color: "#222222" }}>{integrations}</span>
          </div>
          <div style={{ display: "flex", gap: "12px", fontSize: "13px" }}>
            <span style={{ color: "#A8A8A3", minWidth: "96px" }}>Asana GID</span>
            <span style={{ color: "#A8A8A3", fontFamily: "monospace" }}>{item.asanaGid}</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {acuityLoading && item.acuityCategory && item.id !== "annual-giveaway"
        ? <KpiSkeleton />
        : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {kpis.map(kpi => (
              <div key={kpi.label} style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", padding: "16px" }}>
                <div style={{ fontSize: "11px", color: "#6F6F6B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  {kpi.label}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "var(--gvx-text-xl, 22px)", fontWeight: 700, color: "#222222", lineHeight: 1 }}>
                    {kpi.value}
                  </span>
                  {kpi.warning && (
                    <span title={kpi.warning} style={{ cursor: "help", fontSize: "13px" }}>⚠️</span>
                  )}
                </div>
                <div style={{ fontSize: "var(--gvx-text-sm, 13px)", color: "#A8A8A3", marginTop: "4px" }}>{kpi.unit}</div>
                {kpi.note && (
                  <div style={{ fontSize: "11px", color: "#A8A8A3", marginTop: "4px", fontStyle: "italic" }}>{kpi.note}</div>
                )}
              </div>
            ))}
          </div>
        )
      }

      {/* Recent activity — Acuity appointments */}
      <div style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", padding: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#222222", marginBottom: "12px" }}>Recent Activity</div>
        {acuityLoading && item.acuityCategory ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} style={{ height: 36, background: "#F1F1EF", borderRadius: "6px" }} />)}
          </div>
        ) : acuityError ? (
          <EmptyState icon={<AlertCircle size={18} />} message="Could not load Acuity data." />
        ) : recentApts.length > 0 ? (
          <div style={{ display: "grid", gap: "0" }}>
            {recentApts.map((apt, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 0",
                  borderBottom: i < recentApts.length - 1 ? "1px solid #F1F1EF" : "none",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: apt.status === "confirmed" ? "#72B84A" : "#A8A8A3", fontWeight: 600, minWidth: "10px" }}>
                  {apt.status === "confirmed" ? "✓" : "✗"}
                </span>
                <span style={{ color: "#222222", fontWeight: 500, minWidth: "120px" }}>
                  {apt.firstName} {apt.lastInitial}.
                </span>
                <span style={{ color: "#6F6F6B", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {apt.type}
                </span>
                <span style={{ color: "#A8A8A3", flexShrink: 0, fontSize: "12px" }}>
                  {fmtDate(apt.date)}
                </span>
              </div>
            ))}
            <div style={{ fontSize: "11px", color: "#A8A8A3", marginTop: "8px" }}>
              Source: Acuity Scheduling
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<CheckSquare size={18} />}
            message={item.acuityCategory ? "No recent Acuity appointments found." : "No recent activity recorded."}
          />
        )}
      </div>
    </div>
  );
}

// ─── Task Log Tab ─────────────────────────────────────────────

function TaskLogTab({ projectGid }: { projectGid: string }) {
  const { data, isLoading, isError } = trpc.asana.getProjectTasks.useQuery({ projectGid });
  const today = new Date().toISOString().slice(0, 10);

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div style={{ height: 64, background: "#F1F1EF", borderRadius: "10px", marginBottom: "12px" }} />
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 40, background: "#F1F1EF", borderRadius: "6px" }} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle size={20} />}
        message="Could not load task log. Check your connection."
      />
    );
  }

  if (!data?.tasks.length) {
    return (
      <EmptyState
        icon={<CheckSquare size={20} />}
        message="No tasks found in this project."
      />
    );
  }

  const totalTasks     = data.tasks.length;
  const completedTasks = data.tasks.filter(t => t.completed).length;
  const overdueTasks   = data.tasks.filter(t => !t.completed && !!t.due_on && t.due_on < today).length;
  const openTasks      = totalTasks - completedTasks;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {[
          { label: "Total",     value: totalTasks,     color: "#222222" },
          { label: "Open",      value: openTasks,      color: "#4E8DF4" },
          { label: "Completed", value: completedTasks, color: "#72B84A" },
          { label: "Overdue",   value: overdueTasks,   color: overdueTasks > 0 ? "#F87171" : "#A8A8A3" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", padding: "12px 16px" }}>
            <div style={{ fontSize: "11px", color: "#A8A8A3", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Task list */}
      <div style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", overflow: "hidden" }}>
        {data.tasks.map(task => {
          const isOverdue = !task.completed && !!task.due_on && task.due_on < today;
          return (
            <div
              key={task.gid}
              style={{
                minHeight: 40,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 16px",
                borderBottom: "1px solid #F1F1EF",
                opacity: task.completed ? 0.5 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={task.completed}
                disabled
                style={{ flexShrink: 0, cursor: "default", accentColor: "#F2DD48" }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: "14px",
                  color: task.completed ? "#A8A8A3" : "#222222",
                  textDecoration: task.completed ? "line-through" : "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {task.name}
              </span>
              {task.assignee && (
                <span style={{ fontSize: "12px", color: "#6F6F6B", flexShrink: 0 }}>{task.assignee}</span>
              )}
              {task.due_on && (
                <span style={{ fontSize: "12px", color: isOverdue ? "#F87171" : "#6F6F6B", flexShrink: 0 }}>
                  {task.due_on}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Status badge for content asset ──────────────────────────

function AssetStatusBadge({ status }: { status: ContentAsset["status"] }) {
  if (!status) return null;
  const map: Record<NonNullable<ContentAsset["status"]>, { bg: string; color: string; label: string }> = {
    available:     { bg: "rgba(114,184,74,0.15)",  color: "#72B84A", label: "Available" },
    planned:       { bg: "rgba(168,168,163,0.18)", color: "#6F6F6B", label: "Planned" },
    in_production: { bg: "rgba(78,141,244,0.15)",  color: "#4E8DF4", label: "In Production" },
  };
  const s = map[status];
  return (
    <span style={{ fontSize: "10px", fontWeight: 500, color: s.color, background: s.bg, padding: "2px 7px", borderRadius: "4px", whiteSpace: "nowrap" as const }}>
      {s.label}
    </span>
  );
}

// ─── Content Tab ─────────────────────────────────────────────

function ContentTab({ item, venueId }: { item: ActivityItem; venueId: string }) {
  return (
    <div className="space-y-4">
      {/* Asset Manifest Table */}
      {item.contentAssets && item.contentAssets.length > 0 && (
        <div style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #DEDEDA" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#222222" }}>Asset Manifest</div>
          </div>
          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
              <thead>
                <tr style={{ background: "#F6F6F4" }}>
                  {["Label", "Period", "Format", "Status", "Notes"].map(h => (
                    <th key={h} style={{ padding: "8px 16px", textAlign: "left" as const, fontSize: "11px", color: "#A8A8A3", fontWeight: 400, borderBottom: "1px solid #DEDEDA" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.contentAssets.map((asset, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F1EF" }}>
                    <td style={{ padding: "10px 16px", fontSize: "13px", fontWeight: 500, color: "#222222" }}>{asset.label}</td>
                    <td style={{ padding: "10px 16px", fontSize: "13px", color: "#6F6F6B" }}>{asset.period ?? "—"}</td>
                    <td style={{ padding: "10px 16px", fontSize: "13px", color: "#6F6F6B" }}>{asset.format ?? "—"}</td>
                    <td style={{ padding: "10px 16px" }}><AssetStatusBadge status={asset.status} /></td>
                    <td style={{ padding: "10px 16px", fontSize: "12px", color: "#A8A8A3" }}>{asset.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Acuity category (if applicable) */}
      {item.acuityCategory && (
        <div style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", padding: "14px 20px", fontSize: "13px", color: "#6F6F6B" }}>
          Acuity category: <span style={{ color: "#222222", fontWeight: 500 }}>{item.acuityCategory}</span>
        </div>
      )}

      {/* Collateral Gallery */}
      <AssetGallery activityId={item.id} venueId={venueId} staticAssets={item.contentAssets} />
    </div>
  );
}

// ─── Budget Tab ───────────────────────────────────────────────

function BudgetTab({
  projectGid, itemId, toastUrl, venueSlug, activityName,
}: {
  projectGid:   string;
  itemId:       string;
  toastUrl?:    string;
  venueSlug:    string;
  activityName: string;
}) {
  const { data, isLoading } = trpc.asana.getProjectBudget.useQuery({ projectGid });
  const { data: metaData, isLoading: metaLoading } = trpc.activities.getActivityMetaAdsData.useQuery(
    { venueId: venueSlug, activityId: itemId, activityName },
    { staleTime: 5 * 60 * 1000 }
  );

  const fmt = (n: number | null | undefined) =>
    n != null ? `$${n.toLocaleString()}` : "—";

  const budget    = data?.budget ?? null;
  const spend     = data?.spend  ?? null;
  const remaining = budget != null && spend != null ? budget - spend : null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 88, background: "#F1F1EF", borderRadius: "10px" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Asana budget */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        {[
          { label: "Spent",     value: fmt(spend) },
          { label: "Budget",    value: fmt(budget) },
          { label: "Remaining", value: fmt(remaining) },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", padding: "16px" }}>
            <div style={{ fontSize: "11px", color: "#6F6F6B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              {label}
            </div>
            <div style={{ fontSize: "var(--gvx-text-xl, 22px)", fontWeight: 700, color: "#222222", lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: "var(--gvx-text-sm, 13px)", color: "#A8A8A3", marginTop: "4px" }}>USD · Asana</div>
          </div>
        ))}
      </div>

      {/* Meta Ads paid media section */}
      <div style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F1EF", display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={14} style={{ color: "#4E8DF4" }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#222222" }}>Paid Media (Meta Ads)</span>
        </div>
        {metaLoading ? (
          <div className="animate-pulse" style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: 52, background: "#F1F1EF", borderRadius: "6px" }} />
            ))}
          </div>
        ) : metaData?.matched ? (
          <div style={{ padding: "20px" }}>
            <div style={{ fontSize: "12px", color: "#6F6F6B", marginBottom: "14px" }}>
              Campaign: <span style={{ color: "#222222", fontWeight: 500 }}>{metaData.campaignName}</span>
              {metaData.dateStart && metaData.dateStop && (
                <span style={{ color: "#A8A8A3", marginLeft: "10px" }}>
                  {metaData.dateStart} – {metaData.dateStop}
                </span>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {[
                { label: "Total Spend",  value: fmtCurrency(metaData.spend),                    unit: "USD" },
                { label: "Impressions",  value: metaData.impressions.toLocaleString(),            unit: "views" },
                { label: "Reach",        value: metaData.reach.toLocaleString(),                  unit: "unique" },
                { label: "Clicks",       value: metaData.clicks.toLocaleString(),                 unit: "link clicks" },
                { label: "CPM",          value: fmtCurrency(metaData.cpm),                        unit: "per 1k impressions" },
                { label: "CPC",          value: metaData.cpc > 0 ? fmtCurrency(metaData.cpc) : "—", unit: "per click" },
              ].map(({ label, value, unit }) => (
                <div key={label} style={{ background: "#F6F6F4", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "10px", color: "#6F6F6B", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#222222", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: "11px", color: "#A8A8A3", marginTop: "3px" }}>{unit}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: "11px", color: "#A8A8A3", marginTop: "12px" }}>Source: Meta Ads API (cached)</div>
          </div>
        ) : (
          <div style={{ padding: "20px", fontSize: "13px", color: "#A8A8A3" }}>
            No paid media linked to this program.
          </div>
        )}
      </div>

      {/* Toast POS manual entry (Gift Card only) */}
      {itemId === "gift-card-promo" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#222222", marginBottom: "12px" }}>
            Toast POS Sales Data (Manual Entry)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input
              type="number"
              placeholder="Units sold"
              style={{ padding: "8px 12px", border: "1px solid #DEDEDA", borderRadius: "6px", fontSize: "13px", color: "#222222", outline: "none" }}
            />
            <input
              type="number"
              placeholder="Revenue ($)"
              style={{ padding: "8px 12px", border: "1px solid #DEDEDA", borderRadius: "6px", fontSize: "13px", color: "#222222", outline: "none" }}
            />
            {toastUrl && (
              <a href={toastUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#4E8DF4" }}>
                Open Toast POS →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────

function AnalyticsTab({ item, venueSlug }: { item: ActivityItem; venueSlug: string }) {
  const { data: metaData, isLoading: metaLoading } = trpc.activities.getActivityMetaAdsData.useQuery(
    { venueId: venueSlug, activityId: item.id, activityName: item.name },
    { staleTime: 5 * 60 * 1000 }
  );

  return (
    <div className="space-y-4">
      {/* Static analytics note (e.g. swing-saver-promo disclaimer) */}
      {item.analyticsNote && (
        <div style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", padding: "16px 20px", fontSize: "13px", color: "#6F6F6B", lineHeight: 1.6 }}>
          {item.analyticsNote}
        </div>
      )}

      {/* Annual Giveaway full dashboard link */}
      {item.id === "annual-giveaway" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#222222", marginBottom: "8px" }}>
            Full Campaign Dashboard
          </div>
          <p style={{ fontSize: "13px", color: "#6F6F6B", marginBottom: "14px" }}>
            Demographics breakdown · Applicant table · Conversion tracking · AI insights
          </p>
          <a
            href={`/app/${venueSlug}/operations/programs/annual-giveaway`}
            style={{ fontSize: "13px", color: "#4E8DF4", fontWeight: 500 }}
          >
            Open Annual Giveaway Dashboard →
          </a>
        </div>
      )}

      {/* Meta Ads performance section */}
      <div style={{ background: "#FFFFFF", border: "1px solid #DEDEDA", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F1EF", display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={14} style={{ color: "#4E8DF4" }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#222222" }}>Ad Performance</span>
          <span style={{ fontSize: "11px", color: "#A8A8A3", marginLeft: "4px" }}>Source: Meta Ads API</span>
        </div>
        {metaLoading ? (
          <div className="animate-pulse" style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 52, background: "#F1F1EF", borderRadius: "6px" }} />)}
          </div>
        ) : metaData?.matched ? (
          <div style={{ padding: "20px" }}>
            <div style={{ fontSize: "12px", color: "#6F6F6B", marginBottom: "14px" }}>
              Campaign: <span style={{ color: "#222222", fontWeight: 500 }}>{metaData.campaignName}</span>
              {metaData.dateStart && (
                <span style={{ color: "#A8A8A3", marginLeft: "10px" }}>{metaData.dateStart} – {metaData.dateStop || "present"}</span>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {[
                { label: "Total Spend",  value: fmtCurrency(metaData.spend) },
                { label: "Reach",        value: metaData.reach.toLocaleString() },
                { label: "Impressions",  value: metaData.impressions.toLocaleString() },
                { label: "Clicks",       value: metaData.clicks.toLocaleString() },
                { label: "CTR",          value: metaData.ctr > 0 ? `${(metaData.ctr * 100).toFixed(2)}%` : "—" },
                { label: "CPM",          value: fmtCurrency(metaData.cpm) },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "#F6F6F4", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "10px", color: "#6F6F6B", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#222222", lineHeight: 1 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: "20px", fontSize: "13px", color: "#A8A8A3" }}>
            No paid media linked to this program.
          </div>
        )}
      </div>

      {/* Rich program dashboards — embedded for known programs */}
      {item.id === "sunday-clinic" && <SundayClinicDetail embedded />}
      {item.id === "winter-camp"   && <WinterClinicDetail embedded />}

      {/* Acuity placeholder for other programs without a dedicated dashboard */}
      {item.tab === "programs" && item.id !== "sunday-clinic" && item.id !== "winter-camp" && (
        <EmptyState
          icon={<BarChart2 size={20} />}
          message="Acuity session analytics coming soon."
          subtext="Participant trends, attendance rate, and session breakdown will sync automatically."
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function ActivityDetail() {
  const [location, navigate] = useLocation();
  const params = useParams<{ venueSlug?: string; tab?: string; id?: string }>();
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("overview");
  const venueSlug = params.venueSlug ?? getVenueSlugFromPath(location) ?? "arlington-heights";

  const routes = appRoutes.venue(venueSlug);
  const tab = params.tab;
  const id  = params.id;

  const item = ACTIVITY_ITEMS.find(i => i.id === id);

  const backPath =
    tab === "promotions" ? routes.studioSoo.activityPromotions :
    tab === "local"      ? routes.studioSoo.activityLocal :
    routes.studioSoo.activityPrograms;

  const DETAIL_TABS: { id: DetailTab; label: string }[] = [
    { id: "overview",   label: "Overview" },
    { id: "tasks",      label: "Task Log" },
    { id: "content",    label: "Content" },
    { id: "budget",     label: "Budget" },
    { id: "analytics",  label: "Analytics" },
  ];

  if (!item) {
    return (
      <div className="p-8">
        <EmptyState icon={<AlertCircle size={20} />} message="Activity not found." />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate(backPath)}
          style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6F6F6B", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "16px" }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0, display: "inline-block" }} />
          <h1 style={{ fontSize: "var(--gvx-text-page, 20px)", fontWeight: 600, color: "#222222" }}>{item.name}</h1>
          <StatusBadge status={item.status} />
        </div>
        <p style={{ fontSize: "var(--gvx-text-sm, 13px)", color: "#6F6F6B", marginTop: "4px", marginLeft: "20px" }}>
          {item.projectName}
        </p>
      </div>

      {/* Detail tab bar */}
      <div style={{ borderBottom: "1px solid #DEDEDA", display: "flex" }}>
        {DETAIL_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveDetailTab(t.id)}
            style={{
              padding: "8px 14px",
              paddingBottom: "9px",
              fontSize: "13px",
              fontWeight: activeDetailTab === t.id ? 600 : 400,
              color: activeDetailTab === t.id ? "#222222" : "#A8A8A3",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              borderBottom: `2px solid ${activeDetailTab === t.id ? "#F2DD48" : "transparent"}`,
              background: "none",
              cursor: "pointer",
              marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Detail tab content */}
      {activeDetailTab === "overview"   && <OverviewTab item={item} venueSlug={venueSlug} />}
      {activeDetailTab === "tasks"      && <TaskLogTab projectGid={item.asanaGid} />}
      {activeDetailTab === "content"    && <ContentTab item={item} venueId={venueSlug} />}
      {activeDetailTab === "budget"     && (
        <BudgetTab
          projectGid={item.asanaGid}
          itemId={item.id}
          toastUrl={item.toastUrl}
          venueSlug={venueSlug}
          activityName={item.name}
        />
      )}
      {activeDetailTab === "analytics"  && (
        <AnalyticsTab item={item} venueSlug={venueSlug} />
      )}
    </div>
  );
}
