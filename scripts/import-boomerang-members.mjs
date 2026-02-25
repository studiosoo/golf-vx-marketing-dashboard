/**
 * Import Boomerang members from Excel report into the members table.
 * Only inserts members with status=installed that are not already in the DB.
 * Run: node scripts/import-boomerang-members.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import XLSX from "xlsx";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const XLSX_PATH = "/home/ubuntu/upload/report_24.02.2026.xlsx";

function parseBoomerangDate(dateStr) {
  if (!dateStr) return new Date();
  // Format: "23.02.2026 17:52:16"
  const [datePart, timePart] = dateStr.split(" ");
  const [day, month, year] = datePart.split(".");
  return new Date(`${year}-${month}-${day}T${timePart || "12:00:00"}`);
}

function normalizePhone(phone) {
  if (!phone) return null;
  const str = String(phone).replace(/\D/g, "");
  // US numbers: strip leading 1 if 11 digits
  if (str.length === 11 && str.startsWith("1")) return str.slice(1);
  if (str.length === 10) return str;
  return str.slice(-10) || null;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Get existing emails from DB
  const [existing] = await conn.execute("SELECT email FROM members");
  const existingEmails = new Set(existing.map((r) => r.email.toLowerCase().trim()));
  console.log(`Existing DB members: ${existingEmails.size}`);

  // Read Excel
  const workbook = XLSX.readFile(XLSX_PATH);
  const ws = workbook.Sheets["Clients"];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const toInsert = [];
  for (let i = 1; i < rows.length; i++) {
    const [name, phone, email, dob, created, status, cardSerial] = rows[i];
    if (!name && !email) continue;
    if (status !== "installed") continue;

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) continue;
    if (existingEmails.has(cleanEmail)) continue;

    toInsert.push({
      name: (name || "").trim(),
      email: cleanEmail,
      phone: normalizePhone(phone),
      joinDate: parseBoomerangDate(created),
      boomerangCustomerId: cardSerial || null,
      loyaltyCardStatus: "active",
    });
  }

  console.log(`Members to insert: ${toInsert.length}`);

  let inserted = 0;
  let skipped = 0;

  for (const m of toInsert) {
    try {
      await conn.execute(
        `INSERT INTO members 
          (name, email, phone, membershipTier, status, joinDate, boomerangCustomerId, loyaltyCardStatus, loyaltyPoints, lifetimeValue, totalVisits, emailEngagementScore, totalPurchases, totalLessons, emailSubscribed, customerStatus, createdAt, updatedAt)
         VALUES (?, ?, ?, 'none', 'active', ?, ?, ?, 0, 0, 0, 0, 0, 0, false, 'active', NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
           phone = COALESCE(phone, VALUES(phone)),
           boomerangCustomerId = COALESCE(boomerangCustomerId, VALUES(boomerangCustomerId)),
           loyaltyCardStatus = VALUES(loyaltyCardStatus),
           updatedAt = NOW()`,
        [m.name, m.email, m.phone, m.joinDate, m.boomerangCustomerId, m.loyaltyCardStatus]
      );
      inserted++;
    } catch (err) {
      console.warn(`Skipped ${m.email}: ${err.message}`);
      skipped++;
    }
  }

  const [countResult] = await conn.execute(
    "SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active FROM members"
  );
  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
  console.log(`New DB total: ${countResult[0].total} members (${countResult[0].active} active)`);

  await conn.end();
}

main().catch(console.error);
