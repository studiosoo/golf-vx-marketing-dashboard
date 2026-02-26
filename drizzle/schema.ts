import { bigint, int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index, json, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Marketing campaigns table
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "trial_conversion",
    "membership_acquisition",
    "member_retention",
    "corporate_events"
  ]).notNull(),
  type: mysqlEnum("type", [
    "trial_conversion",
    "membership_acquisition",
    "corporate_events",
    "member_retention",
    "pbga_programs",
    "event_specific"
  ]).notNull(),
  status: mysqlEnum("status", ["planned", "active", "completed", "paused"]).default("planned").notNull(),
  description: text("description"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }).notNull(),
  actualSpend: decimal("actualSpend", { precision: 10, scale: 2 }).default("0").notNull(),
  targetRevenue: decimal("targetRevenue", { precision: 10, scale: 2 }),
  actualRevenue: decimal("actualRevenue", { precision: 10, scale: 2 }).default("0").notNull(),
  targetApplications: int("targetApplications"),
  actualApplications: int("actualApplications").default(0).notNull(),
  targetConversions: int("targetConversions"),
  actualConversions: int("actualConversions").default(0).notNull(),
  metaAdsCampaignId: varchar("metaAdsCampaignId", { length: 64 }),
  metaAdsBudget: decimal("metaAdsBudget", { precision: 10, scale: 2 }),
  metaAdsSpend: decimal("metaAdsSpend", { precision: 10, scale: 2 }).default("0"),
  asanaProjectId: varchar("asanaProjectId", { length: 64 }),
  asanaTaskId: varchar("asanaTaskId", { length: 64 }),
  asanaSectionId: varchar("asanaSectionId", { length: 64 }),
  landingPageUrl: text("landingPageUrl"),
  posterImageUrl: text("posterImageUrl"),
  reelThumbnailUrl: text("reelThumbnailUrl"),
  additionalVisuals: json("additionalVisuals").$type<string[]>(),
  // Goal & KPI System
  goalType: mysqlEnum("goalType", [
    "revenue",
    "followers",
    "leads",
    "attendance",
    "retention"
  ]),
  goalTarget: decimal("goalTarget", { precision: 12, scale: 2 }),
  goalActual: decimal("goalActual", { precision: 12, scale: 2 }).default("0"),
  goalUnit: varchar("goalUnit", { length: 50 }), // e.g., "followers", "signups", "USD", "%"
  primaryKpi: varchar("primaryKpi", { length: 100 }), // e.g., "Cost per Follower", "Conversion Rate", "ROAS"
  kpiTarget: decimal("kpiTarget", { precision: 12, scale: 4 }),
  kpiActual: decimal("kpiActual", { precision: 12, scale: 4 }),
  kpiUnit: varchar("kpiUnit", { length: 50 }), // e.g., "USD", "%", "ratio"
  performanceScore: int("performanceScore"), // 0-100 score based on goal achievement
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  typeIdx: index("type_idx").on(table.type),
  dateIdx: index("date_idx").on(table.startDate, table.endDate),
}));

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Junction table for program-to-campaign mapping (many-to-many)
 * A program (campaign row) can support multiple strategic campaigns
 */
export const programCampaigns = mysqlTable("program_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("programId").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  strategicCampaign: mysqlEnum("strategicCampaign", [
    "trial_conversion",
    "membership_acquisition",
    "member_retention",
    "corporate_events"
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  programIdx: index("program_idx").on(table.programId),
  campaignIdx: index("campaign_idx").on(table.strategicCampaign),
  uniquePair: index("unique_program_campaign").on(table.programId, table.strategicCampaign),
}));

export type ProgramCampaign = typeof programCampaigns.$inferSelect;
export type InsertProgramCampaign = typeof programCampaigns.$inferInsert;

/**
 * Campaign metrics snapshots for historical tracking
 */
export const campaignMetrics = mysqlTable("campaign_metrics", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").references(() => campaigns.id, { onDelete: "cascade" }),
  snapshotDate: timestamp("snapshotDate").notNull(),
  spend: decimal("spend", { precision: 10, scale: 2 }).default("0").notNull(),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  conversions: int("conversions").default(0).notNull(),
  leads: int("leads").default(0).notNull(),
  impressions: int("impressions").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  goalCurrent: int("goalCurrent").default(0).notNull(),
  goalTarget: int("goalTarget").default(0).notNull(),
  roi: decimal("roi", { precision: 10, scale: 2 }).default("0").notNull(),
  roas: decimal("roas", { precision: 10, scale: 2 }).default("0").notNull(),
  ctr: decimal("ctr", { precision: 10, scale: 4 }).default("0").notNull(),
  cpc: decimal("cpc", { precision: 10, scale: 2 }).default("0").notNull(),
  cpl: decimal("cpl", { precision: 10, scale: 2 }).default("0").notNull(),
  conversionRate: decimal("conversionRate", { precision: 10, scale: 4 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  campaignIdx: index("campaign_idx").on(table.campaignId),
  dateIdx: index("date_idx").on(table.snapshotDate),
}));

export type CampaignMetric = typeof campaignMetrics.$inferSelect;
export type InsertCampaignMetric = typeof campaignMetrics.$inferInsert;

/**
 * Marketing channels table
 */
