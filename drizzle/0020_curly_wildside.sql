DROP INDEX `print_ad_status_idx` ON `print_advertising`;--> statement-breakpoint
ALTER TABLE `print_advertising` ADD `status` enum('active','completed','cancelled','negotiating') DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE INDEX `print_ad_status_idx` ON `print_advertising` (`status`);--> statement-breakpoint
ALTER TABLE `print_advertising` DROP COLUMN `print_ad_status`;