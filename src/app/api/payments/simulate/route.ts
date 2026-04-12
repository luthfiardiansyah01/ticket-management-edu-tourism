import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { paymentService } from '@/services/payment.service';
import { z } from 'zod';

/**
 * Payment API Route - Thin Controller
 * Handles HTTP concerns and delegates business logic to PaymentService
 * 
 * Validates: Requirements 8.1-8.10
 */

const paymentSchema = z.object({
  bookingId: z.string(),
});

/**
 * POST /api/payments/simulate
 * Process payment for a booking
 * 
 * @param req - Request with bookingId
 * @returns 200 with success message on success
 * @returns 400 for validation errors or already paid
 * @returns 401 for unauthorized access
 * @returns 404 for booking not found
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
    const { bookingId } = paymentSchema.parse(body);

    // Delegate to service layer
    const result = await paymentService.processPayment(bookingId);

    // Return success response
    return NextResponse.json({ message: result.message, bookingId: result.bookingId }, { status: 200 });

  } catch (error: any) {

    console.error('🚨 ERROR ASLI DI ROUTE:', error.message, error.stack);
    // Error mapping
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation failed', errors: error.issues }, { status: 400 });
    }

    if (error.message === 'Booking not found') {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error.message === 'Booking already paid') {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
