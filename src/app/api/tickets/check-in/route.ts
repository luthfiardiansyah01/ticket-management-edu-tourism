import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { qrTickets, bookings, ticketPackages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const checkInSchema = z.object({
  qrToken: z.string(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { qrToken } = checkInSchema.parse(body);

    const ticket = await db.query.qrTickets.findFirst({
      where: eq(qrTickets.qr_token, qrToken),
      with: {
        booking: {
          with: {
            package: true,
            user: true,
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.is_checked_in) {
      return NextResponse.json({ 
        message: 'Ticket already used', 
        ticket: {
            id: ticket.id,
            checkedInAt: ticket.checked_in_at,
            packageName: ticket.booking.package.name,
            visitorName: ticket.booking.user.name,
        }
      }, { status: 400 });
    }

    // Perform check-in
    await db.update(qrTickets)
      .set({ 
        is_checked_in: true, 
        checked_in_at: new Date().toISOString() 
      })
      .where(eq(qrTickets.id, ticket.id));

    return NextResponse.json({ 
      message: 'Check-in successful',
      ticket: {
        id: ticket.id,
        packageName: ticket.booking.package.name,
        visitorName: ticket.booking.user.name,
        visitDate: ticket.booking.visit_date,
      }
    }, { status: 200 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation failed', errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
