/**
 * Integration tests for quota validation with concurrent bookings
 * Tests transaction isolation and quota enforcement under concurrent load
 * 
 * Validates: Requirements 4.5, 4.6, 14.1-14.10
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { BookingService } from './booking.service';
import { bookingRepository } from '@/repositories/booking.repository';
import { packageRepository } from '@/repositories/package.repository';
import { pricingService } from './pricing.service';
import { db } from '@/db';
import { bookings, ticketPackages, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withRetry } from '@/lib/test-utils';

describe('Quota Validation Integration Tests', () => {
  let bookingService: BookingService;
  let testUserId: string;
  let testPackageId: string;
  const testPrefix = `test-quota-${Date.now()}`;

  // Increase timeout for concurrent tests
  jest.setTimeout(90000);

  beforeAll(async () => {
    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await withRetry(async () => {
      // Initialize service with real dependencies
      bookingService = new BookingService(
        bookingRepository,
        packageRepository,
        pricingService
      );

      // Create test user
      const userResult = await db.insert(users).values({
        name: 'Test User Quota',
        email: `${testPrefix}@example.com`,
        password_hash: 'test-hash',
        role: 'user',
      }).returning();
      testUserId = userResult[0].id;

      // Create test package with limited quota
      const packageResult = await db.insert(ticketPackages).values({
        name: `${testPrefix}-package`,
        category: 'personal',
        description: 'Test package for quota validation',
        base_price: 50000,
        promo_price: null,
        quota_per_day: 10, // Small quota for testing
        is_active: true,
      }).returning();
      testPackageId = packageResult[0].id;
    });
  });

  afterAll(async () => {
    // Clean up test data
    await withRetry(async () => {
      if (testUserId) {
        await db.delete(bookings).where(eq(bookings.user_id, testUserId));
        await db.delete(users).where(eq(users.id, testUserId));
      }
      if (testPackageId) {
        await db.delete(ticketPackages).where(eq(ticketPackages.id, testPackageId));
      }
    });
  });

  // Add delay between tests to prevent database locking
  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Sequential Booking Quota Enforcement', () => {
    it('should allow bookings within quota', async () => {
      await withRetry(async () => {
        const visitDate = '2025-06-01';

        // Create first booking (5 tickets)
        const booking1Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 5,
        });

        expect(booking1Id).toBeDefined();

        // Create second booking (5 tickets) - should succeed (total = 10)
        const booking2Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 5,
        });

        expect(booking2Id).toBeDefined();

        // Verify both bookings exist
        const booking1 = await bookingRepository.findById(booking1Id);
        const booking2 = await bookingRepository.findById(booking2Id);

        expect(booking1).not.toBeNull();
        expect(booking2).not.toBeNull();
        expect(booking1?.quantity).toBe(5);
        expect(booking2?.quantity).toBe(5);

        // Cleanup
        await db.delete(bookings).where(eq(bookings.id, booking1Id));
        await db.delete(bookings).where(eq(bookings.id, booking2Id));
      });
    });

    it('should reject booking that exceeds quota', async () => {
      await withRetry(async () => {
        const visitDate = '2025-06-02';

        // Create first booking (8 tickets)
        const booking1Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 8,
        });

        expect(booking1Id).toBeDefined();

        // Attempt second booking (5 tickets) - should fail (total would be 13 > 10)
        await expect(
          bookingService.createBooking({
            userId: testUserId,
            packageId: testPackageId,
            visitDate,
            quantity: 5,
          })
        ).rejects.toThrow('Quota exceeded for this date');

        // Verify only first booking exists
        const booking1 = await bookingRepository.findById(booking1Id);
        expect(booking1).not.toBeNull();

        // Cleanup
        await db.delete(bookings).where(eq(bookings.id, booking1Id));
      });
    });

    it('should allow booking up to exact quota', async () => {
      await withRetry(async () => {
        const visitDate = '2025-06-03';

        // Create booking for exact quota (10 tickets)
        const bookingId = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 10,
        });

        expect(bookingId).toBeDefined();

        const booking = await bookingRepository.findById(bookingId);
        expect(booking?.quantity).toBe(10);

        // Attempt another booking - should fail (quota full)
        await expect(
          bookingService.createBooking({
            userId: testUserId,
            packageId: testPackageId,
            visitDate,
            quantity: 1,
          })
        ).rejects.toThrow('Quota exceeded for this date');

        // Cleanup
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });

    it('should allow booking remaining quota', async () => {
      await withRetry(async () => {
        const visitDate = '2025-06-04';

        // Create first booking (7 tickets)
        const booking1Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 7,
        });

        // Create second booking for remaining quota (3 tickets)
        const booking2Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 3,
        });

        expect(booking1Id).toBeDefined();
        expect(booking2Id).toBeDefined();

        // Verify total is exactly quota
        const count = await bookingRepository.countByPackageAndDate(
          testPackageId,
          visitDate
        );
        expect(count).toBe(10);

        // Cleanup
        await db.delete(bookings).where(eq(bookings.id, booking1Id));
        await db.delete(bookings).where(eq(bookings.id, booking2Id));
      });
    });
  });

  describe('Concurrent Booking Quota Enforcement', () => {
    it('should handle 2 concurrent bookings within quota', async () => {
      const visitDate = '2025-07-01';

      // Create 2 concurrent bookings (5 tickets each)
      const promises = [
        bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 5,
        }),
        bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 5,
        }),
      ];

      // Both should succeed
      const results = await Promise.all(promises);
      
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();

      // Verify total count
      const count = await bookingRepository.countByPackageAndDate(
        testPackageId,
        visitDate
      );
      expect(count).toBe(10);

      // Cleanup
      await db.delete(bookings).where(eq(bookings.user_id, testUserId));
      await new Promise(resolve => setTimeout(resolve, 100));
    }, 90000);

    it('should handle 3 concurrent bookings with quota enforcement', async () => {
      const visitDate = '2025-07-02';

      // Create 3 concurrent bookings (5 tickets each)
      // Only 2 should succeed (total 10), 1 should fail
      const promises = [
        bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 5,
        }),
        bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 5,
        }),
        bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 5,
        }),
      ];

      // Use Promise.allSettled to handle both success and failure
      const results = await Promise.allSettled(promises);

      // Count successes and failures
      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');

      // Expect 2 successes and 1 failure
      expect(successes.length).toBe(2);
      expect(failures.length).toBe(1);

      // Verify failure reason
      if (failures[0].status === 'rejected') {
        expect(failures[0].reason.message).toBe('Quota exceeded for this date');
      }

      // Verify total count is exactly quota
      const count = await bookingRepository.countByPackageAndDate(
        testPackageId,
        visitDate
      );
      expect(count).toBe(10);

      // Cleanup
      await db.delete(bookings).where(eq(bookings.user_id, testUserId));
      await new Promise(resolve => setTimeout(resolve, 100));
    }, 90000);

    it('should handle 5 concurrent bookings with quota enforcement', async () => {
      const visitDate = '2025-07-03';

      // Create 5 concurrent bookings (3 tickets each)
      // Only 3 should succeed (total 9), 2 should fail
      const promises = Array(5).fill(null).map(() =>
        bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 3,
        })
      );

      const results = await Promise.allSettled(promises);

      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');

      // Expect 3 successes (9 tickets) and 2 failures
      expect(successes.length).toBe(3);
      expect(failures.length).toBe(2);

      // Verify all failures are quota exceeded
      failures.forEach(failure => {
        if (failure.status === 'rejected') {
          expect(failure.reason.message).toBe('Quota exceeded for this date');
        }
      });

      // Verify total count doesn't exceed quota
      const count = await bookingRepository.countByPackageAndDate(
        testPackageId,
        visitDate
      );
      expect(count).toBeLessThanOrEqual(10);
      expect(count).toBe(9); // 3 bookings * 3 tickets

      // Cleanup
      await db.delete(bookings).where(eq(bookings.user_id, testUserId));
      await new Promise(resolve => setTimeout(resolve, 100));
    }, 90000);

    it('should handle 10 concurrent bookings with quota enforcement', async () => {
      const visitDate = '2025-07-04';

      // Create 10 concurrent bookings (2 tickets each)
      // Only 5 should succeed (total 10), 5 should fail
      const promises = Array(10).fill(null).map(() =>
        bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 2,
        })
      );

      const results = await Promise.allSettled(promises);

      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');

      // Expect 5 successes (10 tickets) and 5 failures
      expect(successes.length).toBe(5);
      expect(failures.length).toBe(5);

      // Verify total count is exactly quota
      const count = await bookingRepository.countByPackageAndDate(
        testPackageId,
        visitDate
      );
      expect(count).toBe(10);

      // Cleanup
      await db.delete(bookings).where(eq(bookings.user_id, testUserId));
      await new Promise(resolve => setTimeout(resolve, 100));
    }, 90000);
  });

  describe('Quota Isolation by Date', () => {
    it('should enforce quota independently per date', async () => {
      await withRetry(async () => {
        const date1 = '2025-08-01';
        const date2 = '2025-08-02';

        // Create booking for date 1 (10 tickets - full quota)
        const booking1Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate: date1,
          quantity: 10,
        });

        // Create booking for date 2 (10 tickets - full quota)
        const booking2Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate: date2,
          quantity: 10,
        });

        // Both should succeed
        expect(booking1Id).toBeDefined();
        expect(booking2Id).toBeDefined();

        // Verify counts per date
        const count1 = await bookingRepository.countByPackageAndDate(
          testPackageId,
          date1
        );
        const count2 = await bookingRepository.countByPackageAndDate(
          testPackageId,
          date2
        );

        expect(count1).toBe(10);
        expect(count2).toBe(10);

        // Cleanup
        await db.delete(bookings).where(eq(bookings.id, booking1Id));
        await db.delete(bookings).where(eq(bookings.id, booking2Id));
      });
    });

    it('should not affect quota of other dates', async () => {
      await withRetry(async () => {
        const date1 = '2025-08-05';
        const date2 = '2025-08-06';

        // Fill quota for date 1
        const booking1Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate: date1,
          quantity: 10,
        });

        // Date 1 should be full
        await expect(
          bookingService.createBooking({
            userId: testUserId,
            packageId: testPackageId,
            visitDate: date1,
            quantity: 1,
          })
        ).rejects.toThrow('Quota exceeded for this date');

        // Date 2 should still have full quota available
        const booking2Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate: date2,
          quantity: 10,
        });

        expect(booking2Id).toBeDefined();

        // Cleanup
        await db.delete(bookings).where(eq(bookings.id, booking1Id));
        await db.delete(bookings).where(eq(bookings.id, booking2Id));
      });
    });
  });

  describe('Cancelled Bookings and Quota', () => {
    it('should exclude cancelled bookings from quota count', async () => {
      await withRetry(async () => {
        const visitDate = '2025-09-01';

        // Create booking (8 tickets)
        const booking1Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 8,
        });

        // Cancel the booking
        await bookingRepository.updateStatus(booking1Id, 'cancelled');

        // Should be able to create new booking for full quota
        const booking2Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 10,
        });

        expect(booking2Id).toBeDefined();

        // Verify count excludes cancelled booking
        const count = await bookingRepository.countByPackageAndDate(
          testPackageId,
          visitDate
        );
        expect(count).toBe(10); // Only counts non-cancelled booking

        // Cleanup
        await db.delete(bookings).where(eq(bookings.id, booking1Id));
        await db.delete(bookings).where(eq(bookings.id, booking2Id));
      });
    });

    it('should allow booking after cancellation frees up quota', async () => {
      await withRetry(async () => {
        const visitDate = '2025-09-02';

        // Fill quota (10 tickets)
        const booking1Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 10,
        });

        // Quota should be full
        await expect(
          bookingService.createBooking({
            userId: testUserId,
            packageId: testPackageId,
            visitDate,
            quantity: 1,
          })
        ).rejects.toThrow('Quota exceeded for this date');

        // Cancel the booking
        await bookingRepository.updateStatus(booking1Id, 'cancelled');

        // Should now be able to create new booking
        const booking2Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 5,
        });

        expect(booking2Id).toBeDefined();

        // Cleanup
        await db.delete(bookings).where(eq(bookings.id, booking1Id));
        await db.delete(bookings).where(eq(bookings.id, booking2Id));
      });
    });
  });

  describe('Transaction Isolation', () => {
    it('should maintain consistency under concurrent load', async () => {
      const visitDate = '2025-10-01';

      // Create 20 concurrent bookings (1 ticket each)
      // Only 10 should succeed
      const promises = Array(20).fill(null).map(() =>
        bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 1,
        })
      );

      const results = await Promise.allSettled(promises);

      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');

      // Expect exactly 10 successes
      expect(successes.length).toBe(10);
      expect(failures.length).toBe(10);

      // Verify database count matches successful bookings
      const count = await bookingRepository.countByPackageAndDate(
        testPackageId,
        visitDate
      );
      expect(count).toBe(10);

      // Cleanup
      await db.delete(bookings).where(eq(bookings.user_id, testUserId));
      await new Promise(resolve => setTimeout(resolve, 100));
    }, 90000);

    it('should prevent race conditions with varying quantities', async () => {
      const visitDate = '2025-10-02';

      // Create concurrent bookings with different quantities
      const promises = [
        bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 4,
        }),
        bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 3,
        }),
        bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 5,
        }),
        bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 2,
        }),
      ];

      const results = await Promise.allSettled(promises);

      const successes = results.filter(r => r.status === 'fulfilled');

      // At least some should succeed
      expect(successes.length).toBeGreaterThan(0);

      // Total should not exceed quota
      const count = await bookingRepository.countByPackageAndDate(
        testPackageId,
        visitDate
      );
      expect(count).toBeLessThanOrEqual(10);

      // Cleanup
      await db.delete(bookings).where(eq(bookings.user_id, testUserId));
      await new Promise(resolve => setTimeout(resolve, 100));
    }, 90000);
  });

  describe('Edge Cases', () => {
    it('should handle booking with quantity = 0', async () => {
      await withRetry(async () => {
        const visitDate = '2025-11-01';

        // Attempt booking with 0 quantity
        await expect(
          bookingService.createBooking({
            userId: testUserId,
            packageId: testPackageId,
            visitDate,
            quantity: 0,
          })
        ).rejects.toThrow('Quantity must be at least 1');
      });
    });

    it('should handle booking with negative quantity', async () => {
      await withRetry(async () => {
        const visitDate = '2025-11-02';

        // Attempt booking with negative quantity
        await expect(
          bookingService.createBooking({
            userId: testUserId,
            packageId: testPackageId,
            visitDate,
            quantity: -5,
          })
        ).rejects.toThrow('Quantity must be at least 1');
      });
    });

    it('should handle booking that exactly fills remaining quota', async () => {
      await withRetry(async () => {
        const visitDate = '2025-11-03';

        // Create booking (6 tickets)
        const booking1Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 6,
        });

        // Create booking for exact remaining quota (4 tickets)
        const booking2Id = await bookingService.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 4,
        });

        expect(booking1Id).toBeDefined();
        expect(booking2Id).toBeDefined();

        // Verify quota is exactly full
        const count = await bookingRepository.countByPackageAndDate(
          testPackageId,
          visitDate
        );
        expect(count).toBe(10);

        // Cleanup
        await db.delete(bookings).where(eq(bookings.id, booking1Id));
        await db.delete(bookings).where(eq(bookings.id, booking2Id));
      });
    });
  });
});
