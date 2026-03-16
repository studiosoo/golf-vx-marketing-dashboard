import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Instagram,
  Heart,
  MessageCircle,
  RefreshCw,
  Users,
  Image,
  Calendar,
  Plus,
  Trash2,
  Send,
  Sparkles,
  AlertCircle,
  Clock,
  Play,
  Layers,
  TrendingUp,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Copy,
} from "lucide-react";
import { BRAND_ASSETS } from "@/lib/brandAssets";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function mediaTypeIcon(type: string) {
  if (type === "VIDEO") return <Play className="h-3 w-3" />;
  if (type === "CAROUSEL_ALBUM") return <Layers className="h-3 w-3" />;
  return <Image className="h-3 w-3" />;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Token Warning Banner ─────────────────────────────────────────────────────

function TokenWarningBanner() {
  const { data: tokenStatus } = trpc.instagram.checkTokenExpiry.useQuery(undefined, {
    retry: 1,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  if (!tokenStatus || (!tokenStatus.warning && tokenStatus.valid)) return null;

  if (!tokenStatus.valid) {
    return (
      <div className="flex items-center gap-3 p-4 bg-[#FF3B30]/8 border border-[#FF3B30]/20 rounded-xl text-[#FF3B30] text-sm">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <div>
          <p className="font-semibold">Instagram Token Expired</p>
          <p className="text-xs mt-0.5 text-[#FF3B30]/70">
            Your access token is invalid. Go to{" "}
            <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline">
              Meta Graph API Explorer
            </a>{" "}
            to generate a new long-lived token.
          </p>
        </div>
      </div>
    );
  }

  if (tokenStatus.warning && tokenStatus.daysRemaining <= 14) {
    return (
      <div className="flex items-center gap-3 p-4 bg-[#F59E0B]/8 border border-[#F59E0B]/20 rounded-xl text-[#B45309] text-sm">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[#F59E0B]" />
        <div>
          <p className="font-semibold">Token Expiring Soon — {tokenStatus.daysRemaining} days remaining</p>
          <p className="text-xs mt-0.5 text-[#B45309]/80">
            Renew your Instagram access token before it expires to avoid interruption.{" "}
            {tokenStatus.expiresAt && `Expires: ${new Date(tokenStatus.expiresAt).toLocaleDateString()}`}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: any }) {
  const imgSrc = post.media_url || post.thumbnail_url;
  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block rounded-xl overflow-hidden bg-white border border-[#DEDEDA] hover:border-[#F2DD48]/50 transition-all"
    >
      <div className="relative aspect-square bg-[#F1F1EF]">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={post.caption?.slice(0, 60) || "Instagram post"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: BRAND_ASSETS.instagram.gradient }}>
              <Instagram className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/60 rounded-md px-1.5 py-0.5 flex items-center gap-1 text-[#222222] text-xs">
          {mediaTypeIcon(post.media_type)}
        </div>
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <span className="flex items-center gap-1 text-white text-sm font-semibold">
            <Heart className="h-4 w-4 fill-white" />
            {formatCount(post.like_count ?? 0)}
          </span>
          <span className="flex items-center gap-1 text-white text-sm font-semibold">
            <MessageCircle className="h-4 w-4 fill-white" />
            {formatCount(post.comments_count ?? 0)}
          </span>
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs text-[#6F6F6B] line-clamp-2 leading-relaxed">
          {post.caption || <span className="italic text-[#6F6F6B]">No caption</span>}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-[#6F6F6B]">{timeAgo(post.timestamp)}</span>
          <div className="flex items-center gap-3 text-[10px] text-[#777]">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {formatCount(post.like_count ?? 0)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {formatCount(post.comments_count ?? 0)}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

// ─── Daily Analysis Tab ───────────────────────────────────────────────────────

function DailyAnalysisTab() {
  const { toast } = useToast();
  const { data, isLoading, error, refetch, isFetching } = trpc.instagram.getDailyAnalysis.useQuery(undefined, {
    retry: 1,
    staleTime: 1000 * 60 * 30, // 30 min cache
  });

  const copyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Caption copied to clipboard." });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#DEDEDA]">
          <Sparkles className="h-5 w-5 text-[#F2DD48] animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-[#222222]">Analyzing your Instagram performance...</p>
            <p className="text-xs text-[#6F6F6B] mt-0.5">Fetching live data and generating AI insights</p>
          </div>
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-white animate-pulse border border-[#DEDEDA]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/30 rounded-xl text-[#FF3B30] text-sm">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <div>
          <p className="font-semibold">Analysis failed</p>
          <p className="text-xs mt-0.5 text-[#FF3B30]/80">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { analysis, metrics, generatedAt } = data;
  const followerGoal = 2000;
  const followerPct = Math.min(100, Math.round((metrics.followers / followerGoal) * 100));
  const engagementNum = parseFloat(metrics.avgEngagement);
  const engagementLabel = engagementNum >= 3 ? "Excellent" : engagementNum >= 1 ? "Good" : "Needs Work";
  const engagementColor = engagementNum >= 3 ? "text-[#72B84A]" : engagementNum >= 1 ? "text-[#F2DD48]" : "text-[#FF3B30]";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#F2DD48]" />
          <span className="text-xs text-[#6F6F6B]">
            Generated {new Date(generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-[#DEDEDA] text-[#6F6F6B] hover:text-[#222222] h-7 text-xs"
        >
          {isFetching ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          <span className="ml-1.5">Refresh</span>
        </Button>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-white border-[#DEDEDA]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-3.5 w-3.5 text-[#F2DD48]" />
              <span className="text-[10px] text-[#6F6F6B] uppercase tracking-wide">Followers</span>
            </div>
            <p className="text-2xl font-bold text-[#222222]">{metrics.followers.toLocaleString()}</p>
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-[#6F6F6B] mb-1">
                <span>{followerPct}% of goal</span>
                <span>{followerGoal}</span>
              </div>
              <div className="h-1 bg-[#F1F1EF] rounded-full">
                <div
                  className="h-1 bg-[#F2DD48] rounded-full transition-all"
                  style={{ width: `${followerPct}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#DEDEDA]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-3.5 w-3.5 text-[#F2DD48]" />
              <span className="text-[10px] text-[#6F6F6B] uppercase tracking-wide">Engagement</span>
            </div>
            <p className="text-2xl font-bold text-[#222222]">{metrics.avgEngagement}%</p>
            <p className={`text-xs mt-1 ${engagementColor}`}>{engagementLabel}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#DEDEDA]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-3.5 w-3.5 text-[#F2DD48]" />
              <span className="text-[10px] text-[#6F6F6B] uppercase tracking-wide">Avg Likes</span>
            </div>
            <p className="text-2xl font-bold text-[#222222]">{metrics.avgLikes}</p>
            <p className="text-xs text-[#6F6F6B] mt-1">per post</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#DEDEDA]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-3.5 w-3.5 text-[#F2DD48]" />
              <span className="text-[10px] text-[#6F6F6B] uppercase tracking-wide">Content Mix</span>
            </div>
            <div className="space-y-1 mt-1">
              {Object.entries(metrics.typeBreakdown).map(([type, count]) => (
                <div key={type} className="flex justify-between text-xs">
                  <span className="text-[#6F6F6B]">{type === "CAROUSEL_ALBUM" ? "Carousel" : type === "VIDEO" ? "Video" : "Image"}</span>
                  <span className="text-[#222222] font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Post Idea */}
      <Card className="bg-white border-[#DEDEDA]">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-[#222222] flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#F2DD48]" />
            Today's Post Idea
            <Badge variant="secondary" className="ml-auto text-[10px] font-normal">
              {analysis.todayPostIdea.contentType}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="bg-[#F1F1EF] rounded-lg p-3 relative">
            <p className="text-sm text-[#222222] leading-relaxed whitespace-pre-wrap">{analysis.todayPostIdea.captionDraft}</p>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 h-6 w-6 p-0 text-[#6F6F6B] hover:text-[#F2DD48]"
              onClick={() => copyCaption(analysis.todayPostIdea.captionDraft)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          {analysis.todayPostIdea.hashtags && (
            <div className="bg-[#F1F1EF] rounded-lg p-3 relative">
              <p className="text-xs text-[#6F6F6B] leading-relaxed">{analysis.todayPostIdea.hashtags}</p>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-6 w-6 p-0 text-[#6F6F6B] hover:text-[#F2DD48]"
                onClick={() => copyCaption(analysis.todayPostIdea.hashtags)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-[#6F6F6B]">
            <Clock className="h-3.5 w-3.5" />
            Best time to post: <span className="text-[#F2DD48] font-medium">{analysis.todayPostIdea.bestTime}</span>
          </div>
        </CardContent>
      </Card>

      {/* Insights Row */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Key Insight */}
        <Card className="bg-white border-[#DEDEDA]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-[#222222] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#F2DD48]" />
              Key Insight
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm text-[#222222] leading-relaxed">{analysis.keyInsight}</p>
          </CardContent>
        </Card>

        {/* Quick Win */}
        <Card className="bg-white border-[#DEDEDA]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-[#222222] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#72B84A]" />
              Quick Win (15 min)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm text-[#222222] leading-relaxed">{analysis.quickWin}</p>
          </CardContent>
        </Card>
      </div>

      {/* Follower Progress */}
      <Card className="bg-white border-[#DEDEDA]">
        <CardContent className="p-4 flex items-start gap-3">
          <Users className="h-4 w-4 text-[#F2DD48] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-[#F2DD48] mb-1">Follower Goal Progress</p>
            <p className="text-sm text-[#ccc] leading-relaxed">{analysis.followerProgress}</p>
          </div>
        </CardContent>
      </Card>

      {/* Top Posts */}
      {metrics.topPosts.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#6F6F6B] uppercase tracking-wide mb-3">Top Performing Posts</h3>
          <div className="space-y-2">
            {metrics.topPosts.map((post: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#DEDEDA]">
                <div className="w-6 h-6 rounded-full bg-[#F2DD48]/10 flex items-center justify-center text-[#F2DD48] text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#ccc] line-clamp-1">{post.caption}</p>
                  <p className="text-[10px] text-[#6F6F6B] mt-0.5">{post.daysAgo}d ago · {post.type}</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#777] flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />{post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />{post.comments}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Scheduler Form ───────────────────────────────────────────────────────────

function SchedulerForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    caption: "",
    hashtags: "",
    imageUrl: "",
    scheduledFor: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    contentType: "feed_post" as "feed_post" | "story" | "reel" | "carousel",
    topic: "",
    tone: "casual" as "professional" | "casual" | "exciting" | "educational",
  });

  const scheduleMutation = trpc.instagram.schedulePost.useMutation({
    onSuccess: () => {
      toast({ title: "Post scheduled!", description: "Your post has been added to the queue." });
      utils.instagram.getScheduledPosts.invalidate();
      onClose();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const captionMutation = trpc.instagram.generateCaption.useMutation({
    onSuccess: (data) => {
      setForm((f) => ({ ...f, caption: data.caption, hashtags: data.hashtags }));
      toast({ title: "Caption generated!", description: "AI caption is ready to review." });
    },
    onError: (e) => toast({ title: "AI Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.caption.trim()) {
      toast({ title: "Caption required", variant: "destructive" });
      return;
    }
    scheduleMutation.mutate({
      caption: form.caption,
      hashtags: form.hashtags,
      imageUrl: form.imageUrl || undefined,
      scheduledFor: new Date(form.scheduledFor).toISOString(),
      contentType: form.contentType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-[#F2DD48]/5 border border-[#F2DD48]/20 rounded-lg p-4">
        <p className="text-xs font-semibold text-[#F2DD48] mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          AI Caption Generator
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Topic (e.g., Summer Camp registration open)"
            value={form.topic}
            onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            className="flex-1 text-sm bg-[#F1F1EF] border-[#DEDEDA]"
          />
          <Select value={form.tone} onValueChange={(v) => setForm((f) => ({ ...f, tone: v as any }))}>
            <SelectTrigger className="w-32 text-xs bg-[#F1F1EF] border-[#DEDEDA]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="exciting">Exciting</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!form.topic || captionMutation.isPending}
            onClick={() => captionMutation.mutate({ topic: form.topic, tone: form.tone, includeHashtags: true })}
            className="border-[#F2DD48]/40 text-[#F2DD48] hover:bg-[#F2DD48]/10"
          >
            {captionMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-xs text-[#6F6F6B]">Caption *</Label>
        <Textarea
          value={form.caption}
          onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
          placeholder="Write your caption..."
          className="mt-1 text-sm bg-[#F1F1EF] border-[#DEDEDA] min-h-[100px]"
          required
        />
      </div>

      <div>
        <Label className="text-xs text-[#6F6F6B]">Hashtags</Label>
        <Input
          value={form.hashtags}
          onChange={(e) => setForm((f) => ({ ...f, hashtags: e.target.value }))}
          placeholder="#golfvx #indoorgolf #arlingtonheights"
          className="mt-1 text-sm bg-[#F1F1EF] border-[#DEDEDA]"
        />
      </div>

      <div>
        <Label className="text-xs text-[#6F6F6B]">Image URL (required to publish)</Label>
        <Input
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          placeholder="https://..."
          className="mt-1 text-sm bg-[#F1F1EF] border-[#DEDEDA]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-[#6F6F6B]">Post Type</Label>
          <Select value={form.contentType} onValueChange={(v) => setForm((f) => ({ ...f, contentType: v as any }))}>
            <SelectTrigger className="mt-1 text-sm bg-[#F1F1EF] border-[#DEDEDA]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feed_post">Feed Post</SelectItem>
              <SelectItem value="story">Story</SelectItem>
              <SelectItem value="reel">Reel</SelectItem>
              <SelectItem value="carousel">Carousel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-[#6F6F6B]">Schedule For</Label>
          <Input
            type="datetime-local"
            value={form.scheduledFor}
            onChange={(e) => setForm((f) => ({ ...f, scheduledFor: e.target.value }))}
            className="mt-1 text-sm bg-[#F1F1EF] border-[#DEDEDA]"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-[#DEDEDA]">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={scheduleMutation.isPending}
          className="flex-1 bg-[#F2DD48] text-black hover:bg-[#F2DD48]/90"
        >
          {scheduleMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
          Schedule Post
        </Button>
      </div>
    </form>
  );
}

// ─── Scheduled Post Row ───────────────────────────────────────────────────────

function ScheduledPostRow({ post, onRefresh }: { post: any; onRefresh: () => void }) {
  const { toast } = useToast();
  const deleteMutation = trpc.instagram.deleteScheduledPost.useMutation({
    onSuccess: () => { toast({ title: "Deleted" }); onRefresh(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const publishMutation = trpc.instagram.publishScheduledPost.useMutation({
    onSuccess: () => { toast({ title: "Published!", description: "Post is live on Instagram." }); onRefresh(); },
    onError: (e) => toast({ title: "Publish failed", description: e.message, variant: "destructive" }),
  });

  const isOverdue = !post.posted && new Date(post.scheduledFor) < new Date();

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#DEDEDA]">
      <div className="w-12 h-12 rounded-md bg-[#F1F1EF] border border-[#DEDEDA] flex-shrink-0 overflow-hidden">
        {post.imageUrl ? (
          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-4 w-4 text-[#444]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#222222] line-clamp-2">{post.caption}</p>
        {post.hashtags && (
          <p className="text-xs text-[#F2DD48]/70 mt-0.5 line-clamp-1">{post.hashtags}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className="text-[10px] border-[#DEDEDA] text-[#6F6F6B]">
            {post.contentType.replace("_", " ")}
          </Badge>
          <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? "text-[#FF3B30]" : "text-[#6F6F6B]"}`}>
            <Clock className="h-3 w-3" />
            {new Date(post.scheduledFor).toLocaleString("en-US", {
              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            })}
            {isOverdue && " (overdue)"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!post.posted && post.imageUrl && (
          <Button
            size="sm"
            variant="outline"
            disabled={publishMutation.isPending}
            onClick={() => publishMutation.mutate({ id: post.id })}
            className="h-7 px-2 text-xs border-[#F2DD48]/40 text-[#F2DD48] hover:bg-[#F2DD48]/10"
          >
            {publishMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={deleteMutation.isPending}
          onClick={() => deleteMutation.mutate({ id: post.id })}
          className="h-7 px-2 text-xs text-[#FF3B30] hover:text-red-300 hover:bg-red-400/10"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InstagramDashboard() {
  const { toast } = useToast();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [feedLimit, setFeedLimit] = useState(12);

  // Check token validity first — gate the whole page if expired
  const { data: tokenStatus } = trpc.instagram.checkTokenExpiry.useQuery(undefined, {
    retry: 1,
    staleTime: 1000 * 60 * 60,
  });

  const tokenInvalid = tokenStatus !== undefined && !tokenStatus.valid;

  const { data: accountStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } =
    trpc.instagram.getAccountStats.useQuery(undefined, { retry: 1, enabled: !tokenInvalid });

  const { data: feed, isLoading: feedLoading, error: feedError, refetch: refetchFeed } =
    trpc.instagram.getFeed.useQuery({ limit: feedLimit }, { retry: 1, enabled: !tokenInvalid });

  const { data: scheduledPosts, refetch: refetchScheduled } =
    trpc.instagram.getScheduledPosts.useQuery({ includePosted: false });

  const handleRefresh = () => {
    refetchStats();
    refetchFeed();
    toast({ title: "Refreshed", description: "Instagram data updated." });
  };

  const apiError = !tokenInvalid ? (statsError || feedError) : null;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#222222] flex items-center gap-2">
            <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ background: BRAND_ASSETS.instagram.gradient }}>
              <Instagram className="h-3.5 w-3.5 text-white" />
            </div>
            Instagram
          </h1>
          <p className="text-sm text-[#6F6F6B] mt-1">
            @golfvxarlingtonheights · Live feed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-[#DEDEDA] text-[#6F6F6B] hover:text-[#222222]"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setScheduleOpen(true)}
            className="bg-[#F2DD48] text-black hover:bg-[#F2DD48]/90"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Schedule Post
          </Button>
        </div>
      </div>

      {/* Token expired — show setup card and stop rendering the rest */}
      {tokenInvalid && (
        <div className="rounded-xl border border-[#FF3B30]/30 bg-[#FF3B30]/5 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[#FF3B30] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#FF3B30] text-[15px]">Instagram Access Token Expired</p>
              <p className="text-[13px] text-[#6F6F6B] mt-1">
                Your Instagram access token is no longer valid. Renew it to restore the live feed, account stats, and AI analysis.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#DEDEDA] p-4 space-y-3 text-[13px]">
            <p className="font-semibold text-[#222222]">How to renew your token:</p>
            <ol className="space-y-2 text-[#555555] list-decimal list-inside">
              <li>Open <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-[#1A56DB] underline">Meta Graph API Explorer</a></li>
              <li>Select your app and generate a new <strong>User Access Token</strong> with <code className="bg-[#F1F1EF] px-1 rounded text-[11px]">instagram_basic</code>, <code className="bg-[#F1F1EF] px-1 rounded text-[11px]">pages_read_engagement</code> permissions</li>
              <li>Exchange for a long-lived token (60 days) via the Token Debugger</li>
              <li>Update <code className="bg-[#F1F1EF] px-1 rounded text-[11px]">INSTAGRAM_ACCESS_TOKEN</code> in your environment variables</li>
              <li>Restart the server and return here</li>
            </ol>
          </div>
          <p className="text-[11px] text-[#A8A8A3]">Post scheduling still works — only live data feed and analytics are affected.</p>
        </div>
      )}

      {/* Only render data sections when token is valid */}
      {!tokenInvalid && (
        <>
          {/* Token Warning Banner (expiring soon) */}
          <TokenWarningBanner />

          {/* API Error Banner */}
          {apiError && (
            <div className="flex items-center gap-3 p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/30 rounded-xl text-[#FF3B30] text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-semibold">Instagram API Error</p>
                <p className="text-xs mt-0.5 text-[#FF3B30]/80">{(apiError as any).message}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Account Stats */}
      {!tokenInvalid && !statsLoading && accountStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="bg-white border-[#DEDEDA]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F2DD48]/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#F2DD48]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#222222]">{formatCount(accountStats.followers_count)}</p>
                  <p className="text-xs text-[#6F6F6B]">Followers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-[#DEDEDA]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F2DD48]/10 flex items-center justify-center">
                  <Image className="h-4 w-4 text-[#F2DD48]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#222222]">{accountStats.media_count}</p>
                  <p className="text-xs text-[#6F6F6B]">Total Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-[#DEDEDA]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F2DD48]/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-[#F2DD48]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#222222]">{scheduledPosts?.length ?? 0}</p>
                  <p className="text-xs text-[#6F6F6B]">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Feed */}
      {!tokenInvalid && <div className="space-y-4">
        {feedLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-white animate-pulse" />
            ))}
          </div>
        ) : feedError ? (
          <div className="text-center py-12 text-[#6F6F6B]">
            <AlertCircle className="h-8 w-8 mx-auto mb-3 text-[#FF3B30]" />
            <p>Could not load feed. Check API token.</p>
          </div>
        ) : feed && feed.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {feed.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {feed.length >= feedLimit && (
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFeedLimit((l) => l + 12)}
                  className="border-[#DEDEDA] text-[#6F6F6B] hover:text-[#222222]"
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-[#6F6F6B]">
            <Instagram className="h-8 w-8 mx-auto mb-3 text-[#444]" />
            <p>No posts found.</p>
          </div>
        )}
      </div>}

      {/* Schedule Post Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="bg-[#F1F1EF] border-[#DEDEDA] text-[#222222] max-w-lg">
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
