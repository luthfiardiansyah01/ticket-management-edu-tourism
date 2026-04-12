# Implementation Plan: Service Layer Architecture Refactoring

## Overview

This implementation plan refactors the Cikapundung Ticketing System from a monolithic API route architecture to a clean, layered architecture with dedicated Service and Repository layers. The refactoring follows a 5-week phased approach to minimize risk and ensure backward compatibility.

**Key Goals:**
- Extract business logic from API routes into testable service classes
- Isolate database operations into repository classes
- Maintain 100% backward compatibility with existing APIs
- Remove duplicated pricing logic from frontend
- Achieve 95%+ test coverage for services and repositories

**Migration Strategy:**
- Phase 1 (Week 1): Repository Layer
- Phase 2 (Week 2): Service Layer
- Phase 3 (Week 3): API Route Refactoring
- Phase 4 (Week 4): Frontend Pricing Removal
- Phase 5 (Week 5): Testing & Documentation

---

## Phase 1: Repository Layer (Week 1)

### 1. Create repository folder structure and types

- Create `/src/repositories/` directory
- Create `/src/repositories/types.ts` with all repository type definitions
- Define interfaces: Package, Booking, Payment, Ticket, TicketWithDetails, User
- Define input types: CreateBookingInput, CreatePaymentInput, CreateTicketInput
- _Requirements: 3.1-3.5_

### 2. Implement PackageRepository

- [x] 2.1 Create `/src/repositories/package.repository.ts`
  - Implement `findById(id: string): Promise<Package | null>`
  - Implement `findAll(): Promise<Package[]>`
  - Implement `findActive(): Promise<Package[]>`
  - Export singleton instance `packageRepository`
  - Add JSDoc comments for all methods
  - _Requirements: 3.1, 3.6_

- [x] 2.2 Write unit tests for PackageRepository
  - Test findById with existing package
  - Test findById with non-existent package
  - Test findAll returns all packages
  - Test findActive returns only active packages
  - _Requirements: 3.1, 3.6_

### 3. Implement BookingRepository

- [x] 3.1 Create `/src/repositories/booking.repository.ts`
  - Implement `create(data: CreateBookingInput): Promise<string>`
  - Implement `findById(id: string): Promise<Booking | null>`
  - Implement `updateStatus(id: string, status: string): Promise<void>`
  - Implement `countByPackageAndDate(packageId: string, visitDate: string): Promise<number>`
  - Export singleton instance `bookingRepository`
  - Add JSDoc comments for all methods
  - _Requirements: 3.2, 3.7-3.9_

- [x] 3.2 Write unit tests for BookingRepository
  - Test create returns booking ID
  - Test findById with existing booking
  - Test findById with non-existent booking
  - Test updateStatus updates booking status
  - Test countByPackageAndDate excludes cancelled bookings
  - Test countByPackageAndDate returns correct count
  - _Requirements: 3.2, 3.7-3.9_

### 4. Implement PaymentRepository

- [x] 4.1 Create `/src/repositories/payment.repository.ts`
  - Implement `create(data: CreatePaymentInput): Promise<string>`
  - Implement `findByBookingId(bookingId: string): Promise<Payment | null>`
  - Export singleton instance `paymentRepository`
  - Add JSDoc comments for all methods
  - _Requirements: 3.3, 3.10_

- [x] 4.2 Write unit tests for PaymentRepository
  - Test create returns payment ID
  - Test findByBookingId with existing payment
  - Test findByBookingId with non-existent payment
  - _Requirements: 3.3, 3.10_

### 5. Implement TicketRepository

- [x] 5.1 Create `/src/repositories/ticket.repository.ts`
  - Implement `createBatch(tickets: CreateTicketInput[]): Promise<void>`
  - Implement `findByToken(qrToken: string): Promise<TicketWithDetails | null>`
  - Implement `checkIn(ticketId: string): Promise<void>`
  - Export singleton instance `ticketRepository`
  - Add JSDoc comments for all methods
  - _Requirements: 3.4, 3.11-3.13_

