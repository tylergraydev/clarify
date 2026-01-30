CREATE TABLE `agent_hooks` (
	`agent_id` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`event_type` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`matcher` text,
	`order_index` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `agent_hooks_agent_id_idx` ON `agent_hooks` (`agent_id`);--> statement-breakpoint
CREATE INDEX `agent_hooks_event_type_idx` ON `agent_hooks` (`event_type`);--> statement-breakpoint
ALTER TABLE `agents` ADD `model` text;--> statement-breakpoint
ALTER TABLE `agents` ADD `permission_mode` text;