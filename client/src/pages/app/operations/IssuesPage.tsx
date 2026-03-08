import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  formatDateOnly,
  formatEnumLabel,
  formatVenueLabel,
  ISSUE_PRIORITY_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  OWNERSHIP_STATE_OPTIONS,
  type IssuePriority,
  type IssueRecord,
  type IssueStatus,
  type OwnershipState,
  type OperationalUpdateRecord,
} from "@/lib/reporting";
import { DEFAULT_VENUE_SLUG } from "@/lib/routes";

type IssuesPageProps = {
  venueSlug?: string;
};

type IssueFormState = {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  ownershipState: OwnershipState;
  assignedTo: string;
  linkedUpdateId: string;
  dueAt: string;
};

const DEFAULT_FORM: IssueFormState = {
  title: "",
  description: "",
  status: "open",
  priority: "medium",
  ownershipState: "awaiting_studio_soo",
  assignedTo: "Studio Soo",
  linkedUpdateId: "none",
  dueAt: "",
};

function toInputDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toIsoDate(value: string) {
  return value ? `${value}T17:00:00.000Z` : null;
}

export default function IssuesPage({ venueSlug = DEFAULT_VENUE_SLUG }: IssuesPageProps) {
  const venueLabel = formatVenueLabel(venueSlug);
  const utils = trpc.useUtils();
  const { data: issues = [] } = trpc.reporting.listIssues.useQuery({ venueSlug });
  const { data: updates = [] } = trpc.reporting.listOperationalUpdates.useQuery({ venueSlug });

  const createIssue = trpc.reporting.createIssue.useMutation({
    onSuccess: async () => {
      toast.success("Issue created");
      await Promise.all([
        utils.reporting.listIssues.invalidate({ venueSlug }),
        utils.reporting.getThisWeekSummary.invalidate({ venueSlug }),
        utils.reporting.listOperationalUpdates.invalidate({ venueSlug }),
      ]);
    },
  });

  const updateIssue = trpc.reporting.updateIssue.useMutation({
    onSuccess: async () => {
      toast.success("Issue updated");
      await Promise.all([
        utils.reporting.listIssues.invalidate({ venueSlug }),
        utils.reporting.getThisWeekSummary.invalidate({ venueSlug }),
        utils.reporting.listOperationalUpdates.invalidate({ venueSlug }),
      ]);
    },
  });

  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | "all">("all");
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipState | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<IssueRecord | null>(null);
  const [form, setForm] = useState<IssueFormState>(DEFAULT_FORM);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (statusFilter !== "all" && issue.status !== statusFilter) return false;
      if (priorityFilter !== "all" && issue.priority !== priorityFilter) return false;
      if (ownershipFilter !== "all" && issue.ownershipState !== ownershipFilter) return false;
      return true;
    });
  }, [issues, ownershipFilter, priorityFilter, statusFilter]);

  const linkedUpdateOptions = updates as OperationalUpdateRecord[];

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setEditingIssue(null);
    setIsCreateOpen(true);
  };

  const openEdit = (issue: IssueRecord) => {
    setEditingIssue(issue);
    setForm({
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      ownershipState: issue.ownershipState,
      assignedTo: issue.assignedTo,
      linkedUpdateId: issue.linkedUpdateId ? String(issue.linkedUpdateId) : "none",
      dueAt: toInputDate(issue.dueAt),
    });
  };

  const resetModal = () => {
    setIsCreateOpen(false);
    setEditingIssue(null);
    setForm(DEFAULT_FORM);
  };

  const handleSubmit = async () => {
    const payload = {
      venueSlug,
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      ownershipState: form.ownershipState,
      assignedTo: form.assignedTo.trim(),
      linkedUpdateId: form.linkedUpdateId === "none" ? null : Number(form.linkedUpdateId),
      dueAt: toIsoDate(form.dueAt),
    };

    if (!payload.title || !payload.assignedTo) {
      toast.error("Title and assignee are required");
      return;
    }

    if (editingIssue) {
      await updateIssue.mutateAsync({ id: editingIssue.id, ...payload });
    } else {
      await createIssue.mutateAsync(payload);
    }

    resetModal();
  };

  const isSaving = createIssue.isPending || updateIssue.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#B8900A]">Operations / Issues</p>
          <h1 className="text-3xl font-semibold text-foreground">{venueLabel} Issues</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Track blockers, risks, and unresolved operational gaps separately from tasks. Use this page to manage status,
            priority, ownership, assignee, due date, and inbox linkage.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New issue</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create issue</DialogTitle>
              <DialogDescription>Add a blocker or unresolved gap for this venue.</DialogDescription>
            </DialogHeader>
            <IssueForm form={form} setForm={setForm} updates={linkedUpdateOptions} />
            <DialogFooter>
              <Button variant="outline" onClick={resetModal}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Saving…" : "Save issue"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
        <FilterCard title="Status" value={statusFilter} onChange={(value) => setStatusFilter(value as IssueStatus | "all")} options={["all", ...ISSUE_STATUS_OPTIONS]} />
        <FilterCard title="Priority" value={priorityFilter} onChange={(value) => setPriorityFilter(value as IssuePriority | "all")} options={["all", ...ISSUE_PRIORITY_OPTIONS]} />
        <FilterCard title="Ownership" value={ownershipFilter} onChange={(value) => setOwnershipFilter(value as OwnershipState | "all")} options={["all", ...OWNERSHIP_STATE_OPTIONS]} />
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Visible issues</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{filteredIssues.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Filtered result count</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-[#F5C72C]" /> Issue register</CardTitle>
          <CardDescription>Editable issue log for Studio Soo, venue admin, and HQ support coordination.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Ownership</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Linked update</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">No issues match the current filters.</TableCell>
                </TableRow>
              ) : filteredIssues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="align-top whitespace-normal">
                    <div>
                      <p className="font-medium text-foreground">{issue.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{issue.description || "No description"}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{formatEnumLabel(issue.status)}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{formatEnumLabel(issue.priority)}</Badge></TableCell>
                  <TableCell className="whitespace-normal text-sm text-muted-foreground">{formatEnumLabel(issue.ownershipState)}</TableCell>
                  <TableCell className="whitespace-normal text-sm text-foreground">{issue.assignedTo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateOnly(issue.dueAt)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{issue.linkedUpdateId ? `#${issue.linkedUpdateId}` : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Dialog open={editingIssue?.id === issue.id} onOpenChange={(open) => {
                      if (!open) resetModal();
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => openEdit(issue)}>Edit</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit issue</DialogTitle>
                          <DialogDescription>Update ownership, priority, due date, or linked update.</DialogDescription>
                        </DialogHeader>
                        <IssueForm form={form} setForm={setForm} updates={linkedUpdateOptions} />
                        <DialogFooter>
                          <Button variant="outline" onClick={resetModal}>Cancel</Button>
                          <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Saving…" : "Save changes"}</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function FilterCard({
  title,
  value,
  onChange,
  options,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <Label>{title}</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>{option === "all" ? "All" : formatEnumLabel(option)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

function IssueForm({
  form,
  setForm,
  updates,
}: {
  form: IssueFormState;
  setForm: React.Dispatch<React.SetStateAction<IssueFormState>>;
  updates: OperationalUpdateRecord[];
}) {
  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Issue title" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="What is blocked or unresolved?" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SelectField label="Status" value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as IssueStatus }))} options={ISSUE_STATUS_OPTIONS} />
        <SelectField label="Priority" value={form.priority} onValueChange={(value) => setForm((current) => ({ ...current, priority: value as IssuePriority }))} options={ISSUE_PRIORITY_OPTIONS} />
        <SelectField label="Ownership" value={form.ownershipState} onValueChange={(value) => setForm((current) => ({ ...current, ownershipState: value as OwnershipState }))} options={OWNERSHIP_STATE_OPTIONS} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Assigned to</Label>
          <Input value={form.assignedTo} onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))} placeholder="Studio Soo / Venue Admin / HQ support" />
        </div>
        <div className="space-y-2">
          <Label>Due date</Label>
          <Input type="date" value={form.dueAt} onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Linked inbox update</Label>
        <Select value={form.linkedUpdateId} onValueChange={(value) => setForm((current) => ({ ...current, linkedUpdateId: value }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No linked update</SelectItem>
            {updates.map((update) => (
              <SelectItem key={update.id} value={String(update.id)}>#{update.id} · {update.rawText.slice(0, 60)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>{formatEnumLabel(option)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
