import { eq, and, or, gte, lte, desc, sql, between, like, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  campaigns,
  InsertCampaign,
  Campaign,
  channels,
  InsertChannel,
  Channel,
  channelMetrics,
  InsertChannelMetric,
  ChannelMetric,
  members,
  InsertMember,
  Member,
  revenue,
  InsertRevenue,
  Revenue,
  tasks,
  InsertTask,
  Task,
  reports,
  InsertReport,
  Report,
  campaignExpenses,
  InsertCampaignExpense,
  CampaignExpense,
  programCampaigns,
  InsertProgramCampaign,
  ProgramCampaign,
  landingPages,
  InsertLandingPage,
  LandingPage,
  pageAnalytics,
  InsertPageAnalytics,
  PageAnalytics,
  anniversaryGiveawayEntries,
  membershipEvents,
  MembershipEvent,
  NewMembershipEvent,
  cfFunnels,
  cfFormSubmissions,
} from "../drizzle/schema";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

const reportingStorePath = path.join(process.cwd(), ".manus-logs", "phase2-reporting-store.json");

type ReportTemplateType = "weekly_executive" | "monthly_marketing" | "paid_media";
type BriefTemplateType = "weekly_ops" | "paid_media_one_pager" | "promotion_status" | "issue_blocker" | "branch_update";
type ReportDraftStatus = "draft" | "ready" | "archived";
type BriefStatus = "draft" | "ready" | "shared";
type OperationalUpdateStatus = "new" | "in_review" | "processed";
type OperationalSourceType = "manual" | "email" | "teams" | "screenshot" | "hq_summary" | "venue_update" | "imported";
type OwnershipState =
  | "awaiting_studio_soo"
  | "awaiting_venue"
  | "awaiting_hq"
  | "awaiting_follow_up"
  | "blocked_by_staffing"
  | "blocked_by_missing_data"
  | "needs_approval"
  | "needs_local_execution"
  | "needs_creative"
  | "needs_booking_follow_up";
type IssueStatus = "open" | "in_progress" | "blocked" | "resolved";
type IssuePriority = "low" | "medium" | "high" | "critical";
type TaskStatus = "open" | "in_progress" | "done" | "blocked";

