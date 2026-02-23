import axios from "axios";
import { createRetryableMetaAdsClient } from "./metaAdsRetry";

interface MetaAdAccount {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  timezone_name: string;
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  created_time: string;
  updated_time: string;
}

interface MetaAdInsights {
  campaign_id: string;
  campaign_name: string;
  impressions: string;
  clicks: string;
  spend: string;
  reach: string;
  cpc: string;
  cpm: string;
  ctr: string;
  conversions?: string;
  cost_per_conversion?: string;
  date_start: string;
  date_stop: string;
}

/**
 * Get Meta Ads API credentials from environment
 */
function getMetaAdsCredentials() {
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  const accountId = process.env.META_ADS_ACCOUNT_ID;
  
  if (!accessToken || !accountId) {
    throw new Error("Meta Ads API credentials not configured");
  }
  
  // Ensure account ID has act_ prefix
  const formattedAccountId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  
  return { accessToken, accountId: formattedAccountId };
}

/**
 * Create axios instance with Meta Ads authentication and retry logic
 */
function createMetaAdsClient() {
  const { accessToken } = getMetaAdsCredentials();
  
  const baseClient = axios.create({
    baseURL: "https://graph.facebook.com/v21.0",
    params: {
      access_token: accessToken,
    },
  });
  
  // Wrap with retry logic
  return createRetryableMetaAdsClient(baseClient);
}

/**
 * Test Meta Ads API connection
 */
export async function testMetaAdsConnection(): Promise<boolean> {
  try {
    const { accountId } = getMetaAdsCredentials();
    const client = createMetaAdsClient();
    const response = await client.get(`/${accountId}`, {
      params: {
        fields: "name,account_id,currency",
      },
    });
    return response.status === 200 && !!response.data.name;
  } catch (error) {
    console.error("Meta Ads connection test failed:", error);
    return false;
  }
}

/**
 * Get ad account details
 */
export async function getAdAccount(): Promise<MetaAdAccount> {
  const { accountId } = getMetaAdsCredentials();
  const client = createMetaAdsClient();
  
  const response = await client.get(`/${accountId}`, {
    params: {
      fields: "name,account_id,currency,timezone_name",
    },
  });
  
  return response.data;
}

/**
 * Get all campaigns in the ad account
 */
export async function getCampaigns(): Promise<MetaCampaign[]> {
  const { accountId } = getMetaAdsCredentials();
  const client = createMetaAdsClient();
  
  const response = await client.get(`/${accountId}/campaigns`, {
    params: {
      fields: "name,status,objective,created_time,updated_time",
      limit: 100,
    },
  });
  
  return response.data.data || [];
}

/**
 * Get campaign insights (performance metrics)
 */
export async function getCampaignInsights(
  campaignId: string,
  datePreset: string = "last_30d"
): Promise<MetaAdInsights> {
  const client = createMetaAdsClient();
  
  // Map 'lifetime' to 'maximum' for Meta Ads API compatibility
  const apiDatePreset = datePreset === "lifetime" ? "maximum" : datePreset;
  
  // Query campaign insights directly using campaign ID endpoint
  const response = await client.get(`/${campaignId}/insights`, {
    params: {
      fields: "campaign_id,campaign_name,impressions,clicks,spend,reach,cpc,cpm,ctr,actions,cost_per_action_type,date_start,date_stop",
      date_preset: apiDatePreset,
    },
  });
  
  const insights = response.data.data?.[0];
  
  if (!insights) {
    return {
      campaign_id: campaignId,
      campaign_name: "",
      impressions: "0",
      clicks: "0",
      spend: "0",
      reach: "0",
      cpc: "0",
      cpm: "0",
      ctr: "0",
      date_start: "",
      date_stop: "",
    };
  }
  
  // Extract conversions from actions array
  const leadAction = insights.actions?.find((a: any) => a.action_type === "lead");
  const leadCostAction = insights.cost_per_action_type?.find((a: any) => a.action_type === "lead");
  
  return {
    campaign_id: insights.campaign_id || campaignId,
    campaign_name: insights.campaign_name || "",
    impressions: insights.impressions || "0",
    clicks: insights.clicks || "0",
    spend: insights.spend || "0",
    reach: insights.reach || "0",
    cpc: insights.cpc || "0",
    cpm: insights.cpm || "0",
    ctr: insights.ctr || "0",
    conversions: leadAction?.value,
    cost_per_conversion: leadCostAction?.value,
    date_start: insights.date_start || "",
    date_stop: insights.date_stop || "",
  };
}

