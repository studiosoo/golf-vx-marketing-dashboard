import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as giveawaySync from "../giveawaySync";

export const campaignsAiRouter = router({
  generateInsights: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ input }) => {
      const campaign = await db.getCampaignById(input.campaignId);
      if (!campaign) throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' });
      const { invokeLLM } = await import('../_core/llm');

      const progressPct = campaign.goalTarget && parseFloat(campaign.goalTarget) > 0
        ? Math.min((parseFloat(campaign.goalActual || '0') / parseFloat(campaign.goalTarget)) * 100, 100).toFixed(1)
        : '0.0';
      const daysRunning = campaign.startDate
        ? Math.max(1, Math.floor((Date.now() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 1;
      const budget = parseFloat(campaign.budget || '0');
      const spent = parseFloat(campaign.actualSpend || '0');
      const budgetUtilization = budget > 0 ? ((spent / budget) * 100).toFixed(1) : '0.0';
      const programName = campaign.name || 'Program';
      const goalTarget = campaign.goalTarget ? parseFloat(campaign.goalTarget) : 0;
      const goalActual = campaign.goalActual ? parseFloat(campaign.goalActual) : 0;
      const goalUnit = campaign.goalUnit || 'units';
      const primaryKpi = campaign.primaryKpi || 'Conversion Rate';
      const kpiTarget = campaign.kpiTarget ? parseFloat(campaign.kpiTarget) : 0;
      const kpiActual = campaign.kpiActual ? parseFloat(campaign.kpiActual) : 0;

      const prompt = `You are a senior marketing strategist for Golf VX Arlington Heights, an indoor golf simulator facility in the Chicago suburbs (644 E Rand Rd, Arlington Heights, IL — 25 miles northwest of downtown Chicago).

PROGRAM: ${programName}
Status: ${campaign.status}
Budget: $${budget.toFixed(2)} | Spent: $${spent.toFixed(2)} (${budgetUtilization}% utilized)
Days Running: ${daysRunning}
Goal: ${goalTarget} ${goalUnit} | Actual: ${goalActual} ${goalUnit} (${progressPct}% of goal)
Primary KPI: ${primaryKpi} — Target: ${kpiTarget} | Actual: ${kpiActual}
Description: ${campaign.description || 'No description provided'}

KEY CONTEXT:
- Golf VX is located 25 miles northwest of downtown Chicago in Arlington Heights, IL
- Target audience: young professionals, golf enthusiasts, families in the Chicago suburbs
- Chicago city represents an untapped market — young urban golfers (25-40) who want year-round indoor golf
- Commute from Chicago: 40-50 min via I-90/I-94 or Metra UP-NW line

Provide a comprehensive marketing intelligence report for this program. Include:
1. Executive summary of current performance
2. Key insights and opportunities
3. Meta Ads optimization recommendations (consider geo-targeting Chicago city neighborhoods: Lincoln Park, Wicker Park, River North, West Loop, Logan Square)
4. Multi-channel marketing strategy (email, SMS, social media, in-venue)
5. Content strategy and messaging recommendations
6. Conversion optimization suggestions
7. Specific next 7-day action plan

Respond in JSON with this structure:
{
  "executiveSummary": "2-3 sentence overview",
  "keyInsights": [
    { "insight": "string", "implication": "string", "priority": "high|medium|low" }
  ],
  "chicagoOpportunity": {
    "summary": "Why Chicago city is an untapped market for this program",
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

      return { insights, stats: { goalTarget, goalActual, goalUnit, progressPct: parseFloat(progressPct), budget, spent, budgetUtilization: parseFloat(budgetUtilization), daysRunning } };
    }),

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
    const { invokeLLM } = await import('../_core/llm');
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

  getConversions: protectedProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) return { total: 0, trialCount: 0, driveDayCount: 0, conversions: [] };
    const { giveawayApplications, memberAppointments, members } = await import('../../drizzle/schema');
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
});
