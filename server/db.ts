import { eq, and, or, gte, lte, desc, sql, between, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  campaigns,
  InsertCampaign,
  Campaign,
  channels,
  InsertChannel,
  Channel,
  channelMetrics,
  InsertChannelMetric,
  ChannelMetric,
  members,
  InsertMember,
  Member,
  revenue,
  InsertRevenue,
  Revenue,
  tasks,
  InsertTask,
  Task,
  reports,
  InsertReport,
  Report,
  campaignExpenses,
  InsertCampaignExpense,
  CampaignExpense,
  programCampaigns,
  InsertProgramCampaign,
  ProgramCampaign,
  landingPages,
  InsertLandingPage,
  LandingPage,
  pageAnalytics,
  InsertPageAnalytics,
  PageAnalytics,
  anniversaryGiveawayEntries,
  membershipEvents,
  MembershipEvent,
  NewMembershipEvent,
  cfFunnels,
  cfFormSubmissions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= User Functions =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= Campaign Functions =============

export async function getAllCampaigns() {
  const db = await getDb();
  if (!db) return [];
  
  // Sort by display_order first (explicit ordering), then status priority, then start date
  const allCampaigns = await db.select().from(campaigns);
  
  const statusPriority: Record<string, number> = {
    'active': 1,
    'planned': 2,
    'paused': 3,
    'completed': 4
  };
  
  return allCampaigns.sort((a, b) => {
    // Primary: display_order (null/undefined goes last)
    const orderA = a.display_order ?? 9999;
    const orderB = b.display_order ?? 9999;
    if (orderA !== orderB) return orderA - orderB;
    
    // Secondary: status priority
    const priorityA = statusPriority[a.status] || 5;
    const priorityB = statusPriority[b.status] || 5;
    if (priorityA !== priorityB) return priorityA - priorityB;
    
    // Tertiary: start date descending
    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return dateB - dateA;
  });
}

export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result[0];
}

export async function getCampaignsByStatus(status: Campaign["status"]) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(campaigns).where(eq(campaigns.status, status)).orderBy(desc(campaigns.startDate));
}

export async function getCampaignsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(campaigns)
    .where(
      and(
        gte(campaigns.startDate, startDate),
        lte(campaigns.endDate, endDate)
      )
    )
    .orderBy(desc(campaigns.startDate));
}

export async function createCampaign(campaign: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(campaigns).values(campaign);
  return Number(result[0].insertId);
}

export async function updateCampaign(id: number, updates: Partial<InsertCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(campaigns).set(updates).where(eq(campaigns.id, id));
}

export async function updateCampaignVisuals(
  id: number,
  visuals: {
    landingPageUrl?: string;
    posterImageUrl?: string;
    reelThumbnailUrl?: string;
    additionalVisuals?: string[];
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(campaigns).set(visuals).where(eq(campaigns.id, id));
}

export async function getCampaignsByCategory(category: Campaign["category"]) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(campaigns).where(eq(campaigns.category, category)).orderBy(desc(campaigns.startDate));
}

export async function getCategorySummary() {
  const db = await getDb();
  if (!db) return [];
  
  // Get all campaigns grouped by category with aggregated metrics
  const allCampaigns = await db.select().from(campaigns);
  
  const categories = [
    { id: "trial_conversion", name: "Trial Conversion Campaign", description: "Converting prospects to members" },
    { id: "membership_acquisition", name: "Membership Acquisition Campaign", description: "Annual and monthly membership giveaways" },
    { id: "member_retention", name: "Member Retention + Community Flywheel", description: "Drive days, tournaments, and member engagement" },
    { id: "corporate_events", name: "Corporate Events & B2B Sales Campaign", description: "Corporate bookings and B2B partnerships" }
  ];
  
  return categories.map(cat => {
    const categoryCampaigns = allCampaigns.filter(c => c.category === cat.id);
    
    const totalBudget = categoryCampaigns.reduce((sum, c) => sum + Number(c.budget || 0), 0);
    const totalSpend = categoryCampaigns.reduce((sum, c) => sum + Number(c.actualSpend || 0), 0);
    const totalRevenue = categoryCampaigns.reduce((sum, c) => sum + Number(c.actualRevenue || 0), 0);
    const totalMetaAdsSpend = categoryCampaigns.reduce((sum, c) => sum + Number(c.metaAdsSpend || 0), 0);
    
    const activeCampaigns = categoryCampaigns.filter(c => c.status === "active").length;
    const completedCampaigns = categoryCampaigns.filter(c => c.status === "completed").length;
    
    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    
    // Get visual assets from campaigns (up to 3 recent campaigns with visuals)
    const campaignsWithVisuals = categoryCampaigns
      .filter(c => c.landingPageUrl || c.posterImageUrl || c.reelThumbnailUrl)
      .slice(0, 3);
    
    const visualPreviews = campaignsWithVisuals.map(c => ({
      landingPageUrl: c.landingPageUrl,
      posterImageUrl: c.posterImageUrl,
      reelThumbnailUrl: c.reelThumbnailUrl,
      campaignName: c.name
    }));
    
    return {
      ...cat,
      totalBudget,
      totalSpend,
      totalRevenue,
      totalMetaAdsSpend,
      activeCampaigns,
      completedCampaigns,
      totalCampaigns: categoryCampaigns.length,
      roi,
      visualPreviews
    };
  });
}

