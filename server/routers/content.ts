import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const instagramRouter = router({
  syncInsights: protectedProcedure
    .input(z.object({
      date: z.string(),
      followersCount: z.number(),
      followingCount: z.number().optional(),
      mediaCount: z.number().optional(),
      impressions: z.number().optional(),
      reach: z.number().optional(),
      profileViews: z.number().optional(),
      websiteClicks: z.number().optional(),
      engagementRate: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { instagramInsights } = await import("../../drizzle/schema");
      const database = await getDb();
      if (!database) throw new Error('Database connection failed');
      await database.insert(instagramInsights).values({
        date: new Date(input.date),
        followersCount: input.followersCount,
        followingCount: input.followingCount,
        mediaCount: input.mediaCount,
        impressions: input.impressions,
        reach: input.reach,
        profileViews: input.profileViews,
        websiteClicks: input.websiteClicks,
        engagementRate: input.engagementRate ? input.engagementRate.toString() : undefined,
      });
      return { success: true };
    }),

  getInsights: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const { instagramInsights } = await import("../../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new Error('Database connection failed');
      const insights = await database
        .select()
        .from(instagramInsights)
        .orderBy(desc(instagramInsights.date))
        .limit(input.days);
      return insights;
    }),

  generateRecommendations: protectedProcedure.mutation(async () => {
    const { generateInstagramRecommendations } = await import("../instagramRecommendations");
    return await generateInstagramRecommendations();
  }),

  getRecommendations: protectedProcedure
    .input(z.object({ status: z.enum(['pending', 'implemented', 'skipped']).optional() }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const { instagramRecommendations } = await import("../../drizzle/schema");
      const { desc, eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new Error('Database connection failed');
      let query = database.select().from(instagramRecommendations);
      if (input.status) {
        query = query.where(eq(instagramRecommendations.status, input.status)) as any;
      }
      const recommendations = await query.orderBy(desc(instagramRecommendations.generatedAt));
      return recommendations;
    }),

  implementRecommendation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { instagramRecommendations } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new Error('Database connection failed');
      await database
        .update(instagramRecommendations)
        .set({ status: 'implemented', implementedAt: new Date() })
        .where(eq(instagramRecommendations.id, input.id));
      return { success: true };
    }),
});