type ReportDraftRecord = {
  id: number;
  venueSlug: string;
  reportType: ReportTemplateType;
  title: string;
  dateRangeLabel?: string | null;
  status: ReportDraftStatus;
  content: {
    summary?: string;
    sections: Array<{ heading: string; body: string }>;
    highlights: string[];
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type BriefRecord = {
  id: number;
  venueSlug: string;
  briefType: BriefTemplateType;
  title: string;
  status: BriefStatus;
  linkedCampaignId?: string | null;
  linkedProgramId?: string | null;
  linkedPromotionId?: string | null;
  content: {
    effectiveDate?: string;
    dateRangeLabel?: string;
    summary: string;
    topHighlights: string[];
    blockers: string[];
    nextActions: string[];
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type OperationalUpdateRecord = {
  id: number;
  venueSlug: string;
  sourceType: OperationalSourceType;
  rawText: string;
  linkedCampaignId?: string | null;
  linkedProgramId?: string | null;
  linkedPromotionId?: string | null;
  screenshot?: {
    name: string;
    mimeType: "image/png" | "image/jpeg" | "image/webp";
    size: number;
    dataUrl: string;
  } | null;
  status: OperationalUpdateStatus;
  metadata: {
    note?: string;
    linkedEntity?: string;
    normalizedSummary?: string;
    ownershipState?: OwnershipState;
    linkedIssueId?: number;
    linkedTaskId?: number;
  };
  submittedBy: string;
  submittedAt: string;
  updatedAt: string;
};

type IssueRecord = {
  id: number;
  venueSlug: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  ownershipState: OwnershipState;
  assignedTo: string;
  linkedUpdateId?: number | null;
  linkedCampaignId?: string | null;
  linkedProgramId?: string | null;
  linkedPromotionId?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueAt?: string | null;
};

type TaskRecord = {
  id: number;
  venueSlug: string;
  title: string;
  description: string;
  status: TaskStatus;
  ownershipState: OwnershipState;
  assignedTo: string;
  linkedIssueId?: number | null;
  linkedUpdateId?: number | null;
  linkedCampaignId?: string | null;
  linkedProgramId?: string | null;
  linkedPromotionId?: string | null;
  externalTaskRef?: {
    provider: "asana";
    taskGid: string;
    permalinkUrl?: string;
    status: "created" | "not_configured" | "failed";
    message?: string;
  } | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueAt?: string | null;
};

type ReportingStore = {
  nextIds: {
    reportDraft: number;
    brief: number;
    operationalUpdate: number;
    issue: number;
    task: number;
  };
  reportDrafts: ReportDraftRecord[];
  briefs: BriefRecord[];
  operationalUpdates: OperationalUpdateRecord[];
  issues: IssueRecord[];
  tasks: TaskRecord[];
};

const defaultReportingStore = (): ReportingStore => ({
  nextIds: {
    reportDraft: 3,
    brief: 2,
    operationalUpdate: 3,
    issue: 3,
    task: 4,
  },
  reportDrafts: [
    {
      id: 1,
      venueSlug: "arlington-heights",
      reportType: "weekly_executive",
      title: "Arlington Heights Weekly Executive Report",
      dateRangeLabel: "This Week",
      status: "draft",
      content: {
        summary: "Weekly leadership snapshot covering revenue, member activity, and immediate campaign watchpoints.",
        sections: [
          { heading: "Executive Summary", body: "Draft summary prepared for venue leadership review." },
        ],
        highlights: ["Review paid media pacing", "Confirm weekly branch update inputs"],
      },
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      venueSlug: "arlington-heights",
      reportType: "paid_media",
      title: "Paid Media Report",
      dateRangeLabel: "Last 30 Days",
      status: "ready",
      content: {
        summary: "Paid media performance recap with spend, reach, and campaign notes.",
        sections: [
          { heading: "Channel Summary", body: "Initial draft created from current reporting workspace." },
        ],
        highlights: ["Meta ads spend stabilized", "Need fresh creative for top campaign"],
      },
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  briefs: [
    {
      id: 1,
      venueSlug: "arlington-heights",
      briefType: "weekly_ops",
      title: "Weekly Ops Brief",
      status: "draft",
      content: {
        effectiveDate: new Date().toISOString().slice(0, 10),
        summary: "Current week operations summary is in progress.",
        topHighlights: ["Inbox now accepts manual updates and screenshots"],
        blockers: ["Need a final call on unresolved promotion copy"],
        nextActions: ["Review new inbox items by source type"],
      },
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  operationalUpdates: [
    {
      id: 1,
      venueSlug: "arlington-heights",
      sourceType: "venue_update",
      rawText: "Front desk flagged two promo questions for the current giveaway signage.",
      status: "new",
      metadata: {
        note: "Needs HQ review",
        linkedEntity: "promotion",
        ownershipState: "awaiting_hq",
      },
      submittedBy: "system",
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      venueSlug: "arlington-heights",
      sourceType: "hq_summary",
      rawText: "HQ requested a lightweight weekly branch summary for Monday leadership review.",
      status: "in_review",
      metadata: {
        normalizedSummary: "Prepare a branch update summary brief",
        ownershipState: "awaiting_studio_soo",
      },
      submittedBy: "system",
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  issues: [
    {
      id: 1,
      venueSlug: "arlington-heights",
      title: "Promo signage questions unresolved",
      description: "Front desk needs confirmation on giveaway signage language before local execution.",
      status: "open",
      priority: "high",
      ownershipState: "awaiting_hq",
      assignedTo: "HQ support",
      linkedUpdateId: 1,
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: 2,
      venueSlug: "arlington-heights",
      title: "Weekly branch summary still pending",
      description: "Leadership review needs the branch summary brief finalized before Monday morning.",
      status: "in_progress",
      priority: "medium",
      ownershipState: "awaiting_studio_soo",
      assignedTo: "Studio Soo",
      linkedUpdateId: 2,
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    },
  ],
  tasks: [
    {
      id: 1,
      venueSlug: "arlington-heights",
      title: "Follow up with HQ on signage copy",
      description: "Confirm whether current giveaway signage is approved for local display.",
      status: "open",
      ownershipState: "awaiting_hq",
      assignedTo: "HQ support",
      linkedIssueId: 1,
      linkedUpdateId: 1,
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      externalTaskRef: null,
    },
    {
      id: 2,
      venueSlug: "arlington-heights",
      title: "Prepare weekly branch update brief",
      description: "Pull inbox/context into a branch update summary for Monday leadership review.",
      status: "in_progress",
      ownershipState: "awaiting_studio_soo",
      assignedTo: "Studio Soo",
      linkedIssueId: 2,
      linkedUpdateId: 2,
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      externalTaskRef: null,
    },
    {
      id: 3,
      venueSlug: "arlington-heights",
      title: "Confirm local execution owner for upcoming promo",
      description: "Venue admin needs to confirm who will handle on-site execution this week.",
      status: "blocked",
      ownershipState: "awaiting_venue",
      assignedTo: "Venue Admin",
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      externalTaskRef: null,
    },
  ],
});

async function readReportingStore(): Promise<ReportingStore> {
  try {
    const raw = await readFile(reportingStorePath, "utf8");
    return JSON.parse(raw) as ReportingStore;
  } catch {
    const initial = defaultReportingStore();
    await writeReportingStore(initial);
    return initial;
  }
}

async function writeReportingStore(store: ReportingStore): Promise<void> {
  await mkdir(path.dirname(reportingStorePath), { recursive: true });
  await writeFile(reportingStorePath, JSON.stringify(store, null, 2), "utf8");
}

export function getReportingTemplates() {
  return {
    reports: [
      {
        type: "weekly_executive" as const,
        title: "Arlington Heights Weekly Executive Report",
        description: "A recurring leadership report for weekly venue performance, issues, and key actions.",
        cadence: "Weekly",
      },
      {
        type: "monthly_marketing" as const,
        title: "Arlington Heights Monthly Marketing Report",
        description: "Monthly view of campaigns, channel activity, and venue marketing outcomes.",
        cadence: "Monthly",
      },
      {
        type: "paid_media" as const,
        title: "Paid Media Report",
        description: "Channel-specific report focused on spend, efficiency, and current paid campaign learnings.",
        cadence: "As Needed",
      },
    ],
    briefs: [
      { type: "weekly_ops" as const, title: "Weekly Ops Brief" },
      { type: "paid_media_one_pager" as const, title: "Paid Media One-Pager" },
      { type: "promotion_status" as const, title: "Promotion Status Brief" },
      { type: "issue_blocker" as const, title: "Issue / Blocker Brief" },
      { type: "branch_update" as const, title: "Branch Update Summary" },
    ],
    sourceTypes: ["manual", "email", "teams", "screenshot", "hq_summary", "venue_update", "imported"] as const,
  };
}

export async function listReportDrafts(venueSlug: string) {
  const store = await readReportingStore();
  return store.reportDrafts
    .filter((record) => record.venueSlug === venueSlug)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createReportDraft(input: Omit<ReportDraftRecord, "id" | "createdAt" | "updatedAt">) {
  const store = await readReportingStore();
  const timestamp = new Date().toISOString();
  const record: ReportDraftRecord = {
    id: store.nextIds.reportDraft++,
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.reportDrafts.unshift(record);
  await writeReportingStore(store);
  return record;
}

export async function updateReportDraft(
  id: number,
  updates: Pick<ReportDraftRecord, "title" | "dateRangeLabel" | "status" | "content">
) {
  const store = await readReportingStore();
  const record = store.reportDrafts.find((item) => item.id === id);
  if (!record) throw new Error("Report draft not found");
  record.title = updates.title;
  record.dateRangeLabel = updates.dateRangeLabel;
  record.status = updates.status;
  record.content = updates.content;
  record.updatedAt = new Date().toISOString();
  await writeReportingStore(store);
  return record;
}

export async function listBriefs(venueSlug: string) {
  const store = await readReportingStore();
  return store.briefs
    .filter((record) => record.venueSlug === venueSlug)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createBrief(input: Omit<BriefRecord, "id" | "createdAt" | "updatedAt">) {
  const store = await readReportingStore();
  const timestamp = new Date().toISOString();
  const record: BriefRecord = {
    id: store.nextIds.brief++,
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.briefs.unshift(record);
  await writeReportingStore(store);
  return record;
}

export async function updateBrief(
  id: number,
  updates: Pick<BriefRecord, "title" | "status" | "content" | "linkedCampaignId" | "linkedProgramId" | "linkedPromotionId">
) {
  const store = await readReportingStore();
  const record = store.briefs.find((item) => item.id === id);
  if (!record) throw new Error("Brief not found");
  record.title = updates.title;
  record.status = updates.status;
  record.linkedCampaignId = updates.linkedCampaignId ?? null;
  record.linkedProgramId = updates.linkedProgramId ?? null;
  record.linkedPromotionId = updates.linkedPromotionId ?? null;
  record.content = updates.content;
  record.updatedAt = new Date().toISOString();
  await writeReportingStore(store);
  return record;
}

export async function listOperationalUpdates(venueSlug: string) {
  const store = await readReportingStore();
  return store.operationalUpdates
    .filter((record) => record.venueSlug === venueSlug)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function createOperationalUpdate(
  input: Omit<OperationalUpdateRecord, "id" | "submittedAt" | "updatedAt">
) {
  const store = await readReportingStore();
  const timestamp = new Date().toISOString();
  const record: OperationalUpdateRecord = {
    id: store.nextIds.operationalUpdate++,
    ...input,
    submittedAt: timestamp,
    updatedAt: timestamp,
  };
  store.operationalUpdates.unshift(record);
  await writeReportingStore(store);
  return record;
}

export async function updateOperationalUpdate(
  id: number,
  updates: Pick<OperationalUpdateRecord, "status"> & {
    metadata?: OperationalUpdateRecord["metadata"];
    linkedCampaignId?: string | null;
    linkedProgramId?: string | null;
    linkedPromotionId?: string | null;
  }
) {
  const store = await readReportingStore();
  const record = store.operationalUpdates.find((item) => item.id === id);
  if (!record) throw new Error("Operational update not found");
  record.status = updates.status;
  if (updates.metadata) {
    record.metadata = {
      ...record.metadata,
      ...updates.metadata,
    };
  }
  if ("linkedCampaignId" in updates) record.linkedCampaignId = updates.linkedCampaignId ?? null;
  if ("linkedProgramId" in updates) record.linkedProgramId = updates.linkedProgramId ?? null;
  if ("linkedPromotionId" in updates) record.linkedPromotionId = updates.linkedPromotionId ?? null;
  record.updatedAt = new Date().toISOString();
  await writeReportingStore(store);
  return record;
}


export async function listIssues(venueSlug: string) {
  const store = await readReportingStore();
  return store.issues
    .filter((record) => record.venueSlug === venueSlug)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createIssue(input: Omit<IssueRecord, "id" | "createdAt" | "updatedAt">) {
  const store = await readReportingStore();
  const timestamp = new Date().toISOString();
  const record: IssueRecord = {
    id: store.nextIds.issue++,
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.issues.unshift(record);
  if (record.linkedUpdateId) {
    const update = store.operationalUpdates.find((item) => item.id === record.linkedUpdateId);
    if (update) {
      update.metadata = { ...update.metadata, linkedIssueId: record.id, ownershipState: record.ownershipState };
      update.updatedAt = timestamp;
    }
  }
  await writeReportingStore(store);
  return record;
}

export async function updateIssue(
  id: number,
  updates: Pick<IssueRecord, "title" | "description" | "status" | "priority" | "ownershipState" | "assignedTo" | "dueAt"> & {
    linkedUpdateId?: number | null;
    linkedCampaignId?: string | null;
    linkedProgramId?: string | null;
    linkedPromotionId?: string | null;
  }
) {
  const store = await readReportingStore();
  const record = store.issues.find((item) => item.id === id);
  if (!record) throw new Error("Issue not found");
  record.title = updates.title;
  record.description = updates.description;
  record.status = updates.status;
  record.priority = updates.priority;
  record.ownershipState = updates.ownershipState;
  record.assignedTo = updates.assignedTo;
  record.dueAt = updates.dueAt;
  record.linkedUpdateId = updates.linkedUpdateId ?? null;
  record.linkedCampaignId = updates.linkedCampaignId ?? null;
  record.linkedProgramId = updates.linkedProgramId ?? null;
  record.linkedPromotionId = updates.linkedPromotionId ?? null;
  record.updatedAt = new Date().toISOString();
  if (record.linkedUpdateId) {
    const update = store.operationalUpdates.find((item) => item.id === record.linkedUpdateId);
    if (update) {
      update.metadata = { ...update.metadata, linkedIssueId: record.id, ownershipState: record.ownershipState };
      update.updatedAt = record.updatedAt;
    }
  }
  await writeReportingStore(store);
  return record;
}

export async function listTasks(venueSlug: string) {
  const store = await readReportingStore();
  return store.tasks
    .filter((record) => record.venueSlug === venueSlug)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createTask(input: Omit<TaskRecord, "id" | "createdAt" | "updatedAt">) {
  const store = await readReportingStore();
  const timestamp = new Date().toISOString();
  const record: TaskRecord = {
    id: store.nextIds.task++,
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.tasks.unshift(record);
  if (record.linkedUpdateId) {
    const update = store.operationalUpdates.find((item) => item.id === record.linkedUpdateId);
    if (update) {
      update.metadata = { ...update.metadata, linkedTaskId: record.id, ownershipState: record.ownershipState };
      update.updatedAt = timestamp;
    }
  }
  await writeReportingStore(store);
  return record;
}

export async function getTaskById(id: number) {
  const store = await readReportingStore();
  return store.tasks.find((item) => item.id === id) ?? null;
}

export async function updateTask(
  id: number,
  updates: Pick<TaskRecord, "title" | "description" | "status" | "ownershipState" | "assignedTo" | "dueAt" | "externalTaskRef"> & {
    linkedIssueId?: number | null;
    linkedUpdateId?: number | null;
    linkedCampaignId?: string | null;
    linkedProgramId?: string | null;
    linkedPromotionId?: string | null;
  }
) {
  const store = await readReportingStore();
  const record = store.tasks.find((item) => item.id === id);
  if (!record) throw new Error("Task not found");
  record.title = updates.title;
  record.description = updates.description;
  record.status = updates.status;
  record.ownershipState = updates.ownershipState;
  record.assignedTo = updates.assignedTo;
  record.dueAt = updates.dueAt;
  record.linkedIssueId = updates.linkedIssueId ?? null;
  record.linkedUpdateId = updates.linkedUpdateId ?? null;
  record.linkedCampaignId = updates.linkedCampaignId ?? null;
  record.linkedProgramId = updates.linkedProgramId ?? null;
  record.linkedPromotionId = updates.linkedPromotionId ?? null;
  record.externalTaskRef = updates.externalTaskRef ?? null;
  record.updatedAt = new Date().toISOString();
  if (record.linkedUpdateId) {
    const update = store.operationalUpdates.find((item) => item.id === record.linkedUpdateId);
    if (update) {
      update.metadata = { ...update.metadata, linkedTaskId: record.id, ownershipState: record.ownershipState };
      update.updatedAt = record.updatedAt;
    }
  }
  await writeReportingStore(store);
  return record;
}

export async function getThisWeekSummary(venueSlug: string) {
  const store = await readReportingStore();
  const updates = store.operationalUpdates.filter((record) => record.venueSlug === venueSlug);
  const issues = store.issues.filter((record) => record.venueSlug === venueSlug);
  const tasks = store.tasks.filter((record) => record.venueSlug === venueSlug);

  const blockedItems = [
    ...issues.filter((issue) => issue.status === "blocked"),
    ...tasks.filter((task) => task.status === "blocked"),
  ];

  const ownershipBuckets = {
    awaiting_studio_soo: [] as Array<{ kind: "issue" | "task"; id: number; title: string; status: string }>,
    awaiting_venue: [] as Array<{ kind: "issue" | "task"; id: number; title: string; status: string }>,
    awaiting_hq: [] as Array<{ kind: "issue" | "task"; id: number; title: string; status: string }>,
  };

  for (const issue of issues) {
    if (issue.ownershipState in ownershipBuckets) {
      ownershipBuckets[issue.ownershipState as keyof typeof ownershipBuckets].push({ kind: "issue", id: issue.id, title: issue.title, status: issue.status });
    }
  }
  for (const task of tasks) {
    if (task.ownershipState in ownershipBuckets) {
      ownershipBuckets[task.ownershipState as keyof typeof ownershipBuckets].push({ kind: "task", id: task.id, title: task.title, status: task.status });
    }
  }

  const dueTasks = tasks.filter((task) => task.status !== "done" && task.dueAt);
  const topPriorities = [
    ...issues.filter((issue) => issue.status !== "resolved").sort((a, b) => a.priority.localeCompare(b.priority)).slice(0, 3).map((issue) => ({ kind: "issue" as const, id: issue.id, title: issue.title, status: issue.status, ownershipState: issue.ownershipState })),
    ...tasks.filter((task) => task.status !== "done").slice(0, 3).map((task) => ({ kind: "task" as const, id: task.id, title: task.title, status: task.status, ownershipState: task.ownershipState })),
  ].slice(0, 6);

  return {
    counts: {
      newInboxItems: updates.filter((update) => update.status === "new").length,
      openIssues: issues.filter((issue) => issue.status !== "resolved").length,
      dueTasks: dueTasks.length,
      blockedItems: blockedItems.length,
    },
    topPriorities,
    ownershipBuckets,
    upcoming: {
      inbox: updates.slice(0, 5),
      issues: issues.filter((issue) => issue.status !== "resolved").slice(0, 5),
      tasks: tasks.filter((task) => task.status !== "done").slice(0, 5),
    },
  };
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= User Functions =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= Campaign Functions =============

export async function getAllCampaigns() {
  const db = await getDb();
  if (!db) return [];
  
  // Sort by display_order first (explicit ordering), then status priority, then start date
  const allCampaigns = await db.select().from(campaigns);
  
  const statusPriority: Record<string, number> = {
    'active': 1,
    'planned': 2,
    'paused': 3,
    'completed': 4
  };
  
  return allCampaigns.sort((a, b) => {
    // Primary: display_order (null/undefined goes last)
    const orderA = a.display_order ?? 9999;
    const orderB = b.display_order ?? 9999;
    if (orderA !== orderB) return orderA - orderB;
    
    // Secondary: status priority
    const priorityA = statusPriority[a.status] || 5;
    const priorityB = statusPriority[b.status] || 5;
    if (priorityA !== priorityB) return priorityA - priorityB;
    
    // Tertiary: start date descending
    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return dateB - dateA;
  });
}

export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result[0];
}

export async function getCampaignsByStatus(status: Campaign["status"]) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(campaigns).where(eq(campaigns.status, status)).orderBy(desc(campaigns.startDate));
}

export async function getCampaignsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(campaigns)
    .where(
      and(
        gte(campaigns.startDate, startDate),
        lte(campaigns.endDate, endDate)
      )
    )
    .orderBy(desc(campaigns.startDate));
}

export async function createCampaign(campaign: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(campaigns).values(campaign);
  return Number(result[0].insertId);
}

export async function updateCampaign(id: number, updates: Partial<InsertCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(campaigns).set(updates).where(eq(campaigns.id, id));
}

export async function updateCampaignVisuals(
  id: number,
  visuals: {
    landingPageUrl?: string;
    posterImageUrl?: string;
    reelThumbnailUrl?: string;
    additionalVisuals?: string[];
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(campaigns).set(visuals).where(eq(campaigns.id, id));
}

export async function getCampaignsByCategory(category: Campaign["category"]) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(campaigns).where(eq(campaigns.category, category)).orderBy(desc(campaigns.startDate));
}

export async function getCategorySummary() {
  const db = await getDb();
  if (!db) return [];
  
  // Get all campaigns grouped by category with aggregated metrics
  const allCampaigns = await db.select().from(campaigns);
  
  const categories = [
    { id: "trial_conversion", name: "Trial Conversion Campaign", description: "Converting prospects to members" },
    { id: "membership_acquisition", name: "Membership Acquisition Campaign", description: "Annual and monthly membership giveaways" },
    { id: "member_retention", name: "Member Retention + Community Flywheel", description: "Drive days, tournaments, and member engagement" },
    { id: "corporate_events", name: "Corporate Events & B2B Sales Campaign", description: "Corporate bookings and B2B partnerships" }
  ];
  
  return categories.map(cat => {
    const categoryCampaigns = allCampaigns.filter(c => c.category === cat.id);
    
    const totalBudget = categoryCampaigns.reduce((sum, c) => sum + Number(c.budget || 0), 0);
    const totalSpend = categoryCampaigns.reduce((sum, c) => sum + Number(c.actualSpend || 0), 0);
    const totalRevenue = categoryCampaigns.reduce((sum, c) => sum + Number(c.actualRevenue || 0), 0);
    const totalMetaAdsSpend = categoryCampaigns.reduce((sum, c) => sum + Number(c.metaAdsSpend || 0), 0);
    
    const activeCampaigns = categoryCampaigns.filter(c => c.status === "active").length;
    const completedCampaigns = categoryCampaigns.filter(c => c.status === "completed").length;
    
    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    
    // Get visual assets from campaigns (up to 3 recent campaigns with visuals)
    const campaignsWithVisuals = categoryCampaigns
      .filter(c => c.landingPageUrl || c.posterImageUrl || c.reelThumbnailUrl)
      .slice(0, 3);
    
    const visualPreviews = campaignsWithVisuals.map(c => ({
      landingPageUrl: c.landingPageUrl,
      posterImageUrl: c.posterImageUrl,
      reelThumbnailUrl: c.reelThumbnailUrl,
      campaignName: c.name
    }));
    
    return {
      ...cat,
      totalBudget,
      totalSpend,
      totalRevenue,
      totalMetaAdsSpend,
      activeCampaigns,
      completedCampaigns,
      totalCampaigns: categoryCampaigns.length,
      roi,
      visualPreviews
    };
  });
}

// ============= Channel Functions =============

export async function getAllChannels() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(channels).where(eq(channels.isActive, true));
}

export async function getChannelById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
  return result[0];
}

export async function createChannel(channel: InsertChannel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(channels).values(channel);
  return Number(result[0].insertId);
}

// ============= Channel Metrics Functions =============

export async function getChannelMetricsByDateRange(channelId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(channelMetrics)
    .where(
      and(
        eq(channelMetrics.channelId, channelId),
        gte(channelMetrics.date, startDate),
        lte(channelMetrics.date, endDate)
      )
    )
    .orderBy(channelMetrics.date);
}

export async function getChannelMetricsByCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(channelMetrics)
    .where(eq(channelMetrics.campaignId, campaignId))
    .orderBy(channelMetrics.date);
}

export async function createChannelMetric(metric: InsertChannelMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(channelMetrics).values(metric);
  return Number(result[0].insertId);
}

export async function getChannelPerformanceSummary(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      channelId: channelMetrics.channelId,
      channelName: channels.name,
      channelType: channels.type,
      totalImpressions: sql<number>`SUM(${channelMetrics.impressions})`,
      totalClicks: sql<number>`SUM(${channelMetrics.clicks})`,
      totalConversions: sql<number>`SUM(${channelMetrics.conversions})`,
      totalSpend: sql<string>`SUM(${channelMetrics.spend})`,
      totalRevenue: sql<string>`SUM(${channelMetrics.revenue})`,
    })
    .from(channelMetrics)
    .innerJoin(channels, eq(channelMetrics.channelId, channels.id))
    .where(
      and(
        gte(channelMetrics.date, startDate),
        lte(channelMetrics.date, endDate)
      )
    )
    .groupBy(channelMetrics.channelId, channels.name, channels.type);
}

// ============= Member Functions =============

export async function getAllMembers(filters?: { search?: string; status?: Member["status"]; membershipTier?: Member["membershipTier"]; venueId?: number; }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(members);
  
  const conditions: SQL<unknown>[] = [];
  // Always scope by venue — default to Arlington Heights (1) until multi-venue UI is built
  conditions.push(eq(members.venueId, filters?.venueId ?? 1));
  if (filters?.search) {
    const searchCond = or(
      like(members.name, `%${filters.search}%`),
      like(members.email, `%${filters.search}%`)
    );
    if (searchCond) conditions.push(searchCond);
  }
  if (filters?.status) {
    conditions.push(eq(members.status, filters.status));
  }
  if (filters?.membershipTier) {
    conditions.push(eq(members.membershipTier, filters.membershipTier));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query.orderBy(desc(members.joinDate));
}

export async function getMemberById(id: number, venueId = 1) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(members).where(and(eq(members.id, id), eq(members.venueId, venueId))).limit(1);
  return result[0];
}

export async function getMembersByStatus(status: Member["status"], venueId = 1) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(members).where(and(eq(members.status, status), eq(members.venueId, venueId))).orderBy(desc(members.joinDate));
}
export async function getMembersByTier(tier: Member["membershipTier"], venueId = 1) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(members).where(and(eq(members.membershipTier, tier), eq(members.venueId, venueId))).orderBy(desc(members.joinDate));
}

export async function createMember(member: InsertMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(members).values(member);
  return Number(result[0].insertId);
}

export async function updateMember(id: number, updates: Partial<InsertMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(members).set(updates).where(eq(members.id, id));
}

export async function getMemberStats(venueId = 1) {
  const db = await getDb();
  if (!db) return null;
  
  const stats = await db
    .select({
      totalMembers: sql<number>`COUNT(*)`,
      activeMembers: sql<number>`SUM(CASE WHEN ${members.status} = 'active' THEN 1 ELSE 0 END)`,
      // Active paying members = All Access Aces + Swing Savers + Golf VX Pro + Family (all active tiers)
      activePayingMembers: sql<number>`SUM(CASE WHEN ${members.status} = 'active' AND ${members.membershipTier} IN ('all_access_aces', 'swing_savers', 'golf_vx_pro', 'family', 'monthly', 'annual', 'corporate') THEN 1 ELSE 0 END)`,
      allAccessCount: sql<number>`SUM(CASE WHEN ${members.membershipTier} = 'all_access_aces' AND ${members.status} = 'active' THEN 1 ELSE 0 END)`,
      swingSaversCount: sql<number>`SUM(CASE WHEN ${members.membershipTier} = 'swing_savers' AND ${members.status} = 'active' THEN 1 ELSE 0 END)`,
      golfVxProCount: sql<number>`SUM(CASE WHEN ${members.membershipTier} = 'golf_vx_pro' AND ${members.status} = 'active' THEN 1 ELSE 0 END)`,
      familyCount: sql<number>`SUM(CASE WHEN ${members.membershipTier} = 'family' AND ${members.status} = 'active' THEN 1 ELSE 0 END)`,
      totalLifetimeValue: sql<string>`SUM(${members.lifetimeValue})`,
      // Actual MRR from Boomerang payment data
      allAccessMRR: sql<string>`SUM(CASE WHEN ${members.membershipTier} = 'all_access_aces' AND ${members.status} = 'active' THEN COALESCE(${members.monthlyAmount}, 0) ELSE 0 END)`,
      swingSaversMRR: sql<string>`SUM(CASE WHEN ${members.membershipTier} = 'swing_savers' AND ${members.status} = 'active' THEN COALESCE(${members.monthlyAmount}, 0) ELSE 0 END)`,
      golfVxProMRR: sql<string>`SUM(CASE WHEN ${members.membershipTier} = 'golf_vx_pro' AND ${members.status} = 'active' THEN COALESCE(${members.monthlyAmount}, 0) ELSE 0 END)`,
    })
    .from(members)
    .where(eq(members.venueId, venueId));
  
  return stats[0];
}

// ============= Revenue Functions =============

export async function getRevenueByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(revenue)
    .where(
      and(
        gte(revenue.date, startDate),
        lte(revenue.date, endDate)
      )
    )
    .orderBy(revenue.date);
}

export async function getRevenueBySource(source: Revenue["source"], startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(revenue)
    .where(
      and(
        eq(revenue.source, source),
        gte(revenue.date, startDate),
        lte(revenue.date, endDate)
      )
    )
    .orderBy(revenue.date);
}

export async function createRevenue(revenueData: InsertRevenue) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(revenue).values(revenueData);
  return Number(result[0].insertId);
}

export async function getRevenueSummary(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return null;
  
  const summary = await db
    .select({
      source: revenue.source,
      totalRevenue: sql<string>`SUM(${revenue.amount})`,
      transactionCount: sql<number>`COUNT(*)`,
    })
    .from(revenue)
    .where(
      and(
        gte(revenue.date, startDate),
        lte(revenue.date, endDate)
      )
    )
    .groupBy(revenue.source);
  
  return summary;
}

export async function getTotalRevenue(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return "0";
  
  const result = await db
    .select({
      total: sql<string>`SUM(${revenue.amount})`,
    })
    .from(revenue)
    .where(
      and(
        gte(revenue.date, startDate),
        lte(revenue.date, endDate)
      )
    );
  
  return result[0]?.total || "0";
}

// ============= Task Functions =============

export async function getAllTasks() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tasks).orderBy(desc(tasks.dueDate));
}

export async function getTasksByCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tasks).where(eq(tasks.campaignId, campaignId)).orderBy(tasks.dueDate);
}

export async function getTasksByStatus(completed: boolean) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tasks).where(eq(tasks.completed, completed)).orderBy(tasks.dueDate);
}

export async function upsertTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(tasks).where(eq(tasks.asanaId, task.asanaId)).limit(1);
  
  if (existing.length > 0) {
    await db.update(tasks).set(task).where(eq(tasks.asanaId, task.asanaId));
    return existing[0].id;
  } else {
    const result = await db.insert(tasks).values(task);
    return Number(result[0].insertId);
  }
}

// ============= Report Functions =============

export async function getAllReports() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(reports).orderBy(desc(reports.createdAt));
}

