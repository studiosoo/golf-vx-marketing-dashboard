// Guest version of Members — uses trpc.guest.getMembers public endpoint
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Lock } from "lucide-react";

const tierColors: Record<string, string> = {
  all_access_aces: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  swing_savers: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  golf_vx_pro: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  trial: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  monthly: "bg-green-500/20 text-green-300 border-green-500/30",
  annual: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  corporate: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  none: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-300 border-green-500/30",
  inactive: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
  trial: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

export default function GuestMembers() {
  const [search, setSearch] = useState("");
  const { data: members = [], isLoading } = trpc.guest.getMembers.useQuery();
  const { data: stats } = trpc.guest.getMemberStats.useQuery();

  const filtered = members.filter((m: any) =>
    !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground text-sm mt-1">Member directory and membership data</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-1.5">
          <Lock size={11} />
          <span>Add/Edit disabled in guest mode</span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Total Members</p>
              <p className="text-xl font-bold">{stats.totalMembers ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-green-400">{stats.activeMembers ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">All Access Aces</p>
              <p className="text-xl font-bold text-blue-400">{stats.allAccessCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Swing Savers</p>
              <p className="text-xl font-bold text-purple-400">{stats.swingSaversCount ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Member list */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users size={16} />
            Members ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No members found</p>
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 50).map((member: any) => (
                <div key={member.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs border ${tierColors[member.membershipTier] || ""}`}>
                      {member.membershipTier?.replace(/_/g, " ")}
                    </Badge>
                    <Badge className={`text-xs border ${statusColors[member.status] || ""}`}>
                      {member.status}
                    </Badge>
                    {member.monthlyAmount && (
                      <span className="text-xs text-green-400">${parseFloat(member.monthlyAmount).toFixed(0)}/mo</span>
                    )}
                  </div>
                </div>
              ))}
              {filtered.length > 50 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Showing 50 of {filtered.length} members
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
