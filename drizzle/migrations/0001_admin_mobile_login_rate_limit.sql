CREATE TABLE `admin_mobile_login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`window_started_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_admin_mobile_login_attempts_window` ON `admin_mobile_login_attempts` (`window_started_at`);