import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function fmtCurrency(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─────────────────────────────────────────────
// Type badge colors
// ─────────────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "$25 Off-Peak Trial": { bg: "#F0FAF3", text: "#72B84A", border: "#72B84A" },
  "$35 Peak Trial": { bg: "#1A1A1A", text: "#F2DD48", border: "#F2DD48" },
  "$9 Anniversary Off-Peak Trial": { bg: "#F1F1EF", text: "#888888", border: "#DEDEDA" },
  "$18 Anniversary Peak Trial": { bg: "#1A1A1A", text: "#E8453C", border: "#E8453C" },
};
function getTypeColor(priceLabel: string) {
  return TYPE_COLORS[priceLabel] || { bg: "#F1F1EF", text: "#888888", border: "#DEDEDA" };
}

// ─────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "#222222",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#DEDEDA] p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[#AAAAAA]">
        <Icon className="h-4 w-4" />
        <span className="text-[12px] font-medium">{label}</span>
      </div>
      <p className="text-[24px] font-bold leading-none mt-1" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-[#AAAAAA]">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Type Group Card
// ─────────────────────────────────────────────
function TypeGroupCard({
  typeName,
  priceLabel,
  bookings,
  totalRevenue,
  paidCount,
}: {
  typeName?: string;
  priceLabel?: string;
  bookings?: any[];
  totalRevenue?: number;
  paidCount?: number;
}) {
  const safePriceLabel = priceLabel ?? typeName ?? 'Unknown';
  const safeRevenue = totalRevenue ?? 0;
  const safePaidCount = paidCount ?? 0;
  const colors = getTypeColor(safePriceLabel);
  const count = (bookings ?? []).length;
  const unpaidCount = count - safePaidCount;
  const avgPrice = count > 0 ? safeRevenue / count : 0;

  return (
    <div className="bg-white rounded-xl border border-[#DEDEDA] p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold mb-1"
            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
          >
            {safePriceLabel}
          </div>
          <h3 className="text-[13px] font-semibold text-[#222222] leading-tight">{typeName}</h3>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[20px] font-bold text-[#222222] leading-none">{count}</p>
          <p className="text-[10px] text-[#AAAAAA]">bookings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#F0F0F0]">
        <div>
          <p className="text-[13px] font-bold text-[#222222]">{fmtCurrency(safeRevenue)}</p>
          <p className="text-[10px] text-[#AAAAAA]">Revenue</p>
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#72B84A]">{safePaidCount}</p>
          <p className="text-[10px] text-[#AAAAAA]">Paid</p>
        </div>
        <div>
          <p className={cn("text-[13px] font-bold", unpaidCount > 0 ? "text-[#F5A623]" : "text-[#AAAAAA]")}>
            {unpaidCount}
          </p>
          <p className="text-[10px] text-[#AAAAAA]">Unpaid</p>
        </div>
      </div>

      {/* Avg price */}
      <div className="text-[11px] text-[#AAAAAA]">
        Avg price: <span className="font-semibold text-[#888888]">{fmtCurrency(avgPrice)}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function TrialSessionDetail() {
  const [, setLocation] = useLocation();
  const { data, isLoading, error } = trpc.revenue.getTrialSessionDetail.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#F2DD48] border-t-transparent animate-spin" />
          <p className="text-[13px] text-[#AAAAAA]">Loading trial session data…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-[14px] text-[#888888]">Failed to load trial session data.</p>
          <button
            onClick={() => setLocation("/programs")}
            className="mt-3 text-[12px] text-[#F2DD48] font-semibold hover:underline"
          >
            ← Back to Programs
          </button>
        </div>
      </div>
    );
  }

  const { types, totalBookings, totalRevenue, allBookings } = data;
  const avgPrice = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const totalPaid = types.reduce((sum: number, t: any) => sum + t.paidCount, 0);
  const totalUnpaid = totalBookings - totalPaid;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Back button + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocation("/programs")}
          className="flex items-center gap-1.5 text-[13px] text-[#888888] hover:text-[#222222] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Programs
        </button>
      </div>

      <div>
        <h1 className="text-[22px] font-bold text-[#222222]">1-Hour Trial Session</h1>
        <p className="text-[13px] text-[#888888] mt-1">
          Booking breakdown by appointment type — sourced from Acuity Scheduling
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          icon={Users}
          label="Total Bookings"
          value={totalBookings.toString()}
          sub="All appointment types"
        />
        <KpiCard
          icon={DollarSign}
          label="Total Revenue"
          value={fmtCurrency(totalRevenue)}
          sub={`${totalPaid} paid · ${totalUnpaid} unpaid`}
          color="#72B84A"
        />
        <KpiCard
          icon={TrendingUp}
          label="Avg Price"
          value={fmtCurrency(avgPrice)}
          sub="Per booking"
        />
        <KpiCard
          icon={CheckCircle}
          label="Paid Rate"
          value={totalBookings > 0 ? `${Math.round((totalPaid / totalBookings) * 100)}%` : "—"}
          sub={`${totalPaid} of ${totalBookings} paid`}
          color={totalBookings > 0 && totalPaid / totalBookings >= 0.8 ? "#72B84A" : "#F5A623"}
        />
      </div>

      {/* Type Breakdown */}
      <div>
        <h2 className="text-[15px] font-bold text-[#222222] mb-3">Breakdown by Appointment Type</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {types.map((t: any, i: number) => (
            <TypeGroupCard key={t.typeId ?? t.name ?? i} {...t} />
          ))}
          {/* Placeholder for $18 Anniversary Peak when added */}
          {types.length < 4 && (
            <div className="bg-[#FAFAFA] rounded-xl border border-dashed border-[#DEDEDA] p-4 flex flex-col items-center justify-center gap-2 text-center">
              <Clock className="h-6 w-6 text-[#CCCCCC]" />
              <p className="text-[12px] font-semibold text-[#AAAAAA]">$18 Anniversary Peak</p>
              <p className="text-[11px] text-[#CCCCCC]">Appointment type not yet created in Acuity</p>
            </div>
          )}
        </div>
      </div>

      {/* All Bookings Table */}
      <div>
        <h2 className="text-[15px] font-bold text-[#222222] mb-3">
          All Bookings
          <span className="ml-2 text-[12px] font-normal text-[#AAAAAA]">({allBookings.length})</span>
        </h2>
        <div className="bg-white rounded-xl border border-[#DEDEDA] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_80px_80px_1fr] gap-3 px-4 py-2.5 bg-[#F8F8F8] border-b border-[#DEDEDA]">
            <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide">Customer</span>
            <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide">Date</span>
            <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide">Type</span>
            <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide text-right">Price</span>
            <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide text-center">Paid</span>
            <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide">Source</span>
          </div>

          {/* Table rows */}
          {allBookings.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[#AAAAAA]">No bookings found.</div>
          ) : (
            allBookings.map((booking: any, idx: number) => {
              const colors = getTypeColor(booking.type || "");
              const paid = booking.paid === "yes";
              const price = parseFloat(booking.amountPaid || booking.price || "0");
              return (
                <div
                  key={`booking-${booking.id ?? idx}-${idx}`}
                  className={cn(
                    "grid grid-cols-[1fr_1fr_1fr_80px_80px_1fr] gap-3 px-4 py-3 items-center",
                    idx % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]",
                    "border-b border-[#F0F0F0] last:border-0"
                  )}
                >
                  {/* Customer name */}
                  <div>
                    <p className="text-[13px] font-semibold text-[#222222] leading-tight">
                      {booking.firstName} {booking.lastName}
                    </p>
                    {booking.email && (
                      <p className="text-[11px] text-[#AAAAAA] truncate">{booking.email}</p>
                    )}
                  </div>

                  {/* Date + time */}
                  <div>
                    <p className="text-[12px] text-[#888888]">{fmtDate(booking.datetime)}</p>
                    <p className="text-[11px] text-[#AAAAAA]">{fmtTime(booking.datetime)}</p>
                  </div>

                  {/* Type badge */}
                  <div>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        background: colors.bg,
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {booking.type || "Unknown"}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-[#222222]">
                      {price > 0 ? fmtCurrency(price) : "—"}
                    </p>
                  </div>

                  {/* Paid status */}
                  <div className="flex justify-center">
                    {paid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0FAF3] text-[#72B84A] text-[10px] font-bold">
                        <CheckCircle className="h-3 w-3" />
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F1F1EF] text-[#888888] text-[10px] font-bold">
                        <Clock className="h-3 w-3" />
                        Unpaid
                      </span>
                    )}
                  </div>

                  {/* Source */}
                  <div>
                    <p className="text-[12px] text-[#888888] truncate" title={booking.source}>
                      {booking.source || "Not specified"}
                    </p>
                    {booking.calendar && (
                      <p className="text-[10px] text-[#AAAAAA] flex items-center gap-1 mt-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {booking.calendar}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-[#CCCCCC] text-center pb-4">
        Data sourced from Acuity Scheduling · Refreshed on page load
      </p>
    </div>
  );
}
