CREATE TABLE `print_advertising` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`vendor_name` varchar(256) NOT NULL,
	`publication_type` enum('magazine','newspaper','flyer','billboard','direct_mail','other') NOT NULL DEFAULT 'magazine',
	`ad_size` varchar(128),
	`cost_per_month` decimal(10,2) NOT NULL,
	`contract_months` int NOT NULL DEFAULT 1,
	`total_contract_value` decimal(10,2),
	`start_date` date,
	`end_date` date,
	`print_ad_status` enum('active','completed','cancelled','negotiating') NOT NULL DEFAULT 'active',
	`qr_destination` varchar(512),
	`qr_code_url` varchar(512),
	`instagram_handle` varchar(128),
	`website` varchar(512),
	`circulation` int,
	`target_area` varchar(256),
	`notes` text,
	`created_at` bigint NOT NULL DEFAULT 0,
	`updated_at` bigint NOT NULL DEFAULT 0,
	CONSTRAINT `print_advertising_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `print_ad_status_idx` ON `print_advertising` (`print_ad_status`);--> statement-breakpoint
CREATE INDEX `print_ad_start_date_idx` ON `print_advertising` (`start_date`);