export const channels = mysqlTable("channels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  type: mysqlEnum("type", ["meta_ads", "email", "social_organic", "referral", "direct", "other"]).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = typeof channels.$inferInsert;

/**
 * Channel performance metrics table
 */
export const channelMetrics = mysqlTable("channelMetrics", {
  id: int("id").autoincrement().primaryKey(),
  channelId: int("channelId").notNull().references(() => channels.id, { onDelete: "cascade" }),
  campaignId: int("campaignId").references(() => campaigns.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  impressions: int("impressions").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  conversions: int("conversions").default(0).notNull(),
  spend: decimal("spend", { precision: 10, scale: 2 }).default("0").notNull(),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelIdx: index("channel_idx").on(table.channelId),
  campaignIdx: index("campaign_idx").on(table.campaignId),
  dateIdx: index("date_idx").on(table.date),
}));

export type ChannelMetric = typeof channelMetrics.$inferSelect;
export type InsertChannelMetric = typeof channelMetrics.$inferInsert;

/**
 * Members table
 */
export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  membershipTier: mysqlEnum("membershipTier", ["trial", "monthly", "annual", "corporate", "none", "all_access_aces", "swing_savers", "golf_vx_pro"]).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "cancelled", "trial"]).default("active").notNull(),
  joinDate: timestamp("joinDate").notNull(),
  renewalDate: timestamp("renewalDate"),
  cancellationDate: timestamp("cancellationDate"),
  lastVisitDate: timestamp("lastVisitDate"),
  acquisitionSource: varchar("acquisitionSource", { length: 100 }),
  campaignId: int("campaignId").references(() => campaigns.id, { onDelete: "set null" }),
  lifetimeValue: decimal("lifetimeValue", { precision: 10, scale: 2 }).default("0").notNull(),
  totalVisits: int("totalVisits").default(0).notNull(),
  referralCode: varchar("referralCode", { length: 50 }),
  referredBy: int("referredBy"),
  notes: text("notes"),
  tags: json("tags").$type<string[]>(),
  
  // Boomerangme integration fields
  boomerangCustomerId: varchar("boomerangCustomerId", { length: 100 }),
  loyaltyPoints: int("loyaltyPoints").default(0).notNull(),
  loyaltyCardStatus: mysqlEnum("loyaltyCardStatus", ["active", "inactive", "none"]).default("none"),
  lastLoyaltySync: timestamp("lastLoyaltySync"),
  
  // Encharge integration fields
  enchargeUserId: varchar("enchargeUserId", { length: 100 }),
  emailEngagementScore: int("emailEngagementScore").default(0).notNull(),
  lastEmailOpen: timestamp("lastEmailOpen"),
  lastEmailClick: timestamp("lastEmailClick"),
  lastEnchargeSync: timestamp("lastEnchargeSync"),
  
  // Email subscription tracking
  emailSubscribed: boolean("emailSubscribed").default(false).notNull(),
  emailSubscribedAt: timestamp("emailSubscribedAt"),
  emailUnsubscribedAt: timestamp("emailUnsubscribedAt"),
  customerStatus: mysqlEnum("customerStatus", ["lead", "trial", "active", "churned"]).default("lead").notNull(),
  
  // Stripe integration fields
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  // Toast POS integration fields
  toastCustomerId: varchar("toastCustomerId", { length: 100 }),
  totalPurchases: decimal("totalPurchases", { precision: 10, scale: 2 }).default("0").notNull(),
  lastPurchaseDate: timestamp("lastPurchaseDate"),
  lastToastSync: timestamp("lastToastSync"),
  
  // Acuity integration fields
  acuityClientId: varchar("acuityClientId", { length: 100 }),
  totalLessons: int("totalLessons").default(0).notNull(),
  lastLessonDate: timestamp("lastLessonDate"),
  nextLessonDate: timestamp("nextLessonDate"),
  lastAcuitySync: timestamp("lastAcuitySync"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  tierIdx: index("tier_idx").on(table.membershipTier),
  statusIdx: index("status_idx").on(table.status),
  campaignIdx: index("campaign_idx").on(table.campaignId),
  boomerangIdx: index("boomerang_idx").on(table.boomerangCustomerId),
  enchargeIdx: index("encharge_idx").on(table.enchargeUserId),
  toastIdx: index("toast_idx").on(table.toastCustomerId),
  acuityIdx: index("acuity_idx").on(table.acuityClientId),
}));

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

/**
 * Member appointments table - tracks Acuity booking history
 */
export const memberAppointments = mysqlTable("memberAppointments", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull().references(() => members.id, { onDelete: "cascade" }),
  campaignId: int("campaignId").references(() => campaigns.id, { onDelete: "set null" }),
  
  // Acuity appointment data
  acuityAppointmentId: int("acuityAppointmentId").notNull().unique(),
  appointmentType: varchar("appointmentType", { length: 255 }).notNull(),
  appointmentTypeId: int("appointmentTypeId").notNull(),
  category: varchar("category", { length: 100 }),
  
  // Appointment details
  appointmentDate: timestamp("appointmentDate").notNull(),
  dateCreated: timestamp("dateCreated").notNull(),
  duration: int("duration").notNull(), // in minutes
  
  // Pricing
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).default("0").notNull(),
  paid: boolean("paid").default(false).notNull(),
  
  // Status
  canceled: boolean("canceled").default(false).notNull(),
  completed: boolean("completed").default(false).notNull(),
  
  // Additional info
  notes: text("notes"),
  location: varchar("location", { length: 255 }),
  calendar: varchar("calendar", { length: 100 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  memberIdx: index("member_idx").on(table.memberId),
  campaignIdx: index("campaign_idx").on(table.campaignId),
  appointmentDateIdx: index("appointment_date_idx").on(table.appointmentDate),
  acuityIdx: index("acuity_idx").on(table.acuityAppointmentId),
  typeIdx: index("type_idx").on(table.appointmentTypeId),
}));

export type MemberAppointment = typeof memberAppointments.$inferSelect;
export type InsertMemberAppointment = typeof memberAppointments.$inferInsert;

/**
 * Revenue transactions table
 */
export const revenue = mysqlTable("revenue", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  source: mysqlEnum("source", [
    "membership",
    "bay_rental",
    "food_beverage",
    "event",
    "league",
    "coaching",
    "merchandise",
    "other"
  ]).notNull(),
  memberId: int("memberId").references(() => members.id, { onDelete: "set null" }),
  campaignId: int("campaignId").references(() => campaigns.id, { onDelete: "set null" }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  dateIdx: index("date_idx").on(table.date),
  sourceIdx: index("source_idx").on(table.source),
  memberIdx: index("member_idx").on(table.memberId),
  campaignIdx: index("campaign_idx").on(table.campaignId),
}));

export type Revenue = typeof revenue.$inferSelect;
export type InsertRevenue = typeof revenue.$inferInsert;

/**
 * Asana tasks table (synced from Asana API)
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  asanaId: varchar("asanaId", { length: 64 }).notNull().unique(),
  campaignId: int("campaignId").references(() => campaigns.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  assignee: varchar("assignee", { length: 255 }),
  dueDate: timestamp("dueDate"),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  asanaProjectId: varchar("asanaProjectId", { length: 64 }),
  asanaProjectName: varchar("asanaProjectName", { length: 255 }),
  lastSyncedAt: timestamp("lastSyncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  asanaIdIdx: index("asana_id_idx").on(table.asanaId),
  campaignIdx: index("campaign_idx").on(table.campaignId),
  completedIdx: index("completed_idx").on(table.completed),
  dueDateIdx: index("due_date_idx").on(table.dueDate),
}));

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Reports table for storing generated reports
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "campaign_performance",
    "monthly_summary",
    "roi_analysis",
    "member_acquisition",
    "channel_performance",
    "executive_summary"
  ]).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  data: text("data").notNull(), // JSON string of report data
  generatedBy: int("generatedBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("type_idx").on(table.type),
  dateIdx: index("date_idx").on(table.startDate, table.endDate),
}));

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Campaign expenses table for manual expense tracking
 */
