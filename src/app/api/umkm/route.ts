import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { umkmProductRepository } from '@/repositories/umkm.repository';

export const dynamic = 'force-dynamic';

/**
 * GET /api/umkm
 * List all UMKM products with optional filters.
 * Public read access — no auth required for listing.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const products = await umkmProductRepository.findAll({
      category,
      search,
      activeOnly,
    });

    return NextResponse.json(products);
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

    const body = await request.json();

    // Basic validation
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    if (!body.description || typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'Product description is required' },
        { status: 400 }
      );
    }

    if (typeof body.price !== 'number' || body.price < 0) {
      return NextResponse.json(
        { error: 'Valid product price is required' },
        { status: 400 }
      );
    }

    if (typeof body.stock !== 'number' || body.stock < 0) {
      return NextResponse.json(
        { error: 'Valid stock quantity is required' },
        { status: 400 }
      );
    }

    const validCategories = ['food', 'craft', 'fashion', 'souvenir', 'other'];
    const category = validCategories.includes(body.category) ? body.category : 'other';

    const product = await umkmProductRepository.create({
      name: body.name.trim(),
      description: body.description.trim(),
      price: body.price,
      category,
      stock: body.stock,
      image_url: body.image_url || null,
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