// ============= Channel Functions =============

export async function getAllChannels() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(channels).where(eq(channels.isActive, true));
}

export async function getChannelById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
  return result[0];
}

export async function createChannel(channel: InsertChannel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(channels).values(channel);
  return Number(result[0].insertId);
}

// ============= Channel Metrics Functions =============

export async function getChannelMetricsByDateRange(channelId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(channelMetrics)
    .where(
      and(
        eq(channelMetrics.channelId, channelId),
        gte(channelMetrics.date, startDate),
        lte(channelMetrics.date, endDate)
      )
    )
    .orderBy(channelMetrics.date);
}

export async function getChannelMetricsByCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(channelMetrics)
    .where(eq(channelMetrics.campaignId, campaignId))
    .orderBy(channelMetrics.date);
}

export async function createChannelMetric(metric: InsertChannelMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(channelMetrics).values(metric);
  return Number(result[0].insertId);
}

export async function getChannelPerformanceSummary(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      channelId: channelMetrics.channelId,
      channelName: channels.name,
      channelType: channels.type,
      totalImpressions: sql<number>`SUM(${channelMetrics.impressions})`,
      totalClicks: sql<number>`SUM(${channelMetrics.clicks})`,
      totalConversions: sql<number>`SUM(${channelMetrics.conversions})`,
      totalSpend: sql<string>`SUM(${channelMetrics.spend})`,
      totalRevenue: sql<string>`SUM(${channelMetrics.revenue})`,
    })
    .from(channelMetrics)
    .innerJoin(channels, eq(channelMetrics.channelId, channels.id))
    .where(
      and(
        gte(channelMetrics.date, startDate),
        lte(channelMetrics.date, endDate)
      )
    )
    .groupBy(channelMetrics.channelId, channels.name, channels.type);
}

// ============= Member Functions =============

export async function getAllMembers(filters?: { search?: string; status?: Member["status"]; membershipTier?: Member["membershipTier"]; }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(members);
  
  const conditions = [];
  if (filters?.search) {
    conditions.push(
      or(
        like(members.name, `%${filters.search}%`),
        like(members.email, `%${filters.search}%`)
      )
    );
  }
  if (filters?.status) {
    conditions.push(eq(members.status, filters.status));
  }
  if (filters?.membershipTier) {
    conditions.push(eq(members.membershipTier, filters.membershipTier));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query.orderBy(desc(members.joinDate));
}

export async function getMemberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return result[0];
}

export async function getMembersByStatus(status: Member["status"]) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(members).where(eq(members.status, status)).orderBy(desc(members.joinDate));
}

export async function getMembersByTier(tier: Member["membershipTier"]) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(members).where(eq(members.membershipTier, tier)).orderBy(desc(members.joinDate));
}

export async function createMember(member: InsertMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(members).values(member);
  return Number(result[0].insertId);
}

export async function updateMember(id: number, updates: Partial<InsertMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(members).set(updates).where(eq(members.id, id));
}