export const previewRouter = router({
  getDriveDaySessions: publicProcedure.query(async () => {
    const { getSundayClinicData, extractAcquisitionSource } = await import("../acuity");
    const data = await getSundayClinicData({ minDate: "2026-01-25", maxDate: "2026-03-29" });

    const SCHEDULED = [
      { date: "2026-01-25", topic: "Drive Day", label: "Driving to the Ball" },
      { date: "2026-02-01", topic: "Drive Day", label: "Driving to the Ball" },
      { date: "2026-02-22", topic: "Putting", label: "Putting: Score Low" },
      { date: "2026-03-01", topic: "Putting", label: "Putting: Score Low" },
      { date: "2026-03-22", topic: "Short Game", label: "Hitting Below the Hips" },
      { date: "2026-03-29", topic: "Short Game", label: "Hitting Below the Hips" },
    ];

    type DateStat = { bookings: number; paid: number; members: number; revenue: number; uniqueEmails: Set<string>; sources: Record<string, number> };
    const dateStats: Record<string, DateStat> = {};
    for (const s of SCHEDULED) {
      dateStats[s.date] = { bookings: 0, paid: 0, members: 0, revenue: 0, uniqueEmails: new Set(), sources: {} };
    }

    const allAppointments = data.events.flatMap(e => e.appointments);
    for (const apt of allAppointments) {
      const dateKey = apt.datetime ? (apt.datetime as string).substring(0, 10) : null;
      if (!dateKey || !dateStats[dateKey]) continue;
      const ds = dateStats[dateKey];
      ds.bookings++;
      if (apt.amountPaid && parseFloat(apt.amountPaid as string) > 0) ds.paid++;
      if (apt.forms) {
        const memberField = (apt.forms as any[]).flatMap((f: any) => f.values || []).find((v: any) => v.fieldID === 9836574 || v.name?.toLowerCase().includes('member'));
        if (memberField?.value?.toLowerCase() === 'yes') ds.members++;
      }
      ds.revenue += parseFloat((apt.amountPaid as string) || '0');
      if (apt.email) ds.uniqueEmails.add((apt.email as string).toLowerCase());
      const src = extractAcquisitionSource(apt);
      ds.sources[src] = (ds.sources[src] || 0) + 1;
    }

    type TopicEntry = { name: string; label: string; description: string; dates: any[]; totalRegistrations: number; revenueCollected: number; uniqueAttendees: number };
    const topicMap: Record<string, TopicEntry> = {};
    for (const s of SCHEDULED) {
      if (!topicMap[s.topic]) {
        topicMap[s.topic] = { name: s.topic, label: s.label, description: s.label, dates: [], totalRegistrations: 0, revenueCollected: 0, uniqueAttendees: 0 };
      }
      const ds = dateStats[s.date];
      topicMap[s.topic].dates.push({
        date: s.date,
        bookings: ds.bookings,
        paid: ds.paid,
        members: ds.members,
        revenue: Math.round(ds.revenue),
        uniqueAttendees: ds.uniqueEmails.size,
        sources: ds.sources,
      });
      topicMap[s.topic].totalRegistrations += ds.bookings;
      topicMap[s.topic].revenueCollected += Math.round(ds.revenue);
      topicMap[s.topic].uniqueAttendees += ds.uniqueEmails.size;
    }

    const sessions = Object.values(topicMap);
    const totalRegistrations = sessions.reduce((s, t) => s + t.totalRegistrations, 0);
    const totalRevenue = sessions.reduce((s, t) => s + t.revenueCollected, 0);
    const totalPaid = Object.values(dateStats).reduce((s, d) => s + d.paid, 0);
    const totalMembers = Object.values(dateStats).reduce((s, d) => s + d.members, 0);

    return {
      sessions,
      overall: {
        totalRegistrations,
        revenueCollected: totalRevenue,
        paidAttendees: totalPaid,
        memberAttendees: totalMembers,
        totalEvents: SCHEDULED.length,
      },
    };
  }),

  getSnapshot: publicProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const memberResult = await database.execute(`
      SELECT
        COUNT(CASE WHEN membershipTier IN ('all_access_aces', 'swing_savers', 'golf_vx_pro', 'family', 'monthly', 'annual', 'corporate') AND status = 'active' THEN 1 END) as customerMembers,
        COUNT(CASE WHEN membershipTier = 'all_access_aces' AND status = 'active' THEN 1 END) as allAccessCount,
        COUNT(CASE WHEN membershipTier = 'swing_savers' AND status = 'active' THEN 1 END) as swingSaverCount,
        COUNT(CASE WHEN membershipTier = 'golf_vx_pro' AND status = 'active' THEN 1 END) as proCount,
        COALESCE(SUM(CASE WHEN status = 'active' THEN COALESCE(monthlyAmount, 0) ELSE 0 END), 0) as totalMRR,
        COUNT(CASE WHEN membershipTier IN ('all_access_aces', 'swing_savers', 'golf_vx_pro', 'family', 'monthly', 'annual', 'corporate') AND status = 'active'
          AND joinDate >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as newThisMonth
      FROM members
    `);
    const memberRows = Array.isArray((memberResult as any)[0]) ? (memberResult as any)[0] : (memberResult as any);
    const m = (memberRows as any)[0] || {};

    const revenueResult = await database.execute(`
      SELECT COALESCE(SUM(amount), 0) as thisMonth
      FROM revenue
      WHERE date >= DATE_FORMAT(NOW(), '%Y-%m-01')
    `);
    const revenueLastMonthResult = await database.execute(`
      SELECT COALESCE(SUM(amount), 0) as lastMonth
      FROM revenue
      WHERE date >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
        AND date < DATE_FORMAT(NOW(), '%Y-%m-01')
    `);
    const revRows = Array.isArray((revenueResult as any)[0]) ? (revenueResult as any)[0] : (revenueResult as any);
    const revLastRows = Array.isArray((revenueLastMonthResult as any)[0]) ? (revenueLastMonthResult as any)[0] : (revenueLastMonthResult as any);
    const thisMonthRevenue = parseFloat((revRows as any)[0]?.thisMonth || '0');
    const lastMonthRevenue = parseFloat((revLastRows as any)[0]?.lastMonth || '0');

    const budgetResult = await database.execute(`
      SELECT
        COALESCE(SUM(CAST(budget AS DECIMAL(10,2))), 0) as totalBudget,
        COALESCE(SUM(CAST(actualSpend AS DECIMAL(10,2))), 0) as totalSpent
      FROM campaigns
      WHERE status = 'active'
    `);
    const budgetRows = Array.isArray((budgetResult as any)[0]) ? (budgetResult as any)[0] : (budgetResult as any);
    const b = (budgetRows as any)[0] || {};
    const totalBudget = parseFloat(b.totalBudget || '0');
    const totalSpent = parseFloat(b.totalSpent || '0');

    const campaignResult = await database.execute(`
      SELECT COUNT(*) as activeCampaigns FROM campaigns WHERE status = 'active'
    `);
    const campaignRows = Array.isArray((campaignResult as any)[0]) ? (campaignResult as any)[0] : (campaignResult as any);
    const activeCampaigns = Number((campaignRows as any)[0]?.activeCampaigns || 0);

    return {
      generatedAt: new Date().toISOString(),
      members: {
        total: Number(m.customerMembers || 0),
        allAccessAce: Number(m.allAccessCount || 0),
        swingSaver: Number(m.swingSaverCount || 0),
        pro: Number(m.proCount || 0),
        goal: 300,
        acquisitionGoal: Math.max(0, 300 - Number(m.customerMembers || 0)),
        newThisMonth: Number(m.newThisMonth || 0),
        mrr: parseFloat(m.totalMRR || '0'),
      },
      revenue: {
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        mom: lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0,
      },
      budget: {
        total: totalBudget,
        spent: totalSpent,
        remaining: totalBudget - totalSpent,
        utilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      },
      campaigns: { active: activeCampaigns },
    };
  }),
});

