ALTER TABLE `autonomous_actions` MODIFY COLUMN `actionType` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `autonomous_actions` MODIFY COLUMN `status` enum('auto_executed','pending_approval','approved','rejected','undone','monitoring','execution_failed') NOT NULL;--> statement-breakpoint
ALTER TABLE `autonomous_actions` ADD `executionResult` json;