export const campaignExpenses = mysqlTable("campaignExpenses", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  category: mysqlEnum("category", [
    "meta_ads",
    "venue_rental",
    "food_beverage",
    "promotional_materials",
    "staff_costs",
    "equipment",
    "other"
  ]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  campaignIdx: index("campaign_idx").on(table.campaignId),
  dateIdx: index("date_idx").on(table.date),
  categoryIdx: index("category_idx").on(table.category),
}));

export type CampaignExpense = typeof campaignExpenses.$inferSelect;
export type InsertCampaignExpense = typeof campaignExpenses.$inferInsert;

/**
 * Member transactions table - tracks Toast POS purchase history
 */
export const memberTransactions = mysqlTable("memberTransactions", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull().references(() => members.id, { onDelete: "cascade" }),
  campaignId: int("campaignId").references(() => campaigns.id, { onDelete: "set null" }),
  
  // Toast POS data
  toastOrderGuid: varchar("toastOrderGuid", { length: 100 }).notNull().unique(),
  toastCheckNumber: varchar("toastCheckNumber", { length: 50 }),
  
  // Transaction details
  transactionDate: timestamp("transactionDate").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0").notNull(),
  tip: decimal("tip", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  
  // Payment info
  paymentMethod: varchar("paymentMethod", { length: 50 }), // credit_card, cash, etc.
  paymentStatus: mysqlEnum("paymentStatus", ["paid", "pending", "refunded", "voided"]).default("paid").notNull(),
  
  // Order details
  items: text("items"), // JSON array of items purchased
  itemCount: int("itemCount").default(0).notNull(),
  category: varchar("category", { length: 100 }), // food_beverage, merchandise, etc.
  
  // Venue info
  venue: varchar("venue", { length: 100 }).default("Arlington Heights").notNull(),
  server: varchar("server", { length: 100 }),
  
  // Metadata
  notes: text("notes"),
  lastSyncedAt: timestamp("lastSyncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  memberIdx: index("member_idx").on(table.memberId),
  campaignIdx: index("campaign_idx").on(table.campaignId),
  transactionDateIdx: index("transaction_date_idx").on(table.transactionDate),
  toastOrderGuidIdx: index("toast_order_guid_idx").on(table.toastOrderGuid),
}));

export type MemberTransaction = typeof memberTransactions.$inferSelect;
export type InsertMemberTransaction = typeof memberTransactions.$inferInsert;

/**
 * Giveaway applications table - tracks Annual Giveaway form submissions
 */
export const giveawayApplications = mysqlTable("giveawayApplications", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").references(() => members.id, { onDelete: "set null" }),
  campaignId: int("campaignId").references(() => campaigns.id, { onDelete: "set null" }),
  
  // Basic information
  submissionTimestamp: timestamp("submissionTimestamp").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  ageRange: varchar("ageRange", { length: 50 }), // Under 25, 25-34, 35-44, 45-54, 55+
  gender: varchar("gender", { length: 50 }),
  city: varchar("city", { length: 100 }),
  illinoisResident: boolean("illinoisResident").default(false),
  
  // Golf background
  golfExperienceLevel: varchar("golfExperienceLevel", { length: 100 }), // New/Beginner, Intermediate, Advanced
  visitedBefore: varchar("visitedBefore", { length: 50 }), // Yes/No/New
  indoorGolfFamiliarity: varchar("indoorGolfFamiliarity", { length: 100 }), // Never tried before, Tried once or twice, Regular player
  
  // Final details
  bestTimeToCall: varchar("bestTimeToCall", { length: 100 }),
  howDidTheyHear: text("howDidTheyHear"), // Attribution source
  
  // Status tracking
  status: mysqlEnum("status", ["pending", "contacted", "scheduled", "completed", "declined"]).default("pending").notNull(),
  contactedAt: timestamp("contactedAt"),
  scheduledAt: timestamp("scheduledAt"),
  completedAt: timestamp("completedAt"),
  
  // Metadata
  isTestEntry: boolean("isTestEntry").default(false).notNull(),
  notes: text("notes"),
  googleSheetRowId: int("googleSheetRowId"), // Track which row in Google Sheets
  lastSyncedAt: timestamp("lastSyncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  memberIdx: index("member_idx").on(table.memberId),
  campaignIdx: index("campaign_idx").on(table.campaignId),
  emailIdx: index("email_idx").on(table.email),
  submissionTimestampIdx: index("submission_timestamp_idx").on(table.submissionTimestamp),
  statusIdx: index("status_idx").on(table.status),
}));

export type GiveawayApplication = typeof giveawayApplications.$inferSelect;
export type InsertGiveawayApplication = typeof giveawayApplications.$inferInsert;

/**
 * AI Recommendations table - stores AI-generated marketing suggestions
 */
