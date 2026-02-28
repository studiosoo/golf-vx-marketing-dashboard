CREATE TABLE `cf_form_submissions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`cf_id` bigint NOT NULL,
	`cf_public_id` varchar(32) NOT NULL,
	`contact_id` bigint,
	`workspace_id` bigint NOT NULL,
	`page_id` bigint,
	`page_name` varchar(512),
	`page_step` varchar(512),
	`funnel_id` bigint,
	`funnel_name` varchar(512),
	`email` varchar(512),
	`first_name` varchar(256),
	`last_name` varchar(256),
	`phone` varchar(64),
	`city` varchar(256),
	`state` varchar(64),
	`golf_level` varchar(128),
	`form_data` json,
	`submitted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cf_form_submissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `cf_form_submissions_cf_id_unique` UNIQUE(`cf_id`)
);
--> statement-breakpoint
CREATE TABLE `cf_funnels` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`cf_id` bigint NOT NULL,
	`cf_public_id` varchar(32) NOT NULL,
	`workspace_id` bigint NOT NULL,
	`name` varchar(512) NOT NULL,
	`current_path` varchar(512),
	`archived` boolean DEFAULT false,
	`live_mode` boolean DEFAULT false,
	`tags` json,
	`opt_in_count` int DEFAULT 0,
	`order_count` int DEFAULT 0,
	`last_synced_at` timestamp DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cf_funnels_id` PRIMARY KEY(`id`),
	CONSTRAINT `cf_funnels_cf_id_unique` UNIQUE(`cf_id`)
);
--> statement-breakpoint
CREATE INDEX `cf_form_submissions_cf_id_idx` ON `cf_form_submissions` (`cf_id`);--> statement-breakpoint
CREATE INDEX `cf_form_submissions_funnel_id_idx` ON `cf_form_submissions` (`funnel_id`);--> statement-breakpoint
CREATE INDEX `cf_form_submissions_page_id_idx` ON `cf_form_submissions` (`page_id`);--> statement-breakpoint
CREATE INDEX `cf_form_submissions_submitted_at_idx` ON `cf_form_submissions` (`submitted_at`);--> statement-breakpoint
CREATE INDEX `cf_funnels_cf_id_idx` ON `cf_funnels` (`cf_id`);--> statement-breakpoint
CREATE INDEX `cf_funnels_archived_idx` ON `cf_funnels` (`archived`);