/**
 * Google Sheets → Database Sync
 * Reads giveaway applications from Google Sheets via public CSV export.
 * No authentication required — sheet is shared as "Anyone with the link can view".
 *
 * Sheet: GOLFVX AH | Annual Anniversary Application 2026
 * Sheet ID: 1Xx2LPavlwV7Bn4URrYHy9ewYoTc9cWFbc3X27rFDspY
 * Sheet GID: 883252165
 *
 * CSV column layout (0-indexed):
 *  0   Submission Timestamp
 *  1   Name
 *  2   Email
 *  3   Phone
 *  4   Age Range
 *  5   Gender
 *  6   City
 *  7   Illinois Resident Confirmed (18+) (Yes/No)
 *  8   Golf Experience Level
 *  9   Visited Golf VX Before (Yes/No)
 * 10   First Heard About Golf VX AH
 * 11   First Visit Timing
 * 12   Indoor Golf Frequency
 * 13   What Stood Out at Golf VX
 * 14   Indoor Golf Familiarity
 * 15-23 Golf VX Interest checkboxes
 * 24   Love of the Game (Story)
 * 25   Help Grow Community (Story)
 * 26   Active on Social Media (Yes/No)
 * 27   Word of Mouth (Yes/No)
 * 28   Involved in Groups (Yes/No)
 * 29   Social Handle
 * 30   Groups Engaged With
 * 31   Best Time to Call
 * 32-38 Heard About Offer checkboxes
 * 39   Other (Specify)
 * 40   Consent (Yes/No)
 *
 * Note: Row 0 = section headers, Row 1 = column names, Row 2 = sub-column names
 * Data starts at Row 3 (index 2 in 0-based array, sheetRowNumber = index+1)
 */

import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { giveawayApplications } from "../drizzle/schema";

const SHEET_ID = "1Xx2LPavlwV7Bn4URrYHy9ewYoTc9cWFbc3X27rFDspY";
const SHEET_GID = "883252165";
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

// Header rows to skip (0-indexed): rows 0, 1, 2 are headers
const HEADER_ROWS = 3;

// Test entry detection patterns
const TEST_PATTERNS = [
  /^test/i,
  /test only/i,
  /^hanna jampas/i,
  /hannajampas@/i,
  /hdpjampas@/i,
  /sam@golfvx\.com/i,
  /ben@golfvx\.com/i,
  /soo@studiosoo\.com/i,
];

function isTestEntry(name: string, email: string): boolean {
  const combined = `${name} ${email}`.toLowerCase();
  return TEST_PATTERNS.some((p) => p.test(combined));
}

function parseBoolean(val: string | undefined): boolean {
  if (!val) return false;
  const v = val.toString().toLowerCase().trim();
  return v === "true" || v === "yes" || v === "1";
}

function parseTimestamp(val: string | undefined): Date | null {
  if (!val) return null;
  try {
    // Format: "2026-02-05 16:46:16" or "2026-03-02 7:42:37"
    const normalized = val.trim().replace(" ", "T");
    // Add seconds if missing (e.g. "2026-03-02T7:42")
    const withSeconds = normalized.includes(":") && normalized.split(":").length < 3
      ? normalized + ":00"
      : normalized;
    const d = new Date(withSeconds + "Z");
    if (isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

function getCell(row: string[], idx: number): string {
  return (row[idx] ?? "").toString().trim();
}

/**
 * Parse CSV text into rows of string arrays.
 * Handles quoted fields with commas inside them.
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let inQuote = false;
    let cell = "";

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === "," && !inQuote) {
        row.push(cell);
        cell = "";
      } else {
        cell += ch;
      }
    }
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

export interface SyncResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
  totalRows: number;
  lastSyncTime: Date;
}

/**
 * Fetch CSV from Google Sheets public export URL.
 * No authentication needed — sheet must be "Anyone with the link can view".
 */
async function fetchSheetCSV(): Promise<string[][]> {
  const resp = await fetch(CSV_EXPORT_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; GolfVX-Sync/1.0)",
    },
    redirect: "follow",
  });

  if (!resp.ok) {
    throw new Error(`Google Sheets CSV export failed: HTTP ${resp.status}`);
  }

  const text = await resp.text();
  return parseCSV(text);
}

/**
 * Main sync function. Reads Google Sheets CSV and upserts into giveawayApplications table.
 * Uses googleSheetRowId (1-indexed row number in sheet) as the unique key to avoid duplicates.
 */
