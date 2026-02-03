ALTER TABLE `agents` ADD `extended_thinking_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `agents` ADD `max_thinking_tokens` integer;