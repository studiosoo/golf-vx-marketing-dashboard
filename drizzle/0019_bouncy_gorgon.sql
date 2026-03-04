CREATE TABLE `event_advertising` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`event_name` varchar(256) NOT NULL,
	`event_type` enum('trade_show','expo','sponsorship','community_event','golf_tournament','other') NOT NULL DEFAULT 'trade_show',
	`venue` varchar(256),
	`location` varchar(256),
	`event_date` date,
	`event_end_date` date,
	`event_ad_status` enum('upcoming','active','completed','cancelled') NOT NULL DEFAULT 'upcoming',
	`booth_cost` decimal(10,2),
	`total_cost` decimal(10,2),
	`expected_visitors` int,
	`actual_visitors` int,
	`promos_distributed` int,
	`leads_collected` int,
	`team_signups` int,
	`membership_signups` int,
	`revenue` decimal(10,2),
	`booth_size` varchar(64),
	`booth_number` varchar(32),
	`contact_person` varchar(128),
	`website` varchar(512),
	`notes` text,
	`created_at` bigint NOT NULL DEFAULT 0,
	`updated_at` bigint NOT NULL DEFAULT 0,
	CONSTRAINT `event_advertising_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `event_ad_status_idx` ON `event_advertising` (`event_ad_status`);--> statement-breakpoint
CREATE INDEX `event_ad_date_idx` ON `event_advertising` (`event_date`);