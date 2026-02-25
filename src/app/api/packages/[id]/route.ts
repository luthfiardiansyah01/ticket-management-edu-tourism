import { db } from '@/db';
import { ticketPackages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  console.log(`[API] Fetching package with ID: ${id}`);

  try {
    const pkg = await db.query.ticketPackages.findFirst({
      where: eq(ticketPackages.id, id),
    });

    if (!pkg) {
      console.warn(`[API] Package not found for ID: ${id}`);
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
