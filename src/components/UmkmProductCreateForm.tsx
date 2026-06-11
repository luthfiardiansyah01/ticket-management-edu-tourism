'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle, Upload, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const CATEGORY_OPTIONS = [
  { id: 'cat-food', label: 'Makanan & Minuman', hint: 'Produk kuliner lokal' },
  { id: 'cat-craft', label: 'Kerajinan', hint: 'Produk handmade dan karya lokal' },
  { id: 'cat-fashion', label: 'Fashion', hint: 'Pakaian dan aksesori' },
  { id: 'cat-souvenir', label: 'Souvenir', hint: 'Cendera mata dan merchandise' },
  { id: 'cat-other', label: 'Lainnya', hint: 'Kategori umum' },
] as const;

type FormState = {
  nama_produk: string;
  deskripsi: string;
  harga: string;
  stok: string;
  kategori_id: string;
};

type FieldErrors = Partial<Record<keyof FormState | 'gambar', string>>;

const initialState: FormState = {
  nama_produk: '',
  deskripsi: '',
  harga: '',
  stok: '0',
  kategori_id: CATEGORY_OPTIONS[0].id,
};

export default function UmkmProductCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [gambar, setGambar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const selectedCategory = useMemo(
    () => CATEGORY_OPTIONS.find((option) => option.id === form.kategori_id),
    [form.kategori_id]
  );

  useEffect(() => {
    if (!gambar) {
      setPreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(gambar);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [gambar]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const validateClientSide = () => {
    const nextErrors: FieldErrors = {};

    if (form.nama_produk.trim().length < 3) {
      nextErrors.nama_produk = 'Nama produk minimal 3 karakter';
    }

    if (form.deskripsi.trim().length < 10) {
      nextErrors.deskripsi = 'Deskripsi minimal 10 karakter';
    }

    if (!form.harga || Number(form.harga) <= 0 || Number.isNaN(Number(form.harga))) {
      nextErrors.harga = 'Harga harus lebih dari 0';
    }

    if (Number.isNaN(Number(form.stok)) || Number(form.stok) < 0) {
      nextErrors.stok = 'Stok harus angka 0 atau lebih';
    }

    if (!form.kategori_id) {
      nextErrors.kategori_id = 'Kategori wajib dipilih';
    }

    if (!gambar) {
      nextErrors.gambar = 'Gambar produk wajib diunggah';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setForm(initialState);
    setGambar(null);
    setPreviewUrl('');
    setFieldErrors({});
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateClientSide()) {
      setErrorMessage('Periksa kembali data form sebelum disimpan.');
      return;
    }

    const formData = new FormData();
    formData.append('nama_produk', form.nama_produk.trim());
    formData.append('deskripsi', form.deskripsi.trim());
    formData.append('harga', form.harga);
    formData.append('stok', form.stok || '0');
    formData.append('kategori_id', form.kategori_id);
    formData.append('status_produk', 'active');

    if (gambar) {
      formData.append('gambar', gambar);
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/umkm', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        if (payload?.issues) {
          const nextErrors: FieldErrors = {};
          Object.entries(payload.issues).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
              nextErrors[key as keyof FieldErrors] = value[0];
            }
          });
          setFieldErrors(nextErrors);
        }

        throw new Error(payload.error || 'Gagal menyimpan produk');
      }

      setSuccessMessage('Produk berhasil ditambahkan.');
      resetForm();
      router.refresh();
    } catch (submitError: any) {
      setErrorMessage(submitError.message || 'Gagal menambahkan produk');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-foreground/10 bg-background p-6 shadow-sm">
        {(successMessage || errorMessage) && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              successMessage
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-2">
              {successMessage ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
              <p>{successMessage || errorMessage}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">Create Produk</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">Tambah Produk UMKM</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Isi data produk dengan lengkap. Gambar akan divalidasi dan disimpan sebagai data URL untuk siap dipakai di production.
            </p>
          </div>
          <Link href="/dashboard/admin" className="inline-flex items-center gap-2 rounded-xl border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-foreground/5">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground/80">Nama Produk</span>
            <input
              value={form.nama_produk}
              onChange={(event) => updateField('nama_produk', event.target.value)}
              className="w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-foreground outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              placeholder="Contoh: Kopi Aren Cikapundung"
              maxLength={120}
            />
            {fieldErrors.nama_produk && <p className="text-sm text-red-600">{fieldErrors.nama_produk}</p>}
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground/80">Deskripsi</span>
            <textarea
              value={form.deskripsi}
              onChange={(event) => updateField('deskripsi', event.target.value)}
              className="min-h-32 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-foreground outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              placeholder="Jelaskan produk, bahan, manfaat, dan keunikan produk..."
              maxLength={2000}
            />
            {fieldErrors.deskripsi && <p className="text-sm text-red-600">{fieldErrors.deskripsi}</p>}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground/80">Harga</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.harga}
              onChange={(event) => updateField('harga', event.target.value)}
              className="w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-foreground outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              placeholder="25000"
            />
            {fieldErrors.harga && <p className="text-sm text-red-600">{fieldErrors.harga}</p>}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground/80">Stok</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.stok}
              onChange={(event) => updateField('stok', event.target.value)}
              className="w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-foreground outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              placeholder="0"
            />
            {fieldErrors.stok && <p className="text-sm text-red-600">{fieldErrors.stok}</p>}
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground/80">Kategori</span>
            <select
              value={form.kategori_id}
              onChange={(event) => updateField('kategori_id', event.target.value)}
              className="w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-foreground outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.kategori_id ? (
              <p className="text-sm text-red-600">{fieldErrors.kategori_id}</p>
            ) : selectedCategory ? (
              <p className="text-sm text-foreground/50">{selectedCategory.hint}</p>
            ) : null}
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground/80">Gambar Produk</span>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-foreground/15 bg-foreground/5 px-6 py-8 text-center transition hover:border-green-500 hover:bg-green-50/60 dark:hover:bg-green-950/20">
              <Upload className="h-6 w-6 text-foreground/40" />
              <span className="mt-3 text-sm font-medium text-foreground">Klik untuk upload gambar</span>
              <span className="mt-1 text-xs text-foreground/50">JPG, PNG, WEBP, GIF maksimal 5 MB</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setGambar(file);
                  setFieldErrors((current) => ({ ...current, gambar: undefined }));
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
              />
            </label>
            {fieldErrors.gambar && <p className="text-sm text-red-600">{fieldErrors.gambar}</p>}
          </label>

          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
            <Link href="/umkm" className="inline-flex items-center justify-center rounded-xl border border-foreground/10 px-5 py-3 text-sm font-medium text-foreground transition hover:bg-foreground/5">
              Lihat Daftar Produk
            </Link>
          </div>
        </div>
      </form>

      <aside className="space-y-4 rounded-3xl border border-foreground/10 bg-background p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground">Preview</h3>
        <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Preview produk" className="h-56 w-full object-cover" />
          ) : (
            <div className="flex h-56 items-center justify-center text-sm text-foreground/40">
              Belum ada gambar dipilih
            </div>
          )}
        </div>
        <div className="space-y-3 text-sm text-foreground/70">
          <div>
            <p className="font-medium text-foreground">Nama</p>
            <p>{form.nama_produk || '-'}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Kategori</p>
            <p>{selectedCategory?.label || '-'}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Harga</p>
            <p>{form.harga ? `Rp ${Number(form.harga).toLocaleString('id-ID')}` : '-'}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Stok</p>
            <p>{form.stok || '0'}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
