import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getTimelineTasks, createAsanaTask, getProjectUrl, CAMPAIGN_SECTIONS, MARKETING_TIMELINE_PROJECT_ID, getMasterTimelineTasks, CAMPAIGN_PROJECT_MAP, getProjectTasks, getProjectBudget } from "../asana";
import * as db from "../db";
import { campaigns } from "../../drizzle/schema";
import { like, or } from "drizzle-orm";

export const asanaRouter = router({
  getMasterTimeline: protectedProcedure.query(async () => {
    const items = await getMasterTimelineTasks();
    return { items, fetchedAt: new Date().toISOString() };
  }),

  seedCampaignProjects: protectedProcedure.mutation(async () => {
    const database = await db.getDb();
    if (!database) return { updated: 0 };

    const seeds = [
      { gid: "1212077269419925", cond: like(campaigns.name, "%Trial%") },
      { gid: "1212077289242708", cond: like(campaigns.name, "%Membership Acquisition%") },
      { gid: "1212080057605434", cond: like(campaigns.name, "%Retention%") },
      {
        gid: "1212077289242724",
        cond: or(like(campaigns.name, "%B2B%"), like(campaigns.name, "%Corporate%"))!,
      },
    ];

    for (const { gid, cond } of seeds) {
      await database.update(campaigns).set({ asanaProjectId: gid }).where(cond);
    }
    return { updated: seeds.length };
  }),

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
