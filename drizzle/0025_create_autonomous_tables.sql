-- Migration 0025: Create autonomous_sync_status and autonomous_actions tables
-- These tables were marked as "already exists" in migration 0000 but were never
-- actually created via a CREATE TABLE statement, causing the Autopilot Sync to fail.
-- This migration uses CREATE TABLE IF NOT EXISTS for full idempotency.

CREATE TABLE IF NOT EXISTS `autonomous_sync_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(50) NOT NULL,
	`status` enum('idle','syncing','success','error') NOT NULL DEFAULT 'idle',
	`lastSyncAt` bigint,
	`nextSyncAt` bigint,
	`recordCount` int DEFAULT 0,
	`errorMessage` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `autonomous_sync_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `autonomous_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` varchar(100) NOT NULL,
	`campaignName` varchar(255) NOT NULL,
	`actionType` varchar(64) NOT NULL,
	`riskLevel` enum('low','medium','high','monitor') NOT NULL,
	`status` enum('auto_executed','pending_approval','approved','rejected','undone','monitoring','execution_failed','dismissed','archived') NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text NOT NULL,
	`actionParams` json,
	`triggerData` json,
	`confidence` int,
	`expectedImpact` text,
	`executionResult` json,
	`executedAt` bigint,
	`reviewedBy` varchar(255),
	`reviewedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `autonomous_actions_id` PRIMARY KEY(`id`)
);
