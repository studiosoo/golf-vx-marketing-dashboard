import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { influencerPartnerships, communityOutreach, printAdvertising, eventAdvertising, metaAdsOverrides } from "../../drizzle/schema";
import * as metaAds from "../metaAds";

export const influencerRouter = router({
  list: protectedProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) return [];
    return database.select().from(influencerPartnerships).orderBy(desc(influencerPartnerships.dealDate));
  }),

  create: protectedProcedure
    .input(z.object({
      handle: z.string(),
      platform: z.enum(["instagram", "tiktok", "youtube", "facebook", "other"]).default("instagram"),
      followerCount: z.number().optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
      dealDate: z.string().optional(),
      totalCost: z.string().optional(),
      deliverables: z.string().optional(),
      campaignGoal: z.string().optional(),
      targetAudience: z.string().optional(),
      status: z.enum(["negotiating", "contracted", "in_progress", "completed", "cancelled"]).default("contracted"),
      actualReach: z.number().optional(),
      actualImpressions: z.number().optional(),
      actualEngagements: z.number().optional(),
      actualLinkClicks: z.number().optional(),
      actualLeadsGenerated: z.number().optional(),
      actualBookingsGenerated: z.number().optional(),
      actualRevenue: z.string().optional(),
      contentUrls: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await database.insert(influencerPartnerships).values({
        handle: input.handle,
        platform: input.platform,
        followerCount: input.followerCount,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        dealDate: input.dealDate as any,
        totalCost: input.totalCost,
        deliverables: input.deliverables,
        campaignGoal: input.campaignGoal,
        targetAudience: input.targetAudience,
        status: input.status,
        actualReach: input.actualReach,
        actualImpressions: input.actualImpressions,
        actualEngagements: input.actualEngagements,
        actualLinkClicks: input.actualLinkClicks,
        actualLeadsGenerated: input.actualLeadsGenerated,
        actualBookingsGenerated: input.actualBookingsGenerated,
        actualRevenue: input.actualRevenue,
        contentUrls: input.contentUrls as any,
        notes: input.notes,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      updates: z.object({
        handle: z.string().optional(),
        platform: z.enum(["instagram", "tiktok", "youtube", "facebook", "other"]).optional(),
        followerCount: z.number().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        dealDate: z.string().optional(),
        totalCost: z.string().optional(),
        deliverables: z.string().optional(),
        campaignGoal: z.string().optional(),
        status: z.enum(["negotiating", "contracted", "in_progress", "completed", "cancelled"]).optional(),
        actualReach: z.number().optional(),
        actualImpressions: z.number().optional(),
        actualEngagements: z.number().optional(),
        actualLinkClicks: z.number().optional(),
        actualLeadsGenerated: z.number().optional(),
        actualBookingsGenerated: z.number().optional(),
        actualRevenue: z.string().optional(),
        contentUrls: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await database.update(influencerPartnerships).set({
        ...input.updates,
        dealDate: input.updates.dealDate as any,
        contentUrls: input.updates.contentUrls as any,
        updatedAt: new Date(),
      }).where(eq(influencerPartnerships.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await database.delete(influencerPartnerships).where(eq(influencerPartnerships.id, input.id));
      return { success: true };
    }),
});

export const outreachRouter = router({
  list: protectedProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) return [];
    return database.select().from(communityOutreach).orderBy(desc(communityOutreach.requestDate));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await database.select().from(communityOutreach).where(eq(communityOutreach.id, input.id));
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Outreach record not found" });
      return rows[0];
    }),

  create: protectedProcedure
    .input(z.object({
      orgName: z.string(),
      orgType: z.enum(["school_pta", "school_sports", "nonprofit", "civic", "arts_culture", "sports_league", "religious", "business", "other"]).default("other"),
      contactName: z.string().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
      website: z.string().optional(),
      ein: z.string().optional(),
      is501c3: z.boolean().optional(),
      requestType: z.enum(["cash_donation", "gift_card", "product_donation", "service_donation", "sponsorship", "partnership", "networking"]).default("gift_card"),
      requestDate: z.string().optional(),
      eventName: z.string().optional(),
      eventDate: z.string().optional(),
      eventLocation: z.string().optional(),
      estimatedAttendees: z.number().optional(),
      requestedAmount: z.string().optional(),
      requestDescription: z.string().optional(),
      status: z.enum(["received", "under_review", "approved", "rejected", "fulfilled", "follow_up"]).default("received"),
      decisionDate: z.string().optional(),
      decisionNotes: z.string().optional(),
      rejectionReason: z.string().optional(),
      actualDonationType: z.string().optional(),
      actualCashValue: z.string().optional(),
      actualPerceivedValue: z.string().optional(),
      benefitsReceived: z.string().optional(),
      estimatedReach: z.number().optional(),
      actualLeadsGenerated: z.number().optional(),
      actualBookingsGenerated: z.number().optional(),
      actualRevenue: z.string().optional(),
      roiNotes: z.string().optional(),
      isRecurring: z.boolean().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await database.insert(communityOutreach).values({
        ...input,
        requestDate: input.requestDate as any,
        eventDate: input.eventDate as any,
        decisionDate: input.decisionDate as any,
        tags: input.tags as any,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      updates: z.object({
        orgName: z.string().optional(),
        orgType: z.enum(["school_pta", "school_sports", "nonprofit", "civic", "arts_culture", "sports_league", "religious", "business", "other"]).optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        requestType: z.enum(["cash_donation", "gift_card", "product_donation", "service_donation", "sponsorship", "partnership", "networking"]).optional(),
        requestDate: z.string().optional(),
        eventName: z.string().optional(),
        eventDate: z.string().optional(),
        estimatedAttendees: z.number().optional(),
        requestedAmount: z.string().optional(),
        requestDescription: z.string().optional(),
        status: z.enum(["received", "under_review", "approved", "rejected", "fulfilled", "follow_up"]).optional(),
        decisionDate: z.string().optional(),
        decisionNotes: z.string().optional(),
        rejectionReason: z.string().optional(),
        actualDonationType: z.string().optional(),
        actualCashValue: z.string().optional(),
        actualPerceivedValue: z.string().optional(),
        benefitsReceived: z.string().optional(),
        estimatedReach: z.number().optional(),
        actualLeadsGenerated: z.number().optional(),
        actualBookingsGenerated: z.number().optional(),
        actualRevenue: z.string().optional(),
        roiNotes: z.string().optional(),
        isRecurring: z.boolean().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await database.update(communityOutreach).set({
        ...input.updates,
        requestDate: input.updates.requestDate as any,
        eventDate: input.updates.eventDate as any,
        decisionDate: input.updates.decisionDate as any,
        tags: input.updates.tags as any,
        updatedAt: new Date(),
      }).where(eq(communityOutreach.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await database.delete(communityOutreach).where(eq(communityOutreach.id, input.id));
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["received", "under_review", "approved", "rejected", "fulfilled", "follow_up"]),
      decisionNotes: z.string().optional(),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await database.update(communityOutreach).set({
        status: input.status,
        decisionDate: new Date().toISOString().split("T")[0] as any,
        decisionNotes: input.decisionNotes,
        rejectionReason: input.rejectionReason,
        updatedAt: new Date(),
      }).where(eq(communityOutreach.id, input.id));
      return { success: true };
    }),

  getSummary: protectedProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) return { total: 0, totalCashValue: 0, totalPerceivedValue: 0, totalEstimatedReach: 0, byStatus: {}, byType: {} };
    const rows = await database.select().from(communityOutreach);
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalCashValue = 0;
    let totalPerceivedValue = 0;
    let totalEstimatedReach = 0;
    for (const row of rows) {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
      byType[row.requestType] = (byType[row.requestType] || 0) + 1;
      totalCashValue += parseFloat(String(row.actualCashValue || 0));
      totalPerceivedValue += parseFloat(String(row.actualPerceivedValue || 0));
      totalEstimatedReach += row.estimatedReach || 0;
    }
    return { total: rows.length, totalCashValue, totalPerceivedValue, totalEstimatedReach, byStatus, byType };
  }),
});

export const printAdRouter = router({
  list: protectedProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) return [];
    return database.select().from(printAdvertising).orderBy(desc(printAdvertising.startDate));
  }),

  create: protectedProcedure
    .input(z.object({
      vendorName: z.string().min(1),
      publicationType: z.enum(["magazine", "newspaper", "flyer", "billboard", "direct_mail", "other"]).default("magazine"),
      adSize: z.string().optional(),
      costPerMonth: z.number().positive(),
      contractMonths: z.number().int().positive().default(1),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.enum(["active", "completed", "cancelled", "negotiating"]).default("active"),
      qrDestination: z.string().optional(),
      qrCodeUrl: z.string().optional(),
      instagramHandle: z.string().optional(),
      website: z.string().optional(),
      circulation: z.number().int().optional(),
      targetArea: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("DB unavailable");
      const now = Date.now();
      const totalContractValue = String((input.costPerMonth * input.contractMonths).toFixed(2));
      await (database.insert(printAdvertising) as any).values({
        vendorName: input.vendorName,
        publicationType: input.publicationType,
        adSize: input.adSize,
        costPerMonth: String(input.costPerMonth),
        contractMonths: input.contractMonths,
        totalContractValue,
        startDate: input.startDate || null,
        endDate: input.endDate || null,
        status: input.status,
        qrDestination: input.qrDestination,
        qrCodeUrl: input.qrCodeUrl,
        instagramHandle: input.instagramHandle,
        website: input.website,
        circulation: input.circulation,
        targetArea: input.targetArea,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      vendorName: z.string().optional(),
      adSize: z.string().optional(),
      costPerMonth: z.number().optional(),
      contractMonths: z.number().int().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.enum(["active", "completed", "cancelled", "negotiating"]).optional(),
      qrDestination: z.string().optional(),
      qrCodeUrl: z.string().optional(),
      instagramHandle: z.string().optional(),
      website: z.string().optional(),
      circulation: z.number().int().optional(),
      targetArea: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("DB unavailable");
      const { id, costPerMonth, contractMonths, ...rest } = input;
      const updates: Record<string, unknown> = { ...rest, updatedAt: Date.now() };
      if (costPerMonth !== undefined) updates.costPerMonth = String(costPerMonth);
      if (costPerMonth !== undefined || contractMonths !== undefined) {
        const [existing] = await database.select().from(printAdvertising).where(eq(printAdvertising.id, id));
        const finalCost = costPerMonth ?? parseFloat(String(existing?.costPerMonth || 0));
        const finalMonths = contractMonths ?? existing?.contractMonths ?? 1;
        updates.totalContractValue = String((finalCost * finalMonths).toFixed(2));
        if (contractMonths !== undefined) updates.contractMonths = contractMonths;
      }
      await database.update(printAdvertising).set(updates).where(eq(printAdvertising.id, id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("DB unavailable");
      await database.delete(printAdvertising).where(eq(printAdvertising.id, input.id));
      return { success: true };
    }),
});

export const eventAdRouter = router({
  list: protectedProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) return [];
    return database.select().from(eventAdvertising).orderBy(desc(eventAdvertising.eventDate));
  }),

  create: protectedProcedure
    .input(z.object({
      eventName: z.string().min(1),
      eventType: z.enum(["trade_show", "expo", "sponsorship", "community_event", "golf_tournament", "other"]).default("trade_show"),
      venue: z.string().optional(),
      location: z.string().optional(),
      eventDate: z.string().optional(),
      eventEndDate: z.string().optional(),
      status: z.enum(["upcoming", "active", "completed", "cancelled"]).default("upcoming"),
      boothCost: z.number().optional(),
      totalCost: z.number().optional(),
      expectedVisitors: z.number().int().optional(),
      actualVisitors: z.number().int().optional(),
      promosDistributed: z.number().int().optional(),
      leadsCollected: z.number().int().optional(),
      teamSignups: z.number().int().optional(),
      membershipSignups: z.number().int().optional(),
      revenue: z.number().optional(),
      boothSize: z.string().optional(),
      boothNumber: z.string().optional(),
      contactPerson: z.string().optional(),
      website: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("DB unavailable");
      const now = Date.now();
      await (database.insert(eventAdvertising) as any).values({
        eventName: input.eventName,
        eventType: input.eventType,
        venue: input.venue,
        location: input.location,
        eventDate: input.eventDate || null,
        eventEndDate: input.eventEndDate || null,
        status: input.status,
        boothCost: input.boothCost ? String(input.boothCost) : null,
        totalCost: input.totalCost ? String(input.totalCost) : null,
        expectedVisitors: input.expectedVisitors,
        actualVisitors: input.actualVisitors,
        promosDistributed: input.promosDistributed,
        leadsCollected: input.leadsCollected,
        teamSignups: input.teamSignups,
        membershipSignups: input.membershipSignups,
        revenue: input.revenue ? String(input.revenue) : null,
        boothSize: input.boothSize,
        boothNumber: input.boothNumber,
        contactPerson: input.contactPerson,
        website: input.website,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      actualVisitors: z.number().int().optional(),
      promosDistributed: z.number().int().optional(),
      leadsCollected: z.number().int().optional(),
      teamSignups: z.number().int().optional(),
      membershipSignups: z.number().int().optional(),
      revenue: z.number().optional(),
      status: z.enum(["upcoming", "active", "completed", "cancelled"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("DB unavailable");
      const { id, ...rest } = input;
      const updates: Record<string, any> = { updatedAt: Date.now() };
      if (rest.actualVisitors !== undefined) updates.actualVisitors = rest.actualVisitors;
      if (rest.promosDistributed !== undefined) updates.promosDistributed = rest.promosDistributed;
      if (rest.leadsCollected !== undefined) updates.leadsCollected = rest.leadsCollected;
      if (rest.teamSignups !== undefined) updates.teamSignups = rest.teamSignups;
      if (rest.membershipSignups !== undefined) updates.membershipSignups = rest.membershipSignups;
      if (rest.revenue !== undefined) updates.revenue = String(rest.revenue);
      if (rest.status !== undefined) updates.status = rest.status;
      if (rest.notes !== undefined) updates.notes = rest.notes;
      await database.update(eventAdvertising).set(updates).where(eq(eventAdvertising.id, id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("DB unavailable");
      await database.delete(eventAdvertising).where(eq(eventAdvertising.id, input.id));
      return { success: true };
    }),
});

export const metaAdsRouter = router({
  getAllCampaignsWithInsights: protectedProcedure
    .input(z.object({ datePreset: z.string().optional() }).optional())
    .query(async ({ input }) => {
      try {
        return await metaAds.getAllCampaignsWithInsights(input?.datePreset || 'last_30d');
      } catch (err) {
        return [];
      }
    }),

  getCampaignDailyInsights: protectedProcedure
    .input(z.object({ campaignId: z.string(), datePreset: z.string().optional() }))
    .query(async ({ input }) => {
      try {
        const days = input.datePreset ? parseInt(input.datePreset.replace(/\D/g, '')) || 30 : 30;
        return await metaAds.getCampaignDailyInsights(input.campaignId, days);
      } catch (err) {
        return [];
      }
    }),

  getCampaignCreatives: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await metaAds.getCampaignCreatives(input.campaignId);
      } catch (err) {
        return [];
      }
    }),

  getCampaignAudience: protectedProcedure
    .input(z.object({ campaignId: z.string(), datePreset: z.string().optional() }))
    .query(async ({ input }) => {
      try {
        return await metaAds.getCampaignAudience(input.campaignId, input.datePreset || 'last_30d');
      } catch (err) {
        return null;
      }
    }),

  getActiveAlerts: protectedProcedure.query(async () => {
    try {
      const campaigns = await metaAds.getAllCampaignsWithInsights('last_7d');
      const alerts: Array<{ id: number; campaignName: string; severity: string; message: string; threshold: string; actualValue: string; createdAt: number }> = [];
      let alertId = 1;
      for (const c of campaigns) {
        const ins = (c as any).insights || c;
        const ctr = parseFloat(String(ins.ctr ?? 0));
        const spend = parseFloat(String(ins.spend ?? 0));
        const reach = parseInt(String(ins.reach ?? 0));
        if (ctr > 0 && ctr < 0.5) {
          alerts.push({ id: alertId++, campaignName: (c as any).name || 'Unknown', severity: 'medium', message: `CTR is below 0.5% (${ctr.toFixed(2)}%)`, threshold: '0.5%', actualValue: `${ctr.toFixed(2)}%`, createdAt: Date.now() });
        }
        if (spend > 0 && reach < 100) {
          alerts.push({ id: alertId++, campaignName: (c as any).name || 'Unknown', severity: 'high', message: `Very low reach (${reach} people) despite spend`, threshold: '100 reach', actualValue: String(reach), createdAt: Date.now() });
        }
      }
      return alerts;
    } catch (err) {
      return [];
    }
  }),

  acknowledgeAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async () => ({ success: true })),

  resolveAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async () => ({ success: true })),

  generateCampaignInsights: protectedProcedure
    .input(z.object({ campaignId: z.string(), datePreset: z.string().optional() }))
    .mutation(async ({ input }) => {
      try {
        const { invokeLLM } = await import('../_core/llm');
        const allCampaigns = await metaAds.getAllCampaignsWithInsights(input.datePreset || 'last_30d');
        const campaign = (allCampaigns as any[]).find((c: any) => c.id === input.campaignId);
        if (!campaign) return { insights: 'Campaign not found in current date range.' };
        const ins = campaign.insights || {};
        const spend = parseFloat(ins.spend || '0');
        const reach = parseInt(ins.reach || '0');
        const impressions = parseInt(ins.impressions || '0');
        const clicks = parseInt(ins.clicks || '0');
        const ctr = parseFloat(ins.ctr || '0');
        const cpc = parseFloat(ins.cpc || '0');
        const cpm = parseFloat(ins.cpm || '0');
        const prompt = `You are a senior Meta Ads strategist for Golf VX Arlington Heights, an indoor golf simulator in the Chicago suburbs.\n\nCAMPAIGN: ${campaign.name}\nStatus: ${campaign.status}\nObjective: ${campaign.objective}\nDate Range: ${ins.date_start || 'N/A'} to ${ins.date_stop || 'N/A'}\n\nPERFORMANCE METRICS:\n- Spend: $${spend.toFixed(2)}\n- Reach: ${reach.toLocaleString()} people\n- Impressions: ${impressions.toLocaleString()}\n- Clicks: ${clicks.toLocaleString()}\n- CTR: ${ctr.toFixed(2)}%\n- CPC: $${cpc.toFixed(2)}\n- CPM: $${cpm.toFixed(2)}\n\nProvide a concise analysis (3-4 paragraphs) covering:\n1. Performance assessment vs. industry benchmarks for fitness/sports facilities\n2. Key strengths and areas for improvement\n3. Specific actionable recommendations to improve ROAS and conversions\n4. Audience targeting suggestions for the Arlington Heights / Chicago suburbs market`;
        const response = await invokeLLM({ messages: [{ role: 'user', content: prompt }] });
        const insights = response?.choices?.[0]?.message?.content || 'Unable to generate insights.';
        return { insights };
      } catch (err) {
        return { insights: 'Unable to generate insights at this time.' };
      }
    }),
  getStatusOverrides: protectedProcedure.query(async () => {
    try {
      const database = await db.getDb();
      if (!database) return [];
      const rows = await database.select().from(metaAdsOverrides);
      return rows;
    } catch {
      return [];
    }
  }),
  setStatusOverride: protectedProcedure
    .input(z.object({
      campaignId: z.string(),
      campaignName: z.string(),
      overrideStatus: z.enum(["active", "completed", "archived"]).nullable(),
    }))
    .mutation(async ({ input }) => {
      try {
        const database = await db.getDb();
        if (!database) return { success: false };
        const now = Date.now();
        if (input.overrideStatus === null) {
          // Clear override
          await database.delete(metaAdsOverrides).where(eq(metaAdsOverrides.campaignId, input.campaignId));
        } else {
          // Upsert override
          const existing = await database.select().from(metaAdsOverrides)
            .where(eq(metaAdsOverrides.campaignId, input.campaignId));
          if (existing.length > 0) {
            await database.update(metaAdsOverrides)
              .set({ overrideStatus: input.overrideStatus, updatedAt: now })
              .where(eq(metaAdsOverrides.campaignId, input.campaignId));
          } else {
            await database.insert(metaAdsOverrides).values({
              campaignId: input.campaignId,
              campaignName: input.campaignName,
              overrideStatus: input.overrideStatus,
              overriddenAt: now,
              updatedAt: now,
            });
          }
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message };
      }
    }),
  syncCache: protectedProcedure.mutation(async () => {
    try {
      const { refreshMetaAdsCache } = await import('../refreshMetaAdsCache');
      const result = await refreshMetaAdsCache();
      return result;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Unknown error' };
    }
  }),
});

export const revenueRouter = router({
  getToastSummary: protectedProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) return { totalRevenue: 0, thisMonthRevenue: 0, lastMonthRevenue: 0, allTimeRevenue: 0, avgDailyRevenue: 0, thisMonthOrders: 0 };
    const { memberTransactions } = await import('../../drizzle/schema');
    const { eq: eqOp } = await import('drizzle-orm');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const allTx = await database.select().from(memberTransactions).where(eqOp(memberTransactions.paymentStatus, 'paid'));
    const thisMonthTx = allTx.filter(t => new Date(t.transactionDate) >= startOfMonth);
    const lastMonthTx = allTx.filter(t => {
      const d = new Date(t.transactionDate);
      return d >= startOfLastMonth && d <= endOfLastMonth;
    });
    const sum = (txs: typeof allTx) => txs.reduce((s, t) => s + parseFloat(String(t.total || 0)), 0);
    const allTimeRevenue = sum(allTx);
    const thisMonthRevenue = sum(thisMonthTx);
    const lastMonthRevenue = sum(lastMonthTx);
    const daysInMonth = now.getDate();
    const avgDailyRevenue = daysInMonth > 0 ? thisMonthRevenue / daysInMonth : 0;
    return { totalRevenue: allTimeRevenue, thisMonthRevenue, lastMonthRevenue, allTimeRevenue, avgDailyRevenue, thisMonthOrders: thisMonthTx.length };
  }),

  getSummary: protectedProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date() }).optional())
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return { total: 0, toastRevenue: 0, acuityRevenue: 0, memberCount: 0 };
      const { memberTransactions } = await import('../../drizzle/schema');
      const { gte: gteOp, lte: lteOp, and: andOp, eq: eqOp } = await import('drizzle-orm');
      const now = new Date();
      const start = input?.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const end = input?.endDate || now;
      const txs = await database.select().from(memberTransactions)
        .where(andOp(
          eqOp(memberTransactions.paymentStatus, 'paid'),
          gteOp(memberTransactions.transactionDate, start),
          lteOp(memberTransactions.transactionDate, end)
        ));
      const total = txs.reduce((s, t) => s + parseFloat(String(t.total || 0)), 0);
      return { total, toastRevenue: total, acuityRevenue: 0, memberCount: txs.length };
    }),

  getToastDaily: protectedProcedure
    .input(z.object({ startDate: z.string().optional(), endDate: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      const { toastDailySummary } = await import('../../drizzle/schema');
      const { gte: gteOp, lte: lteOp, and: andOp } = await import('drizzle-orm');
      const conditions = [];
      if (input?.startDate) conditions.push(gteOp(toastDailySummary.date, input.startDate));
      if (input?.endDate) conditions.push(lteOp(toastDailySummary.date, input.endDate));
      const rows = conditions.length > 0
        ? await database.select().from(toastDailySummary).where(andOp(...conditions as [any, ...any[]])).orderBy(toastDailySummary.date)
        : await database.select().from(toastDailySummary).orderBy(toastDailySummary.date);
      return rows;
    }),

  getTrialSessionDetail: protectedProcedure.query(async () => {
    try {
      const { getAppointments } = await import('../acuity');
      const appointments = await getAppointments({ canceled: false, max: 1000 });
      const trialAppts = appointments.filter((apt: any) => {
        const t = apt.type.toLowerCase();
        return t.includes('trial') || t.includes('intro') || t.includes('free') || t.includes('guest pass') || t.includes('first visit');
      });
      const typeMap = new Map<string, { name: string; count: number; paidCount: number; revenue: number; bookings: any[] }>();
      for (const apt of trialAppts) {
        const key = apt.type;
        const paid = parseFloat(apt.amountPaid || '0');
        if (!typeMap.has(key)) typeMap.set(key, { name: key, count: 0, paidCount: 0, revenue: 0, bookings: [] });
        const entry = typeMap.get(key)!;
        entry.count += 1;
        entry.revenue += paid;
        if (paid > 0) entry.paidCount += 1;
        entry.bookings.push({ id: apt.id, firstName: apt.firstName, lastName: apt.lastName, email: apt.email, date: apt.date, time: apt.time, amountPaid: apt.amountPaid, type: apt.type });
      }
      const types = Array.from(typeMap.values()).map(t => ({ ...t, avgPrice: t.count > 0 ? t.revenue / t.count : 0 }));
      const totalBookings = trialAppts.length;
      const totalRevenue = trialAppts.reduce((s: number, a: any) => s + parseFloat(a.amountPaid || '0'), 0);
      const allBookings = trialAppts.map((apt: any) => ({ id: apt.id, firstName: apt.firstName, lastName: apt.lastName, email: apt.email, date: apt.date, time: apt.time, amountPaid: apt.amountPaid, type: apt.type }));
      return { types, totalBookings, totalRevenue, allBookings };
    } catch (err) {
      return { types: [], totalBookings: 0, totalRevenue: 0, allBookings: [] };
    }
  }),

  getAcuityRevenue: protectedProcedure
    .input(z.object({ minDate: z.string().optional(), maxDate: z.string().optional() }))
    .query(async ({ input }) => {
      try {
        const { getAllRevenueByType } = await import('../acuity');
        const revenueData = await getAllRevenueByType(input.minDate, input.maxDate);
        const total = revenueData.reduce((s, r) => s + r.totalRevenue, 0);
        const totalBookings = revenueData.reduce((s, r) => s + r.bookingCount, 0);
        return { total, totalBookings, byType: revenueData };
      } catch (err) {
        return { total: 0, totalBookings: 0, byType: [] };
      }
    }),
});
