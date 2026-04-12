/**
 * Service Layer Type Definitions
 * 
 * This file contains all shared type definitions used across the service layer.
 * These types define the contracts between services and their consumers (API routes).
 * 
 * Validates: Requirements 1.1-1.8
 */

/**
 * Result of a price calculation
 * Returned by PricingService.calculatePrice()
 */
export interface PriceResult {
  /** Total price for all tickets */
  totalPrice: number;
  /** Price per individual ticket after discounts */
  pricePerUnit: number;
  /** Whether any discount was applied */
  discountApplied: boolean;
  /** Discount percentage (0-100) */
  discountPercentage: number;
}

/**
 * Detailed breakdown of price calculation
 * Returned by PricingService.getPriceBreakdown()
 */
export interface PriceBreakdown {
  /** Base price before discounts (price * quantity) */
  basePrice: number;
  /** Total discount amount in currency */
  discountAmount: number;
  /** Final price after discounts */
  finalPrice: number;
  /** Number of tickets */
  quantity: number;
}

/**
 * Result of payment processing
 * Returned by PaymentService.processPayment()
 */
export interface PaymentResult {
  /** ID of the booking that was paid */
  bookingId: string;
  /** Whether payment was successful */
  success: boolean;
  /** Human-readable message about payment result */
  message: string;
}

/**
 * Details of a checked-in ticket
 * Returned by TicketService.checkInTicket()
 */
export interface TicketDetails {
  /** Unique ticket ID */
  ticketId: string;
  /** Name of the package */
  packageName: string;
  /** Name of the visitor */
  visitorName: string;
  /** Visit date (YYYY-MM-DD format) */
  visitDate: string;
  /** Timestamp when ticket was checked in (ISO 8601) */
  checkedInAt: string;
}

/**
 * Data required to create a new booking
 * Used as input to BookingService.createBooking()
 */
export interface CreateBookingData {
  /** ID of the user making the booking */
  userId: string;
  /** ID of the package being booked */
  packageId: string;
  /** Visit date in YYYY-MM-DD format */
  visitDate: string;
  /** Number of tickets to book */
  quantity: number;
}
