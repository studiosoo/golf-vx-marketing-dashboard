import { ChangeEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Camera, Inbox, ListFilter, MessageSquarePlus, Paperclip, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  formatEnumLabel,
  formatVenueLabel,
  INBOX_SOURCE_TYPES,
  ISSUE_PRIORITY_OPTIONS,
  OPERATIONAL_UPDATE_STATUS_OPTIONS,
  OWNERSHIP_STATE_OPTIONS,
  TASK_STATUS_OPTIONS,
  type InboxSourceType,
  type IssuePriority,
  type OperationalUpdateStatus,
  type OwnershipState,
  type TaskStatus,
} from "@/lib/reporting";
import { DEFAULT_VENUE_SLUG } from "@/lib/routes";

type InboxPageProps = {
  venueSlug?: string;
};

type ScreenshotDraft = {
  name: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  size: number;
  dataUrl: string;
};

type IssueActionDraft = {
  title: string;
  description: string;
  priority: IssuePriority;
  ownershipState: OwnershipState;
  assignedTo: string;
  dueAt: string;
};

type TaskActionDraft = {
  title: string;
  description: string;
  status: TaskStatus;
  ownershipState: OwnershipState;
  assignedTo: string;
  dueAt: string;
};

const MAX_SCREENSHOT_BYTES = 1024 * 1024;
const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

