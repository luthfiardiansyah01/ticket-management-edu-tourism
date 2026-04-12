# Requirements Document: Service Layer Architecture Refactoring

## Introduction

This document specifies the requirements for refactoring the Cikapundung Ticketing System backend from a monolithic API route architecture to a clean Service Layer Architecture. The refactoring aims to separate business logic from API routes, eliminate code duplication, and establish clear architectural boundaries between presentation, business logic, and data access layers.

The current system has business logic embedded directly in API routes (`/src/app/api/bookings/route.ts`, `/src/app/api/payments/simulate/route.ts`, `/src/app/api/tickets/check-in/route.ts`) and duplicated pricing calculations in the frontend (`/src/components/BookingForm.tsx`). This refactoring will extract all business logic into dedicated service classes and isolate database operations into repository classes, creating a maintainable, testable, and scalable architecture.

**Scope:** Backend architecture only. No UI changes, no new features, no breaking API changes.

## Glossary

- **API_Route**: Next.js Route Handler that receives HTTP requests and returns HTTP responses
- **Service_Layer**: Business logic layer containing domain-specific operations and rules
- **Repository_Layer**: Data access layer that encapsulates all database queries using Drizzle ORM
- **Pricing_Service**: Service responsible for all price calculation and discount logic
- **Payment_Service**: Service responsible for payment processing and transaction management
- **Booking_Service**: Service responsible for booking creation, validation, and quota management
- **Ticket_Service**: Service responsible for QR ticket generation and check-in operations
- **Business_Logic**: Domain rules, calculations, validations, and workflows
- **Thin_Controller**: API route that only handles request/response formatting and delegates to services
- **Bulk_Discount**: School package discount (10% for 50+ tickets, 15% for 100+ tickets)
- **Quota_Validation**: Business rule ensuring bookings do not exceed daily package quota
- **Transaction**: Database operation that must complete atomically or rollback entirely

## Requirements

### Requirement 1: Service Layer Foundation

**User Story:** As a Backend Developer, I want a dedicated service layer structure, so that business logic is organized by domain and separated from API routes.

#### Acceptance Criteria

1. THE System SHALL create a `/src/services/` directory structure
2. THE System SHALL create a `/src/repositories/` directory structure
3. THE Pricing_Service SHALL be located at `/src/services/pricing.service.ts`
4. THE Payment_Service SHALL be located at `/src/services/payment.service.ts`
5. THE Booking_Service SHALL be located at `/src/services/booking.service.ts`
6. THE Ticket_Service SHALL be located at `/src/services/ticket.service.ts`
7. WHERE a service requires database access, THE Service SHALL depend only on Repository_Layer classes
8. WHERE a service requires another service's functionality, THE Service SHALL import and use that service

---

### Requirement 2: Pricing Service Implementation

**User Story:** As a Backend Developer, I want all pricing logic centralized in a single service, so that price calculations are consistent across the application and easy to test.

#### Acceptance Criteria

1. THE Pricing_Service SHALL expose a `calculatePrice(packageId: string, quantity: number)` function that returns the total price
2. WHEN calculating price for a school package with quantity >= 100, THE Pricing_Service SHALL apply a 15% discount to the base price
3. WHEN calculating price for a school package with quantity >= 50 and quantity < 100, THE Pricing_Service SHALL apply a 10% discount to the base price
4. WHEN calculating price for a personal package, THE Pricing_Service SHALL NOT apply bulk discounts regardless of quantity
5. WHEN a package has a promo_price, THE Pricing_Service SHALL use promo_price as the base before applying bulk discounts
6. WHEN a package has no promo_price, THE Pricing_Service SHALL use base_price before applying bulk discounts
7. THE Pricing_Service SHALL expose a `getPriceBreakdown(packageId: string, quantity: number)` function that returns base price, discount amount, and final price
8. WHEN a package does not exist, THE Pricing_Service SHALL throw an error with message "Package not found"
9. FOR ALL valid packages and quantities, calculating price twice with the same inputs SHALL return identical results (idempotence)

