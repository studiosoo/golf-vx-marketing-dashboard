import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { appRoutes, DEFAULT_VENUE_SLUG, withDefaultVenueSlug } from "@/lib/routes";
import { TrendChart } from "@/components/TrendChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarRange,
  DollarSign,
  FileText,
  GitCompareArrows,
  LineChart,
  MessageSquareWarning,
  MousePointerClick,
  Percent,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

const DEFAULT_TAB = "overview";
const VALID_TABS = ["overview", "revenue", "funnel", "channel-roi", "program-roi", "trends"] as const;
type PerformanceTab = (typeof VALID_TABS)[number];

type UnknownRow = Record<string, unknown>;
type NumericTotals = {
  spend: number;
  clicks: number;
  reach: number;
  impressions: number;
  ctr: number;
};

type BreakdownRow = {
  label: string;
  spend: number;
  revenue: number;
  roas: number;
  campaignCount: number;
};

type ProgramRoiRow = {
  id: string;
  name: string;
  status: string;
  spend: number;
  revenue: number;
  targetRevenue: number;
  variance: number;
  roas: number;
  performanceScore: number;
  category: string;
};

type ContextualNote = {
  id: string;
  sourceType: string;
  status: string;
  text: string;
};

type FunnelStep = {
  label: string;
  value: number;
};

