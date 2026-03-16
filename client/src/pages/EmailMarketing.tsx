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
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-[#F2DD48]" />
        </div>
    );
  }

  if (hasError) {
    return (
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
                <ul className="list-disc list-inside space-y-1 text-[#6F6F6B]">
                  <li>Encharge API key is missing or invalid</li>
                  <li>Encharge API rate limit exceeded</li>
                  <li>Network connectivity issues</li>
                </ul>
                <p className="mt-4 text-[#6F6F6B]">
                  Error details: {metricsError?.message || segmentsError?.message || peopleError?.message}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
    );
  }

  return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#222222]">
            Email <span className="text-[#F2DD48]">Marketing</span>
          </h1>
          <p className="text-[#6F6F6B] mt-2 text-lg">
            Subscriber growth and email campaign performance powered by Encharge
          </p>
        </div>

        {/* Metrics Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6F6F6B]">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-[#6F6F6B]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#222222]">{metrics?.totalSubscribers || 0}</div>
              <p className="text-xs text-[#6F6F6B] mt-1">
                Active email subscribers
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6F6F6B]">Recent Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#6F6F6B]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#222222]">{metrics?.recentSubscribers || 0}</div>
              <p className="text-xs text-[#6F6F6B] mt-1">
                New subscribers (last 30 days)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6F6F6B]">Segments</CardTitle>
              <Tag className="h-4 w-4 text-[#6F6F6B]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#222222]">{metrics?.segments || 0}</div>
              <p className="text-xs text-[#6F6F6B] mt-1">
                Active audience segments
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6F6F6B]">Growth Rate</CardTitle>
              <Mail className="h-4 w-4 text-[#6F6F6B]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#222222]">
                {metrics?.totalSubscribers && metrics?.recentSubscribers
                  ? `${((metrics.recentSubscribers / metrics.totalSubscribers) * 100).toFixed(1)}%`
                  : "0%"}
              </div>
              <p className="text-xs text-[#6F6F6B] mt-1">
                Monthly growth rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Segments */}
        <Card className="bg-white border-[#DEDEDA]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#222222]">Audience Segments</CardTitle>
            <CardDescription>Targeted subscriber groups for personalized campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            {segments && segments.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {segments.map((segment: any) => (
                  <div
                    key={segment.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#DEDEDA] bg-[#F6F6F4]"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-[#F2DD48]" />
                      <span className="font-medium text-[#222222]">{segment.name}</span>
                    </div>
                    <Badge variant="secondary">
                      {segment.peopleCount} members
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#6F6F6B] text-center py-8">No segments found</p>
            )}
          </CardContent>
        </Card>

        {/* Subscriber Note */}
        <Card className="bg-white border-[#DEDEDA]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#222222]">Subscriber Management</CardTitle>
            <CardDescription>Manage your email subscribers through Encharge segments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-[#6F6F6B]">
                Total subscribers are calculated from your active segments. To view individual subscriber details,
                please visit your <a href="https://app.encharge.io/people" target="_blank" rel="noopener noreferrer" className="text-[#F2DD48] hover:underline">Encharge dashboard</a>.
              </p>
              <div className="flex items-center gap-2 p-4 rounded-lg bg-[#F6F6F4] border border-[#DEDEDA]">
                <Mail className="h-5 w-5 text-[#F2DD48]" />
                <div>
                  <div className="font-medium text-[#222222]">Encharge Integration Active</div>
                  <div className="text-sm text-[#6F6F6B]">Syncing {metrics?.totalSubscribers || 0} subscribers across {metrics?.segments || 0} segments</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
