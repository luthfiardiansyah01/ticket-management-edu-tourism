/**
 * Property-Based Tests for PricingService
 * Uses fast-check library to validate pricing logic across input ranges
 * 
 * Validates: Requirements 2.1-2.9
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import { PricingService } from './pricing.service';
import type { PackageRepository } from '@/repositories/package.repository';

// Mock PackageRepository
const createMockRepository = (): jest.Mocked<PackageRepository> => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  findActive: jest.fn(),
} as any);

describe('PricingService - Property-Based Tests', () => {
  let service: PricingService;
  let mockRepository: jest.Mocked<PackageRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new PricingService(mockRepository);
  });

  /**
   * Property 1: School Package 15% Discount Threshold
   * Validates: Requirement 2.2
   * 
   * For any school package with quantity >= 100,
   * the price per unit should be floor(basePrice * 0.85)
   */
  describe('Property 1: School Package 15% Discount (≥100 quantity)', () => {
    it('should apply 15% discount for school packages with quantity >= 100', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 1000000 }), // base_price
          fc.option(fc.integer({ min: 5000, max: 500000 }), { nil: null }), // promo_price
          fc.integer({ min: 100, max: 1000 }), // quantity >= 100
          async (basePrice, promoPrice, quantity) => {
            // Arrange
            const packageId = 'school-pkg-test';
            mockRepository.findById.mockResolvedValue({
              id: packageId,
              name: 'School Package',
              category: 'school',
              description: 'Test school package',
              base_price: basePrice,
              promo_price: promoPrice,
              quota_per_day: 1000,
              is_active: true,
              created_at: new Date().toISOString(),
            } as any);

            // Act
            const result = await service.calculatePrice(packageId, quantity);

            // Assert
            const effectivePrice = promoPrice ?? basePrice;
            const expectedPricePerUnit = Math.floor(effectivePrice * 0.85);
            const expectedTotalPrice = expectedPricePerUnit * quantity;

            expect(result.pricePerUnit).toBe(expectedPricePerUnit);
            expect(result.totalPrice).toBe(expectedTotalPrice);
            expect(result.discountApplied).toBe(true);
            expect(result.discountPercentage).toBe(15);
          }
        ),
        { numRuns: 100 } // Run 100 random test cases
      );
    });
  });

  /**
   * Property 2: School Package 10% Discount Threshold
   * Validates: Requirement 2.3
   * 
   * For any school package with quantity in range [50, 99],
   * the price per unit should be floor(basePrice * 0.90)
   */
  describe('Property 2: School Package 10% Discount (50-99 quantity)', () => {
    it('should apply 10% discount for school packages with quantity 50-99', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 1000000 }), // base_price
          fc.option(fc.integer({ min: 5000, max: 500000 }), { nil: null }), // promo_price
          fc.integer({ min: 50, max: 99 }), // quantity in [50, 99]
          async (basePrice, promoPrice, quantity) => {
            // Arrange
            const packageId = 'school-pkg-test';
            mockRepository.findById.mockResolvedValue({
              id: packageId,
              name: 'School Package',
              category: 'school',
              description: 'Test school package',
              base_price: basePrice,
              promo_price: promoPrice,
              quota_per_day: 1000,
              is_active: true,
              created_at: new Date().toISOString(),
            } as any);

            // Act
            const result = await service.calculatePrice(packageId, quantity);

            // Assert
            const effectivePrice = promoPrice ?? basePrice;
            const expectedPricePerUnit = Math.floor(effectivePrice * 0.90);
            const expectedTotalPrice = expectedPricePerUnit * quantity;

            expect(result.pricePerUnit).toBe(expectedPricePerUnit);
            expect(result.totalPrice).toBe(expectedTotalPrice);
            expect(result.discountApplied).toBe(true);
            expect(result.discountPercentage).toBe(10);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: School Package No Discount (<50 quantity)
   * Validates: Requirement 2.4
   * 
   * For any school package with quantity < 50,
   * no discount should be applied
   */
  describe('Property 3: School Package No Discount (<50 quantity)', () => {
    it('should not apply discount for school packages with quantity < 50', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 1000000 }), // base_price
          fc.option(fc.integer({ min: 5000, max: 500000 }), { nil: null }), // promo_price
          fc.integer({ min: 1, max: 49 }), // quantity < 50
          async (basePrice, promoPrice, quantity) => {
            // Arrange
            const packageId = 'school-pkg-test';
            mockRepository.findById.mockResolvedValue({
              id: packageId,
              name: 'School Package',
              category: 'school',
              description: 'Test school package',
              base_price: basePrice,
              promo_price: promoPrice,
              quota_per_day: 1000,
              is_active: true,
              created_at: new Date().toISOString(),
            } as any);

            // Act
            const result = await service.calculatePrice(packageId, quantity);

            // Assert
            const effectivePrice = promoPrice ?? basePrice;
            const expectedPricePerUnit = effectivePrice;
            const expectedTotalPrice = expectedPricePerUnit * quantity;

            expect(result.pricePerUnit).toBe(expectedPricePerUnit);
            expect(result.totalPrice).toBe(expectedTotalPrice);
            expect(result.discountApplied).toBe(false);
            expect(result.discountPercentage).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Personal Package No Discount
   * Validates: Requirement 2.4
   * 
   * For any personal package with any quantity,
   * no discount should be applied
   */
  describe('Property 4: Personal Package No Discount', () => {
    it('should never apply discount for personal packages regardless of quantity', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 1000000 }), // base_price
          fc.option(fc.integer({ min: 5000, max: 500000 }), { nil: null }), // promo_price
          fc.integer({ min: 1, max: 1000 }), // any quantity
          async (basePrice, promoPrice, quantity) => {
            // Arrange
            const packageId = 'personal-pkg-test';
            mockRepository.findById.mockResolvedValue({
              id: packageId,
              name: 'Personal Package',
              category: 'personal',
              description: 'Test personal package',
              base_price: basePrice,
              promo_price: promoPrice,
              quota_per_day: 100,
              is_active: true,
              created_at: new Date().toISOString(),
            } as any);

            // Act
            const result = await service.calculatePrice(packageId, quantity);

            // Assert
            const effectivePrice = promoPrice ?? basePrice;
            const expectedPricePerUnit = effectivePrice;
            const expectedTotalPrice = expectedPricePerUnit * quantity;

            expect(result.pricePerUnit).toBe(expectedPricePerUnit);
            expect(result.totalPrice).toBe(expectedTotalPrice);
            expect(result.discountApplied).toBe(false);
            expect(result.discountPercentage).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Promo Price Priority
   * Validates: Requirement 2.5
   * 
   * When both base_price and promo_price are present,
   * promo_price should always be used for calculation
   */
  describe('Property 5: Promo Price Priority', () => {
    it('should use promo_price instead of base_price when available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 50000, max: 1000000 }), // base_price (higher)
          fc.integer({ min: 10000, max: 49999 }), // promo_price (lower)
          fc.constantFrom('personal', 'school'), // category
          fc.integer({ min: 1, max: 200 }), // quantity
          async (basePrice, promoPrice, category, quantity) => {
            // Arrange
            const packageId = 'promo-pkg-test';
            mockRepository.findById.mockResolvedValue({
              id: packageId,
              name: 'Promo Package',
              category: category as 'personal' | 'school',
              description: 'Test promo package',
              base_price: basePrice,
              promo_price: promoPrice,
              quota_per_day: 1000,
              is_active: true,
              created_at: new Date().toISOString(),
            } as any);

            // Act
            const result = await service.calculatePrice(packageId, quantity);

            // Assert
            // Should use promo_price, not base_price
            let expectedPricePerUnit = promoPrice;
            
            // Apply discount if school package
            if (category === 'school') {
              if (quantity >= 100) {
                expectedPricePerUnit = Math.floor(promoPrice * 0.85);
              } else if (quantity >= 50) {
                expectedPricePerUnit = Math.floor(promoPrice * 0.90);
              }
            }

            const expectedTotalPrice = expectedPricePerUnit * quantity;

            expect(result.pricePerUnit).toBe(expectedPricePerUnit);
            expect(result.totalPrice).toBe(expectedTotalPrice);
            
            // Verify promo_price was used (not base_price)
            // If no discount applied, pricePerUnit should equal promoPrice
            if (category === 'personal' || quantity < 50) {
              expect(result.pricePerUnit).toBe(promoPrice);
              expect(result.pricePerUnit).not.toBe(basePrice);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Base Price Fallback
   * Validates: Requirement 2.6
   * 
   * When promo_price is null, base_price should be used
   */
  describe('Property 6: Base Price Fallback', () => {
    it('should use base_price when promo_price is null', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 1000000 }), // base_price
          fc.constantFrom('personal', 'school'), // category
          fc.integer({ min: 1, max: 200 }), // quantity
          async (basePrice, category, quantity) => {
            // Arrange
            const packageId = 'base-price-pkg-test';
            mockRepository.findById.mockResolvedValue({
              id: packageId,
              name: 'Base Price Package',
              category: category as 'personal' | 'school',
              description: 'Test base price package',
              base_price: basePrice,
              promo_price: null, // No promo price
              quota_per_day: 1000,
              is_active: true,
              created_at: new Date().toISOString(),
            } as any);

            // Act
            const result = await service.calculatePrice(packageId, quantity);

            // Assert
            let expectedPricePerUnit = basePrice;
            
            // Apply discount if school package
            if (category === 'school') {
              if (quantity >= 100) {
                expectedPricePerUnit = Math.floor(basePrice * 0.85);
              } else if (quantity >= 50) {
                expectedPricePerUnit = Math.floor(basePrice * 0.90);
              }
            }

            const expectedTotalPrice = expectedPricePerUnit * quantity;

            expect(result.pricePerUnit).toBe(expectedPricePerUnit);
            expect(result.totalPrice).toBe(expectedTotalPrice);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Price Calculation Idempotence
   * Validates: Requirement 2.9
   * 
   * Calling calculatePrice twice with same inputs
   * should return identical results
   */
  describe('Property 7: Price Calculation Idempotence', () => {
    it('should return identical results for same inputs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 1000000 }), // base_price
          fc.option(fc.integer({ min: 5000, max: 500000 }), { nil: null }), // promo_price
          fc.constantFrom('personal', 'school'), // category
          fc.integer({ min: 1, max: 200 }), // quantity
          async (basePrice, promoPrice, category, quantity) => {
            // Arrange
            const packageId = 'idempotent-pkg-test';
            const packageData = {
              id: packageId,
              name: 'Idempotent Package',
              category: category as 'personal' | 'school',
              description: 'Test idempotent package',
              base_price: basePrice,
              promo_price: promoPrice,
              quota_per_day: 1000,
              is_active: true,
              created_at: new Date().toISOString(),
            };

            mockRepository.findById.mockResolvedValue(packageData as any);

            // Act - Call twice
            const result1 = await service.calculatePrice(packageId, quantity);
            
            mockRepository.findById.mockResolvedValue(packageData as any);
            const result2 = await service.calculatePrice(packageId, quantity);

            // Assert - Results should be identical
            expect(result1.totalPrice).toBe(result2.totalPrice);
            expect(result1.pricePerUnit).toBe(result2.pricePerUnit);
            expect(result1.discountApplied).toBe(result2.discountApplied);
            expect(result1.discountPercentage).toBe(result2.discountPercentage);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Total Price Calculation
   * Validates: Requirement 2.1
   * 
   * Total price should always equal pricePerUnit * quantity
   */
  describe('Property 8: Total Price = Price Per Unit × Quantity', () => {
    it('should calculate total price as pricePerUnit * quantity', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 1000000 }), // base_price
          fc.option(fc.integer({ min: 5000, max: 500000 }), { nil: null }), // promo_price
          fc.constantFrom('personal', 'school'), // category
          fc.integer({ min: 1, max: 500 }), // quantity
          async (basePrice, promoPrice, category, quantity) => {
            // Arrange
            const packageId = 'total-price-pkg-test';
            mockRepository.findById.mockResolvedValue({
              id: packageId,
              name: 'Total Price Package',
              category: category as 'personal' | 'school',
              description: 'Test total price package',
              base_price: basePrice,
              promo_price: promoPrice,
              quota_per_day: 1000,
              is_active: true,
              created_at: new Date().toISOString(),
            } as any);

            // Act
            const result = await service.calculatePrice(packageId, quantity);

            // Assert
            const expectedTotalPrice = result.pricePerUnit * quantity;
            expect(result.totalPrice).toBe(expectedTotalPrice);
            
            // Additional invariant: totalPrice should always be positive
            expect(result.totalPrice).toBeGreaterThan(0);
            expect(result.pricePerUnit).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Discount Percentage Consistency
   * Validates: Requirements 2.2, 2.3, 2.4
   * 
   * Discount percentage should match the discount applied
   */
  describe('Property 9: Discount Percentage Consistency', () => {
    it('should have consistent discount percentage with actual discount', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 1000000 }), // base_price
          fc.constantFrom('personal', 'school'), // category
          fc.integer({ min: 1, max: 200 }), // quantity
          async (basePrice, category, quantity) => {
            // Arrange
            const packageId = 'discount-consistency-pkg-test';
            mockRepository.findById.mockResolvedValue({
              id: packageId,
              name: 'Discount Consistency Package',
              category: category as 'personal' | 'school',
              description: 'Test discount consistency',
              base_price: basePrice,
              promo_price: null,
              quota_per_day: 1000,
              is_active: true,
              created_at: new Date().toISOString(),
            } as any);

            // Act
            const result = await service.calculatePrice(packageId, quantity);

            // Assert
            if (category === 'school' && quantity >= 100) {
              expect(result.discountPercentage).toBe(15);
              expect(result.discountApplied).toBe(true);
              expect(result.pricePerUnit).toBe(Math.floor(basePrice * 0.85));
            } else if (category === 'school' && quantity >= 50) {
              expect(result.discountPercentage).toBe(10);
              expect(result.discountApplied).toBe(true);
              expect(result.pricePerUnit).toBe(Math.floor(basePrice * 0.90));
            } else {
              expect(result.discountPercentage).toBe(0);
              expect(result.discountApplied).toBe(false);
              expect(result.pricePerUnit).toBe(basePrice);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Price Never Negative
   * Validates: General correctness
   * 
   * All prices should always be positive
   */
  describe('Property 10: Price Always Positive', () => {
    it('should never return negative prices', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 100, max: 1000000 }), // base_price (min 100 to avoid floor(x*0.85)=0)
          fc.option(fc.integer({ min: 100, max: 500000 }), { nil: null }), // promo_price
          fc.constantFrom('personal', 'school'), // category
          fc.integer({ min: 1, max: 1000 }), // quantity
          async (basePrice, promoPrice, category, quantity) => {
            // Arrange
            const packageId = 'positive-price-pkg-test';
            mockRepository.findById.mockResolvedValue({
              id: packageId,
              name: 'Positive Price Package',
              category: category as 'personal' | 'school',
              description: 'Test positive price',
              base_price: basePrice,
              promo_price: promoPrice,
              quota_per_day: 1000,
              is_active: true,
              created_at: new Date().toISOString(),
            } as any);

            // Act
            const result = await service.calculatePrice(packageId, quantity);

            // Assert
            expect(result.totalPrice).toBeGreaterThan(0);
            expect(result.pricePerUnit).toBeGreaterThan(0);
            expect(result.discountPercentage).toBeGreaterThanOrEqual(0);
            expect(result.discountPercentage).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
