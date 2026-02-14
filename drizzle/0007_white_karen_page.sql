ALTER TABLE `diff_comments` ADD `github_author` text;--> statement-breakpoint
ALTER TABLE `diff_comments` ADD `github_comment_id` integer;--> statement-breakpoint
ALTER TABLE `diff_comments` ADD `github_pr_number` integer;--> statement-breakpoint
ALTER TABLE `diff_comments` ADD `github_synced_at` text;--> statement-breakpoint
CREATE INDEX `diff_comments_github_comment_id_idx` ON `diff_comments` (`github_comment_id`);