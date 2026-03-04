CREATE TABLE `community_outreach` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`org_name` varchar(512) NOT NULL,
	`org_type` enum('school_pta','school_sports','nonprofit','civic','arts_culture','sports_league','religious','business','other') NOT NULL DEFAULT 'other',
	`contact_name` varchar(256),
	`contact_email` varchar(512),
	`contact_phone` varchar(64),
	`website` varchar(512),
	`ein` varchar(32),
	`is_501c3` boolean DEFAULT false,
	`request_type` enum('cash_donation','gift_card','product_donation','service_donation','sponsorship','partnership','networking') NOT NULL DEFAULT 'gift_card',
	`request_date` date,
	`event_name` varchar(512),
	`event_date` date,
	`event_location` varchar(512),
	`estimated_attendees` int,
	`requested_amount` decimal(10,2),
	`request_description` text,
	`status` enum('received','under_review','approved','rejected','fulfilled','follow_up') NOT NULL DEFAULT 'received',
	`decision_date` date,
	`decision_notes` text,
	`rejection_reason` varchar(512),
	`actual_donation_type` varchar(256),
	`actual_cash_value` decimal(10,2) DEFAULT '0',
	`actual_perceived_value` decimal(10,2) DEFAULT '0',
	`benefits_received` text,
	`estimated_reach` int,
	`actual_leads_generated` int,
	`actual_bookings_generated` int,
	`actual_revenue` decimal(10,2),
	`roi_notes` text,
	`is_recurring` boolean DEFAULT false,
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`tags` json,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_outreach_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `influencer_partnerships` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`handle` varchar(128) NOT NULL,
	`platform` enum('instagram','tiktok','youtube','facebook','other') NOT NULL DEFAULT 'instagram',
	`follower_count` int,
	`contact_name` varchar(256),
	`contact_email` varchar(512),
	`contact_phone` varchar(64),
	`deal_date` date,
	`total_cost` decimal(10,2) DEFAULT '0',
	`deliverables` text,
	`campaign_goal` varchar(512),
	`target_audience` varchar(512),
	`status` enum('negotiating','contracted','in_progress','completed','cancelled') NOT NULL DEFAULT 'contracted',
	`actual_reach` int,
	`actual_impressions` int,
	`actual_engagements` int,
	`actual_link_clicks` int,
	`actual_leads_generated` int,
	`actual_bookings_generated` int,
	`actual_revenue` decimal(10,2),
	`content_urls` json,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `influencer_partnerships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `outreach_org_name_idx` ON `community_outreach` (`org_name`);--> statement-breakpoint
CREATE INDEX `outreach_status_idx` ON `community_outreach` (`status`);--> statement-breakpoint
CREATE INDEX `outreach_request_date_idx` ON `community_outreach` (`request_date`);--> statement-breakpoint
CREATE INDEX `outreach_event_date_idx` ON `community_outreach` (`event_date`);--> statement-breakpoint
CREATE INDEX `outreach_org_type_idx` ON `community_outreach` (`org_type`);--> statement-breakpoint
CREATE INDEX `influencer_handle_idx` ON `influencer_partnerships` (`handle`);--> statement-breakpoint
CREATE INDEX `influencer_status_idx` ON `influencer_partnerships` (`status`);--> statement-breakpoint
CREATE INDEX `influencer_deal_date_idx` ON `influencer_partnerships` (`deal_date`);