import fs from 'fs';
import path from 'path';

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

interface CachedInsight {
  campaign_name: string;
  campaign_id?: string;
  impressions: string;
  clicks: string;
  spend: string;
  reach?: string;
  cpc?: string;
  cpm?: string;
  ctr: string;
  actions?: Array<{ action_type: string; value: string }>;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
  date_start?: string;
  date_stop?: string;
}

const CACHE_FILE_PATH = path.join(process.cwd(), '.meta-ads-cache', 'insights.json');

/**
 * Read Meta Ads insights from cache file
 */
export function readMetaAdsCache(): CachedInsight[] {
  try {
    if (!fs.existsSync(CACHE_FILE_PATH)) {
      console.warn('Meta Ads cache file not found');
      return [];
    }
    
    const cacheContent = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
    const cacheData = JSON.parse(cacheContent);
    
    // Handle both array format and object with data array
    if (Array.isArray(cacheData)) {
      return cacheData;
    } else if (cacheData.data && Array.isArray(cacheData.data)) {
      return cacheData.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error reading Meta Ads cache:', error);
    return [];
  }
}

/**
 * Get campaign insights from cache by campaign ID or name
 */
export function getCampaignInsightsFromCache(
  campaignId: string
): MetaAdInsights | null {
  const cacheData = readMetaAdsCache();
  
  // Try to find by campaign_id first
  const cached = cacheData.find(
    (item) => item.campaign_id === campaignId
  );
  
  if (!cached) {
    return null;
  }
  
  // Extract conversions from actions array
  const leadAction = cached.actions?.find((a) => a.action_type === 'lead');
  const leadCostAction = cached.cost_per_action_type?.find((a) => a.action_type === 'lead');
  
  return {
    campaign_id: cached.campaign_id || campaignId,
    campaign_name: cached.campaign_name || '',
    impressions: cached.impressions || '0',
    clicks: cached.clicks || '0',
    spend: cached.spend || '0',
    reach: cached.reach || '0',
    cpc: cached.cpc || '0',
    cpm: cached.cpm || '0',
    ctr: cached.ctr || '0',
    conversions: leadAction?.value,
    cost_per_conversion: leadCostAction?.value,
    date_start: cached.date_start || '',
    date_stop: cached.date_stop || '',
  };
}

/**
 * Get all campaigns with insights from cache
 */
export function getAllCampaignsFromCache(): MetaAdInsights[] {
  const cacheData = readMetaAdsCache();
  
  return cacheData.map((cached) => {
    const leadAction = cached.actions?.find((a) => a.action_type === 'lead');
    const leadCostAction = cached.cost_per_action_type?.find((a) => a.action_type === 'lead');
    
    return {
      campaign_id: cached.campaign_id || '',
      campaign_name: cached.campaign_name || '',
      impressions: cached.impressions || '0',
      clicks: cached.clicks || '0',
      spend: cached.spend || '0',
      reach: cached.reach || '0',
      cpc: cached.cpc || '0',
      cpm: cached.cpm || '0',
      ctr: cached.ctr || '0',
      conversions: leadAction?.value,
      cost_per_conversion: leadCostAction?.value,
      date_start: cached.date_start || '',
      date_stop: cached.date_stop || '',
    };
  });
}

/**
 * Get account data from cache
 */
export function getAccountFromCache() {
  // Return default account data
  return {
    id: process.env.META_ADS_ACCOUNT_ID || "",
    account_id: process.env.META_ADS_ACCOUNT_ID || "",
    name: "Golf VX Arlington Heights",
    currency: "USD",
    timezone_name: "America/Chicago"
  };
}

/**
 * Get account insights from cache (aggregated from all campaigns)
 */
export function getAccountInsightsFromCache() {
  const cacheData = readMetaAdsCache();
  
  if (cacheData.length === 0) {
    return null;
  }
  
  // Aggregate all campaign data
  const totalImpressions = cacheData.reduce((sum, c) => sum + parseFloat(c.impressions || '0'), 0);
  const totalClicks = cacheData.reduce((sum, c) => sum + parseFloat(c.clicks || '0'), 0);
  const totalSpend = cacheData.reduce((sum, c) => sum + parseFloat(c.spend || '0'), 0);
  const totalReach = cacheData.reduce((sum, c) => sum + parseFloat(c.reach || '0'), 0);
  
  const avgCpc = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : '0';
  const avgCpm = totalImpressions > 0 ? ((totalSpend / totalImpressions) * 1000).toFixed(2) : '0';
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';
  
  return {
    impressions: totalImpressions.toString(),
    clicks: totalClicks.toString(),
    spend: totalSpend.toFixed(2),
    reach: totalReach.toString(),
    cpc: avgCpc,
    cpm: avgCpm,
    ctr: avgCtr,
    date_start: cacheData[0]?.date_start || '',
    date_stop: cacheData[0]?.date_stop || ''
  };
}

/**
 * Check if cache file exists and is recent (less than 1 hour old)
 */
export function isCacheValid(): boolean {
  try {
    if (!fs.existsSync(CACHE_FILE_PATH)) {
      return false;
    }
    
    const stats = fs.statSync(CACHE_FILE_PATH);
    const ageInMs = Date.now() - stats.mtimeMs;
    const oneHourInMs = 60 * 60 * 1000;
    
    return ageInMs < oneHourInMs;
  } catch (error) {
    return false;
  }
}
