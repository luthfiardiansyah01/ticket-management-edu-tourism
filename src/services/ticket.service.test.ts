/**
 * Unit tests for TicketService
 * 
 * Validates: Requirements 6.1-6.10
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TicketService } from './ticket.service';
import { TicketRepository } from '@/repositories/ticket.repository';
import type { TicketWithDetails } from '@/repositories/types';

// Mock the TicketRepository
jest.mock('@/repositories/ticket.repository', () => ({
  TicketRepository: jest.fn(),
  ticketRepository: {},
}));

describe('TicketService', () => {
  let service: TicketService;
  let mockTicketRepository: jest.Mocked<TicketRepository>;

  beforeEach(() => {
    // Create mock instance
    mockTicketRepository = {
      createBatch: jest.fn(),
      findByToken: jest.fn(),
      checkIn: jest.fn(),
    } as unknown as jest.Mocked<TicketRepository>;

    service = new TicketService(mockTicketRepository);
    jest.clearAllMocks();
  });

  describe('generateTickets', () => {
    describe('creates correct number of tickets', () => {
      it('should create correct number of tickets for quantity 1', async () => {
        // Arrange
        mockTicketRepository.createBatch.mockResolvedValue();

        // Act
        await service.generateTickets('booking-123', 1);

        // Assert
        expect(mockTicketRepository.createBatch).toHaveBeenCalledTimes(1);
        const tickets = mockTicketRepository.createBatch.mock.calls[0][0];
        expect(tickets).toHaveLength(1);
        expect(tickets[0]).toMatchObject({
          booking_id: 'booking-123',
          is_checked_in: false,
        });
        expect(tickets[0].qr_token).toBeDefined();
      });

      it('should create correct number of tickets for quantity 5', async () => {
        // Arrange
        mockTicketRepository.createBatch.mockResolvedValue();

        // Act
        await service.generateTickets('booking-456', 5);

        // Assert
        expect(mockTicketRepository.createBatch).toHaveBeenCalledTimes(1);
        const tickets = mockTicketRepository.createBatch.mock.calls[0][0];
        expect(tickets).toHaveLength(5);
        tickets.forEach((ticket) => {
          expect(ticket).toMatchObject({
            booking_id: 'booking-456',
            is_checked_in: false,
          });
          expect(ticket.qr_token).toBeDefined();
        });
      });

      it('should create correct number of tickets for large quantity', async () => {
        // Arrange
        mockTicketRepository.createBatch.mockResolvedValue();

        // Act
        await service.generateTickets('booking-789', 100);

        // Assert
        expect(mockTicketRepository.createBatch).toHaveBeenCalledTimes(1);
        const tickets = mockTicketRepository.createBatch.mock.calls[0][0];
        expect(tickets).toHaveLength(100);
        tickets.forEach((ticket) => {
          expect(ticket).toMatchObject({
            booking_id: 'booking-789',
            is_checked_in: false,
          });
          expect(ticket.qr_token).toBeDefined();
        });
      });

      it('should not call createBatch when quantity is 0', async () => {
        // Arrange
        mockTicketRepository.createBatch.mockResolvedValue();

        // Act
        await service.generateTickets('booking-000', 0);

        // Assert
        expect(mockTicketRepository.createBatch).not.toHaveBeenCalled();
      });
    });

    describe('generates unique tokens', () => {
      it('should generate unique qr_token for each ticket', async () => {
        // Arrange
        mockTicketRepository.createBatch.mockResolvedValue();

        // Act
        await service.generateTickets('booking-unique', 10);

        // Assert
        const tickets = mockTicketRepository.createBatch.mock.calls[0][0];
        const tokens = tickets.map((t) => t.qr_token);
        const uniqueTokens = new Set(tokens);
        expect(uniqueTokens.size).toBe(10);
      });

      it('should generate valid UUID format tokens', async () => {
        // Arrange
        mockTicketRepository.createBatch.mockResolvedValue();
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        // Act
        await service.generateTickets('booking-uuid', 3);

        // Assert
        const tickets = mockTicketRepository.createBatch.mock.calls[0][0];
        tickets.forEach((ticket) => {
          expect(ticket.qr_token).toMatch(uuidRegex);
        });
      });
    });

    describe('ticket properties', () => {
      it('should set is_checked_in to false for all new tickets', async () => {
        // Arrange
        mockTicketRepository.createBatch.mockResolvedValue();

        // Act
        await service.generateTickets('booking-props', 5);

        // Assert
        const tickets = mockTicketRepository.createBatch.mock.calls[0][0];
        tickets.forEach((ticket) => {
          expect(ticket.is_checked_in).toBe(false);
        });
      });

      it('should set correct booking_id for all tickets', async () => {
        // Arrange
        mockTicketRepository.createBatch.mockResolvedValue();
        const bookingId = 'booking-correct-id';

        // Act
        await service.generateTickets(bookingId, 3);

        // Assert
        const tickets = mockTicketRepository.createBatch.mock.calls[0][0];
        tickets.forEach((ticket) => {
          expect(ticket.booking_id).toBe(bookingId);
        });
      });
    });
  });

  describe('checkInTicket', () => {
    const mockTicketWithDetails: TicketWithDetails = {
      id: 'ticket-123',
      booking_id: 'booking-123',
      qr_token: 'valid-token-123',
      is_checked_in: false,
      checked_in_at: null,
      created_at: '2024-01-01T00:00:00Z',
      booking: {
        id: 'booking-123',
        user_id: 'user-123',
        package_id: 'pkg-123',
        visit_date: '2024-12-25',
        quantity: 5,
        total_price: 250000,
        status: 'paid',
        created_at: '2024-01-01T00:00:00Z',
        package: {
          id: 'pkg-123',
          name: 'Adventure Package',
          category: 'personal',
          description: 'Adventure ticket',
          base_price: 50000,
          promo_price: null,
          quota_per_day: 100,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    };

    describe('valid check-in', () => {
      it('should check in ticket with valid token', async () => {
        // Arrange
        mockTicketRepository.findByToken.mockResolvedValue(mockTicketWithDetails);
        mockTicketRepository.checkIn.mockResolvedValue();

        // Act
        const result = await service.checkInTicket('valid-token-123');

        // Assert
        expect(mockTicketRepository.findByToken).toHaveBeenCalledWith('valid-token-123');
        expect(mockTicketRepository.checkIn).toHaveBeenCalledWith('ticket-123');
        expect(result).toMatchObject({
          ticketId: 'ticket-123',
          packageName: 'Adventure Package',
          visitorName: 'John Doe',
          visitDate: '2024-12-25',
        });
        expect(result.checkedInAt).toBeDefined();
      });

      it('should return ticket details after check-in', async () => {
        // Arrange
        mockTicketRepository.findByToken.mockResolvedValue(mockTicketWithDetails);
        mockTicketRepository.checkIn.mockResolvedValue();

        // Act
        const result = await service.checkInTicket('valid-token-123');

        // Assert
        expect(result).toHaveProperty('ticketId');
        expect(result).toHaveProperty('packageName');
        expect(result).toHaveProperty('visitorName');
        expect(result).toHaveProperty('visitDate');
        expect(result).toHaveProperty('checkedInAt');
        expect(result.ticketId).toBe('ticket-123');
        expect(result.packageName).toBe('Adventure Package');
        expect(result.visitorName).toBe('John Doe');
        expect(result.visitDate).toBe('2024-12-25');
      });

      it('should include timestamp in checkedInAt', async () => {
        // Arrange
        mockTicketRepository.findByToken.mockResolvedValue(mockTicketWithDetails);
        mockTicketRepository.checkIn.mockResolvedValue();
        const beforeCheckIn = new Date().toISOString();

        // Act
        const result = await service.checkInTicket('valid-token-123');

        // Assert
        const afterCheckIn = new Date().toISOString();
        expect(result.checkedInAt).toBeDefined();
        expect(result.checkedInAt >= beforeCheckIn).toBe(true);
        expect(result.checkedInAt <= afterCheckIn).toBe(true);
      });
    });

    describe('non-existent token', () => {
      it('should throw error for non-existent token', async () => {
        // Arrange
        mockTicketRepository.findByToken.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.checkInTicket('non-existent-token')
        ).rejects.toThrow('Ticket not found');
        expect(mockTicketRepository.findByToken).toHaveBeenCalledWith('non-existent-token');
        expect(mockTicketRepository.checkIn).not.toHaveBeenCalled();
      });

      it('should not call checkIn when ticket not found', async () => {
        // Arrange
        mockTicketRepository.findByToken.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.checkInTicket('invalid-token')
        ).rejects.toThrow('Ticket not found');
        expect(mockTicketRepository.checkIn).not.toHaveBeenCalled();
      });
    });

    describe('already checked in ticket', () => {
      it('should throw error for already checked in ticket', async () => {
        // Arrange
        const checkedInTicket: TicketWithDetails = {
          ...mockTicketWithDetails,
          is_checked_in: true,
          checked_in_at: '2024-01-01T10:00:00Z',
        };
        mockTicketRepository.findByToken.mockResolvedValue(checkedInTicket);

        // Act & Assert
        await expect(
          service.checkInTicket('already-used-token')
        ).rejects.toThrow('Ticket already used');
        expect(mockTicketRepository.findByToken).toHaveBeenCalledWith('already-used-token');
        expect(mockTicketRepository.checkIn).not.toHaveBeenCalled();
      });

      it('should not call checkIn when ticket already used', async () => {
        // Arrange
        const checkedInTicket: TicketWithDetails = {
          ...mockTicketWithDetails,
          is_checked_in: true,
          checked_in_at: '2024-01-01T10:00:00Z',
        };
        mockTicketRepository.findByToken.mockResolvedValue(checkedInTicket);

        // Act & Assert
        await expect(
          service.checkInTicket('used-token')
        ).rejects.toThrow('Ticket already used');
        expect(mockTicketRepository.checkIn).not.toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle ticket with different package types', async () => {
        // Arrange
        const schoolTicket: TicketWithDetails = {
          ...mockTicketWithDetails,
          booking: {
            ...mockTicketWithDetails.booking,
            package: {
              ...mockTicketWithDetails.booking.package,
              name: 'School Trip Package',
              category: 'school',
            },
          },
        };
        mockTicketRepository.findByToken.mockResolvedValue(schoolTicket);
        mockTicketRepository.checkIn.mockResolvedValue();

        // Act
        const result = await service.checkInTicket('school-token');

        // Assert
        expect(result.packageName).toBe('School Trip Package');
        expect(mockTicketRepository.checkIn).toHaveBeenCalledWith('ticket-123');
      });

      it('should handle ticket with special characters in visitor name', async () => {
        // Arrange
        const specialNameTicket: TicketWithDetails = {
          ...mockTicketWithDetails,
          booking: {
            ...mockTicketWithDetails.booking,
            user: {
              ...mockTicketWithDetails.booking.user,
              name: "O'Brien-Smith",
            },
          },
        };
        mockTicketRepository.findByToken.mockResolvedValue(specialNameTicket);
        mockTicketRepository.checkIn.mockResolvedValue();

        // Act
        const result = await service.checkInTicket('special-name-token');

        // Assert
        expect(result.visitorName).toBe("O'Brien-Smith");
        expect(mockTicketRepository.checkIn).toHaveBeenCalled();
      });

      it('should handle ticket with future visit date', async () => {
        // Arrange
        const futureTicket: TicketWithDetails = {
          ...mockTicketWithDetails,
          booking: {
            ...mockTicketWithDetails.booking,
            visit_date: '2025-12-31',
          },
        };
        mockTicketRepository.findByToken.mockResolvedValue(futureTicket);
        mockTicketRepository.checkIn.mockResolvedValue();

        // Act
        const result = await service.checkInTicket('future-token');

        // Assert
        expect(result.visitDate).toBe('2025-12-31');
        expect(mockTicketRepository.checkIn).toHaveBeenCalled();
      });
    });

    describe('validation flow', () => {
      it('should validate ticket exists before checking in', async () => {
        // Arrange
        mockTicketRepository.findByToken.mockResolvedValue(mockTicketWithDetails);
        mockTicketRepository.checkIn.mockResolvedValue();

        // Act
        await service.checkInTicket('valid-token-123');

        // Assert
        expect(mockTicketRepository.findByToken).toHaveBeenCalledWith('valid-token-123');
        expect(mockTicketRepository.checkIn).toHaveBeenCalledWith('ticket-123');
      });

      it('should call repository methods in correct order', async () => {
        // Arrange
        const callOrder: string[] = [];
        mockTicketRepository.findByToken.mockImplementation(async () => {
          callOrder.push('findByToken');
          return mockTicketWithDetails;
        });
        mockTicketRepository.checkIn.mockImplementation(async () => {
          callOrder.push('checkIn');
        });

        // Act
        await service.checkInTicket('order-token');

        // Assert
        expect(callOrder).toEqual(['findByToken', 'checkIn']);
      });
    });
  });
});
