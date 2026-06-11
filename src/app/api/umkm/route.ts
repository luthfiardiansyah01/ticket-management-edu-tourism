import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { umkmProductRepository } from '@/repositories/umkm.repository';
import { createUmkmProductSchema } from '@/lib/validations/umkm';
import { Buffer } from 'node:buffer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function normalizeImageSource(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.startsWith('data:image/') || trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }

  return '';
}

async function readCreatePayload(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const rawFile = formData.get('gambar');
    let gambar = '';

    if (rawFile instanceof File && rawFile.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.has(rawFile.type)) {
        return { error: 'Gambar harus berformat JPG, PNG, WEBP, atau GIF' } as const;
      }

      if (rawFile.size > MAX_IMAGE_SIZE_BYTES) {
        return { error: 'Ukuran gambar maksimal 5 MB' } as const;
      }

      const arrayBuffer = await rawFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      gambar = `data:${rawFile.type};base64,${base64}`;
    } else if (typeof rawFile === 'string' && rawFile.trim().length > 0) {
      gambar = rawFile.trim();
    }

    return {
      data: {
        nama_produk: formData.get('nama_produk'),
        deskripsi: formData.get('deskripsi'),
        harga: formData.get('harga'),
        stok: formData.get('stok') ?? 0,
        kategori_id: formData.get('kategori_id') ?? formData.get('kategori'),
        status_produk: formData.get('status_produk') ?? 'active',
        gambar: gambar || normalizeImageSource(formData.get('gambar')),
      },
    } as const;
  }

  try {
    const body = await request.json();
    return {
      data: {
        nama_produk: body.nama_produk,
        deskripsi: body.deskripsi,
        harga: body.harga,
        stok: body.stok ?? 0,
        kategori_id: body.kategori_id ?? body.kategori,
        status_produk: body.status_produk ?? 'active',
        gambar: normalizeImageSource(body.gambar),
      },
    } as const;
  } catch {
    return { error: 'Invalid request body' } as const;
  }
}

/**
 * GET /api/umkm
 * List all UMKM products with optional filters.
 * Public read access — no auth required for listing.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');
    const kategori_id = searchParams.get('kategori_id') || undefined;
    const search = searchParams.get('search')?.trim() || undefined;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json(
        { error: 'page must be a positive integer' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit must be an integer between 1 and 100' },
        { status: 400 }
      );
    }

    if (search && search.length > 100) {
      return NextResponse.json(
        { error: 'search query is too long' },
        { status: 400 }
      );
    }

    const result = await umkmProductRepository.findPaginated({
      page,
      limit,
      kategori_id,
      search,
      activeOnly,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch UMKM products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UMKM products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/umkm
 * Create a new UMKM product.
 * Requires admin authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized — admin access required' },
        { status: 403 }
      );
    }

    const payload = await readCreatePayload(request);

    if ('error' in payload) {
      return NextResponse.json({ error: payload.error }, { status: 400 });
    }

    const parsed = createUmkmProductSchema.safeParse(payload.data);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validasi gagal',
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const product = await umkmProductRepository.create({
      nama_produk: input.nama_produk,
      deskripsi: input.deskripsi,
      harga: input.harga,
      stok: input.stok,
      kategori_id: input.kategori_id,
      gambar: input.gambar,
      status_produk: input.status_produk,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Failed to create UMKM product:', error);
    return NextResponse.json(
      { error: 'Failed to create UMKM product' },
      { status: 500 }
    );
  }
}
