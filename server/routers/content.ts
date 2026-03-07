import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const instagramRouter = router({
  // ── Live Feed (Instagram Graph API) ─────────────────────────────────────
  getFeed: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(12) }))
    .query(async ({ input }) => {
      const { fetchMediaFeed } = await import("../instagramFeed");
      return await fetchMediaFeed(input.limit);
    }),

  getAccountStats: protectedProcedure.query(async () => {
    const { fetchAccountStats } = await import("../instagramFeed");
    return await fetchAccountStats();
  }),

  validateToken: protectedProcedure.query(async () => {
    const { validateToken } = await import("../instagramFeed");
    return await validateToken();
  }),

  // ── Content Scheduler ────────────────────────────────────────────────────
  getScheduledPosts: protectedProcedure
    .input(z.object({ includePosted: z.boolean().default(false) }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const { contentQueue } = await import("../../drizzle/schema");
      const { desc, eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new Error('Database connection failed');
      let q = database.select().from(contentQueue).orderBy(desc(contentQueue.scheduledFor));
      if (!input.includePosted) {
        q = q.where(eq(contentQueue.posted, false)) as any;
      }
      return await q;
    }),

  schedulePost: protectedProcedure
    .input(z.object({
      caption: z.string().min(1),
      hashtags: z.string().default(''),
      imageUrl: z.string().url().optional(),
      imagePrompt: z.string().optional(),
      scheduledFor: z.string(), // ISO datetime string
      contentType: z.enum(['feed_post', 'story', 'reel', 'carousel']).default('feed_post'),
      campaignId: z.string().default('manual'),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { contentQueue } = await import("../../drizzle/schema");
      const database = await getDb();
      if (!database) throw new Error('Database connection failed');
      const [result] = await database.insert(contentQueue).values({
        campaignId: input.campaignId,
        contentType: input.contentType,
        caption: input.caption,
        hashtags: input.hashtags,
        imageUrl: input.imageUrl,
        imagePrompt: input.imagePrompt,
        scheduledFor: new Date(input.scheduledFor),
        posted: false,
      });
      return { success: true, id: (result as any).insertId };
    }),

  deleteScheduledPost: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { contentQueue } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new Error('Database connection failed');
      await database.delete(contentQueue).where(eq(contentQueue.id, input.id));
      return { success: true };
    }),

  publishScheduledPost: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { contentQueue } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const { publishPhotoPost } = await import("../instagramFeed");
      const database = await getDb();
      if (!database) throw new Error('Database connection failed');
      const [post] = await database.select().from(contentQueue).where(eq(contentQueue.id, input.id));
      if (!post) throw new TRPCError({ code: 'NOT_FOUND', message: 'Scheduled post not found' });
      if (!post.imageUrl) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Post requires an image URL to publish' });
      const fullCaption = post.hashtags ? `${post.caption}\n\n${post.hashtags}` : post.caption;
      const igPostId = await publishPhotoPost(post.imageUrl, fullCaption);
      await database.update(contentQueue)
        .set({ posted: true, postedAt: new Date(), instagramPostId: igPostId })
        .where(eq(contentQueue.id, input.id));
      return { success: true, instagramPostId: igPostId };
    }),

  generateCaption: protectedProcedure
    .input(z.object({
      topic: z.string(),
      tone: z.enum(['professional', 'casual', 'exciting', 'educational']).default('casual'),
      includeHashtags: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("../_core/llm");
      const systemPrompt = `You are a social media expert for Golf VX Arlington Heights, a premium indoor golf simulator facility. Generate engaging Instagram captions that drive engagement and bookings.`;
      const userPrompt = `Create an Instagram caption for: "${input.topic}"
Tone: ${input.tone}
Business: Golf VX Arlington Heights - indoor golf simulators, lessons, leagues, events
${input.includeHashtags ? 'Include 10-15 relevant hashtags at the end.' : 'No hashtags needed.'}
Keep the caption under 300 words. Make it engaging and authentic.`;
      const response = await invokeLLM({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] });
      const content = (response.choices[0]?.message?.content ?? '') as string;
      // Split caption and hashtags
      const hashtagMatch = content.match(/(#[\w]+[\s#]*)+$/);
      const hashtags = hashtagMatch ? hashtagMatch[0].trim() : '';
      const caption = hashtags ? content.replace(hashtags, '').trim() : content.trim();
      return { caption, hashtags };
    }),


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

  // ── Token Expiry Check ───────────────────────────────────────────────────
  checkTokenExpiry: protectedProcedure.query(async () => {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN ?? '';
    if (!token) return { valid: false, daysRemaining: 0, expiresAt: null, warning: true };
    try {
      const url = `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`;
      const res = await fetch(url);
      if (!res.ok) return { valid: false, daysRemaining: 0, expiresAt: null, warning: true };
      const data = await res.json() as any;
      const tokenData = data?.data;
      if (!tokenData?.is_valid) return { valid: false, daysRemaining: 0, expiresAt: null, warning: true };
      // expires_at = 0 means never expires (system user token)
      if (!tokenData.expires_at || tokenData.expires_at === 0) {
        return { valid: true, daysRemaining: 999, expiresAt: null, warning: false };
      }
      const expiresAt = new Date(tokenData.expires_at * 1000);
      const daysRemaining = Math.floor((expiresAt.getTime() - Date.now()) / 86400000);
      return { valid: true, daysRemaining, expiresAt: expiresAt.toISOString(), warning: daysRemaining <= 7 };
    } catch {
      // If debug_token fails, just validate by calling the API
      try {
        const { validateToken } = await import('../instagramFeed');
        const result = await validateToken();
        return { valid: result.valid, daysRemaining: result.valid ? 60 : 0, expiresAt: null, warning: false };
      } catch {
        return { valid: false, daysRemaining: 0, expiresAt: null, warning: true };
      }
    }
  }),

  // ── AI Daily Analysis (from live feed) ──────────────────────────────────
  getDailyAnalysis: protectedProcedure.query(async () => {
    const { fetchMediaFeed, fetchAccountStats } = await import('../instagramFeed');
    const { invokeLLM } = await import('../_core/llm');
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Fetch live data
    const [posts, account] = await Promise.all([
      fetchMediaFeed(20),
      fetchAccountStats(),
    ]);

    // Compute post performance metrics
    const totalLikes = posts.reduce((s, p) => s + (p.like_count ?? 0), 0);
    const totalComments = posts.reduce((s, p) => s + (p.comments_count ?? 0), 0);
    const avgLikes = posts.length > 0 ? Math.round(totalLikes / posts.length) : 0;
    const avgComments = posts.length > 0 ? Math.round(totalComments / posts.length) : 0;
    const followers = account.followers_count;
    const avgEngagement = followers > 0 ? (((totalLikes + totalComments) / posts.length) / followers * 100).toFixed(2) : '0';

    // Top 3 posts by engagement
    const topPosts = [...posts]
      .sort((a, b) => (b.like_count + b.comments_count) - (a.like_count + a.comments_count))
      .slice(0, 3)
      .map(p => ({
        caption: p.caption?.slice(0, 120) ?? '(no caption)',
        likes: p.like_count,
        comments: p.comments_count,
        type: p.media_type,
        daysAgo: Math.floor((Date.now() - new Date(p.timestamp).getTime()) / 86400000),
      }));

    // Content type breakdown
    const typeBreakdown = posts.reduce((acc, p) => {
      acc[p.media_type] = (acc[p.media_type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Build AI prompt
    const prompt = `Today is ${today}. You are the Instagram strategist for Golf VX Arlington Heights, a premium indoor golf simulator facility in Arlington Heights, IL.

ACCOUNT SNAPSHOT:
- Followers: ${followers} (Goal: 2,000)
- Total Posts Analyzed: ${posts.length}
- Avg Likes per Post: ${avgLikes}
- Avg Comments per Post: ${avgComments}
- Avg Engagement Rate: ${avgEngagement}%
- Content Mix: ${JSON.stringify(typeBreakdown)}

TOP PERFORMING POSTS (last 20):
${topPosts.map((p, i) => `${i + 1}. [${p.type}] ${p.daysAgo}d ago — ${p.likes} likes, ${p.comments} comments\n   Caption: "${p.caption}"`).join('\n')}

GOLF VX CONTEXT:
- Services: Trial sessions, membership plans, private lessons, leagues, and events
- Current programs: Sunday Drive Day clinics, Winter Clinics, Junior programs
- Target: 25-55 year old golfers in the local area
- Goal: Drive trial session bookings + grow to 2,000 followers

Generate a concise daily Instagram action plan with:
1. ONE specific post idea for today (caption draft + content type + best posting time)
2. Key insight from the performance data (what's working, what's not)
3. One quick win action (under 15 min) to boost engagement today
4. Follower progress note toward 2,000 goal

Return as JSON.`;

    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are an expert Instagram marketing strategist. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'daily_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              todayPostIdea: {
                type: 'object',
                properties: {
                  contentType: { type: 'string' },
                  captionDraft: { type: 'string' },
                  bestTime: { type: 'string' },
                  hashtags: { type: 'string' },
                },
                required: ['contentType', 'captionDraft', 'bestTime', 'hashtags'],
                additionalProperties: false,
              },
              keyInsight: { type: 'string' },
              quickWin: { type: 'string' },
              followerProgress: { type: 'string' },
              engagementScore: { type: 'string' },
            },
            required: ['todayPostIdea', 'keyInsight', 'quickWin', 'followerProgress', 'engagementScore'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== 'string') throw new Error('No AI response');
    const analysis = JSON.parse(content);

    return {
      analysis,
      metrics: {
        followers,
        totalPosts: account.media_count,
        avgLikes,
        avgComments,
        avgEngagement,
        topPosts,
        typeBreakdown,
      },
      generatedAt: new Date().toISOString(),
    };
  }),
});

export const previewRouter = router({
  getDriveDaySessions: protectedProcedure.query(async () => {
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

  getSnapshot: protectedProcedure.query(async () => {
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

// ─── News & Content Manager ───────────────────────────────────────────────────

export const newsRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.enum(["inbox", "in_progress", "published"]).optional() }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const { newsItems } = await import("../../drizzle/schema");
      const { desc, eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new Error("Database connection failed");
      let q = database.select().from(newsItems).orderBy(desc(newsItems.createdAt));
      if (input.status) {
        q = q.where(eq(newsItems.status, input.status)) as any;
      }
      return await q;
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(512),
      source: z.enum(["hq", "studio_soo"]),
      category: z.enum(["blog", "announcement", "promotion", "program", "event"]),
      status: z.enum(["inbox", "in_progress", "published"]),
      notes: z.string().optional(),
      link: z.string().url().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { newsItems } = await import("../../drizzle/schema");
      const database = await getDb();
      if (!database) throw new Error("Database connection failed");
      const now = Date.now();
      const [result] = await database.insert(newsItems).values({
        title: input.title,
        source: input.source,
        category: input.category,
        status: input.status,
        notes: input.notes ?? null,
        link: input.link ?? null,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, id: (result as any).insertId };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["inbox", "in_progress", "published"]),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { newsItems } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new Error("Database connection failed");
      await database.update(newsItems)
        .set({ status: input.status, updatedAt: Date.now() })
        .where(eq(newsItems.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { newsItems } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new Error("Database connection failed");
      await database.delete(newsItems).where(eq(newsItems.id, input.id));
      return { success: true };
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