- [x] 5.2 Write unit tests for TicketRepository
  - Test createBatch inserts multiple tickets
  - Test createBatch handles empty array
  - Test findByToken returns ticket with booking, package, and user details
  - Test findByToken with non-existent token
  - Test checkIn updates ticket status and timestamp
  - _Requirements: 3.4, 3.11-3.13_

### 6. Implement UserRepository

- [x] 6.1 Create `/src/repositories/user.repository.ts`
  - Implement `findById(id: string): Promise<User | null>`
  - Implement `findByEmail(email: string): Promise<User | null>`
  - Export singleton instance `userRepository`
  - Add JSDoc comments for all methods
  - _Requirements: 3.5_

- [x] 6.2 Write unit tests for UserRepository
  - Test findById with existing user
  - Test findById with non-existent user
  - Test findByEmail with existing user
  - Test findByEmail with non-existent user
  - _Requirements: 3.5_

### 7. Create repository documentation

- Create `/src/repositories/README.md`
- Document repository pattern and architecture principles
- Document all repository classes and their methods
- Include usage examples
- Document testing approach
- _Requirements: 15.8_

### 8. Checkpoint - Repository layer complete

- Ensure all repository tests pass
- Verify all repositories have 95%+ test coverage
- Ask the user if questions arise

---

## Phase 2: Service Layer (Week 2)

### 9. Create service folder structure and types

- Create `/src/services/` directory
- Create `/src/services/types.ts` with all service type definitions
- Define interfaces: PriceResult, PriceBreakdown, PaymentResult, TicketDetails, CreateBookingData
- _Requirements: 1.1-1.8_

### 10. Implement PricingService

- [x] 10.1 Create `/src/services/pricing.service.ts`
  - Implement `calculatePrice(packageId: string, quantity: number): Promise<PriceResult>`
  - Implement `getPriceBreakdown(packageId: string, quantity: number): Promise<PriceBreakdown>`
  - Implement private `applyBulkDiscount(basePrice: number, category: string, quantity: number): number`
  - Implement private `getDiscountPercentage(category: string, quantity: number): number`
  - Use promo_price if available, otherwise base_price
  - Apply 15% discount for school packages with quantity >= 100
  - Apply 10% discount for school packages with quantity >= 50 and < 100
  - No discount for personal packages
  - Export singleton instance `pricingService`
  - Add JSDoc comments referencing requirements
  - _Requirements: 2.1-2.9_

- [x] 10.2 Write unit tests for PricingService
  - Test calculatePrice for personal package (no discount)
  - Test calculatePrice for school package with quantity < 50 (no discount)
  - Test calculatePrice for school package with quantity 50-99 (10% discount)
  - Test calculatePrice for school package with quantity >= 100 (15% discount)
  - Test calculatePrice uses promo_price when available
  - Test calculatePrice uses base_price when promo_price is null
  - Test calculatePrice throws error for non-existent package
  - Test getPriceBreakdown returns correct breakdown
  - Test idempotence: calling twice with same inputs returns identical results
  - _Requirements: 2.1-2.9_

### 11. Implement BookingService

- [x] 11.1 Create `/src/services/booking.service.ts`
  - Implement `createBooking(data: CreateBookingData): Promise<string>`
  - Implement private `validatePackage(packageId: string): Promise<Package>`
  - Implement private `validateQuota(packageId: string, visitDate: string, quantity: number): Promise<void>`
  - Use PricingService to calculate total price
  - Execute quota check and booking creation within transaction
  - Validate package exists and is active
  - Validate quantity is at least 1
  - Throw "Package not found or inactive" if package invalid
  - Throw "Quota exceeded for this date" if quota exceeded
  - Export singleton instance `bookingService`
  - Add JSDoc comments referencing requirements
  - _Requirements: 4.1-4.10_

- [x] 11.2 Write unit tests for BookingService
  - Test createBooking with valid data
  - Test createBooking throws error for non-existent package
  - Test createBooking throws error for inactive package
  - Test createBooking throws error for quantity < 1
  - Test createBooking throws error when quota exceeded
  - Test createBooking uses PricingService for price calculation
  - Test createBooking creates booking with status "pending"
  - _Requirements: 4.1-4.10_

