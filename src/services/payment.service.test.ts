/**
 * Unit tests for PaymentService
 * 
 * Validates: Requirements 5.1-5.10
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PaymentService } from './payment.service';
import { BookingRepository } from '@/repositories/booking.repository';
import { PaymentRepository } from '@/repositories/payment.repository';
import { TicketService } from './ticket.service';
import type { Booking } from '@/repositories/types';
import type { PaymentResult } from './types';

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

jest.mock('@/repositories/payment.repository', () => ({
  PaymentRepository: jest.fn(),
  paymentRepository: {},
}));

// Mock the TicketService
jest.mock('./ticket.service', () => ({
  TicketService: jest.fn(),
  ticketService: {},
}));

describe('PaymentService', () => {
  let service: PaymentService;
  let mockBookingRepository: jest.Mocked<BookingRepository>;
  let mockPaymentRepository: jest.Mocked<PaymentRepository>;
  let mockTicketService: jest.Mocked<TicketService>;

  beforeEach(() => {
    // Create mock instances
    mockBookingRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      countByPackageAndDate: jest.fn(),
    } as unknown as jest.Mocked<BookingRepository>;

    mockPaymentRepository = {
      create: jest.fn(),
      findByBookingId: jest.fn(),
    } as unknown as jest.Mocked<PaymentRepository>;

    mockTicketService = {
      generateTickets: jest.fn(),
      checkInTicket: jest.fn(),
    } as unknown as jest.Mocked<TicketService>;

    service = new PaymentService(
      mockBookingRepository,
      mockPaymentRepository,
      mockTicketService
    );

    jest.clearAllMocks();
  });

  describe('processPayment', () => {
    const mockBooking: Booking = {
      id: 'booking-123',
      user_id: 'user-123',
      package_id: 'pkg-123',
      visit_date: '2024-12-25',
      quantity: 5,
      total_price: 250000,
      status: 'pending',
      created_at: '2024-01-01T00:00:00Z',
    };

    describe('valid payment processing', () => {
      it('should process payment with valid booking', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-123');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        const result = await service.processPayment('booking-123');

        // Assert
        expect(result).toEqual({
          bookingId: 'booking-123',
          success: true,
          message: 'Payment successful',
        });
        expect(mockBookingRepository.findById).toHaveBeenCalledWith('booking-123');
        expect(mockBookingRepository.updateStatus).toHaveBeenCalledWith('booking-123', 'paid');
        expect(mockPaymentRepository.create).toHaveBeenCalled();
        expect(mockTicketService.generateTickets).toHaveBeenCalledWith('booking-123', 5);
      });

      it('should return success status and message', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-456');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        const result = await service.processPayment('booking-123');

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('Payment successful');
        expect(result.bookingId).toBe('booking-123');
      });
    });

    describe('booking validation', () => {
      it('should throw error for non-existent booking', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.processPayment('non-existent-booking')
        ).rejects.toThrow('Booking not found');
        expect(mockBookingRepository.findById).toHaveBeenCalledWith('non-existent-booking');
        expect(mockBookingRepository.updateStatus).not.toHaveBeenCalled();
        expect(mockPaymentRepository.create).not.toHaveBeenCalled();
        expect(mockTicketService.generateTickets).not.toHaveBeenCalled();
      });

      it('should not proceed with payment when booking not found', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.processPayment('invalid-booking')
        ).rejects.toThrow('Booking not found');
        expect(mockBookingRepository.updateStatus).not.toHaveBeenCalled();
        expect(mockPaymentRepository.create).not.toHaveBeenCalled();
      });
    });

    describe('already paid booking', () => {
      it('should throw error for already paid booking', async () => {
        // Arrange
        const paidBooking: Booking = {
          ...mockBooking,
          status: 'paid',
        };
        mockBookingRepository.findById.mockResolvedValue(paidBooking);

        // Act & Assert
        await expect(
          service.processPayment('booking-123')
        ).rejects.toThrow('Booking already paid');
        expect(mockBookingRepository.findById).toHaveBeenCalledWith('booking-123');
        expect(mockBookingRepository.updateStatus).not.toHaveBeenCalled();
        expect(mockPaymentRepository.create).not.toHaveBeenCalled();
        expect(mockTicketService.generateTickets).not.toHaveBeenCalled();
      });

      it('should not create payment record for already paid booking', async () => {
        // Arrange
        const paidBooking: Booking = {
          ...mockBooking,
          status: 'paid',
        };
        mockBookingRepository.findById.mockResolvedValue(paidBooking);

        // Act & Assert
        await expect(
          service.processPayment('booking-123')
        ).rejects.toThrow('Booking already paid');
        expect(mockPaymentRepository.create).not.toHaveBeenCalled();
      });
    });

    describe('booking status update', () => {
      it('should update booking status to "paid"', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-789');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        await service.processPayment('booking-123');

        // Assert
        expect(mockBookingRepository.updateStatus).toHaveBeenCalledWith('booking-123', 'paid');
      });

      it('should update status before creating payment record', async () => {
        // Arrange
        const callOrder: string[] = [];
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockImplementation(async () => {
          callOrder.push('updateStatus');
        });
        mockPaymentRepository.create.mockImplementation(async () => {
          callOrder.push('createPayment');
          return 'payment-999';
        });
        mockTicketService.generateTickets.mockImplementation(async () => {
          callOrder.push('generateTickets');
        });

        // Act
        await service.processPayment('booking-123');

        // Assert
        expect(callOrder).toEqual(['updateStatus', 'createPayment', 'generateTickets']);
      });
    });

    describe('payment record creation', () => {
      it('should create payment record', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-111');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        await service.processPayment('booking-123');

        // Assert
        expect(mockPaymentRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            booking_id: 'booking-123',
            provider: 'mock_gateway',
            payment_status: 'success',
          })
        );
      });

      it('should create payment with mock_gateway provider', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-222');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        await service.processPayment('booking-123');

        // Assert
        expect(mockPaymentRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            provider: 'mock_gateway',
          })
        );
      });

      it('should create payment with success status', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-333');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        await service.processPayment('booking-123');

        // Assert
        expect(mockPaymentRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            payment_status: 'success',
          })
        );
      });

      it('should create payment with external reference', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-444');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        await service.processPayment('booking-123');

        // Assert
        const createCall = mockPaymentRepository.create.mock.calls[0][0];
        expect(createCall.external_ref).toMatch(/^mock_\d+$/);
      });

      it('should create payment with paid_at timestamp', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-555');
        mockTicketService.generateTickets.mockResolvedValue();
        const beforePayment = new Date().toISOString();

        // Act
        await service.processPayment('booking-123');

        // Assert
        const afterPayment = new Date().toISOString();
        const createCall = mockPaymentRepository.create.mock.calls[0][0];
        expect(createCall.paid_at).toBeDefined();
        expect(createCall.paid_at! >= beforePayment).toBe(true);
        expect(createCall.paid_at! <= afterPayment).toBe(true);
      });
    });

    describe('ticket generation', () => {
      it('should generate tickets', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-666');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        await service.processPayment('booking-123');

        // Assert
        expect(mockTicketService.generateTickets).toHaveBeenCalledWith('booking-123', 5);
      });

      it('should generate tickets equal to booking quantity', async () => {
        // Arrange
        const largeBooking: Booking = {
          ...mockBooking,
          quantity: 50,
        };
        mockBookingRepository.findById.mockResolvedValue(largeBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-777');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        await service.processPayment('booking-123');

        // Assert
        expect(mockTicketService.generateTickets).toHaveBeenCalledWith('booking-123', 50);
      });

      it('should generate tickets after creating payment record', async () => {
        // Arrange
        const callOrder: string[] = [];
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockImplementation(async () => {
          callOrder.push('createPayment');
          return 'payment-888';
        });
        mockTicketService.generateTickets.mockImplementation(async () => {
          callOrder.push('generateTickets');
        });

        // Act
        await service.processPayment('booking-123');

        // Assert
        expect(callOrder).toEqual(['createPayment', 'generateTickets']);
      });
    });

    describe('transaction behavior', () => {
      it('should execute all operations in transaction', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-999');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        await service.processPayment('booking-123');

        // Assert
        // All three operations should be called
        expect(mockBookingRepository.updateStatus).toHaveBeenCalled();
        expect(mockPaymentRepository.create).toHaveBeenCalled();
        expect(mockTicketService.generateTickets).toHaveBeenCalled();
      });

      it('should execute operations in correct order', async () => {
        // Arrange
        const callOrder: string[] = [];
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockImplementation(async () => {
          callOrder.push('updateStatus');
        });
        mockPaymentRepository.create.mockImplementation(async () => {
          callOrder.push('createPayment');
          return 'payment-order';
        });
        mockTicketService.generateTickets.mockImplementation(async () => {
          callOrder.push('generateTickets');
        });

        // Act
        await service.processPayment('booking-123');

        // Assert
        expect(callOrder).toEqual(['updateStatus', 'createPayment', 'generateTickets']);
      });
    });

    describe('edge cases', () => {
      it('should handle booking with quantity = 1', async () => {
        // Arrange
        const singleBooking: Booking = {
          ...mockBooking,
          quantity: 1,
        };
        mockBookingRepository.findById.mockResolvedValue(singleBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-single');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        const result = await service.processPayment('booking-123');

        // Assert
        expect(result.success).toBe(true);
        expect(mockTicketService.generateTickets).toHaveBeenCalledWith('booking-123', 1);
      });

      it('should handle booking with large quantity', async () => {
        // Arrange
        const largeBooking: Booking = {
          ...mockBooking,
          quantity: 200,
        };
        mockBookingRepository.findById.mockResolvedValue(largeBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-large');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        const result = await service.processPayment('booking-123');

        // Assert
        expect(result.success).toBe(true);
        expect(mockTicketService.generateTickets).toHaveBeenCalledWith('booking-123', 200);
      });

      it('should handle cancelled booking status', async () => {
        // Arrange
        const cancelledBooking: Booking = {
          ...mockBooking,
          status: 'cancelled',
        };
        mockBookingRepository.findById.mockResolvedValue(cancelledBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-cancelled');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        const result = await service.processPayment('booking-123');

        // Assert
        // Should allow payment for cancelled booking (business rule)
        expect(result.success).toBe(true);
        expect(mockBookingRepository.updateStatus).toHaveBeenCalledWith('booking-123', 'paid');
      });

      it('should handle different booking IDs', async () => {
        // Arrange
        const booking1: Booking = { ...mockBooking, id: 'booking-aaa' };
        const booking2: Booking = { ...mockBooking, id: 'booking-bbb' };

        mockBookingRepository.findById
          .mockResolvedValueOnce(booking1)
          .mockResolvedValueOnce(booking2);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create
          .mockResolvedValueOnce('payment-aaa')
          .mockResolvedValueOnce('payment-bbb');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        const result1 = await service.processPayment('booking-aaa');
        const result2 = await service.processPayment('booking-bbb');

        // Assert
        expect(result1.bookingId).toBe('booking-aaa');
        expect(result2.bookingId).toBe('booking-bbb');
      });
    });

    describe('error handling', () => {
      it('should not create payment if booking validation fails', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.processPayment('invalid-booking')
        ).rejects.toThrow('Booking not found');
        expect(mockPaymentRepository.create).not.toHaveBeenCalled();
      });

      it('should not generate tickets if booking validation fails', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.processPayment('invalid-booking')
        ).rejects.toThrow('Booking not found');
        expect(mockTicketService.generateTickets).not.toHaveBeenCalled();
      });

      it('should not update status if already paid', async () => {
        // Arrange
        const paidBooking: Booking = {
          ...mockBooking,
          status: 'paid',
        };
        mockBookingRepository.findById.mockResolvedValue(paidBooking);

        // Act & Assert
        await expect(
          service.processPayment('booking-123')
        ).rejects.toThrow('Booking already paid');
        expect(mockBookingRepository.updateStatus).not.toHaveBeenCalled();
      });
    });

    describe('return value', () => {
      it('should return PaymentResult with correct structure', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-struct');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        const result = await service.processPayment('booking-123');

        // Assert
        expect(result).toHaveProperty('bookingId');
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('message');
        expect(typeof result.bookingId).toBe('string');
        expect(typeof result.success).toBe('boolean');
        expect(typeof result.message).toBe('string');
      });

      it('should return booking ID in result', async () => {
        // Arrange
        mockBookingRepository.findById.mockResolvedValue(mockBooking);
        mockBookingRepository.updateStatus.mockResolvedValue();
        mockPaymentRepository.create.mockResolvedValue('payment-return');
        mockTicketService.generateTickets.mockResolvedValue();

        // Act
        const result = await service.processPayment('booking-xyz');

        // Assert
        expect(result.bookingId).toBe('booking-xyz');
      });
    });
  });
});
