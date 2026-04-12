import { db } from '@/db';
import { ticketPackages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Package } from './types';

/**
 * Repository for ticket package data access
 * Encapsulates all database queries for packages
 * 
 * Validates: Requirements 3.1, 3.6
 */
export class PackageRepository {
  /**
   * Find package by ID
   * 
   * @param id - Package ID
   * @returns Package or null if not found
   */
  async findById(id: string): Promise<Package | null> {
    const result = await db.query.ticketPackages.findFirst({
      where: eq(ticketPackages.id, id),
    });

    return result ?? null;
  }

  /**
   * Find all packages
   * 
   * @returns Array of all packages
   */
  async findAll(): Promise<Package[]> {
    return await db.query.ticketPackages.findMany();
  }

  /**
   * Find all active packages
   * 
   * @returns Array of active packages
   */
  async findActive(): Promise<Package[]> {
    return await db.query.ticketPackages.findMany({
      where: eq(ticketPackages.is_active, true),
    });
  }
}

/**
 * Singleton instance for use in services and API routes
 */
export const packageRepository = new PackageRepository();
