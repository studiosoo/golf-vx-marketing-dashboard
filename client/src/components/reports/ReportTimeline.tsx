import { useState } from "react";
import { ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { TIMELINE_ITEMS, type TimelineItem } from "@/data/reportCampaignData";
import { trpc } from "@/lib/trpc";
import { AsanaSyncStatus } from "./AsanaSyncStatus";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const TEXT_P = "#222222";
const TEXT_S = "#6F6F6B";
const TEXT_M = "#A8A8A3";
const BORDER = "#DEDEDA";
const BG_S   = "#F1F1EF";
const YELLOW = "#F2DD48";

export const CAMPAIGN_COLORS: Record<string, { solid: string; label: string }> = {
  trial_conversion:       { solid: "#72B84A", label: "Trial Conversion"    },
  membership_acquisition: { solid: "#4E8DF4", label: "Membership Acq."     },
  member_retention:       { solid: "#A87FBE", label: "Member Retention"    },
  corporate_events:       { solid: "#D89A3C", label: "B2B & Events"        },
};

const CATEGORY_LABEL: Record<string, string> = {
  program:   "Program",
  promotion: "Promotion",
  paid_ads:  "Paid Ads",
};

type ViewMode = "monthly" | "quarterly";

// ─── Date helpers ─────────────────────────────────────────────────────────────
function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getViewBounds(anchor: Date, mode: ViewMode): [Date, Date] {
  if (mode === "monthly") {
    return [
      new Date(anchor.getFullYear(), anchor.getMonth(), 1),
      new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0),
    ];
  }
  const q = Math.floor(anchor.getMonth() / 3);
  return [
    new Date(anchor.getFullYear(), q * 3, 1),
    new Date(anchor.getFullYear(), q * 3 + 3, 0),
  ];
}

function advanceAnchor(anchor: Date, mode: ViewMode, dir: 1 | -1): Date {
  const d = new Date(anchor);
  d.setMonth(d.getMonth() + dir * (mode === "monthly" ? 1 : 3));
  return d;
}

