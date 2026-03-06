import { trpc } from "@/lib/trpc";
import { TrendingUp, ShoppingBag, CreditCard, DollarSign, Utensils, BarChart3, Flag, Users, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function isoToDisplay(raw: string) {
  if (raw.length === 8) return `${raw.slice(4, 6)}/${raw.slice(6, 8)}`;
  return raw;
}
function pct(part: number, total: number) {
  if (total === 0) return "—";
  return `${((part / total) * 100).toFixed(1)}%`;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, highlight,
}: {
  label: string; value: string; sub?: string; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] text-[#AAAAAA] uppercase tracking-wide">{label}</p>
        <div className="h-7 w-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#888888]">
          {icon}
        </div>
      </div>
      <p className={cn("text-[24px] font-bold leading-none tracking-tight", highlight ? "text-[#F5C72C]" : "text-[#111111]")}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-[#888888] mt-1">{sub}</p>}
    </div>
  );
}

// ─── Category Donut-style bar ────────────────────────────────────────────────

function CategoryBar({ segments }: { segments: Array<{ label: string; value: number; color: string }> }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="transition-all duration-500"
            style={{ width: `${(seg.value / total) * 100}%`, background: seg.color }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
            <span className="text-[11px] text-[#555555]">{seg.label}</span>
            <span className="text-[11px] font-semibold text-[#111111]">{fmtCurrency(seg.value)}</span>
            <span className="text-[10px] text-[#AAAAAA]">({pct(seg.value, total)})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

const ANNUAL_GOAL = 2_000_000;

export default function Revenue() {
  const { data: snapshot } = trpc.preview.getSnapshot.useQuery(undefined);
  const { data: toastSummaryRaw } = trpc.revenue.getToastSummary.useQuery();
  const { data: toastDailyRaw, isLoading: dailyLoading } = trpc.revenue.getToastDaily.useQuery(undefined);
  const { data: acuityRaw } = trpc.revenue.getAcuityRevenue.useQuery({ minDate: undefined, maxDate: undefined });

  // ── Derived values ─────────────────────────────────────────────────────────

  const mrr = (snapshot?.members as any)?.mrr ?? 0;
  const toastMTD = (toastSummaryRaw as any)?.thisMonthRevenue ?? 0;
  const toastLastMonth = (toastSummaryRaw as any)?.lastMonthRevenue ?? 0;
  const acuityTotal = (acuityRaw as any)?.total ?? 0;
  const acuityCount = (acuityRaw as any)?.count ?? (acuityRaw as any)?.totalBookings ?? 0;
  const dailyRows = (toastDailyRaw as any[]) ?? [];

  // Current month rows
  const now = new Date();
  const currentMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const mtdRows = dailyRows.filter((r: any) => String(r.date ?? "").startsWith(currentMonth));

  // MTD by category
  const sumField = (rows: any[], field: string) =>
    rows.reduce((s: number, r: any) => s + parseFloat(String(r[field] ?? 0)), 0);

  const bayMTD      = sumField(mtdRows, "bayRevenue");
  const fbMTD       = sumField(mtdRows, "foodBevRevenue");
  const golfMTD     = sumField(mtdRows, "golfRevenue");
  const tipsMTD     = sumField(mtdRows, "totalTips");
  const discountMTD = sumField(mtdRows, "totalDiscounts");
  const cashMTD     = sumField(mtdRows, "cashRevenue");
  const creditMTD   = sumField(mtdRows, "creditRevenue");
  const guestsMTD   = mtdRows.reduce((s: number, r: any) => s + parseInt(String(r.totalGuests ?? 0)), 0);

  // Annual run rate
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysElapsed = Math.max(1, Math.floor((now.getTime() - startOfYear.getTime()) / 86400000));
  const toastRunRate = toastMTD > 0 ? (toastMTD / now.getDate()) * 365 : 0;
  const acuityRunRate = acuityTotal > 0 ? (acuityTotal / daysElapsed) * 365 : 0;
  const annualRunRate = mrr * 12 + toastRunRate + acuityRunRate;
  const annualPct = Math.min((annualRunRate / ANNUAL_GOAL) * 100, 100);
  const hasRevenue = mrr > 0 || toastMTD > 0 || acuityTotal > 0;

  const last30 = dailyRows.slice(-30);

  const revenueSegments = [
    { label: "Bay", value: bayMTD, color: "#F5C72C" },
    { label: "Golf", value: golfMTD, color: "#F5C72C99" },
    { label: "F&B", value: fbMTD, color: "#3DB855" },
  ].filter((s) => s.value > 0);

  const paymentSegments = [
    { label: "Credit Card", value: creditMTD, color: "#111111" },
    { label: "Cash", value: cashMTD, color: "#888888" },
  ].filter((s) => s.value > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <DollarSign className="h-5 w-5 text-[#F5C72C]" />
        <div>
          <h1 className="text-lg font-semibold text-[#111111]">Revenue</h1>
          <p className="text-xs text-[#888888]">All revenue channels · {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {/* ── Annual Goal Progress ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#111111]" />
            <h2 className="text-[14px] font-bold text-[#111111]">Annual Revenue Goal — 2026</h2>
          </div>
          <div className="text-right">
            <span className="text-[22px] font-bold text-[#F5C72C]">{annualPct.toFixed(1)}%</span>
            <span className="text-[11px] text-[#AAAAAA] ml-1">run rate</span>
          </div>
        </div>
        <div className="h-3 bg-[#F2F2F7] rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full bg-[#F5C72C] transition-all duration-700" style={{ width: `${annualPct}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-[#AAAAAA]">
          <span>{fmtCurrency(annualRunRate)} projected / {fmtCurrency(ANNUAL_GOAL)} goal</span>
          {annualRunRate < ANNUAL_GOAL && <span>{fmtCurrency(ANNUAL_GOAL - annualRunRate)} gap to close</span>}
        </div>
        {!hasRevenue && (
          <p className="text-[11px] text-[#AAAAAA] mt-3 p-2 rounded-lg bg-[#FAFAFA] border border-dashed border-[#E0E0E0]">
            Revenue APIs pending connection (Toast POS, Acuity). Progress will populate once data syncs.
          </p>
        )}
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="MRR" value={mrr > 0 ? fmtCurrency(mrr) : "—"} sub="Membership recurring" icon={<DollarSign size={14} />} highlight={mrr > 0} />
        <KpiCard label="Toast MTD" value={toastMTD > 0 ? fmtCurrency(toastMTD) : "—"} sub={toastLastMonth > 0 ? `Last mo: ${fmtCurrency(toastLastMonth)}` : "POS data pending"} icon={<ShoppingBag size={14} />} />
        <KpiCard label="Bay MTD" value={bayMTD > 0 ? fmtCurrency(bayMTD) : "—"} sub="Bay time revenue" icon={<BarChart3 size={14} />} />
        <KpiCard label="Golf MTD" value={golfMTD > 0 ? fmtCurrency(golfMTD) : "—"} sub="Lessons / equipment" icon={<BarChart3 size={14} />} />
        <KpiCard label="F&B MTD" value={fbMTD > 0 ? fmtCurrency(fbMTD) : "—"} sub="Food & beverage" icon={<Utensils size={14} />} />
        <KpiCard label="Acuity" value={acuityTotal > 0 ? fmtCurrency(acuityTotal) : "—"} sub={acuityCount > 0 ? `${fmt(acuityCount)} bookings` : "API pending"} icon={<CreditCard size={14} />} />
      </div>

      {/* ── Toast POS MTD Breakdown ──────────────────────────────────────────── */}
      {(bayMTD > 0 || fbMTD > 0 || golfMTD > 0) && (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-5">
          <h2 className="text-[13px] font-semibold text-[#111111]">In-Store Revenue Breakdown — MTD</h2>

          {/* Revenue by category */}
          <div>
            <p className="text-[11px] font-semibold text-[#AAAAAA] uppercase tracking-wide mb-3">By Category</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
              {[
                { label: "Bay Time", value: bayMTD, color: "text-[#F5C72C]" },
                { label: "Golf / Lessons", value: golfMTD, color: "text-[#111111]" },
                { label: "Food & Bev", value: fbMTD, color: "text-[#3DB855]" },
                { label: "Tips", value: tipsMTD, color: "text-[#888888]" },
                { label: "Discounts", value: discountMTD, color: "text-[#E8453C]", negative: true },
              ].map(({ label, value, color, negative }: any) => (
                <div key={label} className="bg-[#FAFAFA] rounded-lg border border-[#F0F0F0] p-3">
                  <p className="text-[10px] text-[#AAAAAA] uppercase tracking-wide mb-1">{label}</p>
                  <p className={cn("text-[15px] font-bold", color)}>
                    {value > 0 ? `${negative ? "-" : ""}${fmtCurrency(value)}` : "—"}
                  </p>
                </div>
              ))}
            </div>
            <CategoryBar segments={revenueSegments} />
          </div>

          {/* Payment method breakdown */}
          {(cashMTD > 0 || creditMTD > 0) && (
            <div>
              <p className="text-[11px] font-semibold text-[#AAAAAA] uppercase tracking-wide mb-3">By Payment Method</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { label: "Credit / Card", value: creditMTD },
                  { label: "Cash", value: cashMTD },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#FAFAFA] rounded-lg border border-[#F0F0F0] p-3">
                    <p className="text-[10px] text-[#AAAAAA] uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-[15px] font-bold text-[#111111]">{value > 0 ? fmtCurrency(value) : "—"}</p>
                    <p className="text-[10px] text-[#AAAAAA] mt-0.5">{pct(value, creditMTD + cashMTD)}</p>
                  </div>
                ))}
              </div>
              <CategoryBar segments={paymentSegments} />
            </div>
          )}

          {/* Guests */}
          {guestsMTD > 0 && (
            <div className="flex items-center gap-2 text-[12px] text-[#888888] pt-1 border-t border-[#F0F0F0]">
              <Users size={13} />
              <span><strong className="text-[#111111]">{fmt(guestsMTD)}</strong> guests served MTD</span>
              {toastMTD > 0 && guestsMTD > 0 && (
                <span className="ml-auto text-[#AAAAAA]">{fmtCurrency(toastMTD / guestsMTD)} / guest avg</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Toast POS Daily Table ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E0E0E0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-[#AAAAAA]" />
            <h2 className="text-[13px] font-semibold text-[#111111]">Toast POS — Daily Detail</h2>
          </div>
          <span className="text-[11px] text-[#AAAAAA]">Last 30 days</span>
        </div>

        {dailyLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-[#F5F5F5] rounded animate-pulse" />
            ))}
          </div>
        ) : last30.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingBag className="h-8 w-8 text-[#E0E0E0] mx-auto mb-2" />
            <p className="text-[13px] text-[#888888]">No Toast POS data available</p>
            <p className="text-[11px] text-[#AAAAAA] mt-1">Data will appear once the Toast API connection is active.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E0E0E0]">
                  {["Date", "Total", "Bay", "Golf", "F&B", "Tips", "Guests", "Orders"].map((h, i) => (
                    <th key={h} className={cn("text-[11px] text-[#AAAAAA] font-normal py-2 px-3", i > 0 ? "text-right" : "text-left")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...last30].reverse().map((row: any) => {
                  const total    = parseFloat(String(row.totalRevenue ?? 0));
                  const bay      = parseFloat(String(row.bayRevenue ?? 0));
                  const golf     = parseFloat(String(row.golfRevenue ?? 0));
                  const fb       = parseFloat(String(row.foodBevRevenue ?? 0));
                  const tips     = parseFloat(String(row.totalTips ?? 0));
                  const guests   = parseInt(String(row.totalGuests ?? 0));
                  const orders   = parseInt(String(row.totalOrders ?? 0));
                  return (
                    <tr key={row.date} className="h-10 border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA]">
                      <td className="px-3 text-[12px] text-[#888888]">{isoToDisplay(String(row.date ?? ""))}</td>
                      <td className="px-3 text-right text-[12px] font-semibold text-[#111111]">{total > 0 ? fmtCurrency(total) : "—"}</td>
                      <td className="px-3 text-right text-[11px] text-[#F5A500]">{bay > 0 ? fmtCurrency(bay) : "—"}</td>
                      <td className="px-3 text-right text-[11px] text-[#888888]">{golf > 0 ? fmtCurrency(golf) : "—"}</td>
                      <td className="px-3 text-right text-[11px] text-[#3DB855]">{fb > 0 ? fmtCurrency(fb) : "—"}</td>
                      <td className="px-3 text-right text-[11px] text-[#AAAAAA]">{tips > 0 ? fmtCurrency(tips) : "—"}</td>
                      <td className="px-3 text-right text-[11px] text-[#AAAAAA]">{guests > 0 ? fmt(guests) : "—"}</td>
                      <td className="px-3 text-right text-[11px] text-[#AAAAAA]">{orders > 0 ? fmt(orders) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Acuity Programs ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-4 w-4 text-[#AAAAAA]" />
          <h2 className="text-[13px] font-semibold text-[#111111]">Acuity Program Bookings</h2>
        </div>
        {acuityTotal > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
              <p className="text-[11px] text-[#AAAAAA] mb-1">Total Revenue</p>
              <p className="text-[24px] font-bold text-[#111111]">{fmtCurrency(acuityTotal)}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
              <p className="text-[11px] text-[#AAAAAA] mb-1">Total Bookings</p>
              <p className="text-[24px] font-bold text-[#111111]">{fmt(acuityCount)}</p>
              {acuityCount > 0 && acuityTotal > 0 && (
                <p className="text-[11px] text-[#888888] mt-0.5">{fmtCurrency(acuityTotal / acuityCount)} avg/booking</p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <CreditCard className="h-7 w-7 text-[#E0E0E0] mx-auto mb-2" />
            <p className="text-[13px] text-[#888888]">Acuity API connection pending</p>
            <p className="text-[11px] text-[#AAAAAA] mt-1">Program booking revenue will appear here once connected.</p>
          </div>
        )}
      </div>

      {/* ── Membership MRR ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-4 w-4 text-[#AAAAAA]" />
          <h2 className="text-[13px] font-semibold text-[#111111]">Membership MRR</h2>
        </div>
        {mrr > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
              <p className="text-[11px] text-[#AAAAAA] mb-1">MRR</p>
              <p className="text-[24px] font-bold text-[#F5C72C]">{fmtCurrency(mrr)}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
              <p className="text-[11px] text-[#AAAAAA] mb-1">Annual Run Rate</p>
              <p className="text-[24px] font-bold text-[#111111]">{fmtCurrency(mrr * 12)}</p>
              <p className="text-[11px] text-[#AAAAAA] mt-0.5">membership only</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
              <p className="text-[11px] text-[#AAAAAA] mb-1">% of Annual Goal</p>
              <p className="text-[24px] font-bold text-[#111111]">{pct(mrr * 12, ANNUAL_GOAL)}</p>
              <p className="text-[11px] text-[#AAAAAA] mt-0.5">of {fmtCurrency(ANNUAL_GOAL)}</p>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-[#888888] py-6 text-center">
            Membership revenue sourced from Boomerang POS — syncs with the Members section.
          </p>
        )}
      </div>
    </div>
  );
}
