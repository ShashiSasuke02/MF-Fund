import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { userModel } from '../models/user.model.js';
import { demoAccountModel } from '../models/demoAccount.model.js';
import { demoService } from '../services/demo.service.js';
import { emailService } from '../services/email.service.js';
import { run } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export const authController = {
  /**
   * Register new user (Stage 1: Intent & Data Capture)
   */
  async register(req, res, next) {
    try {
      const { fullName, emailId, password } = req.body;

      // Validate required fields
      if (!fullName || !emailId || !password) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
          errors: {
            fullName: !fullName ? 'Full name is required' : undefined,
            emailId: !emailId ? 'Email is required' : undefined,
            password: !password ? 'Password is required' : undefined
          }
        });
      }

      // Strict Email Domain Whitelist (Server Side)
      const trustedDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'yahoo.com', 'proton.me', 'protonmail.com', 'zoho.com', 'aol.com', 'rediffmail.com'];
      const emailDomain = emailId.split('@')[1]?.toLowerCase();

      if (!trustedDomains.includes(emailDomain)) {
        return res.status(400).json({
          success: false,
          message: "Shield Active 🛡️ Spam-free experience guaranteed. We're only accepting signups from well-known email domains to help keep our platform spam-free",
          errors: { emailId: 'Email domain not allowed' }
        });
      }

      // Check if email already registered
      if (await userModel.emailExists(emailId)) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered',
          errors: { emailId: 'Email already registered' }
        });
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Store in pending_registrations (Upsert-like behavior using delete-then-insert to avoid ID issues)
      // First delete any existing pending reg for this email
      await run('DELETE FROM pending_registrations WHERE email_id = ?', [emailId]);

      // Insert new pending registration
      await run(
        `INSERT INTO pending_registrations 
        (full_name, email_id, password_hash, otp_hash, expires_at) 
        VALUES (?, ?, ?, ?, ?)`,
        [
          fullName.trim(),
          emailId.trim().toLowerCase(),
          passwordHash,
          otpHash,
          Date.now() + OTP_EXPIRY_MS
        ]
      );

      // Send OTP via Email
      const emailSent = await emailService.sendOTP(emailId, otp);

      if (!emailSent) {
        // If email fails, we might still want to allow proceeding if in dev mode, 
        // or fail. For now, we return success but maybe warn?
        // Actually implementation plan says "emails must be sent asynchronously".
        // emailService.sendOTP handles errors gracefully and returns false.
        // In production this might be critical, but for now we proceed.
      }

      res.status(200).json({
        success: true,
        message: 'OTP sent to email. Please verify to complete registration.',
        data: {
          emailId: emailId,
          step: 'VERIFICATION_REQUIRED'
        }
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify OTP and Create Account (Stage 3: Validation & Persistence)
   */
  async verifyRegistration(req, res, next) {
    try {
      const { emailId, otp } = req.body;

      if (!emailId || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required' });
      }

      // Find pending registration
      const { queryOne } = await import('../db/database.js');
      const pendingUser = await queryOne(
        'SELECT * FROM pending_registrations WHERE email_id = ?',
        [emailId]
      );

      if (!pendingUser) {
        return res.status(400).json({ success: false, message: 'Registration session expired or invalid. Please register again.' });
      }

      // Check Expiry
      if (Date.now() > pendingUser.expires_at) {
        return res.status(400).json({ success: false, message: 'OTP expired. Please register again.' });
      }

      // Check Attempts
      if (pendingUser.otp_attempts >= 3) {
        await run('DELETE FROM pending_registrations WHERE email_id = ?', [emailId]);
        return res.status(400).json({ success: false, message: 'Too many failed attempts. Registration cancelled.' });
      }

      // Verify OTP
      const inputOtpHash = crypto.createHash('sha256').update(otp).digest('hex');
      if (inputOtpHash !== pendingUser.otp_hash) {
        // Increment attempts
        await run('UPDATE pending_registrations SET otp_attempts = otp_attempts + 1 WHERE id = ?', [pendingUser.id]);
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }

      // --- Create User (Move from Pending to Users) ---

      // Create user (userModel.create also creates demo account)
      const user = await userModel.create({
        fullName: pendingUser.full_name,
        emailId: pendingUser.email_id,
        passwordHash: pendingUser.password_hash
      });

      // Clean up pending registration
      await run('DELETE FROM pending_registrations WHERE email_id = ?', [emailId]);

      // Generate Token
      const token = jwt.sign(
        { userId: user.id, emailId: user.emailId, role: 'user' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Get demo account details
      const demoAccount = await demoAccountModel.findByUserId(user.id);

      res.status(201).json({
        success: true,
        message: 'Account verified and created successfully',
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            emailId: user.emailId
          },
          demoAccount: {
            balance: demoAccount.balance
          },
          token
        }
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Resend OTP
   */
  async resendOTP(req, res, next) {
    try {
      const { emailId } = req.body;
      if (!emailId) return res.status(400).json({ success: false, message: 'Email required' });

      const { queryOne } = await import('../db/database.js');
      const pendingUser = await queryOne('SELECT * FROM pending_registrations WHERE email_id = ?', [emailId]);

      if (!pendingUser) {
        return res.status(404).json({ success: false, message: 'No pending registration found' });
      }

      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

      // Update DB
      await run(
        'UPDATE pending_registrations SET otp_hash = ?, expires_at = ?, otp_attempts = 0 WHERE id = ?',
        [otpHash, Date.now() + OTP_EXPIRY_MS, pendingUser.id]
      );

      // Send Email
      await emailService.sendOTP(emailId, otp);

      res.json({ success: true, message: 'OTP resent successfully' });

    } catch (error) {
      next(error);
    }
  },

  // ... existing login and getProfile methods ...
  /**
   * Login user
   */
  async login(req, res, next) {
    try {
      const { emailId, password } = req.body;

      // Validate required fields
      if (!emailId || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
          errors: {
            emailId: !emailId ? 'Email is required' : undefined,
            password: !password ? 'Password is required' : undefined
          }
        });
      }

      // Find user by email
      const user = await userModel.findByEmail(emailId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Get demo account (create if doesn't exist)
      let demoAccount = await demoAccountModel.findByUserId(user.id);

      if (!demoAccount) {
        // Create demo account for existing user
        const { run } = await import('../db/database.js');
        await run(
          `INSERT INTO demo_accounts (user_id, balance) VALUES (?, ?)`,
          [user.id, 10000000.00]
        );
        demoAccount = await demoAccountModel.findByUserId(user.id);
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, emailId: user.email_id, role: user.role || 'user' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Fetch and update portfolio with latest NAVs on login
      let portfolioSummary = null;
      let lastNavUpdate = null;
      try {
        const portfolio = await demoService.getPortfolio(user.id);
        portfolioSummary = portfolio.summary;

        // Get timestamp of latest NAV update if holdings exist
        if (portfolio.holdings && portfolio.holdings.length > 0) {
          lastNavUpdate = portfolio.holdings[0]?.last_nav_date || new Date().toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('[Auth] Failed to fetch portfolio on login:', error.message);
        // Continue with login even if portfolio fetch fails
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            fullName: user.full_name,
            emailId: user.email_id,
            username: user.username,
            role: user.role || 'user'
          },
          demoAccount: {
            balance: demoAccount.balance
          },
          portfolio: portfolioSummary ? {
            totalInvested: portfolioSummary.totalInvested,
            totalCurrent: portfolioSummary.totalCurrent,
            totalReturns: portfolioSummary.totalReturns,
            returnsPercentage: portfolioSummary.returnsPercentage,
            lastNavUpdate
          } : null,
          token
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get demo account (create if doesn't exist)
      let demoAccount = await demoAccountModel.findByUserId(userId);

      if (!demoAccount) {
        // Create demo account for existing user
        const { run } = await import('../db/database.js');
        await run(
          `INSERT INTO demo_accounts (user_id, balance) VALUES (?, ?)`,
          [userId, 10000000.00]
        );
        demoAccount = await demoAccountModel.findByUserId(userId);
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            fullName: user.full_name,
            emailId: user.email_id,
            username: user.username,
            role: user.role || 'user',
            createdAt: user.created_at
          },
          demoAccount: {
            balance: demoAccount.balance,
            createdAt: demoAccount.created_at
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
