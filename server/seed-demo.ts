/**
 * Demo Data Seeder for Autonomous Marketing Intelligence
 * 
 * Seeds the database with realistic test actions for:
 * - Junior Summer Camp 2026 (ACTIVE - $293.16 spent)
 * - Anniversary Giveaway 2026 (ACTIVE - $467.59 spent across A1+A2)
 * - Sunday Clinic (ACTIVE - no Meta ad)
 * - $25 Trial Session (ACTIVE - no Meta ad)
 * - Instagram Follower Growth (COMPLETED - $43.24 spent, needs new strategy)
 * - Superbowl Watch Party (COMPLETED - $75.43 spent)
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
    recordCount: 5,
    errorMessage: null,
    metadata: { lastRunAt: hourAgo, campaignCount: 5, activeCampaigns: 3 },
  });

  // Seed actions
  const demoActions = [
    // AUTO-EXECUTED (low risk)
    {
      campaignId: "120239269191520217",
      campaignName: "JUNIOR GOLF SUMMER CAMP 2026",
      actionType: "budget_decrease",
      riskLevel: "low" as const,
      status: "auto_executed" as const,
      title: "Budget Optimization: Junior Summer Camp — High CTR, Low Conversions",
      description: "CTR of 2.78% shows strong creative performance, but $293.16 spent with limited conversions suggests landing page issues. Budget reduced by 15% while conversion funnel is reviewed.",
      actionParams: { budgetChange: -0.15, reason: "low_conversions_despite_engagement" },
      triggerData: { ctr: 2.78, spend: 293.16, conversions: 1, impressions: 16200, clicks: 848 },
      confidence: 85,
      expectedImpact: "Save budget while maintaining visibility. Focus on fixing landing page to convert existing traffic.",
      executedAt: hourAgo,
    },
    {
      campaignId: "120238976291690217",
      campaignName: "Superbowl Watch Party_Feb2026",
      actionType: "pause_campaign",
      riskLevel: "low" as const,
      status: "auto_executed" as const,
      title: "Campaign Completed: Superbowl Watch Party",
      description: "Event has passed. Campaign spent $75.43 with 4,167 impressions and 35 link clicks. Pausing to prevent further spend on expired event.",
      actionParams: { reason: "event_completed" },
      triggerData: { spend: 75.43, impressions: 4167, clicks: 35, ctr: 1.37 },
      confidence: 95,
      expectedImpact: "Stop unnecessary spend on completed event. $75.43 total spend achieved awareness goal.",
      executedAt: twoHoursAgo,
    },

    // PENDING APPROVAL (high risk)
    {
      campaignId: "120239570172470217",
      campaignName: "Golf VX Annual Giveaway - A1 Local Awareness",
      actionType: "budget_increase",
      riskLevel: "high" as const,
      status: "pending_approval" as const,
      title: "Scale Up: Anniversary Giveaway A1 — Strong Engagement",
      description: "A1 campaign has spent $342.64 with strong local awareness metrics. 906 link clicks at $0.35 CPC. Recommend increasing daily budget by 30% to maximize reach before giveaway deadline (Mar 15).",
      actionParams: { budgetChange: 0.30, currentBudget: 64, newBudget: 83, reason: "strong_engagement_before_deadline" },
      triggerData: { spend: 342.64, clicks: 906, ctr: 1.37, cpc: 0.35, impressions: 21300 },
      confidence: 82,
      expectedImpact: "Additional reach could generate 50+ more giveaway applications before deadline.",
      executedAt: null,
    },
    {
      campaignId: "120239627905950217",
      campaignName: "Golf VX Annual Giveaway - A2 Social/Family",
      actionType: "send_email",
      riskLevel: "high" as const,
      status: "pending_approval" as const,
      title: "Email Nurture: Anniversary Giveaway Leads",
      description: "A2 Social/Family campaign has generated leads from $124.95 spend. Recommend sending a 3-part nurture email sequence to all giveaway applicants: (1) Application confirmation, (2) Facility tour invitation, (3) Membership offer.",
      actionParams: { emailType: "nurture_3part", sequence: ["confirmation", "tour_invite", "membership_offer"] },
      triggerData: { spend: 124.95, conversions: 37, campaignType: "giveaway" },
      confidence: 75,
      expectedImpact: "Email nurture sequences typically convert 15-25% of leads. Could yield 5-9 new memberships from 37 applicants.",
      executedAt: null,
    },
    {
      campaignId: "120239269191520217",
      campaignName: "JUNIOR GOLF SUMMER CAMP 2026",
      actionType: "change_targeting",
      riskLevel: "high" as const,
      status: "pending_approval" as const,
      title: "Targeting Review: Junior Summer Camp — High Clicks, Low Conversions",
      description: "848 clicks with strong CTR but limited conversions. Recommend narrowing audience to parents aged 30-50 within 10-mile radius and adding interest targeting for youth sports and golf lessons.",
      actionParams: { ageRange: "30-50", radius: "10mi", interests: ["youth sports", "golf lessons", "summer camps"] },
      triggerData: { ctr: 2.78, clicks: 848, conversions: 1, spend: 293.16 },
      confidence: 70,
      expectedImpact: "Better targeting could improve conversion rate, yielding 3-5 camp registrations per week.",
      executedAt: null,
    },

    // MONITORING (insufficient data or completed)
    {
      campaignId: "120238971719500217",
      campaignName: "IG_$100 Giveaway_Feb2026",
      actionType: "plan_next_campaign",
      riskLevel: "monitor" as const,
      status: "monitoring" as const,
      title: "Strategy Needed: Instagram Follower Growth — Ad Completed",
      description: "Previous IG $100 Giveaway ad completed with $43.24 spent and 8,854 engagements. Excellent CPC of $0.08. Need to plan next ad campaign for continued follower growth toward 800 target.",
      actionParams: { trackMetric: "follower_count", previousAdSpend: 43.24, previousEngagements: 8854 },
      triggerData: { clicks: 420, cpc: 0.08, impressions: 15000, spend: 43.24 },
      confidence: 80,
      expectedImpact: "New ad strategy needed to continue momentum. Previous campaign showed strong engagement efficiency.",
      executedAt: null,
    },
    {
      campaignId: "sunday_clinic",
      campaignName: "Sunday Clinic",
      actionType: "collect_data",
      riskLevel: "monitor" as const,
      status: "monitoring" as const,
      title: "Monitor: Sunday Clinic — No Meta Ad Running",
      description: "Sunday Clinic program is active but has no Meta Ads campaign. Tracking via Acuity bookings only. 48 attendees so far with $120 organic spend. Consider launching a Meta ad to boost attendance.",
      actionParams: { trackMetric: "attendance", source: "acuity_bookings" },
      triggerData: { attendance: 48, spend: 120, revenue: 960 },
      confidence: 85,
      expectedImpact: "A targeted Meta ad could increase Sunday Clinic attendance by 30-50%.",
      executedAt: null,
    },
  ];

  for (const action of demoActions) {
    await db.insert(autonomousActions).values(action);
  }

  return { seeded: true, message: `Seeded ${demoActions.length} demo actions and sync status` };
}
