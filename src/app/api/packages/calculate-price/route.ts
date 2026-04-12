import { NextResponse } from 'next/server';
import { pricingService } from '@/services/pricing.service';
import { z } from 'zod';

/**
 * Calculate Price API Route - Thin Controller
 * Handles HTTP concerns and delegates pricing logic to PricingService
 * 
 * Validates: Requirements 10.4, 10.5
 */

const calculatePriceSchema = z.object({
  packageId: z.string().min(1, 'Package ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

/**
 * POST /api/packages/calculate-price
 * Calculate price for a package with given quantity
 * 
 * @param req - Request with packageId and quantity
 * @returns 200 with price calculation result
 * @returns 400 for validation errors
 * @returns 404 for package not found
 */
export async function POST(req: Request) {
  try {
    // Request validation
    const body = await req.json();
    const { packageId, quantity } = calculatePriceSchema.parse(body);

    // Delegate to service layer
    const priceResult = await pricingService.calculatePrice(packageId, quantity);

    // Return success response
    return NextResponse.json({
      totalPrice: priceResult.totalPrice,
      pricePerUnit: priceResult.pricePerUnit,
      discountApplied: priceResult.discountApplied,
      discountPercentage: priceResult.discountPercentage,
    }, { status: 200 });

  } catch (error: any) {
    // Error mapping
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation failed', errors: error.issues },
        { status: 400 }
      );
    }

    if (error.message === 'Package not found') {
      return NextResponse.json(
        { message: error.message },
        { status: 404 }
      );
    }

    console.error('CALCULATE PRICE ERROR:', error);

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
