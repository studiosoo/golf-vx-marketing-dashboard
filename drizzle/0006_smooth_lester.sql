CREATE TABLE `pro_member_billing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int NOT NULL,
	`billing_month` varchar(7) NOT NULL,
	`base_fee` decimal(8,2) NOT NULL DEFAULT '500',
	`session_count` int NOT NULL DEFAULT 0,
	`bay_credit_total` decimal(8,2) NOT NULL DEFAULT '0',
	`overage_hrs` decimal(6,2) NOT NULL DEFAULT '0',
	`overage_amount` decimal(8,2) NOT NULL DEFAULT '0',
	`net_bill` decimal(8,2) NOT NULL DEFAULT '500',
	`stripe_payment_intent_id` varchar(255),
	`stripe_status` enum('pending','paid','failed','refunded','waived') NOT NULL DEFAULT 'pending',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pro_member_billing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pro_member_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`member_id` int NOT NULL,
	`session_date` date NOT NULL,
	`session_type` enum('bay_usage','lesson','clinic','practice') NOT NULL DEFAULT 'bay_usage',
	`bay_number` varchar(20),
	`duration_hrs` decimal(4,2) NOT NULL DEFAULT '1',
	`credit_applied` decimal(8,2) NOT NULL DEFAULT '25',
	`notes` text,
	`toast_order_id` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pro_member_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pro_member_billing` ADD CONSTRAINT `pro_member_billing_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pro_member_sessions` ADD CONSTRAINT `pro_member_sessions_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `pro_billing_member_month_idx` ON `pro_member_billing` (`member_id`,`billing_month`);--> statement-breakpoint
CREATE INDEX `pro_billing_member_idx` ON `pro_member_billing` (`member_id`);--> statement-breakpoint
CREATE INDEX `pro_sessions_member_idx` ON `pro_member_sessions` (`member_id`);--> statement-breakpoint
CREATE INDEX `pro_sessions_date_idx` ON `pro_member_sessions` (`session_date`);