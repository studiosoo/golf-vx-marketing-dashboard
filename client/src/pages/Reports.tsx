/**
 * Golf VX Dashboard · Reports
 * ─────────────────────────────────────────────────────────────────────
 * Role:  Full marketing performance narrative for CEO / investor-level review.
 *        Structured analytical report with collapsible sections.
 *        Source of truth for quarterly storytelling and agency deliverables.
 * Data:  trpc.preview.getSnapshot · trpc.revenue.getToastSummary
 *        trpc.revenue.getAcuityRevenue · static reportCampaignData.ts
 * Users: studio_soo (full access) · hq_admin (read) · location_staff (read)
 *
 * Section map:
 *  [A] Executive Summary      — expanded
 *  [B] Revenue & Operations   — expanded
 *  [C] Marketing Performance Highlights — expanded (activity cards, Jan–Mar 2026)
 *  [D] Marketing Timeline     — always visible
 *  [E] Campaign Performance   — expanded (4 campaign rows)
 *  [F] Studio Soo Execution   — collapsed by default
 *  [G] Performance Analysis   — collapsed by default
 *  [H] Forward Look           — expanded
 *  [I] Local SEO              — collapsed by default
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  ChevronDown,
  ChevronRight,
  Target,
  UserCheck,
  Users,
  Flag,
  ExternalLink,
  Loader2,
  LayoutDashboard,
  Megaphone,
  MapPin,
  ImageIcon,
} from "lucide-react";
import { ReportTimeline } from "@/components/reports/ReportTimeline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

// Compute YYYYMMDD string for N days ago (used for weekly Toast query)
function yyyymmdd(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const YELLOW  = "#F2DD48";
const TEXT_P  = "#222222";
const TEXT_S  = "#6F6F6B";
const TEXT_M  = "#A8A8A3";
const BORDER  = "#DEDEDA";
const BG_S    = "#F1F1EF";
const GRN_TXT = "#72B84A";
const ORG_TXT = "#D89A3C";
const RED_TXT = "#C81E1E";

// ─── Verified Revenue Data ────────────────────────────────────────────────────
const MONTHLY_REVENUE = [
  { month: "Nov", fullMonth: "Nov 2025", value: 56257.90,  partial: false },
  { month: "Dec", fullMonth: "Dec 2025", value: 103811.32, partial: false },
  { month: "Jan", fullMonth: "Jan 2026", value: 129637.97, partial: false },
  { month: "Feb", fullMonth: "Feb 2026", value: 116401.75, partial: false },
  { month: "Mar", fullMonth: "Mar 2026", value: 29983.27,  partial: true  },
];

const REVENUE_MIX = [
  { category: "Bay Usage", value: 193608.98, pct: 70.1, color: "#F5C72C" },
  { category: "F&B",       value: 80444.43,  pct: 29.2, color: "#72B84A" },
  { category: "Other",     value: 1922.58,   pct: 0.7,  color: "#E0E0E0" },
];

// ─── Studio Soo Production Timeline ──────────────────────────────────────────
const PRODUCTION_TIMELINE = [
  { month: "Oct 2025", items: ["Asana setup", "Danny Woj Wedge Clinic", "Social accounts"] },
  { month: "Nov 2025", items: ["Black Friday Swing Saver", "EDDM", "Referral promo concept"] },
  { month: "Dec 2025", items: ["PBGA Clinics content", "Season of Giving", "Year-End Membership Special"] },
  { month: "Jan 2026", items: ["Dashboard MVP", "ah.playgolfvx.com", "Instagram Giveaway", "Feb Tournament"] },
  { month: "Feb 2026", items: ["PBGA Winter Clinic landing page", "Summer Camp ads", "Stroll AH", "Happenings"] },
  { month: "Mar 2026", items: ["Annual Membership Giveaway", "Gift Card Promo tracking", "Drive Day", "This report"] },
];

function fmt(v: number | string) {
  const n = parseFloat(String(v || 0));
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function pctOf(cur: number, target: number) {
  return target > 0 ? Math.min(100, (cur / target) * 100) : 0;
}

// ─── Executive Summary ────────────────────────────────────────────────────────
function ExecutiveSummary() {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: BORDER }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#F6F6F4] transition-colors"
      >
        <div>
          <h2 className="text-[15px] font-semibold text-left" style={{ color: TEXT_P }}>Executive Summary</h2>
          <p className="text-xs mt-0.5 text-left" style={{ color: TEXT_S }}>Strategic context · key decisions · data confidence</p>
        </div>
        {open
          ? <ChevronDown size={16} style={{ color: TEXT_M }} />
          : <ChevronRight size={16} style={{ color: TEXT_M }} />
        }
      </button>

      {open && (
        <div className="p-5 space-y-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          {/* Block A — What Happened */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: TEXT_M }}>What Happened</h3>
            <ul className="space-y-2">
              {[
                "Winter seasonality drove a 130% revenue surge from November ($56.3K) to January peak ($129.6K). February held strong, confirming sustained demand — not a one-month spike.",
                "Bay Usage and F&B dominate tracked operating revenue. Membership recurring revenue is tracked separately as a known floor estimate.",
                "Studio Soo has been managing the full local marketing system — campaigns, website, landing pages, physical displays, content, and this reporting infrastructure — simultaneously.",
              ].map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px]" style={{ color: TEXT_P }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: YELLOW }} />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* Block B — What Matters Now */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: TEXT_M }}>What Matters Now</h3>
            <ul className="space-y-2">
              {[
                "Protect revenue as winter demand softens into spring — push memberships, trials, clinics, and events to offset seasonal reduction.",
                "Convert current giveaway and trial interest into visits and memberships before March 31 (Gift Card Promo expiry) and April 4 (Giveaway deadline).",
                "Stripe integration is the single highest-value remaining reporting unlock.",
              ].map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px]" style={{ color: TEXT_P }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: GRN_TXT }} />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* Block C — Why This Dashboard Matters */}
          <div className="rounded-xl px-4 py-3" style={{ background: BG_S, border: `1px solid ${BORDER}` }}>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: TEXT_M }}>Why This Dashboard Matters</h3>
            <p className="text-[13px]" style={{ color: TEXT_S }}>
              "This is the first integrated branch-level report for Arlington Heights that connects operating revenue, marketing execution, program activity, in-venue promotion, and forward planning in one place. Even with partial integrations, it already supports strategic decisions. With Stripe access, it becomes materially stronger."
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Revenue & Operations ─────────────────────────────────────────────────────
function RevenueOperations({ snapshot, toastSummary }: { snapshot: any; toastSummary: any }) {
  const [open, setOpen] = useState(true);

  const totalTracked = MONTHLY_REVENUE.filter(m => !m.partial).reduce((s, m) => s + m.value, 0);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: BORDER }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#F6F6F4] transition-colors"
      >
        <div>
          <h2 className="text-[15px] font-semibold text-left" style={{ color: TEXT_P }}>Revenue &amp; Operations</h2>
          <p className="text-xs mt-0.5 text-left" style={{ color: TEXT_S }}>
            Monthly operating revenue · revenue mix · recurring revenue visibility
          </p>
        </div>
        {open
          ? <ChevronDown size={16} style={{ color: TEXT_M }} />
          : <ChevronRight size={16} style={{ color: TEXT_M }} />
        }
      </button>

      {open && (
        <div className="p-5 space-y-6" style={{ borderTop: `1px solid ${BORDER}` }}>

          {/* R-3a — Monthly Revenue Bar Chart */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold" style={{ color: TEXT_P }}>Monthly Operating Revenue</h3>
              <span className="text-[11px]" style={{ color: TEXT_M }}>Nov 2025 – Mar 2026</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={MONTHLY_REVENUE} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={BORDER} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: TEXT_M }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: TEXT_M }}
                  tickFormatter={(v: number) => "$" + (v / 1000).toFixed(0) + "K"}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  formatter={(value: number) => ["$" + value.toLocaleString(), "Revenue"]}
                  labelFormatter={(label: string) => {
                    const entry = MONTHLY_REVENUE.find(m => m.month === label);
                    return entry ? entry.fullMonth + (entry.partial ? " (partial)" : "") : label;
                  }}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${BORDER}` }}
                />
                <ReferenceLine
                  y={100000}
                  stroke={BORDER}
                  strokeDasharray="4 4"
                  label={{ value: "$100K", position: "insideTopLeft", fontSize: 11, fill: TEXT_M }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {MONTHLY_REVENUE.map((entry, index) => (
                    <Cell key={index} fill={entry.partial ? "#A8A8A3" : "#F5C72C"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[13px] mt-2" style={{ color: TEXT_S }}>
              Revenue grew 130% from November to January peak, then held strong in February — indicating sustained demand, not seasonal variance. March is in-progress.
            </p>
            <p className="text-[11px] mt-1" style={{ color: TEXT_M }}>
              Source: Boomerang POS (Bay + F&B). Membership recurring revenue tracked separately. Mar 2026 is partial (gray).
            </p>
          </div>

          {/* R-3b — Revenue Mix */}
          <div>
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: TEXT_P }}>Revenue Mix · Nov 2025 – Feb 2026</h3>
            <div className="flex h-6 rounded-lg overflow-hidden mb-3">
              {REVENUE_MIX.map(seg => (
                <div
                  key={seg.category}
                  style={{ width: `${seg.pct}%`, background: seg.color }}
                  title={`${seg.category}: ${seg.pct}%`}
                />
              ))}
            </div>
            <div className="space-y-2">
              {REVENUE_MIX.map(seg => (
                <div key={seg.category} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                  <span className="text-[13px] flex-1" style={{ color: TEXT_P }}>{seg.category}</span>
                  <span className="text-[13px] font-semibold" style={{ color: TEXT_P }}>{fmt(seg.value)}</span>
                  <span className="text-[12px] w-10 text-right" style={{ color: TEXT_M }}>{seg.pct}%</span>
                </div>
              ))}
            </div>
            <p className="text-[13px] mt-3" style={{ color: TEXT_S }}>
              Bay Usage is the dominant revenue driver at 70%. F&B at 29% is a meaningful contributor and should be treated as a core category — not a side item.
            </p>
            <p className="text-[11px] mt-1" style={{ color: TEXT_M }}>
              Total tracked (Nov–Feb, 4 full months): {fmt(totalTracked)}
            </p>
          </div>

          {/* R-3c — Recurring Revenue Visibility Panel */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span className="text-[13px] font-semibold" style={{ color: TEXT_P }}>Recurring Revenue Visibility</span>
              <span className="text-[12px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">ESTIMATED</span>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <th className="text-left px-5 py-2 text-[11px] font-normal" style={{ color: TEXT_M }}>Tier</th>
                  <th className="text-right px-5 py-2 text-[11px] font-normal" style={{ color: TEXT_M }}>Members</th>
                  <th className="text-right px-5 py-2 text-[11px] font-normal" style={{ color: TEXT_M }}>Rate</th>
                  <th className="text-right px-5 py-2 text-[11px] font-normal" style={{ color: TEXT_M }}>Monthly</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td className="px-5 py-2.5 text-[13px]" style={{ color: TEXT_P }}>Aces</td>
                  <td className="px-5 py-2.5 text-[13px] text-right" style={{ color: TEXT_P }}>54</td>
                  <td className="px-5 py-2.5 text-[13px] text-right" style={{ color: TEXT_S }}>$325/mo</td>
                  <td className="px-5 py-2.5 text-[13px] font-semibold text-right" style={{ color: TEXT_P }}>$17,550</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td className="px-5 py-2.5 text-[13px]" style={{ color: TEXT_P }}>Savers</td>
                  <td className="px-5 py-2.5 text-[13px] text-right" style={{ color: TEXT_P }}>33</td>
                  <td className="px-5 py-2.5 text-[13px] text-right" style={{ color: TEXT_S }}>$225/mo</td>
                  <td className="px-5 py-2.5 text-[13px] font-semibold text-right" style={{ color: TEXT_P }}>$7,425</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${BORDER}`, borderLeft: "4px solid #F2DD48", background: "#FFFDE7" }}>
                  <td className="px-5 py-2.5 text-[13px] font-bold" style={{ color: TEXT_P }}>MRR Floor</td>
                  <td className="px-5 py-2.5 text-[13px] font-bold text-right" style={{ color: TEXT_P }}>87</td>
                  <td className="px-5 py-2.5 text-[13px] text-right" style={{ color: TEXT_S }}>—</td>
                  <td className="px-5 py-2.5 text-[13px] font-bold text-right" style={{ color: TEXT_P }}>$24,975</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td className="px-5 py-2.5 text-[13px]" style={{ color: TEXT_M }}>Pro</td>
                  <td className="px-5 py-2.5 text-[13px] text-right" style={{ color: TEXT_M }}>4</td>
                  <td className="px-5 py-2.5 text-[13px] text-right" style={{ color: TEXT_M }}>—</td>
                  <td className="px-5 py-2.5 text-[13px] text-right" style={{ color: TEXT_M }}>Revenue unconfirmed</td>
                </tr>
                <tr>
                  <td className="px-5 py-2.5 text-[13px]" style={{ color: TEXT_M }}>General / No Tier</td>
                  <td className="px-5 py-2.5 text-[13px] text-right" style={{ color: TEXT_M }}>188</td>
                  <td className="px-5 py-2.5 text-[13px] text-right" style={{ color: TEXT_M }}>—</td>
                  <td className="px-5 py-2.5 text-[13px] text-right" style={{ color: TEXT_M }}>Billing unmapped — excluded</td>
                </tr>
              </tbody>
            </table>
            <div className="px-5 py-3 text-[13px] text-amber-600 bg-amber-50" style={{ borderTop: `1px solid ${BORDER}` }}>
              This panel shows a known recurring revenue floor, not total recurring revenue. Stripe API integration will unlock full visibility.
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Campaign Report — expandable rows ────────────────────────────────────────
const CAMPAIGN_ROWS: Array<{
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  asanaGid: string;
  kpiLabel: string;
  kpiNote?: string;
  statusBadge: string;
  goal?: string;
  insight?: string;
}> = [
  {
    id: "trial_conversion",
    label: "Trial Conversion",
    icon: Target,
    color: "#72B84A",
    bg: "#E6F0DC",
    asanaGid: "1212077269419925",
    kpiLabel: "Trial Sessions",
    statusBadge: "Active · On Track",
    goal: "20% trial-to-member conversion",
    insight: "Sunday Clinic is the strongest conversion channel (~31%). Drive Day launch Mar 29 should accelerate this.",
  },
  {
    id: "membership_acquisition",
    label: "Membership Acquisition",
    icon: UserCheck,
    color: "#4E8DF4",
    bg: "#EAF2FF",
    asanaGid: "1212077289242708",
    kpiLabel: "Members",
    kpiNote: "127 / 300 (42.3%)",
    statusBadge: "Active · On Track",
    goal: "300 members by Dec 2026",
    insight: "Annual Membership Giveaway (deadline Apr 4) and Meta Ads (588% ROI) driving Q2 opportunity.",
  },
  {
    id: "member_retention",
    label: "Member Retention",
    icon: Users,
    color: "#A87FBE",
    bg: "#F3EDF8",
    asanaGid: "1212080057605434",
    kpiLabel: "Retention",
    kpiNote: "92.3%",
    statusBadge: "Exceeding Goal",
    goal: "90% retention",
    insight: "Above target. Drive Day, Sunday Clinic, and Google Review program are the primary drivers.",
  },
  {
    id: "corporate_events",
    label: "B2B & Events",
    icon: Flag,
    color: "#D89A3C",
    bg: "#F6E5CF",
    asanaGid: "1212077289242724",
    kpiLabel: "Events/mo",
    kpiNote: "~2/mo est.",
    statusBadge: "Below Target",
    goal: "4 corporate events/month",
    insight: "50% of target. CHA Fundraiser Night (May 2) and private bay watch party model are near-term levers.",
  },
];

function CampaignReportRow({ row, snapshot, acuity }: { row: typeof CAMPAIGN_ROWS[0]; snapshot: any; acuity: any }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = row.icon;

  const { data: taskData, isLoading: tasksLoading } = trpc.asana.getProjectTasks.useQuery(
    { projectGid: row.asanaGid },
    { enabled: expanded, staleTime: 5 * 60 * 1000 }
  );

  // Live KPI overrides
  const liveKpi = (() => {
    if (row.id === "membership_acquisition") {
      const total = snapshot?.members?.total ?? 0;
      return total > 0 ? `${total} / 300 (${Math.round((total / 300) * 100)}%)` : null;
    }
    if (row.id === "trial_conversion") {
      const bookings = (acuity?.byType as any[] | undefined)?.find((t: any) =>
        (t.appointmentType ?? "").toLowerCase().includes("trial"))?.bookingCount;
      return bookings != null ? String(bookings) : null;
    }
    return null;
  })();

  const kpiDisplay = liveKpi ?? row.kpiNote ?? "—";
  const asanaUrl   = `https://app.asana.com/0/${row.asanaGid}/list`;
  const tasks      = (taskData?.tasks ?? []) as any[];
  const openTasks  = tasks.filter((t: any) => !t.completed);

  const badgeStyle = (() => {
    if (row.statusBadge === "Exceeding Goal") return { background: `${GRN_TXT}20`, color: GRN_TXT };
    if (row.statusBadge === "Below Target")   return { background: `${ORG_TXT}20`, color: ORG_TXT };
    return { background: `${YELLOW}40`, color: "#8A7A00" };
  })();

  return (
    <div style={{ borderBottom: `1px solid ${BORDER}` }}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-5 py-3.5 flex items-center gap-3 text-left transition-colors hover:bg-[#F6F6F4]"
      >
        <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0" style={{ background: row.bg }}>
          <Icon size={12} style={{ color: row.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-semibold" style={{ color: TEXT_P }}>{row.label}</span>
          <span className="ml-2 text-[11px]" style={{ color: TEXT_M }}>
            {row.kpiLabel}: <span style={{ color: row.color }}>{kpiDisplay}</span>
          </span>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={badgeStyle}>
          {row.statusBadge}
        </span>
        {expanded
          ? <ChevronDown size={13} style={{ color: TEXT_M, flexShrink: 0 }} />
          : <ChevronRight size={13} style={{ color: TEXT_M, flexShrink: 0 }} />
        }
      </button>

      {expanded && (
        <div className="px-5 pb-4 pt-3" style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFAF9" }}>
          {/* Insight box */}
          {row.insight && (
            <div className="mb-3 rounded-lg px-3 py-2 text-[12px]" style={{ background: `${row.color}12`, color: TEXT_P }}>
              <span className="font-semibold">Insight: </span>{row.insight}
            </div>
          )}

          {/* Goal */}
          {row.goal && (
            <div className="mb-3 text-[12px]" style={{ color: TEXT_S }}>
              <span className="font-semibold" style={{ color: TEXT_P }}>Goal: </span>{row.goal}
            </div>
          )}

          {/* Asana tasks */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_M }}>Asana Tasks</span>
            <a
              href={asanaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] transition-colors hover:underline"
              style={{ color: "#4E8DF4" }}
              onClick={e => e.stopPropagation()}
            >
              Open in Asana <ExternalLink size={10} />
            </a>
          </div>

          {tasksLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 size={13} className="animate-spin" style={{ color: TEXT_M }} />
              <span className="text-[12px]" style={{ color: TEXT_M }}>Loading tasks…</span>
            </div>
          ) : openTasks.length === 0 ? (
            <p className="text-[13px]" style={{ color: TEXT_M }}>
              No open tasks · <span style={{ color: "#4E8DF4" }}>view in Asana</span>
            </p>
          ) : (
            <div className="space-y-1.5">
              {openTasks.slice(0, 6).map((t: any) => (
                <div key={t.gid} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: row.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px]" style={{ color: TEXT_P }}>{t.name}</p>
                    {t.due_on && <p className="text-[10px]" style={{ color: TEXT_M }}>Due {t.due_on}</p>}
                  </div>
                </div>
              ))}
              {openTasks.length > 6 && (
                <p className="text-[11px]" style={{ color: TEXT_M }}>+{openTasks.length - 6} more tasks in Asana</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Studio Soo Execution ─────────────────────────────────────────────────────
function StudioSooExecution() {
  const [open, setOpen] = useState(false);

  const executionTiles = [
    {
      icon: LayoutDashboard,
      label: "Infrastructure & Reporting",
      items: [
        "Custom dashboard build + reporting system",
        "Public website (ah.playgolfvx.com)",
        "Landing pages & funnel setup",
      ],
    },
    {
      icon: Megaphone,
      label: "Campaigns & Promotions",
      items: [
        "Annual Membership Giveaway · Gift Card Promo",
        "Trial Session · Drive Day · Junior Summer Camp ads",
        "Black Friday Swing Saver · PBGA Winter Clinic",
      ],
    },
    {
      icon: MapPin,
      label: "Venue & In-Store",
      items: [
        "Monthly Happenings flyers (11×17, each bay)",
        "OptiSign / in-venue display updates",
        "Tournament & league poster production",
      ],
    },
    {
      icon: ImageIcon,
      label: "Content & Creative",
      items: [
        "Member testimonial ads",
        "Social reels & content calendar",
        "Event visuals · seasonal promotions",
      ],
    },
    {
      icon: Users,
      label: "Programs & Strategic Support",
      items: [
        "PBGA Winter Clinic · Sunday Clinic · Summer Camp",
        "Coach coordination & copy review",
        "COO / HQ coordination & strategic alignment",
      ],
    },
  ];

  const collateralCards = [
    { title: "February Happenings", sub: "11×17 Print · Feb 2026" },
    { title: "February Fairways Tournament", sub: "11×17 Print · Feb 2026" },
    { title: "Season of Giving — Gift Card", sub: "Print + Digital · Dec 2025" },
    { title: "Year-End Membership Special", sub: "Print + Digital · Dec 2025" },
    { title: "Go Bears Watch Party", sub: "16:9 Digital · Jan 2026" },
    { title: "Club Distance Chart", sub: "Print · Ongoing" },
  ];

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: BORDER }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#F6F6F4] transition-colors"
      >
        <div>
          <h2 className="text-[15px] font-semibold text-left" style={{ color: TEXT_P }}>Studio Soo Execution</h2>
          <p className="text-xs mt-0.5 text-left" style={{ color: TEXT_S }}>
            14 campaigns/promotions · 3 programs · 6 venue assets · 1 website · 1 dashboard
          </p>
        </div>
        {open
          ? <ChevronDown size={16} style={{ color: TEXT_M }} />
          : <ChevronRight size={16} style={{ color: TEXT_M }} />
        }
      </button>

      {open && (
        <div className="p-5 space-y-6" style={{ borderTop: `1px solid ${BORDER}` }}>
          {/* Execution tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {executionTiles.map(tile => {
              const TileIcon = tile.icon;
              return (
                <div
                  key={tile.label}
                  className="rounded-xl border p-4"
                  style={{ borderColor: BORDER, background: BG_S }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TileIcon size={14} style={{ color: TEXT_S }} />
                    <span className="text-[12px] font-semibold" style={{ color: TEXT_P }}>{tile.label}</span>
                  </div>
                  <ul className="space-y-1">
                    {tile.items.map((item, i) => (
                      <li key={i} className="text-[12px]" style={{ color: TEXT_S }}>· {item}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Monthly production timeline */}
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-widest mb-3" style={{ color: TEXT_M }}>
              Monthly Production Timeline
            </h3>
            <div className="overflow-x-auto">
              <div className="flex gap-4 min-w-max pb-2">
                {PRODUCTION_TIMELINE.map(month => (
                  <div key={month.month} className="min-w-[160px]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: YELLOW }} />
                      <span className="text-[12px] font-semibold" style={{ color: TEXT_P }}>{month.month}</span>
                    </div>
                    {month.items.map((item, i) => (
                      <p key={i} className="text-[12px] mb-1" style={{ color: TEXT_S }}>· {item}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Collateral placeholder cards */}
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-widest mb-3" style={{ color: TEXT_M }}>
              Sample Collateral
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {collateralCards.map(card => (
                <div
                  key={card.title}
                  className="rounded-lg border p-3"
                  style={{ borderColor: BORDER, background: "#F6F6F4" }}
                >
                  <p className="text-[12px] font-semibold" style={{ color: TEXT_P }}>{card.title}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: TEXT_M }}>{card.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Performance Interpretation ───────────────────────────────────────────────
function PerformanceInterpretation() {
  const [open, setOpen] = useState(false);

  const lenses = [
    {
      label: "Revenue",
      color: "#F2DD48",
      text: "Winter demand materially increased top-line performance. Bay Usage dominates tracked operating revenue. F&B contributes meaningfully and should remain a core category — not a side note.",
    },
    {
      label: "Marketing",
      color: "#72B84A",
      text: "Studio Soo is managing a hybrid system: digital campaigns, physical displays, landing pages, and booking flows simultaneously. Member testimonial assets are being reused effectively across digital and print. Attribution is improving, but integration gaps still limit full channel-level ROI analysis.",
    },
    {
      label: "Operations",
      color: "#4E8DF4",
      text: "The branch now has a centralized reporting structure that did not exist five months ago. The dashboard is becoming the operating layer for reviewing campaigns, programs, and production work. Stripe access would materially improve decision speed at every future meeting.",
    },
    {
      label: "Data Confidence",
      color: "#D89A3C",
      text: "Current reporting supports strategic decisions on Bay Usage, F&B trends, and campaign spend. Stripe integration is the most important missing link for recurring revenue analysis. Pro member revenue and 188 untiered members must remain excluded from calculations until billing source is mapped.",
    },
  ];

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: BORDER }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#F6F6F4] transition-colors"
      >
        <div>
          <h2 className="text-[15px] font-semibold text-left" style={{ color: TEXT_P }}>Performance Analysis · 4 Lenses</h2>
          <p className="text-xs mt-0.5 text-left" style={{ color: TEXT_S }}>Revenue · Marketing · Operations · Data Confidence</p>
        </div>
        {open
          ? <ChevronDown size={16} style={{ color: TEXT_M }} />
          : <ChevronRight size={16} style={{ color: TEXT_M }} />
        }
      </button>

      {open && (
        <div className="p-5" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="grid grid-cols-2 gap-3">
            {lenses.map(lens => (
              <div key={lens.label} className="rounded-[10px] border border-[#DEDEDA] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-6 rounded-full" style={{ background: lens.color }} />
                  <span className="text-[13px] font-semibold" style={{ color: TEXT_P }}>{lens.label}</span>
                </div>
                <p className="text-[13px]" style={{ color: TEXT_S }}>{lens.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Forward Look ─────────────────────────────────────────────────────────────
function ForwardLook() {
  const [open, setOpen] = useState(true);

  const revenueTargets = [
    { horizon: "Next 30 days (April)", target: "$95K–$110K", notes: "Spring transition — protect winter-level revenue" },
    { horizon: "Next quarter (Q2)",    target: "$300K–$360K", notes: "Seasonality + conversion performance" },
    { horizon: "Next 6 months (H2 2026)", target: "Improve reporting quality", notes: "Stripe + cleaner attribution" },
    { horizon: "Budget recommendation",   target: "Increase selectively", notes: "Only where revenue path is clear" },
  ];

  const priorities = [
    {
      title: "Protect Spring Revenue",
      priority: "HIGH",
      color: "#F2DD48",
      rationale: "Winter demand will soften March–April. Revenue floor depends on memberships, repeat visits, and program enrollments.",
      action: "Push Drive Day (Mar 29 launch), Junior Summer Camp, Trial Session, and membership offers hard in April. Keep Bay + F&B bundled in all promotional offers.",
      timeline: "Immediate — April 2026",
    },
    {
      title: "Improve Recurring Revenue Visibility",
      priority: "HIGH",
      color: "#F2DD48",
      rationale: "$24,975/month is a defensible floor, but the true picture includes 188 untiered members and 4 Pro members whose billing is unmapped. Stripe access turns estimates into facts.",
      action: "Grant Studio Soo read-only Stripe API access. Estimated implementation: 1–2 days after credentials are shared. This is the highest-ROI integration decision on the table.",
      timeline: "Decision at this meeting",
    },
    {
      title: "Strengthen Attribution",
      priority: "MEDIUM",
      color: "#4E8DF4",
      rationale: "Physical displays, QR codes, and digital campaigns are running in parallel but not yet connected in a single tracking view.",
      action: "Connect promotions to landing pages and QR flows consistently. Track which marketing activities produce visits and conversions.",
      timeline: "April–May 2026",
    },
  ];

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: BORDER }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#F6F6F4] transition-colors"
      >
        <div>
          <h2 className="text-[15px] font-semibold text-left" style={{ color: TEXT_P }}>Forward Look · Revenue Targets &amp; Priorities</h2>
          <p className="text-xs mt-0.5 text-left" style={{ color: TEXT_S }}>April targets · six-month outlook · three priority actions</p>
        </div>
        {open
          ? <ChevronDown size={16} style={{ color: TEXT_M }} />
          : <ChevronRight size={16} style={{ color: TEXT_M }} />
        }
      </button>

      {open && (
        <div className="p-5 space-y-6" style={{ borderTop: `1px solid ${BORDER}` }}>
          {/* Revenue Target Table */}
          <div>
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: TEXT_P }}>Revenue Targets</h3>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}`, background: BG_S }}>
                    <th className="text-left px-5 py-2.5 text-[11px] font-normal" style={{ color: TEXT_M }}>Horizon</th>
                    <th className="text-left px-5 py-2.5 text-[11px] font-normal" style={{ color: TEXT_M }}>Target</th>
                    <th className="text-left px-5 py-2.5 text-[11px] font-normal" style={{ color: TEXT_M }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueTargets.map((row, i) => (
                    <tr
                      key={row.horizon}
                      style={{ borderBottom: i < revenueTargets.length - 1 ? `1px solid ${BORDER}` : undefined }}
                    >
                      <td className="px-5 py-3 text-[13px]" style={{ color: TEXT_P }}>{row.horizon}</td>
                      <td className="px-5 py-3 text-[13px] font-semibold" style={{ color: TEXT_P }}>{row.target}</td>
                      <td className="px-5 py-3 text-[12px]" style={{ color: TEXT_S }}>{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[13px] mt-3" style={{ color: TEXT_S }}>
              Targets assume continued Bay + F&B pacing plus better conversion of existing demand. They do not assume a dramatic increase in new member acquisition without stronger recurring revenue visibility.
            </p>
          </div>

          {/* Three Priority Cards */}
          <div>
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: TEXT_P }}>Priority Actions</h3>
            <div className="flex gap-3">
              {priorities.map(p => (
                <div
                  key={p.title}
                  className="rounded-[10px] border bg-white py-5 px-6 flex-1"
                  style={{
                    borderColor: BORDER,
                    borderLeft: `4px solid ${p.color}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[14px] font-semibold" style={{ color: TEXT_P }}>{p.title}</span>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-2"
                      style={{ background: `${p.color}18`, color: p.priority === "MEDIUM" ? p.color : "#8A7A00" }}
                    >
                      {p.priority}
                    </span>
                  </div>
                  <p className="text-[12px] mb-2" style={{ color: TEXT_S }}>
                    <span className="font-semibold" style={{ color: TEXT_P }}>Why: </span>{p.rationale}
                  </p>
                  <p className="text-[12px] mb-2" style={{ color: TEXT_S }}>
                    <span className="font-semibold" style={{ color: TEXT_P }}>Action: </span>{p.action}
                  </p>
                  <p className="text-[11px]" style={{ color: TEXT_M }}>Timeline: {p.timeline}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Local SEO Block ──────────────────────────────────────────────────────────
function LocalSEOBlock() {
  const [open, setOpen] = useState(false);

  const metrics = [
    { label: "GBP Rating",                  value: "—", source: "Google Business Profile" },
    { label: "Total Reviews",               value: "—", source: "Google Business Profile" },
    { label: "Monthly Search Impressions",  value: "—", source: "Google Search Console" },
    { label: "Top Queries",                 value: "—", source: "Google Search Console" },
    { label: "Maps Ranking",                value: "—", source: "Google Maps local pack" },
    { label: "Review Incentive Status",     value: "Active", source: "\"Fries on Us\" campaign" },
  ];

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "white", borderColor: BORDER, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#F6F6F4] transition-colors"
      >
        <div>
          <h2 className="text-[15px] font-semibold text-left" style={{ color: TEXT_P }}>Local SEO</h2>
          <p className="text-xs mt-0.5 text-left" style={{ color: TEXT_S }}>
            Google Business Profile · Reviews · Search Rankings
          </p>
        </div>
        {open
          ? <ChevronDown size={16} style={{ color: TEXT_M }} />
          : <ChevronRight size={16} style={{ color: TEXT_M }} />
        }
      </button>

      {!open && (
        <div className="px-5 py-3 flex gap-8" style={{ borderTop: `1px solid ${BORDER}` }}>
          {[
            { label: "GBP Rating", value: "—" },
            { label: "Total Reviews", value: "—" },
            { label: "Maps Ranking", value: "—" },
          ].map(m => (
            <div key={m.label}>
              <div style={{ fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "0.06em", color: TEXT_M, marginBottom: "2px" }}>
                {m.label}
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: TEXT_P }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="p-5 space-y-5" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {metrics.map(m => (
              <div key={m.label} style={{ background: BG_S, borderRadius: "8px", padding: "12px 14px" }}>
                <div style={{ fontSize: "11px", color: TEXT_M, marginBottom: "4px" }}>{m.label}</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: TEXT_P, lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontSize: "10px", color: "#A8A8A3", marginTop: "4px" }}>{m.source}</div>
              </div>
            ))}
          </div>

          <div style={{ background: BG_S, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: TEXT_P }}>Share Your Experience / Fries on Us</div>
              <div style={{ fontSize: "12px", color: TEXT_S, marginTop: "2px" }}>
                Leave a Google review → receive a complimentary Fries on Us reward
              </div>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 500, color: GRN_TXT, background: "rgba(114,184,74,0.15)", padding: "3px 9px", borderRadius: "4px", flexShrink: 0 }}>
              Active
            </span>
          </div>

          <p style={{ fontSize: "12px", color: TEXT_M }}>
            Full Google Search Console + GBP API integration planned for Prompt F.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Marketing Performance Highlights ─────────────────────────────────────────
function MarketingPerformanceHighlights() {
  const [open, setOpen] = useState(true);

  type CardStatus = "active" | "completed" | "planned";

  const cards: {
    id: string;
    name: string;
    type: string;
    status: CardStatus;
    period: string;
    kpis: { label: string; value: string; estimated?: boolean; awaiting?: boolean }[];
    progress?: number;
    phase?: string;
    note?: string;
  }[] = [
    {
      id:     "pbga-winter-clinic",
      name:   "PBGA Winter Clinic",
      type:   "Program",
      status: "completed",
      period: "Jan–Mar 2026",
      kpis:   [
        { label: "Participants", value: "—", awaiting: true },
        { label: "Revenue",      value: "—", awaiting: true },
      ],
      note: "Acuity integration in progress",
    },
    {
      id:     "swing-saver-promo",
      name:   "Annual SwingSaver Promotion",
      type:   "Promotion",
      status: "completed",
      period: "Nov 2025–Feb 2026",
      kpis:   [
        { label: "Units Sold",    value: "3",      estimated: true },
        { label: "Revenue",       value: "$4,500",  estimated: true },
        { label: "Avg Discount",  value: "44% off" },
      ],
      note: "Self-reported · Pending verification",
    },
    {
      id:       "annual-giveaway",
      name:     "Annual Membership Giveaway",
      type:     "Promotion",
      status:   "active",
      period:   "Jan–Mar 2026",
      kpis:     [{ label: "Applicants", value: "~90", estimated: true }],
      progress: 60,
    },
    {
      id:     "junior-summer-camp",
      name:   "PBGA Junior Summer Camp",
      type:   "Program",
      status: "active",
      period: "Jun–Aug 2026",
      kpis:   [],
      phase:  "Planning & Enrollment",
      note:   "Session 1 starts June 9 · Pre-registration open",
    },
    {
      id:     "trial-sessions",
      name:   "Trial Sessions",
      type:   "Program",
      status: "active",
      period: "Ongoing",
      kpis:   [
        { label: "Offers Active",          value: "2" },
        { label: "Chicago Golf Show",      value: "30", estimated: true },
      ],
      note: "No seasonal end date · rolling intake",
    },
    {
      id:       "sunday-clinic",
      name:     "Sunday Clinic · Drive Day",
      type:     "Program",
      status:   "active",
      period:   "Year-round",
      kpis:     [{ label: "Participants", value: "~50", estimated: true }],
      progress: 83,
      note:     "Next: Mar 29 Drive Day launch",
    },
  ];

  const statusStyle = (s: CardStatus) => {
    if (s === "completed") return { bg: "rgba(216,154,60,0.12)", color: ORG_TXT, label: "Completed" };
    if (s === "active")    return { bg: "rgba(114,184,74,0.12)", color: GRN_TXT, label: "Active"    };
    return { bg: BG_S, color: TEXT_M, label: "Planned" };
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "white", borderColor: BORDER, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#F6F6F4] transition-colors"
      >
        <div>
          <h2 className="text-[15px] font-semibold text-left" style={{ color: TEXT_P }}>
            Marketing Performance Highlights · Jan–Mar 2026
          </h2>
          <p className="text-xs mt-0.5 text-left" style={{ color: TEXT_S }}>
            6 active programs and promotions — status, KPIs, and data quality flags
          </p>
        </div>
        {open
          ? <ChevronDown size={16} style={{ color: TEXT_M }} />
          : <ChevronRight size={16} style={{ color: TEXT_M }} />
        }
      </button>

      {open && (
        <div className="p-5" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {cards.map(card => {
              const ss = statusStyle(card.status);
              return (
                <div
                  key={card.id}
                  className="rounded-xl border p-4"
                  style={{ borderColor: BORDER, background: "#FAFAF9" }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold leading-snug" style={{ color: TEXT_P }}>{card.name}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: TEXT_M }}>{card.type} · {card.period}</div>
                    </div>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: ss.bg, color: ss.color }}
                    >
                      {ss.label}
                    </span>
                  </div>

                  {/* Phase label */}
                  {card.phase && (
                    <div
                      className="text-[11px] font-medium px-2 py-1 rounded mb-2 inline-block"
                      style={{ background: "rgba(78,141,244,0.10)", color: "#4E8DF4" }}
                    >
                      {card.phase}
                    </div>
                  )}

                  {/* KPI row */}
                  {card.kpis.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-2">
                      {card.kpis.map(kpi => (
                        <div key={kpi.label}>
                          <div className="text-[10px]" style={{ color: TEXT_M }}>{kpi.label}</div>
                          <div className="flex items-center gap-1">
                            <span className="text-[14px] font-semibold" style={{ color: TEXT_P }}>{kpi.value}</span>
                            {kpi.estimated && (
                              <span
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                style={{ background: "rgba(216,154,60,0.12)", color: "#C47A20" }}
                              >
                                EST
                              </span>
                            )}
                            {kpi.awaiting && (
                              <span className="text-[10px]" style={{ color: TEXT_M }}>
                                [AWAITING INTEGRATION]
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Progress bar */}
                  {card.progress !== undefined && (
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px]" style={{ color: TEXT_M }}>Progress toward goal</span>
                        <span className="text-[10px] font-medium" style={{ color: TEXT_P }}>{card.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${card.progress}%`, background: "#F2DD48" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Note */}
                  {card.note && (
                    <p className="text-[11px] mt-1" style={{ color: TEXT_M }}>{card.note}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Reports() {
  const now        = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: snapshot }     = trpc.preview.getSnapshot.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const { data: toastSummary } = trpc.revenue.getToastSummary.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const { data: acuity }       = trpc.revenue.getAcuityRevenue.useQuery(
    { minDate: monthStart, maxDate: undefined },
    { staleTime: 5 * 60 * 1000 }
  );

  return (
    <div className="p-8 space-y-4">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: TEXT_P, marginBottom: 0 }}>Reports</h1>
        <p style={{ fontSize: "13px", color: TEXT_S, marginTop: "4px", marginBottom: 0 }}>
          Campaign performance · program progress · strategic intelligence
        </p>
      </div>

      {/* 1 — Executive Summary (expanded) */}
      <ExecutiveSummary />

      {/* 2 — Revenue & Operations (expanded) */}
      <RevenueOperations snapshot={snapshot} toastSummary={toastSummary} />

      {/* 3 — Marketing Performance Highlights · Jan–Mar 2026 */}
      <MarketingPerformanceHighlights />

      {/* D — Marketing Timeline */}
      <div className="bg-white rounded-xl border border-[#DEDEDA] overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h2 className="text-[15px] font-semibold" style={{ color: TEXT_P }}>Marketing Timeline</h2>
          <p className="text-xs mt-0.5" style={{ color: TEXT_S }}>
            Programs, promotions, and paid campaigns across the last five months, color-coded by strategic campaign group.
          </p>
        </div>
        <div className="px-5 py-4">
          <ReportTimeline />
        </div>
      </div>

      {/* E — Campaign Performance */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "white", borderColor: BORDER, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h2 className="text-[15px] font-semibold" style={{ color: TEXT_P }}>Campaign Performance · 4 Active Campaigns</h2>
          <p className="text-xs mt-0.5" style={{ color: TEXT_S }}>Status · goal · current · 1-line insight — expand for Asana tasks</p>
        </div>
        {CAMPAIGN_ROWS.map(row => (
          <CampaignReportRow key={row.id} row={row} snapshot={snapshot} acuity={acuity} />
        ))}
      </div>

      {/* F — Studio Soo Execution (collapsed) */}
      <StudioSooExecution />

      {/* G — Performance Analysis (collapsed) */}
      <PerformanceInterpretation />

      {/* H — Forward Look (expanded) */}
      <ForwardLook />

      {/* I — Local SEO (collapsed) */}
      <LocalSEOBlock />
    </div>
  );
}
