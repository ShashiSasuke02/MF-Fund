/**
 * Unit Tests for User Model
 * Tests user CRUD operations, validation, and data integrity
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Define mock functions first
const mockRun = jest.fn();
const mockQueryOne = jest.fn();
const mockQuery = jest.fn();
const mockGetDatabase = jest.fn();
const mockInitializeDatabase = jest.fn();
const mockCloseDatabase = jest.fn();
const mockEscape = jest.fn(val => val);

// Native ESM Mocking
jest.unstable_mockModule('../../../src/db/database.js', () => ({
  run: mockRun,
  queryOne: mockQueryOne,
  query: mockQuery,
  getDatabase: mockGetDatabase,
  initializeDatabase: mockInitializeDatabase,
  closeDatabase: mockCloseDatabase,
  saveDatabase: jest.fn(),
  escape: mockEscape,
  default: {
    run: mockRun,
    queryOne: mockQueryOne,
    query: mockQuery,
    getDatabase: mockGetDatabase,
    saveDatabase: jest.fn(),
    initializeDatabase: mockInitializeDatabase,
    closeDatabase: mockCloseDatabase,
    escape: mockEscape
  }
}));

// Import the module under test dynamically
const { userModel } = await import('../../../src/models/user.model.js');

// Aliasing for test compatibility
const run = mockRun;
const queryOne = mockQueryOne;

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
      // 1. User Insert
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });
      // 2. Account Insert
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });
      // 3. Ledger Insert
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });

      const result = await userModel.create(validUserData);

      expect(result).toEqual({
        id: 1,
        full_name: 'John Doe',
        email_id: 'john@example.com',
        fullName: 'John Doe',
        emailId: 'john@example.com'
      });
      expect(run).toHaveBeenCalledTimes(3);
    });

    it('should create demo account with ₹1,00,00,000 balance', async () => {
      // 1. User Insert (Returns ID 5)
      run.mockResolvedValueOnce({ lastInsertRowid: 5, insertId: 5, changes: 1 });
      // 2. Account Insert
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });
      // 3. Ledger Insert
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });

      await userModel.create(validUserData);

      expect(run).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO demo_accounts'),
        [5, 10000000.00]
      );
    });

    it('should reject user creation with userId = 0', async () => {
      // User Insert fails to return valid ID
      run.mockResolvedValueOnce({ lastInsertRowid: 0, insertId: 0, changes: 0 });

      await expect(userModel.create(validUserData)).rejects.toThrow(
        'Invalid user ID'
      );
      // specific assertion to ensure it stopped there
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      run.mockRejectedValueOnce(new Error('Database constraint violation'));

      await expect(userModel.create(validUserData)).rejects.toThrow(
        'Database constraint violation'
      );
    });

    it('should trim whitespace from user data', async () => {
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });

      const dataWithSpaces = {
        ...validUserData,
        fullName: '  John Doe  ',
        username: '  johndoe  '
      };

      await userModel.create(dataWithSpaces);

      expect(run).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.arrayContaining(['John Doe', 'john@example.com', 'john@example.com', expect.any(String)])
      );
    });
  });

  describe('findByUsername', () => {
    it('should find existing user by username', async () => {
      const mockUser = {
        id: 1,
        username: 'johndoe',
        full_name: 'John Doe',
        email_id: 'john@example.com',
        password_hash: '$2b$10$hashedpassword'
      };
      queryOne.mockResolvedValueOnce(mockUser);

      const result = await userModel.findByUsername('johndoe');

      expect(result).toEqual(mockUser);
      expect(queryOne).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(email_id)'),
        ['johndoe']
      );
    });

    it('should return null for non-existent user', async () => {
      queryOne.mockResolvedValueOnce(null);

      const result = await userModel.findByUsername('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle case-sensitive username lookup', async () => {
      queryOne.mockResolvedValueOnce(null);

      await userModel.findByUsername('JohnDoe');

      expect(queryOne).toHaveBeenCalledWith(
        expect.any(String),
        ['johndoe'] // Normalized to lowercase email lookup
      );
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 1,
        email_id: 'john@example.com'
      };
      queryOne.mockResolvedValueOnce(mockUser);

      const result = await userModel.findByEmail('john@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should handle email lookup case-insensitively', async () => {
      queryOne.mockResolvedValueOnce({ id: 1 });

      await userModel.findByEmail('JOHN@EXAMPLE.COM');

      expect(queryOne).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find user by valid ID', async () => {
      const mockUser = { id: 1, username: 'johndoe' };
      queryOne.mockResolvedValueOnce(mockUser);

      const result = await userModel.findById(1);

      expect(result).toEqual(mockUser);
      expect(queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ?'),
        [1]
      );
    });

    it('should return null for invalid ID', async () => {
      queryOne.mockResolvedValueOnce(null);

      const result = await userModel.findById(999);

      expect(result).toBeNull();
    });

    it('should reject userId <= 0', async () => {
      const result1 = await userModel.findById(0);
      const result2 = await userModel.findById(-1);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('usernameExists', () => {
    it('should return true for existing username', async () => {
      queryOne.mockResolvedValueOnce({ count: 1 });

      const result = await userModel.usernameExists('johndoe');

      expect(result).toBe(true);
    });

    it('should return false for non-existent username', async () => {
      queryOne.mockResolvedValueOnce({ count: 0 });

      const result = await userModel.usernameExists('newuser');

      expect(result).toBe(false);
    });

    it('should handle null query result', async () => {
      queryOne.mockResolvedValueOnce(null);

      const result = await userModel.usernameExists('test');

      expect(result).toBe(false);
    });
  });

  describe('emailExists', () => {
    it('should return true for existing email', async () => {
      queryOne.mockResolvedValueOnce({ count: 1 });

      const result = await userModel.emailExists('existing@example.com');

      expect(result).toBe(true);
    });

    it('should return false for new email', async () => {
      queryOne.mockResolvedValueOnce({ count: 0 });

      const result = await userModel.emailExists('new@example.com');

      expect(result).toBe(false);
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle empty strings', async () => {
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });

      const invalidData = {
        fullName: '',
        emailId: '',
        username: '',
        passwordHash: '$2b$10$hash'
      };

      await userModel.create(invalidData);

      expect(run).toHaveBeenCalled();
    });

    it('should handle special characters in names', async () => {
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });

      const specialCharsData = {
        fullName: "O'Brien-Smith",
        emailId: 'test+tag@example.com',
        username: 'user_name123',
        passwordHash: '$2b$10$hash'
      };

      await userModel.create(specialCharsData);

      expect(run).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.arrayContaining(["O'Brien-Smith"])
      );
    });

    it('should handle very long inputs', async () => {
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });
      run.mockResolvedValueOnce({ lastInsertRowid: 1, insertId: 1, changes: 1 });

      const longData = {
        fullName: 'A'.repeat(255),
        emailId: 'very.long.email.address@example.com',
        username: 'username123',
        passwordHash: '$2b$10$hash'
      };

      await userModel.create(longData);

      expect(run).toHaveBeenCalled();
    });
  });
});
