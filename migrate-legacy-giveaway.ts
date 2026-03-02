/**
 * One-time migration: Match legacy giveaway applications (without googleSheetRowId)
 * to their corresponding rows in Google Sheets using email matching.
 * 
 * Run with: npx tsx migrate-legacy-giveaway.ts
 */
import { getDb } from "./server/db";
import { giveawayApplications } from "./drizzle/schema";
import { isNull, eq } from "drizzle-orm";

const SHEET_ID = "1Xx2LPavlwV7Bn4URrYHy9ewYoTc9cWFbc3X27rFDspY";
const SHEET_GID = "883252165";
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
const HEADER_ROWS = 3;

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
        if (inQuote && line[i + 1] === '"') { cell += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        row.push(cell); cell = "";
      } else {
        cell += ch;
      }
    }
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

console.log("Fetching Google Sheets CSV...");
const resp = await fetch(CSV_EXPORT_URL, {
  headers: { "User-Agent": "Mozilla/5.0 (compatible; GolfVX-Sync/1.0)" },
  redirect: "follow",
});
if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
const text = await resp.text();
const allRows = parseCSV(text);
const dataRows = allRows.slice(HEADER_ROWS);

// Build email → sheetRowNumber map from Google Sheets
const sheetEmailMap = new Map<string, number>();
for (let i = 0; i < dataRows.length; i++) {
  const row = dataRows[i];
  const email = (row[2] ?? "").trim().toLowerCase();
  const sheetRowNumber = HEADER_ROWS + 1 + i;
  if (email) {
    sheetEmailMap.set(email, sheetRowNumber);
  }
}
console.log(`Sheet has ${sheetEmailMap.size} entries with emails`);

// Get legacy entries (no googleSheetRowId)
const db = await getDb();
if (!db) throw new Error("No DB");

const legacyEntries = await db
  .select({
    id: giveawayApplications.id,
    name: giveawayApplications.name,
    email: giveawayApplications.email,
  })
  .from(giveawayApplications)
  .where(isNull(giveawayApplications.googleSheetRowId));

console.log(`Found ${legacyEntries.length} legacy entries without googleSheetRowId`);

let matched = 0;
let unmatched = 0;

for (const entry of legacyEntries) {
  const emailLower = entry.email.toLowerCase();
  const sheetRowNumber = sheetEmailMap.get(emailLower);
  
  if (sheetRowNumber !== undefined) {
    // Check if this sheetRowNumber is already used by another entry
    const existing = await db
      .select({ id: giveawayApplications.id })
      .from(giveawayApplications)
      .where(eq(giveawayApplications.googleSheetRowId, sheetRowNumber))
      .limit(1);
    
    if (existing.length > 0 && existing[0].id !== entry.id) {
      console.log(`  SKIP [${entry.id}] ${entry.name} (${entry.email}) - sheetRow ${sheetRowNumber} already used by id=${existing[0].id}`);
      unmatched++;
      continue;
    }
    
    await db
      .update(giveawayApplications)
      .set({ googleSheetRowId: sheetRowNumber })
      .where(eq(giveawayApplications.id, entry.id));
    
    console.log(`  ✅ [${entry.id}] ${entry.name} → sheetRow ${sheetRowNumber}`);
    matched++;
  } else {
    console.log(`  ❌ [${entry.id}] ${entry.name} (${entry.email}) - not found in sheet`);
    unmatched++;
  }
}

console.log(`\n=== Migration Complete ===`);
console.log(`Matched: ${matched}`);
console.log(`Unmatched: ${unmatched}`);
console.log(`Total legacy: ${legacyEntries.length}`);

process.exit(0);
