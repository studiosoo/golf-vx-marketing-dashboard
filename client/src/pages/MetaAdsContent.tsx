import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Eye, MousePointerClick, Target, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type DatePreset = "today" | "yesterday" | "last_7d" | "last_14d" | "last_30d" | "last_90d" | "lifetime";

export default function MetaAdsContent() {
  const [datePreset, setDatePreset] = useState<DatePreset>("last_30d");

  const { data: accountData, isLoading: accountLoading } = trpc.metaAds.getAccount.useQuery();
  const { data: insightsData, isLoading: insightsLoading } = trpc.metaAds.getAccountInsights.useQuery({ datePreset });
  const { data: campaignsData, isLoading: campaignsLoading } = trpc.metaAds.getAllCampaignsWithInsights.useQuery({ datePreset });

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
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      ACTIVE: { label: "Active", variant: "default" },
      PAUSED: { label: "Paused", variant: "secondary" },
      ARCHIVED: { label: "Archived", variant: "outline" },
      DELETED: { label: "Deleted", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meta Ads Performance</h2>
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
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-4 w-full" /></CardContent>
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
                <CardContent><Skeleton className="h-8 w-32" /></CardContent>
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
                <p className="text-xs text-muted-foreground mt-1">CPM: {formatCurrency(insightsData.cpm)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(insightsData.clicks)}</div>
                <p className="text-xs text-muted-foreground mt-1">CPC: {formatCurrency(insightsData.cpc)}</p>
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
              {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-16 w-full" />))}
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
                  {campaignsData.map((campaign: any) => (
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
                <BarChart data={campaignsData.filter((c: any) => c.insights)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} angle={-45} textAnchor="end" height={100} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} formatter={(value: number) => formatCurrency(value)} />
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
                <BarChart data={campaignsData.filter((c: any) => c.insights)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} angle={-45} textAnchor="end" height={100} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} formatter={(value: number, name: string) => name === "CTR" ? formatPercentage(value) : formatNumber(value)} />
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
  );
}
