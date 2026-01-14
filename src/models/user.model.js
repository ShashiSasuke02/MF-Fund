import { query, queryOne, run, getDatabase } from '../db/database.js';
import { saveDatabase } from '../db/database.js';

export const userModel = {
  /**
   * Create a new user with demo account
   */
  async create({ fullName, emailId, username, passwordHash }) {
    try {      // Trim whitespace from inputs
      const trimmedFullName = fullName.trim();
      const trimmedEmailId = emailId.trim();
      const trimmedUsername = username.trim();
            // Insert user
      const userResult = run(
        `INSERT INTO users (full_name, email_id, username, password_hash) 
         VALUES (?, ?, ?, ?)`,
        [trimmedFullName, trimmedEmailId, trimmedUsername, passwordHash]
      );
      
      const userId = userResult.lastInsertRowid;
      
      console.log('[User Model] User creation result:', {
        lastInsertRowid: userId,
        type: typeof userId,
        changes: userResult.changes
      });
      
      // Convert to number and validate
      const userIdNum = Number(userId);
      
      if (isNaN(userIdNum) || userIdNum <= 0) {
        console.error('[User Model] Invalid userId:', {
          original: userId,
          converted: userIdNum,
          fullResult: userResult
        });
        throw new Error(`Failed to create user: Invalid user ID (${userId})`);
      }
      
      console.log('[User Model] Created user with ID:', userIdNum);
      
      // Create demo account with ₹10,00,000 starting balance
      const demoResult = run(
        `INSERT INTO demo_accounts (user_id, balance) VALUES (?, ?)`,
        [userIdNum, 1000000.00]
      );
      
      console.log('[User Model] Created demo account for user:', userIdNum, 'result:', demoResult);
      
      // Save database
      saveDatabase();
      
      return {
        id: userIdNum,
        fullName,
        emailId,
        username
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Find user by username
   */
  findByUsername(username) {
    return queryOne(
      `SELECT id, full_name, email_id, username, password_hash, created_at 
       FROM users WHERE username = ?`,
      [username]
    );
  },

  /**
   * Find user by email
   */
  findByEmail(emailId) {
    return queryOne(
      `SELECT id, full_name, email_id, username, password_hash, created_at 
       FROM users WHERE email_id = ?`,
      [emailId]
    );
  },

  /**
   * Find user by ID
   */
  findById(id) {
    if (!id || id <= 0) {
      return null;
    }
    return queryOne(
      `SELECT id, full_name, email_id, username, created_at 
       FROM users WHERE id = ?`,
      [id]
    );
  },

  /**
   * Check if username exists
   */
  usernameExists(username) {
    const result = queryOne(
      `SELECT COUNT(*) as count FROM users WHERE username = ?`,
      [username]
    );
    return result ? result.count > 0 : false;
  },

  /**
   * Check if email exists
   */
  emailExists(emailId) {
    const result = queryOne(
      `SELECT COUNT(*) as count FROM users WHERE email_id = ?`,
      [emailId]
    );
    return result ? result.count > 0 : false;
  }
};
