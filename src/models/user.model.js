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
      const userResult = await run(
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
      const demoResult = await run(
        `INSERT INTO demo_accounts (user_id, balance) VALUES (?, ?)`,
        [userIdNum, 1000000.00]
      );
      
      console.log('[User Model] Created demo account for user:', userIdNum, 'result:', demoResult);
      
      // Return with consistent camelCase property names
      return {
        id: userIdNum,
        full_name: trimmedFullName,
        email_id: trimmedEmailId,
        username: trimmedUsername,
        // Also include camelCase versions for convenience
        fullName: trimmedFullName,
        emailId: trimmedEmailId
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Find user by username
   */
  async findByUsername(username) {
    return await queryOne(
      `SELECT id, full_name, email_id, username, password_hash, created_at 
       FROM users WHERE username = ?`,
      [username]
    );
  },

  /**
   * Find user by email
   */
  async findByEmail(emailId) {
    return await queryOne(
      `SELECT id, full_name, email_id, username, password_hash, created_at 
       FROM users WHERE email_id = ?`,
      [emailId]
    );
  },

  /**
   * Find user by ID
   */
  async findById(id) {
    if (!id || id <= 0) {
      return null;
    }
    return await queryOne(
      `SELECT id, full_name, email_id, username, created_at 
       FROM users WHERE id = ?`,
      [id]
    );
  },

  /**
   * Check if username exists
   */
  async usernameExists(username) {
    const result = await queryOne(
      `SELECT COUNT(*) as count FROM users WHERE username = ?`,
      [username]
    );
    return result ? result.count > 0 : false;
  },

  /**
   * Check if email exists
   */
  async emailExists(emailId) {
    const result = await queryOne(
      `SELECT COUNT(*) as count FROM users WHERE email_id = ?`,
      [emailId]
    );
    return result ? result.count > 0 : false;
  }
};
