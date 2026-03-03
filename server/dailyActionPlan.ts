import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { dailyActionPlans, campaignActions, contentQueue, boostSchedule } from "../drizzle/schema";
import { sql, eq, and } from "drizzle-orm";

interface CampaignPerformanceData {
  metaAds: {
    spend: number;
    impressions: number;
    clicks: number;
    applications: number;
    ctr: number;
    cpc: number;
    cpa: number;
  };
  instagram: {
    reach: number;
    engagement: number;
    followerGrowth: number;
    topPosts: Array<{ id: string; caption: string; likes: number; comments: number }>;
  };
  email: {
    sent: number;
    opens: number;
    clicks: number;
    conversions: number;
    openRate: number;
    clickRate: number;
  };
  landingPage: {
    visits: number;
    bounceRate: number;
    conversionRate: number;
    avgTimeOnPage: number;
  };
  applicants: {
    total: number;
    converted: number;
    conversionRate: number;
  };
}

interface DailyAction {
  type: "meta_ads" | "content" | "boost" | "email" | "conversion";
  priority: "urgent" | "high" | "medium" | "low";
  title: string;
  description: string;
  expectedImpact: string;
  effortRequired: string;
  executionData: any;
}

/**
 * Generate daily action plan for a campaign using Gemini AI
 */
export async function generateDailyActionPlan(
  campaignId: string,
  performanceData: CampaignPerformanceData
): Promise<{ planId: number; actions: DailyAction[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Build AI prompt with performance data
  const prompt = `You are a marketing strategist for Golf VX's Annual Giveaway campaign.
Analyze yesterday's performance across all channels and generate today's action plan.

**Yesterday's Performance:**

Meta Ads:
- Spend: $${performanceData.metaAds.spend}
- Impressions: ${performanceData.metaAds.impressions}
- Clicks: ${performanceData.metaAds.clicks}
- Applications: ${performanceData.metaAds.applications}
- CTR: ${performanceData.metaAds.ctr}%
- CPC: $${performanceData.metaAds.cpc}
- Cost per Application: $${performanceData.metaAds.cpa}

Instagram:
- Reach: ${performanceData.instagram.reach}
- Engagement: ${performanceData.instagram.engagement}
- Follower Growth: ${performanceData.instagram.followerGrowth}
- Top Posts: ${performanceData.instagram.topPosts.map(p => `"${p.caption}" (${p.likes} likes, ${p.comments} comments)`).join(", ")}

Email Marketing:
- Sent: ${performanceData.email.sent}
- Opens: ${performanceData.email.opens} (${performanceData.email.openRate}%)
- Clicks: ${performanceData.email.clicks} (${performanceData.email.clickRate}%)
- Conversions: ${performanceData.email.conversions}

Landing Page:
- Visits: ${performanceData.landingPage.visits}
- Bounce Rate: ${performanceData.landingPage.bounceRate}%
- Conversion Rate: ${performanceData.landingPage.conversionRate}%
- Avg Time on Page: ${performanceData.landingPage.avgTimeOnPage}s

Current Status:
- Total Applicants: ${performanceData.applicants.total}
- Converted to Members: ${performanceData.applicants.converted}
- Conversion Rate: ${performanceData.applicants.conversionRate}%

**Your Task:**
Generate 5-8 specific actions for today covering:
1. Meta Ads adjustments (budget, targeting, creative)
2. Instagram content to post (with captions, hashtags, posting time)
3. Which posts to boost and with what budget
4. Email follow-ups to send
5. Landing page optimizations to test

**For each action, provide:**
- Type: meta_ads | content | boost | email | conversion
- Priority: urgent | high | medium | low
- Title: Short action title (max 60 chars)
- Description: Detailed explanation (2-3 sentences)
- Expected Impact: Quantified outcome (e.g., "5-10 conversions", "500+ reach")
- Effort Required: Time estimate (e.g., "5min", "30min", "2hours")
- Execution Data: JSON object with action-specific parameters

**Execution Data Examples:**

For meta_ads type:
{
  "action": "reduce_budget" | "pause_ad" | "increase_budget",
  "campaignId": "string",
  "newBudget": number,
  "reason": "string"
}

For content type:
{
  "contentType": "feed_post" | "story" | "reel",
  "caption": "string",
  "hashtags": "string",
  "imagePrompt": "string (for AI image generation)",
  "scheduledFor": "HH:MM" (24h format),
  "cta": "string"
}

For boost type:
{
  "postId": "string",
  "postUrl": "string",
  "budget": number,
  "duration": number (hours),
  "targetAudience": {
    "location": "string",
    "radius": number (miles),
    "ageMin": number,
    "ageMax": number,
    "interests": ["string"]
  }
}

For email type:
{
  "templateName": "string",
  "segmentId": "string",
  "subject": "string",
  "preview": "string",
  "sendTime": "HH:MM"
}

For conversion type:
{
  "testType": "headline" | "cta" | "form" | "social_proof",
  "currentVersion": "string",
  "testVersion": "string",
  "hypothesis": "string"
}

**Response Format (JSON only, no markdown):**
{
  "analysis": "Brief 2-3 sentence summary of yesterday's performance and today's focus",
  "actions": [
    {
      "type": "meta_ads",
      "priority": "urgent",
      "title": "Reduce Meta Ads Daily Budget",
      "description": "Current $7.50/day spend is too high for lead-building phase. Reduce to $3-5 to build lead list while optimizing landing page.",
      "expectedImpact": "Save $50/week, maintain 3-5 applications/day",
      "effortRequired": "5min",
      "executionData": { ... }
    },
    ...
  ]
}`;

  // Call Gemini AI
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a marketing strategist. Always respond with valid JSON only, no markdown formatting.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "daily_action_plan",
        strict: true,
        schema: {
          type: "object",
          properties: {
            analysis: { type: "string" },
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["meta_ads", "content", "boost", "email", "conversion"] },
                  priority: { type: "string", enum: ["urgent", "high", "medium", "low"] },
                  title: { type: "string" },
                  description: { type: "string" },
                  expectedImpact: { type: "string" },
                  effortRequired: { type: "string" },
                  executionData: { type: "object", additionalProperties: true },
                },
                required: ["type", "priority", "title", "description", "expectedImpact", "effortRequired", "executionData"],
                additionalProperties: false,
              },
            },
          },
          required: ["analysis", "actions"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Invalid AI response");
  }

  const aiResponse = JSON.parse(content);

  // Save to database
  const [plan] = await db.insert(dailyActionPlans).values({
    campaignId,
    date: new Date(),
    generatedAt: new Date(),
    aiAnalysis: aiResponse.analysis,
    totalActions: aiResponse.actions.length,
    completedActions: 0,
  });

  const planId = plan.insertId;

  // Save actions
  for (const action of aiResponse.actions) {
    await db.insert(campaignActions).values({
      planId,
      type: action.type,
      priority: action.priority,
      title: action.title,
      description: action.description,
      expectedImpact: action.expectedImpact,
      effortRequired: action.effortRequired,
      status: "pending",
      executionData: action.executionData,
    });
  }

  return {
    planId,
    actions: aiResponse.actions,
  };
}

