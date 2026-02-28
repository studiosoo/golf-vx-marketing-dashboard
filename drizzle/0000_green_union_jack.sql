CREATE TABLE IF NOT EXISTS `aiRecommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('performance_alert','opportunity','campaign_idea','seasonal_timing','competitive_intel','budget_reallocation','creative_refresh','audience_expansion') NOT NULL,
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`confidenceScore` int NOT NULL,
	`status` enum('pending','approved','rejected','executed','expired') NOT NULL DEFAULT 'pending',
	`data` json NOT NULL,
	`userFeedback` text,
	`outcomeMetrics` json,
	`expiresAt` timestamp,
	`executedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiRecommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `anniversary_giveaway_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(255),
	`email` varchar(320) NOT NULL,
	`fullName` varchar(255),
	`ageRange` varchar(50),
	`gender` varchar(50),
	`city` varchar(255),
	`isIllinoisResident` boolean DEFAULT false,
	`golfExperience` varchar(100),
	`hasVisitedBefore` varchar(10),
	`firstVisitMethod` varchar(255),
	`firstVisitTime` varchar(100),
	`visitFrequency` varchar(100),
	`whatStoodOut` text,
	`simulatorFamiliarity` varchar(100),
	`interests` text,
	`visitPurpose` text,
	`passionStory` text,
	`communityGrowth` text,
	`stayConnected` text,
	`socialMediaHandle` varchar(255),
	`communityGroups` text,
	`phoneNumber` varchar(50),
	`bestTimeToCall` text,
	`hearAbout` text,
	`hearAboutOther` varchar(255),
	`consentToContact` boolean DEFAULT false,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(100),
	`userAgent` text,
	`googleSheetSynced` boolean DEFAULT false,
	`googleSheetSyncedAt` timestamp,
	CONSTRAINT `anniversary_giveaway_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
