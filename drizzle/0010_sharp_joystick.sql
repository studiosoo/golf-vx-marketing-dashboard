ALTER TABLE `communication_logs` ADD `comm_status` enum('queued','sent','delivered','failed','bounced','opened','clicked') DEFAULT 'queued' NOT NULL;--> statement-breakpoint
ALTER TABLE `communication_logs` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `members` ADD `monthlyAmount` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `members` ADD `paymentInterval` enum('monthly','annual') DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE `members` ADD `boomerangMembership` varchar(100);--> statement-breakpoint
ALTER TABLE `communication_logs` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `communication_logs` DROP COLUMN `createdAt`;