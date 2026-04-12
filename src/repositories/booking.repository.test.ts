/**
 * Unit tests for BookingRepository
 * 
 * Validates: Requirements 3.2, 3.7-3.9
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BookingRepository } from './booking.repository';
import type { Booking, CreateBookingInput } from './types';

// Mock the database module
jest.mock('@/db', () => ({
  db: {
    query: {
      bookings: {
        findFirst: jest.fn(),
      },
    },
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(),
      })),
    })),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(),
      })),
    })),
  },
}));

// Import the mocked db after mocking
import { db } from '@/db';

describe('BookingRepository', () => {
  let repository: BookingRepository;
  const mockDb = db as any;

  beforeEach(() => {
    repository = new BookingRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a booking and return booking ID', async () => {
      // Arrange
      const input: CreateBookingInput = {
        user_id: 'user-1',
        package_id: 'pkg-1',
        visit_date: '2024-06-15',
        quantity: 2,
        total_price: 100000,
        status: 'pending',
      };

      const mockResult = [{ id: 'booking-1' }];
      const mockReturning = jest.fn().mockResolvedValue(mockResult);
      const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
      mockDb.insert = jest.fn().mockReturnValue({ values: mockValues });

      // Act
      const result = await repository.create(input);

      // Assert
      expect(result).toBe('booking-1');
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
      expect(mockValues).toHaveBeenCalledWith(input);
      expect(mockReturning).toHaveBeenCalledTimes(1);
    });

    it('should throw error when creation fails', async () => {
      // Arrange
      const input: CreateBookingInput = {
        user_id: 'user-1',
        package_id: 'pkg-1',
        visit_date: '2024-06-15',
        quantity: 2,
        total_price: 100000,
        status: 'pending',
      };

      const mockReturning = jest.fn().mockResolvedValue([]);
      const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
      mockDb.insert = jest.fn().mockReturnValue({ values: mockValues });

      // Act & Assert
      await expect(repository.create(input)).rejects.toThrow('Failed to create booking');
    });
  });

  describe('findById', () => {
    it('should return booking when it exists', async () => {
      // Arrange
      const mockBooking: Booking = {
        id: 'booking-1',
        user_id: 'user-1',
        package_id: 'pkg-1',
        visit_date: '2024-06-15',
        quantity: 2,
        total_price: 100000,
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockDb.query.bookings.findFirst = jest.fn().mockResolvedValue(mockBooking);

      // Act
      const result = await repository.findById('booking-1');

      // Assert
      expect(result).toEqual(mockBooking);
      expect(mockDb.query.bookings.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should return null when booking does not exist', async () => {
      // Arrange
      mockDb.query.bookings.findFirst = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await repository.findById('non-existent-id');

      // Assert
      expect(result).toBeUndefined();
      expect(mockDb.query.bookings.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateStatus', () => {
    it('should update booking status', async () => {
      // Arrange
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      mockDb.update = jest.fn().mockReturnValue({ set: mockSet });

      // Act
      await repository.updateStatus('booking-1', 'paid');

      // Assert
      expect(mockDb.update).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledWith({ status: 'paid' });
      expect(mockWhere).toHaveBeenCalledTimes(1);
    });
  });

  describe('countByPackageAndDate', () => {
    it('should return count of non-cancelled bookings', async () => {
      // Arrange
      const mockWhere = jest.fn().mockResolvedValue([{ count: 5 }]);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      mockDb.select = jest.fn().mockReturnValue({ from: mockFrom });

      // Act
      const result = await repository.countByPackageAndDate('pkg-1', '2024-06-15');

      // Assert
      expect(result).toBe(5);
      expect(mockDb.select).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockWhere).toHaveBeenCalledTimes(1);
    });

    it('should return 0 when no bookings exist', async () => {
      // Arrange
      const mockWhere = jest.fn().mockResolvedValue([{ count: 0 }]);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      mockDb.select = jest.fn().mockReturnValue({ from: mockFrom });

      // Act
      const result = await repository.countByPackageAndDate('pkg-1', '2024-06-15');

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when result is empty', async () => {
      // Arrange
      const mockWhere = jest.fn().mockResolvedValue([]);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      mockDb.select = jest.fn().mockReturnValue({ from: mockFrom });

      // Act
      const result = await repository.countByPackageAndDate('pkg-1', '2024-06-15');

      // Assert
      expect(result).toBe(0);
    });
  });
});
