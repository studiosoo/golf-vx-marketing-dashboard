/**
 * OUTPUT_boomerang.ts
 * Golf VX Marketing Dashboard — Boomerang API Integration
 *
 * Interacts with the Boomerangme loyalty card platform.
 * Base URL : https://app.boomerangme.cards/api/v1/[method]
 * Auth      : token query param on every request
 * Card type : 6 = Membership (Golf VX)
 *
 * Required env vars:
 *   BOOMERANG_API_TOKEN — API token from Boomerang admin panel
 *
 * Graceful degradation: every exported function returns an empty / falsy
 * value when the API token is not configured, instead of throwing.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BoomerangTemplate {
  id: number;
  name: string;
  /** 0=stamps,1=cashback,2=subscription,3=coupon,4=discount,5=certificate,6=membership */
  type: number;
}

export interface BoomerangClient {
  id: number;
  sName: string;  // Surname / last name
  fName: string;  // First name
  phone: string;
  email: string;
}

export interface BoomerangCard {
  status: "installed" | "deleted" | "not installed";
  serialNumber: string;
  type: number;
  [key: string]: any;
}

export interface BoomerangConfig {
  isConfigured: boolean;
  apiToken: string | null;
}

export interface BoomerangCardStatus {
  installed: number;
  notInstalled: number;
  deleted: number;
}

export interface BoomerangSyncResult {
  templates: BoomerangTemplate[];
  totalMembers: number;
  activeMembers: number;
  members: Array<BoomerangClient & { card: BoomerangCard | null }>;
}

// ---------------------------------------------------------------------------
// Configuration helpers
// ---------------------------------------------------------------------------

/**
 * Returns true only when BOOMERANG_API_TOKEN is present and non-empty.
 */
export function isBoomerangConfigured(): boolean {
  return Boolean(process.env.BOOMERANG_API_TOKEN?.trim());
}

/**
 * Returns the full config object so callers can inspect the token state.
 */
export function getBoomerangConfig(): BoomerangConfig {
  const apiToken = process.env.BOOMERANG_API_TOKEN?.trim() || null;
  return {
    isConfigured: Boolean(apiToken),
    apiToken,
  };
}

// ---------------------------------------------------------------------------
// Core HTTP helper
// ---------------------------------------------------------------------------

const BASE_URL = "https://app.boomerangme.cards/api/v1";

/**
 * Low-level request helper.
 * Injects the API token into every request and normalises the response.
 *
 * @param method  The API method path segment, e.g. "getTemplates"
 * @param params  Additional query/body params (sent as query string for GET)
 * @returns       The parsed JSON response body, or null on any error
 */
