# Migration Guide: Service Layer Architecture

This guide helps developers migrate from the old monolithic API route architecture to the new layered architecture with Service and Repository patterns.

## Table of Contents

1. [Overview](#overview)
2. [Architecture Changes](#architecture-changes)
3. [Migration Steps](#migration-steps)
4. [Using Services](#using-services)
5. [Using Repositories](#using-repositories)
6. [Error Handling](#error-handling)
7. [Testing Patterns](#testing-patterns)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

### What Changed?

**Before (Monolithic)**:
```typescript
// API route with embedded business logic
export async function POST(request: Request) {
  // Authentication
  // Validation
  // Database queries
  // Business logic
  // More database queries
  // Response
}
```

**After (Layered)**:
```typescript
// Thin API route
export async function POST(request: Request) {
  // Authentication
  // Validation
  const result = await bookingService.createBooking(data);
  return NextResponse.json(result);
}
```

### Benefits

✅ **Testability**: Services can be unit tested independently  
✅ **Reusability**: Services can be used across multiple routes  
✅ **Maintainability**: Clear separation of concerns  
✅ **Type Safety**: Strong TypeScript types throughout  
✅ **Transaction Management**: Centralized in services  

---

## Architecture Changes

### Old Architecture (Monolithic)

```
API Route
  ├─ Authentication
  ├─ Validation
  ├─ Business Logic
  ├─ Database Queries
  └─ Response
```

### New Architecture (Layered)

```
API Route (Presentation)
  └─> Service (Business Logic)
       └─> Repository (Data Access)
            └─> Database
```

---

## Migration Steps

### Step 1: Identify Business Logic

Look for code in API routes that:
- Performs calculations
- Validates business rules
- Coordinates multiple database operations
- Contains if/else logic for business decisions

### Step 2: Extract to Service

Move business logic to appropriate service:
- Booking logic → `BookingService`
- Payment logic → `PaymentService`
- Ticket logic → `TicketService`
- Pricing logic → `PricingService`

### Step 3: Use Repository for Data Access

Replace direct database queries with repository methods:
- `db.insert()` → `repository.create()`
- `db.query()` → `repository.findById()`
- `db.update()` → `repository.updateStatus()`

### Step 4: Update API Route

Keep only:
- Authentication checks
- Input validation (Zod)
- Service calls
- Response formatting

---

## Using Services

### Importing Services

```typescript
// Import singleton instance
import { bookingService } from '@/services/booking.service';
import { paymentService } from '@/services/payment.service';
import { ticketService } from '@/services/ticket.service';
import { pricingService } from '@/services/pricing.service';
```

### BookingService

#### Create Booking

```typescript
import { bookingService } from '@/services/booking.service';

// In API route or server component
try {
  const bookingId = await bookingService.createBooking({
    userId: session.user.id,
    packageId: 'pkg-123',
    visitDate: '2025-06-15',
    quantity: 5,
  });
  
  console.log('Booking created:', bookingId);
} catch (error) {
  if (error.message === 'Package not found or inactive') {
    // Handle 404
  } else if (error.message === 'Quota exceeded for this date') {
    // Handle 400
  } else {
    // Handle 500
  }
}
```

#### What It Does

- ✅ Validates package exists and is active
- ✅ Validates quantity >= 1
- ✅ Calculates price using PricingService
- ✅ Checks quota within transaction
- ✅ Creates booking atomically
- ✅ Throws descriptive errors

### PaymentService

#### Process Payment

```typescript
import { paymentService } from '@/services/payment.service';

try {
  const result = await paymentService.processPayment(bookingId);
  
  console.log('Payment successful:', result);
  // {
  //   bookingId: 'booking-123',
  //   success: true,
  //   message: 'Payment successful'
  // }
} catch (error) {
  if (error.message === 'Booking not found') {
    // Handle 404
  } else if (error.message === 'Booking already paid') {
    // Handle 400
  } else {
    // Handle 500
  }
}
```

#### What It Does

- ✅ Validates booking exists
- ✅ Checks booking not already paid
- ✅ Updates booking status to 'paid'
- ✅ Creates payment record
- ✅ Generates QR tickets
- ✅ All within transaction (rollback on error)

### TicketService

#### Generate Tickets

```typescript
import { ticketService } from '@/services/ticket.service';

// Usually called by PaymentService, but can be used directly
await ticketService.generateTickets(bookingId, quantity);
```

#### Check-in Ticket

```typescript
import { ticketService } from '@/services/ticket.service';

try {
  const ticketDetails = await ticketService.checkInTicket(qrToken);
  
  console.log('Check-in successful:', ticketDetails);
  // {
  //   ticketId: 'ticket-123',
  //   packageName: 'School Package',
  //   visitorName: 'John Doe',
  //   visitDate: '2025-06-15',
  //   checkedInAt: '2025-06-15T10:30:00Z'
  // }
} catch (error) {
  if (error.message === 'Ticket not found') {
    // Handle 404
  } else if (error.message === 'Ticket already used') {
    // Handle 400
  } else {
    // Handle 500
  }
}
```

#### What It Does

- ✅ Validates ticket exists
- ✅ Checks ticket not already checked in
- ✅ Updates ticket status
- ✅ Returns ticket details with package and user info

### PricingService

#### Calculate Price

```typescript
import { pricingService } from '@/services/pricing.service';

try {
  const priceResult = await pricingService.calculatePrice(packageId, quantity);
  
  console.log('Price calculated:', priceResult);
  // {
  //   totalPrice: 425000,
  //   pricePerUnit: 42500,
  //   discountApplied: true,
  //   discountPercentage: 15
  // }
} catch (error) {
  if (error.message.includes('not found')) {
    // Handle 404
  } else {
    // Handle 500
  }
}
```

#### Get Price Breakdown

```typescript
const breakdown = await pricingService.getPriceBreakdown(packageId, quantity);

console.log('Price breakdown:', breakdown);
// {
//   basePrice: 50000,
//   promoPrice: null,
//   quantity: 10,
//   discountPercentage: 15,
//   pricePerUnit: 42500,
//   totalPrice: 425000,
//   discountAmount: 75000
// }
```

---

## Using Repositories

### Importing Repositories

```typescript
// Import singleton instance
import { bookingRepository } from '@/repositories/booking.repository';
import { packageRepository } from '@/repositories/package.repository';
import { paymentRepository } from '@/repositories/payment.repository';
import { ticketRepository } from '@/repositories/ticket.repository';
import { userRepository } from '@/repositories/user.repository';
```

### When to Use Repositories

**Use repositories when**:
- Building new services
- Need direct database access
- Writing tests with mocked repositories

**Don't use repositories when**:
- In API routes (use services instead)
- In React components (use API routes)

### BookingRepository

```typescript
import { bookingRepository } from '@/repositories/booking.repository';

// Create booking
const bookingId = await bookingRepository.create({
  user_id: 'user-123',
  package_id: 'pkg-123',
  visit_date: '2025-06-15',
  quantity: 5,
  total_price: 250000,
  status: 'pending',
});

// Find booking
const booking = await bookingRepository.findById(bookingId);

// Update status
await bookingRepository.updateStatus(bookingId, 'paid');

// Count bookings for quota
const count = await bookingRepository.countByPackageAndDate(
  'pkg-123',
  '2025-06-15'
);
```

### PackageRepository

```typescript
import { packageRepository } from '@/repositories/package.repository';

// Find package
const pkg = await packageRepository.findById('pkg-123');

// Find all packages
const packages = await packageRepository.findAll();

// Find active packages only
const activePackages = await packageRepository.findActive();
```

### PaymentRepository

```typescript
import { paymentRepository } from '@/repositories/payment.repository';

// Create payment
const paymentId = await paymentRepository.create({
  booking_id: 'booking-123',
  provider: 'mock_gateway',
  payment_status: 'success',
  external_ref: 'mock_1234567890',
  paid_at: new Date().toISOString(),
});

// Find payment by booking
const payment = await paymentRepository.findByBookingId('booking-123');
```

### TicketRepository

```typescript
import { ticketRepository } from '@/repositories/ticket.repository';

// Create batch of tickets
await ticketRepository.createBatch([
  {
    booking_id: 'booking-123',
    qr_token: crypto.randomUUID(),
    is_checked_in: false,
  },
  // ... more tickets
]);

// Find ticket by QR token
const ticket = await ticketRepository.findByToken(qrToken);

// Check-in ticket
await ticketRepository.checkIn('ticket-123');
```

---

## Error Handling

### Service Error Patterns

Services throw descriptive errors that should be mapped to HTTP status codes:

```typescript
// In API route
export async function POST(request: Request) {
  try {
    const result = await bookingService.createBooking(data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    // Map service errors to HTTP status codes
    if (error.message === 'Package not found or inactive') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    if (error.message === 'Quota exceeded for this date') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error.message === 'Quantity must be at least 1') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    // Unexpected errors
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Error Mapping Reference

| Service Error | HTTP Status | Description |
|--------------|-------------|-------------|
| `Package not found or inactive` | 404 | Package doesn't exist or is inactive |
| `Booking not found` | 404 | Booking doesn't exist |
| `Ticket not found` | 404 | Ticket doesn't exist |
| `Quota exceeded for this date` | 400 | Daily quota full |
| `Booking already paid` | 400 | Duplicate payment attempt |
| `Ticket already used` | 400 | Duplicate check-in attempt |
| `Quantity must be at least 1` | 400 | Invalid quantity |
| Other errors | 500 | Unexpected server error |

### Custom Error Classes (Optional)

For better error handling, you can create custom error classes:

```typescript
// src/lib/errors.ts
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

// In service
throw new NotFoundError('Package not found or inactive');

// In API route
catch (error) {
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ValidationError || error instanceof BusinessRuleError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  // ...
}
```

---

## Testing Patterns

### Unit Testing Services

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let mockBookingRepo: any;
  let mockPackageRepo: any;
  let mockPricingService: any;

  beforeEach(() => {
    // Create mocks
    mockBookingRepo = {
      create: jest.fn(),
      countByPackageAndDate: jest.fn(),
    };
    
    mockPackageRepo = {
      findById: jest.fn(),
    };
    
    mockPricingService = {
      calculatePrice: jest.fn(),
    };

    // Inject mocks
    service = new BookingService(
      mockBookingRepo,
      mockPackageRepo,
      mockPricingService
    );
  });

  it('should create booking successfully', async () => {
    // Arrange
    mockPackageRepo.findById.mockResolvedValue({
      id: 'pkg-123',
      is_active: true,
      quota_per_day: 100,
    });
    
    mockPricingService.calculatePrice.mockResolvedValue({
      totalPrice: 250000,
    });
    
    mockBookingRepo.countByPackageAndDate.mockResolvedValue(50);
    mockBookingRepo.create.mockResolvedValue('booking-123');

    // Act
    const bookingId = await service.createBooking({
      userId: 'user-123',
      packageId: 'pkg-123',
      visitDate: '2025-06-15',
      quantity: 5,
    });

    // Assert
    expect(bookingId).toBe('booking-123');
    expect(mockPackageRepo.findById).toHaveBeenCalledWith('pkg-123');
    expect(mockPricingService.calculatePrice).toHaveBeenCalledWith('pkg-123', 5);
    expect(mockBookingRepo.create).toHaveBeenCalled();
  });

  it('should throw error when package not found', async () => {
    // Arrange
    mockPackageRepo.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(
      service.createBooking({
        userId: 'user-123',
        packageId: 'invalid',
        visitDate: '2025-06-15',
        quantity: 5,
      })
    ).rejects.toThrow('Package not found or inactive');
  });
});
```

### Integration Testing Services

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { BookingService } from './booking.service';
import { bookingRepository } from '@/repositories/booking.repository';
import { packageRepository } from '@/repositories/package.repository';
import { pricingService } from './pricing.service';
import { db } from '@/db';

describe('BookingService Integration Tests', () => {
  let service: BookingService;
  let testPackageId: string;

  beforeAll(async () => {
    // Initialize service with real dependencies
    service = new BookingService(
      bookingRepository,
      packageRepository,
      pricingService
    );

    // Create test package
    const pkg = await db.insert(ticketPackages).values({
      name: 'Test Package',
      category: 'personal',
      base_price: 50000,
      quota_per_day: 10,
      is_active: true,
    }).returning();
    testPackageId = pkg[0].id;
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(ticketPackages).where(eq(ticketPackages.id, testPackageId));
  });

  it('should create booking with real database', async () => {
    const bookingId = await service.createBooking({
      userId: 'user-123',
      packageId: testPackageId,
      visitDate: '2025-06-15',
      quantity: 5,
    });

    expect(bookingId).toBeDefined();

    // Verify booking exists
    const booking = await bookingRepository.findById(bookingId);
    expect(booking).not.toBeNull();
    expect(booking?.quantity).toBe(5);
  });
});
```

### E2E Testing API Routes

```typescript
import { describe, it, expect } from '@jest/globals';

describe('POST /api/bookings', () => {
  it('should create booking successfully', async () => {
    const response = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        packageId: 'pkg-123',
        visitDate: '2025-06-15',
        quantity: 5,
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.bookingId).toBeDefined();
  });

  it('should return 404 for invalid package', async () => {
    const response = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        packageId: 'invalid',
        visitDate: '2025-06-15',
        quantity: 5,
      }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Package not found or inactive');
  });
});
```

---

## Common Patterns

### Pattern 1: Complete Booking Flow

```typescript
// In API route or server action
async function completeBookingFlow(data: BookingData) {
  try {
    // Step 1: Create booking
    const bookingId = await bookingService.createBooking({
      userId: data.userId,
      packageId: data.packageId,
      visitDate: data.visitDate,
      quantity: data.quantity,
    });

    // Step 2: Process payment
    const paymentResult = await paymentService.processPayment(bookingId);

    // Step 3: Return success
    return {
      success: true,
      bookingId,
      message: 'Booking and payment successful',
    };
  } catch (error) {
    // Handle errors
    throw error;
  }
}
```

### Pattern 2: Price Calculation Before Booking

```typescript
// In React component or API route
async function calculateAndCreateBooking(data: BookingData) {
  // Step 1: Calculate price first
  const priceResult = await pricingService.calculatePrice(
    data.packageId,
    data.quantity
  );

  // Step 2: Show price to user (in UI)
  console.log('Total price:', priceResult.totalPrice);
  console.log('Discount:', priceResult.discountPercentage + '%');

  // Step 3: Create booking (price recalculated internally)
  const bookingId = await bookingService.createBooking(data);

  return { bookingId, priceResult };
}
```

### Pattern 3: Batch Ticket Check-in

```typescript
async function checkInMultipleTickets(qrTokens: string[]) {
  const results = [];

  for (const token of qrTokens) {
    try {
      const ticketDetails = await ticketService.checkInTicket(token);
      results.push({ success: true, token, details: ticketDetails });
    } catch (error) {
      results.push({ success: false, token, error: error.message });
    }
  }

  return results;
}
```

### Pattern 4: Quota Check Before Booking

```typescript
async function checkQuotaAvailability(
  packageId: string,
  visitDate: string,
  requestedQuantity: number
) {
  // Get package
  const pkg = await packageRepository.findById(packageId);
  if (!pkg) {
    throw new Error('Package not found');
  }

  // Get current bookings
  const currentBookings = await bookingRepository.countByPackageAndDate(
    packageId,
    visitDate
  );

  // Calculate available quota
  const availableQuota = pkg.quota_per_day - currentBookings;

  return {
    available: availableQuota >= requestedQuantity,
    availableQuota,
    requestedQuantity,
    quotaPerDay: pkg.quota_per_day,
  };
}
```

---

## Troubleshooting

### Issue 1: "Cannot find module '@/services/...'"

**Problem**: TypeScript can't resolve path aliases.

**Solution**: Check `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue 2: "Service is not a constructor"

**Problem**: Trying to instantiate singleton service.

**Solution**: Import the singleton instance, not the class:

```typescript
// ❌ Wrong
import { BookingService } from '@/services/booking.service';
const service = new BookingService();

// ✅ Correct
import { bookingService } from '@/services/booking.service';
const result = await bookingService.createBooking(data);
```

### Issue 3: "Database is locked" in tests

**Problem**: SQLite concurrency issues in integration tests.

**Solution**: Run tests sequentially:

```bash
npm test -- --runInBand
```

Or use Turso for integration tests.

### Issue 4: "Quota exceeded" but quota not full

**Problem**: Cancelled bookings counted toward quota.

**Solution**: Repository already excludes cancelled bookings. Check if:
- Booking status is 'cancelled' (not 'canceled')
- Repository method `countByPackageAndDate` is used

### Issue 5: Transaction not rolling back

**Problem**: Error thrown outside transaction block.

**Solution**: Ensure all operations are inside transaction:

```typescript
// ❌ Wrong
const booking = await bookingRepository.create(data);
await db.transaction(async (tx) => {
  // Too late, booking already created
});

// ✅ Correct
await db.transaction(async (tx) => {
  const booking = await bookingRepository.create(data);
  // All operations here
});
```

---

## Best Practices

### 1. Always Use Services in API Routes

```typescript
// ❌ Don't do this
export async function POST(request: Request) {
  const booking = await db.insert(bookings).values(data);
  // Direct database access
}

// ✅ Do this
export async function POST(request: Request) {
  const bookingId = await bookingService.createBooking(data);
  // Use service
}
```

### 2. Keep API Routes Thin

```typescript
// ❌ Too much logic in route
export async function POST(request: Request) {
  // 100+ lines of business logic
}

// ✅ Thin controller
export async function POST(request: Request) {
  const session = await getServerSession();
  const body = await request.json();
  const validated = schema.parse(body);
  
  const result = await bookingService.createBooking(validated);
  
  return NextResponse.json(result, { status: 201 });
}
```

### 3. Use Dependency Injection for Testing

```typescript
// ✅ Service accepts dependencies
export class BookingService {
  constructor(
    private bookingRepository: BookingRepository,
    private packageRepository: PackageRepository,
    private pricingService: PricingService
  ) {}
}

// Easy to mock in tests
const service = new BookingService(
  mockBookingRepo,
  mockPackageRepo,
  mockPricingService
);
```

### 4. Write Descriptive Error Messages

```typescript
// ❌ Generic error
throw new Error('Error');

// ✅ Descriptive error
throw new Error('Package not found or inactive');
throw new Error('Quota exceeded for this date');
throw new Error('Booking already paid');
```

### 5. Use Transactions for Multi-Step Operations

```typescript
// ✅ All operations in transaction
await db.transaction(async (tx) => {
  await bookingRepository.updateStatus(bookingId, 'paid');
  await paymentRepository.create(paymentData);
  await ticketService.generateTickets(bookingId, quantity);
});
```

### 6. Test Business Logic in Services

```typescript
// ✅ Test service logic
describe('BookingService', () => {
  it('should enforce quota', async () => {
    // Test quota validation logic
  });
});

// Not in API routes
```

### 7. Document Service Methods

```typescript
/**
 * Create a new booking with quota validation
 * 
 * @param data - Booking creation data
 * @returns Booking ID
 * @throws Error if package not found or quota exceeded
 * 
 * Validates: Requirements 4.1-4.10
 */
async createBooking(data: CreateBookingData): Promise<string> {
  // Implementation
}
```

### 8. Use Type-Safe Interfaces

```typescript
// ✅ Define types
interface CreateBookingData {
  userId: string;
  packageId: string;
  visitDate: string;
  quantity: number;
}

// Use in service
async createBooking(data: CreateBookingData): Promise<string> {
  // TypeScript ensures correct data structure
}
```

---

## Summary

### Key Takeaways

1. **Use services in API routes** - Never access database directly
2. **Use repositories in services** - Centralize data access
3. **Keep API routes thin** - < 50 lines, only HTTP concerns
4. **Handle errors properly** - Map service errors to HTTP status codes
5. **Write comprehensive tests** - Unit, integration, E2E
6. **Use transactions** - For multi-step operations
7. **Follow singleton pattern** - Export instances, not classes
8. **Document your code** - JSDoc comments with requirements

### Migration Checklist

- [ ] Identify business logic in API routes
- [ ] Extract logic to appropriate service
- [ ] Replace database queries with repository calls
- [ ] Update API route to use service
- [ ] Add error handling
- [ ] Write unit tests for service
- [ ] Write integration tests
- [ ] Write E2E tests for API route
- [ ] Update documentation
- [ ] Deploy and monitor

### Need Help?

- Check existing services for examples
- Read service/repository tests
- Review API route implementations
- Consult architecture documentation in README.md

---

**Happy coding! 🚀**
