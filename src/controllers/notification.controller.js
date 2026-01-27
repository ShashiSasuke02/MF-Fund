import { notificationModel } from '../models/notification.model.js';

export const notificationController = {
    /**
     * Get unread notifications for the authenticated user
     */
    async getNotifications(req, res) {
        try {
            const userId = req.user.id;
            const notifications = await notificationModel.getUnread(userId);

            res.json({
                success: true,
                count: notifications.length,
                data: notifications
            });
        } catch (error) {
            console.error('[Notification Controller] getNotifications error:', error);
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
            const userId = req.user.id;
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
            console.error('[Notification Controller] markAsRead error:', error);
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
            const userId = req.user.id;
            await notificationModel.markAllAsRead(userId);

            res.json({
                success: true,
                message: 'All notifications marked as read'
            });
        } catch (error) {
            console.error('[Notification Controller] markAllAsRead error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update notifications'
            });
        }
    }
};
