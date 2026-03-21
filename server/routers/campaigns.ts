import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { calculateCampaignPerformance, GOAL_TEMPLATES } from "../goalTemplates";
import { inArray, and, gte } from "drizzle-orm";
import { stripeSnapshot } from "../data/stripe-snapshot";

export const campaignsRouter = router({
  list: protectedProcedure.query(async () => {
    const campaigns = await db.getAllCampaigns();
    return campaigns.map(campaign => {
      if (campaign.goalType) {
        const { kpiActual, performanceScore } = calculateCampaignPerformance(campaign);
        return {
          ...campaign,
          kpiActual,
          performanceScore,
        };
      }
      return campaign;
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const campaign = await db.getCampaignById(input.id);
      if (!campaign) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      }
      return campaign;
    }),

  getByStatus: protectedProcedure
    .input(z.object({ status: z.enum(["planned", "active", "completed", "paused"]) }))
    .query(async ({ input }) => {
      return await db.getCampaignsByStatus(input.status);
    }),

  getByDateRange: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input }) => {
      return await db.getCampaignsByDateRange(input.startDate, input.endDate);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      category: z.enum(["trial_conversion", "membership_acquisition", "member_retention", "corporate_events"]),
      type: z.enum(["trial_conversion", "membership_acquisition", "corporate_events", "member_retention", "pbga_programs", "event_specific"]),
      status: z.enum(["planned", "active", "completed", "paused"]).default("planned"),
      description: z.string().optional(),
      startDate: z.date(),
      endDate: z.date(),
      budget: z.string(),
      targetRevenue: z.string().optional(),
      targetApplications: z.number().optional(),
      targetConversions: z.number().optional(),
      asanaProjectId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createCampaign(input);
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      updates: z.object({
        name: z.string().optional(),
        status: z.enum(["planned", "active", "completed", "paused"]).optional(),
        description: z.string().optional(),
        actualSpend: z.string().optional(),
        actualRevenue: z.string().optional(),
        actualApplications: z.number().optional(),
        actualConversions: z.number().optional(),
        goalType: z.enum(["revenue", "followers", "leads", "attendance", "retention"]).optional(),
        goalTarget: z.string().optional(),
        goalActual: z.string().optional(),
        goalUnit: z.string().optional(),
        primaryKpi: z.string().optional(),
        kpiTarget: z.string().optional(),
        kpiActual: z.string().optional(),
        kpiUnit: z.string().optional(),
        performanceScore: z.number().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateCampaign(input.id, input.updates);
      return { success: true };
    }),

  getGoalTemplates: protectedProcedure.query(() => {
    return Object.entries(GOAL_TEMPLATES).map(([key, template]) => ({
      goalType: key,
      goalUnit: template.goalUnit,
      primaryKpi: template.primaryKpi,
      kpiUnit: template.kpiUnit,
      description: template.description,
    }));
  }),

  calculatePerformance: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      const campaign = await db.getCampaignById(input.campaignId);
      if (!campaign) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      }
      return calculateCampaignPerformance(campaign);
    }),

  getSundayClinicMetrics: protectedProcedure
    .input(z.object({
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { getSundayClinicGoalMetrics } = await import("../acuity");
      const database = await db.getDb();
      const activePayingResult = database ? await database.execute(
        `SELECT email FROM members WHERE status = 'active' AND membershipTier IN ('all_access_aces', 'swing_savers', 'golf_vx_pro', 'family', 'monthly', 'annual', 'corporate')`
      ) : [[]];
      const activePayingRows = Array.isArray((activePayingResult as any)[0]) ? (activePayingResult as any)[0] : (activePayingResult as any);
      const memberEmails = (activePayingRows as any[]).map((r: any) => r.email).filter(Boolean);
      const metrics = await getSundayClinicGoalMetrics({
        minDate: input.minDate,
        maxDate: input.maxDate,
        memberEmails,
      });
      return metrics;
    }),

  getWinterClinicMetrics: protectedProcedure
    .input(z.object({
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { getWinterClinicData } = await import("../acuity");
      return await getWinterClinicData({ minDate: input.minDate, maxDate: input.maxDate });
    }),

  getJuniorCampMetrics: protectedProcedure
    .input(z.object({
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { getJuniorCampData } = await import("../acuity");
      return await getJuniorCampData({ minDate: input.minDate, maxDate: input.maxDate });
    }),

  getSundayClinicAttendeeList: protectedProcedure
    .input(z.object({
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
      type: z.enum(["members", "new_visitors"]),
    }))
    .query(async ({ input }) => {
      const { getSundayClinicData } = await import("../acuity");
      const members = await db.getAllMembers();
      const memberEmailSet = new Set(members.map(m => m.email.toLowerCase()));
      const data = await getSundayClinicData({ minDate: input.minDate, maxDate: input.maxDate });
      const allAppts = data.events.flatMap(e => e.appointments);
      const seen = new Set<string>();
      const filtered = allAppts.filter(apt => {
        const email = apt.email.toLowerCase();
        if (seen.has(email)) return false;
        seen.add(email);
        const isMember = memberEmailSet.has(email);
        return input.type === "members" ? isMember : !isMember;
      });
      return filtered.map(apt => ({
        id: apt.id,
        firstName: apt.firstName,
        lastName: apt.lastName,
        email: apt.email,
        phone: apt.phone,
        date: apt.date,
        type: apt.type,
        isMember: memberEmailSet.has(apt.email.toLowerCase()),
      }));
    }),

  getSundayClinicAttendeesBySource: protectedProcedure
    .input(z.object({
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
      source: z.string(),
    }))
    .query(async ({ input }) => {
      const { getSundayClinicData, extractAcquisitionSource } = await import("../acuity");
      const data = await getSundayClinicData({ minDate: input.minDate, maxDate: input.maxDate });
      const allAppts = data.events.flatMap(e => e.appointments);
      const filtered = allAppts.filter(apt => {
        const src = extractAcquisitionSource(apt);
        return src.toLowerCase() === input.source.toLowerCase();
      });
      const seen = new Set<string>();
      return filtered
        .filter(apt => { const k = apt.email.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
        .map(apt => ({
          id: apt.id,
          firstName: apt.firstName,
          lastName: apt.lastName,
          email: apt.email,
          phone: apt.phone,
          date: apt.date,
          type: apt.type,
          source: extractAcquisitionSource(apt),
        }));
    }),

  getSundayClinicAttendeesByEvent: protectedProcedure
    .input(z.object({
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
      eventDate: z.string(),
    }))
    .query(async ({ input }) => {
      const { getSundayClinicData, extractAcquisitionSource } = await import("../acuity");
      const members = await db.getAllMembers();
      const memberEmailSet = new Set(members.map(m => m.email.toLowerCase()));
      const data = await getSundayClinicData({ minDate: input.minDate, maxDate: input.maxDate });
      const event = data.events.find(e => e.date === input.eventDate);
      if (!event) return [];
      return event.appointments.map(apt => ({
        id: apt.id,
        firstName: apt.firstName,
        lastName: apt.lastName,
        email: apt.email,
        phone: apt.phone,
        date: apt.date,
        type: apt.type,
        source: extractAcquisitionSource(apt),
        isMember: memberEmailSet.has(apt.email.toLowerCase()),
      }));
    }),

  getWinterClinicAttendeeList: protectedProcedure
    .input(z.object({
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
      clinicShortName: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { getAppointments, categorizeClinicType } = await import("../acuity");
      const appointments = await getAppointments({
        minDate: input.minDate || '2026-01-01',
        maxDate: input.maxDate || '2026-03-31',
        canceled: false,
      });
      const clinicAppointments = appointments.filter((apt: any) => {
        const name = apt.type.toLowerCase();
        const isClinic = name.includes('clinic') && (
          name.includes('tots') ||
          name.includes('bogey') ||
          name.includes('par shooter') ||
          name.includes('h.s.') ||
          name.includes('player/prep') ||
          name.includes('ladies') ||
          name.includes('co-ed') ||
          name.includes('adults & kids') ||
          name.includes('adults and kids') ||
          name.includes('morning mulligan')
        );
        if (!isClinic) return false;
        if (input.clinicShortName) {
          // Match via the same categorization function used by getWinterClinicMetrics
          // so that shortNames like "Ladies Only (PM)" resolve correctly against
          // raw Acuity type strings like "Ladies Only Clinic (Evening) — Wednesdays…"
          return categorizeClinicType(apt.type).shortName === input.clinicShortName;
        }
        return true;
      });
      return clinicAppointments.map((apt: any) => ({
        id: apt.id,
        firstName: apt.firstName,
        lastName: apt.lastName,
        email: apt.email,
        phone: apt.phone,
        date: apt.date,
        type: apt.type,
        amountPaid: apt.amountPaid || apt.priceSold || apt.price || '0',
      }));
    }),

  generateEmailDraft: protectedProcedure
    .input(z.object({
      actionId: z.number(),
      actionTitle: z.string(),
      actionDescription: z.string(),
      campaignName: z.string(),
      targetAudience: z.string().optional(),
      emailType: z.string().optional(),
      conversions: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("../_core/llm");
      const emailType = input.emailType || "nurture_sequence";
      const targetAudience = input.targetAudience || "recent leads";
      const conversions = input.conversions || 0;

      const systemPrompt = `You are an expert email marketing copywriter for Golf VX Arlington Heights, an indoor golf simulator facility in Arlington Heights, IL.
Brand voice: Friendly, energetic, community-focused. Golf VX offers simulator bays, memberships (All-Access Ace $325/mo, Swing Saver $225/mo), Drive Day clinics, PBGA Winter Clinics, and Junior Summer Camp.

CURRENT PRIORITY — DRIVE DAY CLINIC:
The next Drive Day Clinic is coming up soon. This is a PBGA-coached 90-minute session with Coach Chuck Lynch for only $20. This should be the FIRST and PRIMARY call-to-action in the email sequence. Encourage readers to book their spot before it fills up.

INSTAGRAM ENGAGEMENT:
We recently posted a new reel on Instagram showcasing Golf VX Arlington Heights. Include a line encouraging readers to follow us on Instagram at @golfvxarlingtonheights and check out our latest reel: https://www.instagram.com/golfvxarlingtonheights/

Write a ${emailType === 'nurture_sequence' ? '3-email nurture sequence' : 'follow-up email'} for ${targetAudience} from the "${input.campaignName}" campaign.
Return a JSON object with:
- subject: email subject line
- preheader: preview text (50-90 chars)
- emails: array of email objects, each with: { emailNumber, subject, preheader, body (HTML), callToAction, sendDelay }
For nurture sequences, space emails: Email 1 (immediately — Drive Day focus), Email 2 (3 days later — membership benefits), Email 3 (7 days later — social proof + Instagram follow).`;

      const userPrompt = `Campaign: ${input.campaignName}
Action: ${input.actionTitle}
Context: ${input.actionDescription}
Target: ${conversions} ${targetAudience}
Email type: ${emailType}
PRIORITY: Lead with the upcoming Drive Day Clinic ($20 for 90 min with Coach Chuck Lynch) as the primary CTA. Also encourage following @golfvxarlingtonheights on Instagram and watching our latest reel. Secondary CTA: book a trial session ($9 for 1 hour).`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "email_sequence",
            strict: true,
            schema: {
              type: "object",
              properties: {
                subject: { type: "string" },
                preheader: { type: "string" },
                emails: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      emailNumber: { type: "integer" },
                      subject: { type: "string" },
                      preheader: { type: "string" },
                      body: { type: "string" },
                      callToAction: { type: "string" },
                      sendDelay: { type: "string" },
                    },
                    required: ["emailNumber", "subject", "preheader", "body", "callToAction", "sendDelay"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["subject", "preheader", "emails"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("LLM returned no content");
      const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

      try {
        const parsed = JSON.parse(content);
        return { success: true, draft: parsed };
      } catch {
        return { success: true, draft: { subject: "Email Draft", preheader: "", emails: [{ emailNumber: 1, subject: "Follow up from Golf VX", preheader: "", body: content, callToAction: "Book a Trial Session", sendDelay: "Immediately" }] } };
      }
    }),

  getByCategory: protectedProcedure
    .input(z.object({ category: z.enum(["trial_conversion", "membership_acquisition", "member_retention", "corporate_events"]) }))
    .query(async ({ input }) => {
      return await db.getCampaignsByCategory(input.category);
    }),

  getDriveDayFunnel: protectedProcedure
    .input(z.object({
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const database = await (await import("../db")).getDb();
      if (!database) return { steps: [], conversionRate: 0, totalAttendees: 0, convertedMembers: 0 };

      let driveDayAttendees: string[] = [];
      let totalDriveDayBookings = 0;
      try {
        const { getSundayClinicData } = await import("../acuity");
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const data = await getSundayClinicData({
          minDate: input.minDate || sixMonthsAgo.toISOString().split('T')[0],
          maxDate: input.maxDate || now.toISOString().split('T')[0],
        });
        totalDriveDayBookings = data.totalBookings || 0;
        const allEmails = new Set<string>();
        data.events.forEach((event: any) => {
          event.appointments.forEach((apt: any) => {
            if (apt.email) allEmails.add(apt.email.toLowerCase());
          });
        });
        driveDayAttendees = Array.from(allEmails);
      } catch { driveDayAttendees = []; }

      let convertedCount = 0;
      let recentConvertedCount = 0;
      if (driveDayAttendees.length > 0) {
        const { members } = await import("../../drizzle/schema");
        const BATCH = 100;
        for (let i = 0; i < driveDayAttendees.length; i += BATCH) {
          const batch = driveDayAttendees.slice(i, i + BATCH);
          const converted = await database
            .select({ email: members.email })
            .from(members)
            .where(inArray(members.email, batch));
          convertedCount += converted.length;
        }
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        for (let i = 0; i < driveDayAttendees.length; i += BATCH) {
          const batch = driveDayAttendees.slice(i, i + BATCH);
          const { sql } = await import("drizzle-orm");
          const recentConvertedRows = await database
            .select({ cnt: sql<number>`COUNT(*)` })
            .from(members)
            .where(and(inArray(members.email, batch), gte(members.joinDate, thirtyDaysAgo)));
          recentConvertedCount += Number(recentConvertedRows[0]?.cnt || 0);
        }
      }

      const totalUniqueAttendees = driveDayAttendees.length;
      const conversionRate = totalUniqueAttendees > 0 ? (convertedCount / totalUniqueAttendees) * 100 : 0;
      const targetConversionRate = 20;

      return {
        steps: [
          { label: "Drive Day Bookings", count: totalDriveDayBookings, description: "Total clinic bookings (incl. repeat)" },
          { label: "Unique Attendees", count: totalUniqueAttendees, description: "Unique individuals who attended" },
          { label: "Converted to Members", count: convertedCount, description: "Attendees who later joined as members" },
          { label: "Converted (Last 30 Days)", count: recentConvertedCount, description: "Recent conversions from Drive Day" },
        ],
        conversionRate: Math.round(conversionRate * 10) / 10,
        targetConversionRate,
        totalAttendees: totalUniqueAttendees,
        convertedMembers: convertedCount,
        recentConversions: recentConvertedCount,
      };
    }),

  getCategorySummary: protectedProcedure.query(async () => {
    return await db.getCategorySummary();
  }),

  updateVisuals: protectedProcedure
    .input(z.object({
      id: z.number(),
      landingPageUrl: z.string().optional(),
      posterImageUrl: z.string().optional(),
      reelThumbnailUrl: z.string().optional(),
      additionalVisuals: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...visuals } = input;
      await db.updateCampaignVisuals(id, visuals);
      return { success: true };
    }),

});


export const reportsRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllReports();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const report = await db.getReportById(input.id);
      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      }
      return report;
    }),

  generate: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(["campaign_performance", "monthly_summary", "roi_analysis", "member_acquisition", "channel_performance", "executive_summary"]),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .mutation(async ({ input, ctx }) => {
      let reportData: any = {};
      switch (input.type) {
        case "campaign_performance":
          const campaigns = await db.getCampaignsByDateRange(input.startDate, input.endDate);
          reportData = { campaigns };
          break;
        case "monthly_summary":
          const [revenue, memberStats, channelPerf] = await Promise.all([
            db.getTotalRevenue(input.startDate, input.endDate),
            db.getMemberStats(),
            db.getChannelPerformanceSummary(input.startDate, input.endDate),
          ]);
          reportData = { revenue, memberStats, channelPerf };
          break;
        default:
          reportData = { message: "Report type not implemented" };
      }
      const id = await db.createReport({
        name: input.name,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        data: JSON.stringify(reportData),
        generatedBy: ctx.user.id,
      });
      return { id };
    }),
});

export const strategicCampaignsRouter = router({
  getOverview: protectedProcedure.query(async () => {
    const allCampaigns = await db.getAllCampaigns();
    const categoryConfig: Record<string, { name: string; description: string; color: string; landingPageUrl?: string }> = {
      membership_acquisition: {
        name: 'Membership Acquisition',
        description: 'Campaigns focused on growing the member base through giveaways, promotions, and direct outreach',
        color: 'yellow',
        landingPageUrl: 'https://golfvx.com/arlington-heights',
      },
      trial_conversion: {
        name: 'Trial Conversion',
        description: 'Converting trial session visitors and leads into paying members',
        color: 'green',
      },
      member_retention: {
        name: 'Member Retention',
        description: 'Keeping existing members engaged and renewing their memberships',
        color: 'blue',
      },
      corporate_events: {
        name: 'Corporate & B2B Events',
        description: 'Attracting corporate groups, private events, and B2B partnerships',
        color: 'purple',
      },
    };
    const grouped: Record<string, {
      id: string;
      name: string;
      description: string;
      color: string;
      landingPageUrl?: string;
      totalBudget: number;
      totalSpend: number;
      totalRevenue: number;
      totalPrograms: number;
      roi: number;
      programs: Array<{ id: number; name: string; spend: number; revenue: number; status: string }>;
    }> = {};
    for (const campaign of allCampaigns) {
      const cat = campaign.category;
      if (!grouped[cat]) {
        const config = categoryConfig[cat] || { name: cat, description: '', color: 'gray' };
        grouped[cat] = {
          id: cat,
          name: config.name,
          description: config.description,
          color: config.color,
          landingPageUrl: config.landingPageUrl,
          totalBudget: 0,
          totalSpend: 0,
          totalRevenue: 0,
          totalPrograms: 0,
          roi: 0,
          programs: [],
        };
      }
      const budget = parseFloat(String(campaign.budget || 0));
      const spend = parseFloat(String(campaign.actualSpend || 0));
      const revenue = parseFloat(String(campaign.actualRevenue || 0));
      grouped[cat].totalBudget += budget;
      grouped[cat].totalSpend += spend;
      grouped[cat].totalRevenue += revenue;
      grouped[cat].totalPrograms++;
      grouped[cat].programs.push({ id: campaign.id, name: campaign.name, spend, revenue, status: campaign.status });
    }
    for (const group of Object.values(grouped)) {
      group.roi = group.totalSpend > 0 ? ((group.totalRevenue - group.totalSpend) / group.totalSpend) * 100 : 0;
    }
    const order = ['membership_acquisition', 'trial_conversion', 'member_retention', 'corporate_events'];
    return order.filter(k => grouped[k]).map(k => grouped[k]);
  }),
});

export const budgetsRouter = router({
  getCampaignBudgetSummary: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      const campaign = await db.getCampaignById(input.campaignId);
      if (!campaign) throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' });
      const manualExpenses = await db.getTotalCampaignExpenses(input.campaignId);
      const plannedBudget = campaign.budget || '0';
      const metaAdsSpend = campaign.metaAdsSpend || '0';
      const totalActualSpend = (parseFloat(metaAdsSpend) + parseFloat(manualExpenses)).toFixed(2);
      const remaining = (parseFloat(plannedBudget) - parseFloat(totalActualSpend)).toFixed(2);
      const utilization = parseFloat(plannedBudget) > 0
        ? ((parseFloat(totalActualSpend) / parseFloat(plannedBudget)) * 100).toFixed(1)
        : '0';
      return { plannedBudget, metaAdsSpend, manualExpenses, totalActualSpend, remaining, utilization };
    }),

  getCampaignExpenses: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      return await db.getCampaignExpenses(input.campaignId);
    }),

  syncMetaAdsBudgets: protectedProcedure.mutation(async () => {
    try {
      const metaAds = await import("../metaAds");
      const synced = await metaAds.syncMetaAdsBudgets();
      return { syncedCampaigns: Array.isArray(synced) ? synced : [] };
    } catch (err) {
      return { syncedCampaigns: [] as number[] };
    }
  }),

  autoLinkMetaAdsCampaigns: protectedProcedure.mutation(async () => {
    try {
      const metaAds = await import("../metaAds");
      const linked = await metaAds.autoLinkMetaAdsCampaigns();
      return { linkedCampaigns: Array.isArray(linked) ? linked : [] };
    } catch (err) {
      return { linkedCampaigns: [] as Array<{ dbCampaignId: number; metaCampaignId: string; name: string }> };
    }
  }),

  addExpense: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      date: z.date(),
      category: z.enum(['meta_ads', 'venue_rental', 'food_beverage', 'promotional_materials', 'staff_costs', 'equipment', 'other']),
      amount: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createCampaignExpense({
        campaignId: input.campaignId,
        date: input.date,
        category: input.category,
        amount: input.amount,
        description: input.description || '',
      });
      const metaAdsSpend = (await db.getCampaignById(input.campaignId))?.metaAdsSpend || '0';
      await db.syncMetaAdsSpend(input.campaignId, metaAdsSpend);
      return { id };
    }),

  deleteExpense: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteCampaignExpense(input.id);
      return { success: true };
    }),
});

