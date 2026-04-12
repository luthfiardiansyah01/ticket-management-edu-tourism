/**
 * Unit tests for TicketRepository
 * 
 * Validates: Requirements 3.4, 3.11-3.13
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TicketRepository } from './ticket.repository';
import type { Ticket, TicketWithDetails, CreateTicketInput } from './types';

// Mock the database module
jest.mock('@/db', () => ({
  db: {
    query: {
      qrTickets: {
        findFirst: jest.fn(),
      },
    },
    insert: jest.fn(() => ({
      values: jest.fn(),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(),
      })),
    })),
  },
}));

// Import the mocked db after mocking
import { db } from '@/db';

describe('TicketRepository', () => {
  let repository: TicketRepository;
  const mockDb = db as any;

  beforeEach(() => {
    repository = new TicketRepository();
    jest.clearAllMocks();
  });

  describe('createBatch', () => {
    it('should create multiple tickets in batch', async () => {
      // Arrange
      const tickets: CreateTicketInput[] = [
        {
          booking_id: 'booking-1',
          qr_token: 'token-1',
          is_checked_in: false,
        },
        {
          booking_id: 'booking-1',
          qr_token: 'token-2',
          is_checked_in: false,
        },
      ];

      const mockValues = jest.fn().mockResolvedValue(undefined);
      mockDb.insert = jest.fn().mockReturnValue({ values: mockValues });

      // Act
      await repository.createBatch(tickets);

      // Assert
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
      expect(mockValues).toHaveBeenCalledWith(tickets);
    });

    it('should handle empty array without error', async () => {
      // Arrange
      const tickets: CreateTicketInput[] = [];

      // Act
      await repository.createBatch(tickets);

      // Assert
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('findByToken', () => {
    it('should return ticket with details when it exists', async () => {
      // Arrange
      const mockTicketWithDetails: TicketWithDetails = {
        id: 'ticket-1',
        booking_id: 'booking-1',
        qr_token: 'token-1',
        is_checked_in: false,
        checked_in_at: null,
        created_at: '2024-01-01T00:00:00Z',
        booking: {
          id: 'booking-1',
          user_id: 'user-1',
          package_id: 'pkg-1',
          visit_date: '2024-06-15',
          quantity: 2,
          total_price: 100000,
          status: 'paid',
          created_at: '2024-01-01T00:00:00Z',
          package: {
            id: 'pkg-1',
            name: 'Personal Package',
            category: 'personal',
            description: 'Test package',
            base_price: 50000,
            promo_price: null,
            quota_per_day: 50,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
          },
          user: {
            id: 'user-1',
            name: 'John Doe',
            email: 'john@example.com',
            password_hash: 'hash',
            role: 'user',
            created_at: '2024-01-01T00:00:00Z',
          },
        },
      };

      mockDb.query.qrTickets.findFirst = jest.fn().mockResolvedValue(mockTicketWithDetails);

      // Act
      const result = await repository.findByToken('token-1');

      // Assert
      expect(result).toEqual(mockTicketWithDetails);
      expect(mockDb.query.qrTickets.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should return null when ticket does not exist', async () => {
      // Arrange
      mockDb.query.qrTickets.findFirst = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await repository.findByToken('non-existent-token');

      // Assert
      expect(result).toBeNull();
      expect(mockDb.query.qrTickets.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkIn', () => {
    it('should mark ticket as checked in', async () => {
      // Arrange
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      mockDb.update = jest.fn().mockReturnValue({ set: mockSet });

      // Act
      await repository.checkIn('ticket-1');

      // Assert
      expect(mockDb.update).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledWith({
        is_checked_in: true,
        checked_in_at: expect.any(String),
      });
      expect(mockWhere).toHaveBeenCalledTimes(1);
    });
  });
});
