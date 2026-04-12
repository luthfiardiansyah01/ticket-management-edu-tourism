/**
 * E2E tests for Bookings API Route
 * Tests complete HTTP request/response flow
 */

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';
import { db, waitForDb } from '@/db';
import { users, bookings, ticketPackages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withRetry, cleanDatabase } from '@/lib/test-utils';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/bookings/route';
import { getServerSession } from 'next-auth';

describe('POST /api/bookings - E2E Tests', () => {
  let testUserId: string;
  let testPackageId: string;
  let inactivePackageId: string;
  const testPrefix = `test-e2e-${Date.now()}`;
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

  beforeAll(async () => {
    // Tunggu PRAGMA & Migrasi selesai (sudah otomatis atur test.db)
    await waitForDb();

    await withRetry(async () => {
      const packageResult = await db.insert(ticketPackages).values({
        name: `${testPrefix}-active`,
        category: 'personal',
        description: 'Active test package',
        base_price: 50000,
        quota_per_day: 5,
        is_active: true,
      }).returning();
      testPackageId = packageResult[0].id;

      const userResult = await db.insert(users).values({
        name: 'Test User E2E',
        email: `${testPrefix}@example.com`,
        password_hash: 'test-hash',
        role: 'user',
      }).returning();
      testUserId = userResult[0].id;

      const inactiveResult = await db.insert(ticketPackages).values({
        name: `${testPrefix}-inactive`,
        category: 'personal',
        description: 'Inactive test package',
        base_price: 50000,
        quota_per_day: 10,
        is_active: false,
      }).returning();
      inactivePackageId = inactiveResult[0].id;
    });
  });

  beforeEach(async () => {
    // Bersihkan tabel transaksi sebelum setiap test (Users & Packages aman)
    await cleanDatabase();
  });

  afterEach(() => {
    mockGetServerSession.mockReset();
  });

  // afterAll TIDAK PERLU LAGI karena cleanDatabase & ID unik sudah menangani isolasi

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: testPackageId, visitDate: '2025-12-25', quantity: 2 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });
  });

  describe('Valid Booking Creation', () => {
    it('should return 201 with bookingId for valid request', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, email: `${testPrefix}@example.com`, name: 'Test User', role: 'user' },
        expires: '2025-12-31',
      } as any);

      const visitDate = `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-15`;
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: testPackageId, visitDate, quantity: 2 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('bookingId');
      expect(data.message).toBe('Booking created');

      // Verifikasi langsung di database (tanpa khawatir menumpuk karena beforeEach akan bersihkan)
      const createdBooking = await db.query.bookings.findFirst({
        where: eq(bookings.id, data.bookingId),
      });
      expect(createdBooking).not.toBeNull();
      expect(createdBooking?.quantity).toBe(2);
      // Tidak perlu db.delete() di sini!
    });

    it('should maintain backward compatible response format', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: testUserId, email: `${testPrefix}@example.com`, name: 'Test User', role: 'user' },
        expires: '2025-12-31',
      } as any);

      const visitDate = `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-20`;
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: testPackageId, visitDate, quantity: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(Object.keys(data).sort()).toEqual(['bookingId', 'message'].sort());
    });
  });

  describe('Validation Errors', () => {
    // (Saya ringkas sedikit bagian validation agar tidak terlalu panjang, logikanya sama)
    it('should return 400 for invalid date format', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: testUserId, role: 'user' }, expires: '2025-12-31' } as any);
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: testPackageId, visitDate: '25-12-2025', quantity: 2 }),
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: testUserId, role: 'user' }, expires: '2025-12-31' } as any);
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: testPackageId }),
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for quantity less than 1', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: testUserId, role: 'user' }, expires: '2025-12-31' } as any);
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: testPackageId, visitDate: '2025-12-25', quantity: 0 }),
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 500 for invalid JSON body', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: testUserId, role: 'user' }, expires: '2025-12-31' } as any);
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });
      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });

  describe('Package Not Found', () => {
    it('should return 404 for non-existent package', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: testUserId, role: 'user' }, expires: '2025-12-31' } as any);
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: 'non-existent-package-id', visitDate: '2025-12-25', quantity: 2 }),
      });
      const response = await POST(request);
      expect(response.status).toBe(404);
    });

    it('should return 404 for inactive package', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: testUserId, role: 'user' }, expires: '2025-12-31' } as any);
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: inactivePackageId, visitDate: '2025-12-25', quantity: 2 }),
      });
      const response = await POST(request);
      expect(response.status).toBe(404);
    });
  });

  describe('Quota Exceeded', () => {
    it('should return 400 when quota exceeded', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: testUserId, role: 'user' }, expires: '2025-12-31' } as any);
      const visitDate = `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-10`;
      
      // Isi quota (5)
      for (let i = 0; i < 5; i++) {
        const req = new NextRequest('http://localhost:3000/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packageId: testPackageId, visitDate, quantity: 1 }),
        });
        await POST(req);
      }

      // Request ke-6 harus ditolak
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: testPackageId, visitDate, quantity: 1 }),
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
      expect((await response.json()).message).toBe('Quota exceeded for this date');
      // Tidak perlu loop delete bookingIds lagi!
    });

    it('should return 400 when single booking exceeds quota', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: testUserId, role: 'user' }, expires: '2025-12-31' } as any);
      const visitDate = `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-05`;
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: testPackageId, visitDate, quantity: 10 }),
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Edge Cases', () => {
    it('should handle booking at exact quota limit', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: testUserId, role: 'user' }, expires: '2025-12-31' } as any);
      const visitDate = `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-28`;
      
      // Isi 4 booking
      for (let i = 0; i < 4; i++) {
        const req = new NextRequest('http://localhost:3000/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packageId: testPackageId, visitDate, quantity: 1 }),
        });
        await POST(req);
      }

      // Booking ke-5 (batas quota) HARUS sukses
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: testPackageId, visitDate, quantity: 1 }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.bookingId).toBeDefined();
    });

    it('should handle multiple bookings for different dates', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: testUserId, role: 'user' }, expires: '2025-12-31' } as any);
      
      const req1 = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: testPackageId, visitDate: '2025-06-15', quantity: 2 }),
      });
      expect((await POST(req1)).status).toBe(201);

      const req2 = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: testPackageId, visitDate: '2025-06-16', quantity: 2 }),
      });
      const response = await POST(req2);
      expect(response.status).toBe(201);
    });
  });
});