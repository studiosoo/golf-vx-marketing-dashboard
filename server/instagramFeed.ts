/**
 * Instagram Graph API Service
 * Fetches live feed, account stats, and handles content scheduling.
 */

const IG_API_BASE = "https://graph.facebook.com/v19.0";
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN ?? "";
const ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ?? "";

export interface IgMediaPost {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string; // for VIDEO
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
}

export interface IgAccountStats {
  id: string;
  username: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  biography?: string;
  profile_picture_url?: string;
  website?: string;
}

export interface IgScheduledPost {
  id: number;
  imageUrl: string;
  caption: string;
  hashtags: string;
  scheduledFor: string; // ISO
  contentType: "feed_post" | "story" | "reel" | "carousel";
  posted: boolean;
  instagramPostId?: string;
}

/** Fetch the account profile stats */
export async function fetchAccountStats(): Promise<IgAccountStats> {
  const fields = "id,username,followers_count,follows_count,media_count,biography,profile_picture_url,website";
  const url = `${IG_API_BASE}/${ACCOUNT_ID}?fields=${fields}&access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Instagram account stats failed: ${err}`);
  }
  return res.json() as Promise<IgAccountStats>;
}

/** Fetch the latest N media posts */
export async function fetchMediaFeed(limit = 12): Promise<IgMediaPost[]> {
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";
  const url = `${IG_API_BASE}/${ACCOUNT_ID}/media?fields=${fields}&limit=${limit}&access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Instagram media feed failed: ${err}`);
  }
  const data = (await res.json()) as { data: IgMediaPost[] };
  return data.data ?? [];
}

/** Fetch a single post's details */
export async function fetchPostDetails(postId: string): Promise<IgMediaPost> {
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";
  const url = `${IG_API_BASE}/${postId}?fields=${fields}&access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Instagram post details failed: ${err}`);
  }
  return res.json() as Promise<IgMediaPost>;
}

/**
 * Publish a photo post to Instagram via Content Publishing API.
 * Step 1: Create a container. Step 2: Publish it.
 */
export async function publishPhotoPost(imageUrl: string, caption: string): Promise<string> {
  // Step 1 — create media container
  const createUrl = `${IG_API_BASE}/${ACCOUNT_ID}/media`;
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: ACCESS_TOKEN,
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Instagram create container failed: ${err}`);
  }
  const { id: containerId } = (await createRes.json()) as { id: string };

  // Step 2 — publish
  const publishUrl = `${IG_API_BASE}/${ACCOUNT_ID}/media_publish`;
  const publishRes = await fetch(publishUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: ACCESS_TOKEN,
    }),
  });
  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Instagram publish failed: ${err}`);
  }
  const { id: postId } = (await publishRes.json()) as { id: string };
  return postId;
}

/** Check if the access token is valid */
export async function validateToken(): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const stats = await fetchAccountStats();
    return { valid: true, username: stats.username };
  } catch (e: unknown) {
    return { valid: false, error: (e as Error).message };
  }
}
