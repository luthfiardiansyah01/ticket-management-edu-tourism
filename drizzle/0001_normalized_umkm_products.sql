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
CREATE INDEX `idx_products_kategori_status` ON `products` (`kategori_id`, `status_produk`);--> statement-breakpoint
CREATE INDEX `idx_products_status_produk` ON `products` (`status_produk`);--> statement-breakpoint
CREATE INDEX `idx_products_created_at` ON `products` (`created_at`);--> statement-breakpoint
INSERT INTO `product_categories` (`id`, `nama_kategori`, `slug`, `deskripsi`, `created_at`, `updated_at`) VALUES
	('cat-food', 'Makanan & Minuman', 'food', 'Kategori untuk produk kuliner UMKM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	('cat-craft', 'Kerajinan', 'craft', 'Kategori untuk produk kerajinan tangan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	('cat-fashion', 'Fashion', 'fashion', 'Kategori untuk produk fashion lokal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	('cat-souvenir', 'Souvenir', 'souvenir', 'Kategori untuk produk cendera mata', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	('cat-other', 'Lainnya', 'other', 'Kategori umum untuk produk lainnya', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT INTO `products` (`id`, `nama_produk`, `deskripsi`, `harga`, `stok`, `kategori_id`, `gambar`, `status_produk`, `created_at`, `updated_at`)
SELECT
	`id`,
	`name`,
	`description`,
	`price`,
	`stock`,
	CASE `category`
		WHEN 'food' THEN 'cat-food'
		WHEN 'craft' THEN 'cat-craft'
		WHEN 'fashion' THEN 'cat-fashion'
		WHEN 'souvenir' THEN 'cat-souvenir'
		ELSE 'cat-other'
	END,
	`image_url`,
	CASE WHEN `is_active` = 1 THEN 'active' ELSE 'inactive' END,
	COALESCE(`created_at`, CURRENT_TIMESTAMP),
	COALESCE(`updated_at`, CURRENT_TIMESTAMP)
FROM `umkm_products`;