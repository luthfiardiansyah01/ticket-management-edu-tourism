import { packageRepository, PackageRepository } from '@/repositories/package.repository';
import type { PriceResult, PriceBreakdown } from './types';

/**
 * Service for pricing calculations and discount logic
 * Centralizes all pricing business rules
 * 
 * Validates: Requirements 2.1-2.9
 */
export class PricingService {
  constructor(private packageRepository: PackageRepository) {}

  /**
   * Calculate total price for a booking
   * Applies bulk discounts for school packages
   * 
   * @param packageId - Package ID
   * @param quantity - Number of tickets
   * @returns Price calculation result
   * @throws Error if package not found
   * 
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
   */
  async calculatePrice(packageId: string, quantity: number): Promise<PriceResult> {
    const pkg = await this.packageRepository.findById(packageId);
    
    if (!pkg) {
      throw new Error('Package not found');
    }

    // Use promo price if available, otherwise base price
    const basePrice = pkg.promo_price ?? pkg.base_price;
    
    // Apply bulk discount for school packages
    const discountPercentage = this.getDiscountPercentage(pkg.category, quantity);
    const pricePerUnit = this.applyBulkDiscount(basePrice, pkg.category, quantity);
    const totalPrice = pricePerUnit * quantity;

    return {
      totalPrice,
      pricePerUnit,
      discountApplied: discountPercentage > 0,
      discountPercentage,
    };
  }

  /**
   * Get detailed price breakdown
   * 
   * @param packageId - Package ID
   * @param quantity - Number of tickets
   * @returns Detailed price breakdown
   * @throws Error if package not found
   * 
   * Validates: Requirement 2.7
   */
  async getPriceBreakdown(packageId: string, quantity: number): Promise<PriceBreakdown> {
    const pkg = await this.packageRepository.findById(packageId);
    
    if (!pkg) {
      throw new Error('Package not found');
    }

    const basePrice = pkg.promo_price ?? pkg.base_price;
    const baseTotalPrice = basePrice * quantity;
    const discountPercentage = this.getDiscountPercentage(pkg.category, quantity);
    const discountAmount = Math.floor(baseTotalPrice * (discountPercentage / 100));
    const finalPrice = baseTotalPrice - discountAmount;

    return {
      basePrice: baseTotalPrice,
      discountAmount,
      finalPrice,
      quantity,
    };
  }

  /**
   * Apply bulk discount based on category and quantity
   * School packages: 10% off for 50-99, 15% off for 100+
   * Personal packages: No bulk discount
   * 
   * @private
   * Validates: Requirements 2.2, 2.3, 2.4
   */
  private applyBulkDiscount(
    basePrice: number,
    category: 'personal' | 'school',
    quantity: number
  ): number {
    if (category !== 'school') {
      return basePrice;
    }

    if (quantity >= 100) {
      return Math.floor(basePrice * 0.85); // 15% off
    } else if (quantity >= 50) {
      return Math.floor(basePrice * 0.90); // 10% off
    }

    return basePrice;
  }

  /**
   * Get discount percentage for display purposes
   * 
   * @private
   */
  private getDiscountPercentage(
    category: 'personal' | 'school',
    quantity: number
  ): number {
    if (category !== 'school') {
      return 0;
    }

    if (quantity >= 100) {
      return 15;
    } else if (quantity >= 50) {
      return 10;
    }

    return 0;
  }
}

/**
 * Singleton instance for use in API routes
 */
export const pricingService = new PricingService(packageRepository);
