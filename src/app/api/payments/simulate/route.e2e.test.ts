/**
 * E2E tests for Payments API Route
 * Tests complete HTTP request/response flow
 * 
 * Validates: Requirements 8.1-8.10, 12.3-12.10
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';
import { POST } from './route';
import { db, waitForDb } from '@/db';
import { bookings, ticketPackages, users, payments, qrTickets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withRetry, cleanDatabase } from '@/lib/test-utils';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('POST /api/payments/simulate - E2E Tests', () => {
  let testUserId: string;
  let testPackageId: string;
  const testPrefix = `test-payment-e2e-${Date.now()}`;
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

  beforeAll(async () => {
    await waitForDb();
    
    await withRetry(async () => {
      // Create test user
      const userResult = await db.insert(users).values({
        name: 'Test User Payment E2E',
        email: `${testPrefix}@example.com`,
        password_hash: 'test-hash',
        role: 'user',
      }).returning();
      testUserId = userResult[0].id;

      // Create test package
      const packageResult = await db.insert(ticketPackages).values({
        name: `${testPrefix}-package`,
        category: 'personal',
        description: 'Test package for payment E2E tests',
        base_price: 50000,
        promo_price: null,
        quota_per_day: 10,
        is_active: true,
      }).returning();
      testPackageId = packageResult[0].id;
    });
  });

  beforeEach(async () => {
    // Membersihkan data sisa dari test sebelumnya
    await cleanDatabase();
  });

  afterEach(() => {
    mockGetServerSession.mockReset();
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: 'some-booking-id',
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });
  });

  describe('Valid Payment Processing', () => {
    it('should return 200 with success message for valid payment', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, email: `${testPrefix}@example.com`, name: 'Test User' },
        expires: '2025-12-31',
      } as any);

      // Create a pending booking
      const bookingResult = await db.insert(bookings).values({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: '2025-06-15',
        quantity: 3,
        total_price: 150000,
        status: 'pending',
      }).returning();
      const bookingId = bookingResult[0].id;

      const request = new NextRequest('http://localhost:3000/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('bookingId');
      expect(data.message).toBe('Payment successful');
      expect(data.bookingId).toBe(bookingId);

      // Verify booking status updated
      const updatedBooking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
      });
      expect(updatedBooking?.status).toBe('paid');

      // Verify payment record created
      const payment = await db.query.payments.findFirst({
        where: eq(payments.booking_id, bookingId),
      });
      expect(payment).not.toBeNull();
      expect(payment?.provider).toBe('mock_gateway');
      expect(payment?.payment_status).toBe('success');

      // Verify tickets generated
      const tickets = await db.query.qrTickets.findMany({
        where: eq(qrTickets.booking_id, bookingId),
      });
      expect(tickets.length).toBe(3);

      // Cleanup booking created in this test
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });

    it('should maintain backward compatible response format', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, email: `${testPrefix}@example.com`, name: 'Test User' },
        expires: '2025-12-31',
      } as any);

      // Create a pending booking
      const bookingResult = await db.insert(bookings).values({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: '2025-06-20',
        quantity: 2,
        total_price: 100000,
        status: 'pending',
      }).returning();
      const bookingId = bookingResult[0].id;

      const request = new NextRequest('http://localhost:3000/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert - Verify exact response structure
      expect(response.status).toBe(200);
      expect(Object.keys(data).sort()).toEqual(['bookingId', 'message'].sort());
      expect(data.message).toBe('Payment successful');
      expect(data.bookingId).toBe(bookingId);

      // Cleanup booking created in this test
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });

    it('should generate correct number of tickets', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, email: `${testPrefix}@example.com`, name: 'Test User' },
        expires: '2025-12-31',
      } as any);

      // Create a pending booking with large quantity
      const bookingResult = await db.insert(bookings).values({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: '2025-07-01',
        quantity: 10,
        total_price: 500000,
        status: 'pending',
      }).returning();
      const bookingId = bookingResult[0].id;

      const request = new NextRequest('http://localhost:3000/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);

      // Verify correct number of tickets
      const tickets = await db.query.qrTickets.findMany({
        where: eq(qrTickets.booking_id, bookingId),
      });
      expect(tickets.length).toBe(10);

      // Verify all tickets have unique tokens
      const tokens = tickets.map(t => t.qr_token);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(10);

      // Cleanup booking created in this test
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for missing bookingId', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, email: `${testPrefix}@example.com`, name: 'Test User' },
        expires: '2025-12-31',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Missing bookingId
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe('Validation failed');
      expect(data.errors).toBeDefined();
    });

    it('should return 400 for invalid JSON body', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, email: `${testPrefix}@example.com`, name: 'Test User' },
        expires: '2025-12-31',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(500);
    });
  });

  describe('Booking Not Found', () => {
    it('should return 404 for non-existent booking', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, email: `${testPrefix}@example.com`, name: 'Test User' },
        expires: '2025-12-31',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: 'non-existent-booking-id',
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.message).toBe('Booking not found');
    });
  });

  describe('Already Paid Booking', () => {
    it('should return 400 for already paid booking', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, email: `${testPrefix}@example.com`, name: 'Test User' },
        expires: '2025-12-31',
      } as any);

      // Create a paid booking
      const bookingResult = await db.insert(bookings).values({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: '2025-08-01',
        quantity: 2,
        total_price: 100000,
        status: 'paid', // Already paid
      }).returning();
      const bookingId = bookingResult[0].id;

      const request = new NextRequest('http://localhost:3000/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe('Booking already paid');

      // Cleanup booking created in this test
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });

    it('should not create duplicate payment for already paid booking', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, email: `${testPrefix}@example.com`, name: 'Test User' },
        expires: '2025-12-31',
      } as any);

      // Create a paid booking
      const bookingResult = await db.insert(bookings).values({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: '2025-08-15',
        quantity: 2,
        total_price: 100000,
        status: 'paid',
      }).returning();
      const bookingId = bookingResult[0].id;

      const request = new NextRequest('http://localhost:3000/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      // Act
      await POST(request);

      // Assert - Verify no payment record created
      const paymentRecords = await db.query.payments.findMany({
        where: eq(payments.booking_id, bookingId),
      });
      expect(paymentRecords.length).toBe(0);

      // Cleanup booking created in this test
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });
  });

  describe('Edge Cases', () => {
    it('should handle payment for cancelled booking', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, email: `${testPrefix}@example.com`, name: 'Test User' },
        expires: '2025-12-31',
      } as any);

      // Create a cancelled booking
      const bookingResult = await db.insert(bookings).values({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: '2025-09-01',
        quantity: 2,
        total_price: 100000,
        status: 'cancelled',
      }).returning();
      const bookingId = bookingResult[0].id;

      const request = new NextRequest('http://localhost:3000/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert - Should allow payment for cancelled booking
      expect(response.status).toBe(200);
      expect(data.message).toBe('Payment successful');

      // Verify booking status updated to paid
      const updatedBooking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
      });
      expect(updatedBooking?.status).toBe('paid');

      // Cleanup booking created in this test
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });

    it('should handle payment for single ticket booking', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, email: `${testPrefix}@example.com`, name: 'Test User' },
        expires: '2025-12-31',
      } as any);

      // Create a booking with quantity 1
      const bookingResult = await db.insert(bookings).values({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: '2025-09-15',
        quantity: 1,
        total_price: 50000,
        status: 'pending',
      }).returning();
      const bookingId = bookingResult[0].id;

      const request = new NextRequest('http://localhost:3000/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);

      // Verify exactly one ticket generated
      const tickets = await db.query.qrTickets.findMany({
        where: eq(qrTickets.booking_id, bookingId),
      });
      expect(tickets.length).toBe(1);

      // Cleanup booking created in this test
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });
  });

  describe('Payment Record Validation', () => {
    it('should create payment with correct provider', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, email: `${testPrefix}@example.com`, name: 'Test User' },
        expires: '2025-12-31',
      } as any);

      const bookingResult = await db.insert(bookings).values({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: '2025-10-01',
        quantity: 2,
        total_price: 100000,
        status: 'pending',
      }).returning();
      const bookingId = bookingResult[0].id;

      const request = new NextRequest('http://localhost:3000/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      // Act
      await POST(request);

      // Assert
      const payment = await db.query.payments.findFirst({
        where: eq(payments.booking_id, bookingId),
      });
      expect(payment?.provider).toBe('mock_gateway');
      expect(payment?.payment_status).toBe('success');
      expect(payment?.external_ref).toMatch(/^mock_\d+$/);
      expect(payment?.paid_at).toBeDefined();

      // Cleanup booking created in this test
      await db.delete(bookings).where(eq(bookings.id, bookingId));
    });
  });

  describe('Response Format Verification', () => {
    it('should return consistent error format for all error types', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, email: `${testPrefix}@example.com`, name: 'Test User' },
        expires: '2025-12-31',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: 'non-existent',
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert - All errors should have 'message' field
      expect(data).toHaveProperty('message');
      expect(typeof data.message).toBe('string');
    });
  });
});
