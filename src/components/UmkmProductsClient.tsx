'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, PackageSearch, ImageOff } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

type UmkmProduct = {
  id: string;
  nama_produk: string;
  deskripsi: string;
  harga: number;
  stok: number;
  kategori_id: string;
  gambar: string | null;
  status_produk: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type ApiResponse = {
  data: UmkmProduct[];
  pagination: Pagination;
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop';
const PAGE_SIZE = 8;

const STATUS_LABELS: Record<UmkmProduct['status_produk'], { en: string; id: string; className: string }> = {
  active: {
    en: 'Active',
    id: 'Aktif',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  inactive: {
    en: 'Inactive',
    id: 'Nonaktif',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  draft: {
    en: 'Draft',
    id: 'Draft',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
};

export default function UmkmProductsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [items, setItems] = useState<UmkmProduct[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const queryString = useMemo(() => {
    const currentPage = Number(searchParams.get('page') || '1');
    const currentSearch = searchParams.get('search') || '';
    return `${currentPage}:${currentSearch}`;
  }, [searchParams]);

  useEffect(() => {
    setSearchInput(searchParams.get('search') ?? '');
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setLoading(true);
      setError('');

      try {
        const page = Number(searchParams.get('page') || '1');
        const search = searchParams.get('search') || '';
        const response = await fetch(`/api/umkm?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(search)}`, {
          cache: 'no-store',
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to fetch products');
        }

        if (isMounted) {
          const data = payload as ApiResponse;
          setItems(data.data);
          setPagination(data.pagination);
        }
      } catch (fetchError: any) {
        if (isMounted) {
          setError(fetchError.message || 'Failed to load products');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [queryString, searchParams]);

  const applySearch = (value: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();

    if (trimmed) {
      nextParams.set('search', trimmed);
    } else {
      nextParams.delete('search');
    }

    nextParams.set('page', '1');
    router.push(`${pathname}?${nextParams.toString()}`);
  };

  const changePage = (page: number) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('page', String(page));
    router.push(`${pathname}?${nextParams.toString()}`);
  };

  const formatPrice = (value: number) => new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-foreground/10 bg-background/90 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {locale === 'id' ? 'Daftar Produk UMKM' : 'UMKM Product List'}
            </h2>
            <p className="mt-1 text-sm text-foreground/60">
              {locale === 'id'
                ? 'Cari produk berdasarkan nama dan telusuri daftar dengan pagination.'
                : 'Search products by name and browse the catalog with pagination.'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <PackageSearch className="h-4 w-4" />
            <span>
              {locale === 'id' ? 'Total data' : 'Total records'}: {pagination.total}
            </span>
          </div>
        </div>

        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            applySearch(searchInput);
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={locale === 'id' ? 'Cari nama produk...' : 'Search product name...'}
              className="w-full rounded-xl border border-foreground/10 bg-background px-10 py-3 text-sm text-foreground outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            {locale === 'id' ? 'Cari' : 'Search'}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-sm">
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <p className="text-lg font-semibold text-red-600">{locale === 'id' ? 'Gagal memuat produk' : 'Failed to load products'}</p>
            <p className="mt-2 text-sm text-foreground/60">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <ImageOff className="h-12 w-12 text-foreground/30" />
            <p className="mt-4 text-lg font-semibold text-foreground">
              {locale === 'id' ? 'Produk tidak ditemukan' : 'No products found'}
            </p>
            <p className="mt-2 text-sm text-foreground/60">
              {locale === 'id'
                ? 'Coba kata kunci lain atau reset pencarian Anda.'
                : 'Try another keyword or reset your search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-foreground/10">
              <thead className="bg-foreground/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    {locale === 'id' ? 'Gambar' : 'Image'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    {locale === 'id' ? 'Nama Produk' : 'Product Name'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    {locale === 'id' ? 'Harga' : 'Price'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    {locale === 'id' ? 'Stok' : 'Stock'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    {locale === 'id' ? 'Status' : 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {items.map((product) => {
                  const statusMeta = STATUS_LABELS[product.status_produk];

                  return (
                    <tr key={product.id} className="transition hover:bg-foreground/5">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="h-14 w-14 overflow-hidden rounded-xl border border-foreground/10 bg-foreground/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.gambar || DEFAULT_IMAGE}
                            alt={product.nama_produk}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.src = DEFAULT_IMAGE;
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[320px]">
                          <p className="font-semibold text-foreground">{product.nama_produk}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-foreground/60">{product.deskripsi}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-green-700 dark:text-green-400">
                        {formatPrice(product.harga)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">{product.stok}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                          {statusMeta[locale]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-background/90 px-6 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground/60">
          {locale === 'id'
            ? `Menampilkan halaman ${pagination.page} dari ${pagination.totalPages}`
            : `Showing page ${pagination.page} of ${pagination.totalPages}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changePage(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPrevPage}
            className="inline-flex items-center gap-2 rounded-xl border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            {locale === 'id' ? 'Sebelumnya' : 'Previous'}
          </button>
          <button
            type="button"
            onClick={() => changePage(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={!pagination.hasNextPage}
            className="inline-flex items-center gap-2 rounded-xl border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {locale === 'id' ? 'Berikutnya' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