async function boomerangRequest(
  method: string,
  params: Record<string, any> = {}
): Promise<any> {
  const { apiToken } = getBoomerangConfig();
  if (!apiToken) {
    console.warn("[Boomerang] API token not configured — skipping request.");
    return null;
  }

  const url = new URL(`${BASE_URL}/${method}`);
  url.searchParams.set("token", apiToken);

  // All Boomerang v1 endpoints use GET with query params
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error(
        `[Boomerang] HTTP ${response.status} for method "${method}": ${await response.text()}`
      );
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`[Boomerang] Request failed for method "${method}":`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Template operations
// ---------------------------------------------------------------------------

/**
 * Fetches all card templates from the Boomerang account.
 */
export async function getTemplates(): Promise<BoomerangTemplate[]> {
  try {
    const data = await boomerangRequest("getTemplates");
    if (!data || !Array.isArray(data.templates)) return [];
    return data.templates as BoomerangTemplate[];
  } catch (err) {
    console.error("[Boomerang] getTemplates error:", err);
    return [];
  }
}

/**
 * Returns only templates with type === 6 (Membership).
 */
export async function getMembershipTemplates(): Promise<BoomerangTemplate[]> {
  try {
    const all = await getTemplates();
    return all.filter((t) => t.type === 6);
  } catch (err) {
    console.error("[Boomerang] getMembershipTemplates error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Client operations
// ---------------------------------------------------------------------------

/**
 * Returns a single page of clients for a given template.
 * @param page 1-based page number (default: 1)
 */
export async function getClientList(
  idTemplate: number,
  page = 1
): Promise<BoomerangClient[]> {
  try {
    const data = await boomerangRequest("getClientList", {
      idTemplate,
      page,
    });
    if (!data || !Array.isArray(data.clients)) return [];
    return data.clients as BoomerangClient[];
  } catch (err) {
    console.error("[Boomerang] getClientList error:", err);
    return [];
  }
}

/**
 * Paginates through ALL clients for a template, concatenating every page.
 * Stops when an empty page is returned (or a network error occurs).
 */
export async function getAllClients(
  idTemplate: number
): Promise<BoomerangClient[]> {
  const allClients: BoomerangClient[] = [];
  let page = 1;

  try {
    while (true) {
      const page_clients = await getClientList(idTemplate, page);
      if (page_clients.length === 0) break;
      allClients.push(...page_clients);
      page++;

      // Safety valve — Boomerang has no explicit total_pages; cap at 500 pages
      if (page > 500) {
        console.warn("[Boomerang] getAllClients: reached 500-page safety limit.");
        break;
      }
    }
  } catch (err) {
    console.error("[Boomerang] getAllClients pagination error:", err);
  }

  return allClients;
}

/**
 * Searches for a client across a template by email OR phone.
 * Returns the first matching client or null.
 */
export async function searchClient(
  idTemplate: number,
  emailOrPhone: string
): Promise<BoomerangClient | null> {
  try {
    const data = await boomerangRequest("searchClient", {
      idTemplate,
      search: emailOrPhone,
    });
    if (!data) return null;

    // Some API versions return an array, others return a single object
    if (Array.isArray(data.clients) && data.clients.length > 0) {
      return data.clients[0] as BoomerangClient;
    }
    if (data.client) {
      return data.client as BoomerangClient;
    }
    return null;
  } catch (err) {
    console.error("[Boomerang] searchClient error:", err);
    return null;
  }
}

/**
 * Creates a new client in the specified template.
 * Returns `{ id }` on success or `{ error, id? }` on conflict / failure.
 */
export async function createClient(
  idTemplate: number,
  data: {
    fName: string;
    sName: string;
    email?: string;
    phone?: string;
  }
): Promise<{ id: number } | { error: number; id?: number }> {
  try {
    const result = await boomerangRequest("createClient", {
      idTemplate,
      fName: data.fName,
      sName: data.sName,
      email: data.email,
      phone: data.phone,
    });

    if (!result) return { error: -1 };

    // error === 0 means success in Boomerang's API
    if (result.error === 0 && result.id) {
      return { id: result.id as number };
    }
    return { error: result.error ?? -1, id: result.id };
  } catch (err) {
    console.error("[Boomerang] createClient error:", err);
    return { error: -1 };
  }
}

/**
 * Updates mutable fields for an existing client.
 */
export async function updateClient(
  idTemplate: number,
  userId: number,
  data: Partial<BoomerangClient>
): Promise<void> {
  try {
    await boomerangRequest("updateClient", {
      idTemplate,
      userId,
      ...data,
    });
  } catch (err) {
    console.error("[Boomerang] updateClient error:", err);
  }
}

// ---------------------------------------------------------------------------
// Card operations
// ---------------------------------------------------------------------------

/**
 * Returns full card info for a given pass serial number, or null.
 */
export async function getCardInfo(
  passSerialNumber: string
): Promise<BoomerangCard | null> {
  try {
    const data = await boomerangRequest("getCardInfo", { passSerialNumber });
    if (!data || !data.card) return null;
    return data.card as BoomerangCard;
  } catch (err) {
    console.error("[Boomerang] getCardInfo error:", err);
    return null;
  }
}

/**
 * Returns all cards associated with an email address.
 */
export async function getCardsByEmail(email: string): Promise<BoomerangCard[]> {
  try {
    const data = await boomerangRequest("getCardsByEmail", { email });
    if (!data || !Array.isArray(data.cards)) return [];
    return data.cards as BoomerangCard[];
  } catch (err) {
    console.error("[Boomerang] getCardsByEmail error:", err);
    return [];
  }
}

/**
 * Returns all cards associated with a phone number.
 */
export async function getCardsByPhone(phone: string): Promise<BoomerangCard[]> {
  try {
    const data = await boomerangRequest("getCardsByPhone", { phone });
    if (!data || !Array.isArray(data.cards)) return [];
    return data.cards as BoomerangCard[];
  } catch (err) {
    console.error("[Boomerang] getCardsByPhone error:", err);
    return [];
  }
}

/**
 * Returns the operations / transaction history for a specific card.
 */
export async function getCardOperations(
  passSerialNumber: string
): Promise<any[]> {
  try {
    const data = await boomerangRequest("getCardOperations", { passSerialNumber });
    if (!data || !Array.isArray(data.operations)) return [];
    return data.operations;
  } catch (err) {
    console.error("[Boomerang] getCardOperations error:", err);
    return [];
  }
}

/**
 * Returns installed / notInstalled / deleted counts for a template.
 */
export async function getTemplateCardStatus(
  idTemplate: number
): Promise<BoomerangCardStatus> {
  try {
    const data = await boomerangRequest("getTemplateCardStatus", { idTemplate });
    if (!data) return { installed: 0, notInstalled: 0, deleted: 0 };
    return {
      installed: data.installed ?? 0,
      notInstalled: data.notInstalled ?? 0,
      deleted: data.deleted ?? 0,
    };
  } catch (err) {
    console.error("[Boomerang] getTemplateCardStatus error:", err);
    return { installed: 0, notInstalled: 0, deleted: 0 };
  }
}

// ---------------------------------------------------------------------------
// Push notification operations
// ---------------------------------------------------------------------------

/**
 * Sends a push notification to a single card holder.
 * Returns true on success, false on any failure.
 */
export async function sendPushToClient(
  passSerialNumber: string,
  message: string
): Promise<boolean> {
  try {
    const data = await boomerangRequest("sendPush", {
      passSerialNumber,
      message,
    });
    return data?.error === 0 || data?.success === true;
  } catch (err) {
    console.error("[Boomerang] sendPushToClient error:", err);
    return false;
  }
}

/**
 * Broadcasts a push notification to all active card holders for a template.
 * Returns the count of successfully notified users.
 */
export async function sendPushToAll(
  idTemplate: number,
  message: string
): Promise<number> {
  try {
    const data = await boomerangRequest("sendPushToAll", {
      idTemplate,
      message,
    });
    if (!data) return 0;
    // Boomerang may return a count field
    return data.count ?? data.sent ?? 0;
  } catch (err) {
    console.error("[Boomerang] sendPushToAll error:", err);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Dashboard sync helper
// ---------------------------------------------------------------------------

/**
 * Fetches all membership data in one shot for the dashboard overview.
 *
 * Strategy:
 *  1. Fetch all templates (filter to membership type 6)
 *  2. For each template, load all clients + their card info
 *  3. Aggregate counts
 */
export async function syncAllMembershipData(): Promise<BoomerangSyncResult> {
  const empty: BoomerangSyncResult = {
    templates: [],
    totalMembers: 0,
    activeMembers: 0,
    members: [],
  };

  if (!isBoomerangConfigured()) {
    console.warn("[Boomerang] syncAllMembershipData: not configured.");
    return empty;
  }

  try {
    const templates = await getMembershipTemplates();
    if (templates.length === 0) return empty;

    const membersWithCards: Array<BoomerangClient & { card: BoomerangCard | null }> = [];

    for (const template of templates) {
      const clients = await getAllClients(template.id);

      // Fetch card info in parallel (capped concurrency to 10 at a time)
      const CONCURRENCY = 10;
      for (let i = 0; i < clients.length; i += CONCURRENCY) {
        const batch = clients.slice(i, i + CONCURRENCY);
        const cards = await Promise.all(
          batch.map(async (client) => {
            // We need the card serial; first try searching by email/phone
            let card: BoomerangCard | null = null;
            if (client.email) {
              const cards = await getCardsByEmail(client.email);
              card = cards[0] ?? null;
            }
            if (!card && client.phone) {
              const cards = await getCardsByPhone(client.phone);
              card = cards[0] ?? null;
            }
            return { ...client, card };
          })
        );
        membersWithCards.push(...cards);
      }
    }

    const totalMembers = membersWithCards.length;
    const activeMembers = membersWithCards.filter(
      (m) => m.card?.status === "installed"
    ).length;

    return {
      templates,
      totalMembers,
      activeMembers,
      members: membersWithCards,
    };
  } catch (err) {
    console.error("[Boomerang] syncAllMembershipData error:", err);
    return empty;
  }
}
