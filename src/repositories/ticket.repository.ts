import { db } from '@/db';
import { qrTickets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Ticket, TicketWithDetails, CreateTicketInput } from './types';

/**
 * Repository for QR ticket data access
 * Encapsulates all database queries for tickets
 * 
 * Validates: Requirements 3.4, 3.11-3.13
 */
export class TicketRepository {
  /**
   * Create multiple tickets in batch
   * 
   * @param tickets - Array of ticket data
   * @throws Error if creation fails
   */
  async createBatch(tickets: CreateTicketInput[]): Promise<void> {
    if (tickets.length === 0) {
      return;
    }

    await db.insert(qrTickets).values(tickets);
  }

  /**
   * Find ticket by QR token with full details
   * Includes booking, package, and user information
   * 
   * @param qrToken - QR token
   * @returns Ticket with details or null if not found
   */
  async findByToken(qrToken: string): Promise<TicketWithDetails | null> {
    const result = await db.query.qrTickets.findFirst({
      where: eq(qrTickets.qr_token, qrToken),
      with: {
        booking: {
          with: {
            package: true,
            user: true,
          },
        },
      },
    });

    return (result as TicketWithDetails) ?? null;
  }

  /**
   * Mark ticket as checked in
   * 
   * @param ticketId - Ticket ID
   * @throws Error if update fails
   */
  async checkIn(ticketId: string): Promise<void> {
    await db.update(qrTickets)
      .set({
        is_checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
      .where(eq(qrTickets.id, ticketId));
  }
}

/**
 * Singleton instance for use in services and API routes
 */
export const ticketRepository = new TicketRepository();
