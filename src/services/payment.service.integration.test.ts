/**
 * Integration tests for PaymentService
 * Tests with real database operations
 * 
 * Validates: Requirements 5.1-5.10
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { PaymentService } from './payment.service';
import { bookingRepository } from '@/repositories/booking.repository';
import { paymentRepository } from '@/repositories/payment.repository';
import { ticketService } from './ticket.service';
import { db } from '@/db';
import { bookings, ticketPackages, users, payments, qrTickets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withRetry } from '@/lib/test-utils';

describe('PaymentService Integration Tests', () => {
  let service: PaymentService;
  let testUserId: string;
  let testPackageId: string;
  const testPrefix = `test-payment-${Date.now()}`;

  beforeAll(async () => {
    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await withRetry(async () => {
      // Initialize service with real dependencies
      service = new PaymentService(
        bookingRepository,
        paymentRepository,
        ticketService
      );

      // Create test user
      const userResult = await db.insert(users).values({
        name: 'Test User Payment',
        email: `${testPrefix}@example.com`,
        password_hash: 'test-hash',
        role: 'user',
      }).returning();
      testUserId = userResult[0].id;

      // Create test package
      const packageResult = await db.insert(ticketPackages).values({
        name: `${testPrefix}-package`,
        category: 'personal',
        description: 'Test package for payment integration tests',
        base_price: 50000,
        promo_price: null,
        quota_per_day: 10,
        is_active: true,
      }).returning();
      testPackageId = packageResult[0].id;
    });
  });

  afterAll(async () => {
    // Clean up test data in correct order (foreign key constraints)
    await withRetry(async () => {
      if (testUserId) {
        // Delete tickets first (foreign key to bookings)
        const userBookings = await db.query.bookings.findMany({
          where: eq(bookings.user_id, testUserId),
        });
        for (const booking of userBookings) {
          await db.delete(qrTickets).where(eq(qrTickets.booking_id, booking.id));
          await db.delete(payments).where(eq(payments.booking_id, booking.id));
        }
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
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  describe('processPayment with real database', () => {
    it('should process payment and persist to database', async () => {
      await withRetry(async () => {
        // Arrange - Create a pending booking
        const bookingId = await bookingRepository.create({
          user_id: testUserId,
          package_id: testPackageId,
          visit_date: `2025-01-${Math.floor(Math.random() * 28) + 1}`,
          quantity: 3,
          total_price: 150000,
          status: 'pending',
        });

        // Act
        const result = await service.processPayment(bookingId);

        // Assert
        expect(result.success).toBe(true);
        expect(result.bookingId).toBe(bookingId);
        expect(result.message).toBe('Payment successful');

        // Verify booking status updated
        const updatedBooking = await bookingRepository.findById(bookingId);
        expect(updatedBooking?.status).toBe('paid');

        // Verify payment record created
        const payment = await paymentRepository.findByBookingId(bookingId);
        expect(payment).not.toBeNull();
        expect(payment?.booking_id).toBe(bookingId);
        expect(payment?.provider).toBe('mock_gateway');
        expect(payment?.payment_status).toBe('success');
        expect(payment?.external_ref).toMatch(/^mock_\d+$/);
        expect(payment?.paid_at).toBeDefined();

        // Verify tickets generated
        const tickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        expect(tickets.length).toBe(3);
        tickets.forEach(ticket => {
          expect(ticket.is_checked_in).toBe(false);
          expect(ticket.qr_token).toBeDefined();
        });

        // Cleanup
        await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
        await db.delete(payments).where(eq(payments.booking_id, bookingId));
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });

    it('should generate correct number of tickets', async () => {
      await withRetry(async () => {
        // Arrange - Create booking with large quantity
        const bookingId = await bookingRepository.create({
          user_id: testUserId,
          package_id: testPackageId,
          visit_date: `2025-02-${Math.floor(Math.random() * 28) + 1}`,
          quantity: 10,
          total_price: 500000,
          status: 'pending',
        });

        // Act
        await service.processPayment(bookingId);

        // Assert
        const tickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        expect(tickets.length).toBe(10);

        // Verify all tickets have unique tokens
        const tokens = tickets.map(t => t.qr_token);
        const uniqueTokens = new Set(tokens);
        expect(uniqueTokens.size).toBe(10);

        // Cleanup
        await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
        await db.delete(payments).where(eq(payments.booking_id, bookingId));
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });

    it('should throw error for non-existent booking', async () => {
      // Act & Assert
      await expect(
        service.processPayment('non-existent-booking')
      ).rejects.toThrow('Booking not found');
    });

    it('should throw error for already paid booking', async () => {
      await withRetry(async () => {
        // Arrange - Create a paid booking
        const bookingId = await bookingRepository.create({
          user_id: testUserId,
          package_id: testPackageId,
          visit_date: `2025-03-${Math.floor(Math.random() * 28) + 1}`,
          quantity: 2,
          total_price: 100000,
          status: 'paid',
        });

        // Act & Assert
        await expect(
          service.processPayment(bookingId)
        ).rejects.toThrow('Booking already paid');

        // Cleanup
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });
  });

  describe('transaction rollback on error', () => {
    it('should rollback all changes if ticket generation fails', async () => {
      // Arrange - Create a pending booking
      const bookingId = await bookingRepository.create({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: `2025-04-${Math.floor(Math.random() * 28) + 1}`,
        quantity: 5,
        total_price: 250000,
        status: 'pending',
      });

      // Mock ticket service to throw error
      const originalGenerateTickets = ticketService.generateTickets;
      ticketService.generateTickets = async () => {
        throw new Error('Ticket generation failed');
      };

      // Act & Assert
      await expect(
        service.processPayment(bookingId)
      ).rejects.toThrow('Ticket generation failed');

      // Verify booking status not updated (rollback)
      const booking = await bookingRepository.findById(bookingId);
      expect(booking?.status).toBe('pending');

      // Verify no payment record created (rollback)
      const payment = await paymentRepository.findByBookingId(bookingId);
      expect(payment).toBeNull();

      // Verify no tickets created (rollback)
      const tickets = await db.query.qrTickets.findMany({
        where: eq(qrTickets.booking_id, bookingId),
      });
      expect(tickets.length).toBe(0);

      // Restore original function
      ticketService.generateTickets = originalGenerateTickets;

      // Cleanup
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });

    it('should not create payment if booking status update fails', async () => {
      // Arrange - Create a pending booking
      const bookingId = await bookingRepository.create({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: `2025-05-${Math.floor(Math.random() * 28) + 1}`,
        quantity: 2,
        total_price: 100000,
        status: 'pending',
      });

      // Mock booking repository to throw error on status update
      const originalUpdateStatus = bookingRepository.updateStatus;
      bookingRepository.updateStatus = async () => {
        throw new Error('Status update failed');
      };

      // Act & Assert
      await expect(
        service.processPayment(bookingId)
      ).rejects.toThrow('Status update failed');

      // Verify no payment record created
      const payment = await paymentRepository.findByBookingId(bookingId);
      expect(payment).toBeNull();

      // Verify no tickets created
      const tickets = await db.query.qrTickets.findMany({
        where: eq(qrTickets.booking_id, bookingId),
      });
      expect(tickets.length).toBe(0);

      // Restore original function
      bookingRepository.updateStatus = originalUpdateStatus;

      // Cleanup
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });
  });

  describe('complete payment workflow', () => {
    it('should execute all operations in correct order', async () => {
      // Arrange
      const bookingId = await bookingRepository.create({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: `2025-06-${Math.floor(Math.random() * 28) + 1}`,
        quantity: 4,
        total_price: 200000,
        status: 'pending',
      });

      // Track operation order
      const operations: string[] = [];
      
      // Mock to track order
      const originalUpdateStatus = bookingRepository.updateStatus;
      const originalCreatePayment = paymentRepository.create;
      const originalGenerateTickets = ticketService.generateTickets;

      bookingRepository.updateStatus = async (id, status) => {
        operations.push('updateStatus');
        return originalUpdateStatus.call(bookingRepository, id, status);
      };

      paymentRepository.create = async (data) => {
        operations.push('createPayment');
        return originalCreatePayment.call(paymentRepository, data);
      };

      ticketService.generateTickets = async (id, quantity) => {
        operations.push('generateTickets');
        return originalGenerateTickets.call(ticketService, id, quantity);
      };

      // Act
      await service.processPayment(bookingId);

      // Assert - Verify order
      expect(operations).toEqual(['updateStatus', 'createPayment', 'generateTickets']);

      // Restore original functions
      bookingRepository.updateStatus = originalUpdateStatus;
      paymentRepository.create = originalCreatePayment;
      ticketService.generateTickets = originalGenerateTickets;

      // Cleanup
      await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
      await db.delete(payments).where(eq(payments.booking_id, bookingId));
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });

    it('should handle payment for cancelled booking', async () => {
      // Arrange - Create a cancelled booking
      const bookingId = await bookingRepository.create({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: `2025-07-${Math.floor(Math.random() * 28) + 1}`,
        quantity: 3,
        total_price: 150000,
        status: 'cancelled',
      });

      // Act - Should allow payment for cancelled booking
      const result = await service.processPayment(bookingId);

      // Assert
      expect(result.success).toBe(true);

      // Verify booking status updated to paid
      const booking = await bookingRepository.findById(bookingId);
      expect(booking?.status).toBe('paid');

      // Verify payment created
      const payment = await paymentRepository.findByBookingId(bookingId);
      expect(payment).not.toBeNull();

      // Verify tickets generated
      const tickets = await db.query.qrTickets.findMany({
        where: eq(qrTickets.booking_id, bookingId),
      });
      expect(tickets.length).toBe(3);

      // Cleanup
      await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
      await db.delete(payments).where(eq(payments.booking_id, bookingId));
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });

    it('should handle single ticket booking', async () => {
      // Arrange
      const bookingId = await bookingRepository.create({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: `2025-08-${Math.floor(Math.random() * 28) + 1}`,
        quantity: 1,
        total_price: 50000,
        status: 'pending',
      });

      // Act
      const result = await service.processPayment(bookingId);

      // Assert
      expect(result.success).toBe(true);

      // Verify exactly one ticket generated
      const tickets = await db.query.qrTickets.findMany({
        where: eq(qrTickets.booking_id, bookingId),
      });
      expect(tickets.length).toBe(1);

      // Cleanup
      await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
      await db.delete(payments).where(eq(payments.booking_id, bookingId));
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });

    it('should handle large quantity booking', async () => {
      // Arrange
      const bookingId = await bookingRepository.create({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: `2025-09-${Math.floor(Math.random() * 28) + 1}`,
        quantity: 50,
        total_price: 2500000,
        status: 'pending',
      });

      // Act
      const result = await service.processPayment(bookingId);

      // Assert
      expect(result.success).toBe(true);

      // Verify all tickets generated
      const tickets = await db.query.qrTickets.findMany({
        where: eq(qrTickets.booking_id, bookingId),
      });
      expect(tickets.length).toBe(50);

      // Verify all tokens are unique
      const tokens = tickets.map(t => t.qr_token);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(50);

      // Cleanup
      await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
      await db.delete(payments).where(eq(payments.booking_id, bookingId));
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });
  });

  describe('payment record validation', () => {
    it('should create payment with correct provider', async () => {
      // Arrange
      const bookingId = await bookingRepository.create({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: `2025-10-${Math.floor(Math.random() * 28) + 1}`,
        quantity: 2,
        total_price: 100000,
        status: 'pending',
      });

      // Act
      await service.processPayment(bookingId);

      // Assert
      const payment = await paymentRepository.findByBookingId(bookingId);
      expect(payment?.provider).toBe('mock_gateway');

      // Cleanup
      await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
      await db.delete(payments).where(eq(payments.booking_id, bookingId));
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });

    it('should create payment with success status', async () => {
      // Arrange
      const bookingId = await bookingRepository.create({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: `2025-11-${Math.floor(Math.random() * 28) + 1}`,
        quantity: 2,
        total_price: 100000,
        status: 'pending',
      });

      // Act
      await service.processPayment(bookingId);

      // Assert
      const payment = await paymentRepository.findByBookingId(bookingId);
      expect(payment?.payment_status).toBe('success');

      // Cleanup
      await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
      await db.delete(payments).where(eq(payments.booking_id, bookingId));
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });

    it('should create payment with external reference', async () => {
      // Arrange
      const bookingId = await bookingRepository.create({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: `2025-12-${Math.floor(Math.random() * 28) + 1}`,
        quantity: 2,
        total_price: 100000,
        status: 'pending',
      });

      // Act
      const beforePayment = Date.now();
      await service.processPayment(bookingId);

      // Assert
      const payment = await paymentRepository.findByBookingId(bookingId);
      expect(payment?.external_ref).toMatch(/^mock_\d+$/);
      
      // Verify timestamp is reasonable
      const refTimestamp = parseInt(payment?.external_ref?.replace('mock_', '') || '0');
      expect(refTimestamp).toBeGreaterThanOrEqual(beforePayment);
      expect(refTimestamp).toBeLessThanOrEqual(Date.now());

      // Cleanup
      await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
      await db.delete(payments).where(eq(payments.booking_id, bookingId));
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });

    it('should create payment with paid_at timestamp', async () => {
      // Arrange
      const bookingId = await bookingRepository.create({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: `2025-01-${Math.floor(Math.random() * 28) + 1}`,
        quantity: 2,
        total_price: 100000,
        status: 'pending',
      });

      // Act
      const beforePayment = new Date().toISOString();
      await service.processPayment(bookingId);
      const afterPayment = new Date().toISOString();

      // Assert
      const payment = await paymentRepository.findByBookingId(bookingId);
      expect(payment?.paid_at).toBeDefined();
      expect(payment?.paid_at).not.toBeNull();
      expect(payment?.paid_at! >= beforePayment).toBe(true);
      expect(payment?.paid_at! <= afterPayment).toBe(true);

      // Cleanup
      await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
      await db.delete(payments).where(eq(payments.booking_id, bookingId));
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });
  });
});
