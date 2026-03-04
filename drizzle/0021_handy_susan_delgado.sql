DROP INDEX `event_ad_status_idx` ON `event_advertising`;--> statement-breakpoint
ALTER TABLE `event_advertising` ADD `status` enum('upcoming','active','completed','cancelled') DEFAULT 'upcoming' NOT NULL;--> statement-breakpoint
ALTER TABLE `giveawayApplications` ADD `driveDayScore` int;--> statement-breakpoint
ALTER TABLE `members` ADD `boomerangEmail` varchar(320);--> statement-breakpoint
CREATE INDEX `event_ad_status_idx` ON `event_advertising` (`status`);--> statement-breakpoint
ALTER TABLE `event_advertising` DROP COLUMN `event_ad_status`;