export const aiRecommendations = mysqlTable("aiRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", [
    "performance_alert",
    "opportunity",
    "campaign_idea",
    "seasonal_timing",
    "competitive_intel",
    "budget_reallocation",
    "creative_refresh",
    "audience_expansion"
  ]).notNull(),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  confidenceScore: int("confidenceScore").notNull(), // 0-100
  status: mysqlEnum("status", ["pending", "approved", "rejected", "executed", "expired"]).default("pending").notNull(),
  data: json("data").notNull(), // Full recommendation details (JSON)
  userFeedback: text("userFeedback"), // Why user approved/rejected
  outcomeMetrics: json("outcomeMetrics"), // Actual results after execution
  expiresAt: timestamp("expiresAt"), // When recommendation becomes stale
  executedAt: timestamp("executedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  typeIdx: index("type_idx").on(table.type),
  statusIdx: index("status_idx").on(table.status),
  priorityIdx: index("priority_idx").on(table.priority),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type AIRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAIRecommendation = typeof aiRecommendations.$inferInsert;

/**
 * Campaign Ideas Library - AI-generated campaign concepts
 */
export const campaignIdeas = mysqlTable("campaignIdeas", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  objective: text("objective").notNull(),
  targetAudience: varchar("targetAudience", { length: 255 }).notNull(), // Persona from market research
  channels: json("channels").$type<string[]>().notNull(), // Array of channel names
  budgetMin: decimal("budgetMin", { precision: 10, scale: 2 }).notNull(),
  budgetMax: decimal("budgetMax", { precision: 10, scale: 2 }).notNull(),
  timeline: varchar("timeline", { length: 100 }).notNull(),
  keyMessages: json("keyMessages").$type<string[]>().notNull(),
  creativeConcepts: json("creativeConcepts").$type<string[]>().notNull(),
  successMetrics: json("successMetrics").notNull(), // Array of {metric, target}
  implementationSteps: json("implementationSteps").notNull(), // Array of {step, owner, deadline}
  confidenceScore: int("confidenceScore").notNull(), // 0-100
  rationale: text("rationale").notNull(), // Why AI thinks this will work
  status: mysqlEnum("status", ["suggested", "in_progress", "completed", "archived"]).default("suggested").notNull(),
  actualResults: json("actualResults"), // Populated after campaign runs
  linkedCampaignId: int("linkedCampaignId").references(() => campaigns.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  audienceIdx: index("audience_idx").on(table.targetAudience),
  confidenceIdx: index("confidence_idx").on(table.confidenceScore),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type CampaignIdea = typeof campaignIdeas.$inferSelect;
export type InsertCampaignIdea = typeof campaignIdeas.$inferInsert;

/**
 * User Actions Log - tracks user decisions for AI learning
 */
export const userActions = mysqlTable("userActions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  recommendationId: int("recommendationId").references(() => aiRecommendations.id, { onDelete: "cascade" }),
  campaignIdeaId: int("campaignIdeaId").references(() => campaignIdeas.id, { onDelete: "cascade" }),
  action: mysqlEnum("action", ["approved", "rejected", "modified", "ignored", "executed"]).notNull(),
  modificationDetails: text("modificationDetails"), // What user changed
  outcome: varchar("outcome", { length: 255 }), // Did it work? (success, failure, pending)
  outcomeData: json("outcomeData"), // Detailed outcome metrics
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  recommendationIdx: index("recommendation_idx").on(table.recommendationId),
  campaignIdeaIdx: index("campaign_idea_idx").on(table.campaignIdeaId),
  actionIdx: index("action_idx").on(table.action),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
}));

export type UserAction = typeof userActions.$inferSelect;
export type InsertUserAction = typeof userActions.$inferInsert;

/**
 * Daily action plans generated by AI for campaigns
 */
export const dailyActionPlans = mysqlTable("daily_action_plans", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: varchar("campaignId", { length: 255 }).notNull(), // "annual-giveaway-2026"
  date: timestamp("date").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  aiAnalysis: text("aiAnalysis").notNull(), // Full AI analysis text
  totalActions: int("totalActions").notNull(),
  completedActions: int("completedActions").default(0).notNull(),
}, (table) => ({
  campaignDateIdx: index("campaign_date_idx").on(table.campaignId, table.date),
}));

export type DailyActionPlan = typeof dailyActionPlans.$inferSelect;
export type InsertDailyActionPlan = typeof dailyActionPlans.$inferInsert;

/**
 * Individual actions within a daily plan
 */
export const campaignActions = mysqlTable("campaign_actions", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull().references(() => dailyActionPlans.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["meta_ads", "content", "boost", "email", "conversion"]).notNull(),
  priority: mysqlEnum("priority", ["urgent", "high", "medium", "low"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  expectedImpact: varchar("expectedImpact", { length: 255 }), // "5-10 conversions", "500+ reach"
  effortRequired: varchar("effortRequired", { length: 50 }), // "5min", "30min", "2hours"
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "skipped"]).default("pending").notNull(),
  executionData: json("executionData"), // Action-specific data for one-click execution
  completedAt: timestamp("completedAt"),
  result: text("result"), // User feedback on outcome
}, (table) => ({
  planIdx: index("plan_idx").on(table.planId),
  statusIdx: index("status_idx").on(table.status),
  priorityIdx: index("priority_idx").on(table.priority),
}));

export type CampaignAction = typeof campaignActions.$inferSelect;
export type InsertCampaignAction = typeof campaignActions.$inferInsert;

/**
 * Content queue for Instagram posts
 */
export const contentQueue = mysqlTable("content_queue", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: varchar("campaignId", { length: 255 }).notNull(),
  contentType: mysqlEnum("contentType", ["feed_post", "story", "reel", "carousel"]).notNull(),
  caption: text("caption").notNull(),
  hashtags: varchar("hashtags", { length: 500 }).notNull(),
  imagePrompt: text("imagePrompt"), // For AI image generation
  imageUrl: varchar("imageUrl", { length: 500 }),
  scheduledFor: timestamp("scheduledFor"),
  posted: boolean("posted").default(false).notNull(),
  postedAt: timestamp("postedAt"),
  instagramPostId: varchar("instagramPostId", { length: 255 }),
  performanceMetrics: json("performanceMetrics"),
}, (table) => ({
  campaignIdx: index("campaign_idx").on(table.campaignId),
  scheduledIdx: index("scheduled_idx").on(table.scheduledFor),
  postedIdx: index("posted_idx").on(table.posted),
}));

export type ContentQueue = typeof contentQueue.$inferSelect;
export type InsertContentQueue = typeof contentQueue.$inferInsert;

/**
 * Boost schedule and tracking
 */
export const boostSchedule = mysqlTable("boost_schedule", {
  id: int("id").autoincrement().primaryKey(),
  postId: varchar("postId", { length: 255 }), // Instagram post ID
  postUrl: varchar("postUrl", { length: 500 }),
  budget: decimal("budget", { precision: 10, scale: 2 }).notNull(),
  duration: int("duration").notNull(), // hours
  targetAudience: json("targetAudience"),
  status: mysqlEnum("status", ["pending", "active", "completed", "failed"]).default("pending").notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  results: json("results"),
}, (table) => ({
  postIdx: index("post_idx").on(table.postId),
  statusIdx: index("status_idx").on(table.status),
}));

export type BoostSchedule = typeof boostSchedule.$inferSelect;
export type InsertBoostSchedule = typeof boostSchedule.$inferInsert;

/**
 * Performance alerts for Meta Ads campaigns
 */
