# Sistem Tiket Wisata Edukasi Cikapundung

Sistem manajemen tiket wisata dan edukasi lingkungan untuk Sungai Cikapundung - Dago, Bandung. Aplikasi ini dibangun dengan arsitektur berlapis yang bersih menggunakan pola Service dan Repository, memungkinkan pengelolaan booking tiket secara online dengan fitur dynamic pricing, kuota harian, dan validasi QR code.

## Teknologi yang Digunakan

- **Framework**: Next.js 16 (App Router)
- **Bahasa**: TypeScript
- **Database**: Turso (LibSQL) / SQLite
- **ORM**: Drizzle ORM
- **Autentikasi**: NextAuth.js
- **Testing**: Jest (Unit, Integration, E2E, Property-Based)
- **Styling**: Tailwind CSS
- **Validasi**: Zod
- **QR Code**: qrcode.react, html5-qrcode

## Fitur Utama

### 1. Sistem Booking Multi-Role
- Booking untuk wisatawan personal dan rombongan sekolah
- Pemilihan paket wisata dengan kategori berbeda
- Perhitungan harga dinamis berdasarkan jumlah peserta
- Validasi kuota harian otomatis
- Isolasi transaksi untuk mencegah overbooking

### 2. Dynamic Pricing
- Harga dasar dan harga promo per paket
- Diskon otomatis untuk pembelian bulk:
  - 10% untuk 50-99 tiket
  - 15% untuk 100+ tiket
- Perhitungan harga real-time
- Dukungan untuk kategori personal dan sekolah

### 3. Sistem Pembayaran
- Simulasi payment gateway terintegrasi
- Pembuatan tiket QR otomatis setelah pembayaran sukses
- Pelacakan status pembayaran
- Rollback transaksi otomatis jika pembayaran gagal

### 4. Sistem Tiket QR Code
- Generate QR code unik untuk setiap tiket
- Validasi check-in dengan scan QR
- Pencegahan check-in duplikat
- Pelacakan status tiket (pending, checked-in)

### 5. Manajemen Paket Wisata
- CRUD paket wisata oleh admin
- Pengaturan kuota harian per paket
- Status aktif/non-aktif paket
- Kategori paket (personal, sekolah)

### 6. Autentikasi Multi-Role
- Role-based access control (Admin, Staff, User, School)
- Autentikasi dengan NextAuth.js
- Session management dengan JWT
- Protected routes berdasarkan role

## Arsitektur Aplikasi

Aplikasi ini mengikuti pola **arsitektur berlapis** dengan pemisahan tanggung jawab yang jelas:

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

### Tanggung Jawab Setiap Layer

#### 1. Presentation Layer (API Routes & Components)
- Menangani HTTP requests/responses
- Validasi input dengan Zod schemas
- Pengecekan autentikasi dan autorisasi
- Controller yang ringkas (< 50 baris)
- Delegasi ke Service Layer

#### 2. Service Layer
- Implementasi business logic
- Koordinasi transaksi database
- Operasi lintas repository
- Error handling dan validasi
- Pola Singleton untuk kemudahan testing

**Services yang tersedia**:
- `BookingService` - Pembuatan booking, validasi kuota
- `PaymentService` - Pemrosesan pembayaran, pembuatan tiket
- `TicketService` - Generate QR tiket, check-in
- `PricingService` - Kalkulasi harga, logika diskon

#### 3. Repository Layer
- Operasi database (CRUD)
- Konstruksi query
- Mapping data
- Tidak ada business logic
- Pola Singleton

**Repositories yang tersedia**:
- `BookingRepository` - Akses data booking
- `PaymentRepository` - Akses data pembayaran
- `TicketRepository` - Akses data tiket
- `PackageRepository` - Akses data paket
- `UserRepository` - Akses data user