export async function getMemberStats() {
  const db = await getDb();
  if (!db) return null;
  
  const stats = await db
    .select({
      totalMembers: sql<number>`COUNT(*)`,
      activeMembers: sql<number>`SUM(CASE WHEN ${members.status} = 'active' THEN 1 ELSE 0 END)`,
      // Active paying members = All Access Aces + Swing Savers + Golf VX Pro + Family (all active tiers)
      activePayingMembers: sql<number>`SUM(CASE WHEN ${members.status} = 'active' AND ${members.membershipTier} IN ('all_access_aces', 'swing_savers', 'golf_vx_pro', 'family', 'monthly', 'annual', 'corporate') THEN 1 ELSE 0 END)`,
      allAccessCount: sql<number>`SUM(CASE WHEN ${members.membershipTier} = 'all_access_aces' AND ${members.status} = 'active' THEN 1 ELSE 0 END)`,
      swingSaversCount: sql<number>`SUM(CASE WHEN ${members.membershipTier} = 'swing_savers' AND ${members.status} = 'active' THEN 1 ELSE 0 END)`,
      golfVxProCount: sql<number>`SUM(CASE WHEN ${members.membershipTier} = 'golf_vx_pro' AND ${members.status} = 'active' THEN 1 ELSE 0 END)`,
      familyCount: sql<number>`SUM(CASE WHEN ${members.membershipTier} = 'family' AND ${members.status} = 'active' THEN 1 ELSE 0 END)`,
      totalLifetimeValue: sql<string>`SUM(${members.lifetimeValue})`,
      // Actual MRR from Boomerang payment data
      allAccessMRR: sql<string>`SUM(CASE WHEN ${members.membershipTier} = 'all_access_aces' AND ${members.status} = 'active' THEN COALESCE(${members.monthlyAmount}, 0) ELSE 0 END)`,
      swingSaversMRR: sql<string>`SUM(CASE WHEN ${members.membershipTier} = 'swing_savers' AND ${members.status} = 'active' THEN COALESCE(${members.monthlyAmount}, 0) ELSE 0 END)`,
      golfVxProMRR: sql<string>`SUM(CASE WHEN ${members.membershipTier} = 'golf_vx_pro' AND ${members.status} = 'active' THEN COALESCE(${members.monthlyAmount}, 0) ELSE 0 END)`,
    })
    .from(members);
  
  return stats[0];
}

// ============= Revenue Functions =============

export async function getRevenueByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(revenue)
    .where(
      and(
        gte(revenue.date, startDate),
        lte(revenue.date, endDate)
      )
    )
    .orderBy(revenue.date);
}

export async function getRevenueBySource(source: Revenue["source"], startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(revenue)
    .where(
      and(
        eq(revenue.source, source),
        gte(revenue.date, startDate),
        lte(revenue.date, endDate)
      )
    )
    .orderBy(revenue.date);
}

export async function createRevenue(revenueData: InsertRevenue) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(revenue).values(revenueData);
  return Number(result[0].insertId);
}

export async function getRevenueSummary(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return null;
  
  const summary = await db
    .select({
      source: revenue.source,
      totalRevenue: sql<string>`SUM(${revenue.amount})`,
      transactionCount: sql<number>`COUNT(*)`,
    })
    .from(revenue)
    .where(
      and(
        gte(revenue.date, startDate),
        lte(revenue.date, endDate)
      )
    )
    .groupBy(revenue.source);
  
  return summary;
}

export async function getTotalRevenue(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return "0";
  
  const result = await db
    .select({
      total: sql<string>`SUM(${revenue.amount})`,
    })
    .from(revenue)
    .where(
      and(
        gte(revenue.date, startDate),
        lte(revenue.date, endDate)
      )
    );
  
  return result[0]?.total || "0";
}

// ============= Task Functions =============

export async function getAllTasks() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tasks).orderBy(desc(tasks.dueDate));
}

export async function getTasksByCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tasks).where(eq(tasks.campaignId, campaignId)).orderBy(tasks.dueDate);
}

export async function getTasksByStatus(completed: boolean) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tasks).where(eq(tasks.completed, completed)).orderBy(tasks.dueDate);
}

export async function upsertTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(tasks).where(eq(tasks.asanaId, task.asanaId)).limit(1);
  
  if (existing.length > 0) {
    await db.update(tasks).set(task).where(eq(tasks.asanaId, task.asanaId));
    return existing[0].id;
  } else {
    const result = await db.insert(tasks).values(task);
    return Number(result[0].insertId);
  }
}