export const dashboardRouter = router({
  getOverview: protectedProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date() }).optional())
    .query(async () => {
      const [memberStats, activeCampaigns] = await Promise.all([
        db.getMemberStats(),
        db.getCampaignsByStatus('active'),
      ]);
      // Prefer Stripe snapshot for member count and MRR — authoritative billing source.
      // stripeSnapshot is a static TS import (server/data/stripe-snapshot.ts); always defined.
      // Falls back to Boomerang-derived DB stats if snapshot values are 0 (shouldn't occur).
      const totalMembers = stripeSnapshot.payingMembers || memberStats?.totalMembers || 0;
      const activeMembers = stripeSnapshot.payingMembers || memberStats?.activeMembers || 0;
      const monthlyRecurringRevenue = stripeSnapshot.totalMRR || (() => {
        const allAccessMRR = parseFloat(memberStats?.allAccessMRR || '0');
        const swingSaversMRR = parseFloat(memberStats?.swingSaversMRR || '0');
        const golfVxProMRR = parseFloat(memberStats?.golfVxProMRR || '0');
        return allAccessMRR + swingSaversMRR + golfVxProMRR;
      })();
      const activeCampaignsCount = activeCampaigns.length;
      const marketingSpend = activeCampaigns
        .reduce((s, c) => s + parseFloat(c.actualSpend || '0'), 0)
        .toFixed(2);
      const integrationStatuses = {
        metaAds: { status: process.env.META_ADS_ACCESS_TOKEN ? 'connected' : 'error', lastSync: new Date().toISOString() },
        encharge: { status: process.env.ENCHARGE_API_KEY ? 'connected' : 'error', lastSync: new Date().toISOString() },
        acuity: { status: process.env.ACUITY_API_KEY ? 'connected' : 'error', lastSync: new Date().toISOString() },
        clickfunnels: { status: process.env.CLICKFUNNELS_API_KEY ? 'connected' : 'error', lastSync: new Date().toISOString() },
        boomerang: { status: process.env.BOOMERANG_API_TOKEN ? 'connected' : 'error', lastSync: new Date().toISOString() },
        toast: { status: 'connected', lastSync: new Date().toISOString(), count: 0 },
      };
      return {
        totalMembers,
        activeMembers,
        monthlyRecurringRevenue,
        activeCampaignsCount,
        marketingSpend,
        overallROI: 0,
        ...integrationStatuses,
      };
    }),
});