---

### Requirement 3: Repository Layer for Data Access

**User Story:** As a Backend Developer, I want all database queries isolated in repository classes, so that data access logic is decoupled from business logic and can be tested independently.

#### Acceptance Criteria

1. THE System SHALL create `/src/repositories/package.repository.ts` for ticket package queries
2. THE System SHALL create `/src/repositories/booking.repository.ts` for booking queries
3. THE System SHALL create `/src/repositories/payment.repository.ts` for payment queries
4. THE System SHALL create `/src/repositories/ticket.repository.ts` for QR ticket queries
5. THE System SHALL create `/src/repositories/user.repository.ts` for user queries
6. THE Package_Repository SHALL expose a `findById(id: string)` function that returns package details or null
7. THE Booking_Repository SHALL expose a `create(data: BookingData)` function that inserts a booking and returns the booking ID
8. THE Booking_Repository SHALL expose a `countByPackageAndDate(packageId: string, visitDate: string)` function that returns the count of non-cancelled bookings
9. THE Booking_Repository SHALL expose a `updateStatus(bookingId: string, status: string)` function that updates booking status
10. THE Payment_Repository SHALL expose a `create(data: PaymentData)` function that inserts a payment record
11. THE Ticket_Repository SHALL expose a `createBatch(tickets: TicketData[])` function that inserts multiple QR tickets
12. THE Ticket_Repository SHALL expose a `findByToken(qrToken: string)` function that returns ticket with booking and package details
13. THE Ticket_Repository SHALL expose a `checkIn(ticketId: string)` function that marks a ticket as checked in
14. WHERE a repository function fails, THE Repository SHALL throw an error with a descriptive message

---

### Requirement 4: Booking Service Implementation

**User Story:** As a Backend Developer, I want booking creation logic extracted into a service, so that quota validation and booking workflows are centralized and testable.

#### Acceptance Criteria

1. THE Booking_Service SHALL expose a `createBooking(userId: string, packageId: string, visitDate: string, quantity: number)` function that returns a booking ID
2. WHEN creating a booking, THE Booking_Service SHALL validate that the package exists and is active
3. WHEN creating a booking, THE Booking_Service SHALL validate that quantity is at least 1
4. WHEN creating a booking, THE Booking_Service SHALL use Pricing_Service to calculate total price
5. WHEN creating a booking, THE Booking_Service SHALL validate that current bookings plus requested quantity does not exceed package quota_per_day
6. WHEN quota validation fails, THE Booking_Service SHALL throw an error with message "Quota exceeded for this date"
7. WHEN package is not found or inactive, THE Booking_Service SHALL throw an error with message "Package not found or inactive"
8. THE Booking_Service SHALL use Booking_Repository to persist the booking with status "pending"
9. THE Booking_Service SHALL execute quota check and booking creation within a single Transaction
10. WHEN the Transaction fails, THE Booking_Service SHALL rollback all changes and throw an error

---

### Requirement 5: Payment Service Implementation

**User Story:** As a Backend Developer, I want payment processing logic extracted into a service, so that payment workflows are abstracted and can be easily extended for real payment gateways.

#### Acceptance Criteria

1. THE Payment_Service SHALL expose a `processPayment(bookingId: string)` function that processes payment and returns success status
2. WHEN processing payment, THE Payment_Service SHALL validate that the booking exists
3. WHEN processing payment for a booking with status "paid", THE Payment_Service SHALL throw an error with message "Booking already paid"
4. WHEN processing payment, THE Payment_Service SHALL update booking status to "paid"
5. WHEN processing payment, THE Payment_Service SHALL create a payment record with provider "mock_gateway" and status "success"
6. WHEN processing payment, THE Payment_Service SHALL generate QR tickets equal to booking quantity
7. THE Payment_Service SHALL use Ticket_Service to generate QR tickets
8. THE Payment_Service SHALL execute booking update, payment creation, and ticket generation within a single Transaction
9. WHEN the Transaction fails, THE Payment_Service SHALL rollback all changes and throw an error
10. WHERE payment processing succeeds, THE Payment_Service SHALL return the booking ID and success message

