CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`package_id` text NOT NULL,
	`visit_date` text NOT NULL,
	`quantity` integer NOT NULL,
	`total_price` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`package_id`) REFERENCES `ticket_packages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bookings_user` ON `bookings` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_bookings_package` ON `bookings` (`package_id`);--> statement-breakpoint
CREATE INDEX `idx_bookings_date` ON `bookings` (`visit_date`);--> statement-breakpoint
CREATE INDEX `idx_bookings_status` ON `bookings` (`status`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`provider` text NOT NULL,
	`payment_status` text DEFAULT 'pending',
	`external_ref` text,
	`paid_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_booking_id_unique` ON `payments` (`booking_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_booking` ON `payments` (`booking_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_status` ON `payments` (`payment_status`);--> statement-breakpoint
CREATE TABLE `qr_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`qr_token` text NOT NULL,
	`is_checked_in` integer DEFAULT false,
	`checked_in_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `qr_tickets_qr_token_unique` ON `qr_tickets` (`qr_token`);--> statement-breakpoint
CREATE INDEX `idx_tickets_booking` ON `qr_tickets` (`booking_id`);--> statement-breakpoint
CREATE INDEX `idx_tickets_token` ON `qr_tickets` (`qr_token`);--> statement-breakpoint
CREATE INDEX `idx_tickets_checkin` ON `qr_tickets` (`is_checked_in`);--> statement-breakpoint
CREATE TABLE `ticket_packages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`base_price` integer NOT NULL,
	`promo_price` integer,
	`quota_per_day` integer DEFAULT 50 NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_packages_active` ON `ticket_packages` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_packages_category` ON `ticket_packages` (`category`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);