// ============= Report Functions =============

export async function getAllReports() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(reports).orderBy(desc(reports.createdAt));
}

export async function getReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result[0];
}

export async function createReport(report: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(reports).values(report);
  return Number(result[0].insertId);
}

// ============= Campaign Expense Functions =============

export async function getCampaignExpenses(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(campaignExpenses)
    .where(eq(campaignExpenses.campaignId, campaignId))
    .orderBy(desc(campaignExpenses.date));
}

export async function createCampaignExpense(expense: InsertCampaignExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(campaignExpenses).values(expense);
  return Number(result[0].insertId);
}

export async function updateCampaignExpense(id: number, expense: Partial<InsertCampaignExpense>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(campaignExpenses).set(expense).where(eq(campaignExpenses.id, id));
}

export async function deleteCampaignExpense(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(campaignExpenses).where(eq(campaignExpenses.id, id));
}

export async function getTotalCampaignExpenses(campaignId: number) {
  const db = await getDb();
  if (!db) return "0";
  
  const result = await db.select({
    total: sql<string>`COALESCE(SUM(${campaignExpenses.amount}), 0)`
  })
    .from(campaignExpenses)
    .where(eq(campaignExpenses.campaignId, campaignId));
  
  return result[0]?.total || "0";
}

// ============= Campaign Budget Functions =============

export async function updateCampaignBudget(
  campaignId: number,
  budget: string,
  metaAdsBudget?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { budget };
  if (metaAdsBudget !== undefined) {
    updateData.metaAdsBudget = metaAdsBudget;
  }
  
  await db.update(campaigns).set(updateData).where(eq(campaigns.id, campaignId));
}

export async function syncMetaAdsSpend(campaignId: number, metaAdsSpend: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get manual expenses total
  const manualExpenses = await getTotalCampaignExpenses(campaignId);
  
  // Calculate total actual spend (Meta Ads + manual expenses)
  const totalSpend = (parseFloat(metaAdsSpend) + parseFloat(manualExpenses)).toFixed(2);
  
  await db.update(campaigns).set({
    metaAdsSpend,
    actualSpend: totalSpend
  }).where(eq(campaigns.id, campaignId));
}

export async function linkMetaAdsCampaign(campaignId: number, metaAdsCampaignId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(campaigns).set({
    metaAdsCampaignId
  }).where(eq(campaigns.id, campaignId));
}

export async function deleteMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(members).where(eq(members.id, id));
}

