import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Mail, Users, RefreshCw, ExternalLink, Tag } from "lucide-react";

const DRIP_SEQUENCES = [
  { name: "Welcome Series", trigger: "#card-issued", steps: 3, description: "Onboarding sequence for new Boomerang card holders" },
  { name: "Trial Conversion", trigger: "#trial", steps: 5, description: "Nurture trial members toward paid membership" },
  { name: "Win-Back", trigger: "#churned", steps: 4, description: "Re-engage members who deleted their Boomerang card" },
  { name: "Giveaway Follow-up", trigger: "#giveaway-2026", steps: 3, description: "Post-giveaway engagement sequence" },
  { name: "All-Access Aces VIP", trigger: "#membership-all-access-aces-325", steps: 2, description: "VIP welcome for All-Access Aces members" },
  { name: "Apple Wallet Installed", trigger: "#apple-wallet", steps: 2, description: "Engagement boost after wallet card install" },
];

export default function DripCampaigns() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data: people, isLoading: peopleLoading } = trpc.encharge.getPeople.useQuery({ limit: 100 });
  const { data: metrics } = trpc.encharge.getMetrics.useQuery();

  const filtered = people && search
    ? (people as any[]).filter((p: any) =>
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        p.lastName?.toLowerCase().includes(search.toLowerCase())
      )
    : (people as any[] | undefined);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Drip Campaigns</h1>
            <p className="text-muted-foreground mt-1 text-sm">Encharge email sequences and subscriber overview</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
              onClick={() => { utils.encharge.getPeople.invalidate(); utils.encharge.getMetrics.invalidate(); }}>
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
            <a href="https://app.encharge.io/flows" target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <ExternalLink className="h-3 w-3" /> Manage in Encharge
              </Button>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: "Total Subscribers", value: (metrics as any)?.total ?? 0, icon: Users, color: "text-primary" },
            { label: "Active", value: (metrics as any)?.active ?? 0, icon: Mail, color: "text-green-400" },
            { label: "Unsubscribed", value: (metrics as any)?.unsubscribed ?? 0, icon: Tag, color: "text-muted-foreground" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{Number(s.value).toLocaleString()}</p>
                  </div>
                  <s.icon className={`h-5 w-5 ${s.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Configured Sequences</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {DRIP_SEQUENCES.map((seq, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <div className="mt-0.5 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{seq.name}</span>
                      <Badge variant="outline" className="text-xs font-mono">{seq.trigger}</Badge>
                      <span className="text-xs text-muted-foreground">{seq.steps} steps</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{seq.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">Encharge Subscribers</CardTitle>
            <div className="flex gap-1.5">
              <Input placeholder="Search…" value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
                className="h-7 w-[160px] text-xs" />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSearch(searchInput)}>
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {peopleLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : !filtered?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No subscribers found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name / Email</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Tags</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 50).map((p: any) => (
                      <tr key={p.id ?? p.email} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-foreground">{[p.firstName, p.lastName].filter(Boolean).join(" ") || <span className="text-muted-foreground italic">No name</span>}</div>
                          <div className="text-xs text-muted-foreground">{p.email}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {(p.tags ?? []).slice(0, 4).map((tag: string) => (
                              <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary font-mono">{tag}</span>
                            ))}
                            {(p.tags ?? []).length > 4 && <span className="text-xs text-muted-foreground">+{p.tags.length - 4}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            p.unsubscribed ? "bg-muted text-muted-foreground border-border" : "bg-green-500/15 text-green-400 border-green-500/30"
                          }`}>{p.unsubscribed ? "Unsubscribed" : "Active"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length > 50 && <p className="text-xs text-muted-foreground text-center py-2">Showing 50 of {filtered.length}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
