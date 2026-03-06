/**
 * OUTPUT_enchargeSync.ts
 * Golf VX Marketing Dashboard — Encharge Bidirectional Sync Module
 *
 * Read  API : https://api.encharge.io/v1   (header: X-Encharge-Token: API_KEY)
 * Write API : https://ingest.encharge.io/v1 (body field: writeKey)
 *
 * Required env vars:
 *   ENCHARGE_API_KEY   — JWT token for read operations
 *   ENCHARGE_WRITE_KEY — Write key for ingest operations
 *
 * Graceful degradation: all functions return empty/falsy values when
 * credentials are missing rather than throwing.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EnchargePerson {
  userId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Custom fields
}

export interface EnchargeSegment {
  id: number;
  name: string;
  count?: number;
  createdAt?: string;
}

export interface EnchargeUpsertPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  membershipPlan?: string;
  membershipStatus?: string;
  membershipStartDate?: string;
  membershipExpiryDate?: string;
  boomerangId?: string;
  leadSource?: string;
  tags?: string[];
}

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

export interface PullResult {
  updated: number;
  newLeads: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Configuration helpers
// ---------------------------------------------------------------------------

function isReadConfigured(): boolean {
  return Boolean(process.env.ENCHARGE_API_KEY?.trim());
}

function isWriteConfigured(): boolean {
  return Boolean(process.env.ENCHARGE_WRITE_KEY?.trim());
}

/** Returns true when BOTH read and write keys are present. */
export function isEnchargeConfigured(): boolean {
  return isReadConfigured() && isWriteConfigured();
}

// ---------------------------------------------------------------------------
// Base HTTP helpers
// ---------------------------------------------------------------------------

const READ_BASE = "https://api.encharge.io/v1";
const WRITE_BASE = "https://ingest.encharge.io/v1";

async function enchargeGet<T = any>(
  path: string,
  params: Record<string, any> = {}
): Promise<T | null> {
  if (!isReadConfigured()) {
    console.warn("[Encharge] Read API key not configured.");
    return null;
  }

  const url = new URL(`${READ_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-Encharge-Token": process.env.ENCHARGE_API_KEY!,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error(`[Encharge] GET ${path} — HTTP ${res.status}: ${await res.text()}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error(`[Encharge] GET ${path} error:`, err);
    return null;
  }
}

