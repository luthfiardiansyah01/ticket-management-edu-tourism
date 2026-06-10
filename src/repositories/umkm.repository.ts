import { db } from '@/db';
import { umkmProducts } from '@/db/schema';
import { eq, like, and, sql } from 'drizzle-orm';
import type { UmkmProduct, CreateUmkmProductInput, UpdateUmkmProductInput } from './types';

/**
 * Repository for UMKM product data access
 * 
 * Follows the same patterns as booking.repository.ts and package.repository.ts
 * Provides full CRUD operations with filtering and search support
 */
export const umkmProductRepository = {
  /**
   * Retrieve all UMKM products with optional filters
   */
  async findAll(options?: {
    category?: string;
    search?: string;
    activeOnly?: boolean;
  }): Promise<UmkmProduct[]> {
    const conditions = [];

    if (options?.category) {
      conditions.push(eq(umkmProducts.category, options.category as UmkmProduct['category']));
    }

    if (options?.search) {
      conditions.push(like(umkmProducts.name, `%${options.search}%`));
    }

    if (options?.activeOnly) {
      conditions.push(eq(umkmProducts.is_active, true));
    }

    if (conditions.length === 0) {
      return db.select().from(umkmProducts).orderBy(umkmProducts.created_at);
    }

    return db
      .select()
      .from(umkmProducts)
      .where(and(...conditions))
      .orderBy(umkmProducts.created_at);
  },

  /**
   * Find a single UMKM product by ID
   */
  async findById(id: string): Promise<UmkmProduct | null> {
    const result = await db
      .select()
      .from(umkmProducts)
      .where(eq(umkmProducts.id, id))
      .limit(1);

    return result[0] ?? null;
  },

  /**
   * Create a new UMKM product
   */
  async create(input: CreateUmkmProductInput): Promise<UmkmProduct> {
    const result = await db
      .insert(umkmProducts)
      .values({
        name: input.name,
        description: input.description,
        price: input.price,
        category: input.category,
        stock: input.stock,
        image_url: input.image_url ?? null,
      })
      .returning();

    return result[0] as UmkmProduct;
  },

  /**
   * Update an existing UMKM product by ID
   */
  async update(id: string, input: UpdateUmkmProductInput): Promise<UmkmProduct | null> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.stock !== undefined) updateData.stock = input.stock;
    if (input.image_url !== undefined) updateData.image_url = input.image_url;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    // Always update the updated_at timestamp
    updateData.updated_at = sql`CURRENT_TIMESTAMP`;

    const result = await db
      .update(umkmProducts)
      .set(updateData as never)
      .where(eq(umkmProducts.id, id))
      .returning();

    return result[0] ?? null;
  },

  /**
   * Delete a UMKM product by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(umkmProducts)
      .where(eq(umkmProducts.id, id))
      .returning({ id: umkmProducts.id });

    return result.length > 0;
  },

  /**
   * Get product count by category for dashboard statistics
   */
  async getCountByCategory(): Promise<{ category: string; count: number }[]> {
    const result = await db
      .select({
        category: umkmProducts.category,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(umkmProducts)
      .where(eq(umkmProducts.is_active, true))
      .groupBy(umkmProducts.category);

    return result;
  },
};
