import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { aiRecommendations, campaignIdeas, userActions, type AIRecommendation, type CampaignIdea } from "../drizzle/schema";

// Market research insights (from uploaded PDF)
const marketResearchInsights = {
  targetTiers: {
    tier1_local: {
      name: "Local Enthusiasts (0-10mi)",
      description: "Arlington Heights residents, high frequency potential",
      demographics: "35-55 years, $75K-$150K income, families + serious golfers",
    },
    tier2_regional: {
      name: "Regional Players (10-30mi)",
      description: "Suburban commuters, moderate frequency",
      demographics: "30-50 years, $85K-$200K income, convenience-focused",
    },
    tier3_chicago: {
      name: "Chicago Clusters",
      description: "Urban professionals, special occasions + winter refuge",
      demographics: "25-45 years, $90K-$250K income, experience-seekers",
    },
  },
  personas: {
    serious_improver: "Dedicated golfer seeking AI-powered swing analysis",
    social_family: "Family entertainment, kids under 15 (20% of market)",
    corporate_eventer: "Networking leagues, team building",
    casual_explorer: "First-time indoor golf, curious about technology",
  },
  competitiveLandscape: {
    totalFacilities: 110,
    keyCompetitors: ["The Haven", "X-Golf Schaumburg", "Golf Factory"],
    differentiation: "AI technology + upscale lounge atmosphere vs. 'man cave' vibe",
  },
  seasonality: {
    peakSeason: "November-April (winter)",
    shoulderSeason: "May, September-October",
    lowSeason: "June-August (outdoor golf season)",
  },
};

interface MultiChannelPerformance {
  metaAds: {
    campaigns: Array<{
      name: string;
      spend: number;
      impressions: number;
      clicks: number;
      ctr: number;
      leads: number;
      cpl: number;
    }>;
    totalSpend: number;
    totalLeads: number;
    avgCPL: number;
  };
  email: {
    subscribers: number;
    openRate: number;
    clickRate: number;
    conversions: number;
  };
  instagram: {
    posts: number;
    avgEngagement: number;
    reach: number;
    profileVisits: number;
  };
  giveaway: {
    applications: number;
    conversions: number;
    conversionRate: number;
  };
}

interface PerformanceAnalysis {
  topPriority: {
    id: number;
    title: string;
    description: string;
    expectedImpact: string;
    actionSteps: string[];
  };
  alerts: Array<{
    type: "warning" | "success" | "info";
    title: string;
    metric: string;
    current?: number;
    benchmark?: number;
    recommendation: string;
    confidence: number;
  }>;
  positiveMomentum: Array<{
    channel: string;
    insight: string;
    amplificationStrategy: string;
  }>;
  budgetReallocation?: {
    from: string;
    to: string;
    amount: number;
    expectedROI: string;
  };
}

/**
 * Analyze performance data using Gemini AI
 */