export async function getReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result[0];
}

export async function createReport(report: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(reports).values(report);
  return Number(result[0].insertId);
}

// ============= Campaign Expense Functions =============

export async function getCampaignExpenses(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(campaignExpenses)
    .where(eq(campaignExpenses.campaignId, campaignId))
    .orderBy(desc(campaignExpenses.date));
}

export async function createCampaignExpense(expense: InsertCampaignExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(campaignExpenses).values(expense);
  return Number(result[0].insertId);
}

export async function updateCampaignExpense(id: number, expense: Partial<InsertCampaignExpense>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(campaignExpenses).set(expense).where(eq(campaignExpenses.id, id));
}

export async function deleteCampaignExpense(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(campaignExpenses).where(eq(campaignExpenses.id, id));
}

export async function getTotalCampaignExpenses(campaignId: number) {
  const db = await getDb();
  if (!db) return "0";
  
  const result = await db.select({
    total: sql<string>`COALESCE(SUM(${campaignExpenses.amount}), 0)`
  })
    .from(campaignExpenses)
    .where(eq(campaignExpenses.campaignId, campaignId));
  
  return result[0]?.total || "0";
}

// ============= Campaign Budget Functions =============

export async function updateCampaignBudget(
  campaignId: number,
  budget: string,
  metaAdsBudget?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { budget };
  if (metaAdsBudget !== undefined) {
    updateData.metaAdsBudget = metaAdsBudget;
  }
  
  await db.update(campaigns).set(updateData).where(eq(campaigns.id, campaignId));
}

