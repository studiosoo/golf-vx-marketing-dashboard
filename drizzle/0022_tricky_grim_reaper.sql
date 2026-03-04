CREATE TABLE `meta_ads_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaign_id` varchar(64) NOT NULL,
	`campaign_name` varchar(256) NOT NULL,
	`override_status` enum('active','completed','archived') NOT NULL,
	`overridden_at` bigint NOT NULL DEFAULT 0,
	`updated_at` bigint NOT NULL DEFAULT 0,
	CONSTRAINT `meta_ads_overrides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `meta_ads_overrides_campaign_id_idx` ON `meta_ads_overrides` (`campaign_id`);