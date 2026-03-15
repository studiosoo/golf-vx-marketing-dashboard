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
  
  const cityCount: Record<string, number> = {};
  const visitedBeforeCount: Record<string, number> = {};
  const howDidTheyHearCount: Record<string, number> = {};
  const bestTimeToCallCount: Record<string, number> = {};
  const indoorGolfFamiliarityCount: Record<string, number> = {};

  for (const app of applications) {
    // Age range
    const age = app.ageRange || 'Unknown';
    ageRangeCount[age] = (ageRangeCount[age] || 0) + 1;
    
    // Gender
    const gender = app.gender || 'Unknown';
    genderCount[gender] = (genderCount[gender] || 0) + 1;
    
    // Golf experience
    const experience = app.golfExperienceLevel || 'Unknown';
    golfExperienceCount[experience] = (golfExperienceCount[experience] || 0) + 1;

    // City
    const city = app.city || 'Unknown';
    cityCount[city] = (cityCount[city] || 0) + 1;

    // Visited before
    const visited = app.visitedBefore || 'Unknown';
    visitedBeforeCount[visited] = (visitedBeforeCount[visited] || 0) + 1;

    // How did they hear
    const hear = app.howDidTheyHear || 'Unknown';
    howDidTheyHearCount[hear] = (howDidTheyHearCount[hear] || 0) + 1;

    // Best time to call
    const callTime = app.bestTimeToCall || 'Unknown';
    bestTimeToCallCount[callTime] = (bestTimeToCallCount[callTime] || 0) + 1;

    // Indoor golf familiarity
    const familiarity = app.indoorGolfFamiliarity || 'Unknown';
    indoorGolfFamiliarityCount[familiarity] = (indoorGolfFamiliarityCount[familiarity] || 0) + 1;
  }
  
  // Group applications by submission date (YYYY-MM-DD)
  const dateCount: Record<string, number> = {};
  for (const app of applications) {
    if (!app.submissionTimestamp) continue;
    const d = new Date(app.submissionTimestamp as any);
    if (isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    dateCount[key] = (dateCount[key] || 0) + 1;
  }
  const applicationsByDate = Object.entries(dateCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return {
    totalApplications: applications.length,
    ageRangeDistribution: ageRangeCount,
    genderDistribution: genderCount,
    golfExperienceDistribution: golfExperienceCount,
    cityDistribution: cityCount,
    visitedBeforeDistribution: visitedBeforeCount,
    howDidTheyHearDistribution: howDidTheyHearCount,
    bestTimeToCallDistribution: bestTimeToCallCount,
    indoorGolfFamiliarityDistribution: indoorGolfFamiliarityCount,
    applicationsByDate,
    test: 0, // Test entries are already excluded
  };
}
