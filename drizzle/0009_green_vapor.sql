CREATE TABLE `market_research_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`topic` varchar(255) NOT NULL,
	`category` enum('b2b_corporate_events','local_demographics','competitor_analysis','seasonal_trends','membership_pricing','custom') NOT NULL DEFAULT 'custom',
	`status` enum('generating','ready','archived') NOT NULL DEFAULT 'generating',
	`summary` text,
	`key_findings` json,
	`opportunities` json,
	`risks` json,
	`recommended_actions` json,
	`sources` json,
	`linked_campaign_ids` json,
	`generated_by` varchar(100) NOT NULL DEFAULT 'ai',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `market_research_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `research_category_idx` ON `market_research_reports` (`category`);--> statement-breakpoint
CREATE INDEX `research_status_idx` ON `market_research_reports` (`status`);--> statement-breakpoint
CREATE INDEX `research_created_idx` ON `market_research_reports` (`created_at`);