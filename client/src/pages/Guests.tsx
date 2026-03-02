import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Users, UserCheck, Clock, Star, Mail, Phone, RefreshCw } from "lucide-react";

type MemberStatus = "active" | "inactive" | "cancelled" | "trial";
type MembershipTier = "trial" | "monthly" | "annual" | "corporate" | "none" | "all_access_aces" | "swing_savers" | "golf_vx_pro";

const TIER_LABELS: Record<string, string> = {
  trial: "Trial", monthly: "Monthly", annual: "Annual", corporate: "Corporate",
  none: "None", all_access_aces: "All-Access Aces", swing_savers: "Swing Savers", golf_vx_pro: "Golf VX Pro",
};
const TIER_COLORS: Record<string, string> = {
  all_access_aces: "bg-primary/15 text-primary border-primary/30",
  swing_savers: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  golf_vx_pro: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  trial: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  monthly: "bg-green-500/15 text-green-400 border-green-500/30",
  annual: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  corporate: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  none: "bg-muted text-muted-foreground border-border",
};
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/15 text-green-400 border-green-500/30",
  inactive: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  trial: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export default function Guests() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<MemberStatus | "all">("all");
  const [tier, setTier] = useState<MembershipTier | "all">("all");
  const utils = trpc.useUtils();

  const { data: members, isLoading } = trpc.members.list.useQuery({
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    membershipTier: tier !== "all" ? tier : undefined,
  });
  const { data: stats } = trpc.members.getStats.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Guests & Members</h1>
            <p className="text-muted-foreground mt-1 text-sm">All registered members and trial guests</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
            onClick={() => { utils.members.list.invalidate(); utils.members.getStats.invalidate(); }}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Members", value: stats.totalMembers ?? 0, icon: Users, color: "text-primary" },
              { label: "Active", value: stats.activeMembers ?? 0, icon: UserCheck, color: "text-green-400" },
              { label: "Swing Savers", value: stats.swingSaversCount ?? 0, icon: Clock, color: "text-blue-400" },
              { label: "All-Access Aces", value: stats.allAccessCount ?? 0, icon: Star, color: "text-yellow-400" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
                    </div>
                    <s.icon className={`h-5 w-5 ${s.color} opacity-70`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1.5 flex-1 min-w-[200px]">
            <Input placeholder="Search name or email…" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
              className="h-8 text-sm" />
            <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => setSearch(searchInput)}>
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as MemberStatus | "all")}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(["active","inactive","cancelled","trial"] as MemberStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tier} onValueChange={(v) => setTier(v as MembershipTier | "all")}>
            <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Tier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              {Object.entries(TIER_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">{members ? `${members.length.toLocaleString()} members` : "Loading…"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : !members?.length ? (
              <p className="text-sm text-muted-foreground text-center py-12">No members found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name / Email</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Phone</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Tier</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Joined</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m: any) => (
                      <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-foreground">{m.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" />{m.email}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {m.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{m.phone}</span> : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TIER_COLORS[m.membershipTier] ?? ""}`}>
                            {TIER_LABELS[m.membershipTier] ?? m.membershipTier}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[m.status] ?? ""}`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {m.joinDate ? new Date(m.joinDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          {m.acquisitionSource ? <Badge variant="outline" className="text-xs">{m.acquisitionSource}</Badge> : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
