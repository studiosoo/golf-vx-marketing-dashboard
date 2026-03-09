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
 * Count contacts in Encharge that belong to the AHTIL segment.
 * Uses the /segments/{id}/people endpoint. The segment ID is configurable
 * via ENCHARGE_AHTIL_SEGMENT_ID env var.
 * Defaults to segment 1111630 ("AHTIL Members") which tracks active paying members.
 * Set ENCHARGE_AHTIL_SEGMENT_ID=1111629 to count the full AHTIL email list instead.
 *
 * Uses a single request with limit=500 — sufficient for the AHTIL Members segment
 * which is expected to be under 500 contacts. For larger segments, paginate.
 */
export async function getAHTILTagCount(): Promise<number> {
  if (!ENCHARGE_API_KEY) return 0;
  const segmentId = process.env.ENCHARGE_AHTIL_SEGMENT_ID || "1111630";
  try {
    // Single-page fetch: AHTIL Members segment is ~196 contacts, well under 500
    const url = `${ENCHARGE_API_BASE}/segments/${segmentId}/people?limit=500&page=1`;
    const res = await fetch(url, {
      headers: { "X-Encharge-Token": ENCHARGE_API_KEY, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15_000), // 15s timeout
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const people: any[] = data?.people ?? [];
    return people.length;
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
