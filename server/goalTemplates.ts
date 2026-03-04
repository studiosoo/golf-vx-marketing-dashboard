/**
 * Goal & KPI Templates for Different Campaign Types
 */

export type GoalType = 
  | "revenue"
  | "followers"
  | "engagement"
  | "conversions"
  | "retention"
  | "brand_awareness"
  | "lead_generation"
  | "trial_signups"
  | "leads"
  | "attendance";

export interface GoalTemplate {
  goalType: GoalType;
  goalUnit: string;
  primaryKpi: string;
  kpiUnit: string;
  description: string;
  calculateKpi: (data: CampaignData) => number;
  calculatePerformanceScore: (goalTarget: number, goalActual: number, kpiTarget: number, kpiActual: number) => number;
}

export interface CampaignData {
  budget: number;
  actualSpend: number;
  actualRevenue: number;
  actualApplications: number;
  actualConversions: number;
  goalActual: number;
  metaAdsSpend: number;
  // Instagram metrics (to be added)
  followersGained?: number;
  engagementRate?: number;
  impressions?: number;
  reach?: number;
}

/**
 * Goal Templates Library
 */
export const GOAL_TEMPLATES: Record<GoalType, GoalTemplate> = {
  revenue: {
    goalType: "revenue",
    goalUnit: "USD",
    primaryKpi: "ROAS (Return on Ad Spend)",
    kpiUnit: "ratio",
    description: "Maximize revenue generation from campaign spend",
    calculateKpi: (data) => {
      if (data.actualSpend === 0) return 0;
      return data.actualRevenue / data.actualSpend;
    },
    calculatePerformanceScore: (goalTarget, goalActual, kpiTarget, kpiActual) => {
      const revenueScore = goalTarget > 0 ? Math.min((goalActual / goalTarget) * 100, 100) : 0;
      const roasScore = kpiTarget > 0 ? Math.min((kpiActual / kpiTarget) * 100, 100) : 0;
      return Math.round((revenueScore * 0.6 + roasScore * 0.4)); // 60% revenue, 40% ROAS
    }
  },

  followers: {
    goalType: "followers",
    goalUnit: "followers",
    primaryKpi: "Cost per Follower",
    kpiUnit: "USD",
    description: "Grow social media following and audience reach",
    calculateKpi: (data) => {
      if (!data.followersGained || data.followersGained === 0) return 0;
      return data.actualSpend / data.followersGained;
    },
    calculatePerformanceScore: (goalTarget, goalActual, kpiTarget, kpiActual) => {
      const followerScore = goalTarget > 0 ? Math.min((goalActual / goalTarget) * 100, 100) : 0;
      // Lower cost per follower is better, so invert the score
      const costScore = kpiTarget > 0 && kpiActual > 0 ? Math.min((kpiTarget / kpiActual) * 100, 100) : 0;
      return Math.round((followerScore * 0.7 + costScore * 0.3)); // 70% follower growth, 30% cost efficiency
    }
  },

  engagement: {
    goalType: "engagement",
    goalUnit: "%",
    primaryKpi: "Engagement Rate",
    kpiUnit: "%",
    description: "Increase audience interaction and engagement",
    calculateKpi: (data) => {
      return data.engagementRate || 0;
    },
    calculatePerformanceScore: (goalTarget, goalActual, kpiTarget, kpiActual) => {
      const engagementScore = kpiTarget > 0 ? Math.min((kpiActual / kpiTarget) * 100, 100) : 0;
      return Math.round(engagementScore);
    }
  },

  conversions: {
    goalType: "conversions",
    goalUnit: "conversions",
    primaryKpi: "Conversion Rate",
    kpiUnit: "%",
    description: "Drive specific user actions (signups, purchases, bookings)",
    calculateKpi: (data) => {
      if (data.actualApplications === 0) return 0;
      return (data.actualConversions / data.actualApplications) * 100;
    },
    calculatePerformanceScore: (goalTarget, goalActual, kpiTarget, kpiActual) => {
      const conversionScore = goalTarget > 0 ? Math.min((goalActual / goalTarget) * 100, 100) : 0;
      const rateScore = kpiTarget > 0 ? Math.min((kpiActual / kpiTarget) * 100, 100) : 0;
      return Math.round((conversionScore * 0.6 + rateScore * 0.4)); // 60% volume, 40% rate
    }
  },

  retention: {
    goalType: "retention",
    goalUnit: "%",
    primaryKpi: "Retention Rate",
    kpiUnit: "%",
    description: "Maintain and improve customer/member retention",
    calculateKpi: (data) => {
      return data.goalActual; // Retention rate is the goal itself
    },
    calculatePerformanceScore: (goalTarget, goalActual, kpiTarget, kpiActual) => {
      const retentionScore = goalTarget > 0 ? Math.min((goalActual / goalTarget) * 100, 100) : 0;
      return Math.round(retentionScore);
    }
  },

  brand_awareness: {
    goalType: "brand_awareness",
    goalUnit: "impressions",
    primaryKpi: "CPM (Cost per 1000 Impressions)",
    kpiUnit: "USD",
    description: "Increase brand visibility and awareness",
    calculateKpi: (data) => {
      if (!data.impressions || data.impressions === 0) return 0;
      return (data.actualSpend / data.impressions) * 1000;
    },
    calculatePerformanceScore: (goalTarget, goalActual, kpiTarget, kpiActual) => {
      const impressionScore = goalTarget > 0 ? Math.min((goalActual / goalTarget) * 100, 100) : 0;
      // Lower CPM is better
      const cpmScore = kpiTarget > 0 && kpiActual > 0 ? Math.min((kpiTarget / kpiActual) * 100, 100) : 0;
      return Math.round((impressionScore * 0.7 + cpmScore * 0.3)); // 70% reach, 30% cost efficiency
    }
  },

  lead_generation: {
    goalType: "lead_generation",
    goalUnit: "leads",
    primaryKpi: "Cost per Lead",
    kpiUnit: "USD",
    description: "Generate qualified leads for sales pipeline",
    calculateKpi: (data) => {
      if (data.actualApplications === 0) return 0;
      return data.actualSpend / data.actualApplications;
    },
    calculatePerformanceScore: (goalTarget, goalActual, kpiTarget, kpiActual) => {
      const leadScore = goalTarget > 0 ? Math.min((goalActual / goalTarget) * 100, 100) : 0;
      // Lower cost per lead is better
      const costScore = kpiTarget > 0 && kpiActual > 0 ? Math.min((kpiTarget / kpiActual) * 100, 100) : 0;
      return Math.round((leadScore * 0.6 + costScore * 0.4)); // 60% lead volume, 40% cost efficiency
    }
  },

  trial_signups: {
    goalType: "trial_signups",
    goalUnit: "signups",
    primaryKpi: "Trial-to-Paid Conversion Rate",
    kpiUnit: "%",
    description: "Convert trial users to paying customers",
    calculateKpi: (data) => {
      if (data.actualApplications === 0) return 0;
      return (data.actualConversions / data.actualApplications) * 100;
    },
    calculatePerformanceScore: (goalTarget, goalActual, kpiTarget, kpiActual) => {
      const signupScore = goalTarget > 0 ? Math.min((goalActual / goalTarget) * 100, 100) : 0;
      const conversionScore = kpiTarget > 0 ? Math.min((kpiActual / kpiTarget) * 100, 100) : 0;
      return Math.round((signupScore * 0.5 + conversionScore * 0.5)); // 50% signup volume, 50% conversion rate
    }
  },

  // "leads" = manually tracked bookings/trial sessions (kpiActual stored directly in DB)
  leads: {
    goalType: "leads",
    goalUnit: "bookings",
    primaryKpi: "Trial Bookings",
    kpiUnit: "bookings",
    description: "Track trial bookings and session conversions",
    calculateKpi: (data) => {
      // For manually tracked bookings, return goalActual (stored as kpiActual in DB)
      // The actual value is preserved from DB in calculateCampaignPerformance
      return data.goalActual;
    },
    calculatePerformanceScore: (goalTarget, goalActual, kpiTarget, kpiActual) => {
      const bookingScore = kpiTarget > 0 ? Math.min((kpiActual / kpiTarget) * 100, 100) : 0;
      return Math.round(bookingScore);
    }
  },

  // "attendance" = event attendance tracking
  attendance: {
    goalType: "attendance",
    goalUnit: "attendees",
    primaryKpi: "Attendance Count",
    kpiUnit: "people",
    description: "Track event attendance and participation",
    calculateKpi: (data) => {
      return data.goalActual;
    },
    calculatePerformanceScore: (goalTarget, goalActual, kpiTarget, kpiActual) => {
      const attendanceScore = goalTarget > 0 ? Math.min((goalActual / goalTarget) * 100, 100) : 0;
      return Math.round(attendanceScore);
    }
  }
};

