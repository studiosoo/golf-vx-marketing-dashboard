import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import * as giveawaySync from "../giveawaySync";
import { syncGiveawayFromSheets } from "../googleSheetsSync";

export const anniversaryGiveawayRouter = router({
  submitEntry: publicProcedure
    .input(z.object({
      firstName: z.string().min(1),
      email: z.string().email(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ipAddress = ctx.req.headers["x-forwarded-for"] || ctx.req.socket.remoteAddress;
      const userAgent = ctx.req.headers["user-agent"];
      const entry = await db.createGiveawayEntry({
        firstName: input.firstName,
        email: input.email,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress?.[0],
        userAgent,
      });
      const { appendToGoogleSheet } = await import("../googleSheets");
      await appendToGoogleSheet("Entry", {
        timestamp: new Date().toISOString(),
        firstName: input.firstName,
        email: input.email,
      });
      return { success: true, entryId: entry.id };
    }),

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
      const entry = await db.updateGiveawayEntry({
        ...input,
        interests: input.interests ? JSON.stringify(input.interests) : undefined,
        visitPurpose: input.visitPurpose ? JSON.stringify(input.visitPurpose) : undefined,
        stayConnected: input.stayConnected ? JSON.stringify(input.stayConnected) : undefined,
        hearAbout: input.hearAbout ? JSON.stringify(input.hearAbout) : undefined,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress?.[0],
        userAgent,
      });
      const { appendToGoogleSheet } = await import("../googleSheets");
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
});

export const giveawayRouter = router({
  getApplications: protectedProcedure.query(async () => {
    return await giveawaySync.getGiveawayApplications();
  }),

  getStats: protectedProcedure.query(async () => {
    return await giveawaySync.getGiveawayStats();
  }),

  getLastSyncInfo: protectedProcedure.query(async () => {
    const { getGiveawayCount } = await import('../googleSheetsSync');
    const database = await db.getDb();
    const count = await getGiveawayCount();
    let lastSyncedAt: string | null = null;
    if (database) {
      const { giveawayApplications: appsTable } = await import('../../drizzle/schema');
      const { desc: descOp, isNotNull: isNotNullOp } = await import('drizzle-orm');
      const [latest] = await database
        .select({ lastSyncedAt: appsTable.lastSyncedAt })
        .from(appsTable)
        .where(isNotNullOp(appsTable.lastSyncedAt))
        .orderBy(descOp(appsTable.lastSyncedAt))
        .limit(1);
      lastSyncedAt = latest?.lastSyncedAt ? new Date(latest.lastSyncedAt as any).toISOString() : null;
    }
    return { count, lastChecked: new Date().toISOString(), lastSyncedAt, source: 'database' };
  }),

  getTimeline: protectedProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) return [];
    const { giveawayApplications: appsTable } = await import('../../drizzle/schema');
    const { eq: eqOp, isNotNull: isNotNullOp, asc: ascOp } = await import('drizzle-orm');
    const rows = await database
      .select({ submissionTimestamp: appsTable.submissionTimestamp })
      .from(appsTable)
      .where(eqOp(appsTable.isTestEntry, false))
      .orderBy(ascOp(appsTable.submissionTimestamp));
    // Group by date (YYYY-MM-DD)
    const counts: Record<string, number> = {};
    for (const row of rows) {
      if (!row.submissionTimestamp) continue;
      const d = new Date(row.submissionTimestamp as any);
      if (isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      counts[key] = (counts[key] || 0) + 1;
    }
    // Return sorted array with running total
    const sorted = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
    let cumulative = 0;
    return sorted.map(([date, count]) => {
      cumulative += count;
      return { date, count, cumulative };
    });
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

  sync: protectedProcedure.mutation(async () => {
    return await syncGiveawayFromSheets();
  }),

  syncToEncharge: protectedProcedure
    .input(z.object({
      applicantIds: z.array(z.number()),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { upsertEnchargePerson } = await import('../enchargeSync');
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const { giveawayApplications } = await import('../../drizzle/schema');
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

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['pending', 'contacted', 'scheduled', 'completed', 'declined']),
    }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const { giveawayApplications } = await import('../../drizzle/schema');
      const { eq: eqOp } = await import('drizzle-orm');
      await database.update(giveawayApplications)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eqOp(giveawayApplications.id, input.id));
      return { success: true };
    }),

  checkVisitHistory: protectedProcedure
    .input(z.object({ applicantId: z.number() }))
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return { hasVisited: false, visitCount: 0, lastVisit: null, selfReported: 'Unknown', memberStatus: null, memberTier: null };
      const { giveawayApplications, memberAppointments, members } = await import('../../drizzle/schema');
      const { eq: eqOp, desc: descOp } = await import('drizzle-orm');
      const [app] = await database.select().from(giveawayApplications).where(eqOp(giveawayApplications.id, input.applicantId)).limit(1);
      if (!app) return { hasVisited: false, visitCount: 0, lastVisit: null, selfReported: 'Unknown', memberStatus: null, memberTier: null };
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
        memberTier = member.membershipTier || null;
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

  generateEmailDraft: protectedProcedure
    .input(z.object({ applicantId: z.number() }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const { giveawayApplications } = await import('../../drizzle/schema');
      const { eq: eqOp } = await import('drizzle-orm');
      const { invokeLLM } = await import('../_core/llm');
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

  generateProgramInsights: protectedProcedure
    .input(z.object({ programId: z.number().optional() }))
    .mutation(async () => {
      const stats = await giveawaySync.getGiveawayStats();
      const { invokeLLM } = await import('../_core/llm');
      const entryGoal = 1500;
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

  generateGiveawaySummary: protectedProcedure
    .mutation(async () => {
      try {
        const stats = await giveawaySync.getGiveawayStats();
        const { invokeLLM } = await import('../_core/llm');
        const total = stats.totalApplications || 0;
        const ageBreakdown = Object.entries(stats.ageRangeDistribution || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No data';
        const genderBreakdown = Object.entries(stats.genderDistribution || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No data';
        const hearBreakdown = Object.entries(stats.howDidTheyHearDistribution || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No data';
        const dateBreakdown = (stats.applicationsByDate || []).map((d: { date: string; count: number }) => `${d.date}: ${d.count}`).join(', ') || 'No data';
        const prompt = `You are a marketing analyst for Golf VX Arlington Heights, an indoor golf simulator facility.

ANNUAL MEMBERSHIP GIVEAWAY 2026 DATA:
Total applications: ${total}
Age distribution: ${ageBreakdown}
Gender: ${genderBreakdown}
How they heard about us: ${hearBreakdown}
Applications by date: ${dateBreakdown}

Please analyze this data and answer two questions:
(a) What patterns do you observe that would inform winner selection? Consider demographics, acquisition channels, and any notable trends.
(b) Based on the application rate over time, should the application period be extended? Provide a clear recommendation with reasoning.

Provide a concise, actionable summary in 3-4 paragraphs.`;
        const response = await invokeLLM({
          model: 'gpt-4.1',
          messages: [
            { role: 'system', content: 'You are a marketing analyst. Provide clear, concise analysis.' },
            { role: 'user', content: prompt },
          ],
        });
        const raw = response?.choices?.[0]?.message?.content;
        const summary = typeof raw === 'string' ? raw : 'Unable to generate summary.';
        return { summary };
      } catch {
        return { summary: 'Unable to generate summary.' };
      }
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
    }))
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return { applications: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };
      const { giveawayApplications } = await import('../../drizzle/schema');
      const { eq: eqOp, and: andOp } = await import('drizzle-orm');
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
      const sortBy = input?.sortBy || 'submissionTimestamp';
      const sortDir = input?.sortDir || 'desc';
      filtered.sort((a: any, b: any) => {
        const av = a[sortBy] ?? '';
        const bv = b[sortBy] ?? '';
        return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
      const page = input?.page || 1;
      const pageSize = input?.pageSize || 50;
      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize);
      const applications = filtered.slice((page - 1) * pageSize, page * pageSize);
      return { applications, total, page, pageSize, totalPages };
    }),
});
