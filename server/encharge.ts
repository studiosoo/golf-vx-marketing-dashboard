const ENCHARGE_API_BASE = "https://api.encharge.io/v1";

function getApiKey(): string | null {
  return process.env.ENCHARGE_API_KEY || null;
}

function getWriteKey(): string | null {
  return process.env.ENCHARGE_WRITE_KEY || null;
}

/**
 * Check if Encharge is properly configured with valid API keys
 */
export function isEnchargeConfigured(): boolean {
  const apiKey = getApiKey();
  return !!apiKey && apiKey.length > 10;
}

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
 * Returns null if not configured or API call fails
 */
export async function getEnchargeAccount(): Promise<EnchargeAccount | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[Encharge] API key not configured. Skipping account fetch.");
    return null;
  }

  try {
    const response = await fetch(`${ENCHARGE_API_BASE}/accounts/me`, {
      headers: {
        "X-Encharge-Token": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => response.statusText);
      console.error(`[Encharge] Account API error (${response.status}): ${errorBody}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[Encharge] Failed to fetch account:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get all people (subscribers) from Encharge
 * Returns empty array if not configured or API call fails
 */
export async function getEnchargePeople(limit = 100): Promise<EncchargePerson[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[Encharge] API key not configured. Returning empty people list.");
    return [];
  }

  try {
    const response = await fetch(`${ENCHARGE_API_BASE}/people?pageSize=${limit}`, {
      headers: {
        "X-Encharge-Token": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => response.statusText);
      console.warn(`[Encharge] People API returned ${response.status}: ${errorBody}`);
      // Encharge People API may not support listing — return empty gracefully
      return [];
    }

    const data = await response.json();
    return data.people || data.items || data || [];
  } catch (error) {
    console.warn("[Encharge] Failed to fetch people:", error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Get a person by email from Encharge
 */
export async function getPersonByEmail(email: string): Promise<EncchargePerson | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${ENCHARGE_API_BASE}/people?email=${encodeURIComponent(email)}`, {
      headers: {
        "X-Encharge-Token": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const people = data.people || data.items || (Array.isArray(data) ? data : []);
    return people.length > 0 ? people[0] : null;
  } catch (error) {
    console.error("[Encharge] Failed to fetch person by email:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get segments from Encharge
 * Returns empty array if not configured or API call fails
 */
export async function getEnchargeSegments(): Promise<EnchargeSegment[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[Encharge] API key not configured. Returning empty segments.");
    return [];
  }

  try {
    const response = await fetch(`${ENCHARGE_API_BASE}/segments`, {
      headers: {
        "X-Encharge-Token": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => response.statusText);
      console.warn(`[Encharge] Segments API returned ${response.status}: ${errorBody}`);
      return [];
    }

    const data = await response.json();
    return data.segments || data || [];
  } catch (error) {
    console.warn("[Encharge] Failed to fetch segments:", error instanceof Error ? error.message : error);
    return [];
  }
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
  const writeKey = getWriteKey();
  if (!writeKey) {
    return { success: false, error: "Encharge Write Key not configured" };
  }

  try {
    const response = await fetch("https://ingest.encharge.io/v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Encharge-Token": writeKey,
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
      console.error("[Encharge] Upsert error:", errorData);
      return { success: false, error: errorData.message || response.statusText };
    }

    const result = await response.json();
    return { success: true, personId: result.id };
  } catch (error) {
    console.error("[Encharge] Error upserting person:", error);
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
 * Get subscriber count and growth metrics
 * Always returns valid data — never throws
 */
export async function getSubscriberMetrics() {
  if (!isEnchargeConfigured()) {
    return {
      configured: false,
      totalSubscribers: 0,
      recentSubscribers: 0,
      segments: 0,
      segmentDetails: [],
      message: "Encharge API key not configured. Please add your Encharge API key in Settings > Secrets.",
    };
  }

  try {
    const segments = await getEnchargeSegments();
    const totalSubscribers = segments.reduce((sum, segment) => sum + segment.peopleCount, 0);

    return {
      configured: true,
      totalSubscribers,
      recentSubscribers: 0,
      segments: segments.length,
      segmentDetails: segments,
    };
  } catch (error) {
    console.error("[Encharge] Error fetching metrics:", error);
    return {
      configured: true,
      totalSubscribers: 0,
      recentSubscribers: 0,
      segments: 0,
      segmentDetails: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
