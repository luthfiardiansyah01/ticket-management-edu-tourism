/**
 * Unit tests for PricingService
 * 
 * Validates: Requirements 2.1-2.9
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PricingService } from './pricing.service';
import { PackageRepository } from '@/repositories/package.repository';
import type { Package } from '@/repositories/types';

// Mock the PackageRepository
jest.mock('@/repositories/package.repository', () => ({
  PackageRepository: jest.fn(),
  packageRepository: {},
}));

describe('PricingService', () => {
  let service: PricingService;
  let mockPackageRepository: jest.Mocked<PackageRepository>;

  beforeEach(() => {
    // Create a mock instance of PackageRepository
    mockPackageRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
    } as unknown as jest.Mocked<PackageRepository>;

    service = new PricingService(mockPackageRepository);
    jest.clearAllMocks();
  });

  describe('calculatePrice', () => {
    describe('personal package (no discount)', () => {
      it('should calculate price without discount for personal package', async () => {
        // Arrange
        const mockPackage: Package = {
          id: 'pkg-personal',
          name: 'Personal Package',
          category: 'personal',
          description: 'Personal ticket',
          base_price: 50000,
          promo_price: null,
          quota_per_day: 100,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockPackageRepository.findById.mockResolvedValue(mockPackage);

        // Act
        const result = await service.calculatePrice('pkg-personal', 10);

        // Assert
        expect(result).toEqual({
          totalPrice: 500000,
          pricePerUnit: 50000,
          discountApplied: false,
          discountPercentage: 0,
        });
        expect(mockPackageRepository.findById).toHaveBeenCalledWith('pkg-personal');
      });

      it('should not apply discount for personal package with high quantity', async () => {
        // Arrange
        const mockPackage: Package = {
          id: 'pkg-personal',
          name: 'Personal Package',
          category: 'personal',
          description: 'Personal ticket',
          base_price: 50000,
          promo_price: null,
          quota_per_day: 100,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockPackageRepository.findById.mockResolvedValue(mockPackage);

        // Act
        const result = await service.calculatePrice('pkg-personal', 150);

        // Assert
        expect(result).toEqual({
          totalPrice: 7500000,
          pricePerUnit: 50000,
          discountApplied: false,
          discountPercentage: 0,
        });
      });
    });

    describe('school package with quantity < 50 (no discount)', () => {
      it('should calculate price without discount for school package with quantity < 50', async () => {
        // Arrange
        const mockPackage: Package = {
          id: 'pkg-school',
          name: 'School Package',
          category: 'school',
          description: 'School ticket',
          base_price: 40000,
          promo_price: null,
          quota_per_day: 200,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockPackageRepository.findById.mockResolvedValue(mockPackage);

        // Act
        const result = await service.calculatePrice('pkg-school', 30);

        // Assert
        expect(result).toEqual({
          totalPrice: 1200000,
          pricePerUnit: 40000,
          discountApplied: false,
          discountPercentage: 0,
        });
      });

      it('should calculate price without discount for school package with quantity = 49', async () => {
        // Arrange
        const mockPackage: Package = {
          id: 'pkg-school',
          name: 'School Package',
          category: 'school',
          description: 'School ticket',
          base_price: 40000,
          promo_price: null,
          quota_per_day: 200,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockPackageRepository.findById.mockResolvedValue(mockPackage);

        // Act
        const result = await service.calculatePrice('pkg-school', 49);

        // Assert
        expect(result).toEqual({
          totalPrice: 1960000,
          pricePerUnit: 40000,
          discountApplied: false,
          discountPercentage: 0,
        });
      });
    });

    describe('school package with quantity 50-99 (10% discount)', () => {
      it('should apply 10% discount for school package with quantity = 50', async () => {
        // Arrange
        const mockPackage: Package = {
          id: 'pkg-school',
          name: 'School Package',
          category: 'school',
          description: 'School ticket',
          base_price: 40000,
          promo_price: null,
          quota_per_day: 200,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockPackageRepository.findById.mockResolvedValue(mockPackage);

        // Act
        const result = await service.calculatePrice('pkg-school', 50);

        // Assert
        expect(result).toEqual({
          totalPrice: 1800000, // 36000 * 50
          pricePerUnit: 36000, // floor(40000 * 0.90)
          discountApplied: true,
          discountPercentage: 10,
        });
      });

      it('should apply 10% discount for school package with quantity = 75', async () => {
        // Arrange
        const mockPackage: Package = {
          id: 'pkg-school',
          name: 'School Package',
          category: 'school',
          description: 'School ticket',
          base_price: 40000,
          promo_price: null,
          quota_per_day: 200,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockPackageRepository.findById.mockResolvedValue(mockPackage);

        // Act
        const result = await service.calculatePrice('pkg-school', 75);

        // Assert
        expect(result).toEqual({
          totalPrice: 2700000, // 36000 * 75
          pricePerUnit: 36000, // floor(40000 * 0.90)
          discountApplied: true,
          discountPercentage: 10,
        });
      });

      it('should apply 10% discount for school package with quantity = 99', async () => {
        // Arrange
        const mockPackage: Package = {
          id: 'pkg-school',
          name: 'School Package',
          category: 'school',
          description: 'School ticket',
          base_price: 40000,
          promo_price: null,
          quota_per_day: 200,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockPackageRepository.findById.mockResolvedValue(mockPackage);

        // Act
        const result = await service.calculatePrice('pkg-school', 99);

        // Assert
        expect(result).toEqual({
          totalPrice: 3564000, // 36000 * 99
          pricePerUnit: 36000, // floor(40000 * 0.90)
          discountApplied: true,
          discountPercentage: 10,
        });
      });
    });

    describe('school package with quantity >= 100 (15% discount)', () => {
      it('should apply 15% discount for school package with quantity = 100', async () => {
        // Arrange
        const mockPackage: Package = {
          id: 'pkg-school',
          name: 'School Package',
          category: 'school',
          description: 'School ticket',
          base_price: 40000,
          promo_price: null,
          quota_per_day: 200,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockPackageRepository.findById.mockResolvedValue(mockPackage);

        // Act
        const result = await service.calculatePrice('pkg-school', 100);

        // Assert
        expect(result).toEqual({
          totalPrice: 3400000, // 34000 * 100
          pricePerUnit: 34000, // floor(40000 * 0.85)
          discountApplied: true,
          discountPercentage: 15,
        });
      });

      it('should apply 15% discount for school package with quantity = 150', async () => {
        // Arrange
        const mockPackage: Package = {
          id: 'pkg-school',
          name: 'School Package',
          category: 'school',
          description: 'School ticket',
          base_price: 40000,
          promo_price: null,
          quota_per_day: 200,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockPackageRepository.findById.mockResolvedValue(mockPackage);

        // Act
        const result = await service.calculatePrice('pkg-school', 150);

        // Assert
        expect(result).toEqual({
          totalPrice: 5100000, // 34000 * 150
          pricePerUnit: 34000, // floor(40000 * 0.85)
          discountApplied: true,
          discountPercentage: 15,
        });
      });
    });

    describe('promo_price usage', () => {
      it('should use promo_price when available', async () => {
        // Arrange
        const mockPackage: Package = {
          id: 'pkg-promo',
          name: 'Promo Package',
          category: 'personal',
          description: 'Package with promo',
          base_price: 50000,
          promo_price: 40000,
          quota_per_day: 100,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockPackageRepository.findById.mockResolvedValue(mockPackage);

        // Act
        const result = await service.calculatePrice('pkg-promo', 5);

        // Assert
        expect(result).toEqual({
          totalPrice: 200000, // 40000 * 5
          pricePerUnit: 40000, // promo_price
          discountApplied: false,
          discountPercentage: 0,
        });
      });

      it('should use promo_price with school package discount', async () => {
        // Arrange
        const mockPackage: Package = {
          id: 'pkg-school-promo',
          name: 'School Promo Package',
          category: 'school',
          description: 'School package with promo',
          base_price: 50000,
          promo_price: 40000,
          quota_per_day: 200,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockPackageRepository.findById.mockResolvedValue(mockPackage);

        // Act
        const result = await service.calculatePrice('pkg-school-promo', 100);

        // Assert
        expect(result).toEqual({
          totalPrice: 3400000, // 34000 * 100
          pricePerUnit: 34000, // floor(40000 * 0.85)
          discountApplied: true,
          discountPercentage: 15,
        });
      });
    });

    describe('base_price fallback', () => {
      it('should use base_price when promo_price is null', async () => {
        // Arrange
        const mockPackage: Package = {
          id: 'pkg-base',
          name: 'Base Package',
          category: 'personal',
          description: 'Package without promo',
          base_price: 50000,
          promo_price: null,
          quota_per_day: 100,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockPackageRepository.findById.mockResolvedValue(mockPackage);

        // Act
        const result = await service.calculatePrice('pkg-base', 3);

        // Assert
        expect(result).toEqual({
          totalPrice: 150000, // 50000 * 3
          pricePerUnit: 50000, // base_price
          discountApplied: false,
          discountPercentage: 0,
        });
      });
    });

    describe('error handling', () => {
      it('should throw error for non-existent package', async () => {
        // Arrange
        mockPackageRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.calculatePrice('non-existent', 10)
        ).rejects.toThrow('Package not found');
        expect(mockPackageRepository.findById).toHaveBeenCalledWith('non-existent');
      });
    });

    describe('idempotence', () => {
      it('should return identical results when called twice with same inputs', async () => {
        // Arrange
        const mockPackage: Package = {
          id: 'pkg-test',
          name: 'Test Package',
          category: 'school',
          description: 'Test package',
          base_price: 40000,
          promo_price: null,
          quota_per_day: 200,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockPackageRepository.findById.mockResolvedValue(mockPackage);

        // Act
        const result1 = await service.calculatePrice('pkg-test', 75);
        const result2 = await service.calculatePrice('pkg-test', 75);

        // Assert
        expect(result1).toEqual(result2);
        expect(result1).toEqual({
          totalPrice: 2700000,
          pricePerUnit: 36000,
          discountApplied: true,
          discountPercentage: 10,
        });
      });
    });
  });

  describe('getPriceBreakdown', () => {
    it('should return correct breakdown for personal package', async () => {
      // Arrange
      const mockPackage: Package = {
        id: 'pkg-personal',
        name: 'Personal Package',
        category: 'personal',
        description: 'Personal ticket',
        base_price: 50000,
        promo_price: null,
        quota_per_day: 100,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockPackageRepository.findById.mockResolvedValue(mockPackage);

      // Act
      const result = await service.getPriceBreakdown('pkg-personal', 10);

      // Assert
      expect(result).toEqual({
        basePrice: 500000, // 50000 * 10
        discountAmount: 0,
        finalPrice: 500000,
        quantity: 10,
      });
    });

    it('should return correct breakdown for school package with 10% discount', async () => {
      // Arrange
      const mockPackage: Package = {
        id: 'pkg-school',
        name: 'School Package',
        category: 'school',
        description: 'School ticket',
        base_price: 40000,
        promo_price: null,
        quota_per_day: 200,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockPackageRepository.findById.mockResolvedValue(mockPackage);

      // Act
      const result = await service.getPriceBreakdown('pkg-school', 50);

      // Assert
      expect(result).toEqual({
        basePrice: 2000000, // 40000 * 50
        discountAmount: 200000, // floor(2000000 * 0.10)
        finalPrice: 1800000,
        quantity: 50,
      });
    });

    it('should return correct breakdown for school package with 15% discount', async () => {
      // Arrange
      const mockPackage: Package = {
        id: 'pkg-school',
        name: 'School Package',
        category: 'school',
        description: 'School ticket',
        base_price: 40000,
        promo_price: null,
        quota_per_day: 200,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockPackageRepository.findById.mockResolvedValue(mockPackage);

      // Act
      const result = await service.getPriceBreakdown('pkg-school', 100);

      // Assert
      expect(result).toEqual({
        basePrice: 4000000, // 40000 * 100
        discountAmount: 600000, // floor(4000000 * 0.15)
        finalPrice: 3400000,
        quantity: 100,
      });
    });

    it('should use promo_price in breakdown calculation', async () => {
      // Arrange
      const mockPackage: Package = {
        id: 'pkg-promo',
        name: 'Promo Package',
        category: 'school',
        description: 'Package with promo',
        base_price: 50000,
        promo_price: 40000,
        quota_per_day: 200,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockPackageRepository.findById.mockResolvedValue(mockPackage);

      // Act
      const result = await service.getPriceBreakdown('pkg-promo', 100);

      // Assert
      expect(result).toEqual({
        basePrice: 4000000, // 40000 * 100 (using promo_price)
        discountAmount: 600000, // floor(4000000 * 0.15)
        finalPrice: 3400000,
        quantity: 100,
      });
    });

    it('should throw error for non-existent package', async () => {
      // Arrange
      mockPackageRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getPriceBreakdown('non-existent', 10)
      ).rejects.toThrow('Package not found');
    });
  });
});
