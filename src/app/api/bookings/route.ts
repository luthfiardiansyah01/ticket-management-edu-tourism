
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { bookings, ticketPackages } from '@/db/schema';
import { eq, and, ne, count } from 'drizzle-orm';
import { z } from 'zod';

const bookingSchema = z.object({
  packageId: z.string(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  quantity: z.number().min(1),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { packageId, visitDate, quantity } = bookingSchema.parse(body);

    // Fetch package
    const pkg = await db.query.ticketPackages.findFirst({
      where: eq(ticketPackages.id, packageId),
    });

    if (!pkg || !pkg.is_active) {
      return NextResponse.json({ message: 'Package not found or inactive' }, { status: 404 });
    }

    const bookingId = await db.transaction(async (tx) => {
      // Check quota (exclude cancelled bookings)
      const currentBookings = await tx
        .select({ count: count() })
        .from(bookings)
        .where(and(
            eq(bookings.package_id, packageId),
            eq(bookings.visit_date, visitDate),
            ne(bookings.status, 'cancelled')
        ));
        
      const currentCount = currentBookings[0]?.count ?? 0;

      if (currentCount + quantity > pkg.quota_per_day) {
        throw new Error('Quota exceeded for this date');
      }

      // Calculate price
      let pricePerPax = pkg.promo_price ?? pkg.base_price;
      
      // Bulk discount for school
      if (pkg.category === 'school') {
        if (quantity >= 100) {
          pricePerPax = Math.floor(pricePerPax * 0.85); // 15% off
        } else if (quantity >= 50) {
          pricePerPax = Math.floor(pricePerPax * 0.90); // 10% off
        }
      }

      const totalPrice = pricePerPax * quantity;

      const newBooking = await tx.insert(bookings).values({
        user_id: session.user.id,
        package_id: packageId,
        visit_date: visitDate, // YYYY-MM-DD
        quantity,
        total_price: totalPrice,
        status: 'pending',
      }).returning();
      
      if (!newBooking || newBooking.length === 0) {
          throw new Error('Failed to create booking');
      }

      return newBooking[0].id;
    });

    return NextResponse.json({ bookingId, message: 'Booking created' }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
