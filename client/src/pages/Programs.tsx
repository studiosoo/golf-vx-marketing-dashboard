import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CampaignKPI } from "@/components/CampaignKPI";
import { TrendChart } from "@/components/TrendChart";
import { trpc } from "@/lib/trpc";
import { Loader2, Target, DollarSign, TrendingUp, ChevronRight, Layers, Users, Calendar, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

// Strategic Campaign definitions
const STRATEGIC_CAMPAIGNS = {
  trial_conversion: {
    name: "Trial Conversion",
    color: "oklch(0.65 0.25 142)",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  membership_acquisition: {
    name: "Membership Acquisition",
    color: "oklch(0.70 0.20 30)",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  },
  member_retention: {
    name: "Member Retention",
    color: "oklch(0.60 0.20 250)",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  corporate_events: {
    name: "B2B Sales",
    color: "oklch(0.65 0.20 60)",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
} as const;

const PROGRAM_DETAIL_ROUTES: Record<string, string> = {
  "Sunday Clinic": "/sunday-clinic",
  "PBGA Winter Clinic": "/winter-clinic",
  "Annual Membership Giveaway": "/annual-giveaway",
};

const SESSION_COLORS: Record<string, { bg: string; border: string; badge: string; dot: string }> = {
  yellow: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    dot: "bg-amber-400",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    dot: "bg-blue-400",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    dot: "bg-emerald-400",
  },
};

const DATE_LABELS: Record<string, string> = {
  "2026-01-25": "Jan 25",
  "2026-02-01": "Feb 1",
  "2026-02-22": "Feb 22",
  "2026-03-01": "Mar 1",
  "2026-03-22": "Mar 22",
  "2026-03-29": "Mar 29",
};

export default function Programs() {
  const { data: programs, isLoading: programsLoading } = trpc.campaigns.list.useQuery();
  const { data: driveDayData, isLoading: driveDayLoading } = trpc.campaigns.getDriveDaySessions.useQuery();
  const [, setLocation] = useLocation();
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null);

  const { data: historicalData } = trpc.intelligence.getCampaignHistory.useQuery(
    { campaignId: expandedCampaign!, days: 30 },
    { enabled: expandedCampaign !== null }
  );

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(num);
  };

  const calculateROI = (revenue: string, spend: string) => {
    const rev = parseFloat(revenue);
    const spd = parseFloat(spend);
    return spd === 0 ? 0 : ((rev - spd) / spd) * 100;
  };

  const programStats = useMemo(() => {
    if (!programs) return { total: 0, active: 0, totalSpend: 0, totalRevenue: 0 };
    return {
      total: programs.length,
      active: programs.filter(c => c.status === "active").length,
      totalSpend: programs.reduce((sum, c) => sum + parseFloat(c.actualSpend), 0),
      totalRevenue: programs.reduce((sum, c) => sum + parseFloat(c.actualRevenue), 0),
    };
  }, [programs]);

  const programCampaignQueries = useMemo(() => {
    if (!programs) return [];
    return programs.map(program => program.id);
  }, [programs]);

  const campaignMappings = trpc.useQueries((t) =>
    programCampaignQueries.map(programId =>
      t.strategicCampaigns.getProgramCampaigns({ programId })
    )
  );

  const isLoading = programsLoading || campaignMappings.some(q => q.isLoading);

  const programCampaignMap = useMemo(() => {
    if (!programs || campaignMappings.some(q => !q.data)) return new Map<number, string[]>();
    const map = new Map<number, string[]>();
    programs.forEach((program, index) => {
      const mappings = campaignMappings[index]?.data || [];
      const strategicCampaigns = mappings.map(m => m.strategicCampaign);
      if (strategicCampaigns.length === 0) {
        map.set(program.id, [program.category]);
      } else {
        map.set(program.id, strategicCampaigns);
      }
    });
    return map;
  }, [programs, campaignMappings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const avgROI = programStats.totalSpend > 0
    ? ((programStats.totalRevenue - programStats.totalSpend) / programStats.totalSpend) * 100
    : 0;

  const overall = driveDayData?.overall;
  const sessions = driveDayData?.sessions || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Programs</h1>
        <p className="text-muted-foreground mt-2">
          Tactical marketing programs organized by strategic campaign objectives
        </p>
      </div>

      {/* ── Drive Day Section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Drive Day Golf Clinic
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              3-session Sunday clinic series · $20/person · Members attend free · Led by PGA Professionals
            </p>
          </div>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
            Active Series
          </Badge>
        </div>

        {/* Drive Day Overall KPIs */}
        {driveDayLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Drive Day data from Acuity...
          </div>
        ) : overall ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overall.totalRegistrations}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all sessions</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paid Attendees</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overall.paidAttendees}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overall.memberAttendees} members (free)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue Collected</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(overall.revenueCollected)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overall.paidAttendees > 0 ? `$${(overall.revenueCollected / overall.paidAttendees).toFixed(0)} avg/paid attendee` : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Member Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overall.totalRegistrations > 0
                      ? `${Math.round((overall.memberAttendees / overall.totalRegistrations) * 100)}%`
                      : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Members vs total</p>
                </CardContent>
              </Card>
            </div>

            {/* Session Breakdown Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {sessions.map((session) => {
                const colors = SESSION_COLORS[session.color] || SESSION_COLORS.yellow;
                const completedDates = session.dates.filter(
                  d => new Date(d) <= new Date()
                );
                const upcomingDates = session.dates.filter(
                  d => new Date(d) > new Date()
                );

                return (
                  <Card
                    key={session.name}
                    className={`border-2 ${colors.border} ${colors.bg}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className={`${colors.badge} text-xs mb-2`}>
                            {session.day}
                          </Badge>
                          <CardTitle className="text-base leading-tight">
                            {session.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1 leading-snug">
                            {session.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Session KPIs */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-xl font-bold">{session.totalRegistrations}</div>
                          <div className="text-xs text-muted-foreground">Registered</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold">{session.paidAttendees}</div>
                          <div className="text-xs text-muted-foreground">Paid</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold">{formatCurrency(session.revenueCollected)}</div>
                          <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                      </div>

                      {/* Per-Date Breakdown */}
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Date Breakdown
                        </p>
                        {session.dates.map((date) => {
                          const dateData = session.byDate[date] || { registrations: 0, paid: 0, members: 0, revenue: 0 };
                          const isPast = new Date(date) <= new Date();
                          const dateLabel = DATE_LABELS[date] || date;
                          return (
                            <div key={date} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isPast ? colors.dot : "bg-muted-foreground/30"}`} />
                                <span className={isPast ? "font-medium" : "text-muted-foreground"}>
                                  {dateLabel}
                                </span>
                                {!isPast && (
                                  <span className="text-xs text-muted-foreground">(upcoming)</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-muted-foreground">
                                  {dateData.registrations} reg
                                </span>
                                <span className="font-medium">
                                  {formatCurrency(dateData.revenue)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Member vs Paid breakdown bar */}
                      {session.totalRegistrations > 0 && (
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Paid ({session.paidAttendees})</span>
                            <span>Members ({session.memberAttendees})</span>
                          </div>
                          <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                            <div
                              className={`${colors.dot} transition-all`}
                              style={{ width: `${(session.paidAttendees / session.totalRegistrations) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        ) : null}
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* Strategic Campaigns Legend */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Strategic Campaigns</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STRATEGIC_CAMPAIGNS).map(([key, campaign]) => (
              <Badge key={key} className={campaign.badgeClass}>
                {campaign.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{programStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">{programStats.active} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${programStats.totalSpend.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${programStats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgROI >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {avgROI.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Programs List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">All Programs</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Each program supports one or more strategic campaigns
        </p>
        <div className="grid gap-4">
          {programs?.map((program) => {
            const roi = calculateROI(program.actualRevenue, program.actualSpend);
            const hasDetailPage = PROGRAM_DETAIL_ROUTES[program.name];
            const strategicCampaigns = programCampaignMap.get(program.id) || [program.category];

            return (
              <Card
                key={program.id}
                className={`transition-all ${hasDetailPage ? "hover:shadow-lg cursor-pointer" : ""}`}
                onClick={() => hasDetailPage && setLocation(PROGRAM_DETAIL_ROUTES[program.name])}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{program.name}</CardTitle>
                        {hasDetailPage && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <CardDescription>{program.description}</CardDescription>
                    </div>
                    <Badge variant={program.status === "active" ? "default" : "secondary"}>
                      {program.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs text-muted-foreground font-medium">Supports:</span>
                    {strategicCampaigns.map((campaignKey) => {
                      const campaign = STRATEGIC_CAMPAIGNS[campaignKey as keyof typeof STRATEGIC_CAMPAIGNS];
                      return campaign ? (
                        <Badge key={campaignKey} className={campaign.badgeClass} variant="outline">
                          {campaign.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="text-lg font-semibold">{formatCurrency(program.budget)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Spend</p>
                      <p className="text-lg font-semibold">{formatCurrency(program.actualSpend)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-lg font-semibold">{formatCurrency(program.actualRevenue)}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <CampaignKPI campaign={program} />
                  </div>
                  <div className="pt-4 border-t">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCampaign(expandedCampaign === program.id ? null : program.id);
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      {expandedCampaign === program.id ? "Hide" : "Show"} 30-Day Trend
                    </button>
                    {expandedCampaign === program.id && (
                      <div className="mt-4 space-y-4">
                        {historicalData && historicalData.length > 0 ? (
                          <>
                            <TrendChart
                              data={historicalData.map(d => ({ date: d.snapshotDate.toString(), value: Number(d.roi) }))}
                              title="ROI Trend"
                              valueLabel="ROI %"
                              color="#10b981"
                            />
                            <TrendChart
                              data={historicalData.map(d => ({ date: d.snapshotDate.toString(), value: Number(d.spend) }))}
                              title="Spend Trend"
                              valueLabel="Spend $"
                              color="#f59e0b"
                            />
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">No historical data available yet. Data will be collected starting tonight.</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
