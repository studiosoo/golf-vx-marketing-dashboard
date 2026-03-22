import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getTimelineTasks, createAsanaTask, getProjectUrl, getProjectTasks, getProjectBudget, CAMPAIGN_SECTIONS, MARKETING_TIMELINE_PROJECT_ID } from "../asana";

// ─── Production-linked Asana project GIDs ─────────────────────────────────────
export const PRODUCTION_PROJECTS: Record<string, string> = {
  "PBGA Programs":               "1212078499567959",
  "Trial Conversion Campaign":   "1212077269419925",
  "Membership Acquisition":      "1212077289242708",
  "Member Retention":            "1211736985531595",
  "Corporate Events & B2B":      "1212077289242724",
  "Venue Display / Local Media": "1211917285471271",
  "AH Social Media Content":     "1211673464711096",
  "Stroll Magazine":             "1211912937095581",
};

export const asanaRouter = router({
  getProjectTasks: protectedProcedure
    .input(z.object({ projectGid: z.string().min(1) }))
    .query(async ({ input }) => {
      const tasks = await getProjectTasks(input.projectGid);
      return { tasks };
    }),

  getProjectBudget: protectedProcedure
    .input(z.object({ projectGid: z.string().min(1) }))
    .query(async ({ input }) => {
      return await getProjectBudget(input.projectGid);
    }),

  getTimeline: protectedProcedure.query(async () => {
    const tasks = await getTimelineTasks();
    return {
      tasks,
      projectUrl: getProjectUrl(),
      projectId: MARKETING_TIMELINE_PROJECT_ID,
      campaignSections: Object.keys(CAMPAIGN_SECTIONS),
    };
  }),

  getMasterTimeline: protectedProcedure.query(async () => {
    // Stub for the ReportTimeline "Asana Live" toggle.
    // Returns an empty item list; a full implementation would map
    // Asana timeline tasks to the TimelineItem shape.
    return {
      items: [] as Array<{
        id: string; name: string; category: string; campaigns: string[];
        datesConfirmed: boolean; start: string; end: string;
        status: string; kpiHint?: string;
      }>,
      fetchedAt: new Date().toISOString(),
    };
  }),

  // ── Production page: fetch tasks from one or all production projects ─────────
  getProductionTasks: protectedProcedure
    .input(z.object({
      projectName: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const projectsToFetch = input.projectName && PRODUCTION_PROJECTS[input.projectName]
        ? { [input.projectName]: PRODUCTION_PROJECTS[input.projectName] }
        : PRODUCTION_PROJECTS;

      const results: Array<{
        projectName: string;
        projectGid: string;
        tasks: Array<{ gid: string; name: string; assignee: string | null; due_on: string | null; completed: boolean }>;
      }> = [];

      for (const [name, gid] of Object.entries(projectsToFetch)) {
        if (!gid) continue;
        try {
          const tasks = await getProjectTasks(gid);
          results.push({ projectName: name, projectGid: gid, tasks });
        } catch {
          results.push({ projectName: name, projectGid: gid, tasks: [] });
        }
      }

      return {
        projects: results,
        projectNames: Object.keys(PRODUCTION_PROJECTS),
        fetchedAt: new Date().toISOString(),
      };
    }),

  // ── Production page: create a task in a named production project ─────────────
  createProductionTask: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      projectName: z.string().min(1),
      notes: z.string().optional(),
      due_on: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (!PRODUCTION_PROJECTS[input.projectName]) {
        throw new Error(`Unknown production project: ${input.projectName}`);
      }
      const task = await createAsanaTask({
        name: input.name,
        notes: input.notes,
        due_on: input.due_on,
        campaignSection: input.projectName,
      });
      return { success: true, task, projectName: input.projectName };
    }),

  createTask: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      notes: z.string().optional(),
      due_on: z.string().optional(),
      start_on: z.string().optional(),
      campaignSection: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const task = await createAsanaTask(input);
      return { success: true, task };
    }),

  createBatchTasks: protectedProcedure
    .input(z.object({
      tasks: z.array(z.object({
        name: z.string().min(1).max(200),
        notes: z.string().optional(),
        due_on: z.string().optional(),
        campaignSection: z.string().optional(),
      })).min(1).max(20),
    }))
    .mutation(async ({ input }) => {
      const results = [];
      const errors = [];
      for (const t of input.tasks) {
        try {
          const task = await createAsanaTask(t);
          results.push({ success: true, task });
        } catch (e) {
          errors.push({ name: t.name, error: (e as Error).message });
        }
      }
      return { created: results.length, errors, tasks: results.map(r => r.task) };
    }),
});
