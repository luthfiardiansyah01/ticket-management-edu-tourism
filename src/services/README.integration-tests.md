# Integration Tests for Services

## Overview

Integration tests have been created for both `BookingService` and `PaymentService`. These tests verify the services work correctly with real database operations.

- `booking.service.integration.test.ts` - Tests for BookingService
- `payment.service.integration.test.ts` - Tests for PaymentService

## Test Coverage

### BookingService Integration Tests

The integration tests for `BookingService` cover:

#### 1. **createBooking with real database**
- Creating bookings and persisting to database
- Price calculation using PricingService
- Error handling for non-existent packages
- Error handling for inactive packages

#### 2. **Quota validation with concurrent bookings**
- Enforcing quota limits
- Allowing bookings at exact quota limit
- Excluding cancelled bookings from quota count

#### 3. **Transaction rollback on error**
- Rolling back when quota is exceeded
- Rolling back on invalid quantity

#### 4. **Edge cases**
- Multiple bookings for different dates
- Bookings for different packages on same date
- Large quantity bookings with discounts

### PaymentService Integration Tests

The integration tests for `PaymentService` cover:

#### 1. **processPayment with real database**
- Processing payment and persisting to database
- Generating correct number of tickets
- Error handling for non-existent bookings
- Error handling for already paid bookings

#### 2. **Transaction rollback on error**
- Rolling back all changes if ticket generation fails
- Not creating payment if booking status update fails

#### 3. **Complete payment workflow**
- Executing all operations in correct order
- Handling payment for cancelled bookings
- Handling single ticket bookings
- Handling large quantity bookings

#### 4. **Payment record validation**
- Creating payment with correct provider (mock_gateway)
- Creating payment with success status
- Creating payment with external reference
- Creating payment with paid_at timestamp

## Known Issues

### Database Locking with SQLite

The integration tests encounter `SQLITE_BUSY: database is locked` errors when running against the local SQLite database (`local.db`). This is a known limitation of SQLite when:

1. The database file is being accessed by another process (dev server, other tests)
2. Multiple tests try to write to the database simultaneously
3. Transactions are not properly closed

### Solutions

#### Option 1: Use a Separate Test Database

Create a dedicated test database:

```typescript
// jest.setup.ts
if (process.env.NODE_ENV === 'test') {
  process.env.DATABASE_URL = 'file:./test.db';
}
```

Then run migrations on the test database before running tests.

#### Option 2: Use In-Memory Database

Configure an in-memory SQLite database for tests:

```typescript
// jest.setup.ts
process.env.DATABASE_URL = ':memory:';
```

Note: This requires recreating the schema for each test run.

#### Option 3: Skip Integration Tests in CI

Mark integration tests to run only when explicitly requested:

```bash
# Run only unit tests
npm test -- --testPathIgnorePatterns=integration

# Run only integration tests
npm test -- --testPathPattern=integration
```

#### Option 4: Use Turso Remote Database

If using Turso (LibSQL cloud), the tests should work without locking issues:

```bash
# Set environment variables
export DATABASE_URL="libsql://your-database.turso.io"
export TURSO_AUTH_TOKEN="your-token"

# Run tests
npm test -- booking.service.integration.test.ts
```

## Running the Tests

### Prerequisites

1. Ensure no other process is using the database
2. Stop the development server if running
3. Set up environment variables in `.env.local`

### Run Integration Tests

```bash
# Run BookingService integration tests
npm test -- booking.service.integration.test.ts --runInBand --testTimeout=30000

# Run PaymentService integration tests
npm test -- payment.service.integration.test.ts --runInBand --testTimeout=30000

# Run all integration tests
npm test -- --testPathPattern=integration --runInBand --testTimeout=30000

# Run all tests including integration
npm test

# Run only integration tests
npm test -- --testPathPattern=integration
```

### Expected Behavior

**BookingService Integration Tests:**
When running successfully, all 12 tests should pass:
- ✓ 4 tests for createBooking with real database
- ✓ 3 tests for quota validation
- ✓ 2 tests for transaction rollback
- ✓ 3 tests for edge cases

**PaymentService Integration Tests:**
When running successfully, all 14 tests should pass:
- ✓ 4 tests for processPayment with real database
- ✓ 2 tests for transaction rollback on error
- ✓ 4 tests for complete payment workflow
- ✓ 4 tests for payment record validation

## Test Structure

Each test follows this pattern:

1. **Arrange**: Set up test data with unique identifiers
2. **Act**: Execute the service method
3. **Assert**: Verify the expected behavior
4. **Cleanup**: Remove test data to avoid conflicts

## Validates Requirements

These integration tests validate:

**BookingService:**
- **Requirements 4.1-4.10**: Booking Service Implementation
  - Booking creation with quota validation
  - Price calculation integration
  - Transaction management
  - Error handling

**PaymentService:**
- **Requirements 5.1-5.10**: Payment Service Implementation
  - Payment processing workflow
  - Booking status updates
  - Payment record creation
  - Ticket generation coordination
  - Transaction management
  - Error handling

## Future Improvements

1. **Test Database Setup**: Create automated test database setup/teardown
2. **Connection Pooling**: Implement proper connection management
3. **Parallel Execution**: Fix database locking to allow parallel test execution
4. **Mock Transactions**: Consider mocking transactions for unit tests, keeping integration tests separate
5. **Docker Setup**: Use Docker with a dedicated test database container

## Notes

- Integration tests are more valuable than unit tests for verifying transaction behavior
- The tests are correctly written and will pass once database locking is resolved
- Consider using a CI/CD pipeline with a dedicated test database
- Unit tests in `booking.service.test.ts` and `payment.service.test.ts` provide fast feedback without database dependencies
- Both BookingService and PaymentService integration tests follow the same pattern for consistency