---

### Requirement 6: Ticket Service Implementation

**User Story:** As a Backend Developer, I want ticket generation and check-in logic extracted into a service, so that QR ticket operations are centralized and testable.

#### Acceptance Criteria

1. THE Ticket_Service SHALL expose a `generateTickets(bookingId: string, quantity: number)` function that creates QR tickets
2. WHEN generating tickets, THE Ticket_Service SHALL create unique qr_token values using crypto.randomUUID()
3. WHEN generating tickets, THE Ticket_Service SHALL set is_checked_in to false for all new tickets
4. THE Ticket_Service SHALL use Ticket_Repository to persist tickets
5. THE Ticket_Service SHALL expose a `checkInTicket(qrToken: string)` function that marks a ticket as checked in
6. WHEN checking in a ticket, THE Ticket_Service SHALL validate that the ticket exists
7. WHEN checking in a ticket that is already checked in, THE Ticket_Service SHALL throw an error with message "Ticket already used"
8. WHEN checking in a valid ticket, THE Ticket_Service SHALL update is_checked_in to true and set checked_in_at to current timestamp
9. WHEN checking in a valid ticket, THE Ticket_Service SHALL return ticket details including package name and visitor name
10. FOR ALL generated tickets, the qr_token SHALL be unique across the entire tickets table

---

### Requirement 7: API Route Refactoring - Bookings

**User Story:** As a Backend Developer, I want the bookings API route to be a thin controller, so that it only handles HTTP concerns and delegates business logic to services.

#### Acceptance Criteria

1. THE Bookings_API_Route SHALL validate request body using Zod schema
2. THE Bookings_API_Route SHALL extract packageId, visitDate, and quantity from request body
3. THE Bookings_API_Route SHALL call Booking_Service.createBooking() with user ID from session
4. THE Bookings_API_Route SHALL NOT contain any pricing calculation logic
5. THE Bookings_API_Route SHALL NOT contain any quota validation logic
6. THE Bookings_API_Route SHALL NOT execute any direct database queries
7. WHEN Booking_Service throws an error, THE Bookings_API_Route SHALL return appropriate HTTP status code and error message
8. WHEN booking creation succeeds, THE Bookings_API_Route SHALL return HTTP 201 with booking ID
9. THE Bookings_API_Route SHALL be fewer than 50 lines of code
10. THE Bookings_API_Route SHALL maintain backward compatibility with existing API contract

---

### Requirement 8: API Route Refactoring - Payments

**User Story:** As a Backend Developer, I want the payments API route to be a thin controller, so that it only handles HTTP concerns and delegates business logic to services.

#### Acceptance Criteria

1. THE Payments_API_Route SHALL validate request body using Zod schema
2. THE Payments_API_Route SHALL extract bookingId from request body
3. THE Payments_API_Route SHALL call Payment_Service.processPayment() with booking ID
4. THE Payments_API_Route SHALL NOT contain any payment processing logic
5. THE Payments_API_Route SHALL NOT contain any ticket generation logic
6. THE Payments_API_Route SHALL NOT execute any direct database queries
7. WHEN Payment_Service throws an error, THE Payments_API_Route SHALL return appropriate HTTP status code and error message
8. WHEN payment processing succeeds, THE Payments_API_Route SHALL return HTTP 200 with success message
9. THE Payments_API_Route SHALL be fewer than 40 lines of code
10. THE Payments_API_Route SHALL maintain backward compatibility with existing API contract

---

### Requirement 9: API Route Refactoring - Ticket Check-In

**User Story:** As a Backend Developer, I want the ticket check-in API route to be a thin controller, so that it only handles HTTP concerns and delegates business logic to services.

#### Acceptance Criteria

