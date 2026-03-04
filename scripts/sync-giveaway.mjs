/**
 * Script to trigger Google Sheets giveaway sync via the running server API.
 * Run: node scripts/sync-giveaway.mjs
 */

const BASE_URL = "http://localhost:3000";

async function syncGiveaway() {
  console.log("Triggering giveaway sync via server...");
  
  // Use the internal tRPC endpoint
  try {
    const response = await fetch(`${BASE_URL}/api/trpc/giveaway.sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    
    const text = await response.text();
    console.log("Response status:", response.status);
    console.log("Response:", text.substring(0, 500));
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

// Alternative: directly run the sync function using tsx
import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const SHEET_ID = "1Xx2LPavlwV7Bn4URrYHy9ewYoTc9cWFbc3X27rFDspY";
const SHEET_GID = "883252165";
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

function parseCSV(text) {
  const rows = [];
  const lines = text.split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const row = [];
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

const TEST_PATTERNS = [
  /^test/i, /test only/i, /^hanna jampas/i, /hannajampas@/i,
  /hdpjampas@/i, /sam@golfvx\.com/i, /ben@golfvx\.com/i, /soo@studiosoo\.com/i,
];

function isTestEntry(name, email) {
  const combined = `${name} ${email}`.toLowerCase();
  return TEST_PATTERNS.some(p => p.test(combined));
}

function parseTimestamp(val) {
  if (!val) return null;
  try {
    const normalized = val.trim().replace(" ", "T");
    const withSeconds = normalized.includes(":") && normalized.split(":").length < 3
      ? normalized + ":00" : normalized;
    const d = new Date(withSeconds + "Z");
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

async function main() {
  console.log(`Fetching CSV from GID ${SHEET_GID}...`);
  const resp = await fetch(CSV_EXPORT_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; GolfVX-Sync/1.0)" },
    redirect: "follow",
  });
  
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const text = await resp.text();
  const allRows = parseCSV(text);
  
  console.log(`Total rows in CSV: ${allRows.length}`);
  console.log(`Header row 0: ${allRows[0]?.slice(0, 3).join(" | ")}`);
  console.log(`Header row 1: ${allRows[1]?.slice(0, 3).join(" | ")}`);
  console.log(`Header row 2: ${allRows[2]?.slice(0, 3).join(" | ")}`);
  console.log(`First data row: ${allRows[3]?.slice(0, 3).join(" | ")}`);
  
  const HEADER_ROWS = 3;
  const dataRows = allRows.slice(HEADER_ROWS).filter(r => r.length > 0 && r[0]?.trim());
  console.log(`Data rows (non-empty): ${dataRows.length}`);
  
  const conn = await createConnection(DATABASE_URL);
  
  let inserted = 0, updated = 0, skipped = 0, errors = [];
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const sheetRowNumber = HEADER_ROWS + 1 + i;
    
    if (!row[0]?.trim()) continue;
    
    const timestamp = parseTimestamp(row[0]);
    if (!timestamp) { skipped++; continue; }
    
    const name = (row[1] ?? "").trim();
    const email = (row[2] ?? "").trim();
    if (!name || !email) { skipped++; continue; }
    
    const phone = (row[3] ?? "").trim() || null;
    const ageRange = (row[4] ?? "").trim() || null;
    const gender = (row[5] ?? "").trim() || null;
    const city = (row[6] ?? "").trim() || null;
    const illinoisResident = ["yes","true","1"].includes((row[7] ?? "").toLowerCase().trim()) ? 1 : 0;
    const golfExperienceLevel = (row[8] ?? "").trim() || null;
    const visitedBefore = (row[9] ?? "").trim() || null;
    const howDidTheyHear = (row[10] ?? "").trim() || null;
    const bestTimeToCall = (row[31] ?? "").trim() || null;
    const indoorGolfFamiliarity = (row[14] ?? "").trim() || null;
    const testEntry = isTestEntry(name, email) ? 1 : 0;
    const now = new Date();
    
    try {
      const [existing] = await conn.execute(
        "SELECT id FROM giveaway_applications WHERE google_sheet_row_id = ?",
        [sheetRowNumber]
      );
      
      if (existing.length > 0) {
        await conn.execute(
          `UPDATE giveaway_applications SET name=?, email=?, phone=?, age_range=?, gender=?, city=?,
           illinois_resident=?, golf_experience_level=?, visited_before=?, how_did_they_hear=?,
           best_time_to_call=?, indoor_golf_familiarity=?, is_test_entry=?, last_synced_at=?
           WHERE google_sheet_row_id=?`,
          [name, email, phone, ageRange, gender, city, illinoisResident, golfExperienceLevel,
           visitedBefore, howDidTheyHear, bestTimeToCall, indoorGolfFamiliarity, testEntry, now, sheetRowNumber]
        );
        updated++;
      } else {
        const [byEmail] = await conn.execute(
          "SELECT id, google_sheet_row_id FROM giveaway_applications WHERE email = ? LIMIT 1",
          [email]
        );
        
        if (byEmail.length > 0 && byEmail[0].google_sheet_row_id === null) {
          await conn.execute(
            `UPDATE giveaway_applications SET name=?, phone=?, age_range=?, gender=?, city=?,
             illinois_resident=?, golf_experience_level=?, visited_before=?, how_did_they_hear=?,
             best_time_to_call=?, indoor_golf_familiarity=?, is_test_entry=?, google_sheet_row_id=?, last_synced_at=?
             WHERE id=?`,
            [name, phone, ageRange, gender, city, illinoisResident, golfExperienceLevel,
             visitedBefore, howDidTheyHear, bestTimeToCall, indoorGolfFamiliarity, testEntry, sheetRowNumber, now, byEmail[0].id]
          );
          updated++;
        } else if (byEmail.length === 0) {
          await conn.execute(
            `INSERT INTO giveaway_applications (submission_timestamp, name, email, phone, age_range, gender, city,
             illinois_resident, golf_experience_level, visited_before, how_did_they_hear, best_time_to_call,
             indoor_golf_familiarity, is_test_entry, status, google_sheet_row_id, last_synced_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
            [timestamp, name, email, phone, ageRange, gender, city, illinoisResident, golfExperienceLevel,
             visitedBefore, howDidTheyHear, bestTimeToCall, indoorGolfFamiliarity, testEntry, sheetRowNumber, now, now]
          );
          inserted++;
        } else {
          skipped++;
        }
      }
    } catch (err) {
      errors.push(`Row ${sheetRowNumber} (${name}): ${err.message}`);
    }
  }
  
  await conn.end();
  
  console.log("\n=== Sync Result ===");
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors.length}`);
  if (errors.length > 0) console.log("Errors:", errors.slice(0, 5));
  
  // Count real applicants
  const conn2 = await createConnection(DATABASE_URL);
  const [count] = await conn2.execute(
    "SELECT COUNT(*) as total FROM giveaway_applications WHERE is_test_entry = 0"
  );
  console.log(`\nTotal real applicants in DB: ${count[0].total}`);
  await conn2.end();
}

main().catch(console.error);
