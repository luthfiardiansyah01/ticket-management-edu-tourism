import { db } from '@/db';
import { ticketPackages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ params sebagai Promise
) {
  const { id } = await context.params; // ✅ await untuk resolve params

  try {
    const pkg = await db.query.ticketPackages.findFirst({
      where: eq(ticketPackages.id, id),
    });

    if (!pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(pkg);
  } catch (error) {
    console.error('Failed to fetch package:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package' },
      { status: 500 }
    );
  }
}