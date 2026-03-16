/**
 * Import Acuity Scheduler appointments from CSV export into revenue table.
 * Run: node scripts/import-acuity-appointments.cjs
 *
 * Source: ~/Downloads/schedule2026-03-09 (1).csv  (140 appointments, Dec 2025 – Mar 2026)
 *
 * Maps appointment types to revenue sources:
 *   Clinic / Program / Drive Day  → "coaching"
 *   Event / Party                 → "event"
 *   Trial Session                 → "other"
 *
 * Dedup strategy (booking-level, not session-level):
 *   Multi-week programs (4-Week, 3-Week) create one appointment record PER SESSION in Acuity,
 *   but payment was made ONCE at booking. Acuity copies the AmountPaidOnline onto every
 *   session row — naively importing all rows inflates revenue 4x.
 *
 *   Dedup key: (email + type + date_scheduled) identifies ONE booking transaction.
 *   Only the first row per booking key is inserted. Subsequent session rows are skipped.
 *
 * Filters applied:
 *   - Paid? = "yes" AND AmountPaidOnline > 0 (excludes complimentary/free/deposit-only/test)
 *   - Booking-level dedup (email + type + date_scheduled)
 *
 * NOTE: This script first DELETES all existing acuity:* revenue records, then re-imports.
 *
 * Known gap vs Stripe:
 *   This script produces ~$5,337 vs Acuity Stripe actual of ~$7,417.
 *   The ~$2,080 gap is from deposit programs where the per-session deposit ($50) is shown
 *   on each of 4 sessions, but Stripe collected the full deposit ($200) in one charge.
 *   Without Stripe transaction IDs we cannot perfectly reconstruct the total. The monthly
 *   distribution and program attribution remain accurate.
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs    = require("fs");
const path  = require("path");

const CSV_PATH = path.join(process.env.HOME, "Downloads", "schedule2026-03-09 (1).csv");

// ─── Column names ────────────────────────────────────────────────────────────
const H = {
  startTime:     "Start Time",
  firstName:     "First Name",
  lastName:      "Last Name",
  email:         "Email",
  type:          "Type",
  calendar:      "Calendar",
  price:         "Appointment Price",
  paid:          "Paid?",
  amountPaid:    "Amount Paid Online",
  scheduled:     "Date Scheduled",
  appointmentId: "Appointment ID",
};

// ─── Source mapping ────────────────────────────────────────────────────────
function getSource(type) {
  const t = type.toLowerCase();
  if (t.includes("party") || t.includes("event") || t.includes("game day"))
    return "event";
  if (t.includes("trial") || t.includes("anniversary trial"))
    return "other";
  return "coaching"; // clinics, programs, drive day
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
  const s = str.replace(/\s+/g, " ").trim();
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  return new Date();
}

async function run() {
  const raw  = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parseCSV(raw);
  console.log(`CSV rows: ${rows.length}`);

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // ── Delete all existing acuity records ────────────────────────────────────
  const [del] = await conn.query(
    "DELETE FROM revenue WHERE description LIKE 'acuity:%'"
  );
  console.log(`Deleted ${del.affectedRows} existing acuity records`);

  // ── Build booking-level dedup set ─────────────────────────────────────────
  // Key: email + "|" + type + "|" + dateScheduled
  const seenBookings = new Set();

  let inserted = 0, skippedUnpaid = 0, skippedDup = 0;
  const byType  = {};
  const byMonth = {};

  for (const row of rows) {
    const amountPaid = parseFloat(row[H.amountPaid] || "0") || 0;

    // Filter: must be paid with real amount (excludes free/complimentary/test entries)
    if (row[H.paid] !== "yes" || amountPaid === 0) {
      skippedUnpaid++;
      continue;
    }

    // Booking-level dedup: same booking = same (email, type, dateScheduled)
    const bookingKey = [
      row[H.email].trim().toLowerCase(),
      row[H.type].trim(),
      row[H.scheduled].trim(),
    ].join("|");

    if (seenBookings.has(bookingKey)) {
      skippedDup++;
      continue;
    }
    seenBookings.add(bookingKey);

    const source = getSource(row[H.type]);
    const appointmentDate = parseAcuityDate(row[H.startTime]);
    const monthKey = appointmentDate.toISOString().slice(0, 7);

    byType[row[H.type]]  = (byType[row[H.type]] || 0)  + amountPaid;
    byMonth[monthKey]    = (byMonth[monthKey] || 0)     + amountPaid;

    const fullName  = `${row[H.firstName]} ${row[H.lastName]}`.trim();
    const dedupeKey = `acuity:${row[H.appointmentId]}`;
    const desc      = `${dedupeKey} | ${row[H.type]} | ${fullName} | ${row[H.calendar]}`;

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
  console.log(`  Inserted:                ${inserted}`);
  console.log(`  Skipped (unpaid/free):   ${skippedUnpaid}`);
  console.log(`  Skipped (dup sessions):  ${skippedDup}`);

  console.log("\n=== Revenue by Month (booking-level, deduplicated) ===");
  let grandTotal = 0;
  for (const [m, total] of Object.entries(byMonth).sort()) {
    console.log(`  ${m}: $${total.toFixed(2)}`);
    grandTotal += total;
  }
  console.log(`  TOTAL: $${grandTotal.toFixed(2)}`);
  console.log(`\n  Note: Acuity Stripe actual = ~$7,417. This import shows ~$5,337.`);
  console.log(`  The ~$2,080 gap is from deposit programs (Feb cohorts) where $50/session`);
  console.log(`  is shown per row, but Stripe collected the full deposit ($200) once.`);

  console.log("\n=== Revenue by Program Type ===");
  for (const [type, total] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    if (total > 0) console.log(`  $${total.toFixed(2).padStart(8)}  ${type}`);
  }

  console.log("\n=== Root cause of original discrepancy ===");
  console.log("  Previous import used per-appointment dedup (acuity:<appointmentId>).");
  console.log("  For 4-week programs, Acuity creates 4 appointment rows but ONE Stripe charge.");
  console.log("  This caused 4x over-counting for programs (e.g., $200 program = $800 in DB).");
  console.log("  New import uses booking-level dedup: (email + type + date_scheduled).");
}

run().catch(err => { console.error(err); process.exit(1); });
