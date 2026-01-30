import { v4 as uuidv4 } from 'uuid';
import logger from '../services/logger.service.js';

export const requestLogger = (req, res, next) => {
    // Generate unique request ID
    const requestId = uuidv4();
    req.requestId = requestId;

    // Attach request ID to response headers for debugging
    res.setHeader('X-Request-ID', requestId);

    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    // Log Request Start
    logger.info(`Incoming Request: ${method} ${originalUrl}`, {
        requestId,
        method,
        url: originalUrl,
        ip,
        userAgent,
        type: 'REQUEST_START',
    });

    // Hook into response finish to log completion
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const { statusCode } = res;

        const logLevel = statusCode >= 400 ? 'warn' : 'info';
        const logMessage = `Request Completed: ${method} ${originalUrl} ${statusCode} ${duration}ms`;

        // If it's a 500 server error, we might logging it as 'error' elsewhere (errorHandler), 
        // but here we log the request summary.

        logger.log({
            level: logLevel,
            message: logMessage,
            requestId,
            method,
            url: originalUrl,
            statusCode,
            duration,
            type: 'REQUEST_END',
        });
    });

    next();
};