/**
 * Get all campaigns with their insights
 */
export async function getAllCampaignsWithInsights(datePreset: string = "last_30d") {
  // Import cache module
  const { readMetaAdsCache } = await import('./metaAdsCache');
  
  // Read all insights from cache
  const allInsights = readMetaAdsCache();
  
  // Transform cache data to match expected campaign format
  const campaignsWithInsights = allInsights.map((insight) => ({
    id: insight.campaign_id,
    name: insight.campaign_name,
    status: "ACTIVE", // Cache doesn't have status, assume active
    objective: "OUTCOME_AWARENESS", // Default objective
    created_time: "",
    updated_time: "",
    insights: insight,
  }));
  
  return campaignsWithInsights;
}

/**
 * Get account-level insights (aggregated across all campaigns)
 */
export async function getAccountInsights(datePreset: string = "last_30d") {
  const { accountId } = getMetaAdsCredentials();
  const client = createMetaAdsClient();
  
  const response = await client.get(`/${accountId}/insights`, {
    params: {
      fields: "impressions,clicks,spend,reach,cpc,cpm,ctr,conversions,cost_per_conversion",
      date_preset: datePreset,
      level: "account",
    },
  });
  
  const insights = response.data.data?.[0];
  
  if (!insights) {
    return {
      impressions: "0",
      clicks: "0",
      spend: "0",
      reach: "0",
      cpc: "0",
      cpm: "0",
      ctr: "0",
      conversions: "0",
      cost_per_conversion: "0",
    };
  }
  
  return insights;
}

/**
 * Get campaign insights for a specific date range
 */
export async function getCampaignInsightsByDateRange(
  campaignId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
): Promise<MetaAdInsights> {
  const client = createMetaAdsClient();
  
  const response = await client.get(`/${campaignId}/insights`, {
    params: {
      fields: "campaign_id,campaign_name,impressions,clicks,spend,reach,cpc,cpm,ctr,conversions,cost_per_conversion",
      time_range: JSON.stringify({ since: startDate, until: endDate }),
    },
  });
  
  const insights = response.data.data?.[0];
  
  if (!insights) {
    return {
      campaign_id: campaignId,
      campaign_name: "",
      impressions: "0",
      clicks: "0",
      spend: "0",
      reach: "0",
      cpc: "0",
      cpm: "0",
      ctr: "0",
      date_start: startDate,
      date_stop: endDate,
    };
  }
  
  return insights;
}

/**
 * Get campaign budget information
 */
export async function getCampaignBudget(campaignId: string) {
  const client = createMetaAdsClient();
  
  const response = await client.get(`/${campaignId}`, {
    params: {
      fields: "name,daily_budget,lifetime_budget,budget_remaining,spend_cap",
    },
  });
  
  return response.data;
}

/**
 * Sync Meta Ads campaign budgets and spend to database
 * Returns array of campaign IDs that were synced
 */
export async function syncMetaAdsBudgets() {
  const { syncMetaAdsSpend, linkMetaAdsCampaign, getAllCampaigns } = await import("./db");
  
  // Get all campaigns from database that have Meta Ads campaign IDs
  const dbCampaigns = await getAllCampaigns();
  const metaAdsCampaigns = dbCampaigns.filter(c => c.metaAdsCampaignId);
  
  const syncedCampaigns: number[] = [];
  
  for (const dbCampaign of metaAdsCampaigns) {
    try {
      // Get latest spend from Meta Ads
      const insights = await getCampaignInsights(dbCampaign.metaAdsCampaignId!, "lifetime");
      
      // Update database with latest spend
      await syncMetaAdsSpend(dbCampaign.id, insights.spend);
      
      syncedCampaigns.push(dbCampaign.id);
    } catch (error) {
      console.error(`Error syncing Meta Ads data for campaign ${dbCampaign.id}:`, error);
    }
  }
  
  return syncedCampaigns;
}

/**
 * Auto-match and link Meta Ads campaigns to database campaigns by name similarity
 */