export const campaignAlerts = mysqlTable("campaign_alerts", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: varchar("campaignId", { length: 64 }).notNull(), // Meta Ads campaign ID
  campaignName: varchar("campaignName", { length: 255 }).notNull(),
  alertType: mysqlEnum("alertType", [
    "low_ctr",           // CTR below threshold
    "high_cpc",          // CPC above threshold
    "budget_exceeded",   // Daily spend exceeds budget
    "low_conversions",   // Conversion rate below threshold
    "high_frequency"     // Ad frequency too high
  ]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  message: text("message").notNull(),
  threshold: decimal("threshold", { precision: 10, scale: 4 }), // The threshold value that was violated
  actualValue: decimal("actualValue", { precision: 10, scale: 4 }), // The actual value that triggered the alert
  status: mysqlEnum("status", ["active", "acknowledged", "resolved"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
  resolvedAt: timestamp("resolvedAt"),
  notes: text("notes"),
}, (table) => ({
  campaignIdx: index("campaign_idx").on(table.campaignId),
  statusIdx: index("status_idx").on(table.status),
  severityIdx: index("severity_idx").on(table.severity),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type CampaignAlert = typeof campaignAlerts.$inferSelect;
export type InsertCampaignAlert = typeof campaignAlerts.$inferInsert;

/**
 * Landing pages for public-facing website
 */
export const landingPages = mysqlTable("landing_pages", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), // URL slug (e.g., "trial-session")
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  heroImage: varchar("heroImage", { length: 500 }),
  content: json("content").notNull(), // Structured content blocks
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  acuityCalendarId: varchar("acuityCalendarId", { length: 64 }), // Acuity calendar for bookings
  programId: int("programId"), // Link to campaigns table
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt"),
}, (table) => ({
  slugIdx: index("slug_idx").on(table.slug),
  statusIdx: index("status_idx").on(table.status),
}));

export type LandingPage = typeof landingPages.$inferSelect;
export type InsertLandingPage = typeof landingPages.$inferInsert;

/**
 * Page analytics for tracking visitor behavior
 */
export const pageAnalytics = mysqlTable("page_analytics", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(), // Landing page ID
  sessionId: varchar("sessionId", { length: 64 }).notNull(), // Unique session identifier
  visitorId: varchar("visitorId", { length: 64 }), // Anonymous visitor ID (cookie-based)
  eventType: mysqlEnum("eventType", [
    "page_view",
    "cta_click",
    "form_submit",
    "booking_started",
    "booking_completed",
    "scroll_depth",
    "time_on_page"
  ]).notNull(),
  eventData: json("eventData"), // Additional event metadata
  utmSource: varchar("utmSource", { length: 255 }),
  utmMedium: varchar("utmMedium", { length: 255 }),
  utmCampaign: varchar("utmCampaign", { length: 255 }),
  utmContent: varchar("utmContent", { length: 255 }),
  utmTerm: varchar("utmTerm", { length: 255 }),
  referrer: varchar("referrer", { length: 500 }),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  pageIdx: index("page_idx").on(table.pageId),
  sessionIdx: index("session_idx").on(table.sessionId),
  eventTypeIdx: index("event_type_idx").on(table.eventType),
  utmCampaignIdx: index("utm_campaign_idx").on(table.utmCampaign),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type PageAnalytics = typeof pageAnalytics.$inferSelect;
export type InsertPageAnalytics = typeof pageAnalytics.$inferInsert;

/**
 * Media Library: Categories for organizing media files
 */
export const mediaCategories = mysqlTable("media_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  parentId: int("parentId"),
  color: varchar("color", { length: 7 }), // Hex color code
  icon: varchar("icon", { length: 50 }), // Icon name
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  slugIdx: index("slug_idx").on(table.slug),
  parentIdx: index("parent_idx").on(table.parentId),
}));

export type MediaCategory = typeof mediaCategories.$inferSelect;
export type InsertMediaCategory = typeof mediaCategories.$inferInsert;

/**
 * Media Library: Main media files table
 */
export const mediaFiles = mysqlTable("media_files", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull().unique(), // S3 key
  fileUrl: text("fileUrl").notNull(), // Public S3 URL
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(), // Size in bytes
  width: int("width"), // Image/video width
  height: int("height"), // Image/video height
  duration: int("duration"), // Video/audio duration in seconds
  categoryId: int("categoryId").references(() => mediaCategories.id, { onDelete: "set null" }),
  uploadedBy: int("uploadedBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  altText: varchar("altText", { length: 500 }), // For accessibility
  caption: text("caption"),
  
  // AI-generated metadata
  aiTags: json("aiTags").$type<string[]>(), // Auto-generated tags from AI analysis
  aiDescription: text("aiDescription"), // AI-generated description
  dominantColors: json("dominantColors").$type<string[]>(), // Extracted color palette
  
  // Optimization variants
  thumbnailUrl: text("thumbnailUrl"), // Small thumbnail (200x200)
  mediumUrl: text("mediumUrl"), // Medium size (800x800)
  largeUrl: text("largeUrl"), // Large size (1600x1600)
  webpUrl: text("webpUrl"), // WebP optimized version
  
  // Usage tracking
  usageCount: int("usageCount").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  
  // Status and visibility
  status: mysqlEnum("status", ["active", "archived", "deleted"]).default("active").notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.categoryId),
  uploadedByIdx: index("uploaded_by_idx").on(table.uploadedBy),
  statusIdx: index("status_idx").on(table.status),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  filenameIdx: index("filename_idx").on(table.filename),
}));

export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = typeof mediaFiles.$inferInsert;

/**
 * Media Library: Tags for flexible categorization
 */
export const mediaTags = mysqlTable("media_tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  color: varchar("color", { length: 7 }), // Hex color code
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  slugIdx: index("slug_idx").on(table.slug),
  nameIdx: index("name_idx").on(table.name),
}));

export type MediaTag = typeof mediaTags.$inferSelect;
export type InsertMediaTag = typeof mediaTags.$inferInsert;

/**
 * Media Library: Junction table for media-tag relationships (many-to-many)
 */
export const mediaFileTags = mysqlTable("media_file_tags", {
  id: int("id").autoincrement().primaryKey(),
  mediaFileId: int("mediaFileId").notNull().references(() => mediaFiles.id, { onDelete: "cascade" }),
  tagId: int("tagId").notNull().references(() => mediaTags.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  mediaFileIdx: index("media_file_idx").on(table.mediaFileId),
  tagIdx: index("tag_idx").on(table.tagId),
  uniquePair: index("unique_media_tag").on(table.mediaFileId, table.tagId),
}));

export type MediaFileTag = typeof mediaFileTags.$inferSelect;
export type InsertMediaFileTag = typeof mediaFileTags.$inferInsert;

/**
 * Media Library: Track where media files are being used
 */
export const mediaUsage = mysqlTable("media_usage", {
  id: int("id").autoincrement().primaryKey(),
  mediaFileId: int("mediaFileId").notNull().references(() => mediaFiles.id, { onDelete: "cascade" }),
  usageType: mysqlEnum("usageType", [
    "landing_page",
    "campaign_poster",
    "campaign_reel",
    "blog_post",
    "email_template",
    "social_media",
    "other"
  ]).notNull(),
  usageId: int("usageId"), // ID of the entity using this media (e.g., campaign ID, page ID)
  usageUrl: text("usageUrl"), // URL where the media is being used
  usageContext: text("usageContext"), // Additional context (e.g., "hero image", "gallery item 3")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  mediaFileIdx: index("media_file_idx").on(table.mediaFileId),
  usageTypeIdx: index("usage_type_idx").on(table.usageType),
  usageIdIdx: index("usage_id_idx").on(table.usageId),
}));

