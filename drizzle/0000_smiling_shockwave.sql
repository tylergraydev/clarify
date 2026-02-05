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
CREATE TABLE `agent_skills` (
	`agent_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`required_at` text,
	`skill_name` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `agent_skills_agent_id_idx` ON `agent_skills` (`agent_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `agent_skills_unique_idx` ON `agent_skills` (`agent_id`,`skill_name`);--> statement-breakpoint
CREATE TABLE `agent_tools` (
	`agent_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`disallowed_at` text,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`tool_name` text NOT NULL,
	`tool_pattern` text DEFAULT '*' NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `agent_tools_agent_id_idx` ON `agent_tools` (`agent_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `agent_tools_unique_idx` ON `agent_tools` (`agent_id`,`tool_name`,`tool_pattern`);--> statement-breakpoint
CREATE TABLE `agents` (
	`built_in_at` text,
	`color` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`deactivated_at` text,
	`description` text,
	`display_name` text NOT NULL,
	`extended_thinking_enabled` integer DEFAULT false NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`max_thinking_tokens` integer,
	`model` text,
	`name` text NOT NULL,
	`parent_agent_id` integer,
	`permission_mode` text,
	`project_id` integer,
	`system_prompt` text NOT NULL,
	`type` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`parent_agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agents_name_unique` ON `agents` (`name`);--> statement-breakpoint
CREATE INDEX `agents_parent_agent_id_idx` ON `agents` (`parent_agent_id`);--> statement-breakpoint
CREATE INDEX `agents_project_id_idx` ON `agents` (`project_id`);--> statement-breakpoint
CREATE INDEX `agents_type_idx` ON `agents` (`type`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`after_state` text,
	`before_state` text,
	`event_category` text NOT NULL,
	`event_data` text,
	`event_type` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message` text NOT NULL,
	`severity` text DEFAULT 'info' NOT NULL,
	`source` text DEFAULT 'system' NOT NULL,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`workflow_id` integer,
	`workflow_step_id` integer,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workflow_step_id`) REFERENCES `workflow_steps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `audit_logs_event_category_idx` ON `audit_logs` (`event_category`);--> statement-breakpoint
CREATE INDEX `audit_logs_event_type_idx` ON `audit_logs` (`event_type`);--> statement-breakpoint
CREATE INDEX `audit_logs_timestamp_idx` ON `audit_logs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `audit_logs_workflow_id_idx` ON `audit_logs` (`workflow_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_workflow_step_id_idx` ON `audit_logs` (`workflow_step_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_workflow_timestamp_idx` ON `audit_logs` (`workflow_id`,`timestamp`);--> statement-breakpoint
CREATE TABLE `discovered_files` (
	`action` text DEFAULT 'modify' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`description` text,
	`file_path` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`included_at` text,
	`order_index` integer DEFAULT 0 NOT NULL,
	`original_priority` text,
	`priority` text DEFAULT 'medium' NOT NULL,
	`relevance_explanation` text,
	`role` text,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`workflow_step_id` integer NOT NULL,
	FOREIGN KEY (`workflow_step_id`) REFERENCES `workflow_steps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `discovered_files_priority_idx` ON `discovered_files` (`priority`);--> statement-breakpoint
CREATE INDEX `discovered_files_workflow_step_id_idx` ON `discovered_files` (`workflow_step_id`);--> statement-breakpoint
CREATE TABLE `implementation_plans` (
	`approved_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`estimated_duration_ms` integer,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`raw_plan_text` text NOT NULL,
	`summary` text,
	`title` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`workflow_id` integer NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `implementation_plans_workflow_id_unique` ON `implementation_plans` (`workflow_id`);--> statement-breakpoint
CREATE INDEX `implementation_plans_workflow_id_idx` ON `implementation_plans` (`workflow_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`archived_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`description` text,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`name` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `projects_archived_at_idx` ON `projects` (`archived_at`);--> statement-breakpoint
CREATE INDEX `projects_created_at_idx` ON `projects` (`created_at`);--> statement-breakpoint
CREATE INDEX `projects_is_favorite_idx` ON `projects` (`is_favorite`);--> statement-breakpoint
CREATE TABLE `repositories` (
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`default_branch` text DEFAULT 'main' NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`project_id` integer NOT NULL,
	`remote_url` text,
	`set_as_default_at` text,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `repositories_path_idx` ON `repositories` (`path`);--> statement-breakpoint
CREATE INDEX `repositories_project_id_idx` ON `repositories` (`project_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`category` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`default_value` text,
	`description` text,
	`display_name` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`user_modified_at` text,
	`value` text NOT NULL,
	`value_type` text DEFAULT 'string' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE INDEX `settings_category_idx` ON `settings` (`category`);--> statement-breakpoint
CREATE TABLE `template_placeholders` (
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`default_value` text,
	`description` text,
	`display_name` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`required_at` text,
	`template_id` integer NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`validation_pattern` text,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `template_placeholders_template_id_idx` ON `template_placeholders` (`template_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `template_placeholders_template_id_name_idx` ON `template_placeholders` (`template_id`,`name`);--> statement-breakpoint
CREATE TABLE `templates` (
	`built_in_at` text,
	`category` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`deactivated_at` text,
	`description` text,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`template_text` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `templates_name_unique` ON `templates` (`name`);--> statement-breakpoint
CREATE INDEX `templates_category_idx` ON `templates` (`category`);--> statement-breakpoint
CREATE TABLE `workflow_repositories` (
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repository_id` integer NOT NULL,
	`set_primary_at` text,
	`workflow_id` integer NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workflow_repositories_repository_id_idx` ON `workflow_repositories` (`repository_id`);--> statement-breakpoint
CREATE INDEX `workflow_repositories_workflow_id_idx` ON `workflow_repositories` (`workflow_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workflow_repositories_unique_idx` ON `workflow_repositories` (`workflow_id`,`repository_id`);--> statement-breakpoint
CREATE TABLE `workflow_steps` (
	`agent_id` integer,
	`completed_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`description` text,
	`duration_ms` integer,
	`error_message` text,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`input_text` text,
	`output_edited_at` text,
	`output_structured` text,
	`output_text` text,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`started_at` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`step_number` integer NOT NULL,
	`step_type` text NOT NULL,
	`title` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`workflow_id` integer NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workflow_steps_agent_id_idx` ON `workflow_steps` (`agent_id`);--> statement-breakpoint
CREATE INDEX `workflow_steps_status_idx` ON `workflow_steps` (`status`);--> statement-breakpoint
CREATE INDEX `workflow_steps_workflow_id_idx` ON `workflow_steps` (`workflow_id`);--> statement-breakpoint
CREATE INDEX `workflow_steps_workflow_id_step_number_idx` ON `workflow_steps` (`workflow_id`,`step_number`);--> statement-breakpoint
CREATE TABLE `workflows` (
	`clarification_agent_id` integer,
	`completed_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`current_step_number` integer DEFAULT 0,
	`duration_ms` integer,
	`error_message` text,
	`feature_name` text NOT NULL,
	`feature_request` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pause_behavior` text DEFAULT 'auto_pause' NOT NULL,
	`project_id` integer NOT NULL,
	`skip_clarification` integer DEFAULT false NOT NULL,
	`started_at` text,
	`status` text DEFAULT 'created' NOT NULL,
	`total_steps` integer,
	`type` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`worktree_id` integer,
	FOREIGN KEY (`clarification_agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workflows_project_id_idx` ON `workflows` (`project_id`);--> statement-breakpoint
CREATE INDEX `workflows_status_idx` ON `workflows` (`status`);--> statement-breakpoint
CREATE INDEX `workflows_status_type_created_idx` ON `workflows` (`status`,`type`,`created_at`);--> statement-breakpoint
CREATE INDEX `workflows_type_idx` ON `workflows` (`type`);--> statement-breakpoint
CREATE INDEX `workflows_worktree_id_idx` ON `workflows` (`worktree_id`);--> statement-breakpoint
CREATE TABLE `worktrees` (
	`branch_name` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`repository_id` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`workflow_id` integer,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `worktrees_path_unique` ON `worktrees` (`path`);--> statement-breakpoint
CREATE UNIQUE INDEX `worktrees_workflow_id_unique` ON `worktrees` (`workflow_id`);--> statement-breakpoint
CREATE INDEX `worktrees_repository_id_idx` ON `worktrees` (`repository_id`);--> statement-breakpoint
CREATE INDEX `worktrees_status_idx` ON `worktrees` (`status`);