/**
 * Calculate campaign performance based on goal type
 */
export function calculateCampaignPerformance(
  campaign: any,
  instagramMetrics?: {
    followersGained?: number;
    engagementRate?: number;
    impressions?: number;
    reach?: number;
  }
): {
  kpiActual: number;
  performanceScore: number;
} {
  if (!campaign.goalType) {
    // Fallback to traditional ROI if no goal type
    return {
      kpiActual: 0,
      performanceScore: 0
    };
  }

  const template = GOAL_TEMPLATES[campaign.goalType as GoalType];
  if (!template) {
    // Preserve DB-stored kpiActual as fallback when no template matches
    const dbKpiActual = parseFloat(campaign.kpiActual || "0");
    return {
      kpiActual: dbKpiActual,
      performanceScore: 0
    };
  }

  const campaignData: CampaignData = {
    budget: parseFloat(campaign.budget || "0"),
    actualSpend: parseFloat(campaign.actualSpend || "0"),
    actualRevenue: parseFloat(campaign.actualRevenue || "0"),
    actualApplications: campaign.actualApplications || 0,
    actualConversions: campaign.actualConversions || 0,
    goalActual: parseFloat(campaign.goalActual || "0"),
    metaAdsSpend: parseFloat(campaign.metaAdsSpend || "0"),
    ...instagramMetrics
  };

  const computedKpi = template.calculateKpi(campaignData);
  const dbKpiActual = parseFloat(campaign.kpiActual || "0");
  // For manually-tracked KPIs (leads/bookings stored directly in DB),
  // always prefer the DB value over the computed value.
  // The 'leads' template computes from goalActual which is a different field.
  const isManuallyTracked = campaign.goalType === 'leads' || campaign.kpiUnit === 'bookings';
  const kpiActual = isManuallyTracked && dbKpiActual > 0 ? dbKpiActual
    : computedKpi > 0 ? computedKpi
    : dbKpiActual;
  
  const performanceScore = template.calculatePerformanceScore(
    parseFloat(campaign.goalTarget || "0"),
    parseFloat(campaign.goalActual || "0"),
    parseFloat(campaign.kpiTarget || "0"),
    kpiActual
  );

  return {
    kpiActual,
    performanceScore
  };
}

/**
 * Get recommended goal template for campaign type
 */
export function getRecommendedGoalTemplate(campaignType: string): GoalType {
  const recommendations: Record<string, GoalType> = {
    trial_conversion: "trial_signups",
    membership_acquisition: "conversions",
    member_retention: "retention",
    corporate_events: "revenue",
    pbga_programs: "revenue",
    event_specific: "lead_generation"
  };

  return recommendations[campaignType] || "revenue";
}
