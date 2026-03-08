import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowLeft, CheckSquare, ClipboardList, ExternalLink, FileText, Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  BRIEF_TEMPLATES,
  ISSUE_PRIORITY_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  OWNERSHIP_STATE_OPTIONS,
  TASK_STATUS_OPTIONS,
  formatDateOnly,
  formatDateTime,
  formatEnumLabel,
  type BriefStatus,
  type BriefTemplateType,
  type IssuePriority,
  type IssueStatus,
  type OwnershipState,
  type TaskStatus,
} from "@/lib/reporting";
import { DEFAULT_VENUE_SLUG, appRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type InitiativeKind = "campaign" | "program" | "promotion";

type InitiativeSummary = {
  id: string;
  name: string;
  description: string;
  owner: string;
  blocker: string;
  nextAction: string;
  linkedReportLabel: string;
  linkedReportHref: string;
  status: string;
};

type InitiativeWorkspacePageProps = {
  venueSlug?: string;
  initiativeKind: InitiativeKind;
  initiativeId: string;
  initiativeSummary: InitiativeSummary;
};

type IssueFormState = {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  ownershipState: OwnershipState;
  assignedTo: string;
  dueAt: string;
};

type TaskFormState = {
  title: string;
  description: string;
  status: TaskStatus;
  ownershipState: OwnershipState;
  assignedTo: string;
  dueAt: string;
};

type BriefFormState = {
  briefType: BriefTemplateType;
  title: string;
  status: BriefStatus;
  effectiveDate: string;
  dateRangeLabel: string;
  summary: string;
  blockers: string;
  nextActions: string;
};

const DEFAULT_ISSUE_FORM: IssueFormState = {
  title: "",
  description: "",
  status: "open",
  priority: "medium",
  ownershipState: "awaiting_studio_soo",
  assignedTo: "Studio Soo",
  dueAt: "",
};

const DEFAULT_TASK_FORM: TaskFormState = {
  title: "",
  description: "",
  status: "open",
  ownershipState: "awaiting_studio_soo",
  assignedTo: "Studio Soo",
  dueAt: "",
};

function createDefaultBriefForm(summary: InitiativeSummary): BriefFormState {
  return {
    briefType: "branch_update",
    title: `${summary.name} Brief`,
    status: "draft",
    effectiveDate: new Date().toISOString().slice(0, 10),
    dateRangeLabel: "This Week",
    summary: `${summary.name}: ${summary.description}`,
    blockers: summary.blocker,
    nextActions: summary.nextAction,
  };
}

function toIsoDate(value: string) {
  return value ? `${value}T17:00:00.000Z` : null;
}

function getLinkedFields(kind: InitiativeKind, id: string) {
  return {
    linkedCampaignId: kind === "campaign" ? id : null,
    linkedProgramId: kind === "program" ? id : null,
    linkedPromotionId: kind === "promotion" ? id : null,
  };
}

function matchesLinkedInitiative(
  item: { linkedCampaignId?: string | null; linkedProgramId?: string | null; linkedPromotionId?: string | null },
  kind: InitiativeKind,
  id: string
) {
  if (kind === "campaign") return item.linkedCampaignId === id;
  if (kind === "program") return item.linkedProgramId === id;
  return item.linkedPromotionId === id;
}

export default function InitiativeWorkspacePage({
  venueSlug = DEFAULT_VENUE_SLUG,
  initiativeKind,
  initiativeId,
  initiativeSummary,
}: InitiativeWorkspacePageProps) {
  const utils = trpc.useUtils();
  const { data: issues = [] } = trpc.reporting.listIssues.useQuery({ venueSlug });
  const { data: tasks = [] } = trpc.reporting.listTasks.useQuery({ venueSlug });
  const { data: updates = [] } = trpc.reporting.listOperationalUpdates.useQuery({ venueSlug });
  const { data: briefs = [] } = trpc.reporting.listBriefs.useQuery({ venueSlug });

  const createIssue = trpc.reporting.createIssue.useMutation({
    onSuccess: async () => {
      toast.success("Issue created");
      await Promise.all([
        utils.reporting.listIssues.invalidate({ venueSlug }),
        utils.reporting.getThisWeekSummary.invalidate({ venueSlug }),
      ]);
    },
  });

  const createTask = trpc.reporting.createTask.useMutation({
    onSuccess: async () => {
      toast.success("Task created");
      await Promise.all([
        utils.reporting.listTasks.invalidate({ venueSlug }),
        utils.reporting.getThisWeekSummary.invalidate({ venueSlug }),
      ]);
    },
  });

  const createBrief = trpc.reporting.createBrief.useMutation({
    onSuccess: async () => {
      toast.success("Brief created");
      await utils.reporting.listBriefs.invalidate({ venueSlug });
    },
  });

  const linkedFields = getLinkedFields(initiativeKind, initiativeId);
  const linkedIssues = useMemo(
    () => issues.filter((issue) => matchesLinkedInitiative(issue, initiativeKind, initiativeId)),
    [initiativeId, initiativeKind, issues]
  );
  const linkedTasks = useMemo(
    () => tasks.filter((task) => matchesLinkedInitiative(task, initiativeKind, initiativeId)),
    [initiativeId, initiativeKind, tasks]
  );
  const linkedUpdates = useMemo(
    () => updates.filter((update) => matchesLinkedInitiative(update, initiativeKind, initiativeId)),
    [initiativeId, initiativeKind, updates]
  );
  const linkedBriefs = useMemo(
    () => briefs.filter((brief) => matchesLinkedInitiative(brief, initiativeKind, initiativeId)),
    [briefs, initiativeId, initiativeKind]
  );

  const recentActivity = useMemo(() => {
    return [
      ...linkedUpdates.map((update) => ({
        key: `update-${update.id}`,
        label: `Inbox update #${update.id}`,
        detail: update.rawText,
        timestamp: update.updatedAt,
      })),
      ...linkedIssues.map((issue) => ({
        key: `issue-${issue.id}`,
        label: `Issue #${issue.id}`,
        detail: issue.title,
        timestamp: issue.updatedAt,
      })),
      ...linkedTasks.map((task) => ({
        key: `task-${task.id}`,
        label: `Task #${task.id}`,
        detail: task.title,
        timestamp: task.updatedAt,
      })),
      ...linkedBriefs.map((brief) => ({
        key: `brief-${brief.id}`,
        label: `Brief #${brief.id}`,
        detail: brief.title,
        timestamp: brief.updatedAt,
      })),
    ].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 6);
  }, [linkedBriefs, linkedIssues, linkedTasks, linkedUpdates]);

  const openWorkCount = linkedIssues.filter((issue) => issue.status !== "resolved").length + linkedTasks.filter((task) => task.status !== "done").length;

  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [issueForm, setIssueForm] = useState<IssueFormState>({
    ...DEFAULT_ISSUE_FORM,
    title: `${initiativeSummary.name} issue`,
    description: `Linked to ${initiativeSummary.name}. ${initiativeSummary.blocker}`,
  });
  const [taskForm, setTaskForm] = useState<TaskFormState>({
    ...DEFAULT_TASK_FORM,
    title: `${initiativeSummary.name} follow-up`,
    description: `Linked to ${initiativeSummary.name}. ${initiativeSummary.nextAction}`,
  });
  const [briefForm, setBriefForm] = useState<BriefFormState>(createDefaultBriefForm(initiativeSummary));

  const openIssueDialog = () => {
    setIssueForm({
      ...DEFAULT_ISSUE_FORM,
      title: `${initiativeSummary.name} issue`,
      description: `Linked to ${initiativeSummary.name}. ${initiativeSummary.blocker}`,
      assignedTo: initiativeSummary.owner,
    });
    setIsIssueOpen(true);
  };

  const openTaskDialog = () => {
    setTaskForm({
      ...DEFAULT_TASK_FORM,
      title: `${initiativeSummary.name} task`,
      description: `Linked to ${initiativeSummary.name}. ${initiativeSummary.nextAction}`,
      assignedTo: initiativeSummary.owner,
    });
    setIsTaskOpen(true);
  };

  const openBriefDialog = () => {
    setBriefForm(createDefaultBriefForm(initiativeSummary));
    setIsBriefOpen(true);
  };

  const handleCreateIssue = async () => {
    if (!issueForm.title.trim() || !issueForm.assignedTo.trim()) {
      toast.error("Title and assignee are required");
      return;
    }
    await createIssue.mutateAsync({
      venueSlug,
      title: issueForm.title.trim(),
      description: issueForm.description.trim(),
      status: issueForm.status,
      priority: issueForm.priority,
      ownershipState: issueForm.ownershipState,
      assignedTo: issueForm.assignedTo.trim(),
      dueAt: toIsoDate(issueForm.dueAt),
      ...linkedFields,
    });
    setIsIssueOpen(false);
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim() || !taskForm.assignedTo.trim()) {
      toast.error("Title and assignee are required");
      return;
    }
    await createTask.mutateAsync({
      venueSlug,
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      status: taskForm.status,
      ownershipState: taskForm.ownershipState,
      assignedTo: taskForm.assignedTo.trim(),
      dueAt: toIsoDate(taskForm.dueAt),
      ...linkedFields,
    });
    setIsTaskOpen(false);
  };

  const handleCreateBrief = async () => {
    if (!briefForm.title.trim()) {
      toast.error("Brief title is required");
      return;
    }
    await createBrief.mutateAsync({
      venueSlug,
      briefType: briefForm.briefType,
      title: briefForm.title.trim(),
      status: briefForm.status,
      ...linkedFields,
      content: {
        effectiveDate: briefForm.effectiveDate,
        dateRangeLabel: briefForm.dateRangeLabel,
        summary: briefForm.summary,
        topHighlights: [initiativeSummary.description],
        blockers: briefForm.blockers.split(/\n+/).map((item) => item.trim()).filter(Boolean),
        nextActions: briefForm.nextActions.split(/\n+/).map((item) => item.trim()).filter(Boolean),
      },
    });
    setIsBriefOpen(false);
  };

  const operationsBase = appRoutes.venue(venueSlug).operations;
  const backHref =
    initiativeKind === "campaign"
      ? operationsBase.campaigns
      : initiativeKind === "program"
        ? operationsBase.programs
        : operationsBase.promotions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to {formatEnumLabel(`${initiativeKind}s`)}
          </Link>
          <div>
            <p className="text-sm font-medium text-[#B8900A]">Operations / {formatEnumLabel(initiativeKind)}</p>
            <h1 className="text-3xl font-semibold text-foreground">{initiativeSummary.name}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Operational workspace for linked updates, issues, tasks, and briefs.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{initiativeSummary.status}</Badge>
            <Badge variant="outline">Open work {openWorkCount}</Badge>
            <Badge variant="outline">Recent activity {recentActivity.length}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={openIssueDialog}><AlertTriangle className="mr-2 h-4 w-4" /> Create Issue</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create linked issue</DialogTitle>
                <DialogDescription>This issue will be linked to {initiativeSummary.name}.</DialogDescription>
              </DialogHeader>
              <IssueDialogForm form={issueForm} setForm={setIssueForm} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsIssueOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateIssue} disabled={createIssue.isPending}>{createIssue.isPending ? "Saving…" : "Save issue"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={openTaskDialog}><CheckSquare className="mr-2 h-4 w-4" /> Create Task</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create linked task</DialogTitle>
                <DialogDescription>This task will be linked to {initiativeSummary.name}.</DialogDescription>
              </DialogHeader>
              <TaskDialogForm form={taskForm} setForm={setTaskForm} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTaskOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateTask} disabled={createTask.isPending}>{createTask.isPending ? "Saving…" : "Save task"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isBriefOpen} onOpenChange={setIsBriefOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={openBriefDialog}><ClipboardList className="mr-2 h-4 w-4" /> Create Brief</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create linked brief</DialogTitle>
                <DialogDescription>This brief will be linked to {initiativeSummary.name}.</DialogDescription>
              </DialogHeader>
              <BriefDialogForm form={briefForm} setForm={setBriefForm} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBriefOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateBrief} disabled={createBrief.isPending}>{createBrief.isPending ? "Saving…" : "Save brief"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link href={initiativeSummary.linkedReportHref}>
            <Button><FileText className="mr-2 h-4 w-4" /> Open Reports</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard title="Initiative description" value={initiativeSummary.description} />
        <SummaryCard title="Owner" value={initiativeSummary.owner} />
        <SummaryCard title="Blocker" value={initiativeSummary.blocker} tone="warning" />
        <SummaryCard title="Open work" value={`${openWorkCount} linked records in flight`} />
        <SummaryCard title="Next action" value={initiativeSummary.nextAction} tone="highlight" />
        <Card>
          <CardHeader>
            <CardTitle>Linked report / brief</CardTitle>
            <CardDescription>Primary reporting handoff for this initiative.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground">{initiativeSummary.linkedReportLabel}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={initiativeSummary.linkedReportHref}><Button variant="outline" size="sm">Open workspace</Button></Link>
              {linkedBriefs[0] ? <Badge variant="secondary">Brief #{linkedBriefs[0].id}</Badge> : <Badge variant="outline">No linked brief yet</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Most recent linked updates, issues, tasks, and briefs for this workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No linked activity yet. Use quick actions to add the first record.</p>
              ) : recentActivity.map((activity) => (
                <div key={activity.key} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{activity.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{activity.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDateTime(activity.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Jump into shared workspaces without changing the route architecture.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickLink href={appRoutes.venue(venueSlug).operations.inbox} icon={Inbox} label="Inbox" description="Review raw operational updates." />
            <QuickLink href={appRoutes.venue(venueSlug).operations.issues} icon={AlertTriangle} label="Issues" description="View all issue records and filters." />
            <QuickLink href={appRoutes.venue(venueSlug).operations.tasks} icon={CheckSquare} label="Tasks" description="View execution tasks and Asana state." />
            <QuickLink href={appRoutes.venue(venueSlug).reports.briefs} icon={ClipboardList} label="Briefs" description="Open the full brief workspace." />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <LinkedListCard
          title="Linked issues"
          emptyText="No issues linked yet."
          items={linkedIssues.map((issue) => ({
            key: issue.id,
            title: issue.title,
            meta: `${formatEnumLabel(issue.status)} • ${formatEnumLabel(issue.ownershipState)}`,
            extra: issue.assignedTo,
          }))}
        />
        <LinkedListCard
          title="Linked tasks"
          emptyText="No tasks linked yet."
          items={linkedTasks.map((task) => ({
            key: task.id,
            title: task.title,
            meta: `${formatEnumLabel(task.status)} • ${formatEnumLabel(task.ownershipState)}`,
            extra: task.assignedTo,
          }))}
        />
        <LinkedListCard
          title="Linked briefs & updates"
          emptyText="No briefs or updates linked yet."
          items={[
            ...linkedBriefs.map((brief) => ({
              key: `brief-${brief.id}`,
              title: brief.title,
              meta: `Brief • ${formatEnumLabel(brief.status)}`,
              extra: brief.content.dateRangeLabel || brief.content.effectiveDate || "",
            })),
            ...linkedUpdates.map((update) => ({
              key: `update-${update.id}`,
              title: update.rawText,
              meta: `Inbox • ${formatEnumLabel(update.status)}`,
              extra: formatDateOnly(update.submittedAt),
            })),
          ]}
        />
      </div>
    </div>
  );
}

function SummaryCard({ title, value, tone = "default" }: { title: string; value: string; tone?: "default" | "warning" | "highlight" }) {
  return (
    <Card className={cn(tone === "warning" && "border-amber-300", tone === "highlight" && "border-[#F5C72C]")}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">{value || "—"}</p>
      </CardContent>
    </Card>
  );
}

function QuickLink({ href, icon: Icon, label, description }: { href: string; icon: typeof Plus; label: string; description: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/20">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 text-[#B8900A]" />
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function LinkedListCard({ title, emptyText, items }: { title: string; emptyText: string; items: Array<{ key: string | number; title: string; meta: string; extra?: string }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          ) : items.map((item) => (
            <div key={item.key} className="rounded-lg border p-3">
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.meta}</p>
              {item.extra ? <p className="mt-1 text-xs text-muted-foreground">{item.extra}</p> : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function IssueDialogForm({ form, setForm }: { form: IssueFormState; setForm: React.Dispatch<React.SetStateAction<IssueFormState>> }) {
  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value as IssueStatus }))} options={ISSUE_STATUS_OPTIONS} />
        <SelectField label="Priority" value={form.priority} onChange={(value) => setForm((current) => ({ ...current, priority: value as IssuePriority }))} options={ISSUE_PRIORITY_OPTIONS} />
        <SelectField label="Ownership" value={form.ownershipState} onChange={(value) => setForm((current) => ({ ...current, ownershipState: value as OwnershipState }))} options={OWNERSHIP_STATE_OPTIONS} />
        <div className="space-y-2"><Label>Assigned to</Label><Input value={form.assignedTo} onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))} /></div>
      </div>
      <div className="space-y-2"><Label>Due date</Label><Input type="date" value={form.dueAt} onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))} /></div>
    </div>
  );
}

