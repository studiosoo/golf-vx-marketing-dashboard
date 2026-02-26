import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target, DollarSign, BarChart3, ChevronRight, TrendingDown, Search, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";

const CAMPAIGN_COLORS: Record<string, string> = {
  trial_conversion: "emerald",
  membership_acquisition: "pink",
  member_retention: "blue",
  corporate_events: "amber",
};

const CAMPAIGN_BG_COLORS: Record<string, string> = {
  emerald: "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white font-semibold shadow-sm cursor-pointer hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-colors",
  pink: "bg-pink-600 text-white dark:bg-pink-500 dark:text-white font-semibold shadow-sm cursor-pointer hover:bg-pink-700 dark:hover:bg-pink-400 transition-colors",
  blue: "bg-blue-600 text-white dark:bg-blue-500 dark:text-white font-semibold shadow-sm cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors",
  amber: "bg-amber-500 text-white dark:bg-amber-400 dark:text-gray-900 font-semibold shadow-sm cursor-pointer hover:bg-amber-600 dark:hover:bg-amber-300 transition-colors",
};

// Status badge colors for program status
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-600 text-white dark:bg-green-500 dark:text-white border-0 font-medium";
    case "completed":
      return "bg-slate-500 text-white dark:bg-slate-400 dark:text-white border-0 font-medium";
    case "paused":
      return "bg-yellow-500 text-white dark:bg-yellow-400 dark:text-gray-900 border-0 font-medium";
    case "planned":
      return "bg-blue-500 text-white dark:bg-blue-400 dark:text-white border-0 font-medium";
    default:
      return "bg-slate-400 text-white border-0 font-medium";
  }
}

export default function StrategicCampaigns() {
  const [, setLocation] = useLocation();
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});
  const { data: campaigns, isLoading } = trpc.strategicCampaigns.getOverview.useQuery();
  const { data: kpiData } = trpc.intelligence.getStrategicKPIs.useQuery();

  function togglePrograms(campaignId: string) {
    setExpandedPrograms(prev => ({ ...prev, [campaignId]: !prev[campaignId] }));
  }

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-muted-foreground mt-2">
          Strategic objectives with aggregated program performance
        </p>
      </div>

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
          const isExpanded = expandedPrograms[campaign.id] ?? true;
          
          return (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl">{campaign.name}</CardTitle>
                    <CardDescription>{campaign.description}</CardDescription>
                  </div>
                  <Badge
                    className={colorClass}
                    onClick={() => togglePrograms(campaign.id)}
                    title={isExpanded ? "Hide programs" : "Show programs"}
                  >
                    {campaign.totalPrograms} {campaign.totalPrograms === 1 ? "program" : "programs"}
                    <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Goal/KPI Progress Section */}
                {campaign.id === 'membership_acquisition' && kpiData && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Membership Goal</span>
                      <span className="text-sm font-bold">
                        {kpiData.membershipAcquisition.current} / {kpiData.membershipAcquisition.target} members
                      </span>
                    </div>
                    <Progress value={kpiData.membershipAcquisition.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiData.membershipAcquisition.progress.toFixed(1)}% to year-end target • Need{' '}
                      {kpiData.membershipAcquisition.target - kpiData.membershipAcquisition.current} more members
                    </p>
                  </div>
                )}
                {campaign.id === 'trial_conversion' && kpiData && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Trial Conversion Rate</span>
                      <span className="text-sm font-bold">{kpiData.trialConversion.current.toFixed(1)}%</span>
                    </div>
                    <Progress value={kpiData.trialConversion.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Target: {kpiData.trialConversion.target}% •{' '}
                      {kpiData.trialConversion.current < kpiData.trialConversion.target
                        ? `${(kpiData.trialConversion.target - kpiData.trialConversion.current).toFixed(1)}% below target`
                        : `${(kpiData.trialConversion.current - kpiData.trialConversion.target).toFixed(1)}% above target`}
                    </p>
                  </div>
                )}
                {campaign.id === 'member_retention' && kpiData && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Retention Rate</span>
                      <span className={`text-sm font-bold ${
                        kpiData.memberRetention.current >= kpiData.memberRetention.target
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {kpiData.memberRetention.current.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={kpiData.memberRetention.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Target: {kpiData.memberRetention.target}% •{' '}
                      {kpiData.memberRetention.current >= kpiData.memberRetention.target
                        ? `Exceeding goal by ${(kpiData.memberRetention.current - kpiData.memberRetention.target).toFixed(1)}%`
                        : `${(kpiData.memberRetention.target - kpiData.memberRetention.current).toFixed(1)}% below target`}
                    </p>
                  </div>
                )}
                {campaign.id === 'corporate_events' && kpiData && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">B2B Events (This Month)</span>
                      <span className="text-sm font-bold">
                        {kpiData.corporateEvents.current} / {kpiData.corporateEvents.target} events
                      </span>
                    </div>
                    <Progress value={kpiData.corporateEvents.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Goal: 1 B2B event/month •{' '}
                      {kpiData.corporateEvents.current >= kpiData.corporateEvents.target
                        ? 'Goal met this month'
                        : `Need ${kpiData.corporateEvents.target - kpiData.corporateEvents.current} more event this month`}
                    </p>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="text-lg font-semibold">${campaign.totalBudget.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Spend</p>
                    <p className="text-lg font-semibold">${campaign.totalSpend.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-lg font-semibold">${campaign.totalRevenue.toFixed(2)}</p>
                  </div>
                </div>

                {/* ROI */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {campaign.roi >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-sm font-medium">Financial ROI</span>
                    </div>
                    <span className={`text-lg font-bold ${campaign.roi >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {campaign.roi >= 0 ? "+" : ""}{campaign.roi.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* B2B Research Button — only for corporate_events */}
                {campaign.id === 'corporate_events' && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      onClick={() => setLocation("/intelligence/research")}
                    >
                      <Search className="h-4 w-4" />
                      Start Market Research
                    </Button>
                  </div>
                )}
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
                {campaign.programs.length > 0 && isExpanded && (
                  <div className="pt-4 border-t space-y-2">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Supporting Programs</p>
                    {campaign.programs.map(program => {
                      const programRoi = program.spend > 0 
                        ? ((program.revenue - program.spend) / program.spend) * 100 
                        : 0;
                      
                      return (
                        <button
                          key={program.id}
                          onClick={() => setLocation("/programs")}
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
                              <Badge className={`text-xs ${getStatusBadgeClass(program.status)}`}>
                                {program.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className={`text-sm font-semibold ${programRoi >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
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
    </div>
  );
}
