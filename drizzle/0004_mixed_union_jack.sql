CREATE TABLE `priorities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`category` varchar(100) NOT NULL DEFAULT 'General',
	`path` varchar(255) NOT NULL DEFAULT '/overview',
	`urgency` enum('URGENT','TODAY','THIS WEEK') NOT NULL DEFAULT 'TODAY',
	`completed_at` bigint,
	`created_by` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `priorities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `email_captures` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `email_captures` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `email_captures` DROP COLUMN `encharge_subscriber_id`;--> statement-breakpoint
ALTER TABLE `email_captures` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `email_captures` DROP COLUMN `updatedAt`;