function isPerformanceTab(value: string | null): value is PerformanceTab {
  return !!value && (VALID_TABS as readonly string[]).includes(value);
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtNumber(n: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(n);
}

function fmtPercent(n: number, digits = 1) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

function safeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function parseIsoFromCompactDate(raw: string) {
  if (raw.length === 8) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw;
}

function getRow(record: unknown): UnknownRow {
  return record && typeof record === "object" ? (record as UnknownRow) : {};
}

function KpiStripCard({
  label,
  value,
  sub,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-[#AAAAAA]">{label}</p>
          <div className="rounded-lg bg-[#F5F5F5] p-2">
            <Icon className={`h-4 w-4 ${highlight ? "text-[#F5C72C]" : "text-[#888888]"}`} />
          </div>
        </div>
        <p className={`text-2xl font-bold tracking-tight ${highlight ? "text-[#F5C72C]" : "text-[#111111]"}`}>{value}</p>
        {sub ? <p className="mt-1 text-xs text-[#888888]">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function Performance() {
  const [location] = useLocation();
  const params = useMemo(() => new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""), [location]);
  const pathSegments = location.split("/").filter(Boolean);
  const venueSlug = withDefaultVenueSlug(pathSegments[1] ?? DEFAULT_VENUE_SLUG);
  const venueRoutes = appRoutes.venue(venueSlug);
  const requestedTab = params.get("tab");
  const activeTab: PerformanceTab = isPerformanceTab(requestedTab) ? requestedTab : DEFAULT_TAB;

  const snapshotQuery = trpc.preview.getSnapshot.useQuery();
  const campaignsQuery = trpc.campaigns.list.useQuery();
  const activeCampaignsQuery = trpc.campaigns.getByStatus.useQuery({ status: "active" });
  const categorySummaryQuery = trpc.campaigns.getCategorySummary.useQuery();
  const revenueSummaryQuery = trpc.revenue.getSummary.useQuery(undefined);
  const toastSummaryQuery = trpc.revenue.getToastSummary.useQuery();
  const toastDailyQuery = trpc.revenue.getToastDaily.useQuery(undefined);
  const acuityRevenueQuery = trpc.revenue.getAcuityRevenue.useQuery({ minDate: undefined, maxDate: undefined });
  const metaAdsQuery = trpc.metaAds.getAllCampaignsWithInsights.useQuery({ datePreset: "last_30d" });
  const reportingTemplatesQuery = trpc.reporting.templates.useQuery();
  const briefsQuery = trpc.reporting.listBriefs.useQuery({ venueSlug });
  const inboxQuery = trpc.reporting.listOperationalUpdates.useQuery({ venueSlug });

  const snapshot = getRow(snapshotQuery.data);
  const snapshotMembers = getRow(snapshot.members);
  const campaigns = ((campaignsQuery.data ?? []) as unknown[]).map(getRow);
  const activeCampaigns = ((activeCampaignsQuery.data ?? []) as unknown[]).map(getRow);
  const categorySummary = ((categorySummaryQuery.data ?? []) as unknown[]).map(getRow);
  const revenueSummary = getRow(revenueSummaryQuery.data);
  const toastSummary = getRow(toastSummaryQuery.data);
  const toastDaily = ((toastDailyQuery.data ?? []) as unknown[]).map(getRow);
  const acuityRevenue = getRow(acuityRevenueQuery.data);
  const metaCampaigns = ((metaAdsQuery.data ?? []) as unknown[]).map(getRow);
  const briefs = briefsQuery.data ?? [];
  const operationalUpdates = inboxQuery.data ?? [];
  const reportTemplates = reportingTemplatesQuery.data?.reports ?? [];

  const totalRevenue = safeNumber(revenueSummary.total);
  const totalSpend = activeCampaigns.reduce((sum, campaign) => sum + safeNumber(campaign.actualSpend), 0);
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const mrr = safeNumber(snapshotMembers.mrr);
  const activeMembers = safeNumber(snapshotMembers.total);
  const newMembersThisMonth = safeNumber(snapshotMembers.newThisMonth);
  const toastMtd = safeNumber(toastSummary.thisMonthRevenue);
  const toastLastMonth = safeNumber(toastSummary.lastMonthRevenue);
  const acuityTotal = safeNumber(acuityRevenue.total);
  const acuityBookings = safeNumber(acuityRevenue.totalBookings ?? acuityRevenue.count);
  const annualizedRevenue = mrr * 12 + toastMtd * 12 + acuityTotal;
  const monthOverMonthRevenue = toastLastMonth > 0 ? ((toastMtd - toastLastMonth) / toastLastMonth) * 100 : 0;
  const currentPeriodLabel = toastMtd > 0 ? "Current month vs prior month" : "Current analytics snapshot";

  const trendData = toastDaily
    .slice(-30)
    .map((row) => ({ date: parseIsoFromCompactDate(safeString(row.date)), value: safeNumber(row.totalRevenue) }));

  const categoryBreakdown: BreakdownRow[] = categorySummary.map((item) => {
    const spend = safeNumber(item.totalSpend);
    const revenue = safeNumber(item.totalRevenue);
    return {
      label: safeString(item.category, safeString(item.name, "Unknown")).replace(/_/g, " "),
      spend,
      revenue,
      roas: spend > 0 ? revenue / spend : 0,
      campaignCount: safeNumber(item.totalCampaigns ?? item.campaignCount),
    };
  });

  const programRoiRows: ProgramRoiRow[] = campaigns.map((campaign) => {
    const actualSpend = safeNumber(campaign.actualSpend);
    const actualRevenue = safeNumber(campaign.actualRevenue);
    const targetRevenue = safeNumber(campaign.targetRevenue);
    return {
      id: String(campaign.id ?? safeString(campaign.name, "program")),
      name: safeString(campaign.name, "Untitled program"),
      status: safeString(campaign.status, "planned"),
      spend: actualSpend,
      revenue: actualRevenue,
      targetRevenue,
      variance: actualRevenue - targetRevenue,
      roas: actualSpend > 0 ? actualRevenue / actualSpend : 0,
      performanceScore: safeNumber(campaign.performanceScore),
      category: safeString(campaign.category, "general").replace(/_/g, " "),
    };
  });

  const metaTotals: NumericTotals = metaCampaigns.reduce<NumericTotals>((acc, campaign) => {
    const insights = getRow(campaign.insights ?? campaign);
    return {
      spend: acc.spend + safeNumber(insights.spend),
      clicks: acc.clicks + safeNumber(insights.clicks),
      reach: acc.reach + safeNumber(insights.reach),
      impressions: acc.impressions + safeNumber(insights.impressions),
      ctr: acc.ctr + safeNumber(insights.ctr),
    };
  }, {
    spend: 0,
    clicks: 0,
    reach: 0,
    impressions: 0,
    ctr: 0,
  });

  const avgCtr = metaCampaigns.length > 0 ? metaTotals.ctr / metaCampaigns.length : 0;
  const funnelData: FunnelStep[] = [
    { label: "Reach", value: metaTotals.reach },
    { label: "Impressions", value: metaTotals.impressions },
    { label: "Clicks", value: metaTotals.clicks },
    { label: "Briefs ready", value: briefs.filter((brief) => brief.status !== "draft").length },
  ].filter((item) => item.value > 0);
  const topFunnelValue = funnelData[0]?.value ?? 0;

  const varianceCards = [
    {
      label: "Revenue vs last month",
      value: toastLastMonth > 0 ? fmtPercent(monthOverMonthRevenue) : "—",
      note: toastLastMonth > 0 ? `${fmtCurrency(toastMtd)} now vs ${fmtCurrency(toastLastMonth)} prior month` : "Waiting for prior month baseline",
    },
    {
      label: "Spend vs revenue",
      value: totalSpend > 0 ? `${avgRoas.toFixed(2)}× ROAS` : "—",
      note: totalSpend > 0 ? `${fmtCurrency(totalSpend)} spend against ${fmtCurrency(totalRevenue)} tracked revenue` : "No ad spend in current active set",
    },
    {
      label: "Membership movement",
      value: `${fmtNumber(newMembersThisMonth)}`,
      note: `${fmtNumber(activeMembers)} active members in current snapshot`,
    },
  ];

  const analysisSummary = useMemo(() => {
    if (totalRevenue === 0 && totalSpend === 0) {
      return "Performance is established as the canonical analytics workspace, but some connected revenue surfaces are still waiting for live data.";
    }
    if (avgRoas >= 3) {
      return "Revenue and spend are aligned well enough to treat paid activity as additive, with channel efficiency currently supportive of growth.";
    }
    if (avgRoas >= 1.5) {
      return "Performance is positive but mixed: revenue covers spend, though channel and program variance suggests uneven efficiency across the portfolio.";
    }
    return "Performance is now the analytical authority, and the current snapshot points to revenue/spend imbalance that merits closer channel and program diagnosis.";
  }, [avgRoas, totalRevenue, totalSpend]);

  const contextualNotes: ContextualNote[] = operationalUpdates.slice(0, 4).map((update) => ({
    id: String(update.id),
    sourceType: update.sourceType,
    status: update.status,
    text: update.metadata.normalizedSummary || update.metadata.note || update.rawText,
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#B8900A]">Performance</p>
          <h1 className="text-3xl font-semibold text-foreground">Unified Performance Workspace</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Performance is now the single analytical authority for revenue, ROI, trends, comparisons, and variance diagnosis.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="gap-1"><CalendarRange className="h-3 w-3" /> Date range: Current month / last 30 days</Badge>
          <Badge variant="outline" className="gap-1"><GitCompareArrows className="h-3 w-3" /> Comparison: prior month + active portfolio</Badge>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <KpiStripCard label="Tracked revenue" value={fmtCurrency(totalRevenue)} sub={currentPeriodLabel} icon={DollarSign} highlight />
        <KpiStripCard label="Tracked spend" value={fmtCurrency(totalSpend)} sub={`${fmtNumber(activeCampaigns.length)} active campaigns`} icon={Target} />
        <KpiStripCard label="Average ROAS" value={totalSpend > 0 ? `${avgRoas.toFixed(2)}×` : "—"} sub="Revenue divided by active spend" icon={Percent} />
        <KpiStripCard label="Membership MRR" value={mrr > 0 ? fmtCurrency(mrr) : "—"} sub={`${fmtNumber(activeMembers)} active members`} icon={Users} />
        <KpiStripCard label="Annualized revenue view" value={annualizedRevenue > 0 ? fmtCurrency(annualizedRevenue) : "—"} sub="Membership + current revenue run rate" icon={TrendingUp} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Analytical summary" description="Use this as the starting point for interpretation, not as an action dashboard.">
          <div className="space-y-4">
            <p className="text-sm leading-6 text-foreground">{analysisSummary}</p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-[#AAAAAA]">Revenue mix</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{fmtCurrency(toastMtd + acuityTotal)}</p>
                <p className="text-xs text-muted-foreground">Toast {fmtCurrency(toastMtd)} + Acuity {fmtCurrency(acuityTotal)}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-[#AAAAAA]">Paid channel signal</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{avgCtr > 0 ? `${avgCtr.toFixed(2)}% CTR` : "Pending"}</p>
                <p className="text-xs text-muted-foreground">Meta Ads campaigns are the current ROI baseline</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-[#AAAAAA]">Reporting bridge</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{fmtNumber(reportTemplates.length)} templates</p>
                <p className="text-xs text-muted-foreground">Performance feeds recurring reports and briefs</p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Variance / what changed" description="Simple comparison context before deeper drilldown.">
          <div className="space-y-3">
            {varianceCards.map((card) => (
              <div key={card.label} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{card.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{card.value}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <Tabs value={activeTab}>
        <div className="overflow-x-auto pb-px">
          <TabsList className="min-w-max border border-border bg-muted/30">
            <TabsTrigger value="overview" asChild><Link href={`${venueRoutes.performance}?tab=overview`}>Overview</Link></TabsTrigger>
            <TabsTrigger value="revenue" asChild><Link href={`${venueRoutes.performance}?tab=revenue`}>Revenue</Link></TabsTrigger>
            <TabsTrigger value="funnel" asChild><Link href={`${venueRoutes.performance}?tab=funnel`}>Funnel</Link></TabsTrigger>
            <TabsTrigger value="channel-roi" asChild><Link href={`${venueRoutes.performance}?tab=channel-roi`}>Channel ROI</Link></TabsTrigger>
            <TabsTrigger value="program-roi" asChild><Link href={`${venueRoutes.performance}?tab=program-roi`}>Program ROI</Link></TabsTrigger>
            <TabsTrigger value="trends" asChild><Link href={`${venueRoutes.performance}?tab=trends`}>Trends</Link></TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <SectionCard title="Breakdown" description="Current analytical split across revenue, campaigns, and channel efficiency.">
              <div className="space-y-3">
                {categoryBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Category-level breakdown is not yet available for this dataset.</p>
                ) : categoryBreakdown.map((item) => (
                  <div key={item.label} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium capitalize text-foreground">{item.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.campaignCount} campaigns · Spend {fmtCurrency(item.spend)} · Revenue {fmtCurrency(item.revenue)}</p>
                      </div>
                      <Badge variant={item.roas >= 2 ? "default" : "secondary"}>{item.spend > 0 ? `${item.roas.toFixed(2)}× ROAS` : "No spend"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Context / annotations" description="Operational caveats that affect interpretation of the numbers.">
              <div className="space-y-3">
                {contextualNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No contextual notes yet. Performance can consume inbox notes and brief context as they are created.</p>
                ) : contextualNotes.map((note) => (
                  <div key={note.id} className="rounded-lg border bg-muted/20 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline">{note.sourceType.replace(/_/g, " ")}</Badge>
                      <Badge variant="secondary">{note.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="text-sm text-foreground">{note.text}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4 space-y-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <KpiStripCard label="Toast MTD" value={toastMtd > 0 ? fmtCurrency(toastMtd) : "—"} sub={toastLastMonth > 0 ? `Prior month ${fmtCurrency(toastLastMonth)}` : "POS baseline pending"} icon={DollarSign} highlight />
            <KpiStripCard label="Acuity revenue" value={acuityTotal > 0 ? fmtCurrency(acuityTotal) : "—"} sub={acuityBookings > 0 ? `${fmtNumber(acuityBookings)} bookings` : "Booking data pending"} icon={Activity} />
            <KpiStripCard label="MRR" value={mrr > 0 ? fmtCurrency(mrr) : "—"} sub="Membership recurring revenue" icon={Users} />
            <KpiStripCard label="Revenue change" value={toastLastMonth > 0 ? fmtPercent(monthOverMonthRevenue) : "—"} sub="Current month versus prior month" icon={GitCompareArrows} />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <SectionCard title="Revenue analysis" description="Current revenue surfaces consolidated under Performance.">
              <div className="space-y-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium text-foreground">What changed</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Revenue is no longer a standalone destination. It now lives here alongside spend, ROI, and trend context so the user can interpret revenue without leaving Performance.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-[#AAAAAA]">Revenue total</p>
                    <p className="mt-2 text-xl font-semibold text-foreground">{fmtCurrency(totalRevenue)}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-[#AAAAAA]">Programs revenue</p>
                    <p className="mt-2 text-xl font-semibold text-foreground">{fmtCurrency(acuityTotal)}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-[#AAAAAA]">Membership run rate</p>
                    <p className="mt-2 text-xl font-semibold text-foreground">{fmtCurrency(mrr * 12)}</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Report CTA" description="Turn analytical findings into a report or brief.">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Use the unified analytics view to move directly into recurring reporting outputs.</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={venueRoutes.reports.home}><Button><FileText className="mr-2 h-4 w-4" /> Open Reports</Button></Link>
                  <Link href={venueRoutes.reports.briefs}><Button variant="outline"><ArrowRight className="mr-2 h-4 w-4" /> Open Briefs</Button></Link>
                </div>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="mt-4 space-y-6">
          <SectionCard title="Funnel" description="MVP funnel structure using currently safe available data sources.">
            {funnelData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Funnel detail is not fully wired yet, but the unified Performance workspace now reserves this analytical destination.</p>
            ) : (
              <div className="space-y-4">
                {funnelData.map((step, index) => {
                  const relative = topFunnelValue > 0 ? (step.value / topFunnelValue) * 100 : 0;
                  return (
                    <div key={step.label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium text-foreground">{step.label}</span>
                        <span className="text-muted-foreground">{fmtNumber(step.value)}</span>
                      </div>
                      <div className="h-10 rounded-lg bg-[#F5C72C]/10">
                        <div className="flex h-full items-center rounded-lg bg-[#F5C72C] px-3 text-sm font-semibold text-[#111111]" style={{ width: `${Math.max(relative, 18)}%` }}>
                          {index === 0 ? "Top of funnel" : `${relative.toFixed(0)}% of top funnel`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="channel-roi" className="mt-4 space-y-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <KpiStripCard label="Meta spend" value={metaTotals.spend > 0 ? fmtCurrency(metaTotals.spend) : "—"} sub="Current ROI channel baseline" icon={BarChart3} />
            <KpiStripCard label="Avg CTR" value={avgCtr > 0 ? `${avgCtr.toFixed(2)}%` : "—"} sub={`${fmtNumber(metaTotals.clicks)} clicks`} icon={MousePointerClick} />
            <KpiStripCard label="Reach" value={metaTotals.reach > 0 ? fmtNumber(metaTotals.reach) : "—"} sub="Paid channel reach" icon={Users} />
            <KpiStripCard label="Impressions" value={metaTotals.impressions > 0 ? fmtNumber(metaTotals.impressions) : "—"} sub="Channel exposure" icon={LineChart} />
          </div>
          <SectionCard title="Channel ROI breakdown" description="Current channel ROI is anchored on Meta Ads until more channels are connected.">
            {metaCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No channel ROI data available yet.</p>
            ) : (
              <div className="space-y-3">
                {metaCampaigns.slice(0, 8).map((campaign) => {
                  const insights = getRow(campaign.insights ?? campaign);
                  const spend = safeNumber(insights.spend);
                  const clicks = safeNumber(insights.clicks);
                  const ctr = safeNumber(insights.ctr);
                  const reach = safeNumber(insights.reach);
                  return (
                    <div key={String(campaign.id ?? campaign.name ?? spend)} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{safeString(campaign.name, "Meta campaign")}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Spend {fmtCurrency(spend)} · {fmtNumber(clicks)} clicks · {fmtNumber(reach)} reach</p>
                        </div>
                        <Badge variant={ctr >= 2 ? "default" : "secondary"}>{ctr > 0 ? `${ctr.toFixed(2)}% CTR` : "CTR pending"}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="program-roi" className="mt-4 space-y-6">
          <SectionCard title="Program ROI" description="Program-level revenue, spend, variance, and performance score now live under Performance.">
            {programRoiRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No program ROI records available.</p>
            ) : (
              <div className="space-y-3">
                {programRoiRows.slice(0, 10).map((program) => (
                  <div key={program.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{program.name}</p>
                          <Badge variant={program.status === "active" ? "default" : "secondary"}>{program.status}</Badge>
                        </div>
                        <p className="mt-1 text-xs capitalize text-muted-foreground">{program.category}</p>
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#AAAAAA]">Revenue</p>
                          <p className="font-semibold text-foreground">{fmtCurrency(program.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#AAAAAA]">Spend</p>
                          <p className="font-semibold text-foreground">{fmtCurrency(program.spend)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#AAAAAA]">Variance</p>
                          <p className={`font-semibold ${program.variance >= 0 ? "text-[#3DB855]" : "text-[#E8453C]"}`}>{fmtCurrency(program.variance)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#AAAAAA]">Score</p>
                          <p className="font-semibold text-foreground">{program.performanceScore > 0 ? fmtNumber(program.performanceScore) : "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="trends" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <SectionCard title="Trend view" description="Historical direction belongs in Performance, not Dashboard.">
              <TrendChart
                data={trendData}
                title="Daily revenue trend"
                valueLabel="Revenue"
                color="#F5C72C"
                height={260}
              />
            </SectionCard>

            <SectionCard title="Mixed-source caveats" description="Contextual notes that should travel with interpretation.">
              <div className="space-y-3">
                {contextualNotes.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No blockers or caveats added yet.</div>
                ) : contextualNotes.map((note) => (
                  <div key={note.id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <MessageSquareWarning className="h-4 w-4 text-[#F5C72C]" />
                      <span className="text-sm font-medium text-foreground capitalize">{note.sourceType.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{note.text}</p>
                  </div>
                ))}
                <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Interpretation guidance</p>
                  <p className="mt-2">Operational blockers, venue notes, and HQ summaries now have a lightweight place inside Performance so analysis does not ignore execution reality.</p>
                </div>
              </div>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Authority rules</CardTitle>
          <CardDescription>Dashboard remains action-oriented. Performance owns analytics, trends, comparisons, and diagnosis.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="font-medium text-foreground">Dashboard</p>
            <p className="mt-2">Pulse, blockers, new updates, priorities, and shortcuts. No competing analytics destination.</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium text-foreground">Performance</p>
            <p className="mt-2">Analysis, trends, comparisons, variance, revenue analysis, ROI analysis, and diagnostic breakdowns.</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium text-foreground">Next step</p>
            <p className="mt-2">Use reports and briefs to distribute findings without creating another analytics home.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
