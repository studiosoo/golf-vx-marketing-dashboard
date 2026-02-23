import fs from 'fs';
import path from 'path';
import axios from 'axios';

const CACHE_DIR = path.join(process.cwd(), '.meta-ads-cache');
const INSIGHTS_CACHE_PATH = path.join(CACHE_DIR, 'insights.json');

/**
 * Refresh Meta Ads cache by fetching data from Meta Graph API
 * Falls back to reading existing cache if API is blocked
 */
export async function refreshMetaAdsCache(): Promise<{ success: boolean; message: string; campaignCount?: number }> {
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  const accountId = process.env.META_ADS_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    return {
      success: false,
      message: 'Meta Ads credentials not configured (META_ADS_ACCESS_TOKEN or META_ADS_ACCOUNT_ID missing)',
    };
  }

  // Ensure cache directory exists
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  try {
    console.log('[Meta Ads Cache Refresh] Attempting direct API fetch...');
    
    // Try direct API call first
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    const response = await axios.get(
      `https://graph.facebook.com/v21.0/${formattedAccountId}/insights`,
      {
        params: {
          access_token: accessToken,
          level: 'campaign',
          date_preset: 'last_30d',
          fields: 'campaign_name,campaign_id,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type',
          limit: 50,
        },
        timeout: 30000,
      }
    );

    const insights = response.data?.data || [];
    
    // Write to cache file
    fs.writeFileSync(INSIGHTS_CACHE_PATH, JSON.stringify(insights, null, 2));
    
    console.log(`[Meta Ads Cache Refresh] Direct API: cached ${insights.length} campaign insights`);
    
    return {
      success: true,
      message: `Successfully refreshed Meta Ads data for ${insights.length} campaigns via direct API`,
      campaignCount: insights.length,
    };
  } catch (apiError) {
    console.warn('[Meta Ads Cache Refresh] Direct API failed, checking existing cache...', 
      apiError instanceof Error ? apiError.message : 'Unknown error');
    
    // Check if we have an existing cache file
    if (fs.existsSync(INSIGHTS_CACHE_PATH)) {
      try {
        const cacheContent = fs.readFileSync(INSIGHTS_CACHE_PATH, 'utf-8');
        const cachedData = JSON.parse(cacheContent);
        const campaignCount = Array.isArray(cachedData) ? cachedData.length : 0;
        
        const stats = fs.statSync(INSIGHTS_CACHE_PATH);
        const ageMinutes = Math.round((Date.now() - stats.mtimeMs) / 60000);
        
        console.log(`[Meta Ads Cache Refresh] Using existing cache (${ageMinutes}min old, ${campaignCount} campaigns)`);
        
        return {
          success: true,
          message: `Using cached Meta Ads data (${ageMinutes} minutes old) for ${campaignCount} campaigns. Direct API access is blocked - cache was populated via MCP.`,
          campaignCount,
        };
      } catch (cacheError) {
        return {
          success: false,
          message: 'Direct API blocked and cache file is corrupted',
        };
      }
    }
    
    return {
      success: false,
      message: 'Direct API access blocked and no cache file exists. Data must be populated via MCP sync.',
    };
  }
}
