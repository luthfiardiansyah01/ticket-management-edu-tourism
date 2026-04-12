/**
 * Unit tests for PackageRepository
 * 
 * Validates: Requirements 3.1, 3.6
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PackageRepository } from './package.repository';
import type { Package } from './types';

// Mock the database module
jest.mock('@/db', () => ({
  db: {
    query: {
      ticketPackages: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    },
  },
}));

// Import the mocked db after mocking
import { db } from '@/db';

describe('PackageRepository', () => {
  let repository: PackageRepository;
  const mockDb = db as jest.Mocked<typeof db>;

  beforeEach(() => {
    repository = new PackageRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return package when it exists', async () => {
      // Arrange
      const mockPackage: Package = {
        id: 'pkg-1',
        name: 'Personal Package',
        category: 'personal',
        description: 'A personal ticket package',
        base_price: 50000,
        promo_price: null,
        quota_per_day: 100,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockDb.query.ticketPackages.findFirst = jest.fn().mockResolvedValue(mockPackage);

      // Act
      const result = await repository.findById('pkg-1');

      // Assert
      expect(result).toEqual(mockPackage);
      expect(mockDb.query.ticketPackages.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should return null when package does not exist', async () => {
      // Arrange
      mockDb.query.ticketPackages.findFirst = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await repository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
      expect(mockDb.query.ticketPackages.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all packages', async () => {
      // Arrange
      const mockPackages: Package[] = [
        {
          id: 'pkg-1',
          name: 'Personal Package',
          category: 'personal',
          description: 'A personal ticket package',
          base_price: 50000,
          promo_price: null,
          quota_per_day: 100,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'pkg-2',
          name: 'School Package',
          category: 'school',
          description: 'A school ticket package',
          base_price: 40000,
          promo_price: 35000,
          quota_per_day: 200,
          is_active: false,
          created_at: '2024-01-02T00:00:00Z',
        },
        {
          id: 'pkg-3',
          name: 'Premium Package',
          category: 'personal',
          description: 'A premium ticket package',
          base_price: 75000,
          promo_price: null,
          quota_per_day: 50,
          is_active: true,
          created_at: '2024-01-03T00:00:00Z',
        },
      ];

      mockDb.query.ticketPackages.findMany = jest.fn().mockResolvedValue(mockPackages);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual(mockPackages);
      expect(result).toHaveLength(3);
      expect(mockDb.query.ticketPackages.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no packages exist', async () => {
      // Arrange
      mockDb.query.ticketPackages.findMany = jest.fn().mockResolvedValue([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockDb.query.ticketPackages.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findActive', () => {
    it('should return only active packages', async () => {
      // Arrange
      const mockActivePackages: Package[] = [
        {
          id: 'pkg-1',
          name: 'Personal Package',
          category: 'personal',
          description: 'A personal ticket package',
          base_price: 50000,
          promo_price: null,
          quota_per_day: 100,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'pkg-3',
          name: 'Premium Package',
          category: 'personal',
          description: 'A premium ticket package',
          base_price: 75000,
          promo_price: null,
          quota_per_day: 50,
          is_active: true,
          created_at: '2024-01-03T00:00:00Z',
        },
      ];

      mockDb.query.ticketPackages.findMany = jest.fn().mockResolvedValue(mockActivePackages);

      // Act
      const result = await repository.findActive();

      // Assert
      expect(result).toEqual(mockActivePackages);
      expect(result).toHaveLength(2);
      expect(result.every(pkg => pkg.is_active === true)).toBe(true);
      expect(mockDb.query.ticketPackages.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no active packages exist', async () => {
      // Arrange
      mockDb.query.ticketPackages.findMany = jest.fn().mockResolvedValue([]);

      // Act
      const result = await repository.findActive();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockDb.query.ticketPackages.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
