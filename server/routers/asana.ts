import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getTimelineTasks, createAsanaTask, getProjectUrl, getProjectTasks, getProjectBudget, CAMPAIGN_SECTIONS, MARKETING_TIMELINE_PROJECT_ID } from "../asana";

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
