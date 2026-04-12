import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { bookingService } from '@/services/booking.service';
import { z } from 'zod';
import { withRetry } from '@/lib/test-utils';

/**
 * Booking API Route - Thin Controller
 * Handles HTTP concerns and delegates business logic to BookingService
 * 
 * Validates: Requirements 7.1-7.10
 */

const bookingSchema = z.object({
  packageId: z.string(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  quantity: z.number().min(1),
});

/**
 * POST /api/bookings
 * Create a new booking
 * 
 * @param req - Request with packageId, visitDate, quantity
 * @returns 201 with bookingId on success
 * @returns 400 for validation errors or quota exceeded
 * @returns 401 for unauthorized access
 * @returns 404 for package not found
 */
export async function POST(req: Request) {
  // Authentication check
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Request validation
    const body = await req.json();
    const { packageId, visitDate, quantity } = bookingSchema.parse(body);

    // Delegate to service layer
    const bookingId = await withRetry(() => 
      bookingService.createBooking({
        userId: session.user.id,
        packageId,
        visitDate,
        quantity,
      })
    );

    // Return success response
    return NextResponse.json({ bookingId, message: 'Booking created' }, { status: 201 });

  } catch (error: any) {
    // Error mapping
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation failed', errors: error.issues }, { status: 400 });
    }

    if (error.message === 'Package not found or inactive') {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error.message === 'Quota exceeded for this date' || error.message === 'Quantity must be at least 1') {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error('BOOKING ERROR:', JSON.stringify(error, null, 2));

    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}