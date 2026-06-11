import { Metadata } from 'next';
import UmkmProductsClient from '@/components/UmkmProductsClient';

export const metadata: Metadata = {
  title: 'UMKM Products',
  description: 'Browse UMKM products with search and pagination.',
};

export const dynamic = 'force-dynamic';

export default function UmkmPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl border border-foreground/10 bg-gradient-to-br from-emerald-50 via-background to-amber-50 p-8 shadow-sm dark:from-emerald-950/30 dark:via-background dark:to-amber-950/20">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">
          UMKM Catalog
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Read Produk UMKM
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-foreground/70">
          Lihat seluruh produk UMKM, cari berdasarkan nama produk, dan telusuri data secara aman dengan pagination yang dibatasi di server.
        </p>
      </div>

      <UmkmProductsClient />
    </div>
  );
}
