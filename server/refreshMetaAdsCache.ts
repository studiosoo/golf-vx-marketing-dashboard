import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Refresh Meta Ads cache by running the refresh script
 * This executes the shell script that fetches latest data via MCP
 */
export async function refreshMetaAdsCache(): Promise<{ success: boolean; message: string; campaignCount?: number }> {
  try {
    const scriptPath = path.join(process.cwd(), 'refresh-meta-ads-cache.sh');
    
    console.log('[Meta Ads Cache Refresh] Starting refresh...');
    
    // Execute the refresh script with a 60-second timeout
    const { stdout, stderr } = await execAsync(`bash ${scriptPath}`, {
      timeout: 60000,
      cwd: process.cwd(),
    });
    
    if (stderr && !stderr.includes('Error: mcp server')) {
      console.error('[Meta Ads Cache Refresh] Error:', stderr);
      return {
        success: false,
        message: `Refresh failed: ${stderr}`,
      };
    }
    
    console.log('[Meta Ads Cache Refresh] Output:', stdout);
    
    // Read the updated cache to get campaign count
    const { readMetaAdsCache } = await import('./metaAdsCache');
    const campaigns = readMetaAdsCache();
    
    console.log(`[Meta Ads Cache Refresh] Successfully refreshed ${campaigns.length} campaigns`);
    
    return {
      success: true,
      message: `Successfully refreshed Meta Ads data for ${campaigns.length} campaigns`,
      campaignCount: campaigns.length,
    };
  } catch (error) {
    console.error('[Meta Ads Cache Refresh] Failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
