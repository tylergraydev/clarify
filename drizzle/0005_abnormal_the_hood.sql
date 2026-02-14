ALTER TABLE `conversation_messages` ADD `deleted_at` text;--> statement-breakpoint
ALTER TABLE `conversation_messages` ADD `is_compaction_summary` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `conversation_messages` ADD `is_deleted` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `conversation_messages` ADD `original_message_count` integer;--> statement-breakpoint
ALTER TABLE `conversation_messages` ADD `token_estimate` integer;--> statement-breakpoint
ALTER TABLE `conversations` ADD `compacted_at` text;--> statement-breakpoint
ALTER TABLE `conversations` ADD `fork_point_message_id` integer;--> statement-breakpoint
ALTER TABLE `conversations` ADD `fork_summary` text;--> statement-breakpoint
ALTER TABLE `conversations` ADD `is_compacted` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `conversations` ADD `parent_conversation_id` integer REFERENCES conversations(id);--> statement-breakpoint
ALTER TABLE `conversations` ADD `title_generated_by_ai` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `conversations_parent_id_idx` ON `conversations` (`parent_conversation_id`);