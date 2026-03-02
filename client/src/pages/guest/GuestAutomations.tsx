// Guest version of Automations — uses trpc.guest.getEncharge* public endpoints
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, Mail } from "lucide-react";

export default function GuestAutomations() {
  const { data: segments = [] } = trpc.guest.getEnchargeSegments.useQuery();
  const { data: metrics } = trpc.guest.getEnchargeMetrics.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Automations</h1>
        <p className="text-muted-foreground text-sm mt-1">Encharge email automation overview</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-blue-400" />
              <span className="text-xs text-muted-foreground">Total Subscribers</span>
            </div>
            <p className="text-xl font-bold">{metrics?.totalSubscribers?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Settings size={14} className="text-purple-400" />
              <span className="text-xs text-muted-foreground">Segments</span>
            </div>
            <p className="text-xl font-bold">{(segments as any[]).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Mail size={14} className="text-green-400" />
              <span className="text-xs text-muted-foreground">Active Subscribers</span>
            </div>
            <p className="text-sm font-medium truncate">{metrics?.recentSubscribers?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Segments */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users size={16} />
            Segments ({(segments as any[]).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(segments as any[]).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No segments found</p>
          ) : (
            <div className="space-y-2">
              {(segments as any[]).map((seg: any) => (
                <div key={seg.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <p className="text-sm text-foreground">{seg.name}</p>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    {seg.peopleCount?.toLocaleString() ?? 0} people
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