export type MediaUsage = typeof mediaUsage.$inferSelect;
export type InsertMediaUsage = typeof mediaUsage.$inferInsert;

/**
 * Anniversary Giveaway Entries
 * Stores all form submissions from the Anniversary Giveaway campaign
 */
export const anniversaryGiveawayEntries = mysqlTable("anniversary_giveaway_entries", {
  id: int("id").autoincrement().primaryKey(),
  
  // Basic Information (from Entry Page)
  firstName: varchar("firstName", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  
  // Basic Information (from Application Page)
  fullName: varchar("fullName", { length: 255 }),
  ageRange: varchar("ageRange", { length: 50 }),
  gender: varchar("gender", { length: 50 }),
  city: varchar("city", { length: 255 }),
  isIllinoisResident: boolean("isIllinoisResident").default(false),
  
  // Golf Journey
  golfExperience: varchar("golfExperience", { length: 100 }),
  hasVisitedBefore: varchar("hasVisitedBefore", { length: 10 }),
  firstVisitMethod: varchar("firstVisitMethod", { length: 255 }),
  firstVisitTime: varchar("firstVisitTime", { length: 100 }),
  visitFrequency: varchar("visitFrequency", { length: 100 }),
  whatStoodOut: text("whatStoodOut"),
  simulatorFamiliarity: varchar("simulatorFamiliarity", { length: 100 }),
  interests: text("interests"), // JSON array
  visitPurpose: text("visitPurpose"), // JSON array
  
  // Community & Connection
  passionStory: text("passionStory"),
  communityGrowth: text("communityGrowth"),
  stayConnected: text("stayConnected"), // JSON array
  socialMediaHandle: varchar("socialMediaHandle", { length: 255 }),
  communityGroups: text("communityGroups"),
  
  // Final Details & Contact
  phoneNumber: varchar("phoneNumber", { length: 50 }),
  bestTimeToCall: text("bestTimeToCall"),
  hearAbout: text("hearAbout"), // JSON array
  hearAboutOther: varchar("hearAboutOther", { length: 255 }),
  
  // Consent
  consentToContact: boolean("consentToContact").default(false),
  
  // Metadata
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 100 }),
  userAgent: text("userAgent"),
  googleSheetSynced: boolean("googleSheetSynced").default(false),
  googleSheetSyncedAt: timestamp("googleSheetSyncedAt"),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  submittedAtIdx: index("submitted_at_idx").on(table.submittedAt),
}));

export type AnniversaryGiveawayEntry = typeof anniversaryGiveawayEntries.$inferSelect;
export type InsertAnniversaryGiveawayEntry = typeof anniversaryGiveawayEntries.$inferInsert;


// Marketing Intelligence Insights
export const marketingInsights = mysqlTable("marketing_insights", {
  id: int("id").primaryKey().autoincrement(),
  
  // Insight metadata
  type: varchar("type", { length: 50 }).notNull(), // 'alert', 'opportunity', 'trend', 'recommendation'
  category: varchar("category", { length: 100 }).notNull(), // 'performance', 'budget', 'conversion', 'roi'
  priority: varchar("priority", { length: 20 }).notNull().default('medium'), // 'critical', 'high', 'medium', 'low'
  
  // Insight content
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary").notNull(),
  details: text("details"), // JSON with detailed analysis
  
  // Related entities
  campaignId: int("campaignId"),
  categoryId: varchar("categoryId", { length: 100 }),
  
  // Action plan
  actionPlan: text("actionPlan"), // JSON array of action items
  expectedImpact: text("expectedImpact"),
  
  // Status tracking
  status: varchar("status", { length: 20 }).notNull().default('active'), // 'active', 'acknowledged', 'resolved', 'dismissed'
  acknowledgedAt: timestamp("acknowledgedAt"),
  resolvedAt: timestamp("resolvedAt"),
  
  // Metadata
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0.00 to 100.00
}, (table) => ({
  typeIdx: index("type_idx").on(table.type),
  priorityIdx: index("priority_idx").on(table.priority),
  statusIdx: index("status_idx").on(table.status),
  generatedAtIdx: index("generated_at_idx").on(table.generatedAt),
}));

export type MarketingInsight = typeof marketingInsights.$inferSelect;
export type InsertMarketingInsight = typeof marketingInsights.$inferInsert;


// Instagram Business Insights
export const instagramInsights = mysqlTable("instagram_insights", {
  id: int("id").primaryKey().autoincrement(),
  
  // Date of the insight
  date: date("date").notNull(),
  
  // Account metrics
  followersCount: int("followers_count").notNull(),
  followingCount: int("following_count"),
  mediaCount: int("media_count"),
  
  // Engagement metrics
  impressions: int("impressions"),
  reach: int("reach"),
  profileViews: int("profile_views"),
  websiteClicks: int("website_clicks"),
  
  // Engagement rates
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }), // percentage
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("date_idx").on(table.date),
}));

export type InstagramInsight = typeof instagramInsights.$inferSelect;
export type InsertInstagramInsight = typeof instagramInsights.$inferInsert;

// Instagram Posts Performance
export const instagramPosts = mysqlTable("instagram_posts", {
  id: int("id").primaryKey().autoincrement(),
  
  // Post metadata
  instagramPostId: varchar("instagram_post_id", { length: 100 }),
  caption: text("caption"),
  mediaType: varchar("media_type", { length: 50 }), // 'IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'
  mediaUrl: text("media_url"),
  permalink: text("permalink"),
  
  // Post date
  publishedAt: timestamp("published_at").notNull(),
  
  // Engagement metrics
  likesCount: int("likes_count").default(0),
  commentsCount: int("comments_count").default(0),
  savesCount: int("saves_count").default(0),
  sharesCount: int("shares_count").default(0),
  impressions: int("impressions"),
  reach: int("reach"),
  
  // Calculated metrics
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  
  // Content analysis
  contentType: varchar("content_type", { length: 100 }), // 'tips', 'promotion', 'event', 'testimonial', etc.
  hashtags: text("hashtags"), // JSON array
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  publishedAtIdx: index("published_at_idx").on(table.publishedAt),
  engagementRateIdx: index("engagement_rate_idx").on(table.engagementRate),
}));

export type InstagramPost = typeof instagramPosts.$inferSelect;
export type InsertInstagramPost = typeof instagramPosts.$inferInsert;