export async function syncMetaAdsSpend(campaignId: number, metaAdsSpend: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get manual expenses total
  const manualExpenses = await getTotalCampaignExpenses(campaignId);
  
  // Calculate total actual spend (Meta Ads + manual expenses)
  const totalSpend = (parseFloat(metaAdsSpend) + parseFloat(manualExpenses)).toFixed(2);
  
  await db.update(campaigns).set({
    metaAdsSpend,
    actualSpend: totalSpend
  }).where(eq(campaigns.id, campaignId));
}

export async function linkMetaAdsCampaign(campaignId: number, metaAdsCampaignId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(campaigns).set({
    metaAdsCampaignId
  }).where(eq(campaigns.id, campaignId));
}

export async function deleteMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(members).where(eq(members.id, id));
}

export async function getMemberSegments() {
  const db = await getDb();
  if (!db) return null;
  
  const stats = await db
    .select({
      status: members.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(members)
    .groupBy(members.status);
  
  return {
    byStatus: stats,
    highValue: await db.select().from(members).where(gte(members.lifetimeValue, "1000")).orderBy(desc(members.lifetimeValue)).limit(10),
    atRisk: await db.select().from(members).where(and(eq(members.status, "active"), lte(members.lastVisitDate, sql`DATE_SUB(NOW(), INTERVAL 30 DAY)`))).limit(10),
  };
}

// ============= Strategic Campaigns Functions =============

export async function getStrategicCampaignsOverview() {
  const db = await getDb();
  if (!db) return [];
  
  // Get all programs with their strategic campaign mappings
  const programsWithCampaigns = await db
    .select({
      programId: campaigns.id,
      programName: campaigns.name,
      programStatus: campaigns.status,
      programBudget: campaigns.budget,
      programSpend: campaigns.actualSpend,
      programRevenue: campaigns.actualRevenue,
      strategicCampaign: programCampaigns.strategicCampaign,
    })
    .from(campaigns)
    .leftJoin(programCampaigns, eq(campaigns.id, programCampaigns.programId));
  
  // Define strategic campaigns
  const strategicCampaigns = [
    { 
      id: "trial_conversion", 
      name: "Trial Conversion", 
      description: "Converting prospects into paying members through trial sessions and clinics",
      color: "emerald"
    },
    { 
      id: "membership_acquisition", 
      name: "Membership Acquisition", 
      description: "Annual and monthly membership promotions and giveaways",
      color: "pink"
    },
    { 
      id: "member_retention", 
      name: "Member Retention", 
      description: "Drive days, tournaments, and community engagement events",
      color: "blue"
    },
    { 
      id: "corporate_events", 
      name: "B2B Sales", 
      description: "Corporate bookings and business-to-business partnerships",
      color: "amber"
    }
  ];
  
  return Promise.all(strategicCampaigns.map(async (campaign) => {
    // Filter programs that support this strategic campaign
    const supportingPrograms = programsWithCampaigns.filter(
      p => p.strategicCampaign === campaign.id
    );
    
    // Aggregate metrics (avoid double-counting programs with multiple campaign associations)
    const uniquePrograms = new Map();
    supportingPrograms.forEach(p => {
      if (!uniquePrograms.has(p.programId)) {
        uniquePrograms.set(p.programId, p);
      }
    });
    
    const programs = Array.from(uniquePrograms.values());
    
    const totalBudget = programs.reduce((sum, p) => sum + Number(p.programBudget || 0), 0);
    const totalSpend = programs.reduce((sum, p) => sum + Number(p.programSpend || 0), 0);
    const totalRevenue = programs.reduce((sum, p) => sum + Number(p.programRevenue || 0), 0);
    
    const activePrograms = programs.filter(p => p.programStatus === "active").length;
    const completedPrograms = programs.filter(p => p.programStatus === "completed").length;
    
    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    
    // Get landing page URL from the first supporting program (if any)
    const landingPageUrl = programs.length > 0 && programs[0].programId
      ? (await db.select({ landingPageUrl: campaigns.landingPageUrl })
          .from(campaigns)
          .where(eq(campaigns.id, programs[0].programId))
          .limit(1))[0]?.landingPageUrl
      : null;

    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      color: campaign.color,
      totalPrograms: programs.length,
      activePrograms,
      completedPrograms,
      totalBudget,
      totalSpend,
      totalRevenue,
      roi,
      landingPageUrl: landingPageUrl || null,
      programs: programs.map(p => ({
        id: p.programId,
        name: p.programName,
        status: p.programStatus,
        budget: Number(p.programBudget || 0),
        spend: Number(p.programSpend || 0),
        revenue: Number(p.programRevenue || 0),
      })),
    };
  }));
}

export async function getProgramCampaigns(programId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(programCampaigns)
    .where(eq(programCampaigns.programId, programId));
}

export async function setProgramCampaigns(programId: number, strategicCampaigns: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete existing mappings
  await db.delete(programCampaigns).where(eq(programCampaigns.programId, programId));
  
  // Insert new mappings
  if (strategicCampaigns.length > 0) {
    await db.insert(programCampaigns).values(
      strategicCampaigns.map(sc => ({
        programId,
        strategicCampaign: sc as ProgramCampaign["strategicCampaign"],
      }))
    );
  }
}

// ============= Landing Pages Functions =============

export async function getLandingPageBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  
  const pages = await db
    .select()
    .from(landingPages)
    .where(eq(landingPages.slug, slug))
    .limit(1);
  
  return pages[0] || null;
}

