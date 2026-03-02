// Guest version of SiteControl — static info page (no auth required)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Lock } from "lucide-react";

export default function GuestSiteControl() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Control</h1>
          <p className="text-muted-foreground text-sm mt-1">Website and content management</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-1.5">
          <Lock size={11} />
          <span>All actions disabled in guest mode</span>
        </div>
      </div>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe size={16} />
            Site Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <Globe size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">Site control features require authentication</p>
            <a href="/" className="text-sm text-primary hover:underline">Login to access site management →</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
