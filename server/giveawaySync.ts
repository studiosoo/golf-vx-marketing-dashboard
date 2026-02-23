import XLSX from "xlsx";
import * as fs from "fs";
import { execSync } from "child_process";
import * as path from "path";
import { getDb } from "./db";
import { giveawayApplications } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const GOOGLE_SHEETS_FILE_NAME = "GOLFVX AH | Anniversary Applications 2026.xlsx";
const TEMP_DIR = "/tmp/giveaway_sync";

/**
 * Download Google Sheets file via rclone
 */
async function downloadGoogleSheets(): Promise<string> {
  // Ensure temp directory exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const filePath = path.join(TEMP_DIR, GOOGLE_SHEETS_FILE_NAME);
  
  // Download file using rclone
  execSync(
    `rclone copy "manus_google_drive:${GOOGLE_SHEETS_FILE_NAME}" ${TEMP_DIR}/ --config /home/ubuntu/.gdrive-rclone.ini`,
    { stdio: "inherit" }
  );

  return filePath;
}

/**
 * Parse Excel file and extract application data
 */
async function parseApplicationsFromExcel(filePath: string): Promise<any[]> {
  // Read Excel file using xlsx library
  const workbook = XLSX.readFile(filePath);
  
  // Find the sheet with the most data rows
  let targetSheet = workbook.SheetNames[0];
  let maxRows = 0;
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const rowCount = range.e.r - range.s.r + 1;
    if (rowCount > maxRows) {
      maxRows = rowCount;
      targetSheet = sheetName;
    }
  }
  
  console.log(`[GiveawaySync] Reading sheet "${targetSheet}" with ${maxRows} rows`);
  const worksheet = workbook.Sheets[targetSheet];
  
  // Convert to JSON (skip first 2 rows which are headers)
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
  
  const applications = [];
  
  // Start from row 4 (index 3) - skip header rows (row 1, 2, 3)
  for (let i = 3; i < data.length; i++) {
    const row = data[i] as any[];
    
    const timestamp = row[0];
    const name = row[1];
    const email = row[2];
    const phone = row[3];
    const ageRange = row[4];
    const gender = row[5];
    const city = row[6];
    const golfExperience = row[8];
    const howDidTheyHear = row[10];
    
    // Skip rows without email
    if (!email) continue;
    
    // Convert Excel timestamp to Date
    let submissionDate: Date;
    if (timestamp instanceof Date) {
      // Already a Date object
      submissionDate = timestamp;
    } else if (typeof timestamp === 'number') {
      // Excel serial date number
      const excelDate = XLSX.SSF.parse_date_code(timestamp);
      submissionDate = new Date(excelDate.y, excelDate.m - 1, excelDate.d, excelDate.H || 0, excelDate.M || 0, excelDate.S || 0);
    } else if (typeof timestamp === 'string') {
      submissionDate = new Date(timestamp);
    } else {
      submissionDate = new Date();
    }
    
    // Detect test entries
    const isTestEntry = 
      name?.toLowerCase().includes('test') ||
      email?.toLowerCase().includes('test') ||
      email?.toLowerCase().includes('studiosoo.com') ||
      email?.toLowerCase().includes('example.com');
    
    applications.push({
      name: name || '',
      email: email || '',
      phone: phone || '',
      city: city || '',
      ageRange: ageRange || '',
      gender: gender || '',
      golfExperience: golfExperience || '',
      howDidTheyHear: howDidTheyHear || '',
      submissionTimestamp: submissionDate,
      isTestEntry,
      status: 'pending'
    });
  }
  
  return applications;
}

/**
 * Sync giveaway applications from Google Sheets to database
 */
export async function syncGiveawayApplications(): Promise<{ synced: number; total: number }> {
  try {
    console.log("[GiveawaySync] Starting sync from Google Sheets...");
    
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Download and parse Google Sheets
    const filePath = await downloadGoogleSheets();
    const applications = await parseApplicationsFromExcel(filePath);
    
    console.log(`[GiveawaySync] Found ${applications.length} applications to sync`);
    
    // Clear existing applications and insert new ones
    await db.delete(giveawayApplications);
    
    // Insert applications in batches
    if (applications.length > 0) {
      await db.insert(giveawayApplications).values(applications);
    }
    
    console.log(`[GiveawaySync] Successfully synced ${applications.length} applications`);
    
    return {
      synced: applications.length,
      total: applications.length
    };
  } catch (error) {
    console.error("[GiveawaySync] Error syncing applications:", error);
    throw error;
  }
}

/**
 * Get all giveaway applications from database
 */
export async function getGiveawayApplications(): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Get applications from database (excluding test entries by default)
    const applications = await db
      .select()
      .from(giveawayApplications)
      .where(eq(giveawayApplications.isTestEntry, false));
    
    console.log(`[GiveawaySync] Found ${applications.length} applications from database`);
    
    return applications;
  } catch (error) {
    console.error("[GiveawaySync] Error fetching applications:", error);
    return [];
  }
}

/**
 * Get giveaway statistics
 */
export async function getGiveawayStats(): Promise<any> {
  const applications = await getGiveawayApplications();
  
  // Calculate demographics
  const ageRangeCount: Record<string, number> = {};
  const genderCount: Record<string, number> = {};
  const golfExperienceCount: Record<string, number> = {};
  
  for (const app of applications) {
    // Age range
    const age = app.ageRange || 'Unknown';
    ageRangeCount[age] = (ageRangeCount[age] || 0) + 1;
    
    // Gender
    const gender = app.gender || 'Unknown';
    genderCount[gender] = (genderCount[gender] || 0) + 1;
    
    // Golf experience
    const experience = app.golfExperience || 'Unknown';
    golfExperienceCount[experience] = (golfExperienceCount[experience] || 0) + 1;
  }
  
  return {
    totalApplications: applications.length,
    ageRangeDistribution: ageRangeCount,
    genderDistribution: genderCount,
    golfExperienceDistribution: golfExperienceCount
  };
}
