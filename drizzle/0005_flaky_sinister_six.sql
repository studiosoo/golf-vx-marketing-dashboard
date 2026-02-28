CREATE TABLE `toast_daily_summary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(8) NOT NULL,
	`total_revenue` decimal(10,2) NOT NULL DEFAULT '0',
	`bay_revenue` decimal(10,2) NOT NULL DEFAULT '0',
	`food_bev_revenue` decimal(10,2) NOT NULL DEFAULT '0',
	`golf_revenue` decimal(10,2) NOT NULL DEFAULT '0',
	`total_orders` int NOT NULL DEFAULT 0,
	`total_guests` int NOT NULL DEFAULT 0,
	`total_tax` decimal(10,2) NOT NULL DEFAULT '0',
	`total_tips` decimal(10,2) NOT NULL DEFAULT '0',
	`total_discounts` decimal(10,2) NOT NULL DEFAULT '0',
	`cash_revenue` decimal(10,2) NOT NULL DEFAULT '0',
	`credit_revenue` decimal(10,2) NOT NULL DEFAULT '0',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `toast_daily_summary_id` PRIMARY KEY(`id`),
	CONSTRAINT `toast_daily_summary_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `toast_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(8) NOT NULL,
	`order_id` varchar(100),
	`check_id` varchar(100),
	`amount` decimal(10,2) NOT NULL DEFAULT '0',
	`tip` decimal(10,2) NOT NULL DEFAULT '0',
	`payment_type` varchar(50),
	`card_type` varchar(50),
	`customer_name` varchar(255),
	`revenue_center` varchar(100),
	`status` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `toast_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `toast_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(8) NOT NULL,
	`status` enum('success','error','partial') NOT NULL DEFAULT 'success',
	`orders_imported` int NOT NULL DEFAULT 0,
	`payments_imported` int NOT NULL DEFAULT 0,
	`error_message` text,
	`synced_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `toast_sync_log_id` PRIMARY KEY(`id`),
	CONSTRAINT `toast_sync_log_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE INDEX `toast_payments_date_idx` ON `toast_payments` (`date`);