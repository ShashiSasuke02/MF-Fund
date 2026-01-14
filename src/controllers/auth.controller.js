import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/user.model.js';
import { demoAccountModel } from '../models/demoAccount.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export const authController = {
  /**
   * Register new user with demo account
   */
  async register(req, res, next) {
    try {
      const { fullName, emailId, username, password } = req.body;

      // Validate required fields
      if (!fullName || !emailId || !username || !password) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
          errors: {
            fullName: !fullName ? 'Full name is required' : undefined,
            emailId: !emailId ? 'Email is required' : undefined,
            username: !username ? 'Username is required' : undefined,
            password: !password ? 'Password is required' : undefined
          }
        });
      }

      // Validate full name length
      if (fullName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Full name must be at least 2 characters',
          errors: { fullName: 'Full name must be at least 2 characters' }
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
          errors: { emailId: 'Invalid email format' }
        });
      }

      // Validate username format (no spaces, alphanumeric + underscore)
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          success: false,
          message: 'Username must be 3-20 characters (letters, numbers, underscore only)',
          errors: { username: 'Username must be 3-20 characters (letters, numbers, underscore only)' }
        });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters',
          errors: { password: 'Password must be at least 8 characters' }
        });
      }

      // Check if username already exists
      if (userModel.usernameExists(username)) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists',
          errors: { username: 'Username already exists' }
        });
      }

      // Check if email already exists (optional but recommended)
      if (userModel.emailExists(emailId)) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered',
          errors: { emailId: 'Email already registered' }
        });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user with demo account
      const user = await userModel.create({
        fullName: fullName.trim(),
        emailId: emailId.trim().toLowerCase(),
        username: username.trim(),
        passwordHash
      });

      // Get demo account
      const demoAccount = demoAccountModel.findByUserId(user.id);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            emailId: user.emailId,
            username: user.username
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
   * Login user
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required',
          errors: {
            username: !username ? 'Username is required' : undefined,
            password: !password ? 'Password is required' : undefined
          }
        });
      }

      // Find user
      const user = userModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Get demo account (create if doesn't exist)
      let demoAccount = demoAccountModel.findByUserId(user.id);
      
      if (!demoAccount) {
        // Create demo account for existing user
        const { run } = await import('../db/database.js');
        const { saveDatabase } = await import('../db/database.js');
        run(
          `INSERT INTO demo_accounts (user_id, balance) VALUES (?, ?)`,
          [user.id, 1000000.00]
        );
        saveDatabase();
        demoAccount = demoAccountModel.findByUserId(user.id);
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            fullName: user.full_name,
            emailId: user.email_id,
            username: user.username
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
   * Get current user profile
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;

      const user = userModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get demo account (create if doesn't exist)
      let demoAccount = demoAccountModel.findByUserId(userId);
      
      if (!demoAccount) {
        // Create demo account for existing user
        const { run } = await import('../db/database.js');
        const { saveDatabase } = await import('../db/database.js');
        run(
          `INSERT INTO demo_accounts (user_id, balance) VALUES (?, ?)`,
          [userId, 1000000.00]
        );
        saveDatabase();
        demoAccount = demoAccountModel.findByUserId(userId);
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            fullName: user.full_name,
            emailId: user.email_id,
            username: user.username,
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
