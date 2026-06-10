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
      name?: string;
      description?: string;
      price?: number;
      category?: 'food' | 'craft' | 'fashion' | 'souvenir' | 'other';
      stock?: number;
      image_url?: string | null;
      is_active?: boolean;
    } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Product name must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      if (typeof body.description !== 'string') {
        return NextResponse.json(
          { error: 'Description must be a string' },
          { status: 400 }
        );
      }
      updateData.description = body.description.trim();
    }

    if (body.price !== undefined) {
      if (typeof body.price !== 'number' || body.price < 0) {
        return NextResponse.json(
          { error: 'Price must be a non-negative number' },
          { status: 400 }
        );
      }
      updateData.price = body.price;
    }

    if (body.category !== undefined) {
      const validCategories = ['food', 'craft', 'fashion', 'souvenir', 'other'];
      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          { error: `Category must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.category = body.category;
    }

    if (body.stock !== undefined) {
      if (typeof body.stock !== 'number' || body.stock < 0) {
        return NextResponse.json(
          { error: 'Stock must be a non-negative number' },
          { status: 400 }
        );
      }
      updateData.stock = body.stock;
    }

    if (body.image_url !== undefined) {
      updateData.image_url = body.image_url;
    }

    if (body.is_active !== undefined) {
      if (typeof body.is_active !== 'boolean') {
        return NextResponse.json(
          { error: 'is_active must be a boolean' },
          { status: 400 }
        );
      }
      updateData.is_active = body.is_active;
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
