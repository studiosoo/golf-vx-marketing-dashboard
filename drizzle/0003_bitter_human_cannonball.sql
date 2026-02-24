ALTER TABLE `email_captures` ADD `boomerang_card_status` varchar(50);--> statement-breakpoint
ALTER TABLE `email_captures` ADD `boomerang_template_id` varchar(50);--> statement-breakpoint
ALTER TABLE `email_captures` ADD `boomerang_template_name` varchar(100);--> statement-breakpoint
ALTER TABLE `email_captures` ADD `boomerang_device` varchar(50);--> statement-breakpoint
ALTER TABLE `email_captures` ADD `boomerang_installed_at` timestamp;--> statement-breakpoint
ALTER TABLE `email_captures` ADD `boomerang_deleted_at` timestamp;