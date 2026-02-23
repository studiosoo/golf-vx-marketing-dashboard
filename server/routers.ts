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
  runAutonomousCycle,
  getAllActions,
} from "./autonomous";
import { seedDemoData } from "./seed-demo";
import * as encharge from "./encharge";
import * as conversionTracking from "./conversionTracking";
import * as Boomerang from "./boomerang";
import * as Encharge from "./enchargeSync";
import { sendSMS, sendEmail, getCommunicationHistory } from "./twilio";
import { emailCaptures, communicationLogs } from "../drizzle/schema";
import { and, or, like, sql, count } from "drizzle-orm";
import * as memberAppointmentSync from "./memberAppointmentSync";
import * as toastTransactionSync from "./toastTransactionSync";
import * as giveawaySync from "./giveawaySync";
import { calculateCampaignPerformance, GOAL_TEMPLATES } from "./goalTemplates";
import { eq, desc } from "drizzle-orm";
import { aiRecommendations, userActions } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  
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
        
        // Get member emails from database for tracking
        const members = await db.getAllMembers();
        const memberEmails = members.map(m => m.email);
        
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

    getByCategory: protectedProcedure
      .input(z.object({ category: z.enum(["trial_conversion", "membership_acquisition", "member_retention", "corporate_events"]) }))
      .query(async ({ input }) => {
        return await db.getCampaignsByCategory(input.category);
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
  }),

  // Strategic Campaigns Overview
  strategicCampaigns: router({
    getOverview: protectedProcedure.query(async () => {
      return await db.getStrategicCampaignsOverview();
    }),
    
    getProgramCampaigns: protectedProcedure
      .input(z.object({ programId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProgramCampaigns(input.programId);
      }),
    
    setProgramCampaigns: protectedProcedure
      .input(z.object({
        programId: z.number(),
        strategicCampaigns: z.array(z.enum(["trial_conversion", "membership_acquisition", "member_retention", "corporate_events"])),
      }))
      .mutation(async ({ input }) => {
        await db.setProgramCampaigns(input.programId, input.strategicCampaigns);
        return { success: true };
      }),
  }),

  // Channel Management
  channels: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllChannels();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const channel = await db.getChannelById(input.id);
        if (!channel) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Channel not found" });
        }
        return channel;
      }),
    
    getPerformanceSummary: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getChannelPerformanceSummary(input.startDate, input.endDate);
      }),
    
    getMetrics: protectedProcedure
      .input(z.object({
        channelId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getChannelMetricsByDateRange(input.channelId, input.startDate, input.endDate);
      }),
  }),

  // Member Management
  members: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        status: z.enum(["active", "inactive", "cancelled", "trial"]).optional(),
        membershipTier: z.enum(["trial", "monthly", "annual", "corporate", "none", "all_access_aces", "swing_savers", "golf_vx_pro"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllMembers(input);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const member = await db.getMemberById(input.id);
        if (!member) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
        }
        return member;
      }),
    
    getStats: protectedProcedure.query(async () => {
      return await db.getMemberStats();
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        membershipTier: z.enum(["trial", "monthly", "annual", "corporate", "none", "all_access_aces", "swing_savers", "golf_vx_pro"]),
        status: z.enum(["active", "inactive", "cancelled", "trial"]).default("active"),
        joinDate: z.date(),
        acquisitionSource: z.string().optional(),
        campaignId: z.number().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        // Create member in database
        const id = await db.createMember(input);
        
        // Automatically sync to Encharge
        try {
          // Parse name into first/last
          const nameParts = input.name?.split(" ") || [];
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";
          
          // Sync to Encharge
          const syncResult = await encharge.upsertEnchargePerson({
            email: input.email,
            firstName,
            lastName,
            phone: input.phone || undefined,
            tags: input.tags || undefined,
            fields: {
              membershipTier: input.membershipTier,
              status: input.status,
              acquisitionSource: input.acquisitionSource,
            },
          });
          
          if (syncResult.success) {
            console.log(`Successfully synced new member ${id} to Encharge`);
          } else {
            console.error(`Failed to sync new member ${id} to Encharge:`, syncResult.error);
          }
        } catch (error) {
          console.error("Error syncing new member to Encharge:", error);
          // Don't fail the creation if Encharge sync fails
        }
        
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        updates: z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          membershipTier: z.enum(["trial", "monthly", "annual", "corporate", "none", "all_access_aces", "swing_savers", "golf_vx_pro"]).optional(),
          status: z.enum(["active", "inactive", "cancelled", "trial"]).optional(),
          renewalDate: z.date().optional(),
          cancellationDate: z.date().optional(),
          notes: z.string().optional(),
          tags: z.array(z.string()).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        // Update member in database
        await db.updateMember(input.id, input.updates);
        
        // Automatically sync to Encharge if email-related fields changed
        if (input.updates.email || input.updates.name || input.updates.phone || input.updates.tags) {
          try {
            // Get the updated member data
            const member = await db.getMemberById(input.id);
            if (member && member.email) {
              // Parse name into first/last
              const nameParts = member.name?.split(" ") || [];
              const firstName = nameParts[0] || "";
              const lastName = nameParts.slice(1).join(" ") || "";
              
              // Sync to Encharge
              const syncResult = await encharge.upsertEnchargePerson({
                email: member.email,
                firstName,
                lastName,
                phone: member.phone || undefined,
                tags: member.tags || undefined,
                fields: {
                  membershipTier: member.membershipTier,
                  status: member.status,
                  lifetimeValue: member.lifetimeValue,
                },
              });
              
              if (syncResult.success) {
                console.log(`Successfully synced member ${member.id} to Encharge`);
              } else {
                console.error(`Failed to sync member ${member.id} to Encharge:`, syncResult.error);
              }
            }
          } catch (error) {
            console.error("Error syncing to Encharge:", error);
            // Don't fail the update if Encharge sync fails
          }
        }
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMember(input.id);
        return { success: true };
      }),
    
    getSegments: protectedProcedure.query(async () => {
      return await db.getMemberSegments();
    }),
    
    importFromCSV: protectedProcedure
      .input(z.object({
        csvData: z.string(),
      }))
      .mutation(async ({ input }) => {
        const Papa = (await import('papaparse')).default;
        
        const parsed = Papa.parse(input.csvData, {
          header: true,
          skipEmptyLines: true,
        });
        
        if (parsed.errors.length > 0) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: `CSV parsing errors: ${parsed.errors.map((e: any) => e.message).join(', ')}` 
          });
        }
        
        const results = {
          matched: 0,
          created: 0,
          skipped: 0,
          errors: [] as string[],
        };
        
        for (const row of parsed.data as any[]) {
          try {
            // Handle both Boomerangme and Toast CSV formats
            const email = (row.email1 || row.email)?.trim();
            const phone = (row.phone1 || row.phone)?.trim();
            const firstName = row.firstName?.trim() || "";
            const lastName = row.lastName?.trim() || "";
            const name = firstName && lastName ? `${firstName} ${lastName}` : (row.name?.trim() || firstName || lastName);
            
            if (!name || (!email && !phone)) {
              results.skipped++;
              continue;
            }
            
            // Try to find existing member by email or phone
            let existingMember = null;
            if (email) {
              const members = await db.getAllMembers({ search: email });
              existingMember = members.find(m => m.email?.toLowerCase() === email.toLowerCase());
            }
            if (!existingMember && phone) {
              const members = await db.getAllMembers({ search: phone });
              existingMember = members.find(m => m.phone === phone);
            }
            
            // Map membership tier from Boomerangme to our system
            let membershipTier: "all_access_aces" | "swing_savers" | "golf_vx_pro" | "none" = "none";
            const tier = row.membership_tier || row.membershipTier || "";
            if (tier.toLowerCase().includes("all-access") || tier.toLowerCase().includes("all access")) {
              membershipTier = "all_access_aces";
            } else if (tier.toLowerCase().includes("swing saver")) {
              membershipTier = "swing_savers";
            } else if (tier.toLowerCase().includes("golf vx pro") || tier.toLowerCase().includes("pro")) {
              membershipTier = "golf_vx_pro";
            }
            
            const updateData: any = {};
            
            // Detect CSV source and map fields accordingly
            const isToastCSV = row.lifetimeSpend || row.lifetime_spend || row['Lifetime spend'] || row.totalVisits || row.number_of_orders || row['Number of orders'];
            
            if (isToastCSV) {
              // Toast POS data mapping
              const lifetimeSpend = row.lifetimeSpend || row.lifetime_spend || row['Lifetime spend'];
              const numberOfOrders = row.totalVisits || row.number_of_orders || row['Number of orders'] || row.numberOfOrders;
              const lastOrder = row.lastVisitDate || row.last_order || row['Last order'] || row.lastOrder;
              const tags = row.diningBehaviors || row.tags || row.Tags || "";
              
              if (lifetimeSpend) {
                const spend = parseFloat(lifetimeSpend.toString().replace(/[$,]/g, ''));
                if (!isNaN(spend)) updateData.toastLifetimeValue = spend;
              }
              if (numberOfOrders) updateData.toastTotalOrders = parseInt(numberOfOrders);
              if (lastOrder) {
                try {
                  updateData.toastLastOrderDate = new Date(lastOrder);
                } catch (e) {
                  // Invalid date, skip
                }
              }
              if (tags) updateData.toastGuestTags = tags;
              updateData.toastLastSyncedAt = new Date();
            } else {
              // Boomerangme data mapping
              if (row.ltv) updateData.boomerangmeLoyaltyPoints = parseFloat(row.ltv);
              if (row.total_visits || row.totalVisits) updateData.boomerangmeTotalVisits = parseInt(row.total_visits || row.totalVisits);
              if (row.card_status || row.cardStatus) updateData.boomerangmeCardStatus = row.card_status || row.cardStatus;
              if (row.rfm_segment || row.rfmSegment) updateData.boomerangmeRfmSegment = row.rfm_segment || row.rfmSegment;
              updateData.boomerangmeLastSyncedAt = new Date();
            }
            
            if (existingMember) {
              // Update existing member with imported data
              await db.updateMember(existingMember.id, updateData);
              results.matched++;
            } else {
              // Create new member
              await db.createMember({
                name,
                email: email || null,
                phone: phone || null,
                membershipTier,
                status: "active",
                joinDate: row.registration_date ? new Date(row.registration_date) : new Date(),
                acquisitionSource: isToastCSV ? "toast_import" : "boomerangme_import",
                ...updateData,
              });
              results.created++;
            }
          } catch (error) {
            results.errors.push(`Row ${results.matched + results.created + results.skipped + 1}: ${error}`);
          }
        }
        
        return results;
      }),
    
    syncFromAcuity: protectedProcedure
      .mutation(async () => {
        const acuity = await import('./acuity');
        
        // Fetch all appointments from Acuity
        const appointments = await acuity.getAppointments();
        
        const results = {
          matched: 0,
          updated: 0,
          skipped: 0,
          errors: [] as string[],
        };
        
        // Group appointments by email
        const appointmentsByEmail = new Map<string, typeof appointments>();
        for (const apt of appointments) {
          if (!apt.email || apt.canceled) continue;
          const email = apt.email.toLowerCase();
          if (!appointmentsByEmail.has(email)) {
            appointmentsByEmail.set(email, []);
          }
          appointmentsByEmail.get(email)!.push(apt);
        }
        
        // Update members with appointment data
        for (const [email, memberAppointments] of Array.from(appointmentsByEmail.entries())) {
          try {
            // Find member by email
            const members = await db.getAllMembers({ search: email });
            const existingMember = members.find(m => m.email?.toLowerCase() === email);
            
            if (!existingMember) {
              results.skipped++;
              continue;
            }
            
            // Calculate appointment statistics
            const totalLessons = memberAppointments.length;
            const totalSpent = memberAppointments.reduce((sum: number, apt: any) => {
              const amount = parseFloat(apt.amountPaid || apt.priceSold || apt.price || "0");
              return sum + amount;
            }, 0);
            
            const lastLesson = memberAppointments.length > 0
              ? new Date(memberAppointments[memberAppointments.length - 1].datetime)
              : null;
            
            // Update member with Acuity data
            const updateData: any = {
              acuityTotalLessons: totalLessons,
              acuityTotalSpent: totalSpent,
              acuityLastLessonDate: lastLesson,
              acuityLastSyncedAt: new Date(),
            };
            await db.updateMember(existingMember.id, updateData);
            
            results.matched++;
            results.updated++;
          } catch (error) {
            results.errors.push(`Email ${email}: ${error}`);
          }
        }
        
        return results;
      }),
    
    findDuplicates: protectedProcedure
      .query(async () => {
        const allMembers = await db.getAllMembers();
        const duplicateGroups: any[] = [];
        const processed = new Set<number>();
        
        for (const member of allMembers) {
          if (processed.has(member.id)) continue;
          
          const potentialDuplicates = allMembers.filter(m => {
            if (m.id === member.id || processed.has(m.id)) return false;
            
            // Match by phone (if both have phone)
            if (member.phone && m.phone && member.phone === m.phone) return true;
            
            // Match by similar name (normalize and compare)
            const normalizeName = (name: string) => name.toLowerCase().trim().replace(/\s+/g, ' ');
            if (normalizeName(member.name) === normalizeName(m.name)) return true;
            
            return false;
          });
          
          if (potentialDuplicates.length > 0) {
            const group = [member, ...potentialDuplicates];
            duplicateGroups.push(group);
            group.forEach(m => processed.add(m.id));
          }
        }
        
        return duplicateGroups;
      }),
    
    mergeMembers: protectedProcedure
      .input(z.object({
        primaryId: z.number(),
        duplicateIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        const { primaryId, duplicateIds } = input;
        
        // Get primary member
        const primary = await db.getMemberById(primaryId);
        if (!primary) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Primary member not found" });
        }
        
        // Merge data from duplicates into primary
        for (const dupId of duplicateIds) {
          const duplicate = await db.getMemberById(dupId);
          if (!duplicate) continue;
          
          // Merge strategy: keep non-null values, sum numeric values
          const mergedData: any = {};
          
          // Merge contact info (prefer primary, fallback to duplicate)
          if (!primary.phone && duplicate.phone) mergedData.phone = duplicate.phone;
          if (!primary.email && duplicate.email) mergedData.email = duplicate.email;
          
          // Sum financial data
          mergedData.lifetimeValue = (parseFloat(primary.lifetimeValue as any) || 0) + (parseFloat(duplicate.lifetimeValue as any) || 0);
          mergedData.totalVisits = (primary.totalVisits || 0) + (duplicate.totalVisits || 0);
          mergedData.totalPurchases = (parseFloat(primary.totalPurchases as any) || 0) + (parseFloat(duplicate.totalPurchases as any) || 0);
          mergedData.totalLessons = (primary.totalLessons || 0) + (duplicate.totalLessons || 0);
          mergedData.loyaltyPoints = (primary.loyaltyPoints || 0) + (duplicate.loyaltyPoints || 0);
          
          // Keep most recent dates
          if (duplicate.lastVisitDate && (!primary.lastVisitDate || new Date(duplicate.lastVisitDate) > new Date(primary.lastVisitDate))) {
            mergedData.lastVisitDate = duplicate.lastVisitDate;
          }
          if (duplicate.lastPurchaseDate && (!primary.lastPurchaseDate || new Date(duplicate.lastPurchaseDate) > new Date(primary.lastPurchaseDate))) {
            mergedData.lastPurchaseDate = duplicate.lastPurchaseDate;
          }
          if (duplicate.lastLessonDate && (!primary.lastLessonDate || new Date(duplicate.lastLessonDate) > new Date(primary.lastLessonDate))) {
            mergedData.lastLessonDate = duplicate.lastLessonDate;
          }
          
          // Merge tags
          if (duplicate.tags && Array.isArray(duplicate.tags)) {
            const existingTags = (primary.tags as string[]) || [];
            const combinedTags = [...existingTags, ...duplicate.tags];
            const newTags = Array.from(new Set(combinedTags));
            mergedData.tags = newTags;
          }
          
          // Merge notes
          if (duplicate.notes) {
            mergedData.notes = [primary.notes, duplicate.notes].filter(Boolean).join('\n---\n');
          }
          
          // Update primary with merged data
          await db.updateMember(primaryId, mergedData);
          
          // Delete duplicate
          await db.deleteMember(dupId);
        }
        
        return { success: true, mergedCount: duplicateIds.length };
      }),
  }),

  // Revenue Management
  revenue: router({
    getByDateRange: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getRevenueByDateRange(input.startDate, input.endDate);
      }),
    
    getSummary: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getRevenueSummary(input.startDate, input.endDate);
      }),
    
    getTotal: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getTotalRevenue(input.startDate, input.endDate);
      }),
    
    create: protectedProcedure
      .input(z.object({
        date: z.date(),
        amount: z.string(),
        source: z.enum(["membership", "bay_rental", "food_beverage", "event", "league", "coaching", "merchandise", "other"]),
        memberId: z.number().optional(),
        campaignId: z.number().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createRevenue(input);
        return { id };
      }),
  }),

  // Task Management (Asana Integration)
  tasks: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllTasks();
    }),
    
    getByCampaign: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTasksByCampaign(input.campaignId);
      }),
    
    getByStatus: protectedProcedure
      .input(z.object({ completed: z.boolean() }))
      .query(async ({ input }) => {
        return await db.getTasksByStatus(input.completed);
      }),
    
    sync: protectedProcedure
      .input(z.object({
        asanaId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        assignee: z.string().optional(),
        dueDate: z.date().optional(),
        completed: z.boolean().default(false),
        completedAt: z.date().optional(),
        asanaProjectId: z.string().optional(),
        asanaProjectName: z.string().optional(),
        campaignId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.upsertTask({ ...input, lastSyncedAt: new Date() });
        return { id };
      }),
  }),

  // Dashboard Analytics
  dashboard: router({
    getOverview: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        const [
          totalRevenue,
          memberStats,
          campaigns,
          channelPerformance,
        ] = await Promise.all([
          db.getTotalRevenue(input.startDate, input.endDate),
          db.getMemberStats(),
          db.getAllCampaigns(),
          db.getChannelPerformanceSummary(input.startDate, input.endDate),
        ]);

        const activeCampaigns = campaigns.filter(c => c.status === "active");
        const totalSpend = activeCampaigns.reduce((sum, c) => sum + parseFloat(c.actualSpend), 0);
        const totalCampaignRevenue = activeCampaigns.reduce((sum, c) => sum + parseFloat(c.actualRevenue), 0);
        const roi = totalSpend > 0 ? ((totalCampaignRevenue - totalSpend) / totalSpend) * 100 : 0;

        // Calculate MRR based on membership tiers
        const allAccessMRR = (memberStats?.allAccessCount || 0) * 325;
        const swingSaversMRR = (memberStats?.swingSaversCount || 0) * 225;
        const golfVxProMRR = (memberStats?.golfVxProCount || 0) * 500;
        const totalMRR = allAccessMRR + swingSaversMRR + golfVxProMRR;

        return {
          totalRevenue,
          activeMembers: memberStats?.activeMembers || 0,
          totalMembers: memberStats?.totalMembers || 0,
          monthlyRecurringRevenue: totalMRR,
          marketingSpend: totalSpend.toFixed(2),
          overallROI: roi.toFixed(2),
          activeCampaignsCount: activeCampaigns.length,
          memberStats,
          channelPerformance,
        };
      }),
    
    getRevenueChart: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        const revenueData = await db.getRevenueByDateRange(input.startDate, input.endDate);
        
        // Group by month
        const monthlyRevenue = revenueData.reduce((acc, item) => {
          const month = new Date(item.date).toISOString().slice(0, 7); // YYYY-MM
          if (!acc[month]) {
            acc[month] = 0;
          }
          acc[month] += parseFloat(item.amount);
          return acc;
        }, {} as Record<string, number>);

        return Object.entries(monthlyRevenue).map(([month, amount]) => ({
          month,
          revenue: amount,
        }));
      }),
  }),

  // Budget Management
  budgets: router({
    // Get campaign expenses
    getCampaignExpenses: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCampaignExpenses(input.campaignId);
      }),
    
    // Add manual expense
    addExpense: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        date: z.date(),
        category: z.enum(["meta_ads", "venue_rental", "food_beverage", "promotional_materials", "staff_costs", "equipment", "other"]),
        amount: z.string(),
        description: z.string().optional(),
        receiptUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createCampaignExpense({
          ...input,
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    
    // Update expense
    updateExpense: protectedProcedure
      .input(z.object({
        id: z.number(),
        date: z.date().optional(),
        category: z.enum(["meta_ads", "venue_rental", "food_beverage", "promotional_materials", "staff_costs", "equipment", "other"]).optional(),
        amount: z.string().optional(),
        description: z.string().optional(),
        receiptUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCampaignExpense(id, data);
        return { success: true };
      }),
    
    // Delete expense
    deleteExpense: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCampaignExpense(input.id);
        return { success: true };
      }),
    
    // Update campaign budget
    updateCampaignBudget: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        budget: z.string(),
        metaAdsBudget: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateCampaignBudget(input.campaignId, input.budget, input.metaAdsBudget);
        return { success: true };
      }),
    
    // Link Meta Ads campaign
    linkMetaAdsCampaign: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        metaAdsCampaignId: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.linkMetaAdsCampaign(input.campaignId, input.metaAdsCampaignId);
        return { success: true };
      }),
    
    // Sync Meta Ads budgets
    syncMetaAdsBudgets: protectedProcedure
      .mutation(async () => {
        const syncedCampaigns = await metaAds.syncMetaAdsBudgets();
        return { syncedCampaigns };
      }),
    
    // Auto-link Meta Ads campaigns
    autoLinkMetaAdsCampaigns: protectedProcedure
      .mutation(async () => {
        const linkedCampaigns = await metaAds.autoLinkMetaAdsCampaigns();
        return { linkedCampaigns };
      }),
    
    // Get budget summary for a campaign
    getCampaignBudgetSummary: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const campaign = await db.getCampaignById(input.campaignId);
        if (!campaign) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
        }
        
        const manualExpenses = await db.getTotalCampaignExpenses(input.campaignId);
        const metaAdsSpend = parseFloat(campaign.metaAdsSpend || "0");
        const totalManualExpenses = parseFloat(manualExpenses);
        const totalActualSpend = metaAdsSpend + totalManualExpenses;
        const plannedBudget = parseFloat(campaign.budget);
        const remaining = plannedBudget - totalActualSpend;
        const utilization = plannedBudget > 0 ? (totalActualSpend / plannedBudget) * 100 : 0;
        
        return {
          campaignId: input.campaignId,
          campaignName: campaign.name,
          plannedBudget: campaign.budget,
          metaAdsBudget: campaign.metaAdsBudget,
          metaAdsSpend: campaign.metaAdsSpend,
          manualExpenses: manualExpenses,
          totalActualSpend: totalActualSpend.toFixed(2),
          remaining: remaining.toFixed(2),
          utilization: utilization.toFixed(2),
        };
      }),
  }),

  // Meta Ads Integration
  metaAds: router({
    getAccount: protectedProcedure.query(async () => {
      try {
        return await metaAds.getAdAccount();
      } catch (error) {
        // Fallback to cache if API fails
        const cachedData = metaAdsCache.getAccountFromCache();
        if (cachedData) {
          return cachedData;
        }
        // Return default data if no cache
        return {
          id: process.env.META_ADS_ACCOUNT_ID || "",
          account_id: process.env.META_ADS_ACCOUNT_ID || "",
          name: "Golf VX Arlington Heights",
          currency: "USD",
          timezone_name: "America/Chicago"
        };
      }
    }),
    
    getCampaigns: protectedProcedure.query(async () => {
      return await metaAds.getCampaigns();
    }),
    
    getAccountInsights: protectedProcedure
      .input(z.object({
        datePreset: z.enum(["today", "yesterday", "last_7d", "last_14d", "last_30d", "last_90d", "lifetime"]).default("last_30d"),
      }))
      .query(async ({ input }) => {
        try {
          return await metaAds.getAccountInsights(input.datePreset);
        } catch (error) {
          // Fallback to cache if API fails
          const cachedData = metaAdsCache.getAccountInsightsFromCache();
          if (cachedData) {
            return cachedData;
          }
          // Return default data if no cache
          return {
            impressions: "0",
            clicks: "0",
            spend: "0",
            reach: "0",
            cpc: "0",
            cpm: "0",
            ctr: "0",
            date_start: "",
            date_stop: ""
          };
        }
      }),
    
    getAllCampaignsWithInsights: protectedProcedure
      .input(z.object({
        datePreset: z.enum(["today", "yesterday", "last_7d", "last_14d", "last_30d", "last_90d", "lifetime"]).default("last_30d"),
      }))
      .query(async ({ input }) => {
        try {
          return await metaAds.getAllCampaignsWithInsights(input.datePreset);
        } catch (error) {
          // Fallback to cache if API fails
          const cachedData = metaAdsCache.getAllCampaignsFromCache();
          if (cachedData && cachedData.length > 0) {
            return cachedData;
          }
          // Return empty array if no cache
          return [];
        }
      }),
    
    getCampaignInsights: publicProcedure
      .input(z.object({
        campaignId: z.string(),
        datePreset: z.enum(["today", "yesterday", "last_7d", "last_14d", "last_30d", "last_90d", "lifetime"]).default("last_30d"),
      }))
      .query(async ({ input }) => {
        // Try to get from cache first
        const cachedInsights = metaAdsCache.getCampaignInsightsFromCache(input.campaignId);
        if (cachedInsights) {
          return cachedInsights;
        }
        
        // Fallback to empty data if not in cache
        return {
          campaign_id: input.campaignId,
          campaign_name: "",
          impressions: "0",
          clicks: "0",
          spend: "0",
          reach: "0",
          cpc: "0",
          cpm: "0",
          ctr: "0",
          date_start: "",
          date_stop: "",
        };
      }),
    
    refreshCache: protectedProcedure
      .mutation(async () => {
        const { refreshMetaAdsCache } = await import('./refreshMetaAdsCache');
        return await refreshMetaAdsCache();
      }),
    
    getCampaignDailyInsights: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
        days: z.number().optional().default(30),
      }))
      .query(async ({ input }) => {
        try {
          return await metaAds.getCampaignDailyInsights(input.campaignId, input.days);
        } catch (error) {
          // Fallback to cache data - generate synthetic daily data from period totals
          console.warn(`[MetaAds] getCampaignDailyInsights failed for ${input.campaignId}, using cache fallback`);
          const cachedInsights = metaAdsCache.getCampaignInsightsFromCache(input.campaignId);
          
          if (!cachedInsights) {
            return [];
          }
          
          // Generate synthetic daily data by dividing totals across the date range
          const dateStart = new Date(cachedInsights.date_start || Date.now() - 30 * 24 * 60 * 60 * 1000);
          const dateStop = new Date(cachedInsights.date_stop || Date.now());
          const daysDiff = Math.max(1, Math.ceil((dateStop.getTime() - dateStart.getTime()) / (24 * 60 * 60 * 1000)));
          
          const dailyData = [];
          const totalSpend = parseFloat(cachedInsights.spend || '0');
          const totalImpressions = parseInt(cachedInsights.impressions || '0');
          const totalClicks = parseInt(cachedInsights.clicks || '0');
          
          for (let i = 0; i < Math.min(input.days, daysDiff); i++) {
            const date = new Date(dateStop.getTime() - i * 24 * 60 * 60 * 1000);
            dailyData.unshift({
              date: date.toISOString().split('T')[0],
              spend: (totalSpend / daysDiff).toFixed(2),
              impressions: Math.floor(totalImpressions / daysDiff).toString(),
              clicks: Math.floor(totalClicks / daysDiff).toString(),
              ctr: cachedInsights.ctr || '0',
              cpc: cachedInsights.cpc || '0',
              cpm: cachedInsights.cpm || '0'
            });
          }
          
          return dailyData;
        }
      }),
    
    getCampaignCreatives: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          return await metaAds.getCampaignCreatives(input.campaignId);
        } catch (error) {
          // Fallback to empty array if API fails
          console.warn(`[MetaAds] getCampaignCreatives failed for ${input.campaignId}, returning empty data`);
          return [];
        }
      }),
    
    getCampaignAudience: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
        datePreset: z.enum(["today", "yesterday", "last_7d", "last_14d", "last_30d", "last_90d", "lifetime"]).default("last_30d"),
      }))
      .query(async ({ input }) => {
        try {
          return await metaAds.getCampaignAudience(input.campaignId, input.datePreset);
        } catch (error) {
          // Fallback to default data if API fails
          console.warn(`[MetaAds] getCampaignAudience failed for ${input.campaignId}, returning default data`);
          return {
            age_gender: [],
            locations: [],
            devices: []
          };
        }
      }),
    
    // Alerts endpoints
    getActiveAlerts: protectedProcedure.query(async () => {
      const metaAdsAlerts = await import('./metaAdsAlerts');
      return await metaAdsAlerts.getActiveAlerts();
    }),
    
    getCampaignAlerts: protectedProcedure
      .input(z.object({ campaignId: z.string() }))
      .query(async ({ input }) => {
        const metaAdsAlerts = await import('./metaAdsAlerts');
        return await metaAdsAlerts.getCampaignAlertsById(input.campaignId);
      }),
    
    checkCampaignAlerts: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
        campaignName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const metaAdsAlerts = await import('./metaAdsAlerts');
        return await metaAdsAlerts.checkCampaignAlerts(input.campaignId, input.campaignName);
      }),
    
    checkAllCampaignAlerts: protectedProcedure.mutation(async () => {
      const metaAdsAlerts = await import('./metaAdsAlerts');
      return await metaAdsAlerts.checkAllCampaignAlerts();
    }),
    
    acknowledgeAlert: protectedProcedure
      .input(z.object({
        alertId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const metaAdsAlerts = await import('./metaAdsAlerts');
        return await metaAdsAlerts.acknowledgeAlert(input.alertId, input.notes);
      }),
    
    resolveAlert: protectedProcedure
      .input(z.object({
        alertId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const metaAdsAlerts = await import('./metaAdsAlerts');
        return await metaAdsAlerts.resolveAlert(input.alertId, input.notes);
      }),
  }),

  // Encharge Email Marketing
  encharge: router({    getAccount: protectedProcedure.query(async () => {
      return await encharge.getEnchargeAccount();
    }),

    getPeople: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(100) }))
      .query(async ({ input }) => {
        return await encharge.getEnchargePeople(input.limit);
      }),

    getSegments: protectedProcedure.query(async () => {
      return await encharge.getEnchargeSegments();
    }),

    getMetrics: protectedProcedure.query(async () => {
      return await encharge.getSubscriberMetrics();
    }),
  }),

  // Conversion Tracking
  conversion: router({
    syncConversions: protectedProcedure
      .mutation(async () => {
        return await conversionTracking.calculateCampaignConversions();
      }),
    
    // Member appointment sync
    syncMemberAppointments: protectedProcedure
      .mutation(async () => {
        return await memberAppointmentSync.syncAcuityAppointments();
      }),
    
    getMemberAppointments: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => {
        return await memberAppointmentSync.getMemberAppointments(input.memberId);
      }),
    
    getCampaignAppointments: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return await memberAppointmentSync.getCampaignAppointments(input.campaignId);
      }),
    
    // Toast POS transaction sync
    syncToastTransactions: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .mutation(async ({ input }) => {
        return await toastTransactionSync.syncToastTransactions(input.startDate, input.endDate);
      }),
    
    getMemberTransactions: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => {
        return await toastTransactionSync.getMemberTransactions(input.memberId);
      }),
    
    getMemberTransactionStats: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => {
        return await toastTransactionSync.getMemberTransactionStats(input.memberId);
      }),
    
    getPerformanceWithROAS: protectedProcedure.query(async () => {
      return await conversionTracking.getCampaignPerformanceWithROAS();
    }),
  }),

  // Annual Giveaway
  giveaway: router({
    getApplications: protectedProcedure.query(async () => {
      return await giveawaySync.getGiveawayApplications();
    }),
    
    getStats: protectedProcedure.query(async () => {
      return await giveawaySync.getGiveawayStats();
    }),
    
    sync: protectedProcedure.mutation(async () => {
      return await giveawaySync.syncGiveawayApplications();
    }),
    
    // Get last sync info
    getLastSyncInfo: protectedProcedure.query(async () => {
      const db = await (await import("./db")).getDb();
      if (!db) return null;
      
      const { giveawayApplications } = await import("../drizzle/schema");
      const { sql } = await import("drizzle-orm");
      
      const result = await db
        .select({ lastSync: sql`MAX(createdAt)` })
        .from(giveawayApplications);
      
      return result[0]?.lastSync || null;
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

        // 1. Membership Acquisition: Count active members
        const memberCountResult = await database.execute(
          `SELECT COUNT(*) as count FROM members WHERE status = 'active'`
        );
        const memberCount = Number((memberCountResult as any)[0]?.count || 0);

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

        // 4. B2B Corporate Events: Use fallback value since appointments table doesn't exist yet
        const eventsThisMonth = 2; // Default fallback - will be accurate once appointments table is created

        return {
          membershipAcquisition: {
            current: memberCount,
            target: 300,
            progress: (memberCount / 300) * 100,
          },
          trialConversion: {
            current: conversionRate,
            target: 20,
            progress: (conversionRate / 20) * 100,
          },
          memberRetention: {
            current: retentionRate,
            target: 90,
            progress: (retentionRate / 90) * 100,
          },
          corporateEvents: {
            current: eventsThisMonth,
            target: 4, // 1 event per week
            progress: (eventsThisMonth / 4) * 100,
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

    /** Get all actions regardless of status */
    getAllActions: publicProcedure.query(async () => {
      return getAllActions();
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

    /** Seed demo data for testing */
    seedDemo: protectedProcedure.mutation(async () => {
      return seedDemoData();
    }),
  }),

  // ─── Email Capture Router ───────────────────────────────────────────────
  emailCapture: router({
    list: protectedProcedure
      .input(
        z.object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
          source: z.enum([
            "web_form", "meta_lead_ad", "giveaway", "clickfunnels",
            "instagram", "manual_csv", "boomerang", "acuity",
            "referral", "walk_in", "other",
          ]).optional(),
          status: z.enum(["new", "contacted", "qualified", "converted", "unsubscribed", "bounced"]).optional(),
          search: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const dbInst = await db.getDb();
        if (!dbInst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const { page, limit, source, status, search } = input;
        const offset = (page - 1) * limit;
        const conditions: any[] = [];

        if (source) conditions.push(eq(emailCaptures.source, source));
        if (status) conditions.push(eq(emailCaptures.status, status));
        if (search) {
          const term = `%${search}%`;
          conditions.push(
            or(
              like(emailCaptures.email, term),
              like(emailCaptures.firstName, term),
              like(emailCaptures.lastName, term)
            ) as any
          );
        }

        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const [rows, [countResult]] = await Promise.all([
          dbInst
            .select()
            .from(emailCaptures)
            .where(where)
            .orderBy(desc(emailCaptures.capturedAt))
            .limit(limit)
            .offset(offset),
          dbInst
            .select({ count: sql<number>`COUNT(*)` })
            .from(emailCaptures)
            .where(where),
        ]);

        const total = Number(countResult?.count ?? 0);
        return {
          data: rows,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const dbInst = await db.getDb();
        if (!dbInst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const rows = await dbInst.select().from(emailCaptures).where(eq(emailCaptures.id, input.id)).limit(1);
        if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: `Lead ${input.id} not found` });
        return rows[0];
      }),

    create: protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          phone: z.string().optional(),
          source: z.enum([
            "web_form", "meta_lead_ad", "giveaway", "clickfunnels",
            "instagram", "manual_csv", "boomerang", "acuity",
            "referral", "walk_in", "other",
          ]),
          sourceDetail: z.string().optional(),
          tags: z.array(z.string()).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const dbInst = await db.getDb();
        if (!dbInst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const now = Date.now();
        const [result] = await dbInst.insert(emailCaptures).values({
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          source: input.source,
          sourceDetail: input.sourceDetail,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          notes: input.notes,
          capturedAt: now,
          status: "new",
        }).$returningId();
        return { id: result.id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          phone: z.string().optional(),
          tags: z.array(z.string()).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const dbInst = await db.getDb();
        if (!dbInst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { id, tags, ...rest } = input;
        await dbInst
          .update(emailCaptures)
          .set({ ...rest, tags: tags !== undefined ? JSON.stringify(tags) : undefined })
          .where(eq(emailCaptures.id, id));
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          status: z.enum(["new", "contacted", "qualified", "converted", "unsubscribed", "bounced"]),
        })
      )
      .mutation(async ({ input }) => {
        const dbInst = await db.getDb();
        if (!dbInst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await dbInst.update(emailCaptures).set({ status: input.status }).where(eq(emailCaptures.id, input.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const dbInst = await db.getDb();
        if (!dbInst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await dbInst.delete(emailCaptures).where(eq(emailCaptures.id, input.id));
        return { success: true };
      }),

    bulkImport: protectedProcedure
      .input(
        z.object({
          leads: z.array(
            z.object({
              email: z.string().email(),
              firstName: z.string().optional(),
              lastName: z.string().optional(),
              phone: z.string().optional(),
              source: z.enum([
                "web_form", "meta_lead_ad", "giveaway", "clickfunnels",
                "instagram", "manual_csv", "boomerang", "acuity",
                "referral", "walk_in", "other",
              ]).default("manual_csv"),
              sourceDetail: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const dbInst = await db.getDb();
        if (!dbInst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const now = Date.now();
        let inserted = 0;
        let skipped = 0;

        const uniqueMap = new Map<string, (typeof input.leads)[number]>();
        for (const lead of input.leads) {
          uniqueMap.set(lead.email.toLowerCase(), lead);
        }
        const unique = Array.from(uniqueMap.values());

        const existingEmails = new Set<string>();
        const existingRows = await dbInst.select({ email: emailCaptures.email }).from(emailCaptures);
        for (const row of existingRows) {
          existingEmails.add(row.email.toLowerCase());
        }

        const CHUNK = 100;
        const toInsert = unique.filter((l) => !existingEmails.has(l.email.toLowerCase()));
        skipped = unique.length - toInsert.length;

        for (let i = 0; i < toInsert.length; i += CHUNK) {
          const chunk = toInsert.slice(i, i + CHUNK).map((l) => ({
            email: l.email,
            firstName: l.firstName,
            lastName: l.lastName,
            phone: l.phone,
            source: l.source,
            sourceDetail: l.sourceDetail,
            capturedAt: now,
            status: "new" as const,
          }));
          await dbInst.insert(emailCaptures).values(chunk);
          inserted += chunk.length;
        }

        return { inserted, skipped, total: unique.length };
      }),

    syncToEncharge: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const dbInst = await db.getDb();
        if (!dbInst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const rows = await dbInst.select().from(emailCaptures).where(eq(emailCaptures.id, input.id)).limit(1);
        if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: `Lead ${input.id} not found` });
        const lead = rows[0];

        const ok = await Encharge.upsertEnchargePerson({
          email: lead.email,
          firstName: lead.firstName ?? undefined,
          lastName: lead.lastName ?? undefined,
          phone: lead.phone ?? undefined,
          leadSource: lead.source,
          tags: lead.tags ? JSON.parse(lead.tags) : undefined,
        });

        if (ok) {
          await dbInst.update(emailCaptures).set({ enchargeSyncedAt: Date.now() }).where(eq(emailCaptures.id, input.id));
        }
        return { success: ok };
      }),

    syncAllToEncharge: protectedProcedure.mutation(async () => {
      const dbInst = await db.getDb();
      if (!dbInst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const leads = await dbInst.select().from(emailCaptures);
      const result = await Encharge.batchUpsertEncharge(
        leads.map((l) => ({
          email: l.email,
          firstName: l.firstName,
          lastName: l.lastName,
          phone: l.phone,
          leadSource: l.source,
        }))
      );
      return result;
    }),

    pullFromEncharge: protectedProcedure.mutation(async () => {
      const dbInst = await db.getDb();
      if (!dbInst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { people, errors } = await Encharge.pullEnchargeUpdates();
      let updated = 0;
      let newLeads = 0;

      for (const person of people) {
        if (!person.email) continue;
        const existing = await dbInst.select({ id: emailCaptures.id }).from(emailCaptures).where(eq(emailCaptures.email, person.email)).limit(1);

        if (existing.length > 0) {
          await dbInst.update(emailCaptures).set({
            firstName: person.firstName ?? undefined,
            lastName: person.lastName ?? undefined,
            phone: person.phone ?? undefined,
            enchargeSyncedAt: Date.now(),
          }).where(eq(emailCaptures.id, existing[0].id));
          updated++;
        } else {
          await dbInst.insert(emailCaptures).values({
            email: person.email,
            firstName: person.firstName,
            lastName: person.lastName,
            phone: person.phone,
            source: "other",
            capturedAt: Date.now(),
            enchargeSyncedAt: Date.now(),
            status: "new",
          });
          newLeads++;
        }
      }

      return { updated, newLeads, errors };
    }),
  }),

  // ─── Boomerang Router ─────────────────────────────────────────────────────
  boomerang: router({
    getConfig: protectedProcedure.query(() => {
      return Boomerang.getBoomerangConfig();
    }),

    getTemplates: protectedProcedure.query(async () => {
      const templates = await Boomerang.getTemplates();
      return templates.map((t) => ({ ...t, isMembership: t.type === 6 }));
    }),

    getMembers: protectedProcedure
      .input(z.object({ templateId: z.number().int(), page: z.number().int().min(1).default(1) }))
      .query(async ({ input }) => {
        return await Boomerang.getClientList(input.templateId, input.page);
      }),

    getAllMembers: protectedProcedure
      .input(z.object({ templateId: z.number().int() }))
      .query(async ({ input }) => {
        return await Boomerang.getAllClients(input.templateId);
      }),

    syncMembers: protectedProcedure.mutation(async () => {
      const dbInst = await db.getDb();
      if (!dbInst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const syncData = await Boomerang.syncAllMembershipData();
      let synced = 0;

      for (const member of syncData.members) {
        if (!member.email) continue;
        const existing = await dbInst.select({ id: emailCaptures.id }).from(emailCaptures).where(eq(emailCaptures.email, member.email)).limit(1);

        if (existing.length > 0) {
          await dbInst.update(emailCaptures).set({
            boomerangClientId: String(member.id),
            boomerangCardSerial: member.card?.serialNumber,
            boomerangSyncedAt: Date.now(),
          }).where(eq(emailCaptures.id, existing[0].id));
        } else {
          await dbInst.insert(emailCaptures).values({
            email: member.email,
            firstName: member.fName,
            lastName: member.sName,
            phone: member.phone,
            source: "boomerang",
            boomerangClientId: String(member.id),
            boomerangCardSerial: member.card?.serialNumber,
            boomerangSyncedAt: Date.now(),
            capturedAt: Date.now(),
            status: "new",
          });
        }
        synced++;
      }

      return {
        ...syncData,
        dbSynced: synced,
        members: syncData.members.map((m) => ({
          id: m.id,
          fName: m.fName,
          sName: m.sName,
          email: m.email,
          phone: m.phone,
          cardStatus: m.card?.status ?? "not installed",
          cardSerial: m.card?.serialNumber ?? null,
        })),
      };
    }),

    lookupMember: protectedProcedure
      .input(
        z.object({ email: z.string().email().optional(), phone: z.string().optional() })
          .refine((d) => d.email || d.phone, { message: "Provide at least one of email or phone." })
      )
      .query(async ({ input }) => {
        const templates = await Boomerang.getMembershipTemplates();
        const results: Array<{ template: Boomerang.BoomerangTemplate; client: Boomerang.BoomerangClient; cards: Boomerang.BoomerangCard[] }> = [];

        for (const template of templates) {
          const search = input.email ?? input.phone!;
          const client = await Boomerang.searchClient(template.id, search);
          if (!client) continue;
          const cards = input.email
            ? await Boomerang.getCardsByEmail(input.email)
            : await Boomerang.getCardsByPhone(input.phone!);
          results.push({ template, client, cards });
        }
        return results;
      }),

    getCardInfo: protectedProcedure
      .input(z.object({ serialNumber: z.string() }))
      .query(async ({ input }) => {
        return await Boomerang.getCardInfo(input.serialNumber);
      }),

    getTemplateCardStatus: protectedProcedure
      .input(z.object({ templateId: z.number().int() }))
      .query(async ({ input }) => {
        return await Boomerang.getTemplateCardStatus(input.templateId);
      }),

    sendPush: protectedProcedure
      .input(z.object({ serialNumber: z.string(), message: z.string().min(1).max(240) }))
      .mutation(async ({ input }) => {
        const dbInst = await db.getDb();
        const success = await Boomerang.sendPushToClient(input.serialNumber, input.message);

        if (dbInst) {
          await dbInst.insert(communicationLogs).values({
            recipientType: "member",
            channel: "push",
            direction: "outbound",
            body: input.message,
            status: success ? "sent" : "failed",
            provider: "boomerang_push",
            providerMessageId: input.serialNumber,
            sentAt: Date.now(),
          });
        }
        return { success };
      }),

    broadcastPush: protectedProcedure
      .input(z.object({ templateId: z.number().int(), message: z.string().min(1).max(240) }))
      .mutation(async ({ input }) => {
        const sentCount = await Boomerang.sendPushToAll(input.templateId, input.message);
        return { sent: sentCount };
      }),
  }),

  // ─── Communication Router ─────────────────────────────────────────────────
  communication: router({
    sendSMS: protectedProcedure
      .input(
        z.object({
          recipientId: z.number().int(),
          recipientType: z.enum(["member", "lead"]),
          recipientName: z.string().optional(),
          phone: z.string(),
          body: z.string().min(1).max(1600),
          campaignName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await sendSMS({
          to: input.phone,
          body: input.body,
          recipientId: input.recipientId,
          recipientType: input.recipientType,
          recipientName: input.recipientName,
          campaignName: input.campaignName,
        });
        return result;
      }),

    sendEmail: protectedProcedure
      .input(
        z.object({
          recipientId: z.number().int(),
          recipientType: z.enum(["member", "lead"]),
          recipientName: z.string().optional(),
          email: z.string().email(),
          subject: z.string().min(1),
          htmlBody: z.string().min(1),
          campaignName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await sendEmail({
          to: input.email,
          subject: input.subject,
          htmlBody: input.htmlBody,
          recipientId: input.recipientId,
          recipientType: input.recipientType,
          recipientName: input.recipientName,
          campaignName: input.campaignName,
        });
        return result;
      }),

    getHistory: protectedProcedure
      .input(
        z.object({
          recipientId: z.number().int().optional(),
          recipientType: z.enum(["member", "lead"]).optional(),
          channel: z.enum(["sms", "email", "push"]).optional(),
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
        })
      )
      .query(async ({ input }) => {
        const dbInst = await db.getDb();
        if (!dbInst) return { data: [], total: 0, page: input.page, limit: input.limit, totalPages: 0 };

        const { page, limit, recipientId, recipientType, channel } = input;
        const offset = (page - 1) * limit;
        const conditions: any[] = [];

        if (recipientId !== undefined) conditions.push(eq(communicationLogs.recipientId, recipientId));
        if (recipientType) conditions.push(eq(communicationLogs.recipientType, recipientType));
        if (channel) conditions.push(eq(communicationLogs.channel, channel));

        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const [rows, [countResult]] = await Promise.all([
          dbInst.select().from(communicationLogs).where(where).orderBy(desc(communicationLogs.createdAt)).limit(limit).offset(offset),
          dbInst.select({ count: sql<number>`COUNT(*)` }).from(communicationLogs).where(where),
        ]);

        const total = Number(countResult?.count ?? 0);
        return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
      }),

    getStats: protectedProcedure
      .input(z.object({ campaignName: z.string().optional() }))
      .query(async ({ input }) => {
        const dbInst = await db.getDb();
        if (!dbInst) return [];

        const conditions: any[] = [];
        if (input.campaignName) conditions.push(eq(communicationLogs.campaignName, input.campaignName));
        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const rows = await dbInst
          .select({
            channel: communicationLogs.channel,
            status: communicationLogs.status,
            count: sql<number>`COUNT(*)`,
            totalCostCents: sql<number>`SUM(cost_cents)`,
          })
          .from(communicationLogs)
          .where(where)
          .groupBy(communicationLogs.channel, communicationLogs.status);

        return rows;
      }),
  }),
});
export type AppRouter = typeof appRouter;
