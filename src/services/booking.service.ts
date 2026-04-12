import { db } from '@/db';
import { bookingRepository, BookingRepository } from '@/repositories/booking.repository';
import { packageRepository, PackageRepository } from '@/repositories/package.repository';
import { pricingService, PricingService } from './pricing.service';
import type { CreateBookingData } from './types';
import type { Package } from '@/repositories/types';

/**
 * Service for booking creation and validation
 * Handles booking workflows including quota management
 * 
 * Validates: Requirements 4.1-4.10
 */
export class BookingService {
  constructor(
    private bookingRepository: BookingRepository,
    private packageRepository: PackageRepository,
    private pricingService: PricingService
  ) {}

  /**
   * Create a new booking with quota validation
   * Executes within a transaction to ensure atomicity
   * 
   * @param data - Booking creation data
   * @returns Booking ID
   * @throws Error if validation fails or quota exceeded
   * 
   * Validates: Requirements 4.1-4.10
   */
  async createBooking(data: CreateBookingData): Promise<string> {
    // Validate package exists and is active
    const pkg = await this.validatePackage(data.packageId);

    // Validate quantity
    if (data.quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    // Calculate price using PricingService
    const priceResult = await this.pricingService.calculatePrice(
      data.packageId,
      data.quantity
    );

    // Execute quota check and booking creation in transaction
    const bookingId = await db.transaction(async (tx) => {
      // Check quota within transaction
      await this.validateQuota(data.packageId, data.visitDate, data.quantity);

      // Create booking
      const id = await this.bookingRepository.create({
        user_id: data.userId,
        package_id: data.packageId,
        visit_date: data.visitDate,
        quantity: data.quantity,
        total_price: priceResult.totalPrice,
        status: 'pending',
      });

      return id;
    },{ behavior: 'deferred' });

    return bookingId;
  }

  /**
   * Validate package exists and is active
   * 
   * @private
   * @param packageId - Package ID
   * @returns Package entity
   * @throws Error if package not found or inactive
   * 
   * Validates: Requirements 4.2, 4.7
   */
  private async validatePackage(packageId: string): Promise<Package> {
    const pkg = await this.packageRepository.findById(packageId);

    if (!pkg || !pkg.is_active) {
      throw new Error('Package not found or inactive');
    }

    return pkg;
  }

  /**
   * Validate quota is not exceeded for the visit date
   * Must be called within a transaction
   * 
   * @private
   * @param packageId - Package ID
   * @param visitDate - Visit date (YYYY-MM-DD)
   * @param requestedQuantity - Number of tickets requested
   * @throws Error if quota exceeded
   * 
   * Validates: Requirements 4.5, 4.6
   */
  private async validateQuota(
    packageId: string,
    visitDate: string,
    requestedQuantity: number
  ): Promise<void> {
    const pkg = await this.packageRepository.findById(packageId);
    
    if (!pkg) {
      throw new Error('Package not found');
    }

    const currentBookings = await this.bookingRepository.countByPackageAndDate(
      packageId,
      visitDate
    );

    if (currentBookings + requestedQuantity > pkg.quota_per_day) {
      throw new Error('Quota exceeded for this date');
    }
  }
}

/**
 * Singleton instance for use in API routes
 */
export const bookingService = new BookingService(
  bookingRepository,
  packageRepository,
  pricingService
);
