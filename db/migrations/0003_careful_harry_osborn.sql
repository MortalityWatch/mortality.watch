CREATE TABLE `invite_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`created_by` integer,
	`max_uses` integer DEFAULT 1 NOT NULL,
	`current_uses` integer DEFAULT 0 NOT NULL,
	`expires_at` integer,
	`grants_pro_until` integer,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invite_codes_code_unique` ON `invite_codes` (`code`);--> statement-breakpoint
CREATE INDEX `idx_invite_codes_code` ON `invite_codes` (`code`);--> statement-breakpoint
CREATE INDEX `idx_invite_codes_active` ON `invite_codes` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_invite_codes_expires` ON `invite_codes` (`expires_at`);--> statement-breakpoint
ALTER TABLE `users` ADD `invited_by_code_id` integer REFERENCES invite_codes(id);