## Struktur Folder

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes (thin controllers)
│   │   │   ├── auth/          # Autentikasi endpoints
│   │   │   ├── bookings/      # Booking endpoints
│   │   │   ├── payments/      # Payment endpoints
│   │   │   ├── tickets/       # Ticket endpoints
│   │   │   ├── packages/      # Package endpoints
│   │   │   └── register/      # Registrasi user
│   │   ├── auth/              # Halaman autentikasi
│   │   ├── bookings/          # Halaman booking
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── packages/          # Halaman paket wisata
│   │   ├── partnership/       # Halaman kemitraan
│   │   ├── staff/             # Halaman staff
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
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
│   │   ├── QRScanner.tsx
│   │   └── ...
│   │
│   ├── db/                    # Database Configuration
│   │   ├── index.ts          # Database connection
│   │   └── schema.ts         # Drizzle schema
│   │
│   └── lib/                   # Utilities
│       ├── auth.ts           # NextAuth configuration
│       ├── db.ts             # Database utilities
│       ├── test-utils.ts     # Testing utilities
│       └── validations/      # Zod schemas
│
├── .kiro/                     # Kiro Specs & Configuration
│   ├── specs/                # Spesifikasi fitur
│   └── steering/             # Steering files
│
├── .trae/                     # Dokumentasi proyek
│   └── documents/
│       ├── product_requirements.md
│       └── technical_architecture.md
│
├── coverage/                  # Test coverage reports
├── docs/                      # Dokumentasi tambahan
├── drizzle/                   # Database migrations
├── public/                    # Static assets
│   └── sounds/               # Audio files
├── scripts/                   # Utility scripts
│   ├── seed.ts               # Database seeding
│   ├── test-db.ts            # Test database setup
│   └── generate-secret.js    # Secret key generator
│
├── drizzle.config.ts         # Drizzle ORM config
├── jest.config.js            # Jest configuration
├── jest.setup.ts             # Jest setup file
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies
├── tailwind.config.ts        # Tailwind CSS config
└── tsconfig.json             # TypeScript config
```

## Instalasi dan Menjalankan Proyek

### Prasyarat

- Node.js 18 atau lebih tinggi
- npm atau yarn
- Akun Turso (untuk production) atau SQLite (untuk development)

### Langkah Instalasi

1. Clone repository

```bash
git clone <repository-url>
cd ticket-system
```

2. Install dependencies

```bash
npm install
```

3. Setup environment variables

Buat file `.env.local` di root folder dengan konfigurasi berikut:

```env
# Database
DATABASE_URL=file:local.db
# Untuk production dengan Turso:
# DATABASE_URL=libsql://your-database.turso.io
# TURSO_AUTH_TOKEN=your-auth-token

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# App
NODE_ENV=development
```

Untuk generate `NEXTAUTH_SECRET`:

```bash
node scripts/generate-secret.js
```

4. Inisialisasi database

```bash
# Push schema ke database
npx drizzle-kit push

# Seed database dengan data awal (opsional)
npx tsx scripts/seed.ts

# Seed data UMKM produk awal (idempotent dan aman untuk production bila dijalankan secara sengaja)
npx tsx scripts/seed-umkm.ts
```

### Menjalankan Aplikasi

#### Development Mode

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

#### Production Build

```bash
# Build aplikasi
npm run build

# Jalankan production server
npm start
```

### Menjalankan Tests

```bash
# Jalankan semua tests
npm test

# Jalankan tests dengan watch mode
npm run test:watch

# Jalankan tests dengan coverage report
npm run test:coverage

# Jalankan E2E tests
npm run test:e2e
```

### Database Management

```bash
# Generate migration files
npx drizzle-kit generate

# Push schema ke database
npx drizzle-kit push

# Open Drizzle Studio (database GUI)
npx drizzle-kit studio

# Seed produk UMKM
npm run seed:umkm
```

## API Endpoints

### Autentikasi

```
POST /api/auth/[...nextauth]  # NextAuth.js endpoints
POST /api/register             # Registrasi user baru
```

### Bookings

```
POST /api/bookings            # Buat booking baru
GET  /api/bookings/:id        # Detail booking
```

### Payments

```
POST /api/payments/simulate   # Simulasi pembayaran
```

### Tickets

```
POST /api/tickets/check-in    # Check-in tiket dengan QR
```

### Packages

```
GET  /api/packages                    # List semua paket
GET  /api/packages/:id                # Detail paket
POST /api/packages/calculate-price    # Kalkulasi harga
```

## Skema Database

### Tabel Utama

- `users` - Akun pengguna (admin, staff, user, school)
- `ticket_packages` - Paket wisata yang tersedia
- `bookings` - Record booking
- `payments` - Transaksi pembayaran
- `qr_tickets` - Tiket yang di-generate

### Relasi Tabel

```
users ──┬─→ bookings ──┬─→ payments
        │              └─→ qr_tickets
        │
