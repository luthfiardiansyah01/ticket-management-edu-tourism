import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator'; // Import migrator resmi
import * as schema from './schema';

const isTestEnv = process.env.NODE_ENV === 'test';

// Gunakan file test.db statis. Jangan dihapus, biarkan SQLite yang mengatur.
const url = isTestEnv 
  ? 'file:test.db' 
  : (process.env.DATABASE_URL || 'file:local.db');

const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  authToken,
});

export const db = drizzle({ client, schema });

if (isTestEnv) {
  // [TAMBAHKAN INI] - Paksa hapus database test yang corrupt/terkunci
  const fs = require('fs');
  try {
    if (fs.existsSync('test.db')) fs.unlinkSync('test.db');
    if (fs.existsSync('test.db-wal')) fs.unlinkSync('test.db-wal');
    if (fs.existsSync('test.db-shm')) fs.unlinkSync('test.db-shm');
    console.log('[Test DB] File test.db berhasil dihapus paksa.');
  } catch (err) {
    console.error('[Test DB] Gagal menghapus file test.db secara manual. Pastikan TIDAK ADA `npm run dev` atau VS Code yang berjalan!');
  }
}

let dbInitPromise: Promise<unknown>;

if (isTestEnv) {
  dbInitPromise = Promise.all([
    client.execute('PRAGMA journal_mode=WAL;'),
    client.execute('PRAGMA busy_timeout=5000;'),
    client.execute('PRAGMA synchronous=NORMAL;')
  ])
  .then(async () => {
    // Jalankan migrasi SQL untuk membuat/memperbarui tabel secara otomatis
    console.log(`[Test DB] Menjalankan migrasi ke ${url}...`);
    await migrate(db, { migrationsFolder: './drizzle' }); // Sesuaikan nama foldernya jika beda
    console.log(`[Test DB] Migrasi selesai.`);
  })
  .catch((err) => {
    console.error('[Test DB] Gagal migrate:', err);
    throw err;
  });
} else {
  dbInitPromise = Promise.resolve();
}

export const waitForDb = () => dbInitPromise;