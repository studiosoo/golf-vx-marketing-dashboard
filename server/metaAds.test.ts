import { describe, expect, it } from "vitest";
import { testMetaAdsConnection, getAdAccount, getCampaigns, getAccountInsights } from "./metaAds";

describe("Meta Ads API Integration", () => {
  it("should successfully connect to Meta Ads API with provided credentials", async () => {
    const isConnected = await testMetaAdsConnection();
    expect(isConnected).toBe(true);
  }, 30000); // 30 second timeout

  it("should retrieve ad account details", async () => {
    const account = await getAdAccount();
    
    console.log("✅ Ad Account Details:");
    console.log(`  Name: ${account.name}`);
    console.log(`  Account ID: ${account.account_id}`);
    console.log(`  Currency: ${account.currency}`);
    console.log(`  Timezone: ${account.timezone_name}`);
    
    expect(account).toBeDefined();
    expect(account.account_id).toBe("823266657015117");
    expect(account.name).toBeTruthy();
  }, 30000);

  it("should retrieve campaigns from the ad account", async () => {
    const campaigns = await getCampaigns();
    
    console.log(`\n✅ Retrieved ${campaigns.length} campaigns:`);
    campaigns.forEach((campaign, i) => {
      console.log(`\n${i + 1}. ${campaign.name}`);
      console.log(`   ID: ${campaign.id}`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Objective: ${campaign.objective}`);
    });
    
    expect(Array.isArray(campaigns)).toBe(true);
  }, 30000);

  it("should retrieve account-level insights", async () => {
    const insights = await getAccountInsights("last_30d");
    
    console.log("\n✅ Account Insights (Last 30 Days):");
    console.log(`  Spend: $${insights.spend}`);
    console.log(`  Impressions: ${insights.impressions}`);
    console.log(`  Clicks: ${insights.clicks}`);
    console.log(`  CTR: ${insights.ctr}%`);
    console.log(`  CPC: $${insights.cpc}`);
    console.log(`  CPM: $${insights.cpm}`);
    
    expect(insights).toBeDefined();
    expect(insights.spend).toBeDefined();
  }, 30000);
});
