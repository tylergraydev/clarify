ALTER TABLE `agents` ADD `provider` text DEFAULT 'claude';--> statement-breakpoint
ALTER TABLE `conversations` ADD `model` text;--> statement-breakpoint
ALTER TABLE `conversations` ADD `provider` text DEFAULT 'claude';