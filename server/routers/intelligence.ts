import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { aiRecommendations, userActions, priorities } from "../../drizzle/schema";

export const intelligenceRouter = router({
  getAlerts: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return [];
      const recommendations = await database.select().from(aiRecommendations)
        .where(eq(aiRecommendations.status, "pending"))
        .orderBy(desc(aiRecommendations.priority), desc(aiRecommendations.createdAt));
      return recommendations;
    }),

  markActionComplete: protectedProcedure
    .input(z.object({
      recommendationId: z.number(),
      actionId: z.string(),
      completed: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const recommendation = await database.select().from(aiRecommendations)
        .where(eq(aiRecommendations.id, input.recommendationId))
        .limit(1);
      if (recommendation.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Recommendation not found" });
      const data = JSON.parse(recommendation[0].data as string);
      const actionItems = data.actionItems || [];
      const updatedItems = actionItems.map((item: any) =>
        item.id === input.actionId ? { ...item, completed: input.completed } : item
      );
      await database.update(aiRecommendations)
        .set({ data: JSON.stringify({ ...data, actionItems: updatedItems }) })
        .where(eq(aiRecommendations.id, input.recommendationId));
      await database.insert(userActions).values({
        userId: ctx.user.id,
        recommendationId: input.recommendationId,
        action: input.completed ? "executed" : "modified",
        modificationDetails: JSON.stringify({ actionId: input.actionId, completed: input.completed }),
      });
      return { success: true };
    }),

  dismissAlert: protectedProcedure
    .input(z.object({ recommendationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await database.update(aiRecommendations)
        .set({ status: "rejected" })
        .where(eq(aiRecommendations.id, input.recommendationId));
      await database.insert(userActions).values({
        userId: ctx.user.id,
        recommendationId: input.recommendationId,
        action: "ignored",
        modificationDetails: "User dismissed the alert",
      });
      return { success: true };
    }),

  getDailyBriefing: protectedProcedure.query(async () => {
    return {
      topPriority: null,
      performanceAlerts: [],
      campaignIdeas: [],
      seasonalOpportunities: [],
      competitiveIntel: [],
    };
  }),

  getRecommendation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      throw new TRPCError({ code: "NOT_FOUND", message: "Recommendation not found" });
    }),

  executeRecommendation: protectedProcedure
    .input(z.object({ id: z.number(), modifications: z.any().optional() }))
    .mutation(async ({ input, ctx }) => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Execution not yet implemented" });
    }),

  provideFeedback: protectedProcedure
    .input(z.object({
      id: z.number(),
      action: z.enum(["approved", "rejected", "modified", "ignored"]),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return { success: true };
    }),

  getStrategicKPIs: protectedProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

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
    const memberRow = Array.isArray((memberCountResult as any)[0]) ? (memberCountResult as any)[0][0] : (memberCountResult as any)[0];
    const customerMemberCount = Number(memberRow?.customerMembers || 0);
    const proMemberCount = Number(memberRow?.proMembers || 0);
    const allAccessCount = Number(memberRow?.allAccessCount || 0);
    const swingSaverCount = Number(memberRow?.swingSaverCount || 0);
    const allAccessMRR = parseFloat(memberRow?.allAccessMRR || '0');
    const swingSaverMRR = parseFloat(memberRow?.swingSaverMRR || '0');
    const proMRR = parseFloat(memberRow?.proMRR || '0');
    const totalMRR = allAccessMRR + swingSaverMRR + proMRR;
    const annualMemberCount = Number(memberRow?.annualCount || 0);
    const monthlyMemberCount = Number(memberRow?.monthlyCount || 0);

    const newMembersResult = await database.execute(`
      SELECT
        COUNT(CASE WHEN membershipTier IN ('all_access_aces', 'swing_savers')
          AND joinDate >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as thisMonth,
        COUNT(CASE WHEN membershipTier IN ('all_access_aces', 'swing_savers')
          AND joinDate >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
          AND joinDate < DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as lastMonth
      FROM members WHERE status = 'active'
    `);
    const newMembersRow = Array.isArray((newMembersResult as any)[0]) ? (newMembersResult as any)[0][0] : (newMembersResult as any)[0];
    const newMembersThisMonth = Number(newMembersRow?.thisMonth || 0);
    const newMembersLastMonth = Number(newMembersRow?.lastMonth || 0);
    const MEMBERSHIP_GOAL = 300;

    // Trial Conversion — visitor count (not a percentage rate)
    // Aggregates touchpoints: Sunday Clinic + Winter Clinic + Chicago Golf Show static
    let trialVisitorCount = 30; // Chicago Golf Show 2026 static (verified placeholder)
    let trialIsEstimated = true;
    try {
      const { getSundayClinicData, getWinterClinicData } = await import('../acuity');
      const [sundayData, winterData] = await Promise.all([
        getSundayClinicData(),
        getWinterClinicData(),
      ]);
      trialVisitorCount += sundayData.uniqueAttendees;
      trialVisitorCount += winterData.uniqueStudents;
    } catch {
      // Acuity unavailable — use static count only
    }
    const TRIAL_TARGET_MONTHLY = 50;

    const retentionResult = await database.execute(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active
      FROM members
    `);
    const retentionRow = Array.isArray((retentionResult as any)[0]) ? (retentionResult as any)[0][0] : (retentionResult as any)[0];
    const totalMembers = Number(retentionRow?.total || 1);
    const activeMembers = Number(retentionRow?.active || 0);

    let eventsThisMonth = 0;
    try {
      const { getAppointments } = await import('../acuity');
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const minDate = firstOfMonth.toISOString().split('T')[0];
      const maxDate = now.toISOString().split('T')[0];
      const allAppts = await getAppointments({ minDate, maxDate, canceled: false });
      const b2bKeywords = ['corporate', 'outing', 'group event', 'party', 'league', 'b2b', 'private event', 'team', 'company'];
      const b2bAppts = allAppts.filter((apt: any) => {
        const typeName = (apt.type || '').toLowerCase();
        return b2bKeywords.some((kw: string) => typeName.includes(kw));
      });
      const uniqueEventDates = new Set(b2bAppts.map((apt: any) => apt.date));
      eventsThisMonth = uniqueEventDates.size;
    } catch {
      eventsThisMonth = 0;
    }

    const customerRetentionResult = await database.execute(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' AND membershipTier IN ('all_access_aces', 'swing_savers') THEN 1 END) as activeCustomers
      FROM members
      WHERE membershipTier IN ('all_access_aces', 'swing_savers')
    `);
    const custRetRow = Array.isArray((customerRetentionResult as any)[0]) ? (customerRetentionResult as any)[0][0] : (customerRetentionResult as any)[0];
    const totalCustomers = Number(custRetRow?.total || 1);
    const activeCustomers = Number(custRetRow?.activeCustomers || 0);
    const customerRetentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;

    return {
      membershipAcquisition: {
        current: customerMemberCount,
        target: MEMBERSHIP_GOAL,
        remaining: Math.max(0, MEMBERSHIP_GOAL - customerMemberCount),
        acquisitionGoal: Math.max(0, MEMBERSHIP_GOAL - customerMemberCount),
        progress: Math.min((customerMemberCount / MEMBERSHIP_GOAL) * 100, 100),
        breakdown: { allAccess: allAccessCount, swingSaver: swingSaverCount },
        newThisMonth: newMembersThisMonth,
        newLastMonth: newMembersLastMonth,
        mrr: { allAccess: allAccessMRR, swingSaver: swingSaverMRR, total: allAccessMRR + swingSaverMRR },
        paymentBreakdown: { monthly: monthlyMemberCount, annual: annualMemberCount },
      },
      memberRetention: {
        current: customerRetentionRate,
        target: 95,
        retentionRate: customerRetentionRate,
        progress: Math.min((customerRetentionRate / 95) * 100, 100),
        breakdown: { allAccess: allAccessCount, swingSaver: swingSaverCount },
        memberCount: customerMemberCount,
        totalCustomers: totalCustomers,
        modelUnderReview: true,
      },
      proMembers: {
        current: proMemberCount,
        label: "Golf VX Pro (Coaches)",
        mrr: proMRR,
      },
      totalMRR: totalMRR,
      trialConversion: {
        current: trialVisitorCount,
        target: TRIAL_TARGET_MONTHLY,
        progress: Math.min((trialVisitorCount / TRIAL_TARGET_MONTHLY) * 100, 200),
        isEstimated: trialIsEstimated,
        isCount: true,
      },
      corporateEvents: {
        current: eventsThisMonth > 0 ? eventsThisMonth : 2,
        target: 4,
        progress: Math.min(((eventsThisMonth > 0 ? eventsThisMonth : 2) / 4) * 100, 100),
        isEstimated: eventsThisMonth === 0,
      },
    };
  }),

  generateReport: protectedProcedure.mutation(async () => {
    const marketingIntelligence = await import("../marketingIntelligence");
    const performanceData = await marketingIntelligence.getMultiChannelPerformance(30);
    const analysis = await marketingIntelligence.analyzePerformanceWithGemini(performanceData);
    return { performanceData, analysis, generatedAt: new Date().toISOString() };
  }),

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
      const marketingIntelligence = await import("../marketingIntelligence");
      const performanceData = await marketingIntelligence.getMultiChannelPerformance(30);
      const ideas = await marketingIntelligence.generateCampaignIdeas(
        performanceData,
        input.focus,
        input.constraints
      );
      return ideas;
    }),

  triggerDailySnapshot: protectedProcedure.mutation(async () => {
    const { runDailySnapshot } = await import("../jobs/dailySnapshot");
    return await runDailySnapshot();
  }),

  getCampaignHistory: protectedProcedure
    .input(z.object({ campaignId: z.number(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      const { campaignMetrics } = await import("../../drizzle/schema");
      const { eq: eqOp, desc: descOp } = await import("drizzle-orm");
      const metrics = await database.select().from(campaignMetrics)
        .where(eqOp(campaignMetrics.campaignId, input.campaignId))
        .orderBy(descOp(campaignMetrics.snapshotDate));
      return metrics;
    }),

  generateActionPlan: protectedProcedure
    .input(z.object({
      timeframe: z.enum(["week", "month"]).default("week"),
      focus: z.enum(["all", "membership", "meta_ads", "programs", "retention"]).default("all"),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM, LLM_MODELS } = await import("../_core/llm");
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
        model: LLM_MODELS.structured,
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
});

export const researchRouter = router({
  list: protectedProcedure.query(async () => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return [];
    const { marketResearchReports } = await import("../../drizzle/schema");
    const { desc: descOp } = await import("drizzle-orm");
    return drizzleDb.select().from(marketResearchReports).orderBy(descOp(marketResearchReports.createdAt));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { marketResearchReports } = await import("../../drizzle/schema");
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
      const { marketResearchReports } = await import("../../drizzle/schema");
      const [inserted] = await drizzleDb.insert(marketResearchReports).values({
        title: input.title,
        topic: input.topic,
        category: input.category,
        status: "generating",
        generatedBy: "ai",
      });
      const reportId = (inserted as any).insertId as number;
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
        const { invokeLLM } = await import("../_core/llm");
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
      const { marketResearchReports } = await import("../../drizzle/schema");
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
      const { marketResearchReports } = await import("../../drizzle/schema");
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
      const { invokeLLM } = await import("../_core/llm");
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
      const { marketResearchReports } = await import("../../drizzle/schema");
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
});

export const workspaceRouter = router({
  chat: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })),
      context: z.enum(["general", "programs", "members", "meta_ads", "revenue"]).optional().default("general"),
      // Optional file attachment for the latest user message
      fileDataUrl: z.string().optional(),    // image base64 data URL
      fileUri: z.string().optional(),        // Gemini File API URI
      fileMimeType: z.string().optional(),
      fileType: z.enum(["image", "gemini"]).optional(),
      fileName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM, LLM_MODELS } = await import("../_core/llm");
      const { context } = input;
      let contextData = "";
      try {
        const database = await db.getDb();
        if (database) {
          // Base metrics — always included
          const [memberResult, campaignResult] = await Promise.all([
            database.execute(
              `SELECT COUNT(*) as total,
               SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN membershipTier IN ('all_access_aces','swing_savers') AND status='active' THEN 1 ELSE 0 END) as customerMembers,
               SUM(CASE WHEN membershipTier='pro_members' AND status='active' THEN 1 ELSE 0 END) as proMembers
               FROM members`
            ),
            database.execute(
              `SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
               SUM(budget) as totalBudget, SUM(actualSpend) as totalSpend, SUM(actualRevenue) as totalRevenue
               FROM campaigns`
            ),
          ]);
          const m = (memberResult as any)[0];
          const c = (campaignResult as any)[0];
          // Toast POS MTD — always include for full revenue context
          let toastCtx = "";
          try {
            const toastResult = await database.execute(
              `SELECT SUM(bayRevenue) as bayMtd, SUM(foodBevRevenue) as fnbMtd, SUM(totalRevenue) as totalMtd
               FROM toastDailySummary WHERE date >= DATE_FORMAT(NOW(), '%Y-%m-01')`
            );
            const t = (toastResult as any)[0];
            if (t?.totalMtd > 0) {
              toastCtx = `\n- Toast POS MTD: $${Number(t.totalMtd || 0).toFixed(0)} total (Bay Rental: $${Number(t.bayMtd || 0).toFixed(0)}, F&B: $${Number(t.fnbMtd || 0).toFixed(0)})`;
            }
          } catch (_) {}
          contextData = `\nLive Golf VX Arlington Heights snapshot:\n- Customer members: ${m?.customerMembers || 0} / 300 goal (${m?.proMembers || 0} Pro)\n- Active campaigns: ${c?.active || 0} of ${c?.total || 0}\n- Marketing spend: $${Number(c?.totalSpend || 0).toFixed(0)} / $${Number(c?.totalBudget || 0).toFixed(0)} budget\n- Total program revenue tracked: $${Number(c?.totalRevenue || 0).toFixed(0)}${toastCtx}`;

          // Context-specific data enrichment
          if (context === "members") {
            const tierResult = await database.execute(
              `SELECT membershipTier, COUNT(*) as count FROM members WHERE status='active' GROUP BY membershipTier ORDER BY count DESC LIMIT 10`
            );
            const tiers = (tierResult as any[]).map((r: any) => `${r.membershipTier}: ${r.count}`).join(", ");
            contextData += `\n- Member tiers: ${tiers}`;
          } else if (context === "programs") {
            const programResult = await database.execute(
              `SELECT name, status, actualRevenue, actualSpend FROM campaigns WHERE status IN ('active','paused') ORDER BY actualRevenue DESC LIMIT 8`
            );
            const programs = (programResult as any[]).map((p: any) =>
              `${p.name} [${p.status}] rev=$${Number(p.actualRevenue || 0).toFixed(0)} spend=$${Number(p.actualSpend || 0).toFixed(0)}`
            ).join("\n  ");
            contextData += `\n- Programs:\n  ${programs}`;
          } else if (context === "revenue") {
            const revenueResult = await database.execute(
              `SELECT SUM(mrr) as totalMrr FROM membershipSnapshots ORDER BY snapshotDate DESC LIMIT 1`
            );
            const rev = (revenueResult as any)[0];
            contextData += `\n- Monthly Recurring Revenue (MRR): $${Number(rev?.totalMrr || 0).toFixed(0)}`;
            try {
              const lastMonthResult = await database.execute(
                `SELECT SUM(bayRevenue) as bay, SUM(foodBevRevenue) as fnb, SUM(totalRevenue) as total
                 FROM toastDailySummary
                 WHERE date >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
                   AND date < DATE_FORMAT(NOW(), '%Y-%m-01')`
              );
              const lm = (lastMonthResult as any)[0];
              if (lm?.total > 0) {
                contextData += `\n- Toast Last Month: $${Number(lm.total).toFixed(0)} (Bay: $${Number(lm.bay || 0).toFixed(0)}, F&B: $${Number(lm.fnb || 0).toFixed(0)})`;
              }
            } catch (_) {}
          } else if (context === "meta_ads") {
            const adsResult = await database.execute(
              `SELECT name, actualSpend, impressions, clicks FROM campaigns WHERE metaAdsCampaignId IS NOT NULL AND status='active' ORDER BY actualSpend DESC LIMIT 6`
            );
            const ads = (adsResult as any[]).map((a: any) => {
              const ctr = a.impressions > 0 ? ((a.clicks / a.impressions) * 100).toFixed(2) : "0.00";
              return `${a.name}: spend=$${Number(a.actualSpend || 0).toFixed(0)} CTR=${ctr}%`;
            }).join("\n  ");
            contextData += `\n- Active Meta Ads campaigns:\n  ${ads || "No active Meta campaigns"}`;
          }
        }
      } catch (_) {}

      const systemPrompt = `You are the Golf VX Arlington Heights AI Marketing Assistant — a strategic partner for the Studio Soo marketing team. You help analyze performance, suggest marketing actions, draft content, and provide actionable recommendations.${contextData}

Active strategic focus areas: Trial Conversion, Membership Acquisition (goal: 300 members), Member Retention, B2B/Corporate Sales.
Studio Soo's primary channels: Meta Ads → ClickFunnels landing pages → Acuity bookings. Toast POS for revenue. Encharge for email.

When the user provides data (e.g., "Drive Day had 12 attendees"), acknowledge it, suggest a follow-up action, and offer to draft content. Be concise and specific. Use numbers. Keep responses under 400 words unless more depth is explicitly requested.`;

      const model = LLM_MODELS.chat;

      // If image attached, build multipart last user message
      if (input.fileType === "image" && input.fileDataUrl) {
        const priorMessages = input.messages.slice(0, -1);
        const lastMsg = input.messages[input.messages.length - 1];
        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...priorMessages.map(msg => ({ role: msg.role as "user" | "assistant" | "system", content: msg.content })),
          {
            role: "user" as const,
            content: [
              { type: "image_url" as const, image_url: { url: input.fileDataUrl, detail: "high" as const } },
              { type: "text" as const, text: lastMsg?.content || "Please analyze this image." },
            ],
          },
        ];
        const response = await invokeLLM({ messages, model });
        const rawContent = response.choices?.[0]?.message?.content;
        const reply = typeof rawContent === "string" ? rawContent : (Array.isArray(rawContent) ? rawContent.map((c: any) => c.text || "").join("") : "I couldn't generate a response.");
        return { reply, model };
      }

      // Standard text chat
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...input.messages.map(msg => ({ role: msg.role as "user" | "assistant" | "system", content: msg.content })),
      ];
      const response = await invokeLLM({ messages, model });
      const reply = response.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
      return { reply, model };
    }),

  getSuggestedPrompts: protectedProcedure.query(async () => {
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
});

