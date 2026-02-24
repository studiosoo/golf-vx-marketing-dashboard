import { writeMetaAdsCache, readMetaAdsCache } from './metaAdsCache';
import { getCampaigns, getCampaignInsights } from './metaAds';

/**
 * Refresh Meta Ads cache by fetching latest data from the Meta Ads API.
 * Falls back to keeping existing cache if API is unreachable.
 */
export async function refreshMetaAdsCache(): Promise<{ success: boolean; message: string; campaignCount?: number }> {
  try {
    console.log('[Meta Ads Cache Refresh] Starting refresh...');
    
    // Step 1: Fetch all campaigns
    const campaigns = await getCampaigns();
    console.log(`[Meta Ads Cache Refresh] Found ${campaigns.length} campaigns`);
    
    if (campaigns.length === 0) {
      // If no campaigns returned but we have cache, keep it
      const existingCache = readMetaAdsCache();
      if (existingCache.length > 0) {
        return {
          success: true,
          message: `No campaigns returned from API, keeping existing cache with ${existingCache.length} campaigns`,
          campaignCount: existingCache.length,
        };
      }
      return {
        success: true,
        message: 'No campaigns found in the ad account',
        campaignCount: 0,
      };
    }
    
    // Step 2: Fetch insights for each campaign
    const allInsights: any[] = [];
    
    for (const campaign of campaigns) {
      try {
        const insights = await getCampaignInsights(campaign.id, 'maximum');
        
        allInsights.push({
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          created_time: campaign.created_time,
          updated_time: campaign.updated_time,
          impressions: insights.impressions || '0',
          clicks: insights.clicks || '0',
          spend: insights.spend || '0',
          reach: insights.reach || '0',
          cpc: insights.cpc || '0',
          cpm: insights.cpm || '0',
          ctr: insights.ctr || '0',
          conversions: insights.conversions,
          cost_per_conversion: insights.cost_per_conversion,
          date_start: insights.date_start || '',
          date_stop: insights.date_stop || '',
        });
        
        console.log(`[Meta Ads Cache Refresh] Fetched insights for: ${campaign.name} ($${insights.spend})`);
      } catch (error) {
        console.warn(`[Meta Ads Cache Refresh] Failed to fetch insights for ${campaign.name}:`, error);
        // Add campaign with zero metrics
        allInsights.push({
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          created_time: campaign.created_time,
          updated_time: campaign.updated_time,
          impressions: '0',
          clicks: '0',
          spend: '0',
          reach: '0',
          cpc: '0',
          cpm: '0',
          ctr: '0',
          date_start: '',
          date_stop: '',
        });
      }
    }
    
    // Step 3: Write to cache
    writeMetaAdsCache(allInsights);
    
    const totalSpend = allInsights.reduce((sum, c) => sum + parseFloat(c.spend || '0'), 0);
    console.log(`[Meta Ads Cache Refresh] Successfully refreshed ${allInsights.length} campaigns (Total spend: $${totalSpend.toFixed(2)})`);
    
    return {
      success: true,
      message: `Successfully refreshed Meta Ads data for ${allInsights.length} campaigns (Total spend: $${totalSpend.toFixed(2)})`,
      campaignCount: allInsights.length,
    };
  } catch (error) {
    console.error('[Meta Ads Cache Refresh] Failed:', error);
    
    // Check if we have existing cache data
    const existingCache = readMetaAdsCache();
    if (existingCache.length > 0) {
      return {
        success: false,
        message: `API refresh failed (${error instanceof Error ? error.message : 'Unknown error'}). Keeping existing cache with ${existingCache.length} campaigns.`,
        campaignCount: existingCache.length,
      };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
