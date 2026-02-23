/**
 * Seed demo data for the autonomous marketing intelligence system.
 * This creates realistic test data for Junior Summer Camp and Anniversary Giveaway campaigns.
 * Called from the tRPC router when no data exists.
 */
import { getDb } from "./db";
import { autonomousSyncStatus, autonomousActions } from "../drizzle/schema";

export async function seedDemoData(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Create a completed sync record
  const [syncResult] = await db.insert(autonomousSyncStatus).values({
    platform: "meta_ads",
    status: "completed",
    campaignsProcessed: 7,
    actionsGenerated: 9,
    actionsAutoExecuted: 3,
    completedAt: new Date(),
    metadata: {
      campaignNames: [
        "Junior Summer Camp 2026 - Early Bird",
        "Anniversary Giveaway - Annual Membership",
        "$25 Trial Session - Spring Promo",
        "Corporate Team Building Package",
        "PBGA Winter Clinic Series",
        "Instagram Follower Growth - Brand Awareness",
        "New Campaign - Weekend Drive Day",
      ],
      pendingApproval: 3,
      monitoring: 3,
    },
  });

  const syncId = syncResult.insertId;

  // ─── Auto-Executed Actions (Low Risk) ────────────────────────────────────

  await db.insert(autonomousActions).values([
    {
      syncId,
      campaignId: "demo_camp_003",
      campaignName: "$25 Trial Session - Spring Promo",
      actionType: "budget_adjustment",
      riskLevel: "low",
      status: "auto_executed",
      title: "Budget Decrease: $25 Trial Session - High CPA",
      description:
        "CPA of $114.20 is 4.6x above target. Reducing budget by 30% to limit waste while gathering more data.",
      recommendation:
        "Reduce daily budget from $30.00 to $21.00. Review ad creative and targeting for the spring promo - the high frequency (3.6) suggests audience fatigue.",
      actionParams: {
        action: "decrease_budget",
        oldBudget: 30,
        newBudget: 21,
        reductionPercent: 30,
      },
      campaignMetrics: {
        spend: 456.8,
        impressions: 32100,
        clicks: 198,
        ctr: 0.62,
        cpc: 2.31,
        conversions: 4,
        costPerConversion: 114.2,
        roas: 0.44,
      },
      confidence: 85,
      impactEstimate: "medium",
    },
    {
      syncId,
      campaignId: "demo_camp_003",
      campaignName: "$25 Trial Session - Spring Promo",
      actionType: "targeting_change",
      riskLevel: "low",
      status: "auto_executed",
      title: "Audience Fatigue Alert: Spring Promo",
      description:
        "Frequency of 3.6 indicates audience saturation. The same users are seeing this ad too many times, leading to declining CTR (0.62%).",
      recommendation:
        "Expand lookalike audience from 1% to 3% and exclude users who already visited the booking page.",
      actionParams: {
        reason: "high_frequency",
        frequency: 3.6,
        reach: 8900,
      },
      campaignMetrics: {
        spend: 456.8,
        impressions: 32100,
        clicks: 198,
        ctr: 0.62,
        cpc: 2.31,
        conversions: 4,
        costPerConversion: 114.2,
        roas: 0.44,
      },
      confidence: 80,
      impactEstimate: "medium",
    },
    {
      syncId,
      campaignId: "demo_camp_005",
      campaignName: "PBGA Winter Clinic Series",
      actionType: "alert",
      riskLevel: "low",
      status: "auto_executed",
      title: "Performance Alert: Winter Clinic CPA Rising",
      description:
        "CPA of $28.33 is slightly above the $25 target. Campaign has been running for 34 days with 22 conversions. Performance is acceptable but trending upward.",
      recommendation:
        "Monitor closely for the next 3 days. If CPA exceeds $30, consider reducing budget by 15%.",
      actionParams: {
        action: "alert",
        currentCPA: 28.33,
        targetCPA: 25,
        trend: "slightly_rising",
      },
      campaignMetrics: {
        spend: 623.15,
        impressions: 28900,
        clicks: 412,
        ctr: 1.43,
        cpc: 1.51,
        conversions: 22,
        costPerConversion: 28.33,
        roas: 1.76,
      },
      confidence: 75,
      impactEstimate: "low",
    },
  ]);

  // ─── Pending Approval Actions (Medium/High Risk) ─────────────────────────

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await db.insert(autonomousActions).values([
    {
      syncId,
      campaignId: "demo_camp_002",
      campaignName: "Anniversary Giveaway - Annual Membership",
      actionType: "budget_adjustment",
      riskLevel: "medium",
      status: "pending_approval",
      title: "Budget Increase: Anniversary Giveaway - Strong ROAS",
      description:
        "ROAS of 3.15x with 38 conversions over 39 days. This campaign is the top performer and could benefit from increased budget to capture more leads before the anniversary event ends.",
      recommendation:
        "Increase daily budget from $60.00 to $72.00 (+20%). The campaign has strong momentum with a 1.97% CTR and $22.30 CPA, well within target.",
      actionParams: {
        action: "increase_budget",
        oldBudget: 60,
        newBudget: 72,
        increasePercent: 20,
      },
      campaignMetrics: {
        spend: 847.23,
        impressions: 45200,
        clicks: 892,
        ctr: 1.97,
        cpc: 0.95,
        conversions: 38,
        costPerConversion: 22.3,
        roas: 3.15,
      },
      confidence: 88,
      impactEstimate: "high",
      expiresAt,
    },
    {
      syncId,
      campaignId: "demo_camp_001",
      campaignName: "Junior Summer Camp 2026 - Early Bird",
      actionType: "budget_adjustment",
      riskLevel: "medium",
      status: "pending_approval",
      title: "Budget Increase: Junior Summer Camp - Good Performance",
      description:
        "CPA of $22.32 is within target ($25) with 14 conversions. The early bird campaign is performing well and summer camp registrations typically accelerate in March.",
      recommendation:
        "Increase daily budget from $40.00 to $48.00 (+20%) to capture early registrations before competitor camps launch their marketing.",
      actionParams: {
        action: "increase_budget",
        oldBudget: 40,
        newBudget: 48,
        increasePercent: 20,
      },
      campaignMetrics: {
        spend: 312.47,
        impressions: 18420,
        clicks: 287,
        ctr: 1.56,
        cpc: 1.09,
        conversions: 14,
        costPerConversion: 22.32,
        roas: 2.24,
      },
      confidence: 82,
      impactEstimate: "high",
      expiresAt,
    },
    {
      syncId,
      campaignId: "demo_camp_003",
      campaignName: "$25 Trial Session - Spring Promo",
      actionType: "creative_refresh",
      riskLevel: "high",
      status: "pending_approval",
      title: "Creative Refresh: Spring Promo - Low CTR",
      description:
        "CTR of 0.62% across 32,100 impressions suggests the creative is not resonating. The current static image ad may need to be replaced with video content showing the simulator experience.",
      recommendation:
        "Create 3 new ad variations: (1) 15-second video walkthrough of the simulator bay, (2) Customer testimonial carousel, (3) Before/after golf swing comparison. Test each for 5 days.",
      actionParams: {
        reason: "low_ctr",
        ctr: 0.62,
        impressions: 32100,
        suggestedFormats: ["video", "carousel", "comparison"],
      },
      campaignMetrics: {
        spend: 456.8,
        impressions: 32100,
        clicks: 198,
        ctr: 0.62,
        cpc: 2.31,
        conversions: 4,
        costPerConversion: 114.2,
        roas: 0.44,
      },
      confidence: 72,
      impactEstimate: "high",
      expiresAt,
    },
  ]);

  // ─── Monitoring Actions ──────────────────────────────────────────────────

  await db.insert(autonomousActions).values([
    {
      syncId,
      campaignId: "demo_camp_007",
      campaignName: "New Campaign - Weekend Drive Day",
      actionType: "alert",
      riskLevel: "monitor",
      status: "monitoring",
      title: "Monitoring: Weekend Drive Day - New Campaign",
      description:
        "Campaign has only 2 days of data and 890 impressions. Need more data before making optimization decisions. Initial CTR of 1.35% looks promising.",
      recommendation:
        "Continue monitoring. Revisit after 3+ days and 1,000+ impressions. Early indicators are positive.",
      actionParams: {
        reason: "insufficient_data",
        daysRunning: 2,
        impressions: 890,
      },
      campaignMetrics: {
        spend: 28.4,
        impressions: 890,
        clicks: 12,
        ctr: 1.35,
        cpc: 2.37,
        conversions: 0,
        costPerConversion: 0,
        roas: 0,
      },
      confidence: 90,
      impactEstimate: "low",
    },
    {
      syncId,
      campaignId: "demo_camp_004",
      campaignName: "Corporate Team Building Package",
      actionType: "alert",
      riskLevel: "monitor",
      status: "monitoring",
      title: "Monitoring: Corporate Team Building - Early Stage",
      description:
        "Campaign has 5 days of data with 4,200 impressions but zero conversions. The B2B audience typically has longer decision cycles. Continue monitoring before taking action.",
      recommendation:
        "Monitor for 2 more days. If still zero conversions after 7 days with $100+ spend, consider pausing and reviewing the landing page experience.",
      actionParams: {
        reason: "insufficient_data",
        daysRunning: 5,
        impressions: 4200,
        note: "B2B campaigns typically need longer evaluation periods",
      },
      campaignMetrics: {
        spend: 89.5,
        impressions: 4200,
        clicks: 42,
        ctr: 1.0,
        cpc: 2.13,
        conversions: 0,
        costPerConversion: 0,
        roas: 0,
      },
      confidence: 85,
      impactEstimate: "low",
    },
    {
      syncId,
      campaignId: "demo_camp_006",
      campaignName: "Instagram Follower Growth - Brand Awareness",
      actionType: "alert",
      riskLevel: "monitor",
      status: "monitoring",
      title: "On Track: Instagram Growth - Brand Awareness",
      description:
        "Brand awareness campaign is performing as expected with 52,000 impressions and 38,000 reach at $0.58 CPC. This campaign type doesn't target direct conversions.",
      recommendation:
        "No action needed. Continue monitoring engagement metrics. Consider creating retargeting audiences from engaged users.",
      actionParams: {
        status: "healthy",
        campaignType: "brand_awareness",
      },
      campaignMetrics: {
        spend: 178.9,
        impressions: 52000,
        clicks: 310,
        ctr: 0.6,
        cpc: 0.58,
        conversions: 0,
        costPerConversion: 0,
        roas: 0,
      },
      confidence: 85,
      impactEstimate: "low",
    },
  ]);

  return true;
}
