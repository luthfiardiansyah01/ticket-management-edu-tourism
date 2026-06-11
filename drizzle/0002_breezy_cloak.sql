CREATE TABLE `product_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`nama_kategori` text NOT NULL,
	`slug` text NOT NULL,
	`deskripsi` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_categories_slug_unique` ON `product_categories` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_product_categories_slug` ON `product_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`nama_produk` text NOT NULL,
	`deskripsi` text NOT NULL,
	`harga` integer NOT NULL,
	`stok` integer DEFAULT 0 NOT NULL,
	`kategori_id` text NOT NULL,
	`gambar` text,
	`status_produk` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`kategori_id`) REFERENCES `product_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_products_nama_produk` ON `products` (`nama_produk`);--> statement-breakpoint
CREATE INDEX `idx_products_kategori_id` ON `products` (`kategori_id`);--> statement-breakpoint
CREATE INDEX `idx_products_kategori_status` ON `products` (`kategori_id`,`status_produk`);--> statement-breakpoint
CREATE INDEX `idx_products_status_produk` ON `products` (`status_produk`);--> statement-breakpoint
CREATE INDEX `idx_products_created_at` ON `products` (`created_at`);--> statement-breakpoint
DROP INDEX "idx_bookings_user";--> statement-breakpoint
DROP INDEX "idx_bookings_package";--> statement-breakpoint
DROP INDEX "idx_bookings_date";--> statement-breakpoint
DROP INDEX "idx_bookings_status";--> statement-breakpoint
DROP INDEX "payments_booking_id_unique";--> statement-breakpoint
DROP INDEX "idx_payments_booking";--> statement-breakpoint
DROP INDEX "idx_payments_status";--> statement-breakpoint
DROP INDEX "product_categories_slug_unique";--> statement-breakpoint
DROP INDEX "idx_product_categories_slug";--> statement-breakpoint
DROP INDEX "idx_products_nama_produk";--> statement-breakpoint
DROP INDEX "idx_products_kategori_id";--> statement-breakpoint
DROP INDEX "idx_products_kategori_status";--> statement-breakpoint
DROP INDEX "idx_products_status_produk";--> statement-breakpoint
DROP INDEX "idx_products_created_at";--> statement-breakpoint
DROP INDEX "qr_tickets_qr_token_unique";--> statement-breakpoint
DROP INDEX "idx_tickets_booking";--> statement-breakpoint
DROP INDEX "idx_tickets_token";--> statement-breakpoint
DROP INDEX "idx_tickets_checkin";--> statement-breakpoint
DROP INDEX "idx_packages_active";--> statement-breakpoint
DROP INDEX "idx_packages_category";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
DROP INDEX "idx_users_email";--> statement-breakpoint
DROP INDEX "idx_users_role";--> statement-breakpoint
ALTER TABLE `bookings` ALTER COLUMN "created_at" TO "created_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
CREATE INDEX `idx_bookings_user` ON `bookings` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_bookings_package` ON `bookings` (`package_id`);--> statement-breakpoint
CREATE INDEX `idx_bookings_date` ON `bookings` (`visit_date`);--> statement-breakpoint
CREATE INDEX `idx_bookings_status` ON `bookings` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_booking_id_unique` ON `payments` (`booking_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_booking` ON `payments` (`booking_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_status` ON `payments` (`payment_status`);--> statement-breakpoint
CREATE UNIQUE INDEX `qr_tickets_qr_token_unique` ON `qr_tickets` (`qr_token`);--> statement-breakpoint
CREATE INDEX `idx_tickets_booking` ON `qr_tickets` (`booking_id`);--> statement-breakpoint
CREATE INDEX `idx_tickets_token` ON `qr_tickets` (`qr_token`);--> statement-breakpoint
CREATE INDEX `idx_tickets_checkin` ON `qr_tickets` (`is_checked_in`);--> statement-breakpoint
CREATE INDEX `idx_packages_active` ON `ticket_packages` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_packages_category` ON `ticket_packages` (`category`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);--> statement-breakpoint
ALTER TABLE `payments` ALTER COLUMN "payment_status" TO "payment_status" text NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `payments` ALTER COLUMN "created_at" TO "created_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `qr_tickets` ALTER COLUMN "is_checked_in" TO "is_checked_in" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `qr_tickets` ALTER COLUMN "created_at" TO "created_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `ticket_packages` ALTER COLUMN "is_active" TO "is_active" integer NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `ticket_packages` ALTER COLUMN "created_at" TO "created_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "created_at" TO "created_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP;