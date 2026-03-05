import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Eye, MousePointerClick, Target, Sparkles, AlertTriangle, CheckCircle, TrendingUp as ScaleIcon, Lightbulb } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function MetaAdsCampaignDetail() {
  const params = useParams();
  const campaignId = params.id as string;
  const [days, setDays] = useState(30);

  const datePresetMap: Record<number, string> = { 7: 'last_7d', 14: 'last_14d', 30: 'last_30d', 90: 'last_90d' };
  const { data: dailyInsights, isLoading: insightsLoading } = trpc.metaAds.getCampaignDailyInsights.useQuery({ 
    campaignId,
    datePreset: datePresetMap[days] ?? 'last_30d',
  });
  
  const { data: creatives, isLoading: creativesLoading } = trpc.metaAds.getCampaignCreatives.useQuery({ 
    campaignId 
  });
  
  const { data: audience, isLoading: audienceLoading } = trpc.metaAds.getCampaignAudience.useQuery({ 
    campaignId,
    datePreset: "last_30d"
  });

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

  // Calculate summary metrics from daily insights
  const summaryMetrics = dailyInsights ? {
    totalSpend: dailyInsights.reduce((sum, day) => sum + parseFloat(day.spend || "0"), 0),
    totalImpressions: dailyInsights.reduce((sum, day) => sum + parseFloat(day.impressions || "0"), 0),
    totalClicks: dailyInsights.reduce((sum, day) => sum + parseFloat(day.clicks || "0"), 0),
    avgCTR: dailyInsights.length > 0 
      ? dailyInsights.reduce((sum, day) => sum + parseFloat(day.ctr || "0"), 0) / dailyInsights.length 
      : 0,
    avgCPC: dailyInsights.length > 0 
      ? dailyInsights.reduce((sum, day) => sum + parseFloat(day.cpc || "0"), 0) / dailyInsights.length 
      : 0,
  } : null;

  // Prepare chart data
  const chartData = dailyInsights?.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    spend: parseFloat(day.spend || "0"),
    impressions: parseFloat(day.impressions || "0"),
    clicks: parseFloat(day.clicks || "0"),
    ctr: parseFloat(day.ctr || "0"),
  })) || [];

  const campaignName = (dailyInsights?.[0] as any)?.campaign_name || "Campaign";
  const { toast } = useToast();

  const [aiInsight, setAiInsight] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const generateInsights = trpc.metaAds.generateCampaignInsights.useMutation({
    onSuccess: (data) => { setAiInsight(String(data.insights || "No insights generated.")); setAiLoading(false); },
    onError: () => { toast({ title: "Error", description: "Unable to generate insights.", variant: "destructive" }); setAiLoading(false); },
  });

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/meta-ads">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Meta Ads
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{campaignName}</h1>
            <p className="text-muted-foreground">Detailed performance analysis and insights</p>
          </div>
        </div>

        {/* Summary Metrics */}
        {insightsLoading ? (
          <div className="grid gap-4 md:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : summaryMetrics ? (
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalSpend)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(summaryMetrics.totalImpressions)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(summaryMetrics.totalClicks)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg CTR</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(summaryMetrics.avgCTR)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg CPC</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.avgCPC)}</div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* AI Optimization Panel */}
        <Card className="border-l-4 border-l-[#F5C72C]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#F5C72C]" />
                AI Optimization Analysis
              </CardTitle>
              <CardDescription>AI-powered recommendations based on your campaign performance data</CardDescription>
            </div>
            <Button
              onClick={() => { setAiLoading(true); generateInsights.mutate({ campaignId, datePreset: "last_30d" }); }}
              disabled={aiLoading}
              className="bg-[#F5C72C] text-[#111111] hover:bg-[#e6b820] font-semibold"
            >
              {aiLoading ? (
                <><span className="animate-spin mr-2">⟳</span> Analyzing...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate Analysis</>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {aiInsight ? (
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
                {aiInsight}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Click "Generate Analysis" to get AI-powered optimization recommendations</p>
                <p className="text-sm mt-1">Analyzes CTR, CPM, frequency, audience saturation, and creative performance vs. industry benchmarks</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historical Trends */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Spend Over Time</CardTitle>
              <CardDescription>Daily ad spend for the last {days} days</CardDescription>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="spend" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impressions & Clicks</CardTitle>
              <CardDescription>Daily performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="impressions" fill="#8884d8" name="Impressions" />
                    <Bar yAxisId="right" dataKey="clicks" fill="#82ca9d" name="Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ad Creatives */}
        <Card>
          <CardHeader>
            <CardTitle>Ad Creatives</CardTitle>
            <CardDescription>Visual assets and ad copy for this campaign</CardDescription>
          </CardHeader>
          <CardContent>
            {creativesLoading ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : creatives && creatives.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {creatives.map((creative: any) => (
                  <div key={creative.id} className="border rounded-lg p-4">
                    {creative.creative?.imageUrl && (
                      <img 
                        src={creative.creative.imageUrl} 
                        alt={creative.name}
                        className="w-full h-48 object-cover rounded-md mb-2"
                      />
                    )}
                    <h4 className="font-medium">{creative.name}</h4>
                    <Badge variant={creative.status === "ACTIVE" ? "default" : "secondary"}>
                      {creative.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No creatives available for this campaign</p>
            )}
          </CardContent>
        </Card>

        {/* Audience Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Audience Demographics</CardTitle>
            <CardDescription>Age and gender breakdown of your audience</CardDescription>
          </CardHeader>
          <CardContent>
            {audienceLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : audience && audience.length > 0 ? (
              <div className="space-y-4">
                {audience.map((demo: any, index: number) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{demo.age}</Badge>
                      <Badge variant="secondary">{demo.gender}</Badge>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Impressions:</span> {formatNumber(demo.impressions)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Clicks:</span> {formatNumber(demo.clicks)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Spend:</span> {formatCurrency(demo.spend)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No audience data available for this campaign</p>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
