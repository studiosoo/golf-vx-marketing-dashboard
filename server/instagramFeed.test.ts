import { describe, it, expect } from 'vitest';

/**
 * Instagram Feed Service Tests
 * Tests the live Instagram Graph API integration.
 */
describe('Instagram Feed Service', () => {
  it('should have INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID set', () => {
    expect(process.env.INSTAGRAM_ACCESS_TOKEN).toBeDefined();
    expect(process.env.INSTAGRAM_ACCESS_TOKEN!.length).toBeGreaterThan(10);
    expect(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID).toBeDefined();
    expect(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID).toBe('17841477233922502');
  });

  it('should fetch account stats from Instagram Graph API', async () => {
    const { fetchAccountStats } = await import('./instagramFeed');
    const stats = await fetchAccountStats();

    expect(stats).toBeDefined();
    expect(stats.id).toBe('17841477233922502');
    expect(stats.username).toBe('golfvxarlingtonheights');
    expect(stats.followers_count).toBeTypeOf('number');
    expect(stats.media_count).toBeTypeOf('number');
    expect(stats.followers_count).toBeGreaterThan(0);
  });

  it('should fetch media feed with at least 1 post', async () => {
    const { fetchMediaFeed } = await import('./instagramFeed');
    const posts = await fetchMediaFeed(3);

    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);

    const post = posts[0];
    expect(post.id).toBeDefined();
    expect(post.media_type).toMatch(/^(IMAGE|VIDEO|CAROUSEL_ALBUM)$/);
    expect(post.permalink).toContain('instagram.com');
    expect(post.timestamp).toBeDefined();
    expect(typeof post.like_count).toBe('number');
    expect(typeof post.comments_count).toBe('number');
  });

  it('should return thumbnail_url for VIDEO posts', async () => {
    const { fetchMediaFeed } = await import('./instagramFeed');
    const posts = await fetchMediaFeed(12);

    const videoPosts = posts.filter((p) => p.media_type === 'VIDEO');
    if (videoPosts.length > 0) {
      // VIDEO posts should have thumbnail_url instead of media_url for display
      const videoPost = videoPosts[0];
      expect(videoPost.thumbnail_url || videoPost.media_url).toBeDefined();
    }
  });

  it('should validate token successfully', async () => {
    const { validateToken } = await import('./instagramFeed');
    const result = await validateToken();

    expect(result.valid).toBe(true);
    expect(result.username).toBe('golfvxarlingtonheights');
    expect(result.error).toBeUndefined();
  });
});

/**
 * Content Scheduler Tests
 * Tests the database-backed content queue.
 */
describe('Content Scheduler', () => {
  it('should be able to query the content_queue table', async () => {
    const { getDb } = await import('./db');
    const { contentQueue } = await import('../drizzle/schema');
    const { desc } = await import('drizzle-orm');

    const database = await getDb();
    expect(database).toBeDefined();

    const posts = await database!
      .select()
      .from(contentQueue)
      .orderBy(desc(contentQueue.scheduledFor))
      .limit(10);

    expect(Array.isArray(posts)).toBe(true);
  });

  it('should insert and delete a scheduled post', async () => {
    const { getDb } = await import('./db');
    const { contentQueue } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');

    const database = await getDb();
    expect(database).toBeDefined();

    // Insert a test post
    const [result] = await database!.insert(contentQueue).values({
      campaignId: 'test-vitest',
      contentType: 'feed_post',
      caption: 'Vitest test post - should be deleted',
      hashtags: '#test',
      scheduledFor: new Date(Date.now() + 86400000),
      posted: false,
    });

    const insertId = (result as any).insertId;
    expect(insertId).toBeGreaterThan(0);

    // Verify it exists
    const [found] = await database!
      .select()
      .from(contentQueue)
      .where(eq(contentQueue.id, insertId));
    expect(found).toBeDefined();
    expect(found.caption).toBe('Vitest test post - should be deleted');

    // Clean up
    await database!.delete(contentQueue).where(eq(contentQueue.id, insertId));

    // Verify deletion
    const [deleted] = await database!
      .select()
      .from(contentQueue)
      .where(eq(contentQueue.id, insertId));
    expect(deleted).toBeUndefined();
  });
});