export async function analyzePerformanceWithGemini(
  performanceData: MultiChannelPerformance
): Promise<PerformanceAnalysis> {
  // Get current month for seasonal context
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const monthNum = new Date().getMonth() + 1;
  const membershipMonthlyTargets: Record<number, number> = {
    1: 20, 2: 20, 3: 15, 4: 10, 5: 8, 6: -5,
    7: -8, 8: -5, 9: 10, 10: 20, 11: 25, 12: 20
  };
  const thisMonthTarget = membershipMonthlyTargets[monthNum] || 0;
  
  const prompt = `
You are a marketing strategist for Golf VX, an indoor golf facility in Arlington Heights, IL.

**Market Context**:
${JSON.stringify(marketResearchInsights, null, 2)}

**Performance Data (Last 30 Days)**:
${JSON.stringify(performanceData, null, 2)}

**CRITICAL: Campaign Goal-Based Evaluation**
Each campaign has a different primary goal. Evaluate each by its OWN goal, not by revenue ROI:

- Revenue campaigns (Winter Clinic, Trial Conversion, Membership Acquisition): evaluate by ROI, ROAS, cost per conversion
- Follower campaigns (Instagram Growth): evaluate by cost per follower (benchmark: $0.50-$2.00), growth rate vs target
- Lead campaigns (Junior Golf Camp, B2B Events, Annual Giveaway): evaluate by cost per lead (benchmark: $5-15), lead quality, conversion rate
- Attendance campaigns (Sunday Clinic): evaluate by attendance rate, repeat rate, cost per attendee
- Retention campaigns (Member Retention Flywheel): evaluate by retention rate vs 85% target

NEVER show negative ROI for non-revenue campaigns. ALWAYS match the success metric to the campaign's stated goal.

**MEMBERSHIP SEASONALITY (critical for recommendations)**:
- Peak acquisition: Nov-Feb (natural +20/month without extra effort)
- Pre-summer critical window: Apr-May (must push hard NOW before summer churn)
- Summer churn months: Jun-Aug (expect net member loss of -5 to -8/month)
- Recovery: Sep-Oct

Current month: ${currentMonth}
This month's membership target: ${thisMonthTarget > 0 ? `+${thisMonthTarget} new members` : `${thisMonthTarget} net members (churn season)`}
Current members: 127 (year-end target: 300 by Dec 31, 2026)

Tailor ALL membership recommendations to current seasonal context.

**Your Task**:
Analyze the performance data and provide:

1. **Top Priority Action** (1 item):
   - What should the owner focus on TODAY?
   - Expected impact (quantified with dollar amounts or conversion numbers)
   - Specific action steps (3-5 steps)

2. **Performance Alerts** (3-5 items):
   - Campaigns/channels that need immediate attention
   - Specific metrics that triggered the alert
   - Recommended action with expected outcome
   - Confidence score (0-100)

3. **Positive Momentum** (2-3 items):
   - What's working well that should be doubled down on?
   - Specific opportunities to amplify success

4. **Budget Reallocation** (if applicable):
   - Move money from underperforming to high-performing channels
   - Specific dollar amounts and expected ROI

**Output Format**: JSON matching PerformanceAnalysis interface
`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert marketing analyst specializing in local service businesses. Provide actionable, data-driven recommendations." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "performance_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            topPriority: {
              type: "object",
              properties: {
                id: { type: "number" },
                title: { type: "string" },
                description: { type: "string" },
                expectedImpact: { type: "string" },
                actionSteps: { type: "array", items: { type: "string" } },
              },
              required: ["id", "title", "description", "expectedImpact", "actionSteps"],
            },
            alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["warning", "success", "info"] },
                  title: { type: "string" },
                  metric: { type: "string" },
                  current: { type: "number" },
                  benchmark: { type: "number" },
                  recommendation: { type: "string" },
                  confidence: { type: "number" },
                },
                required: ["type", "title", "metric", "recommendation", "confidence"],
              },
            },
            positiveMomentum: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  channel: { type: "string" },
                  insight: { type: "string" },
                  amplificationStrategy: { type: "string" },
                },
                required: ["channel", "insight", "amplificationStrategy"],
              },
            },
            budgetReallocation: {
              type: "object",
              properties: {
                from: { type: "string" },
                to: { type: "string" },
                amount: { type: "number" },
                expectedROI: { type: "string" },
              },
              required: ["from", "to", "amount", "expectedROI"],
            },
          },
          required: ["topPriority", "alerts", "positiveMomentum"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== 'string') {
    throw new Error('Invalid response from Gemini API');
  }
  return JSON.parse(content);
}

/**
 * Generate campaign ideas using Gemini AI
 */