export async function syncGiveawayFromSheets(): Promise<SyncResult> {
  const result: SyncResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    totalRows: 0,
    lastSyncTime: new Date(),
  };

  const allRows = await fetchSheetCSV();

  // Skip header rows (rows 0, 1, 2 are section headers, column names, sub-column names)
  const dataRows = allRows.slice(HEADER_ROWS);
  result.totalRows = dataRows.filter((r) => r.length > 0 && r[0]).length;

  const db = await getDb();
  if (!db) throw new Error("Database connection unavailable");

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    // sheetRowNumber: 1-indexed row in the spreadsheet (header rows + 1 + data index)
    const sheetRowNumber = HEADER_ROWS + 1 + i;

    // Skip empty rows
    if (!row || !row[0] || !row[0].trim()) continue;

    const timestamp = parseTimestamp(getCell(row, 0));
    if (!timestamp) {
      result.skipped++;
      continue;
    }

    const name = getCell(row, 1);
    const email = getCell(row, 2);

    if (!name || !email) {
      result.skipped++;
      continue;
    }

    const phone = getCell(row, 3);
    const ageRange = getCell(row, 4);
    const gender = getCell(row, 5);
    const city = getCell(row, 6);
    const illinoisResident = parseBoolean(getCell(row, 7));
    const golfExperienceLevel = getCell(row, 8);
    const visitedBefore = getCell(row, 9);
    const howDidTheyHear = getCell(row, 10);
    const bestTimeToCall = getCell(row, 31);
    const indoorGolfFamiliarity = getCell(row, 14);
    const testEntry = isTestEntry(name, email);

    try {
      const now = new Date();

      // Check if this row already exists by googleSheetRowId
      const existingByRowId = await db
        .select({ id: giveawayApplications.id })
        .from(giveawayApplications)
        .where(eq(giveawayApplications.googleSheetRowId, sheetRowNumber))
        .limit(1);

      if (existingByRowId.length > 0) {
        // Update existing record (in case data was corrected in sheet)
        await db
          .update(giveawayApplications)
          .set({
            name,
            email,
            phone: phone || null,
            ageRange: ageRange || null,
            gender: gender || null,
            city: city || null,
            illinoisResident,
            golfExperienceLevel: golfExperienceLevel || null,
            visitedBefore: visitedBefore || null,
            howDidTheyHear: howDidTheyHear || null,
            bestTimeToCall: bestTimeToCall || null,
            indoorGolfFamiliarity: indoorGolfFamiliarity || null,
            isTestEntry: testEntry,
            lastSyncedAt: now,
          })
          .where(eq(giveawayApplications.googleSheetRowId, sheetRowNumber));
        result.updated++;
      } else {
        // Check if a legacy entry exists with the same email (no googleSheetRowId)
        const existingByEmail = await db
          .select({ id: giveawayApplications.id, googleSheetRowId: giveawayApplications.googleSheetRowId })
          .from(giveawayApplications)
          .where(eq(giveawayApplications.email, email))
          .limit(1);

        if (existingByEmail.length > 0 && existingByEmail[0].googleSheetRowId === null) {
          // Update legacy entry: assign the googleSheetRowId and refresh data
          await db
            .update(giveawayApplications)
            .set({
              name,
              phone: phone || null,
              ageRange: ageRange || null,
              gender: gender || null,
              city: city || null,
              illinoisResident,
              golfExperienceLevel: golfExperienceLevel || null,
              visitedBefore: visitedBefore || null,
              howDidTheyHear: howDidTheyHear || null,
              bestTimeToCall: bestTimeToCall || null,
              indoorGolfFamiliarity: indoorGolfFamiliarity || null,
              isTestEntry: testEntry,
              googleSheetRowId: sheetRowNumber,
              lastSyncedAt: now,
            })
            .where(eq(giveawayApplications.id, existingByEmail[0].id));
          result.updated++;
        } else if (existingByEmail.length === 0) {
          // Insert new record
          await db.insert(giveawayApplications).values({
            submissionTimestamp: timestamp,
            name,
            email,
            phone: phone || null,
            ageRange: ageRange || null,
            gender: gender || null,
            city: city || null,
            illinoisResident,
            golfExperienceLevel: golfExperienceLevel || null,
            visitedBefore: visitedBefore || null,
            howDidTheyHear: howDidTheyHear || null,
            bestTimeToCall: bestTimeToCall || null,
            indoorGolfFamiliarity: indoorGolfFamiliarity || null,
            isTestEntry: testEntry,
            status: "pending",
            googleSheetRowId: sheetRowNumber,
            lastSyncedAt: now,
            createdAt: now,
          });
          result.inserted++;
        } else {
          // Already synced with a different row ID — skip
          result.skipped++;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Row ${sheetRowNumber} (${name}): ${msg}`);
    }
  }

  return result;
}

/**
 * Get the count of non-test giveaway applications in the database.
 */
export async function getGiveawayCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ id: giveawayApplications.id })
    .from(giveawayApplications)
    .where(eq(giveawayApplications.isTestEntry, false));

  return result.length;
}
