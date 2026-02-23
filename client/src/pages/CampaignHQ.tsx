import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Loader2, ChevronRight, RefreshCw, Sparkles, LayoutDashboard } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import MarketingIntelligence from "./MarketingIntelligence";

export default function CampaignHQ() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Campaign <span className="text-primary">HQ</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Strategic campaigns aligned with Asana Marketing Master Timeline
            </p>
          </div>
        </div>

        {/* Tabs: Overview | AI Insights */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewContent />
          </TabsContent>

          <TabsContent value="ai-insights" className="mt-6">
            <MarketingIntelligence />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// ─── Overview Content (cleaned: no AlertsBanner, no ActionCenter) ────────────

function OverviewContent() {
  const { data: categories, isLoading } = trpc.campaigns.getCategorySummary.useQuery();
  const { data: kpiData } = trpc.intelligence.getStrategicKPIs.useQuery();
  const syncMutation = trpc.autonomous.syncAllData.useMutation();
  const utils = trpc.useUtils();

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
      utils.invalidate();
      alert("All marketing data synced successfully!");
    } catch (error: any) {
      alert(`Sync failed: ${error.message}`);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getCategoryColor = (categoryId: string) => {
    const colors: Record<string, string> = {
      trial_conversion: "oklch(0.65 0.25 142)",
      membership_acquisition: "oklch(0.70 0.20 30)",
      member_retention: "oklch(0.60 0.20 250)",
      corporate_events: "oklch(0.65 0.20 60)",
    };
    return colors[categoryId] || "oklch(0.60 0.15 200)";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sync Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSync}
          disabled={syncMutation.isPending}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing...' : 'Sync All Data'}
        </Button>
      </div>

      {/* Seasonal Membership Alert (Apr-May critical window) */}
      {(() => {
        const currentMonth = new Date().getMonth() + 1;
        if (currentMonth === 4 || currentMonth === 5) {
          const weeksUntilJune = currentMonth === 4 ? 8 : 4;
          return (
            <Card className="border-orange-300 dark:border-orange-700 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-orange-900 dark:text-orange-200 mb-2">
                      Pre-Summer Critical Window: {weeksUntilJune} Weeks Until June Churn Season
                    </h3>
                    <p className="text-sm text-orange-800 dark:text-orange-300 mb-3">
                      Current pace needs to accelerate to protect year-end goal of 300 members. 
                      Summer months (Jun-Aug) typically see net member loss. Maximize acquisition NOW.
                    </p>
                    <div className="flex gap-3">
                      <Link href="/campaigns?tab=programs">
                        <Button size="sm" variant="default" className="bg-orange-600 hover:bg-orange-700">
                          View Membership Programs
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}

      {/* Campaign Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {categories?.map((category) => {
          const categoryColor = getCategoryColor(category.id);
          const roiPositive = category.roi >= 0;

          return (
            <Card
              key={category.id}
              className="bg-card border-2 hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden"
              style={{
                borderColor: `color-mix(in oklch, ${categoryColor} 30%, transparent)`,
              }}
            >
              {/* Category Color Accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: categoryColor }}
              />

              <Link href={`/category/${category.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {category.name}
                      </CardTitle>
                      <CardDescription className="mt-1.5 text-sm">
                        {category.description}
                      </CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Campaign Count */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Promotions</span>
                    <span className="font-semibold text-foreground">
                      {category.activeCampaigns} active &bull; {category.completedCampaigns} completed
                    </span>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Total Spend</span>
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {formatCurrency(category.totalSpend)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Meta Ads: {formatCurrency(category.totalMetaAdsSpend)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Total Revenue</span>
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {formatCurrency(category.totalRevenue)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Budget: {formatCurrency(category.totalBudget)}
                      </div>
                    </div>
                  </div>

                  {/* Goal/KPI Progress Section */}
                  {category.id === 'membership_acquisition' && kpiData && (
                    <div className="pt-4 border-t border-border">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Membership Goal</span>
                          <span className="font-semibold">
                            {kpiData.membershipAcquisition.current} / {kpiData.membershipAcquisition.target} members
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${kpiData.membershipAcquisition.progress}%`, backgroundColor: categoryColor }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {kpiData.membershipAcquisition.progress.toFixed(1)}% to year-end target &bull; Need{' '}
                          {kpiData.membershipAcquisition.target - kpiData.membershipAcquisition.current} more members
                        </p>
                      </div>
                    </div>
                  )}
                  {category.id === 'trial_conversion' && kpiData && (
                    <div className="pt-4 border-t border-border">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Trial Conversion Rate</span>
                          <span className="font-semibold">{kpiData.trialConversion.current.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${kpiData.trialConversion.progress}%`, backgroundColor: categoryColor }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Target: {kpiData.trialConversion.target}% &bull;{' '}
                          {kpiData.trialConversion.current < kpiData.trialConversion.target
                            ? `${(kpiData.trialConversion.target - kpiData.trialConversion.current).toFixed(1)}% below target`
                            : `${(kpiData.trialConversion.current - kpiData.trialConversion.target).toFixed(1)}% above target`}
                        </p>
                      </div>
                    </div>
                  )}
                  {category.id === 'member_retention' && kpiData && (
                    <div className="pt-4 border-t border-border">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Retention Rate</span>
                          <span className={`font-semibold ${
                            kpiData.memberRetention.current >= kpiData.memberRetention.target
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-orange-600 dark:text-orange-400'
                          }`}>
                            {kpiData.memberRetention.current.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${kpiData.memberRetention.progress}%`, backgroundColor: categoryColor }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Target: {kpiData.memberRetention.target}% &bull;{' '}
                          {kpiData.memberRetention.current >= kpiData.memberRetention.target
                            ? `Exceeding goal by ${(kpiData.memberRetention.current - kpiData.memberRetention.target).toFixed(1)}%`
                            : `${(kpiData.memberRetention.target - kpiData.memberRetention.current).toFixed(1)}% below target`}
                        </p>
                      </div>
                    </div>
                  )}
                  {category.id === 'corporate_events' && kpiData && (
                    <div className="pt-4 border-t border-border">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">B2B Events (This Month)</span>
                          <span className="font-semibold">
                            {kpiData.corporateEvents.current} / {kpiData.corporateEvents.target} events
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${kpiData.corporateEvents.progress}%`, backgroundColor: categoryColor }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Target: 1 event/week &bull;{' '}
                          {kpiData.corporateEvents.current >= kpiData.corporateEvents.target
                            ? 'On track'
                            : `Need ${kpiData.corporateEvents.target - kpiData.corporateEvents.current} more events`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ROI Indicator */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">ROI</span>
                      </div>
                      <div className={`flex items-center gap-1.5 text-sm font-bold ${roiPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {roiPositive ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {formatPercent(category.roi)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Manage programs and view detailed reports</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/campaigns?tab=programs">View All Programs</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/campaigns?tab=budget">Budget Manager</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/channels?tab=meta-ads">Meta Ads Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
