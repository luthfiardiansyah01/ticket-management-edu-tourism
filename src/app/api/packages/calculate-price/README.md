# Calculate Price API Endpoint

## Overview
This endpoint calculates the price for a package with a given quantity, applying any applicable bulk discounts.

## Endpoint Details
- **URL**: `/api/packages/calculate-price`
- **Method**: `POST`
- **Authentication**: Not required
- **Content-Type**: `application/json`

## Request Body

```json
{
  "packageId": "string",
  "quantity": number (integer, min: 1)
}
```

### Parameters
- `packageId` (required): The ID of the package to calculate price for
- `quantity` (required): Number of tickets (must be a positive integer)

## Response Format

### Success Response (200 OK)

```json
{
  "totalPrice": 150000,
  "pricePerUnit": 50000,
  "discountApplied": false,
  "discountPercentage": 0
}
```

#### Response Fields
- `totalPrice`: Total price for all tickets (pricePerUnit × quantity)
- `pricePerUnit`: Price per ticket after applying any discounts
- `discountApplied`: Boolean indicating if a discount was applied
- `discountPercentage`: Percentage of discount applied (0-100)

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "number",
      "inclusive": true,
      "exact": false,
      "message": "Quantity must be at least 1",
      "path": ["quantity"]
    }
  ]
}
```

#### 404 Not Found - Package Not Found
```json
{
  "message": "Package not found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

## Discount Rules

### Personal Packages
- No bulk discounts applied
- Price remains constant regardless of quantity

### School Packages
- **10% discount**: For quantities 50-99
  - Example: Base price 40,000 → Discounted price 36,000 per unit
- **15% discount**: For quantities 100+
  - Example: Base price 40,000 → Discounted price 34,000 per unit

### Promo Pricing
- If a package has a `promo_price`, it will be used instead of `base_price`
- Discounts are then applied to the promo price (for school packages)

## Examples

### Example 1: Personal Package (No Discount)
**Request:**
```bash
curl -X POST http://localhost:3000/api/packages/calculate-price \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "pkg-personal-123",
    "quantity": 5
  }'
```

**Response:**
```json
{
  "totalPrice": 250000,
  "pricePerUnit": 50000,
  "discountApplied": false,
  "discountPercentage": 0
}
```

### Example 2: School Package with 10% Discount
**Request:**
```bash
curl -X POST http://localhost:3000/api/packages/calculate-price \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "pkg-school-456",
    "quantity": 50
  }'
```

**Response:**
```json
{
  "totalPrice": 1800000,
  "pricePerUnit": 36000,
  "discountApplied": true,
  "discountPercentage": 10
}
```

### Example 3: School Package with 15% Discount
**Request:**
```bash
curl -X POST http://localhost:3000/api/packages/calculate-price \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "pkg-school-456",
    "quantity": 100
  }'
```

**Response:**
```json
{
  "totalPrice": 3400000,
  "pricePerUnit": 34000,
  "discountApplied": true,
  "discountPercentage": 15
}
```

### Example 4: Package with Promo Price
**Request:**
```bash
curl -X POST http://localhost:3000/api/packages/calculate-price \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "pkg-promo-789",
    "quantity": 3
  }'
```

**Response:**
```json
{
  "totalPrice": 135000,
  "pricePerUnit": 45000,
  "discountApplied": false,
  "discountPercentage": 0
}
```
*Note: Uses promo_price (45,000) instead of base_price (60,000)*

## Validation Rules

1. **packageId**:
   - Must be a non-empty string
   - Must exist in the database

2. **quantity**:
   - Must be a positive integer
   - Minimum value: 1
   - No maximum limit

## Testing

Run E2E tests:
```bash
npm test -- --testPathPatterns="calculate-price"
```

Test coverage includes:
- ✅ Valid price calculations for different package types
- ✅ Discount application (10% and 15%)
- ✅ Promo price usage
- ✅ Error handling (404, 400)
- ✅ Input validation
- ✅ Response format verification

## Implementation Details

- **Service Layer**: Uses `PricingService.calculatePrice()`
- **Repository Layer**: Uses `PackageRepository.findById()`
- **Validation**: Zod schema validation
- **Error Handling**: Comprehensive error mapping
- **Architecture**: Thin controller pattern (< 60 lines)

## Related Endpoints

- `POST /api/bookings` - Create a booking (uses this pricing logic internally)
- `GET /api/packages` - List all packages
- `GET /api/packages/:id` - Get package details

## Requirements Validated

- ✅ Requirement 10.4: Calculate price API endpoint
- ✅ Requirement 10.5: Return price breakdown with discounts
- ✅ Requirement 2.1-2.9: Pricing calculation logic
