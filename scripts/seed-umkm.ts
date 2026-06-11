import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

type SeedCategory = {
  id: string;
  nama_kategori: string;
  slug: string;
  deskripsi: string;
};

type SeedProduct = {
  id: string;
  nama_produk: string;
  deskripsi: string;
  harga: number;
  stok: number;
  kategori_id: string;
  gambar: string;
  status_produk: 'active' | 'inactive' | 'draft';
};

const categories: SeedCategory[] = [
  {
    id: 'cat-food',
    nama_kategori: 'Makanan & Minuman',
    slug: 'food',
    deskripsi: 'Produk kuliner UMKM lokal',
  },
  {
    id: 'cat-craft',
    nama_kategori: 'Kerajinan',
    slug: 'craft',
    deskripsi: 'Produk kerajinan tangan dan karya lokal',
  },
  {
    id: 'cat-fashion',
    nama_kategori: 'Fashion',
    slug: 'fashion',
    deskripsi: 'Produk fashion lokal',
  },
  {
    id: 'cat-souvenir',
    nama_kategori: 'Souvenir',
    slug: 'souvenir',
    deskripsi: 'Cendera mata dan merchandise',
  },
  {
    id: 'cat-other',
    nama_kategori: 'Lainnya',
    slug: 'other',
    deskripsi: 'Kategori umum untuk produk lain',
  },
];

const products: SeedProduct[] = [
  {
    id: 'umkm-001',
    nama_produk: 'Kopi Aren Cikapundung',
    deskripsi: 'Kopi aren khas lokal dengan aroma kuat dan rasa manis alami.',
    harga: 25000,
    stok: 120,
    kategori_id: 'cat-food',
    gambar: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop',
    status_produk: 'active',
  },
  {
    id: 'umkm-002',
    nama_produk: 'Teh Herbal Cikapundung',
    deskripsi: 'Seduhan herbal segar dari bahan pilihan untuk minuman harian.',
    harga: 18000,
    stok: 85,
    kategori_id: 'cat-food',
    gambar: 'https://images.unsplash.com/photo-1597318181409-cf64d0b6e145?q=80&w=1200&auto=format&fit=crop',
    status_produk: 'active',
  },
  {
    id: 'umkm-003',
    nama_produk: 'Keripik Pisang Dago',
    deskripsi: 'Camilan renyah dari pisang lokal dengan varian rasa manis gurih.',
    harga: 15000,
    stok: 200,
    kategori_id: 'cat-food',
    gambar: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=1200&auto=format&fit=crop',
    status_produk: 'active',
  },
  {
    id: 'umkm-004',
    nama_produk: 'Batik Eco Print Bandung',
    deskripsi: 'Kain batik eco-print dengan motif alami dan pewarna ramah lingkungan.',
    harga: 175000,
    stok: 24,
    kategori_id: 'cat-fashion',
    gambar: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop',
    status_produk: 'active',
  },
  {
    id: 'umkm-005',
    nama_produk: 'Tas Anyaman Bambu',
    deskripsi: 'Tas anyaman bambu untuk kebutuhan sehari-hari dan hadiah.',
    harga: 95000,
    stok: 40,
    kategori_id: 'cat-craft',
    gambar: 'https://images.unsplash.com/photo-1521575107034-e0fa0b594529?q=80&w=1200&auto=format&fit=crop',
    status_produk: 'active',
  },
  {
    id: 'umkm-006',
    nama_produk: 'Souvenir Gantungan Kayu',
    deskripsi: 'Souvenir ringan berbahan kayu untuk wisata edukasi dan acara komunitas.',
    harga: 12000,
    stok: 300,
    kategori_id: 'cat-souvenir',
    gambar: 'https://images.unsplash.com/photo-1610094951403-e1f4e4d8668e?q=80&w=1200&auto=format&fit=crop',
    status_produk: 'draft',
  },
];

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_UMKM_SEED !== 'true') {
    throw new Error('Refusing to seed UMKM products in production without ALLOW_UMKM_SEED=true');
  }

  const { db } = await import('../src/db');
  const { productCategories, products: productTable } = await import('../src/db/schema');

  console.log('Seeding UMKM categories and products...');

  await db.transaction(async (tx) => {
    await tx.insert(productCategories).values(categories).onConflictDoNothing();
    await tx.insert(productTable).values(products).onConflictDoNothing();
  });

  const categoryCount = await db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(productCategories);
  const productCount = await db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(productTable);

  console.log(`UMKM categories total: ${categoryCount[0]?.count ?? 0}`);
  console.log(`UMKM products total: ${productCount[0]?.count ?? 0}`);
  console.log('UMKM seed complete.');
}

main().catch((error) => {
  console.error('UMKM seed failed:', error);
  process.exit(1);
});