- [x] 11.3 Write integration tests for BookingService
  - Test createBooking with real database
  - Test quota validation with concurrent bookings
  - Test transaction rollback on error
  - _Requirements: 4.1-4.10_

### 12. Implement TicketService

- [x] 12.1 Create `/src/services/ticket.service.ts`
  - Implement `generateTickets(bookingId: string, quantity: number): Promise<void>`
  - Implement `checkInTicket(qrToken: string): Promise<TicketDetails>`
  - Implement private `validateTicket(qrToken: string): Promise<TicketWithDetails>`
  - Generate unique qr_token using crypto.randomUUID()
  - Set is_checked_in to false for new tickets
  - Throw "Ticket not found" if ticket doesn't exist
  - Throw "Ticket already used" if ticket already checked in
  - Export singleton instance `ticketService`
  - Add JSDoc comments referencing requirements
  - _Requirements: 6.1-6.10_

- [x] 12.2 Write unit tests for TicketService
  - Test generateTickets creates correct number of tickets
  - Test generateTickets generates unique tokens
  - Test checkInTicket with valid token
  - Test checkInTicket throws error for non-existent token
  - Test checkInTicket throws error for already checked in ticket
  - Test checkInTicket returns ticket details
  - _Requirements: 6.1-6.10_

### 13. Implement PaymentService

- [x] 13.1 Create `/src/services/payment.service.ts`
  - Implement `processPayment(bookingId: string): Promise<PaymentResult>`
  - Implement private `validateBooking(bookingId: string): Promise<Booking>`
  - Use TicketService to generate tickets
  - Execute booking update, payment creation, and ticket generation within transaction
  - Throw "Booking not found" if booking doesn't exist
  - Throw "Booking already paid" if booking status is "paid"
  - Export singleton instance `paymentService`
  - Add JSDoc comments referencing requirements
  - _Requirements: 5.1-5.10_

- [x] 13.2 Write unit tests for PaymentService
  - Test processPayment with valid booking
  - Test processPayment throws error for non-existent booking
  - Test processPayment throws error for already paid booking
  - Test processPayment updates booking status to "paid"
  - Test processPayment creates payment record
  - Test processPayment generates tickets
  - _Requirements: 5.1-5.10_

- [x] 13.3 Write integration tests for PaymentService
  - Test processPayment with real database
  - Test transaction rollback on error
  - Test complete payment workflow
  - _Requirements: 5.1-5.10_

### 14. Create service documentation

- Create `/src/services/README.md`
- Document service layer architecture principles
- Document all service classes and their methods
- Include usage examples
- Document dependency injection pattern
- Document testing approach
- _Requirements: 15.7_

### 15. Checkpoint - Service layer complete

- Ensure all service tests pass
- Verify all services have 95%+ test coverage
- Ask the user if questions arise

---

## Phase 3: API Route Refactoring (Week 3)

### 16. Refactor bookings API route

- [x] 16.1 Refactor `/src/app/api/bookings/route.ts` to thin controller
  - Keep authentication check
  - Keep Zod validation
  - Replace business logic with `bookingService.createBooking()` call
  - Map service errors to HTTP status codes (404 for not found, 400 for validation/quota)
  - Maintain backward compatible response format
  - Reduce to fewer than 50 lines
  - Add JSDoc comment referencing requirements
  - _Requirements: 7.1-7.10_

- [x] 16.2 Write E2E tests for bookings API route
  - Test POST with valid data returns 201
  - Test POST with invalid date format returns 400
  - Test POST with non-existent package returns 404
  - Test POST with quota exceeded returns 400
  - Test POST without authentication returns 401
  - Verify response format matches original
  - _Requirements: 7.1-7.10, 12.1-12.10_

### 17. Refactor payments API route

