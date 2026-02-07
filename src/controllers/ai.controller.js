import { ollamaService } from '../services/ollama.service.js';
import logger from '../services/logger.service.js';
import settingsService from '../services/settings.service.js';

/**
 * AI Controller - Handles AI chat requests
 */
export const aiController = {
    /**
     * POST /api/ai/chat
     * Send a message to the AI assistant
     */
    async chat(req, res) {
        try {
            const { message, history = [] } = req.body;

            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Message is required'
                });
            }

            // Limit message length for safety
            if (message.length > 2000) {
                return res.status(400).json({
                    success: false,
                    error: 'Message too long (max 2000 characters)'
                });
            }

            // Limit history length
            const trimmedHistory = history.slice(-10); // Keep last 10 messages

            logger.info(`[AI Controller] Chat request from user ${req.user?.id}`);

            const response = await ollamaService.chat(message.trim(), trimmedHistory);

            return res.json({
                success: true,
                data: {
                    response: response,
                    model: ollamaService.getConfig().model
                }
            });

        } catch (error) {
            logger.error(`[AI Controller] Chat error: ${error.message}`);

            // Return user-friendly error
            return res.status(503).json({
                success: false,
                error: 'AI assistant is temporarily unavailable. Please try again later.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    /**
     * GET /api/ai/status
     * Check AI service availability
     */
    async status(req, res) {
        try {
            const isConnected = await ollamaService.checkConnection();
            const config = ollamaService.getConfig();

            const isEnabled = await settingsService.isAiEnabled();

            return res.json({
                success: true,
                data: {
                    available: isConnected,
                    enabled: isEnabled,
                    model: config.model,
                    endpoint: process.env.NODE_ENV === 'development' ? config.endpoint : undefined
                }
            });

        } catch (error) {
            logger.error(`[AI Controller] Status check error: ${error.message}`);
            return res.json({
                success: true,
                data: {
                    available: false
                }
            });
        }
    }
};
