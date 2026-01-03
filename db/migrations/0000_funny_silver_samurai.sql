CREATE TABLE `charts` (
	`id` text PRIMARY KEY NOT NULL,
	`config` text NOT NULL,
	`page` text DEFAULT 'explorer' NOT NULL,
	`create_count` integer DEFAULT 1 NOT NULL,
	`access_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_accessed_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_charts_page` ON `charts` (`page`);--> statement-breakpoint
CREATE INDEX `idx_charts_created` ON `charts` (`created_at`);--> statement-breakpoint
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
CREATE INDEX `idx_data_quality_status` ON `data_quality_overrides` (`status`);--> statement-breakpoint
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
CREATE TABLE `saved_charts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`chart_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`thumbnail_url` text,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`slug` text,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chart_id`) REFERENCES `charts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `saved_charts_slug_unique` ON `saved_charts` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_saved_charts_user` ON `saved_charts` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_saved_charts_chart` ON `saved_charts` (`chart_id`);--> statement-breakpoint
CREATE INDEX `idx_saved_charts_featured` ON `saved_charts` (`is_featured`);--> statement-breakpoint
CREATE INDEX `idx_saved_charts_public` ON `saved_charts` (`is_public`);--> statement-breakpoint
CREATE INDEX `idx_saved_charts_slug` ON `saved_charts` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_saved_charts_created` ON `saved_charts` (`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expires` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`status` text DEFAULT 'inactive' NOT NULL,
	`plan` text,
	`plan_price_id` text,
	`current_period_start` integer,
	`current_period_end` integer,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`canceled_at` integer,
	`trial_end` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_user_id_unique` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_stripe_customer_id_unique` ON `subscriptions` (`stripe_customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_stripe_subscription_id_unique` ON `subscriptions` (`stripe_subscription_id`);--> statement-breakpoint
CREATE INDEX `idx_subscriptions_user` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_subscriptions_stripe_customer` ON `subscriptions` (`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `idx_subscriptions_stripe_subscription` ON `subscriptions` (`stripe_subscription_id`);--> statement-breakpoint
CREATE INDEX `idx_subscriptions_status` ON `subscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_subscriptions_period_end` ON `subscriptions` (`current_period_end`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`display_name` text,
	`name` text,
	`role` text DEFAULT 'user' NOT NULL,
	`tier` integer DEFAULT 1 NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`verification_token` text,
	`verification_token_expires` integer,
	`password_reset_token` text,
	`password_reset_token_expires` integer,
	`google_id` text,
	`twitter_id` text,
	`profile_picture_url` text,
	`tos_accepted_at` integer,
	`last_login` integer,
	`invited_by_code_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`invited_by_code_id`) REFERENCES `invite_codes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_id_unique` ON `users` (`google_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_twitter_id_unique` ON `users` (`twitter_id`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_tier` ON `users` (`tier`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `idx_verification_token` ON `users` (`verification_token`);--> statement-breakpoint
CREATE INDEX `idx_password_reset_token` ON `users` (`password_reset_token`);--> statement-breakpoint
CREATE INDEX `idx_users_google_id` ON `users` (`google_id`);--> statement-breakpoint
CREATE INDEX `idx_users_twitter_id` ON `users` (`twitter_id`);--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stripe_event_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload` text NOT NULL,
	`processed` integer DEFAULT false NOT NULL,
	`processing_error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`processed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `webhook_events_stripe_event_id_unique` ON `webhook_events` (`stripe_event_id`);--> statement-breakpoint
CREATE INDEX `idx_webhook_events_stripe_id` ON `webhook_events` (`stripe_event_id`);--> statement-breakpoint
CREATE INDEX `idx_webhook_events_type` ON `webhook_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `idx_webhook_events_processed` ON `webhook_events` (`processed`);--> statement-breakpoint
CREATE INDEX `idx_webhook_events_created` ON `webhook_events` (`created_at`);