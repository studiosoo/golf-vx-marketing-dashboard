import { describe, it, expect } from 'vitest';
import * as metaAds from './metaAds';

describe('Meta Ads Integration - Full API Test', () => {
  it('should fetch ad account details', async () => {
    const account = await metaAds.getAdAccount();
    
    expect(account).toBeDefined();
    expect(account.id).toBeDefined();
    expect(account.name).toBeDefined();
    expect(account.currency).toBeDefined();
    
    console.log('Ad Account:', account.name, '|', account.id);
  });

  it('should fetch all campaigns', async () => {
    const campaigns = await metaAds.getCampaigns();
    
    expect(Array.isArray(campaigns)).toBe(true);
    
    if (campaigns.length > 0) {
      const firstCampaign = campaigns[0];
      expect(firstCampaign.id).toBeDefined();
      expect(firstCampaign.name).toBeDefined();
      expect(firstCampaign.status).toBeDefined();
      
      console.log(`Found ${campaigns.length} campaigns`);
      console.log('First campaign:', firstCampaign.name, '|', firstCampaign.status);
    } else {
      console.log('No campaigns found in account');
    }
  });

  it('should fetch account-level insights', async () => {
    const insights = await metaAds.getAccountInsights('last_30d');
    
    expect(insights).toBeDefined();
    expect(insights.spend).toBeDefined();
    expect(insights.impressions).toBeDefined();
    expect(insights.clicks).toBeDefined();
    
    console.log('Account Insights (Last 30 Days):');
    console.log('- Spend:', insights.spend);
    console.log('- Impressions:', insights.impressions);
    console.log('- Clicks:', insights.clicks);
    console.log('- CTR:', insights.ctr);
  });

  it('should fetch campaigns with insights', async () => {
    const campaignsWithInsights = await metaAds.getAllCampaignsWithInsights('last_30d');
    
    expect(Array.isArray(campaignsWithInsights)).toBe(true);
    
    if (campaignsWithInsights.length > 0) {
      const firstCampaign = campaignsWithInsights[0];
      expect(firstCampaign.insights).toBeDefined();
      expect(firstCampaign.insights.spend).toBeDefined();
      
      console.log(`\nCampaigns with insights (${campaignsWithInsights.length} total):`);
      campaignsWithInsights.slice(0, 3).forEach(campaign => {
        console.log(`- ${campaign.name}: $${campaign.insights.spend} spent, ${campaign.insights.impressions} impressions`);
      });
    }
  });

  it('should test connection successfully', async () => {
    const isConnected = await metaAds.testMetaAdsConnection();
    expect(isConnected).toBe(true);
  });
});