function TaskDialogForm({ form, setForm }: { form: TaskFormState; setForm: React.Dispatch<React.SetStateAction<TaskFormState>> }) {
  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value as TaskStatus }))} options={TASK_STATUS_OPTIONS} />
        <SelectField label="Ownership" value={form.ownershipState} onChange={(value) => setForm((current) => ({ ...current, ownershipState: value as OwnershipState }))} options={OWNERSHIP_STATE_OPTIONS} />
        <div className="space-y-2"><Label>Assigned to</Label><Input value={form.assignedTo} onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))} /></div>
        <div className="space-y-2"><Label>Due date</Label><Input type="date" value={form.dueAt} onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))} /></div>
      </div>
    </div>
  );
}

function BriefDialogForm({ form, setForm }: { form: BriefFormState; setForm: React.Dispatch<React.SetStateAction<BriefFormState>> }) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Brief type"
          value={form.briefType}
          onChange={(value) => {
            const template = BRIEF_TEMPLATES.find((item) => item.type === value);
            setForm((current) => ({ ...current, briefType: value as BriefTemplateType, title: template?.title || current.title }));
          }}
          options={BRIEF_TEMPLATES.map((template) => template.type)}
        />
        <SelectField label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value as BriefStatus }))} options={["draft", "ready", "shared"]} />
      </div>
      <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Effective date</Label><Input type="date" value={form.effectiveDate} onChange={(event) => setForm((current) => ({ ...current, effectiveDate: event.target.value }))} /></div>
        <div className="space-y-2"><Label>Date range label</Label><Input value={form.dateRangeLabel} onChange={(event) => setForm((current) => ({ ...current, dateRangeLabel: event.target.value }))} /></div>
      </div>
      <div className="space-y-2"><Label>Summary</Label><Textarea rows={3} value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} /></div>
      <div className="space-y-2"><Label>Blockers</Label><Textarea rows={3} value={form.blockers} onChange={(event) => setForm((current) => ({ ...current, blockers: event.target.value }))} /></div>
      <div className="space-y-2"><Label>Next actions</Label><Textarea rows={3} value={form.nextActions} onChange={(event) => setForm((current) => ({ ...current, nextActions: event.target.value }))} /></div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[] }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((option) => <SelectItem key={option} value={option}>{formatEnumLabel(option)}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
