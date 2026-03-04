import { describe, it, expect } from 'vitest';

describe('Instagram Graph API Integration', () => {
  it('should validate Instagram Business Account ID and token', async () => {
    const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    expect(accountId).toBeDefined();
    expect(accessToken).toBeDefined();

    // Test Instagram Graph API connection
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}?fields=id,username,followers_count,media_count&access_token=${accessToken}`
    );

    expect(response.ok).toBe(true);
    const data = await response.json() as any;
    expect(data.id).toBe(accountId);
    expect(data.username).toBe('golfvxarlingtonheights');
    expect(data.followers_count).toBeTypeOf('number');
  });

  it('should fetch Instagram media feed with instagram_basic permission', async () => {
    const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/media?fields=id,caption,media_type,media_url,timestamp,like_count,comments_count,permalink&limit=3&access_token=${accessToken}`
    );

    expect(response.ok).toBe(true);
    const data = await response.json() as any;
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    const post = data.data[0];
    expect(post.id).toBeDefined();
    expect(post.media_type).toBeDefined();
  });
});
