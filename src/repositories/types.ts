/**
 * Repository Layer Type Definitions
 * 
 * This file contains all type definitions for the repository layer,
 * including entity types and input types for data operations.
 * 
 * Validates: Requirements 3.1-3.5
 */

// ============================================================================
// Entity Types (Database Models)
// ============================================================================

/**
 * Ticket Package entity
 * Represents a ticket package with pricing and quota information
 */
export interface Package {
  id: string;
  name: string;
  category: 'personal' | 'school';
  description: string;
  base_price: number;
  promo_price: number | null;
  quota_per_day: number;
  is_active: boolean;
  created_at: string;
}

/**
 * Booking entity
 * Represents a ticket booking made by a user
 */
export interface Booking {
  id: string;
  user_id: string;
  package_id: string;
  visit_date: string;
  quantity: number;
  total_price: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
}

/**
 * Payment entity
 * Represents a payment transaction for a booking
 */
export interface Payment {
  id: string;
  booking_id: string;
  provider: string;
  payment_status: 'pending' | 'success' | 'failed';
  external_ref: string | null;
  paid_at: string | null;
  created_at: string;
}

/**
 * QR Ticket entity
 * Represents an individual QR ticket for entry
 */
export interface Ticket {
  id: string;
  booking_id: string;
  qr_token: string;
  is_checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
}

/**
 * Ticket with full details including related entities
 * Used for check-in operations that need booking and package information
 */
export interface TicketWithDetails extends Ticket {
  booking: Booking & {
    package: Package;
    user: User;
  };
}

/**
 * User entity
 * Represents a system user
 */
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'staff' | 'user' | 'school';
  created_at: string;
}

// ============================================================================
// Input Types (Data Transfer Objects)
// ============================================================================

/**
 * Input data for creating a new booking
 * Used by BookingRepository.create()
 */
export interface CreateBookingInput {
  user_id: string;
  package_id: string;
  visit_date: string;
  quantity: number;
  total_price: number;
  status: 'pending' | 'paid' | 'cancelled';
}

/**
 * Input data for creating a new payment record
 * Used by PaymentRepository.create()
 */
export interface CreatePaymentInput {
  booking_id: string;
  provider: string;
  payment_status: 'pending' | 'success' | 'failed';
  external_ref: string | null;
  paid_at: string | null;
}

/**
 * Input data for creating a new QR ticket
 * Used by TicketRepository.createBatch()
 */
export interface CreateTicketInput {
  booking_id: string;
  qr_token: string;
  is_checked_in: boolean;
}
