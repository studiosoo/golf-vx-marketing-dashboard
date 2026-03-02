// Guest version of Funnels — uses trpc.guest.* public endpoints
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Lock } from "lucide-react";

export default function GuestFunnels() {
  const { data: submissions = [] } = trpc.guest.getFunnels.useQuery();

  const totalSubmissions = (funnelSummary as any[]).reduce((s: number, f: any) => s + Number(f.submissionCount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funnels</h1>
          <p className="text-muted-foreground text-sm mt-1">ClickFunnels lead capture performance</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-1.5">
          <Lock size={11} />
          <span>Sync disabled in guest mode</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Active Funnels</p>
            <p className="text-xl font-bold">{(funnelSummary as any[]).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Total Submissions</p>
            <p className="text-xl font-bold">{totalSubmissions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Recent Submissions</p>
            <p className="text-xl font-bold">{(submissions as any[]).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target size={16} />
            Funnel Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : (funnelSummary as any[]).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No funnel data available</p>
          ) : (
            <div className="space-y-2">
              {(funnelSummary as any[]).map((f: any) => (
                <div key={f.funnelId} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{f.funnelName}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.lastSubmission ? `Last: ${new Date(f.lastSubmission).toLocaleDateString()}` : "No submissions yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      {f.submissionCount} submissions
                    </Badge>
                    {f.optInCount > 0 && (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        {f.optInCount} opt-ins
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
