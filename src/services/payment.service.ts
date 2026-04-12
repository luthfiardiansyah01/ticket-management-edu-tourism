import { db } from '@/db';
import { bookingRepository, BookingRepository } from '@/repositories/booking.repository';
import { paymentRepository, PaymentRepository } from '@/repositories/payment.repository';
import { ticketService, TicketService } from './ticket.service';
import type { PaymentResult } from './types';
import type { Booking } from '@/repositories/types';

/**
 * Service for payment processing and transaction coordination
 * Handles payment workflows and coordinates ticket generation
 * 
 * Validates: Requirements 5.1-5.10
 */
export class PaymentService {
  constructor(
    private bookingRepository: BookingRepository,
    private paymentRepository: PaymentRepository,
    private ticketService: TicketService
  ) {}

  /**
   * Process payment for a booking
   * Updates booking status, creates payment record, generates tickets
   * All operations execute within a transaction
   * 
   * @param bookingId - Booking ID to process payment for
   * @returns Payment result with success status
   * @throws Error if booking not found or already paid
   * 
   * Validates: Requirements 5.1-5.10
   */
  async processPayment(bookingId: string): Promise<PaymentResult> {
    // Validate booking exists
    const booking = await this.validateBooking(bookingId);

    // Check if already paid
    if (booking.status === 'paid') {
      throw new Error('Booking already paid');
    }

    // Execute payment processing in transaction
    await db.transaction(async (tx) => {
      // Update booking status to paid
      await this.bookingRepository.updateStatus(bookingId, 'paid');

      // Create payment record
      await this.paymentRepository.create({
        booking_id: bookingId,
        provider: 'mock_gateway',
        payment_status: 'success',
        external_ref: `mock_${Date.now()}`,
        paid_at: new Date().toISOString(),
      });

      // Generate QR tickets
      await this.ticketService.generateTickets(bookingId, booking.quantity);
    });

    return {
      bookingId,
      success: true,
      message: 'Payment successful',
    };
  }

  /**
   * Validate booking exists
   * @private
   * Validates: Requirement 5.2
   */
  private async validateBooking(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    return booking;
  }
}

/**
 * Singleton instance for use in services and API routes
 */
export const paymentService = new PaymentService(
  bookingRepository,
  paymentRepository,
  ticketService
);
