import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Users, UserCheck, UserX, Mail, Phone, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Source = "web_form" | "meta_lead_ad" | "giveaway" | "clickfunnels" | "instagram" | "manual_csv" | "boomerang" | "acuity" | "referral" | "walk_in" | "other";
type Status = "new" | "contacted" | "qualified" | "converted" | "unsubscribed" | "bounced";

const SOURCE_LABELS: Record<string, string> = {
  web_form: "Web Form", meta_lead_ad: "Meta Lead Ad", giveaway: "Giveaway",
  clickfunnels: "ClickFunnels", instagram: "Instagram", manual_csv: "CSV Import",
  boomerang: "Boomerang", acuity: "Acuity", referral: "Referral",
  walk_in: "Walk-in", other: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  contacted: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  qualified: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  converted: "bg-green-500/15 text-green-400 border-green-500/30",
  unsubscribed: "bg-muted text-muted-foreground border-border",
  bounced: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function Leads() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [source, setSource] = useState<Source | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.emailCapture.list.useQuery({
    page, limit: 50,
    search: search || undefined,
    source: source !== "all" ? source : undefined,
    status: status !== "all" ? status : undefined,
  });
  const { data: stats } = trpc.emailCapture.getStats.useQuery();

  const updateStatus = trpc.emailCapture.updateStatus.useMutation({
    onSuccess: () => { utils.emailCapture.list.invalidate(); utils.emailCapture.getStats.invalidate(); toast({ title: "Status updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Leads</h1>
            <p className="text-muted-foreground mt-1 text-sm">All captured email leads from every source</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
            onClick={() => { utils.emailCapture.list.invalidate(); utils.emailCapture.getStats.invalidate(); }}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Leads", value: stats.total, icon: Users, color: "text-primary" },
              { label: "New", value: stats.byStatus?.new ?? 0, icon: Mail, color: "text-blue-400" },
              { label: "Converted", value: stats.byStatus?.converted ?? 0, icon: UserCheck, color: "text-green-400" },
              { label: "Unsubscribed", value: stats.byStatus?.unsubscribed ?? 0, icon: UserX, color: "text-muted-foreground" },
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
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-8 text-sm" />
            <Button size="sm" variant="outline" className="h-8 px-3" onClick={handleSearch}>
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Select value={source} onValueChange={(v) => { setSource(v as Source | "all"); setPage(1); }}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {Object.entries(SOURCE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v as Status | "all"); setPage(1); }}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(["new","contacted","qualified","converted","unsubscribed","bounced"] as Status[]).map((s) => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">{data ? `${data.total.toLocaleString()} leads` : "Loading…"}</CardTitle>
            {data && data.totalPages > 1 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                <span>{page} / {data.totalPages}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : !data?.data.length ? (
              <p className="text-sm text-muted-foreground text-center py-12">No leads found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name / Email</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Phone</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Source</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Captured</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((lead: any) => (
                      <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-foreground">
                            {lead.firstName || lead.lastName ? `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() : <span className="text-muted-foreground italic">No name</span>}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" />{lead.email}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {lead.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span> : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className="text-xs">{SOURCE_LABELS[lead.source] ?? lead.source}</Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[lead.status] ?? ""}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {lead.capturedAt ? new Date(lead.capturedAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <Select value={lead.status} onValueChange={(v) => updateStatus.mutate({ id: lead.id, status: v as Status })}>
                            <SelectTrigger className="h-6 w-[110px] text-xs border-border/50"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(["new","contacted","qualified","converted","unsubscribed","bounced"] as Status[]).map((s) => (
                                <SelectItem key={s} value={s} className="text-xs">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
