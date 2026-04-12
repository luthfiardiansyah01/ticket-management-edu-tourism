# Property-Based Tests for PricingService

## Overview

This document describes the property-based tests for the PricingService using the fast-check library. Property-based testing validates that the pricing logic holds true across a wide range of random inputs, providing stronger correctness guarantees than example-based unit tests.

## Test Execution

```bash
# Run property-based tests
npm test -- pricing.service.property.test

# Run with coverage
npm test -- --coverage --testPathPatterns="pricing.service"
```

## Test Results

- **Total Properties Tested**: 10
- **Test Cases per Property**: 100 random inputs
- **Total Test Cases**: 1,000
- **Test Coverage**: 100% (Statements, Branches, Functions, Lines)
- **Execution Time**: ~7 seconds

## Properties Validated

### Property 1: School Package 15% Discount (≥100 quantity)
**Validates**: Requirement 2.2

**Invariant**: For any school package with quantity ≥ 100, the price per unit should be `floor(effectivePrice * 0.85)`

**Test Strategy**:
- Generate random base prices (10,000 - 1,000,000)
- Generate random promo prices (5,000 - 500,000) or null
- Generate random quantities (100 - 1,000)
- Verify discount is exactly 15%

### Property 2: School Package 10% Discount (50-99 quantity)
**Validates**: Requirement 2.3

**Invariant**: For any school package with quantity in [50, 99], the price per unit should be `floor(effectivePrice * 0.90)`

**Test Strategy**:
- Generate random base prices (10,000 - 1,000,000)
- Generate random promo prices (5,000 - 500,000) or null
- Generate random quantities (50 - 99)
- Verify discount is exactly 10%

### Property 3: School Package No Discount (<50 quantity)
**Validates**: Requirement 2.4

**Invariant**: For any school package with quantity < 50, no discount should be applied

**Test Strategy**:
- Generate random base prices (10,000 - 1,000,000)
- Generate random promo prices (5,000 - 500,000) or null
- Generate random quantities (1 - 49)
- Verify discountApplied = false and discountPercentage = 0

### Property 4: Personal Package No Discount
**Validates**: Requirement 2.4

**Invariant**: For any personal package with any quantity, no discount should be applied

**Test Strategy**:
- Generate random base prices (10,000 - 1,000,000)
- Generate random promo prices (5,000 - 500,000) or null
- Generate random quantities (1 - 1,000)
- Verify discountApplied = false and discountPercentage = 0

### Property 5: Promo Price Priority
**Validates**: Requirement 2.5

**Invariant**: When both base_price and promo_price are present, promo_price should always be used for calculation

**Test Strategy**:
- Generate random base prices (50,000 - 1,000,000)
- Generate random promo prices (10,000 - 49,999) - always lower than base
- Generate random categories (personal, school)
- Generate random quantities (1 - 200)
- Verify calculation uses promo_price, not base_price

### Property 6: Base Price Fallback
**Validates**: Requirement 2.6

**Invariant**: When promo_price is null, base_price should be used

**Test Strategy**:
- Generate random base prices (10,000 - 1,000,000)
- Set promo_price to null
- Generate random categories (personal, school)
- Generate random quantities (1 - 200)
- Verify calculation uses base_price

### Property 7: Price Calculation Idempotence
**Validates**: Requirement 2.9

**Invariant**: Calling calculatePrice twice with same inputs should return identical results

**Test Strategy**:
- Generate random base prices (10,000 - 1,000,000)
- Generate random promo prices (5,000 - 500,000) or null
- Generate random categories (personal, school)
- Generate random quantities (1 - 200)
- Call calculatePrice twice
- Verify all fields are identical

### Property 8: Total Price = Price Per Unit × Quantity
**Validates**: Requirement 2.1

**Invariant**: Total price should always equal pricePerUnit * quantity

**Test Strategy**:
- Generate random base prices (10,000 - 1,000,000)
- Generate random promo prices (5,000 - 500,000) or null
- Generate random categories (personal, school)
- Generate random quantities (1 - 500)
- Verify totalPrice = pricePerUnit * quantity
- Verify both values are positive

### Property 9: Discount Percentage Consistency
**Validates**: Requirements 2.2, 2.3, 2.4

**Invariant**: Discount percentage should match the discount applied

**Test Strategy**:
- Generate random base prices (10,000 - 1,000,000)
- Generate random categories (personal, school)
- Generate random quantities (1 - 200)
- Verify discountPercentage matches actual discount:
  - School + quantity ≥ 100 → 15%
  - School + quantity ≥ 50 → 10%
  - Otherwise → 0%

### Property 10: Price Always Positive
**Validates**: General correctness

**Invariant**: All prices should always be positive

**Test Strategy**:
- Generate random base prices (1 - 1,000,000)
- Generate random promo prices (1 - 500,000) or null
- Generate random categories (personal, school)
- Generate random quantities (1 - 1,000)
- Verify totalPrice > 0
- Verify pricePerUnit > 0
- Verify 0 ≤ discountPercentage ≤ 100

## Benefits of Property-Based Testing

1. **Broader Coverage**: Tests 1,000 random cases instead of a few hand-picked examples
2. **Edge Case Discovery**: Automatically finds edge cases developers might miss
3. **Regression Prevention**: Ensures pricing logic remains correct across all input ranges
4. **Specification Validation**: Properties serve as executable specifications
5. **Confidence**: Provides mathematical confidence in correctness

## Integration with CI/CD

These property-based tests run automatically as part of the test suite:

```bash
# Run all tests (includes property tests)
npm test

# Run with coverage
npm run test:coverage
```

## Maintenance

When modifying pricing logic:
1. Update the relevant property tests to reflect new requirements
2. Ensure all properties still pass with 100 iterations
3. Add new properties for new pricing rules
4. Keep properties aligned with requirements documentation

## References

- **fast-check Documentation**: https://fast-check.dev/
- **Property-Based Testing Guide**: https://fsharpforfunandprofit.com/posts/property-based-testing/
- **Requirements**: See `.kiro/specs/service-layer-refactoring/requirements.md` (Requirements 2.1-2.9)