export const aiWorkspaceRouter = router({
  // Returns active model names based on current env config
  getModelConfig: protectedProcedure.query(async () => {
    const { LLM_MODELS } = await import("../_core/llm");
    const { ENV } = await import("../_core/env");
    return {
      chat: LLM_MODELS.chat,
      analysis: ENV.anthropicApiKey ? "claude-sonnet-4-6" : LLM_MODELS.analysis,
      structured: LLM_MODELS.structured,
    };
  }),

  // ── File upload ──────────────────────────────────────────────────────────────
  uploadFile: protectedProcedure
    .input(z.object({
      base64: z.string().max(80_000_000), // ~60MB file max
      mimeType: z.string().max(128),
      fileName: z.string().max(256),
    }))
    .mutation(async ({ input }) => {
      const { mimeType, fileName, base64 } = input;
      const isImage = mimeType.startsWith("image/");
      const isText =
        mimeType.startsWith("text/") ||
        ["application/json", "application/csv"].includes(mimeType);

      // Images → return as data URL (used as image_url in LLM messages)
      if (isImage) {
        return {
          fileType: "image" as const,
          dataUrl: `data:${mimeType};base64,${base64}`,
          fileName,
          mimeType,
        };
      }

      // Plain text files → decode and return extracted text
      if (isText) {
        const extractedText = Buffer.from(base64, "base64").toString("utf-8");
        return {
          fileType: "text" as const,
          extractedText: extractedText.slice(0, 100_000), // cap at 100k chars
          fileName,
          mimeType,
        };
      }

      // PDFs and other binary files → upload to Gemini File API
      const { ENV } = await import("../_core/env");
      if (!ENV.geminiApiKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "PDF/binary uploads require GEMINI_API_KEY to be configured.",
        });
      }
      const { uploadFileToGemini } = await import("../_core/geminiFile");
      const geminiFile = await uploadFileToGemini(base64, mimeType, fileName);
      return {
        fileType: "gemini" as const,
        fileUri: geminiFile.uri,
        fileName,
        mimeType,
      };
    }),

  // ── Analyze ──────────────────────────────────────────────────────────────────
  analyze: protectedProcedure
    .input(z.object({
      content: z.string().max(50000).default(""),
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
      // File attachment (mutually exclusive)
      fileUri: z.string().optional(),       // Gemini File API URI (PDFs, video, audio)
      fileMimeType: z.string().optional(),  // required with fileUri
      fileDataUrl: z.string().optional(),   // base64 data URL (images)
      fileType: z.enum(["gemini", "image", "text"]).optional(),
      fileName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM, LLM_MODELS } = await import("../_core/llm");
      const { ENV } = await import("../_core/env");
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

      const fileLabel = input.fileName ? `[Attached file: ${input.fileName}]\n\n` : "";
      const contentSection = input.content.trim()
        ? `CONTENT TO ANALYZE:\n${input.content}`
        : "Please analyze the attached file.";
      const userPrompt = input.customPrompt
        ? `${fileLabel}${input.customPrompt}\n\n---\n\n${contentSection}`
        : `${fileLabel}Please analyze the following and provide a structured response with these sections:\n\n## Executive Summary\n(2-3 sentences capturing the key takeaway)\n\n## Key Insights\n(3-5 specific, data-driven observations)\n\n## Recommended Actions\n(Prioritized list of specific, actionable steps with owner and timeline)\n\n## KPIs to Track\n(Measurable success metrics with target values where possible)\n\n## Risks & Considerations\n(What to watch out for, potential downsides)\n\n---\n\n${contentSection}`;

      // Claude is preferred for deep analysis when ANTHROPIC_API_KEY is set (text-only paths)
      const useClaudeForText = Boolean(ENV.anthropicApiKey);
      const geminiModel = LLM_MODELS.analysis;
      const model = useClaudeForText ? "claude-sonnet-4-6" : geminiModel;

      // Path A: Gemini File API URI → native generateContent (PDF, video, audio)
      // Always uses Gemini — Gemini File API is Gemini-specific
      if (input.fileType === "gemini" && input.fileUri && input.fileMimeType) {
        const { generateContentWithFile } = await import("../_core/geminiFile");
        const text = await generateContentWithFile({
          model: geminiModel,
          systemPrompt,
          userPrompt,
          fileUri: input.fileUri,
          mimeType: input.fileMimeType,
        });
        return { analysis: text, analysisType: input.analysisType, model: geminiModel };
      }

      // Path B: Image data URL → image_url content type (Gemini only)
      if (input.fileType === "image" && input.fileDataUrl) {
        const response = await invokeLLM({
          model: geminiModel,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: input.fileDataUrl, detail: "high" } },
                { type: "text", text: userPrompt },
              ],
            },
          ],
        });
        const rawContent = response?.choices?.[0]?.message?.content;
        const result = typeof rawContent === "string" ? rawContent : (Array.isArray(rawContent) ? rawContent.map((c: any) => c.text || "").join("") : "No response generated.");
        return { analysis: result, analysisType: input.analysisType, model: geminiModel };
      }

      // Path C: Text content — use Claude when available, otherwise Gemini
      if (useClaudeForText) {
        const { invokeClaudeLLM } = await import("../_core/claude");
        const response = await invokeClaudeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }, model);
        const rawContent = response.choices[0]?.message?.content ?? "";
        const result = typeof rawContent === "string" ? rawContent : "No response generated.";
        return { analysis: result, analysisType: input.analysisType, model: response.model };
      }

      const response = await invokeLLM({
        model: geminiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      const rawContent = response?.choices?.[0]?.message?.content;
      const result = typeof rawContent === "string" ? rawContent : (Array.isArray(rawContent) ? rawContent.map((c: any) => c.text || "").join("") : "No response generated.");
      return { analysis: result, analysisType: input.analysisType, model: geminiModel };
    }),
});

export const prioritiesRouter = router({
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
});
