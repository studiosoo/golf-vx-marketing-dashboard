import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { createAsanaTask } from "./asana";

const reportTypeEnum = z.enum([
  "weekly_executive",
  "monthly_marketing",
  "paid_media",
]);

const briefTypeEnum = z.enum([
  "weekly_ops",
  "paid_media_one_pager",
  "promotion_status",
  "issue_blocker",
  "branch_update",
]);

const reportStatusEnum = z.enum(["draft", "ready", "archived"]);
const briefStatusEnum = z.enum(["draft", "ready", "shared"]);
const operationalUpdateStatusEnum = z.enum(["new", "in_review", "processed"]);
const sourceTypeEnum = z.enum([
  "manual",
  "email",
  "teams",
  "screenshot",
  "hq_summary",
  "venue_update",
  "imported",
]);
const ownershipStateEnum = z.enum([
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
]);
const issueStatusEnum = z.enum(["open", "in_progress", "blocked", "resolved"]);
const issuePriorityEnum = z.enum(["low", "medium", "high", "critical"]);
const taskStatusEnum = z.enum(["open", "in_progress", "done", "blocked"]);

const reportPayloadSchema = z.object({
  summary: z.string().optional(),
  sections: z.array(z.object({
    heading: z.string(),
    body: z.string(),
  })).default([]),
  highlights: z.array(z.string()).default([]),
});

const briefPayloadSchema = z.object({
  effectiveDate: z.string().optional(),
  dateRangeLabel: z.string().optional(),
  summary: z.string().default(""),
  topHighlights: z.array(z.string()).default([]),
  blockers: z.array(z.string()).default([]),
  nextActions: z.array(z.string()).default([]),
});

const screenshotSchema = z.object({
  name: z.string(),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  size: z.number().max(1024 * 1024),
  dataUrl: z.string().refine((value) => value.startsWith("data:image/"), {
    message: "Screenshot must be an image data URL",
  }),
});

const operationalUpdatePayloadSchema = z.object({
  note: z.string().optional(),
  linkedEntity: z.string().optional(),
  normalizedSummary: z.string().optional(),
  ownershipState: ownershipStateEnum.optional(),
  linkedIssueId: z.number().optional(),
  linkedTaskId: z.number().optional(),
});

const issueInputSchema = z.object({
  venueSlug: z.string(),
  title: z.string().min(3),
  description: z.string().default(""),
  status: issueStatusEnum.default("open"),
  priority: issuePriorityEnum.default("medium"),
  ownershipState: ownershipStateEnum,
  assignedTo: z.string().min(1),
  linkedUpdateId: z.number().nullable().optional(),
  dueAt: z.string().nullable().optional(),
});

const issueUpdateSchema = z.object({
  id: z.number(),
  title: z.string().min(3),
  description: z.string().default(""),
  status: issueStatusEnum,
  priority: issuePriorityEnum,
  ownershipState: ownershipStateEnum,
  assignedTo: z.string().min(1),
  linkedUpdateId: z.number().nullable().optional(),
  dueAt: z.string().nullable().optional(),
});

const taskInputSchema = z.object({
  venueSlug: z.string(),
  title: z.string().min(3),
  description: z.string().default(""),
  status: taskStatusEnum.default("open"),
  ownershipState: ownershipStateEnum,
  assignedTo: z.string().min(1),
  linkedIssueId: z.number().nullable().optional(),
  linkedUpdateId: z.number().nullable().optional(),
  dueAt: z.string().nullable().optional(),
});

const taskUpdateSchema = z.object({
  id: z.number(),
  title: z.string().min(3),
  description: z.string().default(""),
  status: taskStatusEnum,
  ownershipState: ownershipStateEnum,
  assignedTo: z.string().min(1),
  linkedIssueId: z.number().nullable().optional(),
  linkedUpdateId: z.number().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  externalTaskRef: z.object({
    provider: z.literal("asana"),
    taskGid: z.string(),
    permalinkUrl: z.string().optional(),
    status: z.enum(["created", "not_configured", "failed"]),
    message: z.string().optional(),
  }).nullable().optional(),
});