export async function trackPageEvent(event: {
  pageId: number;
  sessionId: string;
  eventType: string;
  eventData?: any;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  const db = await getDb();
  if (!db) return;
  
  const { landingPages, pageAnalytics } = await import("../drizzle/schema");
  
  await db.insert(pageAnalytics).values({
    pageId: event.pageId,
    sessionId: event.sessionId,
    visitorId: event.sessionId, // Use session ID as visitor ID for now
    eventType: event.eventType as any,
    eventData: event.eventData,
    referrer: event.referrer,
    userAgent: event.userAgent,
    ipAddress: event.ipAddress,
  });
}

export async function getPageAnalytics(pageId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db
    .select()
    .from(pageAnalytics)
    .where(eq(pageAnalytics.pageId, pageId));
  
  // Add date filters if provided
  // TODO: Add date range filtering
  
  return await query;
}

// ============= Anniversary Giveaway Entry Functions =============

export async function createGiveawayEntry(data: {
  firstName?: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(anniversaryGiveawayEntries).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateGiveawayEntry(data: {
  email: string;
  fullName?: string;
  ageRange?: string;
  gender?: string;
  city?: string;
  isIllinoisResident?: boolean;
  golfExperience?: string;
  hasVisitedBefore?: string;
  firstVisitMethod?: string;
  firstVisitTime?: string;
  visitFrequency?: string;
  whatStoodOut?: string;
  simulatorFamiliarity?: string;
  interests?: string;
  visitPurpose?: string;
  passionStory?: string;
  communityGrowth?: string;
  stayConnected?: string;
  socialMediaHandle?: string;
  communityGroups?: string;
  phoneNumber?: string;
  bestTimeToCall?: string;
  hearAbout?: string;
  hearAboutOther?: string;
  consentToContact?: boolean;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Find existing entry by email
  const [existing] = await db
    .select()
    .from(anniversaryGiveawayEntries)
    .where(eq(anniversaryGiveawayEntries.email, data.email))
    .limit(1);

  if (existing) {
    // Update existing entry
    await db
      .update(anniversaryGiveawayEntries)
      .set(data)
      .where(eq(anniversaryGiveawayEntries.id, existing.id));
    return { ...existing, ...data };
  } else {
    // Create new entry
    const result = await db.insert(anniversaryGiveawayEntries).values(data);
    return { id: Number(result[0].insertId), ...data };
  }
}

export async function getAllGiveawayEntries() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(anniversaryGiveawayEntries)
    .orderBy(desc(anniversaryGiveawayEntries.submittedAt));
}

export async function getGiveawayEntryByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const [entry] = await db
    .select()
    .from(anniversaryGiveawayEntries)
    .where(eq(anniversaryGiveawayEntries.email, email))
    .limit(1);
  return entry;
}


// ---------------------------------------------------------------------------
// Membership Event History DB helpers
// ---------------------------------------------------------------------------

/**
 * Log a membership lifecycle event.
 * Returns the inserted row ID.
 */
export async function logMembershipEvent(event: {
  email: string;
  memberId?: number;
  name?: string;
  eventType: "joined" | "cancelled" | "upgraded" | "downgraded" | "paused" | "resumed" | "tier_changed" | "payment_failed" | "payment_recovered" | "renewed";
  tier?: "all_access_aces" | "swing_savers" | "golf_vx_pro" | "trial" | "none";
  plan?: "monthly" | "annual";
  amount?: string;
  previousTier?: "all_access_aces" | "swing_savers" | "golf_vx_pro" | "trial" | "none";
  previousPlan?: "monthly" | "annual";
  previousAmount?: string;
  eventTimestamp: Date;
  source?: "make_com" | "manual" | "backfill" | "api";
  webhookPayload?: Record<string, any>;
  enchargeTagged?: boolean;
  enchargeTaggedAt?: Date;
  notes?: string;
}): Promise<number | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(membershipEvents).values({
    email: event.email.toLowerCase().trim(),
    memberId: event.memberId,
    name: event.name,
    eventType: event.eventType,
    tier: event.tier,
    plan: event.plan,
    amount: event.amount,
    previousTier: event.previousTier,
    previousPlan: event.previousPlan,
    previousAmount: event.previousAmount,
    eventTimestamp: event.eventTimestamp,
    processedAt: new Date(),
    source: event.source ?? "make_com",
    webhookPayload: event.webhookPayload,
    enchargeTagged: event.enchargeTagged ?? false,
    enchargeTaggedAt: event.enchargeTaggedAt,
    notes: event.notes,
  });

  return (result as any).insertId;
}

/**
 * Return full event history for a member by their DB id.
 */
export async function getMemberHistory(memberId: number): Promise<MembershipEvent[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(membershipEvents)
    .where(eq(membershipEvents.memberId, memberId))
    .orderBy(desc(membershipEvents.eventTimestamp));
}

/**
 * Return full event history for a member by email.
 */
export async function getMemberHistoryByEmail(email: string): Promise<MembershipEvent[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(membershipEvents)
    .where(eq(membershipEvents.email, email.toLowerCase().trim()))
    .orderBy(desc(membershipEvents.eventTimestamp));
}

/**
 * Return all members whose most recent event is a cancellation.
 */
export async function getChurnedMembers(): Promise<Array<{
  email: string;
  name: string | null;
  tier: string | null;
  plan: string | null;
  cancelledAt: Date;
  daysSinceCancellation: number;
}>> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.execute(sql`
    SELECT
      e.email,
      e.name,
      e.tier,
      e.plan,
      e.event_timestamp AS cancelledAt,
      DATEDIFF(NOW(), e.event_timestamp) AS daysSinceCancellation
    FROM membership_events e
    INNER JOIN (
      SELECT email, MAX(event_timestamp) AS latest
      FROM membership_events
      GROUP BY email
    ) latest_events ON e.email = latest_events.email AND e.event_timestamp = latest_events.latest
    WHERE e.event_type = 'cancelled'
    ORDER BY e.event_timestamp DESC
  `);

  return ((rows[0] as unknown) as any[]).map((r: any) => ({
    email: r.email,
    name: r.name,
    tier: r.tier,
    plan: r.plan,
    cancelledAt: new Date(r.cancelledAt),
    daysSinceCancellation: Number(r.daysSinceCancellation),
  }));
}