export async function getMemberSegments() {
  const db = await getDb();
  if (!db) return null;
  
  const stats = await db
    .select({
      status: members.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(members)
    .groupBy(members.status);
  
  return {
    byStatus: stats,
    highValue: await db.select().from(members).where(gte(members.lifetimeValue, "1000")).orderBy(desc(members.lifetimeValue)).limit(10),
    atRisk: await db.select().from(members).where(and(eq(members.status, "active"), lte(members.lastVisitDate, sql`DATE_SUB(NOW(), INTERVAL 30 DAY)`))).limit(10),
  };
}

// ============= Strategic Campaigns Functions =============

export async function getStrategicCampaignsOverview() {
  const db = await getDb();
  if (!db) return [];
  
  // Get all programs with their strategic campaign mappings
  const programsWithCampaigns = await db
    .select({
      programId: campaigns.id,
      programName: campaigns.name,
      programStatus: campaigns.status,
      programBudget: campaigns.budget,
      programSpend: campaigns.actualSpend,
      programRevenue: campaigns.actualRevenue,
      strategicCampaign: programCampaigns.strategicCampaign,
    })
    .from(campaigns)
    .leftJoin(programCampaigns, eq(campaigns.id, programCampaigns.programId));
  
  // Define strategic campaigns
  const strategicCampaigns = [
    { 
      id: "trial_conversion", 
      name: "Trial Conversion", 
      description: "Converting prospects into paying members through trial sessions and clinics",
      color: "emerald"
    },
    { 
      id: "membership_acquisition", 
      name: "Membership Acquisition", 
      description: "Annual and monthly membership promotions and giveaways",
      color: "pink"
    },
    { 
      id: "member_retention", 
      name: "Member Retention", 
      description: "Drive days, tournaments, and community engagement events",
      color: "blue"
    },
    { 
      id: "corporate_events", 
      name: "B2B Sales", 
      description: "Corporate bookings and business-to-business partnerships",
      color: "amber"
    }
  ];
  
  return Promise.all(strategicCampaigns.map(async (campaign) => {
    // Filter programs that support this strategic campaign
    const supportingPrograms = programsWithCampaigns.filter(
      p => p.strategicCampaign === campaign.id
    );
    
    // Aggregate metrics (avoid double-counting programs with multiple campaign associations)
    const uniquePrograms = new Map();
    supportingPrograms.forEach(p => {
      if (!uniquePrograms.has(p.programId)) {
        uniquePrograms.set(p.programId, p);
      }
    });
    
    const programs = Array.from(uniquePrograms.values());
    
    const totalBudget = programs.reduce((sum, p) => sum + Number(p.programBudget || 0), 0);
    const totalSpend = programs.reduce((sum, p) => sum + Number(p.programSpend || 0), 0);
    const totalRevenue = programs.reduce((sum, p) => sum + Number(p.programRevenue || 0), 0);
    
    const activePrograms = programs.filter(p => p.programStatus === "active").length;
    const completedPrograms = programs.filter(p => p.programStatus === "completed").length;
    
    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    
    // Get landing page URL from the first supporting program (if any)
    const landingPageUrl = programs.length > 0 && programs[0].programId
      ? (await db.select({ landingPageUrl: campaigns.landingPageUrl })
          .from(campaigns)
          .where(eq(campaigns.id, programs[0].programId))
          .limit(1))[0]?.landingPageUrl
      : null;

    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      color: campaign.color,
      totalPrograms: programs.length,
      activePrograms,
      completedPrograms,
      totalBudget,
      totalSpend,
      totalRevenue,
      roi,
      landingPageUrl: landingPageUrl || null,
      programs: programs.map(p => ({
        id: p.programId,
        name: p.programName,
        status: p.programStatus,
        budget: Number(p.programBudget || 0),
        spend: Number(p.programSpend || 0),
        revenue: Number(p.programRevenue || 0),
      })),
    };
  }));
}

export async function getProgramCampaigns(programId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(programCampaigns)
    .where(eq(programCampaigns.programId, programId));
}

export async function setProgramCampaigns(programId: number, strategicCampaigns: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete existing mappings
  await db.delete(programCampaigns).where(eq(programCampaigns.programId, programId));
  
  // Insert new mappings
  if (strategicCampaigns.length > 0) {
    await db.insert(programCampaigns).values(
      strategicCampaigns.map(sc => ({
        programId,
        strategicCampaign: sc as ProgramCampaign["strategicCampaign"],
      }))
    );
  }
}

// ============= Landing Pages Functions =============

export async function getLandingPageBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  
  const pages = await db
    .select()
    .from(landingPages)
    .where(eq(landingPages.slug, slug))
    .limit(1);
  
  return pages[0] || null;
}

