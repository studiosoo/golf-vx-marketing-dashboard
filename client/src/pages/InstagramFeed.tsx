import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  DialogDescription,
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
  ExternalLink,
  RefreshCw,
  Users,
  Image,
  Calendar,
  Plus,
  Trash2,
  Send,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  Layers,
} from "lucide-react";

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

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: any }) {
  const imgSrc = post.media_url || post.thumbnail_url;
  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#F5C72C]/50 transition-all"
    >
      {/* Thumbnail */}
      <div className="relative aspect-square bg-[#111]">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={post.caption?.slice(0, 60) || "Instagram post"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Instagram className="h-8 w-8 text-[#444]" />
          </div>
        )}
        {/* Media type badge */}
        <div className="absolute top-2 right-2 bg-black/60 rounded-md px-1.5 py-0.5 flex items-center gap-1 text-white text-xs">
          {mediaTypeIcon(post.media_type)}
        </div>
        {/* Hover overlay */}
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
      {/* Caption */}
      <div className="p-3">
        <p className="text-xs text-[#aaa] line-clamp-2 leading-relaxed">
          {post.caption || <span className="italic text-[#555]">No caption</span>}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-[#555]">{timeAgo(post.timestamp)}</span>
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
      {/* AI Caption Generator */}
      <div className="bg-[#F5C72C]/5 border border-[#F5C72C]/20 rounded-lg p-4">
        <p className="text-xs font-semibold text-[#F5C72C] mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          AI Caption Generator
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Topic (e.g., Summer Camp registration open)"
            value={form.topic}
            onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            className="flex-1 text-sm bg-[#111] border-[#333]"
          />
          <Select
            value={form.tone}
            onValueChange={(v) => setForm((f) => ({ ...f, tone: v as any }))}
          >
            <SelectTrigger className="w-32 text-xs bg-[#111] border-[#333]">
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
            onClick={() =>
              captionMutation.mutate({ topic: form.topic, tone: form.tone, includeHashtags: true })
            }
            className="border-[#F5C72C]/40 text-[#F5C72C] hover:bg-[#F5C72C]/10"
          >
            {captionMutation.isPending ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Caption */}
      <div>
        <Label className="text-xs text-[#aaa]">Caption *</Label>
        <Textarea
          value={form.caption}
          onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
          placeholder="Write your caption..."
          className="mt-1 text-sm bg-[#111] border-[#333] min-h-[100px]"
          required
        />
      </div>

      {/* Hashtags */}
      <div>
        <Label className="text-xs text-[#aaa]">Hashtags</Label>
        <Input
          value={form.hashtags}
          onChange={(e) => setForm((f) => ({ ...f, hashtags: e.target.value }))}
          placeholder="#golfvx #indoorgolf #arlingtonheights"
          className="mt-1 text-sm bg-[#111] border-[#333]"
        />
      </div>

      {/* Image URL */}
      <div>
        <Label className="text-xs text-[#aaa]">Image URL (required to publish)</Label>
        <Input
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          placeholder="https://..."
          className="mt-1 text-sm bg-[#111] border-[#333]"
        />
      </div>

      {/* Content Type & Schedule */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-[#aaa]">Post Type</Label>
          <Select
            value={form.contentType}
            onValueChange={(v) => setForm((f) => ({ ...f, contentType: v as any }))}
          >
            <SelectTrigger className="mt-1 text-sm bg-[#111] border-[#333]">
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
          <Label className="text-xs text-[#aaa]">Schedule For</Label>
          <Input
            type="datetime-local"
            value={form.scheduledFor}
            onChange={(e) => setForm((f) => ({ ...f, scheduledFor: e.target.value }))}
            className="mt-1 text-sm bg-[#111] border-[#333]"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-[#333]">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={scheduleMutation.isPending}
          className="flex-1 bg-[#F5C72C] text-black hover:bg-[#F5C72C]/90"
        >
          {scheduleMutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Calendar className="h-4 w-4 mr-2" />
          )}
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
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
      {/* Thumbnail or placeholder */}
      <div className="w-12 h-12 rounded-md bg-[#111] border border-[#333] flex-shrink-0 overflow-hidden">
        {post.imageUrl ? (
          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-4 w-4 text-[#444]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white line-clamp-2">{post.caption}</p>
        {post.hashtags && (
          <p className="text-xs text-[#F5C72C]/70 mt-0.5 line-clamp-1">{post.hashtags}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className="text-[10px] border-[#333] text-[#888]">
            {post.contentType.replace("_", " ")}
          </Badge>
          <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? "text-red-400" : "text-[#888]"}`}>
            <Clock className="h-3 w-3" />
            {new Date(post.scheduledFor).toLocaleString("en-US", {
              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            })}
            {isOverdue && " (overdue)"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!post.posted && post.imageUrl && (
          <Button
            size="sm"
            variant="outline"
            disabled={publishMutation.isPending}
            onClick={() => publishMutation.mutate({ id: post.id })}
            className="h-7 px-2 text-xs border-[#F5C72C]/40 text-[#F5C72C] hover:bg-[#F5C72C]/10"
          >
            {publishMutation.isPending ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={deleteMutation.isPending}
          onClick={() => deleteMutation.mutate({ id: post.id })}
          className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10"
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

  const { data: accountStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } =
    trpc.instagram.getAccountStats.useQuery(undefined, { retry: 1 });

  const { data: feed, isLoading: feedLoading, error: feedError, refetch: refetchFeed } =
    trpc.instagram.getFeed.useQuery({ limit: feedLimit }, { retry: 1 });

  const { data: scheduledPosts, refetch: refetchScheduled } =
    trpc.instagram.getScheduledPosts.useQuery({ includePosted: false });

  const { data: postedPosts } =
    trpc.instagram.getScheduledPosts.useQuery({ includePosted: true });

  const handleRefresh = () => {
    refetchStats();
    refetchFeed();
    toast({ title: "Refreshed", description: "Instagram data updated." });
  };

  const apiError = statsError || feedError;

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Instagram className="h-6 w-6 text-[#F5C72C]" />
            Instagram
          </h1>
          <p className="text-sm text-[#888] mt-1">
            @golfvxarlingtonheights · Live feed &amp; content scheduler
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-[#333] text-[#aaa] hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setScheduleOpen(true)}
            className="bg-[#F5C72C] text-black hover:bg-[#F5C72C]/90"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Schedule Post
          </Button>
        </div>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">Instagram API Error</p>
            <p className="text-xs mt-0.5 text-red-400/80">{(apiError as any).message}</p>
          </div>
        </div>
      )}

      {/* Account Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-[#1a1a1a] animate-pulse" />
          ))}
        </div>
      ) : accountStats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F5C72C]/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#F5C72C]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatCount(accountStats.followers_count)}
                  </p>
                  <p className="text-xs text-[#888]">Followers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F5C72C]/10 flex items-center justify-center">
                  <Image className="h-4 w-4 text-[#F5C72C]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{accountStats.media_count}</p>
                  <p className="text-xs text-[#888]">Total Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F5C72C]/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-[#F5C72C]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {scheduledPosts?.length ?? 0}
                  </p>
                  <p className="text-xs text-[#888]">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Tabs: Feed | Scheduler */}
      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
          <TabsTrigger value="feed" className="data-[state=active]:bg-[#F5C72C] data-[state=active]:text-black">
            <Instagram className="h-3.5 w-3.5 mr-1.5" />
            Live Feed
          </TabsTrigger>
          <TabsTrigger value="scheduler" className="data-[state=active]:bg-[#F5C72C] data-[state=active]:text-black">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Scheduler
            {(scheduledPosts?.length ?? 0) > 0 && (
              <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-[#F5C72C]/20 text-[#F5C72C] border-[#F5C72C]/30">
                {scheduledPosts!.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Feed Tab ── */}
        <TabsContent value="feed" className="space-y-4">
          {feedLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-[#1a1a1a] animate-pulse" />
              ))}
            </div>
          ) : feedError ? (
            <div className="text-center py-12 text-[#888]">
              <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-400" />
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
                    className="border-[#333] text-[#aaa] hover:text-white"
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-[#888]">
              <Instagram className="h-8 w-8 mx-auto mb-3 text-[#444]" />
              <p>No posts found.</p>
            </div>
          )}
        </TabsContent>

        {/* ── Scheduler Tab ── */}
        <TabsContent value="scheduler" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Content Queue</h3>
              <p className="text-xs text-[#888] mt-0.5">
                Schedule posts and publish directly to Instagram
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setScheduleOpen(true)}
              className="bg-[#F5C72C] text-black hover:bg-[#F5C72C]/90"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Post
            </Button>
          </div>

          {/* Pending */}
          {scheduledPosts && scheduledPosts.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#888] uppercase tracking-wide">
                Pending ({scheduledPosts.length})
              </p>
              {scheduledPosts.map((post) => (
                <ScheduledPostRow
                  key={post.id}
                  post={post}
                  onRefresh={refetchScheduled}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-[#2a2a2a] rounded-xl">
              <Calendar className="h-8 w-8 mx-auto mb-3 text-[#444]" />
              <p className="text-sm text-[#888]">No posts scheduled</p>
              <p className="text-xs text-[#555] mt-1">
                Click "New Post" to schedule your first Instagram post
              </p>
            </div>
          )}

          {/* Published history */}
          {postedPosts && postedPosts.filter((p) => p.posted).length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs font-semibold text-[#888] uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                Published ({postedPosts.filter((p) => p.posted).length})
              </p>
              {postedPosts
                .filter((p) => p.posted)
                .slice(0, 5)
                .map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] opacity-60"
                  >
                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white line-clamp-1">{post.caption}</p>
                      <p className="text-[10px] text-[#555] mt-0.5">
                        Published{" "}
                        {post.postedAt
                          ? new Date(post.postedAt).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                    {post.instagramPostId && (
                      <a
                        href={`https://www.instagram.com/p/${post.instagramPostId}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#F5C72C] hover:text-[#F5C72C]/80"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Schedule Post Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#F5C72C]" />
              Schedule Instagram Post
            </DialogTitle>
            <DialogDescription className="text-[#888]">
              Create a post with AI-generated caption and schedule it for publishing.
            </DialogDescription>
          </DialogHeader>
          <SchedulerForm onClose={() => setScheduleOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
