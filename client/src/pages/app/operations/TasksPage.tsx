import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckSquare, ExternalLink, Plus } from "lucide-react";
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
  OWNERSHIP_STATE_OPTIONS,
  TASK_STATUS_OPTIONS,
  type IssueRecord,
  type OperationalUpdateRecord,
  type OwnershipState,
  type TaskRecord,
  type TaskStatus,
} from "@/lib/reporting";
import { DEFAULT_VENUE_SLUG } from "@/lib/routes";

type TasksPageProps = {
  venueSlug?: string;
};

type TaskFormState = {
  title: string;
  description: string;
  status: TaskStatus;
  ownershipState: OwnershipState;
  assignedTo: string;
  linkedIssueId: string;
  linkedUpdateId: string;
  dueAt: string;
};

const DEFAULT_FORM: TaskFormState = {
  title: "",
  description: "",
  status: "open",
  ownershipState: "awaiting_studio_soo",
  assignedTo: "Studio Soo",
  linkedIssueId: "none",
  linkedUpdateId: "none",
  dueAt: "",
};

function toInputDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toIsoDate(value: string) {
  return value ? `${value}T17:00:00.000Z` : null;
}

export default function TasksPage({ venueSlug = DEFAULT_VENUE_SLUG }: TasksPageProps) {
  const venueLabel = formatVenueLabel(venueSlug);
  const utils = trpc.useUtils();
  const { data: tasks = [] } = trpc.reporting.listTasks.useQuery({ venueSlug });
  const { data: issues = [] } = trpc.reporting.listIssues.useQuery({ venueSlug });
  const { data: updates = [] } = trpc.reporting.listOperationalUpdates.useQuery({ venueSlug });

  const createTask = trpc.reporting.createTask.useMutation({
    onSuccess: async () => {
      toast.success("Task created");
      await Promise.all([
        utils.reporting.listTasks.invalidate({ venueSlug }),
        utils.reporting.getThisWeekSummary.invalidate({ venueSlug }),
        utils.reporting.listOperationalUpdates.invalidate({ venueSlug }),
      ]);
    },
  });

  const updateTask = trpc.reporting.updateTask.useMutation({
    onSuccess: async () => {
      toast.success("Task updated");
      await Promise.all([
        utils.reporting.listTasks.invalidate({ venueSlug }),
        utils.reporting.getThisWeekSummary.invalidate({ venueSlug }),
        utils.reporting.listOperationalUpdates.invalidate({ venueSlug }),
      ]);
    },
  });

  const createTaskInAsana = trpc.reporting.createTaskInAsana.useMutation({
    onSuccess: async (result) => {
      if (result.success) {
        toast.success("Task sent to Asana");
      } else if (result.externalTaskRef?.status === "not_configured") {
        toast.info("Asana is not configured. Local task was updated with a fallback state.");
      } else {
        toast.error(result.externalTaskRef?.message || "Asana task creation failed");
      }
      await utils.reporting.listTasks.invalidate({ venueSlug });
    },
  });

  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipState | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [form, setForm] = useState<TaskFormState>(DEFAULT_FORM);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (ownershipFilter !== "all" && task.ownershipState !== ownershipFilter) return false;
      return true;
    });
  }, [ownershipFilter, statusFilter, tasks]);

  const issueOptions = issues as IssueRecord[];
  const updateOptions = updates as OperationalUpdateRecord[];

  const openCreate = () => {
    setEditingTask(null);
    setForm(DEFAULT_FORM);
    setIsCreateOpen(true);
  };

  const openEdit = (task: TaskRecord) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      ownershipState: task.ownershipState,
      assignedTo: task.assignedTo,
      linkedIssueId: task.linkedIssueId ? String(task.linkedIssueId) : "none",
      linkedUpdateId: task.linkedUpdateId ? String(task.linkedUpdateId) : "none",
      dueAt: toInputDate(task.dueAt),
    });
  };

  const resetModal = () => {
    setIsCreateOpen(false);
    setEditingTask(null);
    setForm(DEFAULT_FORM);
  };

  const handleSubmit = async () => {
    const payload = {
      venueSlug,
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      ownershipState: form.ownershipState,
      assignedTo: form.assignedTo.trim(),
      linkedIssueId: form.linkedIssueId === "none" ? null : Number(form.linkedIssueId),
      linkedUpdateId: form.linkedUpdateId === "none" ? null : Number(form.linkedUpdateId),
      dueAt: toIsoDate(form.dueAt),
    };

    if (!payload.title || !payload.assignedTo) {
      toast.error("Title and assignee are required");
      return;
    }

    if (editingTask) {
      await updateTask.mutateAsync({
        id: editingTask.id,
        ...payload,
        externalTaskRef: editingTask.externalTaskRef ?? null,
      });
    } else {
      await createTask.mutateAsync(payload);
    }

    resetModal();
  };

  const isSaving = createTask.isPending || updateTask.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#B8900A]">Operations / Tasks</p>
          <h1 className="text-3xl font-semibold text-foreground">{venueLabel} Tasks</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Execution workspace for weekly work items. Manage status, due dates, assignees, ownership, issue/update links,
            and optionally push individual tasks into Asana with a graceful fallback when credentials are missing.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New task</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create task</DialogTitle>
              <DialogDescription>Add a new execution task for this venue.</DialogDescription>
            </DialogHeader>
            <TaskForm form={form} setForm={setForm} issues={issueOptions} updates={updateOptions} />
            <DialogFooter>
              <Button variant="outline" onClick={resetModal}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Saving…" : "Save task"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <FilterCard title="Status" value={statusFilter} onChange={(value) => setStatusFilter(value as TaskStatus | "all")} options={["all", ...TASK_STATUS_OPTIONS]} />
        <FilterCard title="Ownership" value={ownershipFilter} onChange={(value) => setOwnershipFilter(value as OwnershipState | "all")} options={["all", ...OWNERSHIP_STATE_OPTIONS]} />
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Visible tasks</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{filteredTasks.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Filtered result count</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5 text-[#F5C72C]" /> Task register</CardTitle>
          <CardDescription>Weekly execution queue with optional Asana export per task.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ownership</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Links</TableHead>
                <TableHead>Asana</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">No tasks match the current filters.</TableCell>
                </TableRow>
              ) : filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="align-top whitespace-normal">
                    <div>
                      <p className="font-medium text-foreground">{task.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description || "No description"}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{formatEnumLabel(task.status)}</Badge></TableCell>
                  <TableCell className="whitespace-normal text-sm text-muted-foreground">{formatEnumLabel(task.ownershipState)}</TableCell>
                  <TableCell className="whitespace-normal text-sm text-foreground">{task.assignedTo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateOnly(task.dueAt)}</TableCell>
                  <TableCell className="whitespace-normal text-xs text-muted-foreground">
                    Issue {task.linkedIssueId ? `#${task.linkedIssueId}` : "—"}<br />
                    Update {task.linkedUpdateId ? `#${task.linkedUpdateId}` : "—"}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {task.externalTaskRef?.status === "created" ? (
                      <div className="space-y-1 text-xs">
                        <Badge variant="secondary">Created</Badge>
                        {task.externalTaskRef.permalinkUrl ? (
                          <a href={task.externalTaskRef.permalinkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#007AFF] hover:underline">
                            Open <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    ) : task.externalTaskRef?.status === "not_configured" ? (
                      <p className="text-xs text-amber-700">Not configured</p>
                    ) : task.externalTaskRef?.status === "failed" ? (
                      <p className="text-xs text-red-600">Failed</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not sent</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={createTaskInAsana.isPending || task.externalTaskRef?.status === "created"}
                        onClick={() => createTaskInAsana.mutate({ taskId: task.id })}
                      >
                        Send to Asana
                      </Button>
                      <Dialog open={editingTask?.id === task.id} onOpenChange={(open) => {
                        if (!open) resetModal();
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => openEdit(task)}>Edit</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit task</DialogTitle>
                            <DialogDescription>Update execution details, linked records, or due date.</DialogDescription>
                          </DialogHeader>
                          <TaskForm form={form} setForm={setForm} issues={issueOptions} updates={updateOptions} />
                          <DialogFooter>
                            <Button variant="outline" onClick={resetModal}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Saving…" : "Save changes"}</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
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

function TaskForm({
  form,
  setForm,
  issues,
  updates,
}: {
  form: TaskFormState;
  setForm: React.Dispatch<React.SetStateAction<TaskFormState>>;
  issues: IssueRecord[];
  updates: OperationalUpdateRecord[];
}) {
  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Task title" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="What needs to be done?" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SelectField label="Status" value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as TaskStatus }))} options={TASK_STATUS_OPTIONS} />
        <SelectField label="Ownership" value={form.ownershipState} onValueChange={(value) => setForm((current) => ({ ...current, ownershipState: value as OwnershipState }))} options={OWNERSHIP_STATE_OPTIONS} />
        <div className="space-y-2">
          <Label>Assigned to</Label>
          <Input value={form.assignedTo} onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))} placeholder="Studio Soo / Venue Admin / HQ support" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label>Linked issue</Label>
          <Select value={form.linkedIssueId} onValueChange={(value) => setForm((current) => ({ ...current, linkedIssueId: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No linked issue</SelectItem>
              {issues.map((issue) => (
                <SelectItem key={issue.id} value={String(issue.id)}>#{issue.id} · {issue.title.slice(0, 60)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <div className="space-y-2">
          <Label>Due date</Label>
          <Input type="date" value={form.dueAt} onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))} />
        </div>
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