export async function generateCampaignIdeas(
  performanceData: MultiChannelPerformance,
  focus?: "audience" | "channel" | "seasonal" | "competitive",
  constraints?: {
    maxBudget?: number;
    timeline?: string;
    channels?: string[];
  }
): Promise<CampaignIdea[]> {
  const prompt = `
Generate 3 fresh marketing campaign ideas for Golf VX based on:

**Market Research Insights**:
${JSON.stringify(marketResearchInsights, null, 2)}

**Recent Performance**:
${JSON.stringify(performanceData, null, 2)}

**Focus Area**: ${focus || "general"}
**Constraints**: ${JSON.stringify(constraints || {}, null, 2)}

**Requirements**:
- Each campaign must target a specific persona from market research
- Must leverage at least 2 marketing channels
- Must have clear success metrics
- Must be executable within 2-4 weeks
- Budget range: $200-$500 per campaign

**Output Format**: JSON array of campaign ideas
`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a creative marketing strategist specializing in local entertainment and sports businesses. Generate innovative, actionable campaign ideas." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "campaign_ideas",
        strict: true,
        schema: {
          type: "object",
          properties: {
            campaigns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  objective: { type: "string" },
                  targetAudience: { type: "string" },
                  channels: { type: "array", items: { type: "string" } },
                  budgetMin: { type: "number" },
                  budgetMax: { type: "number" },
                  timeline: { type: "string" },
                  keyMessages: { type: "array", items: { type: "string" } },
                  creativeConcepts: { type: "array", items: { type: "string" } },
                  successMetrics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        metric: { type: "string" },
                        target: { type: "number" },
                      },
                      required: ["metric", "target"],
                    },
                  },
                  implementationSteps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        step: { type: "string" },
                        owner: { type: "string" },
                        deadline: { type: "string" },
                      },
                      required: ["step", "owner", "deadline"],
                    },
                  },
                  confidenceScore: { type: "number" },
                  rationale: { type: "string" },
                },
                required: ["title", "objective", "targetAudience", "channels", "budgetMin", "budgetMax", "timeline", "keyMessages", "successMetrics", "confidenceScore", "rationale"],
              },
            },
          },
          required: ["campaigns"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== 'string') {
    throw new Error('Invalid response from Gemini API');
  }
  const result = JSON.parse(content);
  return result.campaigns;
}

/**
 * Get multi-channel performance data for last N days
 */
export async function getMultiChannelPerformance(days: number = 30): Promise<MultiChannelPerformance> {
  // TODO: Implement actual data fetching from Meta Ads, Encharge, etc.
  // For now, return mock data structure
  return {
    metaAds: {
      campaigns: [],
      totalSpend: 0,
      totalLeads: 0,
      avgCPL: 0,
    },
    email: {
      subscribers: 0,
      openRate: 0,
      clickRate: 0,
      conversions: 0,
    },
    instagram: {
      posts: 0,
      avgEngagement: 0,
      reach: 0,
      profileVisits: 0,
    },
    giveaway: {
      applications: 0,
      conversions: 0,
      conversionRate: 0,
    },
  };
}

/**
 * Save AI recommendation to database
 */
export async function saveRecommendation(recommendation: Omit<typeof aiRecommendations.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  const database = await db.getDb();
  if (!database) {
    throw new Error('Database not available');
  }
  const result = await database.insert(aiRecommendations).values(recommendation);
  return result[0].insertId;
}

/**
 * Save campaign idea to database
 */
export async function saveCampaignIdea(idea: Omit<typeof campaignIdeas.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  const database = await db.getDb();
  if (!database) {
    throw new Error('Database not available');
  }
  const result = await database.insert(campaignIdeas).values(idea);
  return result[0].insertId;
}

/**
 * Get all pending recommendations
 */
export async function getPendingRecommendations() {
  const database = await db.getDb();
  if (!database) {
    return [];
  }
  return await database.select().from(aiRecommendations)
    .where(eq(aiRecommendations.status, "pending"))
    .orderBy(desc(aiRecommendations.priority), desc(aiRecommendations.createdAt));
}

/**
 * Get all suggested campaign ideas
 */
export async function getSuggestedCampaignIdeas() {
  const database = await db.getDb();
  if (!database) {
    return [];
  }
  return await database.select().from(campaignIdeas)
    .where(eq(campaignIdeas.status, "suggested"))
    .orderBy(desc(campaignIdeas.confidenceScore), desc(campaignIdeas.createdAt));
}
