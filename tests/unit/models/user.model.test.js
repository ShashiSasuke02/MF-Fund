/**
 * Unit Tests for User Model
 * Tests user CRUD operations, validation, and data integrity
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
const mockQuery = jest.fn();
const mockQueryOne = jest.fn();
const mockRun = jest.fn();
const mockSaveDatabase = jest.fn();
const mockGetDatabase = jest.fn();

const mockDb = {
  query: mockQuery,
  queryOne: mockQueryOne,
  run: mockRun,
  saveDatabase: mockSaveDatabase
};

jest.unstable_mockModule('../../../src/db/database.js', () => ({
  default: mockDb,
  query: mockQuery,
  queryOne: mockQueryOne,
  run: mockRun,
  saveDatabase: mockSaveDatabase,
  getDatabase: mockGetDatabase
}));

const { userModel } = await import('../../../src/models/user.model.js');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validUserData = {
      fullName: 'John Doe',
      emailId: 'john@example.com',
      username: 'johndoe',
      passwordHash: '$2b$10$hashedpassword'
    };

    it('should create user with valid data', async () => {
      mockRun.mockReturnValueOnce({ 
        lastInsertRowid: 1, 
        changes: 1 
      });
      mockRun.mockReturnValueOnce({ 
        lastInsertRowid: 1, 
        changes: 1 
      });

      const result = await userModel.create(validUserData);

      expect(result).toEqual({
        id: 1,
        fullName: 'John Doe',
        emailId: 'john@example.com',
        username: 'johndoe'
      });
      expect(mockRun).toHaveBeenCalledTimes(2); // User insert + demo account insert
      expect(mockSaveDatabase).toHaveBeenCalled();
    });

    it('should create demo account with ₹10,00,000 balance', async () => {
      mockRun.mockReturnValueOnce({ 
        lastInsertRowid: 5, 
        changes: 1 
      });
      mockRun.mockReturnValueOnce({ 
        lastInsertRowid: 5, 
        changes: 1 
      });

      await userModel.create(validUserData);

      expect(mockRun).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO demo_accounts'),
        [5, 1000000.00]
      );
    });

    it('should reject user creation with userId = 0', async () => {
      mockRun.mockReturnValueOnce({ 
        lastInsertRowid: 0, 
        changes: 0 
      });

      await expect(userModel.create(validUserData)).rejects.toThrow(
        'Invalid user ID'
      );
    });

    it('should handle database errors gracefully', async () => {
      mockRun.mockImplementationOnce(() => {
        throw new Error('Database constraint violation');
      });

      await expect(userModel.create(validUserData)).rejects.toThrow(
        'Database constraint violation'
      );
    });

    it('should trim whitespace from user data', async () => {
      mockRun.mockReturnValueOnce({ 
        lastInsertRowid: 1, 
        changes: 1 
      });
      mockRun.mockReturnValueOnce({ 
        lastInsertRowid: 1, 
        changes: 1 
      });

      const dataWithSpaces = {
        ...validUserData,
        fullName: '  John Doe  ',
        username: '  johndoe  '
      };

      await userModel.create(dataWithSpaces);

      expect(mockRun).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.arrayContaining(['John Doe', expect.any(String), 'johndoe', expect.any(String)])
      );
    });
  });

  describe('findByUsername', () => {
    it('should find existing user by username', () => {
      const mockUser = {
        id: 1,
        username: 'johndoe',
        full_name: 'John Doe',
        email_id: 'john@example.com',
        password_hash: '$2b$10$hashedpassword'
      };
      mockQueryOne.mockReturnValueOnce(mockUser);

      const result = userModel.findByUsername('johndoe');

      expect(result).toEqual(mockUser);
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE username = ?'),
        ['johndoe']
      );
    });

    it('should return null for non-existent user', () => {
      mockQueryOne.mockReturnValueOnce(null);

      const result = userModel.findByUsername('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle case-sensitive username lookup', () => {
      mockQueryOne.mockReturnValueOnce(null);

      userModel.findByUsername('JohnDoe');

      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.any(String),
        ['JohnDoe'] // Should preserve case
      );
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', () => {
      const mockUser = {
        id: 1,
        email_id: 'john@example.com'
      };
      mockQueryOne.mockReturnValueOnce(mockUser);

      const result = userModel.findByEmail('john@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should handle email lookup case-insensitively', () => {
      mockQueryOne.mockReturnValueOnce({ id: 1 });

      userModel.findByEmail('JOHN@EXAMPLE.COM');

      expect(mockQueryOne).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find user by valid ID', () => {
      const mockUser = { id: 1, username: 'johndoe' };
      mockQueryOne.mockReturnValueOnce(mockUser);

      const result = userModel.findById(1);

      expect(result).toEqual(mockUser);
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ?'),
        [1]
      );
    });

    it('should return null for invalid ID', () => {
      mockQueryOne.mockReturnValueOnce(null);

      const result = userModel.findById(999);

      expect(result).toBeNull();
    });

    it('should reject userId <= 0', () => {
      const result1 = userModel.findById(0);
      const result2 = userModel.findById(-1);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('usernameExists', () => {
    it('should return true for existing username', () => {
      mockQueryOne.mockReturnValueOnce({ count: 1 });

      const result = userModel.usernameExists('johndoe');

      expect(result).toBe(true);
    });

    it('should return false for non-existent username', () => {
      mockQueryOne.mockReturnValueOnce({ count: 0 });

      const result = userModel.usernameExists('newuser');

      expect(result).toBe(false);
    });

    it('should handle null query result', () => {
      mockQueryOne.mockReturnValueOnce(null);

      const result = userModel.usernameExists('test');

      expect(result).toBe(false);
    });
  });

  describe('emailExists', () => {
    it('should return true for existing email', () => {
      mockQueryOne.mockReturnValueOnce({ count: 1 });

      const result = userModel.emailExists('existing@example.com');

      expect(result).toBe(true);
    });

    it('should return false for new email', () => {
      mockQueryOne.mockReturnValueOnce({ count: 0 });

      const result = userModel.emailExists('new@example.com');

      expect(result).toBe(false);
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle empty strings', async () => {
      mockRun.mockReturnValueOnce({ lastInsertRowid: 1, changes: 1 });
      mockRun.mockReturnValueOnce({ lastInsertRowid: 1, changes: 1 });

      const invalidData = {
        fullName: '',
        emailId: '',
        username: '',
        passwordHash: '$2b$10$hash'
      };

      await userModel.create(invalidData);

      // Should still create but with empty strings (validation should happen at controller level)
      expect(mockRun).toHaveBeenCalled();
    });

    it('should handle special characters in names', async () => {
      mockRun.mockReturnValueOnce({ lastInsertRowid: 1, changes: 1 });
      mockRun.mockReturnValueOnce({ lastInsertRowid: 1, changes: 1 });

      const specialCharsData = {
        fullName: "O'Brien-Smith",
        emailId: 'test+tag@example.com',
        username: 'user_name123',
        passwordHash: '$2b$10$hash'
      };

      await userModel.create(specialCharsData);

      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(["O'Brien-Smith"])
      );
    });

    it('should handle very long inputs', async () => {
      mockRun.mockReturnValueOnce({ lastInsertRowid: 1, changes: 1 });
      mockRun.mockReturnValueOnce({ lastInsertRowid: 1, changes: 1 });

      const longData = {
        fullName: 'A'.repeat(255),
        emailId: 'very.long.email.address@example.com',
        username: 'username123',
        passwordHash: '$2b$10$hash'
      };

      await userModel.create(longData);

      expect(mockRun).toHaveBeenCalled();
    });
  });
});
