CREATE TABLE `diff_comments` (
	`content` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`end_line` integer,
	`file_path` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`is_resolved` integer DEFAULT false NOT NULL,
	`line_number` integer NOT NULL,
	`line_type` text DEFAULT 'new' NOT NULL,
	`parent_id` integer,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`workflow_id` integer NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `diff_comments_workflow_id_idx` ON `diff_comments` (`workflow_id`);--> statement-breakpoint
CREATE INDEX `diff_comments_file_path_idx` ON `diff_comments` (`workflow_id`,`file_path`);--> statement-breakpoint
CREATE INDEX `diff_comments_parent_id_idx` ON `diff_comments` (`parent_id`);--> statement-breakpoint
CREATE TABLE `file_view_state` (
	`file_path` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`viewed_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`workflow_id` integer NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `file_view_state_workflow_id_idx` ON `file_view_state` (`workflow_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `file_view_state_unique` ON `file_view_state` (`workflow_id`,`file_path`);