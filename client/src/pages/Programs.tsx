import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CampaignKPI } from "@/components/CampaignKPI";
import { TrendChart } from "@/components/TrendChart";
import { trpc } from "@/lib/trpc";
import { Loader2, Target, DollarSign, TrendingUp, ChevronRight, Layers } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

// Strategic Campaign definitions
const STRATEGIC_CAMPAIGNS = {
  trial_conversion: {
    name: "Trial Conversion",
    color: "oklch(0.65 0.25 142)", // Green
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  membership_acquisition: {
    name: "Membership Acquisition",
    color: "oklch(0.70 0.20 30)", // Pink/Red
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  },
  member_retention: {
    name: "Member Retention",
    color: "oklch(0.60 0.20 250)", // Blue
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  corporate_events: {
    name: "B2B Sales",
    color: "oklch(0.65 0.20 60)", // Yellow/Gold
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
} as const;

// Detail page routes for programs that have drill-down pages
const PROGRAM_DETAIL_ROUTES: Record<string, string> = {
  "Sunday Clinic": "/sunday-clinic",
  "PBGA Winter Clinic": "/winter-clinic",
  "Annual Membership Giveaway": "/annual-giveaway",
};

export default function Programs() {
  const { data: programs, isLoading: programsLoading } = trpc.campaigns.list.useQuery();
  const [, setLocation] = useLocation();
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null);
  
  // Fetch historical data for expanded campaign
  const { data: historicalData } = trpc.intelligence.getCampaignHistory.useQuery(
    { campaignId: expandedCampaign!, days: 30 },
    { enabled: expandedCampaign !== null }
  );

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(parseFloat(value));
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

  // Load campaign mappings from database for all programs
  const programCampaignQueries = useMemo(() => {
    if (!programs) return [];
    return programs.map(program => program.id);
  }, [programs]);

  // Fetch campaign mappings for all programs
  const campaignMappings = trpc.useQueries((t) => 
    programCampaignQueries.map(programId => 
      t.strategicCampaigns.getProgramCampaigns({ programId })
    )
  );

  const isLoading = programsLoading || campaignMappings.some(q => q.isLoading);

  // Build a map of program ID to strategic campaigns
  const programCampaignMap = useMemo(() => {
    if (!programs || campaignMappings.some(q => !q.data)) return new Map<number, string[]>();
    
    const map = new Map<number, string[]>();
    programs.forEach((program, index) => {
      const mappings = campaignMappings[index]?.data || [];
      const strategicCampaigns = mappings.map(m => m.strategicCampaign);
      
      // Fallback to database category if no explicit mappings
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
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const avgROI = programStats.totalSpend > 0 
    ? ((programStats.totalRevenue - programStats.totalSpend) / programStats.totalSpend) * 100 
    : 0;

  return (
    <DashboardLayout>
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Programs</h1>
        <p className="text-muted-foreground mt-2">
          Tactical marketing programs organized by strategic campaign objectives
        </p>
      </div>

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
            <p className="text-xs text-muted-foreground mt-1">
              {programStats.active} active
            </p>
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
                        {hasDetailPage && (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <CardDescription>{program.description}</CardDescription>
                    </div>
                    <Badge variant={program.status === "active" ? "default" : "secondary"}>
                      {program.status}
                    </Badge>
                  </div>

                  {/* Strategic Campaign Tags */}
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
                  {/* Metrics Grid */}
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

                  {/* Goal-Based KPI */}
                  <div className="pt-4 border-t">
                    <CampaignKPI campaign={program} />
                  </div>

                  {/* Trend Chart Toggle */}
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
                              data={historicalData.map(d => ({
                                date: d.snapshotDate.toString(),
                                value: Number(d.roi),
                              }))}
                              title="ROI Trend"
                              valueLabel="ROI %"
                              color="#10b981"
                            />
                            <TrendChart
                              data={historicalData.map(d => ({
                                date: d.snapshotDate.toString(),
                                value: Number(d.spend),
                              }))}
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
    </DashboardLayout>
  );
}
