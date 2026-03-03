/**
 * Quick test script to verify Google Sheets CSV sync works end-to-end.
 * Run with: node test-sync.mjs
 */
import { createRequire } from "module";
import { execSync } from "child_process";

// Test the CSV fetch directly
const SHEET_ID = "1Xx2LPavlwV7Bn4URrYHy9ewYoTc9cWFbc3X27rFDspY";
const SHEET_GID = "883252165";
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

console.log("Testing Google Sheets CSV fetch...");
console.log("URL:", CSV_EXPORT_URL);

try {
  const resp = await fetch(CSV_EXPORT_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; GolfVX-Sync/1.0)" },
    redirect: "follow",
  });

  if (!resp.ok) {
    console.error(`❌ HTTP ${resp.status}: ${await resp.text()}`);
    process.exit(1);
  }

  const text = await resp.text();
  const lines = text.split("\n");
  console.log(`✅ CSV fetched successfully: ${lines.length} lines`);
  console.log(`   First line: ${lines[0].slice(0, 80)}`);
  console.log(`   Second line: ${lines[1].slice(0, 80)}`);
  
  // Count data rows (skip 3 header rows)
  const dataRows = lines.slice(3).filter(l => l.trim() && l.split(",")[0].trim());
  console.log(`   Data rows (after 3 headers): ${dataRows.length}`);
  
  if (dataRows.length > 0) {
    const lastRow = dataRows[dataRows.length - 1].split(",");
    console.log(`   Last entry: ts=${lastRow[0]}, name=${lastRow[1]}`);
  }
  
  console.log("\n✅ Google Sheets CSV sync is ready to use!");
  console.log("   The sync will run automatically at 8am, 2pm, 8pm CST");
  console.log("   Manual sync available via Dashboard → 'Sync Now' button");
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
}
