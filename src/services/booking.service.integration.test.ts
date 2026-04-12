/**
 * Integration tests for BookingService
 * Tests with real database operations
 * 
 * Validates: Requirements 4.1-4.10
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { BookingService } from './booking.service';
import { bookingRepository } from '@/repositories/booking.repository';
import { packageRepository } from '@/repositories/package.repository';
import { pricingService } from './pricing.service';
import { db } from '@/db';
import { bookings, ticketPackages, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { CreateBookingData } from './types';
import { withRetry } from '@/lib/test-utils';

describe('BookingService Integration Tests', () => {
  let service: BookingService;
  let testUserId: string;
  let testPackageId: string;
  let schoolPackageId: string;
  const testPrefix = `test-${Date.now()}`;

  beforeAll(async () => {
    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await withRetry(async () => {
      // Initialize service with real dependencies
      service = new BookingService(
        bookingRepository,
        packageRepository,
        pricingService
      );

      // Create test user
      const userResult = await db.insert(users).values({
        name: 'Test User Integration',
        email: `${testPrefix}@example.com`,
        password_hash: 'test-hash',
        role: 'user',
      }).returning();
      testUserId = userResult[0].id;

      // Create test package (personal)
      const packageResult = await db.insert(ticketPackages).values({
        name: `${testPrefix}-personal`,
        category: 'personal',
        description: 'Test package for integration tests',
        base_price: 50000,
        promo_price: null,
        quota_per_day: 10,
        is_active: true,
      }).returning();
      testPackageId = packageResult[0].id;

      // Create test school package
      const schoolResult = await db.insert(ticketPackages).values({
        name: `${testPrefix}-school`,
        category: 'school',
        description: 'Test school package for integration tests',
        base_price: 40000,
        promo_price: null,
        quota_per_day: 100,
        is_active: true,
      }).returning();
      schoolPackageId = schoolResult[0].id;
    });
  });

  afterAll(async () => {
    // Clean up test data in correct order (foreign key constraints)
    await withRetry(async () => {
      if (testUserId) {
        await db.delete(bookings).where(eq(bookings.user_id, testUserId));
        await db.delete(users).where(eq(users.id, testUserId));
      }
      if (testPackageId) {
        await db.delete(bookings).where(eq(bookings.package_id, testPackageId));
        await db.delete(ticketPackages).where(eq(ticketPackages.id, testPackageId));
      }
      if (schoolPackageId) {
        await db.delete(bookings).where(eq(bookings.package_id, schoolPackageId));
        await db.delete(ticketPackages).where(eq(ticketPackages.id, schoolPackageId));
      }
    });
  });

  // Add delay between tests to prevent database locking
  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  describe('createBooking with real database', () => {
    it('should create booking and persist to database', async () => {
      await withRetry(async () => {
        // Arrange
        const visitDate = `2025-01-${Math.floor(Math.random() * 28) + 1}`;
        const bookingData: CreateBookingData = {
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 2,
        };

        // Act
        const bookingId = await service.createBooking(bookingData);

        // Assert
        expect(bookingId).toBeDefined();
        expect(typeof bookingId).toBe('string');

        // Verify booking was created in database
        const createdBooking = await bookingRepository.findById(bookingId);
        expect(createdBooking).not.toBeNull();
        expect(createdBooking?.user_id).toBe(testUserId);
        expect(createdBooking?.package_id).toBe(testPackageId);
        expect(createdBooking?.visit_date).toBe(visitDate);
        expect(createdBooking?.quantity).toBe(2);
        expect(createdBooking?.total_price).toBe(100000); // 50000 * 2
        expect(createdBooking?.status).toBe('pending');

        // Cleanup
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });

    it('should calculate correct price using PricingService', async () => {
      await withRetry(async () => {
        // Arrange
        const visitDate = `2025-02-${Math.floor(Math.random() * 28) + 1}`;
        const bookingData: CreateBookingData = {
          userId: testUserId,
          packageId: schoolPackageId,
          visitDate,
          quantity: 50, // Should get 10% discount
        };

        // Act
        const bookingId = await service.createBooking(bookingData);

        // Assert
        const createdBooking = await bookingRepository.findById(bookingId);
        expect(createdBooking).not.toBeNull();
        // 40000 * 0.90 = 36000 per unit, 36000 * 50 = 1,800,000
        expect(createdBooking?.total_price).toBe(1800000);

        // Cleanup
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });

    it('should throw error for non-existent package', async () => {
      // Arrange
      const bookingData: CreateBookingData = {
        userId: testUserId,
        packageId: 'non-existent-package',
        visitDate: '2025-03-15',
        quantity: 2,
      };

      // Act & Assert
      await expect(service.createBooking(bookingData)).rejects.toThrow(
        'Package not found or inactive'
      );
    });

    it('should throw error for inactive package', async () => {
      await withRetry(async () => {
        // Arrange - Create inactive package
        const inactiveResult = await db.insert(ticketPackages).values({
          name: `${testPrefix}-inactive`,
          category: 'personal',
          description: 'Inactive test package',
          base_price: 50000,
          promo_price: null,
          quota_per_day: 10,
          is_active: false,
        }).returning();
        const inactivePackageId = inactiveResult[0].id;

        const bookingData: CreateBookingData = {
          userId: testUserId,
          packageId: inactivePackageId,
          visitDate: '2025-03-20',
          quantity: 2,
        };

        // Act & Assert
        await expect(service.createBooking(bookingData)).rejects.toThrow(
          'Package not found or inactive'
        );

        // Clean up
        await db.delete(ticketPackages).where(eq(ticketPackages.id, inactivePackageId));
      });
    });
  });

  describe('quota validation with concurrent bookings', () => {
    it('should enforce quota limit', async () => {
      // Arrange - Use unique date for this test
      const visitDate = `2025-04-${Math.floor(Math.random() * 28) + 1}`;
      const bookingIds: string[] = [];
      
      // Create 8 bookings (quota is 10)
      for (let i = 0; i < 8; i++) {
        const id = await service.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 1,
        });
        bookingIds.push(id);
      }

      // Act & Assert - Try to create booking that exceeds quota
      const exceedingBooking: CreateBookingData = {
        userId: testUserId,
        packageId: testPackageId,
        visitDate,
        quantity: 3, // 8 + 3 = 11 > 10 quota
      };

      await expect(service.createBooking(exceedingBooking)).rejects.toThrow(
        'Quota exceeded for this date'
      );

      // Verify total bookings is still 8
      const count = await bookingRepository.countByPackageAndDate(testPackageId, visitDate);
      expect(count).toBe(8);

      // Cleanup
      for (const id of bookingIds) {
        await db.delete(bookings).where(eq(bookings.id, id));
      }
    });

    it('should allow booking at exact quota limit', async () => {
      // Arrange - Use unique date
      const visitDate = `2025-05-${Math.floor(Math.random() * 28) + 1}`;
      const bookingIds: string[] = [];
      
      // Create 9 bookings
      for (let i = 0; i < 9; i++) {
        const id = await service.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 1,
        });
        bookingIds.push(id);
      }

      // Act - Create booking that reaches exact quota
      const bookingId = await service.createBooking({
        userId: testUserId,
        packageId: testPackageId,
        visitDate,
        quantity: 1, // 9 + 1 = 10 (exact quota)
      });
      bookingIds.push(bookingId);

      // Assert
      expect(bookingId).toBeDefined();
      const count = await bookingRepository.countByPackageAndDate(testPackageId, visitDate);
      expect(count).toBe(10);

      // Cleanup
      for (const id of bookingIds) {
        await db.delete(bookings).where(eq(bookings.id, id));
      }
    });

    it('should not count cancelled bookings towards quota', async () => {
      // Arrange - Use unique date
      const visitDate = `2025-06-${Math.floor(Math.random() * 28) + 1}`;
      const bookingIds: string[] = [];
      
      // Create 5 bookings
      for (let i = 0; i < 5; i++) {
        const id = await service.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 1,
        });
        bookingIds.push(id);
      }

      // Cancel 2 bookings
      await bookingRepository.updateStatus(bookingIds[0], 'cancelled');
      await bookingRepository.updateStatus(bookingIds[1], 'cancelled');

      // Act - Create 7 more bookings (should succeed: 3 active + 7 = 10)
      for (let i = 0; i < 7; i++) {
        const id = await service.createBooking({
          userId: testUserId,
          packageId: testPackageId,
          visitDate,
          quantity: 1,
        });
        bookingIds.push(id);
      }

      // Assert
      // Verify count excludes cancelled bookings
      const count = await bookingRepository.countByPackageAndDate(testPackageId, visitDate);
      expect(count).toBe(10); // 3 active from first batch + 7 new

      // Cleanup
      for (const id of bookingIds) {
        await db.delete(bookings).where(eq(bookings.id, id));
      }
    });
  });

  describe('transaction rollback on error', () => {
    it('should rollback booking creation if quota exceeded', async () => {
      // Arrange - Use unique date
      const visitDate = `2025-07-${Math.floor(Math.random() * 28) + 1}`;
      const initialCount = await bookingRepository.countByPackageAndDate(
        testPackageId,
        visitDate
      );

      // Act - Try to create booking that exceeds quota
      const bookingData: CreateBookingData = {
        userId: testUserId,
        packageId: testPackageId,
        visitDate,
        quantity: 20, // Exceeds quota of 10
      };

      // Assert
      await expect(service.createBooking(bookingData)).rejects.toThrow(
        'Quota exceeded for this date'
      );

      // Verify no booking was created (transaction rolled back)
      const finalCount = await bookingRepository.countByPackageAndDate(
        testPackageId,
        visitDate
      );
      expect(finalCount).toBe(initialCount);
    });

    it('should rollback on invalid quantity', async () => {
      // Arrange - Use unique date
      const visitDate = `2025-08-${Math.floor(Math.random() * 28) + 1}`;
      const initialCount = await bookingRepository.countByPackageAndDate(
        testPackageId,
        visitDate
      );

      // Act
      const bookingData: CreateBookingData = {
        userId: testUserId,
        packageId: testPackageId,
        visitDate,
        quantity: 0, // Invalid quantity
      };

      // Assert
      await expect(service.createBooking(bookingData)).rejects.toThrow(
        'Quantity must be at least 1'
      );

      // Verify no booking was created
      const finalCount = await bookingRepository.countByPackageAndDate(
        testPackageId,
        visitDate
      );
      expect(finalCount).toBe(initialCount);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple bookings for different dates', async () => {
      // Arrange & Act
      const date1 = `2025-09-${Math.floor(Math.random() * 28) + 1}`;
      const date2 = `2025-10-${Math.floor(Math.random() * 28) + 1}`;
      
      const booking1 = await service.createBooking({
        userId: testUserId,
        packageId: testPackageId,
        visitDate: date1,
        quantity: 5,
      });

      const booking2 = await service.createBooking({
        userId: testUserId,
        packageId: testPackageId,
        visitDate: date2,
        quantity: 5,
      });

      // Assert
      expect(booking1).toBeDefined();
      expect(booking2).toBeDefined();
      expect(booking1).not.toBe(booking2);

      // Verify both bookings exist
      const count1 = await bookingRepository.countByPackageAndDate(testPackageId, date1);
      const count2 = await bookingRepository.countByPackageAndDate(testPackageId, date2);
      expect(count1).toBe(5);
      expect(count2).toBe(5);

      // Cleanup
      await db.delete(bookings).where(eq(bookings.id, booking1));
      await db.delete(bookings).where(eq(bookings.id, booking2));
    });

    it('should handle bookings for different packages on same date', async () => {
      // Arrange & Act
      const visitDate = `2025-11-${Math.floor(Math.random() * 28) + 1}`;
      
      const booking1 = await service.createBooking({
        userId: testUserId,
        packageId: testPackageId,
        visitDate,
        quantity: 5,
      });

      const booking2 = await service.createBooking({
        userId: testUserId,
        packageId: schoolPackageId,
        visitDate,
        quantity: 50,
      });

      // Assert
      expect(booking1).toBeDefined();
      expect(booking2).toBeDefined();

      // Verify counts are separate per package
      const count1 = await bookingRepository.countByPackageAndDate(testPackageId, visitDate);
      const count2 = await bookingRepository.countByPackageAndDate(schoolPackageId, visitDate);
      expect(count1).toBe(5);
      expect(count2).toBe(50);

      // Cleanup
      await db.delete(bookings).where(eq(bookings.id, booking1));
      await db.delete(bookings).where(eq(bookings.id, booking2));
    });

    it('should handle large quantity bookings', async () => {
      // Arrange & Act
      const visitDate = `2025-12-${Math.floor(Math.random() * 28) + 1}`;
      const bookingId = await service.createBooking({
        userId: testUserId,
        packageId: schoolPackageId,
        visitDate,
        quantity: 100, // Large quantity with 15% discount
      });

      // Assert
      const booking = await bookingRepository.findById(bookingId);
      expect(booking).not.toBeNull();
      expect(booking?.quantity).toBe(100);
      // 40000 * 0.85 = 34000 per unit, 34000 * 100 = 3,400,000
      expect(booking?.total_price).toBe(3400000);

      // Cleanup
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });
  });
});
