/**
 * E2E tests for Calculate Price API Route
 * Tests complete HTTP request/response flow
 * 
 * Validates: Requirements 10.4, 10.5
 */

import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { POST } from './route';
import { db, waitForDb } from '@/db';
import { ticketPackages } from '@/db/schema';
import { withRetry, cleanDatabase } from '@/lib/test-utils';
import { NextRequest } from 'next/server';

describe('POST /api/packages/calculate-price - E2E Tests', () => {
  let personalPackageId: string;
  let schoolPackageId: string;
  let promoPackageId: string;
  const testPrefix = `test-calc-price-${Date.now()}`;

  beforeAll(async () => {
    await waitForDb();

    await withRetry(async () => {
      // Create personal package
      const personalResult = await db.insert(ticketPackages).values({
        name: `${testPrefix}-personal`,
        category: 'personal',
        description: 'Personal package for price calculation tests',
        base_price: 50000,
        promo_price: null,
        quota_per_day: 10,
        is_active: true,
      }).returning();
      personalPackageId = personalResult[0].id;

      // Create school package
      const schoolResult = await db.insert(ticketPackages).values({
        name: `${testPrefix}-school`,
        category: 'school',
        description: 'School package for price calculation tests',
        base_price: 40000,
        promo_price: null,
        quota_per_day: 100,
        is_active: true,
      }).returning();
      schoolPackageId = schoolResult[0].id;

      // Create package with promo price
      const promoResult = await db.insert(ticketPackages).values({
        name: `${testPrefix}-promo`,
        category: 'personal',
        description: 'Package with promo price',
        base_price: 60000,
        promo_price: 45000,
        quota_per_day: 10,
        is_active: true,
      }).returning();
      promoPackageId = promoResult[0].id;
    });
  });

  beforeEach(async () => {
    // Membersihkan data sisa dari test sebelumnya
    await cleanDatabase();
  });

  describe('Valid Price Calculation', () => {
    it('should return 200 with price details for personal package', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: personalPackageId,
          quantity: 2,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('totalPrice');
      expect(data).toHaveProperty('pricePerUnit');
      expect(data).toHaveProperty('discountApplied');
      expect(data).toHaveProperty('discountPercentage');
      
      // Personal package: no discount
      expect(data.totalPrice).toBe(100000); // 50000 * 2
      expect(data.pricePerUnit).toBe(50000);
      expect(data.discountApplied).toBe(false);
      expect(data.discountPercentage).toBe(0);
    });

    it('should return 200 with 10% discount for school package (50-99 quantity)', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: schoolPackageId,
          quantity: 50,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      
      // School package with 50 tickets: 10% discount
      // 40000 * 0.90 = 36000 per unit
      // 36000 * 50 = 1,800,000 total
      expect(data.totalPrice).toBe(1800000);
      expect(data.pricePerUnit).toBe(36000);
      expect(data.discountApplied).toBe(true);
      expect(data.discountPercentage).toBe(10);
    });

    it('should return 200 with 15% discount for school package (100+ quantity)', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: schoolPackageId,
          quantity: 100,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      
      // School package with 100 tickets: 15% discount
      // 40000 * 0.85 = 34000 per unit
      // 34000 * 100 = 3,400,000 total
      expect(data.totalPrice).toBe(3400000);
      expect(data.pricePerUnit).toBe(34000);
      expect(data.discountApplied).toBe(true);
      expect(data.discountPercentage).toBe(15);
    });

    it('should use promo price when available', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: promoPackageId,
          quantity: 3,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      
      // Should use promo_price (45000) instead of base_price (60000)
      expect(data.totalPrice).toBe(135000); // 45000 * 3
      expect(data.pricePerUnit).toBe(45000);
      expect(data.discountApplied).toBe(false);
      expect(data.discountPercentage).toBe(0);
    });

    it('should handle quantity of 1', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: personalPackageId,
          quantity: 1,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.totalPrice).toBe(50000);
      expect(data.pricePerUnit).toBe(50000);
    });

    it('should handle large quantity', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: schoolPackageId,
          quantity: 500,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      
      // 40000 * 0.85 = 34000 per unit
      // 34000 * 500 = 17,000,000 total
      expect(data.totalPrice).toBe(17000000);
      expect(data.pricePerUnit).toBe(34000);
      expect(data.discountApplied).toBe(true);
      expect(data.discountPercentage).toBe(15);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent package', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: 'non-existent-package-id',
          quantity: 2,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.message).toBe('Package not found');
    });

    it('should return 400 for invalid quantity (zero)', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: personalPackageId,
          quantity: 0,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe('Validation failed');
      expect(data.errors).toBeDefined();
    });

    it('should return 400 for invalid quantity (negative)', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: personalPackageId,
          quantity: -5,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe('Validation failed');
    });

    it('should return 400 for missing packageId', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: 2,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe('Validation failed');
    });

    it('should return 400 for missing quantity', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: personalPackageId,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe('Validation failed');
    });

    it('should return 400 for empty packageId', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: '',
          quantity: 2,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe('Validation failed');
    });

    it('should return 400 for non-integer quantity', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: personalPackageId,
          quantity: 2.5,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe('Validation failed');
    });
  });

  describe('Response Format Verification', () => {
    it('should return all required fields in response', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: personalPackageId,
          quantity: 5,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(Object.keys(data)).toEqual(
        expect.arrayContaining(['totalPrice', 'pricePerUnit', 'discountApplied', 'discountPercentage'])
      );
      expect(Object.keys(data).length).toBe(4);
    });

    it('should return numbers for price fields', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/packages/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: schoolPackageId,
          quantity: 75,
        }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(typeof data.totalPrice).toBe('number');
      expect(typeof data.pricePerUnit).toBe('number');
      expect(typeof data.discountApplied).toBe('boolean');
      expect(typeof data.discountPercentage).toBe('number');
    });
  });
});
