/**
 * Unit Tests for Authentication Controller
 * Tests registration, login, profile retrieval, and JWT operations
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import AppError from '../../../src/utils/errors/AppError.js';

// Define mock handles
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

const mockDemoService = {
  getPortfolio: jest.fn()
};

const mockEmailService = {
  sendOTP: jest.fn()
};

const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn()
};

const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn()
};

const mockRun = jest.fn();
const mockQueryOne = jest.fn();

// Native ESM Mocking
jest.unstable_mockModule('../../../src/models/user.model.js', () => ({
  userModel: mockUserModel
}));

jest.unstable_mockModule('../../../src/models/demoAccount.model.js', () => ({
  demoAccountModel: mockDemoAccountModel
}));

jest.unstable_mockModule('../../../src/services/demo.service.js', () => ({
  demoService: mockDemoService
}));

jest.unstable_mockModule('../../../src/services/email.service.js', () => ({
  emailService: mockEmailService
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: mockBcrypt,
  hash: mockBcrypt.hash,
  compare: mockBcrypt.compare
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: mockJwt,
  sign: mockJwt.sign,
  verify: mockJwt.verify
}));

jest.unstable_mockModule('../../../src/db/database.js', () => ({
  run: mockRun,
  queryOne: mockQueryOne,
  query: jest.fn(),
  saveDatabase: jest.fn(),
  getDatabase: jest.fn(),
  initializeDatabase: jest.fn(),
  closeDatabase: jest.fn(),
  escape: jest.fn(val => val),
  default: {
    run: mockRun,
    queryOne: mockQueryOne,
    query: jest.fn(),
    saveDatabase: jest.fn()
  }
}));

// Import service after mocks
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
      emailId: 'john@gmail.com', // Use whitelisted domain
      password: 'SecurePass123'
    };

    it('should register intent and send OTP', async () => {
      req.body = validRegisterData;
      mockUserModel.emailExists.mockResolvedValueOnce(false);
      mockBcrypt.hash.mockResolvedValueOnce('$2b$10$hashedpassword');
      mockEmailService.sendOTP.mockResolvedValueOnce(true);

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            step: 'VERIFICATION_REQUIRED'
          })
        })
      );
      expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO pending_registrations'), expect.any(Array));
    });

    it('should reject non-whitelisted email domains', async () => {
      req.body = { ...validRegisterData, emailId: 'john@fake.com' };

      // Expect AppError to be passed to next
      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.errorCode).toBe('VAL_DOMAIN_ERROR');
      expect(error.statusCode).toBe(400);
    });

    it('should reject registration with missing fields', async () => {
      req.body = { emailId: 'john@gmail.com' };

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('All fields are required');
      expect(error.statusCode).toBe(400);
    });

    it('should reject duplicate email', async () => {
      req.body = validRegisterData;
      mockUserModel.emailExists.mockResolvedValueOnce(true);

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Email already registered');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('verifyRegistration', () => {
    it('should verify OTP and create user account', async () => {
      req.body = { emailId: 'john@gmail.com', otp: '123456' };

      mockQueryOne.mockResolvedValueOnce({
        id: 1,
        full_name: 'John Doe',
        email_id: 'john@gmail.com',
        password_hash: '$2b$10$hash',
        otp_hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', // hash of '123456'
        expires_at: Date.now() + 100000
      });

      mockUserModel.create.mockResolvedValueOnce({
        id: 1,
        fullName: 'John Doe',
        emailId: 'john@gmail.com'
      });

      mockDemoAccountModel.findByUserId.mockResolvedValueOnce({ balance: 10000000 });
      mockJwt.sign.mockReturnValueOnce('jwt.token.here');

      await authController.verifyRegistration(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockUserModel.create).toHaveBeenCalled();
      expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM pending_registrations'), expect.any(Array));
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      req.body = { emailId: 'john@gmail.com', password: 'SecurePass123' };

      mockUserModel.findByEmail.mockResolvedValueOnce({
        id: 1,
        password_hash: '$2b$10$hash',
        full_name: 'John Doe',
        email_id: 'john@gmail.com'
      });
      mockBcrypt.compare.mockResolvedValueOnce(true);
      mockDemoAccountModel.findByUserId.mockResolvedValueOnce({
        balance: 950000.0
      });
      mockDemoService.getPortfolio.mockResolvedValueOnce({
        summary: { totalInvested: 1000, totalCurrent: 1100, totalReturns: 100, returnsPercentage: 10 }
      });
      mockJwt.sign.mockReturnValueOnce('jwt.token');

      await authController.login(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            token: 'jwt.token'
          })
        })
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile with demo account', async () => {
      req.user = { userId: 1 };
      mockUserModel.findById.mockResolvedValueOnce({
        id: 1,
        full_name: 'John Doe',
        email_id: 'john@gmail.com',
        created_at: '2026-01-01'
      });
      mockDemoAccountModel.findByUserId.mockResolvedValueOnce({
        balance: 10000000,
        created_at: '2026-01-01'
      });

      await authController.getProfile(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({ emailId: 'john@gmail.com' }),
            demoAccount: expect.objectContaining({ balance: 10000000 })
          })
        })
      );
    });
  });
});
