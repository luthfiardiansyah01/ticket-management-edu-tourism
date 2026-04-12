import { db } from '@/db';
import { payments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Payment, CreatePaymentInput } from './types';

/**
 * Repository for payment data access
 * Encapsulates all database queries for payments
 * 
 * Validates: Requirements 3.3, 3.10
 */
export class PaymentRepository {
  /**
   * Create a new payment record
   * 
   * @param data - Payment data
   * @returns Payment ID
   * @throws Error if creation fails
   */
  async create(data: CreatePaymentInput): Promise<string> {
    const result = await db.insert(payments).values(data).returning();

    if (!result || result.length === 0) {
      throw new Error('Failed to create payment');
    }

    return result[0].id;
  }

  /**
   * Find payment by booking ID
   * 
   * @param bookingId - Booking ID
   * @returns Payment or null if not found
   */
  async findByBookingId(bookingId: string): Promise<Payment | null> {
    const result = await db.query.payments.findFirst({
      where: eq(payments.booking_id, bookingId),
    });

    return result ?? null;
  }
}

/**
 * Singleton instance for use in services and API routes
 */
export const paymentRepository = new PaymentRepository();