export async function autoLinkMetaAdsCampaigns() {
  const { getAllCampaigns, linkMetaAdsCampaign } = await import("./db");
  
  // Get all campaigns from database without Meta Ads links
  const dbCampaigns = await getAllCampaigns();
  const unlinkedCampaigns = dbCampaigns.filter(c => !c.metaAdsCampaignId);
  
  // Get all Meta Ads campaigns
  const metaCampaigns = await getCampaigns();
  
  const linkedCampaigns: Array<{ dbCampaignId: number; metaCampaignId: string; name: string }> = [];
  
  for (const dbCampaign of unlinkedCampaigns) {
    // Try to find matching Meta Ads campaign by name (case-insensitive, partial match)
    const matchingMetaCampaign = metaCampaigns.find(mc => 
      mc.name.toLowerCase().includes(dbCampaign.name.toLowerCase()) ||
      dbCampaign.name.toLowerCase().includes(mc.name.toLowerCase())
    );
    
    if (matchingMetaCampaign) {
      await linkMetaAdsCampaign(dbCampaign.id, matchingMetaCampaign.id);
      linkedCampaigns.push({
        dbCampaignId: dbCampaign.id,
        metaCampaignId: matchingMetaCampaign.id,
        name: dbCampaign.name
      });
    }
  }
  
  return linkedCampaigns;
}

/**
 * Get daily historical insights for a campaign (last N days)
 */
export async function getCampaignDailyInsights(
  campaignId: string,
  days: number = 30
): Promise<Array<MetaAdInsights & { date: string }>> {
  const client = createMetaAdsClient();
  
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const response = await client.get(`/${campaignId}/insights`, {
    params: {
      fields: "campaign_id,campaign_name,impressions,clicks,spend,reach,cpc,cpm,ctr,actions,cost_per_action_type,date_start,date_stop",
      time_range: JSON.stringify({
        since: startDate.toISOString().split('T')[0],
        until: endDate.toISOString().split('T')[0],
      }),
      time_increment: 1, // Daily breakdown
    },
  });
  
  const dailyInsights = response.data.data || [];
  
  return dailyInsights.map((insights: any) => {
    // Extract conversions from actions array
    const leadAction = insights.actions?.find((a: any) => a.action_type === "lead");
    const leadCostAction = insights.cost_per_action_type?.find((a: any) => a.action_type === "lead");
    
    return {
      campaign_id: insights.campaign_id || campaignId,
      campaign_name: insights.campaign_name || "",
      impressions: insights.impressions || "0",
      clicks: insights.clicks || "0",
      spend: insights.spend || "0",
      reach: insights.reach || "0",
      cpc: insights.cpc || "0",
      cpm: insights.cpm || "0",
      ctr: insights.ctr || "0",
      conversions: leadAction?.value,
      cost_per_conversion: leadCostAction?.value,
      date_start: insights.date_start || "",
      date_stop: insights.date_stop || "",
      date: insights.date_start || "",
    };
  });
}

/**
 * Get campaign creative (ad images/videos)
 */
export async function getCampaignCreatives(campaignId: string) {
  const client = createMetaAdsClient();
  
  try {
    // Get ads for this campaign
    const adsResponse = await client.get(`/${campaignId}/ads`, {
      params: {
        fields: "id,name,status,creative{id,name,image_url,thumbnail_url,object_story_spec}",
        limit: 10,
      },
    });
    
    const ads = adsResponse.data.data || [];
    
    return ads.map((ad: any) => ({
      id: ad.id,
      name: ad.name,
      status: ad.status,
      creative: {
        id: ad.creative?.id,
        name: ad.creative?.name,
        imageUrl: ad.creative?.image_url || ad.creative?.thumbnail_url,
        objectStorySpec: ad.creative?.object_story_spec,
      },
    }));
  } catch (error) {
    console.error(`Error fetching creatives for campaign ${campaignId}:`, error);
    return [];
  }
}

/**
 * Get campaign audience demographics
 */
export async function getCampaignAudience(campaignId: string, datePreset: string = "last_30d") {
  const client = createMetaAdsClient();
  
  try {
    const response = await client.get(`/${campaignId}/insights`, {
      params: {
        fields: "impressions,clicks,spend",
        breakdowns: "age,gender",
        date_preset: datePreset,
      },
    });
    
    const demographics = response.data.data || [];
    
    return demographics.map((demo: any) => ({
      age: demo.age,
      gender: demo.gender,
      impressions: demo.impressions || "0",
      clicks: demo.clicks || "0",
      spend: demo.spend || "0",
    }));
  } catch (error) {
    console.error(`Error fetching audience for campaign ${campaignId}:`, error);
    return [];
  }
}
