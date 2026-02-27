CREATE TABLE `membership_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`member_id` int,
	`name` varchar(255),
	`event_type` enum('joined','cancelled','upgraded','downgraded','paused','resumed','tier_changed','payment_failed','payment_recovered','renewed') NOT NULL,
	`tier` enum('all_access_aces','swing_savers','golf_vx_pro','trial','none'),
	`plan` enum('monthly','annual'),
	`amount` decimal(10,2),
	`previous_tier` enum('all_access_aces','swing_savers','golf_vx_pro','trial','none'),
	`previous_plan` enum('monthly','annual'),
	`previous_amount` decimal(10,2),
	`event_timestamp` timestamp NOT NULL,
	`processed_at` timestamp DEFAULT (now()),
	`source` enum('make_com','manual','backfill','api') DEFAULT 'make_com',
	`webhook_payload` json,
	`encharge_tagged` boolean DEFAULT false,
	`encharge_tagged_at` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `membership_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `membership_events_email_idx` ON `membership_events` (`email`);--> statement-breakpoint
CREATE INDEX `membership_events_member_id_idx` ON `membership_events` (`member_id`);--> statement-breakpoint
CREATE INDEX `membership_events_event_type_idx` ON `membership_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `membership_events_event_timestamp_idx` ON `membership_events` (`event_timestamp`);