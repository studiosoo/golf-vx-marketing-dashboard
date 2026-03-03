import { execSync } from 'child_process';
import { writeMetaAdsCache, readMetaAdsCache } from './metaAdsCache';

/**
 * Refresh Meta Ads cache using the MCP server (manus-mcp-cli).
 * The direct Meta Ads API token returns "API access blocked" (code 200),
 * so we use the MCP connector which has valid OAuth credentials.
 * Falls back to keeping existing cache if MCP is unavailable.
 */
export async function refreshMetaAdsCache(): Promise<{ success: boolean; message: string; campaignCount?: number }> {
  const accountId = process.env.META_ADS_ACCOUNT_ID || '';

  if (!accountId) {
    return { success: false, message: 'META_ADS_ACCOUNT_ID not set' };
  }

  console.log('[Meta Ads Cache Refresh] Starting MCP-based refresh...');

  try {
    // Step 1: Fetch campaigns via MCP
    const campaignsInput = JSON.stringify({ ad_account_id: `act_${accountId}`, limit: 50 });
    const campaignsCmd = `manus-mcp-cli tool call meta_marketing_get_campaigns --server meta-marketing --input '${campaignsInput}'`;
    const campaignsOut = execSync(campaignsCmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 30000 });

    const campaignsMatch = campaignsOut.match(/\/tmp\/manus-mcp\/mcp_result_[a-f0-9]+\.json/);
    if (!campaignsMatch) throw new Error('Failed to get MCP campaigns result file path');

    const campaignsJson = execSync(`cat ${campaignsMatch[0]}`, { encoding: 'utf-8' });
    const campaignsResult = JSON.parse(campaignsJson);
    const campaigns: any[] = campaignsResult?.result?.campaigns || [];

    console.log(`[Meta Ads Cache Refresh] Found ${campaigns.length} campaigns via MCP`);

    if (campaigns.length === 0) {
      const existingCache = readMetaAdsCache();
      if (existingCache.length > 0) {
        return {
          success: true,
          message: `No campaigns returned from MCP, keeping existing cache with ${existingCache.length} campaigns`,
          campaignCount: existingCache.length,
        };
      }
      return { success: true, message: 'No campaigns found in the ad account', campaignCount: 0 };
    }

    // Step 2: Fetch account-level insights at campaign level via MCP
    const insightsInput = JSON.stringify({
      object_id: `act_${accountId}`,
      object_type: 'ad_account',
      date_preset: 'maximum',
      level: 'campaign',
    });
    const insightsCmd = `manus-mcp-cli tool call meta_marketing_get_insights --server meta-marketing --input '${insightsInput}'`;
    const insightsOut = execSync(insightsCmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 30000 });

    const insightsMatch = insightsOut.match(/\/tmp\/manus-mcp\/mcp_result_[a-f0-9]+\.json/);
    if (!insightsMatch) throw new Error('Failed to get MCP insights result file path');

    const insightsJson = execSync(`cat ${insightsMatch[0]}`, { encoding: 'utf-8' });
    const insightsResult = JSON.parse(insightsJson);
    const insights: any[] = insightsResult?.result?.insights || [];

    console.log(`[Meta Ads Cache Refresh] Got insights for ${insights.length} campaigns via MCP`);

    // Step 3: Build a map of campaign name → metadata
    const campaignMeta: Record<string, any> = {};
    for (const c of campaigns) {
      campaignMeta[c.name] = c;
    }

    // Step 4: Merge insights with campaign metadata
    const allInsights = insights.map((ins: any) => {
      const meta = campaignMeta[ins.campaign_name] || {};
      return {
        campaign_id: meta.id || ins.campaign_id || '',
        campaign_name: ins.campaign_name || '',
        status: meta.status || meta.effective_status || 'ACTIVE',
        effective_status: meta.effective_status || meta.status || 'ACTIVE',
        objective: meta.objective || '',
        daily_budget: meta.daily_budget || null,
        created_time: meta.created_time || '',
        updated_time: meta.updated_time || '',
        impressions: ins.impressions || '0',
        clicks: ins.clicks || '0',
        spend: ins.spend || '0',
        reach: ins.reach || '0',
        cpc: ins.cpc || '0',
        cpm: ins.cpm || '0',
        ctr: ins.ctr || '0',
        date_start: ins.date_start || '',
        date_stop: ins.date_stop || '',
      };
    });

    // Step 5: Write to cache
    writeMetaAdsCache(allInsights);

    const totalSpend = allInsights.reduce((sum: number, c: any) => sum + parseFloat(c.spend || '0'), 0);
    console.log(`[Meta Ads Cache Refresh] Successfully refreshed ${allInsights.length} campaigns (Total spend: $${totalSpend.toFixed(2)})`);

    return {
      success: true,
      message: `Successfully refreshed Meta Ads data for ${allInsights.length} campaigns (Total spend: $${totalSpend.toFixed(2)})`,
      campaignCount: allInsights.length,
    };
  } catch (error) {
    console.error('[Meta Ads Cache Refresh] MCP refresh failed:', error);

    // Fall back to existing cache
    const existingCache = readMetaAdsCache();
    if (existingCache.length > 0) {
      return {
        success: false,
        message: `MCP refresh failed (${error instanceof Error ? error.message : 'Unknown error'}). Keeping existing cache with ${existingCache.length} campaigns.`,
        campaignCount: existingCache.length,
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
