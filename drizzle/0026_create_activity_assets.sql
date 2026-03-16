-- Migration 0026: Create activity_assets table for the Activities page
-- Uses CREATE TABLE IF NOT EXISTS for safety (idempotent)
CREATE TABLE IF NOT EXISTS `activity_assets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `venueId` varchar(50) NOT NULL,
  `activityId` varchar(100) NOT NULL,
  `label` varchar(200),
  `period` varchar(100),
  `format` varchar(100),
  `imageUrl` varchar(500),
  `thumbnailUrl` varchar(500),
  `notes` text,
  `uploadedAt` timestamp DEFAULT (now()),
  `uploadedBy` varchar(100),
  PRIMARY KEY (`id`),
  INDEX `activity_venue_idx` (`activityId`, `venueId`)
);
