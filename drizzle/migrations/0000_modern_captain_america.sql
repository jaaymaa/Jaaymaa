CREATE TABLE `admin_broadcasts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`url` text NOT NULL,
	`target_count` integer DEFAULT 0 NOT NULL,
	`delivered_count` integer DEFAULT 0 NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`sent_by_phone` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_admin_broadcasts_created` ON `admin_broadcasts` (`created_at`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`options` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_order_items_order_id` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`public_token` text NOT NULL,
	`shop_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`delivery_address` text NOT NULL,
	`note` text,
	`payment_method` text DEFAULT 'cash' NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`subtotal` integer NOT NULL,
	`delivery_fee` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'NEW' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_reference_unique` ON `orders` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_public_token_unique` ON `orders` (`public_token`);--> statement-breakpoint
CREATE INDEX `idx_orders_shop_status_created` ON `orders` (`shop_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_shop_created` ON `orders` (`shop_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_customer_phone` ON `orders` (`customer_phone`);--> statement-breakpoint
CREATE INDEX `idx_orders_public_token` ON `orders` (`public_token`);--> statement-breakpoint
CREATE INDEX `idx_orders_reference` ON `orders` (`reference`);--> statement-breakpoint
CREATE TABLE `platform_settings` (
	`id` text PRIMARY KEY DEFAULT 'global' NOT NULL,
	`explorer_enabled` integer DEFAULT true NOT NULL,
	`maintenance_enabled` integer DEFAULT false NOT NULL,
	`pro_price_xof` integer DEFAULT 1000 NOT NULL,
	`pro_plus_price_xof` integer DEFAULT 10000 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`url` text NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_product_images_product_pos` ON `product_images` (`product_id`,`position`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`shopId` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price` integer NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`options_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_products_shop_status_pos` ON `products` (`shopId`,`status`,`position`);--> statement-breakpoint
CREATE INDEX `idx_products_shop_position` ON `products` (`shopId`,`position`);--> statement-breakpoint
CREATE INDEX `idx_products_created_at` ON `products` (`created_at`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_endpoint_unique` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `idx_push_subs_user_id` ON `push_subscriptions` (`user_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_sessions_user_id` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_token_hash` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expires_at` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `shop_visits` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`visited_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_shop_visits_shop_visited` ON `shop_visits` (`shop_id`,`visited_at`);--> statement-breakpoint
CREATE TABLE `shops` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`headline` text DEFAULT '' NOT NULL,
	`area` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text,
	`theme_color` text DEFAULT '#C8265A' NOT NULL,
	`whatsapp` text,
	`wave_number` text,
	`wave_payment_link` text,
	`orange_money_number` text,
	`accepts_cash` integer DEFAULT true NOT NULL,
	`delivery_fee` integer DEFAULT 0 NOT NULL,
	`delivery_note` text,
	`logo_url` text,
	`cover_url` text,
	`facebook_pixel_id` text,
	`tiktok_pixel_id` text,
	`rating` real DEFAULT 0 NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`plan_expires_at` integer,
	`pro_reminder_3days_sent_at` integer,
	`pro_reminder_1day_sent_at` integer,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shops_slug_unique` ON `shops` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_shops_owner_id` ON `shops` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_shops_slug` ON `shops` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_shops_status_featured_created` ON `shops` (`status`,`featured`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_shops_category` ON `shops` (`category`);--> statement-breakpoint
CREATE INDEX `idx_shops_area` ON `shops` (`area`);--> statement-breakpoint
CREATE TABLE `subscription_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`reference` text,
	`provider_transaction_id` text,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'XOF' NOT NULL,
	`method` text NOT NULL,
	`plan` text DEFAULT 'pro' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`paid_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_payments_reference_unique` ON `subscription_payments` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_payments_provider_transaction_id_unique` ON `subscription_payments` (`provider_transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_sub_payments_shop_created` ON `subscription_payments` (`shop_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_sub_payments_status_created` ON `subscription_payments` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`password_hash` text,
	`role` text DEFAULT 'seller' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);