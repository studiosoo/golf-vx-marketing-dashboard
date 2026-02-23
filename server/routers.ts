import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getLatestSyncStatus,
  getSyncHistory,
  getAutoExecutedActions,
  getPendingApprovalActions,
  getMonitoringActions,
  getAllActions,
  approveActionById,
  rejectActionById,
  undoActionById,
  runFullSync,
} from "./autonomous";
import { seedDemoData } from "./seed-demo";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  autonomous: router({
    /** Get the latest sync status and recent sync history. Auto-seeds demo data if empty. */
    getSyncStatus: publicProcedure.query(async () => {
      let latest = await getLatestSyncStatus();
      // Auto-seed demo data on first load if no sync history exists
      if (!latest) {
        try {
          await seedDemoData();
          latest = await getLatestSyncStatus();
        } catch (e) {
          console.warn("[Autonomous] Auto-seed failed:", e);
        }
      }
      const history = await getSyncHistory(5);
      return { latest, history };
    }),

    /** Get all auto-executed actions (low-risk, already applied) */
    getAutoExecutedActions: publicProcedure.query(async () => {
      const actions = await getAutoExecutedActions();
      return { actions, count: actions.length };
    }),

    /** Get pending approval cards (medium/high-risk actions) */
    getApprovalCards: publicProcedure.query(async () => {
      const actions = await getPendingApprovalActions();
      return { actions, count: actions.length };
    }),

    /** Get monitoring items (insufficient data or healthy campaigns) */
    getMonitoringItems: publicProcedure.query(async () => {
      const actions = await getMonitoringActions();
      return { actions, count: actions.length };
    }),

    /** Get all actions regardless of status */
    getAllActions: publicProcedure.query(async () => {
      const actions = await getAllActions();
      return { actions, count: actions.length };
    }),

    /** Trigger a full data sync (fetches Meta Ads data, analyzes, generates actions) */
    syncAllData: protectedProcedure.mutation(async () => {
      const metaToken = process.env.META_ADS_ACCESS_TOKEN;
      const metaAccountId = process.env.META_ADS_ACCOUNT_ID;

      const result = await runFullSync(metaToken, metaAccountId);
      return result;
    }),

    /** Approve a pending action */
    approveAction: protectedProcedure
      .input(z.object({ actionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const reviewerName = ctx.user.name || ctx.user.email || "Admin";
        const action = await approveActionById(input.actionId, reviewerName);
        return { success: true, action };
      }),

    /** Reject a pending action */
    rejectAction: protectedProcedure
      .input(z.object({ actionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const reviewerName = ctx.user.name || ctx.user.email || "Admin";
        await rejectActionById(input.actionId, reviewerName);
        return { success: true };
      }),

    /** Undo a previously executed or approved action */
    undoAction: protectedProcedure
      .input(
        z.object({
          actionId: z.number(),
          reason: z.string().min(1).max(500),
        })
      )
      .mutation(async ({ input }) => {
        await undoActionById(input.actionId, input.reason);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
