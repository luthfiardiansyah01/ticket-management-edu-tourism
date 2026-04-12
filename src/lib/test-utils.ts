import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { 
  qrTickets, 
  payments 
} from '@/db/schema';

/**
 * Retry utility untuk error jaringan, BUKAN untuk SQLITE_BUSY.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  initialDelay = 100
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = (error.message || error.toString() || '').toLowerCase();
      
      if (errorMessage.includes('sqlite_busy') || errorMessage.includes('database is locked')) {
        throw error;
      }

      if (i === retries - 1) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, i) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * FUNGSI INI DILARANG KERAS DIUBAH.
 * Hanya menghapus tabel daun paling ujung (Transaksi).
 * DILARANG MENGHAPUS users, ticketPackages, atau bookings.
 * Karena data tersebut dibuat di beforeAll dan harus tetap ada.
 */
export async function cleanDatabase() {
  await db.delete(qrTickets);
  await db.delete(payments);
  // SISAHNYA DILARANG DITAMBAHKAN!
}