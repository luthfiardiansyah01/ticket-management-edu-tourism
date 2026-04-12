import { ticketRepository, TicketRepository } from '@/repositories/ticket.repository';
import type { TicketDetails } from './types';
import type { TicketWithDetails } from '@/repositories/types';

/**
 * Service for QR ticket generation and check-in operations
 * Handles ticket lifecycle from generation to check-in
 * 
 * Validates: Requirements 6.1-6.10
 */
export class TicketService {
  constructor(private ticketRepository: TicketRepository) {}

  /**
   * Generate QR tickets for a booking
   * Creates unique tokens for each ticket
   * 
   * @param bookingId - Booking ID
   * @param quantity - Number of tickets to generate
   * @throws Error if ticket creation fails
   * 
   * Validates: Requirements 6.1-6.4, 6.10
   */
  async generateTickets(bookingId: string, quantity: number): Promise<void> {
    const tickets = [];

    for (let i = 0; i < quantity; i++) {
      tickets.push({
        booking_id: bookingId,
        qr_token: crypto.randomUUID(), // Unique token
        is_checked_in: false,
      });
    }

    if (tickets.length > 0) {
      await this.ticketRepository.createBatch(tickets);
    }
  }

  /**
   * Check in a ticket using QR token
   * Validates ticket exists and is not already checked in
   * 
   * @param qrToken - QR token from scanned ticket
   * @returns Ticket details including package and visitor info
   * @throws Error if ticket not found or already used
   * 
   * Validates: Requirements 6.5-6.9
   */
  async checkInTicket(qrToken: string): Promise<TicketDetails> {
    // Validate ticket exists
    const ticket = await this.validateTicket(qrToken);

    // Check if already checked in
    if (ticket.is_checked_in) {
      throw new Error('Ticket already used');
    }

    // Perform check-in
    await this.ticketRepository.checkIn(ticket.id);

    // Return ticket details
    return {
      ticketId: ticket.id,
      packageName: ticket.booking.package.name,
      visitorName: ticket.booking.user.name,
      visitDate: ticket.booking.visit_date,
      checkedInAt: new Date().toISOString(),
    };
  }

  /**
   * Validate ticket exists
   * @private
   * Validates: Requirement 6.6
   */
  private async validateTicket(qrToken: string): Promise<TicketWithDetails> {
    const ticket = await this.ticketRepository.findByToken(qrToken);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return ticket;
  }
}

/**
 * Singleton instance for use in services and API routes
 */
export const ticketService = new TicketService(ticketRepository);
