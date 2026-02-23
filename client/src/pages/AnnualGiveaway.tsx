import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnnualGiveaway() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: applications, isLoading: loadingApps, refetch: refetchApps } = trpc.giveaway.getApplications.useQuery();
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = trpc.giveaway.getStats.useQuery();
  const { data: lastSyncInfo } = trpc.giveaway.getLastSyncInfo.useQuery();
  const syncMutation = trpc.giveaway.sync.useMutation({
    onSuccess: () => {
      refetchApps();
      refetchStats();
    },
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
  const totalClicks = 390; // From Meta ads analysis
  const totalSpend = 166.94; // From Meta ads analysis
  const conversionRate = totalClicks > 0 ? (totalApplications / totalClicks * 100).toFixed(2) : "0.00";
  const costPerSubmission = totalApplications > 0 ? (totalSpend / totalApplications).toFixed(2) : "0.00";

  // Prepare chart data
  const ageRangeData = stats?.ageRangeDistribution ? Object.entries(stats.ageRangeDistribution).map(([range, count]) => ({
    name: range,
    value: count as number,
  })) : [];

  const genderData = stats?.genderDistribution ? Object.entries(stats.genderDistribution).map(([gender, count]) => ({
    name: gender,
    value: count as number,
  })) : [];

  const experienceData = stats?.golfExperienceDistribution ? Object.entries(stats.golfExperienceDistribution).map(([exp, count]) => ({
    name: exp.length > 20 ? exp.substring(0, 20) + "..." : exp,
    value: count as number,
  })) : [];

  if (loadingApps || loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Annual Giveaway 2026</h1>
            <p className="text-muted-foreground">
              Track campaign performance and manage applications
              {lastSyncInfo && (
                <span className="ml-2 text-xs">
                  • Auto-syncs daily at midnight CST
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending || loadingApps || loadingStats}>
            {(syncMutation.isPending || loadingApps || loadingStats) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </>
            )}
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApplications}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.test || 0} test entries excluded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {totalApplications} / {totalClicks} clicks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost per Submission</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${costPerSubmission}</div>
              <p className="text-xs text-muted-foreground">
                ${totalSpend.toFixed(2)} total spend
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campaign Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2 Active</div>
              <p className="text-xs text-muted-foreground">
                A1 Local + A2 Social/Family
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demographics Charts */}
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
                    {ageRangeData.map((entry, index) => (
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
                  <Bar dataKey="value" fill="#3b82f6" />
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
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Applications</CardTitle>
                <CardDescription>Manage and track all giveaway submissions</CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, email, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Age Range</TableHead>
                  <TableHead>Golf Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications && filteredApplications.length > 0 ? (
                  filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.name}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>{app.phone || "-"}</TableCell>
                      <TableCell>{app.city || "-"}</TableCell>
                      <TableCell>{app.ageRange || "-"}</TableCell>
                      <TableCell>{app.golfExperience || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            app.status === "completed"
                              ? "default"
                              : app.status === "scheduled"
                              ? "secondary"
                              : app.status === "contacted"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(app.submissionTimestamp).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow key="empty-state">
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No applications found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
  );
}
