# Complete Workflow Integration Tests

## Overview

This test suite validates the complete booking workflow from end-to-end:
**Booking → Payment → Check-in**

## Test Coverage

### Complete Flow Tests
1. **Basic workflow** - Create booking, process payment, check-in tickets
2. **School package with discount** - Verify 15% discount applied for 100+ quantity
3. **Double check-in prevention** - Ensure tickets can't be checked in twice
4. **Single ticket workflow** - Handle single ticket bookings
5. **Data integrity** - Verify all data persists correctly throughout workflow
6. **Partial check-in** - Handle scenarios where only some tickets are checked in

### Error Scenario Tests
1. **Payment before booking** - Reject payment for non-existent bookings
2. **Check-in before payment** - Reject check-in when no tickets exist
3. **Double payment** - Prevent paying for already paid bookings
4. **Invalid QR token** - Handle invalid/non-existent QR tokens

### Package Type Tests
1. **Personal package** - No discount applied
2. **School package 10% discount** - 50-99 quantity range

### Performance Tests
1. **Workflow completion time** - Ensure workflow completes in < 5 seconds

## Known Issues

### SQLite Database Locking

**Issue**: Integration tests frequently fail with `SQLITE_BUSY: database is locked` errors.

**Root Cause**:
- SQLite has limited concurrency support
- Multiple test cases accessing the same database file simultaneously
- Transaction conflicts during test execution
- Retry logic in `withRetry()` exhausts attempts before lock is released

**Impact**:
- Tests timeout after 60 seconds
- Most tests fail with database locking errors
- Only 2 out of 13 tests pass consistently (error validation tests that don't write to DB)

**Workarounds Attempted**:
1. ✅ Run tests sequentially with `--runInBand`
2. ✅ Increase timeout to 60 seconds
3. ✅ Add delays between tests (`afterEach` with 50ms delay)
4. ✅ Use `withRetry()` with exponential backoff
5. ✅ Set WAL mode and busy_timeout in database configuration
6. ❌ Still experiencing locking issues

**Production Impact**: **NONE**
- This is a **test-only issue**
- Production uses Turso (remote LibSQL) which handles concurrency properly
- Local SQLite file is only used for testing

**Recommendations**:
1. **For CI/CD**: Use Turso test database instead of local SQLite
2. **For local development**: Run integration tests individually or in small groups
3. **Alternative**: Mock database operations for workflow tests
4. **Long-term**: Migrate to PostgreSQL for better concurrency support

## Running Tests

### Run all tests (may experience locking issues)
```bash
npm test -- complete-workflow.integration.test --runInBand --testTimeout=60000
```

### Run individual test
```bash
npm test -- complete-workflow.integration.test -t "should not allow payment before booking exists"
```

### Run with E2E test environment (recommended)
```bash
npm run test:e2e -- complete-workflow.integration.test
```

## Test Structure

Each test follows this pattern:

```typescript
it('test description', async () => {
  await withRetry(async () => {
    // STEP 1: CREATE BOOKING
    const bookingId = await bookingService.createBooking(data);
    
    // STEP 2: PROCESS PAYMENT
    await paymentService.processPayment(bookingId);
    
    // STEP 3: CHECK-IN TICKETS
    await ticketService.checkInTicket(qrToken);
    
    // VERIFY: Check all data persisted correctly
    
    // CLEANUP: Delete test data
  });
});
```

## Validation Points

### Booking Phase
- ✅ Booking ID returned
- ✅ Booking status = 'pending'
- ✅ Total price calculated correctly (with discounts if applicable)
- ✅ Quota validation enforced

### Payment Phase
- ✅ Booking status updated to 'paid'
- ✅ Payment record created with correct provider ('mock_gateway')
- ✅ Payment status = 'success'
- ✅ External reference generated (`mock_<timestamp>`)
- ✅ Tickets generated (quantity matches booking)
- ✅ All tickets have unique QR tokens

### Check-in Phase
- ✅ Ticket status updated to checked in
- ✅ Check-in timestamp recorded
- ✅ Ticket details returned (package name, visitor name, visit date)
- ✅ Double check-in prevented

## Requirements Validated

- **Requirements 4.1-4.10**: Booking creation and validation
- **Requirements 5.1-5.10**: Payment processing
- **Requirements 6.1-6.10**: Ticket generation and check-in

## Test Data

- **Test User**: Created in `beforeAll`, cleaned up in `afterAll`
- **Test Package**: School package with 50,000 base price, 100 quota/day
- **Test Bookings**: Created per test, cleaned up after each test
- **Unique Identifiers**: Use timestamp-based prefixes to avoid conflicts

## Future Improvements

1. **Database Migration**: Consider PostgreSQL for better concurrency
2. **Test Isolation**: Use separate database per test suite
3. **Mock Strategy**: Mock database layer for unit-style integration tests
4. **Turso Integration**: Use Turso test instance for CI/CD
5. **Parallel Execution**: Enable parallel test execution once locking resolved
