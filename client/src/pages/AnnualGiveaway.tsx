import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, RefreshCw, TrendingUp, Users, DollarSign, Target, Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['var(--color-trial-conversion)', 'var(--color-b2b-events)', 'var(--color-primary)', 'var(--color-membership-growth)', 'var(--color-member-retention)'];

export default function AnnualGiveaway() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [syncTags, setSyncTags] = useState<string[]>(["giveaway-2026", "drive-day-prospect"]);
  const { toast } = useToast();

  const { data: applications, isLoading: loadingApps, refetch: refetchApps } = trpc.giveaway.getApplications.useQuery();
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = trpc.giveaway.getStats.useQuery();
  const { data: lastSyncInfo } = trpc.giveaway.getLastSyncInfo.useQuery();
  const { data: driveDayData, isLoading: loadingProspects } = trpc.giveaway.getDriveDayProspects.useQuery();
  
  const syncMutation = trpc.giveaway.sync.useMutation({
    onSuccess: () => { refetchApps(); refetchStats(); },
  });

  const enchargeSync = trpc.giveaway.syncToEncharge.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Encharge Sync Complete",
        description: `${data.successCount} synced, ${data.failCount} failed out of ${data.total} total`,
      });
      setSelectedIds(new Set());
    },
    onError: (err) => {
      toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = trpc.giveaway.updateStatus.useMutation({
    onSuccess: () => { refetchApps(); },
  });

  // Filter applications
  const filteredApplications = applications?.filter(app => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSearch = !searchQuery || 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.city?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate metrics
  const totalApplications = stats?.totalApplications || 0;
  const totalClicks = 390;
  const totalSpend = 166.94;
  const conversionRate = totalClicks > 0 ? (totalApplications / totalClicks * 100).toFixed(2) : "0.00";
  const costPerSubmission = totalApplications > 0 ? (totalSpend / totalApplications).toFixed(2) : "0.00";

  // Prepare chart data
  const ageRangeData = stats?.ageRangeDistribution ? Object.entries(stats.ageRangeDistribution).map(([range, count]) => ({
    name: range, value: count as number,
  })) : [];

  const genderData = stats?.genderDistribution ? Object.entries(stats.genderDistribution).map(([gender, count]) => ({
    name: gender, value: count as number,
  })) : [];

  const experienceData = stats?.golfExperienceDistribution ? Object.entries(stats.golfExperienceDistribution).map(([exp, count]) => ({
    name: exp.length > 20 ? exp.substring(0, 20) + "..." : exp, value: count as number,
  })) : [];

  // Drive Day prospect stats
  const prospects = driveDayData?.prospects || [];
  const highScoreProspects = prospects.filter(p => p.score >= 75);
  const medScoreProspects = prospects.filter(p => p.score >= 60 && p.score < 75);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = (ids: number[]) => {
    setSelectedIds(new Set(ids));
  };

  const handleSyncToEncharge = () => {
    if (selectedIds.size === 0) {
      toast({ title: "No prospects selected", description: "Select at least one prospect to sync", variant: "destructive" });
      return;
    }
    enchargeSync.mutate({ applicantIds: Array.from(selectedIds), tags: syncTags });
  };

  if (loadingApps || loadingStats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Annual Giveaway 2026</h1>
            <p className="text-muted-foreground text-sm">
              Track campaign performance and manage applications
              {lastSyncInfo && (
                <span className="ml-2 text-xs">• Auto-syncs daily at midnight CST</span>
              )}
            </p>
          </div>
          <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} size="sm">
            {syncMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Syncing...</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" />Refresh Data</>
            )}
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApplications}</div>
              <p className="text-xs text-muted-foreground">{stats?.test || 0} test entries excluded</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground">{totalApplications} / {totalClicks} clicks</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost per Submission</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${costPerSubmission}</div>
              <p className="text-xs text-muted-foreground">${totalSpend.toFixed(2)} total spend</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drive Day Prospects</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highScoreProspects.length}</div>
              <p className="text-xs text-muted-foreground">High-fit score ≥ 75</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Applications / Drive Day Targeting / Demographics */}
        <Tabs defaultValue="applications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="applications">Applications ({totalApplications})</TabsTrigger>
            <TabsTrigger value="driveday">
              Drive Day Targeting
              {highScoreProspects.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">{highScoreProspects.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Applications ── */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle>Applications</CardTitle>
                    <CardDescription>Manage and track all giveaway submissions</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Input
                      placeholder="Search name, email, city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-64"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="hidden lg:table-cell">City</TableHead>
                        <TableHead className="hidden lg:table-cell">Golf Exp.</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications && filteredApplications.length > 0 ? (
                        filteredApplications.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell className="font-medium">
                              {app.name}
                              <span className="block md:hidden text-xs text-muted-foreground">{app.email}</span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm">{app.email}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">{app.city || "-"}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">{app.golfExperience || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={
                                app.status === "completed" ? "default" :
                                app.status === "scheduled" ? "secondary" :
                                app.status === "contacted" ? "outline" : "destructive"
                              }>
                                {app.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">
                              {new Date(app.submissionTimestamp).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={app.status}
                                onValueChange={(val) => updateStatusMutation.mutate({ id: app.id, status: val as any })}
                              >
                                <SelectTrigger className="w-28 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="contacted">Contacted</SelectItem>
                                  <SelectItem value="scheduled">Scheduled</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="declined">Declined</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow key="empty-state">
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No applications found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 2: Drive Day Targeting ── */}
          <TabsContent value="driveday">
            <div className="space-y-4">
              {/* CTA Info */}
              <Card className="border-[#ffcb00]/30 bg-[#ffcb00]/5">
                <CardContent className="pt-5 pb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-lg">Drive Day Email Campaign</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Target giveaway applicants for <strong>PBGA Drive Day — $20 for 90 min session</strong> with Coach Chuck Lynch.
                        Also promote <strong>$9 for 1-hour bay trial</strong>.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectAll(highScoreProspects.map(p => p.id))}
                      >
                        Select Top {highScoreProspects.length}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSyncToEncharge}
                        disabled={selectedIds.size === 0 || enchargeSync.isPending}
                      >
                        {enchargeSync.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Syncing...</>
                        ) : (
                          <><Send className="mr-2 h-4 w-4" />Sync {selectedIds.size} to Encharge</>
                        )}
                      </Button>
                    </div>
                  </div>
                  {selectedIds.size > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-xs text-muted-foreground">Tags:</span>
                      {syncTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Score Summary */}
              <div className="grid gap-4 grid-cols-3">
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <div className="text-2xl font-bold text-[#5daf68]">{highScoreProspects.length}</div>
                    <p className="text-xs text-muted-foreground">High Fit (≥75)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <div className="text-2xl font-bold text-[#ef9253]">{medScoreProspects.length}</div>
                    <p className="text-xs text-muted-foreground">Medium Fit (60-74)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <div className="text-2xl font-bold text-muted-foreground">{prospects.length - highScoreProspects.length - medScoreProspects.length}</div>
                    <p className="text-xs text-muted-foreground">Lower Fit (&lt;60)</p>
                  </CardContent>
                </Card>
              </div>

              {/* Prospects Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Prospect List (Ranked by Fit Score)</CardTitle>
                  <CardDescription>
                    Scoring: Golf experience, venue familiarity, IL residency, indoor golf interest
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingProspects ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">
                              <Checkbox
                                checked={selectedIds.size === prospects.length && prospects.length > 0}
                                onCheckedChange={(checked) => {
                                  if (checked) selectAll(prospects.map(p => p.id));
                                  else setSelectedIds(new Set());
                                }}
                              />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden md:table-cell">Email</TableHead>
                            <TableHead className="hidden lg:table-cell">City</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead className="hidden md:table-cell">Fit Reasons</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {prospects.map((p) => (
                            <TableRow key={p.id} className={selectedIds.has(p.id) ? "bg-primary/5" : ""}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedIds.has(p.id)}
                                  onCheckedChange={() => toggleSelect(p.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {p.name}
                                <span className="block md:hidden text-xs text-muted-foreground">{p.email}</span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm">{p.email}</TableCell>
                              <TableCell className="hidden lg:table-cell text-sm">{p.city || "-"}</TableCell>
                              <TableCell>
                                <Badge variant={p.score >= 75 ? "default" : p.score >= 60 ? "secondary" : "outline"}
                                  className={p.score >= 75 ? "bg-[#5daf68] text-white" : p.score >= 60 ? "bg-[#ef9253]/20 text-[#ef9253]" : ""}
                                >
                                  {p.score}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex flex-wrap gap-1">
                                  {p.reasons.slice(0, 2).map((r, i) => (
                                    <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded">{r}</span>
                                  ))}
                                  {p.reasons.length > 2 && (
                                    <span className="text-xs text-muted-foreground">+{p.reasons.length - 2}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={p.status === "contacted" ? "outline" : p.status === "scheduled" ? "secondary" : "destructive"}>
                                  {p.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Tab 3: Demographics ── */}
          <TabsContent value="demographics">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Age Range Distribution</CardTitle>
                  <CardDescription>Applicants by age group</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={ageRangeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ageRangeData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gender Distribution</CardTitle>
                  <CardDescription>Applicants by gender</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={genderData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="var(--color-b2b-events)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Golf Experience</CardTitle>
                  <CardDescription>Experience level breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={experienceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="var(--color-trial-conversion)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
