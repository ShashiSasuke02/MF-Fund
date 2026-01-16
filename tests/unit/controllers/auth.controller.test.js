/**
 * Unit Tests for Authentication Controller
 * Tests registration, login, profile retrieval, and JWT operations
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
const mockUserModel = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
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
      password: 'SecurePass123'
    };

    it('should register new user successfully', async () => {
      req.body = validRegisterData;
      
      mockUserModel.emailExists.mockReturnValueOnce(false);
      mockBcrypt.hash.mockResolvedValueOnce('$2b$10$hashedpassword');
      mockUserModel.create.mockResolvedValueOnce({
        id: 1,
        fullName: 'John Doe',
        emailId: 'john@example.com'
      });
      mockDemoAccountModel.findByUserId.mockReturnValueOnce({
        balance: 10000000.00
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
            emailId: 'john@example.com'
          }),
          demoAccount: expect.objectContaining({
            balance: 10000000.00
          }),
          token: 'jwt.token.here'
        }
      });
    });

    it('should reject registration with missing fields', async () => {
      req.body = { emailId: 'john@example.com' }; // Missing other fields

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'All fields are required'
        })
      );
    });

    it('should reject duplicate email', async () => {
      req.body = validRegisterData;
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
      mockUserModel.emailExists.mockReturnValueOnce(false);
      mockBcrypt.hash.mockResolvedValueOnce('$2b$10$hash');
      mockUserModel.create.mockResolvedValueOnce({ id: 1 });
      mockDemoAccountModel.findByUserId.mockReturnValueOnce({ balance: 10000000 });
      mockJwt.sign.mockReturnValueOnce('token');

      await authController.register(req, res, next);

      expect(mockBcrypt.hash).toHaveBeenCalledWith('SecurePass123', 10);
    });

    it('should normalize email to lowercase', async () => {
      req.body = { ...validRegisterData, emailId: 'John@EXAMPLE.COM' };
      mockUserModel.emailExists.mockReturnValueOnce(false);
      mockBcrypt.hash.mockResolvedValueOnce('$2b$10$hash');
      mockUserModel.create.mockResolvedValueOnce({ id: 1 });
      mockDemoAccountModel.findByUserId.mockReturnValueOnce({ balance: 10000000 });
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
      req.body = { emailId: 'john@example.com', password: 'SecurePass123' };

      mockUserModel.findByEmail.mockReturnValueOnce({
        id: 1,
        password_hash: '$2b$10$hash',
        full_name: 'John Doe',
        email_id: 'john@example.com'
      });
      mockBcrypt.compare.mockResolvedValueOnce(true);
      mockDemoAccountModel.findByUserId.mockReturnValueOnce({
        balance: 950000.0
      });
      mockJwt.sign.mockReturnValueOnce('jwt.token');

      await authController.login(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: expect.objectContaining({ id: 1, emailId: 'john@example.com', fullName: 'John Doe' }),
          demoAccount: expect.objectContaining({ balance: 950000.0 }),
          token: 'jwt.token',
          portfolio: null // Portfolio fetch failed in test (no mfapi service mocked)
        }
      });
    });

    it('should reject login with missing credentials', async () => {
      req.body = { emailId: '' }; // Missing password

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject login for non-existent user', async () => {
      req.body = { emailId: 'missing@example.com', password: 'password' };
      mockUserModel.findByEmail.mockReturnValueOnce(null);

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid email or password'
        })
      );
    });

    it('should reject login with wrong password', async () => {
      req.body = { emailId: 'john@example.com', password: 'wrongpass' };
      mockUserModel.findByEmail.mockReturnValueOnce({
        id: 1,
        password_hash: '$2b$10$hash'
      });
      mockBcrypt.compare.mockResolvedValueOnce(false);

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getProfile', () => {
    it('should return user profile with demo account', async () => {
      req.user = { userId: 1 };
      mockUserModel.findById.mockReturnValueOnce({
        id: 1,
        full_name: 'John Doe',
        email_id: 'john@example.com'
      });
      mockDemoAccountModel.findByUserId.mockReturnValueOnce({
        balance: 10000000,
        createdAt: undefined
      });

      await authController.getProfile(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({ emailId: 'john@example.com' }),
          demoAccount: expect.objectContaining({ balance: 10000000 })
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
    it('should generate token with userId and email', async () => {
      req.body = {
        fullName: 'Test',
        emailId: 'test@test.com',
        password: 'Password123'
      };

      mockUserModel.emailExists.mockReturnValueOnce(false);
      mockBcrypt.hash.mockResolvedValueOnce('$2b$10$hash');
      mockUserModel.create.mockResolvedValueOnce({
        id: 5,
        email_id: 'test@test.com',
        emailId: 'test@test.com'
      });
      mockDemoAccountModel.findByUserId.mockReturnValueOnce({ balance: 10000000 });
      mockJwt.sign.mockReturnValueOnce('generated.token');

      await authController.register(req, res, next);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 5, emailId: 'test@test.com' },
        expect.any(String),
        { expiresIn: '7d' }
      );
    });
  });
});
