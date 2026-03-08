export const REPORT_TEMPLATES = [
  {
    type: "weekly_executive",
    title: "Arlington Heights Weekly Executive Report",
    description: "Weekly venue summary for leadership review, key metrics, blockers, and next steps.",
    cadence: "Weekly",
  },
  {
    type: "monthly_marketing",
    title: "Arlington Heights Monthly Marketing Report",
    description: "Monthly marketing recap covering campaigns, channels, and branch momentum.",
    cadence: "Monthly",
  },
  {
    type: "paid_media",
    title: "Paid Media Report",
    description: "Focused report for paid channel pacing, efficiency, and optimizations.",
    cadence: "As needed",
  },
] as const;

export const BRIEF_TEMPLATES = [
  { type: "weekly_ops", title: "Weekly Ops Brief" },
  { type: "paid_media_one_pager", title: "Paid Media One-Pager" },
  { type: "promotion_status", title: "Promotion Status Brief" },
  { type: "issue_blocker", title: "Issue / Blocker Brief" },
  { type: "branch_update", title: "Branch Update Summary" },
] as const;

export const INBOX_SOURCE_TYPES = [
  "manual",
  "email",
  "teams",
  "screenshot",
  "hq_summary",
  "venue_update",
  "imported",
] as const;

export const REPORT_STATUS_OPTIONS = ["draft", "ready", "archived"] as const;
export const BRIEF_STATUS_OPTIONS = ["draft", "ready", "shared"] as const;
export const OPERATIONAL_UPDATE_STATUS_OPTIONS = ["new", "in_review", "processed"] as const;
export const OWNERSHIP_STATE_OPTIONS = [
  "awaiting_studio_soo",
  "awaiting_venue",
  "awaiting_hq",
  "awaiting_follow_up",
  "blocked_by_staffing",
  "blocked_by_missing_data",
  "needs_approval",
  "needs_local_execution",
  "needs_creative",
  "needs_booking_follow_up",
] as const;
export const ISSUE_STATUS_OPTIONS = ["open", "in_progress", "blocked", "resolved"] as const;
export const ISSUE_PRIORITY_OPTIONS = ["low", "medium", "high", "critical"] as const;
export const TASK_STATUS_OPTIONS = ["open", "in_progress", "done", "blocked"] as const;

export type ReportTemplateType = (typeof REPORT_TEMPLATES)[number]["type"];
export type BriefTemplateType = (typeof BRIEF_TEMPLATES)[number]["type"];
export type InboxSourceType = (typeof INBOX_SOURCE_TYPES)[number];
export type ReportStatus = (typeof REPORT_STATUS_OPTIONS)[number];
export type BriefStatus = (typeof BRIEF_STATUS_OPTIONS)[number];
export type OperationalUpdateStatus = (typeof OPERATIONAL_UPDATE_STATUS_OPTIONS)[number];
export type OwnershipState = (typeof OWNERSHIP_STATE_OPTIONS)[number];
export type IssueStatus = (typeof ISSUE_STATUS_OPTIONS)[number];
export type IssuePriority = (typeof ISSUE_PRIORITY_OPTIONS)[number];
export type TaskStatus = (typeof TASK_STATUS_OPTIONS)[number];

export type ExternalTaskRef = {
  provider: "asana";
  taskGid: string;
  permalinkUrl?: string;
  status: "created" | "not_configured" | "failed";
  message?: string;
};

export type OperationalUpdateRecord = {
  id: number;
  venueSlug: string;
  sourceType: InboxSourceType;
  rawText: string;
  status: OperationalUpdateStatus;
  metadata: {
    note?: string;
    linkedEntity?: string;
    normalizedSummary?: string;
    ownershipState?: OwnershipState;
    linkedIssueId?: number;
    linkedTaskId?: number;
  };
  screenshot?: {
    name: string;
    mimeType: "image/png" | "image/jpeg" | "image/webp";
    size: number;
    dataUrl: string;
  } | null;
  submittedBy: string;
  submittedAt: string;
  updatedAt: string;
};

export type IssueRecord = {
  id: number;
  venueSlug: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  ownershipState: OwnershipState;
  assignedTo: string;
  linkedUpdateId?: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueAt?: string | null;
};

export type TaskRecord = {
  id: number;
  venueSlug: string;
  title: string;
  description: string;
  status: TaskStatus;
  ownershipState: OwnershipState;
  assignedTo: string;
  linkedIssueId?: number | null;
  linkedUpdateId?: number | null;
  externalTaskRef?: ExternalTaskRef | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueAt?: string | null;
};

export type ThisWeekSummary = {
  counts: {
    newInboxItems: number;
    openIssues: number;
    dueTasks: number;
    blockedItems: number;
  };
  topPriorities: Array<{
    kind: "issue" | "task";
    id: number;
    title: string;
    status: string;
    ownershipState: OwnershipState;
  }>;
  ownershipBuckets: {
    awaiting_studio_soo: Array<{ kind: "issue" | "task"; id: number; title: string; status: string }>;
    awaiting_venue: Array<{ kind: "issue" | "task"; id: number; title: string; status: string }>;
    awaiting_hq: Array<{ kind: "issue" | "task"; id: number; title: string; status: string }>;
  };
  upcoming: {
    inbox: OperationalUpdateRecord[];
    issues: IssueRecord[];
    tasks: TaskRecord[];
  };
};

export function formatVenueLabel(venueSlug: string) {
  return venueSlug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function splitLines(value: string): string[] {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinLines(items?: string[]) {
  return (items ?? []).join("\n");
}

export function formatEnumLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function formatDateOnly(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}
