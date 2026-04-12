import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';
import { db, waitForDb } from '@/db';
import { users, bookings, qrTickets, ticketPackages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withRetry, cleanDatabase } from '@/lib/test-utils';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/tickets/check-in/route';
import { getServerSession } from 'next-auth';

// Mocking Next-Auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const testPrefix = `test-checkin-e2e-${Date.now()}`;

let testUserId = '';
let testAdminId = '';
let testStaffId = '';
let testPackageId = '';
let testBookingId = '';

describe('POST /api/tickets/check-in - E2E Tests', () => {
  beforeAll(async () => {
    await waitForDb();
    
    await withRetry(async () => {
      // 1. Buat Users
      const userResult = await db.insert(users).values({
        name: 'Test User Check-In',
        email: `${testPrefix}-user@example.com`,
        password_hash: 'test-hash',
        role: 'user',
      }).returning();
      testUserId = userResult[0].id;

      const adminResult = await db.insert(users).values({
        name: 'Test Admin Check-In',
        email: `${testPrefix}-admin@example.com`,
        password_hash: 'test-hash',
        role: 'admin',
      }).returning();
      testAdminId = adminResult[0].id;

      const staffResult = await db.insert(users).values({
        name: 'Test Staff Check-In',
        email: `${testPrefix}-staff@example.com`,
        password_hash: 'test-hash',
        role: 'staff',
      }).returning();
      testStaffId = staffResult[0].id;

      // 2. Buat Package
      const packageResult = await db.insert(ticketPackages).values({
        name: 'Test Package Check-In',
        category: 'personal',
        description: 'Test package for check-in',
        base_price: 50000,
        quota_per_day: 10,
        is_active: true,
      }).returning();
      testPackageId = packageResult[0].id;

      // 3. Buat Booking
      const bookingResult = await db.insert(bookings).values({
        user_id: testUserId,
        package_id: testPackageId,
        visit_date: '2025-12-25',
        quantity: 1,
        total_price: 50000,
        status: 'paid',
      }).returning();
      testBookingId = bookingResult[0].id;
    });
  });

  beforeEach(async () => {
    // Membersihkan data sisa dari test sebelumnya
    await cleanDatabase();
  });

  afterEach(() => {
    mockGetServerSession.mockReset();
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/tickets/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: 'some-token' }),
      });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return 401 for non-admin/staff user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, role: 'user', email: 'user@test.com' },
        expires: '2025-12-31',
      } as any);
      const request = new NextRequest('http://localhost:3000/api/tickets/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: 'some-token' }),
      });
      const response = await POST(request);
      expect([401, 403]).toContain(response.status);
    });

    it('should allow admin user to check in tickets', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: testAdminId, role: 'admin', email: 'admin@test.com' },
        expires: '2025-12-31',
      } as any);

      // Create a fresh ticket for this test
      const testQrToken = `qr-admin-test-${Date.now()}`;
      await db.insert(qrTickets).values({
        booking_id: testBookingId,
        qr_token: testQrToken,
        is_checked_in: false,
      });

      const request = new NextRequest('http://localhost:3000/api/tickets/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: testQrToken }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ticket).toBeDefined();
      expect(data.ticket.id).toBeDefined();
      expect(data.ticket.visitorName).toBe('Test User Check-In');
      expect(data.ticket.visitDate).toBe('2025-12-25');
    });

    it('should allow staff user to check in tickets', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: testStaffId, role: 'staff', email: 'staff@test.com' },
        expires: '2025-12-31',
      } as any);

      // Create a fresh ticket for this test
      const testQrToken = `qr-staff-test-${Date.now()}`;
      await db.insert(qrTickets).values({
        booking_id: testBookingId,
        qr_token: testQrToken,
        is_checked_in: false,
      });

      const request = new NextRequest('http://localhost:3000/api/tickets/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: testQrToken }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ticket).toBeDefined();
      expect(data.ticket.visitorName).toBe('Test User Check-In');
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for missing qrToken', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: testAdminId, role: 'admin', email: 'admin@test.com' },
        expires: '2025-12-31',
      } as any);
      const request = new NextRequest('http://localhost:3000/api/tickets/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 500 for invalid JSON body', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: testAdminId, role: 'admin', email: 'admin@test.com' },
        expires: '2025-12-31',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/tickets/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'bukan json',
      });
      
      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });

  describe('Ticket Not Found & Already Used', () => {
    it('should return 404 for non-existent ticket', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: testAdminId, role: 'admin', email: 'admin@test.com' },
        expires: '2025-12-31',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/tickets/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: 'qr-tidak-ada' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it('should return 400 for already checked in ticket', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: testAdminId, role: 'admin', email: 'admin@test.com' },
        expires: '2025-12-31',
      } as any);

      // Create a ticket and check it in first
      const testQrToken = `qr-already-used-${Date.now()}`;
      await db.insert(qrTickets).values({
        booking_id: testBookingId,
        qr_token: testQrToken,
        is_checked_in: false,
      });

      // First check-in (should succeed)
      const request1 = new NextRequest('http://localhost:3000/api/tickets/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: testQrToken }),
      });
      await POST(request1);

      // Second check-in (should fail)
      const request2 = new NextRequest('http://localhost:3000/api/tickets/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: testQrToken }),
      });
      const response = await POST(request2);
      const data = await response.json();

      expect(response.status).toBe(400);
      const errorMessage = data.error || data.message;
      expect(errorMessage).toMatch(/already|used/i);
    });
  });
});