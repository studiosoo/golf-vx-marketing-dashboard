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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, RefreshCw, TrendingUp, Users, DollarSign, Target, Mail, Send, CheckCircle2, AlertCircle, FileText, Copy, UserCheck, UserX, Zap, Clock, ArrowRight, Activity } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['var(--color-trial-conversion)', 'var(--color-b2b-events)', 'var(--color-primary)', 'var(--color-membership-growth)', 'var(--color-member-retention)'];

export default function AnnualGiveaway() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [syncTags, setSyncTags] = useState<string[]>(["giveaway-2026", "drive-day-prospect"]);
  const { toast } = useToast();

  const { data: applications, isLoading: loadingApps, refetch: refetchApps } = trpc.giveaway.getApplications.useQuery(undefined, { refetchInterval: 30000 });
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = trpc.giveaway.getStats.useQuery(undefined, { refetchInterval: 30000 });
  const { data: lastSyncInfo } = trpc.giveaway.getLastSyncInfo.useQuery(undefined, { refetchInterval: 30000 });
  const { data: driveDayData, isLoading: loadingProspects } = trpc.giveaway.getDriveDayProspects.useQuery(undefined, { refetchInterval: 60000 });
  
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

  // Email draft modal state
  const [emailDraftModal, setEmailDraftModal] = useState<{ open: boolean; applicantId: number | null; draft: any | null }>({
    open: false, applicantId: null, draft: null,
  });
  const [visitHistoryModal, setVisitHistoryModal] = useState<{ open: boolean; applicantId: number | null }>({
    open: false, applicantId: null,
  });

  const generateEmailDraft = trpc.giveaway.generateEmailDraft.useMutation({
    onSuccess: (draft) => {
      setEmailDraftModal(prev => ({ ...prev, draft }));
    },
    onError: (err) => {
      toast({ title: 'Draft generation failed', description: err.message, variant: 'destructive' });
    },
  });

  const { data: visitHistory } = trpc.giveaway.checkVisitHistory.useQuery(
    { applicantId: visitHistoryModal.applicantId! },
    { enabled: visitHistoryModal.open && visitHistoryModal.applicantId !== null }
  );

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
            <TabsTrigger value="daily" className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              Daily Plan
            </TabsTrigger>
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
                              <div className="flex items-center gap-1 flex-wrap">
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => {
                                    setEmailDraftModal({ open: true, applicantId: app.id, draft: null });
                                    generateEmailDraft.mutate({ applicantId: app.id });
                                  }}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Draft Email
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => setVisitHistoryModal({ open: true, applicantId: app.id })}
                                >
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  History
                                </Button>
                              </div>
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

          {/* ── Tab 4: Daily Dashboard ── */}
          <TabsContent value="daily">
            <GiveawayDailyDashboard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Email Draft Modal */}
      <Dialog open={emailDraftModal.open} onOpenChange={(open) => setEmailDraftModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#ffcb00]" />
              AI Email Draft
              {emailDraftModal.draft?.isNewVisitor !== undefined && (
                <Badge variant={emailDraftModal.draft.isNewVisitor ? 'secondary' : 'default'} className="ml-2 text-xs">
                  {emailDraftModal.draft.isNewVisitor ? 'New Visitor' : 'Returning Visitor'}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {generateEmailDraft.isPending ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#ffcb00]" />
              <span className="ml-3 text-muted-foreground">Generating personalized email draft...</span>
            </div>
          ) : emailDraftModal.draft ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Subject Line</p>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{emailDraftModal.draft.subject}</p>
                    <Button variant="ghost" size="sm" className="h-7 px-2 shrink-0" onClick={() => { navigator.clipboard.writeText(emailDraftModal.draft.subject); toast({ title: 'Copied!' }); }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Preheader</p>
                  <p className="text-sm text-muted-foreground italic">{emailDraftModal.draft.preheader}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Email Body</p>
                  <div className="bg-muted/30 rounded p-3 text-sm whitespace-pre-wrap">{emailDraftModal.draft.body}</div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Call to Action</p>
                  <p className="text-sm font-medium text-[#ffcb00]">{emailDraftModal.draft.cta}</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  const full = `Subject: ${emailDraftModal.draft.subject}\nPreheader: ${emailDraftModal.draft.preheader}\n\n${emailDraftModal.draft.body}\n\nCTA: ${emailDraftModal.draft.cta}`;
                  navigator.clipboard.writeText(full);
                  toast({ title: 'Full email copied to clipboard!' });
                }}>
                  <Copy className="h-4 w-4 mr-2" /> Copy Full Email
                </Button>
                <Button onClick={() => setEmailDraftModal({ open: false, applicantId: null, draft: null })}>
                  Done
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Visit History Modal */}
      <Dialog open={visitHistoryModal.open} onOpenChange={(open) => setVisitHistoryModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-[#ffcb00]" />
              Visit History
            </DialogTitle>
          </DialogHeader>
          {visitHistory ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg border">
                {visitHistory.hasVisited ? (
                  <UserCheck className="h-8 w-8 text-green-500" />
                ) : (
                  <UserX className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  <p className="font-semibold">{visitHistory.hasVisited ? 'Has visited Golf VX' : 'New to Golf VX'}</p>
                  <p className="text-sm text-muted-foreground">
                    {visitHistory.visitCount > 0 ? `${visitHistory.visitCount} recorded visits` : 'No recorded visits in system'}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Self-reported:</span>
                  <span>{visitHistory.selfReported}</span>
                </div>
                {visitHistory.memberTier && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member tier:</span>
                    <Badge variant="outline">{visitHistory.memberTier}</Badge>
                  </div>
                )}
                {visitHistory.memberStatus && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member status:</span>
                    <span>{visitHistory.memberStatus}</span>
                  </div>
                )}
                {visitHistory.lastVisit && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last visit:</span>
                    <span>{new Date(visitHistory.lastVisit).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}


function GiveawayDailyDashboard() {
  const { data, isLoading, refetch } = trpc.giveaway.getDailyDashboard.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes — LLM call is expensive
  });

  const statusConfig = {
    critical: { color: 'border-red-500 bg-red-50 dark:bg-red-950/20', badge: 'bg-red-500 text-white', label: 'Critical' },
    behind: { color: 'border-amber-500 bg-amber-50 dark:bg-amber-950/20', badge: 'bg-amber-500 text-white', label: 'Behind' },
    on_track: { color: 'border-green-500 bg-green-50 dark:bg-green-950/20', badge: 'bg-green-500 text-white', label: 'On Track' },
    ahead: { color: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20', badge: 'bg-blue-500 text-white', label: 'Ahead' },
  };

  const categoryIcon: Record<string, React.ReactNode> = {
    Instagram: <Activity className="h-4 w-4 text-pink-500" />,
    Email: <Mail className="h-4 w-4 text-blue-500" />,
    'In-Person': <Users className="h-4 w-4 text-green-500" />,
    'Drive Day': <Target className="h-4 w-4 text-[#ffcb00]" />,
    'Follow-Up': <ArrowRight className="h-4 w-4 text-purple-500" />,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#ffcb00]" />
        <p className="text-muted-foreground text-sm">Generating your daily action plan...</p>
        <p className="text-xs text-muted-foreground">AI is analyzing your current progress vs. goal</p>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-muted-foreground">No data available.</div>;

  const status = statusConfig[data.statusLevel] || statusConfig.on_track;
  const plan = data.actionPlan;

  return (
    <div className="space-y-6">
      {/* Header + Status */}
      <div className={`rounded-xl border-2 p-5 ${status.color}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5" />
              <h2 className="text-xl font-bold">Today's Action Plan</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${status.badge}`}>{status.label}</span>
            </div>
            <p className="text-sm font-medium">{plan?.todayFocus}</p>
            <p className="text-xs text-muted-foreground mt-1">{plan?.urgencyMessage}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Progress Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Applications</p>
            <p className="text-2xl font-bold">{data.current} <span className="text-sm text-muted-foreground">/ {data.goal}</span></p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-[#ffcb00] rounded-full" style={{ width: `${data.progressPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{data.progressPct.toFixed(1)}% to goal</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Daily Average</p>
            <p className="text-2xl font-bold">{data.dailyAvg.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">apps/day so far</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Required Rate</p>
            <p className="text-2xl font-bold">{data.requiredDailyRate.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">apps/day needed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Days Remaining</p>
            <p className="text-2xl font-bold">{data.daysRemaining}</p>
            <p className="text-xs text-muted-foreground">{data.remaining} apps still needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Win Banner */}
      {plan?.quickWin && (
        <div className="rounded-lg border border-[#ffcb00]/50 bg-[#ffcb00]/10 p-4 flex items-start gap-3">
          <Zap className="h-5 w-5 text-[#ffcb00] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Do this right now (5 min)</p>
            <p className="text-sm">{plan.quickWin}</p>
          </div>
        </div>
      )}

      {/* Action Items */}
      <div>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Today's Prioritized Actions
        </h3>
        <div className="space-y-3">
          {(plan?.actions || []).map((action: any) => (
            <div key={action.priority} className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-sm font-bold shrink-0">
                {action.priority}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {categoryIcon[action.category] || <ArrowRight className="h-4 w-4" />}
                  <span className="text-sm font-semibold">{action.category}</span>
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <Clock className="h-3 w-3" />{action.timeRequired}
                  </span>
                </div>
                <p className="text-sm">{action.action}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Expected: {action.expectedImpact}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Milestone */}
      {plan?.weeklyMilestone && (
        <Card className="border-dashed">
          <CardContent className="p-4 flex items-start gap-3">
            <Target className="h-5 w-5 text-[#ffcb00] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Weekly Milestone</p>
              <p className="text-sm text-muted-foreground">{plan.weeklyMilestone}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-right">
        Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
      </p>
    </div>
  );
}
