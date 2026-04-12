/**
 * Unit tests for UserRepository
 * 
 * Validates: Requirement 3.5
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UserRepository } from './user.repository';
import type { User } from './types';

// Mock the database module
jest.mock('@/db', () => ({
  db: {
    query: {
      users: {
        findFirst: jest.fn(),
      },
    },
  },
}));

// Import the mocked db after mocking
import { db } from '@/db';

describe('UserRepository', () => {
  let repository: UserRepository;
  const mockDb = db as any;

  beforeEach(() => {
    repository = new UserRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user when it exists', async () => {
      // Arrange
      const mockUser: User = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockDb.query.users.findFirst = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = await repository.findById('user-1');

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockDb.query.users.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      mockDb.query.users.findFirst = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await repository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
      expect(mockDb.query.users.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByEmail', () => {
    it('should return user when it exists', async () => {
      // Arrange
      const mockUser: User = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockDb.query.users.findFirst = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = await repository.findByEmail('test@example.com');

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockDb.query.users.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      mockDb.query.users.findFirst = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await repository.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
      expect(mockDb.query.users.findFirst).toHaveBeenCalledTimes(1);
    });
  });
});
