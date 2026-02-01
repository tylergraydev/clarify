ALTER TABLE `projects` ADD `is_favorite` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `projects_is_favorite_idx` ON `projects` (`is_favorite`);