export const reportingRouter = router({
  templates: protectedProcedure.query(() => db.getReportingTemplates()),

  listReports: protectedProcedure
    .input(z.object({ venueSlug: z.string() }))
    .query(async ({ input }) => db.listReportDrafts(input.venueSlug)),

  createReportDraft: protectedProcedure
    .input(z.object({
      venueSlug: z.string(),
      reportType: reportTypeEnum,
      title: z.string().min(3),
      dateRangeLabel: z.string().optional(),
      status: reportStatusEnum.default("draft"),
      content: reportPayloadSchema.default({ sections: [], highlights: [] }),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createReportDraft({
        venueSlug: input.venueSlug,
        reportType: input.reportType,
        title: input.title,
        dateRangeLabel: input.dateRangeLabel,
        status: input.status,
        content: input.content,
        createdBy: ctx.user.email || ctx.user.name || "unknown",
      });
    }),

  updateReportDraft: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(3),
      dateRangeLabel: z.string().optional(),
      status: reportStatusEnum,
      content: reportPayloadSchema,
    }))
    .mutation(async ({ input }) => db.updateReportDraft(input.id, input)),

  listBriefs: protectedProcedure
    .input(z.object({ venueSlug: z.string() }))
    .query(async ({ input }) => db.listBriefs(input.venueSlug)),

  createBrief: protectedProcedure
    .input(z.object({
      venueSlug: z.string(),
      briefType: briefTypeEnum,
      title: z.string().min(3),
      status: briefStatusEnum.default("draft"),
      content: briefPayloadSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createBrief({
        venueSlug: input.venueSlug,
        briefType: input.briefType,
        title: input.title,
        status: input.status,
        content: input.content,
        createdBy: ctx.user.email || ctx.user.name || "unknown",
      });
    }),

  updateBrief: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(3),
      status: briefStatusEnum,
      content: briefPayloadSchema,
    }))
    .mutation(async ({ input }) => db.updateBrief(input.id, input)),

  listOperationalUpdates: protectedProcedure
    .input(z.object({ venueSlug: z.string() }))
    .query(async ({ input }) => db.listOperationalUpdates(input.venueSlug)),

  createOperationalUpdate: protectedProcedure
    .input(z.object({
      venueSlug: z.string(),
      sourceType: sourceTypeEnum,
      rawText: z.string().min(1),
      status: operationalUpdateStatusEnum.default("new"),
      screenshot: screenshotSchema.optional(),
      metadata: operationalUpdatePayloadSchema.default({}),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createOperationalUpdate({
        venueSlug: input.venueSlug,
        sourceType: input.sourceType,
        rawText: input.rawText,
        status: input.status,
        screenshot: input.screenshot,
        metadata: input.metadata,
        submittedBy: ctx.user.email || ctx.user.name || "unknown",
      });
    }),

  updateOperationalUpdateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: operationalUpdateStatusEnum,
      metadata: operationalUpdatePayloadSchema.optional(),
    }))
    .mutation(async ({ input }) => db.updateOperationalUpdate(input.id, input)),

  listIssues: protectedProcedure
    .input(z.object({ venueSlug: z.string() }))
    .query(async ({ input }) => db.listIssues(input.venueSlug)),

  createIssue: protectedProcedure
    .input(issueInputSchema)
    .mutation(async ({ ctx, input }) => {
      return db.createIssue({
        ...input,
        linkedUpdateId: input.linkedUpdateId ?? null,
        dueAt: input.dueAt ?? null,
        createdBy: ctx.user.email || ctx.user.name || "unknown",
      });
    }),

  updateIssue: protectedProcedure
    .input(issueUpdateSchema)
    .mutation(async ({ input }) => db.updateIssue(input.id, input)),

  listTasks: protectedProcedure
    .input(z.object({ venueSlug: z.string() }))
    .query(async ({ input }) => db.listTasks(input.venueSlug)),

  createTask: protectedProcedure
    .input(taskInputSchema)
    .mutation(async ({ ctx, input }) => {
      return db.createTask({
        ...input,
        linkedIssueId: input.linkedIssueId ?? null,
        linkedUpdateId: input.linkedUpdateId ?? null,
        dueAt: input.dueAt ?? null,
        externalTaskRef: null,
        createdBy: ctx.user.email || ctx.user.name || "unknown",
      });
    }),

  updateTask: protectedProcedure
    .input(taskUpdateSchema)
    .mutation(async ({ input }) => db.updateTask(input.id, input)),

  getThisWeekSummary: protectedProcedure
    .input(z.object({ venueSlug: z.string() }))
    .query(async ({ input }) => db.getThisWeekSummary(input.venueSlug)),

  createTaskInAsana: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      campaignSection: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const task = await db.getTaskById(input.taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      let externalTaskRef:
        | {
            provider: "asana";
            taskGid: string;
            permalinkUrl?: string;
            status: "created" | "not_configured" | "failed";
            message?: string;
          }
        | null = null;

      try {
        const createdTask = await createAsanaTask({
          name: task.title,
          notes: task.description || undefined,
          due_on: task.dueAt ? task.dueAt.slice(0, 10) : undefined,
          campaignSection: input.campaignSection,
        });

        externalTaskRef = {
          provider: "asana",
          taskGid: createdTask.gid,
          permalinkUrl: createdTask.permalink_url,
          status: "created",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown Asana error";
        externalTaskRef = {
          provider: "asana",
          taskGid: `local-${task.id}`,
          status: message.includes("ASANA_PAT") ? "not_configured" : "failed",
          message,
        };
      }

      const updatedTask = await db.updateTask(task.id, {
        title: task.title,
        description: task.description,
        status: task.status,
        ownershipState: task.ownershipState,
        assignedTo: task.assignedTo,
        dueAt: task.dueAt ?? null,
        linkedIssueId: task.linkedIssueId ?? null,
        linkedUpdateId: task.linkedUpdateId ?? null,
        externalTaskRef,
      });

      return {
        success: externalTaskRef?.status === "created",
        task: updatedTask,
        externalTaskRef,
      };
    }),
});
