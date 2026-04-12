# Cikapundung Ticketing System

A modern ticketing system for educational tourism built with Next.js, featuring a clean layered architecture with Service and Repository patterns.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Turso (LibSQL) / SQLite
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js
- **Testing**: Jest (Unit, Integration, E2E, Property-Based)
- **Styling**: Tailwind CSS

## Architecture Overview

The application follows a **layered architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (Next.js Pages, Components, API Routes)                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Service Layer                         │
│  (Business Logic, Validation, Orchestration)            │
│  - BookingService                                        │
│  - PaymentService                                        │
│  - TicketService                                         │
│  - PricingService                                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Repository Layer                        │
│  (Data Access, Database Operations)                     │
│  - BookingRepository                                     │
│  - PaymentRepository                                     │
│  - TicketRepository                                      │
│  - PackageRepository                                     │
│  - UserRepository                                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Database Layer                         │
│  (Turso / LibSQL via Drizzle ORM)                       │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### 1. Presentation Layer (API Routes & Components)
- Handle HTTP requests/responses
- Input validation (Zod schemas)
- Authentication/authorization checks
- Thin controllers (< 50 lines)
- Delegate to Service Layer

**Example**: `/src/app/api/bookings/route.ts`

#### 2. Service Layer
- Business logic implementation
- Transaction coordination
- Cross-repository operations
- Error handling and validation
- Singleton pattern for easy testing

**Services**:
- `BookingService` - Booking creation, quota validation
- `PaymentService` - Payment processing, ticket generation
- `TicketService` - QR ticket generation, check-in
- `PricingService` - Price calculation, discount logic

**Example**: `/src/services/booking.service.ts`

#### 3. Repository Layer
- Database operations (CRUD)
- Query construction
- Data mapping
- No business logic
- Singleton pattern

**Repositories**:
- `BookingRepository` - Booking data access
- `PaymentRepository` - Payment data access
- `TicketRepository` - Ticket data access
- `PackageRepository` - Package data access
- `UserRepository` - User data access

**Example**: `/src/repositories/booking.repository.ts`

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes (thin controllers)
│   │   │   ├── bookings/
│   │   │   ├── payments/
│   │   │   ├── tickets/
│   │   │   └── packages/
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   └── packages/          # Package pages
│   │
│   ├── services/              # Service Layer (Business Logic)
│   │   ├── booking.service.ts
│   │   ├── payment.service.ts
│   │   ├── ticket.service.ts
│   │   ├── pricing.service.ts
│   │   └── types.ts
│   │
│   ├── repositories/          # Repository Layer (Data Access)
│   │   ├── booking.repository.ts
│   │   ├── payment.repository.ts
│   │   ├── ticket.repository.ts
│   │   ├── package.repository.ts
│   │   ├── user.repository.ts
│   │   └── types.ts
│   │
│   ├── components/            # React Components
│   │   ├── BookingForm.tsx
│   │   ├── PaymentButton.tsx
│   │   └── ...
│   │
│   ├── db/                    # Database Configuration
│   │   ├── index.ts          # Database connection
│   │   └── schema.ts         # Drizzle schema
│   │
│   └── lib/                   # Utilities
│       ├── auth.ts
│       ├── db.ts
│       └── test-utils.ts
│
├── .kiro/                     # Kiro Specs
│   └── specs/
│       └── service-layer-refactoring/
│
└── tests/                     # Test files (co-located with source)
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Initialize database
npm run db:push

# Seed database (optional)
npm run db:seed
```

### Development

```bash
# Run development server
npm run dev

# Open http://localhost:3000
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Key Features

### 1. Booking System
- Package selection (Personal, School)
- Quantity-based pricing
- Bulk discounts (10% for 50-99, 15% for 100+)
- Daily quota enforcement
- Transaction isolation for concurrent bookings

### 2. Payment Processing
- Mock payment gateway integration
- Automatic ticket generation
- Payment status tracking
- Transaction rollback on failure

### 3. QR Ticket System
- Unique QR code per ticket
- Check-in validation
- Duplicate check-in prevention
- Ticket status tracking

### 4. Pricing Engine
- Dynamic price calculation
- Promo price support
- Category-based discounts
- Real-time price updates

## API Endpoints

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details

### Payments
- `POST /api/payments/simulate` - Process payment

### Tickets
- `POST /api/tickets/check-in` - Check-in ticket

### Packages
- `GET /api/packages` - List packages
- `GET /api/packages/:id` - Get package details
- `POST /api/packages/calculate-price` - Calculate price

## Testing Strategy

### Test Coverage
- **Unit Tests**: Services, Repositories (95%+ coverage)
- **Integration Tests**: Complete workflows, quota validation
- **E2E Tests**: API routes with real database
- **Property-Based Tests**: Pricing logic validation (1000+ test cases)

### Test Types

#### Unit Tests
```typescript
// Example: src/services/pricing.service.test.ts
describe('PricingService', () => {
  it('should apply 15% discount for school packages >= 100', async () => {
    const result = await pricingService.calculatePrice('pkg-id', 100);
    expect(result.discountPercentage).toBe(15);
  });
});
```

#### Integration Tests
```typescript
// Example: src/services/complete-workflow.integration.test.ts
it('should execute complete workflow', async () => {
  const bookingId = await bookingService.createBooking({...});
  await paymentService.processPayment(bookingId);
  await ticketService.checkInTicket(qrToken);
});
```

#### Property-Based Tests
```typescript
// Example: src/services/pricing.service.property.test.ts
it('should apply 15% discount for any school package >= 100', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 10000, max: 1000000 }), // random base price
      fc.integer({ min: 100, max: 1000 }),      // random quantity >= 100
      async (basePrice, quantity) => {
        const result = await service.calculatePrice(pkgId, quantity);
        expect(result.discountPercentage).toBe(15);
      }
    ),
    { numRuns: 100 } // 100 random test cases
  );
});
```

## Database Schema

### Core Tables
- `users` - User accounts
- `ticket_packages` - Available packages
- `bookings` - Booking records
- `payments` - Payment transactions
- `qr_tickets` - Generated tickets

### Relationships
```
users ──┬─→ bookings ──┬─→ payments
        │              └─→ qr_tickets
        │
ticket_packages ─→ bookings
```

## Environment Variables

```env
# Database
DATABASE_URL=libsql://...
DATABASE_AUTH_TOKEN=...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# App
NODE_ENV=development
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Setup
1. Set up Turso database
2. Configure environment variables in Vercel
3. Deploy application

## Development Guidelines

### Adding New Features

1. **Define Requirements** - Document in `.kiro/specs/`
2. **Create Repository** - Add data access layer
3. **Create Service** - Implement business logic
4. **Create API Route** - Add thin controller
5. **Write Tests** - Unit, integration, E2E
6. **Update Documentation** - README, API docs

### Code Style

- Use TypeScript strict mode
- Follow singleton pattern for services/repositories
- Keep API routes thin (< 50 lines)
- Write comprehensive tests (95%+ coverage)
- Use JSDoc comments for public methods

### Testing Best Practices

- Test business logic in services (unit tests)
- Test data access in repositories (unit tests)
- Test complete workflows (integration tests)
- Test API contracts (E2E tests)
- Test edge cases (property-based tests)

## Known Issues

### SQLite Database Locking (Test-Only)
Integration tests may experience `SQLITE_BUSY` errors due to SQLite's limited concurrency support. This is a **test-only issue** and does not affect production (which uses Turso with proper concurrency).

**Workarounds**:
- Run tests sequentially: `npm test -- --runInBand`
- Use Turso for integration tests
- Run tests individually

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.

## Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### Architecture Resources
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
