import { notificationModel } from '../models/notification.model.js';
import logger from '../services/logger.service.js';

export const notificationController = {
    /**
     * Get unread notifications for the authenticated user
     */
    async getNotifications(req, res) {
        try {
            // Disable caching to ensure real-time updates
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            res.set('Surrogate-Control', 'no-store');

            // Fix: Token payload uses 'userId', not 'id'
            const userId = req.user.userId;

            logger.info(`[NotificationController] Fetching unread for user ${userId}`);

            const notifications = await notificationModel.getUnread(userId);
            logger.info(`[NotificationController] Found ${notifications.length} unread notifications`);

            res.json({
                success: true,
                count: notifications.length,
                data: notifications
            });
        } catch (error) {
            logger.error(`[Notification Controller] getNotifications error: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications'
            });
        }
    },

    /**
     * Mark a notification as read
     */
    async markAsRead(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ success: false, message: 'Notification ID is required' });
            }

            await notificationModel.markAsRead(id, userId);

            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error) {
            logger.error(`[Notification Controller] markAsRead error: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Failed to update notification'
            });
        }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.userId;
            await notificationModel.markAllAsRead(userId);

            res.json({
                success: true,
                message: 'All notifications marked as read'
            });
        } catch (error) {
            logger.error(`[Notification Controller] markAllAsRead error: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Failed to update notifications'
            });
        }
    }
};
