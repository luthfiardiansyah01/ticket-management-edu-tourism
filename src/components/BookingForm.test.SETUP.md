# BookingForm Test Setup

## Installation Required

To run the BookingForm tests, you need to install React Testing Library:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## Test Configuration

### Update jest.config.js

Add the following to your `jest.config.js`:

```javascript
module.exports = {
  // ... existing config
  testEnvironment: 'jsdom', // Change from 'node' to 'jsdom' for React tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
```

### Update jest.setup.ts

Add React Testing Library matchers:

```typescript
import '@testing-library/jest-dom';
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run only BookingForm tests
```bash
npm test -- BookingForm.test
```

### Run with coverage
```bash
npm test -- --coverage BookingForm.test
```

### Watch mode
```bash
npm test -- --watch BookingForm.test
```

## Test Coverage

The test file includes **25 test cases** covering:

### API Integration (5 tests)
- ✅ Calls calculate-price API when quantity changes
- ✅ Debounces API calls (300ms)
- ✅ Updates price display after API response
- ✅ Shows discount badge for school packages

### Loading State (4 tests)
- ✅ Shows loading indicator during API call
- ✅ Shows spinner animation
- ✅ Disables submit button during loading
- ✅ Hides loading state after response

### Error Handling (5 tests)
- ✅ Shows error message when API fails
- ✅ Falls back to local calculation on error
- ✅ Applies correct fallback discount
- ✅ Clears error on successful call

### Component Behavior (6 tests)
- ✅ Renders all required fields
- ✅ Shows bulk discount hint for school packages
- ✅ Hides bulk discount hint for personal packages
- ✅ Prevents quantity less than 1
- ✅ Shows price per unit when discounted

### Booking Submission (1 test)
- ✅ Maintains existing booking workflow

## Test Structure

Each test follows the AAA pattern:
- **Arrange**: Set up mocks and render component
- **Act**: Trigger user interactions
- **Assert**: Verify expected behavior

## Mocking Strategy

### Mocked Dependencies
1. **next/navigation**: Router functionality
2. **next-auth/react**: Session management
3. **LanguageProvider**: Translation function
4. **global.fetch**: API calls

### Why Mock?
- Isolates component logic
- Prevents actual API calls
- Faster test execution
- Predictable test results

## Common Issues

### Issue 1: "Cannot find module '@testing-library/react'"
**Solution**: Install dependencies
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Issue 2: "ReferenceError: document is not defined"
**Solution**: Change testEnvironment to 'jsdom' in jest.config.js

### Issue 3: "Timer mocks not working"
**Solution**: Ensure `jest.useFakeTimers()` is called in `beforeEach`

### Issue 4: "fetch is not defined"
**Solution**: Mock is already included in test file

## Example Test Run Output

```
PASS src/components/BookingForm.test.tsx
  BookingForm Component
    API Integration
      ✓ should call calculate-price API when quantity changes (45ms)
      ✓ should debounce API calls (300ms) (32ms)
      ✓ should update price display after API response (28ms)
      ✓ should show discount badge for school packages (35ms)
    Loading State
      ✓ should show loading indicator during API call (25ms)
      ✓ should show spinner animation during loading (22ms)
      ✓ should disable submit button during price loading (20ms)
      ✓ should hide loading state after API response (18ms)
    Error Handling
      ✓ should show error message when API fails (30ms)
      ✓ should fallback to local calculation on API error (25ms)
      ✓ should apply correct fallback discount for school packages (28ms)
      ✓ should clear error message on successful API call (40ms)
    Component Behavior
      ✓ should render form with all required fields (15ms)
      ✓ should show bulk discount hint for school packages (12ms)
      ✓ should not show bulk discount hint for personal packages (10ms)
      ✓ should prevent quantity less than 1 (18ms)
      ✓ should show price per unit when different from base price (30ms)
    Booking Submission
      ✓ should maintain existing booking submission workflow (45ms)

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Time:        2.5s
```

## Debugging Tests

### Enable verbose output
```bash
npm test -- --verbose BookingForm.test
```

### Debug specific test
```bash
npm test -- -t "should call calculate-price API"
```

### Check test coverage
```bash
npm test -- --coverage --collectCoverageFrom="src/components/BookingForm.tsx"
```

## Next Steps

After installing dependencies:

1. Install React Testing Library:
   ```bash
   npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
   ```

2. Update jest.config.js (change testEnvironment to 'jsdom')

3. Add `import '@testing-library/jest-dom'` to jest.setup.ts

4. Run tests:
   ```bash
   npm test -- BookingForm.test
   ```

## Related Files

- **Component**: `src/components/BookingForm.tsx`
- **Test**: `src/components/BookingForm.test.tsx`
- **API**: `src/app/api/packages/calculate-price/route.ts`
- **Jest Config**: `jest.config.js`
- **Jest Setup**: `jest.setup.ts`
