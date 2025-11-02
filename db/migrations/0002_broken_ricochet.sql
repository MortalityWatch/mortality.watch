CREATE TABLE `data_quality_overrides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`iso3c` text NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'monitor' NOT NULL,
	`notes` text,
	`updated_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_data_quality_unique` ON `data_quality_overrides` (`iso3c`,`source`);--> statement-breakpoint
CREATE INDEX `idx_data_quality_status` ON `data_quality_overrides` (`status`);