export const emailCampaignsRouter = router({
  list: protectedProcedure.query(async () => {
    const { getSyncedBroadcasts } = await import("../enchargeBroadcastSync");
    return await getSyncedBroadcasts();
  }),

  summary: protectedProcedure.query(async () => {
    const { getEmailPerformanceSummary } = await import("../enchargeBroadcastSync");
    return await getEmailPerformanceSummary();
  }),

  syncNow: protectedProcedure.mutation(async () => {
    const { syncEnchargeBroadcasts } = await import("../enchargeBroadcastSync");
    return await syncEnchargeBroadcasts();
  }),
});

export const funnelsRouter = router({
  list: protectedProcedure
    .input(z.object({ includeArchived: z.boolean().optional().default(false) }).optional())
    .query(async ({ input }) => {
      const { getCfFunnels } = await import("../db");
      return await getCfFunnels(input?.includeArchived ?? false);
    }),

  submissions: protectedProcedure
    .input(z.object({ funnelId: z.number().optional(), limit: z.number().optional().default(100) }))
    .query(async ({ input }) => {
      const { getCfSubmissions } = await import("../db");
      return await getCfSubmissions(input.funnelId, input.limit);
    }),

  summary: protectedProcedure.query(async () => {
    const { getCfFunnelSummary } = await import("../db");
    return await getCfFunnelSummary();
  }),

  syncNow: protectedProcedure.mutation(async () => {
    const { syncClickFunnels } = await import("../clickfunnelsSyncService");
    return await syncClickFunnels();
  }),

  updateUvPv: protectedProcedure
    .input(z.object({
      cfId: z.number(),
      uniqueVisitors: z.number().min(0),
      pageViews: z.number().min(0),
    }))
    .mutation(async ({ input }) => {
      const { updateFunnelUvPv } = await import("../db");
      return await updateFunnelUvPv(input.cfId, input.uniqueVisitors, input.pageViews);
    }),
});