1. THE CheckIn_API_Route SHALL validate request body using Zod schema
2. THE CheckIn_API_Route SHALL extract qrToken from request body
3. THE CheckIn_API_Route SHALL call Ticket_Service.checkInTicket() with QR token
4. THE CheckIn_API_Route SHALL NOT contain any check-in logic
5. THE CheckIn_API_Route SHALL NOT execute any direct database queries
6. WHEN Ticket_Service throws an error, THE CheckIn_API_Route SHALL return appropriate HTTP status code and error message
7. WHEN check-in succeeds, THE CheckIn_API_Route SHALL return HTTP 200 with ticket details
8. THE CheckIn_API_Route SHALL be fewer than 40 lines of code
9. THE CheckIn_API_Route SHALL maintain backward compatibility with existing API contract
10. THE CheckIn_API_Route SHALL preserve existing authorization checks for admin and staff roles

---

### Requirement 10: Frontend Pricing Logic Removal

**User Story:** As a Backend Developer, I want pricing calculations removed from the frontend, so that the backend Pricing_Service is the single source of truth.

#### Acceptance Criteria

1. THE BookingForm_Component SHALL NOT contain any pricing calculation logic
2. THE BookingForm_Component SHALL NOT contain any bulk discount logic
3. WHEN quantity changes, THE BookingForm_Component SHALL call a backend API endpoint to get updated price
4. THE System SHALL create a new API endpoint `/api/packages/calculate-price` that accepts packageId and quantity
5. THE Calculate_Price_API_Route SHALL call Pricing_Service.calculatePrice() and return the result
6. THE BookingForm_Component SHALL display the price returned from the backend API
7. WHEN the API call fails, THE BookingForm_Component SHALL display an error message
8. THE BookingForm_Component SHALL maintain existing UI behavior and user experience
9. THE BookingForm_Component SHALL NOT break existing booking submission workflow
10. WHERE network latency causes delay, THE BookingForm_Component SHALL show a loading indicator during price calculation

---

### Requirement 11: Service Layer Testing Support

**User Story:** As a Backend Developer, I want services to be testable in isolation, so that business logic can be verified without database dependencies.

#### Acceptance Criteria

1. WHERE a service depends on a repository, THE Service SHALL accept the repository as a constructor parameter or dependency injection
2. THE Pricing_Service SHALL be testable without database access
3. THE Booking_Service SHALL be testable with mock repositories
4. THE Payment_Service SHALL be testable with mock repositories
5. THE Ticket_Service SHALL be testable with mock repositories
6. WHERE a service throws an error, THE Error SHALL include a descriptive message suitable for logging and debugging
7. WHERE a service function succeeds, THE Service SHALL return a well-defined result type
8. THE System SHALL NOT introduce global state or singletons that prevent isolated testing
9. WHERE a service requires configuration, THE Service SHALL accept configuration through constructor parameters
10. FOR ALL service functions, calling with the same inputs SHALL produce deterministic results (excluding random UUID generation)

---

### Requirement 12: Backward Compatibility Guarantee

**User Story:** As an API Consumer, I want all existing API endpoints to maintain their contracts, so that frontend applications continue to work without changes.

#### Acceptance Criteria

1. THE Bookings_API_Route SHALL accept the same request body schema as before refactoring
2. THE Bookings_API_Route SHALL return the same response schema as before refactoring
3. THE Payments_API_Route SHALL accept the same request body schema as before refactoring
4. THE Payments_API_Route SHALL return the same response schema as before refactoring
5. THE CheckIn_API_Route SHALL accept the same request body schema as before refactoring
6. THE CheckIn_API_Route SHALL return the same response schema as before refactoring
7. WHERE an API route previously returned an error status code, THE Refactored_Route SHALL return the same status code for the same error condition
8. WHERE an API route previously returned a success status code, THE Refactored_Route SHALL return the same status code for the same success condition
9. THE System SHALL NOT change any API endpoint URLs
10. THE System SHALL NOT change any HTTP methods for existing endpoints

---

### Requirement 13: Error Handling Consistency

**User Story:** As a System Maintainer, I want consistent error handling across all services and API routes, so that errors are predictable and easy to debug.

