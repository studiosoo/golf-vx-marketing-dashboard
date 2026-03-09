/**
 * Import Encharge AHTIL-tagged contacts into email_captures table.
 * Source: Encharge CSV export filtered by AHTIL tag.
 * Run: node scripts/import-ahtil-contacts.mjs /path/to/encharge-ahtil.csv
 *
 * Behaviour:
 *  - Skips rows with no email or invalid-looking email
 *  - Upserts by email: updates enchargeId/tags/phone if record already exists
 *  - Maps "Unsubscribed=true" → status="unsubscribed"
 *  - Stores all Encharge tags in JSON tags column
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createReadStream } from "fs";
import { parse } from "csv-parse";

const CSV_PATH =
  process.argv[2] ?? "/Users/studiosoo/Downloads/encharge ahtil.csv";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
console.log("Connected to database.");

let inserted = 0;
let updated = 0;
let skipped = 0;
let total = 0;

const parser = createReadStream(CSV_PATH).pipe(
  parse({
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  })
);

for await (const row of parser) {
  total++;

  const email = (row["Email"] || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    skipped++;
    continue;
  }

  const firstName = (row["First Name"] || "").trim() || null;
  const lastName = (row["Last Name"] || "").trim() || null;
  const rawPhone = (row["Phone"] || "").trim();
  const phone = rawPhone ? rawPhone.replace(/\D/g, "").slice(-10) || null : null;
  const enchargeId = (row["Id"] || "").trim() || null;
  const unsubscribed = (row["Unsubscribed"] || "").toLowerCase() === "true";
  const status = unsubscribed ? "unsubscribed" : "new";

  // Collect all tags from both "Tags" and "Tag" columns
  const rawTags = [row["Tags"] || "", row["Tag"] || ""]
    .join(",")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  // Deduplicate
  const tags = [...new Set(rawTags)];
  const tagsJson = JSON.stringify(tags);

  // Parse capturedAt from "Created At" — format: "12/5/2025, 6:00 AM"
  let capturedAt = Date.now();
  const rawCreatedAt = row["Created At"] || "";
  if (rawCreatedAt) {
    const parsed = Date.parse(rawCreatedAt);
    if (!isNaN(parsed)) capturedAt = parsed;
  }

  // Check if email already exists
  const [existing] = await conn.execute(
    "SELECT id, encharge_id, tags FROM email_captures WHERE email = ? LIMIT 1",
    [email]
  );

  if (existing.length > 0) {
    const rec = existing[0];
    // Update enchargeId, tags, phone if they were missing
    const needsUpdate =
      (!rec.encharge_id && enchargeId) ||
      (!rec.tags && tagsJson !== "[]");

    if (needsUpdate) {
      await conn.execute(
        `UPDATE email_captures
         SET encharge_id = COALESCE(encharge_id, ?),
             tags        = COALESCE(NULLIF(tags, ''), ?),
             phone       = COALESCE(phone, ?)
         WHERE id = ?`,
        [enchargeId, tagsJson, phone, rec.id]
      );
      updated++;
    } else {
      skipped++;
    }
    continue;
  }

  // Insert new record
  await conn.execute(
    `INSERT INTO email_captures
       (email, first_name, last_name, phone, source, source_detail,
        status, encharge_id, tags, captured_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'manual_csv', 'encharge_ahtil_mar2026',
             ?, ?, ?, ?, NOW(), NOW())`,
    [email, firstName, lastName, phone, status, enchargeId, tagsJson, capturedAt]
  );
  inserted++;
}

await conn.end();

console.log("\n=== Import complete ===");
console.log(`Total rows processed : ${total}`);
console.log(`Inserted (new)       : ${inserted}`);
console.log(`Updated (existing)   : ${updated}`);
console.log(`Skipped (no email / unchanged) : ${skipped}`);

const [[{ total: dbTotal }]] = await mysql
  .createConnection(process.env.DATABASE_URL)
  .then((c) =>
    c.execute("SELECT COUNT(*) as total FROM email_captures").then((r) => {
      c.end();
      return r;
    })
  );
console.log(`\nTotal contacts in DB now: ${dbTotal}`);
