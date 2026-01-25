import { query } from '../db/database.js';

export const notificationModel = {
    /**
     * Create a new notification
     */
    async create({ userId, title, message, type = 'INFO' }) {
        const sql = `
      INSERT INTO user_notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `;
        const result = await query(sql, [userId, title, message, type]);
        return result.insertId;
    },

    /**
     * Get unread notifications for a user
     */
    async getUnread(userId) {
        const sql = `
      SELECT * FROM user_notifications
      WHERE user_id = ? AND is_read = FALSE
      ORDER BY created_at DESC
    `;
        return query(sql, [userId]);
    },

    /**
     * Mark a notification as read
     */
    async markAsRead(id, userId) {
        const sql = `
      UPDATE user_notifications
      SET is_read = TRUE
      WHERE id = ? AND user_id = ?
    `;
        return query(sql, [id, userId]);
    },

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId) {
        const sql = `
      UPDATE user_notifications
      SET is_read = TRUE
      WHERE user_id = ? AND is_read = FALSE
    `;
        return query(sql, [userId]);
    }
};
