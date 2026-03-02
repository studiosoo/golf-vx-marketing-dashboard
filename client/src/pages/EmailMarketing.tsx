import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Mail, Users, TrendingUp, Loader2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EmailMarketing() {
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = trpc.encharge.getMetrics.useQuery(undefined, {
    retry: false,
  });
  const { data: segments, isLoading: segmentsLoading, error: segmentsError } = trpc.encharge.getSegments.useQuery(undefined, {
    retry: false,
  });
  const { data: people, isLoading: peopleLoading, error: peopleError } = trpc.encharge.getPeople.useQuery({ limit: 50 }, {
    retry: false,
  });

  const isLoading = metricsLoading || segmentsLoading || peopleLoading;
  const hasError = metricsError || segmentsError || peopleError;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (hasError) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Email Marketing Data Unavailable</CardTitle>
              <CardDescription>
                Unable to fetch data from Encharge. This may be due to API connection issues or missing credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Possible causes:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Encharge API key is missing or invalid</li>
                  <li>Encharge API rate limit exceeded</li>
                  <li>Network connectivity issues</li>
                </ul>
                <p className="mt-4 text-muted-foreground">
                  Error details: {metricsError?.message || segmentsError?.message || peopleError?.message}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Email <span className="text-primary">Marketing</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Subscriber growth and email campaign performance powered by Encharge
          </p>
        </div>

        {/* Metrics Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metrics?.totalSubscribers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active email subscribers
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metrics?.recentSubscribers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                New subscribers (last 30 days)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Segments</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metrics?.segments || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active audience segments
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Growth Rate</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {metrics?.totalSubscribers && metrics?.recentSubscribers
                  ? `${((metrics.recentSubscribers / metrics.totalSubscribers) * 100).toFixed(1)}%`
                  : "0%"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Monthly growth rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Segments */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">Audience Segments</CardTitle>
            <CardDescription>Targeted subscriber groups for personalized campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            {segments && segments.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {segments.map((segment: any) => (
                  <div
                    key={segment.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{segment.name}</span>
                    </div>
                    <Badge variant="secondary">
                      {segment.peopleCount} members
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No segments found</p>
            )}
          </CardContent>
        </Card>

        {/* Subscriber Note */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">Subscriber Management</CardTitle>
            <CardDescription>Manage your email subscribers through Encharge segments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Total subscribers are calculated from your active segments. To view individual subscriber details,
                please visit your <a href="https://app.encharge.io/people" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Encharge dashboard</a>.
              </p>
              <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/30 border border-border">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium text-foreground">Encharge Integration Active</div>
                  <div className="text-sm text-muted-foreground">Syncing {metrics?.totalSubscribers || 0} subscribers across {metrics?.segments || 0} segments</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
