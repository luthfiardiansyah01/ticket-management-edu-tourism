import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { bookings, payments, qrTickets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const paymentSchema = z.object({
  bookingId: z.string(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bookingId } = paymentSchema.parse(body);

    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'paid') {
      return NextResponse.json({ message: 'Booking already paid' }, { status: 400 });
    }

    // Use 'any' type for tx to avoid implicit any error if type inference fails
    await db.transaction(async (tx: any) => {
      // Update booking status
      await tx.update(bookings)
        .set({ status: 'paid' })
        .where(eq(bookings.id, bookingId));

      // Create payment record
      await tx.insert(payments).values({
        booking_id: bookingId,
        provider: 'mock_gateway',
        payment_status: 'success',
        external_ref: `mock_${Date.now()}`,
        paid_at: new Date().toISOString(),
      });

      // Generate QR tickets
      const tickets = [];
      for (let i = 0; i < booking.quantity; i++) {
        tickets.push({
          booking_id: bookingId,
          qr_token: crypto.randomUUID(), // Unique token
          is_checked_in: false,
        });
      }

      if (tickets.length > 0) {
        await tx.insert(qrTickets).values(tickets);
      }
    });

    return NextResponse.json({ message: 'Payment successful', bookingId }, { status: 200 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation failed', errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
