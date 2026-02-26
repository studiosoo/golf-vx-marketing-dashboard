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
import { Plus, Search, Mail, Phone, Calendar, Upload, Users, CreditCard, MessageSquare, Trophy, Star, Award, DollarSign, Activity } from "lucide-react";
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

  const { data: members, isLoading } = trpc.members.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    membershipTier: tierFilter !== "all" ? (tierFilter as any) : undefined,
  });

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
              <CardDescription>Total Members</CardDescription>
              <CardTitle className="text-3xl">{stats.totalMembers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Members</CardDescription>
              <CardTitle className="text-3xl">{stats.activeMembers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Lifetime Value</CardDescription>
              <CardTitle className="text-3xl">
                ${parseFloat(stats.totalLifetimeValue || "0").toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg. LTV</CardDescription>
              <CardTitle className="text-3xl">
                ${stats.totalMembers > 0
                  ? (parseFloat(stats.totalLifetimeValue || "0") / stats.totalMembers).toFixed(0)
                  : "0"}
              </CardTitle>
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
    </div>
  );
}
