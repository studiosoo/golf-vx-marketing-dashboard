/**
 * Demo Data Seeder for Autonomous Marketing Intelligence
 * 
 * Seeds the database with realistic test actions for:
 * - Junior Summer Camp 2026
 * - Anniversary Giveaway 2026
 * - Trial Session - Spring Push
 * - Member Retention - Drive Days
 * - Corporate Events B2B
 * - Instagram Follower Growth
 */

import { getDb } from "./db";
import { autonomousSyncStatus, autonomousActions } from "../drizzle/schema";

export async function seedDemoData(): Promise<{ seeded: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { seeded: false, message: "Database not available" };

  // Check if data already exists
  const existing = await db.select().from(autonomousActions).limit(1);
  if (existing.length > 0) {
    return { seeded: false, message: "Demo data already exists" };
  }

  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;

  // Seed sync status
  await db.insert(autonomousSyncStatus).values({
    source: "meta_ads",
    status: "success",
    lastSyncAt: hourAgo,
    nextSyncAt: now + 12 * 60 * 60 * 1000,
    recordCount: 7,
    errorMessage: null,
    metadata: { lastRunAt: hourAgo, campaignCount: 7, activeCampaigns: 6 },
  });

  // Seed actions
  const demoActions = [
    // AUTO-EXECUTED (low risk)
    {
      campaignId: "demo_junior_summer_camp",
      campaignName: "Junior Summer Camp 2026",
      actionType: "budget_decrease",
      riskLevel: "low" as const,
      status: "auto_executed" as const,
      title: "Budget Optimization: Junior Summer Camp — High CTR, No Conversions",
      description: "CTR of 2.78% shows strong creative performance, but $45.20 spent with 0 conversions suggests landing page issues. Budget reduced by 20% ($15 to $12/day) while conversion funnel is reviewed.",
      actionParams: { budgetChange: -0.20, newDailyBudget: 12, reason: "no_conversions_despite_engagement" },
      triggerData: { ctr: 2.78, spend: 45.20, conversions: 0, impressions: 3200, clicks: 89 },
      confidence: 85,
      expectedImpact: "Save $3/day while maintaining visibility. Focus on fixing landing page to convert existing traffic.",
      executedAt: hourAgo,
    },
    {
      campaignId: "demo_instagram_growth",
      campaignName: "Instagram Follower Growth",
      actionType: "reduce_frequency",
      riskLevel: "low" as const,
      status: "auto_executed" as const,
      title: "Frequency Cap: Instagram Growth — Excellent Efficiency",
      description: "CPC of $0.08 is exceptionally low with 15K impressions. Adding frequency cap of 3/week to prevent ad fatigue while maintaining efficient reach.",
      actionParams: { frequencyCap: 3, period: "week" },
      triggerData: { cpc: 0.08, impressions: 15000, clicks: 420, ctr: 2.80 },
      confidence: 90,
      expectedImpact: "Prevent audience fatigue and maintain low CPC. Expected to sustain engagement for 2+ more weeks.",
      executedAt: twoHoursAgo,
    },

    // PENDING APPROVAL (high risk)
    {
      campaignId: "demo_anniversary_giveaway",
      campaignName: "Anniversary Giveaway 2026",
      actionType: "budget_increase",
      riskLevel: "high" as const,
      status: "pending_approval" as const,
      title: "Scale Up: Anniversary Giveaway — 4.2x ROAS",
      description: "Outstanding performance with 4.2x ROAS and 12 conversions from $70.50 spend. Recommend increasing daily budget from $20 to $30 (+50%) to capture more conversions during peak engagement period.",
      actionParams: { budgetChange: 0.50, currentBudget: 20, newBudget: 30, reason: "strong_roas" },
      triggerData: { roas: 4.2, conversions: 12, spend: 70.50, ctr: 2.88, cpc: 0.29 },
      confidence: 85,
      expectedImpact: "Additional $10/day spend at 4.2x ROAS could yield ~$42 additional daily revenue. Projected 6 more conversions/week.",
      executedAt: null,
    },
    {
      campaignId: "demo_anniversary_giveaway",
      campaignName: "Anniversary Giveaway 2026",
      actionType: "send_email",
      riskLevel: "high" as const,
      status: "pending_approval" as const,
      title: "Email Nurture: 12 Anniversary Giveaway Leads",
      description: "12 conversions from the Anniversary Giveaway campaign. Recommend sending a 3-part nurture email sequence: (1) Welcome + giveaway details, (2) Facility tour invitation, (3) Membership offer.",
      actionParams: { emailType: "nurture_3part", targetCount: 12, sequence: ["welcome", "tour_invite", "membership_offer"] },
      triggerData: { conversions: 12, ctr: 2.88, campaignType: "giveaway" },
      confidence: 75,
      expectedImpact: "Email nurture sequences typically convert 15-25% of leads. Could yield 2-3 new memberships from 12 leads.",
      executedAt: null,
    },
    {
      campaignId: "demo_junior_summer_camp",
      campaignName: "Junior Summer Camp 2026",
      actionType: "change_targeting",
      riskLevel: "high" as const,
      status: "pending_approval" as const,
      title: "Targeting Review: Junior Summer Camp — High Clicks, Zero Conversions",
      description: "89 clicks with 2.78% CTR but 0 conversions. Recommend narrowing audience to parents aged 30-50 within 10-mile radius and adding interest targeting for youth sports and golf lessons.",
      actionParams: { ageRange: "30-50", radius: "10mi", interests: ["youth sports", "golf lessons", "summer camps"] },
      triggerData: { ctr: 2.78, clicks: 89, conversions: 0, spend: 45.20 },
      confidence: 70,
      expectedImpact: "Better targeting could improve conversion rate from 0% to 2-5%, yielding 2-4 camp registrations per week.",
      executedAt: null,
    },
    {
      campaignId: "demo_trial_session",
      campaignName: "Trial Session - Spring Push",
      actionType: "send_email",
      riskLevel: "high" as const,
      status: "pending_approval" as const,
      title: "Follow-up Email: 5 Trial Session Converters",
      description: "5 trial session sign-ups detected. Recommend sending post-trial follow-up email with membership conversion offer (first month 50% off).",
      actionParams: { emailType: "post_trial_offer", targetCount: 5, offer: "50% off first month" },
      triggerData: { conversions: 5, ctr: 1.50, spend: 105.00 },
      confidence: 72,
      expectedImpact: "Post-trial offers typically convert 20-30% of trial users. Could yield 1-2 new memberships.",
      executedAt: null,
    },

    // MONITORING (insufficient data)
    {
      campaignId: "demo_membership_retention",
      campaignName: "Member Retention - Drive Days",
      actionType: "collect_data",
      riskLevel: "monitor" as const,
      status: "monitoring" as const,
      title: "Monitor: Member Retention — Only $8.50 Spent",
      description: "Campaign has only 350 impressions and $8.50 spend. Need at least 1,000 impressions and $25 spend to make meaningful optimization decisions. Current CTR of 3.43% is promising.",
      actionParams: { minImpressions: 1000, minSpend: 25 },
      triggerData: { impressions: 350, spend: 8.50, clicks: 12, ctr: 3.43 },
      confidence: 90,
      expectedImpact: "Data collection will enable informed optimization decisions within 3-5 days.",
      executedAt: null,
    },
    {
      campaignId: "demo_corporate_events",
      campaignName: "Corporate Events B2B",
      actionType: "collect_data",
      riskLevel: "monitor" as const,
      status: "monitoring" as const,
      title: "Monitor: Corporate Events — No Data Yet",
      description: "Campaign has $0 spend and 0 impressions. This is a newly launched campaign that needs time to accumulate data. Will analyze after reaching 500+ impressions.",
      actionParams: { minImpressions: 500, minSpend: 15 },
      triggerData: { impressions: 0, spend: 0, clicks: 0 },
      confidence: 95,
      expectedImpact: "Initial data collection expected within 2-3 days of campaign activation.",
      executedAt: null,
    },
    {
      campaignId: "demo_instagram_growth",
      campaignName: "Instagram Follower Growth",
      actionType: "monitor",
      riskLevel: "monitor" as const,
      status: "monitoring" as const,
      title: "Track: Instagram Growth — Follower Conversion Pending",
      description: "420 clicks at $0.08 CPC is excellent, but conversion tracking for follower growth is not available via Meta Ads API. Monitoring Instagram Insights separately for follower count changes.",
      actionParams: { trackMetric: "follower_count", source: "instagram_insights" },
      triggerData: { clicks: 420, cpc: 0.08, impressions: 15000 },
      confidence: 80,
      expectedImpact: "Understanding follower conversion rate will help optimize future Instagram growth campaigns.",
      executedAt: null,
    },
  ];

  for (const action of demoActions) {
    await db.insert(autonomousActions).values(action);
  }

  return { seeded: true, message: `Seeded ${demoActions.length} demo actions and sync status` };
}
