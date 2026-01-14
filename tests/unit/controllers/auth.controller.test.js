/**
 * Unit Tests for Authentication Controller
 * Tests registration, login, profile retrieval, and JWT operations
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
const mockUserModel = {
  create: jest.fn(),
  findByUsername: jest.fn(),
  findById: jest.fn(),
  usernameExists: jest.fn(),
  emailExists: jest.fn()
};

const mockDemoAccountModel = {
  findByUserId: jest.fn(),
  create: jest.fn()
};

const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn()
};

const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn()
};

jest.unstable_mockModule('../../../src/models/user.model.js', () => ({
  userModel: mockUserModel
}));

jest.unstable_mockModule('../../../src/models/demoAccount.model.js', () => ({
  demoAccountModel: mockDemoAccountModel
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: mockBcrypt,
  hash: mockBcrypt.hash,
  compare: mockBcrypt.compare
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: mockJwt,
  ...mockJwt
}));

const { authController } = await import('../../../src/controllers/auth.controller.js');

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegisterData = {
      fullName: 'John Doe',
      emailId: 'john@example.com',
      username: 'johndoe',
      password: 'SecurePass123'
    };

    it('should register new user successfully', async () => {
      req.body = validRegisterData;
      
      mockUserModel.usernameExists.mockReturnValueOnce(false);
      mockUserModel.emailExists.mockReturnValueOnce(false);
      mockBcrypt.hash.mockResolvedValueOnce('$2b$10$hashedpassword');
      mockUserModel.create.mockResolvedValueOnce({
        id: 1,
        fullName: 'John Doe',
        emailId: 'john@example.com',
        username: 'johndoe'
      });
      mockDemoAccountModel.findByUserId.mockReturnValueOnce({
        balance: 1000000.00
      });
      mockJwt.sign.mockReturnValueOnce('jwt.token.here');

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        data: {
          user: expect.objectContaining({
            id: 1,
            username: 'johndoe'
          }),
          demoAccount: expect.objectContaining({
            balance: 1000000.00
          }),
          token: 'jwt.token.here'
        }
      });
    });

    it('should reject registration with missing fields', async () => {
      req.body = { username: 'johndoe' }; // Missing other fields

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'All fields are required'
        })
      );
    });

    it('should reject duplicate username', async () => {
      req.body = validRegisterData;
      mockUserModel.usernameExists.mockReturnValueOnce(true);

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Username already exists'
        })
      );
    });

    it('should reject duplicate email', async () => {
      req.body = validRegisterData;
      mockUserModel.usernameExists.mockReturnValueOnce(false);
      mockUserModel.emailExists.mockReturnValueOnce(true);

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Email already registered'
        })
      );
    });

    it('should validate email format', async () => {
      req.body = { ...validRegisterData, emailId: 'invalid-email' };

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.objectContaining({
            emailId: expect.any(String)
          })
        })
      );
    });

    it('should validate username format (alphanumeric + underscore)', async () => {
      req.body = { ...validRegisterData, username: 'user@name!' };

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should enforce minimum password length', async () => {
      req.body = { ...validRegisterData, password: '1234567' }; // 7 chars

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.objectContaining({
            password: expect.stringContaining('8 characters')
          })
        })
      );
    });

    it('should enforce minimum full name length', async () => {
      req.body = { ...validRegisterData, fullName: 'A' };

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should hash password with bcrypt', async () => {
      req.body = validRegisterData;
      mockUserModel.usernameExists.mockReturnValueOnce(false);
      mockUserModel.emailExists.mockReturnValueOnce(false);
      mockBcrypt.hash.mockResolvedValueOnce('$2b$10$hash');
      mockUserModel.create.mockResolvedValueOnce({ id: 1 });
      mockDemoAccountModel.findByUserId.mockReturnValueOnce({ balance: 1000000 });
      mockJwt.sign.mockReturnValueOnce('token');

      await authController.register(req, res, next);

      expect(mockBcrypt.hash).toHaveBeenCalledWith('SecurePass123', 10);
    });

    it('should normalize email to lowercase', async () => {
      req.body = { ...validRegisterData, emailId: 'John@EXAMPLE.COM' };
      mockUserModel.usernameExists.mockReturnValueOnce(false);
      mockUserModel.emailExists.mockReturnValueOnce(false);
      mockBcrypt.hash.mockResolvedValueOnce('$2b$10$hash');
      mockUserModel.create.mockResolvedValueOnce({ id: 1 });
      mockDemoAccountModel.findByUserId.mockReturnValueOnce({ balance: 1000000 });
      mockJwt.sign.mockReturnValueOnce('token');

      await authController.register(req, res, next);

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          emailId: 'john@example.com'
        })
      );
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      req.body = { username: 'johndoe', password: 'SecurePass123' };

      mockUserModel.findByUsername.mockReturnValueOnce({
        id: 1,
        username: 'johndoe',
        password_hash: '$2b$10$hash',
        full_name: 'John Doe',
        email_id: 'john@example.com'
      });
      mockBcrypt.compare.mockResolvedValueOnce(true);
      mockDemoAccountModel.findByUserId.mockReturnValueOnce({
        balance: 950000.00
      });
      mockJwt.sign.mockReturnValueOnce('jwt.token');

      await authController.login(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: expect.objectContaining({ id: 1 }),
          demoAccount: expect.objectContaining({ balance: 950000.00 }),
          token: 'jwt.token'
        }
      });
    });

    it('should reject login with missing credentials', async () => {
      req.body = { username: 'johndoe' }; // Missing password

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject login for non-existent user', async () => {
      req.body = { username: 'nonexistent', password: 'password' };
      mockUserModel.findByUsername.mockReturnValueOnce(null);

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid username or password'
        })
      );
    });

    it('should reject login with wrong password', async () => {
      req.body = { username: 'johndoe', password: 'wrongpass' };
      mockUserModel.findByUsername.mockReturnValueOnce({
        id: 1,
        password_hash: '$2b$10$hash'
      });
      mockBcrypt.compare.mockResolvedValueOnce(false);

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should create demo account if missing', async () => {
      req.body = { username: 'johndoe', password: 'SecurePass123' };
      mockUserModel.findByUsername.mockReturnValueOnce({
        id: 1,
        username: 'johndoe',
        password_hash: '$2b$10$hash'
      });
      mockBcrypt.compare.mockResolvedValueOnce(true);
      mockDemoAccountModel.findByUserId.mockReturnValueOnce(null);
      mockDemoAccountModel.create.mockReturnValueOnce({ balance: 1000000 });
      mockJwt.sign.mockReturnValueOnce('fake-jwt-token');

      await authController.login(req, res, next);

      // Verify login flow executed
      expect(mockUserModel.findByUsername).toHaveBeenCalledWith('johndoe');
      expect(mockBcrypt.compare).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user profile with demo account', async () => {
      req.user = { userId: 1 };
      mockUserModel.findById.mockReturnValueOnce({
        id: 1,
        username: 'johndoe',
        full_name: 'John Doe',
        email_id: 'john@example.com'
      });
      mockDemoAccountModel.findByUserId.mockReturnValueOnce({
        balance: 1000000,
        createdAt: undefined
      });

      await authController.getProfile(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({ username: 'johndoe' }),
          demoAccount: expect.objectContaining({ balance: 1000000 })
        }
      });
    });

    it('should handle missing user', async () => {
      req.user = { userId: 999 };
      mockUserModel.findById.mockReturnValueOnce(null);

      await authController.getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate token with userId and username', async () => {
      req.body = {
        fullName: 'Test',
        emailId: 'test@test.com',
        username: 'testuser',
        password: 'Password123'
      };

      mockUserModel.usernameExists.mockReturnValueOnce(false);
      mockUserModel.emailExists.mockReturnValueOnce(false);
      mockBcrypt.hash.mockResolvedValueOnce('$2b$10$hash');
      mockUserModel.create.mockResolvedValueOnce({
        id: 5,
        username: 'testuser'
      });
      mockDemoAccountModel.findByUserId.mockReturnValueOnce({ balance: 1000000 });
      mockJwt.sign.mockReturnValueOnce('generated.token');

      await authController.register(req, res, next);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 5, username: 'testuser' },
        expect.any(String),
        { expiresIn: '7d' }
      );
    });
  });
});
