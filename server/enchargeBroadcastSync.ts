/**
 * Encharge Broadcast Sync Service
 * Polls the Encharge broadcasts API and upserts metrics into the local database.
 * Runs automatically every 30 minutes via the scheduler.
 */

import { getDb } from "./db";
import { enchargeBroadcasts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const ENCHARGE_API_KEY = process.env.ENCHARGE_API_KEY!;
const ENCHARGE_API_BASE = "https://api.encharge.io/v1";

interface EnchargeBroadcastRaw {
  id: number;
  name: string;
  status: string;
  emailId?: number;
  audience?: { type: string; segmentId?: number };
  sendAt?: string;
  createdAt?: string;
  updatedAt?: string;
  cachedMetric?: {
    data?: {
      open?: number;
      click?: number;
      delivered?: number;
      bounce?: number;
      unsubscribe?: number;
      spam?: number;
    };
    isStale?: boolean;
  };
  peopleEntered?: number;
}

interface EmailDetails {
  subject?: string;
  fromEmail?: string;
  fromName?: string;
}

interface SegmentDetails {
  name?: string;
}

/**
 * Fetch all broadcasts from Encharge API
 */
async function fetchBroadcasts(): Promise<EnchargeBroadcastRaw[]> {
  const response = await fetch(`${ENCHARGE_API_BASE}/broadcasts`, {
    headers: {
      "X-Encharge-Token": ENCHARGE_API_KEY,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Encharge broadcasts API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data.items || [];
}

/**
 * Fetch email details (subject, from) for a given emailId
 */
async function fetchEmailDetails(emailId: number): Promise<EmailDetails> {
  try {
    const response = await fetch(`${ENCHARGE_API_BASE}/emails/${emailId}`, {
      headers: { "X-Encharge-Token": ENCHARGE_API_KEY },
    });
    if (!response.ok) return {};
    const data = await response.json();
    return {
      subject: data.subject,
      fromEmail: data.fromEmail,
      fromName: data.fromName,
    };
  } catch {
    return {};
  }
}

/**
 * Fetch segment name for a given segmentId
 */
async function fetchSegmentName(segmentId: number): Promise<string | undefined> {
  try {
    const response = await fetch(`${ENCHARGE_API_BASE}/segments`, {
      headers: { "X-Encharge-Token": ENCHARGE_API_KEY },
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    const segments: Array<{ id: number; name: string }> = data.segments || data || [];
    const segment = segments.find((s) => s.id === segmentId);
    return segment?.name;
  } catch {
    return undefined;
  }
}

/**
 * Calculate rates from raw metrics
 */
function calculateRates(metrics: EnchargeBroadcastRaw["cachedMetric"]) {
  const delivered = metrics?.data?.delivered || 0;
  const opens = metrics?.data?.open || 0;
  const clicks = metrics?.data?.click || 0;

  const openRate = delivered > 0 ? parseFloat(((opens / delivered) * 100).toFixed(2)) : 0;
  const clickRate = delivered > 0 ? parseFloat(((clicks / delivered) * 100).toFixed(2)) : 0;
  const clickToOpenRate = opens > 0 ? parseFloat(((clicks / opens) * 100).toFixed(2)) : 0;

  return { openRate, clickRate, clickToOpenRate };
}

/**
 * Sync all Encharge broadcasts to the local database.
 * Returns a summary of what was synced.
 */
export async function syncEnchargeBroadcasts(): Promise<{
  synced: number;
  updated: number;
  errors: number;
  broadcasts: Array<{ id: number; name: string; status: string; delivered: number; opens: number; clicks: number }>;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  console.log("[EnchargeSync] Starting broadcast sync...");
  const broadcasts = await fetchBroadcasts();
  console.log(`[EnchargeSync] Fetched ${broadcasts.length} broadcasts from Encharge`);

  // Fetch segment names once (reuse across broadcasts)
  let segmentCache: Record<number, string> = {};
  try {
    const response = await fetch(`${ENCHARGE_API_BASE}/segments`, {
      headers: { "X-Encharge-Token": ENCHARGE_API_KEY },
    });
    if (response.ok) {
      const data = await response.json();
      const segments: Array<{ id: number; name: string }> = data.segments || data || [];
      segments.forEach((s) => { segmentCache[s.id] = s.name; });
    }
  } catch { /* ignore */ }

  let synced = 0;
  let updated = 0;
  let errors = 0;
  const results: Array<{ id: number; name: string; status: string; delivered: number; opens: number; clicks: number }> = [];

  for (const broadcast of broadcasts) {
    try {
      // Fetch email details if we have an emailId
      let emailDetails: EmailDetails = {};
      if (broadcast.emailId) {
        emailDetails = await fetchEmailDetails(broadcast.emailId);
      }

      const segmentId = broadcast.audience?.segmentId;
      const segmentName = segmentId ? segmentCache[segmentId] : undefined;

      const metrics = broadcast.cachedMetric;
      const { openRate, clickRate, clickToOpenRate } = calculateRates(metrics);

      const delivered = metrics?.data?.delivered || 0;
      const opens = metrics?.data?.open || 0;
      const clicks = metrics?.data?.click || 0;
      const bounces = metrics?.data?.bounce || 0;
      const unsubscribes = metrics?.data?.unsubscribe || 0;
      const spam = metrics?.data?.spam || 0;

      const sendAt = broadcast.sendAt ? new Date(broadcast.sendAt) : null;

      // Check if broadcast already exists
      const existing = await db
        .select({ id: enchargeBroadcasts.id })
        .from(enchargeBroadcasts)
        .where(eq(enchargeBroadcasts.broadcastId, broadcast.id))
        .limit(1);

      const record = {
        broadcastId: broadcast.id,
        name: broadcast.name,
        status: broadcast.status,
        emailId: broadcast.emailId || null,
        subject: emailDetails.subject || null,
        fromEmail: emailDetails.fromEmail || null,
        fromName: emailDetails.fromName || null,
        segmentId: segmentId || null,
        segmentName: segmentName || null,
        sendAt: sendAt,
        delivered,
        opens,
        clicks,
        bounces,
        unsubscribes,
        spam,
        openRate: openRate.toString(),
        clickRate: clickRate.toString(),
        clickToOpenRate: clickToOpenRate.toString(),
        metricsStale: metrics?.isStale || false,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      };

      if (existing.length === 0) {
        await db.insert(enchargeBroadcasts).values({ ...record, createdAt: new Date() });
        synced++;
      } else {
        await db
          .update(enchargeBroadcasts)
          .set(record)
          .where(eq(enchargeBroadcasts.broadcastId, broadcast.id));
        updated++;
      }

      results.push({ id: broadcast.id, name: broadcast.name, status: broadcast.status, delivered, opens, clicks });
    } catch (err) {
      console.error(`[EnchargeSync] Error syncing broadcast ${broadcast.id}:`, err);
      errors++;
    }
  }

  console.log(`[EnchargeSync] Done — ${synced} new, ${updated} updated, ${errors} errors`);
  return { synced, updated, errors, broadcasts: results };
}

/**
 * Get all synced broadcasts from the local database
 */
export async function getSyncedBroadcasts() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(enchargeBroadcasts)
    .orderBy(enchargeBroadcasts.sendAt);
}

/**
 * Get email performance summary across all broadcasts
 */
export async function getEmailPerformanceSummary() {
  const db = await getDb();
  if (!db) return null;

  const result = await db.execute(`
    SELECT
      COUNT(*) as totalBroadcasts,
      COUNT(CASE WHEN status = 'sent' THEN 1 END) as sentBroadcasts,
      COALESCE(SUM(delivered), 0) as totalDelivered,
      COALESCE(SUM(opens), 0) as totalOpens,
      COALESCE(SUM(clicks), 0) as totalClicks,
      COALESCE(AVG(CASE WHEN status = 'sent' AND delivered > 0 THEN open_rate END), 0) as avgOpenRate,
      COALESCE(AVG(CASE WHEN status = 'sent' AND delivered > 0 THEN click_rate END), 0) as avgClickRate,
      MAX(last_synced_at) as lastSyncedAt
    FROM encharge_broadcasts
  `);

  const row = (result as any)[0] || {};
  return {
    totalBroadcasts: Number(row.totalBroadcasts || 0),
    sentBroadcasts: Number(row.sentBroadcasts || 0),
    totalDelivered: Number(row.totalDelivered || 0),
    totalOpens: Number(row.totalOpens || 0),
    totalClicks: Number(row.totalClicks || 0),
    avgOpenRate: parseFloat(row.avgOpenRate || '0'),
    avgClickRate: parseFloat(row.avgClickRate || '0'),
    lastSyncedAt: row.lastSyncedAt ? new Date(row.lastSyncedAt).toISOString() : null,
  };
}