/**
 * Get today's action plan for a campaign
 */
export async function getTodayActionPlan(campaignId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const plans = await db
    .select()
    .from(dailyActionPlans)
    .where(and(
      eq(dailyActionPlans.campaignId, campaignId),
      sql`DATE(${dailyActionPlans.date}) = DATE(${today})`
    ))
    .limit(1);

  if (plans.length === 0) return null;

  const plan = plans[0];
  const actions = await db
    .select()
    .from(campaignActions)
    .where(eq(campaignActions.planId, plan.id));

  return {
    ...plan,
    actions,
  };
}

/**
 * Mark action as completed
 */
export async function completeAction(actionId: number, result?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(campaignActions)
    .set({
      status: "completed",
      completedAt: new Date(),
      result,
    })
    .where(eq(campaignActions.id, actionId));

  // Update plan completed count
  const action = await db
    .select()
    .from(campaignActions)
    .where(eq(campaignActions.id, actionId))
    .limit(1);

  if (action.length > 0) {
    const planId = action[0].planId;
    const completedCount = await db
      .select()
      .from(campaignActions)
      .where(and(
        eq(campaignActions.planId, planId),
        eq(campaignActions.status, "completed")
      ));

    await db
      .update(dailyActionPlans)
      .set({ completedActions: completedCount.length })
      .where(eq(dailyActionPlans.id, planId));
  }
}

/**
 * Skip action
 */
export async function skipAction(actionId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(campaignActions)
    .set({
      status: "skipped",
      result: reason,
    })
    .where(eq(campaignActions.id, actionId));
}