export async function trackPageEvent(event: {
  pageId: number;
  sessionId: string;
  eventType: string;
  eventData?: any;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  const db = await getDb();
  if (!db) return;
  
  const { landingPages, pageAnalytics } = await import("../drizzle/schema");
  
  await db.insert(pageAnalytics).values({
    pageId: event.pageId,
    sessionId: event.sessionId,
    visitorId: event.sessionId, // Use session ID as visitor ID for now
    eventType: event.eventType as any,
    eventData: event.eventData,
    referrer: event.referrer,
    userAgent: event.userAgent,
    ipAddress: event.ipAddress,
  });
}

export async function getPageAnalytics(pageId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db
    .select()
    .from(pageAnalytics)
    .where(eq(pageAnalytics.pageId, pageId));
  
  // Add date filters if provided
  // TODO: Add date range filtering
  
  return await query;
}

// ============= Anniversary Giveaway Entry Functions =============

export async function createGiveawayEntry(data: {
  firstName?: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(anniversaryGiveawayEntries).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateGiveawayEntry(data: {
  email: string;
  fullName?: string;
  ageRange?: string;
  gender?: string;
  city?: string;
  isIllinoisResident?: boolean;
  golfExperience?: string;
  hasVisitedBefore?: string;
  firstVisitMethod?: string;
  firstVisitTime?: string;
  visitFrequency?: string;
  whatStoodOut?: string;
  simulatorFamiliarity?: string;
  interests?: string;
  visitPurpose?: string;
  passionStory?: string;
  communityGrowth?: string;
  stayConnected?: string;
  socialMediaHandle?: string;
  communityGroups?: string;
  phoneNumber?: string;
  bestTimeToCall?: string;
  hearAbout?: string;
  hearAboutOther?: string;
  consentToContact?: boolean;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Find existing entry by email
  const [existing] = await db
    .select()
    .from(anniversaryGiveawayEntries)
    .where(eq(anniversaryGiveawayEntries.email, data.email))
    .limit(1);

  if (existing) {
    // Update existing entry
    await db
      .update(anniversaryGiveawayEntries)
      .set(data)
      .where(eq(anniversaryGiveawayEntries.id, existing.id));
    return { ...existing, ...data };
  } else {
    // Create new entry
    const result = await db.insert(anniversaryGiveawayEntries).values(data);
    return { id: Number(result[0].insertId), ...data };
  }
}

export async function getAllGiveawayEntries() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(anniversaryGiveawayEntries)
    .orderBy(desc(anniversaryGiveawayEntries.submittedAt));
}

export async function getGiveawayEntryByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const [entry] = await db
    .select()
    .from(anniversaryGiveawayEntries)
    .where(eq(anniversaryGiveawayEntries.email, email))
    .limit(1);
  return entry;
}


// ---------------------------------------------------------------------------
// Membership Event History DB helpers
// ---------------------------------------------------------------------------

/**
 * Log a membership lifecycle event.
 * Returns the inserted row ID.
 */
export async function logMembershipEvent(event: {
  email: string;
  memberId?: number;
  name?: string;
  eventType: "joined" | "cancelled" | "upgraded" | "downgraded" | "paused" | "resumed" | "tier_changed" | "payment_failed" | "payment_recovered" | "renewed";
  tier?: "all_access_aces" | "swing_savers" | "golf_vx_pro" | "trial" | "none";
  plan?: "monthly" | "annual";
  amount?: string;
  previousTier?: "all_access_aces" | "swing_savers" | "golf_vx_pro" | "trial" | "none";
  previousPlan?: "monthly" | "annual";
  previousAmount?: string;
  eventTimestamp: Date;
  source?: "make_com" | "manual" | "backfill" | "api";
  webhookPayload?: Record<string, any>;
  enchargeTagged?: boolean;
  enchargeTaggedAt?: Date;
  notes?: string;
}): Promise<number | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(membershipEvents).values({
    email: event.email.toLowerCase().trim(),
    memberId: event.memberId,
    name: event.name,
    eventType: event.eventType,
    tier: event.tier,
    plan: event.plan,
    amount: event.amount,
    previousTier: event.previousTier,
    previousPlan: event.previousPlan,
    previousAmount: event.previousAmount,
    eventTimestamp: event.eventTimestamp,
    processedAt: new Date(),
    source: event.source ?? "make_com",
    webhookPayload: event.webhookPayload,
    enchargeTagged: event.enchargeTagged ?? false,
    enchargeTaggedAt: event.enchargeTaggedAt,
    notes: event.notes,
  });

  return (result as any).insertId;
}

/**
 * Return full event history for a member by their DB id.
 */
export async function getMemberHistory(memberId: number): Promise<MembershipEvent[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(membershipEvents)
    .where(eq(membershipEvents.memberId, memberId))
    .orderBy(desc(membershipEvents.eventTimestamp));
}

/**
 * Return full event history for a member by email.
 */
export async function getMemberHistoryByEmail(email: string): Promise<MembershipEvent[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(membershipEvents)
    .where(eq(membershipEvents.email, email.toLowerCase().trim()))
    .orderBy(desc(membershipEvents.eventTimestamp));
}

/**
 * Return all members whose most recent event is a cancellation.
 */
export async function getChurnedMembers(): Promise<Array<{
  email: string;
  name: string | null;
  tier: string | null;
  plan: string | null;
  cancelledAt: Date;
  daysSinceCancellation: number;
}>> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.execute(sql`
    SELECT
      e.email,
      e.name,
      e.tier,
      e.plan,
      e.event_timestamp AS cancelledAt,
      DATEDIFF(NOW(), e.event_timestamp) AS daysSinceCancellation
    FROM membership_events e
    INNER JOIN (
      SELECT email, MAX(event_timestamp) AS latest
      FROM membership_events
      GROUP BY email
    ) latest_events ON e.email = latest_events.email AND e.event_timestamp = latest_events.latest
    WHERE e.event_type = 'cancelled'
    ORDER BY e.event_timestamp DESC
  `);

  return ((rows[0] as unknown) as any[]).map((r: any) => ({
    email: r.email,
    name: r.name,
    tier: r.tier,
    plan: r.plan,
    cancelledAt: new Date(r.cancelledAt),
    daysSinceCancellation: Number(r.daysSinceCancellation),
  }));
}

