import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Users, Eye, MousePointerClick, Target } from 'lucide-react';
import { Link } from 'wouter';

export default function InstagramAnalytics() {
  const { toast } = useToast();
  const { data: insights, isLoading } = trpc.instagram.getInsights.useQuery({ days: 30 });
  const { data: recommendations } = trpc.instagram.getRecommendations.useQuery({ status: 'pending' });
  
  const generateMutation = trpc.instagram.generateRecommendations.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'AI recommendations generated!' });
      window.location.reload();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
  
  const implementMutation = trpc.instagram.implementRecommendation.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Recommendation marked as implemented!' });
      window.location.reload();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Instagram Analytics</h1>
          <p className="text-muted-foreground">
            Track your Instagram Business performance over time
          </p>
        </div>

        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold mb-2">No Data Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start tracking your Instagram performance by syncing your first insights data.
            </p>
            <Link href="/instagram-sync">
              <Button size="lg">
                Sync Instagram Data
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate metrics
  const latest = insights[0];
  const previous = insights[insights.length > 1 ? 1 : 0];
  
  const followerGrowth = latest.followersCount - previous.followersCount;
  const followerGrowthPercent = previous.followersCount > 0 
    ? ((followerGrowth / previous.followersCount) * 100).toFixed(1)
    : 0;

  const avgEngagementRate = insights.reduce((sum, item) => 
    sum + (parseFloat(item.engagementRate?.toString() || '0')), 0) / insights.length;

  const totalReach = insights.reduce((sum, item) => sum + (item.reach || 0), 0);
  const totalImpressions = insights.reduce((sum, item) => sum + (item.impressions || 0), 0);

  // Prepare chart data
  const chartData = [...insights].reverse().map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    followers: item.followersCount,
    reach: item.reach || 0,
    impressions: item.impressions || 0,
    profileViews: item.profileViews || 0,
    engagement: parseFloat(item.engagementRate?.toString() || '0'),
  }));

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Instagram Analytics</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date(latest.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Link href="/instagram-sync">
          <Button>
            Sync New Data
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">Followers</div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold mb-1">{latest.followersCount.toLocaleString()}</div>
          <div className={`flex items-center text-sm ${followerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {followerGrowth >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {followerGrowth >= 0 ? '+' : ''}{followerGrowth} ({followerGrowthPercent}%) from last sync
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">Avg Engagement Rate</div>
            <Target className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold mb-1">{avgEngagementRate.toFixed(2)}%</div>
          <div className="text-sm text-muted-foreground">
            {avgEngagementRate > 3 ? '🎯 Excellent' : avgEngagementRate > 1 ? '✅ Good' : '⚠️ Needs improvement'}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">Total Reach</div>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold mb-1">{totalReach.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">
            Last {insights.length} days
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">Profile Views</div>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold mb-1">{(latest.profileViews || 0).toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">
            Last 7 days
          </div>
        </Card>
      </div>

      {/* Follower Growth Chart */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Follower Growth</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="followers" 
              stroke="#E1306C" 
              strokeWidth={2}
              dot={{ fill: '#E1306C' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Reach & Impressions Chart */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Reach & Impressions</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="reach" 
              stroke="#4F46E5" 
              strokeWidth={2}
              name="Reach"
            />
            <Line 
              type="monotone" 
              dataKey="impressions" 
              stroke="var(--color-brand-green)" 
              strokeWidth={2}
              name="Impressions"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Engagement Rate Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Engagement Rate (%)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="engagement" 
              stroke="#F59E0B" 
              strokeWidth={2}
              name="Engagement Rate"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">📊 Engagement Benchmarks</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• <strong>Excellent:</strong> &gt;3% (Your content is highly engaging!)</li>
            <li>• <strong>Good:</strong> 1-3% (Industry average)</li>
            <li>• <strong>Needs Improvement:</strong> &lt;1% (Focus on content quality and timing)</li>
          </ul>
        </div>
      </Card>

      {/* AI Content Recommendations */}
      <Card className="p-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🤖 AI Content Recommendations</h2>
          <Button 
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate New Recommendations'}
          </Button>
        </div>

        {recommendations && recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox 
                        checked={rec.status === 'implemented'}
                        onCheckedChange={() => implementMutation.mutate({ id: rec.id })}
                      />
                      <h3 className="font-semibold">{rec.title}</h3>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline">{rec.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                    <div className="bg-muted p-3 rounded text-sm mb-2">
                      <strong>Content Idea:</strong> {rec.contentIdea}
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span><strong>Expected Impact:</strong> {rec.expectedImpact}</span>
                      <span><strong>Confidence:</strong> {rec.confidence}%</span>
                    </div>
                    <details className="mt-2">
                      <summary className="text-sm text-muted-foreground cursor-pointer">View reasoning</summary>
                      <p className="text-sm text-muted-foreground mt-2">{rec.reasoning}</p>
                    </details>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recommendations yet. Click "Generate New Recommendations" to get AI-powered content ideas based on your performance data.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
