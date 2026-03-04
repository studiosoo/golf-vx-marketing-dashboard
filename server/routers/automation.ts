import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import {
  getSyncStatusAll,
  getAutoExecutedActions,
  getPendingApprovalActions,
  getMonitoringActions,
  approveAction,
  rejectAction,
  undoAction,
  dismissAction,
  runAutonomousCycle,
  getAllActions,
  getArchivedActions,
} from "../autonomous";
import { seedDemoData } from "../seed-demo";
import * as memberAppointmentSync from "../memberAppointmentSync";

export const dailyActionsRouter = router({
  getTodayPlan: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ input }) => {
      const { getTodayActionPlan } = await import("../dailyActionPlan");
      return await getTodayActionPlan(input.campaignId);
    }),

  generatePlan: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .mutation(async ({ input }) => {
      const { generateDailyActionPlan } = await import("../dailyActionPlan");
      const mockPerformanceData = {
        metaAds: {
          spend: 7.5,
          impressions: 3000,
          clicks: 60,
          applications: 2,
          ctr: 2.0,
          cpc: 0.125,
          cpa: 3.75,
        },
        instagram: {
          reach: 500,
          engagement: 45,
          followerGrowth: 5,
          topPosts: [
            { id: "1", caption: "Meet John - transformed his game", likes: 45, comments: 12 },
          ],
        },
        email: {
          sent: 32,
          opens: 18,
          clicks: 5,
          conversions: 0,
          openRate: 56.25,
          clickRate: 15.6,
        },
        landingPage: {
          visits: 60,
          bounceRate: 45,
          conversionRate: 3.3,
          avgTimeOnPage: 120,
        },
        applicants: {
          total: 32,
          converted: 0,
          conversionRate: 0,
        },
      };
      return await generateDailyActionPlan(input.campaignId, mockPerformanceData);
    }),

  completeAction: protectedProcedure
    .input(z.object({ actionId: z.number(), result: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { completeAction } = await import("../dailyActionPlan");
      await completeAction(input.actionId, input.result);
      return { success: true };
    }),

  skipAction: protectedProcedure
    .input(z.object({ actionId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { skipAction } = await import("../dailyActionPlan");
      await skipAction(input.actionId, input.reason);
      return { success: true };
    }),
});

export const autonomousRouter = router({
  getSyncStatus: publicProcedure.query(async () => {
    return getSyncStatusAll();
  }),

  getAutoExecuted: publicProcedure.query(async () => {
    return getAutoExecutedActions();
  }),

  getApprovalCards: publicProcedure.query(async () => {
    return getPendingApprovalActions();
  }),

  getMonitoring: publicProcedure.query(async () => {
    return getMonitoringActions();
  }),

  getAllActions: publicProcedure.query(async () => {
    return getAllActions();
  }),

  getArchivedActions: publicProcedure.query(async () => {
    return getArchivedActions();
  }),

  syncAllData: protectedProcedure.mutation(async () => {
    return runAutonomousCycle();
  }),

  approveAction: protectedProcedure
    .input(z.object({ actionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const reviewerName = ctx.user.name || ctx.user.email || "Admin";
      return approveAction(input.actionId, reviewerName);
    }),

  rejectAction: protectedProcedure
    .input(z.object({ actionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const reviewerName = ctx.user.name || ctx.user.email || "Admin";
      return rejectAction(input.actionId, reviewerName);
    }),

  undoAction: protectedProcedure
    .input(z.object({ actionId: z.number() }))
    .mutation(async ({ input }) => {
      return undoAction(input.actionId);
    }),

  dismissAction: protectedProcedure
    .input(z.object({ actionId: z.number() }))
    .mutation(async ({ input }) => {
      return dismissAction(input.actionId);
    }),

  seedDemo: protectedProcedure.mutation(async () => {
    return seedDemoData();
  }),

  clearStaleActions: protectedProcedure.mutation(async () => {
    const database = await db.getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { autonomousActions } = await import("../../drizzle/schema");
    const { and, lt, eq: eqOp } = await import("drizzle-orm");
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await database
      .update(autonomousActions)
      .set({ status: "dismissed" })
      .where(and(eqOp(autonomousActions.status, "pending_approval"), lt(autonomousActions.createdAt, threeDaysAgo)));
    await database
      .update(autonomousActions)
      .set({ status: "dismissed" })
      .where(and(eqOp(autonomousActions.status, "monitoring"), lt(autonomousActions.createdAt, sevenDaysAgo)));
    return { success: true, message: "Stale actions cleared" };
  }),
});

export const conversionRouter = router({
  getMemberAppointments: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await memberAppointmentSync.getMemberAppointments(input.memberId);
      } catch (err) {
        return [];
      }
    }),
});
