CREATE TABLE `agent_activity` (
	`cache_creation_input_tokens` integer,
	`cache_read_input_tokens` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`duration_ms` integer,
	`estimated_cost` real,
	`event_type` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`phase` text,
	`started_at` integer,
	`stopped_at` integer,
	`text_delta` text,
	`thinking_block_index` integer,
	`tool_input` text,
	`tool_name` text,
	`tool_use_id` text,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`workflow_step_id` integer NOT NULL,
	FOREIGN KEY (`workflow_step_id`) REFERENCES `workflow_steps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `agent_activity_event_type_idx` ON `agent_activity` (`event_type`);--> statement-breakpoint
CREATE INDEX `agent_activity_workflow_step_id_event_type_idx` ON `agent_activity` (`workflow_step_id`,`event_type`);--> statement-breakpoint
CREATE INDEX `agent_activity_workflow_step_id_idx` ON `agent_activity` (`workflow_step_id`);