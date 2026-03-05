/**
 * SQR.co API client
 * Base URL: https://sqr.co/api
 * Auth: Bearer token
 */

import { ENV } from "./_core/env";

const SQR_API_BASE = "https://sqr.co/api";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ENV.sqrApiKey}`,
  };
}

export interface SqrLink {
  id: string | number;
  alias?: string;
  url?: string;
  location_url?: string;
  short_url?: string;
  clicks?: number;
  visits?: number;
  created_at?: string;
}

export interface SqrLinkStats {
  total: number;
  byDate: Array<{ date: string; clicks: number }>;
}

/**
 * Create a short link in SQR.
 * destination is the URL the short link redirects to.
 * alias is the custom slug (e.g. "golf-show-2026").
 */
export async function createSqrLink(
  alias: string,
  destination: string
): Promise<SqrLink> {
  if (!ENV.sqrApiKey) throw new Error("SQR_API_KEY not configured");

  const response = await fetch(`${SQR_API_BASE}/links`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ url: destination, alias }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`SQR create link failed: ${response.status} – ${err}`);
  }

  const data = await response.json();
  return data.data ?? data;
}

/**
 * Fetch all short links.
 */
export async function getSqrLinks(): Promise<SqrLink[]> {
  if (!ENV.sqrApiKey) return [];

  const response = await fetch(`${SQR_API_BASE}/links`, {
    headers: headers(),
  });

  if (!response.ok) {
    throw new Error(`SQR get links failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data ?? data.links ?? (Array.isArray(data) ? data : []);
}

/**
 * Fetch a single link by ID.
 */
export async function getSqrLink(linkId: string): Promise<SqrLink | null> {
  if (!ENV.sqrApiKey) return null;

  const response = await fetch(`${SQR_API_BASE}/links/${linkId}`, {
    headers: headers(),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.data ?? data;
}

/**
 * Fetch click statistics for a link.
 */
export async function getSqrLinkStats(linkId: string): Promise<SqrLinkStats> {
  if (!ENV.sqrApiKey) return { total: 0, byDate: [] };

  const response = await fetch(`${SQR_API_BASE}/links/${linkId}/statistics`, {
    headers: headers(),
  });

  if (!response.ok) return { total: 0, byDate: [] };

  const data = await response.json();
  const raw = data.data ?? data;

  return {
    total: raw.total ?? raw.clicks ?? 0,
    byDate: raw.by_date ?? raw.byDate ?? [],
  };
}
