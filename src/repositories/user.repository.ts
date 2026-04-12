import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from './types';

/**
 * Repository for user data access
 * Encapsulates all database queries for users
 * 
 * Validates: Requirement 3.5
 */
export class UserRepository {
  /**
   * Find user by ID
   * 
   * @param id - User ID
   * @returns User or null if not found
   */
  async findById(id: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    return result ?? null;
  }

  /**
   * Find user by email
   * 
   * @param email - User email
   * @returns User or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    return result ?? null;
  }
}

/**
 * Singleton instance for use in services and API routes
 */
export const userRepository = new UserRepository();