// Instagram AI Recommendations
export const instagramRecommendations = mysqlTable("instagram_recommendations", {
  id: int("id").primaryKey().autoincrement(),
  
  // Recommendation content
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  contentIdea: text("content_idea"), // Specific content suggestion
  
  // Recommendation type
  type: varchar("type", { length: 50 }).notNull(), // 'content', 'timing', 'hashtag', 'engagement'
  priority: varchar("priority", { length: 20 }).notNull().default('medium'), // 'high', 'medium', 'low'
  
  // Supporting data
  reasoning: text("reasoning"), // Why this recommendation was made
  expectedImpact: text("expected_impact"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // AI confidence score
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'implemented', 'dismissed'
  implementedAt: timestamp("implemented_at"),
  
  // Metadata
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
}, (table) => ({
  typeIdx: index("type_idx").on(table.type),
  statusIdx: index("status_idx").on(table.status),
  generatedAtIdx: index("generated_at_idx").on(table.generatedAt),
}));

export type InstagramRecommendation = typeof instagramRecommendations.$inferSelect;
export type InsertInstagramRecommendation = typeof instagramRecommendations.$inferInsert;

// ─── Autonomous Marketing Intelligence ───────────────────────────────────────

/**
 * Tracks the sync status for the autonomous marketing intelligence system.
 * Each row represents a data source (e.g., meta_ads, instagram, email).
 */
export const autonomousSyncStatus = mysqlTable("autonomous_sync_status", {
  id: int("id").autoincrement().primaryKey(),
  source: varchar("source", { length: 50 }).notNull(), // meta_ads, instagram, email, etc.
  status: mysqlEnum("status", ["idle", "syncing", "success", "error"]).default("idle").notNull(),
  lastSyncAt: bigint("lastSyncAt", { mode: "number" }), // UTC timestamp ms
  nextSyncAt: bigint("nextSyncAt", { mode: "number" }), // UTC timestamp ms
  recordCount: int("recordCount").default(0),
  errorMessage: text("errorMessage"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutonomousSyncStatus = typeof autonomousSyncStatus.$inferSelect;
export type InsertAutonomousSyncStatus = typeof autonomousSyncStatus.$inferInsert;

/**
 * Stores autonomous actions generated by the intelligence engine.
 * Actions can be auto-executed, pending approval, or monitoring-only.
 */
export const autonomousActions = mysqlTable("autonomous_actions", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: varchar("campaignId", { length: 100 }).notNull(),
  campaignName: varchar("campaignName", { length: 255 }).notNull(),
  actionType: varchar("actionType", { length: 64 }).notNull(), // budget_increase, budget_decrease, send_email, change_targeting, etc.
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "monitor"]).notNull(),
  status: mysqlEnum("status", ["auto_executed", "pending_approval", "approved", "rejected", "undone", "monitoring", "execution_failed", "dismissed"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  actionParams: json("actionParams").$type<Record<string, unknown>>(),
  triggerData: json("triggerData").$type<Record<string, unknown>>(), // campaign metrics that triggered this action
  confidence: int("confidence"), // 0-100
  expectedImpact: text("expectedImpact"),
  executionResult: json("executionResult").$type<Record<string, unknown> | null>(),
  executedAt: bigint("executedAt", { mode: "number" }), // UTC timestamp ms
  reviewedBy: varchar("reviewedBy", { length: 255 }),
  reviewedAt: bigint("reviewedAt", { mode: "number" }), // UTC timestamp ms
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutonomousAction = typeof autonomousActions.$inferSelect;
export type InsertAutonomousAction = typeof autonomousActions.$inferInsert;

// ---------------------------------------------------------------------------
// Email Captures — unified lead/email capture from all sources
// ---------------------------------------------------------------------------
export const emailCaptures = mysqlTable("email_captures", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  source: mysqlEnum("source", [
    "web_form", "meta_lead_ad", "giveaway", "clickfunnels",
    "instagram", "manual_csv", "boomerang", "acuity",
    "referral", "walk_in", "other",
  ]).notNull().default("other"),
  sourceDetail: varchar("source_detail", { length: 255 }),
  status: mysqlEnum("status", [
    "new", "contacted", "qualified", "converted", "unsubscribed", "bounced",
  ]).notNull().default("new"),
  enchargeId: varchar("encharge_id", { length: 100 }),
  enchargeSegments: text("encharge_segments"),
  enchargeSyncedAt: bigint("encharge_synced_at", { mode: "number" }),
  boomerangClientId: varchar("boomerang_client_id", { length: 100 }),
  boomerangCardSerial: varchar("boomerang_card_serial", { length: 100 }),
  boomerangCardStatus: varchar("boomerang_card_status", { length: 50 }),
  boomerangTemplateId: varchar("boomerang_template_id", { length: 50 }),
  boomerangTemplateName: varchar("boomerang_template_name", { length: 100 }),
  boomerangDevice: varchar("boomerang_device", { length: 50 }),
  boomerangInstalledAt: timestamp("boomerang_installed_at"),
  boomerangDeletedAt: timestamp("boomerang_deleted_at"),
  boomerangSyncedAt: bigint("boomerang_synced_at", { mode: "number" }),
  convertedToMemberId: int("converted_to_member_id"),
  convertedAt: bigint("converted_at", { mode: "number" }),
  tags: text("tags"),
  notes: text("notes"),
  capturedAt: bigint("captured_at", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type EmailCapture = typeof emailCaptures.$inferSelect;
export type NewEmailCapture = typeof emailCaptures.$inferInsert;

// ---------------------------------------------------------------------------
// Communication Logs — audit log for every SMS / email sent or received
// ---------------------------------------------------------------------------
export const communicationLogs = mysqlTable("communication_logs", {
  id: int("id").primaryKey().autoincrement(),
  recipientType: mysqlEnum("recipient_type", ["member", "lead"]).notNull(),
  recipientId: int("recipient_id"),
  recipientEmail: varchar("recipient_email", { length: 255 }),
  recipientPhone: varchar("recipient_phone", { length: 20 }),
  recipientName: varchar("recipient_name", { length: 200 }),
  channel: mysqlEnum("channel", ["sms", "email", "push"]).notNull(),
  direction: mysqlEnum("direction", ["outbound", "inbound"]).notNull().default("outbound"),
  subject: varchar("subject", { length: 500 }),
  body: text("body").notNull(),
  status: mysqlEnum("status", [
    "queued", "sent", "delivered", "failed", "bounced", "opened", "clicked",
  ]).notNull().default("queued"),
  provider: mysqlEnum("provider", [
    "twilio_sms", "twilio_email", "encharge", "boomerang_push",
  ]).notNull(),
  providerMessageId: varchar("provider_message_id", { length: 255 }),
  providerStatus: varchar("provider_status", { length: 100 }),
  errorMessage: text("error_message"),
  campaignName: varchar("campaign_name", { length: 255 }),
  costCents: int("cost_cents"),
  sentAt: bigint("sent_at", { mode: "number" }),
  deliveredAt: bigint("delivered_at", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type NewCommunicationLog = typeof communicationLogs.$inferInsert;

// ---------------------------------------------------------------------------
// Priorities — Today's Priorities task list (DB-backed, team-editable)
// ---------------------------------------------------------------------------
export const priorities = mysqlTable("priorities", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull().default("General"),
  path: varchar("path", { length: 255 }).notNull().default("/overview"),
  urgency: mysqlEnum("urgency", ["URGENT", "TODAY", "THIS WEEK"]).notNull().default("TODAY"),
  completedAt: bigint("completed_at", { mode: "number" }),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type PriorityItem = typeof priorities.$inferSelect;
export type NewPriorityItem = typeof priorities.$inferInsert;

// ---------------------------------------------------------------------------
// Toast Revenue — daily summary imported from Toast SFTP export
// ---------------------------------------------------------------------------
export const toastDailySummary = mysqlTable("toast_daily_summary", {
  id: int("id").primaryKey().autoincrement(),
  date: varchar("date", { length: 8 }).notNull().unique(), // YYYYMMDD
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  bayRevenue: decimal("bay_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  foodBevRevenue: decimal("food_bev_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  golfRevenue: decimal("golf_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  totalOrders: int("total_orders").notNull().default(0),
  totalGuests: int("total_guests").notNull().default(0),
  totalTax: decimal("total_tax", { precision: 10, scale: 2 }).notNull().default("0"),
  totalTips: decimal("total_tips", { precision: 10, scale: 2 }).notNull().default("0"),
  totalDiscounts: decimal("total_discounts", { precision: 10, scale: 2 }).notNull().default("0"),
  cashRevenue: decimal("cash_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  creditRevenue: decimal("credit_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type ToastDailySummary = typeof toastDailySummary.$inferSelect;
export type NewToastDailySummary = typeof toastDailySummary.$inferInsert;

// ---------------------------------------------------------------------------
// Toast Payments — individual payment records from PaymentDetails.csv
// ---------------------------------------------------------------------------
export const toastPayments = mysqlTable("toast_payments", {
  id: int("id").primaryKey().autoincrement(),
  date: varchar("date", { length: 8 }).notNull(), // YYYYMMDD
  orderId: varchar("order_id", { length: 100 }),
  checkId: varchar("check_id", { length: 100 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  tip: decimal("tip", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentType: varchar("payment_type", { length: 50 }),
  cardType: varchar("card_type", { length: 50 }),
  customerName: varchar("customer_name", { length: 255 }),
  revenueCenter: varchar("revenue_center", { length: 100 }),
  status: varchar("status", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("toast_payments_date_idx").on(table.date),
}));
export type ToastPayment = typeof toastPayments.$inferSelect;
export type NewToastPayment = typeof toastPayments.$inferInsert;

// ---------------------------------------------------------------------------
// Toast Sync Log — tracks which SFTP folders have been processed
// ---------------------------------------------------------------------------
export const toastSyncLog = mysqlTable("toast_sync_log", {
  id: int("id").primaryKey().autoincrement(),
  date: varchar("date", { length: 8 }).notNull().unique(), // YYYYMMDD
  status: mysqlEnum("status", ["success", "error", "partial"]).notNull().default("success"),
  ordersImported: int("orders_imported").notNull().default(0),
  paymentsImported: int("payments_imported").notNull().default(0),
  errorMessage: text("error_message"),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
});
export type ToastSyncLog = typeof toastSyncLog.$inferSelect;

// ---------------------------------------------------------------------------
// Pro Member Sessions — tracks individual bay sessions for Pro (coach) members
// Each session can be credited against the $500/mo base fee at $25/session
// ---------------------------------------------------------------------------
export const proMemberSessions = mysqlTable("pro_member_sessions", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  sessionDate: date("session_date").notNull(),
  sessionType: mysqlEnum("session_type", ["bay_usage", "lesson", "clinic", "practice"]).notNull().default("bay_usage"),
  bayNumber: varchar("bay_number", { length: 20 }),
  durationHrs: decimal("duration_hrs", { precision: 4, scale: 2 }).notNull().default("1"),
  creditApplied: decimal("credit_applied", { precision: 8, scale: 2 }).notNull().default("25"),
  notes: text("notes"),
  toastOrderId: varchar("toast_order_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  proSessMemberIdx: index("pro_sessions_member_idx").on(table.memberId),
  proSessDateIdx: index("pro_sessions_date_idx").on(table.sessionDate),
}));
export type ProMemberSession = typeof proMemberSessions.$inferSelect;
export type NewProMemberSession = typeof proMemberSessions.$inferInsert;

// ---------------------------------------------------------------------------
// Pro Member Billing — monthly billing records for Pro (coach) members
// Base fee: $500/mo. Bay credits deducted at $25/session (up to 20 sessions).
// Overage: $25/hr for sessions beyond 20/mo.
// Stripe handles actual payment; this table tracks the billing calculation.
// ---------------------------------------------------------------------------
export const proMemberBilling = mysqlTable("pro_member_billing", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  billingMonth: varchar("billing_month", { length: 7 }).notNull(),
  baseFee: decimal("base_fee", { precision: 8, scale: 2 }).notNull().default("500"),
  sessionCount: int("session_count").notNull().default(0),
  bayCreditTotal: decimal("bay_credit_total", { precision: 8, scale: 2 }).notNull().default("0"),
  overageHrs: decimal("overage_hrs", { precision: 6, scale: 2 }).notNull().default("0"),
  overageAmount: decimal("overage_amount", { precision: 8, scale: 2 }).notNull().default("0"),
  netBill: decimal("net_bill", { precision: 8, scale: 2 }).notNull().default("500"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeStatus: mysqlEnum("stripe_status", ["pending", "paid", "failed", "refunded", "waived"]).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  proBillMemberMonthIdx: index("pro_billing_member_month_idx").on(table.memberId, table.billingMonth),
  proBillMemberIdx: index("pro_billing_member_idx").on(table.memberId),
}));
export type ProMemberBilling = typeof proMemberBilling.$inferSelect;
export type NewProMemberBilling = typeof proMemberBilling.$inferInsert;
