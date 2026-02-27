import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Mail, Phone, Calendar, Upload, Users, CreditCard, MessageSquare, Trophy, Star, Award, DollarSign, Activity, History, TrendingDown, RotateCcw, BarChart3, AlertCircle, CheckCircle2, XCircle, PauseCircle, ArrowUpCircle, ArrowDownCircle, RefreshCw, CreditCard as CardIcon } from "lucide-react";
import { BoomerangMembersTab } from "@/components/tabs/BoomerangMembersTab";
import { EmailCapturesTab } from "@/components/tabs/EmailCapturesTab";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Members() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [emailFilter, setEmailFilter] = useState<string>("all");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const utils = trpc.useUtils();
  const importCSV = trpc.members.importFromCSV.useMutation({
    onSuccess: (result) => {
      toast.success(`Import complete! Matched: ${result.matched}, Created: ${result.created}, Skipped: ${result.skipped}`);
      if (result.errors.length > 0) {
        toast.error(`Errors: ${result.errors.slice(0, 3).join(', ')}`);
      }
      utils.members.list.invalidate();
      utils.members.getStats.invalidate();
      setImportDialogOpen(false);
      setImporting(false);
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
      setImporting(false);
    },
  });

  const syncAcuity = trpc.conversion.syncMemberAppointments.useMutation({
    onSuccess: (result) => {
      toast.success(`Appointment sync complete! ${result.newMembers} new members, ${result.newAppointments} new appointments, ${result.updatedAppointments} updated`);
      utils.members.list.invalidate();
      utils.members.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Appointment sync failed: ${error.message}`);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      importCSV.mutate({ csvData });
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setImporting(false);
    };
    reader.readAsText(file);
  };

  const { data: allMembersRaw, isLoading } = trpc.members.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    membershipTier: tierFilter !== "all" ? (tierFilter as any) : undefined,
  });
  // "All Members" = All-Access Aces + Swing Savers (excludes Pro unless explicitly filtered)
  const members = tierFilter === "all"
    ? (allMembersRaw || []).filter(m => m.membershipTier !== "golf_vx_pro")
    : allMembersRaw;

  const { data: stats } = trpc.members.getStats.useQuery();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      inactive: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getTierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      trial: "Trial",
      monthly: "Monthly",
      annual: "Annual",
      corporate: "Corporate",
      none: "None",
      all_access_aces: "All Access Aces",
      swing_savers: "Swing Savers",
      golf_vx_pro: "Golf VX Pro",
    };
    return labels[tier] || tier;
  };

  return (
    <div className="container py-8">
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            All Members
          </TabsTrigger>
          <TabsTrigger value="all-access-aces">
            <Trophy className="mr-2 h-4 w-4" />
            All-Access Aces
          </TabsTrigger>
          <TabsTrigger value="swing-savers">
            <Star className="mr-2 h-4 w-4" />
            Swing Savers
          </TabsTrigger>
          <TabsTrigger value="pro-members">
            <Award className="mr-2 h-4 w-4" />
            Pro Members
          </TabsTrigger>
          <TabsTrigger value="unclassified">
            <Activity className="mr-2 h-4 w-4" />
            Unclassified
          </TabsTrigger>
          <TabsTrigger value="duplicates">
            <Users className="mr-2 h-4 w-4" />
            Duplicates
          </TabsTrigger>
          <TabsTrigger value="boomerang">
            <CreditCard className="mr-2 h-4 w-4" />
            Boomerang Cards
          </TabsTrigger>
          <TabsTrigger value="email-leads">
            <Mail className="mr-2 h-4 w-4" />
            Email Leads
          </TabsTrigger>
          <TabsTrigger value="communications">
            <MessageSquare className="mr-2 h-4 w-4" />
            Communications
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Event History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Members</h1>
          <p className="text-muted-foreground mt-2">
            Manage your Golf VX members and their information
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => syncAcuity.mutate()}
            disabled={syncAcuity.isPending}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {syncAcuity.isPending ? "Syncing..." : "Sync from Acuity"}
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import from CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Members from Boomerangme</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with customer data from Boomerangme. The system will automatically match existing members and create new ones.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label htmlFor="csv-upload" className="block text-sm font-medium mb-2">
                    CSV File
                  </label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={importing}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Expected columns: name, email, phone, membership_tier, ltv, total_visits, card_status, rfm_segment
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Customer Members</CardDescription>
              <CardTitle className="text-3xl">{(stats.allAccessCount || 0) + (stats.swingSaversCount || 0)}</CardTitle>
              <p className="text-xs text-muted-foreground">AA: {stats.allAccessCount} · SS: {stats.swingSaversCount}</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Monthly MRR</CardDescription>
              <CardTitle className="text-3xl">
                ${(parseFloat((stats as any).allAccessMRR || '0') + parseFloat((stats as any).swingSaversMRR || '0')).toLocaleString('en-US', {maximumFractionDigits: 0})}
              </CardTitle>
              <p className="text-xs text-muted-foreground">From Boomerang payments</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pro Members</CardDescription>
              <CardTitle className="text-3xl">{stats.golfVxProCount}</CardTitle>
              <p className="text-xs text-muted-foreground">${parseFloat((stats as any).golfVxProMRR || (stats.golfVxProCount * 500).toString()).toLocaleString('en-US', {maximumFractionDigits: 0})} MRR</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total MRR (All Tiers)</CardDescription>
              <CardTitle className="text-3xl">
                ${(parseFloat((stats as any).allAccessMRR || '0') + parseFloat((stats as any).swingSaversMRR || '0') + parseFloat((stats as any).golfVxProMRR || (stats.golfVxProCount * 500).toString())).toLocaleString('en-US', {maximumFractionDigits: 0})}
              </CardTitle>
              <p className="text-xs text-muted-foreground">AA + SS + Pro</p>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Membership Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="all_access_aces">All Access Aces</SelectItem>
                <SelectItem value="swing_savers">Swing Savers</SelectItem>
                <SelectItem value="golf_vx_pro">Golf VX Pro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={emailFilter} onValueChange={setEmailFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Email Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Email Status</SelectItem>
                <SelectItem value="subscribed">Subscribed</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading members...
            </div>
          ) : !members || members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No members found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>LTV</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <Link href={`/members/${member.id}`}>
                        <span className="hover:underline cursor-pointer">
                          {member.name}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {member.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTierLabel(member.membershipTier)}</TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(member.joinDate), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      ${parseFloat(member.lifetimeValue).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/members/${member.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="all-access-aces">
          <TierMembersList tier="all_access_aces" label="All-Access Aces" color="yellow" icon={Trophy} description="Full unlimited bay access members — top tier." />
        </TabsContent>

        <TabsContent value="swing-savers">
          <TierMembersList tier="swing_savers" label="Swing Savers" color="blue" icon={Star} description="Value membership with bay access credits." />
        </TabsContent>

        <TabsContent value="pro-members">
          <ProMembersPanel />
        </TabsContent>

        <TabsContent value="unclassified">
          <UnclassifiedMembersPanel />
        </TabsContent>

        <TabsContent value="duplicates">
          <DuplicatesTab />
        </TabsContent>
        <TabsContent value="boomerang">
          <BoomerangMembersTab />
        </TabsContent>
        <TabsContent value="email-leads">
          <EmailCapturesTab />
        </TabsContent>
        <TabsContent value="communications">
          <CommunicationsHistoryTab />
        </TabsContent>
        <TabsContent value="history">
          <MembershipHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Duplicates Tab Component
function DuplicatesTab() {
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [primaryId, setPrimaryId] = useState<number | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

  const { data: duplicateGroups, isLoading, refetch } = trpc.members.findDuplicates.useQuery();
  const mergeMutation = trpc.members.mergeMembers.useMutation({
    onSuccess: () => {
      toast.success('Members merged successfully');
      setMergeDialogOpen(false);
      setSelectedGroup(null);
      setPrimaryId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Merge failed: ${error.message}`);
    },
  });

  const handleMergeClick = (group: any[]) => {
    setSelectedGroup(group);
    setPrimaryId(group[0].id);
    setMergeDialogOpen(true);
  };

  const handleConfirmMerge = () => {
    if (!primaryId || !selectedGroup) return;
    const duplicateIds = selectedGroup.filter((m: any) => m.id !== primaryId).map((m: any) => m.id);
    mergeMutation.mutate({ primaryId, duplicateIds });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const totalDuplicates = duplicateGroups?.reduce((sum, group) => sum + group.length - 1, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Duplicate Detection Summary
          </CardTitle>
          <CardDescription>
            Members with matching names or phone numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold">{duplicateGroups?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Duplicate Groups</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalDuplicates}</div>
              <div className="text-sm text-muted-foreground">Duplicate Records</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {duplicateGroups ? duplicateGroups.reduce((sum, g) => sum + g.length, 0) : 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Affected Members</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duplicate Groups */}
      {duplicateGroups && duplicateGroups.length > 0 ? (
        <div className="space-y-4">
          {duplicateGroups.map((group, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-lg">Duplicate Group {idx + 1}</CardTitle>
                <CardDescription>
                  {group.length} members with similar information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.map((member: any) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email || '-'}</TableCell>
                        <TableCell>{member.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.membershipTier || '-'}</TableCell>
                        <TableCell>{format(new Date(member.createdAt), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4">
                  <Button onClick={() => handleMergeClick(group)} variant="default">
                    Merge These Members
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Duplicates Found</h3>
            <p className="text-muted-foreground text-center">
              All member records appear to be unique
            </p>
          </CardContent>
        </Card>
      )}

      {/* Merge Confirmation Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Duplicate Members</DialogTitle>
            <DialogDescription>
              Select which member record to keep as the primary. Other records will be merged into this one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedGroup?.map((member: any) => (
              <div key={member.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="primary"
                  checked={primaryId === member.id}
                  onChange={() => setPrimaryId(member.id)}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {member.email || 'No email'} • {member.phone || 'No phone'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmMerge} disabled={!primaryId || mergeMutation.isPending}>
              {mergeMutation.isPending ? 'Merging...' : 'Confirm Merge'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Communications History Tab — shows all sent SMS/email logs
function CommunicationsHistoryTab() {
  const { data: logs, isLoading } = trpc.communication.getHistory.useQuery({ limit: 100 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Communications History</h2>
        <p className="text-sm text-muted-foreground">All sent SMS and email messages to members and leads</p>
      </div>
      <Card>
        <CardContent className="p-0">
          {!logs || logs.data.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No communications sent yet.</p>
              <p className="text-xs mt-1">Messages sent via member profiles will appear here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.data.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant={log.type === 'sms' ? 'default' : 'secondary'}>
                        {log.type?.toUpperCase() ?? 'SMS'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{log.recipientName || '—'}</div>
                      <div className="text-muted-foreground text-xs">{log.recipientPhone || log.recipientEmail || '—'}</div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{log.message || log.body || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === 'sent' || log.status === 'delivered' ? 'default' : 'destructive'}>
                        {log.status || 'sent'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.createdAt ? format(new Date(log.createdAt), 'MMM d, yyyy h:mm a') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tier Members List ──────────────────────────────────────────────────────
function TierMembersList({
  tier,
  label,
  color,
  icon: Icon,
  description,
}: {
  tier: string;
  label: string;
  color: string;
  icon: React.ElementType;
  description: string;
}) {
  const [search, setSearch] = useState("");
  const { data: members, isLoading } = trpc.members.list.useQuery({
    membershipTier: tier as any,
    search: search || undefined,
  });

  const accentColor = color === "yellow" ? "text-primary" : "text-[#76addc]";
  const bgColor = color === "yellow" ? "bg-primary/10" : "bg-[#76addc]/10";

  return (
    <div className="space-y-6">
      <div className={`rounded-xl p-6 ${bgColor} border`}>
        <div className="flex items-center gap-3 mb-1">
          <Icon className={`h-6 w-6 ${accentColor}`} />
          <h2 className="text-2xl font-bold">{label}</h2>
          <Badge variant="outline" className={`${accentColor} border-current`}>
            {members?.length ?? "—"} members
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${label} members...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : !members || members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Icon className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No {label} members found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>LTV</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <Link href={`/members/${member.id}`}>
                        <span className="hover:underline cursor-pointer">{member.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {member.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === "active" ? "default" : "secondary"}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(member.joinDate), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>${parseFloat(member.lifetimeValue).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/members/${member.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Unclassified Members Panel ─────────────────────────────────────────────
function UnclassifiedMembersPanel() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [targetTier, setTargetTier] = useState<string>("");
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();

  const { data: members, isLoading } = trpc.members.list.useQuery({ membershipTier: "none" as any });
  const bulkReclassify = trpc.members.bulkReclassify.useMutation({
    onSuccess: (res) => {
      toast.success(`${res.updatedCount} member${res.updatedCount !== 1 ? 's' : ''} reclassified to ${getTierLabel(targetTier)}`);
      setSelected(new Set());
      setTargetTier("");
      utils.members.list.invalidate();
      utils.members.getStats.invalidate();
    },
    onError: (err) => toast.error(`Reclassify failed: ${err.message}`),
  });

  const getTierLabel = (t: string) => ({
    all_access_aces: "All-Access Aces",
    swing_savers: "Swing Savers",
    golf_vx_pro: "Golf VX Pro (Coach)",
    none: "Unclassified",
  }[t] || t);

  const filtered = (members || []).filter(m =>
    !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every(m => selected.has(m.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(m => m.id)));
  };
  const toggle = (id: number) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl p-6 bg-[#ef9253]/10 border border-[#ef9253]/30">
        <div className="flex items-center gap-3 mb-1">
          <Activity className="h-6 w-6 text-[#ef9253]" />
          <h2 className="text-2xl font-bold">Unclassified Members</h2>
          <Badge variant="outline" className="text-[#ef9253] border-[#ef9253]/60">
            {members?.length ?? "—"} members
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Members with no assigned tier. Select one or more and assign them to All-Access Aces, Swing Savers, or Pro Members in bulk. Use this panel during the Wednesday HQ review.
        </p>
      </div>

      {/* Bulk action bar */}
      <Card className="border-dashed">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">
              {selected.size > 0 ? `${selected.size} selected` : "Select members below to reclassify"}
            </span>
            <Select value={targetTier} onValueChange={setTargetTier} disabled={selected.size === 0}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Assign tier..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_access_aces">All-Access Aces ($325/mo)</SelectItem>
                <SelectItem value="swing_savers">Swing Savers ($225/mo)</SelectItem>
                <SelectItem value="golf_vx_pro">Golf VX Pro — Coach ($500/mo)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              disabled={selected.size === 0 || !targetTier || bulkReclassify.isPending}
              onClick={() => bulkReclassify.mutate({ memberIds: Array.from(selected), newTier: targetTier as any })}
              className="bg-[#ef9253] hover:bg-[#ef9253]/90 text-white"
            >
              {bulkReclassify.isPending ? "Saving..." : `Reclassify ${selected.size > 0 ? selected.size : ''}`}
            </Button>
            {selected.size > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search unclassified members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No unclassified members found.</p>
              <p className="text-xs mt-1">All members have been assigned to a tier.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="cursor-pointer" />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>LTV</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(member => (
                  <TableRow key={member.id} className={selected.has(member.id) ? "bg-[#ef9253]/10" : ""}>
                    <TableCell>
                      <input type="checkbox" checked={selected.has(member.id)} onChange={() => toggle(member.id)} className="cursor-pointer" />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/members/${member.id}`}>
                        <span className="hover:underline cursor-pointer">{member.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{member.email || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{member.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={member.status === "active" ? "default" : "secondary"}>{member.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(member.joinDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-sm">${parseFloat(member.lifetimeValue).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/members/${member.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Pro Members Panel ───────────────────────────────────────────────────────
function ProMembersPanel() {
  const { data: members, isLoading } = trpc.members.list.useQuery({
    membershipTier: "golf_vx_pro" as any,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl p-6 bg-[#a87fbe]/10 border border-[#a87fbe]/30">
        <div className="flex items-center gap-3 mb-1">
          <Award className="h-6 w-6 text-[#a87fbe]" />
          <h2 className="text-2xl font-bold">Pro Members</h2>
          <Badge variant="outline" className="text-[#a87fbe] border-[#a87fbe]/60">
            {members?.length ?? "—"} coaches
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          PGA/independent golf coaches with Pro Membership. Managed separately from regular members.
        </p>
      </div>

      {/* Billing Structure Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#a87fbe]/40">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Monthly Base Fee
            </CardDescription>
            <CardTitle className="text-3xl text-[#a87fbe]">$500</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Per coach per month</p>
          </CardContent>
        </Card>
        <Card className="border-[#a87fbe]/40">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <Activity className="h-3 w-3" /> Bay Usage Credit
            </CardDescription>
            <CardTitle className="text-3xl text-[#a87fbe]">$25</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Deducted per coaching session (up to 20/mo)</p>
          </CardContent>
        </Card>
        <Card className="border-[#a87fbe]/40">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Overage Rate
            </CardDescription>
            <CardTitle className="text-3xl text-[#a87fbe]">$25/hr</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Charged for sessions beyond 20/month</p>
          </CardContent>
        </Card>
      </div>

      {/* Note about Stripe */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300">
        <strong>Note:</strong> Pro membership billing is processed via Stripe (not Toast). Stripe integration is pending — billing data will be available once connected next week.
      </div>

      {/* Pro Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Pro Coaches</CardTitle>
          <CardDescription>
            All coaches with active Pro Membership. Chuck Lynch (PBGA Lead Coach) runs Drive Day, Winter Clinics, and Summer Camp programs.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : !members || members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No Pro Members found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const isChuck = member.name?.toLowerCase().includes("chuck lynch");
                  return (
                    <TableRow key={member.id} className={isChuck ? "bg-yellow-50/50 dark:bg-yellow-950/10" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Link href={`/members/${member.id}`}>
                            <span className="hover:underline cursor-pointer">{member.name}</span>
                          </Link>
                          {isChuck && (
                            <Badge className="bg-yellow-500 text-black text-xs">PBGA Lead</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          {member.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[#a87fbe] border-[#a87fbe]/60">
                          {isChuck ? "Lead Coach (PBGA)" : "Pro Coach"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === "active" ? "default" : "secondary"}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(member.joinDate), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/members/${member.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Stripe Payment Tracking */}
      <ProMemberBillingSection />
    </div>
  );
}

function ProMemberBillingSection() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [billingMonth, setBillingMonth] = useState(currentMonth);
  const { data: billSummary, isLoading } = trpc.proMembers.getMonthlyBillSummary.useQuery({ billingMonth });

  const totalNetBill = billSummary?.reduce((sum, b) => sum + b.netBill, 0) ?? 0;
  const pendingCount = billSummary?.filter(b => b.stripeStatus === 'pending').length ?? 0;
  const paidCount = (billSummary?.length ?? 0) - pendingCount;

  const statusColor = (s: string) => {
    if (s === 'paid') return 'bg-green-100 text-green-700 border-green-200';
    if (s === 'failed') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#a87fbe]" />
            Stripe Payment Tracking
          </h3>
          <p className="text-sm text-muted-foreground">Monthly billing per Pro coach — separate from Toast POS revenue</p>
        </div>
        <input
          type="month"
          value={billingMonth}
          onChange={e => setBillingMonth(e.target.value)}
          className="text-sm border rounded-md px-3 py-1.5 bg-background text-foreground"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-[#a87fbe]/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Net Bill</p>
            <p className="text-2xl font-bold text-[#a87fbe]">${totalNetBill.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">for {billingMonth}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-300/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending Stripe</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">awaiting payment</p>
          </CardContent>
        </Card>
        <Card className="border-green-300/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-green-600">{paidCount}</p>
            <p className="text-xs text-muted-foreground mt-1">confirmed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Per-Coach Breakdown — {billingMonth}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Loading billing data...</div>
          ) : !billSummary || billSummary.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No Pro members found for this month.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coach</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Bay Credit</TableHead>
                  <TableHead className="text-right">Overage</TableHead>
                  <TableHead className="text-right font-semibold">Net Bill</TableHead>
                  <TableHead className="text-center">Stripe Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billSummary.map((b) => (
                  <TableRow key={b.memberId}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{b.memberName}</p>
                        <p className="text-xs text-muted-foreground">{b.memberEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">${b.baseFee}</TableCell>
                    <TableCell className="text-right">{b.sessionCount} sessions</TableCell>
                    <TableCell className="text-right text-green-600">-${b.bayCreditTotal}</TableCell>
                    <TableCell className="text-right text-red-500">{b.overageAmount > 0 ? `+$${b.overageAmount}` : "—"}</TableCell>
                    <TableCell className="text-right font-bold">${b.netBill.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor(b.stripeStatus)}`}>
                        {b.stripeStatus === "paid" ? "✓ Paid" : b.stripeStatus === "failed" ? "✗ Failed" : "⏳ Pending"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-300">
        <strong>Stripe Integration:</strong> Once Stripe is connected next week, payment status will update automatically. Each coach pays $500/mo base minus $25 per coaching session (up to 20 sessions), plus $25/hr overage beyond 20 sessions.
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Membership Event History Tab
// ---------------------------------------------------------------------------
function MembershipHistoryTab() {
  const [activeView, setActiveView] = useState<"timeline" | "churned" | "winback" | "summary">("timeline");
  const [searchEmail, setSearchEmail] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");

  const summaryQuery = trpc.members.getEventSummary.useQuery({ days: 30 });
  const churnedQuery = trpc.members.getChurnedMembers.useQuery();
  const winbackQuery = trpc.members.getWinbackOpportunities.useQuery({ withinDays: 90 });
  const historyQuery = trpc.members.getHistoryByEmail.useQuery(
    { email: debouncedEmail },
    { enabled: !!debouncedEmail && debouncedEmail.includes("@") }
  );

  function handleSearch() {
    setDebouncedEmail(searchEmail.trim());
  }

  const EVENT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    joined:            { label: "Joined",            color: "bg-green-500/10 text-green-600 border-green-200",    icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
    cancelled:         { label: "Cancelled",         color: "bg-red-500/10 text-red-600 border-red-200",          icon: <XCircle className="h-4 w-4 text-red-500" /> },
    upgraded:          { label: "Upgraded",          color: "bg-blue-500/10 text-blue-600 border-blue-200",       icon: <ArrowUpCircle className="h-4 w-4 text-blue-500" /> },
    downgraded:        { label: "Downgraded",        color: "bg-orange-500/10 text-orange-600 border-orange-200", icon: <ArrowDownCircle className="h-4 w-4 text-orange-500" /> },
    paused:            { label: "Paused",            color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", icon: <PauseCircle className="h-4 w-4 text-yellow-500" /> },
    resumed:           { label: "Resumed",           color: "bg-teal-500/10 text-teal-600 border-teal-200",       icon: <RefreshCw className="h-4 w-4 text-teal-500" /> },
    tier_changed:      { label: "Tier Changed",      color: "bg-purple-500/10 text-purple-600 border-purple-200", icon: <RotateCcw className="h-4 w-4 text-purple-500" /> },
    payment_failed:    { label: "Payment Failed",    color: "bg-red-500/10 text-red-600 border-red-200",          icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
    payment_recovered: { label: "Payment Recovered", color: "bg-green-500/10 text-green-600 border-green-200",    icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
    renewed:           { label: "Renewed",           color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", icon: <RefreshCw className="h-4 w-4 text-emerald-500" /> },
  };

  const TIER_LABELS: Record<string, string> = {
    all_access_aces: "All Access Ace",
    swing_savers: "Swing Saver",
    golf_vx_pro: "Pro Member",
    trial: "Trial",
    none: "None",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Membership Event History</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Full lifecycle tracking — joined, cancelled, upgraded, churned, and win-back opportunities
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Webhook: /api/webhooks/boomerang-membership
        </Badge>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: "timeline", label: "Member Timeline", icon: <History className="h-4 w-4" /> },
          { key: "summary",  label: "Event Summary",   icon: <BarChart3 className="h-4 w-4" /> },
          { key: "churned",  label: "Churned Members", icon: <TrendingDown className="h-4 w-4" /> },
          { key: "winback",  label: "Win-Back (90d)",  icon: <RotateCcw className="h-4 w-4" /> },
        ].map(v => (
          <Button
            key={v.key}
            variant={activeView === v.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView(v.key as any)}
            className="flex items-center gap-1.5"
          >
            {v.icon}
            {v.label}
          </Button>
        ))}
      </div>

      {activeView === "timeline" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter member email to view their history..."
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="max-w-md"
            />
            <Button onClick={handleSearch} size="sm">
              <Search className="h-4 w-4 mr-1" /> Search
            </Button>
          </div>
          {!debouncedEmail && (
            <div className="text-center py-16 text-muted-foreground border rounded-lg">
              <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Enter a member email to view their full event timeline</p>
              <p className="text-sm mt-1">All membership lifecycle events are tracked here</p>
            </div>
          )}
          {debouncedEmail && historyQuery.isLoading && (
            <div className="text-center py-12 text-muted-foreground">Loading history...</div>
          )}
          {debouncedEmail && !historyQuery.isLoading && historyQuery.data && historyQuery.data.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No events found for <strong>{debouncedEmail}</strong></p>
              <p className="text-sm mt-1">Events are logged automatically when Make.com sends a webhook</p>
            </div>
          )}
          {historyQuery.data && historyQuery.data.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {historyQuery.data.length} event{historyQuery.data.length !== 1 ? "s" : ""} for <strong>{debouncedEmail}</strong>
              </p>
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {historyQuery.data.map((event: any) => {
                    const cfg = EVENT_CONFIG[event.eventType] ?? { label: event.eventType, color: "bg-muted", icon: <Activity className="h-4 w-4" /> };
                    return (
                      <div key={event.id} className="relative flex gap-4 pl-10">
                        <div className="absolute left-3 top-2 w-4 h-4 rounded-full bg-background border-2 border-border flex items-center justify-center">
                          {cfg.icon}
                        </div>
                        <div className={`flex-1 rounded-lg border p-3 ${cfg.color}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-semibold text-sm">{cfg.label}</span>
                              {event.tier && (
                                <span className="ml-2 text-xs opacity-70">
                                  to {TIER_LABELS[event.tier] ?? event.tier}
                                  {event.plan && ` (${event.plan})`}
                                  {event.amount && ` - $${event.amount}/mo`}
                                </span>
                              )}
                              {event.previousTier && (
                                <span className="ml-2 text-xs opacity-60">
                                  from {TIER_LABELS[event.previousTier] ?? event.previousTier}
                                </span>
                              )}
                            </div>
                            <div className="text-right text-xs opacity-60 shrink-0">
                              <div>{new Date(event.eventTimestamp).toLocaleDateString()}</div>
                              <div>{new Date(event.eventTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                            </div>
                          </div>
                          {event.notes && <p className="text-xs mt-1 opacity-70">{event.notes}</p>}
                          <div className="flex items-center gap-3 mt-1.5 text-xs opacity-50">
                            <span>Source: {event.source}</span>
                            {event.enchargeTagged && <span className="text-green-600">Encharge synced</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === "summary" && (
        <div className="space-y-4">
          <h3 className="font-semibold">Last 30 Days - Event Breakdown</h3>
          {summaryQuery.isLoading && <div className="text-muted-foreground">Loading...</div>}
          {summaryQuery.data && summaryQuery.data.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No events logged yet. Events will appear once Make.com starts sending webhooks.</p>
            </div>
          )}
          {summaryQuery.data && summaryQuery.data.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {summaryQuery.data.map((row: any) => {
                const cfg = EVENT_CONFIG[row.eventType] ?? { label: row.eventType, color: "bg-muted border-border", icon: <Activity className="h-5 w-5" /> };
                return (
                  <div key={row.eventType} className={`rounded-lg border p-4 ${cfg.color}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {cfg.icon}
                      <span className="text-sm font-medium">{cfg.label}</span>
                    </div>
                    <div className="text-2xl font-bold">{row.count}</div>
                    <div className="text-xs opacity-60">events this month</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeView === "churned" && (
        <div className="space-y-4">
          <h3 className="font-semibold">All Churned Members</h3>
          {churnedQuery.isLoading && <div className="text-muted-foreground">Loading...</div>}
          {churnedQuery.data && churnedQuery.data.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No churned members on record</p>
            </div>
          )}
          {churnedQuery.data && churnedQuery.data.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Member</th>
                    <th className="text-left p-3 font-medium">Tier</th>
                    <th className="text-left p-3 font-medium">Plan</th>
                    <th className="text-left p-3 font-medium">Cancelled</th>
                    <th className="text-left p-3 font-medium">Days Ago</th>
                  </tr>
                </thead>
                <tbody>
                  {churnedQuery.data.map((m: any, i: number) => (
                    <tr key={m.email} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="p-3">
                        <div className="font-medium">{m.name ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </td>
                      <td className="p-3">{m.tier ? (TIER_LABELS[m.tier] ?? m.tier) : "-"}</td>
                      <td className="p-3 capitalize">{m.plan ?? "-"}</td>
                      <td className="p-3">{new Date(m.cancelledAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Badge variant={m.daysSinceCancellation <= 30 ? "destructive" : "secondary"} className="text-xs">
                          {m.daysSinceCancellation}d
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeView === "winback" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">Win-Back Opportunities</h3>
            <Badge variant="outline" className="text-xs">Cancelled within 90 days</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Members who cancelled recently are the highest-probability targets for re-engagement campaigns.
          </p>
          {winbackQuery.isLoading && <div className="text-muted-foreground">Loading...</div>}
          {winbackQuery.data && winbackQuery.data.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No win-back opportunities in the last 90 days</p>
            </div>
          )}
          {winbackQuery.data && winbackQuery.data.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Member</th>
                    <th className="text-left p-3 font-medium">Former Tier</th>
                    <th className="text-left p-3 font-medium">Plan</th>
                    <th className="text-left p-3 font-medium">Cancelled</th>
                    <th className="text-left p-3 font-medium">Days Ago</th>
                    <th className="text-left p-3 font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {winbackQuery.data.map((m: any, i: number) => {
                    const priority = m.daysSinceCancellation <= 14 ? "High" : m.daysSinceCancellation <= 45 ? "Medium" : "Low";
                    const priorityColor = priority === "High" ? "destructive" : priority === "Medium" ? "default" : "secondary";
                    return (
                      <tr key={m.email} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="p-3">
                          <div className="font-medium">{m.name ?? "-"}</div>
                          <div className="text-xs text-muted-foreground">{m.email}</div>
                        </td>
                        <td className="p-3">{m.tier ? (TIER_LABELS[m.tier] ?? m.tier) : "-"}</td>
                        <td className="p-3 capitalize">{m.plan ?? "-"}</td>
                        <td className="p-3">{new Date(m.cancelledAt).toLocaleDateString()}</td>
                        <td className="p-3">{m.daysSinceCancellation}d</td>
                        <td className="p-3">
                          <Badge variant={priorityColor as any} className="text-xs">{priority}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-dashed p-4 bg-muted/30">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Make.com Webhook Configuration
        </h4>
        <div className="text-xs text-muted-foreground space-y-1 font-mono">
          <div><span className="text-foreground font-semibold">URL:</span> https://golfvx-dash-a5gjfitc.manus.space/api/webhooks/boomerang-membership</div>
          <div><span className="text-foreground font-semibold">Method:</span> POST</div>
          <div><span className="text-foreground font-semibold">Header:</span> x-webhook-secret: golfvx_boomerang_2026</div>
          <div><span className="text-foreground font-semibold">Required:</span> email, eventType</div>
          <div><span className="text-foreground font-semibold">Optional:</span> name, tier, plan, amount, previousTier, previousPlan, timestamp, notes</div>
          <div><span className="text-foreground font-semibold">Event types:</span> joined | cancelled | upgraded | downgraded | paused | resumed | tier_changed | payment_failed | payment_recovered | renewed</div>
          <div><span className="text-foreground font-semibold">Tier values:</span> all_access_aces | swing_savers | golf_vx_pro | trial | none</div>
        </div>
      </div>
    </div>
  );
}
