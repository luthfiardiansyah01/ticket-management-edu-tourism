/**
 * Unit tests for BookingService
 * 
 * Validates: Requirements 4.1-4.10
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BookingService } from './booking.service';
import { BookingRepository } from '@/repositories/booking.repository';
import { PackageRepository } from '@/repositories/package.repository';
import { PricingService } from './pricing.service';
import type { Package, Booking } from '@/repositories/types';
import type { CreateBookingData, PriceResult } from './types';

// Mock the database transaction
jest.mock('@/db', () => ({
  db: {
    transaction: jest.fn((callback) => callback()),
  },
}));

// Mock the repositories
jest.mock('@/repositories/booking.repository', () => ({
  BookingRepository: jest.fn(),
  bookingRepository: {},
}));

jest.mock('@/repositories/package.repository', () => ({
  PackageRepository: jest.fn(),
  packageRepository: {},
}));

// Mock the PricingService
jest.mock('./pricing.service', () => ({
  PricingService: jest.fn(),
  pricingService: {},
}));

describe('BookingService', () => {
  let service: BookingService;
  let mockBookingRepository: jest.Mocked<BookingRepository>;
  let mockPackageRepository: jest.Mocked<PackageRepository>;
  let mockPricingService: jest.Mocked<PricingService>;

  beforeEach(() => {
    // Create mock instances
    mockBookingRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      countByPackageAndDate: jest.fn(),
    } as unknown as jest.Mocked<BookingRepository>;

    mockPackageRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
    } as unknown as jest.Mocked<PackageRepository>;

    mockPricingService = {
      calculatePrice: jest.fn(),
      getPriceBreakdown: jest.fn(),
    } as unknown as jest.Mocked<PricingService>;

    service = new BookingService(
      mockBookingRepository,
      mockPackageRepository,
      mockPricingService
    );

    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    const validBookingData: CreateBookingData = {
      userId: 'user-123',
      packageId: 'pkg-123',
      visitDate: '2024-12-25',
      quantity: 5,
    };

    const mockPackage: Package = {
      id: 'pkg-123',
      name: 'Test Package',
      category: 'personal',
      description: 'Test package',
      base_price: 50000,
      promo_price: null,
      quota_per_day: 100,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    const mockPriceResult: PriceResult = {
      totalPrice: 250000,
      pricePerUnit: 50000,
      discountApplied: false,
      discountPercentage: 0,
    };

    describe('valid booking creation', () => {
      it('should create booking with valid data', async () => {
        // Arrange
        mockPackageRepository.findById.mockResolvedValue(mockPackage);
        mockPricingService.calculatePrice.mockResolvedValue(mockPriceResult);
        mockBookingRepository.countByPackageAndDate.mockResolvedValue(10);
        mockBookingRepository.create.mockResolvedValue('booking-123');

        // Act
        const result = await service.createBooking(validBookingData);

        // Assert
        expect(result).toBe('booking-123');
        expect(mockPackageRepository.findById).toHaveBeenCalledWith('pkg-123');
        expect(mockPricingService.calculatePrice).toHaveBeenCalledWith('pkg-123', 5);
        expect(mockBookingRepository.countByPackageAndDate).toHaveBeenCalledWith(
          'pkg-123',
          '2024-12-25'
        );
        expect(mockBookingRepository.create).toHaveBeenCalledWith({
          user_id: 'user-123',
          package_id: 'pkg-123',
          visit_date: '2024-12-25',
          quantity: 5,
          total_price: 250000,
          status: 'pending',
        });
      });

      it('should create booking with status "pending"', async () => {
        // Arrange
        mockPackageRepository.findById.mockResolvedValue(mockPackage);
        mockPricingService.calculatePrice.mockResolvedValue(mockPriceResult);
        mockBookingRepository.countByPackageAndDate.mockResolvedValue(0);
        mockBookingRepository.create.mockResolvedValue('booking-456');

        // Act
        await service.createBooking(validBookingData);

        // Assert
        expect(mockBookingRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'pending',
          })
        );
      });
    });

    describe('package validation', () => {
      it('should throw error for non-existent package', async () => {
        // Arrange
        mockPackageRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.createBooking(validBookingData)
        ).rejects.toThrow('Package not found or inactive');
        expect(mockPackageRepository.findById).toHaveBeenCalledWith('pkg-123');
        expect(mockPricingService.calculatePrice).not.toHaveBeenCalled();
        expect(mockBookingRepository.create).not.toHaveBeenCalled();
      });

      it('should throw error for inactive package', async () => {
        // Arrange
        const inactivePackage: Package = {
          ...mockPackage,
          is_active: false,
        };
        mockPackageRepository.findById.mockResolvedValue(inactivePackage);

        // Act & Assert
        await expect(
          service.createBooking(validBookingData)
        ).rejects.toThrow('Package not found or inactive');
        expect(mockPackageRepository.findById).toHaveBeenCalledWith('pkg-123');
        expect(mockPricingService.calculatePrice).not.toHaveBeenCalled();
        expect(mockBookingRepository.create).not.toHaveBeenCalled();
      });
    });

    describe('quantity validation', () => {
      it('should throw error for quantity < 1', async () => {
        // Arrange
        mockPackageRepository.findById.mockResolvedValue(mockPackage);
        const invalidData: CreateBookingData = {
          ...validBookingData,
          quantity: 0,
        };

        // Act & Assert
        await expect(
          service.createBooking(invalidData)
        ).rejects.toThrow('Quantity must be at least 1');
        expect(mockPricingService.calculatePrice).not.toHaveBeenCalled();
        expect(mockBookingRepository.create).not.toHaveBeenCalled();
      });

      it('should throw error for negative quantity', async () => {
        // Arrange
        mockPackageRepository.findById.mockResolvedValue(mockPackage);
        const invalidData: CreateBookingData = {
          ...validBookingData,
          quantity: -5,
        };

        // Act & Assert
        await expect(
          service.createBooking(invalidData)
        ).rejects.toThrow('Quantity must be at least 1');
      });
    });

    describe('quota validation', () => {
      it('should throw error when quota exceeded', async () => {
        // Arrange
        mockPackageRepository.findById.mockResolvedValue(mockPackage);
        mockPricingService.calculatePrice.mockResolvedValue(mockPriceResult);
        // Current bookings: 95, requested: 10, quota: 100 -> exceeds
        mockBookingRepository.countByPackageAndDate.mockResolvedValue(95);

        const bookingData: CreateBookingData = {
          ...validBookingData,
          quantity: 10,
        };

        // Act & Assert
        await expect(
          service.createBooking(bookingData)
        ).rejects.toThrow('Quota exceeded for this date');
        expect(mockBookingRepository.countByPackageAndDate).toHaveBeenCalledWith(
          'pkg-123',
          '2024-12-25'
        );
        expect(mockBookingRepository.create).not.toHaveBeenCalled();
      });

      it('should allow booking when exactly at quota limit', async () => {
        // Arrange
        mockPackageRepository.findById.mockResolvedValue(mockPackage);
        mockPricingService.calculatePrice.mockResolvedValue(mockPriceResult);
        // Current bookings: 95, requested: 5, quota: 100 -> exactly at limit
        mockBookingRepository.countByPackageAndDate.mockResolvedValue(95);
        mockBookingRepository.create.mockResolvedValue('booking-789');

        // Act
        const result = await service.createBooking(validBookingData);

        // Assert
        expect(result).toBe('booking-789');
        expect(mockBookingRepository.create).toHaveBeenCalled();
      });

      it('should allow booking when under quota limit', async () => {
        // Arrange
        mockPackageRepository.findById.mockResolvedValue(mockPackage);
        mockPricingService.calculatePrice.mockResolvedValue(mockPriceResult);
        // Current bookings: 50, requested: 5, quota: 100 -> under limit
        mockBookingRepository.countByPackageAndDate.mockResolvedValue(50);
        mockBookingRepository.create.mockResolvedValue('booking-999');

        // Act
        const result = await service.createBooking(validBookingData);

        // Assert
        expect(result).toBe('booking-999');
        expect(mockBookingRepository.create).toHaveBeenCalled();
      });
    });

    describe('pricing service integration', () => {
      it('should use PricingService for price calculation', async () => {
        // Arrange
        mockPackageRepository.findById.mockResolvedValue(mockPackage);
        mockPricingService.calculatePrice.mockResolvedValue(mockPriceResult);
        mockBookingRepository.countByPackageAndDate.mockResolvedValue(0);
        mockBookingRepository.create.mockResolvedValue('booking-111');

        // Act
        await service.createBooking(validBookingData);

        // Assert
        expect(mockPricingService.calculatePrice).toHaveBeenCalledWith(
          'pkg-123',
          5
        );
        expect(mockBookingRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            total_price: 250000,
          })
        );
      });

      it('should use calculated price in booking creation', async () => {
        // Arrange
        const schoolPackage: Package = {
          ...mockPackage,
          category: 'school',
        };
        const discountedPrice: PriceResult = {
          totalPrice: 1800000, // 36000 * 50
          pricePerUnit: 36000,
          discountApplied: true,
          discountPercentage: 10,
        };

        mockPackageRepository.findById.mockResolvedValue(schoolPackage);
        mockPricingService.calculatePrice.mockResolvedValue(discountedPrice);
        mockBookingRepository.countByPackageAndDate.mockResolvedValue(0);
        mockBookingRepository.create.mockResolvedValue('booking-222');

        const schoolBookingData: CreateBookingData = {
          ...validBookingData,
          quantity: 50,
        };

        // Act
        await service.createBooking(schoolBookingData);

        // Assert
        expect(mockPricingService.calculatePrice).toHaveBeenCalledWith(
          'pkg-123',
          50
        );
        expect(mockBookingRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            total_price: 1800000,
          })
        );
      });
    });

    describe('transaction behavior', () => {
      it('should execute quota check and booking creation in transaction', async () => {
        // Arrange
        mockPackageRepository.findById.mockResolvedValue(mockPackage);
        mockPricingService.calculatePrice.mockResolvedValue(mockPriceResult);
        mockBookingRepository.countByPackageAndDate.mockResolvedValue(10);
        mockBookingRepository.create.mockResolvedValue('booking-333');

        // Act
        await service.createBooking(validBookingData);

        // Assert
        // Both quota check and create should be called
        expect(mockBookingRepository.countByPackageAndDate).toHaveBeenCalled();
        expect(mockBookingRepository.create).toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle booking with quantity = 1', async () => {
        // Arrange
        mockPackageRepository.findById.mockResolvedValue(mockPackage);
        const singlePrice: PriceResult = {
          totalPrice: 50000,
          pricePerUnit: 50000,
          discountApplied: false,
          discountPercentage: 0,
        };
        mockPricingService.calculatePrice.mockResolvedValue(singlePrice);
        mockBookingRepository.countByPackageAndDate.mockResolvedValue(0);
        mockBookingRepository.create.mockResolvedValue('booking-444');

        const singleBooking: CreateBookingData = {
          ...validBookingData,
          quantity: 1,
        };

        // Act
        const result = await service.createBooking(singleBooking);

        // Assert
        expect(result).toBe('booking-444');
        expect(mockBookingRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            quantity: 1,
            total_price: 50000,
          })
        );
      });

      it('should handle booking with large quantity', async () => {
        // Arrange
        const largeQuotaPackage: Package = {
          ...mockPackage,
          quota_per_day: 500,
        };
        const largePrice: PriceResult = {
          totalPrice: 10000000,
          pricePerUnit: 50000,
          discountApplied: false,
          discountPercentage: 0,
        };

        mockPackageRepository.findById.mockResolvedValue(largeQuotaPackage);
        mockPricingService.calculatePrice.mockResolvedValue(largePrice);
        mockBookingRepository.countByPackageAndDate.mockResolvedValue(0);
        mockBookingRepository.create.mockResolvedValue('booking-555');

        const largeBooking: CreateBookingData = {
          ...validBookingData,
          quantity: 200,
        };

        // Act
        const result = await service.createBooking(largeBooking);

        // Assert
        expect(result).toBe('booking-555');
        expect(mockBookingRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            quantity: 200,
          })
        );
      });

      it('should handle booking when no existing bookings for date', async () => {
        // Arrange
        mockPackageRepository.findById.mockResolvedValue(mockPackage);
        mockPricingService.calculatePrice.mockResolvedValue(mockPriceResult);
        mockBookingRepository.countByPackageAndDate.mockResolvedValue(0);
        mockBookingRepository.create.mockResolvedValue('booking-666');

        // Act
        const result = await service.createBooking(validBookingData);

        // Assert
        expect(result).toBe('booking-666');
        expect(mockBookingRepository.countByPackageAndDate).toHaveBeenCalledWith(
          'pkg-123',
          '2024-12-25'
        );
      });
    });
  });
});
