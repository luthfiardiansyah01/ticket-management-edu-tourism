import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, like, and, sql } from 'drizzle-orm';
import type { UmkmProduct, CreateUmkmProductInput, UpdateUmkmProductInput } from './types';

type PaginatedUmkmProducts = {
  data: UmkmProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

/**
 * Repository for UMKM product data access
 * 
 * Follows the same patterns as booking.repository.ts and package.repository.ts
 * Provides full CRUD operations with filtering and search support
 */
export const umkmProductRepository = {
  buildFilters(options?: {
    kategori_id?: string;
    search?: string;
    activeOnly?: boolean;
  }) {
    const conditions = [];

    if (options?.kategori_id) {
      conditions.push(eq(products.kategori_id, options.kategori_id));
    }

    if (options?.search) {
      conditions.push(like(products.nama_produk, `%${options.search}%`));
    }

    if (options?.activeOnly) {
      conditions.push(eq(products.status_produk, 'active'));
    }

    return conditions;
  },

  /**
   * Retrieve all UMKM products with optional filters
   */
  async findAll(options?: {
    kategori_id?: string;
    search?: string;
    activeOnly?: boolean;
  }): Promise<UmkmProduct[]> {
    const conditions = this.buildFilters(options);

    if (conditions.length === 0) {
      return db.select().from(products).orderBy(products.created_at);
    }

    return db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(products.created_at);
  },

  /**
   * Retrieve paginated UMKM products with optional filters
   */
  async findPaginated(options?: {
    page?: number;
    limit?: number;
    kategori_id?: string;
    search?: string;
    activeOnly?: boolean;
  }): Promise<PaginatedUmkmProducts> {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(Math.max(1, options?.limit ?? 10), 100);
    const offset = (page - 1) * limit;
    const conditions = this.buildFilters(options);

    const itemsQuery = conditions.length === 0
      ? db.select().from(products)
      : db.select().from(products).where(and(...conditions));

    const countQuery = conditions.length === 0
      ? db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(products)
      : db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(products).where(and(...conditions));

    const [data, totalResult] = await Promise.all([
      itemsQuery.orderBy(products.created_at).limit(limit).offset(offset),
      countQuery,
    ]);

    const total = totalResult[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },

  /**
   * Find a single UMKM product by ID
   */
  async findById(id: string): Promise<UmkmProduct | null> {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return result[0] ?? null;
  },

  /**
   * Create a new UMKM product
   */
  async create(input: CreateUmkmProductInput): Promise<UmkmProduct> {
    const result = await db
      .insert(products)
      .values({
        nama_produk: input.nama_produk,
        deskripsi: input.deskripsi,
        harga: input.harga,
        stok: input.stok ?? 0,
        kategori_id: input.kategori_id,
        gambar: input.gambar ?? null,
        status_produk: input.status_produk ?? 'active',
      })
      .returning();

    return result[0] as UmkmProduct;
  },

  /**
   * Update an existing UMKM product by ID
   */
  async update(id: string, input: UpdateUmkmProductInput): Promise<UmkmProduct | null> {
    const updateData: Record<string, unknown> = {};

    if (input.nama_produk !== undefined) updateData.nama_produk = input.nama_produk;
    if (input.deskripsi !== undefined) updateData.deskripsi = input.deskripsi;
    if (input.harga !== undefined) updateData.harga = input.harga;
    if (input.stok !== undefined) updateData.stok = input.stok;
    if (input.kategori_id !== undefined) updateData.kategori_id = input.kategori_id;
    if (input.gambar !== undefined) updateData.gambar = input.gambar;
    if (input.status_produk !== undefined) updateData.status_produk = input.status_produk;

    // Always update the updated_at timestamp
    updateData.updated_at = sql`CURRENT_TIMESTAMP`;

    const result = await db
      .update(products)
      .set(updateData as never)
      .where(eq(products.id, id))
      .returning();

    return result[0] ?? null;
  },

  /**
   * Delete a UMKM product by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });

    return result.length > 0;
  },

  /**
   * Get product count by category for dashboard statistics
   */
  async getCountByCategory(): Promise<{ category: string; count: number }[]> {
    const result = await db
      .select({
        category: products.kategori_id,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(products)
      .where(eq(products.status_produk, 'active'))
      .groupBy(products.kategori_id);

    return result;
  },
};
