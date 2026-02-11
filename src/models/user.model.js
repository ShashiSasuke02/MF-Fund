import { query, queryOne, run, getDatabase } from '../db/database.js';
import { saveDatabase } from '../db/database.js';

export const userModel = {
  /**
   * Create a new user with demo account
   * Username column is retained for legacy schema; it mirrors emailId so users don't need a separate handle.
   */
  async create({ fullName, emailId, passwordHash }) {
    try {
      // Trim and normalize inputs
      const trimmedFullName = (fullName || '').trim();
      const trimmedEmailId = (emailId || '').trim().toLowerCase();
      const legacyUsername = trimmedEmailId; // keep schema compatibility without exposing a separate username

      // Insert user
      const userResult = await run(
        `INSERT INTO users (full_name, email_id, username, password_hash) 
         VALUES (?, ?, ?, ?)`,
        [trimmedFullName, trimmedEmailId, legacyUsername, passwordHash]
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

      try {
        // Create demo account with Initial Balance + Ledger Entry
        const { demoAccountModel } = await import('./demoAccount.model.js');
        await demoAccountModel.createDefault(userIdNum);
        console.log('[User Model] Created demo account for user:', userIdNum);
      } catch (demoError) {
        console.error('[User Model] Failed to create demo account:', demoError);
        // We log but don't fail user creation, though this is critical
      }

      // Return with consistent camelCase property names
      return {
        id: userIdNum,
        full_name: trimmedFullName,
        email_id: trimmedEmailId,
        // Also include camelCase versions for convenience
        fullName: trimmedFullName,
        emailId: trimmedEmailId
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Legacy alias maintained for backward compatibility with older callers
  async findByUsername(identifier) {
    return await this.findByEmail(identifier);
  },

  /**
   * Find user by email
   */
  async findByEmail(emailId) {
    const normalized = (emailId || '').trim().toLowerCase();
    return await queryOne(
      `SELECT id, full_name, email_id, username, password_hash, role, created_at 
       FROM users WHERE LOWER(email_id) = ?`,
      [normalized]
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
      `SELECT id, full_name, email_id, username, role, created_at 
       FROM users WHERE id = ?`,
      [id]
    );
  },

  // Legacy alias maintained for backward compatibility with older callers
  async usernameExists(identifier) {
    return this.emailExists(identifier);
  },

  /**
   * Check if email exists
   */
  async emailExists(emailId) {
    const normalized = (emailId || '').trim().toLowerCase();
    const result = await queryOne(
      `SELECT COUNT(*) as count FROM users WHERE LOWER(email_id) = ?`,
      [normalized]
    );
    return result ? result.count > 0 : false;
  },

  /**
   * Update password for a user
   */
  async updatePassword(userId, passwordHash) {
    if (!userId || !passwordHash) return false;

    const result = await run(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
      [passwordHash, Date.now(), userId]
    );
    return result.changes > 0;
  }
};
