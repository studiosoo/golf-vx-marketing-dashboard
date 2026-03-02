// Guest version of Leads — uses trpc.guest.* public endpoints
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus } from "lucide-react";

export default function GuestLeads() {
  const { data: members = [], isLoading } = trpc.guest.getMembers.useQuery({ status: "trial" });
  const { data: stats } = trpc.guest.getMemberStats.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leads</h1>
        <p className="text-muted-foreground text-sm mt-1">Trial members and potential conversions</p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Trial Members</p>
              <p className="text-xl font-bold text-yellow-400">{(members as any[]).length}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Total Members</p>
              <p className="text-xl font-bold">{stats.totalMembers ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Active Members</p>
              <p className="text-xl font-bold text-green-400">{stats.activeMembers ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus size={16} />
            Trial Members / Leads ({(members as any[]).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}</div>
          ) : (members as any[]).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No trial members found</p>
          ) : (
            <div className="space-y-2">
              {(members as any[]).slice(0, 30).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.acquisitionSource || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">trial</Badge>
                    {m.joinDate && <span className="text-xs text-muted-foreground">{new Date(m.joinDate).toLocaleDateString()}</span>}
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
