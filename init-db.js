const { createClient } = require('@libsql/client');

async function initDB() {
  const client = createClient({ url: 'file:local.db' });

  console.log('Mengatur Busy Timeout dan WAL mode secara permanen...');
  await client.execute('PRAGMA busy_timeout=10000;'); // 10 detik
  await client.execute('PRAGMA journal_mode=WAL;');

  console.log('Membuat tabel users...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Membuat tabel ticket_packages...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS ticket_packages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      base_price INTEGER NOT NULL,
      promo_price INTEGER,
      quota_per_day INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Membuat tabel bookings...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      visit_date TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Membuat tabel qr_tickets...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS qr_tickets (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      qr_token TEXT NOT NULL UNIQUE,
      is_checked_in BOOLEAN NOT NULL DEFAULT 0,
      checked_in_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Membuat tabel payments...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      external_ref TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Semua tabel berhasil dibuat!');
}

initDB();