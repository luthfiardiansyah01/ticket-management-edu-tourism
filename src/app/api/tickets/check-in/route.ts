import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ticketService } from '@/services/ticket.service';
import { z } from 'zod';

/**
 * Ticket Check-In API Route - Thin Controller
 * Handles HTTP concerns and delegates business logic to TicketService
 * 
 * Validates: Requirements 9.1-9.10
 */

const checkInSchema = z.object({
  qrToken: z.string(),
});

/**
 * POST /api/tickets/check-in
 * Check in a ticket using QR token
 * 
 * @param req - Request with qrToken
 * @returns 200 with ticket details on success
 * @returns 400 for validation errors or already used ticket
 * @returns 401 for unauthorized access (admin/staff only)
 * @returns 404 for ticket not found
 */
export async function POST(req: Request) {
  // Authentication and authorization check (admin/staff only)
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Request validation
    const body = await req.json();
    const { qrToken } = checkInSchema.parse(body);

    // Delegate to service layer
    const ticketDetails = await ticketService.checkInTicket(qrToken);

    // Return success response
    return NextResponse.json({ 
      message: 'Check-in successful',
      ticket: {
        id: ticketDetails.ticketId,
        packageName: ticketDetails.packageName,
        visitorName: ticketDetails.visitorName,
        visitDate: ticketDetails.visitDate,
      }
    }, { status: 200 });

  } catch (error: any) {
    // Error mapping
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation failed', errors: error.issues }, { status: 400 });
    }

    if (error.message === 'Ticket not found') {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error.message === 'Ticket already used') {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
