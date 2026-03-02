import { getDb } from "./db";
import { giveawayApplications } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

/**
 * Sync giveaway applications
 * 
 * Applications are now submitted directly to the database via the submitApplication endpoint.
 * This function returns the current state of applications in the database.
 * The old rclone-based Google Drive sync has been removed since rclone is not available
 * in the deployed environment.
 */
export async function syncGiveawayApplications(): Promise<{ synced: number; total: number; message: string }> {
  try {
    console.log("[GiveawaySync] Checking application data...");
    
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Count current applications in database
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(giveawayApplications);
    
    const total = countResult[0]?.count || 0;
    
    // Count non-test applications
    const realCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(giveawayApplications)
      .where(eq(giveawayApplications.isTestEntry, false));
    
    const realCount = realCountResult[0]?.count || 0;
    
    console.log(`[GiveawaySync] Found ${total} total applications (${realCount} real, ${total - realCount} test)`);
    
    return {
      synced: realCount,
      total,
      message: `${realCount} applications in database (${total - realCount} test entries excluded). Applications are captured directly from the submission form.`,
    };
  } catch (error) {
    console.error("[GiveawaySync] Error checking applications:", error);
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
      .where(eq(giveawayApplications.isTestEntry, false))
      .orderBy(desc(giveawayApplications.submissionTimestamp));
    
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
    const experience = app.golfExperienceLevel || app.howDidTheyHear || 'Unknown';
    golfExperienceCount[experience] = (golfExperienceCount[experience] || 0) + 1;
  }
  
  // Status breakdown
  const statusCount: Record<string, number> = {};
  for (const app of applications) {
    const s = app.status || 'pending';
    statusCount[s] = (statusCount[s] || 0) + 1;
  }

  return {
    totalApplications: applications.length,
    ageRangeDistribution: ageRangeCount,
    genderDistribution: genderCount,
    golfExperienceDistribution: golfExperienceCount,
    statusBreakdown: statusCount,
    pendingCount: statusCount['pending'] || 0,
    contactedCount: statusCount['contacted'] || 0,
    test: 0, // Test entries are already excluded
  };
}
