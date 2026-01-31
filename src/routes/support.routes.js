import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { emailService } from '../services/email.service.js';
import { userModel } from '../models/user.model.js';

const router = express.Router();

router.post('/report', authenticateToken, async (req, res) => {
    try {
        console.log('[Support] Received report request');
        const { issueType, description } = req.body;

        // Validation
        if (!issueType || !description) {
            return res.status(400).json({
                success: false,
                message: 'Issue type and description are required'
            });
        }

        if (description.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Description must be at least 10 characters'
            });
        }

        // Fetch full user details from DB (Token only has basic info)
        let userName = 'Anonymous User';
        let userEmail = 'no-email@unknown.com';

        try {
            if (req.user && req.user.userId) {
                const user = await userModel.findById(req.user.userId);
                if (user) {
                    userName = user.full_name || user.username || 'User';
                    userEmail = user.email_id || req.user.emailId;
                } else {
                    // Fallback to token cache if DB fetch fails or user weirdly missing
                    userName = req.user.fullName || req.user.username || 'User';
                    userEmail = req.user.emailId || req.user.email_id;
                }
            }
        } catch (dbErr) {
            console.warn('[Support] Failed to fetch user details from DB, using token fallback', dbErr);
            userEmail = req.user.emailId || req.user.email_id || userEmail;
        }

        // Send support ticket email
        const result = await emailService.sendSupportTicket({
            userName,
            userEmail,
            issueType,
            description
        });

        if (result.success) {
            console.log(`[Support] Ticket submitted by ${userName} (${userEmail}): ${issueType}`);
            return res.json({
                success: true,
                message: 'Thank you! Your feedback has been submitted.'
            });
        } else {
            return res.status(500).json({
                success: false,
                message: `Failed to submit ticket: ${result.error || 'Unknown error'}`
            });
        }
    } catch (error) {
        console.error('[Support] Error submitting ticket:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;
