import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import * as metaAds from "./metaAds";
import * as metaAdsCache from "./metaAdsCache";
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
} from "./autonomous";
import { seedDemoData } from "./seed-demo";
import * as encharge from "./encharge";
import * as conversionTracking from "./conversionTracking";
import * as memberAppointmentSync from "./memberAppointmentSync";
import * as toastTransactionSync from "./toastTransactionSync";
import * as giveawaySync from "./giveawaySync";
import { syncGiveawayFromSheets } from "./googleSheetsSync";
import { calculateCampaignPerformance, GOAL_TEMPLATES } from "./goalTemplates";
import { eq, desc, sql, inArray, and, gte } from "drizzle-orm";
import { aiRecommendations, userActions, priorities, influencerPartnerships, communityOutreach, printAdvertising, eventAdvertising } from "../drizzle/schema";
import { emailCaptureRouter } from "./emailCaptureRouter";
import { boomerangRouter } from "./boomerangRouter";
import { communicationRouter } from "./communicationRouter";

export const appRouter = router({
  system: systemRouter,
  emailCapture: emailCaptureRouter,
  boomerang: boomerangRouter,
  communication: communicationRouter,
  
  // Public endpoints for landing pages
  public: router({
    trackPageEvent: publicProcedure
      .input(z.object({
        pageSlug: z.string(),
        eventType: z.enum(["page_view", "cta_click", "form_submit", "booking_started", "booking_completed", "scroll_depth", "time_on_page"] as const),
        eventData: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get or create page ID from slug
        const page = await db.getLandingPageBySlug(input.pageSlug);
        if (!page) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Page not found" });
        }

        // Generate session ID from cookie or create new one
        const sessionId = ctx.req.cookies.session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Extract UTM parameters from referer or query string
        const referer = ctx.req.headers.referer || ctx.req.headers.referrer;
        const userAgent = ctx.req.headers["user-agent"];
        const ipAddress = ctx.req.headers["x-forwarded-for"] || ctx.req.socket.remoteAddress;

        // Track the event
        await db.trackPageEvent({
          pageId: page.id,
          sessionId,
          eventType: input.eventType,
          eventData: input.eventData,
          referrer: Array.isArray(referer) ? referer[0] : referer,
          userAgent,
          ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        });

        return { success: true };
      }),
    
    getLandingPage: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const page = await db.getLandingPageBySlug(input.slug);
        if (!page || page.status !== "published") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Page not found" });
        }
        return page;
      }),
  }),
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Campaign Management
  campaigns: router({
    list: protectedProcedure.query(async () => {
      const campaigns = await db.getAllCampaigns();
      // Calculate goal-based performance for each campaign
      return campaigns.map(campaign => {
        if (campaign.goalType) {
          const { kpiActual, performanceScore } = calculateCampaignPerformance(campaign);
          return {
            ...campaign,
            kpiActual,
            performanceScore
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
    
    // Get available goal templates
    getGoalTemplates: protectedProcedure.query(() => {
      return Object.entries(GOAL_TEMPLATES).map(([key, template]) => ({
        goalType: key,
        goalUnit: template.goalUnit,
        primaryKpi: template.primaryKpi,
        kpiUnit: template.kpiUnit,
        description: template.description
      }));
    }),
    
    // Calculate performance for a campaign
    calculatePerformance: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const campaign = await db.getCampaignById(input.campaignId);
        if (!campaign) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
        }
        return calculateCampaignPerformance(campaign);
      }),
    
    // Get Sunday Clinic metrics from Acuity
    getSundayClinicMetrics: protectedProcedure
      .input(z.object({
        minDate: z.string().optional(),
        maxDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { getSundayClinicGoalMetrics } = await import("./acuity");
        
        // Get only ACTIVE PAYING member emails for retention tracking
        // Active paying = All Access Aces + Swing Savers + Golf VX Pro + Family (not 'none' or 'trial')
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
    

    
    // Get PBGA Winter Clinic metrics from Acuity
    getWinterClinicMetrics: protectedProcedure
      .input(z.object({
        minDate: z.string().optional(),
        maxDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { getWinterClinicData } = await import("./acuity");
        
        const metrics = await getWinterClinicData({
          minDate: input.minDate,
          maxDate: input.maxDate,
        });
        
        return metrics;
      }),

    getJuniorCampMetrics: protectedProcedure
      .input(z.object({
        minDate: z.string().optional(),
        maxDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { getJuniorCampData } = await import("./acuity");
        return await getJuniorCampData({
          minDate: input.minDate,
          maxDate: input.maxDate,
        });
      }),

    // Get Sunday Clinic attendee list (members vs new visitors)
    getSundayClinicAttendeeList: protectedProcedure
      .input(z.object({
        minDate: z.string().optional(),
        maxDate: z.string().optional(),
        type: z.enum(["members", "new_visitors"]),
      }))
      .query(async ({ input }) => {
        const { getSundayClinicData } = await import("./acuity");
        const members = await db.getAllMembers();
        const memberEmailSet = new Set(members.map(m => m.email.toLowerCase()));

        const data = await getSundayClinicData({
          minDate: input.minDate,
          maxDate: input.maxDate,
        });

        // Flatten all appointments
        const allAppts = data.events.flatMap(e => e.appointments);

        // Deduplicate by email
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

    // Get Sunday Clinic attendees filtered by acquisition source
    getSundayClinicAttendeesBySource: protectedProcedure
      .input(z.object({
        minDate: z.string().optional(),
        maxDate: z.string().optional(),
        source: z.string(),
      }))
      .query(async ({ input }) => {
        const { getSundayClinicData, extractAcquisitionSource } = await import("./acuity");
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
    // Get Sunday Clinic attendees for a specific event date
    getSundayClinicAttendeesByEvent: protectedProcedure
      .input(z.object({
        minDate: z.string().optional(),
        maxDate: z.string().optional(),
        eventDate: z.string(),
      }))
      .query(async ({ input }) => {
        const { getSundayClinicData, extractAcquisitionSource } = await import("./acuity");
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
    // Get Winter Clinic attendee list per clinic type
    getWinterClinicAttendeeList: protectedProcedure
      .input(z.object({
        minDate: z.string().optional(),
        maxDate: z.string().optional(),
        clinicShortName: z.string().optional(), // filter by clinic type, or all if omitted
      }))
      .query(async ({ input }) => {
        // Collect appointments from matching clinics
        const { getAppointments } = await import("./acuity");
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
            // Match by short name (first word of type)
            return apt.type.toLowerCase().includes(input.clinicShortName.toLowerCase());
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

    // Generate LLM email draft for an autonomous action
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
        const { invokeLLM } = await import("./_core/llm");

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

    // Drive Day → Trial → Member conversion funnel
    getDriveDayFunnel: protectedProcedure
      .input(z.object({
        minDate: z.string().optional(),
        maxDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const database = await (await import("./db")).getDb();
        if (!database) return { steps: [], conversionRate: 0, totalAttendees: 0, convertedMembers: 0 };
        // Step 1: Get Drive Day attendees from Acuity
        let driveDayAttendees: string[] = [];
        let totalDriveDayBookings = 0;
        try {
          const { getSundayClinicData } = await import("./acuity");
          const now = new Date();
          const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          const data = await getSundayClinicData({
            minDate: input.minDate || sixMonthsAgo.toISOString().split('T')[0],
            maxDate: input.maxDate || now.toISOString().split('T')[0],
          });
          totalDriveDayBookings = data.totalBookings || 0;
          // Collect all unique non-member emails
          const allEmails = new Set<string>();
          data.events.forEach((event: any) => {
            event.appointments.forEach((apt: any) => {
              if (apt.email) allEmails.add(apt.email.toLowerCase());
            });
          });
          driveDayAttendees = Array.from(allEmails);
        } catch { driveDayAttendees = []; }

        // Step 2: Check which Drive Day attendees became members
        let convertedCount = 0;
        let recentConvertedCount = 0;
        if (driveDayAttendees.length > 0) {
          const { members } = await import("../drizzle/schema");
          const { inArray: inArrayOp, and, eq: eqOp } = await import("drizzle-orm");
          // Check in batches of 100
          const BATCH = 100;
          for (let i = 0; i < driveDayAttendees.length; i += BATCH) {
            const batch = driveDayAttendees.slice(i, i + BATCH);
            const converted = await database
              .select({ email: members.email })
              .from(members)
              .where(inArrayOp(members.email, batch));
            convertedCount += converted.length;
          }
          // Recent conversions (last 30 days)
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          for (let i = 0; i < driveDayAttendees.length; i += BATCH) {
            const batch = driveDayAttendees.slice(i, i + BATCH);
            // Use Drizzle ORM to count recently converted members from this batch
            const recentConvertedRows = await database
              .select({ cnt: sql<number>`COUNT(*)` })
              .from(members)
              .where(
                and(
                  inArray(members.email, batch),
                  gte(members.joinDate, thirtyDaysAgo)
                )
              );
            recentConvertedCount += Number(recentConvertedRows[0]?.cnt || 0);
          }
        }

        const totalUniqueAttendees = driveDayAttendees.length;
        const conversionRate = totalUniqueAttendees > 0 ? (convertedCount / totalUniqueAttendees) * 100 : 0;
        const targetConversionRate = 20; // 20% target

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
    
    getCategorySummary: protectedProcedure
      .query(async () => {
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

    // AI-driven per-program marketing insights
    generateInsights: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .mutation(async ({ input }) => {
        const campaign = await db.getCampaignById(input.campaignId);
        if (!campaign) throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' });
        const { invokeLLM } = await import('./_core/llm');

        const progressPct = campaign.goalTarget && parseFloat(campaign.goalTarget) > 0
          ? Math.min((parseFloat(campaign.goalActual || '0') / parseFloat(campaign.goalTarget)) * 100, 100).toFixed(1)
          : '0.0';
        const daysRunning = campaign.startDate
          ? Math.max(1, Math.floor((Date.now() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24)))
          : 1;
        const budget = parseFloat(campaign.budget || '0');
        const spent = parseFloat(campaign.actualSpend || '0');
        const budgetUtilization = budget > 0 ? ((spent / budget) * 100).toFixed(1) : '0.0';

        const prompt = `You are a senior marketing strategist for Golf VX Arlington Heights, an indoor golf simulator facility in the Chicago suburbs (644 E Rand Rd, Arlington Heights, IL — 25 miles northwest of downtown Chicago).

PROGRAM: Annual Membership Giveaway 2026
Goal: ${entryGoal} entries, ${longFormGoal} long-form applicants
Current entries: ${total} (${progressPct}% of entry goal)
Funnel: Entry page 875 UV → Application page 187 UV → 67 form completions (47% completion rate from app page)

DEMOGRAPHIC DATA:
- Age distribution: ${ageBreakdown}
- Gender: ${genderBreakdown}
- City distribution (top 8): ${topCities}
- Chicago city applicants: ${chicagoCount} (${chicagoPct}% of total — NOTABLY LOW given Chicago's large young golfer population)
- Golf experience: ${experienceBreakdown}
- Visited Golf VX before: ${visitedBreakdown}
- How they heard: ${hearBreakdown}
- Indoor golf familiarity: ${familiarityBreakdown}

KEY STRATEGIC CONTEXT:
- Chicago city has very few applicants despite being 25 miles away with a large population of young urban golfers aged 25-40
- Indoor golf simulators are extremely popular with young Chicago city professionals who want year-round golf
- There is a significant untapped opportunity to target young Chicago city golfers (ages 25-40) who may not know about Golf VX Arlington Heights
- The commute from Chicago to Arlington Heights is feasible via I-90/I-94 or Metra UP-NW line (40-50 min)

Provide a comprehensive marketing intelligence report with:
1. Key demographic insights — SPECIFICALLY address the Chicago city gap and how to target young urban golfers (25-40)
2. Current Meta Ads optimization recommendations — include geo-targeting Chicago city neighborhoods (Lincoln Park, Wicker Park, River North, West Loop, Logan Square) with young golfer demographics
3. Multi-channel marketing strategy (email, SMS, in-venue, social media, partnerships with Chicago golf clubs/courses)
4. Content strategy — include messaging that speaks to Chicago city golfers (commute-friendly, year-round indoor golf, escape the city)
5. Conversion optimization suggestions for the funnel
6. Specific next 7-day action plan with Chicago city targeting as a priority

Respond in JSON with this structure:
{
  "executiveSummary": "2-3 sentence overview",
  "keyInsights": [
    { "insight": "string", "implication": "string", "priority": "high|medium|low" }
  ],
  "chicagoOpportunity": {
    "summary": "Why Chicago city is an untapped market for Golf VX",
    "targetNeighborhoods": ["string"],
    "targetDemographic": "string",
    "adStrategy": "string",
    "messagingAngle": "string"
  },
  "metaAdsStrategy": {
    "audienceRecommendations": ["string"],
    "creativeRecommendations": ["string"],
    "budgetRecommendations": ["string"],
    "campaignOptimizations": ["string"]
  },
  "multiChannelStrategy": [
    { "channel": "string", "strategy": "string", "tactics": ["string"], "expectedImpact": "string", "priority": "high|medium|low" }
  ],
  "contentStrategy": {
    "themes": ["string"],
    "formats": ["string"],
    "messaging": "string"
  },
  "funnelOptimization": ["string"],
  "sevenDayPlan": [
    { "day": "string", "actions": ["string"] }
  ],
  "generatedAt": "${new Date().toISOString()}"
}`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a senior marketing strategist. Always respond with valid JSON only, no markdown code blocks.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        });

        let insights: any = null;
        try {
          const raw = response?.choices?.[0]?.message?.content;
          insights = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
          insights = { executiveSummary: 'Unable to generate insights at this time.', keyInsights: [], metaAdsStrategy: {}, multiChannelStrategy: [], contentStrategy: {}, funnelOptimization: [], sevenDayPlan: [] };
        }

        return { insights, stats: { total, entryGoal, longFormGoal, progressPct: parseFloat(progressPct) } };
      }),

    // Daily Dashboard: AI-driven daily action plan based on application count vs goal
    getDailyDashboard: protectedProcedure.query(async () => {
      const stats = await giveawaySync.getGiveawayStats();
      const GOAL = 500;
      const current = stats.totalApplications || 0;
      const remaining = Math.max(0, GOAL - current);
      const progressPct = Math.min((current / GOAL) * 100, 100);
      const startDate = new Date('2026-01-01');
      const today = new Date();
      const daysSinceStart = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyAvg = current / daysSinceStart;
      const endDate = new Date('2026-12-31');
      const daysRemaining = Math.max(1, Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      const requiredDailyRate = remaining / daysRemaining;
      let statusLevel: 'critical' | 'behind' | 'on_track' | 'ahead';
      if (progressPct < 20) statusLevel = 'critical';
      else if (dailyAvg < requiredDailyRate * 0.7) statusLevel = 'behind';
      else if (dailyAvg >= requiredDailyRate * 1.1) statusLevel = 'ahead';
      else statusLevel = 'on_track';
      const { invokeLLM } = await import('./_core/llm');
      const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const llmPrompt = `You are the marketing strategist for Golf VX Arlington Heights, an indoor golf simulator facility.

GIVEAWAY DAILY DASHBOARD — ${todayStr}
Goal: 500 lead capture applications by Dec 31, 2026
Current applications: ${current}
Remaining: ${remaining}
Progress: ${progressPct.toFixed(1)}%
Days since launch: ${daysSinceStart}
Daily average: ${dailyAvg.toFixed(1)} apps/day
Required daily rate to hit goal: ${requiredDailyRate.toFixed(1)} apps/day
Days remaining: ${daysRemaining}
Status: ${statusLevel.replace('_', ' ').toUpperCase()}

Provide a specific, actionable daily action plan for TODAY. Be direct and practical.
Respond in JSON with this exact structure:
{
  "todayFocus": "One sentence describing today primary focus",
  "urgencyMessage": "One sentence about the current pace and what it means",
  "actions": [
    { "priority": 1, "category": "Instagram", "action": "specific action", "expectedImpact": "X new applications", "timeRequired": "15 min" },
    { "priority": 2, "category": "Email", "action": "specific action", "expectedImpact": "X new applications", "timeRequired": "30 min" },
    { "priority": 3, "category": "In-Person", "action": "specific action", "expectedImpact": "X new applications", "timeRequired": "20 min" },
    { "priority": 4, "category": "Drive Day", "action": "specific action", "expectedImpact": "X new applications", "timeRequired": "10 min" },
    { "priority": 5, "category": "Follow-Up", "action": "specific action", "expectedImpact": "X new applications", "timeRequired": "20 min" }
  ],
  "weeklyMilestone": "What you should achieve by end of this week",
  "quickWin": "One thing you can do in the next 5 minutes right now"
}`;
      const llmResponse = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a marketing strategist. Always respond with valid JSON only, no markdown.' },
          { role: 'user', content: llmPrompt },
        ],
        response_format: { type: 'json_object' },
      });
      let actionPlan: any = null;
      try {
        const rawContent = llmResponse?.choices?.[0]?.message?.content;
        actionPlan = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
      } catch (e) {
        actionPlan = { todayFocus: 'Focus on growing giveaway applications today.', urgencyMessage: 'Keep pushing to reach the 500 goal.', actions: [], weeklyMilestone: 'Increase daily application rate.', quickWin: 'Post a story on Instagram about the giveaway.' };
      }
      return { current, goal: GOAL, remaining, progressPct, daysSinceStart, dailyAvg, requiredDailyRate, daysRemaining, statusLevel, actionPlan, lastUpdated: new Date().toISOString() };
    }),

    // Bottom-funnel conversions: giveaway applicants who booked $9 Trial or Drive Day
    getConversions: protectedProcedure.query(async () => {
      const database = await db.getDb();
      if (!database) return { total: 0, trialCount: 0, driveDayCount: 0, conversions: [] };

      const { giveawayApplications, memberAppointments, members } = await import('../drizzle/schema');
      const { eq: eqOp, and: andOp, isNotNull, like, or: orOp } = await import('drizzle-orm');

      // Get all non-test giveaway applicant emails
      const applicants = await database
        .select({ email: giveawayApplications.email, name: giveawayApplications.name })
        .from(giveawayApplications)
        .where(andOp(eqOp(giveawayApplications.isTestEntry, false), isNotNull(giveawayApplications.email)));
      const applicantEmailMap = new Map(applicants.map(a => [a.email!.toLowerCase().trim(), a.name]));

      // Get Trial and Drive Day appointments with member emails
      const appts = await database
        .select({
          email: members.email,
          memberName: members.name,
          appointmentType: memberAppointments.appointmentType,
          appointmentDate: memberAppointments.appointmentDate,
        })
        .from(memberAppointments)
        .innerJoin(members, eqOp(members.id, memberAppointments.memberId))
        .where(
          andOp(
            eqOp(memberAppointments.canceled, false),
            orOp(
              like(memberAppointments.appointmentType, '%Trial%'),
              like(memberAppointments.appointmentType, '%Drive Day%'),
            ),
          )
        );

      // Match by email, deduplicate per person per conversion type
      const seen = new Set<string>();
      const conversions: Array<{ email: string; applicantName: string; appointmentType: string; appointmentDate: Date | null; conversionType: 'trial' | 'drive_day' }> = [];
      let trialCount = 0;
      let driveDayCount = 0;

      for (const appt of appts) {
        const emailKey = appt.email?.toLowerCase().trim() ?? '';
        if (!emailKey || !applicantEmailMap.has(emailKey)) continue;
        const isDriveDay = appt.appointmentType.toLowerCase().includes('drive day');
        const conversionType = isDriveDay ? 'drive_day' as const : 'trial' as const;
        const dedupeKey = `${emailKey}:${conversionType}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        if (isDriveDay) driveDayCount++; else trialCount++;
        conversions.push({
          email: emailKey,
          applicantName: applicantEmailMap.get(emailKey) || appt.memberName || '',
          appointmentType: appt.appointmentType,
          appointmentDate: appt.appointmentDate,
          conversionType,
        });
      }

      return { total: conversions.length, trialCount, driveDayCount, conversions };
    }),
  }),
  // Reports
  reports: router({
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
        // Generate report data based on type
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
          // Add more report types as needed
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
  }),

  // AI Marketing Intelligence
  intelligence: router({
    // Get all active alerts
    getAlerts: protectedProcedure
      .query(async ({ ctx }) => {
        const database = await db.getDb();
        if (!database) {
          return [];
        }
        
        // Get all recommendations that haven't been dismissed
        const recommendations = await database.select().from(aiRecommendations)
          .where(eq(aiRecommendations.status, "pending"))
          .orderBy(desc(aiRecommendations.priority), desc(aiRecommendations.createdAt));
        
        return recommendations;
      }),

    // Mark action item as complete
    markActionComplete: protectedProcedure
      .input(z.object({
        recommendationId: z.number(),
        actionId: z.string(),
        completed: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        // Get the recommendation
        const recommendation = await database.select().from(aiRecommendations)
          .where(eq(aiRecommendations.id, input.recommendationId))
          .limit(1);
        
        if (recommendation.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Recommendation not found" });
        }

        // Update action items (stored in data JSON field)
        const data = JSON.parse(recommendation[0].data as string);
        const actionItems = data.actionItems || [];
        const updatedItems = actionItems.map((item: any) => 
          item.id === input.actionId ? { ...item, completed: input.completed } : item
        );

        await database.update(aiRecommendations)
          .set({ data: JSON.stringify({ ...data, actionItems: updatedItems }) })
          .where(eq(aiRecommendations.id, input.recommendationId));

        // Log user action
        await database.insert(userActions).values({
          userId: ctx.user.id,
          recommendationId: input.recommendationId,
          action: input.completed ? "executed" : "modified",
          modificationDetails: JSON.stringify({ actionId: input.actionId, completed: input.completed }),
        });

        return { success: true };
      }),

    // Dismiss alert
    dismissAlert: protectedProcedure
      .input(z.object({ recommendationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        await database.update(aiRecommendations)
          .set({ status: "rejected" })
          .where(eq(aiRecommendations.id, input.recommendationId));

        // Log dismissal
        await database.insert(userActions).values({
          userId: ctx.user.id,
          recommendationId: input.recommendationId,
          action: "ignored",
          modificationDetails: "User dismissed the alert",
        });

        return { success: true };
      }),

    // Get daily briefing with AI-powered recommendations (deprecated - use getAlerts)
    getDailyBriefing: protectedProcedure
      .query(async () => {
        // TODO: Implement actual data fetching and AI analysis
        // For now, return empty structure
        return {
          topPriority: null,
          performanceAlerts: [],
          campaignIdeas: [],
          seasonalOpportunities: [],
          competitiveIntel: [],
        };
      }),

    // Get specific recommendation details
    getRecommendation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        // TODO: Fetch from aiRecommendations table
        throw new TRPCError({ code: "NOT_FOUND", message: "Recommendation not found" });
      }),

    // Execute recommendation (one-click action)
    executeRecommendation: protectedProcedure
      .input(z.object({ 
        id: z.number(),
        modifications: z.any().optional() 
      }))
      .mutation(async ({ input, ctx }) => {
        // TODO: Implement execution logic based on recommendation type
        throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Execution not yet implemented" });
      }),

    // Provide feedback on recommendation
    provideFeedback: protectedProcedure
      .input(z.object({
        id: z.number(),
        action: z.enum(["approved", "rejected", "modified", "ignored"]),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // TODO: Log user action for AI learning
        return { success: true };
      }),

    // Get real-time KPI data for Strategic Campaigns
    getStrategicKPIs: protectedProcedure
      .query(async () => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        // 1. Membership KPIs: Customer members = All Access Aces + Swing Savers ONLY
        //    Pro members (golf_vx_pro) are tracked separately, NOT counted toward the 300 goal
        const memberCountResult = await database.execute(
          `SELECT 
            COUNT(CASE WHEN membershipTier IN ('all_access_aces', 'swing_savers', 'golf_vx_pro', 'family', 'monthly', 'annual', 'corporate') THEN 1 END) as customerMembers,
            COUNT(CASE WHEN membershipTier = 'golf_vx_pro' THEN 1 END) as proMembers,
            COUNT(CASE WHEN membershipTier = 'all_access_aces' THEN 1 END) as allAccessCount,
            COUNT(CASE WHEN membershipTier = 'swing_savers' THEN 1 END) as swingSaverCount,
            SUM(CASE WHEN membershipTier = 'all_access_aces' THEN COALESCE(monthlyAmount, 0) ELSE 0 END) as allAccessMRR,
            SUM(CASE WHEN membershipTier = 'swing_savers' THEN COALESCE(monthlyAmount, 0) ELSE 0 END) as swingSaverMRR,
            SUM(CASE WHEN membershipTier = 'golf_vx_pro' THEN COALESCE(monthlyAmount, 0) ELSE 0 END) as proMRR,
            COUNT(CASE WHEN membershipTier IN ('all_access_aces', 'swing_savers', 'golf_vx_pro', 'family', 'monthly', 'annual', 'corporate') AND paymentInterval = 'annual' THEN 1 END) as annualCount,
            COUNT(CASE WHEN membershipTier IN ('all_access_aces', 'swing_savers', 'golf_vx_pro', 'family', 'monthly', 'annual', 'corporate') AND paymentInterval = 'monthly' THEN 1 END) as monthlyCount
          FROM members WHERE status = 'active'`
        );
        const customerMemberCount = Number((memberCountResult as any)[0]?.customerMembers || 0);
        const proMemberCount = Number((memberCountResult as any)[0]?.proMembers || 0);
        const allAccessCount = Number((memberCountResult as any)[0]?.allAccessCount || 0);
        const swingSaverCount = Number((memberCountResult as any)[0]?.swingSaverCount || 0);
        const allAccessMRR = parseFloat((memberCountResult as any)[0]?.allAccessMRR || '0');
        const swingSaverMRR = parseFloat((memberCountResult as any)[0]?.swingSaverMRR || '0');
        const proMRR = parseFloat((memberCountResult as any)[0]?.proMRR || '0');
        const totalMRR = allAccessMRR + swingSaverMRR + proMRR;
        const annualMemberCount = Number((memberCountResult as any)[0]?.annualCount || 0);
        const monthlyMemberCount = Number((memberCountResult as any)[0]?.monthlyCount || 0);
        // New members this month vs last month (All Access + Swing Saver only)
        const newMembersResult = await database.execute(`
          SELECT
            COUNT(CASE WHEN membershipTier IN ('all_access_aces', 'swing_savers')
              AND joinDate >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as thisMonth,
            COUNT(CASE WHEN membershipTier IN ('all_access_aces', 'swing_savers')
              AND joinDate >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
              AND joinDate < DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as lastMonth
          FROM members WHERE status = 'active'
        `);
        const newMembersThisMonth = Number((newMembersResult as any)[0]?.thisMonth || 0);
        const newMembersLastMonth = Number((newMembersResult as any)[0]?.lastMonth || 0);
        // Acquisition goal: 300 total customer members over 2 years
        // Retention goal: retain all current customer members (target = 300)
        const MEMBERSHIP_GOAL = 300;
        const memberCount = customerMemberCount; // alias for downstream use

        // 2. Trial Conversion: Calculate conversion rate from Acuity appointments
        // Count total trial appointments and converted members in last 90 days
        // Use fallback value since appointments table doesn't exist yet
        const trials = 10; // Default fallback - will be accurate once appointments table is created
        
        // Get conversions from members table
        const conversionsResult = await database.execute(`
          SELECT COUNT(DISTINCT email) as conversions
          FROM members
          WHERE status = 'active' AND createdAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        `);
        const conversions = Number((conversionsResult as any)[0]?.conversions || 0);
        const conversionRate = (conversions / trials) * 100;

        // 3. Member Retention: Calculate retention rate (active members / total members)
        const retentionResult = await database.execute(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active
          FROM members
        `);
        const totalMembers = Number((retentionResult as any)[0]?.total || 1);
        const activeMembers = Number((retentionResult as any)[0]?.active || 0);
        const retentionRate = (activeMembers / totalMembers) * 100;

         // 4. B2B Corporate Events: Fetch real data from Acuity for current month
        let eventsThisMonth = 0;
        try {
          const { getAppointments } = await import('./acuity');
          const now = new Date();
          const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const minDate = firstOfMonth.toISOString().split('T')[0];
          const maxDate = now.toISOString().split('T')[0];
          const allAppts = await getAppointments({ minDate, maxDate, canceled: false });
          // Filter for B2B/corporate event appointment types
          const b2bKeywords = ['corporate', 'outing', 'group event', 'party', 'league', 'b2b', 'private event', 'team', 'company'];
          const b2bAppts = allAppts.filter((apt: any) => {
            const typeName = (apt.type || '').toLowerCase();
            return b2bKeywords.some((kw: string) => typeName.includes(kw));
          });
          // Count unique event dates (each unique date = 1 event)
          const uniqueEventDates = new Set(b2bAppts.map((apt: any) => apt.date));
          eventsThisMonth = uniqueEventDates.size;
        } catch {
          eventsThisMonth = 0;
        }
        // Retention rate: only among customer members (All Access + Swing Saver)
        const customerRetentionResult = await database.execute(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'active' AND membershipTier IN ('all_access_aces', 'swing_savers') THEN 1 END) as activeCustomers
          FROM members
          WHERE membershipTier IN ('all_access_aces', 'swing_savers')
        `);
        const totalCustomers = Number((customerRetentionResult as any)[0]?.total || 1);
        const activeCustomers = Number((customerRetentionResult as any)[0]?.activeCustomers || 0);
        const customerRetentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;

        return {
          membershipAcquisition: {
            current: customerMemberCount,
            target: MEMBERSHIP_GOAL,
            // Remaining = how many more needed to reach 300 (dynamic based on current count)
            remaining: Math.max(0, MEMBERSHIP_GOAL - customerMemberCount),
            acquisitionGoal: Math.max(0, MEMBERSHIP_GOAL - customerMemberCount),
            progress: Math.min((customerMemberCount / MEMBERSHIP_GOAL) * 100, 100),
            breakdown: { allAccess: allAccessCount, swingSaver: swingSaverCount },
            newThisMonth: newMembersThisMonth,
            newLastMonth: newMembersLastMonth,
            // MRR data from Boomerang
            mrr: { allAccess: allAccessMRR, swingSaver: swingSaverMRR, total: allAccessMRR + swingSaverMRR },
            paymentBreakdown: { monthly: monthlyMemberCount, annual: annualMemberCount },
          },
          memberRetention: {
            // Goal: retain all 300 customer members
            current: customerMemberCount,
            target: MEMBERSHIP_GOAL,
            retentionRate: customerRetentionRate,
            progress: Math.min((customerMemberCount / MEMBERSHIP_GOAL) * 100, 100),
            breakdown: { allAccess: allAccessCount, swingSaver: swingSaverCount },
          },
          proMembers: {
            // Pro members tracked separately — NOT part of the 300 goal
            current: proMemberCount,
            label: "Golf VX Pro (Coaches)",
            mrr: proMRR,
          },
          totalMRR: totalMRR,
          trialConversion: {
            current: conversionRate,
            target: 20,
            progress: (conversionRate / 20) * 100,
          },
          corporateEvents: {
            current: eventsThisMonth,
            target: 1, // Goal: 1 B2B event per month
            progress: Math.min((eventsThisMonth / 1) * 100, 100),
          },
        };
      }),

    // Generate comprehensive intelligence report
    generateReport: protectedProcedure
      .mutation(async () => {
        const marketingIntelligence = await import("./marketingIntelligence");
        
        // Get multi-channel performance data
        const performanceData = await marketingIntelligence.getMultiChannelPerformance(30);
        
        // Generate AI-powered analysis
        const analysis = await marketingIntelligence.analyzePerformanceWithGemini(performanceData);
        
        return {
          performanceData,
          analysis,
          generatedAt: new Date().toISOString(),
        };
      }),

    // Generate new campaign ideas on demand
    generateCampaignIdeas: protectedProcedure
      .input(z.object({
        focus: z.enum(["audience", "channel", "seasonal", "competitive"]).optional(),
        constraints: z.object({
          maxBudget: z.number().optional(),
          timeline: z.string().optional(),
          channels: z.array(z.string()).optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const marketingIntelligence = await import("./marketingIntelligence");
        const performanceData = await marketingIntelligence.getMultiChannelPerformance(30);
        const ideas = await marketingIntelligence.generateCampaignIdeas(
          performanceData,
          input.focus,
          input.constraints
        );
        return ideas;
      }),

    // Manually trigger daily snapshot (for testing)
    triggerDailySnapshot: protectedProcedure
      .mutation(async () => {
        const { runDailySnapshot } = await import("./jobs/dailySnapshot");
        const result = await runDailySnapshot();
        return result;
      }),

    // Get historical metrics for a campaign
    getCampaignHistory: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        days: z.number().default(30),
      }))
      .query(async ({ input }) => {
        const database = await db.getDb();
        if (!database) {
          return [];
        }
        
        const { campaignMetrics } = await import("../drizzle/schema");
        const { eq, gte, desc } = await import("drizzle-orm");
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);
        
        const metrics = await database.select().from(campaignMetrics)
          .where(eq(campaignMetrics.campaignId, input.campaignId))
          .orderBy(desc(campaignMetrics.snapshotDate));
        
        return metrics;
      }),
    // Generate AI Action Plan based on real data
    generateActionPlan: protectedProcedure
      .input(z.object({
        timeframe: z.enum(["week", "month"]).default("week"),
        focus: z.enum(["all", "membership", "meta_ads", "programs", "retention"]).default("all"),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const database = await db.getDb();
        let contextData = "";
        try {
          if (database) {
            const memberResult = await database.execute(
              `SELECT COUNT(*) as total,
               SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN membershipTier IN ('all_access_aces','swing_savers') AND status='active' THEN 1 ELSE 0 END) as customerMembers,
               SUM(CASE WHEN membershipTier = 'golf_vx_pro' AND status='active' THEN 1 ELSE 0 END) as proMembers,
               SUM(CASE WHEN status='active' THEN COALESCE(monthlyAmount,0) ELSE 0 END) as totalMRR
               FROM members`
            );
            const newMembersResult = await database.execute(
              `SELECT COUNT(*) as newThisMonth FROM members
               WHERE membershipTier IN ('all_access_aces','swing_savers')
               AND joinDate >= DATE_FORMAT(NOW(), '%Y-%m-01')`
            );
            const campaignResult = await database.execute(
              `SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
               SUM(budget) as totalBudget, SUM(actualSpend) as totalSpend, SUM(actualRevenue) as totalRevenue
               FROM campaigns`
            );
            const m = (memberResult as any)[0];
            const nm = (newMembersResult as any)[0];
            const c = (campaignResult as any)[0];
            const customerMembers = Number(m?.customerMembers || 0);
            const proMembers = Number(m?.proMembers || 0);
            const totalMRR = parseFloat(m?.totalMRR || '0');
            const newThisMonth = Number(nm?.newThisMonth || 0);
            const membershipGoal = 300;
            const remaining = membershipGoal - customerMembers;
            contextData = `
GOLF VX ARLINGTON HEIGHTS — LIVE DATA SNAPSHOT:
- Customer Members (All Access Aces + Swing Savers): ${customerMembers} / ${membershipGoal} goal (${remaining} remaining)
- Pro Members (Golf VX Pro): ${proMembers}
- New Members This Month: ${newThisMonth}
- Total MRR: $${totalMRR.toFixed(0)}
- Active Programs: ${c?.active || 0} of ${c?.total || 0} total
- Total Marketing Budget: $${Number(c?.totalBudget || 0).toFixed(0)}
- Total Spend: $${Number(c?.totalSpend || 0).toFixed(0)}
- Total Revenue: $${Number(c?.totalRevenue || 0).toFixed(0)}
- Location: Arlington Heights, IL — Population 77,676, Median Income $95,400
- Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;
          }
        } catch (_) {}
        const focusLabel = input.focus === "all" ? "all areas" : input.focus.replace(/_/g, " ");
        const systemPrompt = `You are a senior marketing strategist for Golf VX Arlington Heights, an indoor golf facility. Generate a structured, actionable ${input.timeframe}ly action plan focused on ${focusLabel}.
${contextData}
Return ONLY a JSON object (no markdown, no code blocks) with this exact structure:
{"summary":"2-3 sentence executive summary","priority":"high","generatedAt":"${new Date().toISOString()}","timeframe":"${input.timeframe}","focus":"${input.focus}","topPriorities":[{"rank":1,"title":"Action title","category":"membership","description":"What to do and why","expectedImpact":"Specific measurable outcome","effort":"medium","deadline":"This week","steps":["Step 1","Step 2","Step 3"]}],"quickWins":[{"title":"Quick win","action":"Specific action","time":"30 min"}],"kpiTargets":[{"metric":"Metric","current":"value","target":"target","by":"timeframe"}],"risks":["Risk 1"],"insight":"One key strategic insight"}
Generate 3-5 top priorities and 3-4 quick wins. Be specific to Golf VX Arlington Heights. Focus on the 300 member goal.`;
        const response = await invokeLLM({
          messages: [
            { role: "system" as const, content: systemPrompt },
            { role: "user" as const, content: `Generate a ${input.timeframe}ly action plan for Golf VX Arlington Heights, focusing on ${focusLabel}.` },
          ],
          response_format: { type: "json_object" },
        });
        const rawContent = String(response.choices?.[0]?.message?.content || "{}");
        try {
          return JSON.parse(rawContent);
        } catch {
          return { summary: "Unable to generate plan. Please try again.", topPriorities: [], quickWins: [], kpiTargets: [], risks: [], insight: "" };
        }
      }),
  }),

  // Media Library Management (Deferred)
  /* media: router({
    upload: protectedProcedure
      .input(z.object({
        filename: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        fileData: z.string(), // Base64 encoded file data
        categoryId: z.number().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        altText: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Decode base64 file data
        const fileBuffer = Buffer.from(input.fileData, "base64");

        // const mediaFile = await mediaLibrary.uploadMediaFile({
        //   file: fileBuffer,
        //   filename: input.filename,
        //   mimeType: input.mimeType,
        //   fileSize: input.fileSize,
        //   userId: ctx.user.id,
        //   categoryId: input.categoryId,
        //   title: input.title,
        //   description: input.description,
        //   altText: input.altText,
        // });

        return mediaFile;
      }),

    // Get all media files with filters
    list: protectedProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        tagIds: z.array(z.number()).optional(),
        search: z.string().optional(),
        status: z.enum(["active", "archived", "deleted"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        // return await mediaLibrary.getMediaFiles(input);
      }),

    // Get single media file by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        // const file = await mediaLibrary.getMediaFileById(input.id);
        if (!file) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Media file not found" });
        }
        return file;
      }),

    // Update media file metadata
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        updates: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          altText: z.string().optional(),
          caption: z.string().optional(),
          categoryId: z.number().optional(),
          status: z.enum(["active", "archived", "deleted"]).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        // const updated = await mediaLibrary.updateMediaFile(input.id, input.updates);
        return updated;
      }),

    // Delete media file (soft delete)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // const deleted = await mediaLibrary.deleteMediaFile(input.id);
        return deleted;
      }),

    // Category management
    categories: router({
      list: protectedProcedure.query(async () => {
        return await mediaLibrary.getMediaCategories();
      }),

      create: protectedProcedure
        .input(z.object({
          name: z.string(),
          slug: z.string(),
          description: z.string().optional(),
          parentId: z.number().optional(),
          color: z.string().optional(),
          icon: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          return await mediaLibrary.createMediaCategory(input);
        }),
    }),

    // Tag management
    tags: router({
      list: protectedProcedure.query(async () => {
        return await mediaLibrary.getMediaTags();
      }),

      addToFile: protectedProcedure
        .input(z.object({
          mediaFileId: z.number(),
          tagNames: z.array(z.string()),
        }))
        .mutation(async ({ input }) => {
          return await mediaLibrary.addTagsToMediaFile(input.mediaFileId, input.tagNames);
        }),

      getForFile: protectedProcedure
        .input(z.object({ mediaFileId: z.number() }))
        .query(async ({ input }) => {
          return await mediaLibrary.getMediaFileTags(input.mediaFileId);
        }),
    }),

    // Usage tracking
    trackUsage: protectedProcedure
      .input(z.object({
        mediaFileId: z.number(),
        usageType: z.enum(["landing_page", "campaign_poster", "campaign_reel", "blog_post", "email_template", "social_media", "other"]),
        usageId: z.number().optional(),
        usageUrl: z.string().optional(),
        usageContext: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await mediaLibrary.trackMediaUsage(input);
      }),

    getUsage: protectedProcedure
      .input(z.object({ mediaFileId: z.number() }))
      .query(async ({ input }) => {
        // return await mediaLibrary.getMediaFileUsage(input.mediaFileId);
      }),
  }), */

  // Anniversary Giveaway Form Submissions
  anniversaryGiveaway: router({
    // Submit Entry Page form (first name + email)
    submitEntry: publicProcedure
      .input(z.object({
        firstName: z.string().min(1),
        email: z.string().email(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ipAddress = ctx.req.headers["x-forwarded-for"] || ctx.req.socket.remoteAddress;
        const userAgent = ctx.req.headers["user-agent"];

        // Save to database
        const entry = await db.createGiveawayEntry({
          firstName: input.firstName,
          email: input.email,
          ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress?.[0],
          userAgent,
        });

        // Send to Google Sheets
        const { appendToGoogleSheet } = await import("./googleSheets");
        await appendToGoogleSheet("Entry", {
          timestamp: new Date().toISOString(),
          firstName: input.firstName,
          email: input.email,
        });

        return { success: true, entryId: entry.id };
      }),

    // Submit Application Page form (all 18 questions)
    submitApplication: publicProcedure
      .input(z.object({
        email: z.string().email(),
        fullName: z.string().min(1),
        ageRange: z.string().optional(),
        gender: z.string().optional(),
        city: z.string().optional(),
        isIllinoisResident: z.boolean().optional(),
        golfExperience: z.string().optional(),
        hasVisitedBefore: z.string().optional(),
        firstVisitMethod: z.string().optional(),
        firstVisitTime: z.string().optional(),
        visitFrequency: z.string().optional(),
        whatStoodOut: z.string().optional(),
        simulatorFamiliarity: z.string().optional(),
        interests: z.array(z.string()).optional(),
        visitPurpose: z.array(z.string()).optional(),
        passionStory: z.string().optional(),
        communityGrowth: z.string().optional(),
        stayConnected: z.array(z.string()).optional(),
        socialMediaHandle: z.string().optional(),
        communityGroups: z.string().optional(),
        phoneNumber: z.string().optional(),
        bestTimeToCall: z.string().optional(),
        hearAbout: z.array(z.string()).optional(),
        hearAboutOther: z.string().optional(),
        consentToContact: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ipAddress = ctx.req.headers["x-forwarded-for"] || ctx.req.socket.remoteAddress;
        const userAgent = ctx.req.headers["user-agent"];

        // Save to database
        const entry = await db.updateGiveawayEntry({
          ...input,
          interests: input.interests ? JSON.stringify(input.interests) : undefined,
          visitPurpose: input.visitPurpose ? JSON.stringify(input.visitPurpose) : undefined,
          stayConnected: input.stayConnected ? JSON.stringify(input.stayConnected) : undefined,
          hearAbout: input.hearAbout ? JSON.stringify(input.hearAbout) : undefined,
          ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress?.[0],
          userAgent,
        });

        // Send to Google Sheets
        const { appendToGoogleSheet } = await import("./googleSheets");
        await appendToGoogleSheet("Application", {
          timestamp: new Date().toISOString(),
          ...input,
          interests: input.interests?.join(", "),
          visitPurpose: input.visitPurpose?.join(", "),
          stayConnected: input.stayConnected?.join(", "),
          hearAbout: input.hearAbout?.join(", "),
        });

        return { success: true, entryId: entry.id };
      }),
  }),

  // Daily Action Plans for Annual Giveaway
  dailyActions: router({
    // Get today's action plan
    getTodayPlan: protectedProcedure
      .input(z.object({ campaignId: z.string() }))
      .query(async ({ input }) => {
        const { getTodayActionPlan } = await import("./dailyActionPlan");
        return await getTodayActionPlan(input.campaignId);
      }),

    // Generate new daily action plan
    generatePlan: protectedProcedure
      .input(z.object({ campaignId: z.string() }))
      .mutation(async ({ input }) => {
        const { generateDailyActionPlan } = await import("./dailyActionPlan");
        
        // TODO: Fetch real performance data from Meta Ads, Instagram, Email, etc.
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

        const result = await generateDailyActionPlan(input.campaignId, mockPerformanceData);
        return result;
      }),

    // Mark action as completed
    completeAction: protectedProcedure
      .input(z.object({ actionId: z.number(), result: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { completeAction } = await import("./dailyActionPlan");
        await completeAction(input.actionId, input.result);
        return { success: true };
      }),

    // Skip action
    skipAction: protectedProcedure
      .input(z.object({ actionId: z.number(), reason: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { skipAction } = await import("./dailyActionPlan");
        await skipAction(input.actionId, input.reason);
        return { success: true };
      }),
  }),

  // Instagram Business Insights
  instagram: router({
    // Sync Instagram insights manually
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
        const { getDb } = await import("./db");
        const { instagramInsights } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error('Database connection failed');
        
        await db.insert(instagramInsights).values({
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

    // Get Instagram insights history
    getInsights: protectedProcedure
      .input(z.object({
        days: z.number().default(30),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { instagramInsights } = await import("../drizzle/schema");
        const { desc } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error('Database connection failed');
        
        const insights = await db
          .select()
          .from(instagramInsights)
          .orderBy(desc(instagramInsights.date))
          .limit(input.days);
        
        return insights;
      }),

    // Generate AI content recommendations
    generateRecommendations: protectedProcedure
      .mutation(async () => {
        const { generateInstagramRecommendations } = await import("./instagramRecommendations");
        return await generateInstagramRecommendations();
      }),

    // Get Instagram recommendations
    getRecommendations: protectedProcedure
      .input(z.object({
        status: z.enum(['pending', 'implemented', 'skipped']).optional(),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { instagramRecommendations } = await import("../drizzle/schema");
        const { desc, eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error('Database connection failed');
        
        let query = db.select().from(instagramRecommendations);
        
        if (input.status) {
          query = query.where(eq(instagramRecommendations.status, input.status)) as any;
        }
        
        const recommendations = await query.orderBy(desc(instagramRecommendations.generatedAt));
        return recommendations;
      }),

    // Mark recommendation as implemented
    implementRecommendation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { instagramRecommendations } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error('Database connection failed');
        
        await db
          .update(instagramRecommendations)
          .set({ status: 'implemented', implementedAt: new Date() })
          .where(eq(instagramRecommendations.id, input.id));
        
        return { success: true };
      }),
  }),

  // ─── Autonomous Marketing Intelligence Engine ───────────────────────────────
  autonomous: router({
    /** Get sync status for all data sources */
    getSyncStatus: publicProcedure.query(async () => {
      return getSyncStatusAll();
    }),

    /** Get all auto-executed actions (low risk) */
    getAutoExecuted: publicProcedure.query(async () => {
      return getAutoExecutedActions();
    }),

    /** Get all actions pending approval (medium/high risk) */
    getApprovalCards: publicProcedure.query(async () => {
      return getPendingApprovalActions();
    }),

    /** Get all monitoring items (insufficient data) */
    getMonitoring: publicProcedure.query(async () => {
      return getMonitoringActions();
    }),

    /** Get all actions regardless of status (excludes archived) */
    getAllActions: publicProcedure.query(async () => {
      return getAllActions();
    }),
    /** Get archived actions */
    getArchivedActions: publicProcedure.query(async () => {
      return getArchivedActions();
    }),

    /** Trigger a full sync cycle: fetch data → analyze → generate actions */
    syncAllData: protectedProcedure.mutation(async () => {
      return runAutonomousCycle();
    }),

    /** Approve a pending action */
    approveAction: protectedProcedure
      .input(z.object({ actionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const reviewerName = ctx.user.name || ctx.user.email || "Admin";
        return approveAction(input.actionId, reviewerName);
      }),

    /** Reject a pending action */
    rejectAction: protectedProcedure
      .input(z.object({ actionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const reviewerName = ctx.user.name || ctx.user.email || "Admin";
        return rejectAction(input.actionId, reviewerName);
      }),

     /** Undo a previously executed or approved action */
    undoAction: protectedProcedure
      .input(z.object({ actionId: z.number() }))
      .mutation(async ({ input }) => {
        return undoAction(input.actionId);
      }),
    /** Dismiss an action (error/monitoring/resolved) to remove it from the feed */
    dismissAction: protectedProcedure
      .input(z.object({ actionId: z.number() }))
      .mutation(async ({ input }) => {
        return dismissAction(input.actionId);
      }),
    /** Seed demo data for testing */
    seedDemo: protectedProcedure.mutation(async () => {
      return seedDemoData();
    }),

    /** Manually clear stale pending_approval actions (older than 3 days) */
    clearStaleActions: protectedProcedure.mutation(async () => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { autonomousActions } = await import("../drizzle/schema");
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
  }),

  // ---------------------------------------------------------------------------
  // Priorities — DB-backed Today's Priorities task list
  // ---------------------------------------------------------------------------
  priorities: router({
    list: protectedProcedure.query(async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      return drizzleDb
        .select()
        .from(priorities)
        .orderBy(priorities.createdAt);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(500),
        category: z.string().default("General"),
        path: z.string().default("/overview"),
        urgency: z.enum(["URGENT", "TODAY", "THIS WEEK"]).default("TODAY"),
      }))
      .mutation(async ({ input, ctx }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [result] = await drizzleDb.insert(priorities).values({
          title: input.title,
          category: input.category,
          path: input.path,
          urgency: input.urgency,
          createdBy: ctx.user.name || ctx.user.email || "Team",
        });
        const [created] = await drizzleDb.select().from(priorities).where(eq(priorities.id, (result as any).insertId));
        return created;
      }),

    complete: protectedProcedure
      .input(z.object({ id: z.number(), completed: z.boolean() }))
      .mutation(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await drizzleDb
          .update(priorities)
          .set({ completedAt: input.completed ? Date.now() : null })
          .where(eq(priorities.id, input.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await drizzleDb.delete(priorities).where(eq(priorities.id, input.id));
        return { success: true };
      }),
  }),

  // ── MARKET RESEARCH ──
  research: router({
    list: protectedProcedure.query(async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { marketResearchReports } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      return drizzleDb.select().from(marketResearchReports).orderBy(desc(marketResearchReports.createdAt));
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { marketResearchReports } = await import("../drizzle/schema");
        const { eq: eqOp } = await import("drizzle-orm");
        const [report] = await drizzleDb.select().from(marketResearchReports).where(eqOp(marketResearchReports.id, input.id));
        if (!report) throw new TRPCError({ code: "NOT_FOUND" });
        return report;
      }),

    generate: protectedProcedure
      .input(z.object({
        title: z.string(),
        topic: z.string(),
        category: z.enum(["b2b_corporate_events", "local_demographics", "competitor_analysis", "seasonal_trends", "membership_pricing", "custom"]),
        customContext: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { marketResearchReports } = await import("../drizzle/schema");
        // Insert placeholder record with 'generating' status
        const [inserted] = await drizzleDb.insert(marketResearchReports).values({
          title: input.title,
          topic: input.topic,
          category: input.category,
          status: "generating",
          generatedBy: "ai",
        });
        const reportId = (inserted as any).insertId as number;

        // Build category-specific LLM prompt
        const categoryPrompts: Record<string, string> = {
          b2b_corporate_events: `Research the B2B corporate events market in Arlington Heights, IL and surrounding suburbs (Schaumburg, Palatine, Rolling Meadows, Elk Grove Village). Focus on: corporate team-building activities, company outing budgets, decision-maker profiles (HR managers, office managers, event coordinators), typical group sizes (10-50 people), pricing expectations ($30-80/person), and how indoor golf simulators fit into corporate entertainment. Identify top industries in the area (healthcare, tech, finance, manufacturing) and their event frequency.`,
          local_demographics: `Analyze the local demographics of Arlington Heights, IL relevant to Golf VX's target market. Focus on: household income distribution, age groups (25-55 primary), golf participation rates, disposable income for entertainment, commuter patterns, family composition, and proximity to corporate offices. Include data on the broader northwest Chicago suburbs market.`,
          competitor_analysis: `Analyze direct and indirect competitors for Golf VX Arlington Heights (indoor golf simulator facility). Direct competitors: other indoor golf simulators within 20 miles. Indirect: TopGolf, bowling alleys, escape rooms, arcades, and other entertainment venues targeting the same demographic. Assess their pricing, membership models, marketing strategies, and weaknesses Golf VX can exploit.`,
          seasonal_trends: `Analyze seasonal trends for indoor golf simulator facilities in the Chicago/Arlington Heights area. Focus on: peak months (Oct-Mar for indoor golf), slow season strategies (Apr-Sep), holiday corporate event demand (Nov-Dec), summer junior camp opportunities, and how weather patterns affect booking rates. Include recommendations for seasonal promotions and staffing.`,
          membership_pricing: `Research optimal membership pricing strategies for indoor golf simulator facilities in the Chicago suburbs market. Analyze: current Golf VX tiers (All-Access Ace $325/mo, Swing Saver $225/mo, Trial $9/hr), competitor pricing, price elasticity, upsell opportunities, corporate membership packages, and family plan potential. Include recommendations for B2B pricing (group packages, corporate accounts).`,
          custom: `Research the following topic for Golf VX Arlington Heights, an indoor golf simulator facility: ${input.topic}. ${input.customContext || ""} Provide actionable insights relevant to marketing strategy and campaign planning.`,
        };

        const systemPrompt = `You are a market research analyst specializing in the sports entertainment and hospitality industry in the Chicago suburbs. You have deep knowledge of Arlington Heights, IL demographics, corporate culture, and entertainment spending patterns. Provide detailed, data-driven research reports with specific, actionable insights for Golf VX Arlington Heights.`;

        const userPrompt = `${categoryPrompts[input.category] || categoryPrompts.custom}

Return a JSON object with exactly these fields:
- summary: 2-3 sentence executive summary
- keyFindings: array of 5-7 specific, data-backed findings (strings)
- opportunities: array of 4-6 specific opportunities Golf VX can act on (strings)
- risks: array of 3-5 risks or challenges to be aware of (strings)
- recommendedActions: array of 4-6 objects, each with { action: string, priority: "high"|"medium"|"low", campaignType: string }
- sources: array of 3-5 reference types or data sources used (strings, e.g. "US Census Bureau - Arlington Heights Demographics 2023")`;

        try {
          const { invokeLLM } = await import("./_core/llm");
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "market_research_report",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    summary: { type: "string" },
                    keyFindings: { type: "array", items: { type: "string" } },
                    opportunities: { type: "array", items: { type: "string" } },
                    risks: { type: "array", items: { type: "string" } },
                    recommendedActions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          action: { type: "string" },
                          priority: { type: "string", enum: ["high", "medium", "low"] },
                          campaignType: { type: "string" },
                        },
                        required: ["action", "priority", "campaignType"],
                        additionalProperties: false,
                      },
                    },
                    sources: { type: "array", items: { type: "string" } },
                  },
                  required: ["summary", "keyFindings", "opportunities", "risks", "recommendedActions", "sources"],
                  additionalProperties: false,
                },
              },
            },
          });
          const rawContent = response.choices?.[0]?.message?.content;
          const parsed = typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
          const { eq: eqOp } = await import("drizzle-orm");
          await drizzleDb.update(marketResearchReports)
            .set({
              status: "ready",
              summary: parsed.summary,
              keyFindings: parsed.keyFindings,
              opportunities: parsed.opportunities,
              risks: parsed.risks,
              recommendedActions: parsed.recommendedActions,
              sources: parsed.sources,
            })
            .where(eqOp(marketResearchReports.id, reportId));
          return { success: true, reportId };
        } catch (err) {
          const { eq: eqOp } = await import("drizzle-orm");
          await drizzleDb.update(marketResearchReports)
            .set({ status: "archived" })
            .where(eqOp(marketResearchReports.id, reportId));
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "LLM generation failed" });
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { marketResearchReports } = await import("../drizzle/schema");
        const { eq: eqOp } = await import("drizzle-orm");
        await drizzleDb.delete(marketResearchReports).where(eqOp(marketResearchReports.id, input.id));
        return { success: true };
      }),

    getLatestByCategory: protectedProcedure
      .input(z.object({
        category: z.enum(["b2b_corporate_events", "local_demographics", "competitor_analysis", "seasonal_trends", "membership_pricing", "custom"])
      }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return null;
        const { marketResearchReports } = await import("../drizzle/schema");
        const { eq: eqOp, desc: descOp, and: andOp } = await import("drizzle-orm");
        const [report] = await drizzleDb
          .select()
          .from(marketResearchReports)
          .where(andOp(
            eqOp(marketResearchReports.category, input.category),
            eqOp(marketResearchReports.status, "ready")
          ))
          .orderBy(descOp(marketResearchReports.createdAt))
          .limit(1);
        return report ?? null;
      }),
    generateB2BOutreachEmail: protectedProcedure
      .input(z.object({
        researchSummary: z.string().optional(),
        targetIndustry: z.string().optional(),
        groupSize: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const systemPrompt = `You are a B2B sales email copywriter for Golf VX Arlington Heights, an indoor golf simulator facility. Write professional, concise cold outreach emails targeting local businesses for corporate team-building events and company outings. Tone: professional yet approachable, value-focused.`;
        const researchContext = input.researchSummary ? `\n\nMarket Research Context:\n${input.researchSummary}` : "";
        const industryContext = input.targetIndustry ? `\nTarget Industry: ${input.targetIndustry}` : "";
        const groupContext = input.groupSize ? `\nTypical Group Size: ${input.groupSize}` : "";
        const userPrompt = `Write a 3-email B2B cold outreach sequence for Golf VX Arlington Heights targeting local businesses for corporate events and team-building outings.${researchContext}${industryContext}${groupContext}

Golf VX Offering for B2B:
- Private simulator bay rentals for groups (up to 6 per bay)
- Corporate outing packages with food & beverage
- Team-building events with professional instruction
- Flexible scheduling including evenings and weekends
- Located in Arlington Heights, IL (easy access from Schaumburg, Palatine, Rolling Meadows)
- Pricing: ~$50-80/person for 2-hour corporate events

Return a JSON object with:
- emails: array of 3 objects, each with { emailNumber, subject, preheader, body, callToAction, sendDelay }
- subject: overall campaign subject line
- preheader: overall preheader`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "b2b_outreach_email",
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
        const rawContent = response?.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : null;
        if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "LLM returned no content" });
        const draft = JSON.parse(content);
        return { success: true, draft };
      }),
    linkToCampaign: protectedProcedure
      .input(z.object({ reportId: z.number(), campaignId: z.string() }))
      .mutation(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { marketResearchReports } = await import("../drizzle/schema");
        const { eq: eqOp } = await import("drizzle-orm");
        const [report] = await drizzleDb.select().from(marketResearchReports).where(eqOp(marketResearchReports.id, input.reportId));
        if (!report) throw new TRPCError({ code: "NOT_FOUND" });
        const existing = (report.linkedCampaignIds as string[]) || [];
        const updated = existing.includes(input.campaignId) ? existing : [...existing, input.campaignId];
        await drizzleDb.update(marketResearchReports)
          .set({ linkedCampaignIds: updated })
          .where(eqOp(marketResearchReports.id, input.reportId));
        return { success: true };
      }),
  }),
// ─── Public Preview (no auth required) ────────────────────────────────────
  preview: router({
    getDriveDaySessions: publicProcedure.query(async () => {
      const { getSundayClinicData, extractAcquisitionSource } = await import("./acuity");
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
      
      // Flatten all appointments from all events
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

      // Member counts
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

      // Revenue this month
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

      // Budget summary (active campaigns)
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

      // Active campaigns count
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
        campaigns: {
          active: activeCampaigns,
        },
      };
    }),
  }),
// ─── Encharge Email Campaigns ─────────────────────────────────────────────
  emailCampaigns: router({
    // Get all synced broadcasts from DB
    list: protectedProcedure.query(async () => {
      const { getSyncedBroadcasts } = await import("./enchargeBroadcastSync");
      return await getSyncedBroadcasts();
    }),

    // Get performance summary
    summary: protectedProcedure.query(async () => {
      const { getEmailPerformanceSummary } = await import("./enchargeBroadcastSync");
      return await getEmailPerformanceSummary();
    }),

    // Manually trigger a sync now
    syncNow: protectedProcedure.mutation(async () => {
      const { syncEnchargeBroadcasts } = await import("./enchargeBroadcastSync");
      const result = await syncEnchargeBroadcasts();
      return result;
    }),
  }),
  // ─── ClickFunnels Funnels ──────────────────────────────────────────────────
  funnels: router({
    // Get all funnels (active by default)
    list: protectedProcedure
      .input(z.object({ includeArchived: z.boolean().optional().default(false) }).optional())
      .query(async ({ input }) => {
        const { getCfFunnels } = await import("./db");
        return await getCfFunnels(input?.includeArchived ?? false);
      }),

    // Get form submissions for a specific funnel
    submissions: protectedProcedure
      .input(z.object({ funnelId: z.number().optional(), limit: z.number().optional().default(100) }))
      .query(async ({ input }) => {
        const { getCfSubmissions } = await import("./db");
        return await getCfSubmissions(input.funnelId, input.limit);
      }),

    // Get submission summary grouped by funnel
    summary: protectedProcedure.query(async () => {
      const { getCfFunnelSummary } = await import("./db");
      return await getCfFunnelSummary();
    }),

    // Manually trigger a full sync
    syncNow: protectedProcedure.mutation(async () => {
      const { syncClickFunnels } = await import("./clickfunnelsSyncService");
      const result = await syncClickFunnels();
      return result;
    }),

    // Update UV/PV stats manually (ClickFunnels API doesn't expose visit counts)
    updateUvPv: protectedProcedure
      .input(z.object({
        cfId: z.number(),
        uniqueVisitors: z.number().min(0),
        pageViews: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        const { updateFunnelUvPv } = await import("./db");
        return await updateFunnelUvPv(input.cfId, input.uniqueVisitors, input.pageViews);
      }),
  }),

  // ── AI Workspace ──────────────────────────────────────────────────────────────
  workspace: router({
    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["user", "assistant", "system"]),
          content: z.string(),
        })),
        context: z.enum(["general", "programs", "members", "meta_ads", "revenue"]).optional().default("general"),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        // Build context-aware system prompt with live data
        let contextData = "";
        try {
          const database = await db.getDb();
          if (database) {
            const memberResult = await database.execute(
              `SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN membershipTier IN ('all_access_aces','swing_savers') AND status='active' THEN 1 ELSE 0 END) as customerMembers
               FROM members`
            );
            const campaignResult = await database.execute(
              `SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
               SUM(budget) as totalBudget, SUM(actualSpend) as totalSpend, SUM(actualRevenue) as totalRevenue
               FROM campaigns`
            );
            const m = (memberResult as any)[0];
            const c = (campaignResult as any)[0];
            contextData = `\nLive Golf VX Arlington Heights snapshot (as of today):\n- Customer members (All Access + Swing Saver): ${m?.customerMembers || 0} / 300 goal\n- Active programs: ${c?.active || 0} of ${c?.total || 0} total\n- Total marketing spend: $${Number(c?.totalSpend || 0).toFixed(0)} / $${Number(c?.totalBudget || 0).toFixed(0)} budget\n- Total program revenue: $${Number(c?.totalRevenue || 0).toFixed(0)}`;
          }
        } catch (_) {}

        const systemPrompt = `You are the Golf VX Arlington Heights AI Marketing Assistant — a strategic partner for the marketing and operations team. You help analyze performance, suggest marketing actions, log data, and provide actionable recommendations.${contextData}

Your capabilities:
- Analyze Meta Ads performance and suggest optimizations
- Recommend follow-up actions for members and leads
- Help draft email/SMS content for campaigns
- Log program updates and event notes (acknowledge data and confirm what was logged)
- Provide strategic insights based on current KPIs
- Suggest next steps for each of the 4 strategic campaigns: Trial Conversion, Membership Acquisition, Member Retention, B2B Sales

When the user provides data (e.g., "we had 12 attendees at Drive Day"), acknowledge it clearly, suggest what action to take, and offer to help draft follow-up content. Be concise, specific, and actionable. Use numbers when available. Keep responses under 300 words unless a longer response is explicitly needed.`;

        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...input.messages.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
        ];

        const response = await invokeLLM({ messages });
        const reply = response.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
        return { reply };
      }),

    getSuggestedPrompts: protectedProcedure
      .query(async () => {
        return [
          "How are our Meta Ads performing this month?",
          "What should we focus on to hit 300 members?",
          "Draft a follow-up email for trial members who haven't converted",
          "We ran a Drive Day event last weekend with 12 attendees. Log it.",
          "What's the best next action for the Junior Summer Camp campaign?",
          "Analyze our member retention rate and suggest improvements",
          "Create a 30-day content calendar for Instagram",
          "Which campaign has the best ROI right now?",
        ];
      }),
  }),
  // ─── Influencer Partnerships ──────────────────────────────────────────────
  influencer: router({
    list: protectedProcedure.query(async () => {
      const database = await db.getDb();
      if (!database) return [];
      const rows = await database.select().from(influencerPartnerships).orderBy(desc(influencerPartnerships.dealDate));
      return rows;
    }),
    create: protectedProcedure
      .input(z.object({
        handle: z.string(),
        platform: z.enum(["instagram","tiktok","youtube","facebook","other"]).default("instagram"),
        followerCount: z.number().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        dealDate: z.string().optional(),
        totalCost: z.string().optional(),
        deliverables: z.string().optional(),
        campaignGoal: z.string().optional(),
        targetAudience: z.string().optional(),
        status: z.enum(["negotiating","contracted","in_progress","completed","cancelled"]).default("contracted"),
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
          platform: z.enum(["instagram","tiktok","youtube","facebook","other"]).optional(),
          followerCount: z.number().optional(),
          contactName: z.string().optional(),
          contactEmail: z.string().optional(),
          dealDate: z.string().optional(),
          totalCost: z.string().optional(),
          deliverables: z.string().optional(),
          campaignGoal: z.string().optional(),
          status: z.enum(["negotiating","contracted","in_progress","completed","cancelled"]).optional(),
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
  }),

  // ─── Community Outreach (Sponsorship / Donation Requests) ─────────────────
  outreach: router({
    list: protectedProcedure.query(async () => {
      const database = await db.getDb();
      if (!database) return [];
      const rows = await database.select().from(communityOutreach).orderBy(desc(communityOutreach.requestDate));
      return rows;
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
        orgType: z.enum(["school_pta","school_sports","nonprofit","civic","arts_culture","sports_league","religious","business","other"]).default("other"),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        website: z.string().optional(),
        ein: z.string().optional(),
        is501c3: z.boolean().optional(),
        requestType: z.enum(["cash_donation","gift_card","product_donation","service_donation","sponsorship","partnership","networking"]).default("gift_card"),
        requestDate: z.string().optional(),
        eventName: z.string().optional(),
        eventDate: z.string().optional(),
        eventLocation: z.string().optional(),
        estimatedAttendees: z.number().optional(),
        requestedAmount: z.string().optional(),
        requestDescription: z.string().optional(),
        status: z.enum(["received","under_review","approved","rejected","fulfilled","follow_up"]).default("received"),
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
        priority: z.enum(["low","medium","high"]).optional(),
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
          orgType: z.enum(["school_pta","school_sports","nonprofit","civic","arts_culture","sports_league","religious","business","other"]).optional(),
          contactName: z.string().optional(),
          contactEmail: z.string().optional(),
          contactPhone: z.string().optional(),
          requestType: z.enum(["cash_donation","gift_card","product_donation","service_donation","sponsorship","partnership","networking"]).optional(),
          requestDate: z.string().optional(),
          eventName: z.string().optional(),
          eventDate: z.string().optional(),
          estimatedAttendees: z.number().optional(),
          requestedAmount: z.string().optional(),
          requestDescription: z.string().optional(),
          status: z.enum(["received","under_review","approved","rejected","fulfilled","follow_up"]).optional(),
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
          priority: z.enum(["low","medium","high"]).optional(),
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
        status: z.enum(["received","under_review","approved","rejected","fulfilled","follow_up"]),
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
  }),

  // ─── Print Advertising Router ─────────────────────────────────────────────
  printAd: router({
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
        await database.insert(printAdvertising).values({
          vendorName: input.vendorName,
          publicationType: input.publicationType,
          adSize: input.adSize,
          costPerMonth: String(input.costPerMonth),
          contractMonths: input.contractMonths,
          totalContractValue,
          startDate: input.startDate,
          endDate: input.endDate,
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
  }),

  // ─── Event Advertising (Trade Shows, Expos, Sponsorships) ────────────────────
  eventAd: router({
    list: protectedProcedure.query(async () => {
      const database = await db.getDb();
      if (!database) return [];
      return database.select().from(eventAdvertising).orderBy(desc(eventAdvertising.eventDate));
    }),
    create: protectedProcedure
      .input(z.object({
        eventName: z.string().min(1),
        eventType: z.enum(["trade_show","expo","sponsorship","community_event","golf_tournament","other"]).default("trade_show"),
        venue: z.string().optional(),
        location: z.string().optional(),
        eventDate: z.string().optional(),
        eventEndDate: z.string().optional(),
        status: z.enum(["upcoming","active","completed","cancelled"]).default("upcoming"),
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
        await database.insert(eventAdvertising).values({
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
        status: z.enum(["upcoming","active","completed","cancelled"]).optional(),
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
  }),

  // ─── AI Strategy Workspace ──────────────────────────────────────────────────
  aiWorkspace: router({
    analyze: protectedProcedure
      .input(z.object({
        content: z.string().min(10).max(50000),
        analysisType: z.enum([
          'competitive_analysis',
          'marketing_plan',
          'event_roi',
          'b2b_strategy',
          'campaign_brief',
          'community_outreach',
          'free_form',
        ]),
        customPrompt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");

        const GOLF_VX_CONTEXT = `Golf VX Arlington Heights is an indoor golf simulator venue located at 644 E Rand Rd, Arlington Heights, IL. It offers: hourly bay rentals ($45 off-peak / $65 peak), memberships (All Access Ace, Swing Saver, Golf VX Pro), leagues, lessons, clinics, junior programs (Junior Summer Camp), food & beverage, and private/corporate events. The venue targets local Arlington Heights and Chicago suburb residents. Key programs: $25 Trial Session (off-peak), $35 Trial Session (peak), Winter Clinics, Sunday Clinics (PBGA), Drive Day Clinics, Junior Summer Camp. Website: playgolfvx.com. Linktree: ah.playgolfvx.com.`;

        const typeInstructions: Record<string, string> = {
          competitive_analysis: `You are a golf industry marketing strategist. Analyze the provided content for competitive intelligence relevant to Golf VX Arlington Heights. Identify what competitors are doing, what Golf VX can learn, and specific tactics to adopt or counter. Context: ${GOLF_VX_CONTEXT}`,
          marketing_plan: `You are the marketing director for Golf VX Arlington Heights. Create a detailed, actionable marketing plan based on the provided content. Include specific channels, messaging, timing, budget estimates, and KPIs. Focus on the local Arlington Heights / Chicago suburb audience. Context: ${GOLF_VX_CONTEXT}`,
          event_roi: `You are a marketing ROI analyst specializing in event marketing. Evaluate the event or sponsorship described in the provided content for Golf VX Arlington Heights. Calculate or estimate ROI, identify what worked and what didn't, and provide specific recommendations to improve future events. Context: ${GOLF_VX_CONTEXT}`,
          b2b_strategy: `You are a B2B sales and marketing strategist. Analyze the provided content and develop a corporate events and B2B partnership strategy for Golf VX Arlington Heights. Include target companies, outreach tactics, pricing packages, and competitive positioning vs. Topgolf and other venues. Context: ${GOLF_VX_CONTEXT}`,
          campaign_brief: `You are a creative marketing director. Based on the provided content, write a complete campaign brief for Golf VX Arlington Heights. Include: campaign objective, target audience, key message, creative direction, channels, timeline, budget range, and success metrics. Context: ${GOLF_VX_CONTEXT}`,
          community_outreach: `You are the community relations manager for Golf VX Arlington Heights. Evaluate the sponsorship or donation request in the provided content. Recommend whether to approve or decline, what to offer, how to maximize brand visibility, and what ROI to expect. Consider the local Arlington Heights community context. Context: ${GOLF_VX_CONTEXT}`,
          free_form: `You are a strategic marketing AI assistant for Golf VX Arlington Heights. Context: ${GOLF_VX_CONTEXT}. Analyze the provided content and give actionable marketing insights, strategic recommendations, and specific next steps.`,
        };

        const systemPrompt = typeInstructions[input.analysisType] || typeInstructions.free_form;

        const userPrompt = input.customPrompt
          ? `${input.customPrompt}\n\n---\n\nCONTENT TO ANALYZE:\n${input.content}`
          : `Please analyze the following content and provide a structured response with these sections:\n\n## Executive Summary\n(2-3 sentences capturing the key takeaway)\n\n## Key Insights\n(3-5 specific, data-driven observations)\n\n## Recommended Actions\n(Prioritized list of specific, actionable steps with owner and timeline)\n\n## KPIs to Track\n(Measurable success metrics with target values where possible)\n\n## Risks & Considerations\n(What to watch out for, potential downsides)\n\n---\n\nCONTENT TO ANALYZE:\n${input.content}`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        });

        const result = response?.choices?.[0]?.message?.content || 'No response generated.';
        return { analysis: result, analysisType: input.analysisType };
      }),
  }),

  // ─── Giveaway Router ──────────────────────────────────────────────────────
  giveaway: router({
    // Get all giveaway applications
    getApplications: protectedProcedure.query(async () => {
      return await giveawaySync.getGiveawayApplications();
    }),

    // Get giveaway statistics
    getStats: protectedProcedure.query(async () => {
      return await giveawaySync.getGiveawayStats();
    }),

    // Get last sync info
    getLastSyncInfo: protectedProcedure.query(async () => {
      const { getGiveawayCount } = await import('./googleSheetsSync');
      const count = await getGiveawayCount();
      return { count, lastChecked: new Date().toISOString(), source: 'database' };
    }),

    // Get bottom-funnel conversions (applicants who booked Trial or Drive Day)
    getConversions: protectedProcedure.query(async () => {
      const database = await db.getDb();
      if (!database) return { total: 0, trialCount: 0, driveDayCount: 0, conversions: [] };
      const { giveawayApplications, memberAppointments, members } = await import('../drizzle/schema');
      const { eq: eqOp, and: andOp, isNotNull, like, or: orOp } = await import('drizzle-orm');
      const applicants = await database
        .select({ email: giveawayApplications.email, name: giveawayApplications.name })
        .from(giveawayApplications)
        .where(andOp(eqOp(giveawayApplications.isTestEntry, false), isNotNull(giveawayApplications.email)));
      const applicantEmailMap = new Map(applicants.map(a => [a.email!.toLowerCase().trim(), a.name]));
      const appts = await database
        .select({
          email: members.email,
          memberName: members.name,
          appointmentType: memberAppointments.appointmentType,
          appointmentDate: memberAppointments.appointmentDate,
        })
        .from(memberAppointments)
        .innerJoin(members, eqOp(members.id, memberAppointments.memberId))
        .where(andOp(
          eqOp(memberAppointments.canceled, false),
          orOp(
            like(memberAppointments.appointmentType, '%Trial%'),
            like(memberAppointments.appointmentType, '%Drive Day%'),
          ),
        ));
      const seen = new Set<string>();
      const conversions: Array<{ email: string; applicantName: string; appointmentType: string; appointmentDate: Date | null; conversionType: 'trial' | 'drive_day' }> = [];
      let trialCount = 0;
      let driveDayCount = 0;
      for (const appt of appts) {
        const emailKey = appt.email?.toLowerCase().trim() ?? '';
        if (!emailKey || !applicantEmailMap.has(emailKey)) continue;
        const isDriveDay = appt.appointmentType.toLowerCase().includes('drive day');
        const conversionType = isDriveDay ? 'drive_day' as const : 'trial' as const;
        const dedupeKey = `${emailKey}:${conversionType}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        if (isDriveDay) driveDayCount++; else trialCount++;
        conversions.push({
          email: emailKey,
          applicantName: applicantEmailMap.get(emailKey) || appt.memberName || '',
          appointmentType: appt.appointmentType,
          appointmentDate: appt.appointmentDate,
          conversionType,
        });
      }
      return { total: conversions.length, trialCount, driveDayCount, conversions };
    }),

    // Sync giveaway from Google Sheets
    sync: protectedProcedure.mutation(async () => {
      const result = await syncGiveawayFromSheets();
      return result;
    }),

    // Sync applicants to Encharge
    syncToEncharge: protectedProcedure
      .input(z.object({
        applicantIds: z.array(z.number()),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { upsertEnchargePerson } = await import('./enchargeSync');
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const { giveawayApplications } = await import('../drizzle/schema');
        const { inArray } = await import('drizzle-orm');
        const applicants = await database
          .select()
          .from(giveawayApplications)
          .where(inArray(giveawayApplications.id, input.applicantIds));
        let synced = 0;
        let errors = 0;
        for (const app of applicants) {
          if (!app.email) continue;
          try {
            const nameParts = (app.name || '').split(' ');
            await upsertEnchargePerson({
              email: app.email,
              firstName: nameParts[0] || undefined,
              lastName: nameParts.slice(1).join(' ') || undefined,
              phone: app.phone || undefined,
              tags: input.tags || ['giveaway-2026'],
            });
            synced++;
          } catch { errors++; }
        }
        return { synced, errors };
      }),

    // Update applicant status
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'contacted', 'scheduled', 'completed', 'declined']),
      }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const { giveawayApplications } = await import('../drizzle/schema');
        const { eq: eqOp } = await import('drizzle-orm');
        await database.update(giveawayApplications)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eqOp(giveawayApplications.id, input.id));
        return { success: true };
      }),

    // Check visit history for an applicant
    checkVisitHistory: protectedProcedure
      .input(z.object({ applicantId: z.number() }))
      .query(async ({ input }) => {
        const database = await db.getDb();
        if (!database) return { hasVisited: false, visitCount: 0, lastVisit: null, selfReported: 'Unknown', memberStatus: null, memberTier: null };
        const { giveawayApplications, memberAppointments, members } = await import('../drizzle/schema');
        const { eq: eqOp, desc: descOp } = await import('drizzle-orm');
        const [app] = await database.select().from(giveawayApplications).where(eqOp(giveawayApplications.id, input.applicantId)).limit(1);
        if (!app) return { hasVisited: false, visitCount: 0, lastVisit: null, selfReported: 'Unknown', memberStatus: null, memberTier: null };
        // Check if they have appointments in the system
        const memberRows = app.email
          ? await database.select().from(members).where(eqOp(members.email, app.email)).limit(1)
          : [];
        let visitCount = 0;
        let lastVisit: Date | null = null;
        let memberStatus: string | null = null;
        let memberTier: string | null = null;
        if (memberRows.length > 0) {
          const member = memberRows[0];
          memberStatus = member.status || null;
          memberTier = member.membershipType || null;
          const appts = await database
            .select({ appointmentDate: memberAppointments.appointmentDate })
            .from(memberAppointments)
            .where(eqOp(memberAppointments.memberId, member.id))
            .orderBy(descOp(memberAppointments.appointmentDate));
          visitCount = appts.length;
          lastVisit = appts[0]?.appointmentDate || null;
        }
        return {
          hasVisited: visitCount > 0 || app.visitedBefore === 'Yes',
          visitCount,
          lastVisit,
          selfReported: app.visitedBefore || 'Unknown',
          memberStatus,
          memberTier,
        };
      }),

    // Generate email draft for a specific applicant
    generateEmailDraft: protectedProcedure
      .input(z.object({ applicantId: z.number() }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const { giveawayApplications } = await import('../drizzle/schema');
        const { eq: eqOp } = await import('drizzle-orm');
        const { invokeLLM } = await import('./_core/llm');
        const [app] = await database.select().from(giveawayApplications).where(eqOp(giveawayApplications.id, input.applicantId)).limit(1);
        if (!app) throw new TRPCError({ code: 'NOT_FOUND', message: 'Applicant not found' });
        const prompt = `You are an expert email copywriter for Golf VX Arlington Heights, an indoor golf simulator facility.
Write a personalized follow-up email for this Annual Membership Giveaway applicant:
- Name: ${app.name}
- City: ${app.city || 'Unknown'}
- Golf experience: ${app.golfExperienceLevel || 'Unknown'}
- Has visited before: ${app.visitedBefore || 'Unknown'}
- How they heard: ${app.howDidTheyHear || 'Unknown'}
- Status: ${app.status}

Write a warm, personalized email that:
1. Thanks them for applying to the Annual Membership Giveaway
2. Invites them to visit Golf VX Arlington Heights (644 E Rand Rd, Arlington Heights, IL)
3. Mentions the $9 Trial Session as a low-barrier way to experience the facility
4. Mentions the upcoming Drive Day Clinic with Coach Chuck Lynch ($20 for 90 min)
5. Encourages following @golfvxarlingtonheights on Instagram

Return JSON: { subject: string, preheader: string, body: string (HTML), callToAction: string }`;
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert email copywriter. Respond with valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        });
        try {
          const raw = response?.choices?.[0]?.message?.content;
          return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
          return { subject: 'Thank you for applying!', preheader: 'We appreciate your interest in Golf VX', body: '<p>Thank you for applying to the Golf VX Annual Membership Giveaway!</p>', callToAction: 'Book a Trial Session' };
        }
      }),

    // Generate AI program insights for the giveaway
    generateProgramInsights: protectedProcedure
      .input(z.object({ programId: z.number().optional() }))
      .mutation(async () => {
        // Delegate to the campaigns.generateInsights logic with campaignId=1 (Annual Giveaway)
        const stats = await giveawaySync.getGiveawayStats();
        const { invokeLLM } = await import('./_core/llm');
        const entryGoal = 1000;
        const longFormGoal = 250;
        const total = stats.totalApplications || 0;
        const progressPct = ((total / entryGoal) * 100).toFixed(1);
        const ageBreakdown = Object.entries(stats.ageRangeDistribution || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No data';
        const genderBreakdown = Object.entries(stats.genderDistribution || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No data';
        const topCities = Object.entries(stats.cityDistribution || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No data';
        const chicagoCount = (stats.cityDistribution || {})['Chicago'] || 0;
        const chicagoPct = total > 0 ? ((chicagoCount / total) * 100).toFixed(1) : '0.0';
        const experienceBreakdown = Object.entries(stats.golfExperienceDistribution || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No data';
        const visitedBreakdown = Object.entries(stats.visitedBeforeDistribution || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No data';
        const hearBreakdown = Object.entries(stats.howDidTheyHearDistribution || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No data';
        const familiarityBreakdown = Object.entries(stats.indoorGolfFamiliarityDistribution || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No data';
        const prompt = `You are a senior marketing strategist for Golf VX Arlington Heights, an indoor golf simulator facility in the Chicago suburbs (644 E Rand Rd, Arlington Heights, IL — 25 miles northwest of downtown Chicago).

PROGRAM: Annual Membership Giveaway 2026
Goal: ${entryGoal} entries, ${longFormGoal} long-form applicants
Current entries: ${total} (${progressPct}% of entry goal)
Funnel: Entry page 875 UV → Application page 187 UV → 67 form completions (47% completion rate from app page)
DEMOGRAPHIC DATA:
- Age distribution: ${ageBreakdown}
- Gender: ${genderBreakdown}
- City distribution (top 8): ${topCities}
- Chicago city applicants: ${chicagoCount} (${chicagoPct}% of total — NOTABLY LOW given Chicago's large young golfer population)
- Golf experience: ${experienceBreakdown}
- Visited Golf VX before: ${visitedBreakdown}
- How they heard: ${hearBreakdown}
- Indoor golf familiarity: ${familiarityBreakdown}
KEY STRATEGIC CONTEXT:
- Chicago city has very few applicants despite being 25 miles away with a large population of young urban golfers aged 25-40
- Indoor golf simulators are extremely popular with young Chicago city professionals who want year-round golf
- There is a significant untapped opportunity to target young Chicago city golfers (ages 25-40) who may not know about Golf VX Arlington Heights
- The commute from Chicago to Arlington Heights is feasible via I-90/I-94 or Metra UP-NW line (40-50 min)
Provide a comprehensive marketing intelligence report. Respond in JSON:
{
  "executiveSummary": "string",
  "keyInsights": [{ "insight": "string", "implication": "string", "priority": "high|medium|low" }],
  "chicagoOpportunity": { "summary": "string", "targetNeighborhoods": ["string"], "targetDemographic": "string", "adStrategy": "string", "messagingAngle": "string" },
  "metaAdsStrategy": { "audienceRecommendations": ["string"], "creativeRecommendations": ["string"], "budgetRecommendations": ["string"], "campaignOptimizations": ["string"] },
  "multiChannelStrategy": [{ "channel": "string", "strategy": "string", "tactics": ["string"], "expectedImpact": "string", "priority": "high|medium|low" }],
  "contentStrategy": { "themes": ["string"], "formats": ["string"], "messaging": "string" },
  "funnelOptimization": ["string"],
  "sevenDayPlan": [{ "day": "string", "actions": ["string"] }]
}`;
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a senior marketing strategist. Always respond with valid JSON only, no markdown code blocks.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        });
        let insights: any = null;
        try {
          const raw = response?.choices?.[0]?.message?.content;
          insights = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
          insights = { executiveSummary: 'Unable to generate insights at this time.', keyInsights: [], chicagoOpportunity: null, metaAdsStrategy: {}, multiChannelStrategy: [], contentStrategy: {}, funnelOptimization: [], sevenDayPlan: [] };
        }
         return { insights, stats: { total, entryGoal, longFormGoal, progressPct: parseFloat(progressPct) } };
      }),
    getApplicationsFiltered: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        gender: z.string().optional(),
        ageRange: z.string().optional(),
        golfExperience: z.string().optional(),
        status: z.enum(['pending', 'contacted', 'scheduled', 'completed', 'declined']).optional(),
        illinoisResident: z.boolean().optional(),
        showTestEntries: z.boolean().optional(),
        sortBy: z.string().optional(),
        sortDir: z.enum(['asc', 'desc']).optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const database = await db.getDb();
        if (!database) return { applications: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };
        const { giveawayApplications } = await import('../drizzle/schema');
        const { like, eq: eqOp, and: andOp } = await import('drizzle-orm');
        const conditions: any[] = [];
        if (!input?.showTestEntries) conditions.push(eqOp(giveawayApplications.isTestEntry, false));
        if (input?.status) conditions.push(eqOp(giveawayApplications.status, input.status));
        if (input?.gender) conditions.push(eqOp(giveawayApplications.gender, input.gender));
        if (input?.ageRange) conditions.push(eqOp(giveawayApplications.ageRange, input.ageRange));
        if (input?.golfExperience) conditions.push(eqOp(giveawayApplications.golfExperienceLevel, input.golfExperience));
        if (input?.illinoisResident !== undefined && input.illinoisResident !== null) {
          conditions.push(eqOp(giveawayApplications.illinoisResident, input.illinoisResident));
        }
        const allRows = conditions.length > 0
          ? await database.select().from(giveawayApplications).where(andOp(...conditions as [any, ...any[]]))
          : await database.select().from(giveawayApplications);
        let filtered = allRows;
        if (input?.search) {
          const q = input.search.toLowerCase();
          filtered = allRows.filter(r =>
            r.name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            (r.phone || '').includes(q)
          );
        }
        // Sort
        const sortBy = input?.sortBy || 'submissionTimestamp';
        const sortDir = input?.sortDir || 'desc';
        filtered.sort((a: any, b: any) => {
          const av = a[sortBy] ?? '';
          const bv = b[sortBy] ?? '';
          return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });
        // Paginate
        const page = input?.page || 1;
        const pageSize = input?.pageSize || 50;
        const total = filtered.length;
        const totalPages = Math.ceil(total / pageSize);
        const applications = filtered.slice((page - 1) * pageSize, page * pageSize);
        return { applications, total, page, pageSize, totalPages };
      }),
  }),

  // ─── Strategic Campaigns Router ───────────────────────────────────────────
  strategicCampaigns: router({
    // Get overview grouped by strategic category
    getOverview: protectedProcedure.query(async () => {
      const allCampaigns = await db.getAllCampaigns();
      // Group campaigns by category
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
        grouped[cat].programs.push({
          id: campaign.id,
          name: campaign.name,
          spend,
          revenue,
          status: campaign.status,
        });
      }
      // Calculate ROI per group
      for (const group of Object.values(grouped)) {
        group.roi = group.totalSpend > 0
          ? ((group.totalRevenue - group.totalSpend) / group.totalSpend) * 100
          : 0;
      }
      // Return in a consistent order
      const order = ['membership_acquisition', 'trial_conversion', 'member_retention', 'corporate_events'];
      return order.filter(k => grouped[k]).map(k => grouped[k]);
    }),
  }),

  // ─── Revenue Router ───────────────────────────────────────────────────────
  revenue: router({
    // Get Toast POS revenue summary from database
    getToastSummary: protectedProcedure.query(async () => {
      const database = await db.getDb();
      if (!database) return { totalRevenue: 0, thisMonthRevenue: 0, lastMonthRevenue: 0, allTimeRevenue: 0, avgDailyRevenue: 0, thisMonthOrders: 0 };
      const { memberTransactions } = await import('../drizzle/schema');
      const { gte, and: andOp, eq: eqOp } = await import('drizzle-orm');
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
      return {
        totalRevenue: allTimeRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        allTimeRevenue,
        avgDailyRevenue,
        thisMonthOrders: thisMonthTx.length,
      };
    }),

    // Get revenue summary for a date range
    getSummary: protectedProcedure
      .input(z.object({ startDate: z.date(), endDate: z.date() }).optional())
      .query(async ({ input }) => {
        const database = await db.getDb();
        if (!database) return { total: 0, toastRevenue: 0, acuityRevenue: 0, memberCount: 0 };
        const { memberTransactions } = await import('../drizzle/schema');
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
    // Get Toast POS daily summary rows
    getToastDaily: protectedProcedure
      .input(z.object({ startDate: z.string().optional(), endDate: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const database = await db.getDb();
        if (!database) return [];
        const { toastDailySummary } = await import('../drizzle/schema');
        const { gte: gteOp, lte: lteOp, and: andOp } = await import('drizzle-orm');
        const conditions = [];
        if (input?.startDate) conditions.push(gteOp(toastDailySummary.date, input.startDate));
        if (input?.endDate) conditions.push(lteOp(toastDailySummary.date, input.endDate));
        const rows = conditions.length > 0
          ? await database.select().from(toastDailySummary).where(andOp(...conditions as [any, ...any[]])).orderBy(toastDailySummary.date)
          : await database.select().from(toastDailySummary).orderBy(toastDailySummary.date);
        return rows;
      }),
    // Get trial session detail data from Acuity
    getTrialSessionDetail: protectedProcedure.query(async () => {
      try {
        const { getAppointments } = await import('./acuity');
        const appointments = await getAppointments({ canceled: false, max: 1000 });
        // Filter for trial/intro sessions
        const trialAppts = appointments.filter((apt: any) => {
          const t = apt.type.toLowerCase();
          return t.includes('trial') || t.includes('intro') || t.includes('free') || t.includes('guest pass') || t.includes('first visit');
        });
        // Group by appointment type
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
        console.error('[revenue.getTrialSessionDetail]', err);
        return { types: [], totalBookings: 0, totalRevenue: 0, allBookings: [] };
      }
    }),
    // Get Acuity Scheduler revenue
    getAcuityRevenue: protectedProcedure
      .input(z.object({
        minDate: z.string().optional(),
        maxDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        try {
          const { getAllRevenueByType } = await import('./acuity');
          const revenueData = await getAllRevenueByType(input.minDate, input.maxDate);
          const total = revenueData.reduce((s, r) => s + r.totalRevenue, 0);
          const totalBookings = revenueData.reduce((s, r) => s + r.bookingCount, 0);
          return { total, totalBookings, byType: revenueData };
        } catch (err) {
          console.error('[Revenue] Acuity revenue error:', err);
          return { total: 0, totalBookings: 0, byType: [] };
        }
      }),
  }),
  // ─── Members Router ───────────────────────────────────────────────────────
  members: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        status: z.enum(['active', 'inactive', 'cancelled', 'trial']).optional(),
        membershipTier: z.enum(['trial', 'monthly', 'annual', 'corporate', 'none', 'all_access_aces', 'swing_savers', 'golf_vx_pro']).optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllMembers(input || {});
      }),
    getStats: protectedProcedure.query(async () => {
      return await db.getMemberStats();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const member = await db.getMemberById(input.id);
        if (!member) throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
        return member;
      }),
    getGuestContacts: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input }) => {
        try {
          const { getAppointments } = await import('./acuity');
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          const minDate = sixMonthsAgo.toISOString().split('T')[0];
          const appointments = await getAppointments({ minDate, canceled: false });
          // Group by email
          const contactMap = new Map<string, {
            email: string; firstName: string; lastName: string;
            visitCount: number; totalPaid: number; lastVisit: string;
            programs: string[];
          }>();
          for (const apt of appointments) {
            const email = apt.email.toLowerCase();
            if (!email) continue;
            const existing = contactMap.get(email);
            if (existing) {
              existing.visitCount += 1;
              existing.totalPaid += parseFloat(apt.amountPaid || '0');
              if (apt.date > existing.lastVisit) existing.lastVisit = apt.date;
              existing.programs.push(apt.type);
            } else {
              contactMap.set(email, {
                email,
                firstName: apt.firstName,
                lastName: apt.lastName,
                visitCount: 1,
                totalPaid: parseFloat(apt.amountPaid || '0'),
                lastVisit: apt.date,
                programs: [apt.type],
              });
            }
          }
          let contacts = Array.from(contactMap.values()).sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
          if (input?.search) {
            const q = input.search.toLowerCase();
            contacts = contacts.filter(c =>
              c.firstName.toLowerCase().includes(q) ||
              c.lastName.toLowerCase().includes(q) ||
              c.email.includes(q)
            );
          }
          return contacts;
        } catch (err) {
          console.error('[members.getGuestContacts]', err);
          return [];
        }
      }),
    findDuplicates: protectedProcedure.query(async () => {
      const allMembers = await db.getAllMembers();
      // Group by normalized email to find duplicates
      const emailGroups = new Map<string, typeof allMembers>();
      for (const m of allMembers) {
        const key = m.email.toLowerCase().trim();
        if (!emailGroups.has(key)) emailGroups.set(key, []);
        emailGroups.get(key)!.push(m);
      }
      return Array.from(emailGroups.values()).filter(g => g.length > 1);
    }),
    mergeMembers: protectedProcedure
      .input(z.object({ primaryId: z.number(), duplicateIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const { members: membersTable } = await import('../drizzle/schema');
        // Delete duplicate members (primary keeps its record)
        for (const dupId of input.duplicateIds) {
          await database.delete(membersTable).where(eq(membersTable.id, dupId));
        }
        return { success: true, mergedCount: input.duplicateIds.length };
      }),
  }),

  // ─── Meta Ads Router ──────────────────────────────────────────────────────
  metaAds: router({
    getAllCampaignsWithInsights: protectedProcedure
      .input(z.object({ datePreset: z.string().optional() }).optional())
      .query(async ({ input }) => {
        try {
          return await metaAds.getAllCampaignsWithInsights(input?.datePreset || 'last_30d');
        } catch (err) {
          console.error('[metaAds.getAllCampaignsWithInsights]', err);
          return [];
        }
      }),
    getCampaignDailyInsights: protectedProcedure
      .input(z.object({ campaignId: z.string(), datePreset: z.string().optional() }))
      .query(async ({ input }) => {
        try {
          return await metaAds.getCampaignDailyInsights(input.campaignId, input.datePreset || 'last_30d');
        } catch (err) {
          console.error('[metaAds.getCampaignDailyInsights]', err);
          return [];
        }
      }),
    getCampaignCreatives: protectedProcedure
      .input(z.object({ campaignId: z.string() }))
      .query(async ({ input }) => {
        try {
          return await metaAds.getCampaignCreatives(input.campaignId);
        } catch (err) {
          console.error('[metaAds.getCampaignCreatives]', err);
          return [];
        }
      }),
    getCampaignAudience: protectedProcedure
      .input(z.object({ campaignId: z.string(), datePreset: z.string().optional() }))
      .query(async ({ input }) => {
        try {
          return await metaAds.getCampaignAudience(input.campaignId, input.datePreset || 'last_30d');
        } catch (err) {
          console.error('[metaAds.getCampaignAudience]', err);
          return null;
        }
      }),
  }),

  // ─── Encharge Router ──────────────────────────────────────────────────────
  encharge: router({
    getAccount: protectedProcedure.query(async () => {
      try {
        return await encharge.getEnchargeAccount();
      } catch (err) {
        console.error('[encharge.getAccount]', err);
        return null;
      }
    }),
    getMetrics: protectedProcedure.query(async () => {
      try {
        return await encharge.getSubscriberMetrics();
      } catch (err) {
        console.error('[encharge.getMetrics]', err);
        return { totalSubscribers: 0, activeSubscribers: 0, unsubscribed: 0, bounced: 0 };
      }
    }),
    getPeople: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        try {
          return await encharge.getEnchargePeople(input?.limit || 100);
        } catch (err) {
          console.error('[encharge.getPeople]', err);
          return [];
        }
      }),
    getSegments: protectedProcedure.query(async () => {
      try {
        return await encharge.getEnchargeSegments();
      } catch (err) {
        console.error('[encharge.getSegments]', err);
        return [];
      }
    }),
  }),

  // ─── Budgets Router ───────────────────────────────────────────────────────
  budgets: router({
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
        const result = await metaAds.syncMetaAdsBudgets();
        return result;
      } catch (err) {
        console.error('[budgets.syncMetaAdsBudgets]', err);
        return { syncedCampaigns: [] };
      }
    }),
    autoLinkMetaAdsCampaigns: protectedProcedure.mutation(async () => {
      try {
        const result = await metaAds.autoLinkMetaAdsCampaigns();
        return result;
      } catch (err) {
        console.error('[budgets.autoLinkMetaAdsCampaigns]', err);
        return { linkedCampaigns: [] };
      }
    }),
    addExpense: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        date: z.date(),
        category: z.enum(['meta_ads', 'google_ads', 'print', 'event', 'production', 'other']),
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
        // Update campaign actual spend
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
  }),

  // ─── Dashboard Router ─────────────────────────────────────────────────────
  dashboard: router({
    getOverview: protectedProcedure
      .input(z.object({ startDate: z.date(), endDate: z.date() }).optional())
      .query(async ({ input }) => {
        const [memberStats, activeCampaigns] = await Promise.all([
          db.getMemberStats(),
          db.getCampaignsByStatus('active'),
        ]);
        const totalMembers = memberStats?.totalMembers || 0;
        const activeMembers = memberStats?.activeMembers || 0;
        const allAccessMRR = parseFloat(memberStats?.allAccessMRR || '0');
        const swingSaversMRR = parseFloat(memberStats?.swingSaversMRR || '0');
        const golfVxProMRR = parseFloat(memberStats?.golfVxProMRR || '0');
        const monthlyRecurringRevenue = allAccessMRR + swingSaversMRR + golfVxProMRR;
        const activeCampaignsCount = activeCampaigns.length;
        // Get total marketing spend from active campaigns
        const marketingSpend = activeCampaigns
          .reduce((s, c) => s + parseFloat(c.actualSpend || '0'), 0)
          .toFixed(2);
        // Integration statuses
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
  }),

  // ─── Conversion Router ────────────────────────────────────────────────────
  conversion: router({
    getMemberAppointments: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => {
        try {
          return await memberAppointmentSync.getMemberAppointments(input.memberId);
        } catch (err) {
          console.error('[conversion.getMemberAppointments]', err);
          return [];
        }
      }),
  }),
});
export type AppRouter = typeof appRouter;
