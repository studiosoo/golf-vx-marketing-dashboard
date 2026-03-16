/**
 * Import Encharge AHTIL contact list into email_captures table.
 * Run: node scripts/import-encharge-ahtil.js
 *
 * Rules:
 * - Exclude rows with no email
 * - Merge Tags + Tag columns, deduplicate, store as JSON array
 * - Status: Unsubscribed=true → "unsubscribed" (never downgrade converted/qualified back to new)
 * - Source: "manual_csv"
 * - Match on email (primary) or enchargeId (fallback) → UPDATE existing, else INSERT
 * - Extra data (city, gender, UTMs, child info, appt info) stored in notes as JSON
 * - Columns intentionally DROPPED: Created At, Updated At, Lead Score, Last Activity,
 *   Group Id, Email Validation Result/Confidence, Disposable Email, Role Email,
 *   IP, Browser, Country, Region, Timezone, Team Name, Unsubscribe Reason, Marketing Emails
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs    = require("fs");
const path  = require("path");

const CSV_PATH = path.join(
  process.env.HOME,
  "Downloads",
  "encharge ahtil.csv"
);

// Status priority — never downgrade a higher-status contact
const STATUS_RANK = { converted: 4, qualified: 3, contacted: 2, new: 1, unsubscribed: 0, bounced: 0 };

function parseTags(tagsStr, tagStr) {
  const parts = [
    ...(tagsStr || "").split(","),
    ...(tagStr  || "").split(","),
  ]
    .map(t => t.trim())
    .filter(t => t.length > 0);
  // Deduplicate (case-insensitive key, keep original casing)
  const seen = new Map();
  for (const t of parts) {
    const key = t.toLowerCase();
    if (!seen.has(key)) seen.set(key, t);
  }
  return [...seen.values()];
}

function mergeTags(existingJson, newTags) {
  let existing = [];
  try { existing = JSON.parse(existingJson || "[]"); } catch { existing = []; }
  const combined = [...existing, ...newTags];
  const seen = new Map();
  for (const t of combined) {
    const key = String(t).trim().toLowerCase();
    if (!seen.has(key)) seen.set(key, String(t).trim());
  }
  return [...seen.values()];
}

function buildNotes(row) {
  const extra = {};
  if (row["City"])         extra.city         = row["City"];
  if (row["Gender"])       extra.gender        = row["Gender"];
  if (row["Address"])      extra.address       = row["Address"];
  if (row["Child Age"])    extra.child_age     = row["Child Age"];
  if (row["Child Name"])   extra.child_name    = row["Child Name"];
  if (row["Parent Name"])  extra.parent_name   = row["Parent Name"];
  if (row["appt_type"])    extra.appt_type     = row["appt_type"];
  if (row["appt_date"])    extra.appt_date     = row["appt_date"];
  if (row["appt_datetime"])extra.appt_datetime = row["appt_datetime"];
  if (row["appt_time"])    extra.appt_time     = row["appt_time"];
  if (row["appt_notes"])   extra.appt_notes    = row["appt_notes"];
  if (row["trial_type"])   extra.trial_type    = row["trial_type"];
  if (row["UTM Source"])   extra.utm_source    = row["UTM Source"];
  if (row["UTM Campaign"]) extra.utm_campaign  = row["UTM Campaign"];
  if (row["First UTM Source"])   extra.first_utm_source   = row["First UTM Source"];
  if (row["First UTM Campaign"]) extra.first_utm_campaign = row["First UTM Campaign"];
  return Object.keys(extra).length ? JSON.stringify(extra) : null;
}

function parseCSV(raw) {
  // Handle quoted fields with commas and newlines
  const rows = [];
  const lines = raw.split("\n");
  const headers = parseCSVLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || "").trim(); });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      result.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

async function run() {
  const raw  = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parseCSV(raw);

  // Filter: require email
  const validRows = rows.filter(r => r["Email"] && r["Email"].trim());
  console.log(`CSV total: ${rows.length} | with email: ${validRows.length} | skipped (no email): ${rows.length - validRows.length}`);

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Load all existing records (email + enchargeId → id, status, tags)
  const [existing] = await conn.query(
    "SELECT id, email, encharge_id, status, tags FROM email_captures"
  );
  const byEmail     = new Map(existing.map(r => [r.email.toLowerCase(), r]));
  const byEncharge  = new Map(existing.filter(r => r.encharge_id).map(r => [r.encharge_id, r]));

  let inserted = 0, updated = 0, skipped = 0;
  const now = Date.now();

  for (const row of validRows) {
    const email      = row["Email"].trim().toLowerCase();
    const enchargeId = row["Id"].trim() || null;
    const unsubbed   = row["Unsubscribed"].trim().toLowerCase() === "true";
    const tags       = parseTags(row["Tags"], row["Tag"]);
    const notes      = buildNotes(row);

    // Determine incoming status
    const incomingStatus = unsubbed ? "unsubscribed" : "new";

    // Phone: normalize - keep digits and leading +
    let phone = (row["Phone"] || "").replace(/[^\d+]/g, "").slice(0, 20) || null;

    const fields = {
      email,
      first_name:   row["First Name"].trim() || null,
      last_name:    row["Last Name"].trim()  || null,
      phone,
      encharge_id:  enchargeId,
      tags:         JSON.stringify(tags),
      notes,
    };

    // Find existing row
    let existingRow = byEmail.get(email) || (enchargeId ? byEncharge.get(enchargeId) : null);

    if (existingRow) {
      // Merge tags
      const mergedTags = mergeTags(existingRow.tags, tags);

      // Determine final status — never downgrade above "unsubscribed" unless unsubbed
      let finalStatus = existingRow.status;
      if (unsubbed) {
        finalStatus = "unsubscribed";
      } else if (STATUS_RANK[existingRow.status] <= STATUS_RANK["new"]) {
        finalStatus = "new"; // keep as new if currently new/bounced
      }
      // (if converted/qualified/contacted — keep those)

      await conn.query(
        `UPDATE email_captures SET
          first_name   = COALESCE(NULLIF(first_name,''), ?),
          last_name    = COALESCE(NULLIF(last_name,''), ?),
          phone        = COALESCE(NULLIF(phone,''), ?),
          encharge_id  = COALESCE(NULLIF(encharge_id,''), ?),
          tags         = ?,
          status       = ?,
          notes        = COALESCE(notes, ?),
          updated_at   = NOW()
        WHERE id = ?`,
        [
          fields.first_name, fields.last_name, fields.phone, fields.encharge_id,
          JSON.stringify(mergedTags), finalStatus, fields.notes,
          existingRow.id,
        ]
      );
      updated++;
    } else {
      // Insert new
      await conn.query(
        `INSERT INTO email_captures
          (email, first_name, last_name, phone, source, status, encharge_id, tags, notes, captured_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'manual_csv', ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          fields.email, fields.first_name, fields.last_name, fields.phone,
          incomingStatus, fields.encharge_id, fields.tags, fields.notes, now,
        ]
      );
      // Add to lookup maps so duplicates within CSV don't re-insert
      const fakeRow = { id: null, email, encharge_id: enchargeId, status: incomingStatus, tags: fields.tags };
      byEmail.set(email, fakeRow);
      if (enchargeId) byEncharge.set(enchargeId, fakeRow);
      inserted++;
    }
  }

  // Final count
  const [[{ ahtil }]] = await conn.query(
    "SELECT COUNT(*) as ahtil FROM email_captures WHERE JSON_SEARCH(tags, 'one', 'AHTIL') IS NOT NULL"
  );
  const [[{ total }]] = await conn.query("SELECT COUNT(*) as total FROM email_captures");

  await conn.end();

  console.log(`\nDone:`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Updated:  ${updated}`);
  console.log(`  Skipped (no email): ${rows.length - validRows.length}`);
  console.log(`\nDB totals:`);
  console.log(`  email_captures total: ${total}`);
  console.log(`  AHTIL tag count:      ${ahtil}  (was 492)`);
}

run().catch(err => { console.error(err); process.exit(1); });
