/**
 * Unit tests for PaymentRepository
 * 
 * Validates: Requirements 3.3, 3.10
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PaymentRepository } from './payment.repository';
import type { Payment, CreatePaymentInput } from './types';

// Mock the database module
jest.mock('@/db', () => ({
  db: {
    query: {
      payments: {
        findFirst: jest.fn(),
      },
    },
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(),
      })),
    })),
  },
}));

// Import the mocked db after mocking
import { db } from '@/db';

describe('PaymentRepository', () => {
  let repository: PaymentRepository;
  const mockDb = db as any;

  beforeEach(() => {
    repository = new PaymentRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a payment and return payment ID', async () => {
      // Arrange
      const input: CreatePaymentInput = {
        booking_id: 'booking-1',
        provider: 'mock_gateway',
        payment_status: 'success',
        external_ref: 'ext-ref-123',
        paid_at: '2024-01-15T10:30:00Z',
      };

      const mockResult = [{ id: 'payment-1' }];
      const mockReturning = jest.fn().mockResolvedValue(mockResult);
      const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
      mockDb.insert = jest.fn().mockReturnValue({ values: mockValues });

      // Act
      const result = await repository.create(input);

      // Assert
      expect(result).toBe('payment-1');
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
      expect(mockValues).toHaveBeenCalledWith(input);
      expect(mockReturning).toHaveBeenCalledTimes(1);
    });

    it('should throw error when creation fails', async () => {
      // Arrange
      const input: CreatePaymentInput = {
        booking_id: 'booking-1',
        provider: 'mock_gateway',
        payment_status: 'pending',
        external_ref: null,
        paid_at: null,
      };

      const mockReturning = jest.fn().mockResolvedValue([]);
      const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
      mockDb.insert = jest.fn().mockReturnValue({ values: mockValues });

      // Act & Assert
      await expect(repository.create(input)).rejects.toThrow('Failed to create payment');
    });
  });

  describe('findByBookingId', () => {
    it('should return payment when it exists', async () => {
      // Arrange
      const mockPayment: Payment = {
        id: 'payment-1',
        booking_id: 'booking-1',
        provider: 'mock_gateway',
        payment_status: 'success',
        external_ref: 'ext-ref-123',
        paid_at: '2024-01-15T10:30:00Z',
        created_at: '2024-01-15T10:00:00Z',
      };

      mockDb.query.payments.findFirst = jest.fn().mockResolvedValue(mockPayment);

      // Act
      const result = await repository.findByBookingId('booking-1');

      // Assert
      expect(result).toEqual(mockPayment);
      expect(mockDb.query.payments.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should return null when payment does not exist', async () => {
      // Arrange
      mockDb.query.payments.findFirst = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await repository.findByBookingId('non-existent-booking-id');

      // Assert
      expect(result).toBeNull();
      expect(mockDb.query.payments.findFirst).toHaveBeenCalledTimes(1);
    });
  });
});
