import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, FileText, UserCheck, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmailDraftModal } from "./EmailDraftModal";
import { VisitHistoryModal } from "./VisitHistoryModal";

interface Application {
  id: number;
  name: string;
  email: string;
  city?: string | null;
  ageRange?: string | null;
  gender?: string | null;
  golfExperienceLevel?: string | null;
  submittedAt?: string | Date | null;
  status?: string | null;
}

interface ApplicationsTabProps {
  applications: Application[] | undefined;
  totalApplications: number;
  onStatusChange: (id: number, status: string) => void;
}

export function ApplicationsTab({ applications, totalApplications, onStatusChange }: ApplicationsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [emailDraftModal, setEmailDraftModal] = useState<{ open: boolean; applicantId: number | null; draft: any | null }>({
    open: false,
    applicantId: null,
    draft: null,
  });
  const [visitHistoryModal, setVisitHistoryModal] = useState<{ open: boolean; applicantId: number | null }>({
    open: false,
    applicantId: null,
  });
  const { toast } = useToast();

  const enchargeSync = trpc.giveaway.syncToEncharge.useMutation({
    onSuccess: (data) => {
      toast({ title: "Encharge Sync Complete", description: `${data.synced} synced, ${data.errors} failed` });
      setSelectedIds(new Set());
    },
    onError: (err) => toast({ title: "Sync Failed", description: err.message, variant: "destructive" }),
  });

  const generateEmailDraft = trpc.giveaway.generateEmailDraft.useMutation({
    onSuccess: (draft) => setEmailDraftModal(prev => ({ ...prev, draft })),
    onError: (err) => toast({ title: "Draft generation failed", description: err.message, variant: "destructive" }),
  });

  const { data: visitHistory } = trpc.giveaway.checkVisitHistory.useQuery(
    { applicantId: visitHistoryModal.applicantId! },
    { enabled: visitHistoryModal.open && visitHistoryModal.applicantId !== null }
  );

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "City", "Age Range", "Gender", "Golf Experience", "Submission Date"];
    const rows = filteredApplications.map((app) => [
      app.name,
      app.email,
      app.city || "",
      app.ageRange || "",
      app.gender || "",
      app.golfExperienceLevel || "",
      app.submittedAt ? new Date(app.submittedAt).toLocaleDateString("en-US") : "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `giveaway-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredApplications = (applications || []).filter(app => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSearch = !searchQuery ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.city || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <Card className="border border-[#DEDEDA] shadow-none">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-[#222222]">Applications</CardTitle>
              <CardDescription className="text-[#AAAAAA]">Manage and track all giveaway submissions</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs border-[#DEDEDA] text-[#545A60] hover:text-[#222222]"
                onClick={handleExportCSV}
                disabled={filteredApplications.length === 0}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Export CSV
              </Button>
              <Input
                placeholder="Search name, email, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 border-[#DEDEDA] text-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36 border-[#DEDEDA] text-sm">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-[#F1F1EF] rounded-lg">
              <span className="text-xs text-[#545A60]">{selectedIds.size} selected</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-[#DEDEDA]"
                onClick={() => enchargeSync.mutate({ applicantIds: Array.from(selectedIds), tags: ["giveaway-2026"] })}
                disabled={enchargeSync.isPending}
              >
                {enchargeSync.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                <span className="ml-1">Sync to Encharge</span>
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-[#888888]" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#DEDEDA]">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.size === filteredApplications.length && filteredApplications.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedIds(new Set(filteredApplications.map(a => a.id)));
                        else setSelectedIds(new Set());
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-[#AAAAAA] text-xs">Name</TableHead>
                  <TableHead className="hidden md:table-cell text-[#AAAAAA] text-xs">Email</TableHead>
                  <TableHead className="hidden lg:table-cell text-[#AAAAAA] text-xs">City</TableHead>
                  <TableHead className="hidden md:table-cell text-[#AAAAAA] text-xs">Age</TableHead>
                  <TableHead className="hidden lg:table-cell text-[#AAAAAA] text-xs">Experience</TableHead>
                  <TableHead className="text-[#AAAAAA] text-xs">Status</TableHead>
                  <TableHead className="text-[#AAAAAA] text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow
                    key={app.id}
                    className={`border-b border-[#F0F0F0] ${selectedIds.has(app.id) ? "bg-[#F2DD48]/5" : "hover:bg-[#F1F1EF]"}`}
                  >
                    <TableCell>
                      <Checkbox checked={selectedIds.has(app.id)} onCheckedChange={() => toggleSelect(app.id)} />
                    </TableCell>
                    <TableCell className="font-medium text-sm text-[#222222]">
                      {app.name}
                      <span className="block md:hidden text-xs text-[#AAAAAA]">{app.email}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-[#545A60]">{app.email}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-[#545A60]">{app.city || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-[#545A60]">{app.ageRange || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-[#545A60]">{app.golfExperienceLevel || "—"}</TableCell>
                    <TableCell>
                      <Select
                        value={app.status || "pending"}
                        onValueChange={(val) => onStatusChange(app.id, val)}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs border-[#DEDEDA]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="completed">Converted</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-[#AAAAAA] hover:text-[#222222]"
                          title="Generate email draft"
                          onClick={() => {
                            setEmailDraftModal({ open: true, applicantId: app.id, draft: null });
                            generateEmailDraft.mutate({ applicantId: app.id });
                          }}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-[#AAAAAA] hover:text-[#222222]"
                          title="Check visit history"
                          onClick={() => setVisitHistoryModal({ open: true, applicantId: app.id })}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredApplications.length === 0 && (
              <div className="text-center py-8 text-[#AAAAAA] text-sm">No applications found</div>
            )}
          </div>
        </CardContent>
      </Card>

      <EmailDraftModal
        open={emailDraftModal.open}
        draft={emailDraftModal.draft}
        isPending={generateEmailDraft.isPending}
        onOpenChange={(open) => setEmailDraftModal(prev => ({ ...prev, open }))}
        onClose={() => setEmailDraftModal({ open: false, applicantId: null, draft: null })}
      />

      <VisitHistoryModal
        open={visitHistoryModal.open}
        visitHistory={visitHistory}
        onOpenChange={(open) => setVisitHistoryModal(prev => ({ ...prev, open }))}
      />
    </>
  );
}
