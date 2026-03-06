import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useMemo } from "react";
import {
  ArrowLeft,
  Users,
  DollarSign,
  Calendar,
  Baby,
  Sun,
  Clock,
  BarChart3,
  Megaphone,
  Info,
} from "lucide-react";
import ProgramMarketingPanel from "@/components/ProgramMarketingPanel";
import { ProgramAIIntelligence } from "@/components/ProgramAIIntelligence";

const ENROLLMENT_TARGET = 128; // 8 weeks × 16 students per week

const TRACK_CONFIG = {
  full_day: { label: "Full-Day Program", ageGroup: "Ages 7–17", color: "text-[#F5C72C]", bg: "bg-[#F5C72C]/10 border-[#F5C72C]/30" },
  half_day: { label: "Half-Day Program", ageGroup: "Ages 7–17", color: "text-[#888888]", bg: "bg-[#888888]/10 border-[#888888]/30" },
  tots: { label: "Tots Program", ageGroup: "Ages 4–6", color: "text-[#E8453C]", bg: "bg-[#E8453C]/10 border-[#E8453C]/30" },
};

export default function JuniorCampDashboard() {
  const [, setLocation] = useLocation();
  const dateRange = useMemo(() => ({
    minDate: "2026-06-01",
    maxDate: "2026-08-31",
  }), []);

  const { data, isLoading, error } = trpc.campaigns.getJuniorCampMetrics.useQuery(dateRange);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/programs")} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">PBGA Junior Summer Camp</h1>
            <p className="text-muted-foreground">Loading camp data from Acuity...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-primary/20 rounded w-2/3 mb-3" />
              <div className="h-8 bg-primary/20 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/programs")} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">PBGA Junior Summer Camp</h1>
            <p className="text-[#E8453C]">Error loading data: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const campData = data ?? {
    weeks: [],
    trackSummary: { full_day: { count: 0, revenue: 0 }, half_day: { count: 0, revenue: 0 }, tots: { count: 0, revenue: 0 } },
    totalRegistrations: 0,
    uniqueParticipants: 0,
    totalRevenue: 0,
    overallHowHeard: {},
  };

  const { trackSummary, totalRegistrations, uniqueParticipants, totalRevenue, overallHowHeard, weeks } = campData;

  const sortedHowHeard = Object.entries(overallHowHeard).sort(([, a], [, b]) => b - a);
  const totalSourced = sortedHowHeard.reduce((s, [, n]) => s + n, 0);

  const programDates = [
    { week: "Jun 8–12", label: "Week 1" }, { week: "Jun 15–19", label: "Week 2" },
    { week: "Jun 22–26", label: "Week 3" }, { week: "Jul 6–10", label: "Week 4" },
    { week: "Jul 13–17", label: "Week 5" }, { week: "Jul 20–24", label: "Week 6" },
    { week: "Jul 27–31", label: "Week 7" }, { week: "Aug 3–7", label: "Week 8 (HS Prep)" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setLocation("/programs")} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">PBGA Junior Summer Camp 2026</h1>
          <p className="text-muted-foreground">Acuity registration data · Jun–Aug 2026 · Coach Chuck Lynch</p>
        </div>
      </div>

      {/* Registration opens notice */}
      {totalRegistrations === 0 && (
        <div className="flex items-start gap-3 bg-[#F5C72C]/10 border border-[#F5C72C]/30 rounded-xl p-4">
          <Info className="h-5 w-5 text-[#F5C72C] mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-[#111111]">Registration Not Yet Open</p>
            <p className="text-sm text-muted-foreground mt-1">
              Summer Camp runs Jun–Aug 2026. Once registrations open in Acuity, this dashboard will populate automatically.
              Use the Marketing tab below to track campaign efforts ahead of registration launch.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Users className="h-4 w-4" />
            Enrolled / Goal
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold">{totalRegistrations}</span>
            <span className="text-base text-muted-foreground font-medium">/ {ENROLLMENT_TARGET}</span>
          </div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#F5C72C] transition-all"
              style={{ width: `${Math.min(100, (totalRegistrations / ENROLLMENT_TARGET) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {ENROLLMENT_TARGET - totalRegistrations > 0
              ? `${ENROLLMENT_TARGET - totalRegistrations} spots remaining`
              : "Goal reached!"
            }
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <DollarSign className="h-4 w-4" />
            Total Revenue
          </div>
          <div className="text-3xl font-bold">${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div className="text-xs text-muted-foreground mt-1">From Acuity payments</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Calendar className="h-4 w-4" />
            Program Weeks
          </div>
          <div className="text-3xl font-bold">8</div>
          <div className="text-xs text-muted-foreground mt-1">Jun 8 – Aug 7</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Sun className="h-4 w-4" />
            Program Tracks
          </div>
          <div className="text-3xl font-bold">3</div>
          <div className="text-xs text-muted-foreground mt-1">Full-Day · Half-Day · Tots</div>
        </div>
      </div>

      {/* Track Summary */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Program Tracks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(TRACK_CONFIG) as [keyof typeof TRACK_CONFIG, typeof TRACK_CONFIG[keyof typeof TRACK_CONFIG]][]).map(([key, cfg]) => {
            const track = trackSummary[key];
            return (
              <div key={key} className={`border rounded-xl p-5 ${cfg.bg}`}>
                <div className={`text-sm font-semibold mb-1 ${cfg.color}`}>{cfg.label}</div>
                <div className="text-xs text-muted-foreground mb-3">{cfg.ageGroup}</div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-2xl font-bold">{track.count}</div>
                    <div className="text-xs text-muted-foreground">registrations</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">${track.revenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}</div>
                    <div className="text-xs text-muted-foreground">revenue</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Schedule */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Weekly Schedule</h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Week</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dates</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Full-Day</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Half-Day</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Tots</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {programDates.map((pd, i) => {
                const fdCount = weeks.filter(w => w.week === pd.week && w.track === 'full_day').reduce((s, w) => s + w.registrations, 0);
                const hdCount = weeks.filter(w => w.week === pd.week && w.track === 'half_day').reduce((s, w) => s + w.registrations, 0);
                const totsCount = weeks.filter(w => w.week === pd.week && w.track === 'tots').reduce((s, w) => s + w.registrations, 0);
                const total = fdCount + hdCount + totsCount;
                return (
                  <tr key={i} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{pd.label}</td>
                    <td className="px-4 py-3 text-muted-foreground">{pd.week}</td>
                    <td className="px-4 py-3 text-right">{fdCount > 0 ? <span className="text-[#F5C72C] font-semibold">{fdCount}</span> : <span className="text-muted-foreground/40">—</span>}</td>
                    <td className="px-4 py-3 text-right">{hdCount > 0 ? <span className="text-[#888888] font-semibold">{hdCount}</span> : <span className="text-muted-foreground/40">—</span>}</td>
                    <td className="px-4 py-3 text-right">{totsCount > 0 ? <span className="text-[#E8453C] font-semibold">{totsCount}</span> : <span className="text-muted-foreground/40">—</span>}</td>
                    <td className="px-4 py-3 text-right font-semibold">{total > 0 ? total : <span className="text-muted-foreground/40">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* How Did They Hear */}
      {sortedHowHeard.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Registration Source Breakdown
          </h2>
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            {sortedHowHeard.map(([source, count]) => {
              const pct = totalSourced > 0 ? (count / totalSourced) * 100 : 0;
              return (
                <div key={source}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{source}</span>
                    <span className="font-semibold">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Marketing Intelligence */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Marketing Intelligence</h2>
          <p className="text-sm text-muted-foreground mt-1">Meta Ads, Instagram, and newsletter efforts for PBGA Junior Summer Camp.</p>
        </div>
        <ProgramMarketingPanel
          programName="PBGA Junior Summer Camp"
          programKeywords={["summer camp", "junior camp", "pbga junior"]}
        />
      </div>
      {/* AI Marketing Intelligence */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-[#F5C72C]">❖</span> AI Marketing Intelligence
          </h2>
          <p className="text-sm text-muted-foreground mt-1">AI-generated multi-channel marketing strategy based on program performance data.</p>
        </div>
        <ProgramAIIntelligence campaignId={4} programName="PBGA Junior Summer Camp" />
      </div>
    </div>
  );
}
