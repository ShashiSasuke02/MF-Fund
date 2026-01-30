import axios from 'axios';

const LOG_LEVELS = {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
};

// In development, we might not want to spam the server, 
// but for this implementation we'll allow errors to go through.
const isProd = import.meta.env.MODE === 'production';

class FrontendLogger {
    constructor() {
        this.apiClient = axios.create({
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
            // No auth headers needed for public log ingestion usually, 
            // but if we needed them we'd get them from localStorage or context
        });
    }

    async log(level, message, meta = {}) {
        // Always log to console in dev, or if it's an error
        if (!isProd || level === LOG_LEVELS.ERROR) {
            const consoleMethod = level === LOG_LEVELS.ERROR ? console.error : level === LOG_LEVELS.WARN ? console.warn : console.log;
            consoleMethod(`[${level.toUpperCase()}] ${message}`, meta);
        }

        // Send to backend if critical or forced
        if (level === LOG_LEVELS.ERROR) {
            try {
                await this.apiClient.post('/logs/client', {
                    level,
                    message,
                    ...meta,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                });
            } catch (err) {
                // Fallback: Don't cause an infinite loop if logging fails
                console.error('Failed to send log to backend:', err);
            }
        }
    }

    info(message, meta) {
        this.log(LOG_LEVELS.INFO, message, meta);
    }

    warn(message, meta) {
        this.log(LOG_LEVELS.WARN, message, meta);
    }

    error(message, errorOrMeta) {
        let meta = {};
        if (errorOrMeta instanceof Error) {
            meta = {
                stack: errorOrMeta.stack,
                name: errorOrMeta.name,
            };
        } else {
            meta = errorOrMeta;
        }
        this.log(LOG_LEVELS.ERROR, message, meta);
    }
}

export const logger = new FrontendLogger();
