import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import UmkmProductCreateForm from '@/components/UmkmProductCreateForm';

export const dynamic = 'force-dynamic';

export default async function NewUmkmProductPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">Admin Panel</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Tambah Produk UMKM</h1>
        </div>
        <Link href="/dashboard/admin" className="inline-flex items-center rounded-xl border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-foreground/5">
          Kembali ke Dashboard
        </Link>
      </div>

      <UmkmProductCreateForm />
    </div>
  );
}