-- autonomous_actions already exists
--> statement-breakpoint
-- autonomous_sync_status already exists
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `boost_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` varchar(255),
	`postUrl` varchar(500),
	`budget` decimal(10,2) NOT NULL,
	`duration` int NOT NULL,
	`targetAudience` json,
	`status` enum('pending','active','completed','failed') NOT NULL DEFAULT 'pending',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`results` json,
	CONSTRAINT `boost_schedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `campaign_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`type` enum('meta_ads','content','boost','email','conversion') NOT NULL,
	`priority` enum('urgent','high','medium','low') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`expectedImpact` varchar(255),
	`effortRequired` varchar(50),
	`status` enum('pending','in_progress','completed','skipped') NOT NULL DEFAULT 'pending',
	`executionData` json,
	`completedAt` timestamp,
	`result` text,
	CONSTRAINT `campaign_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `campaign_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` varchar(64) NOT NULL,
	`campaignName` varchar(255) NOT NULL,
	`alertType` enum('low_ctr','high_cpc','budget_exceeded','low_conversions','high_frequency') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`message` text NOT NULL,
	`threshold` decimal(10,4),
	`actualValue` decimal(10,4),
	`status` enum('active','acknowledged','resolved') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acknowledgedAt` timestamp,
	`resolvedAt` timestamp,
	`notes` text,
	CONSTRAINT `campaign_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `campaignExpenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`date` timestamp NOT NULL,
	`category` enum('meta_ads','venue_rental','food_beverage','promotional_materials','staff_costs','equipment','other') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` text,
	`receiptUrl` varchar(500),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaignExpenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `campaignIdeas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`objective` text NOT NULL,
	`targetAudience` varchar(255) NOT NULL,
	`channels` json NOT NULL,
	`budgetMin` decimal(10,2) NOT NULL,
	`budgetMax` decimal(10,2) NOT NULL,
	`timeline` varchar(100) NOT NULL,
	`keyMessages` json NOT NULL,
	`creativeConcepts` json NOT NULL,
	`successMetrics` json NOT NULL,
	`implementationSteps` json NOT NULL,
	`confidenceScore` int NOT NULL,
	`rationale` text NOT NULL,
	`status` enum('suggested','in_progress','completed','archived') NOT NULL DEFAULT 'suggested',
	`actualResults` json,
	`linkedCampaignId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaignIdeas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `campaign_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int,
	`snapshotDate` timestamp NOT NULL,
	`spend` decimal(10,2) NOT NULL DEFAULT '0',
	`revenue` decimal(10,2) NOT NULL DEFAULT '0',
	`conversions` int NOT NULL DEFAULT 0,
	`leads` int NOT NULL DEFAULT 0,
	`impressions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`goalCurrent` int NOT NULL DEFAULT 0,
	`goalTarget` int NOT NULL DEFAULT 0,
	`roi` decimal(10,2) NOT NULL DEFAULT '0',
	`roas` decimal(10,2) NOT NULL DEFAULT '0',
	`ctr` decimal(10,4) NOT NULL DEFAULT '0',
	`cpc` decimal(10,2) NOT NULL DEFAULT '0',
	`cpl` decimal(10,2) NOT NULL DEFAULT '0',
	`conversionRate` decimal(10,4) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaign_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('trial_conversion','membership_acquisition','member_retention','corporate_events') NOT NULL,
	`type` enum('trial_conversion','membership_acquisition','corporate_events','member_retention','pbga_programs','event_specific') NOT NULL,
	`status` enum('planned','active','completed','paused') NOT NULL DEFAULT 'planned',
	`description` text,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`budget` decimal(10,2) NOT NULL,
	`actualSpend` decimal(10,2) NOT NULL DEFAULT '0',
	`targetRevenue` decimal(10,2),
	`actualRevenue` decimal(10,2) NOT NULL DEFAULT '0',
	`targetApplications` int,
	`actualApplications` int NOT NULL DEFAULT 0,
	`targetConversions` int,
	`actualConversions` int NOT NULL DEFAULT 0,
	`metaAdsCampaignId` varchar(64),
	`metaAdsBudget` decimal(10,2),
	`metaAdsSpend` decimal(10,2) DEFAULT '0',
	`asanaProjectId` varchar(64),
	`asanaTaskId` varchar(64),
	`asanaSectionId` varchar(64),
	`landingPageUrl` text,
	`posterImageUrl` text,
	`reelThumbnailUrl` text,
	`additionalVisuals` json,
	`goalType` enum('revenue','followers','leads','attendance','retention'),
	`goalTarget` decimal(12,2),
	`goalActual` decimal(12,2) DEFAULT '0',
	`goalUnit` varchar(50),
	`primaryKpi` varchar(100),
	`kpiTarget` decimal(12,4),
	`kpiActual` decimal(12,4),
	`kpiUnit` varchar(50),
	`performanceScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `channelMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`campaignId` int,
	`date` timestamp NOT NULL,
	`impressions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`spend` decimal(10,2) NOT NULL DEFAULT '0',
	`revenue` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channelMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('meta_ads','email','social_organic','referral','direct','other') NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channels_id` PRIMARY KEY(`id`),
	CONSTRAINT `channels_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `content_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` varchar(255) NOT NULL,
	`contentType` enum('feed_post','story','reel','carousel') NOT NULL,
	`caption` text NOT NULL,
	`hashtags` varchar(500) NOT NULL,
	`imagePrompt` text,
	`imageUrl` varchar(500),
	`scheduledFor` timestamp,
	`posted` boolean NOT NULL DEFAULT false,
	`postedAt` timestamp,
	`instagramPostId` varchar(255),
	`performanceMetrics` json,
	CONSTRAINT `content_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `daily_action_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` varchar(255) NOT NULL,
	`date` timestamp NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`aiAnalysis` text NOT NULL,
	`totalActions` int NOT NULL,
	`completedActions` int NOT NULL DEFAULT 0,
	CONSTRAINT `daily_action_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `giveawayApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int,
	`campaignId` int,
	`submissionTimestamp` timestamp NOT NULL,
	`name` varchar(200) NOT NULL,
	`email` varchar(200) NOT NULL,
	`phone` varchar(50),
	`ageRange` varchar(50),
	`gender` varchar(50),
	`city` varchar(100),
	`illinoisResident` boolean DEFAULT false,
	`golfExperienceLevel` varchar(100),
	`visitedBefore` varchar(50),
	`indoorGolfFamiliarity` varchar(100),
	`bestTimeToCall` varchar(100),
	`howDidTheyHear` text,
	`status` enum('pending','contacted','scheduled','completed','declined') NOT NULL DEFAULT 'pending',
	`contactedAt` timestamp,
	`scheduledAt` timestamp,
	`completedAt` timestamp,
	`isTestEntry` boolean NOT NULL DEFAULT false,
	`notes` text,
	`googleSheetRowId` int,
	`lastSyncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `giveawayApplications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `instagram_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`followers_count` int NOT NULL,
	`following_count` int,
	`media_count` int,
	`impressions` int,
	`reach` int,
	`profile_views` int,
	`website_clicks` int,
	`engagement_rate` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `instagram_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `instagram_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instagram_post_id` varchar(100),
	`caption` text,
	`media_type` varchar(50),
	`media_url` text,
	`permalink` text,
	`published_at` timestamp NOT NULL,
	`likes_count` int DEFAULT 0,
	`comments_count` int DEFAULT 0,
	`saves_count` int DEFAULT 0,
	`shares_count` int DEFAULT 0,
	`impressions` int,
	`reach` int,
	`engagement_rate` decimal(5,2),
	`content_type` varchar(100),
	`hashtags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `instagram_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `instagram_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text NOT NULL,
	`content_idea` text,
	`type` varchar(50) NOT NULL,
	`priority` varchar(20) NOT NULL DEFAULT 'medium',
	`reasoning` text,
	`expected_impact` text,
	`confidence` decimal(5,2),
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`implemented_at` timestamp,
	`generated_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	CONSTRAINT `instagram_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `landing_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` text,
	`heroImage` varchar(500),
	`content` json NOT NULL,
	`metaTitle` varchar(255),
	`metaDescription` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`acuityCalendarId` varchar(64),
	`programId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp,
	CONSTRAINT `landing_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `landing_pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `marketing_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(50) NOT NULL,
	`category` varchar(100) NOT NULL,
	`priority` varchar(20) NOT NULL DEFAULT 'medium',
	`title` varchar(500) NOT NULL,
	`summary` text NOT NULL,
	`details` text,
	`campaignId` int,
	`categoryId` varchar(100),
	`actionPlan` text,
	`expectedImpact` text,
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`acknowledgedAt` timestamp,
	`resolvedAt` timestamp,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`confidence` decimal(5,2),
	CONSTRAINT `marketing_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `media_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`parentId` int,
	`color` varchar(7),
	`icon` varchar(50),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `media_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `media_file_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mediaFileId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_file_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `media_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(255) NOT NULL,
	`originalFilename` varchar(255) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`width` int,
	`height` int,
	`duration` int,
	`categoryId` int,
	`uploadedBy` int NOT NULL,
	`title` varchar(255),
	`description` text,
	`altText` varchar(500),
	`caption` text,
	`aiTags` json,
	`aiDescription` text,
	`dominantColors` json,
	`thumbnailUrl` text,
	`mediumUrl` text,
	`largeUrl` text,
	`webpUrl` text,
	`usageCount` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`status` enum('active','archived','deleted') NOT NULL DEFAULT 'active',
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_files_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_files_fileKey_unique` UNIQUE(`fileKey`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `media_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`color` varchar(7),
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_tags_name_unique` UNIQUE(`name`),
	CONSTRAINT `media_tags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `media_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mediaFileId` int NOT NULL,
	`usageType` enum('landing_page','campaign_poster','campaign_reel','blog_post','email_template','social_media','other') NOT NULL,
	`usageId` int,
	`usageUrl` text,
	`usageContext` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `memberAppointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`campaignId` int,
	`acuityAppointmentId` int NOT NULL,
	`appointmentType` varchar(255) NOT NULL,
	`appointmentTypeId` int NOT NULL,
	`category` varchar(100),
	`appointmentDate` timestamp NOT NULL,
	`dateCreated` timestamp NOT NULL,
	`duration` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`amountPaid` decimal(10,2) NOT NULL DEFAULT '0',
	`paid` boolean NOT NULL DEFAULT false,
	`canceled` boolean NOT NULL DEFAULT false,
	`completed` boolean NOT NULL DEFAULT false,
	`notes` text,
	`location` varchar(255),
	`calendar` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memberAppointments_id` PRIMARY KEY(`id`),
	CONSTRAINT `memberAppointments_acuityAppointmentId_unique` UNIQUE(`acuityAppointmentId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `memberTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`campaignId` int,
	`toastOrderGuid` varchar(100) NOT NULL,
	`toastCheckNumber` varchar(50),
	`transactionDate` timestamp NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`tax` decimal(10,2) NOT NULL DEFAULT '0',
	`tip` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`paymentMethod` varchar(50),
	`paymentStatus` enum('paid','pending','refunded','voided') NOT NULL DEFAULT 'paid',
	`items` text,
	`itemCount` int NOT NULL DEFAULT 0,
	`category` varchar(100),
	`venue` varchar(100) NOT NULL DEFAULT 'Arlington Heights',
	`server` varchar(100),
	`notes` text,
	`lastSyncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memberTransactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `memberTransactions_toastOrderGuid_unique` UNIQUE(`toastOrderGuid`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`membershipTier` enum('trial','monthly','annual','corporate','none','all_access_aces','swing_savers','golf_vx_pro') NOT NULL,
	`status` enum('active','inactive','cancelled','trial') NOT NULL DEFAULT 'active',
	`joinDate` timestamp NOT NULL,
	`renewalDate` timestamp,
	`cancellationDate` timestamp,
	`lastVisitDate` timestamp,
	`acquisitionSource` varchar(100),
	`campaignId` int,
	`lifetimeValue` decimal(10,2) NOT NULL DEFAULT '0',
	`totalVisits` int NOT NULL DEFAULT 0,
	`referralCode` varchar(50),
	`referredBy` int,
	`notes` text,
	`tags` json,
	`boomerangCustomerId` varchar(100),
	`loyaltyPoints` int NOT NULL DEFAULT 0,
	`loyaltyCardStatus` enum('active','inactive','none') DEFAULT 'none',
	`lastLoyaltySync` timestamp,
	`enchargeUserId` varchar(100),
	`emailEngagementScore` int NOT NULL DEFAULT 0,
	`lastEmailOpen` timestamp,
	`lastEmailClick` timestamp,
	`lastEnchargeSync` timestamp,
	`emailSubscribed` boolean NOT NULL DEFAULT false,
	`emailSubscribedAt` timestamp,
	`emailUnsubscribedAt` timestamp,
	`customerStatus` enum('lead','trial','active','churned') NOT NULL DEFAULT 'lead',
	`toastCustomerId` varchar(100),
	`totalPurchases` decimal(10,2) NOT NULL DEFAULT '0',
	`lastPurchaseDate` timestamp,
	`lastToastSync` timestamp,
	`acuityClientId` varchar(100),
	`totalLessons` int NOT NULL DEFAULT 0,
	`lastLessonDate` timestamp,
	`nextLessonDate` timestamp,
	`lastAcuitySync` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `members_id` PRIMARY KEY(`id`),
	CONSTRAINT `members_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `page_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`visitorId` varchar(64),
	`eventType` enum('page_view','cta_click','form_submit','booking_started','booking_completed','scroll_depth','time_on_page') NOT NULL,
	`eventData` json,
	`utmSource` varchar(255),
	`utmMedium` varchar(255),
	`utmCampaign` varchar(255),
	`utmContent` varchar(255),
	`utmTerm` varchar(255),
	`referrer` varchar(500),
	`userAgent` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `program_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programId` int NOT NULL,
	`strategicCampaign` enum('trial_conversion','membership_acquisition','member_retention','corporate_events') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `program_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('campaign_performance','monthly_summary','roi_analysis','member_acquisition','channel_performance','executive_summary') NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`data` text NOT NULL,
	`generatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `revenue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`source` enum('membership','bay_rental','food_beverage','event','league','coaching','merchandise','other') NOT NULL,
	`memberId` int,
	`campaignId` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `revenue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asanaId` varchar(64) NOT NULL,
	`campaignId` int,
	`name` varchar(500) NOT NULL,
	`description` text,
	`assignee` varchar(255),
	`dueDate` timestamp,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`asanaProjectId` varchar(64),
	`asanaProjectName` varchar(255),
	`lastSyncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `tasks_asanaId_unique` UNIQUE(`asanaId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `userActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recommendationId` int,
	`campaignIdeaId` int,
	`action` enum('approved','rejected','modified','ignored','executed') NOT NULL,
	`modificationDetails` text,
	`outcome` varchar(255),
	`outcomeData` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `campaign_actions` ADD CONSTRAINT `campaign_actions_planId_daily_action_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `daily_action_plans`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaignExpenses` ADD CONSTRAINT `campaignExpenses_campaignId_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaignExpenses` ADD CONSTRAINT `campaignExpenses_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaignIdeas` ADD CONSTRAINT `campaignIdeas_linkedCampaignId_campaigns_id_fk` FOREIGN KEY (`linkedCampaignId`) REFERENCES `campaigns`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaign_metrics` ADD CONSTRAINT `campaign_metrics_campaignId_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channelMetrics` ADD CONSTRAINT `channelMetrics_channelId_channels_id_fk` FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channelMetrics` ADD CONSTRAINT `channelMetrics_campaignId_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `giveawayApplications` ADD CONSTRAINT `giveawayApplications_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `giveawayApplications` ADD CONSTRAINT `giveawayApplications_campaignId_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_file_tags` ADD CONSTRAINT `media_file_tags_mediaFileId_media_files_id_fk` FOREIGN KEY (`mediaFileId`) REFERENCES `media_files`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_file_tags` ADD CONSTRAINT `media_file_tags_tagId_media_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `media_tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_files` ADD CONSTRAINT `media_files_categoryId_media_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `media_categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_files` ADD CONSTRAINT `media_files_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_usage` ADD CONSTRAINT `media_usage_mediaFileId_media_files_id_fk` FOREIGN KEY (`mediaFileId`) REFERENCES `media_files`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memberAppointments` ADD CONSTRAINT `memberAppointments_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memberAppointments` ADD CONSTRAINT `memberAppointments_campaignId_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memberTransactions` ADD CONSTRAINT `memberTransactions_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memberTransactions` ADD CONSTRAINT `memberTransactions_campaignId_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_campaignId_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `program_campaigns` ADD CONSTRAINT `program_campaigns_programId_campaigns_id_fk` FOREIGN KEY (`programId`) REFERENCES `campaigns`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_generatedBy_users_id_fk` FOREIGN KEY (`generatedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revenue` ADD CONSTRAINT `revenue_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revenue` ADD CONSTRAINT `revenue_campaignId_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_campaignId_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userActions` ADD CONSTRAINT `userActions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userActions` ADD CONSTRAINT `userActions_recommendationId_aiRecommendations_id_fk` FOREIGN KEY (`recommendationId`) REFERENCES `aiRecommendations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userActions` ADD CONSTRAINT `userActions_campaignIdeaId_campaignIdeas_id_fk` FOREIGN KEY (`campaignIdeaId`) REFERENCES `campaignIdeas`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `type_idx` ON `aiRecommendations` (`type`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `aiRecommendations` (`status`);--> statement-breakpoint
CREATE INDEX `priority_idx` ON `aiRecommendations` (`priority`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `aiRecommendations` (`createdAt`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `anniversary_giveaway_entries` (`email`);--> statement-breakpoint
CREATE INDEX `submitted_at_idx` ON `anniversary_giveaway_entries` (`submittedAt`);--> statement-breakpoint
CREATE INDEX `post_idx` ON `boost_schedule` (`postId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `boost_schedule` (`status`);--> statement-breakpoint
CREATE INDEX `plan_idx` ON `campaign_actions` (`planId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `campaign_actions` (`status`);--> statement-breakpoint
CREATE INDEX `priority_idx` ON `campaign_actions` (`priority`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `campaign_alerts` (`campaignId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `campaign_alerts` (`status`);--> statement-breakpoint
CREATE INDEX `severity_idx` ON `campaign_alerts` (`severity`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `campaign_alerts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `campaignExpenses` (`campaignId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `campaignExpenses` (`date`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `campaignExpenses` (`category`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `campaignIdeas` (`status`);--> statement-breakpoint
CREATE INDEX `audience_idx` ON `campaignIdeas` (`targetAudience`);--> statement-breakpoint
CREATE INDEX `confidence_idx` ON `campaignIdeas` (`confidenceScore`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `campaignIdeas` (`createdAt`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `campaign_metrics` (`campaignId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `campaign_metrics` (`snapshotDate`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `campaigns` (`status`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `campaigns` (`type`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `campaigns` (`startDate`,`endDate`);--> statement-breakpoint
CREATE INDEX `channel_idx` ON `channelMetrics` (`channelId`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `channelMetrics` (`campaignId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `channelMetrics` (`date`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `content_queue` (`campaignId`);--> statement-breakpoint
CREATE INDEX `scheduled_idx` ON `content_queue` (`scheduledFor`);--> statement-breakpoint
CREATE INDEX `posted_idx` ON `content_queue` (`posted`);--> statement-breakpoint
CREATE INDEX `campaign_date_idx` ON `daily_action_plans` (`campaignId`,`date`);--> statement-breakpoint
CREATE INDEX `member_idx` ON `giveawayApplications` (`memberId`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `giveawayApplications` (`campaignId`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `giveawayApplications` (`email`);--> statement-breakpoint
CREATE INDEX `submission_timestamp_idx` ON `giveawayApplications` (`submissionTimestamp`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `giveawayApplications` (`status`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `instagram_insights` (`date`);--> statement-breakpoint
CREATE INDEX `published_at_idx` ON `instagram_posts` (`published_at`);--> statement-breakpoint
CREATE INDEX `engagement_rate_idx` ON `instagram_posts` (`engagement_rate`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `instagram_recommendations` (`type`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `instagram_recommendations` (`status`);--> statement-breakpoint
CREATE INDEX `generated_at_idx` ON `instagram_recommendations` (`generated_at`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `landing_pages` (`slug`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `landing_pages` (`status`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `marketing_insights` (`type`);--> statement-breakpoint
CREATE INDEX `priority_idx` ON `marketing_insights` (`priority`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `marketing_insights` (`status`);--> statement-breakpoint
CREATE INDEX `generated_at_idx` ON `marketing_insights` (`generatedAt`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `media_categories` (`slug`);--> statement-breakpoint
CREATE INDEX `parent_idx` ON `media_categories` (`parentId`);--> statement-breakpoint
CREATE INDEX `media_file_idx` ON `media_file_tags` (`mediaFileId`);--> statement-breakpoint
CREATE INDEX `tag_idx` ON `media_file_tags` (`tagId`);--> statement-breakpoint
CREATE INDEX `unique_media_tag` ON `media_file_tags` (`mediaFileId`,`tagId`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `media_files` (`categoryId`);--> statement-breakpoint
CREATE INDEX `uploaded_by_idx` ON `media_files` (`uploadedBy`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `media_files` (`status`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `media_files` (`createdAt`);--> statement-breakpoint
CREATE INDEX `filename_idx` ON `media_files` (`filename`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `media_tags` (`slug`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `media_tags` (`name`);--> statement-breakpoint
CREATE INDEX `media_file_idx` ON `media_usage` (`mediaFileId`);--> statement-breakpoint
CREATE INDEX `usage_type_idx` ON `media_usage` (`usageType`);--> statement-breakpoint
CREATE INDEX `usage_id_idx` ON `media_usage` (`usageId`);--> statement-breakpoint
CREATE INDEX `member_idx` ON `memberAppointments` (`memberId`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `memberAppointments` (`campaignId`);--> statement-breakpoint
CREATE INDEX `appointment_date_idx` ON `memberAppointments` (`appointmentDate`);--> statement-breakpoint
CREATE INDEX `acuity_idx` ON `memberAppointments` (`acuityAppointmentId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `memberAppointments` (`appointmentTypeId`);--> statement-breakpoint
CREATE INDEX `member_idx` ON `memberTransactions` (`memberId`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `memberTransactions` (`campaignId`);--> statement-breakpoint
CREATE INDEX `transaction_date_idx` ON `memberTransactions` (`transactionDate`);--> statement-breakpoint
CREATE INDEX `toast_order_guid_idx` ON `memberTransactions` (`toastOrderGuid`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `members` (`email`);--> statement-breakpoint
CREATE INDEX `tier_idx` ON `members` (`membershipTier`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `members` (`status`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `members` (`campaignId`);--> statement-breakpoint
CREATE INDEX `boomerang_idx` ON `members` (`boomerangCustomerId`);--> statement-breakpoint
CREATE INDEX `encharge_idx` ON `members` (`enchargeUserId`);--> statement-breakpoint
CREATE INDEX `toast_idx` ON `members` (`toastCustomerId`);--> statement-breakpoint
CREATE INDEX `acuity_idx` ON `members` (`acuityClientId`);--> statement-breakpoint
CREATE INDEX `page_idx` ON `page_analytics` (`pageId`);--> statement-breakpoint
CREATE INDEX `session_idx` ON `page_analytics` (`sessionId`);--> statement-breakpoint
CREATE INDEX `event_type_idx` ON `page_analytics` (`eventType`);--> statement-breakpoint
CREATE INDEX `utm_campaign_idx` ON `page_analytics` (`utmCampaign`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `page_analytics` (`createdAt`);--> statement-breakpoint
CREATE INDEX `program_idx` ON `program_campaigns` (`programId`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `program_campaigns` (`strategicCampaign`);--> statement-breakpoint
CREATE INDEX `unique_program_campaign` ON `program_campaigns` (`programId`,`strategicCampaign`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `reports` (`type`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `reports` (`startDate`,`endDate`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `revenue` (`date`);--> statement-breakpoint
CREATE INDEX `source_idx` ON `revenue` (`source`);--> statement-breakpoint
CREATE INDEX `member_idx` ON `revenue` (`memberId`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `revenue` (`campaignId`);--> statement-breakpoint
CREATE INDEX `asana_id_idx` ON `tasks` (`asanaId`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `tasks` (`campaignId`);--> statement-breakpoint
CREATE INDEX `completed_idx` ON `tasks` (`completed`);--> statement-breakpoint
CREATE INDEX `due_date_idx` ON `tasks` (`dueDate`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `userActions` (`userId`);--> statement-breakpoint
CREATE INDEX `recommendation_idx` ON `userActions` (`recommendationId`);--> statement-breakpoint
CREATE INDEX `campaign_idea_idx` ON `userActions` (`campaignIdeaId`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `userActions` (`action`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `userActions` (`timestamp`);