/**
 * Return members who cancelled within the last N days — prime win-back targets.
 */
export async function getWinbackOpportunities(withinDays = 90): Promise<Array<{
  email: string;
  name: string | null;
  tier: string | null;
  plan: string | null;
  cancelledAt: Date;
  daysSinceCancellation: number;
}>> {
  const all = await getChurnedMembers();
  return all.filter(m => m.daysSinceCancellation <= withinDays);
}

/**
 * Return a summary count of events by type over the last N days.
 */
export async function getMembershipEventSummary(days = 30): Promise<Array<{
  eventType: string;
  count: number;
}>> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.execute(sql`
    SELECT event_type AS eventType, COUNT(*) AS count
    FROM membership_events
    WHERE event_timestamp >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
    GROUP BY event_type
    ORDER BY count DESC
  `);

  return ((rows[0] as unknown) as any[]).map((r: any) => ({
    eventType: r.eventType,
    count: Number(r.count),
  }));
}

/**
 * Find a member record by email and return their ID (for webhook linkage).
 */
export async function getMemberIdByEmail(email: string): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  const [row] = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.email, email.toLowerCase()))
    .limit(1);

  return row?.id ?? null;
}


// ─── ClickFunnels DB Helpers ──────────────────────────────────────────────

export async function getCfFunnels(includeArchived = false) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(cfFunnels);
  if (!includeArchived) {
    return await query.where(eq(cfFunnels.archived, false)).orderBy(desc(cfFunnels.optInCount));
  }
  return await query.orderBy(desc(cfFunnels.optInCount));
}

