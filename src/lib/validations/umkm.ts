import { z } from 'zod';

const baseUmkmProductSchema = z.object({
  nama_produk: z.string().trim().min(3, 'Nama produk minimal 3 karakter').max(120, 'Nama produk maksimal 120 karakter'),
  deskripsi: z.string().trim().min(10, 'Deskripsi minimal 10 karakter').max(2000, 'Deskripsi maksimal 2000 karakter'),
  harga: z.coerce.number().int('Harga harus bilangan bulat').nonnegative('Harga tidak boleh negatif').max(1000000000, 'Harga terlalu besar'),
  stok: z.coerce.number().int('Stok harus bilangan bulat').nonnegative('Stok tidak boleh negatif').max(1000000, 'Stok terlalu besar').default(0),
  kategori_id: z.string().trim().min(1, 'Kategori wajib dipilih'),
  status_produk: z.enum(['active', 'inactive', 'draft']).default('active'),
  gambar: z
    .string()
    .trim()
    .min(1, 'Gambar wajib diunggah')
    .refine(
      (value) => value.startsWith('data:image/') || value.startsWith('https://') || value.startsWith('http://'),
      'Format gambar tidak valid'
    ),
});

export const createUmkmProductSchema = baseUmkmProductSchema;
export type CreateUmkmProductInput = z.infer<typeof createUmkmProductSchema>;
