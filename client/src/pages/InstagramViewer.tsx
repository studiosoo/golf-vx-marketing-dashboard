import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { ExternalLink, Instagram, BarChart2, RefreshCw, Users, Eye, MousePointer, Plus, CheckCircle, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";

const INSTAGRAM_URL = "https://www.instagram.com/golfvxarlingtonheights/";

export default function InstagramViewer() {
  const { toast } = useToast();
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncForm, setSyncForm] = useState({
    date: new Date().toISOString().split("T")[0],
    followersCount: "", followingCount: "", mediaCount: "",
    impressions: "", reach: "", profileViews: "", websiteClicks: "", engagementRate: "",
  });

  const { data: insights, isLoading, refetch } = trpc.instagram.getInsights.useQuery({ days: 30 });
  const syncMutation = trpc.instagram.syncInsights.useMutation({
    onSuccess: () => { toast({ title: "Synced!", description: "Instagram data saved." }); setSyncOpen(false); refetch(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const latestInsight = insights?.[0];
  const chartData = [...(insights || [])].reverse().map((ins) => ({
    date: new Date(ins.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    followers: ins.followersCount, reach: ins.reach || 0,
    impressions: ins.impressions || 0,
  }));

  const handleSync = () => {
    if (!syncForm.followersCount) { toast({ title: "Required", description: "Followers count is required.", variant: "destructive" }); return; }
    syncMutation.mutate({
      date: syncForm.date,
      followersCount: parseInt(syncForm.followersCount),
      followingCount: syncForm.followingCount ? parseInt(syncForm.followingCount) : undefined,
      mediaCount: syncForm.mediaCount ? parseInt(syncForm.mediaCount) : undefined,
      impressions: syncForm.impressions ? parseInt(syncForm.impressions) : undefined,
      reach: syncForm.reach ? parseInt(syncForm.reach) : undefined,
      profileViews: syncForm.profileViews ? parseInt(syncForm.profileViews) : undefined,
      websiteClicks: syncForm.websiteClicks ? parseInt(syncForm.websiteClicks) : undefined,
      engagementRate: syncForm.engagementRate ? parseFloat(syncForm.engagementRate) : undefined,
    });
  };

  const fields = [
    { id: "followers", label: "Followers *", key: "followersCount", ph: "e.g. 1240" },
    { id: "following", label: "Following", key: "followingCount", ph: "e.g. 320" },
    { id: "media", label: "Posts / Media Count", key: "mediaCount", ph: "e.g. 87" },
    { id: "reach", label: "Reach (28-day)", key: "reach", ph: "e.g. 4200" },
    { id: "impressions", label: "Impressions (28-day)", key: "impressions", ph: "e.g. 8500" },
    { id: "profile-views", label: "Profile Views (28-day)", key: "profileViews", ph: "e.g. 620" },
    { id: "website-clicks", label: "Website Clicks (28-day)", key: "websiteClicks", ph: "e.g. 45" },
    { id: "engagement", label: "Engagement Rate (%)", key: "engagementRate", ph: "e.g. 3.5" },
  ];

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Instagram Analytics</h1>
              <p className="text-muted-foreground text-sm">@golfvxarlingtonheights</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setSyncOpen(true)}>
              <Plus className="h-4 w-4" /> Sync Data
            </Button>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2"><ExternalLink className="h-4 w-4" /> Open Instagram</Button>
            </a>
          </div>
        </div>

        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Instagram auto-sync requires additional OAuth permissions</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The current Meta Ads token does not include <code className="bg-muted px-1 rounded text-xs">instagram_basic</code> scopes.
                  Use <strong>Sync Data</strong> to manually enter stats from{" "}
                  <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Meta Business Suite</a>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            { label: "Followers", value: latestInsight?.followersCount?.toLocaleString() ?? "—", Icon: Users, color: "text-purple-400" },
            { label: "Reach (28d)", value: latestInsight?.reach?.toLocaleString() ?? "—", Icon: Eye, color: "text-pink-400" },
            { label: "Impressions (28d)", value: latestInsight?.impressions?.toLocaleString() ?? "—", Icon: BarChart2, color: "text-orange-400" },
            { label: "Profile Views (28d)", value: latestInsight?.profileViews?.toLocaleString() ?? "—", Icon: MousePointer, color: "text-yellow-400" },
          ] as const).map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.label}</p>
                  <kpi.Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                {latestInsight && <p className="text-xs text-muted-foreground mt-1">Last synced: {new Date(latestInsight.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {chartData.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Growth Trend</CardTitle>
              <CardDescription>Followers and reach over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend />
                  <Line type="monotone" dataKey="followers" stroke="#a855f7" strokeWidth={2} dot={false} name="Followers" />
                  <Line type="monotone" dataKey="reach" stroke="#ec4899" strokeWidth={2} dot={false} name="Reach" />
                  <Line type="monotone" dataKey="impressions" stroke="#f97316" strokeWidth={2} dot={false} name="Impressions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {insights && insights.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sync History</CardTitle>
              <CardDescription>{insights.length} data points recorded</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Date","Followers","Reach","Impressions","Profile Views","Engagement %"].map(h => (
                        <th key={h} className={`py-2 text-muted-foreground font-medium text-xs ${h === "Date" ? "text-left" : "text-right"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {insights.slice(0, 10).map((ins) => (
                      <tr key={ins.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="py-2 text-foreground">{new Date(ins.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td className="py-2 text-right font-medium">{ins.followersCount?.toLocaleString() ?? "—"}</td>
                        <td className="py-2 text-right text-muted-foreground">{ins.reach?.toLocaleString() ?? "—"}</td>
                        <td className="py-2 text-right text-muted-foreground">{ins.impressions?.toLocaleString() ?? "—"}</td>
                        <td className="py-2 text-right text-muted-foreground">{ins.profileViews?.toLocaleString() ?? "—"}</td>
                        <td className="py-2 text-right text-muted-foreground">{ins.engagementRate ? `${parseFloat(ins.engagementRate).toFixed(2)}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : !isLoading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-400/20 flex items-center justify-center">
                <Instagram className="h-6 w-6 text-pink-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No data synced yet</p>
                <p className="text-sm text-muted-foreground mt-1">Click "Sync Data" to enter your Instagram stats from Meta Business Suite.</p>
              </div>
              <Button onClick={() => setSyncOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Sync First Data Point</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Profile", url: INSTAGRAM_URL, desc: "View feed & bio" },
            { label: "Reels", url: `${INSTAGRAM_URL}reels/`, desc: "All video reels" },
            { label: "Meta Business Suite", url: "https://business.facebook.com", desc: "Full analytics & insights" },
            { label: "Creator Studio", url: "https://www.facebook.com/creatorstudio", desc: "Schedule & manage posts" },
          ].map((link) => (
            <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="block">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="pt-4 pb-4 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{link.label}</p>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

        <Dialog open={syncOpen} onOpenChange={setSyncOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-primary" /> Sync Instagram Data</DialogTitle>
              <DialogDescription>Enter your stats from <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Meta Business Suite</a></DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="col-span-2">
                <Label htmlFor="sync-date">Date</Label>
                <Input id="sync-date" type="date" value={syncForm.date} onChange={(e) => setSyncForm((p) => ({ ...p, date: e.target.value }))} className="mt-1" />
              </div>
              {fields.map((f) => (
                <div key={f.id}>
                  <Label htmlFor={f.id}>{f.label}</Label>
                  <Input id={f.id} type="number" placeholder={f.ph}
                    value={(syncForm as any)[f.key]}
                    onChange={(e) => setSyncForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="mt-1" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setSyncOpen(false)}>Cancel</Button>
              <Button onClick={handleSync} disabled={syncMutation.isPending} className="gap-2">
                {syncMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Save Data
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
