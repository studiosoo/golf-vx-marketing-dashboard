/**
 * Import Toast POS daily sales data from manually exported CSV reports.
 * Run: node scripts/import-toast-daily-sales.cjs
 *
 * Sources:
 *   ~/Downloads/SalesSummary_2025-07-01_2025-12-31.zip → /tmp/ss_2025/Sales by day.csv
 *   ~/Downloads/sales-by-date-jan1-mar9-2026.csv
 *
 * Coverage: Jul 1, 2025 – Mar 9, 2026
 *
 * Notes:
 * - "Net Sales" in Toast CSVs = revenue after discounts, BEFORE tax
 * - Bay vs F&B splits are ESTIMATED using period-level category summaries
 *   (daily granularity not available from Toast exports)
 * - Period ratios sourced from Sales Category Summary CSVs:
 *     Jul–Dec 2025: Bay 62.0%, F&B 32.1%  (from SalesSummary_2025-07-01_2025-12-31.zip)
 *     Jan+Mar 2026: Bay 71.9%, F&B 27.4%  (Jan–Mar minus Feb, from breakdowns)
 *     Feb 2026:     Bay 67.7%, F&B 31.6%  (from SalesSummary_2026-02-01_2026-02-28.zip)
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs    = require("fs");
const path  = require("path");

// ─── Period ratios (bay_revenue / food_bev_revenue as fraction of net sales) ─
const RATIOS = {
  "2025H2": { bay: 0.620, fnb: 0.321 }, // Jul–Dec 2025
  "2026JM": { bay: 0.719, fnb: 0.274 }, // Jan + Mar 2026
  "2026FEB": { bay: 0.677, fnb: 0.316 }, // Feb 2026
};

function getRatioKey(dateStr /* YYYYMMDD */) {
  const ym = dateStr.slice(0, 6);
  if (ym.startsWith("2025")) return "2025H2";
  if (ym === "202602")       return "2026FEB";
  return "2026JM"; // Jan, Mar 2026
}

// ─── CSV parsers ──────────────────────────────────────────────────────────────

/** Parse ss_2025/Sales by day.csv (format: yyyyMMdd,net_sales,orders,guests) */
function loadSalesByDayYYYYMMDD(filePath) {
  const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(l => l.trim());
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const [dateStr, netSales, orders, guests] = lines[i].split(",");
    if (!dateStr || !/^\d{8}$/.test(dateStr.trim())) continue;
    const net = parseFloat(netSales) || 0;
    if (isNaN(net)) continue;
    results.push({
      date: dateStr.trim(),
      netSales: net,
      orders: parseInt(orders) || 0,
      guests: parseInt(guests) || 0,
    });
  }
  return results;
}

/** Parse sales-by-date-jan1-mar9-2026.csv (format: MM/DD/YYYY,net_sales,orders,guests) */
function loadSalesByDateMMDDYYYY(filePath) {
  const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(l => l.trim());
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    const rawDate = parts[0]?.trim();
    if (!rawDate || !rawDate.includes("/")) continue;
    const [mm, dd, yyyy] = rawDate.split("/");
    if (!mm || !dd || !yyyy) continue;
    const dateStr = `${yyyy}${mm.padStart(2,"0")}${dd.padStart(2,"0")}`;
    const net = parseFloat(parts[1]) || 0;
    results.push({
      date: dateStr,
      netSales: net,
      orders: parseInt(parts[2]) || 0,
      guests: parseInt(parts[3]) || 0,
    });
  }
  return results;
}

async function run() {
  // ── Load source files ──────────────────────────────────────────────────────
  const ss2025Path = "/tmp/ss_2025/Sales by day.csv";
  const csv2026Path = path.join(process.env.HOME, "Downloads", "sales-by-date-jan1-mar9-2026.csv");

  if (!fs.existsSync(ss2025Path)) {
    console.error("Missing:", ss2025Path);
    console.error("Run: unzip ~/Downloads/SalesSummary_2025-07-01_2025-12-31.zip -d /tmp/ss_2025");
    process.exit(1);
  }

  const rows2025 = loadSalesByDayYYYYMMDD(ss2025Path);
  const rows2026 = loadSalesByDateMMDDYYYY(csv2026Path);

  // Merge: prefer 2025 CSV for 2025 dates, 2026 CSV for 2026 dates
  // Only include Jul 1, 2025 onwards
  const allRows = new Map();
  for (const r of rows2025) {
    if (r.date >= "20250701") allRows.set(r.date, r);
  }
  for (const r of rows2026) {
    if (r.date >= "20260101") allRows.set(r.date, r); // 2026 CSV wins for 2026 dates
  }

  const sorted = [...allRows.values()].sort((a, b) => a.date.localeCompare(b.date));
  console.log(`Total days to import: ${sorted.length}  (${sorted[0].date} → ${sorted[sorted.length-1].date})`);

  // ── Connect ────────────────────────────────────────────────────────────────
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  let inserted = 0, updated = 0;

  for (const row of sorted) {
    const { bay, fnb } = RATIOS[getRatioKey(row.date)];
    const bayRev = parseFloat((row.netSales * bay).toFixed(2));
    const fnbRev = parseFloat((row.netSales * fnb).toFixed(2));

    const result = await conn.query(
      `INSERT INTO toast_daily_summary
         (date, total_revenue, bay_revenue, food_bev_revenue, golf_revenue,
          total_orders, total_guests, total_tax, total_tips, total_discounts,
          cash_revenue, credit_revenue, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, 0, 0, 0, 0, 0, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         total_revenue     = VALUES(total_revenue),
         bay_revenue       = VALUES(bay_revenue),
         food_bev_revenue  = VALUES(food_bev_revenue),
         total_orders      = VALUES(total_orders),
         total_guests      = VALUES(total_guests),
         updated_at        = NOW()`,
      [row.date, row.netSales, bayRev, fnbRev, row.orders, row.guests]
    );

    const affected = result[0].affectedRows;
    const changed  = result[0].changedRows ?? 0;
    if (affected === 1 && changed === 0) inserted++;
    else updated++;
  }

  await conn.end();

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n=== Import Summary ===");
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Updated:  ${updated}`);
  console.log(`  Total:    ${sorted.length}`);

  // Monthly totals
  console.log("\n=== Monthly Net Sales (from CSV) ===");
  const monthly = {};
  for (const r of sorted) {
    const ym = r.date.slice(0, 6);
    monthly[ym] = (monthly[ym] || 0) + r.netSales;
  }
  let grandTotal = 0;
  for (const [ym, total] of Object.entries(monthly)) {
    const label = `${ym.slice(0,4)}-${ym.slice(4,6)}`;
    console.log(`  ${label}: $${total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`);
    grandTotal += total;
  }
  console.log(`  ─────────────────────`);
  console.log(`  TOTAL:   $${grandTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`);
  console.log("\nNote: Bay/F&B splits are estimated from period-level category summaries.");
}

run().catch(err => { console.error(err); process.exit(1); });
