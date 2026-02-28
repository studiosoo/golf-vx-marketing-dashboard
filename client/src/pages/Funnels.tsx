import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Search,
  Users,
  MousePointerClick,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(d: Date | string | null | undefined) {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Funnels() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [expandedFunnel, setExpandedFunnel] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [optInModalFunnel, setOptInModalFunnel] = useState<{ id: number; name: string } | null>(null);

  const { data: funnels = [], isLoading: funnelsLoading, refetch: refetchFunnels } =
    trpc.funnels.list.useQuery({ includeArchived: false });

  const { data: summary = [], isLoading: summaryLoading } = trpc.funnels.summary.useQuery();

  const { data: allSubmissions = [], isLoading: submissionsLoading } =
    trpc.funnels.submissions.useQuery({ limit: 200 });

  const { data: modalSubmissions = [], isLoading: modalLoading } = trpc.funnels.submissions.useQuery(
    { funnelId: optInModalFunnel?.id, limit: 500 },
    { enabled: !!optInModalFunnel }
  );

  const syncMutation = trpc.funnels.syncNow.useMutation({
    onSuccess: (result) => {
      toast({
        title: "ClickFunnels Sync Complete",
        description: `Funnels: ${result.funnels.synced} synced. Submissions: ${result.submissions.synced} synced.`,
      });
      refetchFunnels();
    },
    onError: (err) => {
      toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
    },
  });

  const filteredFunnels = funnels.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSubmissions = allSubmissions.filter(
    (s) =>
      !search ||
      s.funnelName?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalOptIns = funnels.reduce((sum, f) => sum + (f.optInCount ?? 0), 0);
  const activeFunnels = funnels.filter((f) => !f.archived).length;
  const lastSync = funnels.length > 0
    ? funnels.reduce((latest, f) => {
        const t = f.lastSyncedAt ? new Date(f.lastSyncedAt).getTime() : 0;
        return t > latest ? t : latest;
      }, 0)
    : null;

  // Group submissions by funnel for the expanded view
  const submissionsByFunnel = allSubmissions.reduce<Record<number, typeof allSubmissions>>(
    (acc, s) => {
      const key = s.funnelId ?? 0;
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    },
    {}
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funnels & Landing Pages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ClickFunnels opt-in performance · Last synced {lastSync ? timeAgo(new Date(lastSync)) : "never"}
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          {syncMutation.isPending ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Opt-Ins</p>
                <p className="text-2xl font-bold">{totalOptIns.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MousePointerClick className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Funnels</p>
                <p className="text-2xl font-bold">{activeFunnels}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{allSubmissions.length.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search funnels or contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Funnel Overview</TabsTrigger>
          <TabsTrigger value="submissions">All Opt-Ins</TabsTrigger>
        </TabsList>

        {/* Funnel Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {funnelsLoading || summaryLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading funnels...</div>
          ) : filteredFunnels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No funnels found.{" "}
              <button
                className="text-yellow-500 underline"
                onClick={() => syncMutation.mutate()}
              >
                Sync from ClickFunnels
              </button>
            </div>
          ) : (
            filteredFunnels.map((funnel) => {
              const isExpanded = expandedFunnel === funnel.cfId;
              const funnelSubs = submissionsByFunnel[funnel.cfId] ?? [];
              const summaryRow = summary.find((s) => Number(s.funnelId) === funnel.cfId);

              // Group submissions by page/step
              const byStep = funnelSubs.reduce<Record<string, number>>((acc, s) => {
                const key = s.pageName ?? "Unknown Step";
                acc[key] = (acc[key] ?? 0) + 1;
                return acc;
              }, {});

              return (
                <Card key={funnel.cfId} className="overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedFunnel(isExpanded ? null : funnel.cfId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <CardTitle className="text-base font-semibold">{funnel.name}</CardTitle>
                          {funnel.currentPath && (
                            <a
                              href={`https://${funnel.currentPath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-yellow-500 flex items-center gap-1 mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {funnel.currentPath}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {Array.isArray(funnel.tags) && (funnel.tags as Array<{ name: string; color: string }>).length > 0 && (
                          <div className="flex gap-1">
                            {(funnel.tags as Array<{ name: string; color: string }>).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {String(tag.name)}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div
                          className="text-right cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOptInModalFunnel({ id: funnel.cfId, name: funnel.name });
                          }}
                          title="Click to view contact list"
                        >
                          <p className="text-lg font-bold text-yellow-500 underline decoration-dotted underline-offset-2">
                            {(funnel.optInCount ?? 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">opt-ins</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{funnelSubs.length}</p>
                          <p className="text-xs text-muted-foreground">submissions</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="border-t pt-4 space-y-4">
                      {/* Step Breakdown */}
                      {Object.keys(byStep).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            Opt-ins by Step
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(byStep)
                              .sort(([, a], [, b]) => b - a)
                              .map(([step, count]) => (
                                <div key={step} className="flex items-center gap-3">
                                  <div className="flex-1 text-sm">{step}</div>
                                  <div className="w-32 bg-muted rounded-full h-2">
                                    <div
                                      className="bg-yellow-500 h-2 rounded-full"
                                      style={{
                                        width: `${Math.min(100, (count / Math.max(...Object.values(byStep))) * 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <div className="text-sm font-medium w-8 text-right">{count}</div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Submissions */}
                      {funnelSubs.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            Recent Opt-Ins ({funnelSubs.length} total)
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Golf Level</TableHead>
                                <TableHead>Step</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {funnelSubs.slice(0, 20).map((sub) => (
                                <TableRow key={sub.id}>
                                  <TableCell className="font-medium">
                                    {[sub.firstName, sub.lastName].filter(Boolean).join(" ") || "—"}
                                  </TableCell>
                                  <TableCell>
                                    {sub.email ? (
                                      <a
                                        href={`mailto:${sub.email}`}
                                        className="flex items-center gap-1 text-blue-500 hover:underline text-xs"
                                      >
                                        <Mail className="h-3 w-3" />
                                        {sub.email}
                                      </a>
                                    ) : (
                                      "—"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {sub.phone ? (
                                      <span className="flex items-center gap-1 text-xs">
                                        <Phone className="h-3 w-3" />
                                        {sub.phone}
                                      </span>
                                    ) : (
                                      "—"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {sub.city || sub.state ? (
                                      <span className="flex items-center gap-1 text-xs">
                                        <MapPin className="h-3 w-3" />
                                        {[sub.city, sub.state].filter(Boolean).join(", ")}
                                      </span>
                                    ) : (
                                      "—"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {sub.golfLevel ? (
                                      <Badge variant="outline" className="text-xs">
                                        {sub.golfLevel}
                                      </Badge>
                                    ) : (
                                      "—"
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {sub.pageName ?? "—"}
                                  </TableCell>
                                  <TableCell>
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(sub.submittedAt)}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {funnelSubs.length > 20 && (
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              Showing 20 of {funnelSubs.length} submissions
                            </p>
                          )}
                        </div>
                      )}

                      {funnelSubs.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No form submissions found for this funnel yet.
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* All Opt-Ins Tab */}
        <TabsContent value="submissions" className="mt-4">
          {submissionsLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading submissions...</div>
          ) : (
            <Card>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Golf Level</TableHead>
                      <TableHead>Funnel</TableHead>
                      <TableHead>Step</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No submissions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubmissions.slice(0, 100).map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">
                            {[sub.firstName, sub.lastName].filter(Boolean).join(" ") || "—"}
                          </TableCell>
                          <TableCell>
                            {sub.email ? (
                              <a
                                href={`mailto:${sub.email}`}
                                className="flex items-center gap-1 text-blue-500 hover:underline text-xs"
                              >
                                <Mail className="h-3 w-3" />
                                {sub.email}
                              </a>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {sub.phone ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {[sub.city, sub.state].filter(Boolean).join(", ") || "—"}
                          </TableCell>
                          <TableCell>
                            {sub.golfLevel ? (
                              <Badge variant="outline" className="text-xs">
                                {sub.golfLevel}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                            {sub.funnelName ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {sub.pageName ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(sub.submittedAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {filteredSubmissions.length > 100 && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Showing 100 of {filteredSubmissions.length} submissions
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Opt-In Contact List Modal */}
      <Dialog open={!!optInModalFunnel} onOpenChange={(open) => !open && setOptInModalFunnel(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base">
              Opt-In Contacts — {optInModalFunnel?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            {modalLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading contacts...</div>
            ) : modalSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No submissions found for this funnel.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Golf Level</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modalSubmissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium text-sm">
                        {[sub.firstName, sub.lastName].filter(Boolean).join(" ") || "—"}
                      </TableCell>
                      <TableCell>
                        {sub.email ? (
                          <a
                            href={`mailto:${sub.email}`}
                            className="flex items-center gap-1 text-blue-500 hover:underline text-xs"
                          >
                            <Mail className="h-3 w-3" />
                            {sub.email}
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {sub.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {sub.phone}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {[sub.city, sub.state].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        {sub.golfLevel ? (
                          <Badge variant="outline" className="text-xs">{sub.golfLevel}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(sub.submittedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="pt-2 border-t border-border text-xs text-muted-foreground">
            {modalSubmissions.length} contact{modalSubmissions.length !== 1 ? "s" : ""} in database
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
