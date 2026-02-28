import { describe, it, expect } from 'vitest';

describe('Meta Ads API Integration', () => {
  it('should validate Meta Ads access token by fetching account info', async () => {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    const accountId = process.env.META_ADS_ACCOUNT_ID;
    
    expect(accessToken).toBeDefined();
    expect(accountId).toBeDefined();
    
    // Test API connection with a lightweight endpoint
    // Account ID should already have 'act_' prefix, don't add it again
    const formattedAccountId = accountId?.startsWith('act_') ? accountId : `act_${accountId}`;
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${formattedAccountId}?fields=name,account_status&access_token=${accessToken}`
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Meta API Error:', data);
      throw new Error(`Meta API returned error: ${JSON.stringify(data)}`);
    }
    
    expect(response.ok).toBe(true);
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('account_status');
    expect(data.account_status).toBe(1); // 1 = ACTIVE
  });
});