function statusTone(status: OperationalUpdateStatus) {
  switch (status) {
    case "processed":
      return "default" as const;
    case "in_review":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function toIsoDate(value: string) {
  return value ? `${value}T17:00:00.000Z` : null;
}

export default function InboxPage({ venueSlug = DEFAULT_VENUE_SLUG }: InboxPageProps) {
  const venueLabel = formatVenueLabel(venueSlug);
  const utils = trpc.useUtils();
  const { data: updates = [] } = trpc.reporting.listOperationalUpdates.useQuery({ venueSlug });
  const createUpdate = trpc.reporting.createOperationalUpdate.useMutation({
    onSuccess: async () => {
      toast.success("Inbox update submitted");
      await utils.reporting.listOperationalUpdates.invalidate({ venueSlug });
    },
  });
  const updateStatus = trpc.reporting.updateOperationalUpdateStatus.useMutation({
    onSuccess: async () => {
      toast.success("Inbox item updated");
      await Promise.all([
        utils.reporting.listOperationalUpdates.invalidate({ venueSlug }),
        utils.reporting.getThisWeekSummary.invalidate({ venueSlug }),
        utils.reporting.listIssues.invalidate({ venueSlug }),
        utils.reporting.listTasks.invalidate({ venueSlug }),
      ]);
    },
  });
  const createIssue = trpc.reporting.createIssue.useMutation({
    onSuccess: async () => {
      toast.success("Issue created from inbox item");
      await Promise.all([
        utils.reporting.listIssues.invalidate({ venueSlug }),
        utils.reporting.listOperationalUpdates.invalidate({ venueSlug }),
        utils.reporting.getThisWeekSummary.invalidate({ venueSlug }),
      ]);
    },
  });
  const createTask = trpc.reporting.createTask.useMutation({
    onSuccess: async () => {
      toast.success("Task created from inbox item");
      await Promise.all([
        utils.reporting.listTasks.invalidate({ venueSlug }),
        utils.reporting.listOperationalUpdates.invalidate({ venueSlug }),
        utils.reporting.getThisWeekSummary.invalidate({ venueSlug }),
      ]);
    },
  });

  const [sourceType, setSourceType] = useState<InboxSourceType>("manual");
  const [rawText, setRawText] = useState("");
  const [note, setNote] = useState("");
  const [linkedEntity, setLinkedEntity] = useState("");
  const [normalizedSummary, setNormalizedSummary] = useState("");
  const [screenshot, setScreenshot] = useState<ScreenshotDraft | null>(null);
  const [statusFilter, setStatusFilter] = useState<OperationalUpdateStatus | "all">("all");
  const [issueDrafts, setIssueDrafts] = useState<Record<number, IssueActionDraft>>({});
  const [taskDrafts, setTaskDrafts] = useState<Record<number, TaskActionDraft>>({});

  const counts = useMemo(() => {
    return OPERATIONAL_UPDATE_STATUS_OPTIONS.reduce(
      (acc, status) => {
        acc[status] = updates.filter((update) => update.status === status).length;
        return acc;
      },
      { new: 0, in_review: 0, processed: 0 } as Record<OperationalUpdateStatus, number>
    );
  }, [updates]);

  const filteredUpdates = useMemo(() => {
    if (statusFilter === "all") return updates;
    return updates.filter((update) => update.status === statusFilter);
  }, [statusFilter, updates]);

  const resetForm = () => {
    setSourceType("manual");
    setRawText("");
    setNote("");
    setLinkedEntity("");
    setNormalizedSummary("");
    setScreenshot(null);
  };

  const handleScreenshotChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
      toast.error("Only PNG, JPEG, and WebP screenshots are supported");
      return;
    }

    if (file.size > MAX_SCREENSHOT_BYTES) {
      toast.error("Screenshot must be 1 MB or smaller");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Unable to read screenshot"));
      reader.readAsDataURL(file);
    });

    setScreenshot({
      name: file.name,
      mimeType: file.type as ScreenshotDraft["mimeType"],
      size: file.size,
      dataUrl,
    });
    if (sourceType !== "screenshot") {
      setSourceType("screenshot");
    }
    toast.success("Screenshot attached");
  };

  const submitUpdate = async () => {
    if (!rawText.trim()) {
      toast.error("Please add the update text before submitting");
      return;
    }

    await createUpdate.mutateAsync({
      venueSlug,
      sourceType,
      rawText: rawText.trim(),
      status: "new",
      screenshot: screenshot || undefined,
      metadata: {
        note: note.trim() || undefined,
        linkedEntity: linkedEntity.trim() || undefined,
        normalizedSummary: normalizedSummary.trim() || undefined,
      },
    });

    resetForm();
  };

  const cycleStatus = async (id: number, current: OperationalUpdateStatus) => {
    const nextStatus: OperationalUpdateStatus = current === "new" ? "in_review" : current === "in_review" ? "processed" : "new";
    await updateStatus.mutateAsync({ id, status: nextStatus });
  };

  const getIssueDraft = (update: (typeof updates)[number]): IssueActionDraft => {
    return issueDrafts[update.id] ?? {
      title: update.metadata.normalizedSummary || update.rawText.slice(0, 80),
      description: update.rawText,
      priority: "medium",
      ownershipState: update.metadata.ownershipState || "awaiting_studio_soo",
      assignedTo: "Studio Soo",
      dueAt: "",
    };
  };

  const getTaskDraft = (update: (typeof updates)[number]): TaskActionDraft => {
    return taskDrafts[update.id] ?? {
      title: update.metadata.normalizedSummary || update.rawText.slice(0, 80),
      description: update.rawText,
      status: "open",
      ownershipState: update.metadata.ownershipState || "awaiting_studio_soo",
      assignedTo: "Studio Soo",
      dueAt: "",
    };
  };

  const updateIssueDraft = (updateId: number, patch: Partial<IssueActionDraft>) => {
    setIssueDrafts((current) => ({ ...current, [updateId]: { ...getIssueDraft(updates.find((item) => item.id === updateId)!), ...patch } }));
  };

  const updateTaskDraft = (updateId: number, patch: Partial<TaskActionDraft>) => {
    setTaskDrafts((current) => ({ ...current, [updateId]: { ...getTaskDraft(updates.find((item) => item.id === updateId)!), ...patch } }));
  };

  const createIssueFromUpdate = async (update: (typeof updates)[number]) => {
    const draft = getIssueDraft(update);
    const issue = await createIssue.mutateAsync({
      venueSlug,
      title: draft.title.trim(),
      description: draft.description.trim(),
      priority: draft.priority,
      ownershipState: draft.ownershipState,
      assignedTo: draft.assignedTo.trim(),
      linkedUpdateId: update.id,
      dueAt: toIsoDate(draft.dueAt),
      status: "open",
    });

    await updateStatus.mutateAsync({
      id: update.id,
      status: "processed",
      metadata: {
        ownershipState: draft.ownershipState,
        linkedIssueId: issue.id,
      },
    });
  };

  const createTaskFromUpdate = async (update: (typeof updates)[number]) => {
    const draft = getTaskDraft(update);
    const task = await createTask.mutateAsync({
      venueSlug,
      title: draft.title.trim(),
      description: draft.description.trim(),
      status: draft.status,
      ownershipState: draft.ownershipState,
      assignedTo: draft.assignedTo.trim(),
      linkedUpdateId: update.id,
      dueAt: toIsoDate(draft.dueAt),
    });

    await updateStatus.mutateAsync({
      id: update.id,
      status: "processed",
      metadata: {
        ownershipState: draft.ownershipState,
        linkedTaskId: task.id,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-[#B8900A]">Operations / Inbox</p>
          <h1 className="text-3xl font-semibold text-foreground">{venueLabel} Inbox</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Collect raw operational updates, screenshots, and handoff notes in one lightweight triage queue.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg border bg-muted/30 px-4 py-3"><p className="text-xl font-semibold">{counts.new}</p><p className="text-xs text-muted-foreground">New</p></div>
          <div className="rounded-lg border bg-muted/30 px-4 py-3"><p className="text-xl font-semibold">{counts.in_review}</p><p className="text-xs text-muted-foreground">In review</p></div>
          <div className="rounded-lg border bg-muted/30 px-4 py-3"><p className="text-xl font-semibold">{counts.processed}</p><p className="text-xs text-muted-foreground">Processed</p></div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquarePlus className="h-5 w-5 text-[#F5C72C]" /> Capture Update</CardTitle>
            <CardDescription>Supports paste-in text, manual notes, source tagging, and optional screenshot upload.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Source Type</Label>
                <Select value={sourceType} onValueChange={(value) => setSourceType(value as InboxSourceType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INBOX_SOURCE_TYPES.map((source) => (
                      <SelectItem key={source} value={source}>{source.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Linked Entity (optional)</Label>
                <Input value={linkedEntity} onChange={(event) => setLinkedEntity(event.target.value)} placeholder="promotion / campaign / task" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Inbox Text</Label>
              <Textarea
                value={rawText}
                onChange={(event) => setRawText(event.target.value)}
                rows={7}
                placeholder="Paste email copy, Teams updates, venue handoff notes, or write a manual summary here."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Manual Note</Label>
                <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Context for the reviewer" />
              </div>
              <div className="space-y-2">
                <Label>Normalized Summary</Label>
                <Textarea value={normalizedSummary} onChange={(event) => setNormalizedSummary(event.target.value)} rows={3} placeholder="Optional concise summary" />
              </div>
            </div>

            <div className="rounded-lg border border-dashed p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-[#F5C72C]/15 p-2 text-[#B8900A]"><Camera className="h-4 w-4" /></div>
                  <div>
                    <p className="font-medium text-foreground">Screenshot upload MVP</p>
                    <p className="text-sm text-muted-foreground">Images are stored as validated data URLs in the lightweight Phase 2 persistence store.</p>
                  </div>
                </div>
                <Label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-foreground">
                  <UploadCloud className="h-4 w-4" /> Upload screenshot
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleScreenshotChange} />
                </Label>
              </div>
              {screenshot ? (
                <div className="mt-4 overflow-hidden rounded-lg border bg-muted/20">
                  <div className="flex items-center justify-between gap-3 border-b px-3 py-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2"><Paperclip className="h-4 w-4 shrink-0" /><span className="truncate">{screenshot.name}</span></div>
                    <span className="text-muted-foreground">{Math.round(screenshot.size / 1024)} KB</span>
                  </div>
                  <img src={screenshot.dataUrl} alt={screenshot.name} className="max-h-64 w-full object-contain bg-black/5" />
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No screenshot attached.</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 p-4 text-sm text-muted-foreground">
              <p>Submitted items capture provenance via source type, submitter, timestamps, notes, and optional screenshot metadata.</p>
              <Button onClick={submitUpdate} disabled={createUpdate.isPending}>{createUpdate.isPending ? "Submitting…" : "Submit to Inbox"}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Inbox className="h-5 w-5 text-[#F5C72C]" /> Review Queue</CardTitle>
            <CardDescription>Status changes are intentionally lightweight: new → in review → processed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="list" className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <TabsList>
                  <TabsTrigger value="list">List View</TabsTrigger>
                  <TabsTrigger value="review">Review View</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OperationalUpdateStatus | "all") }>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {OPERATIONAL_UPDATE_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>{status.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="list" className="space-y-3">
                {filteredUpdates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No inbox items for the selected filter.</p>
                ) : filteredUpdates.map((update) => (
                  <div key={update.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{update.sourceType.replace(/_/g, " ")}</Badge>
                          <Badge variant={statusTone(update.status)}>{update.status.replace(/_/g, " ")}</Badge>
                          {update.screenshot ? <Badge variant="secondary">screenshot</Badge> : null}
                          {update.metadata.linkedIssueId ? <Badge variant="secondary">issue #{update.metadata.linkedIssueId}</Badge> : null}
                          {update.metadata.linkedTaskId ? <Badge variant="secondary">task #{update.metadata.linkedTaskId}</Badge> : null}
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{update.rawText}</p>
                        {update.metadata.normalizedSummary ? <p className="text-sm text-muted-foreground"><strong className="text-foreground">Summary:</strong> {update.metadata.normalizedSummary}</p> : null}
                        {update.metadata.note ? <p className="text-sm text-muted-foreground"><strong className="text-foreground">Note:</strong> {update.metadata.note}</p> : null}
                        <p className="text-xs text-muted-foreground">Submitted {new Date(update.submittedAt).toLocaleString()} by {update.submittedBy}</p>
                      </div>
                      <Button variant="outline" onClick={() => cycleStatus(update.id, update.status)} disabled={updateStatus.isPending}>Move to next status</Button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="review" className="space-y-4">
                {filteredUpdates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No inbox items to review.</p>
                ) : filteredUpdates.map((update) => {
                  const issueDraft = getIssueDraft(update);
                  const taskDraft = getTaskDraft(update);

                  return (
                    <Card key={update.id} className="border-dashed">
                      <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{update.sourceType.replace(/_/g, " ")}</Badge>
                          <Badge variant={statusTone(update.status)}>{update.status.replace(/_/g, " ")}</Badge>
                          {update.metadata.linkedEntity ? <Badge variant="secondary">{update.metadata.linkedEntity}</Badge> : null}
                        </div>
                        <CardDescription>{new Date(update.submittedAt).toLocaleString()} · {update.submittedBy}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Raw submission</p>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{update.rawText}</p>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reviewer note</p>
                                <p className="mt-2 text-foreground">{update.metadata.note || "No note added"}</p>
                              </div>
                              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Normalized summary</p>
                                <p className="mt-2 text-foreground">{update.metadata.normalizedSummary || "Not normalized yet"}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {update.screenshot ? (
                              <div className="overflow-hidden rounded-lg border">
                                <img src={update.screenshot.dataUrl} alt={update.screenshot.name} className="max-h-64 w-full object-contain bg-black/5" />
                                <div className="border-t px-3 py-2 text-xs text-muted-foreground">{update.screenshot.name} · {Math.round(update.screenshot.size / 1024)} KB</div>
                              </div>
                            ) : (
                              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No screenshot attached</div>
                            )}
                            <Button className="w-full" variant="outline" onClick={() => cycleStatus(update.id, update.status)} disabled={updateStatus.isPending}>Move to next status</Button>
                          </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                          <div className="rounded-lg border p-4 space-y-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">Create issue</p>
                              <p className="text-xs text-muted-foreground">Use when the item represents a blocker, risk, or unresolved gap.</p>
                            </div>
                            <Input value={issueDraft.title} onChange={(event) => updateIssueDraft(update.id, { title: event.target.value })} placeholder="Issue title" />
                            <Textarea value={issueDraft.description} onChange={(event) => updateIssueDraft(update.id, { description: event.target.value })} rows={3} placeholder="Issue description" />
                            <div className="grid gap-3 md:grid-cols-2">
                              <InlineSelect label="Priority" value={issueDraft.priority} options={ISSUE_PRIORITY_OPTIONS} onValueChange={(value) => updateIssueDraft(update.id, { priority: value as IssuePriority })} />
                              <InlineSelect label="Ownership" value={issueDraft.ownershipState} options={OWNERSHIP_STATE_OPTIONS} onValueChange={(value) => updateIssueDraft(update.id, { ownershipState: value as OwnershipState })} />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Assigned to</Label>
                                <Input value={issueDraft.assignedTo} onChange={(event) => updateIssueDraft(update.id, { assignedTo: event.target.value })} placeholder="Studio Soo / HQ support" />
                              </div>
                              <div className="space-y-2">
                                <Label>Due date</Label>
                                <Input type="date" value={issueDraft.dueAt} onChange={(event) => updateIssueDraft(update.id, { dueAt: event.target.value })} />
                              </div>
                            </div>
                            <Button className="w-full" onClick={() => createIssueFromUpdate(update)} disabled={createIssue.isPending || updateStatus.isPending || Boolean(update.metadata.linkedIssueId)}>
                              {update.metadata.linkedIssueId ? `Linked to issue #${update.metadata.linkedIssueId}` : "Create issue + mark processed"}
                            </Button>
                          </div>

                          <div className="rounded-lg border p-4 space-y-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">Create task</p>
                              <p className="text-xs text-muted-foreground">Use when the item is now a concrete execution step or follow-up.</p>
                            </div>
                            <Input value={taskDraft.title} onChange={(event) => updateTaskDraft(update.id, { title: event.target.value })} placeholder="Task title" />
                            <Textarea value={taskDraft.description} onChange={(event) => updateTaskDraft(update.id, { description: event.target.value })} rows={3} placeholder="Task description" />
                            <div className="grid gap-3 md:grid-cols-2">
                              <InlineSelect label="Status" value={taskDraft.status} options={TASK_STATUS_OPTIONS} onValueChange={(value) => updateTaskDraft(update.id, { status: value as TaskStatus })} />
                              <InlineSelect label="Ownership" value={taskDraft.ownershipState} options={OWNERSHIP_STATE_OPTIONS} onValueChange={(value) => updateTaskDraft(update.id, { ownershipState: value as OwnershipState })} />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Assigned to</Label>
                                <Input value={taskDraft.assignedTo} onChange={(event) => updateTaskDraft(update.id, { assignedTo: event.target.value })} placeholder="Studio Soo / Venue Admin" />
                              </div>
                              <div className="space-y-2">
                                <Label>Due date</Label>
                                <Input type="date" value={taskDraft.dueAt} onChange={(event) => updateTaskDraft(update.id, { dueAt: event.target.value })} />
                              </div>
                            </div>
                            <Button className="w-full" variant="outline" onClick={() => createTaskFromUpdate(update)} disabled={createTask.isPending || updateStatus.isPending || Boolean(update.metadata.linkedTaskId)}>
                              {update.metadata.linkedTaskId ? `Linked to task #${update.metadata.linkedTaskId}` : "Create task + mark processed"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InlineSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onValueChange: (value: string) => void;
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
