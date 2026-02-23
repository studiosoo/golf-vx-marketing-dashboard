/**
 * Google Sheets Integration
 * Uses rclone to append data to Google Sheets in Google Drive
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

const RCLONE_CONFIG = "/home/ubuntu/.gdrive-rclone.ini";
const REMOTE_NAME = "manus_google_drive";

// Google Sheet IDs (will be created on first use)
const SHEET_IDS = {
  Entry: "Anniversary_Giveaway_Entries",
  Application: "Anniversary_Giveaway_Applications",
};

/**
 * Append a row to a Google Sheet
 * @param sheetType "Entry" or "Application"
 * @param data Row data as key-value pairs
 */
export async function appendToGoogleSheet(
  sheetType: "Entry" | "Application",
  data: Record<string, any>
): Promise<void> {
  try {
    const sheetName = SHEET_IDS[sheetType];
    const csvPath = `/tmp/${sheetName}_${Date.now()}.csv`;
    
    // Convert data to CSV row
    const headers = Object.keys(data);
    const values = headers.map(key => {
      const value = data[key];
      if (value === null || value === undefined) return "";
      if (typeof value === "string") {
        // Escape quotes and wrap in quotes if contains comma
        const escaped = value.replace(/"/g, '""');
        return escaped.includes(",") ? `"${escaped}"` : escaped;
      }
      return String(value);
    });
    
    const csvContent = values.join(",") + "\n";
    
    // Write CSV to temp file
    await fs.writeFile(csvPath, csvContent);
    
    // Check if sheet exists in Google Drive
    const sheetPath = `${REMOTE_NAME}:/${sheetName}.csv`;
    let sheetExists = false;
    
    try {
      await execAsync(`rclone ls "${sheetPath}" --config ${RCLONE_CONFIG}`);
      sheetExists = true;
    } catch {
      // Sheet doesn't exist, create with headers
      const headerRow = headers.join(",") + "\n";
      const headerPath = `/tmp/${sheetName}_header.csv`;
      await fs.writeFile(headerPath, headerRow);
      await execAsync(`rclone copy "${headerPath}" "${REMOTE_NAME}:/" --config ${RCLONE_CONFIG}`);
      await execAsync(`rclone moveto "${REMOTE_NAME}:/${path.basename(headerPath)}" "${sheetPath}" --config ${RCLONE_CONFIG}`);
      await fs.unlink(headerPath);
    }
    
    // Append data to sheet
    if (sheetExists) {
      // Download existing sheet
      const existingPath = `/tmp/${sheetName}_existing.csv`;
      await execAsync(`rclone copy "${sheetPath}" /tmp/ --config ${RCLONE_CONFIG}`);
      await execAsync(`mv /tmp/${sheetName}.csv ${existingPath}`);
      
      // Append new row
      const existingContent = await fs.readFile(existingPath, "utf-8");
      const updatedContent = existingContent + csvContent;
      await fs.writeFile(csvPath, updatedContent);
      
      // Upload updated sheet
      await execAsync(`rclone copy "${csvPath}" "${REMOTE_NAME}:/" --config ${RCLONE_CONFIG}`);
      await execAsync(`rclone moveto "${REMOTE_NAME}:/${path.basename(csvPath)}" "${sheetPath}" --config ${RCLONE_CONFIG}`);
      
      // Cleanup
      await fs.unlink(existingPath);
    }
    
    // Cleanup temp file
    await fs.unlink(csvPath);
    
    console.log(`[GoogleSheets] Appended row to ${sheetName}`);
  } catch (error) {
    console.error(`[GoogleSheets] Failed to append to ${sheetType}:`, error);
    throw error;
  }
}

/**
 * Get shareable link for a Google Sheet
 * @param sheetType "Entry" or "Application"
 */
export async function getSheetLink(sheetType: "Entry" | "Application"): Promise<string> {
  try {
    const sheetName = SHEET_IDS[sheetType];
    const sheetPath = `${REMOTE_NAME}:/${sheetName}.csv`;
    
    const { stdout } = await execAsync(`rclone link "${sheetPath}" --config ${RCLONE_CONFIG}`);
    return stdout.trim();
  } catch (error) {
    console.error(`[GoogleSheets] Failed to get link for ${sheetType}:`, error);
    throw error;
  }
}