export async function getCfSubmissions(funnelId?: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  if (funnelId) {
    return await db
      .select()
      .from(cfFormSubmissions)
      .where(eq(cfFormSubmissions.funnelId, funnelId))
      .orderBy(desc(cfFormSubmissions.submittedAt))
      .limit(limit);
  }
  return await db
    .select()
    .from(cfFormSubmissions)
    .orderBy(desc(cfFormSubmissions.submittedAt))
    .limit(limit);
}

export async function getCfFunnelSummary() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`
    SELECT
      f.cf_id AS funnelId,
      f.name AS funnelName,
      f.archived,
      f.opt_in_count AS optInCount,
      COALESCE(f.unique_visitors, 0) AS uniqueVisitors,
      COALESCE(f.page_views, 0) AS pageViews,
      f.last_synced_at AS lastSyncedAt,
      COUNT(DISTINCT s.id) AS submissionCount,
      MAX(s.submitted_at) AS lastSubmission
    FROM cf_funnels f
    LEFT JOIN cf_form_submissions s ON s.funnel_id = f.cf_id
    WHERE f.archived = 0
    GROUP BY f.cf_id, f.name, f.archived, f.opt_in_count, f.unique_visitors, f.page_views, f.last_synced_at
    ORDER BY submissionCount DESC
  `);
  return rows[0] as unknown as Array<{
    funnelId: number;
    funnelName: string;
    archived: boolean;
    optInCount: number;
    uniqueVisitors: number;
    pageViews: number;
    lastSyncedAt: Date;
    submissionCount: number;
    lastSubmission: Date | null;
  }>;
}

export async function updateFunnelUvPv(cfId: number, uniqueVisitors: number, pageViews: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(cfFunnels)
    .set({ uniqueVisitors, pageViews })
    .where(eq(cfFunnels.cfId, cfId));
  return { success: true };
}
