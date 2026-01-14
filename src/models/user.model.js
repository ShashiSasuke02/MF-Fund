import { query, queryOne, run, getDatabase } from '../db/database.js';
import { saveDatabase } from '../db/database.js';

export const userModel = {
  /**
   * Create a new user with demo account
   */
  async create({ fullName, emailId, username, passwordHash }) {
    try {
      // Insert user
      const userResult = run(
        `INSERT INTO users (full_name, email_id, username, password_hash) 
         VALUES (?, ?, ?, ?)`,
        [fullName, emailId, username, passwordHash]
      );
      
      const userId = userResult.lastInsertRowid;
      
      // Create demo account with ₹10,00,000 starting balance
      // Use INSERT OR IGNORE to handle cases where demo account might already exist
      run(
        `INSERT OR IGNORE INTO demo_accounts (user_id, balance) VALUES (?, ?)`,
        [userId, 1000000.00]
      );
      
      // Save database
      saveDatabase();
      
      return {
        id: userId,
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
