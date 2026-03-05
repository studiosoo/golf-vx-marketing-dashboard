CREATE TABLE `news_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`source` enum('hq','studio_soo') NOT NULL DEFAULT 'studio_soo',
	`category` enum('blog','announcement','promotion','program','event') NOT NULL DEFAULT 'blog',
	`status` enum('inbox','in_progress','published') NOT NULL DEFAULT 'inbox',
	`notes` text,
	`link` varchar(1024),
	`created_at` bigint NOT NULL DEFAULT 0,
	`updated_at` bigint NOT NULL DEFAULT 0,
	CONSTRAINT `news_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promo_leads` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`promo_id` bigint NOT NULL,
	`venue_id` int NOT NULL DEFAULT 1,
	`first_name` varchar(128) NOT NULL,
	`last_name` varchar(128) NOT NULL,
	`phone` varchar(32),
	`email` varchar(256) NOT NULL,
	`submitted_at` bigint NOT NULL,
	`encharge_status` enum('pending','synced','failed') NOT NULL DEFAULT 'pending',
	`synced_at` bigint,
	CONSTRAINT `promo_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promos` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`venue_id` int NOT NULL DEFAULT 1,
	`slug` varchar(128) NOT NULL,
	`title` varchar(256) NOT NULL,
	`offer_type` enum('free_session','discount','gift_card','trial','event','other') NOT NULL DEFAULT 'trial',
	`description` text,
	`status` enum('active','inactive','expired') NOT NULL DEFAULT 'inactive',
	`expires_at` bigint,
	`sqr_link_id` varchar(64),
	`sqr_link_slug` varchar(128),
	`sqr_short_url` varchar(256),
	`encharge_tag` varchar(128) NOT NULL DEFAULT 'Promo',
	`landing_url` varchar(512),
	`created_at` bigint NOT NULL DEFAULT 0,
	`updated_at` bigint NOT NULL DEFAULT 0,
	CONSTRAINT `promos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `news_items_status_idx` ON `news_items` (`status`);--> statement-breakpoint
CREATE INDEX `news_items_created_idx` ON `news_items` (`created_at`);--> statement-breakpoint
CREATE INDEX `promo_lead_promo_idx` ON `promo_leads` (`promo_id`);--> statement-breakpoint
CREATE INDEX `promo_lead_email_idx` ON `promo_leads` (`email`);--> statement-breakpoint
CREATE INDEX `promo_slug_idx` ON `promos` (`slug`);--> statement-breakpoint
CREATE INDEX `promo_venue_idx` ON `promos` (`venue_id`);