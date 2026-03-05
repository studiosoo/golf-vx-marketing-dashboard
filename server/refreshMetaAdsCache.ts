import { readMetaAdsCache } from './metaAdsCache';

/**
 * Meta Ads cache is populated by the Manus agent via MCP tool calls.
 * The server runtime cannot invoke manus-mcp-cli directly.
 * This function simply reports the current cache status.
 */
export async function refreshMetaAdsCache(): Promise<{ success: boolean; message: string; campaignCount?: number }> {
  const existingCache = readMetaAdsCache();

  if (existingCache.length > 0) {
    const totalSpend = existingCache.reduce((sum: number, c: any) => sum + parseFloat(c.spend || '0'), 0);
    return {
      success: true,
      message: `Using cached Meta Ads data for ${existingCache.length} campaigns (Total spend: $${totalSpend.toFixed(2)}). Data is refreshed by the Manus agent.`,
      campaignCount: existingCache.length,
    };
  }

  return {
    success: false,
    message: 'No Meta Ads cache available. Please ask the Manus agent to refresh the data.',
    campaignCount: 0,
  };
}
