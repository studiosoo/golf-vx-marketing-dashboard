CREATE TABLE `encharge_broadcasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`broadcast_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'draft',
	`email_id` int,
	`subject` varchar(500),
	`from_email` varchar(255),
	`from_name` varchar(255),
	`segment_id` int,
	`segment_name` varchar(255),
	`send_at` timestamp,
	`delivered` int DEFAULT 0,
	`opens` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`bounces` int DEFAULT 0,
	`unsubscribes` int DEFAULT 0,
	`spam` int DEFAULT 0,
	`open_rate` decimal(5,2),
	`click_rate` decimal(5,2),
	`click_to_open_rate` decimal(5,2),
	`last_synced_at` timestamp DEFAULT (now()),
	`metrics_stale` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `encharge_broadcasts_id` PRIMARY KEY(`id`),
	CONSTRAINT `encharge_broadcasts_broadcast_id_unique` UNIQUE(`broadcast_id`)
);
--> statement-breakpoint
CREATE INDEX `encharge_broadcasts_broadcast_id_idx` ON `encharge_broadcasts` (`broadcast_id`);--> statement-breakpoint
CREATE INDEX `encharge_broadcasts_status_idx` ON `encharge_broadcasts` (`status`);--> statement-breakpoint
CREATE INDEX `encharge_broadcasts_send_at_idx` ON `encharge_broadcasts` (`send_at`);