- [x] 17.1 Refactor `/src/app/api/payments/simulate/route.ts` to thin controller
  - Keep authentication check
  - Keep Zod validation
  - Replace business logic with `paymentService.processPayment()` call
  - Map service errors to HTTP status codes (404 for not found, 400 for already paid)
  - Maintain backward compatible response format
  - Reduce to fewer than 40 lines
  - Add JSDoc comment referencing requirements
  - _Requirements: 8.1-8.10_

- [x] 17.2 Write E2E tests for payments API route
  - Test POST with valid booking returns 200
  - Test POST with non-existent booking returns 404
  - Test POST with already paid booking returns 400
  - Test POST without authentication returns 401
  - Verify response format matches original
  - _Requirements: 8.1-8.10, 12.3-12.10_

### 18. Refactor check-in API route

- [x] 18.1 Refactor `/src/app/api/tickets/check-in/route.ts` to thin controller
  - Keep authentication check (admin/staff only)
  - Keep Zod validation
  - Replace business logic with `ticketService.checkInTicket()` call
  - Map service errors to HTTP status codes (404 for not found, 400 for already used)
  - Maintain backward compatible response format
  - Reduce to fewer than 40 lines
  - Add JSDoc comment referencing requirements
  - _Requirements: 9.1-9.10_

- [x] 18.2 Write E2E tests for check-in API route
  - Test POST with valid token returns 200
  - Test POST with non-existent token returns 404
  - Test POST with already used token returns 400
  - Test POST without authentication returns 401
  - Test POST with non-admin/staff role returns 401
  - Verify response format matches original
  - _Requirements: 9.1-9.10, 12.5-12.10_

### 19. Checkpoint - API routes refactored

- Ensure all E2E tests pass
- Verify backward compatibility maintained
- Verify all routes are thin controllers (< 50 lines)
- Ask the user if questions arise

---

## Phase 4: Frontend Pricing Removal (Week 4)

### 20. Create calculate-price API endpoint

- [x] 20.1 Create `/src/app/api/packages/calculate-price/route.ts`
  - Implement POST handler
  - Accept packageId and quantity in request body
  - Validate request with Zod schema
  - Call `pricingService.calculatePrice()`
  - Return totalPrice, pricePerUnit, discountApplied, discountPercentage
  - Map service errors to HTTP status codes
  - Add JSDoc comment referencing requirements
  - _Requirements: 10.4, 10.5_

- [x] 20.2 Write E2E tests for calculate-price endpoint
  - Test POST with valid data returns 200
  - Test POST with non-existent package returns 404
  - Test POST with invalid quantity returns 400
  - Verify response includes all price fields
  - _Requirements: 10.4, 10.5_

### 21. Update BookingForm component

- [x] 21.1 Refactor `/src/components/BookingForm.tsx`
  - Remove local pricing calculation logic from useEffect
  - Remove bulk discount logic
  - Add state for loading price calculation
  - Call `/api/packages/calculate-price` when quantity changes
  - Add debouncing (300ms) to prevent excessive API calls
  - Display loading indicator during price fetch
  - Handle API errors gracefully with error message
  - Maintain existing UI/UX
  - _Requirements: 10.1-10.10_

- [x] 21.2 Write frontend tests for BookingForm
  - Test component calls calculate-price API on quantity change
  - Test component displays loading indicator during fetch
  - Test component displays error message on API failure
  - Test component maintains existing booking submission workflow
  - _Requirements: 10.1-10.10_

### 22. Checkpoint - Frontend pricing removed

- Ensure BookingForm has no pricing logic
- Verify pricing API endpoint works correctly
- Verify UX is maintained (loading states, error handling)
- Ask the user if questions arise

---

## Phase 5: Testing & Documentation (Week 5)

### 23. Write property-based tests for pricing logic

- [x] 23.1 Write property test for school package 15% discount threshold
  - **Property 1: School Package 15% Discount Threshold**
  - **Validates: Requirement 2.2**
  - Generate random school packages with varying base/promo prices
  - Generate random quantities >= 100
  - Verify pricePerUnit = floor(basePrice * 0.85) for all cases
  - Use fast-check library with 100+ iterations

