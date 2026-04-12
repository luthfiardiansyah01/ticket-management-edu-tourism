/**
 * Unit tests for BookingForm Component
 * Tests API integration, debouncing, loading states, and error handling
 * 
 * Validates: Requirements 10.1-10.10
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import BookingForm from './BookingForm';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock LanguageProvider
jest.mock('@/components/providers/LanguageProvider', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'booking.title': 'Book Your Visit',
        'booking.visitDate': 'Visit Date',
        'booking.quantity': 'Quantity',
        'booking.bulkDiscount': 'Bulk discount available',
        'booking.totalPrice': 'Total Price',
        'booking.bookNow': 'Book Now',
        'booking.processing': 'Processing...',
        'booking.calculating': 'Calculating...',
        'booking.priceWarning': 'Price calculation warning',
        'booking.discountApplied': 'discount applied',
        'booking.pricePerUnit': 'Price per unit',
        'booking.errorDate': 'Please select a visit date',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('BookingForm Component', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };
  const mockSession = {
    user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
    expires: '2025-12-31',
  };

  const defaultProps = {
    packageId: 'pkg-123',
    basePrice: 50000,
    promoPrice: null,
    category: 'personal' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.MockedFunction<typeof useRouter>).mockReturnValue(mockRouter as any);
    (useSession as jest.MockedFunction<typeof useSession>).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    } as any);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('API Integration', () => {
    it('should call calculate-price API when quantity changes', async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalPrice: 100000,
          pricePerUnit: 50000,
          discountApplied: false,
          discountPercentage: 0,
        }),
      } as Response);

      // Act
      render(<BookingForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '2' } });

      // Fast-forward debounce timer
      jest.advanceTimersByTime(300);

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/packages/calculate-price',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packageId: 'pkg-123',
              quantity: 2,
            }),
          })
        );
      });
    });

    it('should debounce API calls (300ms)', async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          totalPrice: 150000,
          pricePerUnit: 50000,
          discountApplied: false,
          discountPercentage: 0,
        }),
      } as Response);

      // Act
      render(<BookingForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Quantity');
      
      // Rapid changes
      fireEvent.change(quantityInput, { target: { value: '2' } });
      jest.advanceTimersByTime(100);
      
      fireEvent.change(quantityInput, { target: { value: '3' } });
      jest.advanceTimersByTime(100);
      
      fireEvent.change(quantityInput, { target: { value: '4' } });
      jest.advanceTimersByTime(300);

      // Assert - Should only call API once after debounce
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/packages/calculate-price',
          expect.objectContaining({
            body: JSON.stringify({
              packageId: 'pkg-123',
              quantity: 4, // Last value
            }),
          })
        );
      });
    });

    it('should update price display after API response', async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalPrice: 200000,
          pricePerUnit: 50000,
          discountApplied: false,
          discountPercentage: 0,
        }),
      } as Response);

      // Act
      render(<BookingForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '4' } });
      jest.advanceTimersByTime(300);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Rp 200\.000/)).toBeInTheDocument();
      });
    });

    it('should show discount badge for school packages with discount', async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalPrice: 1800000,
          pricePerUnit: 36000,
          discountApplied: true,
          discountPercentage: 10,
        }),
      } as Response);

      // Act
      render(<BookingForm {...defaultProps} category="school" />);
      
      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '50' } });
      jest.advanceTimersByTime(300);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/10% discount applied/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator during API call', async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockFetch.mockReturnValueOnce(promise as any);

      // Act
      render(<BookingForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '3' } });
      jest.advanceTimersByTime(300);

      // Assert - Loading state should be visible
      await waitFor(() => {
        expect(screen.getByText('Calculating...')).toBeInTheDocument();
      });

      // Cleanup - resolve promise
      resolvePromise!({
        ok: true,
        json: async () => ({
          totalPrice: 150000,
          pricePerUnit: 50000,
          discountApplied: false,
          discountPercentage: 0,
        }),
      });
    });

    it('should show spinner animation during loading', async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockFetch.mockReturnValueOnce(promise as any);

      // Act
      render(<BookingForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '2' } });
      jest.advanceTimersByTime(300);

      // Assert - Spinner should be present
      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });

      // Cleanup
      resolvePromise!({
        ok: true,
        json: async () => ({
          totalPrice: 100000,
          pricePerUnit: 50000,
          discountApplied: false,
          discountPercentage: 0,
        }),
      });
    });

    it('should disable submit button during price loading', async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockFetch.mockReturnValueOnce(promise as any);

      // Act
      render(<BookingForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '2' } });
      jest.advanceTimersByTime(300);

      // Assert - Button should be disabled
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Book Now/i });
        expect(submitButton).toBeDisabled();
      });

      // Cleanup
      resolvePromise!({
        ok: true,
        json: async () => ({
          totalPrice: 100000,
          pricePerUnit: 50000,
          discountApplied: false,
          discountPercentage: 0,
        }),
      });
    });

    it('should hide loading state after API response', async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalPrice: 100000,
          pricePerUnit: 50000,
          discountApplied: false,
          discountPercentage: 0,
        }),
      } as Response);

      // Act
      render(<BookingForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '2' } });
      jest.advanceTimersByTime(300);

      // Assert - Loading should disappear
      await waitFor(() => {
        expect(screen.queryByText('Calculating...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when API fails', async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Package not found' }),
      } as Response);

      // Act
      render(<BookingForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '2' } });
      jest.advanceTimersByTime(300);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Price calculation warning/)).toBeInTheDocument();
        expect(screen.getByText(/Package not found/)).toBeInTheDocument();
      });
    });

    it('should fallback to local calculation on API error', async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<BookingForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '3' } });
      jest.advanceTimersByTime(300);

      // Assert - Should still show price (fallback calculation)
      await waitFor(() => {
        expect(screen.getByText(/Rp 150\.000/)).toBeInTheDocument(); // 50000 * 3
      });
    });

    it('should apply correct fallback discount for school packages', async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error('API error'));

      // Act
      render(<BookingForm {...defaultProps} category="school" basePrice={40000} />);
      
      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '50' } });
      jest.advanceTimersByTime(300);

      // Assert - Should apply 10% discount locally
      // 40000 * 0.90 = 36000 per unit
      // 36000 * 50 = 1,800,000
      await waitFor(() => {
        expect(screen.getByText(/Rp 1\.800\.000/)).toBeInTheDocument();
      });
    });

    it('should clear error message on successful API call', async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Server error' }),
      } as Response);

      // Act - First change (error)
      render(<BookingForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '2' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText(/Server error/)).toBeInTheDocument();
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalPrice: 150000,
          pricePerUnit: 50000,
          discountApplied: false,
          discountPercentage: 0,
        }),
      } as Response);

      // Act - Second change (success)
      fireEvent.change(quantityInput, { target: { value: '3' } });
      jest.advanceTimersByTime(300);

      // Assert - Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/Server error/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Component Behavior', () => {
    it('should render form with all required fields', () => {
      // Act
      render(<BookingForm {...defaultProps} />);

      // Assert
      expect(screen.getByText('Book Your Visit')).toBeInTheDocument();
      expect(screen.getByLabelText('Visit Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
      expect(screen.getByText('Total Price')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Book Now/i })).toBeInTheDocument();
    });

    it('should show bulk discount hint for school packages', () => {
      // Act
      render(<BookingForm {...defaultProps} category="school" />);

      // Assert
      expect(screen.getByText('Bulk discount available')).toBeInTheDocument();
    });

    it('should not show bulk discount hint for personal packages', () => {
      // Act
      render(<BookingForm {...defaultProps} category="personal" />);

      // Assert
      expect(screen.queryByText('Bulk discount available')).not.toBeInTheDocument();
    });

    it('should prevent quantity less than 1', () => {
      // Act
      render(<BookingForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Quantity') as HTMLInputElement;
      fireEvent.change(quantityInput, { target: { value: '0' } });

      // Assert - Should reset to 1
      expect(quantityInput.value).toBe('1');
    });

    it('should show price per unit when different from base price', async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalPrice: 1800000,
          pricePerUnit: 36000, // Different from base price
          discountApplied: true,
          discountPercentage: 10,
        }),
      } as Response);

      // Act
      render(<BookingForm {...defaultProps} category="school" basePrice={40000} />);
      
      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '50' } });
      jest.advanceTimersByTime(300);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Price per unit/)).toBeInTheDocument();
        expect(screen.getByText(/Rp 36\.000/)).toBeInTheDocument();
      });
    });
  });

  describe('Booking Submission', () => {
    it('should maintain existing booking submission workflow', async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // Mock price calculation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalPrice: 100000,
          pricePerUnit: 50000,
          discountApplied: false,
          discountPercentage: 0,
        }),
      } as Response);

      // Mock booking submission
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bookingId: 'booking-123', message: 'Booking created' }),
      } as Response);

      // Act
      render(<BookingForm {...defaultProps} />);
      
      // Fill form
      const dateInput = screen.getByLabelText('Visit Date');
      fireEvent.change(dateInput, { target: { value: '2025-12-25' } });
      
      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '2' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText(/Rp 100\.000/)).toBeInTheDocument();
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Book Now/i });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/bookings',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              packageId: 'pkg-123',
              visitDate: '2025-12-25',
              quantity: 2,
            }),
          })
        );
      });
    });
  });
});
