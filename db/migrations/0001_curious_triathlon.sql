ALTER TABLE `users` ADD `pending_email` text;--> statement-breakpoint
ALTER TABLE `users` ADD `pending_email_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `pending_email_token_expires` integer;--> statement-breakpoint
CREATE INDEX `idx_pending_email_token` ON `users` (`pending_email_token`);