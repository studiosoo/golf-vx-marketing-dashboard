/**
 * Google Sheets Integration
 * 
 * Previously used rclone to sync with Google Drive, but rclone is not available
 * in the deployed environment. Application data is now stored directly in the
 * database via the submitApplication endpoint.
 * 
 * These functions are kept as no-ops to avoid breaking existing code that calls them.
 * The data is already persisted in the database, so Google Sheets sync is optional.
 */

/**
 * Append a row to a Google Sheet (no-op - data is saved to database instead)
 * @param sheetType "Entry" or "Application"
 * @param data Row data as key-value pairs
 */
export async function appendToGoogleSheet(
  sheetType: "Entry" | "Application",
  data: Record<string, any>
): Promise<void> {
  // Log the attempt but don't fail - data is already saved to database
  console.log(`[GoogleSheets] Skipping Google Sheets append for ${sheetType} (rclone not available in deployed environment). Data is saved to database.`);
}

/**
 * Get shareable link for a Google Sheet (returns empty string)
 * @param sheetType "Entry" or "Application"
 */
export async function getSheetLink(sheetType: "Entry" | "Application"): Promise<string> {
  console.log(`[GoogleSheets] Google Sheets link not available (rclone not configured).`);
  return "";
}