- [x] 23.2 Write property test for school package 10% discount threshold
  - **Property 2: School Package 10% Discount Threshold**
  - **Validates: Requirement 2.3**
  - Generate random school packages with varying base/promo prices
  - Generate random quantities in range [50, 99]
  - Verify pricePerUnit = floor(basePrice * 0.90) for all cases
  - Use fast-check library with 100+ iterations

- [x] 23.3 Write property test for personal package no discount
  - **Property 3: Personal Package No Discount**
  - **Validates: Requirement 2.4**
  - Generate random personal packages with varying base/promo prices
  - Generate random quantities >= 1
  - Verify pricePerUnit = basePrice (no discount) for all cases
  - Use fast-check library with 100+ iterations

- [x] 23.4 Write property test for promo price priority
  - **Property 4: Promo Price Priority**
  - **Validates: Requirement 2.5**
  - Generate random packages with both base_price and promo_price
  - Generate random quantities
  - Verify calculation uses promo_price instead of base_price
  - Use fast-check library with 100+ iterations

- [x] 23.5 Write property test for base price fallback
  - **Property 5: Base Price Fallback**
  - **Validates: Requirement 2.6**
  - Generate random packages with promo_price = null
  - Generate random quantities
  - Verify calculation uses base_price
  - Use fast-check library with 100+ iterations

- [x] 23.6 Write property test for price calculation idempotence
  - **Property 6: Price Calculation Idempotence**
  - **Validates: Requirement 2.9**
  - Generate random packages and quantities
  - Call calculatePrice twice with same inputs
  - Verify results are identical
  - Use fast-check library with 100+ iterations

- [x] 23.7 Write property test for quota enforcement
  - **Property 7: Quota Enforcement**
  - **Validates: Requirements 4.5, 4.6**
  - Generate random packages with varying quotas
  - Generate random existing booking counts
  - Generate random new booking quantities that exceed quota
  - Verify booking creation fails with "Quota exceeded for this date"
  - Use fast-check library with 100+ iterations

- [x] 23.8 Write property test for total price calculation
  - **Property 8: Total Price Calculation**
  - **Validates: Requirement 2.1**
  - Generate random packages and quantities
  - Calculate price
  - Verify totalPrice = pricePerUnit * quantity
  - Use fast-check library with 100+ iterations

### 24. Write integration tests for complete workflows

- [x] 24.1 Write integration test for booking → payment → check-in flow
  - Create booking with BookingService
  - Process payment with PaymentService
  - Check in ticket with TicketService
  - Verify complete workflow with real database
  - _Requirements: 4.1-4.10, 5.1-5.10, 6.1-6.10_

- [x] 24.2 Write integration test for quota validation across concurrent bookings
  - Create multiple bookings concurrently for same package and date
  - Verify quota enforcement works correctly
  - Test transaction isolation
  - _Requirements: 4.5, 4.6, 14.1-14.10_

### 25. Update architecture documentation

- [x] Update `/README.md` with new architecture overview
- [x] Document service layer and repository layer
- [x] Update deployment documentation if needed
- [x] Document migration from monolithic to layered architecture
- _Requirements: 15.1-15.10_

### 26. Create developer migration guide

- [x] Create `/docs/MIGRATION_GUIDE.md`
- [x] Document how to use services instead of direct database queries
- [x] Provide examples of service usage
- [x] Document testing patterns for services
- [x] Document error handling patterns
- [x] Include troubleshooting section
- _Requirements: 15.1-15.10_

### 27. Final checkpoint - Production deployment

- [x] Ensure all tests pass (unit, integration, property-based, E2E)
- [x] Verify test coverage > 95% for services and repositories
- [x] Verify backward compatibility maintained
- [x] Review all code changes
- [ ] Deploy to production
- [ ] Monitor error rates and performance metrics
- Ask the user if questions arise

---

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at phase boundaries
- Property tests validate universal correctness properties across input ranges
- Unit tests validate specific examples and edge cases
- Integration tests validate complete workflows with real database
- All API routes maintain backward compatibility (no breaking changes)
- Frontend changes maintain existing UI/UX with improved loading states

