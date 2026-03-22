import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Eye, MousePointerClick, Target,
  Sparkles, BarChart3, Calendar, RefreshCw, Copy, CheckCircle2,
  AlertTriangle, Loader2, Plus, Send, Trash2, Clock, Play, Layers, Image,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Daily Analysis Tab ───────────────────────────────────────────────────────

function DailyAnalysisTab() {
  const { toast } = useToast();
  const [copiedCaption, setCopiedCaption] = useState(false);

  const { data: analysis, isLoading, error, refetch, isFetching } =
    trpc.instagram.getDailyAnalysis.useQuery(undefined, {
      staleTime: 1000 * 60 * 30,
      retry: 1,
    });

  const handleCopyCaption = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCaption(true);
      toast({ title: 'Copied!', description: 'Caption copied to clipboard.' });
      setTimeout(() => setCopiedCaption(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#F2DD48]" />
        <p className="text-sm text-muted-foreground">Analyzing your recent posts with AI…</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertTriangle className="h-8 w-8 text-[#E8453C]" />
        <p className="text-sm text-muted-foreground">Could not load daily analysis.</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  const engagementNum = parseFloat(analysis.metrics.avgEngagement);
  const engagementColor = engagementNum >= 3 ? 'text-[#72B84A]' : engagementNum >= 1 ? 'text-[#F2DD48]' : 'text-[#E8453C]';
  const engagementLabel = engagementNum >= 3 ? 'Excellent' : engagementNum >= 1 ? 'Good' : 'Needs Work';
  const followerGoal = 500;
  const followerPct = Math.min(100, Math.round((analysis.metrics.followers / followerGoal) * 100));
  // Map server response fields
  const todayCaption = analysis.analysis?.todayPostIdea?.captionDraft ?? '';
  const bestPostingTime = analysis.analysis?.todayPostIdea?.bestTime ?? '';
  const insights: string[] = [
    analysis.analysis?.keyInsight,
    analysis.analysis?.followerProgress,
    analysis.analysis?.engagementScore,
  ].filter(Boolean) as string[];
  const quickWin: string = analysis.analysis?.quickWin ?? '';
  const topPosts: any[] = analysis.metrics.topPosts ?? [];
  const postsAnalyzed = analysis.metrics.totalPosts ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#F2DD48]" />
            Daily AI Analysis
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Based on your last {postsAnalyzed} posts · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-[#DEDEDA] text-[#555]"
        >
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-1.5 hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Followers</p>
            <p className="text-2xl font-bold text-foreground">{(analysis.metrics.followers ?? 0).toLocaleString()}</p>
            <div className="mt-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>Goal: {followerGoal}</span>
                <span>{followerPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-[#F2DD48] rounded-full transition-all" style={{ width: `${followerPct}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Engagement</p>
            <p className={`text-2xl font-bold ${engagementColor}`}>{analysis.metrics.avgEngagement}%</p>
            <p className={`text-xs mt-1 ${engagementColor}`}>{engagementLabel}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Posts</p>
            <p className="text-2xl font-bold text-foreground">{analysis.metrics.totalPosts}</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Likes</p>
            <p className="text-2xl font-bold text-foreground">{analysis.metrics.avgLikes}</p>
            <p className="text-xs text-muted-foreground mt-1">per post</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Post Idea */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#F2DD48]" />
            Today's Post Idea
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="bg-[#FFFBEA] border border-[#F2DD48]/30 rounded-lg p-3">
            <p className="text-sm text-[#222222] leading-relaxed whitespace-pre-wrap">{todayCaption}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopyCaption(todayCaption)}
              className="border-[#DEDEDA] text-[#555] hover:text-[#111]"
            >
              {copiedCaption ? <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-[#72B84A]" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copiedCaption ? 'Copied!' : 'Copy Caption'}
            </Button>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Best time: {bestPostingTime}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Insights + Quick Win */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#F2DD48]" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ul className="space-y-2">
              {insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#F2DD48] flex-shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#72B84A]" />
              Quick Win (15 min)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm text-foreground leading-relaxed">{quickWin}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts */}
      {topPosts && topPosts.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#F2DD48]" />
              Top Performing Posts
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {topPosts.slice(0, 3).map((post: any) => (
                <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  {post.thumbnail_url && (
                    <img src={post.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground line-clamp-2">{post.caption || '(No caption)'}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>❤️ {post.like_count ?? 0}</span>
                      <span>💬 {post.comments_count ?? 0}</span>
                      <span>{timeAgo(post.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Scheduler Tab ────────────────────────────────────────────────────────────

function SchedulerForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    caption: '', hashtags: '', imageUrl: '', contentType: 'feed_post' as const,
    scheduledFor: '', topic: '', tone: 'casual' as const,
  });

  const scheduleMutation = trpc.instagram.schedulePost.useMutation({
    onSuccess: () => {
      toast({ title: 'Scheduled!', description: 'Post added to your queue.' });
      utils.instagram.getScheduledPosts.invalidate();
      onClose();
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const generateMutation = trpc.instagram.generateCaption.useMutation({
    onSuccess: (data) => {
      setForm((f) => ({ ...f, caption: data.caption, hashtags: data.hashtags }));
      toast({ title: 'Caption generated!', description: 'Review and edit before scheduling.' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Topic</Label>
          <Input
            value={form.topic}
            onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            placeholder="e.g. Sunday Clinic"
            className="mt-1 border-[#DEDEDA]"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Tone</Label>
          <Select value={form.tone} onValueChange={(v) => setForm((f) => ({ ...f, tone: v as any }))}>
            <SelectTrigger className="mt-1 border-[#DEDEDA]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="exciting">Exciting</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => generateMutation.mutate({ topic: form.topic || 'golf', tone: form.tone })}
        disabled={generateMutation.isPending}
        className="w-full border-[#F2DD48]/50 text-[#111] hover:bg-[#FFFBEA]"
      >
        {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Sparkles className="h-4 w-4 mr-1.5 text-[#F2DD48]" />}
        Generate Caption with AI
      </Button>
      <div>
        <Label className="text-xs text-muted-foreground">Caption</Label>
        <Textarea
          value={form.caption}
          onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
          placeholder="Write your caption…"
          rows={4}
          className="mt-1 border-[#DEDEDA] resize-none"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Hashtags</Label>
        <Input
          value={form.hashtags}
          onChange={(e) => setForm((f) => ({ ...f, hashtags: e.target.value }))}
          placeholder="#golf #golfvx #arlingtonheights"
          className="mt-1 border-[#DEDEDA]"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Image URL (optional)</Label>
        <Input
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          placeholder="https://…"
          className="mt-1 border-[#DEDEDA]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Content Type</Label>
          <Select value={form.contentType} onValueChange={(v) => setForm((f) => ({ ...f, contentType: v as any }))}>
            <SelectTrigger className="mt-1 border-[#DEDEDA]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="feed_post">Feed Post</SelectItem>
              <SelectItem value="story">Story</SelectItem>
              <SelectItem value="reel">Reel</SelectItem>
              <SelectItem value="carousel">Carousel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Schedule For</Label>
          <Input
            type="datetime-local"
            value={form.scheduledFor}
            onChange={(e) => setForm((f) => ({ ...f, scheduledFor: e.target.value }))}
            className="mt-1 border-[#DEDEDA]"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          className="flex-1 bg-[#F2DD48] text-black hover:bg-[#F2DD48]/90"
          onClick={() => scheduleMutation.mutate({
            caption: form.caption,
            hashtags: form.hashtags,
            imageUrl: form.imageUrl || undefined,
            contentType: form.contentType,
            scheduledFor: form.scheduledFor || '',
          })}
          disabled={scheduleMutation.isPending || !form.caption}
        >
          {scheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Calendar className="h-4 w-4 mr-1.5" />}
          Schedule Post
        </Button>
        <Button variant="outline" onClick={onClose} className="border-[#DEDEDA]">Cancel</Button>
      </div>
    </div>
  );
}

function ScheduledPostRow({ post, onRefresh }: { post: any; onRefresh: () => void }) {
  const { toast } = useToast();
  const isOverdue = post.scheduledFor && new Date(post.scheduledFor) < new Date() && post.status === 'scheduled';

  const deleteMutation = trpc.instagram.deleteScheduledPost.useMutation({
    onSuccess: () => { toast({ title: 'Deleted' }); onRefresh(); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const publishMutation = trpc.instagram.publishScheduledPost.useMutation({
    onSuccess: () => { toast({ title: 'Published!' }); onRefresh(); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border hover:border-[#F2DD48]/40 transition-colors">
      {post.imageUrl ? (
        <img src={post.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-border" />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Image className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground line-clamp-2">{post.caption}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px] border-[#DEDEDA] text-[#888]">{post.contentType}</Badge>
          {post.status === 'posted' ? (
            <Badge className="text-[10px] bg-[#F0FAF3] text-[#72B84A] border-[#72B84A]/30">Posted</Badge>
          ) : (
            <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-[#E8453C]' : 'text-[#888]'}`}>
              <Clock className="h-3 w-3" />
              {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString() : 'Unscheduled'}
              {isOverdue && ' (overdue)'}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {post.status === 'scheduled' && (
          <Button
            size="sm"
            variant="outline"
            disabled={publishMutation.isPending}
            onClick={() => publishMutation.mutate({ id: post.id })}
            className="h-7 px-2 text-xs border-[#F2DD48]/40 text-[#F2DD48] hover:bg-[#FFFBEA]"
          >
            {publishMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={deleteMutation.isPending}
          onClick={() => deleteMutation.mutate({ id: post.id })}
          className="h-7 px-2 text-xs text-[#E8453C] hover:text-[#E8453C] hover:bg-[#E8453C]/10"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function SchedulerTab() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const { data: scheduledPosts, refetch: refetchScheduled } =
    trpc.instagram.getScheduledPosts.useQuery({ includePosted: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#F2DD48]" />
            Content Scheduler
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {scheduledPosts?.length ?? 0} post{(scheduledPosts?.length ?? 0) !== 1 ? 's' : ''} in queue
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setScheduleOpen(true)}
          className="bg-[#F2DD48] text-black hover:bg-[#F2DD48]/90"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Schedule Post
        </Button>
      </div>

      {scheduledPosts && scheduledPosts.length > 0 ? (
        <div className="space-y-3">
          {scheduledPosts.map((post) => (
            <ScheduledPostRow key={post.id} post={post} onRefresh={refetchScheduled} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 text-[#DEDEDA]" />
          <p className="font-medium text-foreground">No scheduled posts yet</p>
          <p className="text-sm mt-1 mb-4">Plan your content in advance to stay consistent.</p>
          <Button
            size="sm"
            onClick={() => setScheduleOpen(true)}
            className="bg-[#F2DD48] text-black hover:bg-[#F2DD48]/90"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Schedule First Post
          </Button>
        </div>
      )}

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#F2DD48]" />
              Schedule Instagram Post
            </DialogTitle>
          </DialogHeader>
          <SchedulerForm onClose={() => setScheduleOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab() {
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
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#F2DD48]" />
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="h-10 w-10 mx-auto mb-3 text-[#DEDEDA]" />
        <p className="font-medium text-foreground">No Analytics Data Yet</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Sync your Instagram insights to see performance trends.</p>
      </div>
    );
  }

  const latest = insights[0];
  const previous = insights[insights.length > 1 ? 1 : 0];
  const followerGrowth = latest.followersCount - previous.followersCount;
  const followerGrowthPercent = previous.followersCount > 0
    ? ((followerGrowth / previous.followersCount) * 100).toFixed(1)
    : 0;
  const avgEngagementRate = insights.reduce((sum, item) =>
    sum + (parseFloat(item.engagementRate?.toString() || '0')), 0) / insights.length;
  const totalReach = insights.reduce((sum, item) => sum + (item.reach || 0), 0);

  const chartData = [...insights].reverse().map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    followers: item.followersCount,
    reach: item.reach || 0,
    impressions: item.impressions || 0,
    engagement: parseFloat(item.engagementRate?.toString() || '0'),
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Followers</div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">{latest.followersCount.toLocaleString()}</div>
          <div className={`flex items-center text-xs mt-1 ${followerGrowth >= 0 ? 'text-[#72B84A]' : 'text-[#E8453C]'}`}>
            {followerGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {followerGrowth >= 0 ? '+' : ''}{followerGrowth} ({followerGrowthPercent}%)
          </div>
        </Card>
        <Card className="p-5 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Avg Engagement</div>
            <Target className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">{avgEngagementRate.toFixed(2)}%</div>
          <div className="text-xs text-muted-foreground mt-1">
            {avgEngagementRate > 3 ? 'Excellent' : avgEngagementRate > 1 ? 'Good' : 'Needs improvement'}
          </div>
        </Card>
        <Card className="p-5 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Total Reach</div>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">{totalReach.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">Last {insights.length} days</div>
        </Card>
        <Card className="p-5 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Profile Views</div>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">{(latest.profileViews || 0).toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">Last 7 days</div>
        </Card>
      </div>

      {/* Follower Growth Chart */}
      <Card className="p-5 bg-card border-border">
        <h3 className="text-sm font-semibold text-foreground mb-4">Follower Growth</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DEDEDA" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} />
            <Tooltip />
            <Line type="monotone" dataKey="followers" stroke="#F2DD48" strokeWidth={2} dot={{ fill: '#F2DD48' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Engagement Chart */}
      <Card className="p-5 bg-card border-border">
        <h3 className="text-sm font-semibold text-foreground mb-4">Engagement Rate (%)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DEDEDA" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} />
            <Tooltip />
            <Line type="monotone" dataKey="engagement" stroke="#222222" strokeWidth={2} name="Engagement Rate" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 p-3 bg-[#F1F1EF] rounded-lg text-xs text-[#555] space-y-1">
          <p><strong className="text-[#111]">Excellent:</strong> &gt;3% — Highly engaging content</p>
          <p><strong className="text-[#111]">Good:</strong> 1–3% — Industry average</p>
          <p><strong className="text-[#111]">Needs Improvement:</strong> &lt;1% — Focus on content quality and timing</p>
        </div>
      </Card>

      {/* AI Recommendations */}
      <Card className="p-5 bg-card border-border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#F2DD48]" />
            AI Content Recommendations
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="border-[#DEDEDA] text-[#555]"
          >
            {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Sparkles className="h-4 w-4 mr-1.5 text-[#F2DD48]" />}
            Generate
          </Button>
        </div>
        {recommendations && recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border border-[#DEDEDA] rounded-lg p-4 hover:border-[#F2DD48]/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h4 className="font-medium text-sm text-foreground">{rec.title}</h4>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'} className="text-[10px]">
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-[#DEDEDA] text-[#888]">{rec.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                    <div className="bg-[#FFFBEA] border border-[#F2DD48]/20 p-2.5 rounded text-xs text-[#111] mb-2">
                      <strong>Content Idea:</strong> {rec.contentIdea}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span><strong>Impact:</strong> {rec.expectedImpact}</span>
                      <span><strong>Confidence:</strong> {rec.confidence}%</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => implementMutation.mutate({ id: rec.id })}
                    disabled={rec.status === 'implemented'}
                    className="flex-shrink-0 border-[#DEDEDA] text-[#555] text-xs"
                  >
                    {rec.status === 'implemented' ? <CheckCircle2 className="h-3.5 w-3.5 text-[#72B84A]" /> : 'Done'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Click "Generate" to get AI-powered content ideas based on your performance data.
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InstagramAnalytics() {
  const { data: tokenStatus } = trpc.instagram.checkTokenExpiry.useQuery(undefined, {
    retry: 1,
    staleTime: 1000 * 60 * 60,
  });
  const tokenInvalid = tokenStatus !== undefined && !tokenStatus.valid;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-[#F2DD48]" />
          Instagram Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          @golfvxarlingtonheights · AI daily analysis, performance trends &amp; content scheduler
        </p>
      </div>

      {/* Token expired — setup banner */}
      {tokenInvalid && (
        <div className="rounded-xl border border-[#E8453C]/30 bg-[#E8453C]/5 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[#E8453C] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#E8453C]">Instagram Access Token Expired</p>
              <p className="text-[13px] text-[#888888] mt-1">
                Analytics and AI analysis require a valid Instagram access token. Renew your token to restore these features.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#DEDEDA] p-4 text-[13px] space-y-2">
            <p className="font-semibold text-[#222222]">To renew:</p>
            <ol className="space-y-1.5 text-[#555555] list-decimal list-inside">
              <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-[#007AFF] underline">Meta Graph API Explorer</a></li>
              <li>Generate a User Access Token with Instagram permissions</li>
              <li>Exchange for a long-lived token and update <code className="bg-[#F1F1EF] px-1 rounded text-[11px]">INSTAGRAM_ACCESS_TOKEN</code> in your environment</li>
            </ol>
          </div>
        </div>
      )}

      {/* Tabs — show Scheduler always, hide data tabs when token invalid */}
      <Tabs defaultValue={tokenInvalid ? "scheduler" : "daily"} className="space-y-4">
        <TabsList className="bg-[#F1F1EF] border border-[#DEDEDA]">
          <TabsTrigger
            value="daily"
            className="data-[state=active]:bg-[#F2DD48] data-[state=active]:text-black data-[state=active]:shadow-none"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Daily Analysis
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-[#F2DD48] data-[state=active]:text-black data-[state=active]:shadow-none"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="scheduler"
            className="data-[state=active]:bg-[#F2DD48] data-[state=active]:text-black data-[state=active]:shadow-none"
          >
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Scheduler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DailyAnalysisTab />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
        <TabsContent value="scheduler">
          <SchedulerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