async function enchargePost<T = any>(
  path: string,
  body: Record<string, any>
): Promise<T | null> {
  if (!isReadConfigured()) {
    console.warn("[Encharge] Read API key not configured.");
    return null;
  }

  try {
    const res = await fetch(`${READ_BASE}${path}`, {
      method: "POST",
      headers: {
        "X-Encharge-Token": process.env.ENCHARGE_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`[Encharge] POST ${path} — HTTP ${res.status}: ${await res.text()}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error(`[Encharge] POST ${path} error:`, err);
    return null;
  }
}

/** Sends an identify event to the Encharge ingest endpoint. */
async function enchargeIngest(user: Record<string, any>): Promise<boolean> {
  if (!isWriteConfigured()) {
    console.warn("[Encharge] Write key not configured.");
    return false;
  }

  try {
    const res = await fetch(WRITE_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "identify",
        user,
        writeKey: process.env.ENCHARGE_WRITE_KEY,
      }),
    });

    if (!res.ok) {
      console.error(`[Encharge] Ingest error — HTTP ${res.status}: ${await res.text()}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Encharge] Ingest request failed:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 1. Read operations
// ---------------------------------------------------------------------------

/**
 * Returns one page of people from Encharge.
 * @param page 1-based page number
 */
export async function getEnchargePeople(
  page = 1
): Promise<{ people: EnchargePerson[]; hasMore: boolean }> {
  try {
    const data = await enchargeGet<any>("/people", { page, limit: 100 });
    if (!data) return { people: [], hasMore: false };

    const people: EnchargePerson[] = data.data ?? data.people ?? [];
    const hasMore: boolean =
      data.hasMore ?? data.meta?.hasMore ?? people.length === 100;

    return { people, hasMore };
  } catch (err) {
    console.error("[Encharge] getEnchargePeople error:", err);
    return { people: [], hasMore: false };
  }
}

/**
 * Looks up a single person by email address.
 * Returns null when not found or on error.
 */
export async function getEnchargePersonByEmail(
  email: string
): Promise<EnchargePerson | null> {
  try {
    const data = await enchargeGet<any>(`/people/${encodeURIComponent(email)}`);
    if (!data) return null;
    return (data.data ?? data.person ?? data) as EnchargePerson;
  } catch (err) {
    console.error("[Encharge] getEnchargePersonByEmail error:", err);
    return null;
  }
}

/**
 * Returns the count of Encharge contacts that have the AHTIL tag.
 * Tries the tag filter param first; falls back to full-list count.
 */
export async function getAHTILTagCount(): Promise<number> {
  if (!isReadConfigured()) return 0;
  try {
    // Try tag-filtered request — if API supports it, meta.total has count
    const data = await enchargeGet<any>("/people", { tag: "AHTIL", limit: 100, page: 1 });
    if (!data) return 0;
    // Check for total in metadata
    const metaTotal = data.meta?.total ?? data.totalCount ?? data.total;
    if (typeof metaTotal === "number") return metaTotal;
    // Otherwise count from paginated results
    const firstPage: any[] = data.data ?? data.people ?? [];
    let count = firstPage.filter((p: any) =>
      Array.isArray(p.tags) ? p.tags.some((t: string) => t === "AHTIL") : false
    ).length;
    if (firstPage.length < 100) return count;
    // Continue paging
    let page = 2;
    while (true) {
      const more = await enchargeGet<any>("/people", { tag: "AHTIL", limit: 100, page });
      if (!more) break;
      const batch: any[] = more.data ?? more.people ?? [];
      count += batch.filter((p: any) =>
        Array.isArray(p.tags) ? p.tags.some((t: string) => t === "AHTIL") : false
      ).length;
      if (batch.length < 100) break;
      page++;
      if (page > 50) break; // safety cap
    }
    return count;
  } catch (err) {
    console.error("[Encharge] getAHTILTagCount error:", err);
    return 0;
  }
}

/**
 * Returns all segments defined in the Encharge account.
 */
export async function getEnchargeSegments(): Promise<EnchargeSegment[]> {
  try {
    const data = await enchargeGet<any>("/segments");
    if (!data) return [];
    return (data.data ?? data.segments ?? []) as EnchargeSegment[];
  } catch (err) {
    console.error("[Encharge] getEnchargeSegments error:", err);
    return [];
  }
}

/**
 * Returns one page of people belonging to a specific segment.
 */
export async function getSegmentPeople(
  segmentId: number,
  page = 1
): Promise<EnchargePerson[]> {
  try {
    const data = await enchargeGet<any>(`/segments/${segmentId}/people`, {
      page,
      limit: 100,
    });
    if (!data) return [];
    return (data.data ?? data.people ?? []) as EnchargePerson[];
  } catch (err) {
    console.error("[Encharge] getSegmentPeople error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 2. Write operations — Push data TO Encharge
// ---------------------------------------------------------------------------

/**
 * Creates or updates a person in Encharge via the ingest API.
 * All Golf VX custom fields are mapped here.
 */
export async function upsertEnchargePerson(
  data: EnchargeUpsertPayload
): Promise<boolean> {
  try {
    const user: Record<string, any> = {
      email: data.email,
    };

    if (data.firstName !== undefined) user.firstName = data.firstName;
    if (data.lastName !== undefined) user.lastName = data.lastName;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.membershipPlan !== undefined) user.membershipPlan = data.membershipPlan;
    if (data.membershipStatus !== undefined) user.membershipStatus = data.membershipStatus;
    if (data.membershipStartDate !== undefined) user.membershipStartDate = data.membershipStartDate;
    if (data.membershipExpiryDate !== undefined) user.membershipExpiryDate = data.membershipExpiryDate;
    if (data.boomerangId !== undefined) user.boomerangId = data.boomerangId;
    if (data.leadSource !== undefined) user.leadSource = data.leadSource;

    // Tags are passed as a comma-separated string in the ingest API
    if (data.tags && data.tags.length > 0) {
      user.tags = data.tags.join(",");
    }

    return await enchargeIngest(user);
  } catch (err) {
    console.error("[Encharge] upsertEnchargePerson error:", err);
    return false;
  }
}

/**
 * Batch upsert — processes records sequentially to avoid rate limiting.
 * Returns counts of successes and failures.
 */
export async function batchUpsertEncharge(
  people: Array<{ email: string; [key: string]: any }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const person of people) {
    try {
      const ok = await enchargeIngest(person);
      ok ? success++ : failed++;
    } catch (err) {
      console.error(`[Encharge] batchUpsert failed for ${person.email}:`, err);
      failed++;
    }
    // Small delay to respect Encharge rate limits (~10 req/s)
    await new Promise((r) => setTimeout(r, 100));
  }

  return { success, failed };
}

// ---------------------------------------------------------------------------
// 3. Tag operations
// ---------------------------------------------------------------------------

/**
 * Adds a single tag to an existing person.
 */
export async function addEnchargeTag(
  email: string,
  tag: string
): Promise<boolean> {
  try {
    const result = await enchargePost("/tags", {
      email,
      tag,
    });
    return result !== null;
  } catch (err) {
    console.error("[Encharge] addEnchargeTag error:", err);
    return false;
  }
}

/**
 * Removes a single tag from a person.
 */
export async function removeEnchargeTag(
  email: string,
  tag: string
): Promise<boolean> {
  if (!isReadConfigured()) {
    console.warn("[Encharge] Read API key not configured.");
    return false;
  }

  try {
    const res = await fetch(`${READ_BASE}/tags`, {
      method: "DELETE",
      headers: {
        "X-Encharge-Token": process.env.ENCHARGE_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, tag }),
    });

    return res.ok;
  } catch (err) {
    console.error("[Encharge] removeEnchargeTag error:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 4. Sync orchestration — push Golf VX members to Encharge
// ---------------------------------------------------------------------------

/**
 * Syncs a single Golf VX member record to Encharge.
 * Converts epoch ms timestamps to ISO date strings for Encharge custom fields.
 */
export async function syncMemberToEncharge(member: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  membershipPlan: string;
  membershipStatus: string;
  startDate?: number;
  expiryDate?: number;
}): Promise<boolean> {
  try {
    return await upsertEnchargePerson({
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone,
      membershipPlan: member.membershipPlan,
      membershipStatus: member.membershipStatus,
      membershipStartDate: member.startDate
        ? new Date(member.startDate).toISOString().split("T")[0]
        : undefined,
      membershipExpiryDate: member.expiryDate
        ? new Date(member.expiryDate).toISOString().split("T")[0]
        : undefined,
    });
  } catch (err) {
    console.error("[Encharge] syncMemberToEncharge error:", err);
    return false;
  }
}

/**
 * Batch-syncs an array of members to Encharge.
 * Collects individual errors without aborting the entire batch.
 */
export async function syncAllMembersToEncharge(
  members: any[]
): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, failed: 0, errors: [] };

  for (const member of members) {
    try {
      const ok = await syncMemberToEncharge(member);
      if (ok) {
        result.synced++;
      } else {
        result.failed++;
        result.errors.push(`Failed to sync member: ${member.email}`);
      }
    } catch (err: any) {
      result.failed++;
      result.errors.push(`Error syncing ${member.email}: ${err?.message ?? String(err)}`);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// 5. Reverse sync — pull Encharge data into our DB
// ---------------------------------------------------------------------------

/**
 * Pulls all people from Encharge and returns a summary of new leads and
 * updates. The caller is responsible for persisting changes to the DB —
 * this module does not have a DB reference to remain loosely coupled.
 *
 * Returns structured data that the tRPC router can use to write to emailCaptures.
 */
export async function pullEnchargeUpdates(): Promise<
  PullResult & {
    /** People found in Encharge that the router should upsert locally */
    people: EnchargePerson[];
  }
> {
  const result: PullResult & { people: EnchargePerson[] } = {
    updated: 0,
    newLeads: 0,
    errors: [],
    people: [],
  };

  if (!isReadConfigured()) {
    result.errors.push("ENCHARGE_API_KEY not configured");
    return result;
  }

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { people, hasMore: more } = await getEnchargePeople(page);
      result.people.push(...people);
      hasMore = more;
      page++;

      // Safety cap
      if (page > 200) {
        console.warn("[Encharge] pullEnchargeUpdates: reached 200-page safety limit.");
        break;
      }

      // Small delay between pages
      await new Promise((r) => setTimeout(r, 150));
    }

    // The counts are placeholders — the tRPC layer calculates actual
    // new vs. updated based on existing DB records
    result.updated = result.people.length;
  } catch (err: any) {
    result.errors.push(`pullEnchargeUpdates error: ${err?.message ?? String(err)}`);
  }

  return result;
}
