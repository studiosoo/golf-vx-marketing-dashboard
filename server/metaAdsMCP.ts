import { execSync } from 'child_process';

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
 * Get campaign insights using MCP server
 */
export async function getCampaignInsightsViaMCP(
  campaignId: string,
  datePreset: string = "last_30d"
): Promise<MetaAdInsights> {
  try {
    // Map 'lifetime' to 'maximum' for Meta Ads API compatibility
    const apiDatePreset = datePreset === "lifetime" ? "maximum" : datePreset;
    
    const input = JSON.stringify({
      object_id: campaignId,
      object_type: "campaign",
      date_preset: apiDatePreset
    });
    
    const command = `manus-mcp-cli tool call meta_marketing_get_insights --server meta-marketing --input '${input}'`;
    const output = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    
    // Extract the JSON file path from output
    const match = output.match(/\/tmp\/manus-mcp\/mcp_result_[a-f0-9]+\.json/);
    if (!match) {
      throw new Error("Failed to get MCP result file path");
    }
    
    const resultFile = match[0];
    const resultJson = execSync(`cat ${resultFile}`, { encoding: 'utf-8' });
    const result = JSON.parse(resultJson);
    
    // Extract insights from MCP result
    const insights = result[0]?.data?.[0];
    
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
      conversions: insights.actions?.find((a: any) => a.action_type === "lead")?.value,
      cost_per_conversion: insights.cost_per_action_type?.find((a: any) => a.action_type === "lead")?.value,
      date_start: insights.date_start || "",
      date_stop: insights.date_stop || "",
    };
  } catch (error) {
    console.error(`Error fetching insights via MCP for campaign ${campaignId}:`, error);
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
}
