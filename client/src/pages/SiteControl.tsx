import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Globe, ExternalLink, Image, RefreshCw, BarChart3 } from "lucide-react";

const SITE_LINKS = [
  { label: "Main Website", url: "https://playgolfvx.com", description: "Golf VX Arlington Heights main site" },
  { label: "Booking Page", url: "https://app.acuityscheduling.com/schedule.php?owner=28558271", description: "Acuity scheduling portal" },
  { label: "ClickFunnels", url: "https://app.clickfunnels.com", description: "Landing pages and funnels" },
  { label: "Meta Ads Manager", url: "https://www.facebook.com/adsmanager", description: "Facebook & Instagram ads" },
  { label: "Encharge", url: "https://app.encharge.io", description: "Email automation platform" },
  { label: "Boomerang", url: "https://app.boomerangapp.com", description: "Digital loyalty card management" },
];

export default function SiteControl() {
  const utils = trpc.useUtils();
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery();
  const activeCampaigns = (campaigns ?? []).filter((c: any) => c.status === "active");

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Site Control</h1>
            <p className="text-muted-foreground mt-1 text-sm">Website management, campaign visuals, and quick access links</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => utils.campaigns.list.invalidate()}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-400" /> Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SITE_LINKS.map((link) => (
                <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-muted/30 transition-all group">
                  <div>
                    <p className="text-sm font-medium text-foreground">{link.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Image className="h-4 w-4 text-purple-400" /> Active Campaign Landing Pages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : !activeCampaigns.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">No active campaigns</p>
            ) : (
              <div className="divide-y divide-border/50">
                {activeCampaigns.map((c: any) => (
                  <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        <Badge variant="outline" className="text-xs capitalize shrink-0">{c.category?.replace(/_/g, " ")}</Badge>
                      </div>
                      {c.landingPageUrl && (
                        <a href={c.landingPageUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline truncate block mt-0.5">{c.landingPageUrl}</a>
                      )}
                    </div>
                    {c.landingPageUrl && (
                      <a href={c.landingPageUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost" className="h-7 w-7 ml-2 shrink-0">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-400" /> Analytics & Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: "Meta Ads Analytics", href: "/meta-ads" },
                { label: "Campaign Performance", href: "/performance" },
                { label: "Member Analytics", href: "/members" },
                { label: "Strategic Overview", href: "/strategic-campaigns" },
              ].map((item) => (
                <a key={item.label} href={item.href}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-muted/30 transition-all group">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