function getViewLabel(anchor: Date, mode: ViewMode): string {
  if (mode === "monthly") {
    return anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return `Q${Math.floor(anchor.getMonth() / 3) + 1} ${anchor.getFullYear()}`;
}

function barPosition(
  item: TimelineItem,
  viewStart: Date,
  viewEnd: Date,
): { leftPct: number; widthPct: number } | null {
  if (!item.datesConfirmed || !item.start || !item.end) return null;
  const itemStart = parseDate(item.start);
  const itemEnd   = parseDate(item.end);
  if (itemEnd < viewStart || itemStart > viewEnd) return null;
  const totalMs = viewEnd.getTime() - viewStart.getTime() + 86400000;
  const clStart = itemStart < viewStart ? viewStart : itemStart;
  const clEnd   = itemEnd   > viewEnd   ? viewEnd   : itemEnd;
  return {
    leftPct:  ((clStart.getTime() - viewStart.getTime()) / totalMs) * 100,
    widthPct: Math.max(0.5, ((clEnd.getTime() - clStart.getTime() + 86400000) / totalMs) * 100),
  };
}

function fmtDate(s: string): string {
  return parseDate(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Tick header ──────────────────────────────────────────────────────────────
function ViewHeader({ viewStart, viewEnd, viewMode }: { viewStart: Date; viewEnd: Date; viewMode: ViewMode }) {
  const totalMs = viewEnd.getTime() - viewStart.getTime() + 86400000;
  const ticks: Array<{ label: string; pct: number }> = [];

  if (viewMode === "quarterly") {
    const d = new Date(viewStart);
    while (d <= viewEnd) {
      ticks.push({
        label: d.toLocaleDateString("en-US", { month: "short" }),
        pct: ((d.getTime() - viewStart.getTime()) / totalMs) * 100,
      });
      d.setMonth(d.getMonth() + 1);
    }
  } else {
    const daysInMonth = viewEnd.getDate();
    const steps = [1, Math.round(daysInMonth * 0.2), Math.round(daysInMonth * 0.4),
                   Math.round(daysInMonth * 0.6), Math.round(daysInMonth * 0.8), daysInMonth];
    steps.forEach(day => {
      const d = new Date(viewStart.getFullYear(), viewStart.getMonth(), day);
      ticks.push({
        label: String(day),
        pct: ((d.getTime() - viewStart.getTime()) / totalMs) * 100,
      });
    });
  }

  return (
    <div className="relative h-5 select-none">
      {ticks.map((t, i) => (
        <div
          key={i}
          className="absolute text-[10px]"
          style={{ left: `${t.pct}%`, color: TEXT_M, transform: "translateX(-50%)", whiteSpace: "nowrap" }}
        >
          {t.label}
        </div>
      ))}
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function ItemTooltip({ item, x, y }: { item: TimelineItem; x: number; y: number }) {
  const safeX = Math.min(x + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 220);
  return (
    <div className="fixed z-50 pointer-events-none" style={{ left: safeX, top: y - 8 }}>
      <div
        className="rounded-xl text-[12px] p-3 space-y-1.5 max-w-[210px]"
        style={{ background: TEXT_P, boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}
      >
        <p className="font-semibold leading-snug" style={{ color: "white" }}>{item.name}</p>
        <div className="flex flex-wrap gap-1">
          {item.campaigns.map((c: string) => (
            <span
              key={c}
              className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              style={{ background: CAMPAIGN_COLORS[c]?.solid ?? TEXT_M, color: "white" }}
            >
              {CAMPAIGN_COLORS[c]?.label ?? c}
            </span>
          ))}
        </div>
        {item.datesConfirmed && item.start && item.end ? (
          <p style={{ color: TEXT_M }}>
            {item.start === item.end
              ? fmtDate(item.start)
              : `${fmtDate(item.start)} – ${fmtDate(item.end)}`}
          </p>
        ) : (
          <p style={{ color: YELLOW }}>Dates TBD</p>
        )}
        <p className="capitalize" style={{ color: TEXT_M }}>{item.status}</p>
        {item.kpiHint && <p style={{ color: "#D0D0CC" }}>{item.kpiHint}</p>}
      </div>
    </div>
  );
}

// ─── Timeline row ─────────────────────────────────────────────────────────────
function TimelineRow({
  item, viewStart, viewEnd, todayPct, onHover, onLeave,
}: {
  item: TimelineItem;
  viewStart: Date;
  viewEnd: Date;
  todayPct: number | null;
  onHover: (item: TimelineItem, x: number, y: number) => void;
  onLeave: () => void;
}) {
  const pos = barPosition(item, viewStart, viewEnd);
  const isPoint = item.start !== "" && item.start === item.end;
  const colors = item.campaigns.map((c: string) => CAMPAIGN_COLORS[c]?.solid ?? TEXT_M);

  const getBarBg = (opacity: string) => {
    if (colors.length >= 2) {
      return `linear-gradient(90deg, ${colors[0]}${opacity} 50%, ${colors[1]}${opacity} 50%)`;
    }
    return `${colors[0]}${opacity}`;
  };

  const tbdBg = getBarBg("25");
  const confirmedBg = getBarBg("35");
  const barBorder = `1px ${item.datesConfirmed ? "solid" : "dashed"} ${colors[0]}55`;

  return (
    <div className="flex items-center gap-2">
      <div className="shrink-0 text-right" style={{ width: "140px" }}>
        <p className="text-[11px] font-medium truncate" style={{ color: TEXT_P }}>{item.name}</p>
        <p className="text-[10px]" style={{ color: TEXT_M }}>
          {CATEGORY_LABEL[item.category]}
          {item.campaigns.length > 1 && " · cross"}
        </p>
      </div>

      <div className="flex-1 h-7 relative rounded" style={{ background: BG_S }}>
        {todayPct !== null && (
          <div
            className="absolute top-0 bottom-0 w-px z-10 pointer-events-none"
            style={{ left: `${todayPct}%`, background: `${YELLOW}cc` }}
          />
        )}

        {!item.datesConfirmed && (
          <div
            className="absolute top-1 bottom-1 rounded-sm flex items-center px-1.5 cursor-default"
            style={{ left: "2%", width: "42%", background: tbdBg, border: barBorder }}
            onMouseEnter={e => onHover(item, e.clientX, e.clientY)}
            onMouseLeave={onLeave}
          >
            <span className="text-[9px] font-medium truncate" style={{ color: TEXT_M }}>Dates TBD</span>
          </div>
        )}

        {pos && (
          <div
            className="absolute top-1 bottom-1 rounded-sm cursor-default overflow-hidden"
            style={{
              left: `${pos.leftPct}%`,
              width: isPoint ? "7px" : `${pos.widthPct}%`,
              minWidth: isPoint ? "7px" : "3px",
              background: isPoint ? colors[0] : confirmedBg,
              border: barBorder,
            }}
            onMouseEnter={e => onHover(item, e.clientX, e.clientY)}
            onMouseLeave={onLeave}
          >
            {!isPoint && pos.widthPct > 9 && (
              <div className="absolute inset-0 flex items-center px-1.5">
                <span className="text-[9px] font-semibold truncate" style={{ color: colors[0] }}>
                  {item.name}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface ReportTimelineProps {
  defaultOpen?: boolean;
}

export function ReportTimeline({ defaultOpen = false }: ReportTimelineProps) {
  const [open,       setOpen]       = useState(defaultOpen);
  const [viewMode,   setViewMode]   = useState<ViewMode>("monthly");
  const [anchor,     setAnchor]     = useState(() => new Date());
  const [tooltip,    setTooltip]    = useState<{ item: TimelineItem; x: number; y: number } | null>(null);
  const [dataSource, setDataSource] = useState<"manual" | "live">("manual");

  const {
    data: asanaData,
    isLoading: asanaLoading,
    isError: asanaError,
    refetch: asanaRefetch,
  } = trpc.asana.getMasterTimeline.useQuery(undefined, {
    enabled: dataSource === "live",
    staleTime: 5 * 60 * 1000,
  });

  const [viewStart, viewEnd] = getViewBounds(anchor, viewMode);
  const today    = new Date();
  const totalMs  = viewEnd.getTime() - viewStart.getTime() + 86400000;
  const todayPct = today >= viewStart && today <= viewEnd
    ? ((today.getTime() - viewStart.getTime()) / totalMs) * 100
    : null;

  const sourceItems: TimelineItem[] = dataSource === "live" && asanaData
    ? (asanaData.items as TimelineItem[])
    : TIMELINE_ITEMS;

  const visibleItems = sourceItems.filter(item =>
    !item.datesConfirmed || barPosition(item, viewStart, viewEnd) !== null
  );

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
          <h2 className="text-[15px] font-semibold text-left" style={{ color: TEXT_P }}>Marketing Timeline</h2>
          <p className="text-xs mt-0.5 text-left" style={{ color: TEXT_S }}>
            Programs · Promotions · Paid Ads — color-coded by campaign
          </p>
        </div>
        {open
          ? <ChevronDown size={16} style={{ color: TEXT_M }} />
          : <ChevronRight size={16} style={{ color: TEXT_M }} />
        }
      </button>

      {open && (
        <div className="px-5 pb-5" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mt-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 rounded-lg p-0.5" style={{ background: BG_S }}>
                {(["monthly", "quarterly"] as ViewMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors"
                    style={viewMode === mode
                      ? { background: "white", color: TEXT_P, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }
                      : { color: TEXT_S }}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="flex gap-0.5 rounded-lg p-0.5" style={{ background: BG_S }}>
                {(["manual", "live"] as const).map(src => (
                  <button
                    key={src}
                    onClick={() => setDataSource(src)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                    style={dataSource === src
                      ? { background: src === "live" ? "#72B84A" : "white", color: src === "live" ? "white" : TEXT_P, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }
                      : { color: TEXT_S }}
                  >
                    {src === "live" ? "Asana Live" : "Manual"}
                  </button>
                ))}
              </div>

              {dataSource === "live" && (
                <AsanaSyncStatus
                  fetchedAt={asanaData?.fetchedAt}
                  onRefresh={() => asanaRefetch()}
                  isLoading={asanaLoading}
                />
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAnchor(a => advanceAnchor(a, viewMode, -1))}
                className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
                style={{ background: BG_S }}
              >
                <ChevronLeft size={13} style={{ color: TEXT_S }} />
              </button>
              <span
                className="text-[12px] font-semibold text-center"
                style={{ color: TEXT_P, minWidth: "130px" }}
              >
                {getViewLabel(anchor, viewMode)}
              </span>
              <button
                onClick={() => setAnchor(a => advanceAnchor(a, viewMode, 1))}
                className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
                style={{ background: BG_S }}
              >
                <ChevronRight size={13} style={{ color: TEXT_S }} />
              </button>
            </div>
          </div>

          <div style={{ marginLeft: "152px" }}>
            <ViewHeader viewStart={viewStart} viewEnd={viewEnd} viewMode={viewMode} />
          </div>

          {dataSource === "live" && asanaError && (
            <div className="flex items-center justify-between p-3 rounded-lg mb-2" style={{ background: "#FFF3F0", border: "1px solid #FFD0C8" }}>
              <p className="text-xs" style={{ color: "#C0392B" }}>Failed to load Asana data.</p>
              <button
                onClick={() => setDataSource("manual")}
                className="text-xs font-medium px-2 py-1 rounded"
                style={{ color: TEXT_S, background: BG_S }}
              >
                Use Manual
              </button>
            </div>
          )}

          <div className="space-y-1.5 mt-1">
            {dataSource === "live" && asanaLoading ? (
              <p className="text-center py-6 text-sm" style={{ color: TEXT_M }}>
                Loading from Asana…
              </p>
            ) : visibleItems.length === 0 ? (
              <p className="text-center py-6 text-sm" style={{ color: TEXT_M }}>
                No items in this period.
              </p>
            ) : (
              visibleItems.map(item => (
                <div key={item.id} className={item.status === "completed" ? "opacity-50" : ""}>
                  <TimelineRow
                    item={item}
                    viewStart={viewStart}
                    viewEnd={viewEnd}
                    todayPct={todayPct}
                    onHover={(i, x, y) => setTooltip({ item: i, x, y })}
                    onLeave={() => setTooltip(null)}
                  />
                </div>
              ))
            )}
          </div>

          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3"
            style={{ borderTop: `1px solid ${BORDER}` }}
          >
            {Object.entries(CAMPAIGN_COLORS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ background: val.solid }} />
                <span className="text-[10px]" style={{ color: TEXT_S }}>{val.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-px h-3" style={{ background: YELLOW }} />
              <span className="text-[10px]" style={{ color: TEXT_S }}>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-8 h-2 rounded-sm"
                style={{
                  background: `repeating-linear-gradient(90deg, ${TEXT_M}25 0 5px, transparent 5px 10px)`,
                  border: `1px dashed ${TEXT_M}55`,
                }}
              />
              <span className="text-[10px]" style={{ color: TEXT_S }}>Dates TBD</span>
            </div>
          </div>
        </div>
      )}

      {tooltip && (
        <ItemTooltip item={tooltip.item} x={tooltip.x} y={tooltip.y} />
      )}
    </div>
  );
}
