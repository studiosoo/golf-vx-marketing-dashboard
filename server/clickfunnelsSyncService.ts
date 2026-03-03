/**
 * ClickFunnels Sync Service
 * Fetches funnels and form submissions from ClickFunnels API v2
 * and upserts them into the local database.
 *
 * API base: https://app.myclickfunnels.com/api/v2
 * Team ID: 400611 (Golf VX)
 * Workspace ID: 421845 (Golf VX Arlington Heights)
 */

import { getDb } from "./db";
import { cfFunnels, cfFormSubmissions } from "../drizzle/schema";
import { sql } from "drizzle-orm";

const CF_BASE_URL = "https://app.myclickfunnels.com/api/v2";
const CF_WORKSPACE_ID = 421845;

function getCFHeaders() {
  const apiKey = process.env.CLICKFUNNELS_API_KEY;
  if (!apiKey) throw new Error("CLICKFUNNELS_API_KEY not configured");
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    "User-Agent": "GolfVX-Dashboard/1.0",
  };
}

async function cfFetch(path: string): Promise<unknown> {
  const res = await fetch(`${CF_BASE_URL}${path}`, { headers: getCFHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClickFunnels API error ${res.status}: ${text.substring(0, 200)}`);
  }
  return res.json();
}

interface CFTag {
  id: number;
  name: string;
  color: string;
}

interface CFFunnel {
  id: number;
  public_id: string;
  workspace_id: number;
  name: string;
  current_path: string | null;
  archived: boolean;
  live_mode: boolean;
  tags: CFTag[];
}

interface CFPageStep {
  id: number;
  name: string;
  current_path: string;
}

interface CFFormSubmissionPage {
  id: number;
  name: string;
  type: string;
  current_path: string;
  show_page_step: CFPageStep | null;
  funnel: { id: number; name: string } | null;
}

interface CFFormSubmission {
  id: number;
  public_id: string;
  contact_id: number | null;
  workspace_id: number;
  page_id: number | null;
  created_at: string;
  updated_at: string;
  data: Record<string, string>;
  page: CFFormSubmissionPage | null;
}

/**
 * Sync all funnels from ClickFunnels into the database
 */
export async function syncFunnels(): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  try {
    const funnels = (await cfFetch(`/workspaces/${CF_WORKSPACE_ID}/funnels`)) as CFFunnel[];
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    for (const funnel of funnels) {
      try {
        await db
          .insert(cfFunnels)
          .values({
            cfId: funnel.id,
            cfPublicId: funnel.public_id,
            workspaceId: funnel.workspace_id,
            name: funnel.name,
            currentPath: funnel.current_path,
            archived: funnel.archived,
            liveMode: funnel.live_mode,
            tags: funnel.tags,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          })
          .onDuplicateKeyUpdate({
            set: {
              name: funnel.name,
              currentPath: funnel.current_path,
              archived: funnel.archived,
              liveMode: funnel.live_mode,
              tags: funnel.tags,
              lastSyncedAt: new Date(),
              updatedAt: new Date(),
            },
          });
        synced++;
      } catch (err) {
        console.error(`[CF Sync] Error upserting funnel ${funnel.id}:`, err);
        errors++;
      }
    }

    console.log(`[CF Sync] Funnels: ${synced} synced, ${errors} errors`);
  } catch (err) {
    console.error("[CF Sync] Failed to fetch funnels:", err);
    errors++;
  }

  return { synced, errors };
}

/**
 * Sync all form submissions from ClickFunnels into the database
 */
export async function syncFormSubmissions(): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  try {
    // Fetch all submissions (paginate if needed)
    let allSubmissions: CFFormSubmission[] = [];
    let page = 1;
    const perPage = 200;

    while (true) {
      const submissions = (await cfFetch(
        `/workspaces/${CF_WORKSPACE_ID}/form_submissions?per_page=${perPage}&page=${page}`
      )) as CFFormSubmission[];

      if (!Array.isArray(submissions) || submissions.length === 0) break;
      allSubmissions = allSubmissions.concat(submissions);
      if (submissions.length < perPage) break;
      page++;
    }

    console.log(`[CF Sync] Found ${allSubmissions.length} form submissions`);
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    for (const sub of allSubmissions) {
      try {
        const pageInfo = sub.page;
        const funnelId = pageInfo?.funnel?.id ?? null;
        const funnelName = pageInfo?.funnel?.name ?? null;
        const pageStep = pageInfo?.show_page_step?.name ?? null;
        const pageName = pageInfo?.name ?? null;

        // Extract contact info from form data
        const data = sub.data || {};
        const email =
          data.email_address ||
          data.email ||
          data.Email ||
          null;
        const firstName =
          data.first_name ||
          data.firstName ||
          data["First Name"] ||
          null;
        const lastName =
          data.last_name ||
          data.lastName ||
          data["Last Name"] ||
          null;
        const phone =
          data.phone_number ||
          data.phone ||
          data.Phone ||
          null;
        const city = data.city || data.City || null;
        const state = data.state || data.State || null;
        const golfLevel =
          data.golf_level ||
          data.golfLevel ||
          data["Golf Level"] ||
          null;

        await db
          .insert(cfFormSubmissions)
          .values({
            cfId: sub.id,
            cfPublicId: sub.public_id,
            contactId: sub.contact_id,
            workspaceId: sub.workspace_id,
            pageId: sub.page_id,
            pageName,
            pageStep,
            funnelId,
            funnelName,
            email,
            firstName,
            lastName,
            phone,
            city,
            state,
            golfLevel,
            formData: data,
            submittedAt: new Date(sub.created_at),
          })
          .onDuplicateKeyUpdate({
            set: {
              pageName,
              pageStep,
              funnelId,
              funnelName,
              email,
              firstName,
              lastName,
              phone,
              city,
              state,
              golfLevel,
              formData: data,
            },
          });
        synced++;
      } catch (err) {
        console.error(`[CF Sync] Error upserting submission ${sub.id}:`, err);
        errors++;
      }
    }

    // Update opt-in counts on funnels
    await updateFunnelOptInCounts();

    console.log(`[CF Sync] Submissions: ${synced} synced, ${errors} errors`);
  } catch (err) {
    console.error("[CF Sync] Failed to fetch form submissions:", err);
    errors++;
  }

  return { synced, errors };
}

/**
 * Update opt_in_count on each funnel based on form submissions
 */
async function updateFunnelOptInCounts() {
  try {
    const db = await getDb();
    if (!db) return;
    await db.execute(sql`
      UPDATE cf_funnels f
      SET f.opt_in_count = (
        SELECT COUNT(*) FROM cf_form_submissions s WHERE s.funnel_id = f.cf_id
      ),
      f.updated_at = NOW()
    `);
  } catch (err) {
    console.error("[CF Sync] Error updating funnel opt-in counts:", err);
  }
}

/**
 * Run a full sync: funnels + form submissions
 */
export async function syncClickFunnels(): Promise<{
  funnels: { synced: number; errors: number };
  submissions: { synced: number; errors: number };
}> {
  console.log("[CF Sync] Starting full ClickFunnels sync...");
  const funnels = await syncFunnels();
  const submissions = await syncFormSubmissions();
  console.log("[CF Sync] Sync complete:", { funnels, submissions });
  return { funnels, submissions };
}
