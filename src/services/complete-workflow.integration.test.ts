/**
 * Integration tests for complete booking workflow
 * Tests the full flow: booking → payment → check-in
 * 
 * Validates: Requirements 4.1-4.10, 5.1-5.10, 6.1-6.10
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { BookingService } from './booking.service';
import { PaymentService } from './payment.service';
import { TicketService } from './ticket.service';
import { bookingRepository } from '@/repositories/booking.repository';
import { packageRepository } from '@/repositories/package.repository';
import { paymentRepository } from '@/repositories/payment.repository';
import { ticketRepository } from '@/repositories/ticket.repository';
import { pricingService } from './pricing.service';
import { db, waitForDb } from '@/db';
import { bookings, ticketPackages, users, payments, qrTickets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withRetry } from '@/lib/test-utils';

describe('Complete Workflow Integration Tests', () => {
  let bookingService: BookingService;
  let paymentService: PaymentService;
  let ticketService: TicketService;
  let testUserId: string;
  let testPackageId: string;
  const testPrefix = `test-workflow-${Date.now()}`;

  // Increase timeout for integration tests
  jest.setTimeout(60000);

  beforeAll(async () => {
    await waitForDb();
    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await withRetry(async () => {
      // Initialize services with real dependencies
      bookingService = new BookingService(
        bookingRepository,
        packageRepository,
        pricingService
      );
      paymentService = new PaymentService(
        bookingRepository,
        paymentRepository,
        ticketService
      );
      ticketService = new TicketService(ticketRepository);

      // Create test user
      const userResult = await db.insert(users).values({
        name: 'Test User Workflow',
        email: `${testPrefix}@example.com`,
        password_hash: 'test-hash',
        role: 'user',
      }).returning();
      testUserId = userResult[0].id;

      // Create test package
      const packageResult = await db.insert(ticketPackages).values({
        name: `${testPrefix}-package`,
        category: 'school',
        description: 'Test package for workflow integration tests',
        base_price: 50000,
        promo_price: null,
        quota_per_day: 100,
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

  describe('Complete Flow: Booking → Payment → Check-in', () => {
    it('should execute complete workflow successfully', async () => {
      await withRetry(async () => {
        // ========== STEP 1: CREATE BOOKING ==========
        const bookingData = {
          userId: testUserId,
          packageId: testPackageId,
          visitDate: '2025-06-15',
          quantity: 3,
        };

        const bookingId = await bookingService.createBooking(bookingData);

        // Verify booking created
        expect(bookingId).toBeDefined();
        expect(typeof bookingId).toBe('string');

        const booking = await bookingRepository.findById(bookingId);
        expect(booking).not.toBeNull();
        expect(booking?.status).toBe('pending');
        expect(booking?.user_id).toBe(testUserId);
        expect(booking?.package_id).toBe(testPackageId);
        expect(booking?.quantity).toBe(3);
        expect(booking?.total_price).toBe(150000); // 3 * 50000

        // ========== STEP 2: PROCESS PAYMENT ==========
        const paymentResult = await paymentService.processPayment(bookingId);

        // Verify payment processed
        expect(paymentResult.success).toBe(true);
        expect(paymentResult.bookingId).toBe(bookingId);
        expect(paymentResult.message).toBe('Payment successful');

        // Verify booking status updated
        const paidBooking = await bookingRepository.findById(bookingId);
        expect(paidBooking?.status).toBe('paid');

        // Verify payment record created
        const payment = await paymentRepository.findByBookingId(bookingId);
        expect(payment).not.toBeNull();
        expect(payment?.provider).toBe('mock_gateway');
        expect(payment?.payment_status).toBe('success');

        // Verify tickets generated
        const tickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        expect(tickets.length).toBe(3);

        // ========== STEP 3: CHECK-IN TICKETS ==========
        const checkedInTickets = [];

        for (const ticket of tickets) {
          const checkInResult = await ticketService.checkInTicket(ticket.qr_token);

          // Verify check-in result
          expect(checkInResult.ticketId).toBe(ticket.id);
          expect(checkInResult.packageName).toBe(`${testPrefix}-package`);
          expect(checkInResult.visitorName).toBe('Test User Workflow');
          expect(checkInResult.visitDate).toBe('2025-06-15');
          expect(checkInResult.checkedInAt).toBeDefined();

          checkedInTickets.push(checkInResult);
        }

        // Verify all tickets checked in
        expect(checkedInTickets.length).toBe(3);

        // Verify tickets marked as checked in
        const checkedTickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        checkedTickets.forEach(ticket => {
          expect(ticket.is_checked_in).toBe(true);
          expect(ticket.checked_in_at).not.toBeNull();
        });

        // Cleanup
        await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
        await db.delete(payments).where(eq(payments.booking_id, bookingId));
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });

    it('should handle workflow with school package discount', async () => {
      await withRetry(async () => {
        // ========== STEP 1: CREATE BOOKING WITH DISCOUNT ==========
        const bookingData = {
          userId: testUserId,
          packageId: testPackageId,
          visitDate: '2025-07-20',
          quantity: 100, // Qualifies for 15% discount
        };

        const bookingId = await bookingService.createBooking(bookingData);

        // Verify booking with discount
        const booking = await bookingRepository.findById(bookingId);
        expect(booking).not.toBeNull();
        expect(booking?.quantity).toBe(100);
        // 100 * floor(50000 * 0.85) = 100 * 42500 = 4,250,000
        expect(booking?.total_price).toBe(4250000);

        // ========== STEP 2: PROCESS PAYMENT ==========
        const paymentResult = await paymentService.processPayment(bookingId);
        expect(paymentResult.success).toBe(true);

        // Verify 100 tickets generated
        const tickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        expect(tickets.length).toBe(100);

        // ========== STEP 3: CHECK-IN SAMPLE TICKETS ==========
        // Check in first 5 tickets
        for (let i = 0; i < 5; i++) {
          const checkInResult = await ticketService.checkInTicket(tickets[i].qr_token);
          expect(checkInResult.ticketId).toBe(tickets[i].id);
        }

        // Verify 5 tickets checked in, 95 not checked in
        const allTickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        const checkedIn = allTickets.filter(t => t.is_checked_in);
        const notCheckedIn = allTickets.filter(t => !t.is_checked_in);
        expect(checkedIn.length).toBe(5);
        expect(notCheckedIn.length).toBe(95);

        // Cleanup
        await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
        await db.delete(payments).where(eq(payments.booking_id, bookingId));
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });

    it('should prevent double check-in', async () => {
      await withRetry(async () => {
        // ========== STEP 1: CREATE BOOKING ==========
        const bookingData = {
          userId: testUserId,
          packageId: testPackageId,
          visitDate: '2025-08-10',
          quantity: 2,
        };

        const bookingId = await bookingService.createBooking(bookingData);

        // ========== STEP 2: PROCESS PAYMENT ==========
        await paymentService.processPayment(bookingId);

        // Get tickets
        const tickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        expect(tickets.length).toBe(2);

        // ========== STEP 3: CHECK-IN FIRST TIME ==========
        const firstCheckIn = await ticketService.checkInTicket(tickets[0].qr_token);
        expect(firstCheckIn.ticketId).toBe(tickets[0].id);

        // ========== STEP 4: ATTEMPT DOUBLE CHECK-IN ==========
        await expect(
          ticketService.checkInTicket(tickets[0].qr_token)
        ).rejects.toThrow('Ticket already used');

        // Verify only one ticket checked in
        const allTickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        const checkedIn = allTickets.filter(t => t.is_checked_in);
        expect(checkedIn.length).toBe(1);

        // Cleanup
        await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
        await db.delete(payments).where(eq(payments.booking_id, bookingId));
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });

    it('should handle single ticket workflow', async () => {
      await withRetry(async () => {
        // ========== STEP 1: CREATE BOOKING ==========
        const bookingData = {
          userId: testUserId,
          packageId: testPackageId,
          visitDate: '2025-09-05',
          quantity: 1,
        };

        const bookingId = await bookingService.createBooking(bookingData);

        // ========== STEP 2: PROCESS PAYMENT ==========
        await paymentService.processPayment(bookingId);

        // ========== STEP 3: CHECK-IN ==========
        const tickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        expect(tickets.length).toBe(1);

        const checkInResult = await ticketService.checkInTicket(tickets[0].qr_token);
        expect(checkInResult.ticketId).toBe(tickets[0].id);

        // Verify ticket checked in
        const ticket = await db.query.qrTickets.findFirst({
          where: eq(qrTickets.id, tickets[0].id),
        });
        expect(ticket?.is_checked_in).toBe(true);

        // Cleanup
        await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
        await db.delete(payments).where(eq(payments.booking_id, bookingId));
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });

    it('should maintain data integrity throughout workflow', async () => {
      await withRetry(async () => {
        // ========== STEP 1: CREATE BOOKING ==========
        const bookingData = {
          userId: testUserId,
          packageId: testPackageId,
          visitDate: '2025-10-15',
          quantity: 5,
        };

        const bookingId = await bookingService.createBooking(bookingData);

        // ========== STEP 2: VERIFY BOOKING DATA ==========
        const booking = await bookingRepository.findById(bookingId);
        expect(booking?.user_id).toBe(testUserId);
        expect(booking?.package_id).toBe(testPackageId);
        expect(booking?.visit_date).toBe('2025-10-15');
        expect(booking?.quantity).toBe(5);
        expect(booking?.status).toBe('pending');

        // ========== STEP 3: PROCESS PAYMENT ==========
        await paymentService.processPayment(bookingId);

        // ========== STEP 4: VERIFY PAYMENT DATA ==========
        const payment = await paymentRepository.findByBookingId(bookingId);
        expect(payment?.booking_id).toBe(bookingId);
        expect(payment?.provider).toBe('mock_gateway');
        expect(payment?.payment_status).toBe('success');
        expect(payment?.external_ref).toMatch(/^mock_\d+$/);
        expect(payment?.paid_at).toBeDefined();

        // ========== STEP 5: VERIFY TICKET DATA ==========
        const tickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        expect(tickets.length).toBe(5);

        // Verify all tickets have unique tokens
        const tokens = tickets.map(t => t.qr_token);
        const uniqueTokens = new Set(tokens);
        expect(uniqueTokens.size).toBe(5);

        // Verify all tickets linked to correct booking
        tickets.forEach(ticket => {
          expect(ticket.booking_id).toBe(bookingId);
          expect(ticket.is_checked_in).toBe(false);
          expect(ticket.checked_in_at).toBeNull();
        });

        // ========== STEP 6: CHECK-IN ALL TICKETS ==========
        for (const ticket of tickets) {
          await ticketService.checkInTicket(ticket.qr_token);
        }

        // ========== STEP 7: VERIFY CHECK-IN DATA ==========
        const checkedTickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        checkedTickets.forEach(ticket => {
          expect(ticket.is_checked_in).toBe(true);
          expect(ticket.checked_in_at).not.toBeNull();
        });

        // Cleanup
        await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
        await db.delete(payments).where(eq(payments.booking_id, bookingId));
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });

    it('should handle partial check-in scenario', async () => {
      await withRetry(async () => {
        // ========== STEP 1: CREATE BOOKING ==========
        const bookingData = {
          userId: testUserId,
          packageId: testPackageId,
          visitDate: '2025-11-20',
          quantity: 10,
        };

        const bookingId = await bookingService.createBooking(bookingData);

        // ========== STEP 2: PROCESS PAYMENT ==========
        await paymentService.processPayment(bookingId);

        // ========== STEP 3: PARTIAL CHECK-IN (only 6 out of 10) ==========
        const tickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        expect(tickets.length).toBe(10);

        // Check in first 6 tickets
        for (let i = 0; i < 6; i++) {
          await ticketService.checkInTicket(tickets[i].qr_token);
        }

        // ========== STEP 4: VERIFY PARTIAL CHECK-IN STATE ==========
        const allTickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });

        const checkedIn = allTickets.filter(t => t.is_checked_in);
        const notCheckedIn = allTickets.filter(t => !t.is_checked_in);

        expect(checkedIn.length).toBe(6);
        expect(notCheckedIn.length).toBe(4);

        // Verify checked in tickets have timestamps
        checkedIn.forEach(ticket => {
          expect(ticket.checked_in_at).not.toBeNull();
        });

        // Verify not checked in tickets don't have timestamps
        notCheckedIn.forEach(ticket => {
          expect(ticket.checked_in_at).toBeNull();
        });

        // Cleanup
        await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
        await db.delete(payments).where(eq(payments.booking_id, bookingId));
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });
  });

  describe('Workflow Error Scenarios', () => {
    it('should not allow payment before booking exists', async () => {
      // Act & Assert
      await expect(
        paymentService.processPayment('non-existent-booking')
      ).rejects.toThrow('Booking not found');
    });

    it('should not allow check-in before payment', async () => {
      await withRetry(async () => {
        // ========== STEP 1: CREATE BOOKING ==========
        const bookingData = {
          userId: testUserId,
          packageId: testPackageId,
          visitDate: '2025-12-01',
          quantity: 2,
        };

        const bookingId = await bookingService.createBooking(bookingData);

        // ========== STEP 2: ATTEMPT CHECK-IN WITHOUT PAYMENT ==========
        // No tickets exist yet, so any token will fail
        await expect(
          ticketService.checkInTicket('fake-token')
        ).rejects.toThrow('Ticket not found');

        // Verify no tickets exist
        const tickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        expect(tickets.length).toBe(0);

        // Cleanup
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });

    it('should not allow double payment', async () => {
      await withRetry(async () => {
        // ========== STEP 1: CREATE BOOKING ==========
        const bookingData = {
          userId: testUserId,
          packageId: testPackageId,
          visitDate: '2025-12-15',
          quantity: 2,
        };

        const bookingId = await bookingService.createBooking(bookingData);

        // ========== STEP 2: FIRST PAYMENT ==========
        await paymentService.processPayment(bookingId);

        // ========== STEP 3: ATTEMPT SECOND PAYMENT ==========
        await expect(
          paymentService.processPayment(bookingId)
        ).rejects.toThrow('Booking already paid');

        // Verify only one payment record exists
        const payment = await paymentRepository.findByBookingId(bookingId);
        expect(payment).not.toBeNull();

        // Cleanup
        await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
        await db.delete(payments).where(eq(payments.booking_id, bookingId));
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });

    it('should handle invalid QR token gracefully', async () => {
      // Act & Assert
      await expect(
        ticketService.checkInTicket('invalid-qr-token')
      ).rejects.toThrow('Ticket not found');
    });
  });

  describe('Workflow with Different Package Types', () => {
    it('should handle personal package workflow', async () => {
      await withRetry(async () => {
        // Create personal package
        const personalPackage = await db.insert(ticketPackages).values({
          name: `${testPrefix}-personal`,
          category: 'personal',
          description: 'Personal package',
          base_price: 75000,
          promo_price: null,
          quota_per_day: 50,
          is_active: true,
        }).returning();

        // ========== STEP 1: CREATE BOOKING ==========
        const bookingData = {
          userId: testUserId,
          packageId: personalPackage[0].id,
          visitDate: '2025-12-20',
          quantity: 3,
        };

        const bookingId = await bookingService.createBooking(bookingData);

        // Verify no discount applied (personal package)
        const booking = await bookingRepository.findById(bookingId);
        expect(booking?.total_price).toBe(225000); // 3 * 75000

        // ========== STEP 2: PROCESS PAYMENT ==========
        await paymentService.processPayment(bookingId);

        // ========== STEP 3: CHECK-IN ==========
        const tickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        expect(tickets.length).toBe(3);

        await ticketService.checkInTicket(tickets[0].qr_token);

        // Cleanup
        await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
        await db.delete(payments).where(eq(payments.booking_id, bookingId));
        await db.delete(bookings).where(eq(bookings.id, bookingId));
        await db.delete(ticketPackages).where(eq(ticketPackages.id, personalPackage[0].id));
      });
    });

    it('should handle school package with 10% discount workflow', async () => {
      await withRetry(async () => {
        // ========== STEP 1: CREATE BOOKING (50-99 quantity) ==========
        const bookingData = {
          userId: testUserId,
          packageId: testPackageId,
          visitDate: '2025-12-25',
          quantity: 75, // Qualifies for 10% discount
        };

        const bookingId = await bookingService.createBooking(bookingData);

        // Verify 10% discount applied
        const booking = await bookingRepository.findById(bookingId);
        // 75 * floor(50000 * 0.90) = 75 * 45000 = 3,375,000
        expect(booking?.total_price).toBe(3375000);

        // ========== STEP 2: PROCESS PAYMENT ==========
        await paymentService.processPayment(bookingId);

        // ========== STEP 3: CHECK-IN SAMPLE ==========
        const tickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });
        expect(tickets.length).toBe(75);

        // Check in first ticket
        const checkInResult = await ticketService.checkInTicket(tickets[0].qr_token);
        expect(checkInResult.ticketId).toBe(tickets[0].id);

        // Cleanup
        await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
        await db.delete(payments).where(eq(payments.booking_id, bookingId));
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });
  });

  describe('Workflow Performance', () => {
    it('should complete workflow in reasonable time', async () => {
      await withRetry(async () => {
        const startTime = Date.now();

        // ========== COMPLETE WORKFLOW ==========
        const bookingData = {
          userId: testUserId,
          packageId: testPackageId,
          visitDate: '2025-12-30',
          quantity: 5,
        };

        const bookingId = await bookingService.createBooking(bookingData);
        await paymentService.processPayment(bookingId);

        const tickets = await db.query.qrTickets.findMany({
          where: eq(qrTickets.booking_id, bookingId),
        });

        for (const ticket of tickets) {
          await ticketService.checkInTicket(ticket.qr_token);
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Workflow should complete in less than 5 seconds
        expect(duration).toBeLessThan(5000);

        // Cleanup
        await db.delete(qrTickets).where(eq(qrTickets.booking_id, bookingId));
        await db.delete(payments).where(eq(payments.booking_id, bookingId));
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      });
    });
  });
});
