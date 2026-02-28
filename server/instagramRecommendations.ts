import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { instagramInsights, instagramRecommendations } from "../drizzle/schema";
import { desc } from "drizzle-orm";

export interface InstagramPerformanceData {
  currentFollowers: number;
  followerGrowthRate: number;
  avgEngagementRate: number;
  reachTrend: string;
  impressionsTrend: string;
  profileViewsTrend: string;
  websiteClicksTrend: string;
  historicalData: any[];
}

export async function generateInstagramRecommendations() {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  // Fetch last 30 days of Instagram insights
  const insights = await db
    .select()
    .from(instagramInsights)
    .orderBy(desc(instagramInsights.date))
    .limit(30);

  if (insights.length === 0) {
    return { success: false, message: 'No Instagram data available' };
  }

  // Calculate performance metrics
  const latest = insights[0];
  const oldest = insights[insights.length - 1];
  
  const followerGrowth = latest.followersCount - oldest.followersCount;
  const followerGrowthRate = oldest.followersCount > 0 
    ? ((followerGrowth / oldest.followersCount) * 100)
    : 0;

  const avgEngagementRate = insights.reduce((sum, item) => 
    sum + parseFloat(item.engagementRate?.toString() || '0'), 0) / insights.length;

  const performanceData: InstagramPerformanceData = {
    currentFollowers: latest.followersCount,
    followerGrowthRate,
    avgEngagementRate,
    reachTrend: calculateTrend(insights.map(i => i.reach || 0)),
    impressionsTrend: calculateTrend(insights.map(i => i.impressions || 0)),
    profileViewsTrend: calculateTrend(insights.map(i => i.profileViews || 0)),
    websiteClicksTrend: calculateTrend(insights.map(i => i.websiteClicks || 0)),
    historicalData: insights,
  };

  // Generate AI recommendations using Gemini
  const prompt = `You are an expert Instagram marketing strategist for Golf VX Arlington Heights, a premium golf training facility.

CURRENT INSTAGRAM PERFORMANCE (Last 30 days):
- Current Followers: ${performanceData.currentFollowers}
- Follower Growth Rate: ${performanceData.followerGrowthRate.toFixed(2)}%
- Average Engagement Rate: ${performanceData.avgEngagementRate.toFixed(2)}%
- Reach Trend: ${performanceData.reachTrend}
- Impressions Trend: ${performanceData.impressionsTrend}
- Profile Views Trend: ${performanceData.profileViewsTrend}
- Website Clicks Trend: ${performanceData.websiteClicksTrend}

GOLF VX CONTEXT:
- Target audience: Golf enthusiasts, beginners to advanced players, ages 25-55
- Services: Private lessons, group clinics, junior programs, corporate events
- Current campaigns: Trial Conversion, Membership Acquisition, Sunday Clinics, Summer Camps
- Goal: Reach 500 Instagram followers and drive trial session bookings

INSTAGRAM CONTENT BENCHMARKS:
- Industry avg engagement rate: 1-3%
- Optimal posting frequency: 4-5 posts/week
- Best performing content types: Transformation stories, behind-the-scenes, tips & drills, student success stories
- Peak engagement times: Weekday evenings (6-8 PM) and weekend mornings (9-11 AM)

TASK:
Generate 5-7 actionable Instagram content recommendations that will:
1. Increase follower growth to reach 500 followers goal
2. Improve engagement rate above 3%
3. Drive trial session bookings and membership conversions
4. Leverage current seasonal context (February 2026 - peak golf season)

For each recommendation, provide:
- **Title**: Clear, action-oriented recommendation (max 80 chars)
- **Description**: Detailed explanation of what to do and why (2-3 sentences)
- **Content Idea**: Specific post concept with caption example
- **Type**: Content category (e.g., "transformation_story", "educational_tip", "behind_the_scenes", "user_generated_content", "promotional_offer")
- **Priority**: high/medium/low based on expected impact
- **Reasoning**: Why this will work based on performance data
- **Expected Impact**: Quantified prediction (e.g., "+50 followers", "+2% engagement")
- **Confidence**: 0-100 score based on data support

Return ONLY a valid JSON array with this structure:
[
  {
    "title": "Post Before/After Swing Transformation Videos",
    "description": "Share 15-second videos showing student swing improvements with coach commentary. These authentic transformations build trust and showcase results.",
    "contentIdea": "Video: Side-by-side swing comparison of John's first lesson vs. 4 weeks later. Caption: '4 weeks. 20 yards added. One happy golfer. 🏌️‍♂️ Ready for your transformation? Link in bio for $10 trial session. #GolfTransformation #GolfLessons #ArlingtonHeights'",
    "type": "transformation_story",
    "priority": "high",
    "reasoning": "Transformation content has 2.5x higher engagement than static posts. Your engagement rate is below industry average, indicating need for more compelling visual content.",
    "expectedImpact": "+3% engagement rate, +30 followers/week",
    "confidence": 85
  }
]

Focus on data-driven, specific, actionable recommendations that Golf VX can implement immediately.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert Instagram marketing strategist. Return only valid JSON arrays." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "instagram_recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    contentIdea: { type: "string" },
                    type: { type: "string" },
                    priority: { type: "string" },
                    reasoning: { type: "string" },
                    expectedImpact: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["title", "description", "contentIdea", "type", "priority", "reasoning", "expectedImpact", "confidence"],
                  additionalProperties: false,
                },
              },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content in LLM response');
    if (typeof content !== 'string') throw new Error('Invalid content type');

    const parsed = JSON.parse(content);
    const recommendations = parsed.recommendations;

    // Save recommendations to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Recommendations expire after 7 days

    for (const rec of recommendations) {
      await db.insert(instagramRecommendations).values({
        title: rec.title,
        description: rec.description,
        contentIdea: rec.contentIdea,
        type: rec.type,
        priority: rec.priority,
        reasoning: rec.reasoning,
        expectedImpact: rec.expectedImpact,
        confidence: rec.confidence.toString(),
        status: 'pending',
        expiresAt,
      });
    }

    return {
      success: true,
      count: recommendations.length,
      recommendations,
    };
  } catch (error) {
    console.error('Error generating Instagram recommendations:', error);
    throw error;
  }
}

function calculateTrend(values: number[]): string {
  if (values.length < 2) return 'insufficient_data';
  
  const recent = values.slice(0, Math.floor(values.length / 2));
  const older = values.slice(Math.floor(values.length / 2));
  
  const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
  const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
}
