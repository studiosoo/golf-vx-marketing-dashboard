import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Eye, MousePointerClick, Target, ExternalLink, Lightbulb, Zap, AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type DatePreset = "today" | "yesterday" | "last_7d" | "last_14d" | "last_30d" | "last_90d" | "lifetime";

export default function MetaAds() {
  const [datePreset, setDatePreset] = useState<DatePreset>("last_30d");

  const { data: accountData, isLoading: accountLoading } = trpc.metaAds.getAccount.useQuery();
  const { data: insightsData, isLoading: insightsLoading } = trpc.metaAds.getAccountInsights.useQuery({ datePreset });
  const { data: campaignsData, isLoading: campaignsLoading } = trpc.metaAds.getAllCampaignsWithInsights.useQuery({ datePreset });
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { data: aiRecs, isLoading: recsLoading, refetch: refetchRecs } = trpc.metaAds.getAutoRecommendations.useQuery(undefined, {
    enabled: showRecommendations,
    staleTime: 5 * 60 * 1000,
  });
  const { toast } = useToast();

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatNumber = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatPercentage = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(2)}%`;
  };

  const getDateRangeLabel = (preset: DatePreset) => {
    const labels: Record<DatePreset, string> = {
      today: "Today",
      yesterday: "Yesterday",
      last_7d: "Last 7 Days",
      last_14d: "Last 14 Days",
      last_30d: "Last 30 Days",
      last_90d: "Last 90 Days",
      lifetime: "Lifetime",
    };
    return labels[preset];
  };

  const getObjectiveBadge = (objective: string) => {
    const objectiveMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      OUTCOME_TRAFFIC: { label: "Traffic", variant: "default" },
      OUTCOME_ENGAGEMENT: { label: "Engagement", variant: "secondary" },
      OUTCOME_LEADS: { label: "Leads", variant: "outline" },
      OUTCOME_SALES: { label: "Sales", variant: "destructive" },
      OUTCOME_AWARENESS: { label: "Awareness", variant: "secondary" },
    };
    const config = objectiveMap[objective] || { label: objective, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: "Active", className: "bg-green-500/15 text-green-400 border-green-500/30" },
      PAUSED: { label: "Paused", className: "bg-muted/60 text-muted-foreground border-border" },
      COMPLETED: { label: "Completed", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
      ARCHIVED: { label: "Archived", className: "bg-muted/60 text-muted-foreground border-border" },
      DELETED: { label: "Deleted", className: "bg-red-500/15 text-red-400 border-red-500/30" },
      IN_PROCESS: { label: "In Draft", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    };
    const config = statusMap[status] || { label: status, className: "" };
    return <Badge variant="outline" className={`border ${config.className}`}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meta Ads Performance</h1>
            <p className="text-muted-foreground mt-1">
              Facebook and Instagram advertising campaign analytics
            </p>
          </div>
          <Select value={datePreset} onValueChange={(value) => setDatePreset(value as DatePreset)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last_7d">Last 7 Days</SelectItem>
              <SelectItem value="last_14d">Last 14 Days</SelectItem>
              <SelectItem value="last_30d">Last 30 Days</SelectItem>
              <SelectItem value="last_90d">Last 90 Days</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Account Info */}
        {accountLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ) : accountData ? (
          <Card>
            <CardHeader>
              <CardTitle>{accountData.name}</CardTitle>
              <CardDescription>Ad Account ID: {accountData.id}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {insightsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : insightsData ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(insightsData.spend)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{getDateRangeLabel(datePreset)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(insightsData.impressions)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    CPM: {formatCurrency(insightsData.cpm)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(insightsData.clicks)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    CPC: {formatCurrency(insightsData.cpc)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(insightsData.ctr)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Number(insightsData.ctr) > 1.5 ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Above average
                      </span>
                    ) : (
                      <span className="text-yellow-600 flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" /> Below average
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {/* Campaigns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>
              Detailed metrics for all active campaigns ({getDateRangeLabel(datePreset)})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : campaignsData && campaignsData.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Objective</TableHead>
                      <TableHead className="text-right">Spend</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">CPC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignsData.map((campaign) => (
                      <TableRow key={campaign.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <Link href={`/meta-ads/campaign/${campaign.id}`} className="flex items-center gap-2 hover:text-primary">
                            {campaign.name}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>{getObjectiveBadge(campaign.objective)}</TableCell>
                        <TableCell className="text-right">
                          {campaign.insights ? formatCurrency(Number(campaign.insights.spend)) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.insights ? formatNumber(Number(campaign.insights.impressions)) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.insights ? formatNumber(Number(campaign.insights.clicks)) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.insights ? formatPercentage(Number(campaign.insights.ctr)) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.insights ? formatCurrency(Number(campaign.insights.cpc)) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No campaign data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Charts */}
        {campaignsData && campaignsData.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spend by Campaign</CardTitle>
                <CardDescription>Distribution of ad spend across campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignsData.filter(c => c.insights)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)"
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="insights.spend" fill="hsl(var(--primary))" name="Spend" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Click Performance</CardTitle>
                <CardDescription>Clicks and CTR by campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignsData.filter(c => c.insights)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)"
                      }}
                      formatter={(value: number, name: string) => 
                        name === "CTR" ? formatPercentage(value) : formatNumber(value)
                      }
                    />
                    <Legend />
                    <Bar dataKey="insights.clicks" fill="hsl(var(--chart-1))" name="Clicks" />
                    <Bar dataKey="insights.ctr" fill="hsl(var(--chart-2))" name="CTR %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* AI Recommendations Panel */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-[#ffcb00]" />
                <CardTitle>AI Ad Recommendations</CardTitle>
              </div>
              <Button
                variant={showRecommendations ? 'default' : 'outline'}
                size="sm"
                onClick={() => { if (!showRecommendations) setShowRecommendations(true); else refetchRecs(); }}
                disabled={recsLoading}
              >
                {recsLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
                ) : showRecommendations ? (
                  <><RefreshCw className="h-4 w-4 mr-2" />Refresh Analysis</>
                ) : (
                  <><Zap className="h-4 w-4 mr-2" />Analyze Campaigns</>
                )}
              </Button>
            </div>
            <CardDescription>AI-powered recommendations. Auto-actionable items are flagged for automation.</CardDescription>
          </CardHeader>
          {showRecommendations && (
            <CardContent>
              {recsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ffcb00]" />
                  <span className="ml-3 text-muted-foreground">Analyzing campaign performance...</span>
                </div>
              ) : aiRecs ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/30 border">
                    <p className="text-sm font-medium mb-1">Account Health Summary</p>
                    <p className="text-sm text-muted-foreground">{aiRecs.summary}</p>
                  </div>
                  <div className="space-y-3">
                    {aiRecs.recommendations.map((rec: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-lg border">
                        <div className="shrink-0 mt-0.5">
                          {rec.priority === 'high' ? <AlertTriangle className="h-5 w-5 text-red-500" /> :
                           rec.priority === 'medium' ? <Lightbulb className="h-5 w-5 text-[#ffcb00]" /> :
                           <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm">{rec.campaignName}</span>
                            <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'} className="text-xs">{rec.priority}</Badge>
                            {rec.canAutomate && (
                              <Badge className="text-xs bg-green-500/10 text-green-600 border border-green-500/20">
                                <Zap className="h-3 w-3 mr-1" /> Auto-actionable
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{rec.recommendation}</p>
                          <p className="text-xs text-muted-foreground mt-1">Expected: {rec.expectedImpact}</p>
                          {rec.canAutomate && <p className="text-xs text-green-600 mt-1">{rec.automationReason}</p>}
                        </div>
                        {rec.canAutomate && (
                          <Button size="sm" variant="outline" className="shrink-0 text-xs h-8 border-green-500/30 text-green-600 hover:bg-green-500/10"
                            onClick={() => toast({ title: 'Action Queued', description: `"${rec.campaignName}" optimization queued for review in AI Actions.` })}>
                            <Zap className="h-3 w-3 mr-1" /> Apply
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
