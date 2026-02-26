import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Instagram, BarChart2, RefreshCw, AlertCircle } from "lucide-react";
import { Link } from "wouter";

const INSTAGRAM_URL = "https://www.instagram.com/golfvxarlingtonheights/";

export default function InstagramViewer() {
  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
            <Instagram className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Instagram</h1>
            <p className="text-muted-foreground text-sm">@golfvxarlingtonheights</p>
          </div>
        </div>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Open Instagram
          </Button>
        </a>
      </div>

      {/* Why iframe doesn't work */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Instagram blocks embedded previews</p>
              <p className="text-xs text-muted-foreground mt-1">
                Instagram enforces <code className="bg-muted px-1 rounded text-xs">X-Frame-Options: SAMEORIGIN</code> which prevents embedding their pages inside iframes on third-party sites. This is a platform-level restriction. Use the quick links below to access your profile directly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="block">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-5 pb-5 flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                <Instagram className="h-5 w-5 text-white" />
              </div>
              <p className="font-semibold text-sm">View Profile</p>
              <p className="text-xs text-muted-foreground">Open @golfvxarlingtonheights on Instagram</p>
              <Badge variant="outline" className="text-xs gap-1">
                <ExternalLink className="h-3 w-3" /> Opens in new tab
              </Badge>
            </CardContent>
          </Card>
        </a>

        <Link href="/website/instagram/analytics">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-5 pb-5 flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart2 className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold text-sm">Analytics</p>
              <p className="text-xs text-muted-foreground">Track followers, reach, and engagement trends</p>
              <Badge variant="secondary" className="text-xs">In-dashboard</Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/website/instagram/sync">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-5 pb-5 flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-green-500" />
              </div>
              <p className="font-semibold text-sm">Sync Data</p>
              <p className="text-xs text-muted-foreground">Manually update Instagram performance metrics</p>
              <Badge variant="secondary" className="text-xs">Manual sync</Badge>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Links</CardTitle>
          <CardDescription>Direct access to your Instagram content and management tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Profile Feed", url: INSTAGRAM_URL, desc: "All posts and reels" },
              { label: "Reels", url: `${INSTAGRAM_URL}reels/`, desc: "Short video content" },
              { label: "Tagged Posts", url: `${INSTAGRAM_URL}tagged/`, desc: "Community mentions" },
              { label: "Meta Business Suite", url: "https://business.facebook.com/", desc: "Manage ads & insights" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Embed widget info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Live Feed Widget (Optional)
          </CardTitle>
          <CardDescription>
            To show a live Instagram feed inside this dashboard, use a third-party widget service that uses the official Instagram API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Services like{" "}
              <a href="https://elfsight.com/instagram-feed-widget/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Elfsight</a>
              {" "}or{" "}
              <a href="https://lightwidget.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">LightWidget</a>
              {" "}provide embeddable Instagram feed widgets that work without iframe restrictions. Once you have an embed code, it can be added to this page.
            </p>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="mt-2 gap-2">
                <ExternalLink className="h-4 w-4" />
                View Profile on Instagram
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
