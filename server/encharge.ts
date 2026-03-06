const ENCHARGE_API_KEY = process.env.ENCHARGE_API_KEY!;
const ENCHARGE_WRITE_KEY = process.env.ENCHARGE_WRITE_KEY!;
const ENCHARGE_API_BASE = "https://api.encharge.io/v1";

export interface EnchargeAccount {
  accountId: number;
  name: string;
  site: string;
  industry: string;
  writeKey: string;
}

export interface EncchargePerson {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  createdAt?: string;
  tags?: string[];
  fields?: Record<string, any>;
}

export interface EnchargeSegment {
  id: string;
  name: string;
  peopleCount: number;
}

/**
 * Get Encharge account information
 */
export async function getEnchargeAccount(): Promise<EnchargeAccount> {
  const response = await fetch(`${ENCHARGE_API_BASE}/accounts/me`, {
    headers: {
      "X-Encharge-Token": ENCHARGE_API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Encharge API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all people (subscribers) from Encharge
 */
export async function getEnchargePeople(limit = 100): Promise<EncchargePerson[]> {
  // Note: Encharge REST API does not support listing all people
  // The /people endpoint requires specific user identification
  // Return empty array for now - this feature requires Encharge Ingest API or webhooks
  console.warn("Encharge REST API does not support listing all people. Use Ingest API or webhooks instead.");
  return [];
}

/**
 * Get segments from Encharge
 */
export async function getEnchargeSegments(): Promise<EnchargeSegment[]> {
  const response = await fetch(`${ENCHARGE_API_BASE}/segments`, {
    headers: {
      "X-Encharge-Token": ENCHARGE_API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Encharge API error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.segments || data || [];
}

/**
 * Create or update a person in Encharge
 * Uses the Write Key for creating/updating contacts
 */
export async function upsertEnchargePerson(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
  fields?: Record<string, any>;
}): Promise<{ success: boolean; personId?: string; error?: string }> {
  try {
    const response = await fetch("https://ingest.encharge.io/v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Encharge-Token": ENCHARGE_WRITE_KEY,
      },
      body: JSON.stringify({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        tags: data.tags,
        ...data.fields,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error("Encharge upsert error:", errorData);
      return { success: false, error: errorData.message || response.statusText };
    }

    const result = await response.json();
    return { success: true, personId: result.id };
  } catch (error) {
    console.error("Error upserting Encharge person:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Update a person's fields in Encharge by email
 */
export async function updateEnchargePersonByEmail(
  email: string,
  updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    tags?: string[];
    fields?: Record<string, any>;
  }
): Promise<{ success: boolean; error?: string }> {
  return upsertEnchargePerson({
    email,
    ...updates,
  });
}

/**
 * Count contacts in Encharge that have the AHTIL tag.
 */
export async function getAHTILTagCount(): Promise<number> {
  if (!ENCHARGE_API_KEY) return 0;
  try {
    const url = new URL(`${ENCHARGE_API_BASE}/people`);
    url.searchParams.set("tag", "AHTIL");
    url.searchParams.set("limit", "100");
    url.searchParams.set("page", "1");
    const res = await fetch(url.toString(), {
      headers: { "X-Encharge-Token": ENCHARGE_API_KEY, "Content-Type": "application/json" },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    // Encharge may return total in meta
    const metaTotal = data?.meta?.total ?? data?.totalCount ?? data?.total;
    if (typeof metaTotal === "number") return metaTotal;
    // Otherwise sum up paginated results
    const firstBatch: any[] = data?.data ?? data?.people ?? [];
    let count = firstBatch.filter((p: any) => Array.isArray(p.tags) && p.tags.includes("AHTIL")).length;
    if (firstBatch.length < 100) return count;
    let page = 2;
    while (page <= 50) {
      url.searchParams.set("page", String(page));
      const r2 = await fetch(url.toString(), {
        headers: { "X-Encharge-Token": ENCHARGE_API_KEY, "Content-Type": "application/json" },
      });
      if (!r2.ok) break;
      const d2 = await r2.json();
      const batch: any[] = d2?.data ?? d2?.people ?? [];
      count += batch.filter((p: any) => Array.isArray(p.tags) && p.tags.includes("AHTIL")).length;
      if (batch.length < 100) break;
      page++;
    }
    return count;
  } catch {
    return 0;
  }
}

/**
 * Get subscriber count and growth metrics
 */
export async function getSubscriberMetrics() {
  try {
    const segments = await getEnchargeSegments();

    // Calculate total subscribers from segments
    const totalSubscribers = segments.reduce((sum, segment) => sum + segment.peopleCount, 0);

    return {
      totalSubscribers,
      recentSubscribers: 0, // Cannot calculate without people API access
      segments: segments.length,
      segmentDetails: segments,
    };
  } catch (error) {
    console.error("Error fetching Encharge metrics:", error);
    return {
      totalSubscribers: 0,
      recentSubscribers: 0,
      segments: 0,
      segmentDetails: [],
    };
  }
}
