/**
 * Import Acuity Scheduler appointments from CSV export into revenue table.
 * Run: node scripts/import-acuity-appointments.cjs
 *
 * Source: ~/Downloads/schedule2026-03-09.csv  (138 appointments, Dec 2025 – Mar 2026)
 *
 * Maps appointment types to revenue sources:
 *   Clinic / Program / Drive Day  → "coaching"
 *   Event / Party                 → "event"
 *   Trial Session                 → "other"
 *
 * Dedup key: description = "acuity:<appointmentId>"
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs    = require("fs");
const path  = require("path");

const CSV_PATH = path.join(process.env.HOME, "Downloads", "schedule2026-03-09.csv");

// ─── Column indices ────────────────────────────────────────────────────────
const H = {
  startTime:  "Start Time",
  firstName:  "First Name",
  lastName:   "Last Name",
  email:      "Email",
  type:       "Type",
  calendar:   "Calendar",
  price:      "Appointment Price",
  paid:       "Paid?",
  amountPaid: "Amount Paid Online",
  scheduled:  "Date Scheduled",
  appointmentId: "Appointment ID",
};

// ─── Source mapping ────────────────────────────────────────────────────────
function getSource(type) {
  const t = type.toLowerCase();
  if (t.includes("party") || t.includes("event") || t.includes("game day"))
    return "event";
  if (t.includes("trial") || t.includes("anniversary trial"))
    return "other";
  // clinics, programs, drive day = coaching
  return "coaching";
}

// ─── Parse CSV with quoted fields ─────────────────────────────────────────
function parseCSV(raw) {
  const lines = raw.split("\n").filter(l => l.trim());
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = (vals[idx] || "").trim(); });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const fields = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

// ─── Parse "December 24, 2025 9:00 am" → Date ─────────────────────────────
function parseAcuityDate(str) {
  // Remove extra spaces
  const s = str.replace(/\s+/g, " ").trim();
  // "December 24, 2025 9:00 am" or "March 5, 2026 9:00 am"
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  return new Date();
}

async function run() {
  const raw  = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parseCSV(raw);
  console.log(`CSV rows: ${rows.length}`);

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Load existing acuity entries to avoid duplicates
  const [existing] = await conn.query(
    "SELECT description FROM revenue WHERE description LIKE 'acuity:%'"
  );
  const existingIds = new Set(existing.map(r => r.description));
  console.log(`Existing acuity entries in DB: ${existingIds.size}`);

  let inserted = 0, skipped = 0, zeroRevenue = 0;
  const byType = {};
  const byMonth = {};

  for (const row of rows) {
    const appointmentId = row[H.appointmentId];
    const dedupeKey = `acuity:${appointmentId}`;

    if (existingIds.has(dedupeKey)) { skipped++; continue; }

    const amountPaid = parseFloat(row[H.amountPaid] || "0") || 0;
    const source = getSource(row[H.type]);
    const appointmentDate = parseAcuityDate(row[H.startTime]);
    const monthKey = appointmentDate.toISOString().slice(0, 7);

    // Track stats
    byType[row[H.type]] = (byType[row[H.type]] || 0) + amountPaid;
    byMonth[monthKey] = (byMonth[monthKey] || 0) + amountPaid;

    if (amountPaid === 0 && row[H.paid] !== "yes") {
      zeroRevenue++;
    }

    const fullName = `${row[H.firstName]} ${row[H.lastName]}`.trim();
    const desc = `${dedupeKey} | ${row[H.type]} | ${fullName} | ${row[H.calendar]}`;

    // venue_id = 1 (Arlington Heights)
    await conn.query(
      `INSERT INTO revenue (date, amount, source, description, memberId, campaignId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NULL, NULL, NOW(), NOW())`,
      [appointmentDate, amountPaid, source, desc]
    );

    inserted++;
  }

  await conn.end();

  // ── Report ────────────────────────────────────────────────────────────────
  console.log("\n=== Acuity Import Summary ===");
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (already existed): ${skipped}`);
  console.log(`  Zero-revenue (complimentary/free): ${zeroRevenue}`);

  console.log("\n=== Revenue by Month ===");
  let grandTotal = 0;
  for (const [m, total] of Object.entries(byMonth).sort()) {
    console.log(`  ${m}: $${total.toFixed(2)}`);
    grandTotal += total;
  }
  console.log(`  TOTAL: $${grandTotal.toFixed(2)}`);

  console.log("\n=== Revenue by Program Type ===");
  for (const [type, total] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    if (total > 0) console.log(`  $${total.toFixed(2).padStart(8)}  ${type}`);
  }

  console.log("\nNote: Export covers Dec 24, 2025 – Mar 5, 2026 only.");
  console.log("      For strategy data from Jul 2025, re-export Acuity with a wider date range.");
}

run().catch(err => { console.error(err); process.exit(1); });