#### Acceptance Criteria

1. WHERE a service encounters an error, THE Service SHALL throw an Error with a descriptive message
2. WHERE an API route catches a service error, THE API_Route SHALL return an appropriate HTTP status code
3. WHEN a resource is not found, THE Service SHALL throw an error and THE API_Route SHALL return HTTP 404
4. WHEN validation fails, THE Service SHALL throw an error and THE API_Route SHALL return HTTP 400
5. WHEN a business rule is violated, THE Service SHALL throw an error and THE API_Route SHALL return HTTP 400
6. WHEN an unexpected error occurs, THE API_Route SHALL return HTTP 500
7. WHERE an error response is returned, THE Response SHALL include a "message" field with error description
8. THE System SHALL NOT expose internal implementation details in error messages
9. THE System SHALL NOT expose database error messages directly to API consumers
10. WHERE a Transaction fails, THE Service SHALL ensure all changes are rolled back before throwing an error

---

### Requirement 14: Transaction Management

**User Story:** As a Backend Developer, I want transaction boundaries clearly defined in services, so that data consistency is maintained during multi-step operations.

#### Acceptance Criteria

1. WHEN Booking_Service creates a booking, THE Service SHALL execute quota check and booking insert within a single Transaction
2. WHEN Payment_Service processes payment, THE Service SHALL execute booking update, payment insert, and ticket generation within a single Transaction
3. WHERE a Transaction operation fails, THE Service SHALL rollback all changes within that Transaction
4. WHERE a Transaction succeeds, THE Service SHALL commit all changes atomically
5. THE System SHALL use Drizzle ORM's transaction API for all Transaction operations
6. WHERE a service requires multiple database operations, THE Service SHALL evaluate whether a Transaction is necessary
7. WHERE read-only operations are performed, THE Service SHALL NOT use a Transaction
8. THE System SHALL NOT nest Transactions more than one level deep
9. WHERE a Transaction is used, THE Service SHALL handle Transaction errors and throw descriptive errors
10. FOR ALL Transaction operations, either all changes SHALL be committed or all changes SHALL be rolled back (atomicity)

---

### Requirement 15: Code Organization and Maintainability

**User Story:** As a System Maintainer, I want clear code organization and documentation, so that the refactored architecture is easy to understand and extend.

#### Acceptance Criteria

1. THE System SHALL include TypeScript interfaces for all service method parameters and return types
2. THE System SHALL include JSDoc comments for all public service methods
3. WHERE a service method has complex logic, THE Service SHALL include inline comments explaining the logic
4. THE System SHALL use consistent naming conventions across all services and repositories
5. THE System SHALL export service instances as singleton objects for use in API routes
6. WHERE a service depends on another service, THE Dependency SHALL be clearly documented in comments
7. THE System SHALL include a README.md in `/src/services/` explaining the service layer architecture
8. THE System SHALL include a README.md in `/src/repositories/` explaining the repository pattern
9. WHERE business rules are implemented, THE Code SHALL include comments referencing the requirement number
10. THE System SHALL maintain consistent code formatting using the project's ESLint configuration

---

## Implementation Notes

### Phased Refactoring Approach

The refactoring should be implemented in phases to minimize risk:

1. **Phase 1:** Create repository layer and migrate database queries
2. **Phase 2:** Create service layer and migrate business logic
3. **Phase 3:** Refactor API routes to use services
4. **Phase 4:** Remove frontend pricing logic and create calculate-price endpoint
5. **Phase 5:** Add comprehensive tests for services and repositories

### Testing Strategy

- Unit tests for Pricing_Service (no database dependencies)
- Integration tests for services with mock repositories
- End-to-end tests for API routes to verify backward compatibility
- Property-based tests for pricing calculations to verify discount logic across input ranges

### Migration Safety

- Keep existing API route code in comments during initial refactoring
- Deploy with feature flag to toggle between old and new implementation
- Monitor error rates and performance metrics after deployment
- Maintain rollback plan to revert to monolithic routes if issues arise
