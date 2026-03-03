import { describe, it, expect } from 'vitest';

describe('Instagram API Integration', () => {
  it('should validate Instagram Business Account ID', async () => {
    const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;

    expect(accountId).toBeDefined();
    expect(accessToken).toBeDefined();

    // Test Instagram Graph API connection
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}?fields=id,username,followers_count,media_count&access_token=${accessToken}`
    );

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.id).toBe(accountId);
    expect(data.username).toBeDefined();
    expect(data.followers_count).toBeTypeOf('number');
  });

  it('should fetch Instagram insights', async () => {
    const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}/insights?metric=impressions,reach,follower_count&period=day&access_token=${accessToken}`
    );

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });
});
