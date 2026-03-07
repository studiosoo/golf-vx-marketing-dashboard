-- Migration 0024: Add venue_id to members table for multi-tenant support
-- Backfills all existing rows as Arlington Heights (venue_id = 1)

ALTER TABLE `members`
  ADD COLUMN `venue_id` int NOT NULL DEFAULT 1
  AFTER `id`;
--> statement-breakpoint

-- Backfill: all existing members belong to Arlington Heights (venue 1)
UPDATE `members` SET `venue_id` = 1 WHERE `venue_id` IS NULL OR `venue_id` = 1;
--> statement-breakpoint

CREATE INDEX `members_venue_idx` ON `members` (`venue_id`);
--> statement-breakpoint

-- Composite index for common scoped queries (venue + status, venue + tier)
CREATE INDEX `members_venue_status_idx` ON `members` (`venue_id`, `status`);
--> statement-breakpoint
CREATE INDEX `members_venue_tier_idx` ON `members` (`venue_id`, `membershipTier`);
