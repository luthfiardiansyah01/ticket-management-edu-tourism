import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { umkmProductRepository } from '@/repositories/umkm.repository';

export const dynamic = 'force-dynamic';

/**
 * GET /api/umkm/[id]
 * Retrieve a single UMKM product by ID.
 * Public read access.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await umkmProductRepository.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Failed to fetch UMKM product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UMKM product' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/umkm/[id]
 * Update an existing UMKM product.
 * Requires admin authentication.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized — admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Build update payload, only including provided fields
    const updateData: {
      nama_produk?: string;
      deskripsi?: string;
      harga?: number;
      stok?: number;
      kategori_id?: string;
      gambar?: string | null;
      status_produk?: 'active' | 'inactive' | 'draft';
    } = {};

    if (body.nama_produk !== undefined) {
      if (typeof body.nama_produk !== 'string' || body.nama_produk.trim().length === 0) {
        return NextResponse.json(
          { error: 'Nama produk harus berupa string non-kosong' },
          { status: 400 }
        );
      }
      updateData.nama_produk = body.nama_produk.trim();
    }

    if (body.deskripsi !== undefined) {
      if (typeof body.deskripsi !== 'string') {
        return NextResponse.json(
          { error: 'Deskripsi harus berupa string' },
          { status: 400 }
        );
      }
      updateData.deskripsi = body.deskripsi.trim();
    }

    if (body.harga !== undefined) {
      if (typeof body.harga !== 'number' || body.harga < 0) {
        return NextResponse.json(
          { error: 'Harga harus berupa angka non-negatif' },
          { status: 400 }
        );
      }
      updateData.harga = body.harga;
    }

    if (body.kategori_id !== undefined) {
      if (typeof body.kategori_id !== 'string' || body.kategori_id.trim().length === 0) {
        return NextResponse.json(
          { error: 'kategori_id harus berupa string non-kosong' },
          { status: 400 }
        );
      }
      updateData.kategori_id = body.kategori_id.trim();
    }

    if (body.stok !== undefined) {
      if (typeof body.stok !== 'number' || body.stok < 0) {
        return NextResponse.json(
          { error: 'Stok harus berupa angka non-negatif' },
          { status: 400 }
        );
      }
      updateData.stok = body.stok;
    }

    if (body.gambar !== undefined) {
      updateData.gambar = body.gambar;
    }

    if (body.status_produk !== undefined) {
      const validStatus = ['active', 'inactive', 'draft'];
      if (!validStatus.includes(body.status_produk)) {
        return NextResponse.json(
          { error: `status_produk harus salah satu dari: ${validStatus.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status_produk = body.status_produk;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    const product = await umkmProductRepository.update(id, updateData);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Failed to update UMKM product:', error);
    return NextResponse.json(
      { error: 'Failed to update UMKM product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/umkm/[id]
 * Delete a UMKM product by ID.
 * Requires admin authentication.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized — admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const deleted = await umkmProductRepository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete UMKM product:', error);
    return NextResponse.json(
      { error: 'Failed to delete UMKM product' },
      { status: 500 }
    );
  }
}