/**
 * Return members who cancelled within the last N days — prime win-back targets.
 */
export async function getWinbackOpportunities(withinDays = 90): Promise<Array<{
  email: string;
  name: string | null;
  tier: string | null;
  plan: string | null;
  cancelledAt: Date;
  daysSinceCancellation: number;
}>> {
  const all = await getChurnedMembers();
  return all.filter(m => m.daysSinceCancellation <= withinDays);
}

/**
 * Return a summary count of events by type over the last N days.
 */
export async function getMembershipEventSummary(days = 30): Promise<Array<{
  eventType: string;
  count: number;
}>> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.execute(sql`
    SELECT event_type AS eventType, COUNT(*) AS count
    FROM membership_events
    WHERE event_timestamp >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
    GROUP BY event_type
    ORDER BY count DESC
  `);

  return ((rows[0] as unknown) as any[]).map((r: any) => ({
    eventType: r.eventType,
    count: Number(r.count),
  }));
}

/**
 * Find a member record by email and return their ID (for webhook linkage).
 */
export async function getMemberIdByEmail(email: string): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  const [row] = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.email, email.toLowerCase()))
    .limit(1);

  return row?.id ?? null;
}


// ─── ClickFunnels DB Helpers ──────────────────────────────────────────────

export async function getCfFunnels(includeArchived = false) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(cfFunnels);
  if (!includeArchived) {
    return await query.where(eq(cfFunnels.archived, false)).orderBy(desc(cfFunnels.optInCount));
  }
  return await query.orderBy(desc(cfFunnels.optInCount));
}

export async function getCfSubmissions(funnelId?: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  if (funnelId) {
    return await db
      .select()
      .from(cfFormSubmissions)
      .where(eq(cfFormSubmissions.funnelId, funnelId))
      .orderBy(desc(cfFormSubmissions.submittedAt))
      .limit(limit);
  }
  return await db
    .select()
    .from(cfFormSubmissions)
    .orderBy(desc(cfFormSubmissions.submittedAt))
    .limit(limit);
}

export async function getCfFunnelSummary() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`
    SELECT
      f.cf_id AS funnelId,
      f.name AS funnelName,
      f.archived,
      f.opt_in_count AS optInCount,
      COALESCE(f.unique_visitors, 0) AS uniqueVisitors,
      COALESCE(f.page_views, 0) AS pageViews,
      f.last_synced_at AS lastSyncedAt,
      COUNT(DISTINCT s.id) AS submissionCount,
      MAX(s.submitted_at) AS lastSubmission
    FROM cf_funnels f
    LEFT JOIN cf_form_submissions s ON s.funnel_id = f.cf_id
    WHERE f.archived = 0
    GROUP BY f.cf_id, f.name, f.archived, f.opt_in_count, f.unique_visitors, f.page_views, f.last_synced_at
    ORDER BY submissionCount DESC
  `);
  return rows[0] as unknown as Array<{
    funnelId: number;
    funnelName: string;
    archived: boolean;
    optInCount: number;
    uniqueVisitors: number;
    pageViews: number;
    lastSyncedAt: Date;
    submissionCount: number;
    lastSubmission: Date | null;
  }>;
}

export async function updateFunnelUvPv(cfId: number, uniqueVisitors: number, pageViews: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(cfFunnels)
    .set({ uniqueVisitors, pageViews })
    .where(eq(cfFunnels.cfId, cfId));
  return { success: true };
}