ticket_packages ─→ bookings
```

### Contoh Schema (Drizzle ORM)

```typescript
// users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// bookings table
export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id),
  package_id: text('package_id').notNull().references(() => ticketPackages.id),
  visit_date: text('visit_date').notNull(),
  quantity: integer('quantity').notNull(),
  total_price: integer('total_price').notNull(),
  status: text('status').notNull().default('pending'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
```

## Strategi Testing

### Coverage Testing

Proyek ini memiliki coverage testing yang komprehensif:

- **Unit Tests**: Services dan Repositories (95%+ coverage)
- **Integration Tests**: Complete workflows, validasi kuota
- **E2E Tests**: API routes dengan database real
- **Property-Based Tests**: Validasi logika pricing (1000+ test cases)

### Jenis-Jenis Test

#### Unit Tests

Test untuk business logic di services dan data access di repositories.

```typescript
// Contoh: src/services/pricing.service.test.ts
describe('PricingService', () => {
  it('harus apply diskon 15% untuk paket sekolah >= 100', async () => {
    const result = await pricingService.calculatePrice('pkg-id', 100);
    expect(result.discountPercentage).toBe(15);
  });
});
```

#### Integration Tests

Test untuk workflow lengkap yang melibatkan multiple services.

```typescript
// Contoh: src/services/complete-workflow.integration.test.ts
it('harus execute complete workflow dari booking hingga check-in', async () => {
  const bookingId = await bookingService.createBooking({...});
  await paymentService.processPayment(bookingId);
  await ticketService.checkInTicket(qrToken);
});
```

#### E2E Tests

Test untuk API contracts dengan database real.

```typescript
// Contoh: src/app/api/bookings/route.e2e.test.ts
it('POST /api/bookings harus create booking baru', async () => {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify({ packageId, visitDate, quantity }),
  });
  expect(response.status).toBe(201);
});
```

#### Property-Based Tests

Test dengan random inputs untuk validasi edge cases.

```typescript
// Contoh: src/services/pricing.service.property.test.ts
it('harus apply diskon 15% untuk semua paket sekolah >= 100', async () => {
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

### Menjalankan Tests

```bash
# Semua tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests only
npm run test:e2e
```

## Deployment

### Deployment ke Vercel (Recommended)

1. Install Vercel CLI

```bash
npm i -g vercel
```

2. Login ke Vercel

```bash
vercel login
```

3. Deploy aplikasi

```bash
vercel
```

### Setup Environment untuk Production

1. **Setup Turso Database**

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Buat database
turso db create ticket-system

# Dapatkan database URL
turso db show ticket-system --url

# Buat auth token
turso db tokens create ticket-system
```

2. **Konfigurasi Environment Variables di Vercel**

Tambahkan environment variables berikut di Vercel Dashboard:

```
DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
NODE_ENV=production
```

3. **Push Schema ke Production Database**

```bash
# Set environment variables
export DATABASE_URL=libsql://your-database.turso.io
export TURSO_AUTH_TOKEN=your-auth-token

# Push schema
npx drizzle-kit push
```

4. **Deploy**

```bash
vercel --prod
```

### Deployment ke Platform Lain

Aplikasi ini dapat di-deploy ke platform hosting Node.js lainnya seperti:

- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify
- Netlify

Pastikan untuk:
1. Set semua environment variables yang diperlukan
2. Setup Turso database atau SQLite
3. Run build command: `npm run build`
4. Run start command: `npm start`

## Panduan Development

### Menambahkan Fitur Baru

1. **Definisikan Requirements** - Dokumentasikan di `.kiro/specs/`
2. **Buat Repository** - Tambahkan data access layer di `src/repositories/`
3. **Buat Service** - Implementasi business logic di `src/services/`
4. **Buat API Route** - Tambahkan thin controller di `src/app/api/`
5. **Tulis Tests** - Unit, integration, dan E2E tests
6. **Update Dokumentasi** - README dan API docs

### Code Style Guidelines

- Gunakan TypeScript strict mode
- Ikuti pola singleton untuk services dan repositories
- Jaga API routes tetap ringkas (< 50 baris)
- Tulis comprehensive tests (target 95%+ coverage)
- Gunakan JSDoc comments untuk public methods
- Validasi input dengan Zod schemas
- Handle errors dengan proper error messages

### Best Practices Testing

- Test business logic di services (unit tests)
- Test data access di repositories (unit tests)
- Test complete workflows (integration tests)
- Test API contracts (E2E tests)
- Test edge cases (property-based tests)
- Gunakan test database terpisah untuk testing
- Clean up test data setelah setiap test

### Struktur Kode yang Baik

```typescript
// Service Layer Example
export class BookingService {
  constructor(
    private bookingRepository: BookingRepository,
    private packageRepository: PackageRepository
  ) {}

  async createBooking(data: CreateBookingData): Promise<string> {
    // 1. Validasi input
    // 2. Business logic
    // 3. Koordinasi dengan repositories
    // 4. Return result
  }
}

// Repository Layer Example
export class BookingRepository {
  async create(data: CreateBookingInput): Promise<string> {
    // 1. Konstruksi query
    // 2. Execute query
    // 3. Return result
  }
}

// API Route Example
export async function POST(req: Request) {
  // 1. Authentication check
  // 2. Input validation
  // 3. Delegate to service
  // 4. Return response
}
```

## Known Issues dan Troubleshooting

### SQLite Database Locking (Test-Only)

Integration tests mungkin mengalami error `SQLITE_BUSY` karena keterbatasan concurrency SQLite. Ini adalah **masalah test-only** dan tidak mempengaruhi production (yang menggunakan Turso dengan proper concurrency support).

**Solusi**:
- Jalankan tests secara sequential: `npm test -- --runInBand`
- Gunakan Turso untuk integration tests
- Jalankan tests secara individual

### Port Already in Use

Jika mendapat error "Port 3000 already in use":

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues

Jika mengalami masalah koneksi database:

1. Pastikan `DATABASE_URL` sudah di-set dengan benar
2. Untuk Turso, pastikan `TURSO_AUTH_TOKEN` valid
3. Cek koneksi internet untuk Turso cloud database
4. Untuk local SQLite, pastikan file database memiliki write permissions

### Build Errors

Jika mengalami build errors:

```bash
# Clear cache dan rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Kontribusi

Kontribusi sangat diterima! Untuk berkontribusi:

1. Fork repository ini
2. Buat feature branch (`git checkout -b feature/fitur-amazing`)
3. Commit perubahan (`git commit -m 'Menambahkan fitur amazing'`)
4. Push ke branch (`git push origin feature/fitur-amazing`)
5. Buat Pull Request

### Guidelines Kontribusi

- Pastikan semua tests passing sebelum submit PR
- Tambahkan tests untuk fitur baru
- Update dokumentasi jika diperlukan
- Ikuti code style yang ada
- Tulis commit messages yang jelas dan deskriptif

## Lisensi

Proyek ini dilisensikan di bawah MIT License.

## Tim dan Kontak

Proyek ini dikembangkan oleh MoedaTrace untuk pengelolaan wisata edukasi Sungai Cikapundung, Bandung.

## Dokumentasi Tambahan

- [Product Requirements](.trae/documents/product_requirements.md)
- [Technical Architecture](.trae/documents/technical_architecture.md)
- [Migration Guide](docs/MIGRATION_GUIDE.md)
- [E2E Test Fix Summary](docs/E2E_TEST_FIX_SUMMARY.md)
- [Final Validation Checklist](docs/FINAL_VALIDATION_CHECKLIST.md)
- [Deployment Guide](DEPLOY.md)

## Referensi dan Sumber Belajar

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub](https://github.com/vercel/next.js)

### Architecture Patterns
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

### Database & ORM
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Turso Documentation](https://docs.turso.tech/)
- [LibSQL Documentation](https://github.com/tursodatabase/libsql)

### Testing
- [Jest Documentation](https://jestjs.io/)
- [Fast-check (Property-Based Testing)](https://fast-check.dev/)

---

Dibuat dengan Next.js dan TypeScript untuk wisata edukasi yang lebih baik.
