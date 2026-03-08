import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DEFAULT_VENUE_SLUG, appRoutes } from "@/lib/routes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target, DollarSign, BarChart3, ChevronRight, TrendingDown, CalendarRange, LayoutGrid } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import AsanaTimeline from "@/components/AsanaTimeline";

const CAMPAIGN_COLORS: Record<string, string> = {
  trial_conversion: "emerald",
  membership_acquisition: "pink",
  member_retention: "blue",
  corporate_events: "amber",
};

const CAMPAIGN_BG_COLORS: Record<string, string> = {
  emerald: "bg-[#3DB855]/10 text-[#3DB855]",
  pink: "bg-[#E8453C]/10 text-[#E8453C]",
  blue: "bg-[#888888]/10 text-[#888888]",
  amber: "bg-[#F5C72C]/10 text-[#111111]",
};

export default function StrategicCampaigns() {
  const venueSlug = DEFAULT_VENUE_SLUG;
  const [, setLocation] = useLocation();
  const { data: campaigns, isLoading } = trpc.strategicCampaigns.getOverview.useQuery();
  const { data: kpiData } = trpc.intelligence.getStrategicKPIs.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-96 mb-2" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<"campaigns" | "timeline">("campaigns");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Strategic Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            High-level strategic objectives with aggregated program performance
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-[#F5F5F5] rounded-xl border border-[#E0E0E0] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === "campaigns" ? "bg-white text-[#111] shadow-sm" : "text-[#666] hover:text-[#333]"}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />Campaigns
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === "timeline" ? "bg-white text-[#111] shadow-sm" : "text-[#666] hover:text-[#333]"}`}
          >
            <CalendarRange className="w-3.5 h-3.5" />Asana Timeline
          </button>
        </div>
      </div>

      {activeTab === "timeline" && <AsanaTimeline />}

      {activeTab === "campaigns" && (<>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Strategic objectives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.reduce((sum, c) => sum + c.totalPrograms, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tactical programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${campaigns?.reduce((sum, c) => sum + c.totalSpend, 0).toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${campaigns?.reduce((sum, c) => sum + c.totalRevenue, 0).toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Generated revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {campaigns?.map(campaign => {
          const colorClass = CAMPAIGN_BG_COLORS[campaign.color] || CAMPAIGN_BG_COLORS.blue;
          
          return (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation(appRoutes.venue(venueSlug).operations.campaignDetail(campaign.id))}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl">{campaign.name}</CardTitle>
                    <CardDescription>{campaign.description}</CardDescription>
                  </div>
                  <Badge className={colorClass}>
                    {campaign.totalPrograms} {campaign.totalPrograms === 1 ? "program" : "programs"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* PRIMARY KPI — headline metric */}
                {campaign.id === 'membership_acquisition' && kpiData && (
                  <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Primary KPI — Membership Goal</p>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-4xl font-black">{kpiData.membershipAcquisition.current}</span>
                      <span className="text-sm text-muted-foreground mb-1">/ {kpiData.membershipAcquisition.target} members</span>
                    </div>
                    <Progress value={kpiData.membershipAcquisition.progress} className="h-2.5" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiData.membershipAcquisition.progress.toFixed(1)}% to year-end target • Need{' '}
                      {kpiData.membershipAcquisition.target - kpiData.membershipAcquisition.current} more members
                    </p>
                  </div>
                )}
                {campaign.id === 'trial_conversion' && kpiData && (
                  <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Primary KPI — Trial Conversion Rate</p>
                    <div className="flex items-end justify-between mb-2">
                      <span className={`text-4xl font-black ${
                        kpiData.trialConversion.current >= kpiData.trialConversion.target
                          ? 'text-[#3DB855]'
                          : kpiData.trialConversion.current > 0 ? 'text-[#F5C72C]' : 'text-muted-foreground'
                      }`}>
                        {kpiData.trialConversion.current.toFixed(1)}%
                      </span>
                      <span className="text-sm text-muted-foreground mb-1">target: {kpiData.trialConversion.target}%</span>
                    </div>
                    <Progress value={kpiData.trialConversion.progress} className="h-2.5" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiData.trialConversion.current < kpiData.trialConversion.target
                        ? `${(kpiData.trialConversion.target - kpiData.trialConversion.current).toFixed(1)}% below target`
                        : `${(kpiData.trialConversion.current - kpiData.trialConversion.target).toFixed(1)}% above target`}
                    </p>
                  </div>
                )}
                {campaign.id === 'member_retention' && kpiData && (
                  <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Primary KPI — Retention Rate</p>
                    <div className="flex items-end justify-between mb-2">
                      <span className={`text-4xl font-black ${
                        kpiData.memberRetention.current >= kpiData.memberRetention.target
                          ? 'text-[#3DB855]'
                          : kpiData.memberRetention.current > 0 ? 'text-[#F5C72C]' : 'text-muted-foreground'
                      }`}>
                        {kpiData.memberRetention.current.toFixed(1)}%
                      </span>
                      <span className="text-sm text-muted-foreground mb-1">target: {kpiData.memberRetention.target}%</span>
                    </div>
                    <Progress value={kpiData.memberRetention.progress} className="h-2.5" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiData.memberRetention.current >= kpiData.memberRetention.target
                        ? `Exceeding goal by ${(kpiData.memberRetention.current - kpiData.memberRetention.target).toFixed(1)}%`
                        : `${(kpiData.memberRetention.target - kpiData.memberRetention.current).toFixed(1)}% below target`}
                    </p>
                  </div>
                )}
                {campaign.id === 'corporate_events' && kpiData && (
                  <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Primary KPI — B2B Events This Month</p>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-4xl font-black">{kpiData.corporateEvents.current}</span>
                      <span className="text-sm text-muted-foreground mb-1">/ {kpiData.corporateEvents.target} events</span>
                    </div>
                    <Progress value={kpiData.corporateEvents.progress} className="h-2.5" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Target: 1 event/week •{' '}
                      {kpiData.corporateEvents.current >= kpiData.corporateEvents.target
                        ? 'On track'
                        : `Need ${kpiData.corporateEvents.target - kpiData.corporateEvents.current} more events`}
                    </p>
                  </div>
                )}

                {/* Metrics Grid — Spend / Revenue */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-base font-bold mt-0.5">${campaign.totalBudget.toFixed(0)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Spend</p>
                    <p className="text-base font-bold mt-0.5">${campaign.totalSpend.toFixed(0)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-base font-bold mt-0.5">${campaign.totalRevenue.toFixed(0)}</p>
                  </div>
                </div>

                {/* KPI Secondary Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Cost per Acquisition / Efficiency KPI */}
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Cost per Acquisition</p>
                    <p className="text-base font-bold mt-0.5">
                      {campaign.totalSpend > 0 && campaign.totalRevenue > 0
                        ? `$${(campaign.totalSpend / Math.max(1, campaign.programs.reduce((s, p) => s + (p.revenue > 0 ? 1 : 0), 0))).toFixed(0)}`
                        : campaign.totalSpend > 0 ? `$${campaign.totalSpend.toFixed(0)} total` : '—'}
                    </p>
                  </div>
                  {/* ROI — kept as supplementary */}
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Financial ROI</p>
                    <p className={`text-base font-bold mt-0.5 ${campaign.roi >= 0 ? 'text-[#3DB855]' : 'text-[#E8453C]'}`}>
                      {campaign.roi >= 0 ? '+' : ''}{campaign.roi.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* View Landing Page Button */}
                {campaign.landingPageUrl && (
                  <div className="pt-4">
                    <a
                      href={campaign.landingPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                    >
                      View Landing Page
                    </a>
                  </div>
                )}

                {/* Programs List */}
                {campaign.programs.length > 0 && (
                  <div className="pt-4 border-t space-y-2">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Supporting Programs</p>
                    {campaign.programs.map(program => {
                      const programRoi = program.spend > 0 
                        ? ((program.revenue - program.spend) / program.spend) * 100 
                        : 0;
                      
                      return (
                        <button
                          key={program.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            setLocation(appRoutes.venue(venueSlug).operations.programDetail(program.id));
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{program.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">
                                ${program.spend.toFixed(2)} spend
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ${program.revenue.toFixed(2)} revenue
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {program.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className={`text-sm font-semibold ${programRoi >= 0 ? "text-[#3DB855]" : "text-[#E8453C]"}`}>
                              {programRoi >= 0 ? "+" : ""}{programRoi.toFixed(0)}%
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      </>)}
    </div>
  );
}
