import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq, and, ne, count } from 'drizzle-orm';
import type { Booking, CreateBookingInput } from './types';
//import { withRetry } from '@/lib/test-utils';

/**
 * Repository for booking data access
 * Encapsulates all database queries for bookings
 * 
 * Validates: Requirements 3.2, 3.7-3.9
 */
export class BookingRepository {
  /**
   * Create a new booking
   * 
   * @param data - Booking data
   * @returns Booking ID
   * @throws Error if creation fails
   */
  async create(data: CreateBookingInput): Promise<string> {
    const result = await db.insert(bookings).values(data).returning();

    if (!result || result.length === 0) {
      throw new Error('Failed to create booking');
    }

    return result[0].id;
  }

  /**
   * Find booking by ID
   * 
   * @param id - Booking ID
   * @returns Booking or null if not found
   */
  async findById(id: string): Promise<Booking | null> {
    const result = await db.query.bookings.findFirst({
      where: eq(bookings.id, id),
    });

    return result as Booking | null;
  }

  /**
   * Update booking status
   * 
   * @param id - Booking ID
   * @param status - New status
   * @throws Error if update fails
   */
  async updateStatus(id: string, status: 'pending' | 'paid' | 'cancelled'): Promise<void> {
    await db.update(bookings)
      .set({ status })
      .where(eq(bookings.id, id));
  }

  /**
   * Count non-cancelled bookings for a package and date
   * Used for quota validation
   * 
   * @param packageId - Package ID
   * @param visitDate - Visit date (YYYY-MM-DD)
   * @returns Count of bookings
   */
  async countByPackageAndDate(packageId: string, visitDate: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.package_id, packageId),
          eq(bookings.visit_date, visitDate),
          ne(bookings.status, 'cancelled')
        )
      );

    return result[0]?.count ?? 0;
  }
}

/**
 * Singleton instance for use in services and API routes
 */
export const bookingRepository = new BookingRepository();
