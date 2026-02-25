import { db } from '@/db';
import { ticketPackages } from '@/db/schema';
import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest
) {
  try {
    const packages = await db.query.ticketPackages.findMany();

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Failed to fetch packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}